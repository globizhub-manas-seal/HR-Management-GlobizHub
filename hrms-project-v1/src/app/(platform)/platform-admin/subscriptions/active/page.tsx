"use client";

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import {
  Repeat,
  Search,
  Filter,
  CheckCircle2,
  Clock,
  AlertCircle,
  Building2,
  Users,
  Calendar,
  Sparkles,
  ArrowRight,
  RefreshCw,
  Plus,
  ShieldCheck,
  X,
  CreditCard,
} from "lucide-react";
import { platformApi } from "@/lib/platform-api";

interface SubscriptionItem {
  id: string;
  companyId: string;
  companyName: string;
  companyEmail: string;
  companyStatus: string;
  employeeCount: number;
  planName: string;
  planCode: string;
  maxEmployees: number;
  monthlyPrice: number;
  billingCycle: string;
  status: string;
  startDate: string;
  currentPeriodEnd: string;
  trialEndsAt?: string;
}

interface PlanOption {
  id: string;
  name: string;
  code: string;
  monthlyPrice: number;
  annualPrice: number;
  maxEmployees: number;
  trialDays: number;
}

interface CompanyOption {
  id: string;
  name: string;
  email: string;
}

export default function ActiveSubscriptionsPage() {
  const [subscriptions, setSubscriptions] = useState<SubscriptionItem[]>([]);
  const [plans, setPlans] = useState<PlanOption[]>([]);
  const [companies, setCompanies] = useState<CompanyOption[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [page, setPage] = useState(1);
  const [meta, setMeta] = useState({ total: 0, totalPages: 1, limit: 20 });

  // Modal State
  const [modalOpen, setModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [selectedSub, setSelectedSub] = useState<SubscriptionItem | null>(null);
  const [formData, setFormData] = useState({
    companyId: "",
    planId: "",
    billingCycle: "MONTHLY",
    status: "ACTIVE",
    extensionDays: 30,
    reason: "",
  });
  const [actionSuccess, setActionSuccess] = useState("");
  const [actionError, setActionError] = useState("");

  const fetchSubscriptions = useCallback(async () => {
    setIsLoading(true);
    try {
      const params = new URLSearchParams();
      if (search) params.append("search", search);
      if (statusFilter !== "ALL") params.append("status", statusFilter);
      params.append("page", page.toString());
      params.append("limit", "20");

      const res = await platformApi.get<{ data: SubscriptionItem[]; meta: any }>(
        `/platform/subscriptions?${params.toString()}`
      );
      setSubscriptions(res.data?.data || []);
      setMeta(res.data?.meta || { total: 0, totalPages: 1, limit: 20 });
    } catch (err: any) {
      console.error("Failed to load subscriptions", err);
    } finally {
      setIsLoading(false);
    }
  }, [search, statusFilter, page]);

  const loadReferenceData = async () => {
    try {
      const [plansRes, orgsRes] = await Promise.all([
        platformApi.get<PlanOption[]>("/platform/plans"),
        platformApi.get<{ data: any[] }>("/platform/organizations?limit=100"),
      ]);
      setPlans(plansRes.data || []);
      setCompanies(
        (orgsRes.data?.data || []).map((o: any) => ({
          id: o.id,
          name: o.name,
          email: o.email,
        }))
      );
    } catch (e) {
      console.error("Failed loading reference data", e);
    }
  };

  useEffect(() => {
    loadReferenceData();
  }, []);

  useEffect(() => {
    fetchSubscriptions();
  }, [fetchSubscriptions]);

  const handleOpenAssignModal = (sub?: SubscriptionItem) => {
    setActionSuccess("");
    setActionError("");
    if (sub) {
      setSelectedSub(sub);
      const matchedPlan = plans.find((p) => p.code === sub.planCode || p.name === sub.planName);
      setFormData({
        companyId: sub.companyId,
        planId: matchedPlan?.id || plans[0]?.id || "",
        billingCycle: sub.billingCycle || "MONTHLY",
        status: sub.status || "ACTIVE",
        extensionDays: 30,
        reason: "",
      });
    } else {
      setSelectedSub(null);
      setFormData({
        companyId: companies[0]?.id || "",
        planId: plans[0]?.id || "",
        billingCycle: "MONTHLY",
        status: "ACTIVE",
        extensionDays: 30,
        reason: "",
      });
    }
    setModalOpen(true);
  };

  const handleSaveSubscription = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setActionSuccess("");
    setActionError("");

    try {
      await platformApi.post("/platform/subscriptions/assign", {
        companyId: formData.companyId,
        planId: formData.planId,
        billingCycle: formData.billingCycle,
        status: formData.status,
        extensionDays: Number(formData.extensionDays),
        reason: formData.reason || undefined,
      });

      setActionSuccess("Subscription assigned/updated successfully!");
      setTimeout(() => {
        setModalOpen(false);
        fetchSubscriptions();
      }, 1000);
    } catch (err: any) {
      setActionError(err.response?.data?.message || err.message || "Failed to update subscription");
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
            <h1 className="text-2xl font-bold tracking-tight text-foreground">Active Subscriptions</h1>
            <span className="text-xs font-mono font-medium px-2 py-0.5 rounded-full bg-status-green/15 text-status-green border border-status-green/25">
              {meta.total} Tenant{meta.total !== 1 ? "s" : ""}
            </span>
          </div>
          <p className="text-sm text-muted-foreground mt-1">
            Monitor and manage active SaaS licenses, plan upgrades, and billing cycles across all organizations.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            onClick={() => fetchSubscriptions()}
            className="flex items-center gap-2 px-3.5 py-2 text-xs font-medium text-foreground bg-card border border-border hover:bg-muted rounded-lg transition-colors"
          >
            <RefreshCw className="h-3.5 w-3.5" />
            Refresh
          </button>
          <button
            onClick={() => handleOpenAssignModal()}
            className="flex items-center gap-2 px-4 py-2 text-xs font-medium bg-primary hover:bg-primary/90 text-primary-foreground rounded-lg transition-colors shadow-md shadow-xs"
          >
            <Plus className="h-4 w-4" />
            Assign Subscription
          </button>
        </div>
      </div>

      {/* Filters Bar */}
      <div className="p-4 rounded-xl bg-card border border-border flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <input
            type="text"
            placeholder="Search by company name..."
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setPage(1);
            }}
            className="w-full pl-10 pr-4 py-2 rounded-lg bg-background border border-border text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary"
          />
        </div>

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
            <option value="ALL">All Statuses</option>
            <option value="ACTIVE">Active</option>
            <option value="TRIAL">In Trial</option>
            <option value="PAST_DUE">Past Due</option>
            <option value="EXPIRED">Expired</option>
            <option value="CANCELLED">Cancelled</option>
          </select>
        </div>
      </div>

      {/* Subscriptions Table */}
      <div className="rounded-xl border border-border bg-card overflow-hidden shadow-xl">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-muted/50 border-b border-border text-muted-foreground uppercase tracking-wider font-semibold">
              <tr>
                <th className="py-3.5 px-4">Organization</th>
                <th className="py-3.5 px-4">Current Plan</th>
                <th className="py-3.5 px-4">Seats / Usage</th>
                <th className="py-3.5 px-4">Cycle & Price</th>
                <th className="py-3.5 px-4">Status</th>
                <th className="py-3.5 px-4">Renewal Date</th>
                <th className="py-3.5 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {isLoading ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-muted-foreground">
                    <RefreshCw className="h-6 w-6 animate-spin mx-auto mb-2 text-primary" />
                    Loading active subscriptions...
                  </td>
                </tr>
              ) : subscriptions.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-muted-foreground">
                    No subscriptions found matching the filter criteria.
                  </td>
                </tr>
              ) : (
                subscriptions.map((sub) => {
                  const isTrial = sub.status === "TRIAL";
                  const isActive = sub.status === "ACTIVE";
                  const isExpired = sub.status === "EXPIRED" || sub.status === "PAST_DUE";

                  const usagePercent = sub.maxEmployees > 0
                    ? Math.min(100, Math.round((sub.employeeCount / sub.maxEmployees) * 100))
                    : 0;

                  return (
                    <tr key={sub.id} className="hover:bg-muted/30 transition-colors">
                      <td className="py-3.5 px-4">
                        <Link
                          href={`/platform-admin/organizations/${sub.companyId}`}
                          className="group block"
                        >
                          <div className="font-semibold text-foreground group-hover:text-primary transition-colors">
                            {sub.companyName}
                          </div>
                          <div className="text-[11px] text-muted-foreground truncate max-w-[200px]">
                            {sub.companyEmail}
                          </div>
                        </Link>
                      </td>
                      <td className="py-3.5 px-4">
                        <span className="font-semibold text-foreground bg-primary/15 border border-primary/25 px-2.5 py-0.5 rounded-full">
                          {sub.planName}
                        </span>
                      </td>
                      <td className="py-3.5 px-4">
                        <div className="flex items-center gap-2">
                          <span className="font-mono text-foreground">
                            {sub.employeeCount} / {sub.maxEmployees}
                          </span>
                          <span className="text-[10px] text-muted-foreground">({usagePercent}%)</span>
                        </div>
                        <div className="w-24 h-1.5 bg-muted rounded-full mt-1 overflow-hidden">
                          <div
                            className={`h-full rounded-full ${
                              usagePercent > 90 ? "bg-rose-500" : usagePercent > 70 ? "bg-amber-500" : "bg-emerald-500"
                            }`}
                            style={{ width: `${usagePercent}%` }}
                          />
                        </div>
                      </td>
                      <td className="py-3.5 px-4">
                        <div className="font-semibold text-foreground">
                          ₹{sub.monthlyPrice?.toLocaleString() || "0"}/mo
                        </div>
                        <div className="text-[10px] font-mono text-muted-foreground uppercase">
                          {sub.billingCycle}
                        </div>
                      </td>
                      <td className="py-3.5 px-4">
                        <span
                          className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-semibold border ${
                            isActive
                              ? "bg-status-green/15 text-status-green border-status-green/25"
                              : isTrial
                              ? "bg-status-orange/15 text-status-orange border-status-orange/25"
                              : "bg-destructive/15 text-destructive border-destructive/25"
                          }`}
                        >
                          {isActive && <CheckCircle2 className="h-3 w-3" />}
                          {isTrial && <Clock className="h-3 w-3" />}
                          {isExpired && <AlertCircle className="h-3 w-3" />}
                          {sub.status}
                        </span>
                      </td>
                      <td className="py-3.5 px-4">
                        <div className="text-foreground font-mono">
                          {sub.currentPeriodEnd
                            ? new Date(sub.currentPeriodEnd).toLocaleDateString()
                            : "N/A"}
                        </div>
                        {isTrial && sub.trialEndsAt && (
                          <div className="text-[10px] text-status-orange">
                            Trial: {new Date(sub.trialEndsAt).toLocaleDateString()}
                          </div>
                        )}
                      </td>
                      <td className="py-3.5 px-4 text-right">
                        <button
                          onClick={() => handleOpenAssignModal(sub)}
                          className="px-3 py-1.5 rounded-lg bg-primary/15 text-primary border border-primary/25 hover:bg-primary/20 transition-colors font-medium text-[11px]"
                        >
                          Modify / Extend
                        </button>
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
            Showing {(page - 1) * meta.limit + (subscriptions.length > 0 ? 1 : 0)} to{" "}
            {Math.min(page * meta.limit, meta.total)} of {meta.total} subscriptions
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

      {/* Modal: Assign / Upgrade / Extend Plan */}
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
              <div className="p-2 rounded-xl bg-primary/15 border border-primary/25 text-primary">
                <CreditCard className="h-5 w-5" />
              </div>
              <div>
                <h3 className="text-base font-bold text-foreground">
                  {selectedSub ? `Modify Plan: ${selectedSub.companyName}` : "Assign New Subscription"}
                </h3>
                <p className="text-xs text-muted-foreground">
                  Select a subscription tier, billing cycle, and extension period.
                </p>
              </div>
            </div>

            {actionSuccess && (
              <div className="mb-4 p-3 rounded-lg bg-status-green/15 border border-status-green/25 text-status-green text-xs flex items-center gap-2">
                <CheckCircle2 className="h-4 w-4" />
                {actionSuccess}
              </div>
            )}
            {actionError && (
              <div className="mb-4 p-3 rounded-lg bg-destructive/15 border border-destructive/25 text-destructive text-xs flex items-center gap-2">
                <AlertCircle className="h-4 w-4" />
                {actionError}
              </div>
            )}

            <form onSubmit={handleSaveSubscription} className="space-y-4">
              {/* Select Company (if not modifying existing) */}
              {!selectedSub && (
                <div>
                  <label className="block text-xs font-semibold text-foreground mb-1">
                    Target Organization
                  </label>
                  <select
                    value={formData.companyId}
                    onChange={(e) => setFormData({ ...formData, companyId: e.target.value })}
                    required
                    className="w-full px-3 py-2 rounded-lg bg-background border border-border text-xs text-foreground focus:outline-none focus:border-primary"
                  >
                    <option value="" disabled>
                      Select an organization...
                    </option>
                    {companies.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.name} ({c.email})
                      </option>
                    ))}
                  </select>
                </div>
              )}

              {/* Select Plan */}
              <div>
                <label className="block text-xs font-semibold text-foreground mb-1">
                  Subscription Plan Tier
                </label>
                <select
                  value={formData.planId}
                  onChange={(e) => setFormData({ ...formData, planId: e.target.value })}
                  required
                  className="w-full px-3 py-2 rounded-lg bg-background border border-border text-xs text-foreground focus:outline-none focus:border-primary"
                >
                  {plans.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.name} ({p.code}) — ₹{p.monthlyPrice}/mo (Max {p.maxEmployees} employees)
                    </option>
                  ))}
                </select>
              </div>

              {/* Grid 2: Billing Cycle & Status */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-foreground mb-1">
                    Billing Cycle
                  </label>
                  <select
                    value={formData.billingCycle}
                    onChange={(e) => setFormData({ ...formData, billingCycle: e.target.value })}
                    className="w-full px-3 py-2 rounded-lg bg-background border border-border text-xs text-foreground focus:outline-none focus:border-primary"
                  >
                    <option value="MONTHLY">Monthly</option>
                    <option value="ANNUAL">Annual</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-foreground mb-1">
                    Subscription Status
                  </label>
                  <select
                    value={formData.status}
                    onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                    className="w-full px-3 py-2 rounded-lg bg-background border border-border text-xs text-foreground focus:outline-none focus:border-primary"
                  >
                    <option value="ACTIVE">Active (Paid)</option>
                    <option value="TRIAL">Trial</option>
                    <option value="PAST_DUE">Past Due</option>
                    <option value="CANCELLED">Cancelled</option>
                  </select>
                </div>
              </div>

              {/* Extension Days */}
              <div>
                <label className="block text-xs font-semibold text-foreground mb-1">
                  Validity Period / Extension (Days from today)
                </label>
                <input
                  type="number"
                  min="1"
                  max="730"
                  value={formData.extensionDays}
                  onChange={(e) => setFormData({ ...formData, extensionDays: Number(e.target.value) })}
                  required
                  className="w-full px-3 py-2 rounded-lg bg-background border border-border text-xs text-foreground focus:outline-none focus:border-primary"
                />
              </div>

              {/* Reason / Notes */}
              <div>
                <label className="block text-xs font-semibold text-foreground mb-1">
                  Administrative Reason / Note (Audited)
                </label>
                <textarea
                  rows={2}
                  placeholder="e.g. Sales enterprise pilot agreement or manual offline payment received"
                  value={formData.reason}
                  onChange={(e) => setFormData({ ...formData, reason: e.target.value })}
                  className="w-full px-3 py-2 rounded-lg bg-background border border-border text-xs text-foreground focus:outline-none focus:border-primary resize-none"
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
                  className="flex items-center gap-1.5 px-4 py-2 rounded-lg text-xs font-medium bg-primary hover:bg-primary/90 text-primary-foreground disabled:opacity-50"
                >
                  {isSubmitting ? (
                    <RefreshCw className="h-3.5 w-3.5 animate-spin" />
                  ) : (
                    <ShieldCheck className="h-3.5 w-3.5" />
                  )}
                  Confirm Subscription
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
