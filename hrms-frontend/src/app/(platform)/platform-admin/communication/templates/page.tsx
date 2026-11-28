"use client";

import { useCallback, useEffect, useState } from "react";
import {
  Mail,
  RefreshCw,
  CheckCircle2,
  AlertTriangle,
  CircleDashed,
  Loader2,
  Search,
} from "lucide-react";
import { platformApi } from "@/lib/platform-api";

interface EmailLogEntry {
  id: string;
  to: string;
  subject: string;
  type: string;
  status: "SENT" | "FAILED" | "SIMULATED";
  error: string | null;
  createdAt: string;
}

export default function EmailDeliveryLogPage() {
  const [logs, setLogs] = useState<EmailLogEntry[]>([]);
  const [meta, setMeta] = useState<{ total: number; page: number; totalPages: number } | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [status, setStatus] = useState("ALL");
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);

  const fetchLogs = useCallback(async () => {
    setIsLoading(true);
    try {
      const res = await platformApi.get("/platform/email-logs", {
        params: { status, search: search || undefined, page, limit: 25 },
      });
      setLogs(res.data.data || []);
      setMeta(res.data.meta || null);
    } catch (err) {
      console.error("Failed to load email delivery log", err);
    } finally {
      setIsLoading(false);
    }
  }, [status, search, page]);

  useEffect(() => {
    fetchLogs();
  }, [fetchLogs]);

  const statusChip = (s: string) => {
    if (s === "SENT")
      return "bg-status-green/15 text-status-green border-status-green/25";
    if (s === "FAILED")
      return "bg-destructive/15 text-destructive border-destructive/25";
    return "bg-status-yellow/15 text-status-yellow border-status-yellow/25";
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 flex-wrap">
            <h1 className="text-2xl font-bold tracking-tight text-foreground">Email Delivery Log</h1>
            <span className="text-xs font-mono font-medium px-2 py-0.5 rounded-full bg-primary/15 text-primary border border-primary/25">
              Resend
            </span>
          </div>
          <p className="text-sm text-muted-foreground mt-1">
            Every transactional email sent by the platform — registration OTPs, employee invites,
            password resets and payslips — is recorded here with its delivery outcome.
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

      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
          <input
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setPage(1);
            }}
            placeholder="Search recipient or subject…"
            className="w-full pl-9 pr-3 py-2 rounded-lg bg-card border border-border text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
          />
        </div>
        <select
          value={status}
          onChange={(e) => {
            setStatus(e.target.value);
            setPage(1);
          }}
          className="px-3 py-2 rounded-lg bg-card border border-border text-xs text-foreground"
        >
          <option value="ALL">All statuses</option>
          <option value="SENT">Sent</option>
          <option value="SIMULATED">Simulated (no API key)</option>
          <option value="FAILED">Failed</option>
        </select>
      </div>

      <div className="rounded-xl border border-border bg-card overflow-hidden shadow-xl">
        <div className="overflow-x-auto">
          <table className="w-full text-xs">
            <thead className="bg-muted/40 border-b border-border text-muted-foreground">
              <tr>
                <th className="text-left py-3 px-4 font-semibold">Recipient</th>
                <th className="text-left py-3 px-4 font-semibold">Subject</th>
                <th className="text-left py-3 px-4 font-semibold">Type</th>
                <th className="text-left py-3 px-4 font-semibold">Status</th>
                <th className="text-left py-3 px-4 font-semibold">Time</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {isLoading ? (
                <tr>
                  <td colSpan={5} className="py-12 text-center">
                    <Loader2 className="h-6 w-6 animate-spin text-muted-foreground mx-auto" />
                  </td>
                </tr>
              ) : logs.length === 0 ? (
                <tr>
                  <td colSpan={5} className="py-12 text-center text-muted-foreground">
                    <Mail className="h-8 w-8 mx-auto mb-2 opacity-40" />
                    No emails logged yet. Registration OTPs and invitations will appear here.
                  </td>
                </tr>
              ) : (
                logs.map((l) => (
                  <tr key={l.id} className="hover:bg-muted/25">
                    <td className="py-3 px-4 font-medium text-foreground">{l.to}</td>
                    <td className="py-3 px-4 text-muted-foreground max-w-[280px] truncate" title={l.subject}>
                      {l.subject}
                    </td>
                    <td className="py-3 px-4 font-mono text-[10px] text-muted-foreground">{l.type}</td>
                    <td className="py-3 px-4">
                      <span
                        className={`inline-flex items-center gap-1 text-[10px] font-semibold px-2 py-0.5 rounded-full border ${statusChip(
                          l.status
                        )}`}
                        title={l.error || l.status}
                      >
                        {l.status === "SENT" && <CheckCircle2 className="h-3 w-3" />}
                        {l.status === "FAILED" && <AlertTriangle className="h-3 w-3" />}
                        {l.status === "SIMULATED" && <CircleDashed className="h-3 w-3" />}
                        {l.status}
                      </span>
                      {l.error && (
                        <p className="text-[10px] text-destructive mt-1 max-w-[220px] truncate" title={l.error}>
                          {l.error}
                        </p>
                      )}
                    </td>
                    <td className="py-3 px-4 text-muted-foreground whitespace-nowrap">
                      {new Date(l.createdAt).toLocaleString()}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
        {meta && meta.totalPages > 1 && (
          <div className="border-t border-border px-4 py-3 flex items-center justify-between text-xs text-muted-foreground">
            <span>
              Page {meta.page} of {meta.totalPages} · {meta.total} entries
            </span>
            <div className="flex gap-2">
              <button
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={meta.page <= 1}
                className="px-3 py-1.5 rounded-lg border border-border hover:bg-muted disabled:opacity-40"
              >
                Previous
              </button>
              <button
                onClick={() => setPage((p) => Math.min(meta.totalPages, p + 1))}
                disabled={meta.page >= meta.totalPages}
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
