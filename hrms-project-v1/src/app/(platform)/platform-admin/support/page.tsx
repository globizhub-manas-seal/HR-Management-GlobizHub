"use client";

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import {
  LifeBuoy,
  Search,
  Filter,
  CheckCircle2,
  Clock,
  AlertCircle,
  AlertTriangle,
  Building2,
  Send,
  User,
  ShieldCheck,
  RefreshCw,
  Plus,
  MessageSquare,
  Lock,
  ChevronRight,
  Sparkles,
} from "lucide-react";
import { platformApi } from "@/lib/platform-api";

interface TicketSummary {
  id: string;
  ticketNumber: string;
  companyId: string;
  companyName: string;
  companyEmail: string;
  subject: string;
  category: string;
  priority: "LOW" | "MEDIUM" | "HIGH" | "URGENT";
  status: "OPEN" | "IN_PROGRESS" | "WAITING_FOR_CUSTOMER" | "RESOLVED" | "CLOSED";
  assigneeName: string;
  messageCount: number;
  createdAt: string;
  updatedAt: string;
}

interface TicketMessage {
  id: string;
  senderType: "PLATFORM_USER" | "EMPLOYEE";
  senderId: string;
  senderName?: string;
  message: string;
  isInternal: boolean;
  createdAt: string;
}

interface FullTicket extends TicketSummary {
  creator: {
    id: string;
    firstName: string;
    lastName: string;
    email: string;
  };
  messages: TicketMessage[];
}

