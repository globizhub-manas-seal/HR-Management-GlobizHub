"use client";

import React, { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import {
  CheckCircle2,
  Download,
  Users,
  HardDrive,
  Zap,
  Receipt,
  ChevronRight,
  Sparkles,
  Loader2,
  AlertCircle,
  Check,
  X,
  CreditCard,
  ShieldCheck,
  TicketPercent,
  BadgeCheck,
  Hourglass,
} from "lucide-react";
import { organizationApi } from "@/lib/api/organization";
import InvoiceReceiptModal, { InvoiceDetail } from "@/components/billing/InvoiceReceiptModal";
import { useToast } from "@/components/ToastProvider";

declare global {
  interface Window {
    Razorpay?: new (options: Record<string, unknown>) => { open: () => void };
  }
}

interface SubscriptionOverview {
  subscription: {
    id: string;
    status: "TRIAL" | "ACTIVE" | "PAST_DUE" | "CANCELLED" | "EXPIRED";
    billingCycle: string;
    startDate: string;
    currentPeriodEnd: string;
    trialEndsAt?: string;
    daysRemaining: number;
    plan: {
      id: string;
      name: string;
      code: string;
      description: string;
      monthlyPrice: number;
      annualPrice: number;
      currency: string;
      maxEmployees: number;
      maxStorageGb: number;
      trialDays: number;
    };
    entitlements: Array<{ moduleKey: string; isEnabled: boolean }>;
  } | null;
  usage: {
    activeEmployees: number;
    maxEmployees: number;
    employeeUsagePct: number;
    storageUsedGb: number;
    maxStorageGb: number;
    storageUsagePct: number;
  };
  availablePlans: Array<{
    id: string;
    name: string;
    code: string;
    description: string;
    monthlyPrice: number;
    annualPrice: number;
    currency: string;
    maxEmployees: number;
    maxStorageGb: number;
    trialDays: number;
    entitlements: Array<{ moduleKey: string; isEnabled: boolean }>;
  }>;
  recentInvoices: Array<{
    id: string;
    invoiceNumber: string;
    amountDue: number;
    amountPaid: number;
    currency: string;
    status: "DRAFT" | "ISSUED" | "PAID" | "VOID" | "UNCOLLECTIBLE";
    dueDate: string;
    paidAt?: string;
    createdAt: string;
  }>;
}

interface BillingConfig {
  currency: string;
  pricePerUserPerMonth: number;
  freemiumMaxUsers: number;
  trialDays: number;
  requireBusinessEmail: boolean;
  paymentGateway: string;
}

interface CheckoutResponse {
  invoice: {
    id: string;
    invoiceNumber: string;
    amountDue: number;
    currency: string;
    dueDate: string;
    perUserPrice: number | null;
    userCount: number | null;
    couponCode: string | null;
  };
  gateway: {
    mode: "RAZORPAY" | "SANDBOX" | "MANUAL";
    orderId: string | null;
    keyId: string | null;
  };
}

export default function WorkspaceBillingPage() {
  const { toast } = useToast();
  const [data, setData] = useState<SubscriptionOverview | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Real checkout state
  const [upgradeModalOpen, setUpgradeModalOpen] = useState(false);
  const [config, setConfig] = useState<BillingConfig | null>(null);
  const [quote, setQuote] = useState<{
    billableUsers: number;
    perUserPrice: number;
    amount: number;
    currency: string;
    gstPercent: number;
  } | null>(null);
  const [couponCode, setCouponCode] = useState("");
  const [isCheckingOut, setIsCheckingOut] = useState(false);
  const [checkout, setCheckout] = useState<CheckoutResponse | null>(null);
  const [checkoutDone, setCheckoutDone] = useState(false);

  // Invoice Receipt Modal
  const [selectedInvoice, setSelectedInvoice] = useState<InvoiceDetail | null>(null);
  const [receiptModalOpen, setReceiptModalOpen] = useState(false);
  const [isLoadingInvoice, setIsLoadingInvoice] = useState(false);

  const fetchOverview = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const res = await organizationApi.getSubscriptionOverview();
      setData(res);
    } catch (err: any) {
      console.error("Failed to load subscription overview", err);
      setError("Unable to load subscription details. Please try again.");
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchOverview();
  }, [fetchOverview]);

  const loadBillingMeta = useCallback(async () => {
    try {
      const [cfg, q] = await Promise.all([
        organizationApi.getBillingConfig(),
        organizationApi.getBillingQuote(),
      ]);
      setConfig(cfg);
      setQuote(q);
    } catch (err) {
      console.error("Failed to load billing config/quote", err);
    }
  }, []);

  const handleOpenReceipt = async (invoiceId: string) => {
    setIsLoadingInvoice(true);
    try {
      const inv = await organizationApi.getInvoiceById(invoiceId);
      setSelectedInvoice(inv);
      setReceiptModalOpen(true);
    } catch (err) {
      console.error("Failed to fetch invoice details", err);
      toast("Failed to load invoice receipt details.", "error");
    } finally {
      setIsLoadingInvoice(false);
    }
  };

  const openUpgradeModal = () => {
    setCheckout(null);
    setCheckoutDone(false);
    setCouponCode("");
    setUpgradeModalOpen(true);
    if (!config) loadBillingMeta();
  };

  const loadRazorpayScript = (): Promise<boolean> =>
    new Promise((resolve) => {
      if (window.Razorpay) return resolve(true);
      const script = document.createElement("script");
      script.src = "https://checkout.razorpay.com/v1/checkout.js";
      script.onload = () => resolve(true);
      script.onerror = () => resolve(false);
      document.body.appendChild(script);
    });

  const handleStartCheckout = async () => {
    setIsCheckingOut(true);
    try {
      const res = await organizationApi.startCheckout(couponCode.trim() || undefined);
      setCheckout(res);
      setQuote((prev) => prev); // keep quote as-is

      if (res.gateway.mode === "RAZORPAY" && res.gateway.orderId) {
        const loaded = await loadRazorpayScript();
        if (!loaded || !window.Razorpay || !res.gateway.keyId) {
          toast(
            "Could not load Razorpay Checkout. Please retry or contact billing support.",
            "error"
          );
          return;
        }
        const rzp = new window.Razorpay({
          key: res.gateway.keyId,
          amount: Math.round(res.invoice.amountDue * 100),
          currency: res.invoice.currency,
          name: "GlobizHR",
          description: `HR subscription - ${res.invoice.invoiceNumber}`,
          order_id: res.gateway.orderId,
          prefill: {},
          theme: { color: "#10b981" },
          handler: async (response: {
            razorpay_order_id: string;
            razorpay_payment_id: string;
            razorpay_signature: string;
          }) => {
            try {
              await organizationApi.verifyCheckout({
                invoiceId: res.invoice.id,
                razorpayOrderId: response.razorpay_order_id,
                razorpayPaymentId: response.razorpay_payment_id,
                razorpaySignature: response.razorpay_signature,
              });
              setCheckoutDone(true);
              fetchOverview();
              toast(
                `Invoice ${res.invoice.invoiceNumber} settled. Your subscription is active.`
              );
            } catch (err: any) {
              toast(
                err?.response?.data?.message ||
                  "The payment could not be verified. Contact support if money was deducted.",
                "error"
              );
            }
          },
        });
        rzp.open();
      }
      // SANDBOX / MANUAL modes render in-modal actions below
    } catch (err: any) {
      toast(
        err?.response?.data?.message ||
          "Could not start the checkout. Please try again.",
        "error"
      );
    } finally {
      setIsCheckingOut(false);
    }
  };

  const handleSandboxPay = async () => {
    if (!checkout) return;
    setIsCheckingOut(true);
    try {
      await organizationApi.simulateSandboxPayment(checkout.invoice.id);
      setCheckoutDone(true);
      fetchOverview();
      toast(
        `Invoice ${checkout.invoice.invoiceNumber} settled (sandbox gateway).`
      );
    } catch (err: any) {
      toast(err?.response?.data?.message || "Sandbox payment failed.", "error");
    } finally {
      setIsCheckingOut(false);
    }
  };

  if (isLoading) {
    return (
      <div className="p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto">
        <div className="min-h-[450px] flex flex-col items-center justify-center gap-3 text-muted-foreground bg-card rounded-2xl border border-border p-8">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <p className="text-sm font-medium">Loading subscription & billing details...</p>
        </div>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto">
        <div className="p-10 text-center rounded-2xl border border-dashed border-border bg-card">
          <AlertCircle className="h-10 w-10 text-destructive mx-auto mb-3" />
          <h3 className="text-base font-semibold text-foreground">{error || "Failed to load"}</h3>
          <p className="text-xs text-muted-foreground mt-1 max-w-md mx-auto">
            We could not fetch your organization subscription records from the server.
          </p>
          <button
            onClick={fetchOverview}
            className="mt-4 px-5 py-2 text-xs font-semibold bg-primary text-primary-foreground rounded-xl shadow-xs hover:bg-primary/90 transition-colors"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  const sub = data.subscription;
  const isTrial = sub?.status === "TRIAL";
  const isActive = sub?.status === "ACTIVE";
  const isPastDue = sub?.status === "PAST_DUE";
  const unpaidInvoices = (data.recentInvoices || []).filter((inv) => inv.status === "ISSUED");
  const currentPlanCode = sub?.plan?.code || "";
  const isFreemium = isActive && currentPlanCode === "PLAN_FREE";
  const isPaid = isActive && currentPlanCode !== "PLAN_FREE" && !isTrial;

  const currentPlanName = sub?.plan?.name || "Subscription";
  const currentCycle = sub?.billingCycle?.toLowerCase() || "month";

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto space-y-6 pb-16">
      {/* Breadcrumb */}
      <div className="flex items-center gap-2 text-xs text-muted-foreground">
        <Link href="/workspace/settings" className="hover:text-foreground transition-colors">
          Settings
        </Link>
        <ChevronRight className="h-3 w-3" />
        <span className="text-foreground font-medium">Subscription & Billing</span>
      </div>

      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-4 border-b border-border">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-foreground flex items-center gap-2.5">
            Subscription & Billing
            <span
              className={`text-xs font-mono font-medium px-2.5 py-0.5 rounded-full border ${
                isActive
                  ? "bg-status-green/15 text-status-green border-status-green/25"
                  : isTrial
                  ? "bg-status-yellow/15 text-status-yellow border-status-yellow/25"
                  : "bg-destructive/15 text-destructive border-destructive/25"
              }`}
            >
              {sub?.status || "TRIAL"}
            </span>
          </h1>
          <p className="text-xs sm:text-sm text-muted-foreground mt-1">
            Per-user pricing invoiced monthly on an annual contract. Every limit is controlled by the platform console.
          </p>
        </div>

        {!isTrial && (
          <button
            onClick={openUpgradeModal}
            className="flex items-center gap-2 px-5 py-2.5 text-xs font-semibold bg-primary hover:bg-primary/90 text-primary-foreground rounded-xl transition-all shadow-xs"
          >
            <Sparkles className="h-4 w-4" />
            {isPaid ? "Renew / Pay Invoice" : "Upgrade to Paid Plan"}
          </button>
        )}
      </div>

      {/* Unpaid invoice alert */}
      {unpaidInvoices.length > 0 && (
        <div className="rounded-2xl border border-status-yellow/40 bg-status-yellow/10 p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-start gap-3">
            <Hourglass className="h-5 w-5 text-status-yellow mt-0.5 shrink-0" />
            <div>
              <p className="text-sm font-semibold text-foreground">
                {unpaidInvoices.length} invoice{unpaidInvoices.length > 1 ? "s" : ""} awaiting payment
              </p>
              <p className="text-xs text-muted-foreground mt-0.5">
                {unpaidInvoices.map((i) => `${i.invoiceNumber} (₹${i.amountDue.toLocaleString()})`).join(", ")} —
                workspace access locks if unpaid beyond the grace period.
              </p>
            </div>
          </div>
          <button
            onClick={openUpgradeModal}
            className="shrink-0 flex items-center gap-2 px-4 py-2 text-xs font-semibold bg-primary text-primary-foreground rounded-xl hover:bg-primary/90"
          >
            <CreditCard className="h-4 w-4" />
            Pay Now
          </button>
        </div>
      )}

      {/* Plan Status Banner */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="md:col-span-2 rounded-2xl border border-border bg-gradient-to-br from-card via-card to-primary/5 p-6 sm:p-7 shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex items-start justify-between gap-4">
              <div>
                <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                  Current Plan
                </span>
                <h2 className="text-xl sm:text-2xl font-black text-foreground mt-0.5">
                  {currentPlanName}
                </h2>
                <p className="text-xs text-muted-foreground mt-1.5 max-w-md">
                  {sub?.plan?.description ||
                    "Full access to the GlobizHR workspace."}
                </p>
              </div>

              <div className="text-right">
                <div className="text-2xl font-black font-mono text-primary">
                  {isTrial
                    ? "Free"
                    : config
                    ? `₹${config.pricePerUserPerMonth}`
                    : `₹${sub?.plan?.monthlyPrice ?? 0}`}
                </div>
                <span className="text-[10px] text-muted-foreground font-medium">
                  {isTrial
                    ? `${sub?.daysRemaining ?? 0} days left in trial`
                    : "per user / month"}
                </span>
              </div>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-6">
              <div className="rounded-xl bg-card border border-border p-3">
                <p className="text-[10px] text-muted-foreground font-medium">Status</p>
                <p className="text-xs font-bold text-foreground mt-0.5">{sub?.status}</p>
              </div>
              <div className="rounded-xl bg-card border border-border p-3">
                <p className="text-[10px] text-muted-foreground font-medium">
                  {isTrial ? "Trial ends" : "Period ends"}
                </p>
                <p className="text-xs font-bold text-foreground mt-0.5">
                  {(isTrial ? sub?.trialEndsAt : sub?.currentPeriodEnd)
                    ? new Date(
                        (isTrial ? sub!.trialEndsAt : sub!.currentPeriodEnd) as string
                      ).toLocaleDateString()
                    : "—"}
                </p>
              </div>
              <div className="rounded-xl bg-card border border-border p-3">
                <p className="text-[10px] text-muted-foreground font-medium">Billing</p>
                <p className="text-xs font-bold text-foreground mt-0.5">
                  {isTrial ? "—" : sub?.billingCycle === "ANNUAL" ? "Monthly / Annual contract" : sub?.billingCycle}
                </p>
              </div>
              <div className="rounded-xl bg-card border border-border p-3">
                <p className="text-[10px] text-muted-foreground font-medium">Seats</p>
                <p className="text-xs font-bold text-foreground mt-0.5">
                  {data.usage?.activeEmployees ?? 0} / {data.usage?.maxEmployees ?? "—"}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Usage column */}
        <div className="space-y-4">
          <div className="rounded-2xl border border-border bg-card p-5 shadow-xs">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <Users className="h-4 w-4 text-primary" />
                <span className="text-xs font-semibold text-foreground">Employee Seats</span>
              </div>
              <span className="text-xs font-mono font-bold text-foreground">
                {data.usage?.activeEmployees ?? 0} / {data.usage?.maxEmployees ?? "—"}
              </span>
            </div>
            <div className="w-full h-2 rounded-full bg-muted overflow-hidden">
              <div
                className={`h-full transition-all rounded-full ${
                  (data.usage?.employeeUsagePct ?? 0) >= 100
                    ? "bg-destructive"
                    : (data.usage?.employeeUsagePct ?? 0) >= 80
                    ? "bg-status-yellow"
                    : "bg-primary"
                }`}
                style={{ width: `${Math.min(100, data.usage?.employeeUsagePct ?? 0)}%` }}
              />
            </div>
            <div className="flex justify-between items-center text-[10px] text-muted-foreground mt-1.5">
              <span>{data.usage?.employeeUsagePct ?? 0}% capacity utilized</span>
              {isFreemium && (
                <span className="text-destructive font-semibold">
                  Freemium cap: {config?.freemiumMaxUsers ?? 5} users
                </span>
              )}
            </div>
            {isFreemium && (
              <p className="mt-3 text-[11px] text-muted-foreground flex items-start gap-1.5">
                <BadgeCheck className="h-3.5 w-3.5 text-primary mt-0.5 shrink-0" />
                Free plan is limited to {config?.freemiumMaxUsers ?? 5} users with verified business
                emails. Upgrade for unlimited seats at ₹
                {config?.pricePerUserPerMonth ?? 49}/user/month.
              </p>
            )}
          </div>

          <div className="rounded-2xl border border-border bg-card p-5 shadow-xs">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <HardDrive className="h-4 w-4 text-primary" />
                <span className="text-xs font-semibold text-foreground">Cloud Storage</span>
              </div>
              <span className="text-xs font-mono font-bold text-foreground">
                {data.usage?.storageUsedGb ?? 0.1} GB / {data.usage?.maxStorageGb ?? 5} GB
              </span>
            </div>
            <div className="w-full h-2 rounded-full bg-muted overflow-hidden">
              <div
                className="h-full bg-primary transition-all rounded-full"
                style={{ width: `${Math.min(100, data.usage?.storageUsagePct ?? 2)}%` }}
              />
            </div>
            <div className="flex justify-between items-center text-[10px] text-muted-foreground mt-1.5">
              <span>Document vaults & employee files</span>
              <span>{data.usage?.storageUsagePct ?? 2}% used</span>
            </div>
          </div>

          <div className="p-4 rounded-xl border border-primary/20 bg-primary/5 text-xs text-foreground">
            <p className="font-semibold flex items-center gap-1.5 text-primary">
              <ShieldCheck className="h-3.5 w-3.5" />
              Secure payments
            </p>
            <p className="text-[11px] text-muted-foreground mt-1">
              Payments are processed via Razorpay with server-side signature verification. Amounts are
              always computed by the platform — never by the browser.
            </p>
          </div>
        </div>
      </div>

      {/* Invoices & Receipts Ledger */}
      <div className="rounded-2xl border border-border bg-card shadow-xs overflow-hidden">
        <div className="p-5 border-b border-border flex items-center justify-between">
          <div>
            <h3 className="text-base font-bold text-foreground flex items-center gap-2">
              <Receipt className="h-4 w-4 text-primary" />
              Tax Invoices & Payment Receipts
            </h3>
            <p className="text-xs text-muted-foreground mt-0.5">
              Official tax invoices issued to your organization for SaaS services.
            </p>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-xs text-left">
            <thead className="bg-muted/40 border-b border-border text-muted-foreground font-semibold">
              <tr>
                <th className="py-3 px-4">Invoice #</th>
                <th className="py-3 px-4">Date</th>
                <th className="py-3 px-4">Due Date</th>
                <th className="py-3 px-4 text-right">Amount</th>
                <th className="py-3 px-4 text-center">Status</th>
                <th className="py-3 px-4 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border text-foreground">
              {!data.recentInvoices || data.recentInvoices.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-8 text-center text-muted-foreground text-xs">
                    No billing invoices generated yet. Invoices appear automatically each billing period or upon upgrade.
                  </td>
                </tr>
              ) : (
                data.recentInvoices.map((inv) => (
                  <tr key={inv.id} className="hover:bg-muted/25 transition-colors">
                    <td className="py-3.5 px-4 font-mono font-bold text-foreground">
                      {inv.invoiceNumber}
                    </td>
                    <td className="py-3.5 px-4 text-muted-foreground">
                      {new Date(inv.createdAt).toLocaleDateString()}
                    </td>
                    <td className="py-3.5 px-4 text-muted-foreground">
                      {new Date(inv.dueDate).toLocaleDateString()}
                    </td>
                    <td className="py-3.5 px-4 text-right font-mono font-bold">
                      ₹{inv.amountDue.toLocaleString()}
                    </td>
                    <td className="py-3.5 px-4 text-center">
                      <span
                        className={`text-[10px] font-semibold px-2 py-0.5 rounded-full border ${
                          inv.status === "PAID"
                            ? "bg-status-green/15 text-status-green border-status-green/25"
                            : inv.status === "ISSUED"
                            ? "bg-status-yellow/15 text-status-yellow border-status-yellow/25"
                            : "bg-destructive/15 text-destructive border-destructive/25"
                        }`}
                      >
                        {inv.status}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 text-right">
                      <button
                        onClick={() => handleOpenReceipt(inv.id)}
                        disabled={isLoadingInvoice}
                        className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-card border border-border text-[11px] font-medium text-foreground hover:border-primary hover:text-primary transition-colors shadow-2xs"
                        title="View printable tax invoice"
                      >
                        <Download className="h-3 w-3" />
                        Tax Receipt
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Upgrade / Checkout Modal */}
      {upgradeModalOpen && (
        <div className="fixed inset-0 z-50 bg-background/80 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
          <div className="w-full max-w-lg rounded-2xl bg-card border border-border p-6 sm:p-8 shadow-2xl relative my-8 max-h-[90vh] overflow-y-auto">
            <button
              onClick={() => {
                setUpgradeModalOpen(false);
                setCheckout(null);
                setCheckoutDone(false);
              }}
              className="absolute right-4 top-4 p-2 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted"
            >
              <X className="h-5 w-5" />
            </button>

            {checkoutDone ? (
              <div className="py-8 text-center max-w-md mx-auto space-y-4">
                <div className="w-16 h-16 rounded-full bg-status-green/15 border border-status-green/30 text-status-green flex items-center justify-center mx-auto">
                  <Check className="w-8 h-8" />
                </div>
                <h3 className="text-xl font-bold text-foreground">Payment Verified</h3>
                <p className="text-xs text-muted-foreground">
                  Your subscription is active and all features are unlocked. The tax invoice is
                  available in the ledger below.
                </p>
                <button
                  onClick={() => {
                    setUpgradeModalOpen(false);
                    setCheckout(null);
                    setCheckoutDone(false);
                  }}
                  className="w-full py-2.5 rounded-xl text-xs font-semibold bg-primary text-primary-foreground hover:bg-primary/90 transition-colors shadow-xs"
                >
                  Done
                </button>
              </div>
            ) : !checkout ? (
              <>
                <div className="text-center mb-6">
                  <span className="text-[10px] font-bold uppercase tracking-widest text-primary font-mono">
                    PAY AS YOU GROW
                  </span>
                  <h2 className="text-xl font-black text-foreground mt-1">
                    ₹{config?.pricePerUserPerMonth ?? quote?.perUserPrice ?? 49}{" "}
                    <span className="text-sm font-semibold text-muted-foreground">/ user / month</span>
                  </h2>
                  <p className="text-xs text-muted-foreground mt-1">
                    Annual contract, invoiced monthly for your actual active users. Cancel anytime
                    before the next billing cycle.
                  </p>
                </div>

                <div className="rounded-xl border border-border bg-muted/30 p-4 space-y-2.5 text-xs mb-4">
                  <div className="flex justify-between items-center">
                    <span className="text-muted-foreground">Active billable users</span>
                    <strong className="text-foreground font-mono">{quote?.billableUsers ?? "…"}</strong>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-muted-foreground">Rate per user</span>
                    <strong className="text-foreground font-mono">
                      ₹{quote?.perUserPrice ?? config?.pricePerUserPerMonth ?? 49}
                    </strong>
                  </div>
                  <div className="flex justify-between items-center border-t border-border pt-2.5">
                    <span className="text-muted-foreground font-semibold">Monthly total</span>
                    <strong className="text-primary font-mono text-base">
                      ₹{quote?.amount?.toLocaleString() ?? "…"}
                    </strong>
                  </div>
                  <p className="text-[10px] text-muted-foreground">
                    GST {"("}{quote?.gstPercent ?? 18}%{"}"} is included in your tax invoice as per
                    applicable law. Amount is computed on the server and cannot be altered here.
                  </p>
                </div>

                <div className="mb-4">
                  <label className="block text-foreground font-medium mb-1.5 text-xs">
                    Discount code (optional)
                  </label>
                  <div className="flex items-center gap-2">
                    <div className="relative flex-1">
                      <TicketPercent className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
                      <input
                        type="text"
                        placeholder="e.g. LAUNCH50"
                        value={couponCode}
                        onChange={(e) => setCouponCode(e.target.value.toUpperCase())}
                        className="w-full pl-9 pr-3 py-2 rounded-lg bg-card border border-border text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
                      />
                    </div>
                  </div>
                  <p className="text-[10px] text-muted-foreground mt-1">
                    Codes are validated server-side; usage is counted once per settled invoice.
                  </p>
                </div>

                <button
                  onClick={handleStartCheckout}
                  disabled={isCheckingOut}
                  className="w-full py-3 rounded-xl bg-primary text-primary-foreground font-semibold hover:bg-primary/90 flex items-center justify-center gap-2 shadow-xs transition-colors disabled:opacity-60"
                >
                  {isCheckingOut ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <CreditCard className="w-4 h-4" />
                  )}
                  {isCheckingOut ? "Preparing secure checkout…" : `Pay ₹${quote?.amount ?? ""} securely`}
                </button>
                <p className="text-[10px] text-muted-foreground text-center mt-3 flex items-center justify-center gap-1">
                  <ShieldCheck className="h-3 w-3" />
                  Payments verified with HMAC signatures — no client-side bypass possible.
                </p>
              </>
            ) : (
              /* Order created — gateway-specific next step */
              <div className="space-y-4">
                <div className="text-center mb-2">
                  <span className="text-[10px] font-bold uppercase tracking-widest text-primary font-mono">
                    ORDER CREATED
                  </span>
                  <h2 className="text-xl font-black text-foreground mt-1">
                    {checkout.invoice.invoiceNumber}
                  </h2>
                  <p className="text-xs text-muted-foreground mt-1">
                    ₹{checkout.invoice.amountDue.toLocaleString()} for {checkout.invoice.userCount} user(s)
                    {checkout.invoice.couponCode ? ` (code ${checkout.invoice.couponCode})` : ""} — due{" "}
                    {new Date(checkout.invoice.dueDate).toLocaleDateString()}
                  </p>
                </div>

                {checkout.gateway.mode === "RAZORPAY" && (
                  <div className="rounded-xl border border-border bg-muted/30 p-4 text-xs text-muted-foreground text-center">
                    If the Razorpay window did not open, retry the payment from the invoice ledger once
                    the page refreshes. The order stays valid until the due date.
                  </div>
                )}

                {checkout.gateway.mode === "SANDBOX" && (
                  <div className="rounded-xl border border-border bg-muted/30 p-4 text-xs text-muted-foreground space-y-3">
                    <p>
                      Sandbox gateway active (no live Razorpay keys configured). Complete the payment
                      through the simulator — it runs the exact same server-side signature verification
                      path as a real Razorpay callback.
                    </p>
                    <button
                      onClick={handleSandboxPay}
                      disabled={isCheckingOut}
                      className="w-full py-2.5 rounded-xl bg-primary text-primary-foreground font-semibold hover:bg-primary/90 flex items-center justify-center gap-2 disabled:opacity-60"
                    >
                      {isCheckingOut ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                      ) : (
                        <CheckCircle2 className="w-4 h-4" />
                      )}
                      Complete sandbox payment
                    </button>
                  </div>
                )}

                {checkout.gateway.mode === "MANUAL" && (
                  <div className="rounded-xl border border-border bg-muted/30 p-4 text-xs text-muted-foreground space-y-2">
                    <p className="font-semibold text-foreground">Manual settlement required</p>
                    <p>
                      The payment gateway is not configured yet. Your invoice{" "}
                      <strong className="text-foreground">{checkout.invoice.invoiceNumber}</strong> is
                      issued and due {new Date(checkout.invoice.dueDate).toLocaleDateString()}. Ask the
                      platform billing team to record your bank transfer payment — your subscription is
                      active during this period.
                    </p>
                  </div>
                )}

                <button
                  onClick={() => {
                    setUpgradeModalOpen(false);
                    setCheckout(null);
                  }}
                  className="w-full py-2.5 rounded-xl border border-border text-muted-foreground font-semibold hover:bg-muted transition-colors text-xs"
                >
                  Close
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Receipt modal */}
      <InvoiceReceiptModal
        isOpen={receiptModalOpen}
        onClose={() => setReceiptModalOpen(false)}
        invoice={selectedInvoice}
      />
    </div>
  );
}
