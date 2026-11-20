"use client";

import { useCallback, useEffect, useState } from "react";
import {
  Settings,
  Save,
  CheckCircle2,
  Loader2,
  IndianRupee,
  Users,
  Hourglass,
  ShieldCheck,
  Mail,
  Server,
  AlertTriangle,
  RefreshCw,
} from "lucide-react";
import { platformApi } from "@/lib/platform-api";

interface SystemConfig {
  currency: string;
  pricePerUserPerMonth: number;
  invoiceDueDays: number;
  gracePeriodDays: number;
  minUsersPerInvoice: number;
  gstPercent: number;
  invoicePrefix: string;
  paymentGateway: string;
  freemiumMaxUsers: number;
  requireBusinessEmail: boolean;
  freeEmailDomains: string;
  trialDays: number;
  maxUsersHardCap: number;
  selfSignupEnabled: boolean;
  publicCareersPage: boolean;
  updatedAt: string;
  updatedBy: string | null;
}

const TABS = [
  { key: "billing", label: "Pricing & Billing", icon: IndianRupee },
  { key: "freemium", label: "Freemium & Trials", icon: Users },
  { key: "access", label: "Access & Domains", icon: ShieldCheck },
] as const;

export default function PlatformSettingsPage() {
  const [activeTab, setActiveTab] = useState<(typeof TABS)[number]["key"]>("billing");
  const [config, setConfig] = useState<SystemConfig | null>(null);
  const [draft, setDraft] = useState<Partial<SystemConfig>>({});
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [saveMessage, setSaveMessage] = useState<{ ok: boolean; text: string } | null>(null);

  const fetchConfig = useCallback(async () => {
    setIsLoading(true);
    try {
      const res = await platformApi.get("/platform/settings");
      setConfig(res.data);
      setDraft({});
      setSaveMessage(null);
    } catch (err: any) {
      console.error("Failed to load system config", err);
      setSaveMessage({
        ok: false,
        text:
          err?.response?.data?.message ||
          "Failed to load configuration. Super Admin access is required to make changes.",
      });
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchConfig();
  }, [fetchConfig]);

  const set = <K extends keyof SystemConfig>(key: K, value: SystemConfig[K]) => {
    setDraft((prev) => ({ ...prev, [key]: value }));
  };

  const handleSave = async () => {
    setIsSaving(true);
    setSaveMessage(null);
    try {
      // Coerce numeric strings before sending
      const payload: Record<string, any> = { ...draft };
      for (const k of [
        "pricePerUserPerMonth",
        "invoiceDueDays",
        "gracePeriodDays",
        "minUsersPerInvoice",
        "gstPercent",
        "freemiumMaxUsers",
        "trialDays",
        "maxUsersHardCap",
      ]) {
        if (payload[k] !== undefined && payload[k] !== "") {
          payload[k] = Number(payload[k]);
        }
      }
      const res = await platformApi.put("/platform/settings", payload);
      setConfig(res.data);
      setDraft({});
      setSaveMessage({ ok: true, text: "Configuration saved. Changes apply platform-wide immediately." });
    } catch (err: any) {
      console.error("Failed to save config", err);
      setSaveMessage({
        ok: false,
        text: err?.response?.data?.message || "Failed to save configuration.",
      });
    } finally {
      setIsSaving(false);
    }
  };

  const val = <K extends keyof SystemConfig>(key: K): SystemConfig[K] =>
    (draft[key] !== undefined ? draft[key] : config?.[key]) as SystemConfig[K];

  if (isLoading) {
    return (
      <div className="py-16 flex justify-center">
        <Loader2 className="h-7 w-7 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!config) {
    return (
      <div className="p-8 text-center rounded-2xl border border-dashed border-border bg-card">
        <AlertTriangle className="h-8 w-8 text-destructive mx-auto mb-2" />
        <p className="text-sm text-foreground font-semibold">Configuration unavailable</p>
        <p className="text-xs text-muted-foreground mt-1">{saveMessage?.text || "Please try again."}</p>
        <button
          onClick={fetchConfig}
          className="mt-4 px-4 py-2 text-xs font-semibold bg-primary text-primary-foreground rounded-xl"
        >
          Retry
        </button>
      </div>
    );
  }

  const hasChanges = Object.keys(draft).length > 0;

  return (
    <div className="space-y-6 max-w-5xl">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 flex-wrap">
            <h1 className="text-2xl font-bold tracking-tight text-foreground">System Config Console</h1>
            <span className="text-xs font-mono font-medium px-2 py-0.5 rounded-full bg-primary/15 text-primary border border-primary/25">
              Single Source of Truth
            </span>
          </div>
          <p className="text-sm text-muted-foreground mt-1">
            Every price, limit and policy in the product reads from this configuration — nothing is
            hardcoded. Changes apply immediately (Super Admin only).
          </p>
          {config.updatedBy && (
            <p className="text-[10px] text-muted-foreground mt-1 font-mono">
              Last updated by {config.updatedBy} · {new Date(config.updatedAt).toLocaleString()}
            </p>
          )}
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={fetchConfig}
            className="p-2 rounded-lg border border-border text-muted-foreground hover:text-foreground hover:bg-muted"
            title="Reload from database"
          >
            <RefreshCw className="h-4 w-4" />
          </button>
          <button
            onClick={handleSave}
            disabled={!hasChanges || isSaving}
            className="flex items-center gap-2 px-4 py-2 text-xs font-semibold bg-primary text-primary-foreground rounded-xl hover:bg-primary/90 disabled:opacity-50"
          >
            {isSaving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
            {isSaving ? "Saving…" : "Save Changes"}
          </button>
        </div>
      </div>

      {saveMessage && (
        <div
          className={`p-3 rounded-xl border text-xs flex items-center gap-2 ${
            saveMessage.ok
              ? "bg-status-green/10 border-status-green/30 text-status-green"
              : "bg-destructive/10 border-destructive/30 text-destructive"
          }`}
        >
          {saveMessage.ok ? <CheckCircle2 className="h-4 w-4" /> : <AlertTriangle className="h-4 w-4" />}
          {saveMessage.text}
        </div>
      )}

      {/* Tabs */}
      <div className="flex gap-2 border-b border-border overflow-x-auto pb-px">
        {TABS.map(({ key, label, icon: Icon }) => (
          <button
            key={key}
            onClick={() => setActiveTab(key)}
            className={`flex items-center gap-2 px-4 py-2.5 text-xs font-semibold rounded-t-lg border-b-2 transition-colors whitespace-nowrap ${
              activeTab === key
                ? "border-primary text-foreground bg-primary/5"
                : "border-transparent text-muted-foreground hover:text-foreground"
            }`}
          >
            <Icon className="h-3.5 w-3.5" />
            {label}
          </button>
        ))}
      </div>

      {/* Billing tab */}
      {activeTab === "billing" && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Field
            label="Price per user per month (₹)"
            hint="Used for every tenant checkout and monthly invoice. Currently ₹49/user/month as agreed."
            value={String(val("pricePerUserPerMonth"))}
            onChange={(v) => set("pricePerUserPerMonth", v as any)}
            type="number"
            icon={IndianRupee}
          />
          <Field
            label="Currency"
            hint="ISO currency code for all invoices and checkout orders."
            value={val("currency")}
            onChange={(v) => set("currency", v)}
            icon={Server}
          />
          <Field
            label="Invoice due days"
            hint="Days between invoice issue and due date (default 7)."
            value={String(val("invoiceDueDays"))}
            onChange={(v) => set("invoiceDueDays", v as any)}
            type="number"
            icon={Hourglass}
          />
          <Field
            label="Grace period days"
            hint="After the due date, tenants keep full access for this many days before being locked to billing pages."
            value={String(val("gracePeriodDays"))}
            onChange={(v) => set("gracePeriodDays", v as any)}
            type="number"
            icon={Hourglass}
          />
          <Field
            label="Minimum users per invoice"
            hint="Even a single active employee is billed at least this many seats (default 1)."
            value={String(val("minUsersPerInvoice"))}
            onChange={(v) => set("minUsersPerInvoice", v as any)}
            type="number"
            icon={Users}
          />
          <Field
            label="GST percent"
            hint="GST rate shown on tax invoices (default 18%)."
            value={String(val("gstPercent"))}
            onChange={(v) => set("gstPercent", v as any)}
            type="number"
            icon={IndianRupee}
          />
          <Field
            label="Invoice number prefix"
            hint="Prefix for generated invoice numbers, e.g. INV-2026-00001."
            value={val("invoicePrefix")}
            onChange={(v) => set("invoicePrefix", v)}
            icon={Server}
          />
          <Field
            label="Payment gateway"
            hint="RAZORPAY (default) is used for tenant checkout; MANUAL enables bank-transfer settlements."
            value={val("paymentGateway")}
            onChange={(v) => set("paymentGateway", v)}
            icon={Server}
          />
        </div>
      )}

      {/* Freemium tab */}
      {activeTab === "freemium" && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Field
            label="Freemium max users"
            hint="Hard cap of active users on the free plan — enforced on invites, bulk imports, wizard onboarding and candidate conversion. Agreed default: 5."
            value={String(val("freemiumMaxUsers"))}
            onChange={(v) => set("freemiumMaxUsers", v as any)}
            type="number"
            icon={Users}
          />
          <Field
            label="Free trial days"
            hint="Full-feature trial granted to every new organization before auto-downgrading to freemium. Agreed default: 7."
            value={String(val("trialDays"))}
            onChange={(v) => set("trialDays", v as any)}
            type="number"
            icon={Hourglass}
          />
          <Field
            label="Platform-wide hard cap (users)"
            hint="Absolute maximum users per organization across all plans. Protects infrastructure."
            value={String(val("maxUsersHardCap"))}
            onChange={(v) => set("maxUsersHardCap", v as any)}
            type="number"
            icon={Users}
          />
          <ToggleField
            label="Require business email for freemium"
            hint="When on, freemium organizations can only add users on non-personal email domains (see Access tab). Agreed: on."
            value={Boolean(val("requireBusinessEmail"))}
            onChange={(v) => set("requireBusinessEmail", v)}
            icon={Mail}
          />
        </div>
      )}

      {/* Access tab */}
      {activeTab === "access" && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <ToggleField
            label="Allow public self-signup"
            hint="Organizations can register through the public wizard. Turn off to require platform onboarding only."
            value={Boolean(val("selfSignupEnabled"))}
            onChange={(v) => set("selfSignupEnabled", v)}
            icon={ShieldCheck}
          />
          <ToggleField
            label="Public careers page"
            hint="Expose the /careers public job board for tenant organizations."
            value={Boolean(val("publicCareersPage"))}
            onChange={(v) => set("publicCareersPage", v)}
            icon={ShieldCheck}
          />
          <div className="md:col-span-2">
            <label className="block text-sm font-medium text-foreground mb-1.5">
              Blocked personal email domains
            </label>
            <textarea
              rows={4}
              value={val("freeEmailDomains")}
              onChange={(e) => set("freeEmailDomains", e.target.value)}
              className="w-full px-3 py-2 rounded-lg bg-card border border-border text-xs text-foreground font-mono focus:outline-none focus:ring-1 focus:ring-primary"
            />
            <p className="text-[11px] text-muted-foreground mt-1.5">
              Comma-separated list of free/personal providers (gmail.com, yahoo.com, outlook.com…)
              rejected at registration and for freemium invites. Everything else is treated as a
              verified business domain after email-OTP confirmation.
            </p>
          </div>
        </div>
      )}

      {/* Sticky save bar */}
      {hasChanges && (
        <div className="sticky bottom-4 rounded-2xl border border-primary/40 bg-card p-4 shadow-xl flex flex-col sm:flex-row items-center justify-between gap-3">
          <p className="text-xs text-foreground font-medium flex items-center gap-2">
            <AlertTriangle className="h-4 w-4 text-status-yellow" />
            {Object.keys(draft).length} unsaved change{Object.keys(draft).length > 1 ? "s" : ""} —
            these take effect for every organization immediately.
          </p>
          <div className="flex gap-2">
            <button
              onClick={() => setDraft({})}
              className="px-4 py-2 text-xs font-semibold rounded-xl border border-border text-muted-foreground hover:bg-muted"
            >
              Discard
            </button>
            <button
              onClick={handleSave}
              disabled={isSaving}
              className="flex items-center gap-2 px-5 py-2 text-xs font-semibold bg-primary text-primary-foreground rounded-xl hover:bg-primary/90 disabled:opacity-60"
            >
              {isSaving ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Save className="h-3.5 w-3.5" />}
              Save & Apply
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

function Field({
  label,
  hint,
  value,
  onChange,
  type = "text",
  icon: Icon,
}: {
  label: string;
  hint?: string;
  value: string;
  onChange: (v: string) => void;
  type?: string;
  icon?: React.ComponentType<{ className?: string }>;
}) {
  return (
    <div className="rounded-xl border border-border bg-card p-4">
      <label className="flex items-center gap-2 text-sm font-medium text-foreground mb-1">
        {Icon && <Icon className="h-3.5 w-3.5 text-primary" />}
        {label}
      </label>
      <input
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full px-3 py-2 rounded-lg bg-background border border-border text-xs text-foreground font-mono focus:outline-none focus:ring-1 focus:ring-primary"
      />
      {hint && <p className="text-[11px] text-muted-foreground mt-1.5 leading-relaxed">{hint}</p>}
    </div>
  );
}

function ToggleField({
  label,
  hint,
  value,
  onChange,
  icon: Icon,
}: {
  label: string;
  hint?: string;
  value: boolean;
  onChange: (v: boolean) => void;
  icon?: React.ComponentType<{ className?: string }>;
}) {
  return (
    <div className="rounded-xl border border-border bg-card p-4 flex items-start justify-between gap-4">
      <div>
        <label className="flex items-center gap-2 text-sm font-medium text-foreground">
          {Icon && <Icon className="h-3.5 w-3.5 text-primary" />}
          {label}
        </label>
        {hint && <p className="text-[11px] text-muted-foreground mt-1.5 leading-relaxed max-w-md">{hint}</p>}
      </div>
      <button
        type="button"
        onClick={() => onChange(!value)}
        className={`shrink-0 relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
          value ? "bg-primary" : "bg-muted"
        }`}
        role="switch"
        aria-checked={value}
      >
        <span
          className={`inline-block h-4 w-4 transform rounded-full bg-white shadow transition-transform ${
            value ? "translate-x-6" : "translate-x-1"
          }`}
        />
      </button>
    </div>
  );
}
