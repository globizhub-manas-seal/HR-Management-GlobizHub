"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  BarChart3,
  Activity,
  Building2,
  UserPlus,
  Clock,
  CheckCircle2,
  Ban,
  CreditCard,
  Repeat,
  History,
  Receipt,
  DollarSign,
  AlertOctagon,
  Boxes,
  SlidersHorizontal,
  Users2,
  ShieldCheck,
  ScrollText,
  LifeBuoy,
  Settings,
  ChevronDown,
  Sparkles,
  type LucideIcon,
} from "lucide-react";
import { useState } from "react";
import { usePlatformAuth } from "@/context/PlatformAuthContext";
import { cn } from "@/lib/utils";

interface PlatformNavItem {
  name: string;
  href: string;
  icon: LucideIcon;
  badge?: string;
  roles?: string[];
}

interface PlatformNavSection {
  index: string;
  title: string;
  items: PlatformNavItem[];
}

const SECTIONS: PlatformNavSection[] = [
  {
    index: "01",
    title: "Platform Overview",
    items: [
      { name: "Dashboard", href: "/platform-admin/dashboard", icon: LayoutDashboard },
      { name: "Platform Analytics", href: "/platform-admin/analytics", icon: BarChart3 },
      { name: "System Health", href: "/platform-admin/health", icon: Activity },
    ],
  },
  {
    index: "02",
    title: "Organization Management",
    items: [
      { name: "All Organizations", href: "/platform-admin/organizations", icon: Building2 },
      { name: "Onboard Organization", href: "/platform-admin/organizations/onboard", icon: UserPlus },
      { name: "Approvals Queue", href: "/platform-admin/organizations/approvals", icon: Clock },
      { name: "Active Tenants", href: "/platform-admin/organizations/active", icon: CheckCircle2 },
      { name: "Suspended Tenants", href: "/platform-admin/organizations/suspended", icon: Ban },
    ],
  },
  {
    index: "03",
    title: "Subscription & Billing",
    items: [
      { name: "Subscription Plans", href: "/platform-admin/subscriptions/plans", icon: CreditCard },
      { name: "Active Subscriptions", href: "/platform-admin/subscriptions/active", icon: Repeat },
      { name: "Lifecycle History", href: "/platform-admin/subscriptions/history", icon: History },
      { name: "Invoices", href: "/platform-admin/billing/invoices", icon: Receipt },
      { name: "Payments", href: "/platform-admin/billing/payments", icon: DollarSign },
      { name: "Failed Payments", href: "/platform-admin/billing/failed", icon: AlertOctagon },
    ],
  },
  {
    index: "04",
    title: "Product & Modules",
    items: [
      { name: "HRMS Modules", href: "/platform-admin/modules", icon: Boxes },
      { name: "Plan Entitlements", href: "/platform-admin/modules/entitlements", icon: SlidersHorizontal },
    ],
  },
  {
    index: "05",
    title: "Platform Staff & Access",
    items: [
      { name: "Super Admins & Staff", href: "/platform-admin/users", icon: Users2 },
      { name: "Roles & Permissions", href: "/platform-admin/users/roles", icon: ShieldCheck },
    ],
  },
  {
    index: "06",
    title: "Security & Audit",
    items: [
      { name: "Audit Trail", href: "/platform-admin/monitoring/audit-logs", icon: ScrollText },
    ],
  },
  {
    index: "07",
    title: "Customer Support",
    items: [
      { name: "Support Tickets", href: "/platform-admin/support", icon: LifeBuoy },
    ],
  },
  {
    index: "08",
    title: "Platform Settings",
    items: [
      { name: "Platform Settings", href: "/platform-admin/settings", icon: Settings },
    ],
  },
];

