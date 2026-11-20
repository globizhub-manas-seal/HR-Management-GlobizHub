import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { IsBoolean, IsIn, IsOptional, IsString, MinLength } from 'class-validator';
import { PrismaService } from '../../prisma/prisma.service';
import { PlatformAuthGuard } from '../auth/guards/platform-auth.guard';
import { PlatformRolesGuard } from '../auth/guards/platform-roles.guard';
import { PlatformRoles } from '../auth/decorators/platform-roles.decorator';
import { CurrentPlatformUser } from '../auth/decorators/current-platform-user.decorator';

export class UpsertFeatureFlagDto {
  @IsString() @MinLength(2) key: string;
  @IsString() @MinLength(2) name: string;
  @IsOptional() @IsString() description?: string;
  @IsOptional() @IsBoolean() isEnabled?: boolean;
  @IsOptional() @IsBoolean() isBeta?: boolean;
  @IsOptional() rolloutPct?: number;
}

export class UpdateFeatureFlagDto {
  @IsOptional() @IsString() name?: string;
  @IsOptional() @IsString() description?: string;
  @IsOptional() @IsBoolean() isEnabled?: boolean;
  @IsOptional() @IsBoolean() isBeta?: boolean;
  @IsOptional() rolloutPct?: number;
}

export class CreateAnnouncementDto {
  @IsString() @MinLength(3) title: string;
  @IsString() @MinLength(3) body: string;
  @IsOptional() @IsIn(['INFO', 'WARNING', 'CRITICAL']) severity?: string;
  @IsOptional() @IsIn(['ALL', 'ADMINS']) audience?: string;
}

/**
 * Real platform operations endpoints that power the (previously mock)
 * platform-admin pages: feature flags, announcements, notification engine
 * stats, email delivery log, security events and operational error logs.
 */
@Controller('platform')
@UseGuards(PlatformAuthGuard, PlatformRolesGuard)
export class PlatformSystemController {
  constructor(private prisma: PrismaService) {}

  // ============ FEATURE FLAGS ============
  @Get('feature-flags')
  @PlatformRoles('SUPER_ADMIN', 'PLATFORM_ADMIN')
  async getFeatureFlags() {
    const flags = await this.prisma.platformFeatureFlag.findMany({
      orderBy: { createdAt: 'asc' },
    });
    return { data: flags };
  }

  @Post('feature-flags')
  @PlatformRoles('SUPER_ADMIN')
  async createFeatureFlag(
    @Body() dto: UpsertFeatureFlagDto,
    @CurrentPlatformUser() user: any,
  ) {
    const flag = await this.prisma.platformFeatureFlag.upsert({
      where: { key: dto.key.trim().toUpperCase() },
      update: {
        name: dto.name,
        description: dto.description,
        isEnabled: dto.isEnabled ?? false,
        isBeta: dto.isBeta ?? false,
      },
      create: {
        key: dto.key.trim().toUpperCase(),
        name: dto.name,
        description: dto.description,
        isEnabled: dto.isEnabled ?? false,
        isBeta: dto.isBeta ?? false,
        rolloutPct: dto.rolloutPct ?? 100,
      },
    });
    await this.writeAudit(user, 'FEATURE_FLAG_UPDATE', flag.id, { key: flag.key, isEnabled: flag.isEnabled });
    return flag;
  }

  @Patch('feature-flags/:id')
  @PlatformRoles('SUPER_ADMIN')
  async updateFeatureFlag(
    @Param('id') id: string,
    @Body() dto: UpdateFeatureFlagDto,
    @CurrentPlatformUser() user: any,
  ) {
    const flag = await this.prisma.platformFeatureFlag.update({
      where: { id },
      data: {
        name: dto.name,
        description: dto.description,
        isEnabled: dto.isEnabled,
        isBeta: dto.isBeta,
        rolloutPct: dto.rolloutPct,
      },
    });
    await this.writeAudit(user, 'FEATURE_FLAG_UPDATE', flag.id, { key: flag.key, isEnabled: flag.isEnabled });
    return flag;
  }

  @Delete('feature-flags/:id')
  @PlatformRoles('SUPER_ADMIN')
  async deleteFeatureFlag(@Param('id') id: string) {
    await this.prisma.platformFeatureFlag.delete({ where: { id } });
    return { success: true };
  }

  // ============ PLATFORM ANNOUNCEMENTS ============
  @Get('announcements')
  async getAnnouncements() {
    const announcements = await this.prisma.platformAnnouncement.findMany({
      orderBy: { createdAt: 'desc' },
      take: 100,
    });
    return { data: announcements };
  }

