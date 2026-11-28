import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import * as crypto from 'crypto';
import { PrismaService } from '../prisma/prisma.service';
import { RazorpayService } from '../platform/billing/razorpay.service';
import {
  LoanRepaymentDto,
  LoanRequestDto,
  LoanSettingsDto,
} from './dto/loan.dto';

/**
 * Loans & Salary Advances — full lifecycle for business owners.
 *
 *  request -> approve/reject -> disburse -> repayments (payroll auto-deduct,
 *  manual, or Razorpay online repayment) -> PAID_OFF. Every transition is
 *  recorded in LoanActivity (immutable audit trail) and the amortization
 *  schedule is computed from the policy interest rate.
 */

const ADMIN_ROLES = ['OWNER', 'SUPER_ADMIN', 'HR_HEAD'];
const round2 = (n: number) => Math.round(n * 100) / 100;

@Injectable()
export class LoanService {
  private readonly logger = new Logger(LoanService.name);

  constructor(
    private prisma: PrismaService,
    private razorpay: RazorpayService,
  ) {}

  // ---------- helpers ----------

  private isAdmin(role?: string) {
    return ADMIN_ROLES.includes(role ?? '');
  }

  private async assertAccess(companyId: string, loanId: string) {
    const loan = await this.prisma.employeeLoan.findFirst({
      where: { id: loanId, companyId },
    });
    if (!loan) throw new NotFoundException('Loan not found');
    return loan;
  }

  private async log(
    loanId: string,
    action: string,
    actorId?: string,
    actorName?: string,
    details?: string,
  ) {
    await this.prisma.loanActivity
      .create({
        data: { loanId, action, actorId, actorName, details },
      })
      .catch(() => {});
  }

  /** Amortized EMI (or straight-line when interest rate is 0). */
  computeEmi(principal: number, annualRatePct: number, tenureMonths: number) {
    const r = annualRatePct / 12 / 100;
    if (tenureMonths <= 0) return round2(principal);
    if (r === 0) return round2(principal / tenureMonths);
    const emi =
      (principal * r * Math.pow(1 + r, tenureMonths)) /
      (Math.pow(1 + r, tenureMonths) - 1);
    return round2(emi);
  }

  /**
   * Amortization schedule: for each installment — interest part, principal
   * part, running balance.
   */
  buildSchedule(
    principal: number,
    annualRatePct: number,
    tenureMonths: number,
    startYear: number,
    startMonth: number,
  ) {
    const emi = this.computeEmi(principal, annualRatePct, tenureMonths);
    const r = annualRatePct / 12 / 100;
    let balance = principal;
    const rows: Array<{
      installment: number;
      dueMonth: number;
      dueYear: number;
      emi: number;
      interest: number;
      principalPart: number;
      balance: number;
    }> = [];
    let year = startYear;
    let month = startMonth;
    for (let i = 1; i <= tenureMonths; i++) {
      const interest = round2(balance * r);
      const principalPart = round2(Math.min(balance, Math.max(0, emi - interest)));
      balance = round2(Math.max(0, balance - principalPart));
      rows.push({
        installment: i,
        dueMonth: month,
        dueYear: year,
        emi: i === tenureMonths ? round2(principalPart + interest) : emi,
        interest,
        principalPart,
        balance,
      });
      month += 1;
      if (month > 12) {
        month = 1;
        year += 1;
      }
    }
    return rows;
  }

  // ---------- settings ----------

  async getSettings(companyId: string) {
    const settings = await this.prisma.companySettings.findUnique({
      where: { companyId },
      select: {
        loanAllowSalaryAdvance: true,
        loanAllowPersonalLoan: true,
        loanAllowEmergencyLoan: true,
        loanMaxAmount: true,
        loanMaxTenureMonths: true,
        loanDefaultInterestRate: true,
        loanAutoDeductFromPayroll: true,
      },
    });
    return (
      settings ?? {
        loanAllowSalaryAdvance: true,
        loanAllowPersonalLoan: true,
        loanAllowEmergencyLoan: true,
        loanMaxAmount: null,
        loanMaxTenureMonths: 12,
        loanDefaultInterestRate: 0,
        loanAutoDeductFromPayroll: true,
      }
    );
  }

