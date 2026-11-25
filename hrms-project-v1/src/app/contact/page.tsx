"use client";

import { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import {
  ArrowLeft,
  Mail,
  Phone,
  Building,
  Clock,
  Send,
  CheckCircle2,
  MessageSquare,
  Sparkles,
} from "lucide-react";

export default function ContactPage() {
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    company: "",
    phone: "",
    subject: "",
    message: "",
  });
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    // Simulate form submission
    setTimeout(() => {
      setLoading(false);
      setSubmitted(true);
    }, 600);
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-800">
      {/* Top Navbar */}
      <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-slate-200">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
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
                Contact & Support
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

      {/* Main Container */}
      <main className="max-w-6xl mx-auto px-4 sm:px-6 py-12 md:py-16">
        
        {/* Page Title & Badge */}
        <div className="text-center max-w-2xl mx-auto mb-12">
          <div className="inline-flex items-center gap-2 px-3 py-1 bg-orange-50 border border-orange-200 text-[#F97316] text-xs font-bold rounded-full mb-3.5">
            <Sparkles className="w-3.5 h-3.5" />
            <span>WE ARE HERE TO HELP</span>
          </div>
          <h1 className="text-3xl sm:text-4xl md:text-5xl font-black text-slate-900 tracking-tight">
            Get in touch with us
          </h1>
          <p className="mt-3 text-base text-slate-600 leading-relaxed font-normal">
            Have questions about GlobizHR, need a custom enterprise setup, or require technical support? Our team is ready to assist you.
          </p>
        </div>

        {/* Content Grid: Contact Information & Contact Form */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          
          {/* Left Column: Direct Info Cards */}
          <div className="lg:col-span-5 space-y-4">
            
            {/* Primary Email Card */}
            <div className="p-6 bg-white border border-slate-200/90 rounded-2xl shadow-xs transition-all hover:border-orange-300">
              <div className="w-12 h-12 rounded-xl bg-orange-50 text-[#F97316] border border-orange-200/80 flex items-center justify-center mb-4">
                <Mail className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-bold text-slate-900">Email Address</h3>
              <p className="text-xs sm:text-sm text-slate-500 mt-1">
                For sales, support, administration, and corporate inquiries:
              </p>
              <a
                href="mailto:admin@globizhub.com"
                className="mt-3 inline-flex items-center gap-2 text-base font-bold text-[#F97316] hover:text-[#EA580C] hover:underline"
              >
                <span>admin@globizhub.com</span>
                <span className="text-xs px-2 py-0.5 rounded-full bg-orange-100 text-[#F97316] font-semibold">
                  Official
                </span>
              </a>
            </div>

            {/* Phone & WhatsApp Card */}
            <div className="p-6 bg-white border border-slate-200/90 rounded-2xl shadow-xs transition-all hover:border-orange-300">
              <div className="w-12 h-12 rounded-xl bg-emerald-50 text-emerald-600 border border-emerald-200/80 flex items-center justify-center mb-4">
                <Phone className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-bold text-slate-900">Phone & WhatsApp Support</h3>
              <p className="text-xs sm:text-sm text-slate-500 mt-1">
                Direct helpline for product demos, questions, and onboarding assistance:
              </p>
              <div className="mt-3 flex flex-wrap items-center gap-3">
                <a
                  href="https://wa.me/918402010207?text=Hi%20GlobizHR%20team%2C%20I%20have%20a%20question%20regarding%20the%20platform."
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold transition-colors shadow-xs"
                >
                  <MessageSquare className="w-3.5 h-3.5" />
                  <span>Chat on WhatsApp (+91 8402010207)</span>
                </a>
              </div>
            </div>

            {/* Company & Office Card */}
            <div className="p-6 bg-white border border-slate-200/90 rounded-2xl shadow-xs">
              <div className="w-12 h-12 rounded-xl bg-slate-100 text-slate-700 border border-slate-200 flex items-center justify-center mb-4">
                <Building className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-bold text-slate-900">Headquarters</h3>
              <p className="text-sm font-bold text-slate-800 mt-1">
                GlobizHub India Pvt Ltd
              </p>
              <div className="text-xs text-slate-600 mt-2 leading-relaxed space-y-0.5">
                <p>NO 594/4/2, First Floor,</p>
                <p>Opp. to BDS Nagar, RK Nagar 2,</p>
                <p>Kothanur Main Road, Bengaluru – 560077</p>
                <p className="text-slate-500 pt-0.5">Karnataka, India</p>
              </div>

              <div className="mt-4 pt-4 border-t border-slate-100 flex items-center gap-2 text-xs text-slate-600">
                <Clock className="w-4 h-4 text-slate-400 shrink-0" />
                <span>Working Hours: Mon – Fri (9:00 AM – 6:00 PM IST)</span>
              </div>
            </div>

          </div>

          {/* Right Column: Contact Message Form */}
          <div className="lg:col-span-7 bg-white border border-slate-200/90 rounded-2xl p-6 sm:p-8 md:p-10 shadow-xs">
            {submitted ? (
              <div className="py-12 text-center space-y-4">
                <div className="w-16 h-16 bg-emerald-50 text-emerald-600 border border-emerald-200 rounded-full flex items-center justify-center mx-auto shadow-xs">
                  <CheckCircle2 className="w-8 h-8" />
                </div>
                <h3 className="text-2xl font-black text-slate-900 tracking-tight">
                  Message Sent Successfully!
                </h3>
                <p className="text-sm text-slate-600 max-w-md mx-auto leading-relaxed">
                  Thank you for reaching out to GlobizHR. A representative from our team will review your message and reply to <strong>{formData.email}</strong> within 24 business hours.
                </p>
                <div className="pt-4">
                  <button
                    onClick={() => {
                      setSubmitted(false);
                      setFormData({
                        name: "",
                        email: "",
                        company: "",
                        phone: "",
                        subject: "",
                        message: "",
                      });
                    }}
                    className="px-6 py-2.5 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-bold transition-colors cursor-pointer"
                  >
                    Send Another Message
                  </button>
                </div>
              </div>
            ) : (
              <div>
                <div className="border-b border-slate-100 pb-5 mb-6">
                  <h2 className="text-2xl font-black text-slate-900 tracking-tight">
                    Send Us a Message
                  </h2>
                  <p className="text-xs sm:text-sm text-slate-500 mt-1">
                    Fill out the form below and we will route your inquiry to the right department.
                  </p>
                </div>

                <form onSubmit={handleSubmit} className="space-y-4">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                        Your Name <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="text"
                        required
                        value={formData.name}
                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                        placeholder="e.g. Alex Rivera"
                        className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 focus:border-[#F97316] focus:ring-2 focus:ring-orange-500/20 text-sm outline-none transition-all"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                        Work Email <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="email"
                        required
                        value={formData.email}
                        onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                        placeholder="name@company.com"
                        className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 focus:border-[#F97316] focus:ring-2 focus:ring-orange-500/20 text-sm outline-none transition-all"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                        Company Name
                      </label>
                      <input
                        type="text"
                        value={formData.company}
                        onChange={(e) => setFormData({ ...formData, company: e.target.value })}
                        placeholder="e.g. Acme Technologies"
                        className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 focus:border-[#F97316] focus:ring-2 focus:ring-orange-500/20 text-sm outline-none transition-all"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                        Phone Number
                      </label>
                      <input
                        type="tel"
                        value={formData.phone}
                        onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                        placeholder="+91 98765 43210"
                        className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 focus:border-[#F97316] focus:ring-2 focus:ring-orange-500/20 text-sm outline-none transition-all"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                      Subject <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      required
                      value={formData.subject}
                      onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
                      placeholder="e.g. Product Demo Request / Enterprise Pricing"
                      className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 focus:border-[#F97316] focus:ring-2 focus:ring-orange-500/20 text-sm outline-none transition-all"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                      Message <span className="text-red-500">*</span>
                    </label>
                    <textarea
                      required
                      rows={4}
                      value={formData.message}
                      onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                      placeholder="Tell us about your organization's requirements..."
                      className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 focus:border-[#F97316] focus:ring-2 focus:ring-orange-500/20 text-sm outline-none transition-all resize-none"
                    />
                  </div>

                  <div className="pt-2">
                    <button
                      type="submit"
                      disabled={loading}
                      className="w-full py-3.5 px-6 bg-gradient-to-r from-[#F97316] to-[#EA580C] hover:from-[#EA580C] hover:to-[#C2410C] text-white font-bold rounded-xl text-sm transition-all shadow-md shadow-orange-500/20 hover:shadow-lg hover:shadow-orange-500/30 active:scale-[0.99] flex items-center justify-center gap-2 cursor-pointer disabled:opacity-70"
                    >
                      {loading ? (
                        <span>Sending message...</span>
                      ) : (
                        <>
                          <Send className="w-4 h-4" />
                          <span>Send Message to admin@globizhub.com</span>
                        </>
                      )}
                    </button>
                  </div>
                </form>
              </div>
            )}
          </div>

        </div>

      </main>
    </div>
  );
}
