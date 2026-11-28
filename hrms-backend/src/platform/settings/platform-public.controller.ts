import { Controller, Get } from '@nestjs/common';
import { PlatformSettingsService } from './platform-settings.service';

/**
 * UNAUTHENTICATED public configuration for the marketing landing page.
 * Exposes only pricing/limits the platform wants to advertise:
 *   - price per user per month (+ contract term, GST)
 *   - freemium cap (users) and freemium duration (months)
 * Everything is read from SystemConfig, so changes made by the super admin
 * appear on the landing page instantly (30s settings cache).
 */
@Controller('platform/public')
export class PlatformPublicController {
  constructor(private readonly settings: PlatformSettingsService) {}

  @Get('config')
  async getPublicConfig() {
    const c = await this.settings.getPublicConfig();
    // Pre-compute the annual figures so the landing page never hardcodes math.
    return {
      ...c,
      annualPerUser: Math.round(c.pricePerUserPerMonth * c.contractMonths * 100) / 100,
      annualPerUserWithGst:
        Math.round(c.pricePerUserPerMonth * c.contractMonths * (1 + c.gstPercent / 100) * 100) / 100,
    };
  }
}
