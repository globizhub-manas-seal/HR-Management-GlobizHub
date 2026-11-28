import axios from "axios";
import { applyGatewayRouting } from "./gateway";

// Dedicated Axios instance for SaaS Platform Administration APIs
const platformApi = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL || "",
});

// Strictly isolated token storage: platform_token (never conflated with tenant hrms_token)
platformApi.interceptors.request.use((config) => {
  if (typeof window !== "undefined") {
    const token = localStorage.getItem("platform_token");
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
  }
  // Sandbox/same-origin gateway routing (no-op when NEXT_PUBLIC_API_URL is set)
  if (config.url) {
    config.url = applyGatewayRouting(config.url);
  }
  return config;
});

// Handle unauthorized responses by redirecting specifically to platform login
platformApi.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401 && typeof window !== "undefined") {
      localStorage.removeItem("platform_token");
      localStorage.removeItem("platform_user");
      if (!window.location.pathname.startsWith("/login")) {
        window.location.href = "/login";
      }
    }
    return Promise.reject(error);
  }
);

export { platformApi };
export default platformApi;

