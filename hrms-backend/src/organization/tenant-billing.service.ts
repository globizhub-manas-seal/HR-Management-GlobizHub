import {
  BadRequestException,
  ConflictException,
  Injectable,
  Logger,
  ServiceUnavailableException,
} from '@nestjs/common';
import * as crypto from 'crypto';
import { PrismaService } from '../prisma/prisma.service';
import { PlatformSettingsService } from '../platform/settings/platform-settings.service';
import { RazorpayService } from '../platform/billing/razorpay.service';
import { PlatformBillingService } from '../platform/billing/platform-billing.service';
import { SubscriptionGuard } from '../platform/subscriptions/guards/subscription.guard';

/**
 * Tenant self-service billing: real per-user metered checkout with Razorpay.
 *
 * SECURITY MODEL (no client-side bypass possible):
 *  - The client never sends an amount. The server reads SystemConfig
 *    (pricePerUserPerMonth) and the live employee count, computes the invoice,
 *    and creates the Razorpay order itself.
 *  - Checkout success requires HMAC-SHA256(order_id|payment_id, KEY_SECRET)
 *    verification server-side, plus a direct Razorpay payment fetch to
 *    confirm the captured amount (defense in depth).
 *  - Sandbox simulation (SANDBOX_PAYMENTS=true, non-production only) still
 *    goes through the same HMAC verification path — it merely lets the demo
 *    complete without live gateway keys.
 */
@Injectable()
export class TenantBillingService {
  private readonly logger = new Logger(TenantBillingService.name);

  constructor(
    private prisma: PrismaService,
    private settings: PlatformSettingsService,
    private razorpay: RazorpayService,
    private platformBilling: PlatformBillingService,
    private subGuard: SubscriptionGuard,
  ) {}

  /**
   * Is the sandbox payment simulator active? (non-production only)
   */
  isSandboxPayments(): boolean {
    return (
      process.env.SANDBOX_PAYMENTS === 'true' &&
      process.env.NODE_ENV !== 'production'
    );
  }

  /**
   * Compute the current metered amount for a company (server-side truth).
   */
  async quote(companyId: string) {
    const config = await this.settings.getConfig();
    const [activeUsers, subscription] = await Promise.all([
      this.prisma.employee.count({ where: { companyId, exitRecord: null } }),
      this.prisma.subscription.findUnique({ where: { companyId } }),
    ]);
    const billable = Math.max(config.minUsersPerInvoice, activeUsers);
    const amount = billable * config.pricePerUserPerMonth;
    return {
      activeUsers,
      billableUsers: billable,
      perUserPrice: config.pricePerUserPerMonth,
      amount,
      currency: config.currency,
      gstPercent: config.gstPercent,
      isFreemium: subscription
        ? subscription.planId
          ? (await this.prisma.platformPlan.findUnique({ where: { id: subscription.planId } }))?.code === 'PLAN_FREE'
          : false
        : true,
    };
  }

