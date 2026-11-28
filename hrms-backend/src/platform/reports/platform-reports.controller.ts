import {
  BadRequestException,
  Controller,
  Get,
  Param,
  Query,
  Res,
  UseGuards,
} from '@nestjs/common';
import { Response } from 'express';
import { PrismaService } from '../../prisma/prisma.service';
import { PlatformAuthGuard } from '../auth/guards/platform-auth.guard';
import { PlatformRolesGuard } from '../auth/guards/platform-roles.guard';
import { PlatformRoles } from '../auth/decorators/platform-roles.decorator';
import {
  PERIOD_PRESETS,
  resolveRange,
  DateRange,
} from '../../reports/report-range';
import {
  ReportExportService,
  ExportTable,
} from '../../reports/report-export.service';
import { PlatformSettingsService } from '../settings/platform-settings.service';

/**
 * GLOBAL report system for the super admin — organization level (all
 * companies) and platform level (revenue, subscriptions, invoices,
 * payments) with the same period presets and CSV/Excel/PDF export on the
 * platform letterhead.
 */
@Controller('platform/reports')
@UseGuards(PlatformAuthGuard, PlatformRolesGuard)
export class PlatformReportsController {
  constructor(
    private prisma: PrismaService,
    private exporter: ReportExportService,
    private settings: PlatformSettingsService,
  ) {}

  @Get('presets')
  presets() {
    return PERIOD_PRESETS;
  }

  /** Platform-level headline metrics for the period */
  @Get('summary')
  @PlatformRoles('SUPER_ADMIN', 'BILLING_ADMIN', 'PLATFORM_ANALYST')
  async summary(
    @Query('period') period?: string,
    @Query('from') from?: string,
    @Query('to') to?: string,
  ) {
    const range = resolveRange(period, from, to);
    const [
      companies,
      activeSubs,
      freemiumSubs,
      expiredSubs,
      invoicesIssued,
      revenueAgg,
      gstAgg,
      paymentsAgg,
      newCompanies,
      usersAgg,
    ] = await Promise.all([
      this.prisma.company.count(),
      this.prisma.subscription.count({ where: { status: 'ACTIVE', plan: { monthlyPrice: { gt: 0 } } } }),
      this.prisma.subscription.count({ where: { plan: { code: 'PLAN_FREE' } } }),
      this.prisma.subscription.count({ where: { status: 'EXPIRED' } }),
      this.prisma.invoice.count({
        where: { createdAt: { gte: range.from, lte: range.to } },
      }),
      this.prisma.invoice.aggregate({
        where: { status: 'PAID', paidAt: { gte: range.from, lte: range.to } },
        _sum: { amountPaid: true, taxableAmount: true, taxAmount: true },
        _count: { _all: true },
      }),
      this.prisma.invoice.aggregate({
        where: { createdAt: { gte: range.from, lte: range.to } },
        _sum: { taxAmount: true },
      }),
      this.prisma.payment.aggregate({
        where: { status: 'SUCCEEDED', createdAt: { gte: range.from, lte: range.to } },
        _sum: { amount: true },
        _count: { _all: true },
      }),
      this.prisma.company.count({
        where: { createdAt: { gte: range.from, lte: range.to } },
      }),
      this.prisma.employee.groupBy({
        by: ['companyId'],
        where: { exitRecord: null },
        _count: { _all: true },
      }),
    ]);

    const totalUsers = usersAgg.reduce((a, g) => a + g._count._all, 0);
    const revenue = Number(revenueAgg._sum.amountPaid ?? 0);
    const base = Number(revenueAgg._sum.taxableAmount ?? 0);

    return {
      range: { from: range.from, to: range.to, label: range.label },
      presets: PERIOD_PRESETS,
      organizations: {
        total: companies,
        newInRange: newCompanies,
        paidActive: activeSubs,
        freemium: freemiumSubs,
        expired: expiredSubs,
        totalUsers,
      },
      revenue: {
        collectedInRange: revenue,
        collectedInvoices: revenueAgg._count._all,
        taxableBase: base,
        gstCollectedInRange: Number(gstAgg._sum.taxAmount ?? 0),
        successfulPayments: paymentsAgg._count._all,
        paymentVolume: Number(paymentsAgg._sum.amount ?? 0),
      },
      invoicesIssuedInRange: invoicesIssued,
    };
  }

