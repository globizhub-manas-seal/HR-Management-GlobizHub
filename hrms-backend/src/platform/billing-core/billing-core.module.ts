import { Global, Module } from '@nestjs/common';
import { PlatformSettingsService } from '../settings/platform-settings.service';
import { PlatformSettingsController } from '../settings/platform-settings.controller';
import { RazorpayService } from '../billing/razorpay.service';
import { SubscriptionLimitsService } from '../subscriptions/subscription-limits.service';
import { SubscriptionGuard } from '../subscriptions/guards/subscription.guard';

/**
 * Global billing/subscription core: settings, gateway, limits, guard.
 * Provided once for the whole app so every module (employees, auth,
 * recruitment, organization...) can enforce the same rules.
 */
@Global()
@Module({
  controllers: [PlatformSettingsController],
  providers: [
    PlatformSettingsService,
    RazorpayService,
    SubscriptionLimitsService,
    SubscriptionGuard,
  ],
  exports: [
    PlatformSettingsService,
    RazorpayService,
    SubscriptionLimitsService,
    SubscriptionGuard,
  ],
})
export class BillingCoreModule {}
