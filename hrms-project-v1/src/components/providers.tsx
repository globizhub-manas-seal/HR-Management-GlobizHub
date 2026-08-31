// src/components/providers.tsx
"use client";

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { useState } from "react";
import { ViewModeProvider } from "@/context/ViewModeContext";
import { PermissionProvider } from "@/context/PermissionContext";
import { ThemeProvider } from "@/context/ThemeContext";

export default function Providers({ children }: { children: React.ReactNode }) {
  // We use useState to ensure the QueryClient is only created once per session
  const [queryClient] = useState(() => new QueryClient());

  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider>
        <ViewModeProvider>
          <PermissionProvider>
            {children}
          </PermissionProvider>
        </ViewModeProvider>
      </ThemeProvider>
    </QueryClientProvider>
  );
}
