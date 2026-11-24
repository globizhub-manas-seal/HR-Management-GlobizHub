"use client";

// src/app/(auth)/register/page.tsx

import Link from "next/link";
import Image from "next/image";
import { useSetupWizardStore } from "@/store/useSetupWizardStore";
import { Button } from "@/components/ui/button";
import Step1CompanyInfo from "@/components/wizard/Step1CompanyInfo";
import Step2CompanySettings from "@/components/wizard/Step2CompanySettings";
import Step3HolidayCalendar from "@/components/wizard/Step3HolidayCalendar";
import Step4Departments from "@/components/wizard/Step4Departments";
import Step5Roles from "@/components/wizard/Step5Roles";
import Step6SalaryComponents from "@/components/wizard/Step6SalaryComponents";
import Step7LeavePolicies from "@/components/wizard/Step7LeavePolicies";
import Step8ShiftManagement from "@/components/wizard/Step8ShiftManagement";
import Step9Branches from "@/components/wizard/Step9Branches";
import Step10InviteEmployees from "@/components/wizard/Step10InviteEmployees";

import WizardProgressBar from "@/components/wizard/WizardProgressBar";

export default function RegisterPage() {
  const { currentStep, prevStep } = useSetupWizardStore();

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex flex-col items-center py-8 sm:py-10 px-4 sm:px-6 lg:px-8">
      
      {/* Brand Header & Logo Bar */}
      <div className="w-full max-w-4xl mb-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-5 border-b border-slate-200/80">
        <Link href="/" className="inline-flex items-center gap-3 focus:outline-none group">
          <div className="relative h-12 w-[72px] shrink-0 bg-white p-1 rounded-xl shadow-xs border border-slate-200/80 group-hover:border-orange-300 transition-colors">
            <Image
              src="/globizhr-logo.png"
              alt="GlobizHR Official Logo"
              fill
              className="object-contain object-center"
              sizes="72px"
              priority
            />
          </div>
          <div className="flex flex-col justify-center">
            <div className="flex items-center gap-1.5">
              <span className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight leading-tight">
                Globiz<span className="text-[#F97316]">HR</span>
              </span>
              <span className="text-[10px] font-black px-1.5 py-0.5 bg-orange-100 text-[#F97316] rounded border border-orange-200 uppercase tracking-wide">
                Setup
              </span>
            </div>
            <span className="text-xs font-semibold text-slate-500 leading-tight mt-0.5">
              Organization Setup Wizard
            </span>
          </div>
        </Link>

        <div className="flex items-center gap-3.5 text-xs">
          <span className="text-slate-500 hidden sm:inline">Already have an account?</span>
          <Link
            href="/login"
            className="px-3.5 py-1.5 bg-white hover:bg-slate-50 text-slate-700 hover:text-slate-950 border border-slate-300 rounded-lg font-semibold transition-colors shadow-2xs"
          >
            Sign In
          </Link>
          <Link
            href="/"
            className="text-slate-500 hover:text-orange-600 font-medium transition-colors hidden sm:inline"
          >
            ← Back to Home
          </Link>
        </div>
      </div>

      {/* Page Heading */}
      <div className="w-full max-w-4xl text-center mb-6">
        <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
          Register Your Organization
        </h1>
        <p className="text-xs sm:text-sm text-slate-500 mt-1 max-w-xl mx-auto">
          Complete the 10-step guided onboarding to set up your company profile, holiday calendar, payroll structures, and invite your team.
        </p>
      </div>

      {/* Dynamic 10-Step Progress Bar with 5 visible per screen & hidden scrollbar */}
      <div className="w-full max-w-4xl">
        <WizardProgressBar />
      </div>

      {/* Dynamic Form Content Container */}
      <div className="w-full max-w-4xl bg-white p-8 rounded-xl shadow-sm border border-slate-100 relative">
        
        {/* Back Button (Only show if not on Step 1) */}
        {currentStep > 1 && (
          <Button 
            variant="ghost" 
            onClick={prevStep}
            className="absolute top-6 right-8 text-slate-500 hover:text-slate-900"
          >
            ← Back
          </Button>
        )}

        {/* STEP RENDERING */}
        {currentStep === 1 && (
          <div>
            <h2 className="text-2xl font-bold text-slate-900 mb-2">Company Information</h2>
            <p className="text-slate-500 mb-8">Let's start by getting to know your organization and setting up the main administrator.</p>
            <Step1CompanyInfo />
          </div>
        )}

        {currentStep === 2 && (
          <div>
            <h2 className="text-2xl font-bold text-slate-900 mb-2">Company Settings</h2>
            <p className="text-slate-500 mb-8">Configure your organization's default working hours, attendance method, and branding.</p>
            <Step2CompanySettings />
          </div>
        )}

        {currentStep === 3 && (
          <div>
            <h2 className="text-2xl font-bold text-slate-900 mb-2">Holiday Calendar</h2>
            <p className="text-slate-500 mb-8">Choose a base holiday calendar for your company. You can always add or remove specific holidays later.</p>
            <Step3HolidayCalendar />
          </div>
        )}

        {currentStep === 4 && (
          <div>
            <h2 className="text-2xl font-bold text-slate-900 mb-2">Organization Structure</h2>
            <p className="text-slate-500 mb-8">Let's set up the core departments for your company.</p>
            <Step4Departments />
          </div>
        )}

        {currentStep === 5 && (
          <div>
            <h2 className="text-2xl font-bold text-slate-900 mb-2">Designations & Roles</h2>
            <p className="text-slate-500 mb-8">Let's set up the core job titles for your team members.</p>
            <Step5Roles />
          </div>
        )}

        {currentStep === 6 && (
          <div>
            <h2 className="text-2xl font-bold text-slate-900 mb-2">Salary Structure</h2>
            <p className="text-slate-500 mb-8">Define the default components used to calculate employee payroll.</p>
            <Step6SalaryComponents />
          </div>
        )}

        {currentStep === 7 && (
          <div>
            <h2 className="text-2xl font-bold text-slate-900 mb-2">Leave Policies</h2>
            <p className="text-slate-500 mb-8">Set up the default leave and time-off policies for your organization.</p>
            <Step7LeavePolicies />
          </div>
        )}

        {currentStep === 8 && (
          <div>
            <h2 className="text-2xl font-bold text-slate-900 mb-2">Shift Types</h2>
            <p className="text-slate-500 mb-8">Define the working shifts available across your organization.</p>
            <Step8ShiftManagement />
          </div>
        )}

        {currentStep === 9 && (
          <div>
            <h2 className="text-2xl font-bold text-slate-900 mb-2">Branches & Locations</h2>
            <p className="text-slate-500 mb-8">Set up the physical and virtual offices for your organization.</p>
            <Step9Branches />
          </div>
        )}

        {currentStep === 10 && (
          <div>
            <h2 className="text-3xl font-bold text-slate-900 mb-2">Bring your team on board</h2>
            <p className="text-slate-500 mb-8">Invite your employees now, or skip this step and add them later from the dashboard.</p>
            <Step10InviteEmployees />
          </div>
        )}

      </div>
    </div>
  );
}
