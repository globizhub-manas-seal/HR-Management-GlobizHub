"use client";

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import {
  History,
  Search,
  Filter,
  CheckCircle2,
  Clock,
  Building2,
  Sparkles,
  RefreshCw,
  SlidersHorizontal,
  ChevronRight,
  Shield,
  FileCode,
} from "lucide-react";
import { platformApi } from "@/lib/platform-api";

interface AuditLogItem {
  id: string;
  actorEmail: string;
  actorRole: string;
  action: string;
  targetEntity: string;
  targetId?: string;
  companyId?: string;
  company?: {
    id: string;
    name: string;
    email: string;
  };
  beforeState?: any;
  afterState?: any;
  reason?: string;
  createdAt: string;
}

export default function SubscriptionHistoryPage() {
  const [logs, setLogs] = useState<AuditLogItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [meta, setMeta] = useState({ total: 0, totalPages: 1, limit: 20 });
  const [selectedLog, setSelectedLog] = useState<AuditLogItem | null>(null);

  const fetchHistory = useCallback(async () => {
    setIsLoading(true);
    try {
      const params = new URLSearchParams();
      params.append("page", page.toString());
      params.append("limit", "20");

      const res = await platformApi.get<{ data: AuditLogItem[]; meta: any }>(
        `/platform/subscriptions/history?${params.toString()}`
      );
      setLogs(res.data?.data || []);
      setMeta(res.data?.meta || { total: 0, totalPages: 1, limit: 20 });
    } catch (err: any) {
      console.error("Failed to load subscription history", err);
    } finally {
      setIsLoading(false);
    }
  }, [page]);

  useEffect(() => {
    fetchHistory();
  }, [fetchHistory]);

  const formatAction = (action: string) => {
    switch (action) {
      case "SUBSCRIPTION_CHANGE":
        return { label: "Subscription Assigned", color: "bg-primary/15 text-primary border-primary/25" };
      case "PLAN_CREATE":
        return { label: "Plan Created", color: "bg-status-green/15 text-status-green border-status-green/25" };
      case "PLAN_UPDATE":
        return { label: "Plan Updated", color: "bg-indigo-500/10 text-indigo-400 border-indigo-500/20" };
      case "PLAN_ENTITLEMENT_UPDATE":
        return { label: "Entitlements Configured", color: "bg-purple-500/10 text-purple-400 border-purple-500/20" };
      case "FEATURE_OVERRIDE_SET":
        return { label: "Feature Override", color: "bg-status-orange/15 text-status-orange border-status-orange/25" };
      default:
        return { label: action, color: "bg-muted text-foreground border-border" };
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold tracking-tight text-foreground">Subscription Lifecycle History</h1>
            <span className="text-xs font-mono font-medium px-2 py-0.5 rounded-full bg-primary/15 text-primary border border-primary/25">
              {meta.total} Event{meta.total !== 1 ? "s" : ""}
            </span>
          </div>
          <p className="text-sm text-muted-foreground mt-1">
            Immutable audit record of all plan assignments, renewals, tier updates, and module entitlement changes.
          </p>
        </div>

        <button
          onClick={() => fetchHistory()}
          className="flex items-center gap-2 px-3.5 py-2 text-xs font-medium text-foreground bg-card border border-border hover:bg-muted rounded-lg transition-colors"
        >
          <RefreshCw className="h-3.5 w-3.5" />
          Refresh Audit Trail
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Table / Timeline List */}
        <div className="lg:col-span-2 rounded-xl border border-border bg-card overflow-hidden shadow-xl">
          <div className="p-4 border-b border-border bg-muted/40 flex items-center justify-between">
            <h3 className="text-xs font-bold uppercase tracking-wider text-foreground">Audit Events</h3>
            <span className="text-[11px] text-muted-foreground">Sorted by newest first</span>
          </div>

          <div className="divide-y divide-border">
            {isLoading ? (
              <div className="py-16 text-center text-muted-foreground text-xs">
                <RefreshCw className="h-6 w-6 animate-spin mx-auto mb-2 text-primary" />
                Loading lifecycle records...
              </div>
            ) : logs.length === 0 ? (
              <div className="py-16 text-center text-muted-foreground text-xs">
                No subscription lifecycle history recorded yet.
              </div>
            ) : (
              logs.map((log) => {
                const actionMeta = formatAction(log.action);
                const isSelected = selectedLog?.id === log.id;

                return (
                  <div
                    key={log.id}
                    onClick={() => setSelectedLog(log)}
                    className={`p-4 cursor-pointer transition-colors flex items-center justify-between gap-4 ${
                      isSelected ? "bg-muted/60 border-l-4 border-sky-500" : "hover:bg-muted/30"
                    }`}
                  >
                    <div className="space-y-1.5 flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span
                          className={`px-2 py-0.5 rounded text-[10px] font-semibold uppercase tracking-wider border ${actionMeta.color}`}
                        >
                          {actionMeta.label}
                        </span>
                        <span className="text-[11px] text-muted-foreground font-mono">
                          {new Date(log.createdAt).toLocaleString()}
                        </span>
                      </div>

                      <div className="flex items-center gap-2 text-xs">
                        <span className="text-foreground">
                          by <strong className="text-foreground">{log.actorEmail}</strong>
                        </span>
                        <span className="text-muted-foreground">({log.actorRole})</span>
                        {log.company && (
                          <>
                            <span className="text-muted-foreground">•</span>
                            <span className="text-foreground font-medium">
                              Organization: {log.company.name}
                            </span>
                          </>
                        )}
                      </div>

                      {log.reason && (
                        <p className="text-[11px] text-muted-foreground italic truncate">
                          "{log.reason}"
                        </p>
                      )}
                    </div>

                    <ChevronRight className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                  </div>
                );
              })
            )}
          </div>

          {/* Pagination */}
          <div className="p-3 border-t border-border bg-muted/40 flex items-center justify-between text-xs text-muted-foreground">
            <span>
              Page {page} of {meta.totalPages || 1}
            </span>
            <div className="flex gap-2">
              <button
                disabled={page <= 1}
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                className="px-2.5 py-1 rounded bg-card border border-border disabled:opacity-40 hover:bg-muted"
              >
                Prev
              </button>
              <button
                disabled={page >= meta.totalPages}
                onClick={() => setPage((p) => p + 1)}
                className="px-2.5 py-1 rounded bg-card border border-border disabled:opacity-40 hover:bg-muted"
              >
                Next
              </button>
            </div>
          </div>
        </div>

        {/* Payload / Diff Inspector */}
        <div className="rounded-xl border border-border bg-card p-5 space-y-4">
          <div className="flex items-center gap-2">
            <FileCode className="h-4 w-4 text-primary" />
            <h3 className="text-xs font-bold uppercase tracking-wider text-foreground">
              State Payload Inspector
            </h3>
          </div>

          {selectedLog ? (
            <div className="space-y-4 text-xs">
              <div>
                <span className="text-muted-foreground block text-[10px] uppercase font-mono">Event ID</span>
                <span className="font-mono text-foreground text-[11px]">{selectedLog.id}</span>
              </div>

              <div>
                <span className="text-muted-foreground block text-[10px] uppercase font-mono">Target Entity</span>
                <span className="text-foreground font-semibold">{selectedLog.targetEntity}</span>
                {selectedLog.targetId && (
                  <span className="text-muted-foreground font-mono text-[11px] ml-1.5">
                    ({selectedLog.targetId})
                  </span>
                )}
              </div>

              {selectedLog.company && (
                <div>
                  <span className="text-muted-foreground block text-[10px] uppercase font-mono">Target Tenant</span>
                  <Link
                    href={`/platform-admin/organizations/${selectedLog.company.id}`}
                    className="text-foreground hover:text-primary transition-colors font-medium underline"
                  >
                    {selectedLog.company.name} ({selectedLog.company.email})
                  </Link>
                </div>
              )}

              {selectedLog.reason && (
                <div>
                  <span className="text-muted-foreground block text-[10px] uppercase font-mono">Recorded Reason</span>
                  <div className="p-2.5 rounded-lg bg-background border border-border text-foreground italic">
                    {selectedLog.reason}
                  </div>
                </div>
              )}

              <div>
                <span className="text-muted-foreground block text-[10px] uppercase font-mono mb-1">State Data (JSON)</span>
                <pre className="p-3 rounded-lg bg-background border border-border font-mono text-[11px] text-foreground overflow-x-auto max-h-80">
                  {JSON.stringify(selectedLog.afterState || selectedLog.beforeState || {}, null, 2)}
                </pre>
              </div>
            </div>
          ) : (
            <div className="py-12 text-center text-muted-foreground text-xs">
              Select an audit event on the left to inspect its state changes and metadata.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
