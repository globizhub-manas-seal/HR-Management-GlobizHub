"use client";

import { CheckCircle2, XCircle } from "lucide-react";
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
  const toast = useCallback((message: string, kind: ToastKind = "success") => {
    const id = Date.now();
    setToasts((current) => [...current, { id, message, kind }]);
    window.setTimeout(() => setToasts((current) => current.filter((item) => item.id !== id)), 5000);
  }, []);

  // Keeps existing feedback useful while screens progressively migrate from alert().
  useEffect(() => {
    const nativeAlert = window.alert;
    window.alert = (message?: string) => {
      const text = String(message ?? "");
      toast(text, /failed|error|unable|invalid/i.test(text) ? "error" : "success");
    };
    return () => { window.alert = nativeAlert; };
  }, [toast]);

  return <ToastContext.Provider value={{ toast }}>
    {children}
    <div className="fixed right-4 top-4 z-[100] flex w-[min(24rem,calc(100vw-2rem))] flex-col gap-2" aria-live="polite" aria-atomic="true">
      {toasts.map((item) => <div key={item.id} role="status" className={`flex items-start gap-3 rounded-xl border p-4 shadow-lg ${item.kind === "error" ? "border-destructive/30 bg-card text-foreground" : "border-primary/40 bg-card text-foreground"}`}>
        {item.kind === "error" ? <XCircle className="mt-0.5 size-5 shrink-0 text-destructive" /> : <CheckCircle2 className="mt-0.5 size-5 shrink-0 text-emerald-600" />}
        <p className="text-sm font-medium">{item.message}</p>
      </div>)}
    </div>
  </ToastContext.Provider>;
}
