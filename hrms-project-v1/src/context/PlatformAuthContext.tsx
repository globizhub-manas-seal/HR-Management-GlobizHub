"use client";

import React, { createContext, useContext, useState, useEffect, useCallback } from "react";
import { useRouter, usePathname } from "next/navigation";
import platformApi from "@/lib/platform-api";

export interface PlatformUser {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  role: "SUPER_ADMIN" | "PLATFORM_ADMIN" | "BILLING_ADMIN" | "SUPPORT_ADMIN" | "PLATFORM_ANALYST";
  isActive: boolean;
}

interface PlatformAuthContextType {
  user: PlatformUser | null;
  token: string | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  login: (token: string, user: PlatformUser) => void;
  logout: () => void;
  refreshProfile: () => Promise<void>;
}

const PlatformAuthContext = createContext<PlatformAuthContextType | undefined>(undefined);

export function PlatformAuthProvider({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const [user, setUser] = useState<PlatformUser | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const logout = useCallback(() => {
    if (typeof window !== "undefined") {
      localStorage.removeItem("platform_token");
      localStorage.removeItem("platform_user");
    }
    setUser(null);
    setToken(null);
    router.replace("/login");
  }, [router]);

  const refreshProfile = useCallback(async () => {
    const savedToken = typeof window !== "undefined" ? localStorage.getItem("platform_token") : null;
    if (!savedToken) {
      setUser(null);
      setToken(null);
      setIsLoading(false);
      return;
    }

    try {
      const res = await platformApi.get("/platform/auth/me");
      setUser(res.data);
      setToken(savedToken);
      if (typeof window !== "undefined") {
        localStorage.setItem("platform_user", JSON.stringify(res.data));
      }
    } catch (err: any) {
      if (err.response?.status === 401 || err.response?.status === 403) {
        logout();
      }
    } finally {
      setIsLoading(false);
    }
  }, [logout]);

  useEffect(() => {
    // Initial check from localStorage
    const savedToken = typeof window !== "undefined" ? localStorage.getItem("platform_token") : null;
    const savedUser = typeof window !== "undefined" ? localStorage.getItem("platform_user") : null;

    if (savedToken && savedUser) {
      try {
        setUser(JSON.parse(savedUser));
        setToken(savedToken);
      } catch {
        // invalid JSON
      }
    }

    if (savedToken) {
      refreshProfile();
    } else {
      setIsLoading(false);
    }
  }, [refreshProfile]);

  const login = (newToken: string, newUser: PlatformUser) => {
    if (typeof window !== "undefined") {
      localStorage.setItem("platform_token", newToken);
      localStorage.setItem("platform_user", JSON.stringify(newUser));
    }
    setToken(newToken);
    setUser(newUser);
    router.replace("/platform-admin/dashboard");
  };

  return (
    <PlatformAuthContext.Provider
      value={{
        user,
        token,
        isLoading,
        isAuthenticated: !!token && !!user,
        login,
        logout,
        refreshProfile,
      }}
    >
      {children}
    </PlatformAuthContext.Provider>
  );
}

export function usePlatformAuth() {
  const context = useContext(PlatformAuthContext);
  if (!context) {
    throw new Error("usePlatformAuth must be used within a PlatformAuthProvider");
  }
  return context;
}

