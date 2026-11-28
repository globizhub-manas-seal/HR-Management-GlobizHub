import {
  Injectable,
  NotFoundException,
  ConflictException,
  Logger,
  OnModuleInit,
} from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { PlatformSettingsService } from '../settings/platform-settings.service';
import { CreatePlanDto } from './dto/create-plan.dto';
import { UpdatePlanDto } from './dto/update-plan.dto';
import { UpdateEntitlementsDto } from './dto/update-entitlements.dto';
import { AssignSubscriptionDto } from './dto/assign-subscription.dto';
import { addMonths } from '../../common/time';

export const ALL_HRMS_MODULES = [
  {
    key: 'employees',
    name: 'Employee Directory & Profiles',
    description: 'Core staff directory, records & custom fields',
  },
  {
    key: 'attendance',
    name: 'Attendance & Clock-In',
    description: 'Web, mobile GPS, geo-fencing & shift rosters',
  },
  {
    key: 'leave',
    name: 'Leave Management',
    description: 'Leave requests, quota balance & approval workflows',
  },
  {
    key: 'documents',
    name: 'Document Management',
    description: 'E-signatures, contracts, letters & certificates',
  },
  {
    key: 'tasks',
    name: 'Tasks & Checklists',
    description: 'Departmental assignments & due dates',
  },
  {
    key: 'announcements',
    name: 'Company Announcements',
    description: 'Broadcast notices, bulletin boards & alerts',
  },
  {
    key: 'payroll',
    name: 'Payroll & Compensation',
    description: 'Salary structures, monthly pay runs, deductions & payslips',
  },
  {
    key: 'recruitment',
    name: 'Recruitment & ATS',
    description: 'Requisitions, candidate pipelines, scorecards & offers',
  },
  {
    key: 'training',
    name: 'Training & Development',
    description: 'Universal training plans, competencies & assessments',
  },
  {
    key: 'analytics',
    name: 'Advanced Reporting & Analytics',
    description: 'Executive dashboards, churn, turnover & heatmaps',
  },
];

@Injectable()
export class PlatformSubscriptionService implements OnModuleInit {
  private readonly logger = new Logger(PlatformSubscriptionService.name);

  constructor(
    private prisma: PrismaService,
    private settings: PlatformSettingsService,
  ) {}

  async onModuleInit() {
    await this.seedDefaultPlans();
    await this.backfillMissingSubscriptions();
  }

  /**
   * Seed default SaaS tiers with entitlements if database is empty
   */
  async seedDefaultPlans() {
    try {
      const planCount = await this.prisma.platformPlan.count();
      if (planCount > 0) return;

      this.logger.log(
        'Seeding default Platform Subscription Plans & Entitlements...',
      );

      const allModuleKeys = ALL_HRMS_MODULES.map((m) => m.key);
      const coreModuleKeys = [
        'employees',
        'attendance',
        'leave',
        'documents',
        'tasks',
        'announcements',
      ];

      const defaultTiers = [
        {
          name: 'Freemium',
          code: 'PLAN_FREE',
          description:
            'Free account: up to the platform-configured user cap (default 5) with verified business emails, for the platform-configured duration (default 3 months).',
          monthlyPrice: 0,
          annualPrice: 0,
          maxEmployees: 5,
          maxStorageGb: 2,
          trialDays: 0,
          isPublic: true,
          enabledModules: allModuleKeys,
        },
        {
          name: 'Pay As You Grow',
          code: 'PLAN_STARTER',
          description:
            'Per-user pricing (price/user/month configured by the platform, default Rs.49) billed annually — ₹588/user/year. Seats added mid-term are invoiced prorated until contract end.',
          monthlyPrice: 49,
          annualPrice: 588,
          maxEmployees: 10000,
          maxStorageGb: 10,
          trialDays: 0,
          isPublic: true,
          enabledModules: allModuleKeys,
        },
        {
          name: 'Professional Tier',
          code: 'PLAN_PRO',
          description:
            'Legacy tiered plan (kept for enterprise feature gating).',
          monthlyPrice: 4999,
          annualPrice: 49990,
          maxEmployees: 200,
          maxStorageGb: 25,
          trialDays: 0,
          isPublic: true,
          enabledModules: allModuleKeys,
        },
        {
          name: 'Enterprise Tier',
          code: 'PLAN_ENTERPRISE',
          description:
            'High-scale multi-branch organization tier with dedicated limits and custom overrides.',
          monthlyPrice: 14999,
          annualPrice: 149990,
          maxEmployees: 1000,
          maxStorageGb: 100,
          trialDays: 0,
          isPublic: true,
          enabledModules: allModuleKeys,
        },
      ];

      for (const tier of defaultTiers) {
        const plan = await this.prisma.platformPlan.create({
          data: {
            name: tier.name,
            code: tier.code,
            description: tier.description,
            monthlyPrice: tier.monthlyPrice,
            annualPrice: tier.annualPrice,
            maxEmployees: tier.maxEmployees,
            maxStorageGb: tier.maxStorageGb,
            trialDays: tier.trialDays,
            isPublic: tier.isPublic,
          },
        });

        // Seed entitlements
        for (const mod of ALL_HRMS_MODULES) {
          await this.prisma.planEntitlement.create({
            data: {
              planId: plan.id,
              moduleKey: mod.key,
              isEnabled: tier.enabledModules.includes(mod.key),
            },
          });
        }
      }

      this.logger.log('Default subscription tiers seeded successfully.');
    } catch (err: any) {
      this.logger.warn(
        `Could not seed default subscription tiers: ${err.message}`,
      );
    }
  }

