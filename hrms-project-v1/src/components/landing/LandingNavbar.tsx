"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import {
  Menu,
  X,
  ArrowRight,
  Users,
  Clock,
  Wallet,
  CalendarDays,
  Tag,
  HelpCircle,
  LogIn,
} from "lucide-react";

const NAV_ITEMS = [
  { name: "Core HR", href: "#core-hr", id: "core-hr", icon: Users },
  { name: "Attendance & Leaves", href: "#attendance", id: "attendance", icon: Clock },
  { name: "Payroll Engine", href: "#payroll", id: "payroll", icon: Wallet },
  { name: "Shifts & Hub", href: "#shifts", id: "shifts", icon: CalendarDays },
  { name: "Pricing", href: "#pricing", id: "pricing", icon: Tag },
  { name: "FAQ", href: "#faq", id: "faq", icon: HelpCircle },
];

export default function LandingNavbar() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [activeSection, setActiveSection] = useState("");

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 15);

      const sectionIds = ["core-hr", "attendance", "payroll", "shifts", "pricing", "faq"];
      const scrollPosition = window.scrollY + 130;

      for (let i = sectionIds.length - 1; i >= 0; i--) {
        const el = document.getElementById(sectionIds[i]);
        if (el && el.offsetTop <= scrollPosition) {
          setActiveSection(sectionIds[i]);
          return;
        }
      }
      if (window.scrollY < 180) {
        setActiveSection("");
      }
    };

    window.addEventListener("scroll", handleScroll, { passive: true });
    handleScroll();
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  return (
    <header
      className={`sticky top-0 z-50 w-full transition-all duration-300 ${
        scrolled
          ? "bg-white/95 backdrop-blur-xl border-b border-slate-200/80 shadow-[0_4px_24px_-4px_rgba(0,0,0,0.06)]"
          : "bg-white/80 backdrop-blur-md border-b border-slate-200/40"
      }`}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div
          className={`flex items-center justify-between transition-all duration-300 ${
            scrolled ? "h-16" : "h-20"
          }`}
        >
          {/* Brand Logo with Official GlobizHR Branding */}
          <Link
            href="/"
            className="flex items-center gap-2.5 sm:gap-3 group focus:outline-none shrink-0"
            aria-label="GlobizHR Homepage"
          >
            {/* Logo Image Container with exact aspect ratio (3:2) */}
            <div className="relative h-11 w-[66px] sm:h-12 sm:w-[72px] shrink-0 flex items-center justify-center transition-transform group-hover:scale-105 duration-200">
              <Image
                src="/globizhr-logo.png"
                alt="GlobizHR Official Logo"
                fill
                priority
                className="object-contain object-center"
                sizes="(max-width: 640px) 66px, 72px"
              />
            </div>

            {/* Prominent brand name with no wrapping */}
            <div className="flex flex-col justify-center">
              <div className="flex items-center gap-1.5 whitespace-nowrap">
                <span className="text-xl sm:text-2xl font-black tracking-tight text-slate-900 leading-tight">
                  Globiz<span className="text-[#F97316]">HR</span>
                </span>
                <span className="text-[10px] font-black px-1.5 py-0.5 bg-orange-100 text-[#F97316] rounded-md border border-orange-200 uppercase tracking-wide">
                  HRMS
                </span>
              </div>
              <span className="text-xs font-semibold text-slate-500 leading-tight tracking-tight mt-0.5 hidden xl:block whitespace-nowrap">
                A complete HR management solution
              </span>
            </div>
          </Link>

          {/* Desktop Navigation Links with Generous Spacing & Active Indicator */}
          <nav className="hidden lg:flex items-center gap-5 xl:gap-7 2xl:gap-8 whitespace-nowrap">
            {NAV_ITEMS.map((item) => {
              const isActive = activeSection === item.id;
              return (
                <Link
                  key={item.id}
                  href={item.href}
                  className={`whitespace-nowrap px-3 py-1.5 text-sm font-semibold rounded-xl transition-all duration-200 ${
                    isActive
                      ? "text-[#F97316] bg-orange-50 border border-orange-200/80 shadow-2xs font-bold"
                      : "text-slate-600 hover:text-slate-950 hover:bg-slate-100/70"
                  }`}
                >
                  <span>{item.name}</span>
                </Link>
              );
            })}
          </nav>

          {/* Desktop Auth CTAs with Generous Gap */}
          <div className="hidden lg:flex items-center gap-3 shrink-0 whitespace-nowrap">
            <Link href="/login" className="shrink-0">
              <Button
                variant="outline"
                className="whitespace-nowrap h-10 px-4 text-sm font-bold text-slate-800 hover:text-slate-950 bg-white hover:bg-orange-50/50 border-slate-300 hover:border-orange-300 rounded-xl shadow-2xs hover:shadow-xs transition-all cursor-pointer flex items-center gap-1.5"
              >
                <LogIn className="w-4 h-4 text-[#F97316]" />
                <span>Sign In</span>
              </Button>
            </Link>
            <Link href="/register" className="shrink-0">
              <Button
                className="whitespace-nowrap h-10 px-5 bg-gradient-to-r from-[#F97316] to-[#EA580C] hover:from-[#EA580C] hover:to-[#C2410C] text-white font-bold text-sm rounded-xl shadow-sm hover:shadow-md hover:shadow-orange-500/20 hover:scale-[1.02] active:scale-[0.98] transition-all cursor-pointer flex items-center gap-1.5"
              >
                <span>Start Free</span>
                <ArrowRight className="w-4 h-4" />
              </Button>
            </Link>
          </div>

          {/* Mobile Menu Toggle Button */}
          <div className="flex lg:hidden">
            <button
              type="button"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="p-2 rounded-xl text-slate-600 hover:text-slate-900 hover:bg-slate-100 transition-colors focus:outline-none"
              aria-label="Toggle navigation menu"
            >
              {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Drawer with Smooth Fade/Slide and Module Icons */}
      <div
        className={`lg:hidden overflow-hidden transition-all duration-300 ease-in-out border-b border-slate-200/90 bg-white/95 backdrop-blur-xl shadow-xl ${
          mobileMenuOpen ? "max-h-[520px] opacity-100 py-4 px-4 sm:px-6" : "max-h-0 opacity-0 py-0 px-4"
        }`}
      >
        <div className="space-y-1 pb-4 border-b border-slate-100">
          {NAV_ITEMS.map((item) => {
            const Icon = item.icon;
            const isActive = activeSection === item.id;
            return (
              <Link
                key={item.id}
                href={item.href}
                onClick={() => setMobileMenuOpen(false)}
                className={`flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-sm font-medium transition-colors ${
                  isActive
                    ? "bg-orange-50 text-[#F97316] font-bold"
                    : "text-slate-700 hover:text-orange-600 hover:bg-slate-50"
                }`}
              >
                <div
                  className={`w-7 h-7 rounded-lg flex items-center justify-center ${
                    isActive ? "bg-orange-100 text-[#F97316]" : "bg-slate-100 text-slate-500"
                  }`}
                >
                  <Icon className="w-4 h-4" />
                </div>
                <span>{item.name}</span>
              </Link>
            );
          })}
        </div>

        <div className="pt-3 flex flex-col gap-2.5">
          <Link href="/login" onClick={() => setMobileMenuOpen(false)}>
            <Button
              variant="outline"
              className="w-full justify-center h-11 text-slate-900 border-slate-300 hover:border-orange-300 rounded-xl font-bold hover:bg-orange-50/50 flex items-center gap-2"
            >
              <LogIn className="w-4 h-4 text-[#F97316]" />
              <span>Sign In</span>
            </Button>
          </Link>
          <Link href="/register" onClick={() => setMobileMenuOpen(false)}>
            <Button className="w-full justify-center h-11 bg-gradient-to-r from-[#F97316] to-[#EA580C] hover:from-[#EA580C] hover:to-[#C2410C] text-white rounded-xl font-bold shadow-md shadow-orange-500/20">
              Start Free
              <ArrowRight className="w-4 h-4 ml-1.5" />
            </Button>
          </Link>
        </div>
      </div>
    </header>
  );
}
