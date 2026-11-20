/**
 * Sandbox / deployment gateway routing helper.
 *
 * - When NEXT_PUBLIC_API_URL is set (real deployments: Docker, Vercel, etc.),
 *   every request goes to that absolute base URL exactly as before.
 * - When it is empty/undefined (sandbox preview or same-origin deployments),
 *   requests are issued as RELATIVE paths and the gateway routes them to the
 *   backend port via the XTransformPort query parameter.
 */
export const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "";

export const BACKEND_PORT =
  process.env.NEXT_PUBLIC_BACKEND_PORT || "5000";

export function applyGatewayRouting(url: string): string {
  if (API_BASE_URL) return url; // absolute base configured — nothing to do
  // Insert the gateway port selector, preserving any existing query params
  const joiner = url.includes("?") ? "&" : "?";
  return `${url}${joiner}XTransformPort=${BACKEND_PORT}`;
}

/**
 * Build a gateway-routed absolute-or-relative URL for a backend path.
 * Works both with NEXT_PUBLIC_API_URL deployments and sandbox relative mode.
 */
export const gwUrl = (path: string) =>
  applyGatewayRouting(`${API_BASE_URL}${path}`);