  /**
   * Create (or reuse) the payable invoice for the current period and open a
   * Razorpay order. Activates the paid plan immediately with the invoice due
   * in invoiceDueDays (grace behaviour handled by the lifecycle cron).
   */
  async checkout(
    companyId: string,
    dto: { couponCode?: string },
    actor: { id: string; email: string },
  ) {
    const config = await this.settings.getConfig();

    // Company must exist (AuthGuard guarantees session company)
    const company = await this.prisma.company.findUnique({
      where: { id: companyId },
    });
    if (!company) throw new BadRequestException('Company not found');

    // Resolve or bootstrap the subscription row
    let subscription = await this.prisma.subscription.findUnique({
      where: { companyId },
    });
    if (!subscription) {
      const freePlan = await this.prisma.platformPlan.findFirst({
        where: { code: 'PLAN_FREE' },
      });
      if (!freePlan) {
        throw new ServiceUnavailableException(
          'Billing plans are not provisioned yet. Contact platform support.',
        );
      }
      subscription = await this.prisma.subscription.create({
        data: {
          companyId,
          planId: freePlan.id,
          billingCycle: 'MONTHLY',
          status: 'ACTIVE',
          currentPeriodEnd: new Date(Date.now() + 30 * 86400000),
        },
      });
    }

    // Already on a paid contract with a valid period and no pending invoice?
    const paidPlan =
      subscription.planId &&
      (await this.prisma.platformPlan.findUnique({
        where: { id: subscription.planId },
      }))?.code !== 'PLAN_FREE';
    if (
      paidPlan &&
      subscription.status === 'ACTIVE' &&
      subscription.contractEndsAt &&
      subscription.contractEndsAt > new Date()
    ) {
      const pendingInvoice = await this.prisma.invoice.findFirst({
        where: { companyId, status: 'ISSUED' },
        orderBy: { createdAt: 'desc' },
      });
      if (!pendingInvoice) {
        throw new ConflictException(
          `Your subscription is already active until ${subscription.contractEndsAt.toDateString()}.`,
        );
      }
      return this.buildCheckoutResponse(pendingInvoice, null);
    }

    // Server-side amount computation
    const quote = await this.quote(companyId);
    let amount = quote.amount;
    let couponCode: string | null = null;

    if (dto.couponCode && dto.couponCode.trim()) {
      const validated = await this.platformBilling.validateCoupon(
        dto.couponCode,
        amount,
      );
      amount = validated.finalAmount;
      couponCode = validated.code;
    }

    if (amount <= 0) {
      throw new BadRequestException('Computed amount must be greater than zero');
    }

    // Reuse an open invoice for the current period if one exists (payment retry)
    const monthStart = new Date(
      new Date().getFullYear(),
      new Date().getMonth(),
      1,
    );
    const monthEnd = new Date(
      new Date().getFullYear(),
      new Date().getMonth() + 1,
      0,
      23,
      59,
      59,
    );
    let invoice = await this.prisma.invoice.findFirst({
      where: {
        companyId,
        status: 'ISSUED',
        periodStart: { gte: monthStart, lte: monthEnd },
      },
      orderBy: { createdAt: 'desc' },
    });

    if (invoice) {
      invoice = await this.prisma.invoice.update({
        where: { id: invoice.id },
        data: {
          amountDue: amount,
          couponCode,
          perUserPrice: config.pricePerUserPerMonth,
          userCount: quote.billableUsers,
          dueDate: new Date(Date.now() + config.invoiceDueDays * 86400000),
        },
      });
    } else {
      const year = new Date().getFullYear();
      const count = await this.prisma.invoice.count();
      invoice = await this.prisma.invoice.create({
        data: {
          invoiceNumber: `${config.invoicePrefix}-${year}-${(count + 1)
            .toString()
            .padStart(5, '0')}`,
          companyId,
          subscriptionId: subscription.id,
          amountDue: amount,
          currency: config.currency,
          status: 'ISSUED',
          dueDate: new Date(Date.now() + config.invoiceDueDays * 86400000),
          couponCode,
          periodStart: monthStart,
          periodEnd: monthEnd,
          perUserPrice: config.pricePerUserPerMonth,
          userCount: quote.billableUsers,
        },
      });
    }

    // Activate the paid plan for the annual contract (metered monthly)
    const paidPlanRow = await this.prisma.platformPlan.findFirst({
      where: { code: 'PLAN_STARTER', isActive: true },
    });
    if (paidPlanRow) {
      await this.prisma.subscription.update({
        where: { id: subscription.id },
        data: {
          planId: paidPlanRow.id,
          billingCycle: 'ANNUAL',
          status: 'ACTIVE',
          contractStartsAt: new Date(),
          contractEndsAt: new Date(Date.now() + 365 * 86400000),
          currentPeriodEnd: monthEnd,
        },
      });
    }

    await this.prisma.platformAuditLog
      .create({
        data: {
          actorEmail: actor.email,
          actorRole: 'SUPER_ADMIN',
          action: 'CHECKOUT_STARTED',
          targetEntity: 'Invoice',
          targetId: invoice.id,
          companyId,
          afterState: {
            invoiceNumber: invoice.invoiceNumber,
            amount,
            couponCode,
            gateway: this.razorpay.isConfigured()
              ? 'RAZORPAY'
              : this.isSandboxPayments()
                ? 'SANDBOX'
                : 'MANUAL',
          } as any,
        },
      })
      .catch(() => {});

    return this.buildCheckoutResponse(invoice, null);
  }

