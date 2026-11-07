"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { usePlatformAuth } from "@/context/PlatformAuthContext";
import platformApi from "@/lib/platform-api";
import { ShieldCheck, Lock, Mail, Loader2, ArrowRight, Sparkles, AlertCircle } from "lucide-react";

export default function PlatformLoginPage() {
  const router = useRouter();
  const { login } = usePlatformAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsLoading(true);

    try {
      const res = await platformApi.post("/platform/auth/login", {
        email: email.trim().toLowerCase(),
        password,
      });

      if (res.data.portal === "WORKSPACE") {
        localStorage.setItem("hrms_token", res.data.access_token);
        window.location.href = res.data.targetUrl || "/workspace/dashboard";
      } else {
        login(res.data.access_token, res.data.user);
      }
    } catch (err: any) {
      const message =
        err.response?.data?.message ||
        "Authentication failed. Please verify your administrator credentials.";
      setError(Array.isArray(message) ? message.join(", ") : message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleFillDefaultAdmin = () => {
    setEmail("superadmin@teamhub.saas");
    setPassword("SuperAdmin@TeamHub2026!");
    setError(null);
  };

  return (
    <div className="min-h-screen w-full flex items-center justify-center bg-background p-4 text-foreground">
      <div className="w-full max-w-md">
        {/* Header Branding */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center size-14 rounded-2xl bg-gradient-to-br from-amber-400 to-[#E5B232] text-slate-950 shadow-md border border-amber-500/30 mb-4">
            <Sparkles className="size-7 text-slate-950" />
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground">TeamHub HRMS</h1>
          <p className="text-xs font-bold uppercase tracking-widest text-primary mt-1">
            Platform SaaS Control Center
          </p>
          <p className="text-sm text-muted-foreground mt-2">
            Centralized platform management, billing, and tenant administration.
          </p>
        </div>

        {/* Card Form */}
        <div className="bg-card border border-border rounded-2xl shadow-xl p-8">
          {error && (
            <div className="mb-6 p-3.5 rounded-xl bg-destructive/15 border border-destructive/25 flex items-start gap-3 text-destructive text-xs">
              <AlertCircle className="size-4 shrink-0 mt-0.5 text-destructive" />
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-medium text-foreground mb-1.5">
                Platform Administrator Email
              </label>
              <div className="relative">
                <Mail className="absolute left-3.5 top-3 size-4 text-muted-foreground" />
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="admin@teamhub.saas"
                  className="w-full pl-10 pr-4 py-2.5 bg-background border border-border rounded-xl text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary transition-all shadow-xs"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-medium text-foreground mb-1.5">
                Security Password
              </label>
              <div className="relative">
                <Lock className="absolute left-3.5 top-3 size-4 text-muted-foreground" />
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••••••"
                  className="w-full pl-10 pr-4 py-2.5 bg-background border border-border rounded-xl text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary transition-all shadow-xs"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full mt-2 py-3 px-4 rounded-xl bg-primary hover:bg-primary/90 text-primary-foreground font-semibold text-sm shadow-xs flex items-center justify-center gap-2 transition-all disabled:opacity-50 cursor-pointer"
            >
              {isLoading ? (
                <>
                  <Loader2 className="size-4 animate-spin" />
                  <span>Verifying Credentials...</span>
                </>
              ) : (
                <>
                  <span>Sign In to Platform Admin</span>
                  <ArrowRight className="size-4" />
                </>
              )}
            </button>
          </form>

          {/* Quick Credential Autofill Helper for convenience */}
          <div className="mt-6 pt-6 border-t border-border text-center">
            <p className="text-xs text-muted-foreground mb-2">Default Seeded Super Admin:</p>
            <button
              type="button"
              onClick={handleFillDefaultAdmin}
              className="inline-flex items-center gap-1.5 text-xs text-foreground font-mono bg-primary/10 hover:bg-primary/20 px-3 py-1.5 rounded-lg border border-primary/20 hover:border-primary/40 transition-colors cursor-pointer"
            >
              <Sparkles className="size-3 text-primary" />
              <span>Autofill Super Admin Credentials</span>
            </button>
          </div>
        </div>

        {/* Tenant Login Link */}
        <div className="text-center mt-6">
          <a
            href="/login"
            className="text-xs text-muted-foreground hover:text-foreground underline decoration-border underline-offset-4"
          >
            Looking for company employee or HR login? Go to Tenant Portal &rarr;
          </a>
        </div>
      </div>
    </div>
  );
}

