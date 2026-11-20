import {
  Injectable,
  NotFoundException,
  ConflictException,
  BadRequestException,
  Logger,
  OnModuleInit,
} from '@nestjs/common';
import * as crypto from 'crypto';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateInvoiceDto } from './dto/create-invoice.dto';
import { RecordPaymentDto } from './dto/record-payment.dto';
import { SubscriptionGuard } from '../subscriptions/guards/subscription.guard';
import { InvoiceStatus, PaymentStatus } from '../../../generated/prisma/enums';

export interface PlatformCoupon {
  id: string;
  code: string;
  name: string;
  discountType: 'PERCENTAGE' | 'FIXED';
  discountValue: number;
  validUntil: string;
  usageCount: number;
  maxUsage: number;
  isActive: boolean;
  createdAt: string;
}

@Injectable()
export class PlatformBillingService implements OnModuleInit {
  private readonly logger = new Logger(PlatformBillingService.name);

  constructor(
    private prisma: PrismaService,
    private subGuard: SubscriptionGuard,
  ) {}

  async onModuleInit() {
    await this.seedDefaultCoupons();
  }

  /**
   * Seed default platform coupons if none exist (real Coupon table).
   */
  async seedDefaultCoupons() {
    try {
      const existing = await this.prisma.coupon.count();
      if (existing > 0) return;

      const defaults = [
        {
          code: 'LAUNCH50',
          name: 'Early Adopter Special',
          discountType: 'PERCENTAGE',
          discountValue: 50,
          validUntil: new Date('2026-12-31'),
          maxUsage: 100,
          isActive: true,
        },
        {
          code: 'ANNUAL20',
          name: 'Annual Commitment Discount',
          discountType: 'PERCENTAGE',
          discountValue: 20,
          validUntil: new Date('2027-06-30'),
          maxUsage: 50,
          isActive: true,
        },
      ];
      for (const c of defaults) {
        await this.prisma.coupon.create({ data: c });
      }
      this.logger.log('Default platform coupons seeded.');
    } catch (err: any) {
      this.logger.warn(`Could not seed default coupons: ${err.message}`);
    }
  }

