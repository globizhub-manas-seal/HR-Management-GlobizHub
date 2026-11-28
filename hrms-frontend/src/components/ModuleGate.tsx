"use client";

import Link from "next/link";
import { Lock, Sparkles, ArrowRight } from "lucide-react";
import { usePlanModules } from "@/context/PlanModulesContext";

const MODULE_LABELS: Record<string, string> = {
  payroll: "Payroll & statutory compliance",
  recruitment: "Recruitment ATS",
  training: "Training & competency",
  credentials: "Professional credentials",
  india: "India statutory (EPF/ESI/PT)",
  loans: "Loans & advances",
  reports: "Reports & exports",
  employees: "Employee directory",
  attendance: "Attendance",
  leave: "Leave management",
};

/**
 * Wrap any plan-gated page. Renders an upgrade prompt when the module is
 * not included in the tenant's current plan instead of letting the API
 * 403 land as an unexplained error.
 */
export default function ModuleGate({
  moduleKey,
  children,
}: {
  moduleKey: string;
  children: React.ReactNode;
}) {
  const { isEnabled, plan, loading } = usePlanModules();

  if (loading || isEnabled(moduleKey)) {
    return <>{children}</>;
  }

  return (
    <div className="min-h-[70vh] flex items-center justify-center p-4 sm:p-8">
      <div className="w-full max-w-md rounded-3xl border border-border bg-card p-8 text-center shadow-lg">
        <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-primary/10">
          <Lock className="h-7 w-7 text-primary" />
        </div>
        <h2 className="text-lg font-bold text-foreground">
          {MODULE_LABELS[moduleKey] ?? moduleKey} is not in your plan
        </h2>
        <p className="mt-2 text-sm text-muted-foreground leading-relaxed">
          Your current plan
          {plan ? ` (${plan.name})` : ""} does not include this module. Upgrade
          to unlock it for your whole workspace — your data stays intact.
        </p>
        <Link
          href="/workspace/settings/billing"
          className="mt-6 inline-flex items-center justify-center gap-2 rounded-xl bg-primary px-5 py-2.5 text-xs font-semibold text-primary-foreground hover:opacity-90 transition-opacity"
        >
          <Sparkles className="h-4 w-4" />
          View plans &amp; upgrade
          <ArrowRight className="h-4 w-4" />
        </Link>
        <p className="mt-3 text-[11px] text-muted-foreground">
          Per-user pricing billed annually — add or remove seats any time.
        </p>
      </div>
    </div>
  );
}
