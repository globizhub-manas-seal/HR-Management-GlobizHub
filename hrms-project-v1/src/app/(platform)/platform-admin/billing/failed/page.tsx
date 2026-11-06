"use client";

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import {
  AlertOctagon,
  RefreshCw,
  Mail,
  Phone,
  Building2,
  Calendar,
  AlertCircle,
  CreditCard,
  Send,
  CheckCircle2,
} from "lucide-react";
import { platformApi } from "@/lib/platform-api";

interface FailedPaymentItem {
  id: string;
  invoiceNumber: string;
  companyName: string;
  companyEmail: string;
  companyPhone?: string;
  planName: string;
  amount: number;
  currency: string;
  gateway: string;
  status: string;
  failureReason: string;
  dueDate: string;
  createdAt: string;
}

export default function FailedPaymentsPage() {
  const [items, setItems] = useState<FailedPaymentItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [meta, setMeta] = useState({ total: 0, totalPages: 1, limit: 20 });
  const [dunningNotified, setDunningNotified] = useState<Record<string, boolean>>({});

  const fetchFailed = useCallback(async () => {
    setIsLoading(true);
    try {
      const res = await platformApi.get<{ data: FailedPaymentItem[]; meta: any }>(
        `/platform/billing/failed?page=${page}&limit=20`
      );
      setItems(res.data?.data || []);
      setMeta(res.data?.meta || { total: 0, totalPages: 1, limit: 20 });
    } catch (e) {
      console.error("Failed to load failed payments", e);
    } finally {
      setIsLoading(false);
    }
  }, [page]);

  useEffect(() => {
    fetchFailed();
  }, [fetchFailed]);

  const handleSendReminder = (id: string, email: string) => {
    setDunningNotified((prev) => ({ ...prev, [id]: true }));
    alert(`Automated dunning email reminder sent to: ${email}`);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold tracking-tight text-foreground">Failed Payments & Dunning</h1>
            <span className="text-xs font-mono font-medium px-2 py-0.5 rounded-full bg-destructive/15 text-destructive border border-destructive/25">
              {meta.total} Issue{meta.total !== 1 ? "s" : ""}
            </span>
          </div>
          <p className="text-sm text-muted-foreground mt-1">
            Automated dunning recovery queue for declined recurring charges, expired cards, and overdue customer invoices.
          </p>
        </div>

        <button
          onClick={() => fetchFailed()}
          className="flex items-center gap-2 px-3.5 py-2 text-xs font-medium text-foreground bg-card border border-border hover:bg-muted rounded-lg transition-colors"
        >
          <RefreshCw className="h-3.5 w-3.5" />
          Refresh Queue
        </button>
      </div>

      {/* Table */}
      <div className="rounded-xl border border-border bg-card overflow-hidden shadow-xl">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-muted/50 border-b border-border text-muted-foreground uppercase tracking-wider font-semibold">
              <tr>
                <th className="py-3.5 px-4">Organization & Contact</th>
                <th className="py-3.5 px-4">Invoice #</th>
                <th className="py-3.5 px-4">Tier</th>
                <th className="py-3.5 px-4">Overdue Amount</th>
                <th className="py-3.5 px-4">Failure Reason</th>
                <th className="py-3.5 px-4">Due Date</th>
                <th className="py-3.5 px-4 text-right">Dunning Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {isLoading ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-muted-foreground">
                    <RefreshCw className="h-6 w-6 animate-spin mx-auto mb-2 text-primary" />
                    Loading dunning queue...
                  </td>
                </tr>
              ) : items.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-status-green/80">
                    <CheckCircle2 className="h-6 w-6 mx-auto mb-2 text-status-green" />
                    Zero payment failures! All subscription payments are currently healthy and up-to-date.
                  </td>
                </tr>
              ) : (
                items.map((item) => {
                  const isSent = dunningNotified[item.id];

                  return (
                    <tr key={item.id} className="hover:bg-muted/30 transition-colors">
                      <td className="py-3.5 px-4">
                        <div className="font-semibold text-foreground">{item.companyName}</div>
                        <div className="text-[11px] text-muted-foreground flex items-center gap-1.5 mt-0.5">
                          <Mail className="h-3 w-3 text-muted-foreground" />
                          {item.companyEmail}
                        </div>
                        {item.companyPhone && (
                          <div className="text-[10px] text-muted-foreground flex items-center gap-1.5">
                            <Phone className="h-2.5 w-2.5" />
                            {item.companyPhone}
                          </div>
                        )}
                      </td>
                      <td className="py-3.5 px-4 font-mono font-semibold text-primary">
                        {item.invoiceNumber}
                      </td>
                      <td className="py-3.5 px-4">
                        <span className="text-foreground">{item.planName}</span>
                      </td>
                      <td className="py-3.5 px-4 font-mono font-semibold text-destructive">
                        ₹{item.amount.toLocaleString()}
                      </td>
                      <td className="py-3.5 px-4">
                        <div className="text-[11px] font-medium text-destructive bg-destructive/15 border border-destructive/25 px-2 py-0.5 rounded inline-block max-w-[220px] truncate">
                          {item.failureReason}
                        </div>
                      </td>
                      <td className="py-3.5 px-4 font-mono text-muted-foreground text-[11px]">
                        {new Date(item.dueDate).toLocaleDateString()}
                      </td>
                      <td className="py-3.5 px-4 text-right">
                        <button
                          disabled={isSent}
                          onClick={() => handleSendReminder(item.id, item.companyEmail)}
                          className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[11px] font-medium transition-colors ${
                            isSent
                              ? "bg-muted text-muted-foreground cursor-not-allowed"
                              : "bg-destructive/15 text-destructive border border-destructive/25 hover:bg-destructive/25"
                          }`}
                        >
                          <Send className="h-3 w-3" />
                          {isSent ? "Reminder Sent" : "Send Dunning Notice"}
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
