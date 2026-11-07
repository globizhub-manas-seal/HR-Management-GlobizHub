"use client";

import { useEffect, useState, useCallback } from "react";
import platformApi from "@/lib/platform-api";
import {
  CreditCard,
  Plus,
  SlidersHorizontal,
  Edit2,
  Check,
  X,
  Users,
  HardDrive,
  Calendar,
  Sparkles,
  Loader2,
  AlertCircle,
  Save,
} from "lucide-react";

export default function SubscriptionPlansPage() {
  const [plans, setPlans] = useState<any[]>([]);
  const [modules, setModules] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Modal States
  const [editingPlan, setEditingPlan] = useState<any | null>(null);
  const [entitlementPlan, setEntitlementPlan] = useState<any | null>(null);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Form State for Plan
  const [name, setName] = useState("");
  const [code, setCode] = useState("");
  const [description, setDescription] = useState("");
  const [monthlyPrice, setMonthlyPrice] = useState(0);
  const [annualPrice, setAnnualPrice] = useState(0);
  const [maxEmployees, setMaxEmployees] = useState(25);
  const [maxStorageGb, setMaxStorageGb] = useState(5);
  const [trialDays, setTrialDays] = useState(14);

  // Entitlement Map state for active editing
  const [entitlementsMap, setEntitlementsMap] = useState<Record<string, boolean>>({});

  const fetchPlansAndModules = useCallback(async () => {
    setIsLoading(true);
    try {
      const [plansRes, modulesRes] = await Promise.all([
        platformApi.get("/platform/plans"),
        platformApi.get("/platform/modules"),
      ]);
      setPlans(plansRes.data);
      setModules(modulesRes.data);
    } catch (err) {
      console.error("Failed to load plans", err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchPlansAndModules();
  }, [fetchPlansAndModules]);

  const openEditModal = (plan: any) => {
    setEditingPlan(plan);
    setName(plan.name);
    setCode(plan.code);
    setDescription(plan.description || "");
    setMonthlyPrice(Number(plan.monthlyPrice) || 0);
    setAnnualPrice(Number(plan.annualPrice) || 0);
    setMaxEmployees(plan.maxEmployees || 25);
    setMaxStorageGb(plan.maxStorageGb || 5);
    setTrialDays(plan.trialDays || 14);
    setError(null);
  };

  const openEntitlementsModal = (plan: any) => {
    setEntitlementPlan(plan);
    const map: Record<string, boolean> = {};
    for (const ent of plan.entitlements || []) {
      map[ent.moduleKey] = ent.isEnabled;
    }
    setEntitlementsMap(map);
  };

  const handleSavePlan = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError(null);

    try {
      if (editingPlan) {
        await platformApi.put(`/platform/plans/${editingPlan.id}`, {
          name,
          description,
          monthlyPrice: Number(monthlyPrice),
          annualPrice: Number(annualPrice),
          maxEmployees: Number(maxEmployees),
          maxStorageGb: Number(maxStorageGb),
          trialDays: Number(trialDays),
        });
      } else {
        await platformApi.post("/platform/plans", {
          name,
          code,
          description,
          monthlyPrice: Number(monthlyPrice),
          annualPrice: Number(annualPrice),
          maxEmployees: Number(maxEmployees),
          maxStorageGb: Number(maxStorageGb),
          trialDays: Number(trialDays),
        });
      }

      setEditingPlan(null);
      setIsCreateModalOpen(false);
      await fetchPlansAndModules();
    } catch (err: any) {
      setError(err.response?.data?.message || "Failed to save plan");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSaveEntitlements = async () => {
    if (!entitlementPlan) return;
    setIsSubmitting(true);
    try {
      const payload = Object.entries(entitlementsMap).map(([moduleKey, isEnabled]) => ({
        moduleKey,
        isEnabled,
      }));
      await platformApi.put(`/platform/plans/${entitlementPlan.id}/entitlements`, {
        entitlements: payload,
      });
      setEntitlementPlan(null);
      await fetchPlansAndModules();
    } catch (err: any) {
      alert(err.response?.data?.message || "Failed to save plan entitlements");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-border">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground flex items-center gap-2">
            <span>Subscription Plans & Tiers</span>
            <span className="text-xs px-2 py-0.5 rounded-full bg-primary/15 text-primary border border-primary/25 font-mono">
              {plans.length} Tiers
            </span>
          </h1>
          <p className="text-xs text-muted-foreground mt-1">
            Configure pricing, quotas, employee limits, and feature entitlement matrices per plan.
          </p>
        </div>

        <button
          onClick={() => {
            setEditingPlan(null);
            setName("");
            setCode("PLAN_CUSTOM");
            setDescription("");
            setMonthlyPrice(2999);
            setAnnualPrice(29990);
            setMaxEmployees(100);
            setMaxStorageGb(15);
            setTrialDays(14);
            setError(null);
            setIsCreateModalOpen(true);
          }}
          className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-primary hover:bg-primary/90 text-primary-foreground text-xs font-semibold shadow-lg shadow-xs transition-all"
        >
          <Plus className="h-4 w-4" />
          <span>Create New Tier</span>
        </button>
      </div>

      {isLoading ? (
        <div className="py-20 text-center text-muted-foreground">
          <Loader2 className="h-8 w-8 animate-spin mx-auto text-primary mb-2" />
          <p className="text-xs">Loading subscription plans & entitlements...</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
          {plans.map((plan) => {
            const subscribers = plan._count?.subscriptions || 0;
            const enabledCount = (plan.entitlements || []).filter((e: any) => e.isEnabled).length;

            return (
              <div
                key={plan.id}
                className="p-6 rounded-2xl bg-card border border-border hover:border-primary/40 shadow-xl flex flex-col justify-between transition-all"
              >
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-mono text-[10px] font-semibold uppercase tracking-wider text-primary bg-primary/15 px-2 py-0.5 rounded border border-primary/25">
                      {plan.code}
                    </span>
                    <span className="text-[11px] font-mono text-muted-foreground">
                      {subscribers} Tenants
                    </span>
                  </div>

                  <h3 className="text-lg font-bold text-foreground tracking-tight">{plan.name}</h3>
                  <p className="text-xs text-muted-foreground mt-1 min-h-[36px] line-clamp-2">
                    {plan.description || "Configurable organization tier"}
                  </p>

                  <div className="mt-4 pt-4 border-t border-border">
                    <div className="flex items-baseline gap-1">
                      <span className="text-2xl font-bold text-foreground">
                        ₹{Number(plan.monthlyPrice).toLocaleString()}
                      </span>
                      <span className="text-xs text-muted-foreground">/ month</span>
                    </div>
                    <p className="text-[10px] text-muted-foreground mt-0.5">
                      Annual: ₹{Number(plan.annualPrice).toLocaleString()} / year
                    </p>
                  </div>

                  {/* Quotas */}
                  <div className="mt-4 space-y-2 py-3 border-y border-border text-xs">
                    <div className="flex items-center justify-between text-foreground">
                      <span className="flex items-center gap-1.5 text-muted-foreground text-[11px]">
                        <Users className="h-3.5 w-3.5 text-muted-foreground" /> Max Seats
                      </span>
                      <span className="font-semibold text-foreground">{plan.maxEmployees}</span>
                    </div>
                    <div className="flex items-center justify-between text-foreground">
                      <span className="flex items-center gap-1.5 text-muted-foreground text-[11px]">
                        <HardDrive className="h-3.5 w-3.5 text-muted-foreground" /> Storage Limit
                      </span>
                      <span className="font-semibold text-foreground">{plan.maxStorageGb} GB</span>
                    </div>
                    <div className="flex items-center justify-between text-foreground">
                      <span className="flex items-center gap-1.5 text-muted-foreground text-[11px]">
                        <Calendar className="h-3.5 w-3.5 text-muted-foreground" /> Trial Period
                      </span>
                      <span className="font-semibold text-foreground">{plan.trialDays} Days</span>
                    </div>
                  </div>

                  {/* Entitlements Count */}
                  <div className="mt-3 flex items-center justify-between text-[11px]">
                    <span className="text-muted-foreground">Feature Entitlements:</span>
                    <span className="font-semibold text-teal-400">
                      {enabledCount} of {modules.length} Modules
                    </span>
                  </div>
                </div>

                {/* Actions */}
                <div className="mt-6 pt-2 grid grid-cols-2 gap-2">
                  <button
                    onClick={() => openEditModal(plan)}
                    className="px-3 py-2 rounded-xl bg-muted hover:bg-muted text-foreground hover:text-foreground text-xs font-semibold transition-colors flex items-center justify-center gap-1.5"
                  >
                    <Edit2 className="h-3.5 w-3.5" />
                    <span>Edit Tier</span>
                  </button>
                  <button
                    onClick={() => openEntitlementsModal(plan)}
                    className="px-3 py-2 rounded-xl bg-primary/15 hover:bg-primary/20 text-foreground border border-primary/25 text-xs font-semibold transition-colors flex items-center justify-center gap-1.5"
                  >
                    <SlidersHorizontal className="h-3.5 w-3.5" />
                    <span>Entitlements</span>
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Plan Edit / Create Modal */}
      {(isCreateModalOpen || editingPlan) && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-fade-in">
          <div className="w-full max-w-lg bg-card border border-border rounded-2xl shadow-2xl p-6 text-foreground relative">
            <button
              onClick={() => {
                setIsCreateModalOpen(false);
                setEditingPlan(null);
              }}
              className="absolute top-4 right-4 p-1 rounded-lg text-muted-foreground hover:text-foreground"
            >
              <X className="h-5 w-5" />
            </button>

            <h3 className="text-base font-bold text-foreground mb-1">
              {editingPlan ? `Edit ${editingPlan.name}` : "Create New Subscription Plan"}
            </h3>
            <p className="text-xs text-muted-foreground mb-4">
              Define the price tier and resource limits for this organization package.
            </p>

            {error && (
              <div className="mb-4 p-3 rounded-xl bg-destructive/15 border border-destructive/25 text-xs text-destructive">
                {error}
              </div>
            )}

            <form onSubmit={handleSavePlan} className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-foreground mb-1">Plan Name *</label>
                  <input
                    required
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Professional" className="w-full px-3 py-2 bg-background border border-border rounded-xl text-xs text-foreground focus:outline-none focus:ring-2 focus:ring-primary placeholder:text-muted-foreground"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-foreground mb-1">Code *</label>
                  <input
                    required
                    disabled={!!editingPlan}
                    type="text"
                    value={code}
                    onChange={(e) => setCode(e.target.value.toUpperCase())}
                    placeholder="PLAN_PRO" className="w-full px-3 py-2 bg-background border border-border rounded-xl text-xs text-foreground font-mono focus:outline-none focus:ring-2 focus:ring-primary disabled:opacity-50 placeholder:text-muted-foreground"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-foreground mb-1">Description</label>
                <textarea
                  rows={2}
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Comprehensive HR automation for high-growth businesses." className="w-full px-3 py-2 bg-background border border-border rounded-xl text-xs text-foreground focus:outline-none focus:ring-2 focus:ring-primary placeholder:text-muted-foreground"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-foreground mb-1">Monthly Price (₹) *</label>
                  <input
                    required
                    type="number"
                    min={0}
                    value={monthlyPrice}
                    onChange={(e) => setMonthlyPrice(Number(e.target.value))}
                    className="w-full px-3 py-2 bg-background border border-border rounded-xl text-xs text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-foreground mb-1">Annual Price (₹) *</label>
                  <input
                    required
                    type="number"
                    min={0}
                    value={annualPrice}
                    onChange={(e) => setAnnualPrice(Number(e.target.value))}
                    className="w-full px-3 py-2 bg-background border border-border rounded-xl text-xs text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-medium text-foreground mb-1">Max Employees *</label>
                  <input
                    required
                    type="number"
                    min={1}
                    value={maxEmployees}
                    onChange={(e) => setMaxEmployees(Number(e.target.value))}
                    className="w-full px-3 py-2 bg-background border border-border rounded-xl text-xs text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-foreground mb-1">Storage (GB) *</label>
                  <input
                    required
                    type="number"
                    min={1}
                    value={maxStorageGb}
                    onChange={(e) => setMaxStorageGb(Number(e.target.value))}
                    className="w-full px-3 py-2 bg-background border border-border rounded-xl text-xs text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-foreground mb-1">Trial Days *</label>
                  <input
                    required
                    type="number"
                    min={0}
                    value={trialDays}
                    onChange={(e) => setTrialDays(Number(e.target.value))}
                    className="w-full px-3 py-2 bg-background border border-border rounded-xl text-xs text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                  />
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-border">
                <button
                  type="button"
                  onClick={() => {
                    setIsCreateModalOpen(false);
                    setEditingPlan(null);
                  }}
                  className="px-4 py-2 rounded-xl text-xs font-medium text-muted-foreground hover:text-foreground"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-5 py-2 rounded-xl bg-primary hover:bg-primary/90 text-primary-foreground text-xs font-semibold transition-colors disabled:opacity-50 flex items-center gap-1.5"
                >
                  {isSubmitting ? (
                    <Loader2 className="h-3.5 w-3.5 animate-spin" />
                  ) : (
                    <Check className="h-3.5 w-3.5" />
                  )}
                  <span>Save Plan Tier</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Entitlement Matrix Editor Modal */}
      {entitlementPlan && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-fade-in">
          <div className="w-full max-w-2xl bg-card border border-border rounded-2xl shadow-2xl p-6 text-foreground relative">
            <button
              onClick={() => setEntitlementPlan(null)}
              className="absolute top-4 right-4 p-1 rounded-lg text-muted-foreground hover:text-foreground"
            >
              <X className="h-5 w-5" />
            </button>

            <div className="flex items-center gap-2 mb-1">
              <SlidersHorizontal className="h-5 w-5 text-primary" />
              <h3 className="text-base font-bold text-foreground">
                Entitlement Matrix — {entitlementPlan.name}
              </h3>
            </div>
            <p className="text-xs text-muted-foreground mb-4">
              Toggle module availability for organizations subscribed to this tier. Backend guards strictly enforce these entitlements.
            </p>

            <div className="max-h-96 overflow-y-auto space-y-2 pr-1 divide-y divide-border/80">
              {modules.map((mod) => {
                const isEnabled = entitlementsMap[mod.key] ?? false;
                return (
                  <div
                    key={mod.key}
                    onClick={() =>
                      setEntitlementsMap((prev) => ({
                        ...prev,
                        [mod.key]: !isEnabled,
                      }))
                    }
                    className="pt-2.5 pb-2 flex items-center justify-between cursor-pointer hover:bg-muted/30 px-2 rounded-lg transition-colors"
                  >
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-semibold text-xs text-foreground">{mod.name}</span>
                        <span className="font-mono text-[10px] text-muted-foreground">({mod.key})</span>
                      </div>
                      <p className="text-[11px] text-muted-foreground mt-0.5">{mod.description}</p>
                    </div>

                    <div
                      className={`h-6 w-11 rounded-full p-1 transition-colors flex items-center ${
                        isEnabled ? "bg-sky-500 justify-end" : "bg-muted justify-start"
                      }`}
                    >
                      <div className="h-4 w-4 rounded-full bg-white shadow-md" />
                    </div>
                  </div>
                );
              })}
            </div>

            <div className="flex items-center justify-end gap-2 pt-4 border-t border-border mt-4">
              <button
                type="button"
                onClick={() => setEntitlementPlan(null)}
                className="px-4 py-2 rounded-xl text-xs font-medium text-muted-foreground hover:text-foreground"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={isSubmitting}
                onClick={handleSaveEntitlements}
                className="px-5 py-2 rounded-xl bg-primary hover:bg-primary/90 text-primary-foreground text-xs font-semibold flex items-center gap-1.5 transition-colors disabled:opacity-50"
              >
                {isSubmitting ? (
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                ) : (
                  <Save className="h-3.5 w-3.5" />
                )}
                <span>Update Entitlements Matrix</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

