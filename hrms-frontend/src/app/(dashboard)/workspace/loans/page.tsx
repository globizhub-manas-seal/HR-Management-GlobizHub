"use client";

import React, { useCallback, useEffect, useMemo, useState } from "react";
import {
  PiggyBank,
  Plus,
  Check,
  X,
  Send,
  Download,
  Wallet,
  Clock,
  CheckCircle2,
  XCircle,
  CircleDollarSign,
  Loader2,
  History,
  CalendarClock,
  Settings2,
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Switch } from "@/components/ui/switch";
import ModuleGate from "@/components/ModuleGate";
import { useToast } from "@/components/ToastProvider";
import { useViewMode } from "@/context/ViewModeContext";
import {
  loansApi,
  Loan,
  LoanSettings,
  LoanCompanyList,
} from "@/lib/api/loans";

declare global {
  interface Window {
    Razorpay?: new (options: Record<string, unknown>) => { open: () => void };
  }
}

const STATUS_STYLES: Record<string, string> = {
  PENDING: "bg-amber-500/15 text-amber-600 border-amber-500/30",
  APPROVED: "bg-blue-500/15 text-blue-600 border-blue-500/30",
  ACTIVE: "bg-primary/15 text-primary border-primary/30",
  PAID_OFF: "bg-emerald-500/15 text-emerald-600 border-emerald-500/30",
  REJECTED: "bg-red-500/15 text-red-600 border-red-500/30",
};

const TYPE_LABELS: Record<string, string> = {
  SALARY_ADVANCE: "Salary Advance",
  PERSONAL_LOAN: "Personal Loan",
  EMERGENCY_LOAN: "Emergency Loan",
};

const money = (n: number) =>
  `₹${Number(n ?? 0).toLocaleString("en-IN", { maximumFractionDigits: 2 })}`;

const dateFmt = (d?: string | null) =>
  d ? new Date(d).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" }) : "—";

