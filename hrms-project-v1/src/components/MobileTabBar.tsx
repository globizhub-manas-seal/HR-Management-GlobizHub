"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Users,
  Clock,
  Calendar,
  Settings,
} from "lucide-react";
import { cn } from "@/lib/utils";

const TABS = [
  {
    name: "Dashboard",
    href: "/workspace/dashboard",
    icon: LayoutDashboard,
  },
  {
    name: "Directory",
    href: "/workspace/employees",
    icon: Users,
  },
  {
    name: "Attendance",
    href: "/workspace/attendance",
    icon: Clock,
  },
  {
    name: "Leaves",
    href: "/workspace/leave",
    icon: Calendar,
  },
  {
    name: "Settings",
    href: "/workspace/settings",
    icon: Settings,
  },
];

export function MobileTabBar() {
  const pathname = usePathname();

  return (
    <nav
      className="lg:hidden fixed bottom-0 inset-x-0 z-40 material-translucent border-t border-hairline border-separator pb-[env(safe-area-inset-bottom,0px)]"
      aria-label="Mobile Navigation Bar"
    >
      <div className="flex items-center justify-around h-[49px] px-2">
        {TABS.map((tab) => {
          const Icon = tab.icon;
          const isActive =
            pathname === tab.href ||
            (tab.href !== "/workspace/dashboard" && pathname.startsWith(tab.href));

          return (
            <Link
              key={tab.name}
              href={tab.href}
              className={cn(
                "flex flex-col items-center justify-center min-w-[56px] min-h-[44px] gap-0.5 rounded-[8px] transition-colors ease-[cubic-bezier(0.32,0.72,0,1)] active:scale-95",
                isActive
                  ? "text-primary font-semibold"
                  : "text-label-secondary hover:text-foreground"
              )}
            >
              <Icon className={cn("size-5", isActive ? "stroke-[2.2]" : "stroke-[1.5]")} />
              <span className="text-[10px] tracking-tight">{tab.name}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
