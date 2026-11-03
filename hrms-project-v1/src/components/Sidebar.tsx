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
import { SIDEBAR_MODULES } from "@/lib/permissions";
import { usePermissions } from "@/context/PermissionContext";
import { cn } from "@/lib/utils";

// Map string icon names to actual icon components
const ICON_MAP: Record<string, LucideIcon> = {
  LayoutDashboard,
  Users,
  CalendarClock,
  Settings,
  Clock,
  Calendar,
  Briefcase,
  CheckSquare,
  FolderOpen,
  CalendarCheck,
  CalendarIcon,
  Banknote,
  Calculator,
  Shield,
  UserCheck,
  LogOut,
  GraduationCap,
  Sparkles,
};

export default function Sidebar({
  role,
  className,
}: {
  role?: string;
  className?: string;
}) {
  const pathname = usePathname();
  const { user, isViewAsUser } = useViewMode();
  const { sidebarModuleKeys, designation } = usePermissions();

  const isManagerMode = user?.role === "MANAGER" && !isViewAsUser;
  const links = buildSidebarLinks(sidebarModuleKeys);

  const isAdminOrHR = user?.role === "SUPER_ADMIN" || user?.role === "OWNER" || user?.role === "HR_HEAD";
  const finalLinks = isAdminOrHR && !links.some((l) => l.href === "/workspace/settings/designations")
    ? [
        ...links,
        {
          name: "Designations",
          href: "/workspace/settings/designations",
          icon: Shield,
        },
      ]
    : links;

  const activeHref = finalLinks
    .filter(
      (link) => pathname === link.href || pathname.startsWith(`${link.href}/`),
    )
    .sort(
      (firstLink, secondLink) => secondLink.href.length - firstLink.href.length,
    )[0]?.href;

  const isSimulatedUser = user?.role === "MANAGER" && isViewAsUser;

  const navigation = (
    <>
      <div className="flex flex-col flex-1 min-h-0 material-translucent">
        {/* Apple Brand / Header Area */}
        <div className="h-16 flex flex-col justify-center px-5 border-b border-hairline border-separator shrink-0">
          <div className="flex items-center justify-between">
            <span className="text-[17px] font-semibold tracking-tight text-foreground">
              TeamHub HRMS
            </span>
            {isManagerMode && (
              <span className="text-[11px] font-semibold bg-primary/12 text-primary px-2 py-0.5 rounded-full">
                Manager
              </span>
            )}
            {isSimulatedUser && (
              <span className="text-[11px] font-semibold bg-fill text-label-secondary px-2 py-0.5 rounded-full">
                User
              </span>
            )}
            {isAdminOrHR && !isManagerMode && !isSimulatedUser && (
              <span className="text-[11px] font-semibold bg-primary/12 text-primary px-2 py-0.5 rounded-full">
                Admin
              </span>
            )}
          </div>

          {designation && !isSimulatedUser && (
            <span
              className="mt-1 self-start text-[11px] font-medium px-2 py-0.5 rounded-full border border-hairline"
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

        {/* Section Header */}
        <div className="px-5 pt-4 pb-1 text-[12px] font-medium text-label-secondary uppercase tracking-wider">
          Workspace
        </div>

        {/* Navigation Links with 8px item padding & 10px radius selected pill */}
        <nav className="flex-1 px-3 py-1 space-y-1 overflow-y-auto [&::-webkit-scrollbar]:hidden [-ms-overflow-style:'none'] [scrollbar-width:'none']">
          {finalLinks.map((link) => {
            const Icon = link.icon;
            const isActive = link.href === activeHref;
            return (
              <Link
                key={link.name}
                href={link.href}
                className={cn(
                  "flex items-center min-h-[36px] px-3 py-2 rounded-[10px] text-[14px] font-medium tracking-tight transition-all duration-150 ease-[cubic-bezier(0.32,0.72,0,1)] active:scale-[0.98]",
                  isActive
                    ? "bg-primary/12 text-primary font-semibold"
                    : "text-label-secondary hover:bg-fill/60 hover:text-foreground"
                )}
              >
                <Icon className={cn("size-5 mr-3 shrink-0 stroke-[1.5]", isActive && "text-primary")} />
                <span className="truncate">{link.name}</span>
              </Link>
            );
          })}
        </nav>
      </div>

      {/* Footer / Support Link */}
      <div className="p-3 border-t border-hairline border-separator shrink-0 material-translucent">
        <Link
          href="/workspace/support"
          className="flex items-center w-full min-h-[36px] px-3 py-2 text-[14px] font-medium text-label-secondary hover:bg-fill/60 hover:text-foreground rounded-[10px] transition-all duration-150 active:scale-[0.98] outline-none focus-visible:ring-2 focus-visible:ring-primary"
        >
          <HelpCircle className="size-5 mr-3 text-label-tertiary stroke-[1.5]" />
          <span>Help & Support</span>
        </Link>
      </div>
    </>
  );

  return (
    <aside
      className={cn(
        "w-[260px] shrink-0 flex-col justify-between border-r border-hairline border-separator material-translucent select-none",
        className
      )}
    >
      {navigation}
    </aside>
  );
}

function buildSidebarLinks(moduleKeys: string[]): { name: string; href: string; icon: LucideIcon }[] {
  return moduleKeys
    .map((key) => {
      const mod = SIDEBAR_MODULES.find((m) => m.key === key);
      if (!mod) return null;
      const icon = ICON_MAP[mod.icon.displayName || ""] || mod.icon;
      return {
        name: mod.label,
        href: mod.href,
        icon: mod.icon,
      };
    })
    .filter(Boolean) as { name: string; href: string; icon: LucideIcon }[];
}
