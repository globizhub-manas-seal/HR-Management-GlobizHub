"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";
import {
  ArrowRight,
  Play,
  CheckCircle2,
  Clock,
  Banknote,
  Calendar,
  Sparkles,
  Users,
  ShieldCheck,
  FolderLock,
  Lock,
} from "lucide-react";
import ScrollReveal from "./ScrollReveal";

export default function LandingHero() {
  return (
    <section className="relative pt-8 pb-16 md:pt-14 md:pb-24 bg-gradient-to-b from-orange-50/20 via-white to-white overflow-hidden">
      
      {/* Background Soft Glow */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[1000px] h-[400px] bg-gradient-to-b from-orange-100/30 to-transparent blur-3xl pointer-events-none -z-10" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Top Hero Grid: Left Content + Right Interactive Mockup */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-8 items-center">
          
          {/* Left Hero Column */}
          <div className="lg:col-span-7 space-y-6 text-left">
            
            {/* Top Pill Tag */}
            <ScrollReveal delay={0}>
              <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full text-xs font-semibold bg-white border border-slate-200/90 shadow-2xs text-slate-700">
                <span className="h-2 w-2 rounded-full bg-orange-500 animate-pulse" />
                <span>HR, Payroll & Attendance for growing Indian teams</span>
              </div>
            </ScrollReveal>

            {/* Main Headline */}
            <ScrollReveal delay={100}>
              <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-[54px] font-black tracking-tight text-slate-900 leading-[1.12]">
                Run HR, attendance and payroll from one{" "}
                <span className="text-[#F97316]">simple system</span>
              </h1>
            </ScrollReveal>

            {/* Subtitle */}
            <ScrollReveal delay={200}>
              <p className="text-base sm:text-lg text-slate-600 leading-relaxed font-normal max-w-2xl">
                Manage employee records, track time and overtime, approve leave, plan shifts and run payroll with automatic payslips. Built for Indian compliance.
              </p>
            </ScrollReveal>

            {/* Action CTA Buttons */}
            <ScrollReveal delay={250}>
              <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3.5 pt-1">
                <Link href="/register">
                  <Button
                    size="lg"
                    className="w-full sm:w-auto h-12 px-7 bg-[#F97316] hover:bg-[#EA580C] text-white font-bold text-base rounded-lg shadow-sm hover:shadow-md transition-all cursor-pointer flex items-center justify-center gap-2"
                  >
                    <span>Start Free</span>
                    <ArrowRight className="w-4 h-4" />
                  </Button>
                </Link>
                <a
                  href="https://wa.me/918402010207?text=Hi%20GlobizHR%20team%2C%20I%20would%20like%20to%20request%20a%20demo%20of%20the%20platform."
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-full sm:w-auto"
                >
                  <Button
                    size="lg"
                    variant="outline"
                    className="w-full sm:w-auto h-12 px-6 bg-white hover:bg-slate-50 text-slate-800 border-slate-300 font-semibold text-base rounded-lg transition-all cursor-pointer flex items-center justify-center gap-2 shadow-2xs"
                  >
                    <div className="w-5 h-5 rounded-full bg-orange-100 flex items-center justify-center text-orange-600">
                      <Play className="w-2.5 h-2.5 fill-current ml-0.5" />
                    </div>
                    <span>Book a Free Demo</span>
                  </Button>
                </a>
              </div>
            </ScrollReveal>

            {/* Trust Line Under Buttons */}
            <ScrollReveal delay={300}>
              <div className="pt-2 flex flex-wrap items-center gap-2 sm:gap-3 text-xs font-semibold text-slate-600">
                <span className="flex items-center gap-1.5">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                  No credit card
                </span>
                <span className="text-slate-300">•</span>
                <span className="flex items-center gap-1.5">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                  Free for up to 5 users
                </span>
                <span className="text-slate-300">•</span>
                <span className="flex items-center gap-1.5">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                  Setup in minutes
                </span>
              </div>
            </ScrollReveal>

          </div>

          {/* Right Hero Column: Dashboard Window Mockup */}
          <div className="lg:col-span-5">
            <ScrollReveal delay={200} direction="left">
              <div className="bg-[#0B132B] rounded-2xl shadow-2xl border border-slate-800 overflow-hidden text-white text-left">
                
                {/* Window Chrome Header */}
                <div className="flex items-center justify-between px-4 py-3 bg-[#111A38] border-b border-slate-800 text-xs">
                  <div className="flex items-center gap-1.5">
                    <span className="w-3 h-3 rounded-full bg-rose-500/90 inline-block" />
                    <span className="w-3 h-3 rounded-full bg-amber-500/90 inline-block" />
                    <span className="w-3 h-3 rounded-full bg-emerald-500/90 inline-block" />
                  </div>
                  <div className="flex items-center gap-1.5 px-3 py-1 bg-slate-900/80 rounded-md text-[11px] text-slate-400 font-mono border border-slate-800">
                    <Lock className="w-3 h-3 text-emerald-400" />
                    <span>hr.globizhub.com/dashboard/overview</span>
                  </div>
                  <div className="flex items-center gap-1 text-[11px] font-semibold text-emerald-400">
                    <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping inline-block" />
                    <span>Live Demo</span>
                  </div>
                </div>

                {/* Sub-header status badge */}
                <div className="px-4 py-1.5 bg-[#F97316]/10 border-b border-[#F97316]/20 text-[10px] font-bold text-[#F97316] text-center tracking-wider uppercase">
                  Real-Time Sync Active • 1-Click Payroll
                </div>

                {/* Window Body Card Container */}
                <div className="p-5 space-y-4 bg-slate-50 text-slate-900">
                  
                  {/* 2x2 Stats Grid */}
                  <div className="grid grid-cols-2 gap-3">
                    
                    {/* Card 1: Total Active Staff */}
                    <div className="p-3.5 bg-white rounded-xl border border-slate-200/90 shadow-2xs">
                      <div className="text-[11px] font-medium text-slate-500">Total Active Staff</div>
                      <div className="text-xl font-extrabold text-slate-900 mt-0.5">142 Users</div>
                      <span className="inline-block mt-1 text-[10px] font-semibold px-2 py-0.5 bg-emerald-50 text-emerald-700 rounded-md border border-emerald-200">
                        ✓ 100% Present / On Leave
                      </span>
                    </div>

                    {/* Card 2: Today Attendance */}
                    <div className="p-3.5 bg-white rounded-xl border border-slate-200/90 shadow-2xs">
                      <div className="text-[11px] font-medium text-slate-500">Today Attendance</div>
                      <div className="text-xl font-extrabold text-slate-900 mt-0.5">98.4%</div>
                      <span className="inline-block mt-1 text-[10px] font-semibold px-2 py-0.5 bg-sky-50 text-sky-700 rounded-md border border-sky-200">
                        138 Clocked In
                      </span>
                    </div>

                    {/* Card 3: Monthly Payroll */}
                    <div className="p-3.5 bg-white rounded-xl border border-slate-200/90 shadow-2xs">
                      <div className="text-[11px] font-medium text-slate-500">Monthly Payroll</div>
                      <div className="text-xl font-extrabold text-slate-900 mt-0.5">₹18.4L</div>
                      <span className="inline-block mt-1 text-[10px] font-semibold px-2 py-0.5 bg-orange-50 text-orange-700 rounded-md border border-orange-200">
                        Ready for 1-Click Run
                      </span>
                    </div>

                    {/* Card 4: Pending Leave Requests */}
                    <div className="p-3.5 bg-white rounded-xl border border-slate-200/90 shadow-2xs">
                      <div className="text-[11px] font-medium text-slate-500">Pending Leave Requests</div>
                      <div className="text-xl font-extrabold text-slate-900 mt-0.5">3 Actions</div>
                      <span className="inline-block mt-1 text-[10px] font-semibold px-2 py-0.5 bg-amber-50 text-amber-700 rounded-md border border-amber-200">
                        2 Casual, 1 Sick
                      </span>
                    </div>

                  </div>

                  {/* Shift Rostering Live Distribution */}
                  <div className="p-3.5 bg-white rounded-xl border border-slate-200/90 shadow-2xs space-y-2.5">
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-bold text-slate-800">Shift Rostering Live Distribution</span>
                      <span className="text-[10px] font-semibold px-2 py-0.5 bg-orange-100 text-orange-800 rounded">
                        3 Active Shifts
                      </span>
                    </div>
                    {/* Multi-segment progress bar */}
                    <div className="w-full h-3 rounded-full bg-slate-100 flex overflow-hidden">
                      <div className="bg-sky-500 h-full" style={{ width: "60%" }} title="Morning: 85" />
                      <div className="bg-orange-500 h-full" style={{ width: "25%" }} title="Evening: 35" />
                      <div className="bg-indigo-600 h-full" style={{ width: "15%" }} title="Night: 22" />
                    </div>
                    <div className="flex items-center justify-between text-[11px] font-medium text-slate-600 pt-0.5">
                      <span className="flex items-center gap-1.5">
                        <span className="w-2 h-2 rounded-full bg-sky-500 inline-block" /> Morning (85)
                      </span>
                      <span className="flex items-center gap-1.5">
                        <span className="w-2 h-2 rounded-full bg-orange-500 inline-block" /> Evening (35)
                      </span>
                      <span className="flex items-center gap-1.5">
                        <span className="w-2 h-2 rounded-full bg-indigo-600 inline-block" /> Night (22)
                      </span>
                    </div>
                  </div>

                </div>

              </div>
            </ScrollReveal>
          </div>

        </div>

        {/* Hero Feature Tiles (5 tiles from PDF Part 3) */}
        <div className="mt-14 sm:mt-16 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3.5">
          
          {/* Tile 1 */}
          <ScrollReveal delay={100}>
            <div className="p-5 bg-white rounded-2xl border border-slate-200/90 shadow-2xs hover:shadow-md transition-all text-center flex flex-col items-center h-full">
              <div className="w-11 h-11 rounded-full bg-orange-50 border border-orange-100 flex items-center justify-center text-orange-600 mb-3 shrink-0">
                <Clock className="w-5 h-5" />
              </div>
              <h3 className="text-sm font-bold text-slate-900">Accurate Attendance</h3>
              <p className="text-xs text-slate-500 mt-1">Clock-in, breaks and overtime, recorded automatically</p>
            </div>
          </ScrollReveal>

          {/* Tile 2 */}
          <ScrollReveal delay={160}>
            <div className="p-5 bg-white rounded-2xl border border-slate-200/90 shadow-2xs hover:shadow-md transition-all text-center flex flex-col items-center h-full">
              <div className="w-11 h-11 rounded-full bg-orange-50 border border-orange-100 flex items-center justify-center text-orange-600 mb-3 shrink-0">
                <Banknote className="w-5 h-5" />
              </div>
              <h3 className="text-sm font-bold text-slate-900">1-Click Payroll</h3>
              <p className="text-xs text-slate-500 mt-1">Salary components and payslips, ready in seconds</p>
            </div>
          </ScrollReveal>

          {/* Tile 3 */}
          <ScrollReveal delay={220}>
            <div className="p-5 bg-white rounded-2xl border border-slate-200/90 shadow-2xs hover:shadow-md transition-all text-center flex flex-col items-center h-full">
              <div className="w-11 h-11 rounded-full bg-orange-50 border border-orange-100 flex items-center justify-center text-orange-600 mb-3 shrink-0">
                <Calendar className="w-5 h-5" />
              </div>
              <h3 className="text-sm font-bold text-slate-900">Shift Management</h3>
              <p className="text-xs text-slate-500 mt-1">Rosters and peer shift swaps, approved in one tap</p>
            </div>
          </ScrollReveal>

          {/* Tile 4 */}
          <ScrollReveal delay={280}>
            <div className="p-5 bg-white rounded-2xl border border-slate-200/90 shadow-2xs hover:shadow-md transition-all text-center flex flex-col items-center h-full">
              <div className="w-11 h-11 rounded-full bg-orange-50 border border-orange-100 flex items-center justify-center text-orange-600 mb-3 shrink-0">
                <Sparkles className="w-5 h-5" />
              </div>
              <h3 className="text-sm font-bold text-slate-900">Easy Onboarding</h3>
              <p className="text-xs text-slate-500 mt-1">A 10-step wizard to set up your company</p>
            </div>
          </ScrollReveal>

          {/* Tile 5: Employee Directory */}
          <ScrollReveal delay={340}>
            <div className="p-5 bg-white rounded-2xl border border-slate-200/90 shadow-2xs hover:shadow-md transition-all text-center flex flex-col items-center h-full">
              <div className="w-11 h-11 rounded-full bg-orange-50 border border-orange-100 flex items-center justify-center text-orange-600 mb-3 shrink-0">
                <Users className="w-5 h-5" />
              </div>
              <h3 className="text-sm font-bold text-slate-900">Employee Directory</h3>
              <p className="text-xs text-slate-500 mt-1">Departments, designations and access, organised</p>
            </div>
          </ScrollReveal>

        </div>

        {/* Badges below tiles (From PDF Page 5 & 7) */}
        <ScrollReveal delay={380}>
          <div className="mt-8 flex flex-wrap items-center justify-center gap-6 text-xs font-semibold text-slate-600">
            <span className="flex items-center gap-1.5">
              <CheckCircle2 className="w-4 h-4 text-emerald-600" />
              10-Step Setup Wizard
            </span>
            <span className="text-slate-300">•</span>
            <span className="flex items-center gap-1.5">
              <ShieldCheck className="w-4 h-4 text-emerald-600" />
              Role-Based Access
            </span>
            <span className="text-slate-300">•</span>
            <span className="flex items-center gap-1.5">
              <FolderLock className="w-4 h-4 text-emerald-600" />
              Encrypted Document Vault
            </span>
          </div>
        </ScrollReveal>

      </div>
    </section>
  );
}
