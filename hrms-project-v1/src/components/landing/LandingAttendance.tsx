"use client";

import Link from "next/link";
import { ArrowRight, Clock } from "lucide-react";
import ScrollReveal from "./ScrollReveal";

export default function LandingAttendance() {
  return (
    <section id="attendance" className="py-16 md:py-24 bg-[#FAFAFA] border-t border-slate-100">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-14 items-center">
          
          {/* Left Column: Copy & Feature Points (From Copy Document) */}
          <div className="lg:col-span-6 space-y-5 text-left">
            
            {/* Pill Eyebrow */}
            <ScrollReveal delay={0}>
              <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full text-xs font-bold bg-orange-50 text-orange-950 border border-orange-200">
                <Clock className="w-3.5 h-3.5 text-orange-600" />
                <span>ATTENDANCE & LEAVE</span>
              </div>
            </ScrollReveal>

            {/* Heading */}
            <ScrollReveal delay={100}>
              <h2 className="text-2xl sm:text-3xl md:text-4xl font-black text-slate-900 tracking-tight leading-tight">
                Accurate attendance, overtime and leave approvals
              </h2>
            </ScrollReveal>

            {/* Subtitle / Body */}
            <ScrollReveal delay={150}>
              <p className="text-sm sm:text-base text-slate-600 leading-relaxed font-normal">
                Record clock-in and clock-out times, breaks and overtime automatically. Set up Paid, Casual and Sick leave balances, sync your holiday calendar, and approve requests in one tap.
              </p>
            </ScrollReveal>

            {/* 4 Feature Points */}
            <ScrollReveal delay={200}>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-y-3.5 gap-x-6 pt-2 text-sm font-bold text-slate-800">
                <div className="flex items-center gap-2.5">
                  <span className="w-2.5 h-2.5 rounded-full bg-[#F97316] shrink-0" />
                  <span>Daily clock in and out, with break logs</span>
                </div>
                <div className="flex items-center gap-2.5">
                  <span className="w-2.5 h-2.5 rounded-full bg-[#F97316] shrink-0" />
                  <span>Overtime calculated for you</span>
                </div>
                <div className="flex items-center gap-2.5">
                  <span className="w-2.5 h-2.5 rounded-full bg-[#F97316] shrink-0" />
                  <span>Multiple leave types with balances</span>
                </div>
                <div className="flex items-center gap-2.5">
                  <span className="w-2.5 h-2.5 rounded-full bg-[#F97316] shrink-0" />
                  <span>Holiday calendar for each office</span>
                </div>
              </div>
            </ScrollReveal>

            {/* Action Button */}
            <ScrollReveal delay={250}>
              <div className="pt-2">
                <Link
                  href="/register"
                  className="inline-flex items-center gap-2 px-5 py-2.5 bg-[#F97316] hover:bg-[#EA580C] text-white rounded-lg text-sm font-bold shadow-2xs transition-colors"
                >
                  <span>Learn About Attendance and Leave</span>
                  <ArrowRight className="w-4 h-4" />
                </Link>
              </div>
            </ScrollReveal>

          </div>

          {/* Right Column: Attendance & Leaves Live Card */}
          <div className="lg:col-span-6">
            <ScrollReveal delay={150} direction="left">
              <div className="p-6 bg-white rounded-2xl border border-slate-200/90 shadow-lg shadow-slate-100">
                
                {/* Header with Title and Live Updates Badge */}
                <div className="flex items-center justify-between pb-5 border-b border-slate-100">
                  <div className="text-left">
                    <h3 className="text-base font-bold text-slate-900">Today&apos;s Attendance and Pending Leaves</h3>
                  </div>
                  <span className="flex items-center gap-1.5 px-2.5 py-1 bg-emerald-50 text-emerald-700 border border-emerald-200 rounded-full text-xs font-semibold">
                    <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                    <span>Live Updates</span>
                  </span>
                </div>

                {/* Clocked In Row */}
                <div className="mt-4 p-4 rounded-xl border border-slate-200/80 bg-white flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-left">
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-full bg-emerald-50 border border-emerald-200 text-emerald-600 flex items-center justify-center shrink-0">
                      <Clock className="w-4 h-4" />
                    </div>
                    <div>
                      <div className="text-sm font-bold text-slate-900">Alex Rivera — Clocked In</div>
                      <div className="text-xs text-slate-500 mt-0.5">In: 09:02 AM • Break: 45 min • Total: 7h 45m</div>
                    </div>
                  </div>
                  <span className="self-start sm:self-center px-2.5 py-1 bg-emerald-50 text-emerald-700 border border-emerald-200 rounded-md text-xs font-bold">
                    +1.2h Overtime
                  </span>
                </div>

                {/* Leave Request Row (Yellow Border Container) */}
                <div className="mt-4 p-4 rounded-xl border border-amber-200 bg-amber-50/30 flex flex-col sm:flex-row sm:items-center justify-between gap-4 text-left">
                  <div>
                    <div className="text-xs font-bold text-amber-900 tracking-wide uppercase">
                      LEAVE REQUEST: CASUAL LEAVE (2 DAYS)
                    </div>
                    <div className="text-xs text-slate-600 mt-1">
                      Submitted by Elena Rostova • Oct 14 - Oct 15
                    </div>
                  </div>
                  <div className="flex items-center gap-2 self-start sm:self-center">
                    <button className="px-4 py-1.5 bg-[#F97316] hover:bg-[#EA580C] text-white rounded-lg text-xs font-bold shadow-2xs transition-colors cursor-pointer">
                      Approve
                    </button>
                    <button className="px-4 py-1.5 bg-white hover:bg-slate-50 text-slate-700 border border-slate-300 rounded-lg text-xs font-bold transition-colors cursor-pointer">
                      Decline
                    </button>
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