  /**
   * Backfill missing subscriptions for any existing companies
   */
  async backfillMissingSubscriptions() {
    try {
      // ── Legacy repair (pre-freemium rows): subscriptions created while
      // trialEndsAt existed. Once that column is dropped they are left with
      // no window at all — assign the configured free months so nothing is
      // silently locked after a schema sync on an existing database.
      const legacySubs = await this.prisma.subscription.findMany({
        where: { freemiumEndsAt: null },
        select: { id: true, startDate: true },
      });
      if (legacySubs.length > 0) {
        const config = await this.settings.getConfig();
        const months = config.freemiumMonths || 3;
        const now = Date.now();
        for (const sub of legacySubs) {
          const end = addMonths(sub.startDate || new Date(), months);
          await this.prisma.subscription.update({
            where: { id: sub.id },
            data: {
              freemiumEndsAt: end,
              currentPeriodEnd: end,
              status: end.getTime() < now ? 'EXPIRED' : 'ACTIVE',
            },
          });
        }
        this.logger.log(
          `Repaired ${legacySubs.length} legacy subscription(s): freemium window assigned.`,
        );
      }

      const companiesWithoutSub = await this.prisma.company.findMany({
        where: {
          subscriptions: {
            none: {},
          },
        },
        select: { id: true, name: true, createdAt: true, subscription: true },
      });

      if (companiesWithoutSub.length === 0) return;

      this.logger.log(
        `Found ${companiesWithoutSub.length} companies without active Subscription records. Auto-provisioning...`,
      );

      const freePlan =
        (await this.prisma.platformPlan.findFirst({
          where: { code: 'PLAN_FREE' },
        })) ||
        (await this.prisma.platformPlan.findFirst({
          where: { isActive: true },
          orderBy: { monthlyPrice: 'asc' },
        }));

      if (!freePlan) return;

      const config = await this.settings.getConfig();

      for (const comp of companiesWithoutSub) {
        const start = comp.createdAt || new Date();
        const freemiumEndsAt = addMonths(
          start,
          config.freemiumMonths || 3,
        );
        const isPast = freemiumEndsAt.getTime() < Date.now();

        await this.prisma.subscription.create({
          data: {
            companyId: comp.id,
            planId: freePlan.id,
            billingCycle: 'ANNUAL',
            // Already-past backfills land directly on freemium-expired
            status: isPast ? 'EXPIRED' : 'ACTIVE',
            startDate: start,
            freemiumEndsAt,
            currentPeriodEnd: freemiumEndsAt,
          },
        });
      }

      this.logger.log(
        `Successfully provisioned subscriptions for ${companiesWithoutSub.length} companies.`,
      );
    } catch (err: any) {
      this.logger.warn(
        `Could not backfill missing subscriptions: ${err.message}`,
      );
    }
  }

