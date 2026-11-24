import Link from "next/link";
import Image from "next/image";
import { ArrowLeft, ShieldCheck, Lock, FileText, CheckCircle2 } from "lucide-react";

export const metadata = {
  title: "Privacy Policy | GlobizHR - GlobizHub India Pvt Ltd",
  description: "GlobizHR Privacy & Security Policy. Learn how we safeguard employee records, payroll, and personal data under Indian IT and DPDP regulations.",
};

export default function PrivacyPage() {
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
          
          {/* Header */}
          <div className="border-b border-slate-100 pb-6 mb-8">
            <div className="inline-flex items-center gap-2 px-3 py-1 bg-orange-50 border border-orange-200 text-[#F97316] text-xs font-bold rounded-full mb-3">
              <ShieldCheck className="w-3.5 h-3.5" />
              <span>DATA PROTECTION & PRIVACY</span>
            </div>
            <h1 className="text-2xl sm:text-3xl md:text-4xl font-black text-slate-900 tracking-tight">
              Privacy Policy
            </h1>
            <p className="mt-2 text-sm text-slate-500">
              Last updated: November 2026 • GlobizHub India Pvt Ltd
            </p>
          </div>

          <div className="space-y-8 text-sm sm:text-base leading-relaxed text-slate-600 font-normal">
            <section className="space-y-3">
              <h2 className="text-lg sm:text-xl font-bold text-slate-900 flex items-center gap-2">
                <Lock className="w-5 h-5 text-[#F97316]" />
                1. Commitment to Data Privacy
              </h2>
              <p>
                At GlobizHR (a software product developed and maintained by <strong>GlobizHub India Pvt Ltd</strong>), we treat the security and confidentiality of your enterprise workforce data with paramount importance. This Privacy Policy details our practices concerning the collection, storage, encryption, and processing of customer, employee, and business data.
              </p>
            </section>

            <section className="space-y-3">
              <h2 className="text-lg sm:text-xl font-bold text-slate-900 flex items-center gap-2">
                <FileText className="w-5 h-5 text-[#F97316]" />
                2. Data We Collect & Process
              </h2>
              <p>
                GlobizHR acts primarily as a Data Processor on behalf of employers who subscribe to the platform. Information managed through the software includes:
              </p>
              <ul className="space-y-2 pl-4 list-disc text-slate-700">
                <li><strong>Identity & Profile Records:</strong> Full name, employee ID, contact details, emergency contacts, job designation, and department.</li>
                <li><strong>Statutory & Payroll Data:</strong> Salary structures, bank account numbers, PAN, UAN / EPF details, ESIC numbers, and professional tax slabs.</li>
                <li><strong>Attendance & Work Records:</strong> Clock-in/out timestamps, IP/device logs, leave requests, and shift schedules.</li>
                <li><strong>Encrypted Documents:</strong> Official identification documents, educational certificates, and employment offer letters uploaded to the Document Vault.</li>
              </ul>
            </section>

            <section className="space-y-3">
              <h2 className="text-lg sm:text-xl font-bold text-slate-900 flex items-center gap-2">
                <ShieldCheck className="w-5 h-5 text-[#F97316]" />
                3. Security Measures & Encryption
              </h2>
              <p>
                All data transmitted to and from GlobizHR is secured using industry-standard TLS 1.3 cryptographic protocols. Sensitive employee documents and database volumes are encrypted at rest using AES-256 encryption. Access is strictly partitioned with Role-Based Access Control (RBAC) ensuring only authorized administrators view designated records.
              </p>
            </section>

            <section className="space-y-3">
              <h2 className="text-lg sm:text-xl font-bold text-slate-900 flex items-center gap-2">
                <CheckCircle2 className="w-5 h-5 text-[#F97316]" />
                4. Indian Statutory & Regulatory Compliance
              </h2>
              <p>
                GlobizHR adheres to applicable Indian data protection frameworks, including the Digital Personal Data Protection (DPDP) Act and Information Technology (IT) Act guidelines. We do not sell, rent, or monetize your employee data to any third parties or advertisers.
              </p>
            </section>

            <section className="space-y-3 pt-4 border-t border-slate-100">
              <h2 className="text-lg sm:text-xl font-bold text-slate-900">
                5. Contact & Privacy Inquiries
              </h2>
              <p>
                If you have questions regarding this Privacy Policy, data access requests, or wish to report a security inquiry, please contact our Data Protection Team:
              </p>
              <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl space-y-1 text-sm text-slate-700">
                <p><strong>GlobizHub India Pvt Ltd</strong></p>
                <p>Email: <a href="mailto:support@globizhub.com" className="text-[#F97316] font-semibold hover:underline">support@globizhub.com</a></p>
                <p>Support / WhatsApp Hotline: <a href="https://wa.me/918402010207" target="_blank" rel="noopener noreferrer" className="text-[#F97316] font-semibold hover:underline">+91 8402010207</a></p>
              </div>
            </section>
          </div>

        </div>
      </main>
    </div>
  );
}
