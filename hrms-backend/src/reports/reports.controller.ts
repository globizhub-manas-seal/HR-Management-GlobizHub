import {
  BadRequestException,
  Controller,
  Get,
  Param,
  Query,
  Request,
  Res,
  UseGuards,
} from '@nestjs/common';
import { Response } from 'express';
import { AuthGuard } from '../auth/auth.guard';
import { PermissionsGuard } from '../auth/guards/permissions.guard';
import { RequirePermissions } from '../auth/decorators/require-permissions.decorator';
import { ReportsService } from './reports.service';
import { ReportExportService, ExportTable } from './report-export.service';
import { PERIOD_PRESETS, resolveRange, toCsv } from './report-range';
import { PrismaService } from '../prisma/prisma.service';

/**
 * Business-owner Reports console.
 *
 * Single-selection period presets (today / yesterday / last 7 / last 30 /
 * this month / last month / this year / custom) with CSV, Excel and PDF
 * export on the company's own letterhead (logo + legal name + address from
 * CompanySettings). Plan-gated globally: reports = core module.
 */
@Controller('reports')
@UseGuards(AuthGuard, PermissionsGuard)
export class ReportsController {
  constructor(
    private reports: ReportsService,
    private exporter: ReportExportService,
    private prisma: PrismaService,
  ) {}

  /** Available presets (for the UI selector) */
  @Get('presets')
  presets() {
    return PERIOD_PRESETS;
  }

  /** Headline KPI cards for the selected period */
  @Get('summary')
  @RequirePermissions('payroll.view', 'employee.view')
  async summary(
    @Request() req,
    @Query('period') period?: string,
    @Query('from') from?: string,
    @Query('to') to?: string,
  ) {
    const range = resolveRange(period, from, to);
    const summary = await this.reports.summary(req.user.companyId, range);
    return { ...summary, presets: PERIOD_PRESETS };
  }

  /** Dataset preview (JSON) for the on-screen report view */
  @Get('data/:dataset')
  @RequirePermissions('payroll.view', 'employee.view')
  async dataset(
    @Request() req,
    @Param('dataset') dataset: string,
    @Query('period') period?: string,
    @Query('from') from?: string,
    @Query('to') to?: string,
  ) {
    const range = resolveRange(period, from, to);
    const companyId = req.user.companyId;
    switch (dataset) {
      case 'employees': {
        const { joined, exited } = await this.reports.employees(companyId, range);
        return {
          range,
          tables: [
            {
              title: `New hires (${joined.length})`,
              rows: joined,
            } as any,
            { title: `Exits (${exited.length})`, rows: exited } as any,
          ],
        };
      }
      case 'attendance': {
        const rows = await this.reports.attendance(companyId, range);
        return { range, tables: [{ title: 'Attendance', rows }] as any };
      }
      case 'leave': {
        const rows = await this.reports.leave(companyId, range);
        return { range, tables: [{ title: 'Leave requests', rows }] as any };
      }
      case 'payroll': {
        const { rows, totals } = await this.reports.payroll(companyId, range);
        return { range, tables: [{ title: 'Payroll', rows, totals }] as any };
      }
      case 'loans': {
        const { created, repayments } = await this.reports.loans(companyId, range);
        return {
          range,
          tables: [
            { title: `Loans created (${created.length})`, rows: created } as any,
            {
              title: `Repayments (${repayments.length})`,
              rows: repayments,
            } as any,
          ],
        };
      }
      default:
        throw new BadRequestException(
          'Unknown dataset. Use: employees | attendance | leave | payroll | loans',
        );
    }
  }