  /**
   * List all subscription plans with entitlements & subscriber counts
   */
  async getAllPlans() {
    return this.prisma.platformPlan.findMany({
      orderBy: { monthlyPrice: 'asc' },
      include: {
        entitlements: true,
        _count: { select: { subscriptions: true } },
      },
    });
  }

  /**
   * Get single plan by ID
   */
  async getPlanById(id: string) {
    const plan = await this.prisma.platformPlan.findUnique({
      where: { id },
      include: {
        entitlements: true,
        _count: { select: { subscriptions: true } },
      },
    });
    if (!plan) throw new NotFoundException('Subscription plan not found');
    return plan;
  }

  /**
   * Create a new subscription plan tier
   */
  async createPlan(dto: CreatePlanDto, actorId?: string, actorEmail?: string) {
    const existing = await this.prisma.platformPlan.findFirst({
      where: {
        OR: [
          { code: dto.code.trim().toUpperCase() },
          { name: dto.name.trim() },
        ],
      },
    });
    if (existing) {
      throw new ConflictException(
        'A subscription plan with this code or name already exists',
      );
    }

    const plan = await this.prisma.platformPlan.create({
      data: {
        name: dto.name.trim(),
        code: dto.code.trim().toUpperCase(),
        description: dto.description,
        monthlyPrice: dto.monthlyPrice,
        annualPrice: dto.annualPrice,
        currency: dto.currency || 'INR',
        maxEmployees: dto.maxEmployees,
        maxStorageGb: dto.maxStorageGb || 5,
        trialDays: dto.trialDays !== undefined ? dto.trialDays : 14,
        isPublic: dto.isPublic !== undefined ? dto.isPublic : true,
      },
    });

    // Populate all known modules into PlanEntitlement
    for (const mod of ALL_HRMS_MODULES) {
      await this.prisma.planEntitlement.create({
        data: {
          planId: plan.id,
          moduleKey: mod.key,
          isEnabled: true,
        },
      });
    }

    if (actorId && actorEmail) {
      this.prisma.platformAuditLog
        .create({
          data: {
            actorId,
            actorEmail,
            actorRole: 'SUPER_ADMIN',
            action: 'PLAN_CREATE',
            targetEntity: 'PlatformPlan',
            targetId: plan.id,
            afterState: plan as any,
          },
        })
        .catch((err) =>
          this.logger.error('Failed to log plan creation audit', err),
        );
    }

    return this.getPlanById(plan.id);
  }

  /**
   * Update plan pricing, employee quotas, or trial duration
   */
  async updatePlan(
    id: string,
    dto: UpdatePlanDto,
    actorId?: string,
    actorEmail?: string,
  ) {
    const plan = await this.prisma.platformPlan.findUnique({ where: { id } });
    if (!plan) throw new NotFoundException('Subscription plan not found');

    const updated = await this.prisma.platformPlan.update({
      where: { id },
      data: {
        name: dto.name ? dto.name.trim() : undefined,
        description:
          dto.description !== undefined ? dto.description : undefined,
        monthlyPrice:
          dto.monthlyPrice !== undefined ? dto.monthlyPrice : undefined,
        annualPrice:
          dto.annualPrice !== undefined ? dto.annualPrice : undefined,
        maxEmployees:
          dto.maxEmployees !== undefined ? dto.maxEmployees : undefined,
        maxStorageGb:
          dto.maxStorageGb !== undefined ? dto.maxStorageGb : undefined,
        trialDays: dto.trialDays !== undefined ? dto.trialDays : undefined,
        isPublic: dto.isPublic !== undefined ? dto.isPublic : undefined,
        isActive: dto.isActive !== undefined ? dto.isActive : undefined,
      },
      include: { entitlements: true },
    });

    if (actorId && actorEmail) {
      this.prisma.platformAuditLog
        .create({
          data: {
            actorId,
            actorEmail,
            actorRole: 'SUPER_ADMIN',
            action: 'PLAN_UPDATE',
            targetEntity: 'PlatformPlan',
            targetId: id,
            beforeState: plan as any,
            afterState: updated as any,
          },
        })
        .catch((err) =>
          this.logger.error('Failed to log plan update audit', err),
        );
    }

    return updated;
  }