  async updateSettings(companyId: string, dto: LoanSettingsDto, actor: { id: string; name: string }) {
    await this.prisma.companySettings.upsert({
      where: { companyId },
      create: {
        companyId,
        loanAllowSalaryAdvance: dto.loanAllowSalaryAdvance ?? true,
        loanAllowPersonalLoan: dto.loanAllowPersonalLoan ?? true,
        loanAllowEmergencyLoan: dto.loanAllowEmergencyLoan ?? true,
        loanMaxAmount: dto.loanMaxAmount ?? null,
        loanMaxTenureMonths: dto.loanMaxTenureMonths ?? 12,
        loanDefaultInterestRate: dto.loanDefaultInterestRate ?? 0,
        loanAutoDeductFromPayroll: dto.loanAutoDeductFromPayroll ?? true,
      },
      update: {
        ...(dto.loanAllowSalaryAdvance !== undefined
          ? { loanAllowSalaryAdvance: dto.loanAllowSalaryAdvance }
          : {}),
        ...(dto.loanAllowPersonalLoan !== undefined
          ? { loanAllowPersonalLoan: dto.loanAllowPersonalLoan }
          : {}),
        ...(dto.loanAllowEmergencyLoan !== undefined
          ? { loanAllowEmergencyLoan: dto.loanAllowEmergencyLoan }
          : {}),
        ...(dto.loanMaxAmount !== undefined ? { loanMaxAmount: dto.loanMaxAmount } : {}),
        ...(dto.loanMaxTenureMonths !== undefined
          ? { loanMaxTenureMonths: dto.loanMaxTenureMonths }
          : {}),
        ...(dto.loanDefaultInterestRate !== undefined
          ? { loanDefaultInterestRate: dto.loanDefaultInterestRate }
          : {}),
        ...(dto.loanAutoDeductFromPayroll !== undefined
          ? { loanAutoDeductFromPayroll: dto.loanAutoDeductFromPayroll }
          : {}),
      },
    });
    this.logger.log(`Loan settings updated for company ${companyId}`);
    return this.getSettings(companyId);
  }

  // ---------- lifecycle ----------

  async requestLoan(
    companyId: string,
    dto: LoanRequestDto,
    actor: { id: string; role: string; name: string },
  ) {
    const settings = await this.getSettings(companyId);

    const allowedByType = {
      SALARY_ADVANCE: settings.loanAllowSalaryAdvance,
      PERSONAL_LOAN: settings.loanAllowPersonalLoan,
      EMERGENCY_LOAN: settings.loanAllowEmergencyLoan,
    } as Record<string, boolean>;
    if (allowedByType[dto.type] === false) {
      throw new BadRequestException(
        `${dto.type.replace('_', ' ').toLowerCase()} requests are disabled by company policy`,
      );
    }
    if (
      settings.loanMaxAmount != null &&
      dto.principalAmount > settings.loanMaxAmount
    ) {
      throw new BadRequestException(
        `Maximum loan amount allowed by policy is ${settings.loanMaxAmount}`,
      );
    }
    if (dto.tenureMonths > settings.loanMaxTenureMonths) {
      throw new BadRequestException(
        `Maximum tenure allowed by policy is ${settings.loanMaxTenureMonths} month(s)`,
      );
    }

    // Employees always self-request; admins may file on behalf
    const employeeId = this.isAdmin(actor.role)
      ? dto.employeeId ?? actor.id
      : actor.id;
    const employee = await this.prisma.employee.findFirst({
      where: { id: employeeId, companyId, exitRecord: null },
      select: { id: true, firstName: true, lastName: true },
    });
    if (!employee) throw new BadRequestException('Employee not found');

    // Business rule: one active loan per employee at a time (same as payroll)
    const existing = await this.prisma.employeeLoan.findFirst({
      where: {
        employeeId,
        status: { in: ['PENDING', 'APPROVED', 'ACTIVE'] },
      },
      select: { id: true },
    });
    if (existing) {
      throw new BadRequestException(
        'This employee already has an active or pending loan request',
      );
    }

    const interestRate =
      this.isAdmin(actor.role) && dto.type !== 'SALARY_ADVANCE'
        ? settings.loanDefaultInterestRate
        : settings.loanDefaultInterestRate;
    const monthlyEmi = this.computeEmi(
      dto.principalAmount,
      interestRate,
      dto.tenureMonths,
    );

    const loan = await this.prisma.employeeLoan.create({
      data: {
        companyId,
        employeeId,
        type: dto.type,
        principalAmount: dto.principalAmount,
        interestRate,
        tenureMonths: dto.tenureMonths,
        monthlyEmi,
        remainingBalance: dto.principalAmount,
        reason: dto.reason ?? null,
        deductionStartMonth: dto.deductionStartMonth ?? null,
        deductionStartYear: dto.deductionStartYear ?? null,
        status: 'PENDING',
      },
    });
    await this.log(
      loan.id,
      'CREATED',
      actor.id,
      actor.name,
      `${dto.type} of ${dto.principalAmount} over ${dto.tenureMonths} month(s) @ ${interestRate}% — EMI ${monthlyEmi}`,
    );
    return loan;
  }

