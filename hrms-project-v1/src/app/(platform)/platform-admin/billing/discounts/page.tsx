"use client";

import { useEffect, useState, useCallback } from "react";
import {
  Tag,
  Plus,
  CheckCircle2,
  Calendar,
  Sparkles,
  Percent,
  X,
  CreditCard,
  Trash2,
  Loader2,
  AlertCircle,
} from "lucide-react";
import { platformApi } from "@/lib/platform-api";

interface Coupon {
  id: string;
  code: string;
  name: string;
  discountType: "PERCENTAGE" | "FIXED";
  discountValue: number;
  validUntil: string;
  usageCount: number;
  maxUsage: number;
  isActive: boolean;
}

export default function DiscountsPage() {
  const [coupons, setCoupons] = useState<Coupon[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [modalOpen, setModalOpen] = useState(false);
  const [form, setForm] = useState({
    code: "",
    name: "",
    discountType: "PERCENTAGE" as "PERCENTAGE" | "FIXED",
    discountValue: 20,
    validUntil: "2026-12-31",
    maxUsage: 50,
  });

  const fetchCoupons = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const res = await platformApi.get<Coupon[]>("/platform/billing/coupons");
      setCoupons(res.data || []);
    } catch (err: any) {
      console.error("Failed to load coupons", err);
      setError("Failed to load discount coupons from platform backend.");
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchCoupons();
  }, [fetchCoupons]);

  const handleCreateCoupon = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError(null);
    try {
      await platformApi.post("/platform/billing/coupons", {
        ...form,
        isActive: true,
      });
      setModalOpen(false);
      setForm({
        code: "",
        name: "",
        discountType: "PERCENTAGE",
        discountValue: 20,
        validUntil: "2026-12-31",
        maxUsage: 50,
      });
      fetchCoupons();
    } catch (err: any) {
      setError(err?.response?.data?.message || "Failed to create coupon code.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteCoupon = async (code: string) => {
    if (!confirm(`Are you sure you want to delete coupon "${code}"?`)) return;
    try {
      await platformApi.delete(`/platform/billing/coupons/${code}`);
      setCoupons((prev) => prev.filter((c) => c.code !== code));
    } catch (err: any) {
      alert(err?.response?.data?.message || "Failed to delete coupon.");
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold tracking-tight text-foreground">Coupons & Discounts</h1>
            <span className="text-xs font-mono font-medium px-2 py-0.5 rounded-full bg-status-orange/15 text-status-orange border border-status-orange/25">
              {coupons.length} Promo Codes
            </span>
          </div>
          <p className="text-sm text-muted-foreground mt-1">
            Create promotional discount codes and special pricing agreements for customer onboarding and annual commitments.
          </p>
        </div>

        <button
          onClick={() => setModalOpen(true)}
          className="flex items-center gap-2 px-4 py-2 text-xs font-medium bg-primary hover:bg-primary/90 text-primary-foreground rounded-lg transition-colors shadow-xs"
        >
          <Plus className="h-4 w-4" />
          Create Promo Code
        </button>
      </div>

      {error && (
        <div className="p-3.5 bg-destructive/10 border border-destructive/20 rounded-xl text-xs text-destructive flex items-center justify-between">
          <div className="flex items-center gap-2">
            <AlertCircle className="h-4 w-4 shrink-0" />
            <span>{error}</span>
          </div>
          <button onClick={() => setError(null)} className="hover:opacity-75">
            <X className="h-4 w-4" />
          </button>
        </div>
      )}

      {isLoading ? (
        <div className="h-64 flex flex-col items-center justify-center gap-2 text-muted-foreground">
          <Loader2 className="h-6 w-6 animate-spin text-primary" />
          <span className="text-xs">Loading coupons...</span>
        </div>
      ) : coupons.length === 0 ? (
        <div className="rounded-xl border border-dashed border-border p-12 text-center bg-card/50">
          <Tag className="h-10 w-10 text-muted-foreground mx-auto mb-3 opacity-40" />
          <h3 className="text-sm font-semibold text-foreground">No promo codes created</h3>
          <p className="text-xs text-muted-foreground mt-1 max-w-sm mx-auto">
            Get started by launching an early adopter promotion or annual commitment discount for SaaS customers.
          </p>
          <button
            onClick={() => setModalOpen(true)}
            className="mt-4 px-4 py-2 text-xs font-medium bg-primary text-primary-foreground rounded-lg"
          >
            Create First Coupon
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {coupons.map((c) => (
            <div
              key={c.code}
              className="rounded-xl border border-border bg-card p-5 flex flex-col justify-between hover:border-primary/40 transition-all shadow-sm"
            >
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="px-2.5 py-1 rounded-md font-mono font-bold text-xs bg-status-orange/15 text-status-orange border border-status-orange/25">
                    {c.code}
                  </span>
                  <div className="flex items-center gap-1.5">
                    <span
                      className={`text-[10px] font-semibold px-2 py-0.5 rounded-full border ${
                        c.isActive
                          ? "bg-status-green/15 text-status-green border-status-green/25"
                          : "bg-muted text-muted-foreground border-border"
                      }`}
                    >
                      {c.isActive ? "Active" : "Disabled"}
                    </span>
                    <button
                      onClick={() => handleDeleteCoupon(c.code)}
                      className="p-1 rounded text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors"
                      title="Delete code"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </div>
                </div>

                <h3 className="font-semibold text-foreground text-sm mt-3">{c.name}</h3>
                <div className="mt-2 text-xl font-bold font-mono text-foreground">
                  {c.discountType === "PERCENTAGE" ? `${c.discountValue}% OFF` : `₹${c.discountValue.toLocaleString()} OFF`}
                </div>
              </div>

              <div className="pt-4 mt-4 border-t border-border text-[11px] text-muted-foreground flex items-center justify-between">
                <span>Redeemed: {c.usageCount}/{c.maxUsage}</span>
                <span className="font-mono">Expires {c.validUntil?.slice(0, 10)}</span>
              </div>
            </div>
          ))}
        </div>
      )}

      {modalOpen && (
        <div className="fixed inset-0 z-50 bg-background/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="w-full max-w-md rounded-2xl bg-card border border-border p-6 shadow-2xl relative">
            <button
              onClick={() => setModalOpen(false)}
              className="absolute right-4 top-4 p-1.5 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted"
            >
              <X className="h-5 w-5" />
            </button>

            <h3 className="text-base font-bold text-foreground mb-4">Create New Discount Code</h3>

            <form onSubmit={handleCreateCoupon} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-foreground mb-1">Promo Code</label>
                <input
                  type="text"
                  placeholder="e.g. FLASH2026"
                  required
                  value={form.code}
                  onChange={(e) => setForm({ ...form, code: e.target.value.toUpperCase().replace(/\s+/g, '') })}
                  className="w-full px-3 py-2 rounded-lg bg-background border border-border text-xs text-foreground uppercase font-mono focus:border-primary"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-foreground mb-1">Campaign Name</label>
                <input
                  type="text"
                  placeholder="e.g. Q4 Growth Campaign"
                  required
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  className="w-full px-3 py-2 rounded-lg bg-background border border-border text-xs text-foreground focus:border-primary"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-foreground mb-1">Type</label>
                  <select
                    value={form.discountType}
                    onChange={(e) => setForm({ ...form, discountType: e.target.value as any })}
                    className="w-full px-3 py-2 rounded-lg bg-background border border-border text-xs text-foreground"
                  >
                    <option value="PERCENTAGE">Percentage (%)</option>
                    <option value="FIXED">Flat Amount (₹)</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-foreground mb-1">Value</label>
                  <input
                    type="number"
                    min="1"
                    required
                    value={form.discountValue}
                    onChange={(e) => setForm({ ...form, discountValue: Number(e.target.value) })}
                    className="w-full px-3 py-2 rounded-lg bg-background border border-border text-xs text-foreground"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-foreground mb-1">Valid Until</label>
                  <input
                    type="date"
                    required
                    value={form.validUntil}
                    onChange={(e) => setForm({ ...form, validUntil: e.target.value })}
                    className="w-full px-3 py-2 rounded-lg bg-background border border-border text-xs text-foreground"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-foreground mb-1">Max Redemptions</label>
                  <input
                    type="number"
                    min="1"
                    required
                    value={form.maxUsage}
                    onChange={(e) => setForm({ ...form, maxUsage: Number(e.target.value) })}
                    className="w-full px-3 py-2 rounded-lg bg-background border border-border text-xs text-foreground"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-2.5 pt-3 border-t border-border">
                <button
                  type="button"
                  onClick={() => setModalOpen(false)}
                  disabled={isSubmitting}
                  className="px-4 py-2 rounded-lg text-xs font-medium text-muted-foreground hover:text-foreground"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-4 py-2 rounded-lg text-xs font-medium bg-primary hover:bg-primary/90 text-primary-foreground flex items-center gap-2"
                >
                  {isSubmitting && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
                  Create Code
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
