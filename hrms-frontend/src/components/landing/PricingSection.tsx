"use client";

import Link from "next/link";
import { Check, Sparkles, Users } from "lucide-react";
import ScrollReveal from "@/components/ui/ScrollReveal";
import { usePublicConfig } from "@/hooks/usePublicConfig";

/**
 * Public pricing section. Every number comes from the platform SystemConfig
 * (GET /platform/public/config via usePublicConfig) — when the super admin
 * changes the price, the freemium cap or the free-period length, this page
 * reflects it. No hardcoded amounts.
 */
export default function PricingSection() {
  const cfg = usePublicConfig();

  const fmt = (n: number) =>
    `${cfg.currency === "INR" ? "₹" : cfg.currency + " "}${
      Number.isInteger(n) ? n : n.toFixed(2)
    }`;

  const freemiumFeatures = [
    `Up to ${cfg.freemiumMaxUsers} users with verified business emails`,
    `Free for ${cfg.freemiumMonths} months — no credit card required`,
    "Employee directory, attendance, leave & shifts",
    "Document vault, tasks & announcements",
    "Keep everything when you upgrade",
  ];
  const paidFeatures = [
    `Unlimited seats — ${fmt(cfg.pricePerUserPerMonth)}/user/month, billed annually (${fmt(cfg.annualPerUser)}/user/year)`,
    "Seats added mid-term invoiced prorated to your contract end",
    "Automated payroll with statutory compliance (EPF/ESI/PT/TDS)",
    "Recruitment ATS, training & competency modules",
    "Priority support & Razorpay invoicing",
  ];

  return (
    <section id="pricing" className="relative py-16 sm:py-24 bg-background overflow-hidden">
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full max-w-4xl h-64 bg-gradient-to-b from-primary/10 to-transparent blur-3xl pointer-events-none" />
      <div className="max-w-6xl mx-auto px-4 sm:px-6 relative z-10">
        <ScrollReveal animation="fade-up">
          <div className="text-center max-w-2xl mx-auto mb-10 sm:mb-14">
            <span className="inline-flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-widest text-primary font-mono px-3 py-1 rounded-full border border-primary/25 bg-primary/5">
              <Sparkles className="h-3 w-3" />
              Simple Pricing
            </span>
            <h2 className="text-2xl sm:text-4xl font-black tracking-tight text-foreground mt-4">
              {fmt(cfg.pricePerUserPerMonth)} per user / month, billed annually
            </h2>
            <p className="text-sm sm:text-base text-muted-foreground mt-3 leading-relaxed">
              {fmt(cfg.annualPerUser)} per user per year ({cfg.contractMonths}-month contract). Start on
              the free plan — {cfg.freemiumMonths} months, {cfg.freemiumMaxUsers} users, upgrade when
              you&apos;re ready.
            </p>
          </div>
        </ScrollReveal>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-5 sm:gap-6 max-w-4xl mx-auto">
          {/* Freemium */}
          <ScrollReveal animation="fade-up">
            <div className="h-full rounded-3xl border border-border bg-card p-6 sm:p-8 flex flex-col">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-bold text-foreground">Free</h3>
                <span className="text-[10px] font-bold px-2 py-1 rounded-full bg-muted text-muted-foreground">
                  {cfg.freemiumMonths} MONTHS FREE
                </span>
              </div>
              <div className="mb-1">
                <span className="text-4xl font-black font-mono text-foreground">{fmt(0)}</span>
                <span className="text-xs text-muted-foreground"> / for {cfg.freemiumMonths} months</span>
              </div>
              <p className="text-xs text-muted-foreground mt-1 mb-6">
                Everything a small team needs to run HR. Verify your business email and invite up to{" "}
                {cfg.freemiumMaxUsers} teammates.
              </p>
              <ul className="space-y-2.5 text-xs text-foreground flex-1">
                {freemiumFeatures.map((f) => (
                  <li key={f} className="flex items-start gap-2">
                    <Check className="h-3.5 w-3.5 text-primary mt-0.5 shrink-0" />
                    {f}
                  </li>
                ))}
              </ul>
              <Link
                href="/register/wizard"
                className="mt-6 inline-flex justify-center px-5 py-2.5 rounded-xl text-xs font-semibold border border-border bg-card text-foreground hover:border-primary hover:text-primary transition-colors"
              >
                <Users className="h-4 w-4 mr-2" />
                Start Free — {cfg.freemiumMaxUsers} Users
              </Link>
            </div>
          </ScrollReveal>

          {/* Paid annual */}
          <ScrollReveal animation="fade-up" delay={100}>
            <div className="h-full rounded-3xl border-2 border-primary bg-gradient-to-br from-card via-card to-primary/10 p-6 sm:p-8 flex flex-col shadow-xl relative overflow-hidden">
              <div className="absolute top-4 right-4">
                <span className="text-[10px] font-bold px-2 py-1 rounded-full bg-primary text-primary-foreground">
                  RECOMMENDED
                </span>
              </div>
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-bold text-foreground">Pay As You Grow</h3>
                <span className="text-[10px] font-bold px-2 py-1 rounded-full bg-primary/15 text-primary">
                  {cfg.contractMonths}-MONTH CONTRACT
                </span>
              </div>
              <div className="mb-1">
                <span className="text-4xl font-black font-mono text-primary">{fmt(cfg.pricePerUserPerMonth)}</span>
                <span className="text-xs text-muted-foreground"> / user / month</span>
              </div>
              <p className="text-xs text-muted-foreground mt-1 mb-6">
                Billed annually at {fmt(cfg.annualPerUser)} per user ({cfg.contractMonths} months). Add people any
                time — new seats are billed annually from their start date, prorated to your contract.
              </p>
              <ul className="space-y-2.5 text-xs text-foreground flex-1">
                {paidFeatures.map((f) => (
                  <li key={f} className="flex items-start gap-2">
                    <Check className="h-3.5 w-3.5 text-primary mt-0.5 shrink-0" />
                    {f}
                  </li>
                ))}
              </ul>
              <Link
                href="/register/wizard"
                className="mt-6 inline-flex justify-center px-5 py-2.5 rounded-xl text-xs font-semibold bg-primary text-primary-foreground hover:bg-primary/90 transition-colors shadow-md"
              >
                Upgrade to Annual — {fmt(cfg.annualPerUser)}/user/yr
              </Link>
            </div>
          </ScrollReveal>
        </div>

        <p className="text-center text-[11px] text-muted-foreground mt-6">
          Every limit, price and policy is controlled by the platform administrators — custom enterprise
          pricing available on request. Prices exclude GST ({cfg.gstPercent}%).
        </p>
      </div>
    </section>
  );
}
