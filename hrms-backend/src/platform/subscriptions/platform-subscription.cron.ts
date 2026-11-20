import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { PrismaService } from '../../prisma/prisma.service';
import { PlatformSettingsService } from '../settings/platform-settings.service';

/**
 * Subscription lifecycle & metered billing cron.
 *
 * Model (all thresholds from SystemConfig — super-admin controlled):
 *  1. TRIAL (trialDays, default 7) expires  -> downgrade to PLAN_FREE (freemium,
 *     status ACTIVE, freemiumMaxUsers cap). Never locks the tenant out.
 *  2. Metered monthly invoicing: every ACTIVE paid subscription (plan is not
 *     PLAN_FREE) gets ONE invoice per calendar month for
 *     activeUsers x pricePerUserPerMonth, due invoiceDueDays later.
 *  3. Overdue invoices past gracePeriodDays flip the subscription to PAST_DUE
 *     (SubscriptionGuard locks non-billing endpoints). Payment restores ACTIVE.
 */
@Injectable()
export class PlatformSubscriptionCron {
  private readonly logger = new Logger(PlatformSubscriptionCron.name);
  private lastInvoiceMonthKey = ''; // guard against duplicate monthly runs

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
    await this.transitionExpiredTrials();
    await this.evaluatePastDue();
    await this.generateMonthlyInvoices();
    await this.refreshPaidPeriods();
  }

  /**
   * Legacy daily job retained for observability logging.
   */
  @Cron(CronExpression.EVERY_DAY_AT_MIDNIGHT)
  async handleDailyLifecycle() {
    this.logger.log('Running daily subscription lifecycle sweep...');
    await this.transitionExpiredTrials();
    await this.evaluatePastDue();
    await this.generateMonthlyInvoices();
  }

  private async transitionExpiredTrials() {
    const now = new Date();
    const config = await this.settings.getConfig();
    try {
      const expiredTrials = await this.prisma.subscription.findMany({
        where: { status: 'TRIAL', trialEndsAt: { lt: now } },
        select: { id: true, companyId: true },
      });
      if (expiredTrials.length === 0) return;

      const freePlan = await this.prisma.platformPlan.findFirst({
        where: { code: 'PLAN_FREE' },
        select: { id: true },
      });
      if (!freePlan) {
        this.logger.warn('PLAN_FREE missing; cannot downgrade expired trials.');
        return;
      }

      // Batched: ONE update + ONE audit insert + ONE notification insert,
      // regardless of how many trials expired (was 3 queries per trial).
      const periodEnd = new Date(now.getTime() + 30 * 86400000);
      await this.prisma.subscription.updateMany({
        where: { id: { in: expiredTrials.map((s) => s.id) } },
        data: {
          status: 'ACTIVE',
          planId: freePlan.id,
          billingCycle: 'MONTHLY',
          currentPeriodEnd: periodEnd,
        },
      });

      await this.prisma.platformAuditLog
        .createMany({
          data: expiredTrials.map((sub) => ({
            actorEmail: 'system@globizhr.saas',
            actorRole: 'SUPER_ADMIN',
            action: 'TRIAL_DOWNGRADED_TO_FREEMIUM',
            targetEntity: 'Subscription',
            targetId: sub.id,
            companyId: sub.companyId,
            reason: `Trial expired after ${config.trialDays} days; freemium limit is ${config.freemiumMaxUsers} users`,
            afterState: { planCode: 'PLAN_FREE', status: 'ACTIVE' },
          })),
        })
        .catch(() => {});

      // Notify company admins (single find + single createMany across ALL companies)
      await this.notifyCompaniesAdmins(
        expiredTrials.map((s) => s.companyId),
        'Your free trial has ended',
        `Your 7-day trial of GlobizHR is over. Your workspace is now on the Free plan (up to ${config.freemiumMaxUsers} users with verified business emails). Upgrade any time from Billing to unlock unlimited seats and invoiced monthly at ₹${config.pricePerUserPerMonth}/user/month.`,
      ).catch(() => {});
      this.logger.log(
        `Downgraded ${expiredTrials.length} expired trial(s) to freemium.`,
      );
    } catch (err: any) {
      this.logger.error(`Trial transition failed: ${err?.message}`);
    }
  }

  /**
   * Metered monthly invoices for paid subscriptions (annual contract term).
   * Idempotent: one invoice per subscription per (year, month) via
   * periodStart periodEnd range matching.
   */
  private async generateMonthlyInvoices() {
    try {
      const config = await this.settings.getConfig();
      const now = new Date();
      const periodStart = new Date(now.getFullYear(), now.getMonth(), 1);
      const periodEnd = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59);
      const dueDate = new Date(now.getTime() + config.invoiceDueDays * 86400000);

      const paidSubs = await this.prisma.subscription.findMany({
        where: {
          status: 'ACTIVE',
          // Paid plans only (freemium & trial plans are priced at 0)
          plan: { monthlyPrice: { gt: 0 } },
          OR: [
            { contractEndsAt: null },
            { contractEndsAt: { gte: now } },
          ],
        },
        select: {
          id: true,
          companyId: true,
          company: { select: { name: true } },
        },
      });
      if (paidSubs.length === 0) return;

      // ---- Batched idempotency check: ONE query instead of one findFirst per sub
      const existing = await this.prisma.invoice.findMany({
        where: {
          subscriptionId: { in: paidSubs.map((s) => s.id) },
          periodStart,
          status: { not: 'VOID' },
        },
        select: { subscriptionId: true },
      });
      const alreadyInvoiced = new Set(existing.map((e) => e.subscriptionId));
      const pending = paidSubs.filter((s) => !alreadyInvoiced.has(s.id));
      if (pending.length === 0) return;

      // ---- Batched usage counts: ONE groupBy instead of one count per company
      const counts = await this.prisma.employee.groupBy({
        by: ['companyId'],
        where: {
          companyId: { in: [...new Set(pending.map((s) => s.companyId))] },
          exitRecord: null,
        },
        _count: { _all: true },
      });
      const usageMap = new Map(counts.map((c) => [c.companyId, c._count._all]));

      // ---- Sequential invoice numbers from a single count
      const base = await this.prisma.invoice.count();
      const prefix = config.invoicePrefix || 'INV';
      const year = now.getFullYear();

      await this.prisma.invoice.createMany({
        data: pending.map((sub, i) => {
          const activeUsers = usageMap.get(sub.companyId) ?? 0;
          const billable = Math.max(config.minUsersPerInvoice, activeUsers);
          const amount = billable * config.pricePerUserPerMonth;
          return {
            invoiceNumber: `${prefix}-${year}-${String(base + i + 1).padStart(5, '0')}`,
            companyId: sub.companyId,
            subscriptionId: sub.id,
            amountDue: amount,
            currency: config.currency,
            status: 'ISSUED',
            dueDate,
            periodStart,
            periodEnd,
            perUserPrice: config.pricePerUserPerMonth,
            userCount: billable,
          };
        }),
      });

      // Re-fetch just-created rows (ids needed for audit + notifications)
      const created = await this.prisma.invoice.findMany({
        where: { subscriptionId: { in: pending.map((s) => s.id) }, periodStart },
        select: { id: true, invoiceNumber: true, companyId: true, userCount: true, amountDue: true },
      });

      await this.prisma.platformAuditLog
        .createMany({
          data: created.map((inv) => ({
            actorEmail: 'system@globizhr.saas',
            actorRole: 'SUPER_ADMIN',
            action: 'INVOICE_GENERATED',
            targetEntity: 'Invoice',
            targetId: inv.id,
            companyId: inv.companyId,
            afterState: {
              invoiceNumber: inv.invoiceNumber,
              amount: inv.amountDue,
              userCount: inv.userCount,
              perUserPrice: config.pricePerUserPerMonth,
            } as any,
          })),
        })
        .catch(() => {});

      // Grouped notification: one query for admins of ALL affected companies
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
        'Monthly invoice available',
        (companyId) => {
          const c = byCompany.get(companyId)!;
          return `Your monthly invoice for ${c.billable} active user(s) x ₹${config.pricePerUserPerMonth}/user is now available: ₹${c.amount}. Due ${dueDate.toDateString()}. Pay from Settings > Billing. Invoice no. ${c.invNumber}.`;
        },
      ).catch(() => {});

      this.logger.log(
        `Generated ${created.length} monthly invoice(s) for ${byCompany.size} company(ies).`,
      );
    } catch (err: any) {
      this.logger.error(`Monthly invoice generation failed: ${err?.message}`);
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
   * Keep currentPeriodEnd fresh for paid subscriptions (end of current month),
   * so legacy UI renewals display correctly.
   */
  private async refreshPaidPeriods() {
    try {
      const now = new Date();
      const monthEnd = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59);
      await this.prisma.subscription.updateMany({
        where: {
          status: 'ACTIVE',
          plan: { monthlyPrice: { gt: 0 } },
          currentPeriodEnd: { lt: monthEnd },
        },
        data: { currentPeriodEnd: monthEnd },
      });
    } catch (err: any) {
      this.logger.warn(`Period refresh failed: ${err?.message}`);
    }
  }

  private async nextInvoiceNumber(prefix: string): Promise<string> {
    const year = new Date().getFullYear();
    const count = await this.prisma.invoice.count();
    return `${prefix || 'INV'}-${year}-${(count + 1).toString().padStart(5, '0')}`;
  }

  /**
   * Notify all active admins (OWNER / SUPER_ADMIN / HR_HEAD) of a company.
   */
  private async notifyCompanyAdmins(
    companyId: string,
    title: string,
    message: string,
  ) {
    return this.notifyCompaniesAdmins([companyId], title, () => message);
  }

  /**
   * Batched variant: notify admins of MANY companies with 2 queries total
   * (one employee lookup + one createMany). `message` may be a function of
   * companyId so per-company content stays possible.
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
