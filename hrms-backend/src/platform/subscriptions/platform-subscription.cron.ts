import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { PrismaService } from '../../prisma/prisma.service';
import { PlatformSettingsService } from '../settings/platform-settings.service';
import { computeGst } from '../../common/gst';
import { addMonths } from '../../common/time';

/**
 * Subscription lifecycle & ANNUAL billing cron.
 *
 * Model (all thresholds from SystemConfig — super-admin controlled):
 *  1. Freemium: new companies start on PLAN_FREE with `freemiumMaxUsers` seats
 *     for `freemiumMonths` months (default 5 users / 3 months). When the free
 *     period ends the workspace locks to billing endpoints until they upgrade.
 *  2. Annual billing: upgrade = ONE invoice for
 *        activeUsers x pricePerUserPerMonth x contractMonths
 *     covering the full contract term. Seats added mid-term are invoiced
 *     prorated from their add date until contract end (see
 *     SubscriptionLimitsService.chargeNewSeats).
 *  3. Renewal: `renewalLeadDays` before contract end, ONE renewal invoice for
 *     the next term is issued; paying it extends the contract.
 *  4. Overdue invoices past gracePeriodDays flip the subscription to PAST_DUE
 *     (SubscriptionGuard locks non-billing endpoints). Payment restores ACTIVE.
 */
@Injectable()
export class PlatformSubscriptionCron {
  private readonly logger = new Logger(PlatformSubscriptionCron.name);

  constructor(
    private prisma: PrismaService,
    private settings: PlatformSettingsService,
  ) {}

  /**
   * Runs every 5 minutes: cheap, idempotent transitions so the sandbox demo
   * and short-lived deployments still progress the lifecycle.
   */
  @Cron(CronExpression.EVERY_5_MINUTES)
  async handleSubscriptionLifecycle() {
    await this.expireFreemiumAccounts();
    await this.evaluatePastDue();
    await this.generateRenewalInvoices();
    await this.refreshPaidPeriods();
  }

  /**
   * Legacy daily job retained for observability logging.
   */
  @Cron(CronExpression.EVERY_DAY_AT_MIDNIGHT)
  async handleDailyLifecycle() {
    this.logger.log('Running daily subscription lifecycle sweep...');
    await this.expireFreemiumAccounts();
    await this.evaluatePastDue();
    await this.generateRenewalInvoices();
  }

  /**
   * Freemium expiry: PLAN_FREE accounts whose freemiumEndsAt has passed flip
   * to EXPIRED (guard locks everything except billing until they upgrade).
   */
  private async expireFreemiumAccounts() {
    const now = new Date();
    try {
      const expired = await this.prisma.subscription.findMany({
        where: {
          status: 'ACTIVE',
          freemiumEndsAt: { lt: now },
          plan: { code: 'PLAN_FREE' },
        },
        select: { id: true, companyId: true, freemiumEndsAt: true },
      });
      if (expired.length === 0) return;

      const config = await this.settings.getConfig();

      await this.prisma.subscription.updateMany({
        where: { id: { in: expired.map((s) => s.id) } },
        data: { status: 'EXPIRED' },
      });

      await this.prisma.platformAuditLog
        .createMany({
          data: expired.map((sub) => ({
            actorEmail: 'system@globizhr.saas',
            actorRole: 'SUPER_ADMIN',
            action: 'FREEMIUM_EXPIRED',
            targetEntity: 'Subscription',
            targetId: sub.id,
            companyId: sub.companyId,
            reason: `Free period (${config.freemiumMonths} months, ${config.freemiumMaxUsers} users) ended`,
            afterState: { planCode: 'PLAN_FREE', status: 'EXPIRED' },
          })),
        })
        .catch(() => {});

      await this.notifyCompaniesAdmins(
        expired.map((s) => s.companyId),
        'Your free period has ended',
        (companyId) =>
          `Your ${config.freemiumMonths}-month free period of GlobizHR has ended. Your workspace is locked until you upgrade. Continue on the paid annual plan (${config.currency} ${config.pricePerUserPerMonth}/user/month, billed annually at ${config.currency} ${config.pricePerUserPerMonth * config.contractMonths}/user) from Settings > Billing.`,
      ).catch(() => {});

      this.logger.log(
        `Locked ${expired.length} freemium account(s) whose free period ended.`,
      );
    } catch (err: any) {
      this.logger.error(`Freemium expiry sweep failed: ${err?.message}`);
    }
  }

