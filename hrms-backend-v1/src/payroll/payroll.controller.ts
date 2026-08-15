import { 
  Controller, Get, Post, Body, Param, UseGuards, Request, ParseIntPipe, Query ,Patch
} from '@nestjs/common';
import { PayrollService } from './payroll.service';
import { AuthGuard } from '../auth/auth.guard';

@Controller('payroll')
@UseGuards(AuthGuard)
export class PayrollController {
  constructor(private readonly payrollService: PayrollService) {}

  // HR/Admin: Generate payroll for an employee
  @Post('generate')
  async generatePayroll(
    @Request() req,
    @Body('employeeId') employeeId: string,
    @Body('month', ParseIntPipe) month: number,
    @Body('year', ParseIntPipe) year: number
  ) {
    return this.payrollService.generateMonthlyPayroll(
      req.user.companyId, 
      employeeId, 
      month, 
      year, 
      req.user.sub
    );
  }

  // HR/Admin: View company payrolls for a specific month
  @Get('company')
  async getCompanyPayroll(
    @Request() req,
    @Query('month', ParseIntPipe) month: number,
    @Query('year', ParseIntPipe) year: number
  ) {
    return this.payrollService.getCompanyPayrollByMonth(req.user.companyId, month, year);
  }

  // Employee: Get their own payslips
  @Get('my-payslips')
  async getMyPayslips(@Request() req) {
    return this.payrollService.getMyPayslips(req.user.sub);
  }

  // HR/Admin: Set an employee's salary structure
  @Post('salary-structure')
  async setSalaryStructure(@Request() req, @Body() body: any) {
    const { employeeId, ...salaryData } = body;
    return this.payrollService.upsertSalaryStructure(
      req.user.companyId, 
      employeeId, 
      salaryData
    );
  }

  // HR/Admin: Update payroll status (DRAFT -> APPROVED -> PAID)
  @Patch(':id/status')
  async updateStatus(
    @Request() req,
    @Param('id') id: string,
    @Body('status') status: string
  ) {
    return this.payrollService.updatePayrollStatus(
      req.user.companyId,
      id,
      status,
      req.user.role
    );
  }
}