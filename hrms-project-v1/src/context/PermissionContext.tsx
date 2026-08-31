"use client";

import React, { createContext, useContext } from "react";
import { useQuery } from "@tanstack/react-query";
import axios from "axios";
import {
  type Designation,
  SIDEBAR_MODULES,
  DASHBOARD_WIDGETS,
  getDefaultSidebarModules,
  getDefaultDashboardWidgets,
  getDefaultModulePermissions,
  type PermissionAction,
} from "@/lib/permissions";
import { useViewMode } from "@/context/ViewModeContext";

// ============================================================
// PermissionContext
// ============================================================
// Fetches the current user's designation-based permissions and
// exposes easy-to-use hooks for the entire app.
//
// If no designation is assigned to the user (or the API isn't
// available yet), it falls back to the hardcoded defaults based
// on the user's system role — so existing behavior is preserved.
// ============================================================

interface PermissionContextType {
  /** The full designation object, or null if using fallback */
  designation: Designation | null;
  /** Whether designation data is still loading */
  isLoading: boolean;
  /** Ordered list of sidebar module keys the current user can see */
  sidebarModuleKeys: string[];
  /** Ordered list of dashboard widget keys enabled for the user */
  dashboardWidgetKeys: string[];
  /** Check if user can access a specific sidebar module */
  canAccessModule: (moduleKey: string) => boolean;
  /** Check if user has a specific CRUD permission on a module */
  hasPermission: (moduleKey: string, action: PermissionAction) => boolean;
  /** Check if a specific dashboard widget is enabled */
  isWidgetEnabled: (widgetKey: string) => boolean;
}

const PermissionContext = createContext<PermissionContextType | undefined>(undefined);

export function PermissionProvider({ children }: { children: React.ReactNode }) {
  const { user, activeRole, isLoading: userLoading } = useViewMode();

  // Fetch designation permissions for the current user
  const { data: designation, isLoading: designationLoading } = useQuery<Designation | null>({
    queryKey: ["userDesignation", user?.id],
    queryFn: async () => {
      const token = localStorage.getItem("hrms_token");
      if (!token) return null;
      try {
        const res = await axios.get(
          `${process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000"}/auth/me/permissions`,
          { headers: { Authorization: `Bearer ${token}` } }
        );
        return res.data?.designation || null;
      } catch {
        // API not available yet — fall back to defaults
        return null;
      }
    },
    enabled: !!user?.id,
    retry: false,
    staleTime: 5 * 60 * 1000, // Cache for 5 minutes
  });

  const isLoading = userLoading || designationLoading;
  const effectiveRole = activeRole || "EMPLOYEE";

  // Resolve sidebar modules — use designation config if available, else defaults
  const sidebarModuleKeys = designation?.sidebarModules
    ?? getDefaultSidebarModules(effectiveRole);

  // Resolve dashboard widgets
  const dashboardWidgetKeys = designation?.dashboardWidgets
    ?? getDefaultDashboardWidgets(effectiveRole);

  // Resolve module permissions
  const modulePermissions = designation?.modulePermissions
    ?? getDefaultModulePermissions(effectiveRole);

  const canAccessModule = (moduleKey: string): boolean => {
    return sidebarModuleKeys.includes(moduleKey);
  };

  const hasPermission = (moduleKey: string, action: PermissionAction): boolean => {
    const perms = modulePermissions[moduleKey];
    if (!perms) return false;
    return perms.includes(action);
  };

  const isWidgetEnabled = (widgetKey: string): boolean => {
    return dashboardWidgetKeys.includes(widgetKey);
  };

  return (
    <PermissionContext.Provider
      value={{
        designation: designation ?? null,
        isLoading,
        sidebarModuleKeys,
        dashboardWidgetKeys,
        canAccessModule,
        hasPermission,
        isWidgetEnabled,
      }}
    >
      {children}
    </PermissionContext.Provider>
  );
}

// ============================================================
// Hooks
// ============================================================

/** Access the full permission context */
export function usePermissions() {
  const context = useContext(PermissionContext);
  if (!context) {
    throw new Error("usePermissions must be used within a PermissionProvider");
  }
  return context;
}

/** Check if user can access a sidebar module */
export function useCanAccess(moduleKey: string): boolean {
  const { canAccessModule } = usePermissions();
  return canAccessModule(moduleKey);
}

/** Check a specific CRUD permission: useModulePermission("employees", "edit") */
export function useModulePermission(moduleKey: string, action: PermissionAction): boolean {
  const { hasPermission } = usePermissions();
  return hasPermission(moduleKey, action);
}

/** Get the list of enabled dashboard widget keys */
export function useDashboardWidgets(): string[] {
  const { dashboardWidgetKeys } = usePermissions();
  return dashboardWidgetKeys;
}
