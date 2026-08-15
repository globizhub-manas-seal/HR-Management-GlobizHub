// Inside src/app/page.tsx

"use client"; // Make sure this is at the very top of your file if it isn't already

import { useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Menu, X, ArrowRight, Sparkles, ShieldCheck, Globe, HeartHandshake, Users, Clock, Banknote, Calendar, CheckCircle2 } from "lucide-react";

export default function LandingPage() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  return (
    <main className="min-h-screen bg-slate-50 font-sans selection:bg-emerald-100 selection:text-emerald-900 text-slate-900">
      
      {/* 1. UPGRADED RESPONSIVE NAVBAR */}
      <nav className="sticky top-0 z-50 w-full bg-white/90 backdrop-blur-md border-b border-slate-200">
        <div className="flex items-center justify-between px-6 py-4 max-w-7xl mx-auto">
          
          {/* Brand Logo */}
          <Link href="/" className="flex items-center space-x-3 text-2xl font-bold tracking-tight">
            <div className="p-2 bg-emerald-500 rounded-xl text-white shadow-md shadow-emerald-500/20">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M12 2L2 7l10 5 10-5-10-5z"/><path d="M2 17l10 5 10-5"/><path d="M2 12l10 5 10-5"/></svg>
            </div>
            <span className="bg-gradient-to-r from-slate-900 to-slate-700 bg-clip-text text-transparent">
              TeamHub <span className="text-emerald-500 text-sm font-semibold px-2 py-0.5 bg-emerald-50 rounded-full border border-emerald-100 hidden sm:inline">HRMS</span>
            </span>
          </Link>

          {/* Desktop Nav Links */}
          <div className="hidden md:flex items-center space-x-8 text-sm font-medium text-slate-600">
            <Link href="#features" className="hover:text-emerald-600 transition-colors">Features</Link>
            <Link href="#compliance" className="hover:text-emerald-600 transition-colors">Security</Link>
          </div>

          {/* Desktop Action Buttons */}
          <div className="hidden md:flex items-center space-x-3">
            <Link href="/login">
              <Button variant="ghost" className="text-slate-600 hover:text-slate-900 font-medium">Log in</Button>
            </Link>
            <Link href="/register">
              <Button className="bg-emerald-600 hover:bg-emerald-700 text-white shadow-md shadow-emerald-600/20 font-medium rounded-xl">
                Get Started Free
              </Button>
            </Link>
          </div>

          {/* Mobile Hamburger Button */}
          <div className="md:hidden flex items-center">
            <Button 
              variant="ghost" 
              size="icon" 
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="text-slate-700 focus:outline-none"
            >
              {mobileMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
            </Button>
          </div>
        </div>

        {/* Mobile Dropdown Menu Drawer */}
        {mobileMenuOpen && (
          <div className="md:hidden bg-white border-b border-slate-200 px-6 py-6 space-y-4 animate-in slide-in-from-top-2 duration-200">
            <div className="flex flex-col space-y-3">
              <Link 
                href="#features" 
                onClick={() => setMobileMenuOpen(false)}
                className="text-slate-600 font-medium py-2 hover:text-emerald-600"
              >
                Features
              </Link>
              <Link 
                href="#compliance" 
                onClick={() => setMobileMenuOpen(false)}
                className="text-slate-600 font-medium py-2 hover:text-emerald-600"
              >
                Security
              </Link>
            </div>
            <hr className="border-slate-100" />
            <div className="flex flex-col space-y-3 pt-2">
              <Link href="/login" onClick={() => setMobileMenuOpen(false)}>
                <Button variant="outline" className="w-full justify-center border-slate-200 text-slate-700">
                  Log in
                </Button>
              </Link>
              <Link href="/register" onClick={() => setMobileMenuOpen(false)}>
                <Button className="w-full justify-center bg-emerald-600 hover:bg-emerald-700 text-white">
                  Get Started Free
                </Button>
              </Link>
            </div>
          </div>
        )}
      </nav>

      {/* Rest of your page content remains exactly the same below... */}

      {/* 2. HERO SECTION */}
      <section className="relative pt-20 pb-28 overflow-hidden bg-gradient-to-b from-white via-slate-50/50 to-slate-50">
        <div className="max-w-7xl mx-auto px-6 text-center">
          
          <div className="inline-flex items-center rounded-full px-4 py-1.5 text-xs font-semibold text-emerald-700 bg-emerald-50 border border-emerald-200/60 mb-8 shadow-sm">
            <Sparkles className="w-3.5 h-3.5 mr-2 text-emerald-500" />
            Next-Gen Workforce & Payroll Engine v1.0
          </div>
          
          <h1 className="text-5xl md:text-7xl font-extrabold tracking-tight max-w-4xl mx-auto leading-[1.15]">
            Manage your people, <br className="hidden md:block"/>
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-600 via-teal-500 to-emerald-500">
              not just your paperwork.
            </span>
          </h1>
          
          <p className="mt-6 text-lg md:text-xl text-slate-600 max-w-2xl mx-auto leading-relaxed">
            TeamHub unifies automated payroll, smart attendance tracking, accurate leave balances, and employee records into one secure, lightning-fast workspace.
          </p>
          
          <div className="mt-10 flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link href="/register" className="w-full sm:w-auto">
              <Button size="lg" className="h-14 px-8 text-base bg-emerald-600 hover:bg-emerald-700 text-white shadow-xl shadow-emerald-600/25 w-full rounded-xl">
                Start 14-Day Free Trial <ArrowRight className="ml-2 h-5 w-5" />
              </Button>
            </Link>
            <Link href="/login" className="w-full sm:w-auto">
              <Button size="lg" variant="outline" className="h-14 px-8 text-base border-slate-200 text-slate-700 hover:bg-slate-100 w-full rounded-xl">
                Explore Live Demo
              </Button>
            </Link>
          </div>
          
          <div className="mt-6 flex items-center justify-center space-x-6 text-xs text-slate-400 font-medium">
            <span className="flex items-center"><CheckCircle2 className="w-4 h-4 text-emerald-500 mr-1.5" /> No credit card required</span>
            <span className="flex items-center"><CheckCircle2 className="w-4 h-4 text-emerald-500 mr-1.5" /> Setup in 3 minutes</span>
            <span className="flex items-center"><CheckCircle2 className="w-4 h-4 text-emerald-500 mr-1.5" /> Cancel anytime</span>
          </div>
        </div>
      </section>

      {/* 3. TRUSTED BY SECTION */}
      <section className="border-y border-slate-200/80 bg-white py-12">
        <div className="max-w-7xl mx-auto px-6 text-center">
          <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-8">Trusted by hyper-growth tech & healthcare teams worldwide</p>
          <div className="flex flex-wrap justify-center items-center gap-10 md:gap-20 opacity-60 grayscale hover:grayscale-0 transition-all">
            <div className="text-lg font-bold font-serif tracking-tight text-slate-700">Acme Corp</div>
            <div className="text-lg font-bold font-mono text-slate-700">Globex Bio</div>
            <div className="text-lg font-bold font-sans text-slate-700">Soylent Health</div>
            <div className="text-lg font-bold italic text-slate-700">Initech Systems</div>
            <div className="text-lg font-bold tracking-widest text-slate-700">UMBRELLA</div>
          </div>
        </div>
      </section>

      {/* 4. FEATURES GRID */}
      <section id="features" className="py-24 bg-slate-50 scroll-mt-12">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold tracking-tight text-slate-900 mb-4">Everything you need to run HR smoothly</h2>
            <p className="text-lg text-slate-600 max-w-2xl mx-auto">Say goodbye to messy spreadsheets, human errors, and disconnected apps. TeamHub brings total clarity to your organization.</p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            
            {/* Feature 1 */}
            <div className="bg-white p-8 rounded-2xl border border-slate-200/70 shadow-sm hover:shadow-md transition-all group">
              <div className="w-12 h-12 bg-emerald-50 rounded-xl flex items-center justify-center mb-6 group-hover:bg-emerald-600 transition-colors">
                <Users className="h-6 w-6 text-emerald-600 group-hover:text-white transition-colors" />
              </div>
              <h3 className="text-xl font-bold text-slate-900 mb-3">Employee Directory & Profiles</h3>
              <p className="text-slate-600 leading-relaxed text-sm">Centralize employee records, emergency contacts, skills, and organizational trees in a secure profile view.</p>
            </div>

            {/* Feature 2 */}
            <div className="bg-white p-8 rounded-2xl border border-slate-200/70 shadow-sm hover:shadow-md transition-all group">
              <div className="w-12 h-12 bg-blue-50 rounded-xl flex items-center justify-center mb-6 group-hover:bg-blue-600 transition-colors">
                <Clock className="h-6 w-6 text-blue-600 group-hover:text-white transition-colors" />
              </div>
              <h3 className="text-xl font-bold text-slate-900 mb-3">Time, Attendance & Overtime</h3>
              <p className="text-slate-600 leading-relaxed text-sm">Automate check-ins, manual corrections, shift schedules, and calculate overtime hours with total precision.</p>
            </div>

            {/* Feature 3 */}
            <div className="bg-white p-8 rounded-2xl border border-slate-200/70 shadow-sm hover:shadow-md transition-all group">
              <div className="w-12 h-12 bg-purple-50 rounded-xl flex items-center justify-center mb-6 group-hover:bg-purple-600 transition-colors">
                <Banknote className="h-6 w-6 text-purple-600 group-hover:text-white transition-colors" />
              </div>
              <h3 className="text-xl font-bold text-slate-900 mb-3">Instant 1-Click Payroll Engine</h3>
              <p className="text-slate-600 leading-relaxed text-sm">Factor in basic pay, HRA, tax deductions, loss-of-pay leaves, and generate printable PDF employee payslips instantly.</p>
            </div>

            {/* Feature 4 */}
            <div className="bg-white p-8 rounded-2xl border border-slate-200/70 shadow-sm hover:shadow-md transition-all group">
              <div className="w-12 h-12 bg-orange-50 rounded-xl flex items-center justify-center mb-6 group-hover:bg-orange-600 transition-colors">
                <Calendar className="h-6 w-6 text-orange-600 group-hover:text-white transition-colors" />
              </div>
              <h3 className="text-xl font-bold text-slate-900 mb-3">Smart Leave Management</h3>
              <p className="text-slate-600 leading-relaxed text-sm">Configure holiday calendars, custom leave policies, and review multi-tier leave requests with zero friction.</p>
            </div>

            {/* Feature 5 */}
            <div className="bg-white p-8 rounded-2xl border border-slate-200/70 shadow-sm hover:shadow-md transition-all group">
              <div className="w-12 h-12 bg-rose-50 rounded-xl flex items-center justify-center mb-6 group-hover:bg-rose-600 transition-colors">
                <ShieldCheck className="h-6 w-6 text-rose-600 group-hover:text-white transition-colors" />
              </div>
              <h3 className="text-xl font-bold text-slate-900 mb-3">Fine-Grained RBAC & Audit Logs</h3>
              <p className="text-slate-600 leading-relaxed text-sm">Enterprise security guards block unauthorized actions while immutable audit trails log every administrative change.</p>
            </div>

            {/* Action CTA Card */}
            <div className="bg-gradient-to-br from-slate-900 to-slate-800 p-8 rounded-2xl border border-slate-800 shadow-xl flex flex-col justify-center items-center text-center text-white">
              <h3 className="text-2xl font-bold mb-2">Ready to transform your HR?</h3>
              <p className="text-slate-400 text-sm mb-6">Join hundreds of modern companies today.</p>
              <Link href="/register" className="w-full">
                <Button className="bg-emerald-500 hover:bg-emerald-600 text-white font-semibold w-full rounded-xl shadow-lg shadow-emerald-500/20">
                  Start Your Free Account
                </Button>
              </Link>
            </div>

          </div>
        </div>
      </section>

      {/* 5. SECURITY & COMPLIANCE BANNER */}
      <section id="compliance" className="py-16 bg-white border-y border-slate-200/80">
        <div className="max-w-7xl mx-auto px-6 grid md:grid-cols-3 gap-8 text-center md:text-left items-center">
          <div className="flex items-center justify-center md:justify-start space-x-4">
            <div className="p-3 bg-emerald-50 rounded-2xl text-emerald-600">
              <ShieldCheck className="w-8 h-8" />
            </div>
            <div>
              <h4 className="font-bold text-slate-900">Bank-Grade Security</h4>
              <p className="text-sm text-slate-500">Encrypted data at rest and in transit.</p>
            </div>
          </div>
          <div className="flex items-center justify-center md:justify-start space-x-4">
            <div className="p-3 bg-blue-50 rounded-2xl text-blue-600">
              <Globe className="w-8 h-8" />
            </div>
            <div>
              <h4 className="font-bold text-slate-900">Cloud Reliable</h4>
              <p className="text-sm text-slate-500">Hosted on high-availability PostgreSQL clusters.</p>
            </div>
          </div>
          <div className="flex items-center justify-center md:justify-start space-x-4">
            <div className="p-3 bg-purple-50 rounded-2xl text-purple-600">
              <HeartHandshake className="w-8 h-8" />
            </div>
            <div>
              <h4 className="font-bold text-slate-900">Dedicated Support</h4>
              <p className="text-sm text-slate-500">Our engineering team is here to assist.</p>
            </div>
          </div>
        </div>
      </section>

      {/* 6. UPGRADED FOOTER */}
     <footer className="bg-slate-950 text-slate-400 border-t border-slate-800">
  <div className="max-w-7xl mx-auto px-6 pt-14 pb-10">

    {/* Main Footer */}
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-10 lg:gap-8">

      {/* Brand */}
      <div className="lg:col-span-2">
        <div className="flex items-center gap-3 mb-5">
          <div className="p-2.5 bg-emerald-500 rounded-xl text-white shadow-lg shadow-emerald-500/20">
            <svg
              width="18"
              height="18"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M12 2L2 7l10 5 10-5-10-5z" />
              <path d="M2 17l10 5 10-5" />
              <path d="M2 12l10 5 10-5" />
            </svg>
          </div>

          <span className="text-white text-xl font-bold tracking-tight">
            TeamHub
          </span>
        </div>

        <p className="text-sm text-slate-400 max-w-sm leading-7 mb-6">
          The modern operating system for HR teams. Streamline payroll,
          attendance, leave management, and employee records in one secure
          platform.
        </p>

        {/* Social Icons */}
        <div className="flex items-center gap-3">
          <a
            href="#"
            className="w-9 h-9 rounded-lg bg-slate-900 border border-slate-800 flex items-center justify-center hover:bg-emerald-500 hover:text-white hover:border-emerald-500 transition-all"
            aria-label="LinkedIn"
          >
            in
          </a>

          <a
            href="#"
            className="w-9 h-9 rounded-lg bg-slate-900 border border-slate-800 flex items-center justify-center hover:bg-emerald-500 hover:text-white hover:border-emerald-500 transition-all"
            aria-label="Twitter"
          >
            𝕏
          </a>

          <a
            href="#"
            className="w-9 h-9 rounded-lg bg-slate-900 border border-slate-800 flex items-center justify-center hover:bg-emerald-500 hover:text-white hover:border-emerald-500 transition-all"
            aria-label="Facebook"
          >
            f
          </a>

          <a
            href="#"
            className="w-9 h-9 rounded-lg bg-slate-900 border border-slate-800 flex items-center justify-center hover:bg-emerald-500 hover:text-white hover:border-emerald-500 transition-all"
            aria-label="Instagram"
          >
            ◎
          </a>
        </div>
      </div>

      {/* Product */}
      <div>
        <h5 className="text-white font-semibold text-sm mb-5">
          Product
        </h5>

        <ul className="space-y-3 text-sm">
          <li>
            <Link
              href="#features"
              className="hover:text-emerald-400 transition-colors"
            >
              Features
            </Link>
          </li>

          <li>
            <Link
              href="#pricing"
              className="hover:text-emerald-400 transition-colors"
            >
              Pricing
            </Link>
          </li>

          <li>
            <Link
              href="/register"
              className="hover:text-emerald-400 transition-colors"
            >
              Get Started
            </Link>
          </li>

          <li>
            <Link
              href="/login"
              className="hover:text-emerald-400 transition-colors"
            >
              Sign In
            </Link>
          </li>
        </ul>
      </div>

      {/* Company */}
      <div>
        <h5 className="text-white font-semibold text-sm mb-5">
          Company
        </h5>

        <ul className="space-y-3 text-sm">
          <li>
            <span className="hover:text-emerald-400 transition-colors cursor-pointer">
              About Us
            </span>
          </li>

          <li>
            <span className="hover:text-emerald-400 transition-colors cursor-pointer">
              Careers
            </span>
          </li>

          <li>
            <span className="hover:text-emerald-400 transition-colors cursor-pointer">
              Contact
            </span>
          </li>

          <li>
            <span className="hover:text-emerald-400 transition-colors cursor-pointer">
              Blog
            </span>
          </li>
        </ul>
      </div>

      {/* Resources */}
      <div>
        <h5 className="text-white font-semibold text-sm mb-5">
          Resources
        </h5>

        <ul className="space-y-3 text-sm">
          <li>
            <span className="hover:text-emerald-400 transition-colors cursor-pointer">
              Help Center
            </span>
          </li>

          <li>
            <span className="hover:text-emerald-400 transition-colors cursor-pointer">
              Documentation
            </span>
          </li>

          <li>
            <span className="hover:text-emerald-400 transition-colors cursor-pointer">
              Guides
            </span>
          </li>

          <li>
            <span className="hover:text-emerald-400 transition-colors cursor-pointer">
              Support
            </span>
          </li>
        </ul>
      </div>
    </div>

    {/* Bottom CTA / Newsletter */}
    <div className="mt-12 pt-8 border-t border-slate-800 grid grid-cols-1 md:grid-cols-2 gap-6 items-center">

      <div>
        <h4 className="text-white font-semibold mb-1">
          Stay in the loop
        </h4>

        <p className="text-sm text-slate-500">
          Get the latest HR tips, product updates, and news.
        </p>
      </div>

      <div className="flex w-full md:max-w-md md:ml-auto">
        <input
          type="email"
          placeholder="Enter your email"
          className="flex-1 min-w-0 bg-slate-900 border border-slate-800 rounded-l-xl px-4 py-3 text-sm text-white placeholder:text-slate-600 outline-none focus:border-emerald-500 transition-colors"
        />

        <button
          type="button"
          className="px-5 bg-emerald-500 text-white rounded-r-xl hover:bg-emerald-600 transition-colors font-medium"
          aria-label="Subscribe"
        >
          →
        </button>
      </div>
    </div>

    {/* Bottom Bar */}
    <div className="mt-8 pt-6 border-t border-slate-800/80 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-slate-500">

      <p>
        © {new Date().getFullYear()} TeamHub HRMS. All rights reserved.
      </p>

      <div className="flex items-center gap-5">
        <span className="hover:text-slate-300 cursor-pointer transition-colors">
          Privacy Policy
        </span>

        <span className="hover:text-slate-300 cursor-pointer transition-colors">
          Terms of Service
        </span>
      </div>

    </div>
  </div>
</footer>

    </main>
  );
}