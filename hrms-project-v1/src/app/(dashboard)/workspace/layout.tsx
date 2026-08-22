"use client";

import Sidebar from "@/components/Sidebar";
import Header from "@/components/Header";
import { Loader2 } from "lucide-react";
import { useViewMode } from "@/context/ViewModeContext";

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  // Fetch active role from ViewModeContext
  const { activeRole, isLoading } = useViewMode();

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <Loader2 className="h-8 w-8 animate-spin text-emerald-500" />
      </div>
    );
  }

  return (
    <div className="flex h-screen bg-slate-50 overflow-hidden">
      {/* Pass the role dynamically to the Sidebar */}
      {/* Keep the full sidebar for large desktops only. Smaller screens use
          the hamburger-triggered drawer in the header. */}
      <Sidebar role={activeRole} className="hidden lg:flex" />

      <div className="flex flex-col flex-1 h-full overflow-hidden">
        <Header />
        <main className="flex-1 overflow-y-auto bg-slate-50">
          {children}
        </main>
      </div>
    </div>
  );
}

