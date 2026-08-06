// src/components/Sidebar.tsx
import Link from "next/link";
import {
  LayoutDashboard,
  Inbox,
  Calendar,
  CalendarClock,
  Users,
  TrendingUp,
  Banknote,
  CalendarOff,
  Briefcase,
} from "lucide-react";
import { Button } from "@/components/ui/button";

export default function Sidebar() {
  return (
    <aside className="w-64 flex-shrink-0 border-r bg-white flex flex-col justify-between">
      {/* Logo Section */}
      <div className="h-20 flex items-center px-6 text-2xl font-bold text-slate-800 tracking-tight">
        <div className="mr-2 text-emerald-500">
          <svg
            width="24"
            height="24"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M12 2L2 7l10 5 10-5-10-5z" />
            <path d="M2 17l10 5 10-5" />
            <path d="M2 12l10 5 10-5" />
          </svg>
        </div>
        TeamHub
      </div>
      {/* navigation links*/}
      <nav className="flex-1 px-4 py-4 space-y-1 overflow-y-auto">
        <Link
          href="/workspace/dashboard"
          className="flex items-center px-3 py-2.5 bg-emerald-500 text-white rounded-lg font-medium shadow-sm"
        >
          <LayoutDashboard className="w-5 h-5 mr-3" />
          Dashboard
        </Link>
        <Link
          href="/workspace/employees"
          className="flex items-center px-3 py-2.5 text-slate-500 hover:text-slate-900 hover:bg-slate-100 rounded-lg font-medium transition-colors"
        >
          <Inbox className="w-5 h-5 mr-3" />
          Inbox
        </Link>
        <Link
          href="#"
          className="flex items-center px-3 py-2.5 text-slate-500 hover:text-slate-900 hover:bg-slate-100 rounded-lg font-medium transition-colors"
        >
          <Calendar className="w-5 h-5 mr-3" />
          Calendar
        </Link>
        <Link
          href="/workspace/employees"
          className="flex items-center px-3 py-2.5 text-slate-500 hover:text-slate-900 hover:bg-slate-100 rounded-lg font-medium transition-colors"
        >
          <Users className="w-5 h-5 mr-3" />
          Employees
        </Link>
        <Link
          href="/workspace/attendance"
          className="flex items-center px-3 py-2.5 text-slate-500 hover:text-slate-900 hover:bg-slate-100 rounded-lg font-medium transition-colors"
        >
          <CalendarClock className="w-5 h-5 mr-3" />
          Attendance
        </Link>
        <Link
          href="#"
          className="flex items-center px-3 py-2.5 text-slate-500 hover:text-slate-900 hover:bg-slate-100 rounded-lg font-medium transition-colors"
        >
          <TrendingUp className="w-5 h-5 mr-3" />
          Performance
        </Link>
        <Link
          href="#"
          className="flex items-center px-3 py-2.5 text-slate-500 hover:text-slate-900 hover:bg-slate-100 rounded-lg font-medium transition-colors"
        >
          <Banknote className="w-5 h-5 mr-3" />
          Payroll
        </Link>
        <Link
          href="#"
          className="flex items-center px-3 py-2.5 text-slate-500 hover:text-slate-900 hover:bg-slate-100 rounded-lg font-medium transition-colors"
        >
          <CalendarOff className="w-5 h-5 mr-3" />
          Leave Management
        </Link>
        <Link
          href="#"
          className="flex items-center px-3 py-2.5 text-slate-500 hover:text-slate-900 hover:bg-slate-100 rounded-lg font-medium transition-colors"
        >
          <Briefcase className="w-5 h-5 mr-3" />
          Recruitment
        </Link>
      </nav>

      {/* Upgrade Card Bottom Left */}
      <div className="p-4">
        <div className="bg-emerald-50 rounded-xl p-4 text-center border border-emerald-100">
          <h4 className="font-bold text-slate-900 mb-2">
            Level Up Your HR System
          </h4>
          <p className="text-xs text-slate-500 mb-4">
            TeamHub Pro gives you full control with advanced modules and
            extended layouts
          </p>
          <Button className="w-full bg-emerald-500 hover:bg-emerald-600 text-white rounded-lg shadow-none">
            Get HRM Pro
          </Button>
        </div>
      </div>
    </aside>
  );
}
