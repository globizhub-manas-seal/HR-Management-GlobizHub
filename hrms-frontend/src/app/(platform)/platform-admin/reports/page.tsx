"use client";

import React, { useCallback, useEffect, useMemo, useState } from "react";
import {
  Globe2,
  Building2,
  Users,
  ReceiptIndianRupee,
  Landmark,
  Download,
  FileSpreadsheet,
  FileText,
  Loader2,
  CalendarRange,
  TrendingUp,
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { platformReportsApi, PlatformSummary, PeriodPreset } from "@/lib/api/reports";

const PRESETS: Array<{ key: PeriodPreset; label: string }> = [
  { key: "today", label: "Today" },
  { key: "yesterday", label: "Yesterday" },
  { key: "last7", label: "Last 7 days" },
  { key: "last30", label: "Last 30 days" },
  { key: "this_month", label: "This month" },
  { key: "last_month", label: "Last month" },
  { key: "this_year", label: "This year" },
];

const money = (n: number | null | undefined) =>
  `₹${Number(n ?? 0).toLocaleString("en-IN", { maximumFractionDigits: 2 })}`;

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
  name: "Organization",
  email: "Email",
  industry: "Industry",
  plan: "Plan",
  subscriptionStatus: "Subscription",
  users: "Users",
  invoices: "Invoices",
  companyStatus: "Status",
  contractEndsAt: "Contract end",
  freemiumEndsAt: "Free until",
  registeredAt: "Registered",
  invoiceNumber: "Invoice #",
  company: "Organization",
  taxableAmount: "Taxable",
  taxLabel: "Tax type",
  taxAmount: "Tax",
  amountDue: "Total",
  amountPaid: "Paid",
  status: "Status",
  couponCode: "Coupon",
  dueDate: "Due",
  paidAt: "Paid at",
  createdAt: "Issued",
  billingCycle: "Cycle",
  contractStartsAt: "Contract start",
  planPrice: "Price/user/mo",
  gateway: "Gateway",
};

function GlobalReportsPage() {
  const [period, setPeriod] = useState<PeriodPreset>("last30");
  const [customFrom, setCustomFrom] = useState("");
  const [customTo, setCustomTo] = useState("");
  const [summary, setSummary] = useState<PlatformSummary | null>(null);
  const [tab, setTab] = useState<"organizations" | "invoices">("organizations");
  const [rows, setRows] = useState<Array<Record<string, unknown>>>([]);
  const [loading, setLoading] = useState(true);
  const [exporting, setExporting] = useState<string | null>(null);

  const periodParams = useMemo(
    () => (period === "custom" ? { from: customFrom, to: customTo } : {}),
    [period, customFrom, customTo],
  );

  const load = useCallback(async () => {
    if (period === "custom" && (!customFrom || !customTo)) return;
    setLoading(true);
    try {
      const [s, d] = await Promise.all([
        platformReportsApi.summary(period, periodParams),
        tab === "organizations"
          ? platformReportsApi.organizations(period, periodParams)
          : platformReportsApi.invoices(period, periodParams),
      ]);
      setSummary(s);
      setRows(d.rows ?? []);
    } catch (err: any) {
      console.error("Global report failed", err);
    } finally {
      setLoading(false);
    }
  }, [tab, period, periodParams, customFrom, customTo]);

  useEffect(() => {
    load();
  }, [load]);

  const doExport = async (format: "csv" | "excel" | "pdf") => {
    setExporting(format);
    try {
      await platformReportsApi.downloadExport(tab, format, period, periodParams);
    } catch (err: any) {
      console.error("Export failed", err);
    } finally {
      setExporting(null);
    }
  };

  const cols = rows.length ? Object.keys(rows[0]).filter((k) => k !== "id") : [];

  const orgCards = summary
    ? [
        { label: "Organizations", value: String(summary.organizations.total), sub: `+${summary.organizations.newInRange} new in period`, icon: Building2 },
        { label: "Paid subscriptions", value: String(summary.organizations.paidActive), sub: `${summary.organizations.freemium} freemium • ${summary.organizations.expired} expired`, icon: TrendingUp },
        { label: "Platform users", value: String(summary.organizations.totalUsers), sub: "active employee seats", icon: Users },
        { label: "Revenue collected", value: money(summary.revenue.collectedInRange), sub: `${summary.revenue.collectedInvoices} invoice(s) settled`, icon: ReceiptIndianRupee },
        { label: "GST collected", value: money(summary.revenue.gstCollectedInRange), sub: `taxable base ${money(summary.revenue.taxableBase)}`, icon: Landmark },
        { label: "Invoices issued", value: String(summary.invoicesIssuedInRange), sub: `${summary.revenue.successfulPayments} successful payment(s)`, icon: Globe2 },
      ]
    : [];

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex flex-col lg:flex-row lg:items-end lg:justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-foreground flex items-center gap-2">
            <Globe2 className="h-6 w-6 text-primary" />
            Global Reports
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            Organization-level and platform-level reporting for any period — exportable with the platform letterhead.
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

      {/* Platform KPI cards */}
      {summary && (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
          {orgCards.map((c) => (
            <Card key={c.label}>
              <CardContent className="p-3.5">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] uppercase tracking-wide text-muted-foreground">{c.label}</span>
                  <c.icon className="h-3.5 w-3.5 text-muted-foreground" />
                </div>
                <div className="mt-1 text-lg font-bold text-foreground truncate">{c.value}</div>
                <div className="text-[10px] text-muted-foreground truncate">{c.sub}</div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Tabs + export */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div className="flex gap-2">
          {([
            ["organizations", "Organizations"],
            ["invoices", "Invoices"],
          ] as const).map(([k, label]) => (
            <button
              key={k}
              onClick={() => setTab(k)}
              className={`rounded-xl px-4 py-2 text-xs font-medium border transition-colors ${
                tab === k
                  ? "border-primary bg-primary/10 text-primary"
                  : "border-border text-muted-foreground hover:border-primary/40 hover:text-foreground"
              }`}
            >
              {label}
            </button>
          ))}
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

      {/* Table */}
      <Card>
        <CardContent className="p-0">
          {loading ? (
            <div className="py-16 flex justify-center">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          ) : rows.length === 0 ? (
            <div className="py-16 text-center text-sm text-muted-foreground">
              No data for this period.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-xs sm:text-sm">
                <thead>
                  <tr className="text-left text-[10px] sm:text-[11px] uppercase tracking-wide text-muted-foreground border-b border-border">
                    {cols.map((c) => (
                      <th key={c} className="px-3 py-2.5 font-medium whitespace-nowrap">
                        {COLUMN_LABELS[c] ?? c}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {rows.map((row, i) => (
                    <tr key={i} className="border-b border-border/50 hover:bg-muted/30">
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
          )}
        </CardContent>
      </Card>
    </div>
  );
}

export default GlobalReportsPage;
