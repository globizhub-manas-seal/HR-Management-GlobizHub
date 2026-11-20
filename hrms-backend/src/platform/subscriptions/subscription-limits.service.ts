import {
  ForbiddenException,
  HttpException,
  HttpStatus,
  Injectable,
  Logger,
} from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { PlatformSettingsService } from '../settings/platform-settings.service';

export interface SubscriptionUsageInfo {
  status: string;
  planCode: string | null;
  planName: string | null;
  maxUsers: number;
  activeUsers: number;
  isFreemium: boolean;
  isTrial: boolean;
  trialEndsAt: Date | null;
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

    // Lazy self-heal: expired trial behaves as freemium until cron transitions it
    let isTrial = status === 'TRIAL';
    if (isTrial && subscription?.trialEndsAt && subscription.trialEndsAt < now) {
      isTrial = false;
      status = 'ACTIVE';
      planCode = 'PLAN_FREE';
      maxUsers = config.freemiumMaxUsers;
    }

    const isFreemium = !isTrial && (planCode === 'PLAN_FREE' || status === 'EXPIRED' || status === 'CANCELLED');
    if (isFreemium) maxUsers = config.freemiumMaxUsers;

    const info: SubscriptionUsageInfo = {
      status,
      planCode,
      planName,
      maxUsers,
      activeUsers,
      isFreemium,
      isTrial,
      trialEndsAt: subscription?.trialEndsAt || null,
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

    if (info.isTrial) {
      // Trial orgs use the trial plan's employee quota (generous, time-boxed)
      if (info.activeUsers + count > info.maxUsers) {
        throw new HttpException(
          `Your plan allows up to ${info.maxUsers} users. You currently have ${info.activeUsers}. Remove inactive employees or upgrade your subscription to add more.`,
          HttpStatus.PAYMENT_REQUIRED,
        );
      }
      return info;
    }

    if (info.isFreemium) {
      const cap = config.freemiumMaxUsers;
      if (info.activeUsers + count > cap) {
        throw new HttpException(
          `The free plan is limited to ${cap} users with verified business emails. You currently have ${info.activeUsers} active users. Upgrade to a paid subscription for unlimited team growth, or remove exited members first.`,
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
   * Enforce business-email domain policy (freemium module requirement):
   * freemium organizations may only add users on verified business domains.
   */
  async assertEmailAllowedForOrg(companyId: string, email: string) {
    const info = await this.getUsageInfoFresh(companyId);
    const config = await this.settings.getConfig();
    if (!config.requireBusinessEmail) return;
    if (!info.isFreemium && info.status !== 'TRIAL') return;

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
