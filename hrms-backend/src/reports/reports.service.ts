import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { DateRange } from './report-range';

/**
 * Tenant report datasets — real data only, computed with aggregate SQL
 * (groupBy/count) so exports stay fast on large workspaces.
 */
@Injectable()
export class ReportsService {
  constructor(private prisma: PrismaService) {}

  private employeeSelect() {
    return {
      employeeCode: true,
      firstName: true,
      lastName: true,
      email: true,
      phone: true,
      role: true,
      workerType: true,
      joiningDate: true,
      employmentStatus: true,
      department: { select: { name: true } },
      designation: { select: { name: true } },
      salaryStructure: { select: { basicSalary: true } },
      exitRecord: { select: { exitDate: true, reason: true } },
    };
  }

  /** Employee roster joined / exited within the range */
  async employees(companyId: string, range: DateRange) {
    const [joined, exited] = await Promise.all([
      this.prisma.employee.findMany({
        where: { companyId, joiningDate: { gte: range.from, lte: range.to } },
        select: this.employeeSelect(),
        orderBy: { joiningDate: 'asc' },
      }),
      this.prisma.employeeExit.findMany({
        where: { employee: { companyId }, exitDate: { gte: range.from, lte: range.to } },
        select: {
          exitDate: true,
          reason: true,
          employee: {
            select: {
              employeeCode: true,
              firstName: true,
              lastName: true,
              email: true,
              department: { select: { name: true } },
            },
          },
        },
      }),
    ]);
    return {
      joined: joined.map((e) => ({
        code: e.employeeCode,
        name: `${e.firstName} ${e.lastName}`,
        email: e.email,
        phone: e.phone,
        department: e.department?.name,
        designation: e.designation?.name,
        role: e.role,
        workerType: e.workerType,
        joiningDate: e.joiningDate,
        employmentStatus: e.employmentStatus,
        basicSalary: e.salaryStructure?.basicSalary ?? 0,
      })),
      exited: exited.map((x) => ({
        code: x.employee?.employeeCode,
        name: x.employee
          ? `${x.employee.firstName} ${x.employee.lastName}`
          : '-',
        email: x.employee?.email,
        department: x.employee?.department?.name,
        exitDate: x.exitDate,
        reason: x.reason,
      })),
    };
  }

  /** Per-employee attendance aggregates for the range */
  async attendance(companyId: string, range: DateRange) {
    const grouped = await this.prisma.attendance.groupBy({
      by: ['employeeId', 'status'],
      where: { companyId, date: { gte: range.from, lte: range.to } },
      _count: { _all: true },
      _sum: { workingHours: true, overtimeHours: true },
    });

    const ids = [...new Set(grouped.map((g) => g.employeeId))];
    const employees = ids.length
      ? await this.prisma.employee.findMany({
          where: { id: { in: ids } },
          select: {
            id: true,
            employeeCode: true,
            firstName: true,
            lastName: true,
            department: { select: { name: true } },
          },
        })
      : [];
    const empMap = new Map(employees.map((e) => [e.id, e]));

    const byEmployee = new Map<
      string,
      {
        code: string | null;
        name: string;
        department: string;
        present: number;
        absent: number;
        halfDay: number;
        late: number;
        leave: number;
        totalHours: number;
        overtimeHours: number;
        days: number;
      }
    >();
    for (const g of grouped) {
      const emp = empMap.get(g.employeeId);
      if (!emp) continue;
      const row =
        byEmployee.get(g.employeeId) ??
        {
          code: emp.employeeCode,
          name: `${emp.firstName} ${emp.lastName}`,
          department: emp.department?.name ?? '-',
          present: 0,
          absent: 0,
          halfDay: 0,
          late: 0,
          leave: 0,
          totalHours: 0,
          overtimeHours: 0,
          days: 0,
        };
      const status = (g.status || '').toUpperCase();
      if (status === 'PRESENT') row.present += g._count._all;
      else if (status === 'ABSENT') row.absent += g._count._all;
      else if (status === 'HALF_DAY') row.halfDay += g._count._all;
      else if (status === 'LEAVE' || status === 'ON_LEAVE') row.leave += g._count._all;
      row.totalHours += Number(g._sum.workingHours ?? 0);
      row.overtimeHours += Number(g._sum.overtimeHours ?? 0);
      row.days += g._count._all;
      byEmployee.set(g.employeeId, row);
    }

    // Late counts need the isLate flag — one grouped query
    const late = await this.prisma.attendance.groupBy({
      by: ['employeeId'],
      where: { companyId, date: { gte: range.from, lte: range.to }, isLate: true },
      _count: { _all: true },
    });
    for (const l of late) {
      const row = byEmployee.get(l.employeeId);
      if (row) row.late = l._count._all;
    }

    return [...byEmployee.values()]
      .map((r) => ({
        ...r,
        totalHours: Math.round(r.totalHours * 10) / 10,
        overtimeHours: Math.round(r.overtimeHours * 10) / 10,
        attendanceRate:
          r.days > 0
            ? `${Math.round(((r.present + r.halfDay * 0.5 + r.leave) / r.days) * 100)}%`
            : '-',
      }))
      .sort((a, b) => a.name.localeCompare(b.name));
  }

