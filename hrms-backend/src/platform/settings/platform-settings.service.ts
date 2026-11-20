import {
  Injectable,
  Logger,
  OnModuleInit,
} from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

/**
 * Public-safe shape of the system configuration (no secrets, no internal flags).
 */
export interface PublicSystemConfig {
  currency: string;
  pricePerUserPerMonth: number;
  freemiumMaxUsers: number;
  trialDays: number;
  requireBusinessEmail: boolean;
  paymentGateway: string;
  selfSignupEnabled: boolean;
  publicCareersPage: boolean;
}

export interface FullSystemConfig extends PublicSystemConfig {
  id: string;
  invoiceDueDays: number;
  gracePeriodDays: number;
  minUsersPerInvoice: number;
  gstPercent: number;
  invoicePrefix: string;
  freeEmailDomains: string;
  maxUsersHardCap: number;
  updatedAt: Date;
  updatedBy: string | null;
}

@Injectable()
export class PlatformSettingsService implements OnModuleInit {
  private readonly logger = new Logger(PlatformSettingsService.name);
  private cache: FullSystemConfig | null = null;
  private cacheAt = 0;
  private readonly CACHE_TTL_MS = 30_000;

  constructor(private prisma: PrismaService) {}

  async onModuleInit() {
    await this.ensureConfig();
  }

  /**
   * Guarantee the singleton row exists (seeded with DB-level defaults).
   */
  async ensureConfig(): Promise<FullSystemConfig> {
    const existing = await this.prisma.systemConfig.findUnique({
      where: { singletonKey: 'GLOBAL' },
    });
    if (existing) return this.mapConfig(existing);
    const created = await this.prisma.systemConfig.create({ data: {} });
    this.logger.log('Seeded global SystemConfig singleton.');
    return this.mapConfig(created);
  }

  private mapConfig(row: any): FullSystemConfig {
    return {
      id: row.id,
      currency: row.currency,
      pricePerUserPerMonth: Number(row.pricePerUserPerMonth),
      invoiceDueDays: row.invoiceDueDays,
      gracePeriodDays: row.gracePeriodDays,
      minUsersPerInvoice: row.minUsersPerInvoice,
      gstPercent: Number(row.gstPercent),
      invoicePrefix: row.invoicePrefix,
      paymentGateway: row.paymentGateway,
      freemiumMaxUsers: row.freemiumMaxUsers,
      requireBusinessEmail: row.requireBusinessEmail,
      freeEmailDomains: row.freeEmailDomains,
      trialDays: row.trialDays,
      maxUsersHardCap: row.maxUsersHardCap,
      selfSignupEnabled: row.selfSignupEnabled,
      publicCareersPage: row.publicCareersPage,
      updatedAt: row.updatedAt,
      updatedBy: row.updatedBy,
    };
  }

  /**
   * Get full config (cached 30s to keep hot paths cheap).
   */
  async getConfig(): Promise<FullSystemConfig> {
    if (this.cache && Date.now() - this.cacheAt < this.CACHE_TTL_MS) {
      return this.cache;
    }
    const row = await this.prisma.systemConfig.findUnique({
      where: { singletonKey: 'GLOBAL' },
    });
    if (!row) {
      // Race-safe: ensure then read
      const ensured = await this.ensureConfig();
      this.cache = ensured;
      this.cacheAt = Date.now();
      return ensured;
    }
    this.cache = this.mapConfig(row);
    this.cacheAt = Date.now();
    return this.cache;
  }

  /**
   * Force-fresh read (bypass cache) — used right after updates.
   */
  async getConfigFresh(): Promise<FullSystemConfig> {
    this.cache = null;
    return this.getConfig();
  }

  /**
   * Public-safe subset exposed to tenant frontend.
   */
  async getPublicConfig(): Promise<PublicSystemConfig> {
    const c = await this.getConfig();
    return {
      currency: c.currency,
      pricePerUserPerMonth: c.pricePerUserPerMonth,
      freemiumMaxUsers: c.freemiumMaxUsers,
      trialDays: c.trialDays,
      requireBusinessEmail: c.requireBusinessEmail,
      paymentGateway: c.paymentGateway,
      selfSignupEnabled: c.selfSignupEnabled,
      publicCareersPage: c.publicCareersPage,
    };
  }

  /**
   * Update configuration (Super Admin only — enforced at controller level).
   */
  async updateConfig(
    dto: Partial<{
      currency: string;
      pricePerUserPerMonth: number;
      invoiceDueDays: number;
      gracePeriodDays: number;
      minUsersPerInvoice: number;
      gstPercent: number;
      invoicePrefix: string;
      paymentGateway: string;
      freemiumMaxUsers: number;
      requireBusinessEmail: boolean;
      freeEmailDomains: string;
      trialDays: number;
      maxUsersHardCap: number;
      selfSignupEnabled: boolean;
      publicCareersPage: boolean;
    }>,
    actorEmail?: string,
  ): Promise<FullSystemConfig> {
    await this.ensureConfig();
    const updated = await this.prisma.systemConfig.update({
      where: { singletonKey: 'GLOBAL' },
      data: {
        currency: dto.currency?.trim().toUpperCase(),
        pricePerUserPerMonth: dto.pricePerUserPerMonth,
        invoiceDueDays: dto.invoiceDueDays,
        gracePeriodDays: dto.gracePeriodDays,
        minUsersPerInvoice: dto.minUsersPerInvoice,
        gstPercent: dto.gstPercent,
        invoicePrefix: dto.invoicePrefix?.trim().toUpperCase(),
        paymentGateway: dto.paymentGateway?.trim().toUpperCase(),
        freemiumMaxUsers: dto.freemiumMaxUsers,
        requireBusinessEmail: dto.requireBusinessEmail,
        freeEmailDomains: dto.freeEmailDomains,
        trialDays: dto.trialDays,
        maxUsersHardCap: dto.maxUsersHardCap,
        selfSignupEnabled: dto.selfSignupEnabled,
        publicCareersPage: dto.publicCareersPage,
        updatedBy: actorEmail || null,
      },
    });

    await this.prisma.platformAuditLog
      .create({
        data: {
          actorEmail: actorEmail || 'system',
          actorRole: 'SUPER_ADMIN',
          action: 'SYSTEM_CONFIG_UPDATE',
          targetEntity: 'SystemConfig',
          targetId: updated.id,
          afterState: updated as any,
        },
      })
      .catch(() => {});

    this.cache = null;
    return this.getConfigFresh();
  }

  /**
   * Check whether an email domain is a free/personal provider (blocked for
   * business-email requirements).
   */
  async isFreeEmailDomain(email: string): Promise<boolean> {
    const domain = email.split('@')[1]?.toLowerCase().trim();
    if (!domain) return false;
    const c = await this.getConfig();
    const blocked = c.freeEmailDomains
      .split(',')
      .map((d) => d.trim().toLowerCase())
      .filter(Boolean);
    return blocked.includes(domain);
  }

  /**
   * Invalidate cache (e.g. after external config changes).
   */
  invalidate() {
    this.cache = null;
  }
}