  /** Organization-level table: every company with plan + usage */
  @Get('organizations')
  @PlatformRoles('SUPER_ADMIN', 'BILLING_ADMIN', 'PLATFORM_ANALYST')
  async organizations(
    @Query('period') period?: string,
    @Query('from') from?: string,
    @Query('to') to?: string,
  ) {
    const range = resolveRange(period, from, to);
    const companies = await this.prisma.company.findMany({
      select: {
        id: true,
        name: true,
        email: true,
        industry: true,
        status: true,
        createdAt: true,
        subscriptions: {
          select: {
            status: true,
            freemiumEndsAt: true,
            contractStartsAt: true,
            contractEndsAt: true,
            plan: { select: { name: true, code: true, monthlyPrice: true } },
          },
        },
        _count: { select: { employees: true, invoices: true } },
      },
      orderBy: { createdAt: 'desc' },
    });
    return {
      range,
      rows: companies.map((c) => ({
        name: c.name,
        email: c.email,
        industry: c.industry,
        status: c.status,
        plan: c.subscriptions[0]?.plan?.name ?? '-',
        subscriptionStatus: c.subscriptions[0]?.status ?? '-',
        contractEndsAt: c.subscriptions[0]?.contractEndsAt ?? null,
        freemiumEndsAt: c.subscriptions[0]?.freemiumEndsAt ?? null,
        users: c._count.employees,
        invoices: c._count.invoices,
        registeredAt: c.createdAt,
      })),
    };
  }

  /** Invoices issued in the range (organization level) */
  @Get('invoices')
  @PlatformRoles('SUPER_ADMIN', 'BILLING_ADMIN', 'PLATFORM_ANALYST')
  async invoices(
    @Query('period') period?: string,
    @Query('from') from?: string,
    @Query('to') to?: string,
  ) {
    const range = resolveRange(period, from, to);
    const invoices = await this.prisma.invoice.findMany({
      where: { createdAt: { gte: range.from, lte: range.to } },
      include: { company: { select: { name: true } } },
      orderBy: { createdAt: 'desc' },
    });
    return {
      range,
      rows: invoices.map((i) => ({
        invoiceNumber: i.invoiceNumber,
        company: i.company?.name,
        taxableAmount: Number(i.taxableAmount ?? i.amountDue),
        taxLabel: i.taxLabel,
        taxAmount: Number(i.taxAmount ?? 0),
        amountDue: Number(i.amountDue),
        amountPaid: Number(i.amountPaid),
        status: i.status,
        couponCode: i.couponCode,
        dueDate: i.dueDate,
        paidAt: i.paidAt,
        createdAt: i.createdAt,
      })),
    };
  }

