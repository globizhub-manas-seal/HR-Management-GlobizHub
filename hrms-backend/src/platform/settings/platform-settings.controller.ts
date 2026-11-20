import { Body, Controller, Get, Put, UseGuards } from '@nestjs/common';
import { PlatformAuthGuard } from '../auth/guards/platform-auth.guard';
import { PlatformRolesGuard } from '../auth/guards/platform-roles.guard';
import { PlatformRoles } from '../auth/decorators/platform-roles.decorator';
import { CurrentPlatformUser } from '../auth/decorators/current-platform-user.decorator';
import { PlatformSettingsService } from './platform-settings.service';
import { IsBoolean, IsInt, IsNumber, IsOptional, IsString, Min, MinLength } from 'class-validator';

export class UpdateSystemConfigDto {
  @IsOptional() @IsString() currency?: string;
  @IsOptional() @IsNumber() @Min(0) pricePerUserPerMonth?: number;
  @IsOptional() @IsInt() @Min(0) invoiceDueDays?: number;
  @IsOptional() @IsInt() @Min(0) gracePeriodDays?: number;
  @IsOptional() @IsInt() @Min(1) minUsersPerInvoice?: number;
  @IsOptional() @IsNumber() @Min(0) gstPercent?: number;
  @IsOptional() @IsString() invoicePrefix?: string;
  @IsOptional() @IsString() paymentGateway?: string;
  @IsOptional() @IsInt() @Min(1) freemiumMaxUsers?: number;
  @IsOptional() @IsBoolean() requireBusinessEmail?: boolean;
  @IsOptional() @IsString() @MinLength(1) freeEmailDomains?: string;
  @IsOptional() @IsInt() @Min(0) trialDays?: number;
  @IsOptional() @IsInt() @Min(1) maxUsersHardCap?: number;
  @IsOptional() @IsBoolean() selfSignupEnabled?: boolean;
  @IsOptional() @IsBoolean() publicCareersPage?: boolean;
}

@Controller('platform/settings')
@UseGuards(PlatformAuthGuard, PlatformRolesGuard)
export class PlatformSettingsController {
  constructor(private readonly settingsService: PlatformSettingsService) {}

  /** Full configuration console (Super Admin console reads this) */
  @Get()
  @PlatformRoles('SUPER_ADMIN', 'PLATFORM_ADMIN', 'BILLING_ADMIN')
  async getConfig() {
    return this.settingsService.getConfigFresh();
  }

  /** Update configuration — SUPER_ADMIN only (no hardcoded limits anywhere) */
  @Put()
  @PlatformRoles('SUPER_ADMIN')
  async updateConfig(
    @Body() dto: UpdateSystemConfigDto,
    @CurrentPlatformUser() currentUser: any,
  ) {
    return this.settingsService.updateConfig(dto, currentUser.email);
  }
}
