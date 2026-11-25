"use client";

import Link from "next/link";
import { Check, Tag } from "lucide-react";
import ScrollReveal from "./ScrollReveal";

export default function LandingPricing() {
  return (
    <section id="pricing" className="py-16 md:py-24 bg-white border-t border-slate-100">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
        
        {/* Eyebrow Pill */}
        <ScrollReveal delay={0}>
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full text-xs font-bold bg-amber-50 text-amber-900 border border-amber-200 mb-4">
            <Tag className="w-3.5 h-3.5 text-amber-600" />
            <span>SIMPLE PRICING</span>
          </div>
        </ScrollReveal>

        {/* Heading (From Copy Document) */}
        <ScrollReveal delay={100}>
          <h2 className="text-3xl sm:text-4xl md:text-5xl font-black text-slate-900 tracking-tight leading-tight">
            Simple pricing: ₹49 per user per month
          </h2>
        </ScrollReveal>

        {/* Subtitle / Pricing Sub-line */}
        <ScrollReveal delay={150}>
          <p className="mt-3 text-sm sm:text-base text-slate-600 max-w-2xl mx-auto font-normal leading-relaxed">
            Pay only for active users, invoiced monthly. Add or remove people anytime.
          </p>
        </ScrollReveal>

        {/* 2 Pricing Cards */}
        <div className="mt-12 grid grid-cols-1 md:grid-cols-2 gap-8 max-w-4xl mx-auto items-stretch text-left">
          
          {/* Card 1: Free Plan (Renamed from Freemium) */}
          <ScrollReveal delay={200}>
            <div className="h-full p-8 bg-white rounded-3xl border border-slate-200/90 shadow-lg shadow-slate-100 flex flex-col justify-between hover:border-slate-300 transition-colors">
              <div>
                <div className="flex items-center justify-between">
                  <h3 className="text-2xl font-black text-slate-900">Free Plan</h3>
                  <span className="px-2.5 py-1 bg-slate-100 text-slate-700 text-xs font-bold rounded-md uppercase tracking-wider">
                    FREE FOREVER
                  </span>
                </div>

                <div className="mt-4 flex items-baseline gap-1.5">
                  <span className="text-4xl font-black text-slate-900">₹0</span>
                  <span className="text-sm font-semibold text-slate-500">/ month</span>
                </div>

                <p className="text-xs text-slate-600 mt-2 leading-relaxed">
                  Everything a small team needs to run HR. Verify your business email and invite up to 5 teammates.
                </p>

                <div className="mt-6 pt-6 border-t border-slate-100">
                  <div className="text-xs font-bold text-slate-900 uppercase tracking-wider mb-4">
                    WHAT&apos;S INCLUDED:
                  </div>
                  <ul className="space-y-3 text-xs sm:text-sm font-medium text-slate-700">
                    <li className="flex items-start gap-2.5">
                      <Check className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                      <span>Up to 5 users with verified business emails</span>
                    </li>
                    <li className="flex items-start gap-2.5">
                      <Check className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                      <span>Employee directory & org chart</span>
                    </li>
                    <li className="flex items-start gap-2.5">
                      <Check className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                      <span>Attendance, leave & shift scheduling</span>
                    </li>
                    <li className="flex items-start gap-2.5">
                      <Check className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                      <span>Document vault & e-signatures</span>
                    </li>
                    <li className="flex items-start gap-2.5">
                      <Check className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                      <span>Tasks & company announcements</span>
                    </li>
                  </ul>
                </div>
              </div>

              <div className="mt-8 pt-4">
                <Link href="/register" className="block w-full">
                  <button className="w-full py-3 bg-white hover:bg-slate-50 text-slate-800 border border-slate-300 font-bold rounded-xl text-sm transition-all shadow-2xs cursor-pointer">
                    Start Free
                  </button>
                </Link>
              </div>
            </div>
          </ScrollReveal>

          {/* Card 2: Business Plan (Renamed from Pay As You Grow) */}
          <ScrollReveal delay={250}>
            <div className="h-full p-8 bg-white rounded-3xl border-2 border-[#F97316] shadow-xl shadow-orange-500/10 flex flex-col justify-between relative hover:shadow-2xl transition-all">
              
              {/* Recommended Top Badge */}
              <div className="absolute -top-3.5 left-1/2 -translate-x-1/2 px-4 py-1 bg-[#F97316] text-white rounded-full text-[11px] font-extrabold uppercase tracking-wider shadow-sm">
                RECOMMENDED / ANNUAL CONTRACT
              </div>

              <div>
                <div className="flex items-center justify-between">
                  <h3 className="text-2xl font-black text-slate-900">Business Plan</h3>
                </div>

                <div className="mt-4 flex items-baseline gap-1.5">
                  <span className="text-4xl sm:text-5xl font-black text-[#F97316]">₹49</span>
                  <span className="text-sm font-semibold text-slate-600">/ user / month</span>
                  <span className="text-xs font-bold text-slate-400 ml-1">+ GST</span>
                </div>

                <p className="text-xs text-slate-600 mt-2 leading-relaxed">
                  Invoiced monthly for your actual active users. Add or remove people anytime — your invoice follows reality.
                </p>

                <div className="mt-6 pt-6 border-t border-slate-100">
                  <div className="text-xs font-bold text-slate-900 uppercase tracking-wider mb-4">
                    EVERYTHING IN FREE, PLUS:
                  </div>
                  <ul className="space-y-3 text-xs sm:text-sm font-medium text-slate-700">
                    <li className="flex items-start gap-2.5">
                      <Check className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                      <span>Unlimited users – billed monthly for actual seats</span>
                    </li>
                    <li className="flex items-start gap-2.5">
                      <Check className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                      <span>Automated payroll with statutory compliance (PF/ESI/PT/TDS)</span>
                    </li>
                    <li className="flex items-start gap-2.5">
                      <Check className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                      <span>Recruitment ATS with careers page & offer management</span>
                    </li>
                    <li className="flex items-start gap-2.5">
                      <Check className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                      <span>Training & competency management</span>
                    </li>
                    <li className="flex items-start gap-2.5">
                      <Check className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                      <span>Priority support & invoiced billing via Razorpay</span>
                    </li>
                  </ul>
                </div>
              </div>

              <div className="mt-8 pt-4">
                <Link href="/register" className="block w-full">
                  <button className="w-full py-3.5 bg-[#F97316] hover:bg-[#EA580C] text-white font-bold rounded-xl text-sm transition-all shadow-md hover:shadow-lg cursor-pointer">
                    Start 7-Day Free Trial
                  </button>
                </Link>
              </div>
            </div>
          </ScrollReveal>

        </div>

        {/* Enterprise Notice (From Copy Document) */}
        <ScrollReveal delay={300}>
          <p className="mt-8 text-xs sm:text-sm text-slate-600 font-medium max-w-xl mx-auto">
            Need 200+ employees or custom workflows?{" "}
            <a
              href="https://wa.me/918402010207?text=Hi%20GlobizHR%20team%2C%20I%20would%20like%20to%20inquire%20about%20enterprise%20pricing."
              target="_blank"
              rel="noopener noreferrer"
              className="text-[#F97316] font-bold hover:underline inline-flex items-center gap-1"
            >
              Talk to us on WhatsApp &rarr;
            </a>
          </p>
        </ScrollReveal>

      </div>
    </section>
  );
}
