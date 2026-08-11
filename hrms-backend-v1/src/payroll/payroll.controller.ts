import { Controller, Get, Post, Body, Param, UseGuards, Request } from '@nestjs/common';
import { PayrollService } from './payroll.service';
import { AuthGuard } from '../auth/auth.guard';
import { PermissionsGuard } from '../auth/guards/permissions.guard';
import { RequirePermissions } from '../auth/decorators/require-permissions.decorator';

@Controller('payroll')
@UseGuards(AuthGuard, PermissionsGuard)
export class PayrollController {
  constructor(private readonly payrollService: PayrollService) {}

  // --- HR/ADMIN ROUTES ---

  @Post('structure/:employeeId')
  @RequirePermissions('payroll.manage')
  async upsertSalaryStructure(@Param('employeeId') employeeId: string, @Body() body: any) {
    return this.payrollService.upsertSalaryStructure(employeeId, body);
  }

  @Post('process/:employeeId')
  @RequirePermissions('payroll.process')
  async processPayroll(
    @Request() req, 
    @Param('employeeId') employeeId: string, 
    @Body() body: { month: number; year: number }
  ) {
    return this.payrollService.generatePayroll(
      req.user.companyId, 
      employeeId, 
      body.month, 
      body.year,
      req.user.sub // The ID of the HR person processing this
    );
  }

  // --- EMPLOYEE ROUTES ---

  @Get('my-payslips')
  async getMyPayslips(@Request() req) {
    // No specific permission needed; everyone can view their own payslips
    return this.payrollService.getMyPayslips(req.user.sub);
  }
}