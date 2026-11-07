import { Module } from '@nestjs/common';
import { PlatformSubscriptionController } from './platform-subscription.controller';
import { PlatformSubscriptionService } from './platform-subscription.service';
import { ModuleEntitlementGuard } from './guards/module-entitlement.guard';
import { PrismaModule } from '../../prisma/prisma.module';
import { PlatformAuthModule } from '../auth/platform-auth.module';

@Module({
  imports: [PrismaModule, PlatformAuthModule],
  controllers: [PlatformSubscriptionController],
  providers: [PlatformSubscriptionService, ModuleEntitlementGuard],
  exports: [PlatformSubscriptionService, ModuleEntitlementGuard],
})
export class PlatformSubscriptionModule {}

