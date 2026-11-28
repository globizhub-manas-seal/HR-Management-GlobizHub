import {
  ForbiddenException,
  HttpException,
  HttpStatus,
  Injectable,
  Logger,
} from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { PlatformSettingsService } from '../settings/platform-settings.service';
import { addMonths, remainingFraction } from '../../common/time';

export interface SubscriptionUsageInfo {
  status: string;
  planCode: string | null;
  planName: string | null;
  maxUsers: number;
  activeUsers: number;
  isFreemium: boolean;
  freemiumEndsAt: Date | null;
  contractEndsAt: Date | null;
}

/**
 * Central enforcement of user-count limits. Every user-creating flow
 * (invite, bulk import, registration wizard invites, candidate conversion)
 * MUST call assertCanAddUsers(). Limits live in SystemConfig + Plan rows —
 * nothing is hardcoded.
 */
@Injectable()
export class SubscriptionLimitsService {
  private readonly logger = new Logger(SubscriptionLimitsService.name);
  private readonly usageCache = new Map<
    string,
    { info: SubscriptionUsageInfo; at: number }
  >();
  private readonly CACHE_TTL_MS = 20_000;

  constructor(
    private prisma: PrismaService,
    private settings: PlatformSettingsService,
  ) {}

  invalidate(companyId?: string) {
    if (companyId) this.usageCache.delete(companyId);
    else this.usageCache.clear();
  }

  /**
   * Fresh read bypassing the cache — ALWAYS used by enforcement paths so a
   * plan change takes effect immediately.
   */
  async getUsageInfoFresh(companyId: string): Promise<SubscriptionUsageInfo> {
    this.usageCache.delete(companyId);
    return this.getUsageInfo(companyId);
  }

  /**
   * Resolve current subscription state + limits for a company.
   */
  async getUsageInfo(companyId: string): Promise<SubscriptionUsageInfo> {
    const cached = this.usageCache.get(companyId);
    if (cached && Date.now() - cached.at < this.CACHE_TTL_MS) return cached.info;

    const [subscription, activeUsers] = await Promise.all([
      this.prisma.subscription.findUnique({
        where: { companyId },
        include: { plan: { select: { code: true, name: true, maxEmployees: true } } },
      }),
      this.prisma.employee.count({
        where: { companyId, exitRecord: null },
      }),
    ]);

    const config = await this.settings.getConfig();
    const now = new Date();

    let status = subscription?.status || 'ACTIVE';
    let planCode = subscription?.plan?.code || null;
    const planName = subscription?.plan?.name || null;
    let maxUsers = subscription?.plan?.maxEmployees ?? config.maxUsersHardCap;

    const isFreemium =
      planCode === 'PLAN_FREE' ||
      status === 'EXPIRED' ||
      status === 'CANCELLED';
    if (isFreemium) maxUsers = config.freemiumMaxUsers;

    const info: SubscriptionUsageInfo = {
      status,
      planCode,
      planName,
      maxUsers,
      activeUsers,
      isFreemium,
      freemiumEndsAt: (subscription as any)?.freemiumEndsAt || null,
      contractEndsAt: subscription?.contractEndsAt || null,
    };
    this.usageCache.set(companyId, { info, at: Date.now() });
    return info;
  }

  /**
   * Throw a descriptive 402/403 when adding `count` users would breach a limit.
   */
  async assertCanAddUsers(companyId: string, count = 1) {
    // Fresh read (cache-bypassed) so plan changes apply immediately
    const info = await this.getUsageInfoFresh(companyId);
    const config = await this.settings.getConfig();

    // Hard platform-wide cap (super-admin controlled)
    if (info.activeUsers + count > config.maxUsersHardCap) {
      throw new HttpException(
        `Platform-wide seat limit (${config.maxUsersHardCap} users) reached. Contact support to raise your capacity.`,
        HttpStatus.PAYMENT_REQUIRED,
      );
    }

    if (info.isFreemium) {
      const cap = config.freemiumMaxUsers;
      if (info.activeUsers + count > cap) {
        throw new HttpException(
          `The free plan is limited to ${cap} users for ${config.freemiumMonths} month(s) with verified business emails. You currently have ${info.activeUsers} active users. Upgrade to a paid annual subscription for unlimited team growth, or remove exited members first.`,
          HttpStatus.PAYMENT_REQUIRED,
        );
      }
      return info;
    }

    // Paid plan: plan.maxEmployees (set by super admin in Plans console)
    if (info.activeUsers + count > info.maxUsers) {
      throw new HttpException(
        `Your "${info.planName}" plan includes ${info.maxUsers} seats and you currently have ${info.activeUsers} active users. Upgrade your seat capacity in Billing to continue.`,
        HttpStatus.PAYMENT_REQUIRED,
      );
    }
    return info;
  }