  /** Leave requests in the range */
  async leave(companyId: string, range: DateRange) {
    const requests = await this.prisma.leaveRequest.findMany({
      where: {
        employee: { companyId },
        OR: [
          { startDate: { gte: range.from, lte: range.to } },
          { endDate: { gte: range.from, lte: range.to } },
        ],
      },
      include: {
        employee: {
          select: {
            employeeCode: true,
            firstName: true,
            lastName: true,
            department: { select: { name: true } },
          },
        },
      },
      orderBy: { startDate: 'asc' },
    });
    return requests.map((r) => ({
      code: r.employee?.employeeCode,
      name: r.employee ? `${r.employee.firstName} ${r.employee.lastName}` : '-',
      department: r.employee?.department?.name,
      type: r.type,
      startDate: r.startDate,
      endDate: r.endDate,
      days: r.totalDays,
      status: r.status,
      reason: r.reason,
    }));
  }

  /** Payroll records in the range */
  async payroll(companyId: string, range: DateRange) {
    const records = await this.prisma.payrollRecord.findMany({
      where: {
        companyId,
        OR: [
          { createdAt: { gte: range.from, lte: range.to } },
          { status: { in: ['PAID', 'APPROVED'] }, updatedAt: { gte: range.from, lte: range.to } },
        ],
      },
      include: {
        employee: {
          select: {
            employeeCode: true,
            firstName: true,
            lastName: true,
            department: { select: { name: true } },
            workerType: true,
          },
        },
      },
      orderBy: [{ year: 'desc' }, { month: 'desc' }],
    });
    const rows = records.map((r) => ({
      code: r.employee?.employeeCode,
      name: r.employee ? `${r.employee.firstName} ${r.employee.lastName}` : '-',
      department: r.employee?.department?.name,
      workerType: r.workerType,
      month: `${r.year}-${String(r.month).padStart(2, '0')}`,
      basicPay: r.basicPay,
      allowances: r.allowances,
      arrearsPay: r.arrearsPay,
      grossPay: Math.round((r.basicPay + r.allowances + r.arrearsPay) * 100) / 100,
      loanDeduction: r.loanDeductions,
      tds: r.tdsDeduction,
      totalDeductions: r.deductions,
      netSalary: r.netSalary,
      status: r.status,
    }));
    const totals = rows.reduce(
      (acc, r) => ({
        gross: acc.gross + r.grossPay,
        deductions: acc.deductions + r.totalDeductions,
        net: acc.net + r.netSalary,
        count: acc.count + 1,
      }),
      { gross: 0, deductions: 0, net: 0, count: 0 },
    );
    return { rows, totals };
  }

