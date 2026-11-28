import {
  BadRequestException,
  ConflictException,
  Injectable,
  Logger,
  ServiceUnavailableException,
} from '@nestjs/common';
import * as crypto from 'crypto';
import * as fs from 'fs';
import * as path from 'path';
import { PrismaService } from '../prisma/prisma.service';
import { PlatformSettingsService } from '../platform/settings/platform-settings.service';
import { RazorpayService } from '../platform/billing/razorpay.service';
import { PlatformBillingService } from '../platform/billing/platform-billing.service';
import { SubscriptionGuard } from '../platform/subscriptions/guards/subscription.guard';
import { FREEMIUM_CORE_MODULES } from '../platform/subscriptions/module-registry';
import { computeGst } from '../common/gst';
import { renderTaxInvoicePdf } from '../common/pdf/tax-invoice-pdf';
import { loadLogoBuffer } from '../common/pdf/pdf.util';
import { addMonths } from '../common/time';

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
   * Effective module availability for the tenant's plan — used by the
   * frontend to filter navigation and show upgrade prompts.
   * Order: org overrides > plan entitlements > tier defaults.
   */
  async getCompanyModules(companyId: string) {
    const [subscription, overrides] = await Promise.all([
      this.prisma.subscription.findUnique({
        where: { companyId },
        include: { plan: { include: { entitlements: true } } },
      }),
      this.prisma.organizationFeatureOverride.findMany({
        where: { companyId },
        select: { moduleKey: true, isEnabled: true },
      }),
    ]);

    const plan = subscription?.plan ?? null;
    const isPaidPlan = plan ? Number(plan.monthlyPrice) > 0 : true;
    const overrideMap = new Map(
      overrides.map((o) => [o.moduleKey.toLowerCase(), o.isEnabled]),
    );
    const entitlementMap = new Map<string, boolean>();
    for (const e of plan?.entitlements ?? []) {
      entitlementMap.set(e.moduleKey.toLowerCase(), e.isEnabled);
    }
    const planHasMatrix = entitlementMap.size > 0;

    const freemiumEndsAt = subscription?.freemiumEndsAt ?? null;
    const freemiumActive =
      plan?.code === 'PLAN_FREE' &&
      !!freemiumEndsAt &&
      new Date(freemiumEndsAt) > new Date();

    const allKeys = new Set<string>([
      ...overrideMap.keys(),
      ...entitlementMap.keys(),
      ...FREEMIUM_CORE_MODULES,
      'payroll',
      'recruitment',
      'training',
      'credentials',
      'india',
    ]);

    const modules = [...allKeys]
      .sort()
      .map((key) => {
        let enabled: boolean;
        if (overrideMap.has(key)) {
          enabled = overrideMap.get(key)!;
        } else if (entitlementMap.has(key)) {
          enabled = entitlementMap.get(key)!;
        } else {
          enabled = planHasMatrix
            ? false
            : isPaidPlan || FREEMIUM_CORE_MODULES.has(key);
        }
        return { key, enabled };
      });

    return {
      plan: plan
        ? {
            id: plan.id,
            code: plan.code,
            name: plan.name,
            monthlyPrice: Number(plan.monthlyPrice),
            isPaid: isPaidPlan,
          }
        : null,
      subscriptionStatus: subscription?.status ?? null,
      freemiumEndsAt,
      freemiumActive,
      modules,
    };
  }

  /**
   * Compute the current ANNUAL amount for a company (server-side truth):
   * activeUsers x pricePerUserPerMonth x contractMonths, billed upfront for
   * the whole contract term.
   */
  async quote(companyId: string) {
    const config = await this.settings.getConfig();
    const [activeUsers, subscription, company] = await Promise.all([
      this.prisma.employee.count({ where: { companyId, exitRecord: null } }),
      this.prisma.subscription.findUnique({ where: { companyId } }),
      this.prisma.company.findUnique({
        where: { id: companyId },
        select: { state: true, gstin: true },
      }),
    ]);
    const billable = Math.max(config.minUsersPerInvoice, activeUsers);
    const baseAmount =
      billable * config.pricePerUserPerMonth * config.contractMonths;
    const gst = computeGst(
      baseAmount,
      config.gstPercent,
      company?.state,
      config.sellerState,
      config.gstEnabled,
    );
    const amount = Math.round((baseAmount + gst.taxAmount) * 100) / 100;
    return {
      activeUsers,
      billableUsers: billable,
      perUserPrice: config.pricePerUserPerMonth,
      contractMonths: config.contractMonths,
      baseAmount: Math.round(baseAmount * 100) / 100,
      tax: {
        label: gst.taxLabel,
        rate: gst.taxRate,
        amount: gst.taxAmount,
        cgst: gst.cgstAmount,
        sgst: gst.sgstAmount,
        igst: gst.igstAmount,
        placeOfSupply: gst.placeOfSupply,
      },
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

    // Server-side amount computation (annual: users x perUser x contractMonths)
    // GST (when enabled) is computed on the discounted base; the invoice
    // total = base + tax. Tax snapshot fields are stored on the invoice for
    // the PDF/tax-invoice design.
    const quote = await this.quote(companyId);
    let baseAmount = quote.baseAmount;
    let couponCode: string | null = null;

    if (dto.couponCode && dto.couponCode.trim()) {
      const validated = await this.platformBilling.validateCoupon(
        dto.couponCode,
        baseAmount,
      );
      baseAmount = validated.finalAmount;
      couponCode = validated.code;
    }

    if (baseAmount <= 0) {
      throw new BadRequestException('Computed amount must be greater than zero');
    }

    const gst = computeGst(
      baseAmount,
      config.gstPercent,
      company.state,
      config.sellerState,
      config.gstEnabled,
    );
    const amount = Math.round((baseAmount + gst.taxAmount) * 100) / 100;

    // Contract term for this invoice (annual: now -> now + contractMonths)
    const now = new Date();
    const contractStartsAt = now;
    const contractEndsAt = addMonths(now, config.contractMonths);

    // Reuse an open invoice for the current term if one exists (payment retry)
    let invoice = await this.prisma.invoice.findFirst({
      where: {
        companyId,
        status: 'ISSUED',
        periodStart: contractStartsAt,
        periodEnd: contractEndsAt,
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
          dueDate: new Date(now.getTime() + config.invoiceDueDays * 86400000),
          taxableAmount: gst.taxableAmount,
          taxLabel: gst.taxLabel,
          taxRate: gst.taxRate,
          taxAmount: gst.taxAmount,
          cgstAmount: gst.cgstAmount,
          sgstAmount: gst.sgstAmount,
          igstAmount: gst.igstAmount,
          placeOfSupply: gst.placeOfSupply,
          sellerName: config.sellerLegalName,
          sellerAddress: config.sellerAddress,
          sellerGstin: config.sellerGstin ?? null,
          buyerGstin: company.gstin ?? null,
          sacCode: config.invoiceSacCode,
          notes: config.invoiceNotes ?? null,
        },
      });
    } else {
      const year = now.getFullYear();
      const invoiceNumber = await this.nextInvoiceNumber(
        config.invoicePrefix,
        year,
      );
      invoice = await this.prisma.invoice.create({
        data: {
          invoiceNumber,
          companyId,
          subscriptionId: subscription.id,
          amountDue: amount,
          currency: config.currency,
          status: 'ISSUED',
          dueDate: new Date(now.getTime() + config.invoiceDueDays * 86400000),
          couponCode,
          periodStart: contractStartsAt,
          periodEnd: contractEndsAt,
          perUserPrice: config.pricePerUserPerMonth,
          userCount: quote.billableUsers,
          taxableAmount: gst.taxableAmount,
          taxLabel: gst.taxLabel,
          taxRate: gst.taxRate,
          taxAmount: gst.taxAmount,
          cgstAmount: gst.cgstAmount,
          sgstAmount: gst.sgstAmount,
          igstAmount: gst.igstAmount,
          placeOfSupply: gst.placeOfSupply,
          sellerName: config.sellerLegalName,
          sellerAddress: config.sellerAddress,
          sellerGstin: config.sellerGstin ?? null,
          buyerGstin: company.gstin ?? null,
          sacCode: config.invoiceSacCode,
          notes: config.invoiceNotes ?? null,
        },
      });
    }

    // Activate the paid plan for the annual contract
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
          contractStartsAt,
          contractEndsAt,
          currentPeriodEnd: contractEndsAt,
          freemiumEndsAt: null,
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

  /**
   * Collision-free invoice number: MAX existing sequence for this year + 1
   * (count()-based numbering duplicates after voided/deleted invoices).
   * Retries once on the rare concurrent-creation race.
   */
  private async nextInvoiceNumber(prefix: string, year: number): Promise<string> {
    const padded = (n: number) => String(n).padStart(5, '0');
    for (let attempt = 0; attempt < 3; attempt++) {
      const last = await this.prisma.invoice.findFirst({
        where: { invoiceNumber: { startsWith: `${prefix}-${year}-` } },
        orderBy: { invoiceNumber: 'desc' },
        select: { invoiceNumber: true },
      });
      const lastSeq = last
        ? parseInt(last.invoiceNumber.split('-').pop() ?? '0', 10)
        : 0;
      const candidate = `${prefix}-${year}-${padded(lastSeq + 1)}`;
      const exists = await this.prisma.invoice.findUnique({
        where: { invoiceNumber: candidate },
        select: { id: true },
      });
      if (!exists) return candidate;
    }
    // Last resort: timestamp suffix keeps uniqueness without blocking billing
    return `${prefix}-${year}-${Date.now().toString().slice(-8)}`;
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
      tax: invoice.taxLabel
        ? {
            label: invoice.taxLabel,
            rate: invoice.taxRate ? Number(invoice.taxRate) : 0,
            amount: invoice.taxAmount ? Number(invoice.taxAmount) : 0,
            cgst: invoice.cgstAmount ? Number(invoice.cgstAmount) : 0,
            sgst: invoice.sgstAmount ? Number(invoice.sgstAmount) : 0,
            igst: invoice.igstAmount ? Number(invoice.igstAmount) : 0,
            placeOfSupply: invoice.placeOfSupply,
          }
        : null,
    };
  }

  /**
   * Render the GST tax invoice PDF (letterhead + tax breakup) for a tenant
   * invoice. Ownership is enforced: the invoice must belong to the company.
   */
  async renderInvoicePdf(companyId: string, invoiceId: string) {
    const invoice = await this.prisma.invoice.findFirst({
      where: { id: invoiceId, companyId },
    });
    if (!invoice) throw new BadRequestException('Invoice not found');

    const [company, config] = await Promise.all([
      this.prisma.company.findUnique({
        where: { id: companyId },
        select: {
          name: true,
          address: true,
          city: true,
          state: true,
          pincode: true,
          gstin: true,
          email: true,
          settings: { select: { companyLogo: true } },
        },
      }),
      this.settings.getConfig(),
    ]);

    const logo = await loadLogoBuffer(company?.settings?.companyLogo ?? null);
    const buffer = await renderTaxInvoicePdf(
      invoice as any,
      company ?? { name: 'Customer' },
      logo,
    );

    // Best-effort persistent copy so the invoice list can deep-link later
    try {
      const uploadsDir = path.resolve(process.cwd(), 'uploads', 'invoices');
      if (!fs.existsSync(uploadsDir)) fs.mkdirSync(uploadsDir, { recursive: true });
      fs.writeFileSync(path.join(uploadsDir, `${invoice.invoiceNumber}.pdf`), buffer);
      await this.prisma.invoice
        .update({ where: { id: invoice.id }, data: { pdfUrl: `/uploads/invoices/${invoice.invoiceNumber}.pdf` } })
        .catch(() => {});
    } catch {
      // streaming response works regardless
    }

    return buffer;
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

    // Restore/activate subscription + extend contract on RENEWAL payments
    // (a renewal invoice's period covers the NEXT contract term)
    const sub = await this.prisma.subscription.findUnique({
      where: { companyId },
    });
    if (sub) {
      const periodEnd = invoice.periodEnd ? new Date(invoice.periodEnd) : null;
      const isRenewal =
        periodEnd &&
        (!sub.contractEndsAt || periodEnd > new Date(sub.contractEndsAt));
      await this.prisma.subscription.update({
        where: { id: sub.id },
        data: {
          status: 'ACTIVE',
          ...(isRenewal
            ? {
                contractStartsAt: invoice.periodStart
                  ? new Date(invoice.periodStart)
                  : new Date(),
                contractEndsAt: periodEnd,
                currentPeriodEnd: periodEnd,
              }
            : {}),
        },
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