  async approve(companyId: string, loanId: string, actor: { id: string; name: string }) {
    const loan = await this.assertAccess(companyId, loanId);
    if (loan.status !== 'PENDING') {
      throw new BadRequestException('Only pending loans can be approved');
    }
    const updated = await this.prisma.employeeLoan.update({
      where: { id: loan.id },
      data: {
        status: 'APPROVED',
        approvedById: actor.id,
      },
    });
    await this.log(loan.id, 'APPROVED', actor.id, actor.name);
    return updated;
  }

  async reject(
    companyId: string,
    loanId: string,
    dto: { rejectionReason: string },
    actor: { id: string; name: string },
  ) {
    const loan = await this.assertAccess(companyId, loanId);
    if (!['PENDING', 'APPROVED'].includes(loan.status)) {
      throw new BadRequestException('Only pending/approved loans can be rejected');
    }
    const updated = await this.prisma.employeeLoan.update({
      where: { id: loan.id },
      data: {
        status: 'REJECTED',
        rejectionReason: dto.rejectionReason,
      },
    });
    await this.log(loan.id, 'REJECTED', actor.id, actor.name, dto.rejectionReason);
    return updated;
  }

  async disburse(companyId: string, loanId: string, actor: { id: string; name: string }) {
    const loan = await this.assertAccess(companyId, loanId);
    if (loan.status !== 'APPROVED') {
      throw new BadRequestException('Only approved loans can be disbursed');
    }
    const now = new Date();
    const updated = await this.prisma.employeeLoan.update({
      where: { id: loan.id },
      data: {
        status: 'ACTIVE',
        disbursedDate: now,
        deductionStartMonth: loan.deductionStartMonth ?? now.getMonth() + 1,
        deductionStartYear: loan.deductionStartYear ?? now.getFullYear(),
      },
    });
    await this.log(loan.id, 'DISBURSED', actor.id, actor.name);
    return updated;
  }

  /** Manual repayment (cash/cheque/bank transfer recorded by the owner). */
  async repay(
    companyId: string,
    loanId: string,
    dto: LoanRepaymentDto,
    actor: { id: string; name: string },
  ) {
    const loan = await this.assertAccess(companyId, loanId);
    if (!['ACTIVE', 'APPROVED'].includes(loan.status)) {
      throw new BadRequestException('Loan is not active for repayment');
    }
    if (dto.amount <= 0) throw new BadRequestException('Amount must be positive');
    if (dto.amount > loan.remainingBalance + 0.01) {
      throw new BadRequestException(
        `Amount exceeds remaining balance (${loan.remainingBalance})`,
      );
    }

    const now = new Date();
    const interestPart = round2((loan.remainingBalance * loan.interestRate) / 12 / 100);
    const principalPart = round2(Math.max(0, dto.amount - interestPart));

    const [repayment] = await this.prisma.$transaction([
      this.prisma.loanRepayment.create({
        data: {
          loanId: loan.id,
          amount: round2(dto.amount),
          principalPaid: principalPart,
          interestPaid: round2(Math.min(interestPart, dto.amount)),
          month: now.getMonth() + 1,
          year: now.getFullYear(),
          status: 'PAID',
          method: 'MANUAL',
          paidAt: now,
          reference: dto.reference ?? null,
        },
      }),
      this.prisma.employeeLoan.update({
        where: { id: loan.id },
        data: {
          totalPaid: round2(loan.totalPaid + dto.amount),
          remainingBalance: round2(Math.max(0, loan.remainingBalance - principalPart)),
          status: loan.remainingBalance - principalPart <= 0.01 ? 'PAID_OFF' : loan.status,
        },
      }),
    ]);

    await this.log(
      loan.id,
      loan.remainingBalance - principalPart <= 0.01 ? 'CLOSED' : 'REPAYMENT',
      actor.id,
      actor.name,
      `Manual repayment of ${round2(dto.amount)}${dto.reference ? ` (${dto.reference})` : ''}`,
    );
    return repayment;
  }