  /** Loans created / repaid in the range */
  async loans(companyId: string, range: DateRange) {
    const [created, repayments] = await Promise.all([
      this.prisma.employeeLoan.findMany({
        where: { companyId, createdAt: { gte: range.from, lte: range.to } },
        include: {
          employee: {
            select: {
              employeeCode: true,
              firstName: true,
              lastName: true,
              department: { select: { name: true } },
            },
          },
        },
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.loanRepayment.findMany({
        where: {
          loan: { companyId },
          repaymentDate: { gte: range.from, lte: range.to },
        },
        include: {
          loan: {
            select: {
              employee: {
                select: {
                  employeeCode: true,
                  firstName: true,
                  lastName: true,
                },
              },
            },
          },
        },
        orderBy: { repaymentDate: 'asc' },
      }),
    ]);
    return {
      created: created.map((l) => ({
        code: l.employee?.employeeCode,
        name: l.employee ? `${l.employee.firstName} ${l.employee.lastName}` : '-',
        department: l.employee?.department?.name,
        type: l.type,
        principal: l.principalAmount,
        interestRate: l.interestRate,
        tenureMonths: l.tenureMonths,
        emi: l.monthlyEmi,
        disbursedDate: l.disbursedDate,
        outstanding: l.remainingBalance,
        status: l.status,
      })),
      repayments: repayments.map((r) => ({
        code: r.loan?.employee?.employeeCode,
        name: r.loan?.employee
          ? `${r.loan.employee.firstName} ${r.loan.employee.lastName}`
          : '-',
        amount: r.amount,
        principalPaid: r.principalPaid,
        interestPaid: r.interestPaid,
        method: r.method,
        status: r.status,
        repaymentDate: r.repaymentDate,
      })),
    };
  }

  /** Headline numbers for the range (report summary cards) */
  async summary(companyId: string, range: DateRange) {
    const [
      headcount,
      newHires,
      exits,
      attendanceCount,
      presentCount,
      leaveCount,
      payrollAgg,
      loanAgg,
      repaymentAgg,
    ] = await Promise.all([
      this.prisma.employee.count({ where: { companyId, exitRecord: null } }),
      this.prisma.employee.count({
        where: { companyId, joiningDate: { gte: range.from, lte: range.to } },
      }),
      this.prisma.employeeExit.count({
        where: { employee: { companyId }, exitDate: { gte: range.from, lte: range.to } },
      }),
      this.prisma.attendance.count({
        where: { companyId, date: { gte: range.from, lte: range.to } },
      }),
      this.prisma.attendance.count({
        where: { companyId, date: { gte: range.from, lte: range.to }, status: 'PRESENT' },
      }),
      this.prisma.leaveRequest.count({
        where: {
          employee: { companyId },
          startDate: { gte: range.from, lte: range.to },
        },
      }),
      this.prisma.payrollRecord.aggregate({
        where: {
          companyId,
          createdAt: { gte: range.from, lte: range.to },
        },
        _count: { _all: true },
        _sum: { netSalary: true, deductions: true },
      }),
      this.prisma.employeeLoan.aggregate({
        where: { companyId, createdAt: { gte: range.from, lte: range.to } },
        _count: { _all: true },
        _sum: { principalAmount: true, remainingBalance: true },
      }),
      this.prisma.loanRepayment.aggregate({
        where: { loan: { companyId }, repaymentDate: { gte: range.from, lte: range.to } },
        _sum: { amount: true },
        _count: { _all: true },
      }),
    ]);

    return {
      range: { from: range.from, to: range.to, label: range.label },
      headcount,
      newHires,
      exits,
      attendanceRecords: attendanceCount,
      attendanceRate:
        attendanceCount > 0
          ? Math.round((presentCount / attendanceCount) * 100)
          : null,
      leaveRequests: leaveCount,
      payrollRuns: payrollAgg._count._all,
      payrollNet: Number(payrollAgg._sum.netSalary ?? 0),
      payrollDeductions: Number(payrollAgg._sum.deductions ?? 0),
      loansCreated: loanAgg._count._all,
      loansPrincipal: Number(loanAgg._sum.principalAmount ?? 0),
      loansOutstanding: Number(loanAgg._sum.remainingBalance ?? 0),
      loanRepayments: repaymentAgg._count._all,
      loanRepaymentsAmount: Number(repaymentAgg._sum.amount ?? 0),
    };
  }
}
