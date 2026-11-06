"use client";

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import platformApi from "@/lib/platform-api";
import { ControlledAccessModal } from "@/components/platform/ControlledAccessModal";
import {
  Building2,
  Search,
  Filter,
  UserPlus,
  Clock,
  CheckCircle2,
  Ban,
  MoreVertical,
  ExternalLink,
  ShieldAlert,
  ChevronLeft,
  ChevronRight,
  Loader2,
  Users,
  CreditCard,
  AlertCircle,
  RefreshCw,
} from "lucide-react";

export default function OrganizationsPage() {
  const [organizations, setOrganizations] = useState<any[]>([]);
  const [meta, setMeta] = useState({ page: 1, limit: 12, total: 0, totalPages: 1 });
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [planFilter, setPlanFilter] = useState("ALL");
  const [isLoading, setIsLoading] = useState(true);
  const [actionLoadingId, setActionLoadingId] = useState<string | null>(null);

  // Diagnostic Modal State
  const [selectedOrgForDiagnostic, setSelectedOrgForDiagnostic] = useState<{
    id: string;
    name: string;
  } | null>(null);

  const fetchOrganizations = useCallback(
    async (page = 1) => {
      setIsLoading(true);
      try {
        const params: any = { page, limit: 12 };
        if (search.trim()) params.search = search.trim();
        if (statusFilter !== "ALL") params.status = statusFilter;
        if (planFilter !== "ALL") params.subscription = planFilter;

        const res = await platformApi.get("/platform/organizations", { params });
        setOrganizations(res.data.data);
        setMeta(res.data.meta);
      } catch (err) {
        console.error("Failed to load organizations", err);
      } finally {
        setIsLoading(false);
      }
    },
    [search, statusFilter, planFilter]
  );

  useEffect(() => {
    fetchOrganizations(1);
  }, [fetchOrganizations]);

  const handleUpdateStatus = async (
    id: string,
    newStatus: "VERIFIED" | "SUSPENDED" | "PENDING_VERIFICATION",
    reason?: string
  ) => {
    setActionLoadingId(id);
    try {
      await platformApi.patch(`/platform/organizations/${id}/status`, {
        status: newStatus,
        reason: reason || `Admin manual status transition to ${newStatus}`,
      });
      fetchOrganizations(meta.page);
    } catch (err: any) {
      alert(err.response?.data?.message || "Failed to update organization status");
    } finally {
      setActionLoadingId(null);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "VERIFIED":
      case "ACTIVE":
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-status-green/15 text-status-green border border-status-green/25">
            <CheckCircle2 className="size-3" />
            <span>Active</span>
          </span>
        );
      case "PENDING_VERIFICATION":
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-status-orange/15 text-status-orange border border-status-orange/25">
            <Clock className="size-3" />
            <span>Pending Approval</span>
          </span>
        );
      case "SUSPENDED":
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-destructive/15 text-destructive border border-destructive/25">
            <Ban className="size-3" />
            <span>Suspended</span>
          </span>
        );
      default:
        return (
          <span className="px-2 py-0.5 rounded-full text-[11px] font-medium bg-muted text-muted-foreground border border-border">
            {status}
          </span>
        );
    }
  };

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-border">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground flex items-center gap-2">
            <span>Organization Directory</span>
            <span className="text-xs font-mono font-medium text-muted-foreground">({meta.total})</span>
          </h1>
          <p className="text-xs text-muted-foreground mt-1">
            Monitor tenant companies, review registration requests, manage quotas and status.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => fetchOrganizations(meta.page)}
            title="Refresh list"
            className="p-2 rounded-xl bg-card border border-border text-muted-foreground hover:text-foreground hover:bg-muted transition-colors cursor-pointer shadow-xs"
          >
            <RefreshCw className="size-4" />
          </button>
          <Link
            href="/platform-admin/organizations/onboard"
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-primary hover:bg-primary/90 text-primary-foreground text-xs font-semibold shadow-xs transition-all"
          >
            <UserPlus className="size-4" />
            <span>Onboard Organization</span>
          </Link>
        </div>
      </div>

      {/* Filter Tabs & Search */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        {/* Status Filter Tabs */}
        <div className="flex items-center gap-1 p-1 bg-card border border-border rounded-xl overflow-x-auto shadow-xs">
          {[
            { key: "ALL", label: "All Tenants" },
            { key: "VERIFIED", label: "Active" },
            { key: "PENDING_VERIFICATION", label: "Pending Approvals" },
            { key: "SUSPENDED", label: "Suspended" },
          ].map((tab) => (
            <button
              key={tab.key}
              onClick={() => {
                setStatusFilter(tab.key);
              }}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-all cursor-pointer ${
                statusFilter === tab.key
                  ? "bg-primary/20 text-foreground border border-primary/30"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Search & Subscription Filter */}
        <div className="flex items-center gap-3">
          <div className="relative flex-1 sm:w-64">
            <Search className="absolute left-3 top-2.5 size-3.5 text-muted-foreground" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by company or email..."
              className="w-full pl-9 pr-3 py-1.5 bg-card border border-border rounded-xl text-xs text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary shadow-xs"
            />
          </div>

          <select
            value={planFilter}
            onChange={(e) => setPlanFilter(e.target.value)}
            className="px-3 py-1.5 bg-card border border-border rounded-xl text-xs text-foreground focus:outline-none focus:ring-2 focus:ring-primary shadow-xs"
          >
            <option value="ALL">All Plans</option>
            <option value="FREE_TRIAL">Free Trial</option>
            <option value="NORMAL">Normal</option>
            <option value="PRO">Pro</option>
            <option value="ENTERPRISE">Enterprise</option>
          </select>
        </div>
      </div>

      {/* Organizations Table */}
      <div className="rounded-2xl border border-border bg-card overflow-hidden shadow-xs">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="border-b border-border bg-muted/50 text-muted-foreground uppercase tracking-wider text-[10px] font-semibold">
                <th className="py-3 px-4">Organization</th>
                <th className="py-3 px-4">Contact</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4">Plan</th>
                <th className="py-3 px-4">Employees</th>
                <th className="py-3 px-4">Registered</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {isLoading ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-muted-foreground">
                    <Loader2 className="size-6 animate-spin mx-auto text-primary mb-2" />
                    <span>Loading organization records...</span>
                  </td>
                </tr>
              ) : organizations.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-muted-foreground">
                    <Building2 className="size-8 mx-auto text-muted-foreground/60 mb-2" />
                    <p className="font-medium text-foreground">No organizations found</p>
                    <p className="text-[11px] text-muted-foreground mt-1">
                      Try adjusting your search query or status filter.
                    </p>
                  </td>
                </tr>
              ) : (
                organizations.map((org) => {
                  const isActionLoading = actionLoadingId === org.id;

                  return (
                    <tr
                      key={org.id}
                      className="hover:bg-muted/40 transition-colors group"
                    >
                      {/* Name & Slug */}
                      <td className="py-3.5 px-4">
                        <Link
                          href={`/platform-admin/organizations/${org.id}`}
                          className="font-semibold text-foreground group-hover:text-primary transition-colors flex items-center gap-1.5"
                        >
                          <span>{org.name}</span>
                        </Link>
                        <span className="font-mono text-[10px] text-muted-foreground">
                          {org.slug || org.id.substring(0, 8)}
                        </span>
                      </td>

                      {/* Contact */}
                      <td className="py-3.5 px-4 text-foreground">
                        <div>{org.email}</div>
                        <div className="text-[10px] text-muted-foreground">{org.phone || "No phone"}</div>
                      </td>

                      {/* Status */}
                      <td className="py-3.5 px-4">{getStatusBadge(org.status)}</td>

                      {/* Plan */}
                      <td className="py-3.5 px-4">
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-muted text-foreground border border-border font-mono text-[10px]">
                          <CreditCard className="size-3 text-primary" />
                          <span>{org.activePlan}</span>
                        </span>
                      </td>

                      {/* Employees Count */}
                      <td className="py-3.5 px-4">
                        <div className="flex items-center gap-1.5 text-foreground font-medium">
                          <Users className="size-3.5 text-muted-foreground" />
                          <span>{org.employeeCount}</span>
                        </div>
                      </td>

                      {/* Created At */}
                      <td className="py-3.5 px-4 text-muted-foreground">
                        {new Date(org.createdAt).toLocaleDateString()}
                      </td>

                      {/* Actions */}
                      <td className="py-3.5 px-4 text-right">
                        <div className="inline-flex items-center gap-1">
                          {/* Approve if pending */}
                          {org.status === "PENDING_VERIFICATION" && (
                            <button
                              disabled={isActionLoading}
                              onClick={() => handleUpdateStatus(org.id, "VERIFIED", "Approved by platform administrator")}
                              className="px-2.5 py-1 rounded-lg bg-status-green/15 hover:bg-status-green/25 text-status-green border border-status-green/25 text-[11px] font-semibold transition-colors disabled:opacity-50 cursor-pointer"
                            >
                              Approve
                            </button>
                          )}

                          {/* Suspend or Reactivate */}
                          {org.status === "VERIFIED" && (
                            <button
                              disabled={isActionLoading}
                              onClick={() => {
                                const reason = prompt("Enter suspension reason (mandatory):");
                                if (reason) handleUpdateStatus(org.id, "SUSPENDED", reason);
                              }}
                              className="px-2 py-1 rounded-lg text-muted-foreground hover:text-destructive hover:bg-destructive/10 text-[11px] transition-colors cursor-pointer"
                            >
                              Suspend
                            </button>
                          )}

                          {org.status === "SUSPENDED" && (
                            <button
                              disabled={isActionLoading}
                              onClick={() => handleUpdateStatus(org.id, "VERIFIED", "Reactivated by platform administrator")}
                              className="px-2.5 py-1 rounded-lg bg-primary/20 hover:bg-primary/30 text-foreground border border-primary/30 text-[11px] font-semibold transition-colors cursor-pointer"
                            >
                              Reactivate
                            </button>
                          )}

                          {/* Controlled Diagnostic Support */}
                          <button
                            type="button"
                            onClick={() =>
                              setSelectedOrgForDiagnostic({ id: org.id, name: org.name })
                            }
                            title="Controlled Diagnostic Support Session"
                            className="p-1.5 rounded-lg text-muted-foreground hover:text-status-orange hover:bg-status-orange/10 transition-colors cursor-pointer"
                          >
                            <ShieldAlert className="size-4" />
                          </button>

                          {/* 9-Tab Inspector Link */}
                          <Link
                            href={`/platform-admin/organizations/${org.id}`}
                            className="p-1.5 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
                            title="Inspect Organization"
                          >
                            <ExternalLink className="size-4" />
                          </Link>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination Footer */}
        <div className="flex items-center justify-between px-4 py-3 bg-muted/30 border-t border-border text-xs text-muted-foreground">
          <div>
            Showing Page <span className="text-foreground font-semibold">{meta.page}</span> of{" "}
            <span className="text-foreground font-semibold">{meta.totalPages}</span> ({meta.total} Total)
          </div>
          <div className="flex items-center gap-1">
            <button
              disabled={meta.page <= 1 || isLoading}
              onClick={() => fetchOrganizations(meta.page - 1)}
              className="p-1.5 rounded-lg border border-border text-muted-foreground hover:text-foreground hover:bg-muted disabled:opacity-40 transition-colors cursor-pointer"
            >
              <ChevronLeft className="size-4" />
            </button>
            <button
              disabled={meta.page >= meta.totalPages || isLoading}
              onClick={() => fetchOrganizations(meta.page + 1)}
              className="p-1.5 rounded-lg border border-border text-muted-foreground hover:text-foreground hover:bg-muted disabled:opacity-40 transition-colors cursor-pointer"
            >
              <ChevronRight className="size-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Controlled Diagnostic Session Modal */}
      {selectedOrgForDiagnostic && (
        <ControlledAccessModal
          isOpen={!!selectedOrgForDiagnostic}
          onClose={() => setSelectedOrgForDiagnostic(null)}
          organizationId={selectedOrgForDiagnostic.id}
          organizationName={selectedOrgForDiagnostic.name}
        />
      )}
    </div>
  );
}

