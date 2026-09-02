"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Sidebar from "@/components/Sidebar";
import Header from "@/components/Header";
import { Loader2 } from "lucide-react";
import { useViewMode } from "@/context/ViewModeContext";

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const { user, activeRole, isLoading } = useViewMode();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (mounted && !isLoading) {
      const token = typeof window !== "undefined" ? localStorage.getItem("hrms_token") : null;
      if (!token || !user) {
        router.replace("/login");
      }
    }
  }, [mounted, isLoading, user, router]);

  if (!mounted || isLoading || !user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="flex h-screen bg-background overflow-hidden">
      {/* Pass the role dynamically to the Sidebar */}
      {/* Keep the full sidebar for large desktops only. Smaller screens use
          the hamburger-triggered drawer in the header. */}
      <Sidebar role={activeRole} className="hidden lg:flex" />

      <div className="flex flex-col flex-1 h-full overflow-hidden">
        <Header />
        <main className="flex-1 overflow-y-auto bg-background">
          {children}
        </main>
      </div>
    </div>
  );
}

