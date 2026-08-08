"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { 
  LayoutDashboard, 
  Users, 
  CalendarClock, 
  Settings, 
  Clock, 
  Calendar, 
  Briefcase, 
  CheckSquare, 
  FolderOpen, 
  HelpCircle, 
  CalendarCheck,
  CalendarIcon
} from "lucide-react";

export default function Sidebar({ role, className }: { role?: string; className?: string }) {
  const pathname = usePathname();

  // Define links for standard Employees matching your mockup
  const employeeLinks = [
    { name: "Dashboard", href: "/workspace/dashboard", icon: LayoutDashboard },
    { name: "Clock ins/outs", href: "/workspace/attendance", icon: Clock },
    { name: "Schedules", href: "/workspace/schedules", icon: Calendar },
    
    { name: "Time off", href: "/workspace/leave", icon: CalendarClock },
    { name: "Shifts", href: "/workspace/shifts", icon: Briefcase },
    { name: "Tasks", href: "/workspace/tasks", icon: CheckSquare },
    { name: "Documents", href: "/workspace/documents", icon: FolderOpen },
  ];

  // Define links for Super Admin / HR
  const adminLinks = [
    { name: "Dashboard", href: "/workspace/dashboard", icon: LayoutDashboard },
    { name: "Employees", href: "/workspace/employees", icon: Users },
    { name: "Attendance", href: "/workspace/attendance", icon: CalendarClock },
    { name: "Leave Approvals", href: "/workspace/leave/admin", icon: CalendarCheck },
    { name: "Documents", href: "/workspace/documents", icon: FolderOpen },
    { name: "Settings", href: "/workspace/settings", icon: Settings },
    { name: "Manage Schedules", href: "/workspace/schedules/admin", icon: CalendarIcon },
  ];

  const links = role === "EMPLOYEE" ? employeeLinks : adminLinks;

  const navigation = (
    <>
      <div className="flex flex-col flex-1 min-h-0">
        {/* Logo / Brand Area */}
        <div className="h-20 flex items-center px-8 border-b shrink-0">
          <span className="text-xl font-bold bg-gradient-to-r from-emerald-600 to-teal-500 bg-clip-text text-transparent">
            TeamHub HRMS
          </span>
        </div>

        {/* Navigation Links */}
        {/* Navigation Links */}
        <nav className="flex-1 p-4 space-y-1 overflow-y-auto [&::-webkit-scrollbar]:hidden [-ms-overflow-style:'none'] [scrollbar-width:'none']">
          {links.map((link) => {
            const Icon = link.icon;
            const isActive = pathname === link.href;
            return (
              <Link
                key={link.name}
                href={link.href}
                className={`flex items-center px-4 py-3 rounded-xl text-sm font-medium transition-colors ${
                  isActive 
                    ? "bg-emerald-50 text-emerald-600" 
                    : "text-slate-600 hover:bg-slate-50 hover:text-slate-900"
                }`}
              >
                <Icon className="w-5 h-5 mr-3" />
                {link.name}
              </Link>
            );
          })}
        </nav>
      </div>

      {/* Footer / Support Link */}
      <div className="p-4 border-t shrink-0">
        <button className="flex items-center w-full px-4 py-3 text-sm font-medium text-slate-600 hover:bg-slate-50 rounded-xl transition-colors">
          <HelpCircle className="w-5 h-5 mr-3 text-slate-400" />
          Help & Support
        </button>
      </div>
    </>
  );

  return (
    <aside className={`w-64 shrink-0 flex-col justify-between border-r bg-white ${className}`}>
      {navigation}
    </aside>
  );
}
