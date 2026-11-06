"use client";

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import {
  ScrollText,
  Search,
  Filter,
  RefreshCw,
  ChevronRight,
  FileCode,
  ShieldAlert,
  User,
  Building2,
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
  ipAddress?: string;
  userAgent?: string;
  createdAt: string;
}

export default function AuditTrailPage() {
  const [logs, setLogs] = useState<AuditLogItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [actionFilter, setActionFilter] = useState("ALL");
  const [page, setPage] = useState(1);
  const [meta, setMeta] = useState({ total: 0, totalPages: 1, limit: 20 });
  const [selectedLog, setSelectedLog] = useState<AuditLogItem | null>(null);

  const fetchLogs = useCallback(async () => {
    setIsLoading(true);
    try {
      const params = new URLSearchParams();
      if (search) params.append("search", search);
      if (actionFilter !== "ALL") params.append("action", actionFilter);
      params.append("page", page.toString());
      params.append("limit", "20");

      const res = await platformApi.get<{ data: AuditLogItem[]; meta: any }>(
        `/platform/audit?${params.toString()}`
      );
      const list = res.data?.data || [];
      setLogs(list);
      setMeta(res.data?.meta || { total: 0, totalPages: 1, limit: 20 });
      if (list[0] && !selectedLog) {
        setSelectedLog(list[0]);
      }
    } catch (err: any) {
      console.error("Failed to load audit logs", err);
    } finally {
      setIsLoading(false);
    }
  }, [search, actionFilter, page, selectedLog]);

  useEffect(() => {
    fetchLogs();
  }, [fetchLogs]);

  const getActionColor = (action: string) => {
    if (action.includes("SUSPEND") || action.includes("REVOKE") || action.includes("DELETE")) {
      return "bg-destructive/15 text-destructive border-destructive/25";
    }
    if (action.includes("ACTIVATE") || action.includes("CREATE") || action.includes("VERIFY")) {
      return "bg-status-green/15 text-status-green border-status-green/25";
    }
    if (action.includes("DIAGNOSTIC") || action.includes("ACCESS")) {
      return "bg-status-orange/15 text-status-orange border-status-orange/25";
    }
    return "bg-primary/15 text-primary border-primary/25";
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold tracking-tight text-foreground">Platform Audit Trail</h1>
            <span className="text-xs font-mono font-medium px-2 py-0.5 rounded-full bg-primary/15 text-primary border border-primary/25">
              {meta.total} Immutable Records
            </span>
          </div>
          <p className="text-sm text-muted-foreground mt-1">
            Tamper-evident system log tracking all privileged SaaS administrative actions and state mutations.
          </p>
        </div>

        <button
          onClick={() => fetchLogs()}
          className="flex items-center gap-2 px-3.5 py-2 text-xs font-medium text-foreground bg-card border border-border hover:bg-muted rounded-lg transition-colors"
        >
          <RefreshCw className="h-3.5 w-3.5" />
          Refresh Log
        </button>
      </div>

      {/* Filter Bar */}
      <div className="p-4 rounded-xl bg-card border border-border flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <input
            type="text"
            placeholder="Search by action, email, entity or reason..."
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
            value={actionFilter}
            onChange={(e) => {
              setActionFilter(e.target.value);
              setPage(1);
            }}
            className="px-3 py-2 rounded-lg bg-background border border-border text-xs font-medium text-foreground focus:outline-none focus:border-primary"
          >
            <option value="ALL">All Event Actions</option>
            <option value="ORG_STATUS_UPDATE">Organization Status Changes</option>
            <option value="ORG_ONBOARD">Organization Onboardings</option>
            <option value="DIAGNOSTIC_ACCESS_CREATED">Diagnostic Access Sessions</option>
            <option value="SUBSCRIPTION_CHANGE">Subscription Transitions</option>
            <option value="PLAN_CREATE">Plan Creations</option>
            <option value="PLAN_UPDATE">Plan Updates</option>
            <option value="INVOICE_CREATE">Invoice Generations</option>
            <option value="PAYMENT_RECORD">Payment Records</option>
            <option value="PLATFORM_USER_CREATE">Platform User Provisioning</option>
          </select>
        </div>
      </div>

      {/* 2-Column Split: Log Stream & Deep Inspector */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Stream */}
        <div className="lg:col-span-7 rounded-xl border border-border bg-card overflow-hidden shadow-xl">
          <div className="divide-y divide-border">
            {isLoading ? (
              <div className="py-16 text-center text-muted-foreground text-xs">
                <RefreshCw className="h-6 w-6 animate-spin mx-auto mb-2 text-primary" />
                Loading audit trail records...
              </div>
            ) : logs.length === 0 ? (
              <div className="py-16 text-center text-muted-foreground text-xs">
                No audit log records found matching your filter criteria.
              </div>
            ) : (
              logs.map((log) => {
                const isSelected = selectedLog?.id === log.id;
                return (
                  <div
                    key={log.id}
                    onClick={() => setSelectedLog(log)}
                    className={`p-4 cursor-pointer transition-colors flex items-center justify-between gap-4 ${
                      isSelected
                        ? "bg-muted/60 border-l-4 border-sky-500"
                        : "hover:bg-muted/30"
                    }`}
                  >
                    <div className="space-y-1.5 flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span
                          className={`px-2 py-0.5 rounded text-[10px] font-semibold uppercase tracking-wider border font-mono ${getActionColor(
                            log.action
                          )}`}
                        >
                          {log.action}
                        </span>
                        <span className="text-[11px] text-muted-foreground font-mono">
                          {new Date(log.createdAt).toLocaleString()}
                        </span>
                      </div>

                      <div className="flex items-center gap-2 text-xs">
                        <span className="text-foreground font-medium">{log.actorEmail}</span>
                        <span className="text-muted-foreground font-mono text-[10px]">
                          ({log.actorRole})
                        </span>
                        {log.company && (
                          <>
                            <span className="text-muted-foreground">•</span>
                            <span className="text-foreground font-medium truncate max-w-[150px]">
                              {log.company.name}
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

        {/* Deep State Inspector */}
        <div className="lg:col-span-5 rounded-xl border border-border bg-card p-5 space-y-4 shadow-xl">
          <div className="flex items-center gap-2 pb-3 border-b border-border">
            <FileCode className="h-4 w-4 text-primary" />
            <h3 className="text-xs font-bold uppercase tracking-wider text-foreground">
              Audit Event Payload Inspector
            </h3>
          </div>

          {selectedLog ? (
            <div className="space-y-4 text-xs">
              <div>
                <span className="text-muted-foreground block text-[10px] uppercase font-mono">
                  Event ID & Timestamp
                </span>
                <span className="font-mono text-foreground text-[11px] block">{selectedLog.id}</span>
                <span className="text-muted-foreground text-[11px]">
                  {new Date(selectedLog.createdAt).toISOString()}
                </span>
              </div>

              <div>
                <span className="text-muted-foreground block text-[10px] uppercase font-mono">
                  Actor & IP Address
                </span>
                <div className="font-medium text-foreground">{selectedLog.actorEmail}</div>
                <div className="text-muted-foreground text-[11px] font-mono">
                  Role: {selectedLog.actorRole} | IP: {selectedLog.ipAddress || "Internal"}
                </div>
              </div>

              <div>
                <span className="text-muted-foreground block text-[10px] uppercase font-mono">
                  Target Entity
                </span>
                <span className="text-foreground font-semibold">{selectedLog.targetEntity}</span>
                {selectedLog.targetId && (
                  <span className="text-muted-foreground font-mono text-[11px] ml-1.5">
                    (ID: {selectedLog.targetId})
                  </span>
                )}
              </div>

              {selectedLog.company && (
                <div>
                  <span className="text-muted-foreground block text-[10px] uppercase font-mono">
                    Affected Organization
                  </span>
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
                  <span className="text-muted-foreground block text-[10px] uppercase font-mono">
                    Mandatory Reason
                  </span>
                  <div className="p-2.5 rounded-lg bg-background border border-border text-foreground italic">
                    {selectedLog.reason}
                  </div>
                </div>
              )}

              {selectedLog.beforeState && (
                <div>
                  <span className="text-muted-foreground block text-[10px] uppercase font-mono mb-1 text-destructive">
                    State Before Mutation
                  </span>
                  <pre className="p-3 rounded-lg bg-background border border-destructive/25 font-mono text-[11px] text-destructive overflow-x-auto max-h-48">
                    {JSON.stringify(selectedLog.beforeState, null, 2)}
                  </pre>
                </div>
              )}

              <div>
                <span className="text-muted-foreground block text-[10px] uppercase font-mono mb-1 text-status-green">
                  State After Mutation
                </span>
                <pre className="p-3 rounded-lg bg-background border border-status-green/25 font-mono text-[11px] text-status-green overflow-x-auto max-h-64">
                  {JSON.stringify(selectedLog.afterState || {}, null, 2)}
                </pre>
              </div>
            </div>
          ) : (
            <div className="py-16 text-center text-muted-foreground text-xs">
              Select an audit event from the stream to inspect full mutation metadata.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