  /** Multi-format export: /reports/export/:dataset?format=csv|excel|pdf */
  @Get('export/:dataset')
  @RequirePermissions('payroll.view', 'employee.view')
  async exportReport(
    @Request() req,
    @Param('dataset') dataset: string,
    @Query('format') format: string,
    @Query('period') period?: string,
    @Query('from') from?: string,
    @Query('to') to?: string,
    @Res() res?: any,
  ) {
    if (!res) throw new BadRequestException('Response stream unavailable');
    const fmt = (format ?? 'pdf').toLowerCase();
    if (!['csv', 'excel', 'pdf'].includes(fmt)) {
      throw new BadRequestException('format must be csv, excel or pdf');
    }
    const range = resolveRange(period, from, to);
    const companyId: string = req.user.companyId;

    // Letterhead identity from CompanySettings (business owner's settings)
    const company = await this.prisma.company.findUnique({
      where: { id: companyId },
      select: {
        name: true,
        address: true,
        email: true,
        phone: true,
        settings: {
          select: {
            legalName: true,
            officeAddress: true,
            city: true,
            state: true,
            zipCode: true,
            taxId: true,
            officialEmail: true,
            officialPhone: true,
            companyLogo: true,
          },
        },
      },
    });
    const logo = await this.exporter.loadCompanyLogo(
      company?.settings?.companyLogo ?? null,
    );
    const ctx = {
      companyName: company?.settings?.legalName || company?.name || 'GlobizHR',
      addressLines: [
        company?.settings?.officeAddress || company?.address || '',
        [company?.settings?.city, company?.settings?.state, company?.settings?.zipCode]
          .filter(Boolean)
          .join(', '),
      ].filter(Boolean),
      logoBuffer: logo,
      extraHeaderLines: [
        company?.settings?.taxId ? `GSTIN: ${company.settings.taxId}` : '',
        company?.settings?.officialEmail || company?.email || '',
        company?.settings?.officialPhone || company?.phone || '',
      ].filter(Boolean),
      reportTitle: `${DATASET_LABELS[dataset] ?? dataset} Report`,
      rangeLabel: range.label,
      generatedBy: req.user?.email,
      footer: `${company?.name ?? 'GlobizHR'} • ${DATASET_LABELS[dataset] ?? dataset} report • ${range.label} • Generated by GlobizHR`,
    };

    const tables = await this.buildTables(companyId, dataset, range);

    if (fmt === 'csv') {
      const csv = this.exporter.toCsv(tables);
      res.setHeader('Content-Type', 'text/csv; charset=utf-8');
      res.setHeader(
        'Content-Disposition',
        `attachment; filename="${dataset}-${range.preset}-report.csv"`,
      );
      res.end(csv);
      return;
    }
    if (fmt === 'excel') {
      const buffer = await this.exporter.toExcel(tables, ctx);
      res.setHeader(
        'Content-Type',
        'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      );
      res.setHeader(
        'Content-Disposition',
        `attachment; filename="${dataset}-${range.preset}-report.xlsx"`,
      );
      res.end(buffer);
      return;
    }
    const buffer = await this.exporter.toPdf(tables, ctx);
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader(
      'Content-Disposition',
      `attachment; filename="${dataset}-${range.preset}-report.pdf"`,
    );
    res.end(buffer);
  }

  private async buildTables(
    companyId: string,
    dataset: string,
    range: any,
  ): Promise<ExportTable[]> {
    const money = true;
    switch (dataset) {
      case 'employees': {
        const { joined, exited } = await this.reports.employees(companyId, range);
        return [
          {
            title: `New hires (${joined.length})`,
            columns: [
              { key: 'code', label: 'Employee ID' },
              { key: 'name', label: 'Name' },
              { key: 'department', label: 'Department' },
              { key: 'designation', label: 'Designation' },
              { key: 'role', label: 'Role' },
              { key: 'workerType', label: 'Worker Type' },
              { key: 'joiningDate', label: 'Joined On' },
              { key: 'basicSalary', label: 'Basic Salary', money },
            ],
            rows: joined,
          },
          {
            title: `Exits (${exited.length})`,
            columns: [
              { key: 'code', label: 'Employee ID' },
              { key: 'name', label: 'Name' },
              { key: 'department', label: 'Department' },
              { key: 'exitDate', label: 'Exit Date' },
              { key: 'reason', label: 'Reason' },
            ],
            rows: exited,
          },
        ];
      }
      case 'attendance': {
        const rows = await this.reports.attendance(companyId, range);
        return [
          {
            title: `Attendance — ${range.label}`,
            columns: [
              { key: 'code', label: 'Employee ID' },
              { key: 'name', label: 'Name' },
              { key: 'department', label: 'Department' },
              { key: 'days', label: 'Days' },
              { key: 'present', label: 'Present' },
              { key: 'absent', label: 'Absent' },
              { key: 'halfDay', label: 'Half Day' },
              { key: 'leave', label: 'Leave' },
              { key: 'late', label: 'Late' },
              { key: 'totalHours', label: 'Hours' },
              { key: 'overtimeHours', label: 'Overtime' },
              { key: 'attendanceRate', label: 'Rate' },
            ],
            rows,
          },
        ];
      }
      case 'leave': {
        const rows = await this.reports.leave(companyId, range);
        return [
          {
            title: `Leave requests — ${range.label}`,
            columns: [
              { key: 'code', label: 'Employee ID' },
              { key: 'name', label: 'Name' },
              { key: 'department', label: 'Department' },
              { key: 'type', label: 'Type' },
              { key: 'startDate', label: 'From' },
              { key: 'endDate', label: 'To' },
              { key: 'days', label: 'Days' },
              { key: 'status', label: 'Status' },
            ],
            rows,
          },
        ];
      }
      case 'payroll': {
        const { rows, totals } = await this.reports.payroll(companyId, range);
        return [
          {
            title: `Payroll — ${range.label} (net total ${totals.net.toLocaleString('en-IN')} across ${totals.count} record(s))`,
            columns: [
              { key: 'code', label: 'Employee ID' },
              { key: 'name', label: 'Name' },
              { key: 'department', label: 'Department' },
              { key: 'month', label: 'Period' },
              { key: 'basicPay', label: 'Basic', money },
              { key: 'allowances', label: 'Allowances', money },
              { key: 'arrearsPay', label: 'Arrears', money },
              { key: 'grossPay', label: 'Gross', money },
              { key: 'loanDeduction', label: 'Loan EMI', money },
              { key: 'tds', label: 'TDS', money },
              { key: 'totalDeductions', label: 'Deductions', money },
              { key: 'netSalary', label: 'Net Pay', money },
              { key: 'status', label: 'Status' },
            ],
            rows,
          },
        ];
      }
      case 'loans': {
        const { created, repayments } = await this.reports.loans(companyId, range);
        return [
          {
            title: `Loans created — ${range.label}`,
            columns: [
              { key: 'code', label: 'Employee ID' },
              { key: 'name', label: 'Name' },
              { key: 'type', label: 'Type' },
              { key: 'principal', label: 'Principal', money },
              { key: 'interestRate', label: 'Rate %' },
              { key: 'tenureMonths', label: 'Tenure' },
              { key: 'emi', label: 'EMI', money },
              { key: 'outstanding', label: 'Outstanding', money },
              { key: 'status', label: 'Status' },
            ],
            rows: created,
          },
          {
            title: `Repayments — ${range.label}`,
            columns: [
              { key: 'code', label: 'Employee ID' },
              { key: 'name', label: 'Name' },
              { key: 'amount', label: 'Amount', money },
              { key: 'principalPaid', label: 'Principal', money },
              { key: 'interestPaid', label: 'Interest', money },
              { key: 'method', label: 'Method' },
              { key: 'status', label: 'Status' },
              { key: 'repaymentDate', label: 'Date' },
            ],
            rows: repayments,
          },
        ];
      }
      default:
        throw new BadRequestException(
          'Unknown dataset. Use: employees | attendance | leave | payroll | loans',
        );
    }
  }
}

const DATASET_LABELS: Record<string, string> = {
  employees: 'Employee lifecycle',
  attendance: 'Attendance',
  leave: 'Leave',
  payroll: 'Payroll',
  loans: 'Loans & advances',
};
