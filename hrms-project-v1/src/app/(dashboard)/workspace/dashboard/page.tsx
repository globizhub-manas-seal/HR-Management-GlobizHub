"use client";

import { Loader2 } from "lucide-react";
import { EmployeeDashboardView } from "@/components/dashboard/EmployeeDashboardView";
import { ManagerDashboardView } from "@/components/dashboard/ManagerDashboardView";
import { HRDashboardView } from "@/components/dashboard/HRDashboardView";
import { AdminDashboardView } from "@/components/dashboard/AdminDashboardView";
import { useViewMode } from "@/context/ViewModeContext";

export default function DashboardRouter() {
  // Fetch current logged-in user's profile to check their active role
  const { activeRole, isLoading: userLoading } = useViewMode();

  if (userLoading) {
    return (
      <div className="flex h-96 items-center justify-center bg-slate-50/50 min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-emerald-500" />
      </div>
    );
  }

  // Route to the appropriate dashboard component based on their active role
  switch (activeRole) {
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