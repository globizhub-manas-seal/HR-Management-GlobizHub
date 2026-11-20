"use client";

import { useCallback, useEffect, useState } from "react";
import {
  Megaphone,
  Plus,
  CheckCircle2,
  Globe,
  X,
  Loader2,
  Trash2,
  AlertTriangle,
} from "lucide-react";
import { platformApi } from "@/lib/platform-api";

interface Announcement {
  id: string;
  title: string;
  body: string;
  severity: "INFO" | "WARNING" | "CRITICAL";
  audience: "ALL" | "ADMINS";
  isActive: boolean;
  createdBy: string | null;
  createdAt: string;
}

export default function PlatformAnnouncementsPage() {
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [createOpen, setCreateOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [form, setForm] = useState({
    title: "",
    body: "",
    severity: "INFO" as Announcement["severity"],
    audience: "ALL" as Announcement["audience"],
  });

  const fetchAnnouncements = useCallback(async () => {
    setIsLoading(true);
    try {
      const res = await platformApi.get("/platform/announcements");
      setAnnouncements(res.data?.data || []);
    } catch (err) {
      console.error("Failed to load announcements", err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchAnnouncements();
  }, [fetchAnnouncements]);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      await platformApi.post("/platform/announcements", form);
      setCreateOpen(false);
      setForm({ title: "", body: "", severity: "INFO", audience: "ALL" });
      await fetchAnnouncements();
    } catch (err: any) {
      console.error("Failed to create announcement", err);
      alert(err?.response?.data?.message || "Failed to create announcement.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Delete this announcement permanently?")) return;
    try {
      await platformApi.delete(`/platform/announcements/${id}`);
      await fetchAnnouncements();
    } catch (err) {
      console.error("Failed to delete announcement", err);
      alert("Failed to delete announcement.");
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 flex-wrap">
            <h1 className="text-2xl font-bold tracking-tight text-foreground">
              Platform Broadcast Announcements
            </h1>
            <span className="text-xs font-mono font-medium px-2 py-0.5 rounded-full bg-primary/15 text-primary border border-primary/25">
              Cross-Tenant
            </span>
          </div>
          <p className="text-sm text-muted-foreground mt-1">
            Publish maintenance alerts, release notes, and banner notifications across tenant workspaces.
          </p>
        </div>

        <button
          onClick={() => setCreateOpen(true)}
          className="flex items-center gap-2 px-4 py-2 text-xs font-medium bg-primary hover:bg-primary/90 text-primary-foreground rounded-lg transition-colors shadow-md shadow-xs"
        >
          <Plus className="h-4 w-4" />
          Create Broadcast
        </button>
      </div>

      {isLoading ? (
        <div className="py-16 flex justify-center">
          <Loader2 className="h-7 w-7 animate-spin text-muted-foreground" />
        </div>
      ) : announcements.length === 0 ? (
        <div className="p-10 text-center rounded-2xl border border-dashed border-border bg-card">
          <Megaphone className="h-8 w-8 text-muted-foreground mx-auto mb-2" />
          <p className="text-sm text-muted-foreground">
            No announcements published yet. Create your first cross-tenant broadcast.
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {announcements.map((b) => (
            <div
              key={b.id}
              className="p-5 rounded-xl border border-border bg-card flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 shadow-lg hover:border-primary/40 transition-colors"
            >
              <div className="min-w-0">
                <div className="flex items-center gap-2 mb-1.5 flex-wrap">
                  <span
                    className={`px-2 py-0.5 rounded text-[10px] font-semibold uppercase ${
                      b.severity === "CRITICAL"
                        ? "bg-destructive/15 text-destructive border border-destructive/25"
                        : b.severity === "WARNING"
                        ? "bg-status-yellow/15 text-status-yellow border border-status-yellow/25"
                        : "bg-primary/15 text-primary border border-primary/25"
                    }`}
                  >
                    {b.severity}
                  </span>
                  <span className="text-xs text-muted-foreground font-medium flex items-center gap-1">
                    <Globe className="h-3 w-3 text-muted-foreground" />
                    {b.audience === "ADMINS" ? "Org Admins only" : "All SaaS Organizations"}
                  </span>
                </div>
                <h3 className="font-semibold text-foreground text-sm">{b.title}</h3>
                <p className="text-xs text-muted-foreground mt-1 max-w-2xl">{b.body}</p>
              </div>

              <div className="flex items-center gap-3 text-xs text-muted-foreground font-mono shrink-0">
                <span className="flex items-center gap-1.5 text-status-green">
                  <CheckCircle2 className="h-3.5 w-3.5" />
                  {b.isActive ? "Active" : "Archived"}
                </span>
                <span>•</span>
                <span>{new Date(b.createdAt).toLocaleDateString()}</span>
                <button
                  onClick={() => handleDelete(b.id)}
                  className="p-1.5 rounded-lg text-muted-foreground hover:text-destructive hover:bg-destructive/10"
                  title="Delete announcement"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Create modal */}
      {createOpen && (
        <div className="fixed inset-0 z-50 bg-background/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="w-full max-w-md rounded-2xl bg-card border border-border p-6 shadow-2xl relative">
            <button
              onClick={() => setCreateOpen(false)}
              className="absolute right-4 top-4 p-2 rounded-lg text-muted-foreground hover:text-foreground"
            >
              <X className="h-4 w-4" />
            </button>
            <h3 className="text-base font-bold text-foreground mb-4 flex items-center gap-2">
              <Megaphone className="h-4 w-4 text-primary" />
              New Broadcast Announcement
            </h3>
            <form onSubmit={handleCreate} className="space-y-3 text-xs">
              <div>
                <label className="block text-foreground font-medium mb-1">Title</label>
                <input
                  required
                  value={form.title}
                  onChange={(e) => setForm({ ...form, title: e.target.value })}
                  placeholder="Scheduled maintenance window"
                  className="w-full px-3 py-2 rounded-lg bg-card border border-border text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
                />
              </div>
              <div>
                <label className="block text-foreground font-medium mb-1">Message</label>
                <textarea
                  required
                  rows={4}
                  value={form.body}
                  onChange={(e) => setForm({ ...form, body: e.target.value })}
                  placeholder="Describe the announcement for organization admins…"
                  className="w-full px-3 py-2 rounded-lg bg-card border border-border text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-foreground font-medium mb-1">Severity</label>
                  <select
                    value={form.severity}
                    onChange={(e) =>
                      setForm({ ...form, severity: e.target.value as Announcement["severity"] })
                    }
                    className="w-full px-3 py-2 rounded-lg bg-card border border-border text-foreground"
                  >
                    <option value="INFO">Info</option>
                    <option value="WARNING">Warning</option>
                    <option value="CRITICAL">Critical</option>
                  </select>
                </div>
                <div>
                  <label className="block text-foreground font-medium mb-1">Audience</label>
                  <select
                    value={form.audience}
                    onChange={(e) =>
                      setForm({ ...form, audience: e.target.value as Announcement["audience"] })
                    }
                    className="w-full px-3 py-2 rounded-lg bg-card border border-border text-foreground"
                  >
                    <option value="ALL">All organizations</option>
                    <option value="ADMINS">Admins only</option>
                  </select>
                </div>
              </div>
              {form.severity === "CRITICAL" && (
                <p className="text-destructive text-[11px] flex items-center gap-1.5">
                  <AlertTriangle className="h-3 w-3" />
                  Critical announcements are flagged for all tenant admins.
                </p>
              )}
              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full py-2.5 rounded-xl bg-primary text-primary-foreground font-semibold hover:bg-primary/90 flex items-center justify-center gap-2 disabled:opacity-60"
              >
                {isSubmitting && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
                Publish Announcement
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