  /**
   * Razorpay online repayment: creates an order for the given amount.
   * Sandbox environments get an `order_sbx_*` id that goes through the very
   * same HMAC verification path on /verify.
   */
  async createRepaymentOrder(
    companyId: string,
    loanId: string,
    amount: number | undefined,
    actor: { id: string; role: string },
  ) {
    const loan = await this.assertAccess(companyId, loanId);
    if (!this.isAdmin(actor.role) && loan.employeeId !== actor.id) {
      throw new ForbiddenException('You can only repay your own loans');
    }
    if (!['ACTIVE', 'APPROVED'].includes(loan.status)) {
      throw new BadRequestException('Loan is not active for repayment');
    }
    const payable = round2(Math.min(amount ?? loan.remainingBalance, loan.remainingBalance));
    if (payable <= 0) throw new BadRequestException('Nothing left to repay');

    const useRazorpay = this.razorpay.isConfigured();
    const sandbox = process.env.SANDBOX_PAYMENTS === 'true' && process.env.NODE_ENV !== 'production';
    let orderId: string;
    let keyId: string | null = null;
    if (useRazorpay && !sandbox) {
      const created = await this.razorpay.createOrder({
        amountPaise: Math.round(payable * 100),
        currency: 'INR',
        receipt: `LOAN-${loan.id.slice(0, 8)}-${Date.now()}`,
        notes: { loanId: loan.id, employeeId: loan.employeeId },
      });
      orderId = created.id;
      keyId = this.razorpay.getKeyId();
    } else if (sandbox) {
      orderId = `order_sbx_${crypto.randomBytes(10).toString('hex')}`;
    } else {
      throw new BadRequestException(
        'Payment gateway is not configured. Use manual repayment or configure Razorpay keys.',
      );
    }

    await this.log(loan.id, 'UPDATED', actor.id, undefined, `Razorpay repayment order ${orderId} for ${payable}`);
    return {
      loanId: loan.id,
      amount: payable,
      orderId,
      keyId,
      mode: useRazorpay && !sandbox ? 'RAZORPAY' : 'SANDBOX',
    };
  }

