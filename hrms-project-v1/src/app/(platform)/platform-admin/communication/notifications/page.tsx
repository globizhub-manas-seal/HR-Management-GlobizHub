"use client";

import { Bell, CheckCircle2 } from "lucide-react";

export default function SystemNotificationsPage() {
  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2">
        <h1 className="text-2xl font-bold tracking-tight text-foreground">System Notification Dispatcher</h1>
        <span className="text-xs font-mono font-medium px-2 py-0.5 rounded-full bg-primary/15 text-primary border border-primary/25">
          In-App Alerts
        </span>
      </div>
      <p className="text-sm text-muted-foreground">
        Review real-time transactional alert queues, delivery success rates, and customer push delivery logs.
      </p>

      <div className="rounded-xl border border-border bg-card p-12 text-center shadow-xl">
        <Bell className="h-10 w-10 text-primary mx-auto mb-3" />
        <h3 className="text-sm font-bold text-foreground">Notification Dispatch Engine Operational</h3>
        <p className="text-xs text-muted-foreground max-w-md mx-auto mt-1 leading-relaxed">
          In-app WebSocket gateways and email notification workers are running normally. 0 pending alerts in queue.
        </p>
      </div>
    </div>
  );
}

