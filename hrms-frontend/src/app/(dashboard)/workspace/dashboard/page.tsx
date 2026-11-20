"use client";

import { DashboardSkeleton } from "@/components/skeletons";
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
    return <DashboardSkeleton />;
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