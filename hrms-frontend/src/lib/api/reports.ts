import api from "../api";

export type PeriodPreset =
  | "today"
  | "yesterday"
  | "last7"
  | "last30"
  | "this_month"
  | "last_month"
  | "this_year"
  | "custom";

export interface PeriodPresetOption {
  key: PeriodPreset;
  label: string;
}

export interface ReportSummary {
  range: { from: string; to: string; label: string };
  headcount: number;
  newHires: number;
  exits: number;
  attendanceRecords: number;
  attendanceRate: number | null;
  leaveRequests: number;
  payrollRuns: number;
  payrollNet: number;
  payrollDeductions: number;
  loansCreated: number;
  loansPrincipal: number;
  loansOutstanding: number;
  loanRepayments: number;
  loanRepaymentsAmount: number;
}

export interface ReportTable {
  title: string;
  rows: Array<Record<string, unknown>>;
  totals?: { gross: number; deductions: number; net: number; count: number };
}

export type ReportDataset =
  | "employees"
  | "attendance"
  | "leave"
  | "payroll"
  | "loans";

export const reportsApi = {
  presets: async (): Promise<PeriodPresetOption[]> => {
    const res = await api.get("/reports/presets");
    return res.data;
  },
  summary: async (
    period: PeriodPreset,
    opts?: { from?: string; to?: string },
  ): Promise<ReportSummary> => {
    const res = await api.get("/reports/summary", {
      params: { period, ...opts },
    });
    return res.data;
  },
  data: async (
    dataset: ReportDataset,
    period: PeriodPreset,
    opts?: { from?: string; to?: string },
  ): Promise<{ range: { label: string }; tables: ReportTable[] }> => {
    const res = await api.get(`/reports/data/${dataset}`, {
      params: { period, ...opts },
    });
    return res.data;
  },
  /**
   * Download an export in any format (csv | excel | pdf) as a Blob and
   * trigger a browser download.
   */
  downloadExport: async (
    dataset: ReportDataset,
    format: "csv" | "excel" | "pdf",
    period: PeriodPreset,
    opts?: { from?: string; to?: string },
  ): Promise<void> => {
    const res = await api.get(`/reports/export/${dataset}`, {
      params: { format, period, ...opts },
      responseType: "blob",
    });
    const ext = format === "excel" ? "xlsx" : format;
    const url = window.URL.createObjectURL(new Blob([res.data]));
    const link = document.createElement("a");
    link.href = url;
    link.download = `${dataset}-${period}-report.${ext}`;
    document.body.appendChild(link);
    link.click();
    link.remove();
    window.URL.revokeObjectURL(url);
  },
};

// ---------- Platform (super admin) global reports ----------

export interface PlatformSummary {
  range: { from: string; to: string; label: string };
  organizations: {
    total: number;
    newInRange: number;
    paidActive: number;
    freemium: number;
    expired: number;
    totalUsers: number;
  };
  revenue: {
    collectedInRange: number;
    collectedInvoices: number;
    taxableBase: number;
    gstCollectedInRange: number;
    successfulPayments: number;
    paymentVolume: number;
  };
  invoicesIssuedInRange: number;
}

export type PlatformDataset =
  | "organizations"
  | "invoices"
  | "subscriptions"
  | "payments";

export const platformReportsApi = {
  summary: async (
    period: PeriodPreset,
    opts?: { from?: string; to?: string },
  ): Promise<PlatformSummary> => {
    const res = await api.get("/platform/reports/summary", {
      params: { period, ...opts },
    });
    return res.data;
  },
  organizations: async (
    period: PeriodPreset,
    opts?: { from?: string; to?: string },
  ): Promise<{ rows: Array<Record<string, unknown>> }> => {
    const res = await api.get("/platform/reports/organizations", {
      params: { period, ...opts },
    });
    return res.data;
  },
  invoices: async (
    period: PeriodPreset,
    opts?: { from?: string; to?: string },
  ): Promise<{ rows: Array<Record<string, unknown>> }> => {
    const res = await api.get("/platform/reports/invoices", {
      params: { period, ...opts },
    });
    return res.data;
  },
  downloadExport: async (
    dataset: PlatformDataset,
    format: "csv" | "excel" | "pdf",
    period: PeriodPreset,
    opts?: { from?: string; to?: string },
  ): Promise<void> => {
    const res = await api.get(`/platform/reports/export/${dataset}`, {
      params: { format, period, ...opts },
      responseType: "blob",
    });
    const ext = format === "excel" ? "xlsx" : format;
    const url = window.URL.createObjectURL(new Blob([res.data]));
    const link = document.createElement("a");
    link.href = url;
    link.download = `platform-${dataset}-${period}.${ext}`;
    document.body.appendChild(link);
    link.click();
    link.remove();
    window.URL.revokeObjectURL(url);
  },
};