export default function SupportDeskPage() {
  const [tickets, setTickets] = useState<TicketSummary[]>([]);
  const [selectedTicket, setSelectedTicket] = useState<FullTicket | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isLoadingTicket, setIsLoadingTicket] = useState(false);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [priorityFilter, setPriorityFilter] = useState("ALL");
  const [replyText, setReplyText] = useState("");
  const [isInternal, setIsInternal] = useState(false);
  const [isSending, setIsSending] = useState(false);

  const fetchTickets = useCallback(async () => {
    setIsLoading(true);
    try {
      const params = new URLSearchParams();
      if (search) params.append("search", search);
      if (statusFilter !== "ALL") params.append("status", statusFilter);
      if (priorityFilter !== "ALL") params.append("priority", priorityFilter);

      const res = await platformApi.get<{ data: TicketSummary[] }>(
        `/platform/support/tickets?${params.toString()}`
      );
      const list = res.data?.data || [];
      setTickets(list);
      if (list[0] && !selectedTicket) {
        loadTicketDetails(list[0].id);
      }
    } catch (e) {
      console.error("Failed to load tickets", e);
    } finally {
      setIsLoading(false);
    }
  }, [search, statusFilter, priorityFilter, selectedTicket]);

  const loadTicketDetails = async (id: string) => {
    setIsLoadingTicket(true);
    try {
      const res = await platformApi.get<FullTicket>(`/platform/support/tickets/${id}`);
      setSelectedTicket(res.data);
    } catch (e) {
      console.error("Failed to load ticket details", e);
    } finally {
      setIsLoadingTicket(false);
    }
  };

  useEffect(() => {
    fetchTickets();
  }, [fetchTickets]);

  const handleSendReply = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!replyText.trim() || !selectedTicket) return;

    setIsSending(true);
    try {
      await platformApi.post(`/platform/support/tickets/${selectedTicket.id}/reply`, {
        message: replyText.trim(),
        isInternal,
        status: isInternal ? selectedTicket.status : "WAITING_FOR_CUSTOMER",
      });

      setReplyText("");
      setIsInternal(false);
      loadTicketDetails(selectedTicket.id);
      fetchTickets();
    } catch (e: any) {
      alert("Failed to send message: " + (e.response?.data?.message || e.message));
    } finally {
      setIsSending(false);
    }
  };

  const handleUpdateStatus = async (newStatus: string) => {
    if (!selectedTicket) return;
    try {
      await platformApi.put(`/platform/support/tickets/${selectedTicket.id}/status`, {
        status: newStatus,
      });
      loadTicketDetails(selectedTicket.id);
      fetchTickets();
    } catch (e: any) {
      alert("Failed to update status: " + (e.response?.data?.message || e.message));
    }
  };

  const getPriorityBadge = (p: string) => {
    switch (p) {
      case "URGENT":
        return "bg-destructive/15 text-destructive border-destructive/25";
      case "HIGH":
        return "bg-status-orange/15 text-status-orange border-status-orange/25";
      case "MEDIUM":
        return "bg-primary/15 text-foreground border-primary/25";
      default:
        return "bg-muted text-muted-foreground border-border";
    }
  };

  const getStatusBadge = (s: string) => {
    switch (s) {
      case "OPEN":
        return "bg-destructive/15 text-destructive border-destructive/25";
      case "IN_PROGRESS":
        return "bg-primary/15 text-foreground border-primary/25";
      case "WAITING_FOR_CUSTOMER":
        return "bg-status-orange/15 text-status-orange border-status-orange/25";
      case "RESOLVED":
        return "bg-status-green/15 text-status-green border-status-green/25";
      default:
        return "bg-muted text-muted-foreground border-border";
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-4 border-b border-border">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold tracking-tight text-foreground">Customer Support Desk</h1>
            <span className="text-xs font-mono font-medium px-2 py-0.5 rounded-full bg-primary/15 text-foreground border border-primary/25">
              {tickets.length} Ticket{tickets.length !== 1 ? "s" : ""}
            </span>
          </div>
          <p className="text-sm text-muted-foreground mt-1">
            Centralized support ticket queue across all customer organizations with internal collaboration notes and live diagnostic shortcuts.
          </p>
        </div>

        <button
          onClick={() => fetchTickets()}
          className="flex items-center gap-2 px-3.5 py-2 text-xs font-medium text-foreground bg-card border border-border hover:bg-muted rounded-xl transition-colors shadow-xs cursor-pointer"
        >
          <RefreshCw className="size-3.5" />
          Refresh Queue
        </button>
      </div>

      {/* Split Pane: Queue (Left) & Conversation (Right) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 min-h-[650px]">
        {/* Ticket List Stream */}
        <div className="lg:col-span-5 rounded-2xl border border-border bg-card flex flex-col shadow-xs overflow-hidden">
          {/* Filters */}
          <div className="p-3 border-b border-border bg-muted/40 space-y-2">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-3.5 text-muted-foreground" />
              <input
                type="text"
                placeholder="Search ticket # or customer..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full pl-9 pr-3 py-1.5 rounded-xl bg-background border border-border text-xs text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary shadow-xs"
              />
            </div>

            <div className="flex gap-2">
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="w-1/2 px-2.5 py-1 rounded-lg bg-background border border-border text-[11px] text-foreground focus:outline-none focus:ring-2 focus:ring-primary shadow-xs"
              >
                <option value="ALL">All Statuses</option>
                <option value="OPEN">Open</option>
                <option value="IN_PROGRESS">In Progress</option>
                <option value="WAITING_FOR_CUSTOMER">Waiting for Customer</option>
                <option value="RESOLVED">Resolved</option>
              </select>

              <select
                value={priorityFilter}
                onChange={(e) => setPriorityFilter(e.target.value)}
                className="w-1/2 px-2.5 py-1 rounded-lg bg-background border border-border text-[11px] text-foreground focus:outline-none focus:ring-2 focus:ring-primary shadow-xs"
              >
                <option value="ALL">All Priorities</option>
                <option value="URGENT">Urgent</option>
                <option value="HIGH">High</option>
                <option value="MEDIUM">Medium</option>
                <option value="LOW">Low</option>
              </select>
            </div>
          </div>

          {/* List items */}
          <div className="flex-1 overflow-y-auto divide-y divide-border max-h-[560px]">
            {isLoading ? (
              <div className="py-16 text-center text-muted-foreground text-xs">
                <RefreshCw className="size-6 animate-spin mx-auto mb-2 text-primary" />
                Loading support tickets...
              </div>
            ) : tickets.length === 0 ? (
              <div className="py-16 text-center text-muted-foreground text-xs">
                No support tickets found matching criteria.
              </div>
            ) : (
              tickets.map((t) => {
                const isSelected = selectedTicket?.id === t.id;

                return (
                  <div
                    key={t.id}
                    onClick={() => loadTicketDetails(t.id)}
                    className={`p-3.5 cursor-pointer transition-colors ${
                      isSelected
                        ? "bg-primary/15 border-l-4 border-primary"
                        : "hover:bg-muted/40"
                    }`}
                  >
                    <div className="flex items-center justify-between gap-2 mb-1.5">
                      <span className="font-mono text-[11px] font-bold text-primary">
                        {t.ticketNumber}
                      </span>
                      <div className="flex items-center gap-1.5">
                        <span
                          className={`text-[9px] font-bold px-1.5 py-0.5 rounded border uppercase ${getPriorityBadge(
                            t.priority
                          )}`}
                        >
                          {t.priority}
                        </span>
                        <span
                          className={`text-[9px] font-bold px-1.5 py-0.5 rounded border uppercase ${getStatusBadge(
                            t.status
                          )}`}
                        >
                          {t.status.replace("_", " ")}
                        </span>
                      </div>
                    </div>

                    <h4 className="text-xs font-semibold text-foreground truncate">{t.subject}</h4>

                    <div className="flex items-center justify-between gap-2 mt-2 text-[10px] text-muted-foreground">
                      <span className="truncate max-w-[160px] font-medium text-foreground">
                        {t.companyName}
                      </span>
                      <span className="font-mono">
                        {new Date(t.updatedAt).toLocaleDateString()}
                      </span>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Conversation Thread (Right) */}
        <div className="lg:col-span-7 rounded-2xl border border-border bg-card flex flex-col shadow-xs overflow-hidden">
          {selectedTicket ? (
            <>
              {/* Ticket Top bar */}
              <div className="p-4 border-b border-border bg-muted/40 flex items-start justify-between gap-4">
                <div>
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-mono font-bold text-primary text-xs">
                      {selectedTicket.ticketNumber}
                    </span>
                    <span className="text-muted-foreground/50">•</span>
                    <span className="text-xs font-semibold text-foreground">
                      {selectedTicket.category}
                    </span>
                    <span className="text-muted-foreground/50">•</span>
                    <Link
                      href={`/platform-admin/organizations/${selectedTicket.companyId}`}
                      className="text-xs text-primary hover:underline font-medium"
                    >
                      {selectedTicket.companyName}
                    </Link>
                  </div>
                  <h2 className="text-sm font-bold text-foreground mt-1">{selectedTicket.subject}</h2>
                </div>

                <div className="flex items-center gap-2">
                  <select
                    value={selectedTicket.status}
                    onChange={(e) => handleUpdateStatus(e.target.value)}
                    className="px-2.5 py-1.5 rounded-xl bg-background border border-border text-xs font-semibold text-foreground focus:outline-none focus:ring-2 focus:ring-primary cursor-pointer shadow-xs"
                  >
                    <option value="OPEN">Mark OPEN</option>
                    <option value="IN_PROGRESS">Mark IN PROGRESS</option>
                    <option value="WAITING_FOR_CUSTOMER">WAITING FOR CUSTOMER</option>
                    <option value="RESOLVED">Mark RESOLVED</option>
                    <option value="CLOSED">Mark CLOSED</option>
                  </select>
                </div>
              </div>

              {/* Messages Scroll View */}
              <div className="flex-1 overflow-y-auto p-4 space-y-4 max-h-[420px]">
                {isLoadingTicket ? (
                  <div className="py-16 text-center text-muted-foreground text-xs">
                    <RefreshCw className="size-6 animate-spin mx-auto mb-2 text-primary" />
                    Loading conversation thread...
                  </div>
                ) : (
                  selectedTicket.messages?.map((msg) => {
                    const isPlatform = msg.senderType === "PLATFORM_USER";

                    return (
                      <div
                        key={msg.id}
                        className={`p-3.5 rounded-2xl border text-xs max-w-[85%] ${
                          msg.isInternal
                            ? "bg-status-orange/15 border-status-orange/25 text-foreground ml-auto"
                            : isPlatform
                            ? "bg-primary/15 border-primary/25 text-foreground ml-auto"
                            : "bg-muted/60 border-border text-foreground mr-auto"
                        }`}
                      >
                        <div className="flex items-center justify-between gap-4 mb-1.5 pb-1 border-b border-border">
                          <span className="font-semibold text-[11px] text-foreground">
                            {msg.senderName || (isPlatform ? "Platform Staff" : "Tenant Contact")}
                            {msg.isInternal && (
                              <span className="ml-2 font-mono text-[9px] uppercase px-1.5 py-0.5 rounded bg-status-orange/20 text-status-orange font-bold">
                                Internal Staff Note
                              </span>
                            )}
                          </span>
                          <span className="text-[10px] text-muted-foreground font-mono">
                            {new Date(msg.createdAt).toLocaleTimeString()}
                          </span>
                        </div>
                        <p className="whitespace-pre-wrap leading-relaxed">{msg.message}</p>
                      </div>
                    );
                  })
                )}
              </div>

              {/* Reply Box */}
              <form onSubmit={handleSendReply} className="p-3 border-t border-border bg-muted/40 space-y-2">
                <div className="flex items-center justify-between text-xs">
                  <label className="flex items-center gap-1.5 cursor-pointer text-muted-foreground hover:text-foreground">
                    <input
                      type="checkbox"
                      checked={isInternal}
                      onChange={(e) => setIsInternal(e.target.checked)}
                      className="rounded accent-primary"
                    />
                    <Lock className="size-3 text-status-orange" />
                    <span className={isInternal ? "text-status-orange font-medium" : ""}>
                      Internal staff note (hidden from customer)
                    </span>
                  </label>
                  <span className="text-[10px] text-muted-foreground">Press Enter or click Send</span>
                </div>

                <div className="flex gap-2">
                  <textarea
                    rows={2}
                    placeholder={
                      isInternal
                        ? "Add an internal investigation note for team members..."
                        : "Reply to customer organization..."
                    }
                    value={replyText}
                    onChange={(e) => setReplyText(e.target.value)}
                    className="flex-1 px-3 py-2 rounded-xl bg-background border border-border text-xs text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary resize-none shadow-xs"
                  />
                  <button
                    type="submit"
                    disabled={isSending || !replyText.trim()}
                    className="px-4 rounded-xl flex items-center justify-center font-semibold text-xs text-primary-foreground bg-primary hover:bg-primary/90 transition-colors disabled:opacity-40 cursor-pointer shadow-xs"
                  >
                    <Send className="size-4" />
                  </button>
                </div>
              </form>
            </>
          ) : (
            <div className="py-24 text-center text-muted-foreground text-xs">
              Select a support ticket from the queue on the left to review the conversation.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
