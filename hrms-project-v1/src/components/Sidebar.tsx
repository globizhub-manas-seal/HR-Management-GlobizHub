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
  CalendarIcon,
  Banknote, // ✅ New Payroll Icon
  Calculator, // ✅ New Payroll Icon
} from "lucide-react";
import { useViewMode } from "@/context/ViewModeContext";

export default function Sidebar({
  role,
  className,
}: {
  role?: string;
  className?: string;
}) {
  const pathname = usePathname();
  const { user, isViewAsUser } = useViewMode();

  // If base user role is MANAGER and viewAsUser toggle is off, we are in Manager Mode
  const isManagerMode = user?.role === "MANAGER" && !isViewAsUser;

  // Define links for standard Employees matching your mockup
  const employeeLinks = [
    { name: "Dashboard", href: "/workspace/dashboard", icon: LayoutDashboard },
    { name: "Clock ins/outs", href: "/workspace/attendance", icon: Clock },
    { name: "Schedules", href: "/workspace/schedules", icon: Calendar },
    { name: "Time off", href: "/workspace/leave", icon: CalendarClock },
    { name: "My Payslips", href: "/workspace/my-payslips", icon: Banknote }, // ✅ Added Employee Payslips
    { name: "Shifts", href: "/workspace/shifts", icon: Briefcase },
    { name: "Tasks", href: "/workspace/tasks", icon: CheckSquare },
    { name: "Documents", href: "/workspace/documents", icon: FolderOpen },
  ];

  // Define links for Managers (excluding Clock ins/outs as requested)
  const managerLinks = [
    { name: "Dashboard", href: "/workspace/dashboard", icon: LayoutDashboard },
    { name: "Employees", href: "/workspace/employees", icon: Users },
    { name: "Leave Approvals", href: "/workspace/leave/admin", icon: CalendarCheck },
    { name: "Time off", href: "/workspace/leave", icon: CalendarClock },
    { name: "My Payslips", href: "/workspace/my-payslips", icon: Banknote },
    { name: "Schedules", href: "/workspace/schedules", icon: Calendar },
    { name: "Tasks", href: "/workspace/tasks", icon: CheckSquare },
    { name: "Documents", href: "/workspace/documents", icon: FolderOpen },
  ];

  // Define links for HR Head / HR Admins
  const hrLinks = [
    { name: "Dashboard", href: "/workspace/dashboard", icon: LayoutDashboard },
    { name: "Employees", href: "/workspace/employees", icon: Users },
    { name: "Attendance", href: "/workspace/attendance", icon: CalendarClock },
    { name: "Leave Approvals", href: "/workspace/leave/admin", icon: CalendarCheck },
    { name: "Leave Policies", href: "/workspace/leave/admin/settings", icon: Settings },
    { name: "Payroll Processing", href: "/workspace/payroll/admin", icon: Calculator },
    { name: "Documents", href: "/workspace/documents/admin", icon: FolderOpen },
    { name: "Manage Schedules", href: "/workspace/schedules/admin", icon: CalendarIcon },
  ];

  // Define links for Super Admin / Owner / CEO
  const adminLinks = [
    { name: "Dashboard", href: "/workspace/dashboard", icon: LayoutDashboard },
    { name: "Employees", href: "/workspace/employees", icon: Users },
    //{ name: "Attendance", href: "/workspace/attendance", icon: CalendarClock },
    { name: "Leave Approvals", href: "/workspace/leave/admin", icon: CalendarCheck },
    { name: "Leave Policies", href: "/workspace/leave/admin/settings", icon: Settings },
    { name: "Payroll Processing", href: "/workspace/payroll/admin", icon: Calculator },
    { name: "Documents", href: "/workspace/documents/admin", icon: FolderOpen },
    { name: "Manage Schedules", href: "/workspace/schedules/admin", icon: CalendarIcon },
    { name: "Settings", href: "/workspace/settings", icon: Settings },
  ];

  const links = role === "EMPLOYEE" 
    ? employeeLinks 
    : role === "MANAGER" 
    ? managerLinks 
    : role === "HR_HEAD" 
    ? hrLinks 
    : adminLinks;

  const activeHref = links
    .filter(
      (link) => pathname === link.href || pathname.startsWith(`${link.href}/`),
    )
    .sort(
      (firstLink, secondLink) => secondLink.href.length - firstLink.href.length,
    )[0]?.href;

  const isSimulatedUser = user?.role === "MANAGER" && isViewAsUser;
  const isAdminOrHR = user?.role === "SUPER_ADMIN" || user?.role === "OWNER" || user?.role === "HR_HEAD";

  const navigation = (
    <>
      <div className="flex flex-col flex-1 min-h-0">
        {/* Logo / Brand Area */}
        <div className="h-20 flex flex-col justify-center px-8 border-b shrink-0">
          <span className={`text-xl font-bold bg-gradient-to-r ${isManagerMode ? "from-violet-600 to-indigo-600" : "from-emerald-600 to-teal-500"} bg-clip-text text-transparent`}>
            TeamHub HRMS
          </span>
          {isManagerMode && (
            <span className="mt-1 self-start text-[9px] font-bold bg-violet-100 text-violet-700 px-2 py-0.5 rounded-full uppercase tracking-wider">
              Manager Portal
            </span>
          )}
          {isSimulatedUser && (
            <span className="mt-1 self-start text-[9px] font-bold bg-emerald-100 text-emerald-700 px-2 py-0.5 rounded-full uppercase tracking-wider">
              User View
            </span>
          )}
          {isAdminOrHR && (
            <span className="mt-1 self-start text-[9px] font-bold bg-slate-100 text-slate-700 px-2 py-0.5 rounded-full uppercase tracking-wider">
              Admin View
            </span>
          )}
        </div>

        {/* Navigation Links */}
        <nav className="flex-1 p-4 space-y-1 overflow-y-auto [&::-webkit-scrollbar]:hidden [-ms-overflow-style:'none'] [scrollbar-width:'none']">
          {links.map((link) => {
            const Icon = link.icon;
            const isActive = link.href === activeHref;
            return (
              <Link
                key={link.name}
                href={link.href}
                className={`flex items-center px-4 py-3 rounded-xl text-sm font-medium transition-colors ${
                  isActive
                    ? isManagerMode
                      ? "bg-violet-50 text-violet-700 border-l-4 border-violet-600"
                      : "bg-emerald-50 text-emerald-600 border-l-4 border-emerald-600"
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
    <aside
      className={`w-64 shrink-0 flex-col justify-between border-r bg-white ${className}`}
    >
      {navigation}
    </aside>
  );
}