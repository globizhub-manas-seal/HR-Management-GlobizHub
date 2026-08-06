// src/app/page.tsx
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { 
  Users, 
  Clock, 
  Calendar, 
  Banknote, 
  CheckCircle2, 
  ArrowRight 
} from "lucide-react";

export default function LandingPage() {
  return (
    <main className="min-h-screen bg-slate-50 font-sans selection:bg-emerald-100 selection:text-emerald-900">
      
      {/* NAVBAR */}
      <nav className="sticky top-0 z-50 w-full bg-white/80 backdrop-blur-md border-b border-slate-100">
        <div className="flex items-center justify-between px-6 py-4 max-w-7xl mx-auto">
          <div className="flex items-center space-x-2 text-2xl font-bold text-slate-900 tracking-tight">
            <div className="text-emerald-500">
              <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M12 2L2 7l10 5 10-5-10-5z"/><path d="M2 17l10 5 10-5"/><path d="M2 12l10 5 10-5"/></svg>
            </div>
            <span>TeamHub</span>
          </div>
          <div className="space-x-4 hidden md:block">
            <Link href="/login">
              <Button variant="ghost" className="text-slate-600 hover:text-slate-900 font-medium">Log in</Button>
            </Link>
            <Link href="/register">
              <Button className="bg-emerald-500 hover:bg-emerald-600 text-white shadow-md shadow-emerald-500/20 font-medium">
                Start for free
              </Button>
            </Link>
          </div>
        </div>
      </nav>

      {/* HERO SECTION */}
      <section className="relative pt-24 pb-32 overflow-hidden">
        <div className="max-w-7xl mx-auto px-6 text-center">
          <div className="inline-flex items-center rounded-full px-3 py-1 text-sm font-medium text-emerald-600 bg-emerald-50 border border-emerald-100 mb-8">
            <span className="flex h-2 w-2 rounded-full bg-emerald-500 mr-2"></span>
            The #1 Employee-Centric HRMS
          </div>
          
          <h1 className="text-5xl md:text-7xl font-extrabold text-slate-900 tracking-tight max-w-4xl mx-auto leading-tight">
            Manage your people, <br className="hidden md:block"/>
            <span className="text-emerald-500 text-transparent bg-clip-text bg-gradient-to-r from-emerald-500 to-teal-400">
              not just your paperwork.
            </span>
          </h1>
          
          <p className="mt-6 text-lg md:text-xl text-slate-500 max-w-2xl mx-auto leading-relaxed">
            TeamHub brings payroll, attendance, and employee success into one beautiful workspace. Built for modern teams who care about their culture.
          </p>
          
          <div className="mt-10 flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link href="/register">
              <Button size="lg" className="h-14 px-8 text-base bg-emerald-500 hover:bg-emerald-600 text-white shadow-xl shadow-emerald-500/20 w-full sm:w-auto">
                Get Started Now <ArrowRight className="ml-2 h-5 w-5" />
              </Button>
            </Link>
            <Link href="/login">
              <Button size="lg" variant="outline" className="h-14 px-8 text-base border-slate-200 text-slate-600 hover:bg-slate-50 w-full sm:w-auto">
                Book a Demo
              </Button>
            </Link>
          </div>
          
          <p className="mt-4 text-sm text-slate-400 font-medium">No credit card required. 14-day free trial.</p>
        </div>
      </section>

      {/* TRUSTED BY SECTION */}
      <section className="border-y border-slate-100 bg-white py-10">
        <div className="max-w-7xl mx-auto px-6 text-center">
          <p className="text-sm font-semibold text-slate-400 uppercase tracking-wider mb-6">Trusted by innovative teams worldwide</p>
          <div className="flex flex-wrap justify-center gap-8 md:gap-16 opacity-50 grayscale">
            {/* Placeholder Logos - In a real app, use actual SVG logos */}
            <div className="text-xl font-bold font-serif">Acme Corp</div>
            <div className="text-xl font-bold font-mono">Globex</div>
            <div className="text-xl font-bold font-sans">Soylent</div>
            <div className="text-xl font-bold italic">Initech</div>
            <div className="text-xl font-bold tracking-widest">UMBRELLA</div>
          </div>
        </div>
      </section>

      {/* FEATURES GRID */}
      <section className="py-24 bg-slate-50">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-slate-900 mb-4">Everything you need to run your HR</h2>
            <p className="text-lg text-slate-500 max-w-2xl mx-auto">Say goodbye to messy spreadsheets and disconnected tools. TeamHub unifies your entire HR workflow.</p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            
            {/* Feature 1 */}
            <div className="bg-white p-8 rounded-2xl border border-slate-100 shadow-sm hover:shadow-md transition-shadow">
              <div className="w-12 h-12 bg-emerald-50 rounded-xl flex items-center justify-center mb-6">
                <Users className="h-6 w-6 text-emerald-600" />
              </div>
              <h3 className="text-xl font-bold text-slate-900 mb-3">Employee Directory</h3>
              <p className="text-slate-500 leading-relaxed">Centralize all employee data. Access profiles, documents, and reporting structures in one click.</p>
            </div>

            {/* Feature 2 */}
            <div className="bg-white p-8 rounded-2xl border border-slate-100 shadow-sm hover:shadow-md transition-shadow">
              <div className="w-12 h-12 bg-blue-50 rounded-xl flex items-center justify-center mb-6">
                <Clock className="h-6 w-6 text-blue-600" />
              </div>
              <h3 className="text-xl font-bold text-slate-900 mb-3">Time & Attendance</h3>
              <p className="text-slate-500 leading-relaxed">Automate check-ins, track working hours, and manage shift schedules effortlessly.</p>
            </div>

            {/* Feature 3 */}
            <div className="bg-white p-8 rounded-2xl border border-slate-100 shadow-sm hover:shadow-md transition-shadow">
              <div className="w-12 h-12 bg-purple-50 rounded-xl flex items-center justify-center mb-6">
                <Banknote className="h-6 w-6 text-purple-600" />
              </div>
              <h3 className="text-xl font-bold text-slate-900 mb-3">1-Click Payroll</h3>
              <p className="text-slate-500 leading-relaxed">Process error-free payroll in minutes. Automatically syncs with attendance and leave data.</p>
            </div>

            {/* Feature 4 */}
            <div className="bg-white p-8 rounded-2xl border border-slate-100 shadow-sm hover:shadow-md transition-shadow">
              <div className="w-12 h-12 bg-orange-50 rounded-xl flex items-center justify-center mb-6">
                <Calendar className="h-6 w-6 text-orange-600" />
              </div>
              <h3 className="text-xl font-bold text-slate-900 mb-3">Leave Management</h3>
              <p className="text-slate-500 leading-relaxed">Custom leave policies, instant approval workflows, and shared team holiday calendars.</p>
            </div>

            {/* Feature 5 */}
            <div className="bg-white p-8 rounded-2xl border border-slate-100 shadow-sm hover:shadow-md transition-shadow">
              <div className="w-12 h-12 bg-rose-50 rounded-xl flex items-center justify-center mb-6">
                <CheckCircle2 className="h-6 w-6 text-rose-600" />
              </div>
              <h3 className="text-xl font-bold text-slate-900 mb-3">Performance Reviews</h3>
              <p className="text-slate-500 leading-relaxed">Set OKRs, conduct 360° feedback, and foster continuous growth for your team members.</p>
            </div>

            {/* Blank CTA Card */}
            <div className="bg-emerald-500 p-8 rounded-2xl border border-emerald-600 shadow-sm flex flex-col justify-center items-center text-center">
              <h3 className="text-2xl font-bold text-white mb-4">Ready to upgrade?</h3>
              <Link href="/register">
                <Button className="bg-white text-emerald-600 hover:bg-slate-50 font-bold w-full">
                  Start your free trial
                </Button>
              </Link>
            </div>

          </div>
        </div>
      </section>

      {/* FOOTER */}
      <footer className="bg-slate-900 py-12 text-center border-t border-slate-800">
        <p className="text-slate-400 font-medium">© 2026 TeamHub HRMS. All rights reserved.</p>
      </footer>

    </main>
  );
}