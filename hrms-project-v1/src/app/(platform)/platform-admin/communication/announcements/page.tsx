"use client";

import { useState } from "react";
import { Megaphone, Plus, Sparkles, CheckCircle2, Clock, Globe } from "lucide-react";

export default function PlatformAnnouncementsPage() {
  const [broadcasts, setBroadcasts] = useState([
    {
      id: "bc-1",
      title: "Scheduled Neon PostgreSQL Maintenance Window",
      targetAudience: "All SaaS Organizations",
      priority: "CRITICAL",
      scheduledAt: "Nov 15, 2026 02:00 UTC",
      isPublished: true,
    },
    {
      id: "bc-2",
      title: "New Automated Dunning & Stripe Webhook Features Released",
      targetAudience: "Professional & Enterprise Tiers",
      priority: "NORMAL",
      scheduledAt: "Oct 28, 2026",
      isPublished: true,
    },
  ]);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold tracking-tight text-foreground">Platform Broadcast Announcements</h1>
            <span className="text-xs font-mono font-medium px-2 py-0.5 rounded-full bg-primary/15 text-primary border border-primary/25">
              Cross-Tenant Broadcasts
            </span>
          </div>
          <p className="text-sm text-muted-foreground mt-1">
            Publish maintenance alerts, release notes, and banner notifications across tenant workspaces.
          </p>
        </div>

        <button
          onClick={() => alert("Announcement creator")}
          className="flex items-center gap-2 px-4 py-2 text-xs font-medium bg-primary hover:bg-primary/90 text-primary-foreground rounded-lg transition-colors shadow-md shadow-xs"
        >
          <Plus className="h-4 w-4" />
          Create Broadcast
        </button>
      </div>

      <div className="space-y-3">
        {broadcasts.map((b) => (
          <div
            key={b.id}
            className="p-5 rounded-xl border border-border bg-card flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 shadow-lg hover:border-primary/40 transition-colors"
          >
            <div>
              <div className="flex items-center gap-2 mb-1.5">
                <span
                  className={`px-2 py-0.5 rounded text-[10px] font-semibold uppercase ${
                    b.priority === "CRITICAL"
                      ? "bg-destructive/15 text-destructive border border-destructive/25"
                      : "bg-primary/15 text-primary border border-primary/25"
                  }`}
                >
                  {b.priority}
                </span>
                <span className="text-xs text-muted-foreground font-medium flex items-center gap-1">
                  <Globe className="h-3 w-3 text-muted-foreground" />
                  {b.targetAudience}
                </span>
              </div>
              <h3 className="font-semibold text-foreground text-sm">{b.title}</h3>
            </div>

            <div className="flex items-center gap-3 text-xs text-muted-foreground font-mono">
              <span className="flex items-center gap-1.5 text-status-green">
                <CheckCircle2 className="h-3.5 w-3.5" />
                Active
              </span>
              <span>•</span>
              <span>{b.scheduledAt}</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