  private async buildCheckoutResponse(invoice: any, order: any) {
    const config = await this.settings.getConfig();
    const sandbox = this.isSandboxPayments();
    // Sandbox simulator takes precedence so dev environments never hit the
    // real gateway; production (no SANDBOX_PAYMENTS) always uses live keys.
    const useRazorpay = this.razorpay.isConfigured() && !sandbox;

    let orderId: string | null = null;
    if (useRazorpay) {
      const created = await this.razorpay.createOrder({
        amountPaise: Math.round(Number(invoice.amountDue) * 100),
        currency: invoice.currency,
        receipt: invoice.invoiceNumber,
        notes: { invoiceId: invoice.id },
      });
      orderId = created.id;
    } else if (sandbox) {
      orderId = `order_sbx_${crypto.randomBytes(10).toString('hex')}`;
    }

    if (orderId) {
      // Track the order as a PENDING payment (idempotency key = order id)
      await this.prisma.payment.upsert({
        where: { idempotencyKey: orderId },
        update: { invoiceId: invoice.id, amount: Number(invoice.amountDue) },
        create: {
          invoiceId: invoice.id,
          amount: Number(invoice.amountDue),
          currency: invoice.currency,
          gateway: useRazorpay ? 'RAZORPAY' : 'RAZORPAY',
          idempotencyKey: orderId,
          status: 'PENDING',
        },
      });
    }

    return {
      invoice: {
        id: invoice.id,
        invoiceNumber: invoice.invoiceNumber,
        amountDue: Number(invoice.amountDue),
        currency: invoice.currency,
        dueDate: invoice.dueDate,
        perUserPrice: invoice.perUserPrice ? Number(invoice.perUserPrice) : null,
        userCount: invoice.userCount,
        couponCode: invoice.couponCode,
        periodStart: invoice.periodStart,
        periodEnd: invoice.periodEnd,
      },
      gateway: {
        mode: useRazorpay ? 'RAZORPAY' : sandbox ? 'SANDBOX' : 'MANUAL',
        orderId,
        keyId: useRazorpay ? this.razorpay.getKeyId() : null,
      },
      config: {
        currency: config.currency,
        pricePerUserPerMonth: config.pricePerUserPerMonth,
        gstPercent: config.gstPercent,
      },
    };
  }

