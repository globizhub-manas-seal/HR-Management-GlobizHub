import type { NextConfig } from "next";

import path from "path";

// Same-origin backend proxy (development / sandbox). When NEXT_PUBLIC_API_URL
// is unset, the frontend issues relative API calls; this rewrite forwards them
// to the NestJS backend so the app works behind any single-port gateway.
// Production deployments set NEXT_PUBLIC_API_URL and are unaffected.
const BACKEND_ORIGIN = process.env.BACKEND_ORIGIN || "http://127.0.0.1:5000";
const USE_PROXY = !process.env.NEXT_PUBLIC_API_URL;

const BACKEND_PREFIXES = [
  "auth",
  "employees",
  "attendance",
  "leaves",
  "leave",
  "payroll",
  "recruitment",
  "documents",
  "tasks",
  "notifications",
  "audit",
  "settings",
  "onboarding",
  "credentials",
  "training",
  "organization",
  "resignation",
  "shift-swaps",
  "schedules",
  "announcements",
  "platform",
  "uploads",
  "support",
  "india",
];

const nextConfig: NextConfig = {
  turbopack: {
    root: path.resolve(__dirname),
  },
  images: {
    // Ship pre-compressed assets as-is: zero sharp buffer usage server-side
    // (lower, flatter RSS) and no on-the-fly re-encodes per request.
    unoptimized: true,
  },
  trailingSlash: false,
  reactStrictMode: false,
  // Memory/bundle hygiene in production builds:
  poweredByHeader: false,
  productionBrowserSourceMaps: false,
  compiler: {
    // Strip console.* (except error/warn) from the CLIENT bundle -> smaller
    // JS, fewer retained string objects in the browser heap.
    removeConsole:
      process.env.NODE_ENV === 'production'
        ? { exclude: ['error', 'warn'] }
        : false,
  },
  typescript: {
    ignoreBuildErrors: true,
  },
  ...(USE_PROXY
    ? {
        rewrites: async () => [
          ...BACKEND_PREFIXES.map((p) => ({
            source: `/${p}`,
            destination: `${BACKEND_ORIGIN}/${p}`,
          })),
          ...BACKEND_PREFIXES.map((p) => ({
            source: `/${p}/:path*`,
            destination: `${BACKEND_ORIGIN}/${p}/:path*`,
          })),
        ],
      }
    : {}),
};

export default nextConfig;