  /**
   * Annual renewal invoices: `renewalLeadDays` before contract end, issue ONE
   * renewal invoice for the NEXT contract term (idempotent via periodStart ==
   * current contractEndsAt).
   */
  private async generateRenewalInvoices() {
    try {
      const config = await this.settings.getConfig();
      const now = new Date();
      const leadCutoff = new Date(
        now.getTime() + config.renewalLeadDays * 86400000,
      );

      const dueForRenewal = await this.prisma.subscription.findMany({
        where: {
          status: 'ACTIVE',
          contractEndsAt: { lte: leadCutoff, gte: now },
          plan: { code: { not: 'PLAN_FREE' }, monthlyPrice: { gt: 0 } },
        },
        select: {
          id: true,
          companyId: true,
          contractEndsAt: true,
          company: { select: { name: true, state: true, gstin: true } },
        },
      });
      if (dueForRenewal.length === 0) return;

      // Idempotency: one query for existing renewal invoices (periodStart on
      // or after the current contract end = renewal for the next term)
      const existing = await this.prisma.invoice.findMany({
        where: {
          subscriptionId: { in: dueForRenewal.map((s) => s.id) },
          status: { not: 'VOID' },
          periodStart: {
            gte: new Date(
              Math.min(...dueForRenewal.map((s) => s.contractEndsAt!.getTime())),
            ),
          },
        },
        select: { subscriptionId: true, periodStart: true },
      });
      const alreadyRenewing = new Set(
        existing
          .filter((e) => {
            if (!e.periodStart) return false;
            const sub = dueForRenewal.find((s) => s.id === e.subscriptionId);
            return (
              sub && e.periodStart.getTime() >= sub.contractEndsAt!.getTime()
            );
          })
          .map((e) => e.subscriptionId),
      );
      const pending = dueForRenewal.filter((s) => !alreadyRenewing.has(s.id));
      if (pending.length === 0) return;

      // ONE groupBy for active-user counts across all pending companies
      const counts = await this.prisma.employee.groupBy({
        by: ['companyId'],
        where: {
          companyId: { in: [...new Set(pending.map((s) => s.companyId))] },
          exitRecord: null,
        },
        _count: { _all: true },
      });
      const usageMap = new Map(counts.map((c) => [c.companyId, c._count._all]));

      const prefix = config.invoicePrefix || 'INV';
      const year = now.getFullYear();

      // Sequence base: MAX existing invoice number for this year (collision
      // safe even after voided invoices) — createMany assigns base+1..+N.
      const yearPrefix = `${prefix}-${year}-`;
      const lastInvoice = await this.prisma.invoice.findFirst({
        where: { invoiceNumber: { startsWith: yearPrefix } },
        orderBy: { invoiceNumber: 'desc' },
        select: { invoiceNumber: true },
      });
      const baseCount = lastInvoice
        ? parseInt(lastInvoice.invoiceNumber.split('-').pop() ?? '0', 10)
        : 0;
      const usedNumbers = new Set<string>();

      const rows: any[] = pending.map((sub, i) => {
        const activeUsers = usageMap.get(sub.companyId) ?? 0;
        const billable = Math.max(config.minUsersPerInvoice, activeUsers);
        const base =
          billable * config.pricePerUserPerMonth * config.contractMonths;
        const gst = computeGst(
          base,
          config.gstPercent,
          sub.company?.state,
          config.sellerState,
          config.gstEnabled,
        );
        const amount = Math.round((base + gst.taxAmount) * 100) / 100;
        const nextStart = sub.contractEndsAt!;
        const nextEnd = addMonths(nextStart, config.contractMonths);
        const invoiceNumber = `${prefix}-${year}-${String(baseCount + i + 1).padStart(5, '0')}`;
        if (usedNumbers.has(invoiceNumber)) {
          this.logger.warn(
            `Skipping renewal invoice with duplicate number ${invoiceNumber} (will be retried next sweep)`,
          );
          return null;
        }
        usedNumbers.add(invoiceNumber);
        return {
          invoiceNumber: `${prefix}-${year}-${String(baseCount + i + 1).padStart(5, '0')}`,
          companyId: sub.companyId,
          subscriptionId: sub.id,
          amountDue: amount,
          currency: config.currency,
          status: 'ISSUED',
          dueDate: new Date(now.getTime() + config.invoiceDueDays * 86400000),
          periodStart: nextStart,
          periodEnd: nextEnd,
          perUserPrice: config.pricePerUserPerMonth,
          userCount: billable,
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
          buyerGstin: sub.company?.gstin ?? null,
          sacCode: config.invoiceSacCode,
          notes: config.invoiceNotes ?? null,
        };
      });

      const validRows = rows.filter((r): r is any => r !== null);
      if (validRows.length === 0) return;
      await this.prisma.invoice.createMany({ data: validRows });

      // Re-fetch created rows for audit + per-company notifications
      const created = await this.prisma.invoice.findMany({
        where: {
          subscriptionId: { in: pending.map((s) => s.id) },
          periodStart: { in: pending.map((s) => s.contractEndsAt!) },
        },
        select: {
          id: true,
          invoiceNumber: true,
          companyId: true,
          userCount: true,
          amountDue: true,
        },
      });

      await this.prisma.platformAuditLog
        .createMany({
          data: created.map((inv) => ({
            actorEmail: 'system@globizhr.saas',
            actorRole: 'SUPER_ADMIN',
            action: 'ANNUAL_RENEWAL_INVOICE_ISSUED',
            targetEntity: 'Invoice',
            targetId: inv.id,
            companyId: inv.companyId,
            afterState: {
              invoiceNumber: inv.invoiceNumber,
              amount: inv.amountDue,
              userCount: inv.userCount,
              perUserPrice: config.pricePerUserPerMonth,
              contractMonths: config.contractMonths,
            } as any,
          })),
        })
        .catch(() => {});

      const byCompany = new Map<string, { invNumber: string; billable: number; amount: number }>();
      for (const inv of created) {
        byCompany.set(inv.companyId, {
          invNumber: inv.invoiceNumber,
          billable: Number(inv.userCount),
          amount: Number(inv.amountDue),
        });
      }
      await this.notifyCompaniesAdmins(
        [...byCompany.keys()],
        'Annual renewal invoice available',
        (companyId) => {
          const c = byCompany.get(companyId)!;
          return `Your annual renewal invoice for ${c.billable} active user(s) x ${config.currency} ${config.pricePerUserPerMonth}/month x ${config.contractMonths} months is now available: ${config.currency} ${c.amount} (invoice ${c.invNumber}). Due ${new Date(now.getTime() + config.invoiceDueDays * 86400000).toDateString()}. Pay from Settings > Billing to keep your workspace active.`;
        },
      ).catch(() => {});

      this.logger.log(
        `Issued ${created.length} annual renewal invoice(s) for ${byCompany.size} company(ies).`,
      );
    } catch (err: any) {
      this.logger.error(`Renewal invoice generation failed: ${err?.message}`);
    }
  }

