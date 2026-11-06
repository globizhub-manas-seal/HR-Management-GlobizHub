"use client";

// src/components/providers.tsx

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { useState } from "react";
import { ViewModeProvider } from "@/context/ViewModeContext";
import { PermissionProvider } from "@/context/PermissionContext";
import { ThemeProvider } from "@/context/ThemeContext";
import { ToastProvider } from "@/components/ToastProvider";

export default function Providers({ children }: { children: React.ReactNode }) {
  // Configured with smart caching defaults to reduce redundant API calls across the entire app
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            staleTime: 3 * 60 * 1000, // 3 minutes fresh cache
            gcTime: 10 * 60 * 1000, // 10 minutes cache retention
            refetchOnWindowFocus: false, // Prevents spamming backend on tab switches
            retry: 1, // Avoid infinite retry loops on failure
          },
        },
      })
  );

  return (
    <QueryClientProvider client={queryClient}>
      <ToastProvider>
        <ThemeProvider>
          <ViewModeProvider>
            <PermissionProvider>{children}</PermissionProvider>
          </ViewModeProvider>
        </ThemeProvider>
      </ToastProvider>
    </QueryClientProvider>
  );
}