  /**
   * Bill new seats immediately on an ANNUAL basis from the day they are
   * added: a prorated invoice covers each new seat until the current annual
   * contract ends. Freemium/expired orgs are never charged here (their seat
   * cap is enforced by assertCanAddUsers).
   *
   * Fire-and-forget safe: callers invoke after the user row is created and
   * MUST NOT block or fail the user flow if billing fails (logged, notified).
   */
  async chargeNewSeats(companyId: string, count: number): Promise<void> {
    try {
      if (!count || count <= 0) return;
      const info = await this.getUsageInfoFresh(companyId);
      const config = await this.settings.getConfig();
      const now = new Date();

      // Only paid, active annual contracts get seat charges
      const isPaidContract =
        !info.isFreemium &&
        info.planCode !== 'PLAN_FREE' &&
        info.status === 'ACTIVE' &&
        info.contractEndsAt &&
        info.contractEndsAt > now;
      if (!isPaidContract) return;

      const sub = await this.prisma.subscription.findUnique({
        where: { companyId },
        select: { id: true, contractStartsAt: true, contractEndsAt: true },
      });
      if (!sub?.contractEndsAt || !sub.contractStartsAt) return;

      const termDays = Math.max(
        1,
        Math.round(
          (sub.contractEndsAt.getTime() - sub.contractStartsAt.getTime()) /
            86400000,
        ),
      );
      const frac = remainingFraction(now, sub.contractEndsAt, termDays);
      const annualPerSeat = config.pricePerUserPerMonth * config.contractMonths;
      const perSeat = Math.round(annualPerSeat * frac * 100) / 100;
      const amount = Math.round(perSeat * count * 100) / 100;
      if (amount <= 0) return;

      const year = now.getFullYear();
      const base = await this.prisma.invoice.count();
      const invoice = await this.prisma.invoice.create({
        data: {
          invoiceNumber: `${config.invoicePrefix}-${year}-${String(base + 1).padStart(5, '0')}`,
          companyId,
          subscriptionId: sub.id,
          amountDue: amount,
          currency: config.currency,
          status: 'ISSUED',
          dueDate: new Date(now.getTime() + config.invoiceDueDays * 86400000),
          periodStart: now,
          periodEnd: sub.contractEndsAt,
          perUserPrice: config.pricePerUserPerMonth,
          userCount: count,
        },
      });

      await this.prisma.platformAuditLog
        .create({
          data: {
            actorEmail: 'billing@globizhr.system',
            actorRole: 'SYSTEM',
            action: 'SEAT_INVOICE_ISSUED',
            targetEntity: 'Invoice',
            targetId: invoice.id,
            companyId,
            reason: `${count} new seat(s) added on annual contract`,
            afterState: {
              invoiceNumber: invoice.invoiceNumber,
              amount,
              seats: count,
              prorationDays: Math.round(frac * termDays),
            } as any,
          },
        })
        .catch(() => {});

      await this.notifyAdmins(
        companyId,
        `New seat${count > 1 ? 's' : ''} added — invoice issued`,
        `${count} new seat${count > 1 ? 's were' : ' was'} added to your annual contract. A prorated invoice ${invoice.invoiceNumber} for ${config.currency} ${amount} (covering ${Math.round(frac * termDays)} day(s) until ${sub.contractEndsAt.toDateString()}) is now due. Pay from Settings > Billing.`,
      ).catch(() => {});

      this.logger.log(
        `Seat invoice ${invoice.invoiceNumber} issued for company ${companyId}: ${count} seat(s), ${config.currency} ${amount}`,
      );
    } catch (err: any) {
      // Billing must never block the user-management flow
      this.logger.error(
        `Seat charge failed for company ${companyId}: ${err?.message}`,
      );
    }
  }

  private async notifyAdmins(
    companyId: string,
    title: string,
    message: string,
  ) {
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

  /**
   * Enforce business-email domain policy (freemium module requirement):
   * freemium organizations may only add users on verified business domains.
   */
  async assertEmailAllowedForOrg(companyId: string, email: string) {
    const info = await this.getUsageInfoFresh(companyId);
    const config = await this.settings.getConfig();
    if (!config.requireBusinessEmail) return;
    if (!info.isFreemium) return;

    if (await this.settings.isFreeEmailDomain(email)) {
      throw new ForbiddenException(
        'The free plan requires a verified business email (for example name@yourcompany.com). Personal email providers like Gmail, Yahoo or Outlook cannot be used here. Upgrade to a paid plan to allow any email domain.',
      );
    }
  }

  /**
   * Sanitize tenant-assigned roles — prevent privilege escalation through
   * invite/import payloads. SUPER_ADMIN/OWNER can never be assigned here.
   */
  sanitizeAssignableRole(role?: string | null): string {
    if (!role) return 'EMPLOYEE';
    const upper = String(role).toUpperCase().replace(/\s+/g, '_');
    if (['HR_HEAD', 'MANAGER', 'EMPLOYEE'].includes(upper)) return upper;
    return 'EMPLOYEE';
  }
}
