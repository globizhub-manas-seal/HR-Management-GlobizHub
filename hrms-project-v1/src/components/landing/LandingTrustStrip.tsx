"use client";

import { ShieldCheck, CheckCircle2, Building, Zap, Lock, Award, Banknote, FileCheck } from "lucide-react";
import ScrollReveal from "./ScrollReveal";

export default function LandingTrustStrip() {
  const metrics = [
    {
      value: "10 Min",
      label: "Monthly Payroll Execution",
      detail: "Automated LOP, PF, ESIC & tax calculations with 1 click",
      icon: Zap,
    },
    {
      value: "100%",
      label: "Indian Statutory Compliance",
      detail: "Fully aligned with EPF, ESIC, State PT & TDS regulations",
      icon: ShieldCheck,
    },
    {
      value: "99.98%",
      label: "System Availability SLA",
      detail: "High-reliability cloud architecture with automatic backups",
      icon: Award,
    },
    {
      value: "85%",
      label: "Fewer Routine HR Inquiries",
      detail: "Self-service attendance, leave requests, and payslips",
      icon: CheckCircle2,
    },
  ];

  const standards = [
    "EPF Act 1952 Compliant",
    "ESIC Act 1948 Ready",
    "State-Wise Professional Tax (PT)",
    "TDS Form 16 Preparation",
    "Direct Bank Payout Files (NEFT/RTGS)",
    "Role-Based Access Control (RBAC)",
  ];

  return (
    <section className="bg-slate-50/70 border-b border-slate-200/80 py-16">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">

        {/* Metric Cards Row */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {metrics.map((item, idx) => {
            const Icon = item.icon;
            return (
              <ScrollReveal key={idx} delay={idx * 100}>
                <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-2xs hover:shadow-sm hover:border-slate-300 transition-all duration-200 h-full flex flex-col justify-between">
                  <div>
                    <div className="w-10 h-10 rounded-lg bg-sky-50 text-sky-700 flex items-center justify-center mb-4 border border-sky-100">
                      <Icon className="w-5 h-5" />
                    </div>
                    <div className="text-3xl font-extrabold text-slate-900 tracking-tight">
                      {item.value}
                    </div>
                    <h4 className="text-sm font-bold text-slate-800 mt-1">
                      {item.label}
                    </h4>
                  </div>
                  <p className="text-xs text-slate-500 mt-2 leading-relaxed">
                    {item.detail}
                  </p>
                </div>
              </ScrollReveal>
            );
          })}
        </div>

        {/* Regulatory & Enterprise Standards Strip */}
        <ScrollReveal delay={400}>
          <div className="mt-12 pt-8 border-t border-slate-200/80 flex flex-wrap items-center justify-center gap-y-3 gap-x-6 text-xs font-semibold text-slate-600">
            <span className="text-slate-400 uppercase tracking-wider text-[11px] font-bold">
              Built for Indian Enterprises:
            </span>
            {standards.map((std, i) => (
              <div key={i} className="flex items-center gap-1.5 bg-white px-3 py-1 rounded-full border border-slate-200 shadow-2xs text-slate-700">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                <span>{std}</span>
              </div>
            ))}
          </div>
        </ScrollReveal>

      </div>
    </section>
  );
}
