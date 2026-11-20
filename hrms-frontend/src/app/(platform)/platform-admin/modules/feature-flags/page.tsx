"use client";

import { useCallback, useEffect, useState } from "react";
import {
  Flag,
  CheckCircle2,
  XCircle,
  RefreshCw,
  Plus,
  X,
  Loader2,
} from "lucide-react";
import { platformApi } from "@/lib/platform-api";

interface FeatureFlag {
  id: string;
  key: string;
  name: string;
  description: string | null;
  isEnabled: boolean;
  isBeta: boolean;
  rolloutPct: number;
  createdAt: string;
  updatedAt: string;
}

export default function FeatureFlagsPage() {
  const [flags, setFlags] = useState<FeatureFlag[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState<string | null>(null);
  const [createOpen, setCreateOpen] = useState(false);
  const [form, setForm] = useState({ key: "", name: "", description: "" });
  const [error, setError] = useState<string | null>(null);

  const fetchFlags = useCallback(async () => {
    setIsLoading(true);
    try {
      const res = await platformApi.get("/platform/feature-flags");
      setFlags(res.data?.data || []);
      setError(null);
    } catch (err) {
      console.error("Failed to load feature flags", err);
      setError("Could not load feature flags from the server.");
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchFlags();
  }, [fetchFlags]);

  const toggleFlag = async (flag: FeatureFlag) => {
    setIsSaving(flag.id);
    try {
      await platformApi.patch(`/platform/feature-flags/${flag.id}`, {
        isEnabled: !flag.isEnabled,
      });
      await fetchFlags();
    } catch (err: any) {
      console.error("Failed to toggle flag", err);
      alert(
        err?.response?.data?.message ||
          "Failed to toggle feature flag. Super Admin role required."
      );
    } finally {
      setIsSaving(null);
    }
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await platformApi.post("/platform/feature-flags", {
        key: form.key.trim().toUpperCase(),
        name: form.name.trim(),
        description: form.description.trim(),
        isEnabled: false,
      });
      setCreateOpen(false);
      setForm({ key: "", name: "", description: "" });
      await fetchFlags();
    } catch (err: any) {
      console.error("Failed to create flag", err);
      alert(
        err?.response?.data?.message || "Failed to create feature flag."
      );
    }
  };

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-6xl mx-auto space-y-6 pb-16">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
            <Flag className="h-5 w-5 text-primary" />
            Feature Flags
          </h1>
          <p className="text-xs text-muted-foreground mt-1">
            Global runtime switches stored in the platform database. Toggling
            takes effect immediately for all tenants.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={fetchFlags}
            className="p-2 rounded-lg border border-border text-muted-foreground hover:text-foreground hover:bg-muted"
            title="Refresh"
          >
            <RefreshCw className={`h-4 w-4 ${isLoading ? "animate-spin" : ""}`} />
          </button>
          <button
            onClick={() => setCreateOpen(true)}
            className="flex items-center gap-2 px-4 py-2 text-xs font-semibold bg-primary text-primary-foreground rounded-xl hover:bg-primary/90"
          >
            <Plus className="h-4 w-4" />
            New Flag
          </button>
        </div>
      </div>

      {error && (
        <div className="p-4 rounded-xl border border-destructive/30 bg-destructive/10 text-xs text-destructive flex items-center gap-2">
          <XCircle className="h-4 w-4" />
          {error}
        </div>
      )}

      {isLoading ? (
        <div className="py-16 flex justify-center">
          <Loader2 className="h-7 w-7 animate-spin text-muted-foreground" />
        </div>
      ) : flags.length === 0 ? (
        <div className="p-10 text-center rounded-2xl border border-dashed border-border bg-card">
          <Flag className="h-8 w-8 text-muted-foreground mx-auto mb-2" />
          <p className="text-sm text-muted-foreground">
            No feature flags defined yet.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-3">
          {flags.map((flag) => (
            <div
              key={flag.id}
              className="rounded-2xl border border-border bg-card p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-3"
            >
              <div className="min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <h3 className="text-sm font-bold text-foreground">{flag.name}</h3>
                  <code className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-muted text-muted-foreground">
                    {flag.key}
                  </code>
                  {flag.isBeta && (
                    <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-full bg-status-yellow/15 text-status-yellow border border-status-yellow/25">
                      BETA
                    </span>
                  )}
                </div>
                {flag.description && (
                  <p className="text-xs text-muted-foreground mt-1">{flag.description}</p>
                )}
                <p className="text-[10px] text-muted-foreground mt-1">
                  Updated {new Date(flag.updatedAt).toLocaleString()} · rollout {flag.rolloutPct}%
                </p>
              </div>

              <button
                onClick={() => toggleFlag(flag)}
                disabled={isSaving === flag.id}
                className={`shrink-0 inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold border transition-all disabled:opacity-60 ${
                  flag.isEnabled
                    ? "bg-status-green/15 text-status-green border-status-green/30"
                    : "bg-muted text-muted-foreground border-border"
                }`}
              >
                {isSaving === flag.id ? (
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                ) : flag.isEnabled ? (
                  <CheckCircle2 className="h-3.5 w-3.5" />
                ) : (
                  <XCircle className="h-3.5 w-3.5" />
                )}
                {flag.isEnabled ? "Enabled" : "Disabled"}
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Create modal */}
      {createOpen && (
        <div className="fixed inset-0 z-50 bg-background/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="w-full max-w-md rounded-2xl bg-card border border-border p-6 shadow-2xl relative">
            <button
              onClick={() => setCreateOpen(false)}
              className="absolute right-4 top-4 p-2 rounded-lg text-muted-foreground hover:text-foreground"
            >
              <X className="h-4 w-4" />
            </button>
            <h3 className="text-base font-bold text-foreground mb-4">New Feature Flag</h3>
            <form onSubmit={handleCreate} className="space-y-3 text-xs">
              <div>
                <label className="block text-foreground font-medium mb-1">Key</label>
                <input
                  required
                  value={form.key}
                  onChange={(e) => setForm({ ...form, key: e.target.value })}
                  placeholder="E.g. WHATSAPP_ATTENDANCE_BOT"
                  className="w-full px-3 py-2 rounded-lg bg-card border border-border text-foreground focus:outline-none focus:ring-1 focus:ring-primary font-mono"
                />
              </div>
              <div>
                <label className="block text-foreground font-medium mb-1">Name</label>
                <input
                  required
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  placeholder="WhatsApp Attendance Check-In"
                  className="w-full px-3 py-2 rounded-lg bg-card border border-border text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
                />
              </div>
              <div>
                <label className="block text-foreground font-medium mb-1">Description</label>
                <textarea
                  rows={3}
                  value={form.description}
                  onChange={(e) => setForm({ ...form, description: e.target.value })}
                  className="w-full px-3 py-2 rounded-lg bg-card border border-border text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
                />
              </div>
              <button
                type="submit"
                className="w-full py-2.5 rounded-xl bg-primary text-primary-foreground font-semibold hover:bg-primary/90 flex items-center justify-center gap-2"
              >
                <Plus className="h-3.5 w-3.5" />
                Create Flag
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
