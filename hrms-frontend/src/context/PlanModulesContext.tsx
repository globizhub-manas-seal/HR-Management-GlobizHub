"use client";

import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";

/**
 * Plan-wise module gating for the workspace UI.
 *
 * Reads the effective module matrix for the tenant's plan
 * (GET /organization/subscription/modules) and exposes it to the sidebar
 * and pages, so modules not included in the plan are hidden and any direct
 * navigation shows an upgrade prompt instead of a dead 403.
 */

export interface PlanModuleState {
  key: string;
  enabled: boolean;
}

interface PlanModulesContextValue {
  loading: boolean;
  plan: { code: string; name: string; monthlyPrice: number; isPaid: boolean } | null;
  subscriptionStatus: string | null;
  freemiumEndsAt: string | null;
  freemiumActive: boolean;
  modules: PlanModuleState[];
  /** Is the module included in the tenant's plan? (defaults true while loading) */
  isEnabled: (moduleKey: string) => boolean;
  refresh: () => Promise<void>;
}

const PlanModulesContext = createContext<PlanModulesContextValue>({
  loading: true,
  plan: null,
  subscriptionStatus: null,
  freemiumEndsAt: null,
  freemiumActive: false,
  modules: [],
  isEnabled: () => true,
  refresh: async () => {},
});

export function PlanModulesProvider({ children }: { children: React.ReactNode }) {
  const [state, setState] = useState<Omit<PlanModulesContextValue, "isEnabled" | "refresh">>({
    loading: true,
    plan: null,
    subscriptionStatus: null,
    freemiumEndsAt: null,
    freemiumActive: false,
    modules: [],
  });

  const load = useCallback(async () => {
    try {
      const token =
        localStorage.getItem("hrms_token") || localStorage.getItem("token");
      if (!token) return;
      const res = await fetch("/organization/subscription/modules", {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) return;
      const d = await res.json();
      setState({
        loading: false,
        plan: d.plan ?? null,
        subscriptionStatus: d.subscriptionStatus ?? null,
        freemiumEndsAt: d.freemiumEndsAt ?? null,
        freemiumActive: Boolean(d.freemiumActive),
        modules: Array.isArray(d.modules) ? d.modules : [],
      });
    } catch {
      // On failure keep defaults (everything enabled) — the backend guard
      // remains the enforcement layer.
      setState((s) => ({ ...s, loading: false }));
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const isEnabled = useCallback(
    (moduleKey: string) => {
      if (state.modules.length === 0) return true;
      const m = state.modules.find((x) => x.key === moduleKey);
      return m ? m.enabled : true;
    },
    [state.modules],
  );

  const refresh = useCallback(async () => {
    await load();
  }, [load]);

  const value = useMemo(
    () => ({ ...state, isEnabled, refresh }),
    [state, isEnabled, refresh],
  );

  return (
    <PlanModulesContext.Provider value={value}>
      {children}
    </PlanModulesContext.Provider>
  );
}

export function usePlanModules() {
  return useContext(PlanModulesContext);
}
