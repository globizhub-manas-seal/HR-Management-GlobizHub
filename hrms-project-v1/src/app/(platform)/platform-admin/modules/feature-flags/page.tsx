"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  Flag,
  CheckCircle2,
  XCircle,
  ShieldCheck,
  RefreshCw,
  Plus,
  X,
  SlidersHorizontal,
} from "lucide-react";
import { platformApi } from "@/lib/platform-api";

export default function FeatureFlagsPage() {
  const [flags, setFlags] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // In production, feature flags are defined at system level
  const defaultFlags = [
    {
      key: "SAAS_SELF_ONBOARDING",
      name: "Public Self-Service Registration",
      description: "Allow organizations to sign up directly through the public landing page without manual approval.",
      enabled: true,
      category: "Growth & Acquisition",
    },
    {
      key: "AI_RESUME_PARSER",
      name: "AI Recruitment Resume Parser",
      description: "Automated candidate extraction from PDF resumes in recruitment pipeline using Gemini API.",
      enabled: true,
      category: "AI & Innovation",
    },
    {
      key: "MULTI_CURRENCY_BILLING",
      name: "Multi-Currency Billing (USD / EUR / INR)",
      description: "Allow international tenants to pay subscriptions in foreign currencies via Stripe.",
      enabled: false,
      category: "Payments",
    },
    {
      key: "WHATSAPP_ATTENDANCE_BOT",
      name: "WhatsApp Geo-Location Attendance Check-In",
      description: "Enable clock-in check-ins directly through the official WhatsApp business webhook integration.",
      enabled: false,
      category: "Mobile",
    },
    {
      key: "AUTOMATED_DUNNING_EMAILS",
      name: "Automated Dunning Reminders for Failed Payments",
      description: "Trigger automated transactional emails and Grace Period notifications upon Stripe invoice failures.",
      enabled: true,
      category: "Billing & Revenue",
    },
  ];

  useEffect(() => {
    // Simulate or load flags
    setIsLoading(false);
    setFlags(defaultFlags);
  }, []);

  const toggleFlag = (key: string) => {
    setFlags((prev) =>
      prev.map((f) => (f.key === key ? { ...f, enabled: !f.enabled } : f))
    );
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold tracking-tight text-foreground">Platform Feature Flags</h1>
            <span className="text-xs font-mono font-medium px-2 py-0.5 rounded-full bg-purple-500/10 text-purple-400 border border-purple-500/20">
              Platform Toggles
            </span>
          </div>
          <p className="text-sm text-muted-foreground mt-1">
            Global toggle switches to dynamically enable, beta-test, or canary-rollout experimental features across all SaaS tenants.
          </p>
        </div>

        <Link
          href="/platform-admin/modules"
          className="flex items-center gap-2 px-3.5 py-2 text-xs font-medium text-foreground bg-card border border-border hover:bg-muted rounded-lg transition-colors"
        >
          <SlidersHorizontal className="h-3.5 w-3.5" />
          View HRMS Modules
        </Link>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {flags.map((flag) => (
          <div
            key={flag.key}
            className="rounded-xl border border-border bg-card p-5 flex flex-col justify-between hover:border-primary/40 transition-all shadow-lg"
          >
            <div>
              <div className="flex items-start justify-between gap-3 mb-2">
                <div>
                  <span className="text-[10px] font-semibold uppercase tracking-wider text-purple-400">
                    {flag.category}
                  </span>
                  <h3 className="font-semibold text-foreground text-sm mt-0.5">{flag.name}</h3>
                  <code className="font-mono text-[10px] text-muted-foreground block mt-0.5">{flag.key}</code>
                </div>
                <button
                  type="button"
                  onClick={() => toggleFlag(flag.key)}
                  className={`relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                    flag.enabled ? "bg-emerald-500" : "bg-slate-700"
                  }`}
                >
                  <span
                    className={`inline-block h-5 w-5 transform rounded-full bg-white shadow transition duration-200 ease-in-out ${
                      flag.enabled ? "translate-x-5" : "translate-x-0"
                    }`}
                  />
                </button>
              </div>

              <p className="text-xs text-muted-foreground leading-relaxed mt-2">{flag.description}</p>
            </div>

            <div className="pt-3 mt-4 border-t border-border flex items-center justify-between text-[11px]">
              <span className="text-muted-foreground">Status</span>
              <span
                className={`font-semibold ${
                  flag.enabled ? "text-status-green" : "text-muted-foreground"
                }`}
              >
                {flag.enabled ? "Enabled for all tenants" : "Disabled"}
              </span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

