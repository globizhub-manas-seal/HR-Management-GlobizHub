"use client";

import { CheckCircle2, AlertCircle, X } from "lucide-react";
import { createContext, useCallback, useContext, useEffect, useState } from "react";

type ToastKind = "success" | "error";
type Toast = { id: number; message: string; kind: ToastKind };
type ToastContextValue = { toast: (message: string, kind?: ToastKind) => void };
const ToastContext = createContext<ToastContextValue | null>(null);

export function useToast() {
  const context = useContext(ToastContext);
  if (!context) throw new Error("useToast must be used within ToastProvider");
  return context;
}

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const dismiss = useCallback((id: number) => {
    setToasts((current) => current.filter((item) => item.id !== id));
  }, []);

  const toast = useCallback((message: string, kind: ToastKind = "success") => {
    const id = Date.now();
    setToasts((current) => [...current, { id, message, kind }]);
    window.setTimeout(() => dismiss(id), 6000);
  }, [dismiss]);

  // Keeps existing feedback useful while screens progressively migrate from alert()
  useEffect(() => {
    const nativeAlert = window.alert;
    window.alert = (message?: string) => {
      const text = String(message ?? "");
      toast(text, /failed|error|unable|invalid|not found/i.test(text) ? "error" : "success");
    };
    return () => { window.alert = nativeAlert; };
  }, [toast]);

  return (
    <ToastContext.Provider value={{ toast }}>
      {children}
      {/* Top-center solid floating pill (No truncation, crystal-clear readability) */}
      <div
        className="fixed top-4 left-1/2 -translate-x-1/2 z-[100] flex flex-col items-center gap-2 pointer-events-none w-full max-w-2xl px-4"
        aria-live="polite"
        aria-atomic="true"
      >
        {toasts.map((item) => (
          <div
            key={item.id}
            role="status"
            className="pointer-events-auto flex items-start gap-3 px-4 py-3 rounded-2xl bg-white/95 dark:bg-zinc-900/95 backdrop-blur-md border border-slate-200 dark:border-zinc-700 shadow-[0_10px_30px_rgba(0,0,0,0.15)] text-foreground animate-in fade-in-0 slide-in-from-top-3 duration-200 max-w-full"
          >
            {item.kind === "error" ? (
              <AlertCircle className="size-5 shrink-0 text-rose-500 mt-0.5" />
            ) : (
              <CheckCircle2 className="size-5 shrink-0 text-emerald-500 mt-0.5" />
            )}
            <p className="text-[13px] font-medium tracking-tight whitespace-normal break-words text-left leading-snug flex-1">
              {item.message}
            </p>
            <button
              type="button"
              onClick={() => dismiss(item.id)}
              className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 p-0.5 rounded-md transition-colors shrink-0"
              aria-label="Dismiss notification"
            >
              <X className="size-4" />
            </button>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}
