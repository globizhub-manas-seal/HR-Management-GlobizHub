"use client";

import { usePlatformAuth } from "@/context/PlatformAuthContext";
import {
  Bell,
  Search,
  LogOut,
  ShieldAlert,
  ExternalLink,
  User,
} from "lucide-react";
import Link from "next/link";

export function PlatformHeader() {
  const { user, logout } = usePlatformAuth();

  return (
    <header className="h-16 flex items-center justify-between px-6 bg-card border-b border-border text-foreground flex-shrink-0 z-20">
      {/* Left: Environment & Breadcrumbs */}
      <div className="flex items-center gap-3">
        <div className="flex items-center gap-2">
          <div className="size-2 rounded-full bg-status-green animate-pulse" />
          <span className="text-xs font-bold tracking-wide text-foreground uppercase">
            Platform Production
          </span>
        </div>
        <span className="text-muted-foreground/50">/</span>
        <span className="text-xs text-muted-foreground font-medium">SaaS Operations</span>
      </div>

      {/* Right Controls */}
      <div className="flex items-center gap-3">
        {/* Switch to Organization HRMS preview */}
        <Link
          href="/workspace/dashboard"
          target="_blank"
          className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold text-white bg-slate-900 hover:bg-slate-800 border border-slate-700 transition-colors shadow-xs"
        >
          <span>Open Tenant Workspace</span>
          <ExternalLink className="size-3.5 text-slate-300" />
        </Link>

        {/* Admin Badge */}
        <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-muted/60 border border-border">
          <User className="h-3.5 w-3.5 text-primary" />
          <span className="text-xs font-medium text-foreground">
            {user?.email || "superadmin@teamhub.saas"}
          </span>
        </div>

        {/* Sign Out */}
        <button
          type="button"
          onClick={logout}
          title="Sign out of Platform Admin"
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold text-destructive bg-destructive/10 hover:bg-destructive/20 border border-destructive/20 transition-colors cursor-pointer"
        >
          <LogOut className="h-3.5 w-3.5" />
          <span>Exit</span>
        </button>
      </div>
    </header>
  );
}