  /**
   * Flip ACTIVE -> PAST_DUE when an invoice is overdue beyond the grace
   * window; PAST_DUE -> ACTIVE when everything is settled.
   */
  private async evaluatePastDue() {
    const now = new Date();
    const config = await this.settings.getConfig();

    try {
      // Overdue = unpaid invoices past due + grace. Filtered in SQL via the
      // [subscriptionId, periodStart, status] / [companyId, status, dueDate]
      // indexes instead of loading every ISSUED invoice into memory.
      const graceDeadline = new Date(
        now.getTime() - config.gracePeriodDays * 86400000,
      );
      const overdueInvoices = await this.prisma.invoice.findMany({
        where: { status: 'ISSUED', dueDate: { lt: graceDeadline } },
        select: {
          id: true,
          invoiceNumber: true,
          subscriptionId: true,
          companyId: true,
        },
      });

      if (overdueInvoices.length > 0) {
        const subIds = [
          ...new Set(
            overdueInvoices
              .map((i) => i.subscriptionId)
              .filter((v): v is string => !!v),
          ),
        ];
        // Only flip subscriptions that are currently ACTIVE (idempotent)
        const activeSubs = await this.prisma.subscription.findMany({
          where: { id: { in: subIds }, status: 'ACTIVE' },
          select: { id: true },
        });
        const flipIds = new Set(activeSubs.map((s) => s.id));

        if (flipIds.size > 0) {
          await this.prisma.subscription.updateMany({
            where: { id: { in: [...flipIds] } },
            data: { status: 'PAST_DUE' },
          });
          await this.prisma.platformAuditLog
            .createMany({
              data: overdueInvoices
                .filter(
                  (inv) => inv.subscriptionId && flipIds.has(inv.subscriptionId),
                )
                .map((inv) => ({
                  actorEmail: 'system@globizhr.saas',
                  actorRole: 'SUPER_ADMIN',
                  action: 'SUBSCRIPTION_PAST_DUE',
                  targetEntity: 'Subscription',
                  targetId: inv.subscriptionId!,
                  companyId: inv.companyId,
                  reason: `Invoice ${inv.invoiceNumber} overdue beyond ${config.gracePeriodDays}-day grace`,
                })),
            })
            .catch(() => {});
        }
      }

      // Restore ACTIVE when nothing is overdue anymore — ONE groupBy
      // instead of one count query per PAST_DUE subscription.
      const pastDueSubs = await this.prisma.subscription.findMany({
        where: { status: 'PAST_DUE' },
        select: { id: true },
      });
      if (pastDueSubs.length > 0) {
        const ids = pastDueSubs.map((s) => s.id);
        const stillIssued = await this.prisma.invoice.groupBy({
          by: ['subscriptionId'],
          where: { subscriptionId: { in: ids }, status: 'ISSUED' },
        });
        const blocked = new Set(
          stillIssued
            .map((g) => g.subscriptionId)
            .filter((v): v is string => !!v),
        );
        const toRestore = pastDueSubs
          .filter((s) => !blocked.has(s.id))
          .map((s) => s.id);
        if (toRestore.length > 0) {
          await this.prisma.subscription.updateMany({
            where: { id: { in: toRestore } },
            data: { status: 'ACTIVE' },
          });
        }
      }
    } catch (err: any) {
      this.logger.error(`Past-due evaluation failed: ${err?.message}`);
    }
  }

