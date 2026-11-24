"use client";

import Link from "next/link";
import { ArrowRight, CheckCircle2, Wallet, FileText, Download } from "lucide-react";
import ScrollReveal from "./ScrollReveal";

export default function LandingPayroll() {
  return (
    <section id="payroll" className="py-16 md:py-24 bg-white border-t border-slate-100">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-14 items-center">
          
          {/* Left Column: Monthly Payroll Execution Card */}
          <div className="lg:col-span-6">
            <ScrollReveal delay={100} direction="right">
              <div className="p-6 bg-white rounded-2xl border border-slate-200/90 shadow-lg shadow-slate-100">
                
                {/* Header with Title and Process Payroll Button */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-5 border-b border-slate-100 text-left">
                  <div>
                    <h3 className="text-base font-bold text-slate-900">Monthly Payroll Run</h3>
                    <p className="text-xs text-slate-500 mt-0.5">Automated salary components & loss-of-pay deductions</p>
                  </div>
                  <button className="self-start sm:self-center px-4 py-2 bg-[#F97316] hover:bg-[#EA580C] text-white text-xs font-bold rounded-lg shadow-2xs transition-colors cursor-pointer">
                    Process Payroll
                  </button>
                </div>

                {/* 3 Metric Value Boxes with INR (₹) */}
                <div className="mt-5 grid grid-cols-1 sm:grid-cols-3 gap-3 text-left">
                  
                  {/* Earnings (Basic + HRA) */}
                  <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200/80">
                    <div className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Earnings (Basic + HRA)</div>
                    <div className="text-base font-extrabold text-slate-900 mt-1">₹2,84,500</div>
                    <div className="text-[11px] text-slate-400 mt-0.5">Configured Formulas</div>
                  </div>

                  {/* Allowances and Bonuses */}
                  <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200/80">
                    <div className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Allowances and Bonuses</div>
                    <div className="text-base font-extrabold text-emerald-600 mt-1">₹42,300</div>
                    <div className="text-[11px] text-emerald-600 font-medium mt-0.5">Special Allowances</div>
                  </div>

                  {/* Deductions (Tax and Loss of Pay) */}
                  <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200/80">
                    <div className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Deductions (Tax & LOP)</div>
                    <div className="text-base font-extrabold text-rose-600 mt-1">-₹18,650</div>
                    <div className="text-[11px] text-rose-500 font-medium mt-0.5">Loss of Pay Adjusted</div>
                  </div>

                </div>

                {/* Bottom Download Payslip Banner */}
                <div className="mt-5 p-4 rounded-xl border border-orange-200 bg-orange-50/40 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-left">
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-lg bg-orange-100 text-orange-600 flex items-center justify-center shrink-0">
                      <FileText className="w-5 h-5" />
                    </div>
                    <div>
                      <div className="text-xs font-bold text-slate-900">Employee payslip PDF available</div>
                      <div className="text-[11px] text-slate-600 mt-0.5">Self-service payslip download in employee portal</div>
                    </div>
                  </div>
                  <button className="self-start sm:self-center px-3.5 py-1.5 bg-white border border-slate-300 hover:border-orange-300 text-slate-800 rounded-lg text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer shadow-2xs">
                    <Download className="w-3.5 h-3.5 text-orange-600" />
                    <span>Download PDF</span>
                  </button>
                </div>

              </div>
            </ScrollReveal>
          </div>

          {/* Right Column: Copy & Checklist (From Copy Document) */}
          <div className="lg:col-span-6 space-y-5 text-left">
            
            {/* Pill Eyebrow */}
            <ScrollReveal delay={0}>
              <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full text-xs font-bold bg-amber-50 text-amber-900 border border-amber-200">
                <Wallet className="w-3.5 h-3.5 text-amber-600" />
                <span>PAYROLL & PAYSLIPS</span>
              </div>
            </ScrollReveal>

            {/* Heading */}
            <ScrollReveal delay={100}>
              <h2 className="text-2xl sm:text-3xl md:text-4xl font-black text-slate-900 tracking-tight leading-tight">
                Payroll in one click, payslips in seconds
              </h2>
            </ScrollReveal>

            {/* Subtitle / Body */}
            <ScrollReveal delay={150}>
              <p className="text-sm sm:text-base text-slate-600 leading-relaxed font-normal">
                Build salary structures with Basic, HRA and allowances, and set up EPF, ESI, Professional Tax and TDS. Loss of Pay is deducted automatically for unapproved leave, and employees download their own payslips as PDFs.
              </p>
            </ScrollReveal>

            {/* Checkpoints */}
            <ScrollReveal delay={200}>
              <div className="space-y-3 pt-2 text-sm font-medium text-slate-800">
                <div className="flex items-start gap-2.5">
                  <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
                  <span>Customisable earnings and deductions</span>
                </div>
                <div className="flex items-start gap-2.5">
                  <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
                  <span>Automatic Loss of Pay from leave records</span>
                </div>
                <div className="flex items-start gap-2.5">
                  <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
                  <span>Payslip history and PDF download for every employee</span>
                </div>
              </div>
            </ScrollReveal>

            {/* Action Link / Button */}
            <ScrollReveal delay={250}>
              <div className="pt-2">
                <Link
                  href="/register"
                  className="inline-flex items-center gap-2 px-5 py-2.5 bg-[#F97316] hover:bg-[#EA580C] text-white rounded-lg text-sm font-bold shadow-2xs transition-colors"
                >
                  <span>See Payroll in Action</span>
                  <ArrowRight className="w-4 h-4" />
                </Link>
              </div>
            </ScrollReveal>

          </div>

        </div>

      </div>
    </section>
  );
}
