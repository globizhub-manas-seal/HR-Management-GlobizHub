"use client";

import { useState } from "react";
import Link from "next/link";
import {
  ArrowLeftRight,
  ListTodo,
  Sparkles,
  FolderLock,
  ArrowRight,
  Layers,
  Megaphone,
} from "lucide-react";
import ScrollReveal from "./ScrollReveal";

export default function LandingOperations() {
  const [activeTab, setActiveTab] = useState<"shifts" | "tasks" | "announcements" | "vault">("shifts");

  return (
    <section id="shifts" className="py-16 md:py-24 bg-[#FAFAFA] border-t border-slate-100">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
        
        {/* Top Eyebrow Pill */}
        <ScrollReveal delay={0}>
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full text-xs font-bold bg-amber-50 text-amber-900 border border-amber-200 mb-4">
            <Layers className="w-3.5 h-3.5 text-amber-600" />
            <span>OPERATIONS HUB</span>
          </div>
        </ScrollReveal>

        {/* Section Heading */}
        <ScrollReveal delay={100}>
          <h2 className="text-2xl sm:text-3xl md:text-4xl font-black text-slate-900 tracking-tight leading-tight max-w-3xl mx-auto">
            Shifts, tasks and announcements, together
          </h2>
        </ScrollReveal>

        {/* Section Subtitle */}
        <ScrollReveal delay={150}>
          <p className="mt-3 text-sm sm:text-base text-slate-600 max-w-2xl mx-auto font-normal leading-relaxed">
            Keep your team in sync with flexible shift rosters, peer shift swaps, task assignments, company announcements and a secure document vault.
          </p>
        </ScrollReveal>

        {/* 4 Interactive Navigation Tabs */}
        <ScrollReveal delay={200}>
          <div className="mt-8 flex flex-wrap items-center justify-center gap-2.5">
            <button
              onClick={() => setActiveTab("shifts")}
              className={`px-5 py-2.5 rounded-full text-xs font-bold transition-all cursor-pointer ${
                activeTab === "shifts"
                  ? "bg-[#F97316] text-white shadow-xs"
                  : "bg-white text-slate-700 hover:bg-slate-100 border border-slate-200"
              }`}
            >
              Shifts & Shift Swaps
            </button>
            <button
              onClick={() => setActiveTab("tasks")}
              className={`px-5 py-2.5 rounded-full text-xs font-bold transition-all cursor-pointer ${
                activeTab === "tasks"
                  ? "bg-[#F97316] text-white shadow-xs"
                  : "bg-white text-slate-700 hover:bg-slate-100 border border-slate-200"
              }`}
            >
              Task Management
            </button>
            <button
              onClick={() => setActiveTab("announcements")}
              className={`px-5 py-2.5 rounded-full text-xs font-bold transition-all cursor-pointer ${
                activeTab === "announcements"
                  ? "bg-[#F97316] text-white shadow-xs"
                  : "bg-white text-slate-700 hover:bg-slate-100 border border-slate-200"
              }`}
            >
              Company Announcements
            </button>
            <button
              onClick={() => setActiveTab("vault")}
              className={`px-5 py-2.5 rounded-full text-xs font-bold transition-all cursor-pointer ${
                activeTab === "vault"
                  ? "bg-[#F97316] text-white shadow-xs"
                  : "bg-white text-slate-700 hover:bg-slate-100 border border-slate-200"
              }`}
            >
              Secure Document Vault
            </button>
          </div>
        </ScrollReveal>

        {/* Tab Content Display Card */}
        <ScrollReveal delay={250}>
          <div className="mt-8 p-6 md:p-8 bg-white rounded-2xl border border-slate-200/90 shadow-lg shadow-slate-100 max-w-5xl mx-auto text-left">
            
            {activeTab === "shifts" && (
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
                
                {/* Left Side: Copy */}
                <div className="lg:col-span-6 space-y-4">
                  <div className="inline-flex items-center gap-1.5 text-xs font-bold text-[#F97316] uppercase tracking-wider">
                    <ArrowLeftRight className="w-3.5 h-3.5" />
                    <span>SHIFT ROSTER & PEER SWAPS</span>
                  </div>
                  <h3 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
                    Flexible shift rosters and swap requests
                  </h3>
                  <p className="text-sm text-slate-600 leading-relaxed font-normal">
                    Create morning, evening and night rosters. Employees request swaps with co-workers, and managers approve with one click.
                  </p>
                  <div className="pt-2 flex flex-wrap items-center gap-3">
                    <Link href="/register">
                      <button className="px-5 py-2.5 bg-[#F97316] hover:bg-[#EA580C] text-white rounded-lg text-xs font-bold shadow-2xs transition-colors cursor-pointer">
                        View Shift Scheduler
                      </button>
                    </Link>
                    <Link href="#core-hr">
                      <button className="px-4 py-2.5 bg-white hover:bg-slate-50 text-slate-700 border border-slate-300 rounded-lg text-xs font-bold transition-colors cursor-pointer">
                        See How It Works
                      </button>
                    </Link>
                  </div>
                </div>

                {/* Right Side: Visual Boxes */}
                <div className="lg:col-span-6 space-y-3.5">
                  
                  {/* Box 1: Morning Shift */}
                  <div className="p-4 rounded-xl border border-slate-200/90 bg-slate-50/50">
                    <div className="flex items-center justify-between">
                      <div className="text-sm font-bold text-slate-900">Morning Shift (08:00 – 16:00)</div>
                      <span className="px-2.5 py-0.5 bg-emerald-50 text-emerald-700 border border-emerald-200 rounded-md text-xs font-semibold">
                        Active Shift
                      </span>
                    </div>
                    <div className="text-xs text-slate-500 mt-1">Assigned to: Alex Rivera, Sarah Davis</div>
                  </div>

                  {/* Box 2: Shift Swap Proposal */}
                  <div className="p-4 rounded-xl border border-amber-200 bg-amber-50/30">
                    <div className="flex items-center justify-between">
                      <div className="text-sm font-bold text-slate-900">Shift Swap Proposal: Friday Night</div>
                      <span className="px-2.5 py-0.5 bg-amber-100 text-amber-800 rounded-md text-xs font-bold">
                        Manager Approved
                      </span>
                    </div>
                    <div className="text-xs text-slate-600 mt-1">Alex Rivera → Marcus Vance</div>
                  </div>

                </div>

              </div>
            )}

            {activeTab === "tasks" && (
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
                <div className="lg:col-span-6 space-y-4">
                  <div className="inline-flex items-center gap-1.5 text-xs font-bold text-[#F97316] uppercase tracking-wider">
                    <ListTodo className="w-3.5 h-3.5" />
                    <span>TASK MANAGEMENT</span>
                  </div>
                  <h3 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
                    Structured Task Assignment & Follow-ups
                  </h3>
                  <p className="text-sm text-slate-600 leading-relaxed font-normal">
                    Delegate department deliverables, track completion deadlines, and follow up on team execution from a unified dashboard.
                  </p>
                  <div className="pt-2">
                    <Link href="/register">
                      <button className="px-5 py-2.5 bg-[#F97316] hover:bg-[#EA580C] text-white rounded-lg text-xs font-bold shadow-2xs transition-colors cursor-pointer">
                        Explore Task Manager
                      </button>
                    </Link>
                  </div>
                </div>
                <div className="lg:col-span-6 space-y-3.5">
                  <div className="p-4 rounded-xl border border-slate-200/90 bg-slate-50/50">
                    <div className="flex items-center justify-between">
                      <div className="text-sm font-bold text-slate-900">Q4 Statutory Filing Review</div>
                      <span className="px-2.5 py-0.5 bg-sky-50 text-sky-700 border border-sky-200 rounded-md text-xs font-semibold">
                        In Progress
                      </span>
                    </div>
                    <div className="text-xs text-slate-500 mt-1">Due: Nov 30 • Assigned to: HR Ops Team</div>
                  </div>
                  <div className="p-4 rounded-xl border border-emerald-200 bg-emerald-50/30">
                    <div className="flex items-center justify-between">
                      <div className="text-sm font-bold text-slate-900">Annual POSH Policy Training</div>
                      <span className="px-2.5 py-0.5 bg-emerald-100 text-emerald-800 rounded-md text-xs font-bold">
                        Completed
                      </span>
                    </div>
                    <div className="text-xs text-slate-600 mt-1">100% Employee Sign-off Achieved</div>
                  </div>
                </div>
              </div>
            )}

            {activeTab === "announcements" && (
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
                <div className="lg:col-span-6 space-y-4">
                  <div className="inline-flex items-center gap-1.5 text-xs font-bold text-[#F97316] uppercase tracking-wider">
                    <Megaphone className="w-3.5 h-3.5" />
                    <span>COMPANY ANNOUNCEMENTS</span>
                  </div>
                  <h3 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
                    Broadcast Updates Across the Organization
                  </h3>
                  <p className="text-sm text-slate-600 leading-relaxed font-normal">
                    Share critical office notices, holiday calendar schedules, policy revisions, and town hall updates instantly to employee web & mobile portals.
                  </p>
                  <div className="pt-2">
                    <Link href="/register">
                      <button className="px-5 py-2.5 bg-[#F97316] hover:bg-[#EA580C] text-white rounded-lg text-xs font-bold shadow-2xs transition-colors cursor-pointer">
                        See Announcements
                      </button>
                    </Link>
                  </div>
                </div>
                <div className="lg:col-span-6 space-y-3.5">
                  <div className="p-4 rounded-xl border border-slate-200/90 bg-slate-50/50">
                    <div className="flex items-center justify-between">
                      <div className="text-sm font-bold text-slate-900">Diwali Holiday Schedule 2026</div>
                      <span className="px-2.5 py-0.5 bg-amber-50 text-amber-700 border border-amber-200 rounded-md text-xs font-semibold">
                        All Offices
                      </span>
                    </div>
                    <div className="text-xs text-slate-500 mt-1">Published by Management • Mandatory Holiday</div>
                  </div>
                  <div className="p-4 rounded-xl border border-slate-200/90 bg-slate-50/50">
                    <div className="flex items-center justify-between">
                      <div className="text-sm font-bold text-slate-900">Updated Group Health Insurance Policy</div>
                      <span className="px-2.5 py-0.5 bg-sky-50 text-sky-700 border border-sky-200 rounded-md text-xs font-semibold">
                        Notice
                      </span>
                    </div>
                    <div className="text-xs text-slate-500 mt-1">Download endorsement certificate in document vault</div>
                  </div>
                </div>
              </div>
            )}

            {activeTab === "vault" && (
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
                <div className="lg:col-span-6 space-y-4">
                  <div className="inline-flex items-center gap-1.5 text-xs font-bold text-[#F97316] uppercase tracking-wider">
                    <FolderLock className="w-3.5 h-3.5" />
                    <span>ENCRYPTED DOCUMENT VAULT</span>
                  </div>
                  <h3 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
                    Secure Document Storage & Verification
                  </h3>
                  <p className="text-sm text-slate-600 leading-relaxed font-normal">
                    Store government IDs, education certificates, offer letters, and contracts with AES-256 cloud encryption and role-based permissions.
                  </p>
                  <div className="pt-2">
                    <Link href="/register">
                      <button className="px-5 py-2.5 bg-[#F97316] hover:bg-[#EA580C] text-white rounded-lg text-xs font-bold shadow-2xs transition-colors cursor-pointer">
                        Access Document Vault
                      </button>
                    </Link>
                  </div>
                </div>
                <div className="lg:col-span-6 space-y-3.5">
                  <div className="p-4 rounded-xl border border-slate-200/90 bg-slate-50/50 flex items-center justify-between">
                    <div>
                      <div className="text-sm font-bold text-slate-900">Aadhaar & PAN Verification</div>
                      <div className="text-xs text-slate-500 mt-0.5">Encrypted at rest • Verified by HR</div>
                    </div>
                    <span className="px-2.5 py-0.5 bg-emerald-50 text-emerald-700 border border-emerald-200 rounded-md text-xs font-semibold">
                      Verified
                    </span>
                  </div>
                  <div className="p-4 rounded-xl border border-slate-200/90 bg-slate-50/50 flex items-center justify-between">
                    <div>
                      <div className="text-sm font-bold text-slate-900">Signed Employment Agreement</div>
                      <div className="text-xs text-slate-500 mt-0.5">Digital Signature Verified</div>
                    </div>
                    <span className="px-2.5 py-0.5 bg-emerald-50 text-emerald-700 border border-emerald-200 rounded-md text-xs font-semibold">
                      Signed
                    </span>
                  </div>
                </div>
              </div>
            )}

          </div>
        </ScrollReveal>

      </div>
    </section>
  );
}
