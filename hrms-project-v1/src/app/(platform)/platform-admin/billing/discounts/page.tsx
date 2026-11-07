"use client";

import { useState } from "react";
import {
  Tag,
  Plus,
  CheckCircle2,
  Calendar,
  Sparkles,
  Percent,
  X,
  CreditCard,
} from "lucide-react";

interface Coupon {
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
  const [coupons, setCoupons] = useState<Coupon[]>([
    {
      code: "LAUNCH50",
      name: "Early Adopter SaaS Special",
      discountType: "PERCENTAGE",
      discountValue: 50,
      validUntil: "2026-12-31",
      usageCount: 14,
      maxUsage: 100,
      isActive: true,
    },
    {
      code: "STARTUP_ANNUAL",
      name: "Annual Upfront Commitment",
      discountType: "PERCENTAGE",
      discountValue: 20,
      validUntil: "2027-06-30",
      usageCount: 8,
      maxUsage: 50,
      isActive: true,
    },
    {
      code: "ENTERPRISE_PILOT",
      name: "Dedicated Enterprise Pilot Credit",
      discountType: "FIXED",
      discountValue: 5000,
      validUntil: "2026-11-30",
      usageCount: 3,
      maxUsage: 10,
      isActive: false,
    },
  ]);

  const [modalOpen, setModalOpen] = useState(false);
  const [form, setForm] = useState({
    code: "",
    name: "",
    discountType: "PERCENTAGE" as "PERCENTAGE" | "FIXED",
    discountValue: 20,
    validUntil: "2026-12-31",
    maxUsage: 50,
  });

  const handleCreateCoupon = (e: React.FormEvent) => {
    e.preventDefault();
    setCoupons((prev) => [
      ...prev,
      {
        ...form,
        usageCount: 0,
        isActive: true,
      },
    ]);
    setModalOpen(false);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold tracking-tight text-foreground">Coupons & Discounts</h1>
            <span className="text-xs font-mono font-medium px-2 py-0.5 rounded-full bg-status-orange/15 text-status-orange border border-status-orange/25">
              {coupons.length} Active Codes
            </span>
          </div>
          <p className="text-sm text-muted-foreground mt-1">
            Create promotional discount codes and special pricing agreements for customer onboarding and annual commitments.
          </p>
        </div>

        <button
          onClick={() => setModalOpen(true)}
          className="flex items-center gap-2 px-4 py-2 text-xs font-medium bg-primary hover:bg-primary/90 text-primary-foreground rounded-lg transition-colors shadow-md shadow-xs"
        >
          <Plus className="h-4 w-4" />
          Create Promo Code
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {coupons.map((c) => (
          <div
            key={c.code}
            className="rounded-xl border border-border bg-card p-5 flex flex-col justify-between hover:border-primary/40 transition-all shadow-lg"
          >
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="px-2.5 py-1 rounded-md font-mono font-bold text-xs bg-status-orange/15 text-status-orange border border-status-orange/25">
                  {c.code}
                </span>
                <span
                  className={`text-[10px] font-semibold px-2 py-0.5 rounded-full border ${
                    c.isActive
                      ? "bg-status-green/15 text-status-green border-status-green/25"
                      : "bg-muted text-muted-foreground border-border"
                  }`}
                >
                  {c.isActive ? "Active" : "Expired"}
                </span>
              </div>

              <h3 className="font-semibold text-foreground text-sm mt-3">{c.name}</h3>
              <div className="mt-2 text-xl font-bold font-mono text-foreground">
                {c.discountType === "PERCENTAGE" ? `${c.discountValue}% OFF` : `₹${c.discountValue} OFF`}
              </div>
            </div>

            <div className="pt-4 mt-4 border-t border-border text-[11px] text-muted-foreground flex items-center justify-between">
              <span>Redeemed: {c.usageCount}/{c.maxUsage}</span>
              <span className="font-mono">Expires {c.validUntil}</span>
            </div>
          </div>
        ))}
      </div>

      {modalOpen && (
        <div className="fixed inset-0 z-50 bg-muted/50 backdrop-blur-sm flex items-center justify-center p-4">
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
                  onChange={(e) => setForm({ ...form, code: e.target.value.toUpperCase() })}
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

              <div className="flex justify-end gap-2.5 pt-3 border-t border-border">
                <button
                  type="button"
                  onClick={() => setModalOpen(false)}
                  className="px-4 py-2 rounded-lg text-xs font-medium text-muted-foreground hover:text-foreground"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-lg text-xs font-medium bg-primary hover:bg-primary/90 text-primary-foreground"
                >
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

