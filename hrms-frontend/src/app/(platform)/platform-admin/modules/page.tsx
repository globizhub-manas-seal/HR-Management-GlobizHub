"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  Boxes,
  SlidersHorizontal,
  Flag,
  CheckCircle2,
  XCircle,
  Building2,
  ShieldCheck,
  Sparkles,
  ArrowRight,
  RefreshCw,
  Plus,
  X,
  Search,
  Filter,
} from "lucide-react";
import { platformApi } from "@/lib/platform-api";

interface ModuleMeta {
  key: string;
  name: string;
  description: string;
}

interface PlanItem {
  id: string;
  name: string;
  code: string;
  entitlements: {
    moduleKey: string;
    isEnabled: boolean;
  }[];
}

interface CompanyOption {
  id: string;
  name: string;
  email: string;
}

export default function ModulesCatalogPage() {
  const [modules, setModules] = useState<ModuleMeta[]>([]);
  const [plans, setPlans] = useState<PlanItem[]>([]);
  const [companies, setCompanies] = useState<CompanyOption[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Override Modal
  const [overrideModalOpen, setOverrideModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [overrideSuccess, setOverrideSuccess] = useState("");
  const [overrideError, setOverrideError] = useState("");
  const [overrideForm, setOverrideForm] = useState({
    companyId: "",
    moduleKey: "payroll",
    isEnabled: true,
    reason: "",
  });

  const loadData = async () => {
    setIsLoading(true);
    try {
      const [modsRes, plansRes, orgsRes] = await Promise.all([
        platformApi.get<ModuleMeta[]>("/platform/modules"),
        platformApi.get<PlanItem[]>("/platform/plans"),
        platformApi.get<{ data: any[] }>("/platform/organizations?limit=100"),
      ]);

      setModules(modsRes.data || []);
      setPlans(plansRes.data || []);
      const orgList = orgsRes.data?.data || [];
      setCompanies(
        orgList.map((o: any) => ({
          id: o.id,
          name: o.name,
          email: o.email,
        }))
      );
      if (orgList[0]) {
        setOverrideForm((prev) => ({ ...prev, companyId: orgList[0].id }));
      }
    } catch (err: any) {
      console.error("Failed to load modules catalog data", err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleSaveOverride = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setOverrideSuccess("");
    setOverrideError("");

    try {
      await platformApi.post("/platform/subscriptions/override", {
        companyId: overrideForm.companyId,
        moduleKey: overrideForm.moduleKey,
        isEnabled: overrideForm.isEnabled,
        reason: overrideForm.reason || undefined,
      });

      setOverrideSuccess("Tenant module override successfully configured!");
      setTimeout(() => {
        setOverrideModalOpen(false);
        setOverrideSuccess("");
      }, 1200);
    } catch (err: any) {
      setOverrideError(
        err.response?.data?.message || err.message || "Failed to set company feature override"
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-4 border-b border-border">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold tracking-tight text-foreground">HRMS Product Modules</h1>
            <span className="text-xs font-mono font-medium px-2 py-0.5 rounded-full bg-primary/15 text-foreground border border-primary/25">
              {modules.length} Core Modules
            </span>
          </div>
          <p className="text-sm text-muted-foreground mt-1">
            Global catalog of functional modules gated by subscription plan entitlements and per-tenant feature overrides.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <Link
            href="/platform-admin/subscriptions/plans"
            className="flex items-center gap-2 px-3.5 py-2 text-xs font-medium text-foreground bg-card border border-border hover:bg-muted rounded-xl transition-colors shadow-xs"
          >
            <SlidersHorizontal className="size-3.5 text-muted-foreground" />
            Plan Entitlement Matrix
          </Link>
          <button
            onClick={() => {
              setOverrideSuccess("");
              setOverrideError("");
              setOverrideModalOpen(true);
            }}
            className="flex items-center gap-2 px-4 py-2 text-xs font-semibold text-primary-foreground bg-primary hover:bg-primary/90 rounded-xl transition-colors shadow-xs cursor-pointer"
          >
            <ShieldCheck className="size-4" />
            Set Tenant Override
          </button>
        </div>
      </div>

      {/* Modules Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {isLoading ? (
          <div className="col-span-full py-16 text-center text-muted-foreground text-xs">
            <RefreshCw className="size-6 animate-spin mx-auto mb-2 text-primary" />
            Loading modules metadata...
          </div>
        ) : (
          modules.map((mod) => {
            // Check which plans enable this module
            const plansWithModule = plans.filter((p) =>
              p.entitlements?.some((e) => e.moduleKey.toLowerCase() === mod.key.toLowerCase() && e.isEnabled)
            );

            return (
              <div
                key={mod.key}
                className="rounded-2xl border border-border bg-card p-5 flex flex-col justify-between hover:scale-[1.01] transition-transform shadow-xs"
              >
                <div>
                  <div className="flex items-start justify-between gap-3 mb-2.5">
                    <div>
                      <h3 className="font-semibold text-foreground text-sm tracking-tight">{mod.name}</h3>
                      <span className="font-mono text-[10px] text-primary font-bold uppercase tracking-wider">
                        key: {mod.key}
                      </span>
                    </div>
                    <div className="p-2 rounded-xl bg-primary/15 text-primary border border-primary/25">
                      <Boxes className="size-4" />
                    </div>
                  </div>

                  <p className="text-xs text-muted-foreground leading-relaxed mb-4">
                    {mod.description}
                  </p>
                </div>

                <div className="pt-3 border-t border-border">
                  <span className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground block mb-2">
                    Included in Plans:
                  </span>
                  <div className="flex flex-wrap gap-1.5">
                    {plansWithModule.length === 0 ? (
                      <span className="text-[11px] text-muted-foreground/60 italic">No plans assigned</span>
                    ) : (
                      plansWithModule.map((p) => (
                        <span
                          key={p.id}
                          className="px-2 py-0.5 rounded text-[10px] font-medium bg-muted text-foreground border border-border"
                        >
                          {p.name}
                        </span>
                      ))
                    )}
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Override Modal */}
      {overrideModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="w-full max-w-lg rounded-2xl bg-card border border-border p-6 shadow-2xl relative text-foreground">
            <button
              onClick={() => setOverrideModalOpen(false)}
              className="absolute right-4 top-4 p-1.5 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted cursor-pointer"
            >
              <X className="size-5" />
            </button>

            <div className="flex items-center gap-3 mb-4">
              <div className="p-2 rounded-xl bg-primary/15 border border-primary/25 text-primary">
                <ShieldCheck className="size-5" />
              </div>
              <div>
                <h3 className="text-base font-bold text-foreground">Configure Tenant Feature Override</h3>
                <p className="text-xs text-muted-foreground">
                  Grant or revoke access to a specific module for an individual organization regardless of their plan.
                </p>
              </div>
            </div>

            {overrideSuccess && (
              <div className="mb-4 p-3 rounded-lg bg-status-green/15 border border-status-green/25 text-status-green text-xs flex items-center gap-2">
                <CheckCircle2 className="size-4" />
                {overrideSuccess}
              </div>
            )}
            {overrideError && (
              <div className="mb-4 p-3 rounded-lg bg-destructive/15 border border-destructive/25 text-destructive text-xs flex items-center gap-2">
                <XCircle className="size-4" />
                {overrideError}
              </div>
            )}

            <form onSubmit={handleSaveOverride} className="space-y-4">
              {/* Select Company */}
              <div>
                <label className="block text-xs font-semibold text-foreground mb-1">
                  Target Organization
                </label>
                <select
                  value={overrideForm.companyId}
                  onChange={(e) => setOverrideForm({ ...overrideForm, companyId: e.target.value })}
                  required
                  className="w-full px-3 py-2 rounded-xl bg-background border border-border text-xs text-foreground focus:outline-none focus:ring-2 focus:ring-primary shadow-xs"
                >
                  <option value="" disabled>
                    Select an organization...
                  </option>
                  {companies.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name} ({c.email})
                    </option>
                  ))}
                </select>
              </div>

              {/* Select Module */}
              <div>
                <label className="block text-xs font-semibold text-foreground mb-1">
                  HRMS Functional Module
                </label>
                <select
                  value={overrideForm.moduleKey}
                  onChange={(e) => setOverrideForm({ ...overrideForm, moduleKey: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl bg-background border border-border text-xs text-foreground focus:outline-none focus:ring-2 focus:ring-primary shadow-xs"
                >
                  {modules.map((m) => (
                    <option key={m.key} value={m.key}>
                      {m.name} ({m.key})
                    </option>
                  ))}
                </select>
              </div>

              {/* Status */}
              <div>
                <label className="block text-xs font-semibold text-foreground mb-1">
                  Override Permission State
                </label>
                <div className="flex gap-4 p-3 rounded-xl bg-muted/40 border border-border">
                  <label className="flex items-center gap-2 text-xs text-status-green font-medium cursor-pointer">
                    <input
                      type="radio"
                      name="isEnabled"
                      checked={overrideForm.isEnabled === true}
                      onChange={() => setOverrideForm({ ...overrideForm, isEnabled: true })}
                      className="accent-primary"
                    />
                    FORCE ENABLE (Grant access above plan)
                  </label>
                  <label className="flex items-center gap-2 text-xs text-destructive font-medium cursor-pointer">
                    <input
                      type="radio"
                      name="isEnabled"
                      checked={overrideForm.isEnabled === false}
                      onChange={() => setOverrideForm({ ...overrideForm, isEnabled: false })}
                      className="accent-primary"
                    />
                    FORCE DISABLE (Revoke access)
                  </label>
                </div>
              </div>

              {/* Reason */}
              <div>
                <label className="block text-xs font-semibold text-foreground mb-1">
                  Reason for Override (Audited)
                </label>
                <textarea
                  rows={2}
                  placeholder="e.g. Granted temporary 30-day trial of Payroll for high-touch enterprise lead"
                  value={overrideForm.reason}
                  onChange={(e) => setOverrideForm({ ...overrideForm, reason: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl bg-background border border-border text-xs text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary resize-none shadow-xs"
                />
              </div>

              <div className="flex justify-end gap-2.5 pt-3 border-t border-border">
                <button
                  type="button"
                  onClick={() => setOverrideModalOpen(false)}
                  className="px-4 py-2 rounded-xl text-xs font-medium text-muted-foreground hover:text-foreground hover:bg-muted cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-semibold text-primary-foreground bg-primary hover:bg-primary/90 disabled:opacity-50 cursor-pointer shadow-xs"
                >
                  {isSubmitting ? (
                    <RefreshCw className="size-3.5 animate-spin" />
                  ) : (
                    <ShieldCheck className="size-3.5" />
                  )}
                  Save Override
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
