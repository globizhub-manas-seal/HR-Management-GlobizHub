"use client";

import { useCallback, useEffect, useState } from "react";
import {
  Terminal,
  RefreshCw,
  CheckCircle2,
  AlertTriangle,
  Loader2,
} from "lucide-react";
import { platformApi } from "@/lib/platform-api";

interface ErrorEvent {
  id: string;
  timestamp: string;
  subsystem: string;
  message: string;
  context: Record<string, any>;
}

interface ErrorLogResponse {
  data: ErrorEvent[];
  summary: {
    failedEmails: number;
    failedPayments: number;
    pastDueSubscriptions: number;
    allSystemsOperational: boolean;
  };
}

export default function ErrorLogsPage() {
  const [response, setResponse] = useState<ErrorLogResponse | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const fetchLogs = useCallback(async () => {
    setIsLoading(true);
    try {
      const res = await platformApi.get("/platform/error-logs", {
        params: { limit: 40 },
      });
      setResponse(res.data);
    } catch (err) {
      console.error("Failed to load operational logs", err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchLogs();
  }, [fetchLogs]);

  const clean = response?.summary?.allSystemsOperational;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 flex-wrap">
            <h1 className="text-2xl font-bold tracking-tight text-foreground">Operational Issues</h1>
            <span
              className={`text-xs font-mono font-medium px-2 py-0.5 rounded-full border ${
                clean
                  ? "bg-status-green/15 text-status-green border-status-green/25"
                  : "bg-status-yellow/15 text-status-yellow border-status-yellow/25"
              }`}
            >
              {clean ? "Clean Runtime" : `${(response?.summary.failedEmails || 0) + (response?.summary.failedPayments || 0)} open`}
            </span>
          </div>
          <p className="text-sm text-muted-foreground mt-1">
            Real failure signals aggregated from the platform database: failed email deliveries,
            failed payments and overdue subscriptions.
          </p>
        </div>

        <button
          onClick={fetchLogs}
          className="flex items-center gap-2 px-3.5 py-2 text-xs font-medium text-foreground bg-card border border-border hover:bg-muted rounded-lg transition-colors"
        >
          <RefreshCw className={`h-3.5 w-3.5 ${isLoading ? "animate-spin" : ""}`} />
          Refresh
        </button>
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-3 gap-4">
        <div className="rounded-xl border border-border bg-card p-4">
          <p className="text-[10px] text-muted-foreground font-medium">Failed Emails</p>
          <p className="text-xl font-black font-mono text-foreground mt-1">{response?.summary.failedEmails ?? "—"}</p>
        </div>
        <div className="rounded-xl border border-border bg-card p-4">
          <p className="text-[10px] text-muted-foreground font-medium">Failed Payments</p>
          <p className="text-xl font-black font-mono text-foreground mt-1">{response?.summary.failedPayments ?? "—"}</p>
        </div>
        <div className="rounded-xl border border-border bg-card p-4">
          <p className="text-[10px] text-muted-foreground font-medium">Past-due Subscriptions</p>
          <p className="text-xl font-black font-mono text-foreground mt-1">{response?.summary.pastDueSubscriptions ?? "—"}</p>
        </div>
      </div>

      <div className="rounded-xl border border-border bg-card overflow-hidden shadow-xl">
        {isLoading ? (
          <div className="py-12 flex justify-center">
            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
          </div>
        ) : clean && (response?.data?.length ?? 0) === 0 ? (
          <div className="p-12 text-center">
            <CheckCircle2 className="h-10 w-10 text-status-green mx-auto mb-3" />
            <h3 className="text-sm font-bold text-foreground">All Application Subsystems Operating Normally</h3>
            <p className="text-xs text-muted-foreground max-w-md mx-auto mt-1 leading-relaxed">
              No failed emails, no failed payments and no overdue subscriptions recorded.
            </p>
          </div>
        ) : (
          <div className="divide-y divide-border">
            {(response?.data || []).map((e) => (
              <div key={`${e.subsystem}-${e.id}`} className="p-4 flex items-start gap-3">
                <AlertTriangle className="h-4 w-4 text-status-yellow mt-0.5 shrink-0" />
                <div className="min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-[10px] font-mono font-bold px-1.5 py-0.5 rounded bg-muted text-muted-foreground">
                      {e.subsystem}
                    </span>
                    <span className="text-[10px] text-muted-foreground">
                      {new Date(e.timestamp).toLocaleString()}
                    </span>
                  </div>
                  <p className="text-xs text-foreground mt-1 break-words">{e.message}</p>
                  {e.context && Object.keys(e.context).length > 0 && (
                    <p className="text-[10px] text-muted-foreground mt-1 font-mono break-words">
                      {JSON.stringify(e.context)}
                    </p>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
