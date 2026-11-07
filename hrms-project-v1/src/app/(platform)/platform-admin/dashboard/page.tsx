"use client";

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import platformApi from "@/lib/platform-api";
import { usePlatformAuth } from "@/context/PlatformAuthContext";
import { MetricKpiCard } from "@/components/platform/kpi/MetricKpiCard";
import { PlatformAreaChart } from "@/components/platform/charts/PlatformAreaChart";
import { PlatformBarChart } from "@/components/platform/charts/PlatformBarChart";
import {
  Building2,
  Users,
  DollarSign,
  Repeat,
  ShieldCheck,
  ArrowUpRight,
  Sparkles,
  Clock,
  Ban,
  LifeBuoy,
  RefreshCw,
  Loader2,
  ExternalLink,
  Receipt,
  Layers,
  ArrowRight,
  Activity,
  CheckCircle2,
} from "lucide-react";

export default function PlatformDashboardPage() {
  const { user } = usePlatformAuth();
  const [period, setPeriod] = useState<"7d" | "30d" | "90d" | "12m">("30d");
  const [data, setData] = useState<any | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isRecalculating, setIsRecalculating] = useState(false);
  const [recalcSuccess, setRecalcSuccess] = useState(false);

  const fetchOverview = useCallback(async () => {
    setIsLoading(true);
    try {
      const res = await platformApi.get("/platform/dashboard/overview", {
        params: { period },
      });
      setData(res.data);
    } catch (err) {
      console.error("Failed to load dashboard metrics", err);
    } finally {
      setIsLoading(false);
    }
  }, [period]);

  useEffect(() => {
    fetchOverview();
  }, [fetchOverview]);

  const handleRecalculateSnapshot = async () => {
    setIsRecalculating(true);
    setRecalcSuccess(false);
    try {
      await platformApi.post("/platform/dashboard/recalculate-snapshots");
      setRecalcSuccess(true);
      setTimeout(() => setRecalcSuccess(false), 4000);
      await fetchOverview();
    } catch (err: any) {
      alert(err.response?.data?.message || "Failed to recalculate snapshot");
    } finally {
      setIsRecalculating(false);
    }
  };

  if (isLoading && !data) {
    return (
      <div className="py-24 text-center">
        <Loader2 className="size-8 animate-spin mx-auto text-primary mb-2" />
        <p className="text-xs text-muted-foreground">Loading live SaaS analytics & historical snapshots...</p>
      </div>
    );
  }

  const metrics = data?.metrics || {};
  const charts = data?.charts || {};
  const tables = data?.tables || {};

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      {/* Page Title & Controls */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-border">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold tracking-tight text-foreground">
              Platform Executive Dashboard
            </h1>
            <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-status-green/15 text-status-green border border-status-green/25">
              Real-Time Cached
            </span>
          </div>
          <p className="text-xs text-muted-foreground mt-1">
            Aggregated multi-tenant operations, recurring revenue, and system-wide telemetry.
          </p>
        </div>

        {/* Filter Controls */}
        <div className="flex items-center gap-3">
          {/* Period Selector */}
          <div className="flex items-center gap-1 p-1 bg-card border border-border rounded-xl text-xs shadow-xs">
            {(["7d", "30d", "90d", "12m"] as const).map((p) => (
              <button
                key={p}
                onClick={() => setPeriod(p)}
                className={`px-3 py-1 rounded-lg font-semibold uppercase transition-all ${
                  period === p
                    ? "bg-primary/20 text-foreground border border-primary/30"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                {p}
              </button>
            ))}
          </div>

          {/* Recalculate Snapshot Button (Super Admin) */}
          <button
            onClick={handleRecalculateSnapshot}
            disabled={isRecalculating}
            title="Idempotently re-aggregate today's metrics and bust memory cache"
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-card hover:bg-muted border border-border text-foreground text-xs font-semibold transition-colors disabled:opacity-50 shadow-xs cursor-pointer"
          >
            {isRecalculating ? (
              <Loader2 className="h-3.5 w-3.5 animate-spin text-primary" />
            ) : recalcSuccess ? (
              <CheckCircle2 className="h-3.5 w-3.5 text-status-green" />
            ) : (
              <RefreshCw className="h-3.5 w-3.5 text-muted-foreground" />
            )}
            <span>{recalcSuccess ? "Recalculated!" : "Recalculate"}</span>
          </button>
        </div>
      </div>

      {/* Primary KPI Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Organizations */}
        <MetricKpiCard
          label="Total Organizations"
          value={metrics.totalOrganizations?.value || 0}
          subValue={`${metrics.totalOrganizations?.active || 0} Active · ${metrics.totalOrganizations?.pending || 0} Pending`}
          growthPercent={metrics.totalOrganizations?.growthPercent}
          icon={Building2}
          accentColor="indigo"
        />

        {/* Total Employees */}
        <MetricKpiCard
          label="Active Employees"
          value={(metrics.totalEmployees?.active || 0).toLocaleString()}
          subValue={`${(metrics.totalEmployees?.value || 0).toLocaleString()} Total Across Tenants`}
          icon={Users}
          accentColor="sky"
        />

        {/* Monthly Recurring Revenue */}
        <MetricKpiCard
          label="Monthly Recurring Revenue"
          value={`₹${(metrics.mrr?.current || 0).toLocaleString()}`}
          subValue={`ARR: ₹${(metrics.arr?.current || 0).toLocaleString()}`}
          growthPercent={metrics.mrr?.growthPercent}
          growthLabel="growth vs prev period"
          icon={DollarSign}
          accentColor="emerald"
        />

        {/* Active Subscriptions */}
        <MetricKpiCard
          label="Active Subscriptions"
          value={metrics.subscriptions?.active || 0}
          subValue={`${metrics.subscriptions?.trial || 0} Trials · ${metrics.subscriptions?.expiringSoon || 0} Expiring Soon`}
          icon={Repeat}
          accentColor="teal"
        />
      </div>

      {/* Secondary Operational Quick-Strip */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <Link
          href="/platform-admin/organizations/approvals"
          className="p-3.5 rounded-xl bg-card border border-border hover:border-primary/40 transition-colors flex items-center justify-between group shadow-xs"
        >
          <div className="flex items-center gap-2.5">
            <div className="h-7 w-7 rounded-lg bg-status-orange/15 text-status-orange flex items-center justify-center">
              <Clock className="h-4 w-4" />
            </div>
            <div>
              <div className="text-xs font-semibold text-foreground group-hover:text-primary transition-colors">
                Pending Approvals
              </div>
              <p className="text-[10px] text-muted-foreground font-mono">
                {metrics.totalOrganizations?.pending || 0} organizations
              </p>
            </div>
          </div>
          <ArrowRight className="h-3.5 w-3.5 text-muted-foreground group-hover:text-primary transition-colors" />
        </Link>

        <Link
          href="/platform-admin/organizations?status=SUSPENDED"
          className="p-3.5 rounded-xl bg-card border border-border hover:border-destructive/40 transition-colors flex items-center justify-between group shadow-xs"
        >
          <div className="flex items-center gap-2.5">
            <div className="h-7 w-7 rounded-lg bg-destructive/15 text-destructive flex items-center justify-center">
              <Ban className="h-4 w-4" />
            </div>
            <div>
              <div className="text-xs font-semibold text-foreground group-hover:text-destructive transition-colors">
                Suspended Tenants
              </div>
              <p className="text-[10px] text-muted-foreground font-mono">
                {metrics.totalOrganizations?.suspended || 0} accounts
              </p>
            </div>
          </div>
          <ArrowRight className="h-3.5 w-3.5 text-muted-foreground group-hover:text-destructive transition-colors" />
        </Link>

        <Link
          href="/platform-admin/support"
          className="p-3.5 rounded-xl bg-card border border-border hover:border-primary/40 transition-colors flex items-center justify-between group shadow-xs"
        >
          <div className="flex items-center gap-2.5">
            <div className="h-7 w-7 rounded-lg bg-primary/15 text-foreground flex items-center justify-center">
              <LifeBuoy className="h-4 w-4" />
            </div>
            <div>
              <div className="text-xs font-semibold text-foreground group-hover:text-primary transition-colors">
                Open Support Tickets
              </div>
              <p className="text-[10px] text-muted-foreground font-mono">
                {metrics.support?.openTickets || 0} unresolved
              </p>
            </div>
          </div>
          <ArrowRight className="h-3.5 w-3.5 text-muted-foreground group-hover:text-primary transition-colors" />
        </Link>

        <div className="p-3.5 rounded-xl bg-card border border-border flex items-center gap-2.5 shadow-xs">
          <div className="h-7 w-7 rounded-lg bg-status-green/15 text-status-green flex items-center justify-center">
            <Activity className="h-4 w-4" />
          </div>
          <div>
            <div className="text-xs font-semibold text-foreground flex items-center gap-1.5">
              <span>System Health</span>
              <span className="size-1.5 rounded-full bg-status-green animate-pulse" />
            </div>
            <p className="text-[10px] text-muted-foreground font-mono">
              {metrics.systemHealth?.apiUptimePercent || 99.98}% Uptime
            </p>
          </div>
        </div>
      </div>

      {/* Interactive Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <PlatformAreaChart
          data={charts.revenueTrend || []}
          title="Monthly Recurring Revenue Progression"
          subtitle="Normalized historical trend from DailyPlatformSnapshot cron engine"
          currencyPrefix="₹"
        />

        <PlatformBarChart
          data={charts.tenantGrowth || []}
          title="Tenant Base Expansion & Retention"
          subtitle="Registered active organizations versus subscription churn"
        />
      </div>

      {/* Plan Distribution Strip */}
      <div className="p-5 rounded-2xl bg-card border border-border space-y-3 shadow-xs">
        <div className="flex items-center justify-between">
          <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
            Subscription Plan Adoption Breakdown
          </h3>
          <Link
            href="/platform-admin/subscriptions/plans"
            className="text-[11px] text-primary hover:underline font-medium inline-flex items-center gap-1"
          >
            <span>Manage Plans</span>
            <ArrowRight className="size-3" />
          </Link>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3">
          {(charts.planDistribution || []).map((p: any) => (
            <div
              key={p.code}
              className="p-3.5 rounded-xl bg-muted/40 border border-border flex items-center justify-between"
            >
              <div>
                <span className="font-semibold text-xs text-foreground">{p.planName}</span>
                <p className="text-[10px] text-muted-foreground font-mono mt-0.5">
                  ₹{p.monthlyPrice}/mo
                </p>
              </div>
              <div className="text-right">
                <span className="text-base font-bold text-foreground">{p.subscribers}</span>
                <p className="text-[10px] text-muted-foreground">Tenants</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Operational Tables Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recently Onboarded Organizations */}
        <div className="rounded-2xl border border-border bg-card p-5 space-y-3 shadow-xs">
          <div className="flex items-center justify-between">
            <h3 className="text-xs font-semibold text-foreground uppercase tracking-wider flex items-center gap-1.5">
              <Building2 className="size-4 text-primary" />
              <span>Recently Onboarded Organizations</span>
            </h3>
            <Link
              href="/platform-admin/organizations"
              className="text-[11px] text-primary hover:underline font-medium"
            >
              View All
            </Link>
          </div>

          <div className="divide-y divide-border text-xs">
            {(tables.recentlyOnboardedOrgs || []).map((org: any) => (
              <div key={org.id} className="py-2.5 flex items-center justify-between">
                <div>
                  <Link
                    href={`/platform-admin/organizations/${org.id}`}
                    className="font-semibold text-foreground hover:text-primary transition-colors"
                  >
                    {org.name}
                  </Link>
                  <p className="text-[10px] text-muted-foreground">{org.email}</p>
                </div>
                <div className="flex items-center gap-3">
                  <span className="text-[10px] font-mono text-muted-foreground">
                    {org.employeeCount} Emps
                  </span>
                  <span
                    className={`px-2 py-0.5 rounded text-[10px] font-semibold border ${
                      org.status === "VERIFIED"
                        ? "bg-status-green/15 text-status-green border-status-green/25"
                        : "bg-status-orange/15 text-status-orange border-status-orange/25"
                    }`}
                  >
                    {org.status}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Recent Platform Activities */}
        <div className="rounded-2xl border border-border bg-card p-5 space-y-3 shadow-xs">
          <div className="flex items-center justify-between">
            <h3 className="text-xs font-semibold text-foreground uppercase tracking-wider flex items-center gap-1.5">
              <ShieldCheck className="size-4 text-status-green" />
              <span>Recent Platform Administrative Activity</span>
            </h3>
            <Link
              href="/platform-admin/monitoring/audit-logs"
              className="text-[11px] text-primary hover:underline font-medium"
            >
              Full Audit Trail
            </Link>
          </div>

          <div className="divide-y divide-border text-xs">
            {(tables.recentActivities || []).map((act: any) => (
              <div key={act.id} className="py-2.5 flex items-center justify-between">
                <div>
                  <span className="font-semibold text-foreground">{act.action}</span>
                  <span className="text-[10px] text-muted-foreground ml-2">
                    on {act.companyName}
                  </span>
                  {act.reason && (
                    <p className="text-[10px] text-muted-foreground italic mt-0.5 truncate max-w-xs">
                      {act.reason}
                    </p>
                  )}
                </div>
                <div className="text-right">
                  <span className="text-[10px] text-muted-foreground font-mono">
                    {new Date(act.createdAt).toLocaleDateString()}
                  </span>
                  <p className="text-[9px] text-muted-foreground/75">{act.actorEmail}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
