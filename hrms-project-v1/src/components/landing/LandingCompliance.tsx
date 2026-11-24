"use client";

import { ShieldCheck, Lock, FileCheck, CheckCircle2, Building, Scale } from "lucide-react";
import ScrollReveal from "./ScrollReveal";

export default function LandingCompliance() {
  const complianceItems = [
    {
      title: "EPF Act 1952 Automation",
      description: "Automatic 12% employee and employer contribution calculations with statutory EPS split and wage ceiling compliance.",
      badge: "Statutory Law",
      icon: Scale,
    },
    {
      title: "ESIC Act 1948 Integration",
      description: "Exact 0.75% employee and 3.25% employer contributions with automated ₹21,000 monthly gross threshold evaluation.",
      badge: "Medical Security",
      icon: ShieldCheck,
    },
    {
      title: "State-Wise Professional Tax (PT)",
      description: "Pre-configured tax slabs for Maharashtra, Karnataka, Telangana, Tamil Nadu, and all Indian states with gender-specific rules.",
      badge: "State Slabs",
      icon: Building,
    },
    {
      title: "TDS & Form 16 Calculation",
      description: "Calculate accurate tax withholding under both Old & New tax regimes, factoring Section 80C declarations and standard deductions.",
      badge: "Income Tax",
      icon: FileCheck,
    },
    {
      title: "Immutable Activity Audit Trails",
      description: "Every organizational change, salary update, attendance edit, and shift swap is logged with actor ID, timestamp, and IP address.",
      badge: "Security Standard",
      icon: Lock,
    },
    {
      title: "256-Bit SSL & Bank Disbursal",
      description: "Enterprise-grade AES-256 cloud encryption at rest and in transit. Pre-formatted bank payout sheets for ICICI, HDFC, SBI.",
      badge: "Bank Grade",
      icon: CheckCircle2,
    },
  ];

  return (
    <section id="compliance" className="py-24 bg-white border-b border-slate-200/80">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">

        {/* Header */}
        <div className="text-center max-w-3xl mx-auto mb-16">
          <ScrollReveal delay={0}>
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full text-xs font-bold bg-emerald-50 text-emerald-800 border border-emerald-200 mb-3 shadow-2xs">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
              <span>Enterprise Statutory & Data Protection</span>
            </div>

            <h2 className="text-3xl sm:text-4xl md:text-5xl font-extrabold tracking-tight text-slate-900 leading-tight">
              100% Indian statutory compliance & audit safety
            </h2>

            <p className="mt-4 text-base sm:text-lg text-slate-600 leading-relaxed font-normal">
              Built specifically for Indian businesses. Eliminate compliance fines, statutory notices, and payroll calculation errors permanently.
            </p>
          </ScrollReveal>
        </div>

        {/* 6-Grid Matrix */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {complianceItems.map((item, idx) => {
            const Icon = item.icon;
            return (
              <ScrollReveal key={idx} delay={idx * 80}>
                <div className="p-6 bg-slate-50/60 rounded-2xl border border-slate-200 hover:border-slate-300 hover:shadow-xs transition-all duration-200 h-full flex flex-col justify-between">
                  <div>
                    <div className="flex items-center justify-between mb-4">
                      <div className="w-10 h-10 rounded-xl bg-white border border-slate-200 text-sky-700 flex items-center justify-center shadow-2xs">
                        <Icon className="w-5 h-5" />
                      </div>
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-white text-slate-600 border border-slate-200">
                        {item.badge}
                      </span>
                    </div>

                    <h3 className="text-base font-bold text-slate-900">
                      {item.title}
                    </h3>

                    <p className="text-xs sm:text-sm text-slate-600 mt-2 leading-relaxed">
                      {item.description}
                    </p>
                  </div>

                  <div className="mt-5 pt-3 border-t border-slate-200/80 flex items-center gap-1.5 text-xs font-semibold text-emerald-700">
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    <span>Verified Compliant</span>
                  </div>
                </div>
              </ScrollReveal>
            );
          })}
        </div>

      </div>
    </section>
  );
}
