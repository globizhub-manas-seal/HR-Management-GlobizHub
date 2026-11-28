"use client";

import React, { useCallback, useEffect, useMemo, useState } from "react";
import {
  FileBarChart2,
  Download,
  FileSpreadsheet,
  FileText,
  Loader2,
  Users,
  CalendarCheck,
  CalendarDays,
  Banknote,
  PiggyBank,
  CalendarRange,
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import ModuleGate from "@/components/ModuleGate";
import { useToast } from "@/components/ToastProvider";
import {
  reportsApi,
  ReportSummary,
  ReportDataset,
  PeriodPreset,
  ReportTable,
} from "@/lib/api/reports";

const PRESETS: Array<{ key: PeriodPreset; label: string }> = [
  { key: "today", label: "Today" },
  { key: "yesterday", label: "Yesterday" },
  { key: "last7", label: "Last 7 days" },
  { key: "last30", label: "Last 30 days" },
  { key: "this_month", label: "This month" },
  { key: "last_month", label: "Last month" },
  { key: "this_year", label: "This year" },
];

const DATASETS: Array<{
  key: ReportDataset;
  label: string;
  icon: React.ElementType;
  description: string;
}> = [
  { key: "employees", label: "Employees", icon: Users, description: "New hires & exits in the period" },
  { key: "attendance", label: "Attendance", icon: CalendarCheck, description: "Per-employee presence, late marks & hours" },
  { key: "leave", label: "Leave", icon: CalendarDays, description: "Leave requests and approvals" },
  { key: "payroll", label: "Payroll", icon: Banknote, description: "Run register with gross, deductions & net pay" },
  { key: "loans", label: "Loans & advances", icon: PiggyBank, description: "Disbursements & repayment collections" },
];

const money = (n: number | null | undefined) =>
  `₹${Number(n ?? 0).toLocaleString("en-IN", { maximumFractionDigits: 0 })}`;

const fmtCell = (v: unknown): string => {
  if (v === null || v === undefined || v === "") return "—";
  if (typeof v === "boolean") return v ? "Yes" : "No";
  if (typeof v === "string" && /^\d{4}-\d{2}-\d{2}T/.test(v)) {
    return new Date(v).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" });
  }
  if (typeof v === "number") return v.toLocaleString("en-IN", { maximumFractionDigits: 2 });
  return String(v);
};

const COLUMN_LABELS: Record<string, string> = {
  code: "Employee ID",
  name: "Name",
  department: "Department",
  designation: "Designation",
  role: "Role",
  workerType: "Worker type",
  joiningDate: "Joined",
  employmentStatus: "Status",
  basicSalary: "Basic salary",
  exitDate: "Exit date",
  reason: "Reason",
  days: "Days",
  present: "Present",
  absent: "Absent",
  halfDay: "Half day",
  late: "Late",
  leave: "Leave",
  totalHours: "Hours",
  overtimeHours: "Overtime",
  attendanceRate: "Rate",
  type: "Type",
  startDate: "From",
  endDate: "To",
  status: "Status",
  month: "Period",
  basicPay: "Basic",
  allowances: "Allowances",
  arrearsPay: "Arrears",
  grossPay: "Gross",
  loanDeduction: "Loan EMI",
  tds: "TDS",
  totalDeductions: "Deductions",
  netSalary: "Net pay",
  principal: "Principal",
  interestRate: "Rate %",
  tenureMonths: "Tenure",
  emi: "EMI",
  disbursedDate: "Disbursed",
  outstanding: "Outstanding",
  amount: "Amount",
  principalPaid: "Principal paid",
  interestPaid: "Interest paid",
  method: "Method",
  repaymentDate: "Date",
  email: "Email",
  phone: "Phone",
};

function ReportsPageInner() {
  const { toast } = useToast();
  const [period, setPeriod] = useState<PeriodPreset>("last30");
  const [customFrom, setCustomFrom] = useState("");
  const [customTo, setCustomTo] = useState("");
  const [summary, setSummary] = useState<ReportSummary | null>(null);
  const [dataset, setDataset] = useState<ReportDataset>("employees");
  const [tables, setTables] = useState<ReportTable[]>([]);
  const [rangeLabel, setRangeLabel] = useState("");
  const [loading, setLoading] = useState(true);
  const [exporting, setExporting] = useState<string | null>(null);

  const periodParams = useMemo(
    () =>
      period === "custom"
        ? { from: customFrom, to: customTo }
        : {},
    [period, customFrom, customTo],
  );

  const load = useCallback(async () => {
    if (period === "custom" && (!customFrom || !customTo)) return;
    setLoading(true);
    try {
      const [s, d] = await Promise.all([
        reportsApi.summary(period, periodParams),
        reportsApi.data(dataset, period, periodParams),
      ]);
      setSummary(s);
      setTables(d.tables ?? []);
      setRangeLabel(d.range?.label ?? "");
    } catch (e: any) {
      toast({
        title: "Report failed",
        description: e?.response?.data?.message ?? e?.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  }, [dataset, period, periodParams, customFrom, customTo, toast]);

  useEffect(() => {
    load();
  }, [load]);

  const doExport = async (format: "csv" | "excel" | "pdf") => {
    setExporting(format);
    try {
      await reportsApi.downloadExport(dataset, format, period, periodParams);
      toast({ title: `${format.toUpperCase()} export downloaded` });
    } catch (e: any) {
      toast({
        title: "Export failed",
        description: e?.response?.data?.message ?? e?.message,
        variant: "destructive",
      });
    } finally {
      setExporting(null);
    }
  };

  const columns = tables[0]?.rows?.length
    ? Object.keys(tables[0].rows[0]).filter((k) => k !== "id")
    : [];

  const summaryCards = summary
    ? [
        { label: "Headcount", value: String(summary.headcount), sub: `+${summary.newHires} / -${summary.exits} in period` },
        { label: "Attendance", value: summary.attendanceRate != null ? `${summary.attendanceRate}%` : "—", sub: `${summary.attendanceRecords} records` },
        { label: "Leave requests", value: String(summary.leaveRequests), sub: "submitted in period" },
        { label: "Payroll net", value: money(summary.payrollNet), sub: `${summary.payrollRuns} run(s)` },
        { label: "Loans disbursed", value: money(summary.loansPrincipal), sub: `${summary.loansCreated} new • ${money(summary.loansOutstanding)} outstanding` },
        { label: "Repayments", value: money(summary.loanRepaymentsAmount), sub: `${summary.loanRepayments} collection(s)` },
      ]
    : [];

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex flex-col lg:flex-row lg:items-end lg:justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-foreground flex items-center gap-2">
            <FileBarChart2 className="h-6 w-6 text-primary" />
            Reports
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            Any period, one selection — export on your company letterhead as CSV, Excel or PDF.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          {PRESETS.map((p) => (
            <button
              key={p.key}
              onClick={() => setPeriod(p.key)}
              className={`rounded-full px-3.5 py-1.5 text-xs font-medium border transition-colors ${
                period === p.key
                  ? "border-primary bg-primary text-primary-foreground"
                  : "border-border text-muted-foreground hover:border-primary/50 hover:text-foreground"
              }`}
            >
              {p.label}
            </button>
          ))}
          <button
            onClick={() => setPeriod("custom")}
            className={`rounded-full px-3.5 py-1.5 text-xs font-medium border transition-colors inline-flex items-center gap-1 ${
              period === "custom"
                ? "border-primary bg-primary text-primary-foreground"
                : "border-border text-muted-foreground hover:border-primary/50 hover:text-foreground"
            }`}
          >
            <CalendarRange className="h-3.5 w-3.5" />
            Custom
          </button>
        </div>
      </div>

      {/* Custom range */}
      {period === "custom" && (
        <Card>
          <CardContent className="p-4 flex flex-col sm:flex-row items-end gap-3">
            <div className="flex-1 w-full space-y-1.5">
              <label className="text-xs text-muted-foreground">From</label>
              <Input type="date" value={customFrom} onChange={(e) => setCustomFrom(e.target.value)} />
            </div>
            <div className="flex-1 w-full space-y-1.5">
              <label className="text-xs text-muted-foreground">To</label>
              <Input type="date" value={customTo} onChange={(e) => setCustomTo(e.target.value)} />
            </div>
            <Button disabled={!customFrom || !customTo} onClick={load}>Apply range</Button>
          </CardContent>
        </Card>
      )}

      {/* Summary cards */}
      {summary && (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
          {summaryCards.map((c) => (
            <Card key={c.label}>
              <CardContent className="p-3.5">
                <div className="text-[10px] uppercase tracking-wide text-muted-foreground">{c.label}</div>
                <div className="mt-1 text-lg font-bold text-foreground truncate">{c.value}</div>
                <div className="text-[10px] text-muted-foreground truncate">{c.sub}</div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Dataset tabs */}
      <div className="flex flex-wrap gap-2">
        {DATASETS.map((d) => (
          <button
            key={d.key}
            onClick={() => setDataset(d.key)}
            className={`inline-flex items-center gap-1.5 rounded-xl px-3.5 py-2 text-xs font-medium border transition-colors ${
              dataset === d.key
                ? "border-primary bg-primary/10 text-primary"
                : "border-border text-muted-foreground hover:border-primary/40 hover:text-foreground"
            }`}
          >
            <d.icon className="h-4 w-4" />
            {d.label}
          </button>
        ))}
      </div>

      {/* Export bar */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 rounded-2xl border border-border bg-card px-4 py-3">
        <div className="text-sm">
          <span className="font-semibold text-foreground">
            {DATASETS.find((d) => d.key === dataset)?.label} report
          </span>
          <span className="text-muted-foreground"> — {rangeLabel}</span>
          <p className="text-[11px] text-muted-foreground mt-0.5">
            {DATASETS.find((d) => d.key === dataset)?.description} • Rendered with your logo, legal name, address and GSTIN from Settings.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" disabled={!!exporting} onClick={() => doExport("csv")}>
            {exporting === "csv" ? <Loader2 className="h-4 w-4 animate-spin mr-1.5" /> : <Download className="h-4 w-4 mr-1.5" />}
            CSV
          </Button>
          <Button variant="outline" size="sm" disabled={!!exporting} onClick={() => doExport("excel")}>
            {exporting === "excel" ? <Loader2 className="h-4 w-4 animate-spin mr-1.5" /> : <FileSpreadsheet className="h-4 w-4 mr-1.5" />}
            Excel
          </Button>
          <Button size="sm" disabled={!!exporting} onClick={() => doExport("pdf")}>
            {exporting === "pdf" ? <Loader2 className="h-4 w-4 animate-spin mr-1.5" /> : <FileText className="h-4 w-4 mr-1.5" />}
            PDF
          </Button>
        </div>
      </div>

      {/* Preview table */}
      <Card>
        <CardContent className="p-0">
          {loading ? (
            <div className="py-16 flex justify-center">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          ) : tables.length === 0 || tables.every((t) => (t.rows?.length ?? 0) === 0) ? (
            <div className="py-16 text-center text-sm text-muted-foreground">
              No {DATASETS.find((d) => d.key === dataset)?.label.toLowerCase()} data for {rangeLabel}.
            </div>
          ) : (
            <div className="space-y-6">
              {tables.map((t, ti) => {
                const cols = t.rows?.length ? Object.keys(t.rows[0]).filter((k) => k !== "id") : [];
                return (
                  <div key={ti}>
                    <div className="px-4 py-2.5 text-xs font-semibold text-foreground border-b border-border bg-muted/40">
                      {t.title}
                    </div>
                    <div className="overflow-x-auto">
                      <table className="w-full text-xs sm:text-sm">
                        <thead>
                          <tr className="text-left text-[10px] sm:text-[11px] uppercase tracking-wide text-muted-foreground border-b border-border">
                            {cols.map((c) => (
                              <th key={c} className="px-3 py-2 font-medium whitespace-nowrap">
                                {COLUMN_LABELS[c] ?? c}
                              </th>
                            ))}
                          </tr>
                        </thead>
                        <tbody>
                          {t.rows.map((row, ri) => (
                            <tr key={ri} className="border-b border-border/50 hover:bg-muted/30">
                              {cols.map((c) => (
                                <td key={c} className="px-3 py-2 whitespace-nowrap text-foreground">
                                  {fmtCell(row[c])}
                                </td>
                              ))}
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

export default function ReportsPage() {
  return (
    <ModuleGate moduleKey="reports">
      <ReportsPageInner />
    </ModuleGate>
  );
}