  /**
   * Export: /platform/reports/export/:dataset?format=csv|excel|pdf
   * datasets: organizations | invoices | subscriptions | payments
   */
  @Get('export/:dataset')
  @PlatformRoles('SUPER_ADMIN', 'BILLING_ADMIN', 'PLATFORM_ANALYST')
  async exportReport(
    @Param('dataset') dataset: string,
    @Query('format') format: string,
    @Query('period') period?: string,
    @Query('from') from?: string,
    @Query('to') to?: string,
    @Res() res?: any,
  ) {
    if (!res) throw new BadRequestException('Response stream unavailable');
    const fmt = (format ?? 'pdf').toLowerCase();
    if (!['csv', 'excel', 'pdf'].includes(fmt)) {
      throw new BadRequestException('format must be csv, excel or pdf');
    }
    const range = resolveRange(period, from, to);
    const config = await this.settings.getConfig();

    const ctx = {
      companyName: `${config.sellerLegalName} — Platform`,
      addressLines: [config.sellerAddress].filter(Boolean),
      logoBuffer: null as Buffer | null,
      extraHeaderLines: [
        config.sellerGstin ? `GSTIN: ${config.sellerGstin}` : '',
        'Global report — all organizations',
      ].filter(Boolean),
      reportTitle: `${PLATFORM_DATASET_LABELS[dataset] ?? dataset} Report`,
      rangeLabel: range.label,
      footer: `${config.sellerLegalName} • Global ${PLATFORM_DATASET_LABELS[dataset] ?? dataset} report • ${range.label}`,
    };

    const tables = await this.buildTables(dataset, range);

    if (fmt === 'csv') {
      res.setHeader('Content-Type', 'text/csv; charset=utf-8');
      res.setHeader(
        'Content-Disposition',
        `attachment; filename="platform-${dataset}-${range.preset}.csv"`,
      );
      res.end(this.exporter.toCsv(tables));
      return;
    }
    if (fmt === 'excel') {
      const buffer = await this.exporter.toExcel(tables, ctx);
      res.setHeader(
        'Content-Type',
        'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      );
      res.setHeader(
        'Content-Disposition',
        `attachment; filename="platform-${dataset}-${range.preset}.xlsx"`,
      );
      res.end(buffer);
      return;
    }
    const buffer = await this.exporter.toPdf(tables, ctx);
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader(
      'Content-Disposition',
      `attachment; filename="platform-${dataset}-${range.preset}.pdf"`,
    );
    res.end(buffer);
  }

  private async buildTables(dataset: string, range: DateRange): Promise<ExportTable[]> {
    const money = true;
    switch (dataset) {
      case 'organizations': {
        const companies = await this.prisma.company.findMany({
          select: {
            name: true,
            email: true,
            industry: true,
            status: true,
            createdAt: true,
            subscriptions: {
              select: {
                status: true,
                contractEndsAt: true,
                freemiumEndsAt: true,
                plan: { select: { name: true, monthlyPrice: true } },
              },
            },
            _count: { select: { employees: true } },
          },
          orderBy: { createdAt: 'desc' },
        });
        return [
          {
            title: `Organizations (${companies.length})`,
            columns: [
              { key: 'name', label: 'Organization' },
              { key: 'email', label: 'Email' },
              { key: 'industry', label: 'Industry' },
              { key: 'plan', label: 'Plan' },
              { key: 'subscriptionStatus', label: 'Subscription' },
              { key: 'users', label: 'Users' },
              { key: 'companyStatus', label: 'Status' },
              { key: 'contractEndsAt', label: 'Contract End' },
              { key: 'registeredAt', label: 'Registered' },
            ],
            rows: companies.map((c) => ({
              name: c.name,
              email: c.email,
              industry: c.industry ?? '-',
              plan: c.subscriptions[0]?.plan?.name ?? '-',
              subscriptionStatus: c.subscriptions[0]?.status ?? '-',
              users: c._count.employees,
              companyStatus: c.status,
              contractEndsAt: c.subscriptions[0]?.contractEndsAt ?? null,
              registeredAt: c.createdAt,
            })),
          },
        ];
      }
      case 'invoices': {
        const invoices = await this.prisma.invoice.findMany({
          where: { createdAt: { gte: range.from, lte: range.to } },
          include: { company: { select: { name: true } } },
          orderBy: { createdAt: 'desc' },
        });
        return [
          {
            title: `Invoices issued — ${range.label}`,
            columns: [
              { key: 'invoiceNumber', label: 'Invoice #' },
              { key: 'company', label: 'Organization' },
              { key: 'taxableAmount', label: 'Taxable', money },
              { key: 'taxLabel', label: 'Tax Type' },
              { key: 'taxAmount', label: 'Tax', money },
              { key: 'amountDue', label: 'Total', money },
              { key: 'amountPaid', label: 'Paid', money },
              { key: 'status', label: 'Status' },
              { key: 'createdAt', label: 'Issued' },
            ],
            rows: invoices.map((i) => ({
              invoiceNumber: i.invoiceNumber,
              company: i.company?.name ?? '-',
              taxableAmount: Number(i.taxableAmount ?? i.amountDue),
              taxLabel: i.taxLabel ?? '-',
              taxAmount: Number(i.taxAmount ?? 0),
              amountDue: Number(i.amountDue),
              amountPaid: Number(i.amountPaid),
              status: i.status,
              createdAt: i.createdAt,
            })),
          },
        ];
      }
      case 'subscriptions': {
        const subs = await this.prisma.subscription.findMany({
          include: {
            company: { select: { name: true } },
            plan: { select: { name: true, code: true, monthlyPrice: true } },
          },
          orderBy: { updatedAt: 'desc' },
        });
        return [
          {
            title: `Subscriptions (${subs.length})`,
            columns: [
              { key: 'company', label: 'Organization' },
              { key: 'plan', label: 'Plan' },
              { key: 'planPrice', label: 'Price/User/Mo', money },
              { key: 'billingCycle', label: 'Cycle' },
              { key: 'status', label: 'Status' },
              { key: 'contractStartsAt', label: 'Contract Start' },
              { key: 'contractEndsAt', label: 'Contract End' },
              { key: 'freemiumEndsAt', label: 'Free Until' },
            ],
            rows: subs.map((s) => ({
              company: s.company?.name ?? '-',
              plan: s.plan?.name ?? '-',
              planPrice: Number(s.plan?.monthlyPrice ?? 0),
              billingCycle: s.billingCycle,
              status: s.status,
              contractStartsAt: s.contractStartsAt,
              contractEndsAt: s.contractEndsAt,
              freemiumEndsAt: s.freemiumEndsAt,
            })),
          },
        ];
      }
      case 'payments': {
        const payments = await this.prisma.payment.findMany({
          where: { createdAt: { gte: range.from, lte: range.to } },
          include: {
            invoice: {
              select: {
                invoiceNumber: true,
                company: { select: { name: true } },
              },
            },
          },
          orderBy: { createdAt: 'desc' },
        });
        return [
          {
            title: `Payments — ${range.label}`,
            columns: [
              { key: 'invoiceNumber', label: 'Invoice #' },
              { key: 'company', label: 'Organization' },
              { key: 'amount', label: 'Amount', money },
              { key: 'gateway', label: 'Gateway' },
              { key: 'status', label: 'Status' },
              { key: 'createdAt', label: 'Date' },
            ],
            rows: payments.map((p) => ({
              invoiceNumber: p.invoice?.invoiceNumber ?? '-',
              company: p.invoice?.company?.name ?? '-',
              amount: Number(p.amount),
              gateway: p.gateway,
              status: p.status,
              createdAt: p.createdAt,
            })),
          },
        ];
      }
      default:
        throw new BadRequestException(
          'Unknown dataset. Use: organizations | invoices | subscriptions | payments',
        );
    }
  }
}

const PLATFORM_DATASET_LABELS: Record<string, string> = {
  organizations: 'Organizations',
  invoices: 'Invoices',
  subscriptions: 'Subscriptions',
  payments: 'Payments',
};
