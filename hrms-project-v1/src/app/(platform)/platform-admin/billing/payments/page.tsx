"use client";

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import {
  DollarSign,
  Search,
  Filter,
  CheckCircle2,
  Clock,
  AlertCircle,
  Building2,
  CreditCard,
  RefreshCw,
  Plus,
  X,
  ShieldCheck,
  Receipt,
} from "lucide-react";
import { platformApi } from "@/lib/platform-api";

interface PaymentItem {
  id: string;
  invoiceId: string;
  invoiceNumber: string;
  companyId: string;
  companyName: string;
  companyEmail: string;
  amount: number;
  currency: string;
  gateway: string;
  gatewayPaymentId?: string;
  idempotencyKey: string;
  status: "SUCCEEDED" | "PENDING" | "FAILED" | "REFUNDED";
  failureReason?: string;
  createdAt: string;
}

export default function PaymentsLedgerPage() {
  const [payments, setPayments] = useState<PaymentItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [gatewayFilter, setGatewayFilter] = useState("ALL");
  const [page, setPage] = useState(1);
  const [meta, setMeta] = useState({ total: 0, totalPages: 1, limit: 20 });

  // Record Payment Modal
  const [modalOpen, setModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [invoices, setInvoices] = useState<any[]>([]);
  const [successMsg, setSuccessMsg] = useState("");
  const [errorMsg, setErrorMsg] = useState("");
  const [form, setForm] = useState({
    invoiceId: "",
    amount: 1499,
    gateway: "MANUAL_BANK",
    gatewayPaymentId: "",
    idempotencyKey: "",
    status: "SUCCEEDED" as "SUCCEEDED" | "PENDING" | "FAILED" | "REFUNDED",
  });

  const fetchPayments = useCallback(async () => {
    setIsLoading(true);
    try {
      const params = new URLSearchParams();
      if (statusFilter !== "ALL") params.append("status", statusFilter);
      if (gatewayFilter !== "ALL") params.append("gateway", gatewayFilter);
      params.append("page", page.toString());
      params.append("limit", "20");

      const res = await platformApi.get<{ data: PaymentItem[]; meta: any }>(
        `/platform/billing/payments?${params.toString()}`
      );
      setPayments(res.data?.data || []);
      setMeta(res.data?.meta || { total: 0, totalPages: 1, limit: 20 });
    } catch (err: any) {
      console.error("Failed to load payments", err);
    } finally {
      setIsLoading(false);
    }
  }, [statusFilter, gatewayFilter, page]);

  const loadInvoices = async () => {
    try {
      const res = await platformApi.get<{ data: any[] }>("/platform/billing/invoices?status=ISSUED&limit=50");
      const list = res.data?.data || [];
      setInvoices(list);
      if (list[0]) {
        setForm((prev) => ({
          ...prev,
          invoiceId: list[0].id,
          amount: list[0].amountDue,
          idempotencyKey: `man_pay_${Date.now()}`,
        }));
      }
    } catch (e) {
      console.error("Failed to load open invoices", e);
    }
  };

  useEffect(() => {
    loadInvoices();
  }, []);

  useEffect(() => {
    fetchPayments();
  }, [fetchPayments]);

  const handleRecordPayment = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setSuccessMsg("");
    setErrorMsg("");

    try {
      await platformApi.post("/platform/billing/payments", {
        invoiceId: form.invoiceId,
        amount: Number(form.amount),
        gateway: form.gateway,
        gatewayPaymentId: form.gatewayPaymentId || undefined,
        idempotencyKey: form.idempotencyKey || `pay_${Date.now()}`,
        status: form.status,
      });

      setSuccessMsg("Payment recorded successfully!");
      setTimeout(() => {
        setModalOpen(false);
        fetchPayments();
      }, 1000);
    } catch (err: any) {
      setErrorMsg(err.response?.data?.message || err.message || "Failed to record payment");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold tracking-tight text-foreground">Payments Ledger</h1>
            <span className="text-xs font-mono font-medium px-2 py-0.5 rounded-full bg-status-green/15 text-status-green border border-status-green/25">
              {meta.total} Transaction{meta.total !== 1 ? "s" : ""}
            </span>
          </div>
          <p className="text-sm text-muted-foreground mt-1">
            Real-time transaction history from Stripe, Razorpay webhooks, and verified offline bank transfers.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            onClick={() => fetchPayments()}
            className="flex items-center gap-2 px-3.5 py-2 text-xs font-medium text-foreground bg-card border border-border hover:bg-muted rounded-lg transition-colors"
          >
            <RefreshCw className="h-3.5 w-3.5" />
            Refresh
          </button>
          <button
            onClick={() => {
              setSuccessMsg("");
              setErrorMsg("");
              setForm((prev) => ({ ...prev, idempotencyKey: `man_pay_${Date.now()}` }));
              setModalOpen(true);
            }}
            className="flex items-center gap-2 px-4 py-2 text-xs font-medium bg-primary hover:bg-primary/90 text-primary-foreground rounded-lg transition-colors shadow-md shadow-xs"
          >
            <Plus className="h-4 w-4" />
            Record Payment
          </button>
        </div>
      </div>

      {/* Filter Bar */}
      <div className="p-4 rounded-xl bg-card border border-border flex flex-wrap gap-3">
        <div className="flex items-center gap-2">
          <Filter className="h-4 w-4 text-muted-foreground" />
          <select
            value={statusFilter}
            onChange={(e) => {
              setStatusFilter(e.target.value);
              setPage(1);
            }}
            className="px-3 py-2 rounded-lg bg-background border border-border text-xs font-medium text-foreground focus:outline-none focus:border-primary"
          >
            <option value="ALL">All Payment Statuses</option>
            <option value="SUCCEEDED">Succeeded</option>
            <option value="PENDING">Pending</option>
            <option value="FAILED">Failed</option>
            <option value="REFUNDED">Refunded</option>
          </select>
        </div>

        <div className="flex items-center gap-2">
          <CreditCard className="h-4 w-4 text-muted-foreground" />
          <select
            value={gatewayFilter}
            onChange={(e) => {
              setGatewayFilter(e.target.value);
              setPage(1);
            }}
            className="px-3 py-2 rounded-lg bg-background border border-border text-xs font-medium text-foreground focus:outline-none focus:border-primary"
          >
            <option value="ALL">All Payment Gateways</option>
            <option value="STRIPE">Stripe</option>
            <option value="RAZORPAY">Razorpay</option>
            <option value="MANUAL_BANK">Manual Bank Transfer</option>
          </select>
        </div>
      </div>

      {/* Payments Table */}
      <div className="rounded-xl border border-border bg-card overflow-hidden shadow-xl">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-muted/50 border-b border-border text-muted-foreground uppercase tracking-wider font-semibold">
              <tr>
                <th className="py-3.5 px-4">Transaction / Idempotency Key</th>
                <th className="py-3.5 px-4">Invoice #</th>
                <th className="py-3.5 px-4">Organization</th>
                <th className="py-3.5 px-4">Gateway</th>
                <th className="py-3.5 px-4">Amount</th>
                <th className="py-3.5 px-4">Status</th>
                <th className="py-3.5 px-4">Timestamp</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {isLoading ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-muted-foreground">
                    <RefreshCw className="h-6 w-6 animate-spin mx-auto mb-2 text-primary" />
                    Loading payments...
                  </td>
                </tr>
              ) : payments.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-muted-foreground">
                    No payment transactions found.
                  </td>
                </tr>
              ) : (
                payments.map((p) => {
                  const isSucceeded = p.status === "SUCCEEDED";
                  const isPending = p.status === "PENDING";
                  const isFailed = p.status === "FAILED";

                  return (
                    <tr key={p.id} className="hover:bg-muted/30 transition-colors">
                      <td className="py-3.5 px-4">
                        <div className="font-mono text-foreground text-[11px] truncate max-w-[180px]">
                          {p.gatewayPaymentId || p.idempotencyKey}
                        </div>
                        <div className="text-[10px] text-muted-foreground font-mono">
                          ID: {p.id.slice(0, 8)}...
                        </div>
                      </td>
                      <td className="py-3.5 px-4 font-mono font-semibold text-primary">
                        {p.invoiceNumber}
                      </td>
                      <td className="py-3.5 px-4">
                        <Link
                          href={`/platform-admin/organizations/${p.companyId}`}
                          className="font-medium text-foreground hover:text-primary transition-colors block"
                        >
                          {p.companyName}
                        </Link>
                        <span className="text-[11px] text-muted-foreground truncate block max-w-[180px]">
                          {p.companyEmail}
                        </span>
                      </td>
                      <td className="py-3.5 px-4">
                        <span className="px-2 py-0.5 rounded text-[10px] font-semibold uppercase bg-background text-foreground border border-border">
                          {p.gateway}
                        </span>
                      </td>
                      <td className="py-3.5 px-4 font-mono font-semibold text-foreground">
                        ₹{p.amount.toLocaleString()}
                      </td>
                      <td className="py-3.5 px-4">
                        <span
                          className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-semibold border ${
                            isSucceeded
                              ? "bg-status-green/15 text-status-green border-status-green/25"
                              : isPending
                              ? "bg-status-orange/15 text-status-orange border-status-orange/25"
                              : "bg-destructive/15 text-destructive border-destructive/25"
                          }`}
                        >
                          {isSucceeded && <CheckCircle2 className="h-3 w-3" />}
                          {isPending && <Clock className="h-3 w-3" />}
                          {isFailed && <AlertCircle className="h-3 w-3" />}
                          {p.status}
                        </span>
                        {p.failureReason && (
                          <div className="text-[10px] text-destructive mt-0.5 max-w-[150px] truncate">
                            {p.failureReason}
                          </div>
                        )}
                      </td>
                      <td className="py-3.5 px-4 font-mono text-muted-foreground text-[11px]">
                        {new Date(p.createdAt).toLocaleString()}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        <div className="p-4 border-t border-border bg-muted/40 flex items-center justify-between text-xs text-muted-foreground">
          <div>
            Showing {(page - 1) * meta.limit + (payments.length > 0 ? 1 : 0)} to{" "}
            {Math.min(page * meta.limit, meta.total)} of {meta.total} payments
          </div>
          <div className="flex items-center gap-2">
            <button
              disabled={page <= 1}
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              className="px-3 py-1.5 rounded-lg bg-card border border-border text-foreground disabled:opacity-40 hover:bg-muted"
            >
              Previous
            </button>
            <span className="font-mono text-muted-foreground">
              Page {page} of {meta.totalPages || 1}
            </span>
            <button
              disabled={page >= meta.totalPages}
              onClick={() => setPage((p) => p + 1)}
              className="px-3 py-1.5 rounded-lg bg-card border border-border text-foreground disabled:opacity-40 hover:bg-muted"
            >
              Next
            </button>
          </div>
        </div>
      </div>

      {/* Modal: Record Manual Payment */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 bg-muted/50 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="w-full max-w-lg rounded-2xl bg-card border border-border p-6 shadow-2xl relative">
            <button
              onClick={() => setModalOpen(false)}
              className="absolute right-4 top-4 p-1.5 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted"
            >
              <X className="h-5 w-5" />
            </button>

            <div className="flex items-center gap-3 mb-4">
              <div className="p-2 rounded-xl bg-status-green/15 border border-status-green/25 text-status-green">
                <DollarSign className="h-5 w-5" />
              </div>
              <div>
                <h3 className="text-base font-bold text-foreground">Record Payment Transaction</h3>
                <p className="text-xs text-muted-foreground">
                  Manually reconcile wire transfer, cheque, or external gateway settlement.
                </p>
              </div>
            </div>

            {successMsg && (
              <div className="mb-4 p-3 rounded-lg bg-status-green/15 border border-status-green/25 text-status-green text-xs flex items-center gap-2">
                <CheckCircle2 className="h-4 w-4" />
                {successMsg}
              </div>
            )}
            {errorMsg && (
              <div className="mb-4 p-3 rounded-lg bg-destructive/15 border border-destructive/25 text-destructive text-xs flex items-center gap-2">
                <AlertCircle className="h-4 w-4" />
                {errorMsg}
              </div>
            )}

            <form onSubmit={handleRecordPayment} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-foreground mb-1">
                  Matching Open Invoice
                </label>
                <select
                  value={form.invoiceId}
                  onChange={(e) => {
                    const inv = invoices.find((i) => i.id === e.target.value);
                    setForm({
                      ...form,
                      invoiceId: e.target.value,
                      amount: inv ? inv.amountDue : form.amount,
                    });
                  }}
                  required
                  className="w-full px-3 py-2 rounded-lg bg-background border border-border text-xs text-foreground focus:outline-none focus:border-primary"
                >
                  <option value="" disabled>
                    Select an open invoice...
                  </option>
                  {invoices.map((i) => (
                    <option key={i.id} value={i.id}>
                      {i.invoiceNumber} — {i.companyName} (Due: ₹{i.amountDue})
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-foreground mb-1">
                    Amount Paid (₹)
                  </label>
                  <input
                    type="number"
                    min="1"
                    step="0.01"
                    value={form.amount}
                    onChange={(e) => setForm({ ...form, amount: Number(e.target.value) })}
                    required
                    className="w-full px-3 py-2 rounded-lg bg-background border border-border text-xs text-foreground focus:outline-none focus:border-primary font-mono"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-foreground mb-1">
                    Gateway Method
                  </label>
                  <select
                    value={form.gateway}
                    onChange={(e) => setForm({ ...form, gateway: e.target.value })}
                    className="w-full px-3 py-2 rounded-lg bg-background border border-border text-xs text-foreground focus:outline-none focus:border-primary"
                  >
                    <option value="MANUAL_BANK">Manual Bank Transfer</option>
                    <option value="STRIPE">Stripe</option>
                    <option value="RAZORPAY">Razorpay</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-foreground mb-1">
                  Bank Reference / Gateway Payment ID
                </label>
                <input
                  type="text"
                  placeholder="e.g. UTR-9823482340 or ch_3L..."
                  value={form.gatewayPaymentId}
                  onChange={(e) => setForm({ ...form, gatewayPaymentId: e.target.value })}
                  className="w-full px-3 py-2 rounded-lg bg-background border border-border text-xs text-foreground focus:outline-none focus:border-primary font-mono"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-foreground mb-1">
                  Idempotency Key (Prevents duplicates)
                </label>
                <input
                  type="text"
                  value={form.idempotencyKey}
                  onChange={(e) => setForm({ ...form, idempotencyKey: e.target.value })}
                  required
                  className="w-full px-3 py-2 rounded-lg bg-background border border-border text-xs text-foreground focus:outline-none focus:border-primary font-mono"
                />
              </div>

              <div className="flex justify-end gap-2.5 pt-3 border-t border-border">
                <button
                  type="button"
                  onClick={() => setModalOpen(false)}
                  className="px-4 py-2 rounded-lg text-xs font-medium text-muted-foreground hover:text-foreground hover:bg-muted"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="flex items-center gap-1.5 px-4 py-2 rounded-lg text-xs font-medium text-foreground bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50"
                >
                  {isSubmitting ? (
                    <RefreshCw className="h-3.5 w-3.5 animate-spin" />
                  ) : (
                    <ShieldCheck className="h-3.5 w-3.5" />
                  )}
                  Save Payment
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
