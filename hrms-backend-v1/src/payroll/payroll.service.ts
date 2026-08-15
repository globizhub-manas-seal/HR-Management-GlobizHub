import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ForbiddenException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class PayrollService {
  constructor(private readonly prisma: PrismaService) {}

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
    let currentDate = new Date(start);

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

    // 4. THE CROSS-MONTH LOP CALCULATOR
    // Fetch all UNPAID leaves that OVERLAP with this month
    const overlappingUnpaidLeaves = await this.prisma.leaveRequest.findMany({
      where: {
        employeeId,
        status: 'APPROVED',
        type: 'UNPAID',
        startDate: { lte: endOfMonth }, // Started before month ended
        endDate: { gte: startOfMonth }, // Ended after month started
      },
    });

    let totalUnpaidDays = 0;

    for (const leave of overlappingUnpaidLeaves) {
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

    // 5. FINANCIAL MATH
    // Standard HR math assumes a 30-day billing divisor, or actual days in month. We'll use actual days.
    const daysInMonth = endOfMonth.getDate();
    const dailyRate = structure.basicSalary / daysInMonth;
    const lopDeduction = parseFloat((totalUnpaidDays * dailyRate).toFixed(2));

    const grossEarnings =
      structure.basicSalary + structure.hra + structure.otherAllowances;
    const standardDeductions =
      structure.pfContribution + structure.taxDeduction;
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

        basicPay: structure.basicSalary,
        allowances: structure.hra + structure.otherAllowances,
        deductions: totalDeductions,
        netSalary,

        status: 'DRAFT', // Leaves it as a draft so HR can review before marking 'PAID'
        processedById: generatedById,
        processedDate: new Date(),

        // 🔒 IMMUTABLE JSON PAYSLIP SNAPSHOT
        breakdown: {
          earnings: {
            basic: structure.basicSalary,
            hra: structure.hra,
            other: structure.otherAllowances,
            total: grossEarnings,
          },
          deductions: {
            pf: structure.pfContribution,
            tax: structure.taxDeduction,
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
    return this.prisma.payrollRecord.findMany({
      where: { companyId, month, year },
      include: {
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
  }

  // ==========================================
  // EMPLOYEE: GET MY PAYSLIPS
  // ==========================================

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
    return this.prisma.payrollRecord.findMany({
      // Notice we only fetch APPROVED or PAID payslips!
      // We don't want employees seeing DRAFTs while HR is working on them.
      where: {
        employeeId,
        status: { in: ['APPROVED', 'PAID'] },
      },
      include: {
        employee: {
          select: { firstName: true, lastName: true, employeeCode: true },
        },
      },
      orderBy: [{ year: 'desc' }, { month: 'desc' }],
    });
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
}