  /**
   * Update the module entitlement matrix for a plan
   */
  async updateEntitlements(
    planId: string,
    dto: UpdateEntitlementsDto,
    actorId?: string,
    actorEmail?: string,
  ) {
    const plan = await this.prisma.platformPlan.findUnique({
      where: { id: planId },
    });
    if (!plan) throw new NotFoundException('Subscription plan not found');

    for (const ent of dto.entitlements) {
      await this.prisma.planEntitlement.upsert({
        where: {
          planId_moduleKey: {
            planId,
            moduleKey: ent.moduleKey.toLowerCase(),
          },
        },
        update: { isEnabled: ent.isEnabled },
        create: {
          planId,
          moduleKey: ent.moduleKey.toLowerCase(),
          isEnabled: ent.isEnabled,
        },
      });
    }

    if (actorId && actorEmail) {
      this.prisma.platformAuditLog
        .create({
          data: {
            actorId,
            actorEmail,
            actorRole: 'SUPER_ADMIN',
            action: 'PLAN_ENTITLEMENT_UPDATE',
            targetEntity: 'PlatformPlan',
            targetId: planId,
            afterState: dto.entitlements as any,
          },
        })
        .catch((err) =>
          this.logger.error('Failed to log entitlement update audit', err),
        );
    }

    return this.getPlanById(planId);
  }

