import {
  Body,
  Controller,
  Get,
  Param,
  Post,
  Put,
  Query,
  Request,
  UseGuards,
} from '@nestjs/common';
import { AuthGuard } from '../auth/auth.guard';
import { PermissionsGuard } from '../auth/guards/permissions.guard';
import { RequirePermissions } from '../auth/decorators/require-permissions.decorator';
import { LoanService } from './loan.service';
import {
  LoanRejectionDto,
  LoanRepaymentDto,
  LoanRequestDto,
  LoanSettingsDto,
} from './dto/loan.dto';

/**
 * Loans & Salary Advances.
 *
 * Plan-gated by the global ModuleEntitlementGuard (module key: "loans") and
 * subscription-gated by the global SubscriptionGuard. Role checks:
 *  - admin endpoints: OWNER / SUPER_ADMIN / HR_HEAD (+ designation perms)
 *  - employee endpoints: self-scoped to req.user.sub
 */
@Controller('loans')
@UseGuards(AuthGuard, PermissionsGuard)
export class LoanController {
  constructor(private readonly loans: LoanService) {}

  private actor(req: any) {
    return {
      id: req.user.sub,
      role: req.user.role,
      name: req.user.email ?? req.user.sub,
    };
  }

  // ---------- settings (business owner) ----------
  @Get('settings')
  @RequirePermissions('payroll.view')
  getSettings(@Request() req) {
    return this.loans.getSettings(req.user.companyId);
  }

  @Put('settings')
  @RequirePermissions('payroll.manage')
  updateSettings(@Request() req, @Body() dto: LoanSettingsDto) {
    return this.loans.updateSettings(req.user.companyId, dto, this.actor(req));
  }

  // ---------- company / self lists ----------
  @Get('company')
  @RequirePermissions('payroll.view')
  listCompany(
    @Request() req,
    @Query('status') status?: string,
    @Query('type') type?: string,
    @Query('employeeId') employeeId?: string,
  ) {
    return this.loans.listCompany(req.user.companyId, { status, type, employeeId });
  }

  @Get('my')
  listMine(@Request() req) {
    return this.loans.listMine(req.user.sub);
  }

  // ---------- lifecycle ----------
  @Post('request')
  request(@Request() req, @Body() dto: LoanRequestDto) {
    return this.loans.requestLoan(req.user.companyId, dto, this.actor(req));
  }

  @Post(':id/approve')
  @RequirePermissions('payroll.manage')
  approve(@Request() req, @Param('id') id: string) {
    return this.loans.approve(req.user.companyId, id, this.actor(req));
  }

  @Post(':id/reject')
  @RequirePermissions('payroll.manage')
  reject(@Request() req, @Param('id') id: string, @Body() dto: LoanRejectionDto) {
    return this.loans.reject(req.user.companyId, id, dto, this.actor(req));
  }

  @Post(':id/disburse')
  @RequirePermissions('payroll.manage')
  disburse(@Request() req, @Param('id') id: string) {
    return this.loans.disburse(req.user.companyId, id, this.actor(req));
  }

  @Post(':id/repay')
  @RequirePermissions('payroll.manage')
  repay(@Request() req, @Param('id') id: string, @Body() dto: LoanRepaymentDto) {
    return this.loans.repay(req.user.companyId, id, dto, this.actor(req));
  }

  // ---------- Razorpay online repayment ----------
  @Post(':id/repay/razorpay')
  repaymentOrder(
    @Request() req,
    @Param('id') id: string,
    @Body() dto: { amount?: number },
  ) {
    return this.loans.createRepaymentOrder(
      req.user.companyId,
      id,
      dto?.amount,
      this.actor(req),
    );
  }

  @Post(':id/repay/razorpay/verify')
  repaymentVerify(
    @Request() req,
    @Param('id') id: string,
    @Body()
    dto: { orderId: string; paymentId: string; signature: string },
  ) {
    return this.loans.verifyRepayment(req.user.companyId, id, dto, this.actor(req));
  }

  // ---------- detail ----------
  @Get(':id')
  detail(@Request() req, @Param('id') id: string) {
    return this.loans.detail(req.user.companyId, id, this.actor(req));
  }
}
