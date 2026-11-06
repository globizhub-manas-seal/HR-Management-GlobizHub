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
  Banknote,
  Calculator,
  Shield,
  UserCheck,
  LogOut,
  GraduationCap,
  Sparkles,
  type LucideIcon,
} from "lucide-react";
import { useViewMode } from "@/context/ViewModeContext";
import { usePermissions } from "@/context/PermissionContext";
import { cn } from "@/lib/utils";

interface NavItem {
  key: string;
  name: string;
  href: string;
  icon: LucideIcon;
  badge?: string;
  adminOnly?: boolean;
}

interface NavSection {
  title: string;
  items: NavItem[];
}

export default function Sidebar({
  role,
  className,
}: {
  role?: string;
  className?: string;
}) {
  const pathname = usePathname();
  const { user, isViewAsUser } = useViewMode();
  const { sidebarModuleKeys = [], designation, canAccessModule } = usePermissions();

  const isManagerMode = user?.role === "MANAGER" && !isViewAsUser;
  const isSimulatedUser = user?.role === "MANAGER" && isViewAsUser;
  const isEmployeeRole = user?.role === "EMPLOYEE" || isSimulatedUser;

  // True for Super Admin, Owner, HR Head, or when user role is not yet determined
  const isAdminOrHR =
    !user ||
    user?.role === "SUPER_ADMIN" ||
    user?.role === "OWNER" ||
    user?.role === "HR_HEAD";

  // Section-based navigation specification
  const sections: NavSection[] = [
    {
      title: "Workspace",
      items: [
        {
          key: "dashboard",
          name: "Dashboard",
          href: "/workspace/dashboard",
          icon: LayoutDashboard,
        },
      ],
    },
    {
      title: "Talent Management",
      items: [
        {
          key: "onboarding",
          name: "Onboarding",
          href: "/workspace/onboarding",
          icon: UserCheck,
        },
        {
          key: "recruitment",
          name: "Recruitment",
          href: "/workspace/recruitment",
          icon: Briefcase,
        },
        {
          key: "training",
          name: "Training & Development",
          href: "/workspace/training",
          icon: GraduationCap,
        },
      ],
    },
    {
      title: "Employee Management",
      items: [
        {
          key: "employees",
          name: "Employees",
          href: "/workspace/employees",
          icon: Users,
        },
        {
          key: "designations",
          name: "Designations",
          href: "/workspace/settings/designations",
          icon: Shield,
        },
        {
          key: "resignation",
          name: "Resignations",
          href: "/workspace/resignation",
          icon: LogOut,
        },
      ],
    },
    {
      title: "Attendance & Leave",
      items: [
        {
          key: "attendance",
          name: "Clock ins/outs",
          href: "/workspace/attendance",
          icon: Clock,
        },
        // Leave Approvals for HR/Manager; Apply Leave for Employees
        !isEmployeeRole
          ? {
              key: "leave_approvals",
              name: "Leave Approvals",
              href: "/workspace/leave/admin",
              icon: CalendarCheck,
            }
          : {
              key: "leave",
              name: "Apply Leave",
              href: "/workspace/leave",
              icon: CalendarClock,
            },
        {
          key: "leave_policies",
          name: "Leave Policies",
          href: "/workspace/leave/admin/settings",
          icon: CalendarClock,
          adminOnly: true,
        },
        // Manage Schedules for Admin/Manager; My Schedules for Employees
        !isEmployeeRole
          ? {
              key: "manage_schedules",
              name: "Manage Schedules",
              href: "/workspace/schedules/admin",
              icon: CalendarIcon,
            }
          : {
              key: "schedules",
              name: "My Schedules",
              href: "/workspace/schedules",
              icon: Calendar,
            },
      ],
    },
    {
      title: "Administration",
      items: [
        // Payroll Processing for Admin; My Payslips for Employee
        !isEmployeeRole
          ? {
              key: "payroll",
              name: "Payroll Processing",
              href: "/workspace/payroll/admin",
              icon: Calculator,
            }
          : {
              key: "payslips",
              name: "My Payslips",
              href: "/workspace/my-payslips",
              icon: Banknote,
            },
        // Documents (Admin) for Admin; Documents for Employee
        !isEmployeeRole
          ? {
              key: "documents_admin",
              name: "Documents (Admin)",
              href: "/workspace/documents/admin",
              icon: FolderOpen,
            }
          : {
              key: "documents",
              name: "Documents",
              href: "/workspace/documents",
              icon: FolderOpen,
            },
        {
          key: "tasks",
          name: "Tasks",
          href: "/workspace/tasks",
          icon: CheckSquare,
        },
        {
          key: "settings",
          name: "Settings",
          href: "/workspace/settings",
          icon: Settings,
        },
      ],
    },
  ];

  // Resilient visibility filter: ensures items always show correctly
  const isItemVisible = (item: NavItem): boolean => {
    if (item.adminOnly && !isAdminOrHR) return false;

    // Always show full menu for Admins & HR Heads
    if (isAdminOrHR) return true;

    // Explicit designation / RBAC check if loaded
    if (sidebarModuleKeys.length > 0) {
      if (sidebarModuleKeys.includes(item.key)) return true;
      if (item.key === "designations" && (isAdminOrHR || isManagerMode)) return true;
      if (canAccessModule?.(item.key)) return true;
    }

    // Manager role defaults
    if (isManagerMode) {
      const managerAllowed = [
        "dashboard",
        "onboarding",
        "recruitment",
        "training",
        "employees",
        "designations",
        "resignation",
        "attendance",
        "leave_approvals",
        "manage_schedules",
        "tasks",
        "settings",
      ];
      return managerAllowed.includes(item.key);
    }

    // Employee role defaults
    if (isEmployeeRole) {
      const employeeAllowed = [
        "dashboard",
        "training",
        "resignation",
        "attendance",
        "leave",
        "schedules",
        "payslips",
        "documents",
        "tasks",
      ];
      return employeeAllowed.includes(item.key);
    }

    return true;
  };

  const filteredSections = sections
    .map((section) => ({
      ...section,
      items: section.items.filter(isItemVisible),
    }))
    .filter((section) => section.items.length > 0);

  // Collect all visible items for accurate active route highlighting
  const allVisibleItems = filteredSections.flatMap((s) => s.items);

  const activeHref = allVisibleItems
    .filter(
      (link) => pathname === link.href || pathname.startsWith(`${link.href}/`)
    )
    .sort(
      (firstLink, secondLink) => secondLink.href.length - firstLink.href.length
    )[0]?.href;

  return (
    <aside
      className={cn(
        "w-[264px] shrink-0 flex flex-col justify-between border-r border-border bg-card select-none",
        className
      )}
    >
      <div className="flex flex-col flex-1 min-h-0">
        {/* Brand Header */}
        <div className="h-18 flex flex-col justify-center px-4 border-b border-border shrink-0 bg-card">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="size-8 rounded-xl bg-gradient-to-br from-amber-400 to-[#E5B232] text-slate-950 flex items-center justify-center font-bold text-sm shadow-xs border border-amber-500/30">
                <Sparkles className="size-4 text-slate-950" />
              </div>
              <div>
                <span className="text-[15px] font-bold tracking-tight text-foreground block leading-tight">
                  TeamHub HRMS
                </span>
                <span className="text-[11px] text-muted-foreground font-medium block">
                  Workforce Suite
                </span>
              </div>
            </div>

            {/* Role Badge */}
            {isManagerMode && (
              <span className="text-[10px] font-bold bg-secondary text-primary px-2 py-0.5 rounded-full border border-border uppercase tracking-wider">
                Manager
              </span>
            )}
            {isSimulatedUser && (
              <span className="text-[10px] font-bold bg-muted text-muted-foreground px-2 py-0.5 rounded-full border border-border uppercase tracking-wider">
                User
              </span>
            )}
            {isAdminOrHR && !isManagerMode && !isSimulatedUser && (
              <span className="text-[10px] font-bold bg-secondary text-primary px-2 py-0.5 rounded-full border border-border uppercase tracking-wider">
                Admin
              </span>
            )}
            {isEmployeeRole && !isAdminOrHR && !isManagerMode && !isSimulatedUser && (
              <span className="text-[10px] font-bold bg-muted text-foreground px-2 py-0.5 rounded-full border border-border uppercase tracking-wider">
                Employee
              </span>
            )}
          </div>

          {designation && !isSimulatedUser && (
            <span
              className="mt-1.5 self-start text-[10px] font-semibold px-2 py-0.5 rounded-full border"
              style={{
                backgroundColor: `${designation.color}15`,
                borderColor: `${designation.color}40`,
                color: designation.color,
              }}
            >
              {designation.name}
            </span>
          )}
        </div>

        {/* Grouped Navigation Links */}
        <nav className="flex-1 px-3 py-3 space-y-4 overflow-y-auto [&::-webkit-scrollbar]:hidden [-ms-overflow-style:'none'] [scrollbar-width:'none']">
          {filteredSections.map((section) => (
            <div key={section.title} className="space-y-1">
              {/* Section Header */}
              <div className="px-2.5 pb-1 pt-1.5 text-[11px] font-bold text-muted-foreground/75 uppercase tracking-[0.07em]">
                {section.title}
              </div>

              {/* Section Items */}
              <div className="space-y-0.5">
                {section.items.map((item) => {
                  const Icon = item.icon;
                  const isActive = item.href === activeHref;

                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      className={cn(
                        "group relative flex items-center min-h-[38px] px-3 py-2 rounded-xl text-[13.5px] tracking-tight transition-all duration-150 active:scale-[0.98]",
                        isActive
                          ? "bg-primary/20 text-foreground font-semibold border-l-[3.5px] border-primary shadow-xs"
                          : "text-muted-foreground hover:bg-primary/10 hover:text-foreground font-medium"
                      )}
                    >
                      <Icon
                        className={cn(
                          "size-[18px] mr-2.5 shrink-0 transition-colors",
                          isActive
                            ? "text-primary stroke-[2.2]"
                            : "text-muted-foreground group-hover:text-foreground stroke-[1.6]"
                        )}
                      />

                      <span className="truncate">{item.name}</span>

                      {item.badge && (
                        <span className="ml-auto text-[10px] font-bold px-1.5 py-0.5 rounded-full bg-primary/25 text-foreground">
                          {item.badge}
                        </span>
                      )}
                    </Link>
                  );
                })}
              </div>
            </div>
          ))}
        </nav>
      </div>

      {/* Footer / Support Link */}
      <div className="p-3 border-t border-border shrink-0 bg-card">
        <Link
          href="/workspace/support"
          className="flex items-center w-full min-h-[36px] px-3 py-2 text-[13.5px] font-medium text-muted-foreground hover:bg-primary/10 hover:text-foreground rounded-xl transition-all duration-150 active:scale-[0.98] outline-none focus-visible:ring-2 focus-visible:ring-ring"
        >
          <HelpCircle className="size-[18px] mr-2.5 text-muted-foreground/70 stroke-[1.6]" />
          <span>Help & Support</span>
        </Link>
      </div>
    </aside>
  );
}