function LoansPageInner() {
  const { user } = useViewMode();
  const { toast } = useToast();
  const isAdmin = user?.role === "SUPER_ADMIN" || user?.role === "OWNER" || user?.role === "HR_HEAD";

  const [loading, setLoading] = useState(true);
  const [companyData, setCompanyData] = useState<LoanCompanyList | null>(null);
  const [myLoans, setMyLoans] = useState<Loan[]>([]);
  const [settings, setSettings] = useState<LoanSettings | null>(null);
  const [detail, setDetail] = useState<Loan | null>(null);
  const [detailLoading, setDetailLoading] = useState(false);
  const [showRequest, setShowRequest] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [busy, setBusy] = useState(false);

  // request form
  const [form, setForm] = useState({
    employeeId: "",
    type: "SALARY_ADVANCE",
    principalAmount: "",
    tenureMonths: "3",
    reason: "",
  });
  // repayment form
  const [repayAmount, setRepayAmount] = useState("");
  const [repayRef, setRepayRef] = useState("");

  const load = useCallback(async () => {
    setLoading(true);
    try {
      if (isAdmin) {
        const [list, s] = await Promise.all([
          loansApi.listCompany(),
          loansApi.getSettings(),
        ]);
        setCompanyData(list);
        setSettings(s);
      } else {
        setMyLoans(await loansApi.listMine());
      }
    } catch (e: any) {
      toast({
        title: "Could not load loans",
        description: e?.response?.data?.message ?? e?.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  }, [isAdmin, toast]);

  useEffect(() => {
    load();
  }, [load]);

  const openDetail = async (id: string) => {
    setDetailLoading(true);
    try {
      setDetail(await loansApi.detail(id));
    } catch {
      toast({ title: "Could not load loan detail", variant: "destructive" });
    } finally {
      setDetailLoading(false);
    }
  };

  const submitRequest = async () => {
    setBusy(true);
    try {
      await loansApi.request({
        employeeId: isAdmin && form.employeeId ? form.employeeId : undefined,
        type: form.type,
        principalAmount: Number(form.principalAmount),
        tenureMonths: Number(form.tenureMonths),
        reason: form.reason || undefined,
      });
      toast({ title: "Loan request submitted" });
      setShowRequest(false);
      setForm({ employeeId: "", type: "SALARY_ADVANCE", principalAmount: "", tenureMonths: "3", reason: "" });
      load();
    } catch (e: any) {
      toast({
        title: "Request failed",
        description: e?.response?.data?.message ?? e?.message,
        variant: "destructive",
      });
    } finally {
      setBusy(false);
    }
  };

  const act = async (id: string, fn: () => Promise<unknown>, done: string) => {
    setBusy(true);
    try {
      await fn();
      toast({ title: done });
      setDetail(null);
      load();
    } catch (e: any) {
      toast({
        title: "Action failed",
        description: e?.response?.data?.message ?? e?.message,
        variant: "destructive",
      });
    } finally {
      setBusy(false);
    }
  };

  const manualRepay = async () => {
    if (!detail) return;
    setBusy(true);
    try {
      await loansApi.repay(detail.id, Number(repayAmount), repayRef || undefined);
      toast({ title: "Repayment recorded" });
      setRepayAmount("");
      setRepayRef("");
      const fresh = await loansApi.detail(detail.id);
      setDetail(fresh);
      load();
    } catch (e: any) {
      toast({
        title: "Repayment failed",
        description: e?.response?.data?.message ?? e?.message,
        variant: "destructive",
      });
    } finally {
      setBusy(false);
    }
  };

  /** Razorpay online repayment (sandbox-safe: falls back with an error toast). */
  const payOnline = async (loan: Loan) => {
    setBusy(true);
    try {
      const order = await loansApi.createRepaymentOrder(loan.id);
      if (order.mode === "SANDBOX" || !order.keyId) {
        toast({
          title: "Sandbox mode",
          description: `Sandbox order ${order.orderId.slice(0, 18)}… created for ${money(order.amount)}. Live payments need Razorpay keys from the platform admin.`,
        });
        return;
      }
      const rz = new window.Razorpay!({
        key: order.keyId,
        amount: Math.round(order.amount * 100),
        currency: "INR",
        name: "Loan repayment",
        description: `Loan ${loan.id.slice(0, 8)} repayment`,
        order_id: order.orderId,
        handler: async (resp: Record<string, string>) => {
          try {
            await loansApi.verifyRepayment(loan.id, {
              orderId: resp.razorpay_order_id,
              paymentId: resp.razorpay_payment_id,
              signature: resp.razorpay_signature,
            });
            toast({ title: "Repayment successful" });
            load();
          } catch (e: any) {
            toast({ title: "Verification failed", description: e?.response?.data?.message, variant: "destructive" });
          }
        },
      });
      rz.open();
    } catch (e: any) {
      toast({
        title: "Payment unavailable",
        description: e?.response?.data?.message ?? e?.message,
        variant: "destructive",
      });
    } finally {
      setBusy(false);
    }
  };

  const summary = companyData?.summary ?? [];
  const loans = companyData?.loans ?? [];

  const statCards = useMemo(() => {
    const pending = summary.find((s) => s.status === "PENDING");
    const active = summary.find((s) => s.status === "ACTIVE");
    const paidOff = summary.find((s) => s.status === "PAID_OFF");
    return [
      { label: "Pending requests", value: pending?.count ?? 0, sub: money(pending?.totalPrincipal ?? 0), icon: Clock, tone: "text-amber-500" },
      { label: "Active loans", value: active?.count ?? 0, sub: `${money(active?.totalOutstanding ?? 0)} outstanding`, icon: PiggyBank, tone: "text-primary" },
      { label: "Closed loans", value: paidOff?.count ?? 0, sub: money(paidOff?.totalPrincipal ?? 0) + " disbursed", icon: CheckCircle2, tone: "text-emerald-500" },
      { label: "Repayments logged", value: loans.reduce((a, l) => a + (l.repaymentCount ?? 0), 0), sub: "payroll + manual + online", icon: History, tone: "text-muted-foreground" },
    ];
  }, [summary, loans]);

  if (loading) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-foreground flex items-center gap-2">
            <PiggyBank className="h-6 w-6 text-primary" />
            Loans &amp; Advances
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            {isAdmin
              ? "Company loan policy, approvals, repayment tracking and history"
              : "Your loans, advances and repayment schedule"}
          </p>
        </div>
        <div className="flex items-center gap-2">
          {isAdmin && (
            <Button variant="outline" size="sm" onClick={() => setShowSettings(true)}>
              <Settings2 className="h-4 w-4 mr-1.5" />
              Policy settings
            </Button>
          )}
          <Button size="sm" onClick={() => setShowRequest(true)}>
            <Plus className="h-4 w-4 mr-1.5" />
            {isAdmin ? "New loan request" : "Request advance"}
          </Button>
        </div>
      </div>

      {/* Admin summary strip */}
      {isAdmin && (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          {statCards.map((s) => (
            <Card key={s.label}>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-medium text-muted-foreground">{s.label}</span>
                  <s.icon className={`h-4 w-4 ${s.tone}`} />
                </div>
                <div className="mt-2 text-2xl font-bold text-foreground">{s.value}</div>
                <div className="text-[11px] text-muted-foreground">{s.sub}</div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Loans list */}
      <Card>
        <CardContent className="p-0">
          <div className="px-4 py-3 border-b border-border flex items-center justify-between">
            <h2 className="text-sm font-semibold text-foreground">
              {isAdmin ? "All loan requests" : "My loans"}
            </h2>
            <span className="text-xs text-muted-foreground">
              {isAdmin ? loans.length : myLoans.length} record(s)
            </span>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-[11px] uppercase tracking-wide text-muted-foreground border-b border-border">
                  <th className="px-4 py-2.5 font-medium">Employee</th>
                  <th className="px-4 py-2.5 font-medium">Type</th>
                  <th className="px-4 py-2.5 font-medium text-right">Principal</th>
                  <th className="px-4 py-2.5 font-medium text-right">EMI</th>
                  <th className="px-4 py-2.5 font-medium text-right">Outstanding</th>
                  <th className="px-4 py-2.5 font-medium">Status</th>
                  <th className="px-4 py-2.5 font-medium text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {(isAdmin ? loans : myLoans).map((l) => (
                  <tr key={l.id} className="border-b border-border/60 hover:bg-muted/40 transition-colors">
                    <td className="px-4 py-3">
                      <div className="font-medium text-foreground">
                        {l.employee ? `${l.employee.firstName} ${l.employee.lastName}` : `${user?.firstName ?? ""} ${user?.lastName ?? ""}`}
                      </div>
                      <div className="text-[11px] text-muted-foreground">
                        {l.employee?.employeeCode ?? ""} {l.employee?.department?.name ? `• ${l.employee.department.name}` : ""}
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <span className="text-xs">{TYPE_LABELS[l.type] ?? l.type}</span>
                      <div className="text-[11px] text-muted-foreground">{l.tenureMonths} mo @ {l.interestRate}%</div>
                    </td>
                    <td className="px-4 py-3 text-right font-mono text-foreground">{money(l.principalAmount)}</td>
                    <td className="px-4 py-3 text-right font-mono text-foreground">{money(l.monthlyEmi)}</td>
                    <td className="px-4 py-3 text-right font-mono">
                      <span className={l.remainingBalance > 0 ? "text-foreground" : "text-emerald-600"}>{money(l.remainingBalance)}</span>
                    </td>
                    <td className="px-4 py-3">
                      <Badge variant="outline" className={STATUS_STYLES[l.status] ?? ""}>{l.status}</Badge>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center justify-end gap-1.5">
                        {isAdmin && l.status === "PENDING" && (
                          <>
                            <Button size="sm" variant="outline" className="h-7 px-2" disabled={busy}
                              onClick={() => act(l.id, () => loansApi.approve(l.id), "Loan approved")}>
                              <Check className="h-3.5 w-3.5" />
                            </Button>
                            <Button size="sm" variant="outline" className="h-7 px-2" disabled={busy}
                              onClick={() => act(l.id, () => loansApi.reject(l.id, "Rejected by admin"), "Loan rejected")}>
                              <X className="h-3.5 w-3.5" />
                            </Button>
                          </>
                        )}
                        {isAdmin && l.status === "APPROVED" && (
                          <Button size="sm" variant="outline" className="h-7 px-2.5 text-[11px]" disabled={busy}
                            onClick={() => act(l.id, () => loansApi.disburse(l.id), "Loan disbursed")}>
                            <Send className="h-3.5 w-3.5 mr-1" />Disburse
                          </Button>
                        )}
                        <Button size="sm" variant="ghost" className="h-7 px-2.5 text-[11px]" onClick={() => openDetail(l.id)}>
                          Details
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
                {(isAdmin ? loans : myLoans).length === 0 && (
                  <tr>
                    <td colSpan={7} className="px-4 py-10 text-center text-sm text-muted-foreground">
                      No loans yet. {isAdmin ? "Approve a request or create one from the button above." : "Request an advance when you need one."}
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {/* Request dialog */}
      <Dialog open={showRequest} onOpenChange={setShowRequest}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>{isAdmin ? "New loan request" : "Request a loan or advance"}</DialogTitle>
          </DialogHeader>
          <div className="space-y-3.5 pt-2">
            {isAdmin && (
              <div className="space-y-1.5">
                <Label htmlFor="loan-emp">Employee ID</Label>
                <Input id="loan-emp" placeholder="Leave empty to file for yourself" value={form.employeeId}
                  onChange={(e) => setForm({ ...form, employeeId: e.target.value })} />
              </div>
            )}
            <div className="space-y-1.5">
              <Label>Type</Label>
              <div className="grid grid-cols-3 gap-2">
                {(["SALARY_ADVANCE", "PERSONAL_LOAN", "EMERGENCY_LOAN"] as const).map((t) => (
                  <button key={t} type="button"
                    className={`rounded-xl border px-2 py-2 text-[11px] font-medium transition-colors ${form.type === t ? "border-primary bg-primary/10 text-primary" : "border-border text-muted-foreground hover:border-primary/50"}`}
                    onClick={() => setForm({ ...form, type: t })}>
                    {TYPE_LABELS[t]}
                  </button>
                ))}
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label htmlFor="loan-amt">Amount (₹)</Label>
                <Input id="loan-amt" type="number" min={100} value={form.principalAmount}
                  onChange={(e) => setForm({ ...form, principalAmount: e.target.value })} placeholder="50000" />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="loan-ten">Tenure (months)</Label>
                <Input id="loan-ten" type="number" min={1} value={form.tenureMonths}
                  onChange={(e) => setForm({ ...form, tenureMonths: e.target.value })} />
              </div>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="loan-reason">Reason (optional)</Label>
              <Input id="loan-reason" value={form.reason} onChange={(e) => setForm({ ...form, reason: e.target.value })}
                placeholder="Short purpose note" />
            </div>
            {settings?.loanMaxAmount != null && (
              <p className="text-[11px] text-muted-foreground">
                Policy cap: {money(settings.loanMaxAmount)} • max {settings.loanMaxTenureMonths} months @ {settings.loanDefaultInterestRate}% p.a.
              </p>
            )}
            <Button className="w-full" disabled={busy || !form.principalAmount} onClick={submitRequest}>
              {busy ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Plus className="h-4 w-4 mr-2" />}
              Submit request
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Policy settings dialog */}
      <Dialog open={showSettings} onOpenChange={setShowSettings}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Loan policy settings</DialogTitle>
          </DialogHeader>
          {settings && (
            <div className="space-y-4 pt-2">
              <div className="space-y-2.5">
                {([
                  ["loanAllowSalaryAdvance", "Allow salary advances"],
                  ["loanAllowPersonalLoan", "Allow personal loans"],
                  ["loanAllowEmergencyLoan", "Allow emergency loans"],
                  ["loanAutoDeductFromPayroll", "Auto-deduct EMI from payroll"],
                ] as const).map(([key, label]) => (
                  <div key={key} className="flex items-center justify-between">
                    <span className="text-sm text-foreground">{label}</span>
                    <Switch checked={Boolean(settings[key])}
                      onCheckedChange={(v) => setSettings({ ...settings, [key]: v })} />
                  </div>
                ))}
              </div>
              <div className="grid grid-cols-3 gap-3">
                <div className="space-y-1.5">
                  <Label htmlFor="ls-max">Max amount</Label>
                  <Input id="ls-max" type="number" value={settings.loanMaxAmount ?? ""}
                    onChange={(e) => setSettings({ ...settings, loanMaxAmount: e.target.value ? Number(e.target.value) : null })} />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="ls-ten">Max tenure</Label>
                  <Input id="ls-ten" type="number" value={settings.loanMaxTenureMonths}
                    onChange={(e) => setSettings({ ...settings, loanMaxTenureMonths: Number(e.target.value) })} />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="ls-int">Interest % p.a.</Label>
                  <Input id="ls-int" type="number" value={settings.loanDefaultInterestRate}
                    onChange={(e) => setSettings({ ...settings, loanDefaultInterestRate: Number(e.target.value) })} />
                </div>
              </div>
              <Button className="w-full" disabled={busy}
                onClick={async () => {
                  setBusy(true);
                  try {
                    const saved = await loansApi.updateSettings({
                      loanAllowSalaryAdvance: settings.loanAllowSalaryAdvance,
                      loanAllowPersonalLoan: settings.loanAllowPersonalLoan,
                      loanAllowEmergencyLoan: settings.loanAllowEmergencyLoan,
                      loanMaxAmount: settings.loanMaxAmount,
                      loanMaxTenureMonths: settings.loanMaxTenureMonths,
                      loanDefaultInterestRate: settings.loanDefaultInterestRate,
                      loanAutoDeductFromPayroll: settings.loanAutoDeductFromPayroll,
                    });
                    setSettings(saved);
                    toast({ title: "Loan policy saved" });
                    setShowSettings(false);
                  } catch (e: any) {
                    toast({ title: "Save failed", description: e?.response?.data?.message, variant: "destructive" });
                  } finally {
                    setBusy(false);
                  }
                }}>
                {busy ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Check className="h-4 w-4 mr-2" />}
                Save policy
              </Button>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Detail dialog */}
      <Dialog open={!!detail || detailLoading} onOpenChange={(o) => !o && setDetail(null)}>
        <DialogContent className="sm:max-w-2xl max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              Loan detail
              {detail && (
                <Badge variant="outline" className={STATUS_STYLES[detail.status] ?? ""}>{detail.status}</Badge>
              )}
            </DialogTitle>
          </DialogHeader>
          {detailLoading || !detail ? (
            <div className="py-10 flex justify-center"><Loader2 className="h-7 w-7 animate-spin text-primary" /></div>
          ) : (
            <div className="space-y-5 pt-1">
              {/* Facts */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                {[
                  { label: "Principal", value: money(detail.principalAmount) },
                  { label: "Monthly EMI", value: money(detail.monthlyEmi) },
                  { label: "Paid so far", value: money(detail.totalPaid) },
                  { label: "Outstanding", value: money(detail.remainingBalance) },
                ].map((f) => (
                  <div key={f.label} className="rounded-xl bg-muted/50 p-3">
                    <div className="text-[10px] uppercase tracking-wide text-muted-foreground">{f.label}</div>
                    <div className="mt-0.5 font-semibold font-mono text-sm text-foreground">{f.value}</div>
                  </div>
                ))}
              </div>
              <div className="text-xs text-muted-foreground">
                {TYPE_LABELS[detail.type] ?? detail.type} • {detail.tenureMonths} months @ {detail.interestRate}% p.a.
                {detail.disbursedDate ? ` • disbursed ${dateFmt(detail.disbursedDate)}` : ""}
              </div>

              {/* Employee quick actions */}
              <div className="flex flex-wrap gap-2">
                {isAdmin && detail.status === "PENDING" && (
                  <>
                    <Button size="sm" disabled={busy} onClick={() => act(detail.id, () => loansApi.approve(detail.id), "Loan approved")}>
                      <Check className="h-4 w-4 mr-1.5" />Approve
                    </Button>
                    <Button size="sm" variant="outline" disabled={busy}
                      onClick={() => act(detail.id, () => loansApi.reject(detail.id, "Rejected from detail view"), "Loan rejected")}>
                      <XCircle className="h-4 w-4 mr-1.5" />Reject
                    </Button>
                  </>
                )}
                {isAdmin && detail.status === "APPROVED" && (
                  <Button size="sm" disabled={busy} onClick={() => act(detail.id, () => loansApi.disburse(detail.id), "Loan disbursed")}>
                    <Send className="h-4 w-4 mr-1.5" />Mark disbursed
                  </Button>
                )}
                {["ACTIVE", "APPROVED"].includes(detail.status) && (
                  <Button size="sm" variant="outline" disabled={busy} onClick={() => payOnline(detail)}>
                    <Wallet className="h-4 w-4 mr-1.5" />Pay online (Razorpay)
                  </Button>
                )}
              </div>

              {/* Manual repayment (admin) */}
              {isAdmin && ["ACTIVE", "APPROVED"].includes(detail.status) && (
                <div className="rounded-xl border border-border p-3 space-y-2.5">
                  <div className="text-xs font-semibold text-foreground">Record manual repayment</div>
                  <div className="flex flex-col sm:flex-row gap-2">
                    <Input type="number" placeholder="Amount (₹)" value={repayAmount} onChange={(e) => setRepayAmount(e.target.value)} />
                    <Input placeholder="Reference (NEFT / cheque)" value={repayRef} onChange={(e) => setRepayRef(e.target.value)} />
                    <Button size="sm" disabled={busy || !repayAmount} onClick={manualRepay}>
                      <CircleDollarSign className="h-4 w-4 mr-1.5" />Record
                    </Button>
                  </div>
                </div>
              )}

              {/* Schedule */}
              {detail.schedule && detail.schedule.length > 0 && (
                <div>
                  <div className="text-xs font-semibold text-foreground mb-2 flex items-center gap-1.5">
                    <CalendarClock className="h-3.5 w-3.5" />Repayment schedule
                  </div>
                  <div className="rounded-xl border border-border overflow-x-auto">
                    <table className="w-full text-xs">
                      <thead className="bg-muted/60">
                        <tr className="text-left text-[10px] uppercase text-muted-foreground">
                          <th className="px-3 py-2">#</th>
                          <th className="px-3 py-2">Due</th>
                          <th className="px-3 py-2 text-right">EMI</th>
                          <th className="px-3 py-2 text-right">Interest</th>
                          <th className="px-3 py-2 text-right">Principal</th>
                          <th className="px-3 py-2 text-right">Balance</th>
                        </tr>
                      </thead>
                      <tbody>
                        {detail.schedule.map((r) => (
                          <tr key={r.installment} className="border-t border-border/50">
                            <td className="px-3 py-1.5">{r.installment}</td>
                            <td className="px-3 py-1.5">{String(r.dueMonth).padStart(2, "0")}/{r.dueYear}</td>
                            <td className="px-3 py-1.5 text-right font-mono">{money(r.emi)}</td>
                            <td className="px-3 py-1.5 text-right font-mono text-muted-foreground">{money(r.interest)}</td>
                            <td className="px-3 py-1.5 text-right font-mono">{money(r.principalPart)}</td>
                            <td className="px-3 py-1.5 text-right font-mono">{money(r.balance)}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {/* Repayment history */}
              <div>
                <div className="text-xs font-semibold text-foreground mb-2 flex items-center gap-1.5">
                  <History className="h-3.5 w-3.5" />Repayment history
                </div>
                {detail.repayments?.length ? (
                  <div className="space-y-1.5">
                    {detail.repayments.map((r) => (
                      <div key={r.id} className="flex items-center justify-between rounded-lg bg-muted/40 px-3 py-2 text-xs">
                        <div>
                          <span className="font-mono font-medium text-foreground">{money(r.amount)}</span>
                          <span className="ml-2 text-muted-foreground">
                            ({money(r.principalPaid)} principal + {money(r.interestPaid)} interest)
                          </span>
                        </div>
                        <div className="flex items-center gap-2 text-muted-foreground">
                          <Badge variant="outline" className="text-[10px] px-1.5 py-0">{r.method}</Badge>
                          {r.reference && <span className="hidden sm:inline font-mono text-[10px]">{r.reference}</span>}
                          {dateFmt(r.repaymentDate)}
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-xs text-muted-foreground">No repayments yet{detail.status === "ACTIVE" ? " — the next payroll run will auto-deduct the EMI." : "."}</p>
                )}
              </div>

              {/* Activity audit trail */}
              {detail.activities?.length ? (
                <div>
                  <div className="text-xs font-semibold text-foreground mb-2">History</div>
                  <div className="space-y-1">
                    {detail.activities.map((a) => (
                      <div key={a.id} className="flex items-start gap-2 text-[11px] text-muted-foreground">
                        <Badge variant="outline" className="text-[10px] px-1.5 py-0 shrink-0">{a.action}</Badge>
                        <span className="flex-1">{a.details ?? ""}</span>
                        <span className="shrink-0">{new Date(a.createdAt).toLocaleDateString("en-IN")}</span>
                      </div>
                    ))}
                  </div>
                </div>
              ) : null}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}

export default function LoansPage() {
  return (
    <ModuleGate moduleKey="loans">
      <LoansPageInner />
    </ModuleGate>
  );
}
