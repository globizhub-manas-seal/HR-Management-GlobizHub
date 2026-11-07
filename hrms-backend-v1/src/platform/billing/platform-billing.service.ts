import {
  Injectable,
  NotFoundException,
  ConflictException,
  BadRequestException,
  Logger,
} from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateInvoiceDto } from './dto/create-invoice.dto';
import { RecordPaymentDto } from './dto/record-payment.dto';
import { InvoiceStatus, PaymentStatus } from '../../../generated/prisma/enums';

@Injectable()
export class PlatformBillingService {
  private readonly logger = new Logger(PlatformBillingService.name);

  constructor(private prisma: PrismaService) {}

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
        { invoiceNumber: { contains: query.search.trim(), mode: 'insensitive' } },
        { company: { name: { contains: query.search.trim(), mode: 'insensitive' } } },
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
            select: { id: true, amount: true, status: true, gateway: true, createdAt: true },
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
          select: { id: true, name: true, email: true, phone: true, address: true },
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
    };
  }

  /**
   * Generate a manual or subscription-triggered invoice
   */
  async createInvoice(dto: CreateInvoiceDto, actorId?: string, actorEmail?: string) {
    const company = await this.prisma.company.findUnique({
      where: { id: dto.companyId },
    });
    if (!company) throw new NotFoundException('Target company not found');

    const year = new Date().getFullYear();
    const count = await this.prisma.invoice.count();
    const invoiceNumber = `INV-${year}-${(count + 1).toString().padStart(5, '0')}`;

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
      this.prisma.platformAuditLog
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
        .catch((err) => this.logger.error('Failed to log invoice creation audit', err));
    }

    return invoice;
  }

  /**
   * Update invoice status (PAID, VOID, ISSUED, UNCOLLECTIBLE)
   */
  async updateInvoiceStatus(
    id: string,
    status: InvoiceStatus,
    actorId?: string,
    actorEmail?: string,
  ) {
    const existing = await this.prisma.invoice.findUnique({ where: { id } });
    if (!existing) throw new NotFoundException('Invoice not found');

    const isPaid = status === 'PAID';
    const updated = await this.prisma.invoice.update({
      where: { id },
      data: {
        status,
        paidAt: isPaid ? new Date() : null,
        amountPaid: isPaid ? existing.amountDue : existing.amountPaid,
      },
    });

    if (actorId && actorEmail) {
      this.prisma.platformAuditLog
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
        .catch((err) => this.logger.error('Failed to log invoice status update audit', err));
    }

    return updated;
  }

  /**
   * Record a payment transaction with idempotency protection
   */
  async recordPayment(dto: RecordPaymentDto, actorId?: string, actorEmail?: string) {
    // Check idempotency key to prevent duplicate payment processing
    const existingPayment = await this.prisma.payment.findUnique({
      where: { idempotencyKey: dto.idempotencyKey },
    });
    if (existingPayment) {
      return existingPayment;
    }

    const invoice = await this.prisma.invoice.findUnique({
      where: { id: dto.invoiceId },
    });
    if (!invoice) throw new NotFoundException('Invoice not found for payment');

    const payment = await this.prisma.payment.create({
      data: {
        invoiceId: dto.invoiceId,
        amount: dto.amount,
        currency: dto.currency || 'INR',
        gateway: dto.gateway,
        gatewayPaymentId: dto.gatewayPaymentId || null,
        idempotencyKey: dto.idempotencyKey,
        status: dto.status as PaymentStatus,
        failureReason: dto.failureReason || null,
      },
    });

    // If payment succeeded, update invoice paid amount and check for completion
    if (dto.status === 'SUCCEEDED') {
      const newPaid = Number(invoice.amountPaid) + Number(dto.amount);
      const isFullyPaid = newPaid >= Number(invoice.amountDue);

      await this.prisma.invoice.update({
        where: { id: invoice.id },
        data: {
          amountPaid: newPaid,
          status: isFullyPaid ? 'PAID' : invoice.status,
          paidAt: isFullyPaid ? new Date() : invoice.paidAt,
        },
      });

      // Also ensure subscription status is ACTIVE if tied to a subscription
      if (invoice.subscriptionId) {
        await this.prisma.subscription.update({
          where: { id: invoice.subscriptionId },
          data: { status: 'ACTIVE' },
        });
      }
    }

    if (actorId && actorEmail) {
      this.prisma.platformAuditLog
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
              company: { select: { id: true, name: true, email: true, phone: true } },
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
        failureReason: p.failureReason || 'Invoice overdue without confirmed payment',
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
   * Idempotent payment webhook receiver (Stripe / Razorpay)
   */
  async handleWebhook(payload: any, eventType: string, idempotencyKey: string) {
    this.logger.log(`Received webhook event: ${eventType} with key: ${idempotencyKey}`);

    const existing = await this.prisma.payment.findUnique({
      where: { idempotencyKey },
    });
    if (existing) {
      return { status: 'already_processed', paymentId: existing.id };
    }

    // In a live integration, event payload contains invoice_id / metadata
    const invoiceId = payload?.data?.object?.metadata?.invoiceId || payload?.invoiceId;
    if (!invoiceId) {
      return { status: 'ignored', reason: 'No invoiceId in metadata' };
    }

    const amount = Number(payload?.data?.object?.amount || payload?.amount || 0) / 100;
    const isSuccess = eventType.includes('succeeded') || eventType.includes('captured');

    const payment = await this.recordPayment({
      invoiceId,
      amount,
      currency: payload?.currency || 'INR',
      gateway: payload?.gateway || 'STRIPE',
      gatewayPaymentId: payload?.data?.object?.id || payload?.paymentId,
      idempotencyKey,
      status: isSuccess ? 'SUCCEEDED' : 'FAILED',
      failureReason: isSuccess ? undefined : 'Webhook indicated transaction failure',
    });

    return { status: 'processed', paymentId: payment.id };
  }
}

