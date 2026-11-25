"use client";

import Link from "next/link";
import { ArrowRight, Calendar, Sparkles } from "lucide-react";
import ScrollReveal from "./ScrollReveal";

export default function LandingCta() {
  return (
    <section className="py-16 md:py-20 px-4 md:px-8">
  <div className="max-w-6xl mx-auto rounded-3xl py-16 md:py-20 px-6 md:px-12
                  bg-[#0B0F19] text-white relative overflow-hidden">
        {/* Background Glow */}
    <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2
                    w-[700px] h-[350px] bg-orange-600/15 blur-[120px]
                    pointer-events-none" />

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
        
        {/* Eyebrow */}
        <ScrollReveal delay={0}>
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full text-xs font-bold bg-orange-500/10 text-orange-400 border border-orange-500/20 mb-5">
            <Sparkles className="w-3.5 h-3.5" />
            <span>START FREE TODAY • NO SETUP FEES</span>
          </div>
        </ScrollReveal>

        {/* Heading */}
        <ScrollReveal delay={100}>
          <h2 className="text-3xl sm:text-4xl md:text-5xl font-black tracking-tight leading-tight">
            Ready to simplify HR and payroll?
          </h2>
        </ScrollReveal>

        {/* Text */}
        <ScrollReveal delay={150}>
          <p className="mt-4 text-base sm:text-lg text-slate-300 max-w-2xl mx-auto font-normal leading-relaxed">
            Join teams that manage attendance, leave, shifts and payroll in one place with GlobizHR.
          </p>
        </ScrollReveal>

        {/* Buttons */}
        <ScrollReveal delay={200}>
          <div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link href="/register">
              <button className="w-full sm:w-auto px-8 py-3.5 bg-[#F97316] hover:bg-[#EA580C] text-white rounded-xl text-sm font-bold shadow-lg transition-all cursor-pointer flex items-center justify-center gap-2">
                <span>Start Free</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </Link>
            <a
              href="https://wa.me/918402010207?text=Hi%20GlobizHR%20team%2C%20I%20would%20like%20to%20request%20a%20demo%20of%20the%20platform."
              target="_blank"
              rel="noopener noreferrer"
              className="w-full sm:w-auto"
            >
              <button className="w-full sm:w-auto px-7 py-3.5 bg-slate-900 hover:bg-slate-800 text-slate-200 border border-slate-700 rounded-xl text-sm font-semibold transition-all cursor-pointer flex items-center justify-center gap-2">
                <Calendar className="w-4 h-4 text-[#F97316]" />
                <span>Book a Free Demo</span>
              </button>
            </a>
          </div>
        </ScrollReveal>
</div>
      </div>
    </section>
  );
}
