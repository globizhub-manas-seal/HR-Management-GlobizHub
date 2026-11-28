import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  HttpException,
  HttpStatus,
  Injectable,
  SetMetadata,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { JwtService } from '@nestjs/jwt';
import { PrismaService } from '../../../prisma/prisma.service';
import {
  FREEMIUM_CORE_MODULES,
  resolveModuleKey,
  UNGATED_PREFIXES,
} from '../module-registry';

export const REQUIRED_PLAN_MODULE_KEY = 'required_plan_module';
export const RequirePlanModule = (moduleKey: string) =>
  SetMetadata(REQUIRED_PLAN_MODULE_KEY, moduleKey);

export const SKIP_PLAN_MODULE_KEY = 'skip_plan_module_check';
export const SkipPlanModuleCheck = () =>
  SetMetadata(SKIP_PLAN_MODULE_KEY, true);

interface PlanModuleCacheEntry {
  /** moduleKey -> enabled? */
  modules: Map<string, boolean>;
  planName: string;
  planCode: string;
  isPaidPlan: boolean;
  at: number;
}

/**
 * GLOBAL plan-module enforcement guard.
 *
 * Runs for every request (registered as APP_GUARD right after the
 * SubscriptionGuard). The required module is derived from the request path
 * via the module registry, so every tenant controller is plan-gated with
 * zero per-controller code:
 *
 *  1. OrganizationFeatureOverride for the company (super-admin granted/
 *     revoked per organization) always wins.
 *  2. Explicit PlanEntitlement row for the company's plan (super-admin
 *     matrix: plan x module).
 *  3. Default: paid plans unlock everything; PLAN_FREE only unlocks the
 *     core freemium module set.
 *
 * Platform staff sessions bypass. Auth/notifications/support/billing stay
 * reachable (aligned with SubscriptionGuard so a locked account can still
 * reach the upgrade path).
 */
@Injectable()
export class ModuleEntitlementGuard implements CanActivate {
  private readonly cache = new Map<string, PlanModuleCacheEntry>();
  private readonly CACHE_TTL_MS = 15_000;

  constructor(
    private reflector: Reflector,
    private prisma: PrismaService,
    private jwtService: JwtService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    // Explicit controller/handler opt-out
    const skipped = this.reflector.getAllAndOverride<boolean>(
      SKIP_PLAN_MODULE_KEY,
      [context.getHandler(), context.getClass()],
    );
    if (skipped) return true;

    const request = context.switchToHttp().getRequest();
    const rawPath: string = request.originalUrl || request.url || '/';
    const path = rawPath.split('?')[0].replace(/^\/+/, '');

    // Never gate the platform admin surface, auth, uploads or careers
    if (!path || UNGATED_PREFIXES.some((p) => path === p || path.startsWith(p + '/'))) {
      return true;
    }

    // Decorator override wins over the route-derived module
    const overrideModule = this.reflector.getAllAndOverride<string>(
      REQUIRED_PLAN_MODULE_KEY,
      [context.getHandler(), context.getClass()],
    );
    const requiredModule = overrideModule || resolveModuleKey(path);
    if (!requiredModule) return true;

    // Identify the tenant session (global guard runs before controller
    // AuthGuards, so decode the JWT ourselves like SubscriptionGuard does)
    const [type, token] = request.headers.authorization?.split(' ') ?? [];
    if (type !== 'Bearer' || !token) return true; // AuthGuard rejects later
    let payload: any;
    try {
      payload = await this.jwtService.verifyAsync(token, {
        secret: process.env.JWT_SECRET,
      });
    } catch {
      return true; // invalid token -> AuthGuard will reject properly
    }

    if (payload?.isPlatform || payload?.isSupportDiagnosticSession) return true;
    const companyId = payload?.companyId;
    if (!companyId) return true;

    const plan = await this.resolvePlanState(companyId);

    // Legacy tenant without a plan/entitlement configuration: allow
    if (!plan) return true;

    const enabled = plan.modules.get(requiredModule);
    if (enabled === undefined || enabled) return true;

    throw new HttpException(
      {
        statusCode: HttpStatus.FORBIDDEN,
        error: 'MODULE_NOT_INCLUDED',
        moduleKey: requiredModule,
        plan: plan.planName,
        message: `The "${requiredModule}" module is not included in your ${plan.planName} plan. Upgrade your subscription to unlock it.`,
        upgradeUrl: '/workspace/billing',
      },
      HttpStatus.FORBIDDEN,
    );
  }

  /**
   * Effective module availability for a company:
   * overrides > plan entitlements > plan-tier defaults. Cached 15s.
   */
  private async resolvePlanState(
    companyId: string,
  ): Promise<PlanModuleCacheEntry | null> {
    const cached = this.cache.get(companyId);
    if (cached && Date.now() - cached.at < this.CACHE_TTL_MS) return cached;

    const subscription = await this.prisma.subscription.findUnique({
      where: { companyId },
      include: {
        plan: { include: { entitlements: true } },
      },
    });
    if (!subscription || !subscription.plan) return null;

    const overrides = await this.prisma.organizationFeatureOverride.findMany({
      where: { companyId },
      select: { moduleKey: true, isEnabled: true },
    });
    const overrideMap = new Map(
      overrides.map((o) => [o.moduleKey.toLowerCase(), o.isEnabled]),
    );

    const entitlementMap = new Map<string, boolean>();
    for (const e of subscription.plan.entitlements ?? []) {
      entitlementMap.set(e.moduleKey.toLowerCase(), e.isEnabled);
    }

    // Plans with zero entitlement rows (legacy data): keep everything open
    const planHasMatrix = entitlementMap.size > 0;
    const isPaidPlan = Number(subscription.plan.monthlyPrice) > 0;

    const modules = new Map<string, boolean>();
    for (const key of new Set([
      ...overrideMap.keys(),
      ...entitlementMap.keys(),
      ...FREEMIUM_CORE_MODULES,
    ])) {
      if (overrideMap.has(key)) {
        modules.set(key, overrideMap.get(key)!);
        continue;
      }
      if (entitlementMap.has(key)) {
        modules.set(key, entitlementMap.get(key)!);
        continue;
      }
      // No explicit row: paid plans unlock everything, freemium only core
      modules.set(
        key,
        planHasMatrix ? false : isPaidPlan || FREEMIUM_CORE_MODULES.has(key),
      );
    }

    // Modules the plan matrix or defaults do not know about stay open for
    // paid plans and core-listed ones for freemium (safe default).
    const entry: PlanModuleCacheEntry = {
      modules,
      planName: subscription.plan.name,
      planCode: subscription.plan.code,
      isPaidPlan,
      at: Date.now(),
    };
    this.cache.set(companyId, entry);
    return entry;
  }

  invalidate(companyId?: string) {
    if (companyId) this.cache.delete(companyId);
    else this.cache.clear();
  }
}

// Re-export ForbiddenException for consumers that want to raise module
// errors manually (kept for backwards compatibility with older imports).
export { ForbiddenException };