  /**
   * List invoices with metrics, filtering and pagination
   */
  async getInvoices(query: {
    search?: string;
    status?: string;
    companyId?: string;
    page?: number;
    limit?: number;
  }) {
    const page = Math.max(1, Number(query.page) || 1);
    const limit = Math.max(1, Math.min(100, Number(query.limit) || 20));
    const skip = (page - 1) * limit;

    const where: any = {};
    if (query.status && query.status !== 'ALL') {
      where.status = query.status as InvoiceStatus;
    }
    if (query.companyId) {
      where.companyId = query.companyId;
    }
    if (query.search) {
      where.OR = [
        {
          invoiceNumber: { contains: query.search.trim(), mode: 'insensitive' },
        },
        {
          company: {
            name: { contains: query.search.trim(), mode: 'insensitive' },
          },
        },
      ];
    }

    const [total, items, aggregations] = await Promise.all([
      this.prisma.invoice.count({ where }),
      this.prisma.invoice.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: {
          company: {
            select: { id: true, name: true, email: true },
          },
          subscription: {
            select: { id: true, plan: { select: { name: true, code: true } } },
          },
          payments: {
            select: {
              id: true,
              amount: true,
              status: true,
              gateway: true,
              createdAt: true,
            },
          },
        },
      }),
      this.prisma.invoice.groupBy({
        by: ['status'],
        _sum: { amountDue: true, amountPaid: true },
      }),
    ]);

    let totalDue = 0;
    let totalPaid = 0;
    let totalOverdue = 0;

    for (const agg of aggregations) {
      const due = Number(agg._sum.amountDue || 0);
      const paid = Number(agg._sum.amountPaid || 0);
      totalDue += due;
      totalPaid += paid;
      if (agg.status === 'ISSUED') {
        totalOverdue += due - paid;
      }
    }

    return {
      data: items.map((inv) => ({
        id: inv.id,
        invoiceNumber: inv.invoiceNumber,
        companyId: inv.companyId,
        companyName: inv.company.name,
        companyEmail: inv.company.email,
        planName: inv.subscription?.plan?.name || 'Custom SaaS Plan',
        amountDue: Number(inv.amountDue),
        amountPaid: Number(inv.amountPaid),
        currency: inv.currency,
        status: inv.status,
        dueDate: inv.dueDate,
        paidAt: inv.paidAt,
        pdfUrl: inv.pdfUrl,
        couponCode: inv.couponCode,
        periodStart: inv.periodStart,
        periodEnd: inv.periodEnd,
        perUserPrice: inv.perUserPrice ? Number(inv.perUserPrice) : null,
        userCount: inv.userCount,
        createdAt: inv.createdAt,
        paymentCount: inv.payments.length,
      })),
      meta: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
      summary: {
        totalInvoiced: totalDue,
        totalCollected: totalPaid,
        totalOutstanding: Math.max(0, totalDue - totalPaid),
      },
    };
  }

  /**
   * Get single invoice with detailed audit & payment transactions
   */
  async getInvoiceById(id: string) {
    const invoice = await this.prisma.invoice.findUnique({
      where: { id },
      include: {
        company: {
          select: {
            id: true,
            name: true,
            email: true,
            phone: true,
            address: true,
            gstin: true,
            pan: true,
            city: true,
            state: true,
            country: true,
            pincode: true,
          },
        },
        subscription: {
          include: { plan: true },
        },
        payments: {
          orderBy: { createdAt: 'desc' },
        },
      },
    });

    if (!invoice) throw new NotFoundException('Invoice not found');

    return {
      ...invoice,
      amountDue: Number(invoice.amountDue),
      amountPaid: Number(invoice.amountPaid),
      perUserPrice: invoice.perUserPrice ? Number(invoice.perUserPrice) : null,
    };
  }

  /**
   * Generate a manual or subscription-triggered invoice (platform admin).
   * Amount is validated to be positive; per-user invoices should use the
   * tenant checkout flow instead.
   */
  async createInvoice(
    dto: CreateInvoiceDto,
    actorId?: string,
    actorEmail?: string,
  ) {
    const company = await this.prisma.company.findUnique({
      where: { id: dto.companyId },
    });
    if (!company) throw new NotFoundException('Target company not found');
    if (Number(dto.amountDue) <= 0) {
      throw new BadRequestException('Invoice amount must be greater than zero');
    }

    const config = await this.prisma.systemConfig.findUnique({
      where: { singletonKey: 'GLOBAL' },
    });
    const prefix = config?.invoicePrefix || 'INV';
    const year = new Date().getFullYear();
    const count = await this.prisma.invoice.count();
    const invoiceNumber = `${prefix}-${year}-${(count + 1).toString().padStart(5, '0')}`;

    const invoice = await this.prisma.invoice.create({
      data: {
        invoiceNumber,
        companyId: dto.companyId,
        subscriptionId: dto.subscriptionId || null,
        amountDue: dto.amountDue,
        currency: dto.currency || 'INR',
        dueDate: new Date(dto.dueDate),
        status: 'ISSUED',
      },
      include: { company: true },
    });

    if (actorId && actorEmail) {
      await this.prisma.platformAuditLog
        .create({
          data: {
            actorId,
            actorEmail,
            actorRole: 'SUPER_ADMIN',
            action: 'INVOICE_CREATE',
            targetEntity: 'Invoice',
            targetId: invoice.id,
            companyId: dto.companyId,
            afterState: { invoiceNumber, amountDue: dto.amountDue } as any,
          },
        })
        .catch((err) =>
          this.logger.error('Failed to log invoice creation audit', err),
        );
    }

    return invoice;
  }

  /**
   * Update invoice status. Marking PAID without an existing succeeded payment
   * automatically records a MANUAL_BANK settlement so the ledger stays
   * consistent (every rupee traced to a payment row).
   */
  async updateInvoiceStatus(
    id: string,
    status: InvoiceStatus,
    actorId?: string,
    actorEmail?: string,
  ) {
    const existing = await this.prisma.invoice.findUnique({
      where: { id },
      include: { payments: true },
    });
    if (!existing) throw new NotFoundException('Invoice not found');

    if (status === 'PAID') {
      const succeededTotal = existing.payments
        .filter((p) => p.status === 'SUCCEEDED')
        .reduce((sum, p) => sum + Number(p.amount), 0);

      if (succeededTotal < Number(existing.amountDue)) {
        // Record the balance as a manual settlement with a stable idempotency key
        const shortfall = Number(existing.amountDue) - succeededTotal;
        await this.recordPayment(
          {
            invoiceId: id,
            amount: shortfall,
            currency: existing.currency,
            gateway: 'MANUAL_BANK',
            gatewayPaymentId: undefined,
            idempotencyKey: `manual-${id}-${Date.now()}`,
            status: 'SUCCEEDED',
            failureReason: undefined,
          } as RecordPaymentDto,
          actorId,
          actorEmail,
        );
      }
      return this.prisma.invoice.findUnique({ where: { id } });
    }

    const updated = await this.prisma.invoice.update({
      where: { id },
      data: { status, paidAt: null },
    });

    if (actorId && actorEmail) {
      await this.prisma.platformAuditLog
        .create({
          data: {
            actorId,
            actorEmail,
            actorRole: 'SUPER_ADMIN',
            action: 'INVOICE_STATUS_UPDATE',
            targetEntity: 'Invoice',
            targetId: id,
            companyId: existing.companyId,
            beforeState: { status: existing.status } as any,
            afterState: { status: updated.status } as any,
          },
        })
        .catch((err) =>
          this.logger.error('Failed to log invoice status update audit', err),
        );
    }

    return updated;
  }

  /**
   * Record a payment transaction with idempotency protection.
   * ANTI-BYPASS RULES:
   *  - A SUCCEEDED payment must match the invoice amount (no arbitrary credits).
   *  - gatewayPaymentId uniqueness is enforced by the schema.
   *  - Successful settlement activates/restores the subscription.
   */
  async recordPayment(
    dto: RecordPaymentDto,
    actorId?: string,
    actorEmail?: string,
  ) {
    const existingPayment = await this.prisma.payment.findUnique({
      where: { idempotencyKey: dto.idempotencyKey },
    });
    if (existingPayment) {
      return existingPayment;
    }

    const invoice = await this.prisma.invoice.findUnique({
      where: { id: dto.invoiceId },
      include: { subscription: true },
    });
    if (!invoice) throw new NotFoundException('Invoice not found for payment');

    const amount = Number(dto.amount);
    if (amount <= 0) {
      throw new BadRequestException('Payment amount must be greater than zero');
    }

    if (dto.status === 'SUCCEEDED') {
      const alreadyPaid = Number(invoice.amountPaid);
      const outstanding = Number(invoice.amountDue) - alreadyPaid;
      if (outstanding <= 0) {
        throw new ConflictException('Invoice is already fully settled');
      }
      if (amount > outstanding + 0.01) {
        throw new BadRequestException(
          `Payment amount (₹${amount}) exceeds the outstanding balance (₹${outstanding}). Payments cannot over-credit an invoice.`,
        );
      }
      if (amount < outstanding - 0.01) {
        throw new BadRequestException(
          `Payment amount (₹${amount}) is less than the outstanding balance (₹${outstanding}). Partial settlement is not permitted; adjust the invoice first or collect the full amount.`,
        );
      }
    }

    const payment = await this.prisma.payment.create({
      data: {
        invoiceId: dto.invoiceId,
        amount,
        currency: dto.currency || invoice.currency || 'INR',
        gateway: dto.gateway,
        gatewayPaymentId: dto.gatewayPaymentId || null,
        idempotencyKey: dto.idempotencyKey,
        status: dto.status as PaymentStatus,
        failureReason: dto.failureReason || null,
      },
    });

    if (dto.status === 'SUCCEEDED') {
      await this.prisma.invoice.update({
        where: { id: invoice.id },
        data: {
          amountPaid: Number(invoice.amountDue),
          status: 'PAID',
          paidAt: new Date(),
        },
      });

      // Restore / activate subscription & release overdue lock
      if (invoice.subscriptionId) {
        await this.prisma.subscription.update({
          where: { id: invoice.subscriptionId },
          data: { status: 'ACTIVE' },
        });
      } else {
        // Invoice without subscription row: still clear PAST_DUE on the company sub
        const sub = await this.prisma.subscription.findUnique({
          where: { companyId: invoice.companyId },
        });
        if (sub && sub.status === 'PAST_DUE') {
          await this.prisma.subscription.update({
            where: { id: sub.id },
            data: { status: 'ACTIVE' },
          });
        }
      }

      // Consume the coupon (if any) exactly once per invoice
      if (invoice.couponCode) {
        await this.prisma.coupon
          .update({
            where: { code: invoice.couponCode },
            data: { usageCount: { increment: 1 } },
          })
          .catch(() => {});
      }

      // Lift any payment-hold lock immediately
      this.subGuard.invalidate(invoice.companyId);
    }

    if (actorId && actorEmail) {
      await this.prisma.platformAuditLog
        .create({
          data: {
            actorId,
            actorEmail,
            actorRole: 'SUPER_ADMIN',
            action: 'PAYMENT_RECORD',
            targetEntity: 'Payment',
            targetId: payment.id,
            companyId: invoice.companyId,
            afterState: payment as any,
          },
        })
        .catch((err) => this.logger.error('Failed to log payment audit', err));
    }

    return payment;
  }

  /**
   * List payments ledger
   */
  async getPayments(query: {
    status?: string;
    gateway?: string;
    page?: number;
    limit?: number;
  }) {
    const page = Math.max(1, Number(query.page) || 1);
    const limit = Math.max(1, Math.min(100, Number(query.limit) || 20));
    const skip = (page - 1) * limit;

    const where: any = {};
    if (query.status && query.status !== 'ALL') {
      where.status = query.status as PaymentStatus;
    }
    if (query.gateway && query.gateway !== 'ALL') {
      where.gateway = query.gateway;
    }

    const [total, items] = await Promise.all([
      this.prisma.payment.count({ where }),
      this.prisma.payment.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: {
          invoice: {
            select: {
              invoiceNumber: true,
              company: { select: { id: true, name: true, email: true } },
            },
          },
        },
      }),
    ]);

    return {
      data: items.map((p) => ({
        id: p.id,
        invoiceId: p.invoiceId,
        invoiceNumber: p.invoice.invoiceNumber,
        companyId: p.invoice.company.id,
        companyName: p.invoice.company.name,
        companyEmail: p.invoice.company.email,
        amount: Number(p.amount),
        currency: p.currency,
        gateway: p.gateway,
        gatewayPaymentId: p.gatewayPaymentId,
        idempotencyKey: p.idempotencyKey,
        status: p.status,
        failureReason: p.failureReason,
        createdAt: p.createdAt,
      })),
      meta: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  /**
   * Failed payments & Dunning queue
   */
  async getFailedPayments(query: { page?: number; limit?: number }) {
    const page = Math.max(1, Number(query.page) || 1);
    const limit = Math.max(1, Math.min(100, Number(query.limit) || 20));
    const skip = (page - 1) * limit;

    const where = {
      OR: [
        { status: 'FAILED' as PaymentStatus },
        {
          invoice: {
            status: 'ISSUED' as InvoiceStatus,
            dueDate: { lt: new Date() },
          },
        },
      ],
    };

    const [total, items] = await Promise.all([
      this.prisma.payment.count({ where }),
      this.prisma.payment.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: {
          invoice: {
            include: {
              company: {
                select: { id: true, name: true, email: true, phone: true },
              },
              subscription: { include: { plan: true } },
            },
          },
        },
      }),
    ]);

    return {
      data: items.map((p) => ({
        id: p.id,
        invoiceNumber: p.invoice.invoiceNumber,
        companyName: p.invoice.company.name,
        companyEmail: p.invoice.company.email,
        companyPhone: p.invoice.company.phone,
        planName: p.invoice.subscription?.plan?.name || 'Standard',
        amount: Number(p.amount),
        currency: p.currency,
        gateway: p.gateway,
        status: p.status,
        failureReason:
          p.failureReason || 'Invoice overdue without confirmed payment',
        dueDate: p.invoice.dueDate,
        createdAt: p.createdAt,
      })),
      meta: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  /**
   * Cryptographically verify a generic webhook signature (Stripe-style
   * t=,v1= scheme) against the configured secret.
   */
  verifyWebhookSignature(
    payload: string,
    signature: string,
    secret: string,
  ): boolean {
    try {
      if (signature.includes('t=') && signature.includes('v1=')) {
        const parts = signature.split(',').reduce(
          (acc, curr) => {
            const [k, v] = curr.split('=');
            if (k && v) acc[k.trim()] = v.trim();
            return acc;
          },
          {} as Record<string, string>,
        );

        const timestamp = parts['t'];
        const v1 = parts['v1'];
        if (!timestamp || !v1) return false;

        // Replay window: 5 minutes
        if (Math.abs(Date.now() / 1000 - Number(timestamp)) > 300) return false;

        const signedPayload = `${timestamp}.${payload}`;
        const expectedSignature = crypto
          .createHmac('sha256', secret)
          .update(signedPayload)
          .digest('hex');

        const v1Buf = Buffer.from(v1, 'utf8');
        const expBuf = Buffer.from(expectedSignature, 'utf8');
        return (
          v1Buf.length === expBuf.length &&
          crypto.timingSafeEqual(v1Buf, expBuf)
        );
      }

      const expectedSignature = crypto
        .createHmac('sha256', secret)
        .update(payload)
        .digest('hex');

      const sigBuf = Buffer.from(signature, 'utf8');
      const expBuf = Buffer.from(expectedSignature, 'utf8');
      return (
        sigBuf.length === expBuf.length &&
        crypto.timingSafeEqual(sigBuf, expBuf)
      );
    } catch {
      return false;
    }
  }

  /**
   * Idempotent payment webhook handler. Amounts are NEVER taken from the
   * payload: the invoice's stored amountDue is the single source of truth.
   */
  async handleWebhook(payload: any, eventType: string, idempotencyKey: string) {
    this.logger.log(
      `Received webhook event: ${eventType} with key: ${idempotencyKey}`,
    );

    const existing = await this.prisma.payment.findUnique({
      where: { idempotencyKey },
    });
    if (existing) {
      return { status: 'already_processed', paymentId: existing.id };
    }

    const invoiceId =
      payload?.data?.object?.metadata?.invoiceId ||
      payload?.invoiceId ||
      payload?.payment?.notes?.invoiceId;
    if (!invoiceId) {
      return { status: 'ignored', reason: 'No invoiceId in metadata' };
    }

    const invoice = await this.prisma.invoice.findUnique({
      where: { id: invoiceId },
    });
    if (!invoice) {
      return { status: 'ignored', reason: 'Invoice not found' };
    }

    const isSuccess =
      eventType.includes('succeeded') ||
      eventType.includes('captured') ||
      eventType.includes('paid');

    const payment = await this.recordPayment(
      {
        invoiceId,
        amount: Number(invoice.amountDue), // server truth, never payload amount
        currency: invoice.currency,
        gateway: payload?.gateway || 'RAZORPAY',
        gatewayPaymentId:
          payload?.data?.object?.id ||
          payload?.paymentId ||
          payload?.payment?.id ||
          undefined,
        idempotencyKey,
        status: isSuccess ? 'SUCCEEDED' : 'FAILED',
        failureReason: isSuccess
          ? undefined
          : 'Webhook indicated transaction failure',
      } as RecordPaymentDto,
      undefined,
      'webhook@globizhr.saas',
    );

    return { status: 'processed', paymentId: payment.id };
  }

  /**
   * List all discount coupons (real Coupon table)
   */
  async getCoupons(): Promise<PlatformCoupon[]> {
    const records = await this.prisma.coupon.findMany({
      orderBy: { createdAt: 'desc' },
    });

    return records.map((r) => ({
      id: r.id,
      code: r.code,
      name: r.name,
      discountType: (r.discountType as 'PERCENTAGE' | 'FIXED') || 'PERCENTAGE',
      discountValue: Number(r.discountValue),
      validUntil: r.validUntil.toISOString(),
      usageCount: r.usageCount,
      maxUsage: r.maxUsage,
      isActive: r.isActive,
      createdAt: r.createdAt.toISOString(),
    }));
  }

  /**
   * Create a new discount coupon
   */
  async createCoupon(dto: {
    code: string;
    name: string;
    discountType: 'PERCENTAGE' | 'FIXED';
    discountValue: number;
    validUntil: string;
    maxUsage: number;
    isActive?: boolean;
  }) {
    const normalizedCode = dto.code.trim().toUpperCase();

    const existing = await this.prisma.coupon.findUnique({
      where: { code: normalizedCode },
    });
    if (existing) {
      throw new ConflictException(
        `Coupon code "${normalizedCode}" already exists.`,
      );
    }

    const record = await this.prisma.coupon.create({
      data: {
        code: normalizedCode,
        name: dto.name,
        discountType: dto.discountType,
        discountValue: dto.discountValue,
        validUntil: new Date(dto.validUntil),
        maxUsage: dto.maxUsage,
        isActive: dto.isActive !== false,
      },
    });

    return {
      id: record.id,
      code: record.code,
      name: record.name,
      discountType: record.discountType,
      discountValue: Number(record.discountValue),
      validUntil: record.validUntil.toISOString(),
      usageCount: record.usageCount,
      maxUsage: record.maxUsage,
      isActive: record.isActive,
      createdAt: record.createdAt.toISOString(),
    };
  }

  /**
   * Delete a discount coupon
   */
  async deleteCoupon(code: string) {
    const normalizedCode = code.trim().toUpperCase();
    const existing = await this.prisma.coupon.findUnique({
      where: { code: normalizedCode },
    });
    if (!existing) {
      throw new NotFoundException(`Coupon "${normalizedCode}" not found.`);
    }

    await this.prisma.coupon.delete({ where: { code: normalizedCode } });

    return {
      success: true,
      message: `Coupon "${normalizedCode}" deleted successfully.`,
    };
  }

  /**
   * Validate a coupon against an amount (no side effects — usage is counted
   * only when the payment actually settles).
   */
  async validateCoupon(code: string, amount: number) {
    const normalizedCode = code.trim().toUpperCase();
    const record = await this.prisma.coupon.findUnique({
      where: { code: normalizedCode },
    });

    if (!record || !record.isActive) {
      throw new BadRequestException('Invalid or inactive coupon code.');
    }

    if (record.validUntil.getTime() < Date.now()) {
      throw new BadRequestException('This coupon has expired.');
    }

    if (record.maxUsage && record.usageCount >= record.maxUsage) {
      throw new BadRequestException(
        'This coupon has reached its maximum usage limit.',
      );
    }

    let discountAmount = 0;
    if (record.discountType === 'PERCENTAGE') {
      discountAmount = (amount * Number(record.discountValue)) / 100;
    } else {
      discountAmount = Number(record.discountValue);
    }

    discountAmount = Math.min(amount, Math.max(0, discountAmount));
    const finalAmount = Math.max(0, amount - discountAmount);

    return {
      code: normalizedCode,
      name: record.name,
      discountType: record.discountType,
      discountValue: Number(record.discountValue),
      discountAmount: Number(discountAmount.toFixed(2)),
      originalAmount: amount,
      finalAmount: Number(finalAmount.toFixed(2)),
    };
  }
}
