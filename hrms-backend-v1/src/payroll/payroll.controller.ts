import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  UseGuards,
  Request,
  Response,
  ParseIntPipe,
  Query,
  Patch,
} from '@nestjs/common';
import type { Response as ExpressResponse } from 'express';
import { PayrollService } from './payroll.service';
import { AuthGuard } from '../auth/auth.guard';
import { PermissionsGuard } from '../auth/guards/permissions.guard';
import { RequirePermissions } from '../auth/decorators/require-permissions.decorator';
import { UpsertSalaryStructureDto } from './dto/upsert-salary-structure.dto';
import { GenerateBatchPayrollDto } from './dto/generate-batch-payroll.dto';
import { CalculateCtcDto } from './dto/calculate-ctc.dto';
import { FinalSettlementDto } from './dto/final-settlement.dto';

@Controller('payroll')
@UseGuards(AuthGuard, PermissionsGuard)
export class PayrollController {
  constructor(private readonly payrollService: PayrollService) {}

  // HR/Admin: Generate payroll for a single employee
  @Post('generate')
  @RequirePermissions('payroll.manage')
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

  // HR/Admin: Bulk payroll run for the entire company or department (P-14)
  @Post('generate-batch')
  @RequirePermissions('payroll.manage')
  async generateBatchPayroll(
    @Request() req,
    @Body() dto: GenerateBatchPayrollDto,
  ) {
    return this.payrollService.generateBatchPayroll(
      req.user.companyId,
      dto.month,
      dto.year,
      req.user.sub,
      dto.departmentId,
    );
  }

  // HR/Admin: Server-side CTC & Statutory Breakdown Calculator (P-08, P-17)
  @Post('calculate-ctc')
  @RequirePermissions('payroll.manage')
  calculateCtc(@Body() dto: CalculateCtcDto) {
    return this.payrollService.calculateCtc(dto);
  }

  // HR/Admin: Download bank payout advice file (CSV) for NEFT/RTGS bulk payment (P-19)
  @Get('bank-advice')
  @RequirePermissions('payroll.manage')
  async getBankAdvice(
    @Request() req,
    @Query('month', ParseIntPipe) month: number,
    @Query('year', ParseIntPipe) year: number,
    @Response() res: ExpressResponse,
  ) {
    const csvContent = await this.payrollService.generateBankAdviceCsv(
      req.user.companyId,
      month,
      year,
    );

    const filename = `bank_advice_${String(month).padStart(2, '0')}_${year}.csv`;
    res.setHeader('Content-Type', 'text/csv; charset=utf-8');
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    return res.status(200).send(csvContent);
  }

  // HR/Admin: Dispatch payslip summary email to employee (P-18)
  @Post(':id/send-email')
  @RequirePermissions('payroll.manage')
  async sendPayslipEmail(@Request() req, @Param('id') id: string) {
    return this.payrollService.sendPayslipEmail(
      req.user.companyId,
      id,
      req.user.sub,
    );
  }

  // HR/Admin: View company payrolls for a specific month
  @Get('company')
  @RequirePermissions('payroll.manage')
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

  @Post(':id/log-download')
  async logDownload(@Request() req, @Param('id') id: string) {
    return this.payrollService.logPayslipDownload(
      req.user.sub,
      req.user.companyId,
      id,
    );
  }

  // HR/Admin: Set an employee's salary structure
  @Post('salary-structure')
  @RequirePermissions('payroll.manage')
  async setSalaryStructure(
    @Request() req,
    @Body('employeeId') employeeId: string,
    @Body() dto: UpsertSalaryStructureDto,
  ) {
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { employeeId: _id, ...salaryData } = dto as any;
    return this.payrollService.upsertSalaryStructure(
      req.user.companyId,
      employeeId,
      salaryData,
      req.user.sub,
    );
  }

  // HR/Admin: Update payroll status (DRAFT -> APPROVED -> PAID)
  @Patch(':id/status')
  @RequirePermissions('payroll.manage')
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
      req.user.sub,
    );
  }

  @Post('templates')
  @RequirePermissions('payroll.manage')
  async createTemplate(@Request() req, @Body() body: any) {
    return this.payrollService.createSalaryTemplate(req.user.companyId, body);
  }

  @Get('templates')
  @RequirePermissions('payroll.manage')
  async getTemplates(@Request() req) {
    return this.payrollService.getSalaryTemplates(req.user.companyId);
  }

  @Patch('templates/:id')
  @RequirePermissions('payroll.manage')
  async updateTemplate(
    @Request() req,
    @Param('id') id: string,
    @Body() body: any,
  ) {
    return this.payrollService.updateSalaryTemplate(
      req.user.companyId,
      id,
      body,
    );
  }
}
