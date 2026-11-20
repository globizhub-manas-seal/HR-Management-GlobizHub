import { Module } from '@nestjs/common';
import { OrganizationService } from './organization.service';
import { OrganizationController } from './organization.controller';
import { TenantBillingService } from './tenant-billing.service';
import { TenantBillingController } from './tenant-billing.controller';
import { PlatformBillingModule } from '../platform/billing/platform-billing.module';

@Module({
  imports: [PlatformBillingModule],
  providers: [OrganizationService, TenantBillingService],
  controllers: [OrganizationController, TenantBillingController],
})
export class OrganizationModule {}
