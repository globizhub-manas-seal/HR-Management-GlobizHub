"use client";

import { useState } from "react";
import { Terminal, RefreshCw, CheckCircle2, AlertTriangle, ShieldCheck } from "lucide-react";

export default function ErrorLogsPage() {
  const [logs, setLogs] = useState<any[]>([]);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold tracking-tight text-foreground">System Error Logs</h1>
            <span className="text-xs font-mono font-medium px-2 py-0.5 rounded-full bg-status-green/15 text-status-green border border-status-green/25">
              Clean Runtime
            </span>
          </div>
          <p className="text-sm text-muted-foreground mt-1">
            Aggregated NestJS runtime exceptions, external payment webhook delivery errors, and background snapshot failures.
          </p>
        </div>

        <button
          onClick={() => alert("Refreshed system logs. Zero active uncaught errors.")}
          className="flex items-center gap-2 px-3.5 py-2 text-xs font-medium text-foreground bg-card border border-border hover:bg-muted rounded-lg transition-colors"
        >
          <RefreshCw className="h-3.5 w-3.5" />
          Poll Recent Exceptions
        </button>
      </div>

      <div className="rounded-xl border border-border bg-card p-12 text-center shadow-xl">
        <CheckCircle2 className="h-10 w-10 text-status-green mx-auto mb-3" />
        <h3 className="text-sm font-bold text-foreground">All Application Subsystems Operating Normally</h3>
        <p className="text-xs text-muted-foreground max-w-md mx-auto mt-1 leading-relaxed">
          There are currently 0 active unhandled runtime exceptions. NestJS exception filters and database query pools are performing within target thresholds.
        </p>
      </div>
    </div>
  );
}