  /**
   * List all tenant subscriptions
   */
  async getAllSubscriptions(query: {
    search?: string;
    status?: string;
    page?: number;
    limit?: number;
  }) {
    const page = Math.max(1, Number(query.page) || 1);
    const limit = Math.max(1, Math.min(100, Number(query.limit) || 20));
    const skip = (page - 1) * limit;

    const where: any = {};
    if (query.status && query.status !== 'ALL') {
      where.status = query.status;
    }
    if (query.search) {
      where.company = {
        name: { contains: query.search.trim(), mode: 'insensitive' },
      };
    }

    const [total, items] = await Promise.all([
      this.prisma.subscription.count({ where }),
      this.prisma.subscription.findMany({
        where,
        skip,
        take: limit,
        orderBy: { currentPeriodEnd: 'asc' },
        include: {
          company: {
            select: {
              id: true,
              name: true,
              email: true,
              status: true,
              _count: { select: { employees: true } },
            },
          },
          plan: true,
        },
      }),
    ]);

    return {
      data: items.map((sub) => ({
        id: sub.id,
        companyId: sub.companyId,
        companyName: sub.company.name,
        companyEmail: sub.company.email,
        companyStatus: sub.company.status,
        employeeCount: sub.company._count.employees,
        planName: sub.plan.name,
        planCode: sub.plan.code,
        maxEmployees: sub.plan.maxEmployees,
        monthlyPrice: Number(sub.plan.monthlyPrice),
        billingCycle: sub.billingCycle,
        status: sub.status,
        startDate: sub.startDate,
        currentPeriodEnd: sub.currentPeriodEnd,
        freemiumEndsAt: (sub as any).freemiumEndsAt,
        contractEndsAt: sub.contractEndsAt,
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
   * Assign or transition a company's subscription plan (freemium period
   * extension for the FREE plan; seat/term management for paid plans)
   */
  async assignOrUpdateSubscription(
    dto: AssignSubscriptionDto,
    actorId?: string,
    actorEmail?: string,
  ) {
    const [company, plan] = await Promise.all([
      this.prisma.company.findUnique({ where: { id: dto.companyId } }),
      this.prisma.platformPlan.findUnique({ where: { id: dto.planId } }),
    ]);

    if (!company) throw new NotFoundException('Company organization not found');
    if (!plan) throw new NotFoundException('Subscription plan not found');

    const extensionDays =
      dto.extensionDays || (dto.status === 'TRIAL' ? plan.trialDays || 14 : 30);
    const periodEnd = new Date();
    periodEnd.setDate(periodEnd.getDate() + extensionDays);

    const subscription = await this.prisma.subscription.upsert({
      where: { companyId: dto.companyId },
      update: {
        planId: dto.planId,
        billingCycle: (dto.billingCycle as any) || 'MONTHLY',
        status: (dto.status as any) || 'ACTIVE',
        currentPeriodEnd: periodEnd,
        ...(plan.code === 'PLAN_FREE' ? { freemiumEndsAt: periodEnd } : {}),
      },
      create: {
        companyId: dto.companyId,
        planId: dto.planId,
        billingCycle: (dto.billingCycle as any) || 'MONTHLY',
        status: (dto.status as any) || 'ACTIVE',
        currentPeriodEnd: periodEnd,
        freemiumEndsAt: plan.code === 'PLAN_FREE' ? periodEnd : null,
      },
      include: { plan: true },
    });

    if (actorId && actorEmail) {
      this.prisma.platformAuditLog
        .create({
          data: {
            actorId,
            actorEmail,
            actorRole: 'SUPER_ADMIN',
            action: 'SUBSCRIPTION_CHANGE',
            targetEntity: 'Subscription',
            targetId: subscription.id,
            companyId: dto.companyId,
            afterState: {
              planName: plan.name,
              status: subscription.status,
              periodEnd,
            } as any,
          },
        })
        .catch((err) =>
          this.logger.error('Failed to log subscription change audit', err),
        );
    }

    return subscription;
  }

  /**
   * Set company-specific feature override
   */
  async setCompanyOverride(
    companyId: string,
    moduleKey: string,
    isEnabled: boolean,
    reason?: string,
    actorId?: string,
    actorEmail?: string,
  ) {
    const override = await this.prisma.organizationFeatureOverride.upsert({
      where: {
        companyId_moduleKey: {
          companyId,
          moduleKey: moduleKey.toLowerCase(),
        },
      },
      update: { isEnabled, reason: reason || null },
      create: {
        companyId,
        moduleKey: moduleKey.toLowerCase(),
        isEnabled,
        reason: reason || null,
      },
    });

    if (actorId && actorEmail) {
      this.prisma.platformAuditLog
        .create({
          data: {
            actorId,
            actorEmail,
            actorRole: 'SUPER_ADMIN',
            action: 'FEATURE_OVERRIDE_SET',
            targetEntity: 'OrganizationFeatureOverride',
            targetId: override.id,
            companyId,
            afterState: override as any,
            reason: reason || null,
          },
        })
        .catch((err) =>
          this.logger.error('Failed to log feature override audit', err),
        );
    }

    return override;
  }

  /**
   * List overrides for a company
   */
  async getCompanyOverrides(companyId: string) {
    return this.prisma.organizationFeatureOverride.findMany({
      where: { companyId },
      orderBy: { moduleKey: 'asc' },
    });
  }

  /**
   * Subscription lifecycle history from audit log
   */
  async getSubscriptionHistory(query: {
    companyId?: string;
    page?: number;
    limit?: number;
  }) {
    const page = Math.max(1, Number(query.page) || 1);
    const limit = Math.max(1, Math.min(100, Number(query.limit) || 20));
    const skip = (page - 1) * limit;

    const where: any = {
      OR: [
        {
          targetEntity: {
            in: ['Subscription', 'PlatformPlan', 'OrganizationFeatureOverride'],
          },
        },
        {
          action: {
            in: [
              'SUBSCRIPTION_CHANGE',
              'PLAN_CREATE',
              'PLAN_UPDATE',
              'PLAN_ENTITLEMENT_UPDATE',
              'FEATURE_OVERRIDE_SET',
            ],
          },
        },
      ],
    };

    if (query.companyId) {
      where.companyId = query.companyId;
    }

    const [total, items] = await Promise.all([
      this.prisma.platformAuditLog.count({ where }),
      this.prisma.platformAuditLog.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: {
          company: {
            select: { id: true, name: true, email: true },
          },
        },
      }),
    ]);

    return {
      data: items,
      meta: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }
}