  /**
   * Keep currentPeriodEnd aligned with the contract term for paid
   * subscriptions so legacy UI displays correctly. Single SQL statement —
   * no per-subscription loop.
   */
  private async refreshPaidPeriods() {
    try {
      await this.prisma.$executeRaw`
        UPDATE "Subscription"
        SET "currentPeriodEnd" = "contractEndsAt", "updatedAt" = NOW()
        WHERE "status" = 'ACTIVE'
          AND "contractEndsAt" IS NOT NULL
          AND "currentPeriodEnd" IS DISTINCT FROM "contractEndsAt"
      `;
    } catch (err: any) {
      this.logger.warn(`Period refresh failed: ${err?.message}`);
    }
  }

  /**
   * Notify admins of MANY companies with 2 queries total (one employee
   * lookup + one createMany). `message` may be a function of companyId so
   * per-company content stays possible.
   */
  private async notifyCompaniesAdmins(
    companyIds: string[],
    title: string,
    message: string | ((companyId: string) => string),
  ) {
    const unique = [...new Set(companyIds)];
    if (unique.length === 0) return;
    const admins = await this.prisma.employee.findMany({
      where: {
        companyId: { in: unique },
        exitRecord: null,
        role: { in: ['OWNER', 'SUPER_ADMIN', 'HR_HEAD'] },
        inviteToken: null,
      },
      select: { id: true, companyId: true },
    });
    if (admins.length === 0) return;
    await this.prisma.notification.createMany({
      data: admins.map((a) => ({
        companyId: a.companyId,
        userId: a.id,
        title,
        message: typeof message === 'function' ? message(a.companyId) : message,
        type: 'BILLING',
      })),
    });
  }
}
