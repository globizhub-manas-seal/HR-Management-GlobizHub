"use client";

import Link from "next/link";
import { ArrowRight, CheckCircle2, Smartphone, Calendar, FileText } from "lucide-react";
import ScrollReveal from "./ScrollReveal";

export default function LandingMobileApp() {
  return (
    <div>
      {/* Top Part: Mobile Self-Service Showcase (From Copy Document) */}
      <section className="py-16 md:py-24 bg-white border-t border-slate-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-14 items-center">
            
            {/* Left Column: Copy & Checklist */}
            <div className="lg:col-span-6 space-y-5 text-left">
              
              {/* Pill Eyebrow */}
              <ScrollReveal delay={0}>
                <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full text-xs font-bold bg-amber-50 text-amber-900 border border-amber-200">
                  <Smartphone className="w-3.5 h-3.5 text-amber-600" />
                  <span>MOBILE SELF-SERVICE</span>
                </div>
              </ScrollReveal>

              {/* Heading */}
              <ScrollReveal delay={100}>
                <h2 className="text-2xl sm:text-3xl md:text-4xl font-black text-slate-900 tracking-tight leading-tight">
                  HR in every employee&apos;s pocket
                </h2>
              </ScrollReveal>

              {/* Subtitle / Body */}
              <ScrollReveal delay={150}>
                <p className="text-sm sm:text-base text-slate-600 leading-relaxed font-normal">
                  Employees can handle their work day from a phone: clock in, apply for leave, check upcoming shifts, read announcements and download payslips.
                </p>
              </ScrollReveal>

              {/* Checkpoints */}
              <ScrollReveal delay={200}>
                <div className="space-y-3 pt-2 text-sm font-medium text-slate-800">
                  <div className="flex items-start gap-2.5">
                    <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
                    <span>Mobile clock-in with a daily work timer</span>
                  </div>
                  <div className="flex items-start gap-2.5">
                    <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
                    <span>Apply for leave and request shift swaps in a few taps</span>
                  </div>
                  <div className="flex items-start gap-2.5">
                    <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
                    <span>Monthly payslips always available</span>
                  </div>
                </div>
              </ScrollReveal>

              {/* Action Button */}
              <ScrollReveal delay={250}>
                <div className="pt-2">
                  <Link href="/login">
                    <button className="px-6 py-3 bg-[#F97316] hover:bg-[#EA580C] text-white rounded-lg text-sm font-bold shadow-sm hover:shadow-md transition-all cursor-pointer inline-flex items-center gap-2">
                      <span>Open Employee Portal</span>
                      <ArrowRight className="w-4 h-4" />
                    </button>
                  </Link>
                </div>
              </ScrollReveal>

            </div>

            {/* Right Column: Mobile Phone Mockup */}
            <div className="lg:col-span-6 flex justify-center">
              <ScrollReveal delay={200} direction="left">
                <div className="w-[300px] sm:w-[320px] rounded-[36px] bg-[#0E131F] border-[7px] border-slate-800 shadow-2xl p-5 text-white text-left relative overflow-hidden">
                  
                  {/* Phone Speaker Notch */}
                  <div className="w-24 h-4 bg-slate-800 rounded-full mx-auto mb-4" />

                  {/* Employee Greeting Header */}
                  <div className="flex items-center justify-between pb-4 border-b border-slate-800">
                    <div>
                      <div className="text-[10px] text-slate-400">Welcome back,</div>
                      <div className="text-sm font-bold text-white">Alex Rivera</div>
                    </div>
                    <div className="w-8 h-8 rounded-full bg-amber-500 text-white flex items-center justify-center font-bold text-xs">
                      AR
                    </div>
                  </div>

                  {/* Live Shift Timer */}
                  <div className="mt-6 text-center space-y-2">
                    <div className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                      LIVE SHIFT TIMER
                    </div>
                    <div className="text-2xl font-mono font-black text-white tracking-wider">
                      09:24:22 AM
                    </div>

                    {/* Circular Glowing Clocked In Button */}
                    <div className="py-4 flex justify-center">
                      <div className="w-28 h-28 rounded-full border-2 border-emerald-500/80 bg-emerald-950/40 flex flex-col items-center justify-center shadow-lg shadow-emerald-500/20 cursor-pointer">
                        <div className="w-7 h-7 text-emerald-400 mb-1">
                          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M12 2v10" />
                            <path d="M18.4 6.6a9 9 0 1 1-12.77.04" />
                          </svg>
                        </div>
                        <span className="text-xs font-bold text-emerald-400">Clocked In</span>
                      </div>
                    </div>
                  </div>

                  {/* Bottom 2 Action Cards */}
                  <div className="mt-4 grid grid-cols-2 gap-2.5">
                    <div className="p-3 bg-slate-900/90 rounded-xl border border-slate-800 text-center cursor-pointer hover:border-slate-700 transition-colors">
                      <Calendar className="w-4 h-4 text-amber-500 mx-auto mb-1" />
                      <div className="text-[11px] font-bold text-slate-200">Request Leave</div>
                    </div>
                    <div className="p-3 bg-slate-900/90 rounded-xl border border-slate-800 text-center cursor-pointer hover:border-slate-700 transition-colors">
                      <FileText className="w-4 h-4 text-amber-500 mx-auto mb-1" />
                      <div className="text-[11px] font-bold text-slate-200">My Payslips</div>
                    </div>
                  </div>

                </div>
              </ScrollReveal>
            </div>

          </div>

        </div>
      </section>

      {/* Bottom Part: Deep Navy Stats Strip with Rupee (₹) */}
      <section className="bg-[#0B0F19] text-white py-14 border-t border-b border-slate-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-8 text-center">
            
            {/* Stat 1: ₹1,000 Cr+ */}
            <ScrollReveal delay={0}>
              <div className="p-4 rounded-xl bg-slate-900/50 border border-slate-800/80">
                <div className="text-3xl sm:text-4xl font-black text-[#F59E0B] tracking-tight">
                  ₹1,000 Cr+
                </div>
                <div className="text-[10px] sm:text-xs font-bold text-slate-400 uppercase tracking-widest mt-2">
                  ANNUAL PAYOUTS DISBURSED
                </div>
              </div>
            </ScrollReveal>

            {/* Stat 2: 99.98% */}
            <ScrollReveal delay={100}>
              <div className="p-4 rounded-xl bg-slate-900/50 border border-slate-800/80">
                <div className="text-3xl sm:text-4xl font-black text-[#10B981] tracking-tight">
                  99.98%
                </div>
                <div className="text-[10px] sm:text-xs font-bold text-slate-400 uppercase tracking-widest mt-2">
                  ON-TIME SLA SETTLEMENT
                </div>
              </div>
            </ScrollReveal>

            {/* Stat 3: 150+ */}
            <ScrollReveal delay={200}>
              <div className="p-4 rounded-xl bg-slate-900/50 border border-slate-800/80">
                <div className="text-3xl sm:text-4xl font-black text-[#F8FAFC] tracking-tight">
                  150+
                </div>
                <div className="text-[10px] sm:text-xs font-bold text-slate-400 uppercase tracking-widest mt-2">
                  STATUTORY JURISDICTIONS
                </div>
              </div>
            </ScrollReveal>

            {/* Stat 4: 0% */}
            <ScrollReveal delay={300}>
              <div className="p-4 rounded-xl bg-slate-900/50 border border-slate-800/80">
                <div className="text-3xl sm:text-4xl font-black text-[#F97316] tracking-tight">
                  0%
                </div>
                <div className="text-[10px] sm:text-xs font-bold text-slate-400 uppercase tracking-widest mt-2">
                  HIDDEN PLATFORM FEES
                </div>
              </div>
            </ScrollReveal>

          </div>
        </div>
      </section>
    </div>
  );
}