  @Post('announcements')
  @PlatformRoles('SUPER_ADMIN', 'PLATFORM_ADMIN', 'SUPPORT_ADMIN')
  async createAnnouncement(
    @Body() dto: CreateAnnouncementDto,
    @CurrentPlatformUser() user: any,
  ) {
    const announcement = await this.prisma.platformAnnouncement.create({
      data: {
        title: dto.title,
        body: dto.body,
        severity: dto.severity || 'INFO',
        audience: dto.audience || 'ALL',
        createdBy: user.email,
      },
    });
    await this.writeAudit(user, 'ANNOUNCEMENT_CREATE', announcement.id, {
      title: announcement.title,
      severity: announcement.severity,
    });
    return announcement;
  }

  @Patch('announcements/:id')
  @PlatformRoles('SUPER_ADMIN', 'PLATFORM_ADMIN', 'SUPPORT_ADMIN')
  async updateAnnouncement(
    @Param('id') id: string,
    @Body() dto: Partial<CreateAnnouncementDto & { isActive: boolean }>,
  ) {
    return this.prisma.platformAnnouncement.update({
      where: { id },
      data: {
        title: dto.title,
        body: dto.body,
        severity: dto.severity,
        audience: dto.audience,
        isActive: dto.isActive,
      },
    });
  }

  @Delete('announcements/:id')
  @PlatformRoles('SUPER_ADMIN', 'PLATFORM_ADMIN')
  async deleteAnnouncement(@Param('id') id: string) {
    await this.prisma.platformAnnouncement.delete({ where: { id } });
    return { success: true };
  }

  // ============ NOTIFICATION ENGINE STATS (real counts) ============
  @Get('notifications/stats')
  async getNotificationStats() {
    const [total, unread, last24h, companies] = await Promise.all([
      this.prisma.notification.count(),
      this.prisma.notification.count({ where: { isRead: false } }),
      this.prisma.notification.count({
        where: { createdAt: { gte: new Date(Date.now() - 86400000) } },
      }),
      this.prisma.notification.groupBy({
        by: ['companyId'],
        _count: { _all: true },
      }),
    ]);
    return {
      totalDelivered: total,
      unread,
      last24h,
      companiesReached: companies.length,
      engineOperational: true,
    };
  }