  /**
   * Verify a Razorpay checkout result. Signature verification is mandatory;
   * the captured amount is double-checked against Razorpay when reachable.
   */
  async verifyCheckout(
    companyId: string,
    body: {
      invoiceId: string;
      razorpayOrderId: string;
      razorpayPaymentId: string;
      razorpaySignature: string;
    },
    actor: { id: string; email: string },
  ) {
    const { invoiceId, razorpayOrderId, razorpayPaymentId, razorpaySignature } =
      body;
    if (!invoiceId || !razorpayOrderId || !razorpayPaymentId || !razorpaySignature) {
      throw new BadRequestException(
        'invoiceId, razorpayOrderId, razorpayPaymentId and razorpaySignature are required',
      );
    }

    const invoice = await this.prisma.invoice.findFirst({
      where: { id: invoiceId, companyId },
    });
    if (!invoice) throw new BadRequestException('Invoice not found');

    const payment = await this.prisma.payment.findUnique({
      where: { idempotencyKey: razorpayOrderId },
    });
    if (!payment || payment.invoiceId !== invoiceId) {
      throw new BadRequestException(
        'Unknown order: the checkout order does not match this invoice',
      );
    }

    if (payment.status === 'SUCCEEDED') {
      return { success: true, alreadyProcessed: true, invoiceNumber: invoice.invoiceNumber };
    }

    const sandbox = this.isSandboxPayments() && razorpayOrderId.startsWith('order_sbx_');

    // 1. HMAC verification (mandatory in every mode)
    const signatureValid = this.razorpay.verifyCheckoutSignature(
      razorpayOrderId,
      razorpayPaymentId,
      razorpaySignature,
    );
    if (!signatureValid) {
      await this.prisma.payment
        .update({
          where: { id: payment.id },
          data: { status: 'FAILED', failureReason: 'Checkout signature verification failed' },
        })
        .catch(() => {});
      throw new BadRequestException('Payment signature verification failed');
    }

    // 2. Gateway-side confirmation (skipped only in explicit sandbox mode)
    if (!sandbox) {
      const remote = await this.razorpay.fetchPayment(razorpayPaymentId);
      if (remote) {
        if (remote.status !== 'captured' && remote.status !== 'authorized') {
          throw new BadRequestException(
            `Payment is not captured yet (status: ${remote.status})`,
          );
        }
        const remoteAmount = Number(remote.amount) / 100;
        if (remoteAmount + 0.01 < Number(invoice.amountDue)) {
          throw new BadRequestException(
            'Captured amount is less than the invoice amount',
          );
        }
      }
    }

    // 3. Idempotent settlement
    await this.prisma.payment.update({
      where: { id: payment.id },
      data: {
        status: 'SUCCEEDED',
        gatewayPaymentId: razorpayPaymentId,
        failureReason: null,
      },
    });

    await this.prisma.invoice.update({
      where: { id: invoice.id },
      data: {
        amountPaid: Number(invoice.amountDue),
        status: 'PAID',
        paidAt: new Date(),
      },
    });

    // Restore/activate subscription
    const sub = await this.prisma.subscription.findUnique({
      where: { companyId },
    });
    if (sub && sub.status !== 'ACTIVE') {
      await this.prisma.subscription.update({
        where: { id: sub.id },
        data: { status: 'ACTIVE' },
      });
    }

    // Consume coupon exactly once
    if (invoice.couponCode) {
      await this.prisma.coupon
        .update({
          where: { code: invoice.couponCode },
          data: { usageCount: { increment: 1 } },
        })
        .catch(() => {});
    }

    await this.prisma.platformAuditLog
      .create({
        data: {
          actorEmail: actor.email,
          actorRole: 'SUPER_ADMIN',
          action: 'PAYMENT_VERIFIED',
          targetEntity: 'Payment',
          targetId: payment.id,
          companyId,
          afterState: {
            invoiceNumber: invoice.invoiceNumber,
            amount: Number(invoice.amountDue),
            gatewayPaymentId: razorpayPaymentId,
            orderId: razorpayOrderId,
          } as any,
        },
      })
      .catch(() => {});

    await this.notifyAdmins(companyId, 'Payment received', `Invoice ${invoice.invoiceNumber} for ₹${Number(invoice.amountDue)} has been paid successfully. Thank you!`).catch(() => {});

    // Lift any payment-hold lock immediately
    this.subGuard.invalidate(companyId);

    this.logger.log(
      `Checkout verified for company ${companyId}: invoice ${invoice.invoiceNumber} settled via ${razorpayOrderId}`,
    );

    return { success: true, invoiceNumber: invoice.invoiceNumber };
  }

  /**
   * SANDBOX-ONLY: complete a pending sandbox order through the real
   * verification path (HMAC signature is computed with the configured
   * RAZORPAY_KEY_SECRET and validated by verifyCheckout). Non-production only.
   */
  async simulateSandboxPayment(
    companyId: string,
    invoiceId: string,
    actor: { id: string; email: string },
  ) {
    const invoice = await this.prisma.invoice.findFirst({
      where: { id: invoiceId, companyId },
    });
    if (!invoice) throw new BadRequestException('Invoice not found');

    const order = await this.prisma.payment.findFirst({
      where: { invoiceId, status: 'PENDING', idempotencyKey: { startsWith: 'order_sbx_' } },
    });
    if (!order) {
      throw new BadRequestException(
        'No pending sandbox order found for this invoice. Run checkout first.',
      );
    }

    const paymentId = `pay_sbx_${crypto.randomBytes(8).toString('hex')}`;
    const secret = process.env.RAZORPAY_KEY_SECRET || 'sandbox-dev-secret';
    const signature = crypto
      .createHmac('sha256', secret)
      .update(`${order.idempotencyKey}|${paymentId}`)
      .digest('hex');

    return this.verifyCheckout(
      companyId,
      {
        invoiceId,
        razorpayOrderId: order.idempotencyKey,
        razorpayPaymentId: paymentId,
        razorpaySignature: signature,
      },
      actor,
    );
  }

  private async notifyAdmins(companyId: string, title: string, message: string) {
    const admins = await this.prisma.employee.findMany({
      where: {
        companyId,
        exitRecord: null,
        role: { in: ['OWNER', 'SUPER_ADMIN', 'HR_HEAD'] },
        inviteToken: null,
      },
      select: { id: true },
    });
    if (admins.length === 0) return;
    await this.prisma.notification.createMany({
      data: admins.map((a) => ({
        companyId,
        userId: a.id,
        title,
        message,
        type: 'BILLING',
      })),
    });
  }
}
