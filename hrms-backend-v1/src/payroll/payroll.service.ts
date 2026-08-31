import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ForbiddenException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { S3Service } from '../s3/s3.service';
import { AuditService } from '../audit/audit.service';

@Injectable()
export class PayrollService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly s3Service: S3Service,
    private readonly auditService: AuditService,
  ) {}

  /**
   * Letterheads are stored as private S3 objects. Convert the stored URL to a
   * short-lived view URL for API consumers without changing the saved value.
   * Older payslips with no snapshot therefore use the current company header.
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

  // Reusing the exact same logic from LeaveService to ensure LOP math matches Leave math perfectly
  private async calculateWorkingDaysInRange(
    startDate: Date,
    endDate: Date,
    companyId: string,
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

    while (currentDate <= end) {
      const dayOfWeek = currentDate.getDay();
      const isWeekend = dayOfWeek === 0 || dayOfWeek === 6;
      const isHoliday = holidayDates.includes(currentDate.getTime());

      if (!isWeekend && !isHoliday) {
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
    // 1. Define the exact boundaries of the payroll month
    const startOfMonth = new Date(year, month - 1, 1);
    const endOfMonth = new Date(year, month, 0); // 0th day of next month = last day of this month

    // 2. Prevent Double-Processing
    const existingRecord = await this.prisma.payrollRecord.findFirst({
      where: { employeeId, month, year },
    });
    if (existingRecord) {
      throw new BadRequestException(
        `Payroll for ${month}/${year} has already been generated for this employee.`,
      );
    }

    // 3. Fetch the Employee's Active Salary Structure
    const structure = await this.prisma.salaryStructure.findUnique({
      where: { employeeId },
    });
    if (!structure) {
      throw new NotFoundException(
        'No active salary structure found for this employee.',
      );
    }

    // Capture the letterhead used when this payslip is created so later
    // company branding changes do not alter historical payslips.
    const company = await this.prisma.company.findUnique({
      where: { id: companyId },
      select: {
        name: true,
        settings: { select: { payslipHeaderUrl: true } },
      },
    });

    // 4. THE CROSS-MONTH LOP CALCULATOR
    // Fetch all APPROVED leaves that OVERLAP with this month (to check for unpaid policy or type UNPAID)
    const overlappingLeaves = await this.prisma.leaveRequest.findMany({
      where: {
        employeeId,
        status: 'APPROVED',
        startDate: { lte: endOfMonth }, // Started before month ended
        endDate: { gte: startOfMonth }, // Ended after month started
      },
      include: {
        allocation: {
          include: {
            leavePolicy: true,
          },
        },
      },
    });

    let totalUnpaidDays = 0;

    for (const leave of overlappingLeaves) {
      // A leave is unpaid if its type is 'UNPAID' or the policy defines it as unpaid (isPaid = false)
      const isUnpaid =
        leave.type === 'UNPAID' ||
        leave.allocation?.leavePolicy?.isPaid === false;

      if (isUnpaid) {
        // Find the mathematical intersection of the leave dates and the month boundaries
        const effectiveStart =
          leave.startDate < startOfMonth ? startOfMonth : leave.startDate;
        const effectiveEnd =
          leave.endDate > endOfMonth ? endOfMonth : leave.endDate;

        // Calculate working days just for this specific chunk inside this month
        const chunkDays = await this.calculateWorkingDaysInRange(
          effectiveStart,
          effectiveEnd,
          companyId,
        );
        totalUnpaidDays += chunkDays;
      }
    }

    // Aggregate overtime hours from Attendance records for this employee in the month
    const attendanceSummary = await this.prisma.attendance.aggregate({
      where: {
        employeeId,
        companyId,
        date: {
          gte: startOfMonth,
          lte: endOfMonth,
        },
      },
      _sum: {
        overtimeHours: true,
      },
    });
    const overtimeHours = attendanceSummary._sum.overtimeHours || 0;

    // 5. FINANCIAL MATH
    // Standard HR math assumes a 30-day billing divisor, or actual days in month. We'll use actual days.
    const daysInMonth = endOfMonth.getDate();
    const dailyRate = structure.basicSalary / daysInMonth;
    const lopDeduction = parseFloat((totalUnpaidDays * dailyRate).toFixed(2));

    // ✅ UPDATED: Sum up all new earnings
    const grossEarnings =
      structure.basicSalary +
      structure.hra +
      structure.conveyanceAllowance +
      structure.medicalAllowance +
      structure.specialAllowance;

    // ✅ UPDATED: Sum up all new deductions
    const standardDeductions =
      structure.pfContribution +
      structure.taxDeduction +
      structure.professionalTax;
    const totalDeductions = standardDeductions + lopDeduction;
    const netSalary = parseFloat((grossEarnings - totalDeductions).toFixed(2));

    // 6. CREATE THE IMMUTABLE SNAPSHOT
    return this.prisma.payrollRecord.create({
      data: {
        companyId,
        employeeId,
        month,
        year,
        totalWorkingDays: daysInMonth,
        presentDays: daysInMonth - totalUnpaidDays,
        unpaidLeaves: totalUnpaidDays,
        overtimeHours,

        basicPay: structure.basicSalary,
        allowances:
          structure.hra +
          structure.conveyanceAllowance +
          structure.medicalAllowance +
          structure.specialAllowance,
        deductions: totalDeductions,
        netSalary,

        status: 'DRAFT', // Leaves it as a draft so HR can review before marking 'PAID'
        processedById: generatedById,
        processedDate: new Date(),

        // 🔒 IMMUTABLE JSON PAYSLIP SNAPSHOT
        breakdown: {
          meta: {
            companyName: company?.name ?? null,
            letterheadUrl: company?.settings?.payslipHeaderUrl ?? null,
          },
          earnings: {
            basic: structure.basicSalary,
            hra: structure.hra,
            conveyance: structure.conveyanceAllowance,
            medical: structure.medicalAllowance,
            special: structure.specialAllowance,
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
  // HR/ADMIN: SET SALARY STRUCTURE
  // ==========================================
  async upsertSalaryStructure(
    companyId: string,
    employeeId: string,
    data: any,
  ) {
    return this.prisma.salaryStructure.upsert({
      where: { employeeId },
      update: { ...data },
      create: {
        ...data,
        employeeId,
        companyId,
      },
    });
  }

  // ==========================================
  // EMPLOYEE: GET MY PAYSLIPS
  // ==========================================
  async getMyPayslips(employeeId: string) {
    const records = await this.prisma.payrollRecord.findMany({
      // Notice we only fetch APPROVED or PAID payslips!
      // We don't want employees seeing DRAFTs while HR is working on them.
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
  // HR/ADMIN: UPDATE PAYROLL STATUS
  // ==========================================
  async updatePayrollStatus(
    companyId: string,
    recordId: string,
    status: string,
    role: string,
  ) {
    // 1. Role Guard
    if (!['SUPER_ADMIN', 'HR_HEAD', 'MANAGER'].includes(role)) {
      throw new ForbiddenException(
        'You do not have permission to approve payroll.',
      );
    }

    // 2. Verify Record Ownership
    const record = await this.prisma.payrollRecord.findUnique({
      where: { id: recordId },
    });

    if (!record || record.companyId !== companyId) {
      throw new NotFoundException('Payroll record not found.');
    }

    // 3. Update Status
    return this.prisma.payrollRecord.update({
      where: { id: recordId },
      data: { status },
    });
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
}
