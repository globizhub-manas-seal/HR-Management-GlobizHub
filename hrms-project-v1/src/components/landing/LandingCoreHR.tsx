"use client";

import Link from "next/link";
import { ArrowRight, CheckCircle2, Briefcase } from "lucide-react";
import ScrollReveal from "./ScrollReveal";

export default function LandingCoreHR() {
  return (
    <section id="core-hr" className="py-16 md:py-24 bg-white border-t border-slate-100">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-14 items-center">
          
          {/* Left Column: Interactive Employee Directory Mockup */}
          <div className="lg:col-span-6">
            <ScrollReveal delay={100} direction="right">
              <div className="p-6 bg-white rounded-2xl border border-slate-200/90 shadow-lg shadow-slate-100">
                
                {/* Header with Title and RBAC Badge */}
                <div className="flex items-center justify-between pb-5 border-b border-slate-100">
                  <div className="text-left">
                    <h3 className="text-base font-bold text-slate-900">Employee Directory</h3>
                    <p className="text-xs text-slate-500 mt-0.5">Department & Designation Breakdown</p>
                  </div>
                  <span className="px-3 py-1 bg-slate-950 text-white rounded-md text-[11px] font-bold tracking-wider uppercase">
                    RBAC PROTECTED
                  </span>
                </div>

                {/* Employee Row 1: Alex Rivera */}
                <div className="mt-4 p-4 rounded-xl border border-slate-200/80 bg-white flex items-center justify-between hover:border-slate-300 transition-colors">
                  <div className="flex items-center gap-3.5 text-left">
                    <div className="w-10 h-10 rounded-full bg-amber-500 text-white flex items-center justify-center font-bold text-sm shadow-xs">
                      AR
                    </div>
                    <div>
                      <div className="text-sm font-bold text-slate-900">Alex Rivera</div>
                      <div className="text-xs text-slate-500">Engineering • Senior Full Stack Developer</div>
                    </div>
                  </div>
                  <span className="px-2.5 py-0.5 bg-emerald-50 text-emerald-700 border border-emerald-200 rounded-full text-xs font-semibold">
                    Active
                  </span>
                </div>

                {/* Employee Row 2: Sarah Davis */}
                <div className="mt-3 p-4 rounded-xl border border-slate-200/80 bg-white flex items-center justify-between hover:border-slate-300 transition-colors">
                  <div className="flex items-center gap-3.5 text-left">
                    <div className="w-10 h-10 rounded-full bg-blue-600 text-white flex items-center justify-center font-bold text-sm shadow-xs">
                      SD
                    </div>
                    <div>
                      <div className="text-sm font-bold text-slate-900">Sarah Davis</div>
                      <div className="text-xs text-slate-500">Human Resources • HR Operations Lead</div>
                    </div>
                  </div>
                  <span className="px-2.5 py-0.5 bg-emerald-50 text-emerald-700 border border-emerald-200 rounded-full text-xs font-semibold">
                    Active
                  </span>
                </div>

                {/* 3 Metric Summary Boxes at Bottom */}
                <div className="mt-5 grid grid-cols-3 gap-3 text-center">
                  <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
                    <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">DEPARTMENTS</div>
                    <div className="text-sm font-extrabold text-slate-900 mt-0.5">8 Configured</div>
                  </div>
                  <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
                    <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">DESIGNATIONS</div>
                    <div className="text-sm font-extrabold text-slate-900 mt-0.5">24 Roles</div>
                  </div>
                  <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
                    <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">ACCESS LEVELS</div>
                    <div className="text-sm font-extrabold text-slate-900 mt-0.5">Admin & Staff</div>
                  </div>
                </div>

              </div>
            </ScrollReveal>
          </div>

          {/* Right Column: Copy & Checklist (From Copy Document) */}
          <div className="lg:col-span-6 space-y-5 text-left">
            
            {/* Pill Eyebrow */}
            <ScrollReveal delay={0}>
              <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full text-xs font-bold bg-amber-50 text-amber-900 border border-amber-200">
                <Briefcase className="w-3.5 h-3.5 text-amber-600" />
                <span>EMPLOYEE DIRECTORY</span>
              </div>
            </ScrollReveal>

            {/* Heading */}
            <ScrollReveal delay={100}>
              <h2 className="text-2xl sm:text-3xl md:text-4xl font-black text-slate-900 tracking-tight leading-tight">
                One place for every employee record
              </h2>
            </ScrollReveal>

            {/* Subtitle / Body */}
            <ScrollReveal delay={150}>
              <p className="text-sm sm:text-base text-slate-600 leading-relaxed font-normal">
                See every team member in one view. Keep job details, emergency contacts and bank information for payroll together, and control who can see what with role-based access.
              </p>
            </ScrollReveal>

            {/* Checkpoints */}
            <ScrollReveal delay={200}>
              <div className="space-y-3 pt-2 text-sm font-medium text-slate-800">
                <div className="flex items-start gap-2.5">
                  <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
                  <span>Complete employee profiles, including bank details for payroll</span>
                </div>
                <div className="flex items-start gap-2.5">
                  <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
                  <span>Departments and designations that match your organisation</span>
                </div>
                <div className="flex items-start gap-2.5">
                  <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
                  <span>Separate permissions for Admin, HR Manager and Employee</span>
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
                  <span>Explore Employee Directory</span>
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
