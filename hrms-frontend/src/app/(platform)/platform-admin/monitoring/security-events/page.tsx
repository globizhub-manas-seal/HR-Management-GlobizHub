"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import {
  ShieldAlert,
  ShieldCheck,
  Lock,
  Terminal,
  RefreshCw,
  Loader2,
  CreditCard,
} from "lucide-react";
import { platformApi } from "@/lib/platform-api";

interface SecurityEvent {
  id: string;
  timestamp: string;
  severity: "HIGH" | "MEDIUM" | "LOW";
  action: string;
  actorEmail: string;
  actorRole: string;
  companyName: string | null;
  targetEntity: string | null;
  targetId: string | null;
  ipAddress: string | null;
  details: any;
}

interface SecurityEventsResponse {
  data: SecurityEvent[];
  meta: { page: number; totalPages: number; total: number };
  summary: {
    failedPayments: number;
    suspendedOrgs: number;
    activePlatformUsers: number;
  };
}

export default function SecurityEventsPage() {
  const [response, setResponse] = useState<SecurityEventsResponse | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [page, setPage] = useState(1);

  const fetchEvents = useCallback(async () => {
    setIsLoading(true);
    try {
      const res = await platformApi.get("/platform/security-events", {
        params: { page, limit: 25 },
      });
      setResponse(res.data);
    } catch (err) {
      console.error("Failed to load security events", err);
    } finally {
      setIsLoading(false);
    }
  }, [page]);

  useEffect(() => {
    fetchEvents();
  }, [fetchEvents]);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 flex-wrap">
            <h1 className="text-2xl font-bold tracking-tight text-foreground">Security Events</h1>
            <span className="text-xs font-mono font-medium px-2 py-0.5 rounded-full bg-status-green/15 text-status-green border border-status-green/25">
              Live Audit Stream
            </span>
          </div>
          <p className="text-sm text-muted-foreground mt-1">
            Security-relevant platform activity from the audit trail: logins, staff changes,
            organization status changes, payment settlements and support sessions.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={fetchEvents}
            className="flex items-center gap-2 px-3.5 py-2 text-xs font-medium text-foreground bg-card border border-border hover:bg-muted rounded-lg transition-colors"
          >
            <RefreshCw className={`h-3.5 w-3.5 ${isLoading ? "animate-spin" : ""}`} />
            Refresh
          </button>
          <Link
            href="/platform-admin/monitoring/audit-logs"
            className="flex items-center gap-2 px-3.5 py-2 text-xs font-medium text-foreground bg-card border border-border hover:bg-muted rounded-lg transition-colors"
          >
            <Terminal className="h-3.5 w-3.5" />
            Full Audit Trail
          </Link>
        </div>
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="rounded-xl border border-border bg-card p-4">
          <span className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground block mb-1">
            Active Platform Users
          </span>
          <div className="text-xl font-bold font-mono text-primary flex items-center gap-2">
            <Lock className="h-5 w-5" /> {response?.summary.activePlatformUsers ?? "—"}
          </div>
          <span className="text-[11px] text-muted-foreground mt-1 block">Platform staff accounts active</span>
        </div>

        <div className="rounded-xl border border-border bg-card p-4">
          <span className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground block mb-1">
            Suspended Organizations
          </span>
          <div className="text-xl font-bold font-mono text-foreground">
            {response?.summary.suspendedOrgs ?? "—"}
          </div>
          <span className="text-[11px] text-muted-foreground mt-1 block">
            Blocked from all workspace access
          </span>
        </div>

        <div className="rounded-xl border border-border bg-card p-4">
          <span className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground block mb-1">
            Failed Payments
          </span>
          <div className="text-xl font-bold font-mono text-status-yellow flex items-center gap-2">
            <CreditCard className="h-5 w-5" /> {response?.summary.failedPayments ?? "—"}
          </div>
          <span className="text-[11px] text-muted-foreground mt-1 block">
            Tracked in the dunning queue
          </span>
        </div>
      </div>

      {/* Events Table */}
      <div className="rounded-xl border border-border bg-card overflow-hidden shadow-xl">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs min-w-[720px]">
            <thead className="bg-muted/50 border-b border-border text-muted-foreground uppercase tracking-wider font-semibold">
              <tr>
                <th className="py-3.5 px-4">Event</th>
                <th className="py-3.5 px-4">Severity</th>
                <th className="py-3.5 px-4">Organization</th>
                <th className="py-3.5 px-4">Actor</th>
                <th className="py-3.5 px-4 text-right">Time</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {isLoading ? (
                <tr>
                  <td colSpan={5} className="py-12 text-center">
                    <Loader2 className="h-6 w-6 animate-spin text-muted-foreground mx-auto" />
                  </td>
                </tr>
              ) : (response?.data?.length ?? 0) === 0 ? (
                <tr>
                  <td colSpan={5} className="py-12 text-center text-muted-foreground">
                    <ShieldCheck className="h-8 w-8 mx-auto mb-2 opacity-40" />
                    No security events recorded yet.
                  </td>
                </tr>
              ) : (
                response!.data.map((e) => (
                  <tr key={e.id} className="hover:bg-muted/30 transition-colors">
                    <td className="py-3.5 px-4">
                      <span className="font-mono font-semibold text-foreground">{e.action}</span>
                      {e.targetEntity && (
                        <span className="block text-[10px] text-muted-foreground mt-0.5">
                          {e.targetEntity}
                          {e.targetId ? ` · ${e.targetId.slice(0, 8)}` : ""}
                        </span>
                      )}
                    </td>
                    <td className="py-3.5 px-4">
                      <span
                        className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-semibold uppercase ${
                          e.severity === "HIGH"
                            ? "bg-status-orange/15 text-status-orange border border-status-orange/25"
                            : "bg-primary/15 text-primary border border-primary/25"
                        }`}
                      >
                        {e.severity === "HIGH" && <ShieldAlert className="h-3 w-3" />}
                        {e.severity}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 text-foreground">{e.companyName || "Platform"}</td>
                    <td className="py-3.5 px-4">
                      <span className="font-mono text-muted-foreground block">{e.actorEmail}</span>
                      <span className="text-[10px] text-muted-foreground">{e.actorRole}</span>
                    </td>
                    <td className="py-3.5 px-4 text-right text-muted-foreground font-mono whitespace-nowrap">
                      {new Date(e.timestamp).toLocaleString()}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
        {response && response.meta.totalPages > 1 && (
          <div className="border-t border-border px-4 py-3 flex items-center justify-between text-xs text-muted-foreground">
            <span>
              Page {response.meta.page} of {response.meta.totalPages} · {response.meta.total} events
            </span>
            <div className="flex gap-2">
              <button
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={response.meta.page <= 1}
                className="px-3 py-1.5 rounded-lg border border-border hover:bg-muted disabled:opacity-40"
              >
                Previous
              </button>
              <button
                onClick={() => setPage((p) => Math.min(response.meta.totalPages, p + 1))}
                disabled={response.meta.page >= response.meta.totalPages}
                className="px-3 py-1.5 rounded-lg border border-border hover:bg-muted disabled:opacity-40"
              >
                Next
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
