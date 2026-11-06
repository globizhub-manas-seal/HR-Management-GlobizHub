"use client";

import { useEffect, useState, useCallback } from "react";
import {
  Activity,
  Database,
  Cpu,
  Clock,
  CheckCircle2,
  AlertCircle,
  RefreshCw,
  Building2,
  Users,
  Repeat,
  Server,
  Zap,
} from "lucide-react";
import { platformApi } from "@/lib/platform-api";

interface HealthData {
  status: string;
  timestamp: string;
  uptimeSeconds: number;
  uptimeFormatted: string;
  environment: string;
  database: {
    engine: string;
    status: string;
    latencyMs: number;
  };
  memory: {
    rssMb: number;
    heapTotalMb: number;
    heapUsedMb: number;
  };
  metrics: {
    totalTenants: number;
    activeTenants: number;
    totalEmployees: number;
    totalSubscriptions: number;
  };
}

export default function SystemHealthPage() {
  const [health, setHealth] = useState<HealthData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [lastPing, setLastPing] = useState<string>("");

  const fetchHealth = useCallback(async () => {
    setIsLoading(true);
    try {
      const res = await platformApi.get<HealthData>("/platform/health");
      setHealth(res.data);
      setLastPing(new Date().toLocaleTimeString());
    } catch (err: any) {
      console.error("Failed to check platform health", err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchHealth();
    const interval = setInterval(fetchHealth, 30000); // Poll every 30s
    return () => clearInterval(interval);
  }, [fetchHealth]);

  const memoryPercent = health
    ? Math.min(100, Math.round((health.memory.heapUsedMb / health.memory.heapTotalMb) * 100))
    : 0;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-4 border-b border-border">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold tracking-tight text-foreground">System Health & Telemetry</h1>
            <span
              className={`text-xs font-mono font-medium px-2 py-0.5 rounded-full border ${
                health?.status === "OPERATIONAL"
                  ? "bg-status-green/15 text-status-green border-status-green/25"
                  : "bg-destructive/15 text-destructive border-destructive/25"
              }`}
            >
              {health?.status || "CHECKING..."}
            </span>
          </div>
          <p className="text-xs text-muted-foreground mt-1">
            Real-time infrastructure health, Neon PostgreSQL connection pool telemetry, and memory consumption.
          </p>
        </div>

        <div className="flex items-center gap-3">
          {lastPing && (
            <span className="text-[11px] font-mono text-muted-foreground">Last check: {lastPing}</span>
          )}
          <button
            onClick={() => fetchHealth()}
            disabled={isLoading}
            className="flex items-center gap-2 px-3.5 py-2 text-xs font-medium text-foreground bg-card border border-border hover:bg-muted rounded-xl transition-colors disabled:opacity-50 cursor-pointer shadow-xs"
          >
            <RefreshCw className={`size-3.5 ${isLoading ? "animate-spin text-primary" : ""}`} />
            Ping Now
          </button>
        </div>
      </div>

      {/* Main Health Gauges */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Database Health */}
        <div className="rounded-2xl border border-border bg-card p-5 shadow-xs">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Database</span>
            <Database className="size-4 text-primary" />
          </div>
          <div className="text-2xl font-bold font-mono text-foreground flex items-center gap-2">
            {health?.database.status === "HEALTHY" ? (
              <span className="text-status-green flex items-center gap-1.5">
                <CheckCircle2 className="size-5" /> Online
              </span>
            ) : (
              <span className="text-destructive flex items-center gap-1.5">
                <AlertCircle className="size-5" /> Degraded
              </span>
            )}
          </div>
          <div className="mt-3 pt-3 border-t border-border flex items-center justify-between text-[11px] text-muted-foreground">
            <span>Ping Latency:</span>
            <span className="font-mono font-semibold text-foreground">
              {health?.database.latencyMs !== undefined ? `${health.database.latencyMs} ms` : "—"}
            </span>
          </div>
        </div>

        {/* Runtime Memory */}
        <div className="rounded-2xl border border-border bg-card p-5 shadow-xs">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Node Heap</span>
            <Cpu className="size-4 text-status-orange" />
          </div>
          <div className="text-2xl font-bold font-mono text-foreground">
            {health?.memory.heapUsedMb || 0}{" "}
            <span className="text-xs font-normal text-muted-foreground">
              / {health?.memory.heapTotalMb || 0} MB
            </span>
          </div>
          <div className="w-full h-1.5 bg-muted rounded-full mt-3 overflow-hidden">
            <div
              className={`h-full rounded-full ${
                memoryPercent > 80 ? "bg-destructive" : memoryPercent > 60 ? "bg-status-orange" : "bg-primary"
              }`}
              style={{ width: `${memoryPercent}%` }}
            />
          </div>
          <div className="mt-2 text-[10px] text-muted-foreground flex justify-between font-mono">
            <span>Utilization: {memoryPercent}%</span>
            <span>RSS: {health?.memory.rssMb || 0} MB</span>
          </div>
        </div>

        {/* Process Uptime */}
        <div className="rounded-2xl border border-border bg-card p-5 shadow-xs">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Uptime</span>
            <Clock className="size-4 text-status-green" />
          </div>
          <div className="text-2xl font-bold font-mono text-foreground">
            {health?.uptimeFormatted || "0d 0h 0m"}
          </div>
          <div className="mt-3 pt-3 border-t border-border text-[11px] text-muted-foreground flex items-center justify-between">
            <span>Environment:</span>
            <span className="font-mono text-foreground uppercase">{health?.environment}</span>
          </div>
        </div>

        {/* Live Service Engine */}
        <div className="rounded-2xl border border-border bg-card p-5 shadow-xs">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Platform Core</span>
            <Server className="size-4 text-primary" />
          </div>
          <div className="text-2xl font-bold font-mono text-foreground">NestJS v11</div>
          <div className="mt-3 pt-3 border-t border-border text-[11px] text-muted-foreground flex items-center justify-between">
            <span>Frontend:</span>
            <span className="font-mono text-foreground">Next.js 16 (App Router)</span>
          </div>
        </div>
      </div>

      {/* Database & Tenant Scale Statistics */}
      <div className="rounded-2xl border border-border bg-card p-6 shadow-xs">
        <h3 className="text-sm font-bold text-foreground mb-4 flex items-center gap-2">
          <Zap className="size-4 text-primary" />
          Multi-Tenant SaaS Workload Telemetry
        </h3>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="p-4 rounded-xl bg-muted/40 border border-border">
            <span className="text-[11px] text-muted-foreground block mb-1">Total Organizations</span>
            <div className="text-2xl font-bold font-mono text-foreground">
              {health?.metrics.totalTenants ?? "—"}
            </div>
            <span className="text-[10px] text-status-green block mt-1">
              {health?.metrics.activeTenants ?? 0} verified active
            </span>
          </div>

          <div className="p-4 rounded-xl bg-muted/40 border border-border">
            <span className="text-[11px] text-muted-foreground block mb-1">Total Employees</span>
            <div className="text-2xl font-bold font-mono text-foreground">
              {health?.metrics.totalEmployees ?? "—"}
            </div>
            <span className="text-[10px] text-muted-foreground block mt-1">Across all organizations</span>
          </div>

          <div className="p-4 rounded-xl bg-muted/40 border border-border">
            <span className="text-[11px] text-muted-foreground block mb-1">Active Subscriptions</span>
            <div className="text-2xl font-bold font-mono text-foreground">
              {health?.metrics.totalSubscriptions ?? "—"}
            </div>
            <span className="text-[10px] text-status-green block mt-1">Paying SaaS tiers</span>
          </div>

          <div className="p-4 rounded-xl bg-muted/40 border border-border">
            <span className="text-[11px] text-muted-foreground block mb-1">DB Connection Pool</span>
            <div className="text-2xl font-bold font-mono text-foreground">Active</div>
            <span className="text-[10px] text-muted-foreground block mt-1">Neon Serverless Pooler</span>
          </div>
        </div>
      </div>
    </div>
  );
}
