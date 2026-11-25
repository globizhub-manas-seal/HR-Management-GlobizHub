import Link from "next/link";
import Image from "next/image";
import { ArrowLeft, RefreshCw, CheckCircle2 } from "lucide-react";

export const metadata = {
  title: "Refund Policy | GlobizHR - GlobizHub India Pvt Ltd",
  description: "Subscription and Refund Policy for GlobizHR - A product of GlobizHub India Pvt Ltd",
};

export default function RefundPolicyPage() {
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
                Refund Policy
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
              <RefreshCw className="w-3.5 h-3.5" />
              <span>SUBSCRIPTIONS & REFUNDS</span>
            </div>
            <h1 className="text-2xl sm:text-3xl md:text-4xl font-black text-slate-900 tracking-tight">
              Refund Policy
            </h1>
            <p className="mt-2 text-sm text-slate-500">
              Last updated: 25-11-2026 • GlobizHub India Pvt Ltd
            </p>
          </div>

          <div className="space-y-8 text-sm sm:text-base leading-relaxed text-slate-600 font-normal">
            
            <p className="text-base sm:text-lg text-slate-700 leading-relaxed font-medium">
              We want you to be sure before you pay, and fairly treated if something goes wrong.
            </p>

            {/* Try before you pay */}
            <section className="space-y-2">
              <h2 className="text-lg sm:text-xl font-bold text-slate-900">
                Try before you pay
              </h2>
              <p>
                Start with the free plan, or try the paid plan free for 7 days. No credit card is needed to start.
              </p>
            </section>

            {/* Billing */}
            <section className="space-y-2">
              <h2 className="text-lg sm:text-xl font-bold text-slate-900">
                Billing
              </h2>
              <p>
                Paid plans are billed annually in advance for active users. You can cancel any time from <strong>Settings &gt; Billing &amp; Subscription</strong>. After you cancel, you keep access until the end of the period you&apos;ve already paid for, and you won&apos;t be charged again.
              </p>
            </section>

            {/* When we'll refund */}
            <section className="space-y-2">
              <h2 className="text-lg sm:text-xl font-bold text-slate-900">
                When we&apos;ll refund
              </h2>
              <p>
                If the platform was seriously unavailable or unusable during a paid period, you can ask for a refund within 7 business days of being charged (including renewals). We&apos;ll look at each request fairly and reply within 7 business days.
              </p>
            </section>

            {/* What isn't refunded */}
            <section className="space-y-2 p-4 bg-slate-50 border border-slate-200 rounded-xl">
              <h2 className="text-lg font-bold text-slate-900">
                What isn&apos;t refunded
              </h2>
              <p className="text-slate-700">
                Partial months after cancellation, and unused user seats, unless required by law.
              </p>
            </section>

            {/* How refunds are paid */}
            <section className="space-y-2">
              <h2 className="text-lg sm:text-xl font-bold text-slate-900">
                How refunds are paid
              </h2>
              <p>
                Approved refunds go back to the original payment method through Razorpay and usually reach you in 5–10 business days.
              </p>
            </section>

            {/* How to ask */}
            <section className="space-y-3 pt-4 border-t border-slate-100">
              <h2 className="text-lg sm:text-xl font-bold text-slate-900">
                How to ask
              </h2>
              <p>
                Email our billing desk at{" "}
                <a href="mailto:admin@globizhub.com" className="text-[#F97316] font-bold hover:underline">
                  admin@globizhub.com
                </a>{" "}
                with your company name, the invoice number and a short note on what went wrong.
              </p>
            </section>

          </div>

        </div>
      </main>
    </div>
  );
}
