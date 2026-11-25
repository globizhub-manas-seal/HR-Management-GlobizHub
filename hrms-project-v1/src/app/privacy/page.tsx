import Link from "next/link";
import Image from "next/image";
import { ArrowLeft, ShieldCheck, Mail, Lock, CheckCircle2 } from "lucide-react";

export const metadata = {
  title: "Privacy Policy | GlobizHR - GlobizHub India Pvt Ltd",
  description: "Plain-language privacy policy explaining what data GlobizHR handles, why, and how we safeguard it.",
};

export default function PrivacyPage() {
  return (
    <div className="min-h-screen bg-slate-50 text-slate-800">
      {/* Top Navbar */}
      <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-slate-200">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2.5 focus:outline-none group">
            <div className="relative h-10 w-16 shrink-0 transition-transform group-hover:scale-105 duration-200">
              <Image
                src="/globizhr-logo.png"
                alt="GlobizHR Logo"
                fill
                className="object-contain"
                sizes="64px"
                priority
              />
            </div>
            <div className="flex flex-col">
              <span className="text-xl font-black text-slate-900 tracking-tight leading-none">
                Globiz<span className="text-[#F97316]">HR</span>
              </span>
              <span className="text-[10px] font-semibold text-slate-500 mt-0.5">
                Privacy Policy
              </span>
            </div>
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
              <span>PLAIN-LANGUAGE PRIVACY POLICY</span>
            </div>
            <h1 className="text-2xl sm:text-3xl md:text-4xl font-black text-slate-900 tracking-tight">
              Privacy Policy
            </h1>
            <p className="mt-2 text-sm text-slate-500">
              Last updated: 25-11-2026 • GlobizHub India Pvt Ltd
            </p>
          </div>

          <div className="space-y-8 text-sm sm:text-base leading-relaxed text-slate-600 font-normal">
            
            <p className="text-base sm:text-lg text-slate-700 leading-relaxed font-medium">
              GlobizHR is built and run by <strong>GlobizHub India Pvt Ltd</strong> (&quot;we&quot;, &quot;us&quot;). This page explains, in plain words, what information we handle, why, and what you can do about it.
            </p>

            {/* Who is who */}
            <section className="space-y-3 pt-2">
              <h2 className="text-lg sm:text-xl font-bold text-slate-900">
                Who is who
              </h2>
              <p>
                In most cases, your company (the one that signed up for GlobizHR) decides what employee information goes into the platform. We store and process it on the company&apos;s behalf to run HR, attendance, leave, shifts and payroll. For information about people who visit our website or sign up for an account, we decide how it is used.
              </p>
            </section>

            {/* What we collect */}
            <section className="space-y-3">
              <h2 className="text-lg sm:text-xl font-bold text-slate-900">
                What we collect
              </h2>
              <ul className="space-y-2.5 pl-5 list-disc text-slate-700">
                <li>
                  <strong>Account details:</strong> name, work email, phone number, company name.
                </li>
                <li>
                  <strong>Employee records your company adds:</strong> contact details, ID details, job role, department, emergency contacts.
                </li>
                <li>
                  <strong>Work records:</strong> clock-in and clock-out times, breaks, overtime, leave requests, location data captured at clock-in, shift rosters and swaps.
                </li>
                <li>
                  <strong>Payroll details:</strong> salary structure, deductions, payslips and bank account details used to run payroll.
                </li>
                <li>
                  <strong>Documents:</strong> files and IDs uploaded to the document vault.
                </li>
                <li>
                  <strong>Technical data:</strong> device, browser, IP address and activity logs, used for security and to keep the service running.
                </li>
              </ul>
            </section>

            {/* Why we use it */}
            <section className="space-y-3">
              <h2 className="text-lg sm:text-xl font-bold text-slate-900">
                Why we use it
              </h2>
              <p>
                To run the service you signed up for, to process payroll and statutory compliance (EPF, ESI, PT, TDS), to keep accounts secure, to send billing and support messages, and to improve the product. That&apos;s it.
              </p>
            </section>

            {/* What we never do */}
            <section className="space-y-3 p-4 bg-orange-50/60 border border-orange-200/80 rounded-xl">
              <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                <CheckCircle2 className="w-5 h-5 text-[#F97316]" />
                What we never do
              </h2>
              <p className="text-slate-700 font-medium">
                We do not sell or rent employee data, and we do not share it with data brokers.
              </p>
            </section>

            {/* Who we share it with */}
            <section className="space-y-3">
              <h2 className="text-lg sm:text-xl font-bold text-slate-900">
                Who we share it with
              </h2>
              <p>
                Only with trusted providers who help us run GlobizHR, for example payment processing (Razorpay) and cloud hosting provided by Hostinger, and with authorities when the law requires it. These providers can use the data only to do their job for us.
              </p>
            </section>

            {/* How we protect it */}
            <section className="space-y-3">
              <h2 className="text-lg sm:text-xl font-bold text-slate-900 flex items-center gap-2">
                <Lock className="w-5 h-5 text-[#F97316]" />
                How we protect it
              </h2>
              <p>
                Each company&apos;s data is kept separate from every other company&apos;s. Data is encrypted when stored (AES-256) and while it travels (TLS). Access inside the platform is controlled by roles (Admin, HR Manager, Staff), and administrative actions are recorded in audit logs. No system is perfectly safe, but we take this seriously. If a breach affects your data, we will tell the affected company and the authorities as the law requires.
              </p>
            </section>

            {/* How long we keep it */}
            <section className="space-y-3">
              <h2 className="text-lg sm:text-xl font-bold text-slate-900">
                How long we keep it
              </h2>
              <p>
                While your account is active, and after that for 45 days so you can export your data. Some records, such as invoices and payroll data, may be kept longer where Indian law requires it. After that, we delete or anonymise it.
              </p>
            </section>

            {/* Your rights */}
            <section className="space-y-3">
              <h2 className="text-lg sm:text-xl font-bold text-slate-900">
                Your rights
              </h2>
              <p>
                You can ask to see, correct, download or delete your personal data, and to withdraw consent where we rely on it. If you are an employee, please first contact your company&apos;s HR admin, since they control your records. You can also write to us and we will help. We will reply within 7 days.
              </p>
            </section>

            {/* Cookies & Children */}
            <section className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
              <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl space-y-1.5">
                <h3 className="font-bold text-slate-900">Cookies</h3>
                <p className="text-xs sm:text-sm text-slate-600">
                  We use only the cookies needed to keep you signed in and the site working.
                </p>
              </div>
              <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl space-y-1.5">
                <h3 className="font-bold text-slate-900">Children</h3>
                <p className="text-xs sm:text-sm text-slate-600">
                  GlobizHR is for workplaces and is not meant for anyone under 18.
                </p>
              </div>
            </section>

            {/* Changes */}
            <section className="space-y-3">
              <h2 className="text-lg sm:text-xl font-bold text-slate-900">
                Changes
              </h2>
              <p>
                If we change this policy in a meaningful way, we will update the date above and notify account owners by email.
              </p>
            </section>

            {/* Contact */}
            <section className="space-y-3 pt-4 border-t border-slate-100">
              <h2 className="text-lg sm:text-xl font-bold text-slate-900">
                Contact & Grievances
              </h2>
              <div className="p-4 sm:p-5 bg-slate-50 border border-slate-200 rounded-xl space-y-1.5 text-sm text-slate-700">
                <p className="font-bold text-slate-900">GlobizHub India Pvt Ltd</p>
                <p>No. 42, 3rd Floor, 100 Feet Road, Indiranagar</p>
                <p>Bengaluru, Karnataka – 560038, India</p>
                <p className="pt-2">
                  <strong>Privacy and grievance contact:</strong>{" "}
                  <a href="mailto:admin@globizhub.com" className="text-[#F97316] font-bold hover:underline">
                    admin@globizhub.com
                  </a>
                </p>
              </div>
            </section>

          </div>

        </div>
      </main>
    </div>
  );
}
