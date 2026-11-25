"use client";

import Link from "next/link";
import { ArrowRight, CheckCircle2, Lock, ShieldCheck, KeyRound, Database, History } from "lucide-react";
import ScrollReveal from "./ScrollReveal";

export default function LandingSecurity() {
  const securityFeatures = [
    {
      title: "Role-based access",
      desc: "Admin, HR Manager and Employee permissions",
      icon: KeyRound,
    },
    {
      title: "Audit logs",
      desc: "A record of who changed what, and when",
      icon: History,
    },
    {
      title: "Encrypted document vault",
      desc: "IDs and employee files stored securely with AES-256",
      icon: Lock,
    },
    {
      title: "Data hosting",
      desc: "Hosted on secure enterprise cloud servers with automated encrypted backups",
      icon: Database,
    },
  ];

  return (
    <section id="security" className="py-16 md:py-24 bg-white border-t border-slate-100">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
        
        {/* Eyebrow */}
        <ScrollReveal delay={0}>
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full text-xs font-bold bg-amber-50 text-amber-900 border border-amber-200 mb-4">
            <ShieldCheck className="w-3.5 h-3.5 text-amber-600" />
            <span>SECURITY & TRUST</span>
          </div>
        </ScrollReveal>

        {/* Heading */}
        <ScrollReveal delay={100}>
          <h2 className="text-3xl sm:text-4xl md:text-5xl font-black text-slate-900 tracking-tight leading-tight">
            Your people&apos;s data stays protected
          </h2>
        </ScrollReveal>

        {/* Subtitle */}
        <ScrollReveal delay={150}>
          <p className="mt-3 text-sm sm:text-base text-slate-600 max-w-2xl mx-auto font-normal leading-relaxed">
            Employee records, bank details and documents are sensitive. GlobizHR keeps them locked down and traceable.
          </p>
        </ScrollReveal>

        {/* 4 Security Cards */}
        <div className="mt-12 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 text-left">
          {securityFeatures.map((feat, idx) => {
            const Icon = feat.icon;
            return (
              <ScrollReveal key={idx} delay={idx * 80}>
                <div className="h-full p-6 bg-slate-50/70 rounded-2xl border border-slate-200/90 shadow-2xs hover:border-slate-300 transition-colors flex flex-col justify-between">
                  <div>
                    <div className="w-11 h-11 rounded-xl bg-orange-50 border border-orange-100 text-[#F97316] flex items-center justify-center mb-4 shrink-0 shadow-2xs">
                      <Icon className="w-5 h-5" />
                    </div>
                    <h3 className="text-base font-bold text-slate-900 mb-1.5">
                      {feat.title}
                    </h3>
                    <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
                      {feat.desc}
                    </p>
                  </div>
                </div>
              </ScrollReveal>
            );
          })}
        </div>

        {/* Privacy Policy Link */}
        <ScrollReveal delay={300}>
          <div className="mt-8">
            <Link
              href="/privacy"
              className="inline-flex items-center gap-1.5 text-sm font-bold text-[#F97316] hover:text-[#EA580C] transition-colors"
            >
              <span>Read our Privacy Policy</span>
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </ScrollReveal>

      </div>
    </section>
  );
}
