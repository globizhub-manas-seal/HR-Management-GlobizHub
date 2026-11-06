"use client";

import { useState } from "react";
import {
  Key,
  Plus,
  Copy,
  CheckCircle2,
  Trash2,
  Shield,
  Eye,
  EyeOff,
  AlertTriangle,
} from "lucide-react";

interface ApiKeyItem {
  id: string;
  name: string;
  prefix: string;
  role: string;
  createdAt: string;
  lastUsedAt?: string;
  expiresAt: string;
}

export default function ApiKeysPage() {
  const [keys, setKeys] = useState<ApiKeyItem[]>([
    {
      id: "key-1",
      name: "Stripe Webhook Ingestion",
      prefix: "th_live_9a8f...",
      role: "BILLING_ADMIN",
      createdAt: "2026-01-15",
      lastUsedAt: "Just now",
      expiresAt: "2027-01-15",
    },
    {
      id: "key-2",
      name: "Zapier Automated Customer Sync",
      prefix: "th_live_4b2c...",
      role: "PLATFORM_ADMIN",
      createdAt: "2026-02-01",
      lastUsedAt: "2 hours ago",
      expiresAt: "2027-02-01",
    },
    {
      id: "key-3",
      name: "Data Warehouse ETL Pipeline",
      prefix: "th_live_7d1e...",
      role: "PLATFORM_ANALYST",
      createdAt: "2026-03-10",
      lastUsedAt: "Yesterday",
      expiresAt: "2027-03-10",
    },
  ]);

  const [copiedKey, setCopiedKey] = useState<string | null>(null);

  const handleCopy = (prefix: string) => {
    navigator.clipboard.writeText(prefix);
    setCopiedKey(prefix);
    setTimeout(() => setCopiedKey(null), 2000);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold tracking-tight text-foreground">Platform Developer API Keys</h1>
            <span className="text-xs font-mono font-medium px-2 py-0.5 rounded-full bg-primary/15 text-primary border border-primary/25">
              {keys.length} Active Secret{keys.length !== 1 ? "s" : ""}
            </span>
          </div>
          <p className="text-sm text-muted-foreground mt-1">
            Programmatic API tokens for backend webhooks, third-party ERP integrations, and BI data pipelines.
          </p>
        </div>

        <button
          onClick={() => alert("New API Key generated: th_live_" + Math.random().toString(36).substring(2, 18))}
          className="flex items-center gap-2 px-4 py-2 text-xs font-medium bg-primary hover:bg-primary/90 text-primary-foreground rounded-lg transition-colors shadow-md shadow-xs"
        >
          <Plus className="h-4 w-4" />
          Generate New Key
        </button>
      </div>

      <div className="rounded-xl border border-status-orange/25 bg-amber-500/5 p-4 flex items-start gap-3 text-xs text-status-orange">
        <AlertTriangle className="h-4 w-4 flex-shrink-0 text-status-orange mt-0.5" />
        <div>
          <strong>Security Notice:</strong> Platform API keys grant elevated machine-to-machine access. Never commit keys to public GitHub repositories or expose them to frontend client browsers.
        </div>
      </div>

      {/* Keys List */}
      <div className="space-y-3">
        {keys.map((k) => (
          <div
            key={k.id}
            className="p-4 rounded-xl border border-border bg-card flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 hover:border-primary/40 transition-colors shadow-md"
          >
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <span className="font-semibold text-foreground text-sm">{k.name}</span>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-background text-muted-foreground border border-border">
                  {k.role}
                </span>
              </div>
              <div className="flex items-center gap-3 text-xs text-muted-foreground font-mono">
                <span className="text-foreground">{k.prefix}</span>
                <span>•</span>
                <span>Created: {k.createdAt}</span>
                <span>•</span>
                <span>Last used: {k.lastUsedAt}</span>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={() => handleCopy(k.prefix)}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-background border border-border text-xs text-foreground hover:text-foreground hover:bg-muted"
              >
                {copiedKey === k.prefix ? (
                  <>
                    <CheckCircle2 className="h-3.5 w-3.5 text-status-green" />
                    Copied
                  </>
                ) : (
                  <>
                    <Copy className="h-3.5 w-3.5" />
                    Copy Token
                  </>
                )}
              </button>
              <button
                onClick={() => setKeys((prev) => prev.filter((item) => item.id !== k.id))}
                className="p-1.5 rounded-lg bg-destructive/15 text-destructive border border-destructive/25 hover:bg-destructive/25"
                title="Revoke Key"
              >
                <Trash2 className="h-3.5 w-3.5" />
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

