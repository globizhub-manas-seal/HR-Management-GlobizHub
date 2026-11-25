"use client";

import Link from "next/link";
import { ArrowRight, Building, UserPlus, PlayCircle, Zap } from "lucide-react";
import ScrollReveal from "./ScrollReveal";

export default function LandingHowItWorks() {
  const steps = [
    {
      step: "1",
      title: "Set up your company",
      desc: "Our 10-step wizard covers departments, designations, shifts, leave types and holidays.",
      icon: Building,
    },
    {
      step: "2",
      title: "Add your team",
      desc: "Invite employees or import them. Each person gets their own login with the right access.",
      icon: UserPlus,
    },
    {
      step: "3",
      title: "Run your HR",
      desc: "Track attendance, approve leave and run payroll. Payslips reach employees automatically.",
      icon: PlayCircle,
    },
  ];

  return (
    <section className="py-16 md:py-24 bg-white border-t border-slate-100">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
        
        {/* Eyebrow */}
        <ScrollReveal delay={0}>
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full text-xs font-bold bg-amber-50 text-amber-900 border border-amber-200 mb-4">
            <Zap className="w-3.5 h-3.5 text-amber-600" />
            <span>GET STARTED IN MINUTES</span>
          </div>
        </ScrollReveal>

        {/* Heading */}
        <ScrollReveal delay={100}>
          <h2 className="text-3xl sm:text-4xl md:text-5xl font-black text-slate-900 tracking-tight leading-tight">
            Up and running in 3 simple steps
          </h2>
        </ScrollReveal>

        {/* 3 Step Cards */}
        <div className="mt-12 grid grid-cols-1 md:grid-cols-3 gap-8 text-left">
          {steps.map((item, idx) => {
            const Icon = item.icon;
            return (
              <ScrollReveal key={idx} delay={idx * 100}>
                <div className="h-full p-8 bg-slate-50/70 rounded-2xl border border-slate-200/90 shadow-2xs hover:border-slate-300 transition-colors flex flex-col justify-between">
                  <div>
                    <div className="w-12 h-12 rounded-xl bg-orange-100 text-[#F97316] flex items-center justify-center font-black text-lg mb-6 shadow-2xs">
                      {item.step}
                    </div>
                    <h3 className="text-xl font-bold text-slate-900 tracking-tight mb-2">
                      {item.title}
                    </h3>
                    <p className="text-sm text-slate-600 leading-relaxed">
                      {item.desc}
                    </p>
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
