"use client";

import { useEffect, useState } from "react";
import { useRouter, usePathname } from "next/navigation";
import { PlatformAuthProvider, usePlatformAuth } from "@/context/PlatformAuthContext";
import { PlatformSidebar } from "@/components/platform/PlatformSidebar";
import { PlatformHeader } from "@/components/platform/PlatformHeader";
import { Loader2 } from "lucide-react";

function PlatformAdminShell({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const { user, isAuthenticated, isLoading } = usePlatformAuth();
  const [mounted, setMounted] = useState(false);

  const isLoginPage = pathname === "/platform-admin/login";

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (mounted && !isLoading && !isAuthenticated && !isLoginPage) {
      router.replace("/platform-admin/login");
    }
  }, [mounted, isLoading, isAuthenticated, isLoginPage, router]);

  if (!mounted || (isLoading && !isLoginPage)) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background text-foreground">
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <p className="text-xs text-muted-foreground font-medium">Loading SaaS Platform Control Center...</p>
        </div>
      </div>
    );
  }

  if (isLoginPage) {
    return <>{children}</>;
  }

  if (!isAuthenticated && !isLoginPage) {
    return null;
  }

  return (
    <div className="flex h-screen bg-background text-foreground overflow-hidden font-sans">
      {/* 01 to 09 Navigation Sidebar */}
      <PlatformSidebar />

      {/* Main Content Area */}
      <div className="flex flex-col flex-1 h-full min-w-0 overflow-hidden">
        <PlatformHeader />
        <main className="flex-1 overflow-y-auto bg-background p-6">
          {children}
        </main>
      </div>
    </div>
  );
}

export default function PlatformLayout({ children }: { children: React.ReactNode }) {
  return (
    <PlatformAuthProvider>
      <PlatformAdminShell>{children}</PlatformAdminShell>
    </PlatformAuthProvider>
  );
}

