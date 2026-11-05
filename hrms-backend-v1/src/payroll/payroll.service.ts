import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ForbiddenException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { S3Service } from '../s3/s3.service';
import { AuditService } from '../audit/audit.service';
import { EmailService } from '../email/email.service';
import { decrypt } from '../common/utils/encryption.util';
import {
  calculateCtcBreakdown,
  CtcCalculationInput,
} from './payroll-calculator.util';

@Injectable()
export class PayrollService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly s3Service: S3Service,
    private readonly auditService: AuditService,
    private readonly emailService: EmailService,
  ) {}

  /**
   * Letterheads are stored as private S3 objects. Convert the stored URL to a
   * short-lived view URL for API consumers without changing the saved value.
   */
  private async attachPayslipLetterheadUrls(records: any[]) {
    return Promise.all(
      records.map(async (record) => {
        const breakdown = record.breakdown;
        const snapshotUrl = breakdown?.meta?.letterheadUrl;
        const currentUrl = record.company?.settings?.payslipHeaderUrl;
        const sourceUrl = snapshotUrl || currentUrl;

        if (!sourceUrl) return record;

        const viewUrl = await this.s3Service.getPresignedUrl(sourceUrl);
        return {
          ...record,
          company: record.company
            ? {
                ...record.company,
                settings: record.company.settings
                  ? { ...record.company.settings, payslipHeaderUrl: viewUrl }
                  : record.company.settings,
              }
            : record.company,
          breakdown: snapshotUrl
            ? {
                ...breakdown,
                meta: { ...breakdown.meta, letterheadUrl: viewUrl },
              }
            : breakdown,
        };
      }),
    );
  }

  // ==========================================
  // HELPER: WORKING DAYS CALCULATION
  // ==========================================

  /**
   * P-16: Working days calculated using company working-days configuration
   * rather than hardcoding Saturday and Sunday as weekends.
   */
  private async calculateWorkingDaysInRange(
    startDate: Date,
    endDate: Date,
    companyId: string,
    companyWorkingDays?: string[],
  ): Promise<number> {
    const start = new Date(startDate);
    const end = new Date(endDate);
    start.setHours(0, 0, 0, 0);
    end.setHours(0, 0, 0, 0);

    const holidays = await this.prisma.holiday.findMany({
      where: { companyId, date: { gte: start, lte: end } },
      select: { date: true },
    });

    const holidayDates = holidays.map((h) => h.date.getTime());
    let workingDays = 0;
    const currentDate = new Date(start);

    const dayNames = [
      'SUNDAY',
      'MONDAY',
      'TUESDAY',
      'WEDNESDAY',
      'THURSDAY',
      'FRIDAY',
      'SATURDAY',
    ];
    const activeWorkingDays =
      companyWorkingDays && companyWorkingDays.length > 0
        ? companyWorkingDays.map((d) => d.toUpperCase())
        : ['MONDAY', 'TUESDAY', 'WEDNESDAY', 'THURSDAY', 'FRIDAY'];

    while (currentDate <= end) {
      const dayName = dayNames[currentDate.getDay()];
      const isWorkingDay = activeWorkingDays.includes(dayName);
      const isHoliday = holidayDates.includes(currentDate.getTime());

      if (isWorkingDay && !isHoliday) {
        workingDays++;
      }
      currentDate.setDate(currentDate.getDate() + 1);
    }
    return workingDays;
  }

  // ==========================================
  // CORE: GENERATE MONTHLY PAYROLL
  // ==========================================

  async generateMonthlyPayroll(
    companyId: string,
    employeeId: string,
    month: number,
    year: number,
    generatedById: string,
  ) {
    if (month < 1 || month > 12) {
      throw new BadRequestException('Month must be between 1 and 12.');
    }
    if (year < 2020 || year > 2100) {
      throw new BadRequestException('Invalid payroll year.');
    }

    // 1. Define boundaries of the payroll month
    const startOfMonth = new Date(year, month - 1, 1);
    const endOfMonth = new Date(year, month, 0);
    const daysInMonth = endOfMonth.getDate();

    // 2. Prevent Double-Processing
    const existingRecord = await this.prisma.payrollRecord.findFirst({
      where: { employeeId, month, year },
    });
    if (existingRecord) {
      throw new BadRequestException(
        `Payroll for ${month}/${year} has already been generated for this employee.`,
      );
    }

    // 3. Fetch Employee & Active Salary Structure
    const employee = await this.prisma.employee.findFirst({
      where: { id: employeeId, companyId },
      include: { salaryStructure: true },
    });

    if (!employee) {
      throw new NotFoundException('Employee not found in your company.');
    }

    if (employee.employmentStatus === 'INVITED') {
      throw new BadRequestException(
        'Cannot generate payroll for an employee with INVITED status.',
      );
    }

    const structure = employee.salaryStructure;
    if (!structure) {
      throw new NotFoundException(
        'No active salary structure found for this employee.',
      );
    }

    // 4. Fetch Company Settings for branding and working days
    const company = await this.prisma.company.findUnique({
      where: { id: companyId },
      select: {
        name: true,
        settings: {
          select: {
            payslipHeaderUrl: true,
            workingDays: true,
          },
        },
      },
    });

    // P-16: Scheduled working days in the month
    const totalScheduledWorkingDays = await this.calculateWorkingDaysInRange(
      startOfMonth,
      endOfMonth,
      companyId,
      company?.settings?.workingDays,
    );

    // 5. ATTENDANCE & LEAVE RECONCILIATION
    // Fetch all APPROVED leaves overlapping this month
    const overlappingLeaves = await this.prisma.leaveRequest.findMany({
      where: {
        employeeId,
        status: 'APPROVED',
        startDate: { lte: endOfMonth },
        endDate: { gte: startOfMonth },
      },
      include: {
        allocation: {
          include: {
            leavePolicy: true,
          },
        },
      },
    });

    let approvedUnpaidLeaveDays = 0;
    let approvedPaidLeaveDays = 0;

    for (const leave of overlappingLeaves) {
      const isUnpaid =
        leave.type === 'UNPAID' ||
        leave.allocation?.leavePolicy?.isPaid === false;

      const effectiveStart =
        leave.startDate < startOfMonth ? startOfMonth : leave.startDate;
      const effectiveEnd =
        leave.endDate > endOfMonth ? endOfMonth : leave.endDate;

      const chunkDays = await this.calculateWorkingDaysInRange(
        effectiveStart,
        effectiveEnd,
        companyId,
        company?.settings?.workingDays,
      );

      if (isUnpaid) {
        approvedUnpaidLeaveDays += chunkDays;
      } else {
        approvedPaidLeaveDays += chunkDays;
      }
    }

    // Fetch Attendance records in the month
    const attendanceRecords = await this.prisma.attendance.findMany({
      where: {
        employeeId,
        companyId,
        date: {
          gte: startOfMonth,
          lte: endOfMonth,
        },
      },
      select: {
        status: true,
        isHalfDay: true,
        overtimeHours: true,
      },
    });

    let attendanceWorkedDays = 0;
    let totalOvertimeHours = 0;

    for (const att of attendanceRecords) {
      if (att.status === 'PRESENT') {
        attendanceWorkedDays += att.isHalfDay ? 0.5 : 1.0;
      } else if (att.status === 'HALF_DAY') {
        attendanceWorkedDays += 0.5;
      }
      totalOvertimeHours += att.overtimeHours || 0;
    }

    // P-02: Attendance-linked LOP:
    // If an employee neither attended nor was on approved paid leave during a working day,
    // that unexcused absence is deducted.
    const accountedDays = attendanceWorkedDays + approvedPaidLeaveDays;
    const unexcusedAbsenceDays = Math.max(
      0,
      totalScheduledWorkingDays - accountedDays,
    );
    const totalUnpaidDays = approvedUnpaidLeaveDays + unexcusedAbsenceDays;

    // 6. FINANCIAL MATH
    const workingDaysDivisor =
      totalScheduledWorkingDays > 0 ? totalScheduledWorkingDays : daysInMonth;
    const dailyRate = structure.basicSalary / workingDaysDivisor;
    const lopDeduction = parseFloat((totalUnpaidDays * dailyRate).toFixed(2));

    // P-01: Calculate hourly rate and overtime pay (standard 8-hour shift)
    const hourlyRate =
      totalScheduledWorkingDays > 0
        ? structure.basicSalary / (totalScheduledWorkingDays * 8)
        : structure.basicSalary / (daysInMonth * 8);
    const overtimePay = parseFloat(
      (totalOvertimeHours * hourlyRate).toFixed(2),
    );

    // P-06: Include otherAllowances & overtimePay in earnings
    const otherAllowances = structure.otherAllowances || 0;
    const allowances =
      structure.hra +
      structure.conveyanceAllowance +
      structure.medicalAllowance +
      structure.specialAllowance +
      otherAllowances +
      overtimePay;

    const grossEarnings = structure.basicSalary + allowances;

    const standardDeductions =
      structure.pfContribution +
      structure.taxDeduction +
      structure.professionalTax;
    const totalDeductions = standardDeductions + lopDeduction;
    const netSalary = parseFloat(
      (grossEarnings - totalDeductions).toFixed(2),
    );

    // 7. CREATE IMMUTABLE SNAPSHOT
    const record = await this.prisma.payrollRecord.create({
      data: {
        companyId,
        employeeId,
        month,
        year,
        totalWorkingDays: totalScheduledWorkingDays,
        presentDays: Math.max(0, totalScheduledWorkingDays - totalUnpaidDays),
        unpaidLeaves: totalUnpaidDays,
        overtimeHours: totalOvertimeHours,

        basicPay: structure.basicSalary,
        allowances,
        deductions: totalDeductions,
        netSalary,

        status: 'DRAFT',
        processedById: generatedById,
        processedDate: new Date(),

        breakdown: {
          meta: {
            companyName: company?.name ?? null,
            letterheadUrl: company?.settings?.payslipHeaderUrl ?? null,
            generatedAt: new Date().toISOString(),
          },
          attendanceSummary: {
            scheduledWorkingDays: totalScheduledWorkingDays,
            daysWorked: attendanceWorkedDays,
            paidLeaveDays: approvedPaidLeaveDays,
            unpaidLeaveDays: approvedUnpaidLeaveDays,
            unexcusedAbsenceDays,
            totalLopDays: totalUnpaidDays,
          },
          earnings: {
            basic: structure.basicSalary,
            hra: structure.hra,
            conveyance: structure.conveyanceAllowance,
            medical: structure.medicalAllowance,
            special: structure.specialAllowance,
            otherAllowances,
            overtimePay,
            overtimeHours: totalOvertimeHours,
            total: grossEarnings,
          },
          deductions: {
            pf: structure.pfContribution,
            tax: structure.taxDeduction,
            profTax: structure.professionalTax,
            lop: lopDeduction,
            lopDays: totalUnpaidDays,
            total: totalDeductions,
          },
        },
      },
    });

    // S-18: Audit log
    await this.auditService.logAction(
      companyId,
      generatedById,
      'CREATE',
      'PayrollRecord',
      record.id,
      null,
      { month, year, employeeId, netSalary },
    );

    return record;
  }

  // ==========================================
  // BULK PAYROLL RUN (P-14)
  // ==========================================

  async generateBatchPayroll(
    companyId: string,
    month: number,
    year: number,
    actorId: string,
    departmentId?: string,
  ) {
    if (month < 1 || month > 12) {
      throw new BadRequestException('Month must be between 1 and 12.');
    }
    if (year < 2020 || year > 2100) {
      throw new BadRequestException('Invalid payroll year.');
    }

    // Fetch active employees
    const employees = await this.prisma.employee.findMany({
      where: {
        companyId,
        employmentStatus: 'ACTIVE',
        ...(departmentId ? { departmentId } : {}),
      },
      select: {
        id: true,
        firstName: true,
        lastName: true,
        employeeCode: true,
        salaryStructure: { select: { id: true } },
      },
      orderBy: { employeeCode: 'asc' },
    });

    const existingRecords = await this.prisma.payrollRecord.findMany({
      where: { companyId, month, year },
      select: { employeeId: true },
    });
    const existingIds = new Set(existingRecords.map((r) => r.employeeId));

    const generatedRecords: any[] = [];
    const skipped: Array<{ employeeId: string; name: string; reason: string }> =
      [];

    for (const emp of employees) {
      const name = `${emp.firstName} ${emp.lastName}`.trim();
      if (!emp.salaryStructure) {
        skipped.push({
          employeeId: emp.id,
          name,
          reason: 'No salary structure configured',
        });
        continue;
      }

      if (existingIds.has(emp.id)) {
        skipped.push({
          employeeId: emp.id,
          name,
          reason: 'Payroll already generated for this month/year',
        });
        continue;
      }

      try {
        const record = await this.generateMonthlyPayroll(
          companyId,
          emp.id,
          month,
          year,
          actorId,
        );
        generatedRecords.push(record);
      } catch (err: any) {
        skipped.push({
          employeeId: emp.id,
          name,
          reason: err.message || 'Generation failed',
        });
      }
    }

    await this.auditService.logAction(
      companyId,
      actorId,
      'CREATE',
      'PayrollBatch',
      `${year}-${month}`,
      null,
      {
        totalEmployees: employees.length,
        generatedCount: generatedRecords.length,
        skippedCount: skipped.length,
      },
    );

    return {
      success: true,
      month,
      year,
      totalEmployees: employees.length,
      generatedCount: generatedRecords.length,
      skippedCount: skipped.length,
      records: generatedRecords,
      skipped,
    };
  }

  // ==========================================
  // CTC STATUTORY ENGINE (P-08, P-17)
  // ==========================================

  calculateCtc(dto: CtcCalculationInput) {
    return calculateCtcBreakdown(dto);
  }

  // ==========================================
  // BANK ADVICE EXPORT (P-19)
  // ==========================================

  async generateBankAdviceCsv(
    companyId: string,
    month: number,
    year: number,
  ): Promise<string> {
    const records = await this.prisma.payrollRecord.findMany({
      where: { companyId, month, year },
      include: {
        employee: {
          select: {
            employeeCode: true,
            firstName: true,
            lastName: true,
            bankName: true,
            accountNumber: true,
            ifscCode: true,
            panNumber: true,
          },
        },
      },
      orderBy: { employee: { employeeCode: 'asc' } },
    });

    if (records.length === 0) {
      throw new NotFoundException(
        `No payroll records found for ${month}/${year}.`,
      );
    }

    const headers = [
      'Employee ID',
      'Employee Name',
      'Bank Name',
      'Account Number',
      'IFSC Code',
      'PAN Number',
      'Net Pay (INR)',
      'Status',
      'Payment Narration',
    ];

    const escapeCsv = (val: string | null | undefined): string => {
      if (val === null || val === undefined) return '""';
      const str = String(val).replace(/"/g, '""');
      return `"${str}"`;
    };

    const rows = records.map((r) => {
      const emp = r.employee;
      const bankName = decrypt(emp.bankName) || 'N/A';
      const accountNumber = decrypt(emp.accountNumber) || 'N/A';
      const ifsc = decrypt(emp.ifscCode) || 'N/A';
      const pan = decrypt(emp.panNumber) || 'N/A';
      const name = `${emp.firstName} ${emp.lastName}`.trim();
      const narration = `Salary for ${String(month).padStart(2, '0')}/${year}`;

      return [
        escapeCsv(emp.employeeCode || 'N/A'),
        escapeCsv(name),
        escapeCsv(bankName),
        escapeCsv(accountNumber),
        escapeCsv(ifsc),
        escapeCsv(pan),
        r.netSalary.toFixed(2),
        escapeCsv(r.status),
        escapeCsv(narration),
      ].join(',');
    });

    // UTF-8 BOM for Excel compatibility
    return '\uFEFF' + [headers.join(','), ...rows].join('\r\n');
  }

  // ==========================================
  // PAYSLIP EMAIL DISPATCH (P-18)
  // ==========================================

  async sendPayslipEmail(
    companyId: string,
    recordId: string,
    actorId: string,
  ) {
    const record = await this.prisma.payrollRecord.findUnique({
      where: { id: recordId },
      include: {
        employee: {
          select: { email: true, firstName: true, lastName: true },
        },
        company: {
          select: { name: true },
        },
      },
    });

    if (!record || record.companyId !== companyId) {
      throw new NotFoundException('Payroll record not found.');
    }

    if (!['APPROVED', 'PAID'].includes(record.status)) {
      throw new BadRequestException(
        'Payslip email can only be sent for APPROVED or PAID payroll records.',
      );
    }

    const employeeName =
      `${record.employee.firstName} ${record.employee.lastName}`.trim();

    const sent = await this.emailService.sendPayslipEmail({
      email: record.employee.email,
      employeeName,
      month: record.month,
      year: record.year,
      netSalary: record.netSalary,
      companyName: record.company.name,
      breakdown: record.breakdown,
    });

    await this.auditService.logAction(
      companyId,
      actorId,
      'DOWNLOAD',
      'PayrollRecord',
      record.id,
      null,
      { sent, email: record.employee.email },
    );

    return {
      success: sent,
      message: sent
        ? `Payslip email dispatched to ${record.employee.email}`
        : 'Failed to dispatch email via provider',
    };
  }

  // ==========================================
  // HR/ADMIN: GET COMPANY PAYROLLS
  // ==========================================

  async getCompanyPayrollByMonth(
    companyId: string,
    month: number,
    year: number,
  ) {
    const records = await this.prisma.payrollRecord.findMany({
      where: { companyId, month, year },
      include: {
        company: {
          select: {
            name: true,
            settings: { select: { payslipHeaderUrl: true } },
          },
        },
        employee: {
          select: {
            firstName: true,
            lastName: true,
            employeeCode: true,
            department: true,
          },
        },
      },
      orderBy: { netSalary: 'desc' },
    });

    return this.attachPayslipLetterheadUrls(records);
  }

  // ==========================================
  // HR/ADMIN: SET SALARY STRUCTURE (S-17)
  // ==========================================
  async upsertSalaryStructure(
    companyId: string,
    employeeId: string,
    data: any,
    actorId?: string,
  ) {
    const employee = await this.prisma.employee.findFirst({
      where: { id: employeeId, companyId },
      select: { id: true },
    });
    if (!employee) {
      throw new NotFoundException('Employee not found in your company.');
    }

    const result = await this.prisma.salaryStructure.upsert({
      where: { employeeId },
      update: { ...data },
      create: {
        ...data,
        employeeId,
        companyId,
      },
    });

    await this.auditService.logAction(
      companyId,
      actorId || null,
      'UPDATE',
      'SalaryStructure',
      employeeId,
      null,
      { employeeId, ...data },
    );

    return result;
  }

  // ==========================================
  // EMPLOYEE: GET MY PAYSLIPS
  // ==========================================
  async getMyPayslips(employeeId: string) {
    const records = await this.prisma.payrollRecord.findMany({
      where: {
        employeeId,
        status: { in: ['APPROVED', 'PAID'] },
      },
      include: {
        company: {
          select: {
            name: true,
            settings: { select: { payslipHeaderUrl: true } },
          },
        },
        employee: {
          select: { firstName: true, lastName: true, employeeCode: true },
        },
      },
      orderBy: [{ year: 'desc' }, { month: 'desc' }],
    });

    return this.attachPayslipLetterheadUrls(records);
  }

  // ==========================================
  // HR/ADMIN: UPDATE PAYROLL STATUS (P-09, P-10)
  // ==========================================
  async updatePayrollStatus(
    companyId: string,
    recordId: string,
    status: string,
    role: string,
    actorId?: string,
  ) {
    if (!['SUPER_ADMIN', 'HR_HEAD', 'MANAGER'].includes(role)) {
      throw new ForbiddenException(
        'You do not have permission to approve payroll.',
      );
    }

    const ALLOWED_STATUSES = ['DRAFT', 'APPROVED', 'PAID', 'CANCELLED'];
    if (!ALLOWED_STATUSES.includes(status)) {
      throw new BadRequestException(
        `Invalid status '${status}'. Allowed statuses are: ${ALLOWED_STATUSES.join(', ')}`,
      );
    }

    const record = await this.prisma.payrollRecord.findUnique({
      where: { id: recordId },
    });

    if (!record || record.companyId !== companyId) {
      throw new NotFoundException('Payroll record not found.');
    }

    // P-09: PAID status cannot be reverted
    if (record.status === 'PAID') {
      throw new BadRequestException(
        'A PAID payroll record cannot be modified or reverted.',
      );
    }

    // P-09: Must be APPROVED before PAID
    if (status === 'PAID' && record.status !== 'APPROVED') {
      throw new BadRequestException(
        'Payroll record must be APPROVED before it can be marked as PAID.',
      );
    }

    // P-10: Maker-checker: Generator cannot self-approve payroll
    if (
      status === 'APPROVED' &&
      record.processedById &&
      actorId &&
      record.processedById === actorId
    ) {
      if (role !== 'SUPER_ADMIN' && role !== 'OWNER') {
        throw new ForbiddenException(
          'Maker-checker policy: You cannot approve a payroll record you generated. An independent approver is required.',
        );
      }
    }

    const updated = await this.prisma.payrollRecord.update({
      where: { id: recordId },
      data: { status },
    });

    // S-18 / P-12: Audit log
    await this.auditService.logAction(
      companyId,
      actorId || null,
      'UPDATE',
      'PayrollRecord',
      recordId,
      { status: record.status },
      { status },
    );

    return updated;
  }

  // ==========================================
  // HR/ADMIN: SALARY TEMPLATES
  // ==========================================
  async createSalaryTemplate(companyId: string, data: any) {
    return this.prisma.salaryTemplate.create({
      data: { ...data, companyId },
    });
  }

  async getSalaryTemplates(companyId: string) {
    return this.prisma.salaryTemplate.findMany({
      where: { companyId },
      orderBy: { createdAt: 'desc' },
    });
  }

  async updateSalaryTemplate(companyId: string, templateId: string, data: any) {
    const template = await this.prisma.salaryTemplate.findFirst({
      where: { id: templateId, companyId },
    });

    if (!template) {
      throw new NotFoundException('Salary template not found.');
    }

    const {
      id: _id,
      companyId: _companyId,
      createdAt: _createdAt,
      updatedAt: _updatedAt,
      ...templateData
    } = data;

    return this.prisma.salaryTemplate.update({
      where: { id: templateId },
      data: templateData,
    });
  }

  async logPayslipDownload(
    employeeId: string,
    companyId: string,
    payrollId: string,
  ) {
    const employee = await this.prisma.employee.findUnique({
      where: { id: employeeId },
      select: { firstName: true, lastName: true, role: true },
    });

    const payroll = await this.prisma.payrollRecord.findUnique({
      where: { id: payrollId },
      select: {
        month: true,
        year: true,
        employee: { select: { firstName: true, lastName: true } },
      },
    });

    if (!payroll) throw new NotFoundException('Payroll record not found.');

    const actorName = employee
      ? `${employee.firstName} ${employee.lastName}`
      : 'Unknown';
    const targetName = `${payroll.employee.firstName} ${payroll.employee.lastName}`;
    const desc = `${actorName} (${employee?.role || 'User'}) downloaded payslip of ${targetName} for Month ${payroll.month}/${payroll.year}`;

    await this.auditService.logAction(
      companyId,
      employeeId,
      'DOWNLOAD',
      'PayrollRecord',
      payrollId,
      null,
      { description: desc },
    );

    return { success: true };
  }

  // ==========================================
  // FULL & FINAL SETTLEMENT (F&F) ENGINE (P-15)
  // ==========================================
  async calculateFinalSettlement(
    companyId: string,
    dto: {
      employeeId: string;
      exitDate: string;
      noticeShortfallDays?: number;
      additionalBonus?: number;
      additionalDeductions?: number;
      remarks?: string;
    },
  ) {
    const employee = await this.prisma.employee.findFirst({
      where: { id: dto.employeeId, companyId },
      include: {
        salaryStructure: true,
        exitRecord: true,
        leaveAllocations: {
          include: { leavePolicy: true },
        },
      },
    });

    if (!employee) throw new NotFoundException('Employee not found in your company.');
    const structure = employee.salaryStructure;
    if (!structure) {
      throw new BadRequestException('Employee does not have an active salary structure.');
    }

    const exitDate = new Date(dto.exitDate);
    const joiningDate = employee.joiningDate ? new Date(employee.joiningDate) : new Date(employee.createdAt);

    // 1. Service Tenure (Years)
    const diffMs = exitDate.getTime() - joiningDate.getTime();
    const tenureYears = Math.max(0, parseFloat((diffMs / (365.25 * 24 * 60 * 60 * 1000)).toFixed(2)));

    // 2. Gratuity (Payment of Gratuity Act, 1972)
    // Gratuity = (15 * Last drawn basic * Tenure in years) / 26
    let gratuity = 0;
    const isEligibleForGratuity = tenureYears >= 4.8;
    if (isEligibleForGratuity) {
      gratuity = Math.round((15 * structure.basicSalary * tenureYears) / 26);
      gratuity = Math.min(2000000, gratuity); // Statutory cap
    }

    // 3. Leave Encashment (Earned & Casual Leave unused balances)
    let unusedPaidLeaveDays = 0;
    employee.leaveAllocations?.forEach((alloc) => {
      if (alloc.leavePolicy?.isPaid) {
        const remaining = Math.max(0, alloc.allocatedDays - alloc.usedDays);
        unusedPaidLeaveDays += remaining;
      }
    });

    const dailyBasicRate = structure.basicSalary / 30;
    const leaveEncashment = parseFloat((unusedPaidLeaveDays * dailyBasicRate).toFixed(2));

    // 4. Prorated Monthly Pay for Days Worked in Exit Month
    const daysInExitMonth = new Date(exitDate.getFullYear(), exitDate.getMonth() + 1, 0).getDate();
    const workedDaysInExitMonth = Math.min(exitDate.getDate(), daysInExitMonth);
    const grossMonthly =
      structure.basicSalary +
      structure.hra +
      structure.conveyanceAllowance +
      structure.medicalAllowance +
      structure.specialAllowance +
      (structure.otherAllowances || 0);
    const dailyGrossRate = grossMonthly / daysInExitMonth;
    const proratedSalary = parseFloat((workedDaysInExitMonth * dailyGrossRate).toFixed(2));

    // 5. Notice Period Recovery
    const shortfallDays = dto.noticeShortfallDays || 0;
    const noticeRecovery = parseFloat((shortfallDays * dailyGrossRate).toFixed(2));

    // 6. Assets return check
    const hasReturnedAssets = employee.exitRecord?.hasReturnedAssets ?? false;

    // 7. Net Settlement Calculation
    const additionalBonus = dto.additionalBonus || 0;
    const additionalDeductions = dto.additionalDeductions || 0;

    const totalEarnings = proratedSalary + leaveEncashment + gratuity + additionalBonus;
    const totalDeductions = noticeRecovery + additionalDeductions;
    const netSettlementAmount = parseFloat((totalEarnings - totalDeductions).toFixed(2));

    return {
      employee: {
        id: employee.id,
        name: (employee.firstName + " " + employee.lastName).trim(),
        employeeCode: employee.employeeCode,
        joiningDate,
        exitDate,
        tenureYears,
        hasReturnedAssets,
      },
      earnings: {
        proratedSalary,
        workedDaysInExitMonth,
        leaveEncashment,
        unusedPaidLeaveDays,
        gratuity,
        isEligibleForGratuity,
        additionalBonus,
        totalEarnings,
      },
      recoveries: {
        noticeRecovery,
        shortfallDays,
        additionalDeductions,
        totalDeductions,
      },
      netSettlementAmount,
      currency: 'INR',
      remarks: dto.remarks || 'Full and Final Settlement',
    };
  }

  async processFinalSettlement(
    companyId: string,
    dto: {
      employeeId: string;
      exitDate: string;
      noticeShortfallDays?: number;
      additionalBonus?: number;
      additionalDeductions?: number;
      remarks?: string;
    },
    actorId: string,
  ) {
    const calculation = await this.calculateFinalSettlement(companyId, dto);

    await this.prisma.employeeExit.upsert({
      where: { employeeId: dto.employeeId },
      update: {
        status: 'COMPLETED',
        exitDate: new Date(dto.exitDate),
        exitInterviewNotes: "F&F Processed. Net Settlement: INR " + calculation.netSettlementAmount + ". " + (dto.remarks || ""),
      },
      create: {
        employeeId: dto.employeeId,
        exitDate: new Date(dto.exitDate),
        reason: 'RESIGNED',
        status: 'COMPLETED',
        exitInterviewNotes: "F&F Processed. Net Settlement: INR " + calculation.netSettlementAmount + ". " + (dto.remarks || ""),
      },
    });

    await this.prisma.employee.update({
      where: { id: dto.employeeId },
      data: { employmentStatus: 'TERMINATED' },
    });

    await this.auditService.logAction(
      companyId,
      actorId,
      'CREATE',
      'PayrollRecord',
      dto.employeeId,
      null,
      {
        action: 'FULL_AND_FINAL_SETTLEMENT',
        netSettlementAmount: calculation.netSettlementAmount,
        gratuity: calculation.earnings.gratuity,
        leaveEncashment: calculation.earnings.leaveEncashment,
      },
    );

    return {
      success: true,
      settlement: calculation,
    };
  }
}