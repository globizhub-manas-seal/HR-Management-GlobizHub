"use client";

import Link from "next/link";
import { ArrowRight, CheckCircle2, ShieldCheck } from "lucide-react";
import ScrollReveal from "./ScrollReveal";

export default function LandingBuiltForIndia() {
  const points = [
    "EPF, ESI, Professional Tax and TDS in payroll",
    "Salary structures with Basic, HRA and allowances",
    "Loss of Pay calculated automatically from leave records",
    "Holiday calendars for your offices and states",
    "Pricing in ₹, with GST invoices",
  ];

  return (
    <section className="py-16 md:py-24 bg-[#FAFAFA] border-t border-slate-100">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
          
          {/* Left Column: Copy */}
          <div className="lg:col-span-7 space-y-5 text-left">
            <ScrollReveal delay={0}>
              <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full text-xs font-bold bg-amber-50 text-amber-900 border border-amber-200">
                <ShieldCheck className="w-3.5 h-3.5 text-amber-600" />
                <span>MADE FOR INDIAN BUSINESSES</span>
              </div>
            </ScrollReveal>

            <ScrollReveal delay={100}>
              <h2 className="text-3xl sm:text-4xl md:text-5xl font-black text-slate-900 tracking-tight leading-tight">
                Payroll that understands Indian compliance
              </h2>
            </ScrollReveal>

            <ScrollReveal delay={150}>
              <p className="text-sm sm:text-base text-slate-600 leading-relaxed font-normal max-w-2xl">
                GlobizHR is designed around how Indian companies actually pay and manage people, so you spend less time on spreadsheets and statutory work.
              </p>
            </ScrollReveal>

            <ScrollReveal delay={200}>
              <ul className="space-y-3 pt-2 text-sm font-semibold text-slate-800">
                {points.map((pt, idx) => (
                  <li key={idx} className="flex items-start gap-2.5">
                    <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
                    <span>{pt}</span>
                  </li>
                ))}
              </ul>
            </ScrollReveal>

            <ScrollReveal delay={250}>
              <div className="pt-3">
                <Link href="#payroll">
                  <button className="px-6 py-3 bg-[#F97316] hover:bg-[#EA580C] text-white rounded-xl text-sm font-bold shadow-sm hover:shadow-md transition-all cursor-pointer inline-flex items-center gap-2">
                    <span>See How Payroll Works</span>
                    <ArrowRight className="w-4 h-4" />
                  </button>
                </Link>
              </div>
            </ScrollReveal>
          </div>

          {/* Right Column: Visual Compliance Card */}
          <div className="lg:col-span-5">
            <ScrollReveal delay={150} direction="left">
              <div className="p-7 bg-white rounded-3xl border border-slate-200/90 shadow-xl shadow-slate-100 space-y-4 text-left">
                <div className="flex items-center justify-between pb-4 border-b border-slate-100">
                  <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">STATUTORY COMPLIANCE</span>
                  <span className="px-2.5 py-0.5 bg-emerald-50 text-emerald-700 text-xs font-bold rounded-full border border-emerald-200">
                    100% Indian Rules
                  </span>
                </div>

                <div className="space-y-3">
                  <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-100 flex items-center justify-between">
                    <div>
                      <div className="text-sm font-bold text-slate-900">Employees&apos; Provident Fund (EPF)</div>
                      <div className="text-xs text-slate-500">12% Employee + 12% Employer with ₹15,000 wage cap</div>
                    </div>
                    <span className="text-xs font-bold text-emerald-600">Automated</span>
                  </div>

                  <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-100 flex items-center justify-between">
                    <div>
                      <div className="text-sm font-bold text-slate-900">Employees&apos; State Insurance (ESIC)</div>
                      <div className="text-xs text-slate-500">0.75% Employee + 3.25% Employer with ₹21,000 threshold</div>
                    </div>
                    <span className="text-xs font-bold text-emerald-600">Automated</span>
                  </div>

                  <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-100 flex items-center justify-between">
                    <div>
                      <div className="text-sm font-bold text-slate-900">Professional Tax (PT) & TDS</div>
                      <div className="text-xs text-slate-500">State-wise PT slabs and Income Tax regime deductions</div>
                    </div>
                    <span className="text-xs font-bold text-emerald-600">Automated</span>
                  </div>
                </div>
              </div>
            </ScrollReveal>
          </div>

        </div>
      </div>
    </section>
  );
}
