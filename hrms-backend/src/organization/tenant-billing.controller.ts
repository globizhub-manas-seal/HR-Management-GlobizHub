import { Body, Controller, ForbiddenException, Get, Post, Request, UseGuards } from '@nestjs/common';
import { IsOptional, IsString } from 'class-validator';
import { TenantBillingService } from './tenant-billing.service';
import { PlatformSettingsService } from '../platform/settings/platform-settings.service';
import { AuthGuard } from '../auth/auth.guard';

export class CheckoutDto {
  @IsOptional()
  @IsString()
  couponCode?: string;
}

export class VerifyCheckoutDto {
  @IsString() invoiceId: string;
  @IsString() razorpayOrderId: string;
  @IsString() razorpayPaymentId: string;
  @IsString() razorpaySignature: string;
}

@Controller('organization')
@UseGuards(AuthGuard)
export class TenantBillingController {
  constructor(
    private readonly tenantBilling: TenantBillingService,
    private readonly settings: PlatformSettingsService,
  ) {}

  /** Public-safe billing configuration (price per user, trial, freemium cap) */
  @Get('billing/config')
  async getBillingConfig() {
    return this.settings.getPublicConfig();
  }

  /** Live quote: active users x price per user (server-computed) */
  @Get('billing/quote')
  async getBillingQuote(@Request() req) {
    return this.tenantBilling.quote(req.user.companyId);
  }

  /** Create the payable invoice + Razorpay order (amount computed server-side) */
  @Post('billing/checkout')
  async checkout(@Request() req, @Body() dto: CheckoutDto) {
    return this.tenantBilling.checkout(req.user.companyId, dto, {
      id: req.user.sub,
      email: req.user.email,
    });
  }

  /** Verify Razorpay checkout result (server-side HMAC verification) */
  @Post('billing/checkout/verify')
  async verifyCheckout(@Request() req, @Body() dto: VerifyCheckoutDto) {
    return this.tenantBilling.verifyCheckout(req.user.companyId, dto, {
      id: req.user.sub,
      email: req.user.email,
    });
  }

  /**
   * SANDBOX-ONLY payment simulator: completes a pending order through the
   * exact same signature-verification path as a real Razorpay callback.
   * Requires SANDBOX_PAYMENTS=true AND non-production. Never available in prod.
   */
  @Post('billing/checkout/simulate')
  async simulateCheckout(@Request() req, @Body() dto: { invoiceId: string }) {
    if (!this.tenantBilling.isSandboxPayments()) {
      throw new ForbiddenException('Payment simulation is disabled');
    }
    return this.tenantBilling.simulateSandboxPayment(req.user.companyId, dto.invoiceId, {
      id: req.user.sub,
      email: req.user.email,
    });
  }
}
