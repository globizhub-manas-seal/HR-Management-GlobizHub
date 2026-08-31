import { Injectable, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { AuditService } from '../audit/audit.service';

@Injectable()
export class SettingsService {
  constructor(
    private prisma: PrismaService,
    private auditService: AuditService,
  ) {}

  // Get company settings (auto-creates default if missing)
  async getSettings(companyId: string) {
    let settings = await this.prisma.companySettings.findUnique({
      where: { companyId },
    });

    if (!settings) {
      settings = await this.prisma.companySettings.create({
        data: { companyId },
      });
    }

    return settings;
  }

  // Update company settings (restricted to Admin/HR)
  async updateSettings(
    companyId: string,
    dto: any,
    userRole: string,
    actorId?: string,
  ) {
    if (userRole !== 'SUPER_ADMIN' && userRole !== 'HR_HEAD') {
      throw new ForbiddenException(
        'Only Admins or HR can modify system settings.',
      );
    }

    const oldSettings = await this.prisma.companySettings.findUnique({
      where: { companyId },
    });

    // IMPORTANT: Strip out restricted/unique fields so Prisma doesn't crash
    // trying to overwrite them when the frontend sends the full object back.
    delete dto.id;
    delete dto.companyId;
    delete dto.createdAt;
    delete dto.updatedAt;

    // Use UPSERT for maximum safety: Update if it exists, create if it somehow doesn't.
    const newSettings = await this.prisma.companySettings.upsert({
      where: { companyId },
      update: dto,
      create: {
        companyId,
        ...dto,
      },
    });

    await this.auditService.logAction(
      companyId,
      actorId || null,
      'UPDATE',
      'CompanySettings',
      newSettings.id,
      oldSettings,
      newSettings,
    );

    return newSettings;
  }
}