  // ============ EMAIL DELIVERY LOG ============
  @Get('email-logs')
  @PlatformRoles('SUPER_ADMIN', 'PLATFORM_ADMIN', 'SUPPORT_ADMIN', 'BILLING_ADMIN')
  async getEmailLogs(
    @Query('status') status?: string,
    @Query('search') search?: string,
    @Query('page') page?: number,
    @Query('limit') limit?: number,
  ) {
    const p = Math.max(1, Number(page) || 1);
    const l = Math.max(1, Math.min(100, Number(limit) || 25));
    const where: any = {};
    if (status && status !== 'ALL') where.status = status;
    if (search) {
      where.OR = [
        { to: { contains: search, mode: 'insensitive' } },
        { subject: { contains: search, mode: 'insensitive' } },
      ];
    }
    const [total, items] = await Promise.all([
      this.prisma.emailLog.count({ where }),
      this.prisma.emailLog.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip: (p - 1) * l,
        take: l,
      }),
    ]);
    return {
      data: items,
      meta: { page: p, limit: l, total, totalPages: Math.ceil(total / l) },
    };
  }

  // ============ SECURITY EVENTS (from platform audit trail) ============
  @Get('security-events')
  @PlatformRoles('SUPER_ADMIN', 'PLATFORM_ADMIN')
  async getSecurityEvents(
    @Query('page') page?: number,
    @Query('limit') limit?: number,
  ) {
    const p = Math.max(1, Number(page) || 1);
    const l = Math.max(1, Math.min(100, Number(limit) || 25));

    const securityActions = [
      'PLATFORM_LOGIN',
      'PLATFORM_LOGIN_FAILED',
      'PLATFORM_USER_CREATE',
      'PLATFORM_USER_ROLE_UPDATE',
      'PLATFORM_USER_PASSWORD_UPDATE',
      'PLATFORM_USER_STATUS_UPDATE',
      'ORG_STATUS_CHANGE',
      'SUBSCRIPTION_CHANGE',
      'SYSTEM_CONFIG_UPDATE',
      'PAYMENT_RECORD',
      'PAYMENT_VERIFIED',
      'INVOICE_STATUS_UPDATE',
      'SUPPORT_SESSION_START',
      'TRIAL_DOWNGRADED_TO_FREEMIUM',
      'SUBSCRIPTION_PAST_DUE',
    ];

    const [total, items, failedPayments, suspendedOrgs] = await Promise.all([
      this.prisma.platformAuditLog.count({ where: { action: { in: securityActions } } }),
      this.prisma.platformAuditLog.findMany({
        where: { action: { in: securityActions } },
        orderBy: { createdAt: 'desc' },
        skip: (p - 1) * l,
        take: l,
        include: { company: { select: { id: true, name: true } } },
      }),
      this.prisma.payment.count({ where: { status: 'FAILED' } }),
      this.prisma.company.count({ where: { status: 'SUSPENDED' } }),
    ]);

    return {
      data: items.map((e) => ({
        id: e.id,
        timestamp: e.createdAt,
        severity: ['ORG_STATUS_CHANGE', 'SUPPORT_SESSION_START', 'PAYMENT_VERIFIED'].includes(e.action)
          ? 'HIGH'
          : 'MEDIUM',
        action: e.action,
        actorEmail: e.actorEmail,
        actorRole: e.actorRole,
        companyName: e.company?.name || null,
        targetEntity: e.targetEntity,
        targetId: e.targetId,
        ipAddress: e.ipAddress,
        details: e.afterState || e.reason || null,
      })),
      meta: { page: p, limit: l, total, totalPages: Math.ceil(total / l) },
      summary: {
        failedPayments,
        suspendedOrgs,
        activePlatformUsers: await this.prisma.platformUser.count({
          where: { isActive: true },
        }),
      },
    };
  }

  // ============ OPERATIONAL ERROR LOGS (real failure signals) ============
  @Get('error-logs')
  @PlatformRoles('SUPER_ADMIN', 'PLATFORM_ADMIN', 'SUPPORT_ADMIN')
  async getErrorLogs(
    @Query('page') page?: number,
    @Query('limit') limit?: number,
  ) {
    const p = Math.max(1, Number(page) || 1);
    const l = Math.max(1, Math.min(100, Number(limit) || 25));

    const [failedEmails, failedPayments, pastDueSubs] = await Promise.all([
      this.prisma.emailLog.findMany({
        where: { status: 'FAILED' },
        orderBy: { createdAt: 'desc' },
        skip: (p - 1) * l,
        take: l,
      }),
      this.prisma.payment.findMany({
        where: { status: 'FAILED' },
        orderBy: { createdAt: 'desc' },
        include: {
          invoice: {
            include: { company: { select: { name: true } } },
          },
        },
        skip: (p - 1) * l,
        take: l,
      }),
      this.prisma.subscription.count({ where: { status: 'PAST_DUE' } }),
    ]);

    const totalFailedEmails = await this.prisma.emailLog.count({
      where: { status: 'FAILED' },
    });
    const totalFailedPayments = await this.prisma.payment.count({
      where: { status: 'FAILED' },
    });

    const events = [
      ...failedEmails.map((e) => ({
        id: e.id,
        timestamp: e.createdAt,
        subsystem: 'EMAIL',
        message: `Email to ${e.to} failed: ${e.error || 'unknown error'}`,
        context: { subject: e.subject, type: e.type },
      })),
      ...failedPayments.map((pay) => ({
        id: pay.id,
        timestamp: pay.createdAt,
        subsystem: 'PAYMENTS',
        message: `Payment ${pay.gatewayPaymentId || pay.id} failed: ${pay.failureReason || 'unknown reason'}`,
        context: {
          invoiceNumber: pay.invoice?.invoiceNumber,
          company: pay.invoice?.company?.name,
          amount: Number(pay.amount),
        },
      })),
    ]
      .sort(
        (a, b) =>
          new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime(),
      )
      .slice(0, l);

    return {
      data: events,
      meta: { page: p, limit: l, total: totalFailedEmails + totalFailedPayments },
      summary: {
        failedEmails: totalFailedEmails,
        failedPayments: totalFailedPayments,
        pastDueSubscriptions: pastDueSubs,
        allSystemsOperational:
          totalFailedEmails === 0 &&
          totalFailedPayments === 0 &&
          pastDueSubs === 0,
      },
    };
  }

  private async writeAudit(
    user: any,
    action: string,
    targetId: string,
    afterState: any,
  ) {
    await this.prisma.platformAuditLog
      .create({
        data: {
          actorId: user?.id,
          actorEmail: user?.email || 'unknown',
          actorRole: user?.role || 'PLATFORM_ADMIN',
          action,
          targetEntity: 'PlatformSystem',
          targetId,
          afterState: afterState as any,
        },
      })
      .catch(() => {});
  }
}
