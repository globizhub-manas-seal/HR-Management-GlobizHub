"use client";

import { useState } from "react";
import platformApi from "@/lib/platform-api";
import {
  ShieldAlert,
  Clock,
  FileText,
  Loader2,
  ExternalLink,
  CheckCircle2,
  X,
  AlertTriangle,
} from "lucide-react";

interface ControlledAccessModalProps {
  isOpen: boolean;
  onClose: () => void;
  organizationId: string;
  organizationName: string;
}

export function ControlledAccessModal({
  isOpen,
  onClose,
  organizationId,
  organizationName,
}: ControlledAccessModalProps) {
  const [reason, setReason] = useState("");
  const [durationMinutes, setDurationMinutes] = useState(60);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [sessionResult, setSessionResult] = useState<{
    diagnosticToken: string;
    expiresAt: string;
    targetWorkspaceUrl: string;
  } | null>(null);

  if (!isOpen) return null;

  const handleStartSession = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!reason.trim()) {
      setError("A clear troubleshooting reason or customer ticket reference is required.");
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const res = await platformApi.post(
        `/platform/organizations/${organizationId}/access-session`,
        {
          reason: reason.trim(),
          durationMinutes: Number(durationMinutes),
        }
      );
      setSessionResult(res.data);
    } catch (err: any) {
      setError(
        err.response?.data?.message || "Failed to initiate controlled diagnostic session."
      );
    } finally {
      setIsLoading(false);
    }
  };

  const handleOpenWorkspace = () => {
    if (!sessionResult) return;
    // Open in new tab and store temporary diagnostic session token
    const newWindow = window.open("/workspace/dashboard", "_blank");
    if (newWindow) {
      // Diagnostic token can be injected or saved in session storage
      sessionStorage.setItem("diagnostic_token", sessionResult.diagnosticToken);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
      <div className="w-full max-w-lg bg-card border border-border rounded-2xl shadow-2xl p-6 text-foreground relative">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-1 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted transition-colors cursor-pointer"
        >
          <X className="size-5" />
        </button>

        <div className="flex items-center gap-3 mb-4">
          <div className="size-10 rounded-xl bg-status-orange/15 border border-status-orange/25 flex items-center justify-center text-status-orange">
            <ShieldAlert className="size-5" />
          </div>
          <div>
            <h3 className="text-base font-bold text-foreground">Controlled Diagnostic Access</h3>
            <p className="text-xs text-muted-foreground">Target Tenant: {organizationName}</p>
          </div>
        </div>

        {!sessionResult ? (
          <form onSubmit={handleStartSession} className="space-y-4">
            <div className="p-3 rounded-xl bg-status-orange/15 border border-status-orange/25 text-xs text-foreground leading-relaxed flex items-start gap-2.5">
              <AlertTriangle className="size-4 shrink-0 mt-0.5 text-status-orange" />
              <div>
                <strong>Privileged Operation:</strong> All actions performed during this support session will be logged in the immutable Platform Audit Trail with your identity, IP, and reason.
              </div>
            </div>

            {error && (
              <div className="p-3 rounded-xl bg-destructive/15 border border-destructive/25 text-xs text-destructive">
                {error}
              </div>
            )}

            <div>
              <label className="block text-xs font-semibold text-foreground mb-1">
                Troubleshooting Reason / Ticket Reference *
              </label>
              <textarea
                required
                rows={3}
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                placeholder="e.g. Investigating attendance clock-in geolocation disparity for ticket #TCK-1049"
                className="w-full px-3 py-2 bg-background border border-border rounded-xl text-xs text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-foreground mb-1">
                Access Duration Window
              </label>
              <select
                value={durationMinutes}
                onChange={(e) => setDurationMinutes(Number(e.target.value))}
                className="w-full px-3 py-2 bg-background border border-border rounded-xl text-xs text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
              >
                <option value={15}>15 Minutes</option>
                <option value={30}>30 Minutes</option>
                <option value={60}>1 Hour (Recommended)</option>
                <option value={120}>2 Hours</option>
              </select>
            </div>

            <div className="pt-2 flex items-center justify-end gap-2">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 rounded-xl text-xs font-medium text-muted-foreground hover:text-foreground hover:bg-muted transition-colors cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isLoading}
                className="px-4 py-2 rounded-xl bg-primary hover:bg-primary/90 text-primary-foreground text-xs font-semibold flex items-center gap-2 transition-colors disabled:opacity-50 cursor-pointer shadow-xs"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="size-3.5 animate-spin" />
                    <span>Authorizing...</span>
                  </>
                ) : (
                  <>
                    <ShieldAlert className="size-3.5" />
                    <span>Authorize Support Session</span>
                  </>
                )}
              </button>
            </div>
          </form>
        ) : (
          <div className="space-y-4 py-2">
            <div className="p-4 rounded-xl bg-status-green/15 border border-status-green/25 text-foreground flex items-center gap-3 text-xs">
              <CheckCircle2 className="size-5 shrink-0 text-status-green" />
              <div>
                <p className="font-semibold text-sm text-foreground">Diagnostic Session Authorized</p>
                <p className="text-muted-foreground text-xs mt-0.5">
                  Valid until {new Date(sessionResult.expiresAt).toLocaleTimeString()}
                </p>
              </div>
            </div>

            <p className="text-xs text-muted-foreground">
              Your support diagnostic token has been issued and registered in the Platform Audit Trail. Sensitive employee bank numbers remain masked.
            </p>

            <div className="pt-3 flex items-center justify-end gap-2">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 rounded-xl text-xs font-medium text-muted-foreground hover:text-foreground hover:bg-muted transition-colors cursor-pointer"
              >
                Done
              </button>
              <button
                type="button"
                onClick={handleOpenWorkspace}
                className="px-4 py-2 rounded-xl bg-primary hover:bg-primary/90 text-primary-foreground text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer shadow-xs"
              >
                <span>Launch Tenant Inspection</span>
                <ExternalLink className="size-3.5" />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

