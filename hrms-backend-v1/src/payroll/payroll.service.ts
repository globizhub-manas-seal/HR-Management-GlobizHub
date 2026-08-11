import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class PayrollService {
  constructor(private prisma: PrismaService) {}

  // 1. Set or Update an Employee's Salary Structure
  async upsertSalaryStructure(employeeId: string, data: any) {
    return this.prisma.salaryStructure.upsert({
      where: { employeeId },
      update: data,
      create: { ...data, employeeId },
    });
  }

  // 2. THE PAYROLL ENGINE: Generate a monthly payslip
  async generatePayroll(
    companyId: string,
    employeeId: string,
    month: number,
    year: number,
    processorId: string,
  ) {
    // A. Verify the employee and their salary structure
    const employee = await this.prisma.employee.findFirst({
      where: { id: employeeId, companyId },
      include: { salaryStructure: true },
    });

    if (!employee)
      throw new NotFoundException('Employee not found in your workspace.');
    if (!employee.salaryStructure)
      throw new BadRequestException(
        'No salary structure defined for this employee. Please set it up first.',
      );

    // B. Prevent double-processing
    const existingRecord = await this.prisma.payrollRecord.findUnique({
      where: {
        employeeId_month_year: { employeeId, month, year },
      },
    });

    if (existingRecord && existingRecord.status === 'PAID') {
      throw new BadRequestException(
        'Payroll for this month has already been processed and paid.',
      );
    }

    // C. Calculate Date Ranges for the Month
    const startOfMonth = new Date(year, month - 1, 1);
    const endOfMonth = new Date(year, month, 0, 23, 59, 59, 999);

    // Assume a standard 30-day payroll divisor (standard HR practice)
    const STANDARD_DAYS_IN_MONTH = 30;
    const STANDARD_WORK_HOURS_PER_DAY = 8;

    // D. Fetch Attendance & Leave Data
    // Find all approved unpaid leaves (Loss of Pay - LOP)
    const unpaidLeaves = await this.prisma.leaveRequest.count({
      where: {
        employeeId,
        status: 'APPROVED',
        type: 'UNPAID', // Assuming you have an UNPAID or LOP type
        startDate: { gte: startOfMonth },
        endDate: { lte: endOfMonth },
      },
    });

    // Aggregate total overtime hours from the attendance table
    const attendanceData = await this.prisma.attendance.aggregate({
      where: {
        employeeId,
        date: { gte: startOfMonth, lte: endOfMonth },
        status: 'PRESENT',
      },
      _sum: { overtimeHours: true },
      _count: { id: true },
    });

    const presentDays = attendanceData._count.id || 0;
    const totalOvertime = attendanceData._sum.overtimeHours || 0;

    // E. THE MATH (The fun part!)
    const struct = employee.salaryStructure;

    // Daily Rate Calculation
    const dailyRate = struct.basicSalary / STANDARD_DAYS_IN_MONTH;
    const hourlyRate = dailyRate / STANDARD_WORK_HOURS_PER_DAY;

    // Loss of Pay Deduction
    const lopDeduction = unpaidLeaves * dailyRate;

    // Overtime Calculation (Standard is 1.5x hourly rate)
    const overtimePay = totalOvertime * (hourlyRate * 1.5);

    // Final Totals
    const totalEarnings =
      struct.basicSalary + struct.hra + struct.otherAllowances + overtimePay;
    const totalDeductions =
      struct.pfContribution + struct.taxDeduction + lopDeduction;
    const netSalary = totalEarnings - totalDeductions;

    // Breakdown Snapshot (Freezing the data so the PDF never changes)
    const breakdown = {
      earnings: {
        basic: struct.basicSalary,
        hra: struct.hra,
        otherAllowances: struct.otherAllowances,
        overtime: Math.round(overtimePay * 100) / 100,
      },
      deductions: {
        providentFund: struct.pfContribution,
        tax: struct.taxDeduction,
        lossOfPay: Math.round(lopDeduction * 100) / 100,
      },
      stats: {
        presentDays,
        unpaidLeaves,
        totalOvertime,
      },
    };

    // F. Save to Database
    return this.prisma.payrollRecord.upsert({
      where: {
        employeeId_month_year: { employeeId, month, year },
      },
      update: {
        basicPay: struct.basicSalary,
        allowances: struct.hra + struct.otherAllowances + overtimePay,
        deductions: totalDeductions,
        netSalary: Math.round(netSalary * 100) / 100,
        totalWorkingDays: STANDARD_DAYS_IN_MONTH,
        presentDays,
        unpaidLeaves,
        overtimeHours: totalOvertime,
        breakdown,
        processedById: processorId,
        processedDate: new Date(),
      },
      create: {
        companyId,
        employeeId,
        month,
        year,
        basicPay: struct.basicSalary,
        allowances: struct.hra + struct.otherAllowances + overtimePay,
        deductions: totalDeductions,
        netSalary: Math.round(netSalary * 100) / 100,
        totalWorkingDays: STANDARD_DAYS_IN_MONTH,
        presentDays,
        unpaidLeaves,
        overtimeHours: totalOvertime,
        breakdown,
        processedById: processorId,
        processedDate: new Date(),
        status: 'DRAFT',
      },
    });
  }

  // 3. Get Payroll History for an Employee
  async getMyPayslips(employeeId: string) {
    return this.prisma.payrollRecord.findMany({
      where: { employeeId, status: 'PAID' },
      orderBy: [{ year: 'desc' }, { month: 'desc' }],
    });
  }
}
