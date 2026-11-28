"use client";

import { useEffect, useState } from "react";

export interface PublicPlatformConfig {
  currency: string;
  pricePerUserPerMonth: number;
  freemiumMaxUsers: number;
  freemiumMonths: number;
  contractMonths: number;
  gstPercent: number;
  annualPerUser: number;
  annualPerUserWithGst: number;
}

export const PUBLIC_CONFIG_FALLBACK: PublicPlatformConfig = {
  currency: "INR",
  pricePerUserPerMonth: 49,
  freemiumMaxUsers: 5,
  freemiumMonths: 3,
  contractMonths: 12,
  gstPercent: 18,
  annualPerUser: 588,
  annualPerUserWithGst: 693.84,
};

/**
 * Live, super-admin-controlled pricing/limits for public pages
 * (GET /platform/public/config). Falls back to sane defaults if the API is
 * unreachable, so marketing pages always render.
 */
export function usePublicConfig(): PublicPlatformConfig {
  const [cfg, setCfg] = useState<PublicPlatformConfig>(PUBLIC_CONFIG_FALLBACK);

  useEffect(() => {
    let alive = true;
    fetch("/platform/public/config")
      .then((r) => (r.ok ? r.json() : Promise.reject()))
      .then((d) => {
        if (alive && d && typeof d.pricePerUserPerMonth !== "undefined") {
          setCfg({ ...PUBLIC_CONFIG_FALLBACK, ...d });
        }
      })
      .catch(() => {});
    return () => {
      alive = false;
    };
  }, []);

  return cfg;
}
