"use client";

import LandingNavbar from "@/components/landing/LandingNavbar";
import LandingHero from "@/components/landing/LandingHero";
import LandingHowItWorks from "@/components/landing/LandingHowItWorks";
import LandingCoreHR from "@/components/landing/LandingCoreHR";
import LandingAttendance from "@/components/landing/LandingAttendance";
import LandingPayroll from "@/components/landing/LandingPayroll";
import LandingBuiltForIndia from "@/components/landing/LandingBuiltForIndia";
import LandingOperations from "@/components/landing/LandingOperations";
import LandingMobileApp from "@/components/landing/LandingMobileApp";
import LandingSecurity from "@/components/landing/LandingSecurity";
import LandingPricing from "@/components/landing/LandingPricing";
import LandingFaq from "@/components/landing/LandingFaq";
import LandingCta from "@/components/landing/LandingCta";
import LandingFooter from "@/components/landing/LandingFooter";

export default function LandingPage() {
  return (
    <main className="min-h-screen bg-white font-sans text-slate-900 antialiased selection:bg-orange-500/20 selection:text-orange-900">
      {/* 1. Header & Navigation */}
      <LandingNavbar />

      {/* 2. Hero Section + Interactive Window Mockup + 5 Feature Tiles */}
      <LandingHero />

      {/* 3. Up and running in 3 simple steps */}
      <LandingHowItWorks />

      {/* 4. One place for every employee record (Employee Directory / Core HR) */}
      <LandingCoreHR />

      {/* 5. Accurate attendance, overtime and leave approvals (Attendance and Leave) */}
      <LandingAttendance />

      {/* 6. Payroll in one click, payslips in seconds (Payroll & Payslips) */}
      <LandingPayroll />

      {/* 7. Payroll that understands Indian compliance (Built for India) */}
      <LandingBuiltForIndia />

      {/* 8. Shifts, tasks and announcements, together (Operations Hub) */}
      <LandingOperations />

      {/* 9. HR in every employee's pocket (Mobile Self-Service + Indian Metric Stat Strip) */}
      <LandingMobileApp />

      {/* 10. Your people's data stays protected (Security & Trust) */}
      <LandingSecurity />

      {/* 11. Simple pricing: ₹49 per user per month (Free Plan & Business Plan) */}
      <LandingPricing />

      {/* 12. Frequently Asked Questions */}
      <LandingFaq />

      {/* 13. Final Call to Action Banner */}
      <LandingCta />

      {/* 14. Official GlobizHR Footer by GlobizHub India Pvt Ltd */}
      <LandingFooter />
    </main>
  );
}
