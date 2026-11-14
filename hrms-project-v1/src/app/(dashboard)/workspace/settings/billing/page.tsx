"use client";

import React, { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import {
  CreditCard,
  CheckCircle2,
  AlertTriangle,
  Clock,
  Download,
  Users,
  HardDrive,
  ShieldCheck,
  Zap,
  ArrowRight,
  Receipt,
  Building2,
  ChevronRight,
  ExternalLink,
  Sparkles,
  Loader2,
  HelpCircle,
  AlertCircle,
} from "lucide-react";
import { organizationApi } from "@/lib/api/organization";
import InvoiceReceiptModal, { InvoiceDetail } from "@/components/billing/InvoiceReceiptModal";

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

export default function WorkspaceBillingPage() {
  const [data, setData] = useState<SubscriptionOverview | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Upgrade modal
  const [upgradeModalOpen, setUpgradeModalOpen] = useState(false);

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

  const handleOpenReceipt = async (invoiceId: string) => {
    setIsLoadingInvoice(true);
    try {
      const inv = await organizationApi.getInvoiceById(invoiceId);
      setSelectedInvoice(inv);
      setReceiptModalOpen(true);
    } catch (err) {
      console.error("Failed to fetch invoice details", err);
      alert("Failed to load invoice receipt details.");
    } finally {
      setIsLoadingInvoice(false);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-[500px] flex flex-col items-center justify-center gap-3 text-muted-foreground">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <p className="text-xs font-medium">Loading subscription & billing details...</p>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="p-8 text-center rounded-2xl border border-dashed border-border bg-card">
        <AlertCircle className="h-10 w-10 text-destructive mx-auto mb-3" />
        <h3 className="text-sm font-semibold text-foreground">{error || "Failed to load"}</h3>
        <button
          onClick={fetchOverview}
          className="mt-4 px-4 py-2 text-xs font-medium bg-primary text-primary-foreground rounded-lg"
        >
          Retry
        </button>
      </div>
    );
  }

  const sub = data.subscription;
  const isTrial = sub?.status === "TRIAL";
  const isActive = sub?.status === "ACTIVE";
  const isExpired = sub?.status === "EXPIRED" || sub?.status === "PAST_DUE";

  return (
    <div className="space-y-6 max-w-6xl mx-auto pb-12">
      {/* Breadcrumb & Navigation */}
      <div className="flex items-center gap-2 text-xs text-muted-foreground">
        <Link href="/workspace/settings" className="hover:text-foreground transition-colors">
          Settings
        </Link>
        <ChevronRight className="h-3 w-3" />
        <span className="text-foreground font-medium">Subscription & Billing</span>
      </div>

      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-2 border-b border-border">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground flex items-center gap-2">
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
              {sub?.status || "NO ACTIVE PLAN"}
            </span>
          </h1>
          <p className="text-xs sm:text-sm text-muted-foreground mt-1">
            Manage your company&apos;s SaaS tier, employee capacity quotas, invoices, and billing history.
          </p>
        </div>

        <button
          onClick={() => setUpgradeModalOpen(true)}
          className="flex items-center gap-2 px-4 py-2 text-xs font-semibold bg-primary hover:bg-primary/90 text-primary-foreground rounded-xl transition-all shadow-xs"
        >
          <Sparkles className="h-4 w-4" />
          Change Plan / Upgrade
        </button>
      </div>

      {/* Plan Status Banner */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Main Plan Card */}
        <div className="md:col-span-2 rounded-2xl border border-border bg-gradient-to-br from-card via-card to-primary/5 p-6 shadow-sm flex flex-col justify-between">
          <div>
            <div className="flex items-start justify-between gap-4">
              <div>
                <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                  Current SaaS Tier
                </span>
                <h2 className="text-xl sm:text-2xl font-black text-foreground mt-0.5">
                  {sub?.plan?.name || "Free Trial Tier"}
                </h2>
                <p className="text-xs text-muted-foreground mt-1.5 max-w-md">
                  {sub?.plan?.description || "Access to foundational attendance and core HR records."}
                </p>
              </div>

              <div className="text-right">
                <div className="text-2xl font-black font-mono text-primary">
                  {sub?.plan?.monthlyPrice === 0 ? "Free" : `₹${sub?.plan?.monthlyPrice?.toLocaleString()}`}
                </div>
                <span className="text-[10px] text-muted-foreground font-medium">
                  {sub?.plan?.monthlyPrice === 0 ? "14-day preview" : `per ${sub?.billingCycle?.toLowerCase() || "month"}`}
                </span>
              </div>
            </div>

            {/* Trial / Renewal Alert */}
            <div className="mt-5 p-3.5 rounded-xl bg-muted/40 border border-border text-xs flex items-center justify-between gap-3">
              <div className="flex items-center gap-2.5">
                {isTrial ? (
                  <Clock className="h-4 w-4 text-status-yellow shrink-0" />
                ) : isExpired ? (
                  <AlertTriangle className="h-4 w-4 text-destructive shrink-0" />
                ) : (
                  <CheckCircle2 className="h-4 w-4 text-status-green shrink-0" />
                )}
                <div>
                  <span className="font-semibold text-foreground">
                    {isTrial
                      ? `${sub?.daysRemaining} days remaining in Free Trial`
                      : isExpired
                      ? "Plan period overdue. Please renew."
                      : "Subscription is Active"}
                  </span>
                  <p className="text-[11px] text-muted-foreground">
                    {isTrial
                      ? `Trial ends on ${new Date(sub?.trialEndsAt || sub?.currentPeriodEnd || "").toLocaleDateString()}`
                      : `Next billing renewal: ${new Date(sub?.currentPeriodEnd || "").toLocaleDateString()}`}
                  </p>
                </div>
              </div>

              <button
                onClick={() => setUpgradeModalOpen(true)}
                className="text-xs font-semibold text-primary hover:underline shrink-0"
              >
                Upgrade now &rarr;
              </button>
            </div>
          </div>

          {/* Included modules pills */}
          <div className="mt-6 pt-4 border-t border-border">
            <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground block mb-2">
              Features Enabled in this Tier
            </span>
            <div className="flex flex-wrap gap-1.5">
              {sub?.entitlements
                ?.filter((e) => e.isEnabled)
                .map((e) => (
                  <span
                    key={e.moduleKey}
                    className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-[11px] font-medium bg-card border border-border text-foreground"
                  >
                    <CheckCircle2 className="h-3 w-3 text-status-green" />
                    {e.moduleKey.toUpperCase()}
                  </span>
                ))}
            </div>
          </div>
        </div>

        {/* Quota Usage Side Panel */}
        <div className="space-y-4">
          {/* Employee Quota */}
          <div className="rounded-2xl border border-border bg-card p-5 shadow-xs">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <Users className="h-4 w-4 text-primary" />
                <span className="text-xs font-semibold text-foreground">Employee Capacity</span>
              </div>
              <span className="text-xs font-mono font-bold text-foreground">
                {data.usage.activeEmployees} / {data.usage.maxEmployees}
              </span>
            </div>

            <div className="w-full h-2 rounded-full bg-muted overflow-hidden">
              <div
                className={`h-full transition-all rounded-full ${
                  data.usage.employeeUsagePct >= 90
                    ? "bg-destructive"
                    : data.usage.employeeUsagePct >= 75
                    ? "bg-status-yellow"
                    : "bg-primary"
                }`}
                style={{ width: `${Math.min(100, data.usage.employeeUsagePct)}%` }}
              />
            </div>
            <div className="flex justify-between items-center text-[10px] text-muted-foreground mt-1.5">
              <span>{data.usage.employeeUsagePct}% capacity utilized</span>
              {data.usage.employeeUsagePct >= 80 && (
                <span className="text-destructive font-semibold">Near limit</span>
              )}
            </div>
          </div>

          {/* Cloud Storage Quota */}
          <div className="rounded-2xl border border-border bg-card p-5 shadow-xs">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <HardDrive className="h-4 w-4 text-primary" />
                <span className="text-xs font-semibold text-foreground">Cloud Storage</span>
              </div>
              <span className="text-xs font-mono font-bold text-foreground">
                {data.usage.storageUsedGb} GB / {data.usage.maxStorageGb} GB
              </span>
            </div>

            <div className="w-full h-2 rounded-full bg-muted overflow-hidden">
              <div
                className="h-full bg-primary transition-all rounded-full"
                style={{ width: `${Math.min(100, data.usage.storageUsagePct)}%` }}
              />
            </div>
            <div className="flex justify-between items-center text-[10px] text-muted-foreground mt-1.5">
              <span>Document vaults & biometric logs</span>
              <span>{data.usage.storageUsagePct}% used</span>
            </div>
          </div>

          {/* Need Custom Plan Box */}
          <div className="p-4 rounded-xl border border-primary/20 bg-primary/5 text-xs text-foreground">
            <p className="font-semibold flex items-center gap-1.5 text-primary">
              <Zap className="h-3.5 w-3.5" />
              Dedicated Enterprise SLAs
            </p>
            <p className="text-[11px] text-muted-foreground mt-1">
              Need custom employee limits, dedicated VPC hosting, or bespoke payroll integrations?
            </p>
            <a
              href="mailto:enterprise@antigravity.saas?subject=Enterprise Custom Plan Inquiry"
              className="inline-flex items-center gap-1 text-[11px] font-bold text-primary mt-2 hover:underline"
            >
              Contact Platform Sales &rarr;
            </a>
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
              {data.recentInvoices.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-8 text-center text-muted-foreground text-xs">
                    No billing invoices generated yet. Invoices will automatically appear when your plan renews.
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

      {/* Upgrade / Compare Plans Modal */}
      {upgradeModalOpen && (
        <div className="fixed inset-0 z-50 bg-background/80 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
          <div className="w-full max-w-4xl rounded-2xl bg-card border border-border p-6 sm:p-8 shadow-2xl relative my-8">
            <button
              onClick={() => setUpgradeModalOpen(false)}
              className="absolute right-4 top-4 p-1.5 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted"
            >
              <X className="h-5 w-5" />
            </button>

            <div className="text-center max-w-lg mx-auto mb-8">
              <span className="text-[10px] font-bold uppercase tracking-widest text-primary font-mono">
                SAAS SUBSCRIPTION TIERS
              </span>
              <h2 className="text-xl sm:text-2xl font-black text-foreground mt-1">
                Choose the Right HR Plan for Your Team
              </h2>
              <p className="text-xs text-muted-foreground mt-1.5">
                Scale employee capacity, unlock automated statutory payroll, and enable cross-departmental ATS workflows.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {data.availablePlans.map((p) => {
                const isCurrent = sub?.plan?.id === p.id || sub?.plan?.code === p.code;

                return (
                  <div
                    key={p.id}
                    className={`rounded-2xl border p-5 flex flex-col justify-between transition-all ${
                      isCurrent
                        ? "border-primary bg-primary/5 shadow-md ring-1 ring-primary/30"
                        : "border-border bg-card hover:border-primary/40 shadow-xs"
                    }`}
                  >
                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <h3 className="font-bold text-base text-foreground">{p.name}</h3>
                        {isCurrent && (
                          <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-primary text-primary-foreground">
                            Current
                          </span>
                        )}
                      </div>

                      <div className="mt-2 text-2xl font-black font-mono text-foreground">
                        {p.monthlyPrice === 0 ? "₹0" : `₹${p.monthlyPrice.toLocaleString()}`}
                        <span className="text-xs font-normal text-muted-foreground"> /mo</span>
                      </div>

                      <p className="text-xs text-muted-foreground mt-2 min-h-[36px]">
                        {p.description}
                      </p>

                      <div className="mt-4 pt-4 border-t border-border space-y-2 text-xs text-muted-foreground">
                        <div className="flex items-center gap-2">
                          <Users className="h-3.5 w-3.5 text-primary" />
                          <span>Up to <strong className="text-foreground">{p.maxEmployees} employees</strong></span>
                        </div>
                        <div className="flex items-center gap-2">
                          <HardDrive className="h-3.5 w-3.5 text-primary" />
                          <span><strong className="text-foreground">{p.maxStorageGb} GB</strong> secure storage</span>
                        </div>
                      </div>

                      <div className="mt-4 pt-3 border-t border-border space-y-1.5">
                        <span className="text-[10px] font-bold uppercase text-muted-foreground tracking-wider block">
                          Included Modules:
                        </span>
                        {p.entitlements
                          ?.filter((e) => e.isEnabled)
                          .map((e) => (
                            <div key={e.moduleKey} className="flex items-center gap-1.5 text-[11px] text-foreground">
                              <CheckCircle2 className="h-3 w-3 text-status-green shrink-0" />
                              <span>{e.moduleKey.toUpperCase()}</span>
                            </div>
                          ))}
                      </div>
                    </div>

                    <div className="mt-6 pt-4 border-t border-border">
                      {isCurrent ? (
                        <button
                          disabled
                          className="w-full py-2 rounded-xl text-xs font-semibold bg-muted text-muted-foreground cursor-default"
                        >
                          Current Active Plan
                        </button>
                      ) : (
                        <a
                          href={`mailto:billing@antigravity.saas?subject=Upgrade to ${encodeURIComponent(p.name)}`}
                          className="w-full py-2 rounded-xl text-xs font-semibold bg-primary hover:bg-primary/90 text-primary-foreground flex items-center justify-center gap-1.5 shadow-xs transition-colors"
                        >
                          Request Upgrade
                          <ArrowRight className="h-3.5 w-3.5" />
                        </a>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>

            <div className="mt-6 text-center text-xs text-muted-foreground">
              Billing changes and plan upgrades take effect instantly with prorated credit adjustments.
            </div>
          </div>
        </div>
      )}

      {/* Tax Invoice Modal */}
      <InvoiceReceiptModal
        invoice={selectedInvoice}
        isOpen={receiptModalOpen}
        onClose={() => setReceiptModalOpen(false)}
      />
    </div>
  );
}

function X({ className }: { className?: string }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
    >
      <path d="M18 6 6 18" />
      <path d="m6 6 12 12" />
    </svg>
  );
}
