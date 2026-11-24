"use client";

import Link from "next/link";
import Image from "next/image";
import { ShieldCheck, ArrowUp } from "lucide-react";

function scrollToTop() {
  if (typeof window !== "undefined") {
    window.scrollTo({ top: 0, behavior: "smooth" });
  }
}

export default function LandingFooter() {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="bg-slate-50 border-t border-slate-200 text-slate-600">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-16 pb-12">

        {/* Main Grid Columns */}
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-8">

          {/* Brand Info Column */}
          <div className="sm:col-span-2 lg:col-span-2 space-y-4 text-left">
            <Link href="/" className="flex items-center gap-2.5 sm:gap-3 focus:outline-none">
              <div className="relative h-12 w-[72px] shrink-0">
                <Image
                  src="/globizhr-logo.png"
                  alt="GlobizHR Official Logo"
                  fill
                  className="object-contain object-center"
                  sizes="72px"
                />
              </div>
              <div className="flex flex-col justify-center">
                <div className="flex items-center gap-1.5">
                  <span className="text-2xl font-black text-slate-900 tracking-tight leading-tight">
                    Globiz<span className="text-[#F97316]">HR</span>
                  </span>
                  <span className="text-[10px] font-black px-1.5 py-0.5 bg-orange-100 text-[#F97316] rounded-md border border-orange-200 uppercase tracking-wide">
                    HRMS
                  </span>
                </div>
                <span className="text-xs font-semibold text-slate-500 leading-tight mt-0.5">
                  Cloud HR & Payroll Platform
                </span>
              </div>
            </Link>

            <p className="text-sm text-slate-500 max-w-sm leading-relaxed">
              All-in-one HR software for Indian businesses: attendance, leave, shifts, EPF/ESI/PT/TDS payroll and automated payslips.
            </p>

            <a
              href="https://globizhub.com/"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-orange-50/90 hover:bg-orange-100/90 border border-orange-200 text-xs font-bold text-[#F97316] rounded-lg transition-all w-fit shadow-2xs group"
            >
              <span>A product of GlobizHub India Pvt Ltd.</span>
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="w-3.5 h-3.5 opacity-80 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform">
                <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" />
                <polyline points="15 3 21 3 21 9" />
                <line x1="10" y1="14" x2="21" y2="3" />
              </svg>
            </a>

            <div className="flex items-center gap-2 text-xs font-semibold text-emerald-700">
              <ShieldCheck className="w-4 h-4 shrink-0" />
              <span>100% Indian Statutory Compliant • EPF, ESIC, PT, TDS</span>
            </div>

            {/* Social Media Links */}
            <div className="pt-2 flex items-center gap-3">
              {/* LinkedIn */}
              <a
                href="https://www.linkedin.com/company/globizhub-india"
                target="_blank"
                rel="noopener noreferrer"
                className="w-9 h-9 sm:w-10 sm:h-10 rounded-full bg-[#0A66C2] flex items-center justify-center text-white shadow-md hover:scale-110 active:scale-95 hover:shadow-lg hover:shadow-[#0A66C2]/30 transition-all duration-200"
                aria-label="LinkedIn"
              >
                <svg className="w-4 h-4 sm:w-5 sm:h-5 fill-current" viewBox="0 0 24 24">
                  <path d="M19 3a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h14m-.5 15.5v-5.3a3.26 3.26 0 0 0-3.26-3.26c-.85 0-1.84.52-2.28 1.3v-1.11h-2.79v8.37h2.79v-4.93c0-.77.62-1.4 1.39-1.4a1.4 1.4 0 0 1 1.4 1.4v4.93h2.75M6.46 10.9v8.37H9.2V10.9H6.46M7.83 6.22a1.65 1.65 0 0 0-1.66 1.65 1.66 1.66 0 0 0 1.66 1.66 1.66 1.66 0 0 0 1.66-1.66 1.65 1.65 0 0 0-1.66-1.65z" />
                </svg>
              </a>

              {/* Instagram */}
              <a
                href="https://www.instagram.com/globizhub"
                target="_blank"
                rel="noopener noreferrer"
                className="w-9 h-9 sm:w-10 sm:h-10 rounded-full bg-gradient-to-tr from-[#f09433] via-[#dc2743] to-[#bc1888] flex items-center justify-center text-white shadow-md hover:scale-110 active:scale-95 hover:shadow-lg hover:shadow-pink-500/30 transition-all duration-200"
                aria-label="Instagram"
              >
                <svg className="w-4 h-4 sm:w-5 sm:h-5 fill-none stroke-current stroke-[2] stroke-linecap-round stroke-linejoin-round" viewBox="0 0 24 24">
                  <rect width="20" height="20" x="2" y="2" rx="5" ry="5" />
                  <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z" />
                  <line x1="17.5" x2="17.51" y1="6.5" y2="6.5" />
                </svg>
              </a>

              {/* Facebook */}
              <a
                href="https://www.facebook.com/globizhub"
                target="_blank"
                rel="noopener noreferrer"
                className="w-9 h-9 sm:w-10 sm:h-10 rounded-full bg-[#1877F2] flex items-center justify-center text-white shadow-md hover:scale-110 active:scale-95 hover:shadow-lg hover:shadow-[#1877F2]/30 transition-all duration-200"
                aria-label="Facebook"
              >
                <svg className="w-4 h-4 sm:w-5 sm:h-5 fill-current" viewBox="0 0 24 24">
                  <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
                </svg>
              </a>
            </div>
          </div>

          {/* Core Modules Links */}
          <div className="text-left">
            <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider mb-4">
              Core Modules
            </h4>
            <ul className="space-y-2.5 text-sm text-slate-600">
              <li>
                <Link href="#core-hr" className="hover:text-orange-600 transition-colors">
                  Employee Directory
                </Link>
              </li>
              <li>
                <Link href="#attendance" className="hover:text-orange-600 transition-colors">
                  Time & Attendance
                </Link>
              </li>
              <li>
                <Link href="#attendance" className="hover:text-orange-600 transition-colors">
                  Leave Management
                </Link>
              </li>
              <li>
                <Link href="#shifts" className="hover:text-orange-600 transition-colors">
                  Shift Scheduling
                </Link>
              </li>
              <li>
                <Link href="#shifts" className="hover:text-orange-600 transition-colors">
                  Peer Shift Swaps
                </Link>
              </li>
            </ul>
          </div>

          {/* Payroll & Hub */}
          <div className="text-left">
            <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider mb-4">
              Payroll & Hub
            </h4>
            <ul className="space-y-2.5 text-sm text-slate-600">
              <li>
                <Link href="#payroll" className="hover:text-orange-600 transition-colors">
                  1-Click Payroll Run
                </Link>
              </li>
              <li>
                <Link href="#payroll" className="hover:text-orange-600 transition-colors">
                  Payslip Downloads
                </Link>
              </li>
              <li>
                <Link href="#shifts" className="hover:text-orange-600 transition-colors">
                  Task Management
                </Link>
              </li>
              <li>
                <Link href="#shifts" className="hover:text-orange-600 transition-colors">
                  Document Vault
                </Link>
              </li>
              <li>
                <Link href="#payroll" className="hover:text-orange-600 transition-colors">
                  Statutory EPF & ESI
                </Link>
              </li>
            </ul>
          </div>

          {/* Company, Contact & Support */}
          <div className="text-left">
            <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider mb-4">
              Company & Help
            </h4>
            <ul className="space-y-2.5 text-sm text-slate-600">
              <li>
                <Link href="#pricing" className="hover:text-orange-600 transition-colors">
                  Pricing
                </Link>
              </li>
              <li>
                <a
                  href="https://wa.me/918402010207?text=Hi%20GlobizHR%20team%2C%20I%20would%20like%20to%20request%20a%20demo%20of%20the%20platform."
                  target="_blank"
                  rel="noopener noreferrer"
                  className="hover:text-orange-600 transition-colors inline-flex items-center gap-1.5"
                >
                  <span>Book a Demo</span>
                  <span className="text-[10px] px-1.5 py-0.5 bg-emerald-100 text-emerald-800 rounded font-semibold">WhatsApp</span>
                </a>
              </li>
              <li>
                <Link href="#security" className="hover:text-orange-600 transition-colors">
                  Security
                </Link>
              </li>
              <li>
                <a href="mailto:support@globizhub.com" className="hover:text-orange-600 transition-colors">
                  Contact Us
                </a>
              </li>
              <li>
                <Link href="#faq" className="hover:text-orange-600 transition-colors">
                  Support & Help
                </Link>
              </li>
              <li>
                <Link href="/login" className="hover:text-orange-600 transition-colors">
                  Employee Portal
                </Link>
              </li>
            </ul>
          </div>

          {/* Legal Column (From Design) */}
          <div className="text-left">
            <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider mb-4">
              Legal
            </h4>
            <ul className="space-y-2.5 text-sm text-slate-600">
              <li>
                <Link href="/careers" className="hover:text-orange-600 transition-colors">
                  Careers & Open Jobs
                </Link>
              </li>
              <li>
                <Link href="/privacy" className="hover:text-orange-600 transition-colors">
                  Privacy Policy
                </Link>
              </li>
              <li>
                <Link href="/terms" className="hover:text-orange-600 transition-colors">
                  Terms & Conditions
                </Link>
              </li>
              <li>
                <Link href="/refund-policy" className="hover:text-orange-600 transition-colors">
                  Refund Policy
                </Link>
              </li>
            </ul>
          </div>

        </div>

        {/* Bottom Bar */}
        <div className="mt-12 pt-8 border-t border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-slate-500">
          <p>© {currentYear} GlobizHR. All rights reserved.</p>

          <div className="flex flex-wrap items-center gap-1.5 text-xs text-slate-500">
            <span>A product of</span>
            <a
              href="https://globizhub.com/"
              target="_blank"
              rel="noopener noreferrer"
              className="font-bold text-slate-900 hover:text-[#F97316] transition-colors inline-flex items-center gap-1"
            >
              <span>GlobizHub India Pvt Ltd.</span>
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-3.5 h-3.5 opacity-70">
                <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" />
                <polyline points="15 3 21 3 21 9" />
                <line x1="10" y1="14" x2="21" y2="3" />
              </svg>
            </a>
          </div>

          <button
            onClick={scrollToTop}
            className="inline-flex items-center gap-1.5 text-xs text-slate-500 hover:text-slate-900 transition-colors cursor-pointer group"
            aria-label="Back to top"
          >
            <span>Back to top</span>
            <div className="w-5 h-5 rounded-full bg-slate-200/80 border border-slate-300 flex items-center justify-center group-hover:bg-[#F97316] group-hover:text-white group-hover:border-[#F97316] transition-colors">
              <ArrowUp className="w-3 h-3" />
            </div>
          </button>
        </div>

      </div>
    </footer>
  );
}
