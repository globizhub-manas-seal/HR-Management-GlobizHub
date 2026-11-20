"use client";

import Link from "next/link";
import { Check, Sparkles, Users } from "lucide-react";
import ScrollReveal from "@/components/ui/ScrollReveal";

/**
 * Public pricing section. Prices/limits shown here mirror the platform
 * SystemConfig defaults (₹49 per user / month, annual contract; freemium
 * limited to 5 users with verified business email).
 */
export default function PricingSection() {
  const freemiumFeatures = [
    "Up to 5 users with verified business emails",
    "Employee directory & org chart",
    "Attendance, leave & shift scheduling",
    "Document vault & e-signatures",
    "Tasks & company announcements",
  ];
  const paidFeatures = [
    "Unlimited users — billed monthly for actual seats",
    "Automated payroll with statutory compliance (EPF/ESI/PT/TDS)",
    "Recruitment ATS with careers page & offer management",
    "Training & competency management",
    "Priority support & invoiced billing via Razorpay",
  ];

  return (
    <section id="pricing" className="relative py-20 sm:py-28 bg-background overflow-hidden">
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full max-w-4xl h-64 bg-gradient-to-b from-primary/10 to-transparent blur-3xl pointer-events-none" />
      <div className="max-w-6xl mx-auto px-4 sm:px-6 relative z-10">
        <ScrollReveal animation="fade-up">
          <div className="text-center max-w-2xl mx-auto mb-12">
            <span className="inline-flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-widest text-primary font-mono px-3 py-1 rounded-full border border-primary/25 bg-primary/5">
              <Sparkles className="h-3 w-3" />
              Simple Pricing
            </span>
            <h2 className="text-3xl sm:text-4xl font-black tracking-tight text-foreground mt-4">
              ₹49 per user, per month
            </h2>
            <p className="text-sm sm:text-base text-muted-foreground mt-3 leading-relaxed">
              Billed annually with monthly invoicing for your actual active users. Start free — no
              credit card required.
            </p>
          </div>
        </ScrollReveal>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-4xl mx-auto">
          {/* Freemium */}
          <ScrollReveal animation="fade-up">
            <div className="h-full rounded-3xl border border-border bg-card p-6 sm:p-8 flex flex-col">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-bold text-foreground">Freemium</h3>
                <span className="text-[10px] font-bold px-2 py-1 rounded-full bg-muted text-muted-foreground">
                  FREE FOREVER
                </span>
              </div>
              <div className="mb-1">
                <span className="text-4xl font-black font-mono text-foreground">₹0</span>
                <span className="text-xs text-muted-foreground"> / month</span>
              </div>
              <p className="text-xs text-muted-foreground mt-1 mb-6">
                Everything a small team needs to run HR. Verify your business email and invite up to 5
                teammates.
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
                Start Free
              </Link>
            </div>
          </ScrollReveal>

          {/* Pay as you grow */}
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
                  ANNUAL CONTRACT
                </span>
              </div>
              <div className="mb-1">
                <span className="text-4xl font-black font-mono text-primary">₹49</span>
                <span className="text-xs text-muted-foreground"> / user / month</span>
              </div>
              <p className="text-xs text-muted-foreground mt-1 mb-6">
                Invoiced monthly for your actual active users. Add or remove people any time — your
                invoice follows reality.
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
                Start 7-Day Free Trial
              </Link>
            </div>
          </ScrollReveal>
        </div>

        <p className="text-center text-[11px] text-muted-foreground mt-6">
          Every limit, price and policy is controlled by the platform administrators — custom
          enterprise pricing available on request.
        </p>
      </div>
    </section>
  );
}
