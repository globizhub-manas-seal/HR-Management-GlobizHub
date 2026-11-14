"use client";

import React, { createContext, useContext, useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { authApi } from "@/lib/api";

interface ViewModeContextType {
  isViewAsUser: boolean;
  setIsViewAsUser: (value: boolean) => void;
  user: any;
  isLoading: boolean;
  activeRole: string | undefined;
}

const ViewModeContext = createContext<ViewModeContextType | undefined>(undefined);

export function ViewModeProvider({ children }: { children: React.ReactNode }) {
  const [isViewAsUser, setIsViewAsUser] = useState<boolean>(() => {
    if (typeof window !== "undefined") {
      return localStorage.getItem("view_as_user") === "true";
    }
    return false;
  });

  const { data: user, isLoading } = useQuery({
    queryKey: ["userProfileBase"],
    queryFn: async () => {
      if (typeof window === "undefined") return null;
      if (window.location.pathname.startsWith("/platform-admin")) return null;
      try {
        return await authApi.getMe();
      } catch {
        return null;
      }
    },
    enabled:
      typeof window !== "undefined" &&
      !window.location.pathname.startsWith("/platform-admin") &&
      Boolean(localStorage.getItem("hrms_token")),
    retry: 1,
    staleTime: 5 * 60 * 1000,
  });

  useEffect(() => {
    if (typeof window !== "undefined") {
      localStorage.setItem("view_as_user", isViewAsUser ? "true" : "false");
    }
  }, [isViewAsUser]);

  const isManager = user?.role === "MANAGER";
  const activeRole = isManager && isViewAsUser ? "EMPLOYEE" : user?.role;

  return (
    <ViewModeContext.Provider
      value={{
        isViewAsUser: isManager ? isViewAsUser : false,
        setIsViewAsUser,
        user,
        isLoading,
        activeRole,
      }}
    >
      {children}
    </ViewModeContext.Provider>
  );
}

export function useViewMode() {
  const context = useContext(ViewModeContext);
  if (!context) {
    throw new Error("useViewMode must be used within a ViewModeProvider");
  }
  return context;
}
