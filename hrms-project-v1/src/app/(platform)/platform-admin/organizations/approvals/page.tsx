"use client";

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import platformApi from "@/lib/platform-api";
import {
  Clock,
  CheckCircle2,
  XCircle,
  Building2,
  Mail,
  Calendar,
  ExternalLink,
  Loader2,
  ShieldAlert,
  ArrowLeft,
  Sparkles,
} from "lucide-react";

export default function OrganizationApprovalsPage() {
  const [organizations, setOrganizations] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [actionLoadingId, setActionLoadingId] = useState<string | null>(null);

  const fetchApprovals = useCallback(async () => {
    setIsLoading(true);
    try {
      const res = await platformApi.get("/platform/organizations", {
        params: { status: "PENDING_VERIFICATION", limit: 50 },
      });
      setOrganizations(res.data.data);
    } catch (err) {
      console.error("Failed to load approval requests", err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchApprovals();
  }, [fetchApprovals]);

  const handleAction = async (id: string, newStatus: "VERIFIED" | "SUSPENDED") => {
    setActionLoadingId(id);
    try {
      await platformApi.patch(`/platform/organizations/${id}/status`, {
        status: newStatus,
        reason:
          newStatus === "VERIFIED"
            ? "Approved through Platform Verification Queue"
            : "Rejected from Platform Verification Queue",
      });
      fetchApprovals();
    } catch (err: any) {
      alert(err.response?.data?.message || "Failed to process approval request");
    } finally {
      setActionLoadingId(null);
    }
  };

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between pb-4 border-b border-border">
        <div className="flex items-center gap-3">
          <Link
            href="/platform-admin/organizations"
            className="p-2 rounded-xl bg-card border border-border text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
          >
            <ArrowLeft className="h-4 w-4" />
          </Link>
          <div>
            <h1 className="text-xl font-bold tracking-tight text-foreground flex items-center gap-2">
              <span>Organization Verification Queue</span>
              <span className="text-xs px-2 py-0.5 rounded-full bg-status-orange/15 text-status-orange border border-status-orange/25 font-mono">
                {organizations.length} Pending
              </span>
            </h1>
            <p className="text-xs text-muted-foreground">
              Review self-registered tenant companies awaiting platform administrative authorization.
            </p>
          </div>
        </div>
      </div>

      {isLoading ? (
        <div className="py-20 text-center text-muted-foreground">
          <Loader2 className="h-8 w-8 animate-spin mx-auto text-primary mb-2" />
          <p className="text-xs">Loading pending approvals...</p>
        </div>
      ) : organizations.length === 0 ? (
        <div className="py-20 text-center rounded-2xl bg-card border border-border">
          <div className="h-12 w-12 rounded-2xl bg-status-green/15 border border-status-green/25 text-status-green flex items-center justify-center mx-auto mb-3">
            <CheckCircle2 className="h-6 w-6" />
          </div>
          <h3 className="text-base font-semibold text-foreground">Queue Clear</h3>
          <p className="text-xs text-muted-foreground mt-1 max-w-sm mx-auto">
            All registered organizations have been reviewed. Newly submitted registrations will appear here automatically.
          </p>
          <div className="mt-4">
            <Link
              href="/platform-admin/organizations"
              className="text-xs text-primary hover:text-foreground underline underline-offset-4"
            >
              Return to All Organizations &rarr;
            </Link>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {organizations.map((org) => {
            const isProcessing = actionLoadingId === org.id;

            return (
              <div
                key={org.id}
                className="p-5 rounded-2xl bg-card border border-border space-y-4 hover:border-primary/40 transition-colors"
              >
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <h3 className="text-base font-bold text-foreground">{org.name}</h3>
                    <p className="text-xs text-muted-foreground flex items-center gap-1.5 mt-0.5">
                      <Mail className="h-3.5 w-3.5 text-muted-foreground" />
                      <span>{org.email}</span>
                    </p>
                  </div>
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-status-orange/15 text-status-orange border border-status-orange/25">
                    Awaiting Approval
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-2 text-xs py-2 px-3 rounded-xl bg-muted/40 border border-border">
                  <div>
                    <span className="text-muted-foreground text-[10px] uppercase font-semibold">Industry</span>
                    <p className="text-foreground font-medium">{org.industry || "Not specified"}</p>
                  </div>
                  <div>
                    <span className="text-muted-foreground text-[10px] uppercase font-semibold">Registered On</span>
                    <p className="text-foreground font-medium">{new Date(org.createdAt).toLocaleDateString()}</p>
                  </div>
                  <div>
                    <span className="text-muted-foreground text-[10px] uppercase font-semibold">Plan Choice</span>
                    <p className="text-primary font-medium">{org.activePlan}</p>
                  </div>
                  <div>
                    <span className="text-muted-foreground text-[10px] uppercase font-semibold">Location</span>
                    <p className="text-foreground font-medium">{org.city ? `${org.city}, ${org.country}` : "India"}</p>
                  </div>
                </div>

                <div className="flex items-center justify-between pt-2">
                  <Link
                    href={`/platform-admin/organizations/${org.id}`}
                    className="inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground"
                  >
                    <span>Full Details</span>
                    <ExternalLink className="h-3 w-3" />
                  </Link>

                  <div className="flex items-center gap-2">
                    <button
                      disabled={isProcessing}
                      onClick={() => handleAction(org.id, "SUSPENDED")}
                      className="px-3 py-1.5 rounded-xl border border-rose-500/30 text-destructive hover:bg-destructive/15 text-xs font-semibold transition-colors disabled:opacity-50"
                    >
                      Reject
                    </button>
                    <button
                      disabled={isProcessing}
                      onClick={() => handleAction(org.id, "VERIFIED")}
                      className="px-4 py-1.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 text-xs font-semibold shadow-md shadow-emerald-500/20 transition-all disabled:opacity-50 flex items-center gap-1.5"
                    >
                      {isProcessing ? (
                        <Loader2 className="h-3.5 w-3.5 animate-spin" />
                      ) : (
                        <CheckCircle2 className="h-3.5 w-3.5" />
                      )}
                      <span>Approve & Activate</span>
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

