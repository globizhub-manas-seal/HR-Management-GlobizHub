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
                Terms & Conditions
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
              <FileText className="w-3.5 h-3.5" />
              <span>PLAIN-LANGUAGE TERMS</span>
            </div>
            <h1 className="text-2xl sm:text-3xl md:text-4xl font-black text-slate-900 tracking-tight">
              Terms & Conditions
            </h1>
            <p className="mt-2 text-sm text-slate-500">
              Last updated: 25-11-2026 • GlobizHub India Pvt Ltd
            </p>
          </div>

          <div className="space-y-8 text-sm sm:text-base leading-relaxed text-slate-600 font-normal">
            
            <p className="text-base sm:text-lg text-slate-700 leading-relaxed font-medium">
              These terms are the agreement between you and <strong>GlobizHub India Pvt Ltd</strong> for using GlobizHR. By creating an account or using the platform, you agree to them. If you sign up for a company, you confirm you have the authority to accept these terms on its behalf.
            </p>

            {/* 1. What you get */}
            <section className="space-y-2">
              <h2 className="text-lg sm:text-xl font-bold text-slate-900">
                1. What you get
              </h2>
              <p>
                We give your company a non-exclusive, non-transferable right to use GlobizHR (employee directory, attendance, leave, shifts, payroll, onboarding and the other modules in your plan) for your own internal business. You can&apos;t resell it, share your login with outsiders, or copy the software.
              </p>
            </section>

            {/* 2. Your account */}
            <section className="space-y-2">
              <h2 className="text-lg sm:text-xl font-bold text-slate-900">
                2. Your account
              </h2>
              <p>
                You are responsible for keeping admin and employee logins safe, setting the right permissions for your team, and making sure the data you enter is accurate and that you have the right to process it. Please tell us quickly if you think an account has been compromised.
              </p>
            </section>

            {/* 3. Your data stays yours */}
            <section className="space-y-2">
              <h2 className="text-lg sm:text-xl font-bold text-slate-900">
                3. Your data stays yours
              </h2>
              <p>
                Your company owns the data it puts into GlobizHR. We only use it to provide the service, as explained in our Privacy Policy. You can export it any time while your account is active and for 45 days after it ends.
              </p>
            </section>

            {/* 4. Fair use */}
            <section className="space-y-2">
              <h2 className="text-lg sm:text-xl font-bold text-slate-900">
                4. Fair use
              </h2>
              <p>
                Please don&apos;t use GlobizHR to break the law, upload harmful files, try to get into other companies&apos; data, or overload or disrupt the service.
              </p>
            </section>

            {/* 5. Plans and payment */}
            <section className="space-y-2">
              <h2 className="text-lg sm:text-xl font-bold text-slate-900">
                5. Plans and payment
              </h2>
              <p>
                The Freemium plan is free for up to 5 users with verified business emails. The paid plan is ₹49 per user per month, invoiced monthly for your active users, plus GST. Payments are handled by Razorpay. Prices may change with 30 days notice. See our Refund Policy for cancellations and refunds.
              </p>
            </section>

            {/* 6. Payroll is your responsibility */}
            <section className="space-y-2 p-4 bg-orange-50/60 border border-orange-200/80 rounded-xl">
              <h2 className="text-lg font-bold text-slate-900">
                6. Payroll is your responsibility
              </h2>
              <p className="text-slate-700">
                GlobizHR calculates salaries, deductions and statutory items based on the settings and data you provide. Please review every payroll run before you approve it. You remain responsible for the final payments and for filing returns with the authorities.
              </p>
            </section>

            {/* 7. Availability and support */}
            <section className="space-y-2">
              <h2 className="text-lg sm:text-xl font-bold text-slate-900">
                7. Availability and support
              </h2>
              <p>
                We work hard to keep GlobizHR running smoothly, but we can&apos;t promise it will be uninterrupted or error-free. We will tell you in advance about planned maintenance where we can.
              </p>
            </section>

            {/* 8. Ending your subscription */}
            <section className="space-y-2">
              <h2 className="text-lg sm:text-xl font-bold text-slate-900">
                8. Ending your subscription
              </h2>
              <p>
                You can cancel any time. We may suspend or end an account for non-payment or serious breach of these terms, and we will give notice first unless there is a security risk.
              </p>
            </section>

            {/* 9. Limits on our liability */}
            <section className="space-y-2">
              <h2 className="text-lg sm:text-xl font-bold text-slate-900">
                9. Limits on our liability
              </h2>
              <p>
                To the extent the law allows, we are not liable for indirect or consequential losses, such as lost profits. Our total liability for any claim is limited to the fees you paid us in the 12 months before the claim.
              </p>
            </section>

            {/* 10. Governing law */}
            <section className="space-y-2">
              <h2 className="text-lg sm:text-xl font-bold text-slate-900">
                10. Governing law
              </h2>
              <p>
                These terms are governed by the laws of India. Disputes will be handled in the courts of Bangalore, Karnataka.
              </p>
            </section>

            {/* 11. Changes and contact */}
            <section className="space-y-3 pt-4 border-t border-slate-100">
              <h2 className="text-lg sm:text-xl font-bold text-slate-900">
                11. Changes and contact
              </h2>
              <p>
                We may update these terms and will notify account owners of important changes. Questions? Write to{" "}
                <a href="mailto:admin@globizhub.com" className="text-[#F97316] font-bold hover:underline">
                  admin@globizhub.com
                </a>.
              </p>
            </section>

          </div>

        </div>
      </main>
    </div>
  );
}