  /** Verify a Razorpay loan repayment (HMAC mandatory) and record it. */
  async verifyRepayment(
    companyId: string,
    loanId: string,
    body: { orderId: string; paymentId: string; signature: string },
    actor: { id: string; role: string; name: string },
  ) {
    const loan = await this.assertAccess(companyId, loanId);
    if (!this.isAdmin(actor.role) && loan.employeeId !== actor.id) {
      throw new ForbiddenException('You can only repay your own loans');
    }

    const valid = this.razorpay.verifyCheckoutSignature(
      body.orderId,
      body.paymentId,
      body.signature,
    );
    if (!valid) {
      throw new BadRequestException('Payment signature verification failed');
    }

    // Amount encoded in the order activity log (server-side truth)
    const activity = await this.prisma.loanActivity.findFirst({
      where: {
        loanId: loan.id,
        action: 'UPDATED',
        details: { contains: body.orderId },
      },
      orderBy: { createdAt: 'desc' },
    });
    let amount: number | null = null;
    if (activity?.details) {
      const m = activity.details.match(/order \S+ for ([\d.]+)/);
      if (m) amount = Number(m[1]);
    }
    if (!amount) amount = loan.remainingBalance;

    const now = new Date();
    const principalPart = round2(Math.max(0, amount - (loan.remainingBalance * loan.interestRate) / 12 / 100));
    const repayment = await this.prisma.loanRepayment.create({
      data: {
        loanId: loan.id,
        amount,
        principalPaid: principalPart,
        interestPaid: round2(Math.max(0, amount - principalPart)),
        month: now.getMonth() + 1,
        year: now.getFullYear(),
        status: 'PAID',
        method: 'RAZORPAY',
        paidAt: now,
        reference: body.paymentId,
      },
    });
    const newBalance = round2(Math.max(0, loan.remainingBalance - principalPart));
    await this.prisma.employeeLoan.update({
      where: { id: loan.id },
      data: {
        totalPaid: round2(loan.totalPaid + amount),
        remainingBalance: newBalance,
        status: newBalance <= 0.01 ? 'PAID_OFF' : loan.status,
      },
    });
    await this.log(
      loan.id,
      newBalance <= 0.01 ? 'CLOSED' : 'REPAYMENT',
      actor.id,
      actor.name,
      `Razorpay repayment ${body.paymentId} of ${amount}`,
    );
    return { success: true, repaymentId: repayment.id, remainingBalance: newBalance };
  }

  // ---------- reads ----------

  async detail(companyId: string, loanId: string, actor: { id: string; role: string }) {
    const loan = await this.assertAccess(companyId, loanId);
    if (!this.isAdmin(actor.role) && loan.employeeId !== actor.id) {
      throw new ForbiddenException('You can only view your own loans');
    }
    const [loanFull, activities] = await Promise.all([
      this.prisma.employeeLoan.findUnique({
        where: { id: loan.id },
        include: {
          employee: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              email: true,
              employeeCode: true,
              department: { select: { name: true } },
              designation: { select: { name: true } },
            },
          },
          repayments: { orderBy: { repaymentDate: 'asc' } },
        },
      }),
      this.prisma.loanActivity.findMany({
        where: { loanId: loan.id },
        orderBy: { createdAt: 'asc' },
      }),
    ]);
    if (!loanFull) throw new NotFoundException('Loan not found');

    const startMonth = loanFull.deductionStartMonth ?? 1;
    const startYear = loanFull.deductionStartYear ?? new Date().getFullYear();
    const schedule = this.buildSchedule(
      Number(loanFull.principalAmount),
      Number(loanFull.interestRate),
      loanFull.tenureMonths,
      startYear,
      startMonth,
    );

    return { ...loanFull, activities, schedule };
  }

  async listCompany(
    companyId: string,
    filters: { status?: string; type?: string; employeeId?: string },
  ) {
    const where: any = { companyId };
    if (filters.status) where.status = filters.status;
    if (filters.type) where.type = filters.type;
    if (filters.employeeId) where.employeeId = filters.employeeId;

    const loans = await this.prisma.employeeLoan.findMany({
      where,
      include: {
        employee: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
            employeeCode: true,
            department: { select: { name: true } },
          },
        },
        _count: { select: { repayments: true } },
      },
      orderBy: { createdAt: 'desc' },
    });

    // One groupBy for the summary strip
    const stats = await this.prisma.employeeLoan.groupBy({
      by: ['status'],
      where: { companyId },
      _count: { _all: true },
      _sum: { principalAmount: true, remainingBalance: true },
    });

    return {
      loans: loans.map((l) => ({
        ...l,
        repaymentCount: l._count.repayments,
        _count: undefined,
      })),
      summary: stats.map((s) => ({
        status: s.status,
        count: s._count._all,
        totalPrincipal: Number(s._sum.principalAmount ?? 0),
        totalOutstanding: Number(s._sum.remainingBalance ?? 0),
      })),
    };
  }

  async listMine(employeeId: string) {
    return this.prisma.employeeLoan.findMany({
      where: { employeeId },
      include: { repayments: { orderBy: { repaymentDate: 'asc' } } },
      orderBy: { createdAt: 'desc' },
    });
  }
}