export function PlatformSidebar({ className }: { className?: string }) {
  const pathname = usePathname();
  const { user } = usePlatformAuth();
  const [collapsedSections, setCollapsedSections] = useState<Record<string, boolean>>({});

  const toggleSection = (title: string) => {
    setCollapsedSections((prev) => ({ ...prev, [title]: !prev[title] }));
  };

  return (
    <aside
      className={cn(
        "w-[264px] shrink-0 flex flex-col justify-between border-r border-border bg-card select-none z-30",
        className
      )}
    >
      <div className="flex flex-col flex-1 min-h-0">
        {/* Brand Header */}
        <div className="h-18 flex flex-col justify-center px-4 border-b border-border shrink-0 bg-card">
          <Link href="/platform-admin/dashboard" className="flex items-center justify-between group">
            <div className="flex items-center gap-2.5">
              <div className="size-8 rounded-xl bg-gradient-to-br from-amber-400 to-[#E5B232] text-slate-950 flex items-center justify-center font-bold text-sm shadow-xs border border-amber-500/30">
                <Sparkles className="size-4 text-slate-950" />
              </div>
              <div>
                <span className="text-[15px] font-bold tracking-tight text-foreground block leading-tight">
                  TeamHub
                </span>
                <span className="text-[11px] text-muted-foreground font-medium block">
                  Platform Admin
                </span>
              </div>
            </div>
            <span className="text-[10px] font-bold bg-secondary text-primary px-2 py-0.5 rounded-full border border-border uppercase tracking-wider">
              SaaS
            </span>
          </Link>
        </div>

        {/* Nav List */}
        <nav className="flex-1 overflow-y-auto px-3 py-3 space-y-4">
          {SECTIONS.map((section) => {
            const isCollapsed = collapsedSections[section.title];
            const hasActiveChild = section.items.some(
              (i) => pathname === i.href || (i.href !== "/platform-admin/dashboard" && pathname.startsWith(i.href))
            );

            return (
              <div key={section.title} className="space-y-1">
                <button
                  type="button"
                  onClick={() => toggleSection(section.title)}
                  className="w-full flex items-center justify-between px-2.5 pb-1 pt-1.5 text-[11px] font-bold text-muted-foreground/75 uppercase tracking-[0.07em] hover:text-foreground transition-colors"
                >
                  <div className="flex items-center gap-1.5">
                    <span className="font-mono text-[10px] text-muted-foreground/60">{section.index}</span>
                    <span>{section.title}</span>
                  </div>
                  <ChevronDown
                    className={cn(
                      "h-3 w-3 text-muted-foreground/60 transition-transform duration-200",
                      isCollapsed && "-rotate-90"
                    )}
                  />
                </button>

                {!isCollapsed && (
                  <div className="space-y-0.5 pt-0.5">
                    {section.items.map((item) => {
                      const isActive =
                        pathname === item.href ||
                        (item.href !== "/platform-admin/dashboard" && pathname.startsWith(item.href));

                      const Icon = item.icon;

                      return (
                        <Link
                          key={item.href}
                          href={item.href}
                          className={cn(
                            "group relative flex items-center min-h-[38px] px-3 py-2 rounded-xl text-[13px] tracking-tight transition-all duration-150 active:scale-[0.98]",
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
                )}
              </div>
            );
          })}
        </nav>
      </div>

      {/* Admin User Footer - Clickable link to Super Admins & Staff management */}
      <div className="p-3 border-t border-border shrink-0 bg-card">
        <Link
          href="/platform-admin/users"
          title="Manage Super Admins & Platform Staff"
          className="flex items-center gap-3 px-2.5 py-2 rounded-xl bg-muted/50 border border-border hover:border-primary/40 hover:bg-muted transition-colors group cursor-pointer block"
        >
          <div className="flex items-center gap-3 w-full">
            <div className="size-8 rounded-xl bg-primary/20 border border-primary/30 flex items-center justify-center text-xs font-bold text-foreground uppercase group-hover:scale-105 transition-transform">
              {user?.firstName?.[0] || "S"}
              {user?.lastName?.[0] || "A"}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-xs font-semibold text-foreground truncate group-hover:text-primary transition-colors">
                {user ? `${user.firstName} ${user.lastName}` : "Platform Super Admin"}
              </p>
              <p className="text-[10px] text-primary font-mono font-semibold truncate">
                {user?.role || "SUPER_ADMIN"} &bull; Manage &rarr;
              </p>
            </div>
          </div>
        </Link>
      </div>
    </aside>
  );
}

