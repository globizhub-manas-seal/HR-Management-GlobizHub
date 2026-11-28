import {
  CanActivate,
  ExecutionContext,
  Injectable,
  ForbiddenException,
  SetMetadata,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { PrismaService } from '../../prisma/prisma.service';
import { SubscriptionLimitsService } from '../../platform/subscriptions/subscription-limits.service';

export enum PayrollFeatureTier {
  STARTER = 'NORMAL', // Salary calculation + Payslips
  GROWTH = 'PRO', // + Statutory Returns (EPFO, ESIC, PT, TDS)
  ENTERPRISE = 'ENTERPRISE', // + Accounting JV, Form 24Q, Form 16/16A, Multi-branch, Custom Cut-offs, Arrears
}

export const PAYROLL_TIER_KEY = 'payroll_feature_tier';
export const RequirePayrollTier = (minTier: PayrollFeatureTier) =>
  SetMetadata(PAYROLL_TIER_KEY, minTier);

/**
 * Plan tier weights — derived from the ACTIVE subscription, never from the
 * legacy company.subscription enum. Trial orgs preview everything; freemium
 * orgs keep the starter payroll feature set; paid plans unlock higher tiers
 * via their plan code (all plan rows are managed by the super admin).
 */
const PLAN_WEIGHTS: Record<string, number> = {
  PLAN_FREE: 1,
  PLAN_STARTER: 1,
  PLAN_PRO: 2,
  PLAN_ENTERPRISE: 3,
};

const TIER_WEIGHTS: Record<string, number> = {
  NORMAL: 1,
  PRO: 2,
  ENTERPRISE: 3,
};

@Injectable()
export class PayrollTierGuard implements CanActivate {
  constructor(
    private readonly reflector: Reflector,
    private readonly prisma: PrismaService,
    private readonly limits: SubscriptionLimitsService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const requiredTier = this.reflector.getAllAndOverride<PayrollFeatureTier>(
      PAYROLL_TIER_KEY,
      [context.getHandler(), context.getClass()],
    );

    if (!requiredTier) {
      return true; // No tier restriction on this endpoint
    }

    const request = context.switchToHttp().getRequest();
    const user = request.user;

    // Platform Super Admin and Platform service tokens bypass tier restrictions
    if (user?.isPlatform || user?.role === 'SUPER_ADMIN') {
      return true;
    }

    const companyId = user?.companyId;
    if (!companyId) {
      throw new ForbiddenException(
        'Tenant company context required for plan entitlement validation',
      );
    }

    const usage = await this.limits.getUsageInfo(companyId);
    const subscription = await this.prisma.subscription.findUnique({
      where: { companyId },
      include: { plan: { select: { code: true } } },
    });

    // Weight comes from the plan code only (no trial concept: freemium gets
    // its own plan weight; paid plans unlock higher tiers)
    void usage;
    const planCode = subscription?.plan?.code || 'PLAN_FREE';
    const currentWeight = PLAN_WEIGHTS[planCode] ?? 1;
    const requiredWeight = TIER_WEIGHTS[requiredTier] ?? 1;

    if (currentWeight < requiredWeight) {
      const planName =
        requiredTier === PayrollFeatureTier.ENTERPRISE
          ? 'Enterprise'
          : requiredTier === PayrollFeatureTier.GROWTH
            ? 'Growth (Pro)'
            : 'Starter';

      throw new ForbiddenException(
        `This feature requires the ${planName} Plan. Please upgrade your subscription to unlock this feature.`,
      );
    }

    return true;
  }
}
