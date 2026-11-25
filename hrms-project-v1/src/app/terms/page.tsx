import Link from "next/link";
import Image from "next/image";
import { ArrowLeft, FileText, CheckCircle2 } from "lucide-react";

export const metadata = {
  title: "Terms & Conditions | GlobizHR - GlobizHub India Pvt Ltd",
  description: "Terms and Conditions for GlobizHR - A product of GlobizHub India Pvt Ltd",
};

export default function TermsPage() {
  return (
    <div className="min-h-screen bg-slate-50 text-slate-800">
      {/* Top Navbar */}
      <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-slate-200">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2 focus:outline-none">
            <div className="relative h-10 w-16 shrink-0">
              <Image
                src="/globizhr-logo.png"
                alt="GlobizHR Logo"
                fill
                className="object-contain"
                sizes="64px"
              />
            </div>
            <span className="text-xl font-black text-slate-900 tracking-tight">
              Globiz<span className="text-[#F97316]">HR</span>
            </span>
          </Link>
          <Link
            href="/"
            className="inline-flex items-center gap-1.5 text-xs sm:text-sm font-semibold text-slate-600 hover:text-[#F97316] transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Back to Home</span>
          </Link>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-4xl mx-auto px-4 sm:px-6 py-12 md:py-16">
        <div className="bg-white border border-slate-200/90 rounded-2xl p-6 sm:p-10 shadow-xs">
          
          <div className="border-b border-slate-100 pb-6 mb-8">
            <div className="inline-flex items-center gap-2 px-3 py-1 bg-orange-50 border border-orange-200 text-[#F97316] text-xs font-bold rounded-full mb-3">
              <FileText className="w-3.5 h-3.5" />
              <span>LEGAL & COMPLIANCE</span>
            </div>
            <h1 className="text-2xl sm:text-3xl md:text-4xl font-black text-slate-900 tracking-tight">
              Terms & Conditions
            </h1>
            <p className="mt-2 text-sm text-slate-500">
              Last updated: November 2026 • GlobizHub India Pvt Ltd
            </p>
          </div>

          <div className="space-y-8 text-sm sm:text-base leading-relaxed text-slate-600 font-normal">
            <section className="space-y-3">
              <h2 className="text-lg sm:text-xl font-bold text-slate-900">
                1. Acceptance of Terms
              </h2>
              <p>
                By registering for, accessing, or using the GlobizHR platform and related services provided by <strong>GlobizHub India Pvt Ltd</strong>, you agree to be bound by these Terms and Conditions. If you are entering into this agreement on behalf of a company or other legal entity, you represent that you have the authority to bind such entity.
              </p>
            </section>

            <section className="space-y-3">
              <h2 className="text-lg sm:text-xl font-bold text-slate-900">
                2. Platform Licensing & Permitted Use
              </h2>
              <p>
                GlobizHub India Pvt Ltd grants the subscribing enterprise a non-exclusive, non-transferable right to access and utilize the cloud-based HRMS, payroll calculator, attendance tracking, shift scheduling, and employee directory modules in accordance with their purchased subscription plan.
              </p>
            </section>

            <section className="space-y-3">
              <h2 className="text-lg sm:text-xl font-bold text-slate-900">
                3. Account Responsibilities & Data Security
              </h2>
              <p>
                Subscribers are responsible for maintaining the confidentiality of their administrator and employee credentials, setting up role-based access permissions, and ensuring lawful processing of workforce data in accordance with applicable laws.
              </p>
            </section>

            <section className="space-y-3">
              <h2 className="text-lg sm:text-xl font-bold text-slate-900">
                4. Statutory Compliance Disclaimer
              </h2>
              <p>
                While GlobizHR provides automated statutory calculations (including EPF, ESIC, Professional Tax, and TDS), employers remain ultimately responsible for the timely remittance of statutory dues and regulatory returns with appropriate government portals.
              </p>
            </section>

            <section className="space-y-3 pt-4 border-t border-slate-100">
              <h2 className="text-lg sm:text-xl font-bold text-slate-900">
                5. Contact & Support
              </h2>
              <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl space-y-1 text-sm text-slate-700">
                <p><strong>GlobizHub India Pvt Ltd</strong></p>
                <p>Email: <a href="mailto:support@globizhub.com" className="text-[#F97316] font-semibold hover:underline">support@globizhub.com</a></p>
                <p>WhatsApp Support: <a href="https://wa.me/918402010207" target="_blank" rel="noopener noreferrer" className="text-[#F97316] font-semibold hover:underline">+91 8402010207</a></p>
              </div>
            </section>
          </div>

        </div>
      </main>
    </div>
  );
}
