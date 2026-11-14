"use client";

import { useEffect, useState, useCallback } from "react";
import {
  BarChart3,
  TrendingUp,
  TrendingDown,
  Calendar,
  Sparkles,
  RefreshCw,
  Building2,
  Users,
  Repeat,
  DollarSign,
  ArrowUpRight,
} from "lucide-react";
import { platformApi } from "@/lib/platform-api";
import { PlatformAreaChart } from "@/components/platform/charts/PlatformAreaChart";
import { PlatformBarChart } from "@/components/platform/charts/PlatformBarChart";

interface SnapshotItem {
  id: string;
  snapshotDate: string;
  totalOrganizations: number;
  activeOrganizations: number;
  totalEmployees: number;
  activeSubscriptions: number;
  mrr: number;
  arr: number;
  netRevenue: number;
}

export default function PlatformAnalyticsPage() {
  const [snapshots, setSnapshots] = useState<SnapshotItem[]>([]);
  const [plans, setPlans] = useState<any[]>([]);
  const [metrics, setMetrics] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isRecalculating, setIsRecalculating] = useState(false);

  const loadData = useCallback(async () => {
    setIsLoading(true);
    try {
      const res = await platformApi.get<any>("/platform/dashboard/overview");
      setSnapshots(res.data?.snapshots || []);
      setPlans(res.data?.distribution?.byPlan || []);
      setMetrics(res.data?.metrics || null);
    } catch (e) {
      console.error("Failed to load platform analytics", e);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handleRecalculate = async () => {
    setIsRecalculating(true);
    try {
      await platformApi.post("/platform/dashboard/recalculate-snapshots", {});
      alert("Nightly snapshots recalculated successfully!");
      loadData();
    } catch (e: any) {
      alert("Failed to recalculate: " + (e.response?.data?.message || e.message));
    } finally {
      setIsRecalculating(false);
    }
  };

  const revenueChartData = snapshots.map((s) => ({
    date: new Date(s.snapshotDate).toLocaleDateString(undefined, { month: "short", day: "numeric" }),
    mrr: Number(s.mrr || 0),
  }));

  const orgGrowthData = snapshots.map((s) => ({
    date: new Date(s.snapshotDate).toLocaleDateString(undefined, { month: "short", day: "numeric" }),
    totalOrgs: s.activeOrganizations || 0,
    activeOrgs: s.activeOrganizations || 0,
  }));

  const latestSnapshot = snapshots[snapshots.length - 1];
  const previousSnapshot = snapshots[0];
  const mrrGrowth =
    metrics?.mrr?.growthPercent ??
    (previousSnapshot && Number(previousSnapshot.mrr) > 0
      ? Math.round(
          ((Number(latestSnapshot?.mrr || 0) - Number(previousSnapshot.mrr)) /
            Number(previousSnapshot.mrr)) *
            100
        )
      : 0);

  const displayMrr = Number(latestSnapshot?.mrr ?? metrics?.mrr?.current ?? 0);
  const displayArr = Number(latestSnapshot?.arr ?? metrics?.arr?.current ?? (displayMrr * 12));
  const displayPayingSubs = latestSnapshot?.activeSubscriptions ?? metrics?.subscriptions?.active ?? 0;
  const displayActiveOrgs = latestSnapshot?.activeOrganizations ?? metrics?.totalOrganizations?.active ?? 0;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-4 border-b border-border">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold tracking-tight text-foreground">Platform SaaS Analytics</h1>
            <span className="text-xs font-mono font-medium px-2 py-0.5 rounded-full bg-status-green/15 text-status-green border border-status-green/25">
              Historical 30-Day Snapshots
            </span>
          </div>
          <p className="text-xs text-muted-foreground mt-1">
            Historical time-series intelligence, ARR/MRR trends, customer cohort expansion, and seat growth analytics.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            onClick={() => loadData()}
            className="flex items-center gap-2 px-3.5 py-2 text-xs font-medium text-foreground bg-card border border-border hover:bg-muted rounded-xl transition-colors cursor-pointer shadow-xs"
          >
            <RefreshCw className="size-3.5" />
            Refresh
          </button>
          <button
            onClick={handleRecalculate}
            disabled={isRecalculating}
            className="flex items-center gap-2 px-4 py-2 text-xs font-semibold text-primary-foreground bg-primary hover:bg-primary/90 rounded-xl transition-colors shadow-xs disabled:opacity-50 cursor-pointer"
          >
            <Sparkles className="size-4" />
            {isRecalculating ? "Recalculating..." : "Recalculate Snapshots"}
          </button>
        </div>
      </div>

      {/* Highlights */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="rounded-2xl border border-border bg-card p-5 shadow-xs">
          <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground block mb-1">
            Current MRR (Run-Rate)
          </span>
          <div className="text-3xl font-bold font-mono text-foreground">
            ₹{displayMrr.toLocaleString()}
          </div>
          <div className="flex items-center gap-1.5 mt-2 text-xs font-medium text-status-green">
            <TrendingUp className="size-3.5" />
            +{mrrGrowth}% growth over 30-day baseline
          </div>
        </div>

        <div className="rounded-2xl border border-border bg-card p-5 shadow-xs">
          <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground block mb-1">
            Annual Recurring Revenue (ARR)
          </span>
          <div className="text-3xl font-bold font-mono text-foreground">
            ₹{displayArr.toLocaleString()}
          </div>
          <span className="text-xs text-muted-foreground mt-2 block font-mono">12x annualized monthly revenue</span>
        </div>

        <div className="rounded-2xl border border-border bg-card p-5 shadow-xs">
          <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground block mb-1">
            Paying Tenant Base
          </span>
          <div className="text-3xl font-bold font-mono text-foreground">
            {displayPayingSubs}
          </div>
          <span className="text-xs text-primary font-semibold mt-2 block">
            Across {displayActiveOrgs} verified organizations
          </span>
        </div>
      </div>

      {/* Visual Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <PlatformAreaChart
          data={revenueChartData}
          title="Monthly Recurring Revenue (MRR) Trend"
          subtitle="30-day historical snapshot curve"
          currencyPrefix="₹"
          height={240}
        />
        <PlatformBarChart
          data={orgGrowthData}
          title="Active Organizations Growth"
          subtitle="Tenant adoption velocity"
          height={240}
        />
      </div>

      {/* Plan Distribution Breakdown */}
      <div className="rounded-2xl border border-border bg-card p-6 shadow-xs">
        <h3 className="text-sm font-bold text-foreground mb-4">Subscription Plan Tiers Adoption</h3>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          {plans.map((p, idx) => (
            <div key={idx} className="p-4 rounded-xl bg-muted/40 border border-border">
              <span className="text-xs text-muted-foreground block mb-1">{p.planName}</span>
              <div className="text-2xl font-bold font-mono text-foreground">{p.count}</div>
              <span className="text-[10px] text-primary font-mono font-semibold mt-1 block">
                {p.percentage}% of all subscribers
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
