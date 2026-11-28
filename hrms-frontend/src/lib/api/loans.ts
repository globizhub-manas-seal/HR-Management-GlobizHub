import api from "../api";

export interface LoanRepayment {
  id: string;
  loanId: string;
  amount: number;
  principalPaid: number;
  interestPaid: number;
  month: number;
  year: number;
  status: string;
  method: string;
  paidAt?: string | null;
  reference?: string | null;
  repaymentDate: string;
  payrollRecordId?: string | null;
}

export interface LoanActivity {
  id: string;
  action: string;
  actorId?: string | null;
  actorName?: string | null;
  details?: string | null;
  createdAt: string;
}

export interface ScheduleRow {
  installment: number;
  dueMonth: number;
  dueYear: number;
  emi: number;
  interest: number;
  principalPart: number;
  balance: number;
}

export interface Loan {
  id: string;
  employeeId: string;
  type: string;
  principalAmount: number;
  interestRate: number;
  tenureMonths: number;
  monthlyEmi: number;
  disbursedDate?: string | null;
  deductionStartMonth?: number | null;
  deductionStartYear?: number | null;
  status: string;
  totalPaid: number;
  remainingBalance: number;
  reason?: string | null;
  rejectionReason?: string | null;
  createdAt: string;
  employee?: {
    id: string;
    firstName: string;
    lastName: string;
    email: string;
    employeeCode?: string | null;
    department?: { name: string } | null;
    designation?: { name: string } | null;
  };
  repayments?: LoanRepayment[];
  activities?: LoanActivity[];
  schedule?: ScheduleRow[];
  repaymentCount?: number;
}

export interface LoanSettings {
  loanAllowSalaryAdvance: boolean;
  loanAllowPersonalLoan: boolean;
  loanAllowEmergencyLoan: boolean;
  loanMaxAmount: number | null;
  loanMaxTenureMonths: number;
  loanDefaultInterestRate: number;
  loanAutoDeductFromPayroll: boolean;
}

export interface LoanCompanyList {
  loans: Loan[];
  summary: Array<{
    status: string;
    count: number;
    totalPrincipal: number;
    totalOutstanding: number;
  }>;
}

export const loansApi = {
  getSettings: async (): Promise<LoanSettings> => {
    const res = await api.get("/loans/settings");
    return res.data;
  },
  updateSettings: async (dto: Partial<LoanSettings>): Promise<LoanSettings> => {
    const res = await api.put("/loans/settings", dto);
    return res.data;
  },
  listCompany: async (
    filters?: { status?: string; type?: string; employeeId?: string },
  ): Promise<LoanCompanyList> => {
    const res = await api.get("/loans/company", { params: filters });
    return res.data;
  },
  listMine: async (): Promise<Loan[]> => {
    const res = await api.get("/loans/my");
    return res.data;
  },
  request: async (dto: {
    employeeId?: string;
    type: string;
    principalAmount: number;
    tenureMonths: number;
    reason?: string;
  }): Promise<Loan> => {
    const res = await api.post("/loans/request", dto);
    return res.data;
  },
  approve: async (id: string): Promise<Loan> => {
    const res = await api.post(`/loans/${id}/approve`);
    return res.data;
  },
  reject: async (id: string, rejectionReason: string): Promise<Loan> => {
    const res = await api.post(`/loans/${id}/reject`, { rejectionReason });
    return res.data;
  },
  disburse: async (id: string): Promise<Loan> => {
    const res = await api.post(`/loans/${id}/disburse`);
    return res.data;
  },
  repay: async (id: string, amount: number, reference?: string) => {
    const res = await api.post(`/loans/${id}/repay`, { amount, reference });
    return res.data;
  },
  createRepaymentOrder: async (id: string, amount?: number) => {
    const res = await api.post(`/loans/${id}/repay/razorpay`, { amount });
    return res.data as {
      loanId: string;
      amount: number;
      orderId: string;
      keyId: string | null;
      mode: string;
    };
  },
  verifyRepayment: async (
    id: string,
    payload: { orderId: string; paymentId: string; signature: string },
  ) => {
    const res = await api.post(`/loans/${id}/repay/razorpay/verify`, payload);
    return res.data;
  },
  detail: async (id: string): Promise<Loan> => {
    const res = await api.get(`/loans/${id}`);
    return res.data;
  },
};
