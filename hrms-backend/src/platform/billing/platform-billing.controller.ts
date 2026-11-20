import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  Query,
  Headers,
  UseGuards,
  HttpCode,
  HttpStatus,
  BadRequestException,
  UnauthorizedException,
  Req,
} from '@nestjs/common';
import { PlatformBillingService } from './platform-billing.service';
import { RazorpayService } from './razorpay.service';
import { CreateInvoiceDto } from './dto/create-invoice.dto';
import { RecordPaymentDto } from './dto/record-payment.dto';
import { PlatformAuthGuard } from '../auth/guards/platform-auth.guard';
import { PlatformRolesGuard } from '../auth/guards/platform-roles.guard';
import { PlatformRoles } from '../auth/decorators/platform-roles.decorator';
import { CurrentPlatformUser } from '../auth/decorators/current-platform-user.decorator';
import { InvoiceStatus } from '../../../generated/prisma/enums';

@Controller('platform/billing')
export class PlatformBillingController {
  constructor(
    private readonly billingService: PlatformBillingService,
    private readonly razorpayService: RazorpayService,
  ) {}

  // Invoices
  @Get('invoices')
  @UseGuards(PlatformAuthGuard, PlatformRolesGuard)
  async getInvoices(
    @Query('search') search?: string,
    @Query('status') status?: string,
    @Query('companyId') companyId?: string,
    @Query('page') page?: number,
    @Query('limit') limit?: number,
  ) {
    return this.billingService.getInvoices({
      search,
      status,
      companyId,
      page,
      limit,
    });
  }

  @Get('invoices/:id')
  @UseGuards(PlatformAuthGuard, PlatformRolesGuard)
  async getInvoiceById(@Param('id') id: string) {
    return this.billingService.getInvoiceById(id);
  }

  @Post('invoices')
  @UseGuards(PlatformAuthGuard, PlatformRolesGuard)
  @PlatformRoles('SUPER_ADMIN', 'BILLING_ADMIN')
  async createInvoice(
    @Body() dto: CreateInvoiceDto,
    @CurrentPlatformUser() user: any,
  ) {
    return this.billingService.createInvoice(dto, user.id, user.email);
  }

  @Put('invoices/:id/status')
  @UseGuards(PlatformAuthGuard, PlatformRolesGuard)
  @PlatformRoles('SUPER_ADMIN', 'BILLING_ADMIN')
  async updateInvoiceStatus(
    @Param('id') id: string,
    @Body('status') status: InvoiceStatus,
    @CurrentPlatformUser() user: any,
  ) {
    return this.billingService.updateInvoiceStatus(
      id,
      status,
      user.id,
      user.email,
    );
  }

  // Payments Ledger
  @Get('payments')
  @UseGuards(PlatformAuthGuard, PlatformRolesGuard)
  async getPayments(
    @Query('status') status?: string,
    @Query('gateway') gateway?: string,
    @Query('page') page?: number,
    @Query('limit') limit?: number,
  ) {
    return this.billingService.getPayments({ status, gateway, page, limit });
  }

  @Post('payments')
  @UseGuards(PlatformAuthGuard, PlatformRolesGuard)
  @PlatformRoles('SUPER_ADMIN', 'BILLING_ADMIN')
  async recordPayment(
    @Body() dto: RecordPaymentDto,
    @CurrentPlatformUser() user: any,
  ) {
    return this.billingService.recordPayment(dto, user.id, user.email);
  }

  // Failed / Dunning
  @Get('failed')
  @UseGuards(PlatformAuthGuard, PlatformRolesGuard)
  async getFailedPayments(
    @Query('page') page?: number,
    @Query('limit') limit?: number,
  ) {
    return this.billingService.getFailedPayments({ page, limit });
  }

  // Discount Coupons
  @Get('coupons')
  @UseGuards(PlatformAuthGuard, PlatformRolesGuard)
  async getCoupons() {
    return this.billingService.getCoupons();
  }

  @Post('coupons')
  @UseGuards(PlatformAuthGuard, PlatformRolesGuard)
  @PlatformRoles('SUPER_ADMIN', 'BILLING_ADMIN')
  async createCoupon(
    @Body()
    body: {
      code: string;
      name: string;
      discountType: 'PERCENTAGE' | 'FIXED';
      discountValue: number;
      validUntil: string;
      maxUsage: number;
      isActive?: boolean;
    },
  ) {
    return this.billingService.createCoupon(body);
  }

  @Delete('coupons/:code')
  @UseGuards(PlatformAuthGuard, PlatformRolesGuard)
  @PlatformRoles('SUPER_ADMIN', 'BILLING_ADMIN')
  async deleteCoupon(@Param('code') code: string) {
    return this.billingService.deleteCoupon(code);
  }

  @Post('coupons/validate')
  @UseGuards(PlatformAuthGuard, PlatformRolesGuard)
  async validateCoupon(@Body() body: { code: string; amount: number }) {
    return this.billingService.validateCoupon(body.code, body.amount);
  }

  // Payment Webhook (Public. Signature ALWAYS required — no unsigned dev bypass.
  // Razorpay signs the RAW request body; Stripe signs the timestamped payload.)
  @Post('webhook')
  @HttpCode(HttpStatus.OK)
  async handleWebhook(
    @Req() req: any,
    @Body() payload: any,
    @Headers('x-razorpay-signature') razorpaySignature?: string,
    @Headers('stripe-signature') stripeSignature?: string,
    @Headers('x-webhook-signature') genericSignature?: string,
    @Headers('x-idempotency-key') idempotencyHeader?: string,
  ) {
    const rawBody: Buffer =
      (req?.rawBody as Buffer) || Buffer.from(JSON.stringify(payload));
    const rawBodyText = rawBody.toString('utf8');

    // 1. Razorpay: HMAC-SHA256(rawBody, RAZORPAY_WEBHOOK_SECRET) must match.
    if (razorpaySignature) {
      if (
        !process.env.RAZORPAY_WEBHOOK_SECRET ||
        !this.razorpayService.verifyWebhookSignature(
          rawBodyText,
          razorpaySignature,
        )
      ) {
        throw new UnauthorizedException(
          process.env.RAZORPAY_WEBHOOK_SECRET
            ? 'Invalid Razorpay webhook signature'
            : 'Razorpay webhook secret not configured on server',
        );
      }
    } else if (stripeSignature || genericSignature) {
      // 2. Stripe-style / generic signature scheme
      const secret =
        process.env.STRIPE_WEBHOOK_SECRET || process.env.WEBHOOK_SECRET;
      if (!secret) {
        throw new UnauthorizedException(
          'Webhook secret not configured on server',
        );
      }
      const signature: string = (stripeSignature || genericSignature)!;
      const isValid = this.billingService.verifyWebhookSignature(
        rawBodyText,
        signature,
        secret,
      );
      if (!isValid) {
        throw new UnauthorizedException('Invalid webhook signature');
      }
    } else {
      // No signature at all -> always rejected (closes the unsigned bypass)
      throw new UnauthorizedException(
        'Missing webhook signature header (x-razorpay-signature or stripe-signature)',
      );
    }

    const eventType = payload?.type || payload?.event || 'payment.succeeded';
    const eventPaymentId =
      payload?.data?.object?.id || payload?.payment?.entity?.id || payload?.id;
    const key =
      idempotencyHeader ||
      (eventPaymentId ? `${eventType}:${eventPaymentId}` : undefined);
    if (!key) {
      throw new BadRequestException(
        'Webhook requires a unique event ID or x-idempotency-key',
      );
    }

    return this.billingService.handleWebhook(payload, eventType, key);
  }
}
