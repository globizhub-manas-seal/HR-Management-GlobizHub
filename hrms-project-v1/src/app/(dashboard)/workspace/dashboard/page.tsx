"use client";

import { Loader2 } from "lucide-react";
import { EmployeeDashboardView } from "@/components/dashboard/EmployeeDashboardView";
import { ManagerDashboardView } from "@/components/dashboard/ManagerDashboardView";
import { HRDashboardView } from "@/components/dashboard/HRDashboardView";
import { AdminDashboardView } from "@/components/dashboard/AdminDashboardView";
import { useViewMode } from "@/context/ViewModeContext";
import { usePermissions } from "@/context/PermissionContext";

export default function DashboardRouter() {
  const { activeRole, isLoading: userLoading } = useViewMode();
  const { designation, isLoading: permLoading } = usePermissions();

  if (userLoading || permLoading) {
    return (
      <div className="flex h-96 items-center justify-center bg-slate-50/50 min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-emerald-500" />
      </div>
    );
  }

  // If a designation is assigned, use its baseRole for the dashboard view
  // This allows custom designations to map to the correct dashboard layout
  const effectiveRole = designation?.baseRole || activeRole;

  // Route to the appropriate dashboard component based on their effective role
  switch (effectiveRole) {
    case 'EMPLOYEE':
      return <EmployeeDashboardView />;
    case 'MANAGER':
      return <ManagerDashboardView />;
    case 'HR_HEAD':
      return <HRDashboardView />;
    case 'SUPER_ADMIN':
    case 'OWNER':
    default:
      return <AdminDashboardView />;
  }
}