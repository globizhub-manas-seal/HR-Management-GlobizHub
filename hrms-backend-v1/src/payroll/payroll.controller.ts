import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  UseGuards,
  Request,
  ParseIntPipe,
  Query,
  Patch,
  ForbiddenException,
} from '@nestjs/common';
import { PayrollService } from './payroll.service';
import { AuthGuard } from '../auth/auth.guard';

@Controller('payroll')
@UseGuards(AuthGuard)
export class PayrollController {
  constructor(private readonly payrollService: PayrollService) {}

  private assertCanManageSalaryTemplates(role: string) {
    if (!['SUPER_ADMIN', 'HR_HEAD', 'OWNER'].includes(role)) {
      throw new ForbiddenException(
        'Only company administrators and HR can manage salary templates.',
      );
    }
  }

  // HR/Admin: Generate payroll for an employee
  @Post('generate')
  async generatePayroll(
    @Request() req,
    @Body('employeeId') employeeId: string,
    @Body('month', ParseIntPipe) month: number,
    @Body('year', ParseIntPipe) year: number,
  ) {
    return this.payrollService.generateMonthlyPayroll(
      req.user.companyId,
      employeeId,
      month,
      year,
      req.user.sub,
    );
  }

  // HR/Admin: View company payrolls for a specific month
  @Get('company')
  async getCompanyPayroll(
    @Request() req,
    @Query('month', ParseIntPipe) month: number,
    @Query('year', ParseIntPipe) year: number,
  ) {
    return this.payrollService.getCompanyPayrollByMonth(
      req.user.companyId,
      month,
      year,
    );
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
      salaryData,
    );
  }

  // HR/Admin: Update payroll status (DRAFT -> APPROVED -> PAID)
  @Patch(':id/status')
  async updateStatus(
    @Request() req,
    @Param('id') id: string,
    @Body('status') status: string,
  ) {
    return this.payrollService.updatePayrollStatus(
      req.user.companyId,
      id,
      status,
      req.user.role,
    );
  }

  @Post('templates')
  async createTemplate(@Request() req, @Body() body: any) {
    this.assertCanManageSalaryTemplates(req.user.role);
    return this.payrollService.createSalaryTemplate(req.user.companyId, body);
  }

  @Get('templates')
  async getTemplates(@Request() req) {
    return this.payrollService.getSalaryTemplates(req.user.companyId);
  }

  @Patch('templates/:id')
  async updateTemplate(
    @Request() req,
    @Param('id') id: string,
    @Body() body: any,
  ) {
    this.assertCanManageSalaryTemplates(req.user.role);
    return this.payrollService.updateSalaryTemplate(
      req.user.companyId,
      id,
      body,
    );
  }
}
