"use client";

import { useState } from "react";
import { ChevronDown, HelpCircle } from "lucide-react";
import ScrollReveal from "./ScrollReveal";

export default function LandingFaq() {
  const [openIndex, setOpenIndex] = useState<number | null>(0);

  const faqs = [
    {
      q: "How does the payroll engine calculate salaries and deductions?",
      a: "You define salary components such as Basic, HRA and allowances, plus deductions such as EPF, ESI, PT and TDS. Each month, GlobizHR combines these with attendance and approved leave. It deducts Loss of Pay for unapproved absences and generates payslips automatically.",
    },
    {
      q: "Can employees request shift swaps with colleagues?",
      a: "Yes. An employee proposes a swap with a co-worker. The request goes to the manager, who approves or declines it in one click. The roster updates automatically.",
    },
    {
      q: "How does attendance and overtime tracking work?",
      a: "Employees clock in and out from web or mobile, and breaks are logged. Hours beyond the scheduled shift are counted as overtime, and managers can review daily and monthly summaries.",
    },
    {
      q: "How is company and employee data secured?",
      a: "Access is controlled by role, so people see only what they need. Every administrative action is recorded in audit logs, and employee documents are stored in an encrypted vault. See our Privacy Policy for details.",
    },
    {
      q: "Can employees use self-service on mobile?",
      a: "Yes. Employees can clock in, apply for leave, request shift swaps, read announcements and download payslips from their phone.",
    },
    {
      q: "Is GlobizHR suitable for Indian labour and statutory requirements?",
      a: "GlobizHR supports EPF, ESI, Professional Tax and TDS in payroll. Rules differ by state and company, so we recommend confirming your setup with your accountant. We're happy to help configure it.",
    },
    {
      q: "Can I import my existing employee data?",
      a: "Yes, you can add employees one by one or import them from a spreadsheet. Our team can help with the first upload.",
    },
    {
      q: "How do I get support?",
      a: "Free plan users get email support. Business plan users get priority support. You can also reach us on WhatsApp or email.",
    },
  ];

  return (
    <section id="faq" className="py-16 md:py-24 bg-[#FAFAFA] border-t border-slate-100">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
        
        {/* Eyebrow */}
        <ScrollReveal delay={0}>
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full text-xs font-bold bg-amber-50 text-amber-900 border border-amber-200 mb-4">
            <HelpCircle className="w-3.5 h-3.5 text-amber-600" />
            <span>FREQUENTLY ASKED QUESTIONS</span>
          </div>
        </ScrollReveal>

        {/* Heading */}
        <ScrollReveal delay={100}>
          <h2 className="text-3xl sm:text-4xl font-black text-slate-900 tracking-tight leading-tight">
            Frequently Asked Questions
          </h2>
        </ScrollReveal>

        {/* FAQ Accordion List */}
        <div className="mt-10 space-y-3.5 text-left">
          {faqs.map((faq, index) => {
            const isOpen = openIndex === index;
            return (
              <ScrollReveal key={index} delay={index * 50}>
                <div className="bg-white rounded-2xl border border-slate-200/90 shadow-2xs overflow-hidden transition-all">
                  <button
                    onClick={() => setOpenIndex(isOpen ? null : index)}
                    className="w-full px-6 py-5 flex items-center justify-between text-left font-bold text-slate-900 hover:text-orange-600 transition-colors focus:outline-none cursor-pointer"
                  >
                    <span className="text-base sm:text-lg pr-4">{faq.q}</span>
                    <ChevronDown
                      className={`w-5 h-5 text-slate-400 shrink-0 transition-transform duration-200 ${
                        isOpen ? "rotate-180 text-orange-500" : ""
                      }`}
                    />
                  </button>
                  {isOpen && (
                    <div className="px-6 pb-5 pt-1 text-sm text-slate-600 leading-relaxed border-t border-slate-100/60">
                      {faq.a}
                    </div>
                  )}
                </div>
              </ScrollReveal>
            );
          })}
        </div>

      </div>
    </section>
  );
}
