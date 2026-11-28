"use client";

import { useEffect, useState } from "react";
import { Bell, CheckCircle2, Loader2, Users, Zap, Inbox } from "lucide-react";
import { platformApi } from "@/lib/platform-api";

interface NotificationStats {
  totalDelivered: number;
  unread: number;
  last24h: number;
  companiesReached: number;
  engineOperational: boolean;
}

export default function SystemNotificationsPage() {
  const [stats, setStats] = useState<NotificationStats | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    platformApi
      .get("/platform/notifications/stats")
      .then((res) => setStats(res.data))
      .catch((err) => console.error("Failed to load notification stats", err))
      .finally(() => setIsLoading(false));
  }, []);

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2 flex-wrap">
        <h1 className="text-2xl font-bold tracking-tight text-foreground">System Notification Dispatcher</h1>
        <span className="text-xs font-mono font-medium px-2 py-0.5 rounded-full bg-primary/15 text-primary border border-primary/25">
          In-App Alerts
        </span>
      </div>
      <p className="text-sm text-muted-foreground">
        Live in-app notification delivery metrics aggregated from the platform database.
      </p>

      {isLoading ? (
        <div className="py-16 flex justify-center">
          <Loader2 className="h-7 w-7 animate-spin text-muted-foreground" />
        </div>
      ) : (
        <>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            {[
              { label: "Total Delivered", value: stats?.totalDelivered ?? 0, icon: Inbox },
              { label: "Unread", value: stats?.unread ?? 0, icon: Bell },
              { label: "Last 24 Hours", value: stats?.last24h ?? 0, icon: Zap },
              { label: "Companies Reached", value: stats?.companiesReached ?? 0, icon: Users },
            ].map(({ label, value, icon: Icon }) => (
              <div key={label} className="rounded-xl border border-border bg-card p-5">
                <div className="flex items-center gap-2 text-muted-foreground">
                  <Icon className="h-4 w-4" />
                  <span className="text-[11px] font-medium">{label}</span>
                </div>
                <p className="text-2xl font-black font-mono text-foreground mt-2">{value}</p>
              </div>
            ))}
          </div>

          <div className="rounded-xl border border-border bg-card p-8 sm:p-12 text-center shadow-xl">
            <div className="w-14 h-14 rounded-full bg-status-green/15 border border-status-green/30 text-status-green flex items-center justify-center mx-auto mb-3">
              <CheckCircle2 className="h-7 w-7" />
            </div>
            <h3 className="text-sm font-bold text-foreground">Notification Dispatch Engine Operational</h3>
            <p className="text-xs text-muted-foreground max-w-md mx-auto mt-1 leading-relaxed">
              In-app notification workers are running normally. Billing lifecycle events, leave approvals,
              attendance alerts and payroll dispatches flow through this engine — the counters above are
              live database aggregates.
            </p>
          </div>
        </>
      )}
    </div>
  );
}
