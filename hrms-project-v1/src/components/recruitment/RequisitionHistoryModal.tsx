"use client";

import { useQuery } from "@tanstack/react-query";
import axios from "axios";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Loader2, History, CheckCircle2, AlertTriangle, XCircle, Clock, Send, Ban, IndianRupee } from "lucide-react";

interface RequisitionHistoryModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  requisitionId: string | null;
}

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000";

const ACTION_CONFIG: Record<string, { label: string; color: string; icon: any }> = {
  SUBMITTED: { label: "Submitted for Review", color: "bg-blue-500/10 text-blue-600 border-blue-500/20", icon: Send },
  UNDER_REVIEW: { label: "Review Session Started", color: "bg-amber-500/10 text-amber-600 border-amber-500/20", icon: Clock },
  CHANGES_REQUESTED: { label: "Changes Requested", color: "bg-orange-500/10 text-orange-600 border-orange-500/20", icon: AlertTriangle },
  APPROVED: { label: "Approved & Budget Allocated", color: "bg-emerald-500/10 text-emerald-600 border-emerald-500/20", icon: CheckCircle2 },
  REJECTED: { label: "Requisition Rejected", color: "bg-destructive/10 text-destructive border-destructive/20", icon: XCircle },
  CANCELLED: { label: "Requisition Cancelled", color: "bg-muted text-muted-foreground border-border", icon: Ban },
};

export function RequisitionHistoryModal({
  open,
  onOpenChange,
  requisitionId,
}: RequisitionHistoryModalProps) {
  const getToken = () => (typeof window !== "undefined" ? localStorage.getItem("hrms_token") : null);

  const { data: requisition, isLoading } = useQuery({
    queryKey: ["requisitionHistory", requisitionId],
    queryFn: async () => {
      if (!requisitionId) return null;
      const res = await axios.get(`${API_URL}/recruitment/manpower/${requisitionId}`, {
        headers: { Authorization: `Bearer ${getToken()}` },
      });
      return res.data;
    },
    enabled: !!requisitionId && open,
  });

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-xl max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-lg bg-primary/10 text-primary">
              <History className="w-5 h-5" />
            </div>
            <div>
              <DialogTitle className="text-xl font-bold">
                Approval History & Audit Trail
              </DialogTitle>
              <DialogDescription>
                {requisition ? `${requisition.requisitionNumber} — ${requisition.designation?.name}` : "Requisition timeline"}
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        {isLoading ? (
          <div className="py-12 flex flex-col items-center justify-center text-muted-foreground gap-2">
            <Loader2 className="w-6 h-6 animate-spin text-primary" />
            <span className="text-xs">Loading audit events...</span>
          </div>
        ) : !requisition?.approvals || requisition.approvals.length === 0 ? (
          <div className="py-8 text-center text-xs text-muted-foreground">
            No approval events recorded yet for this draft requisition.
          </div>
        ) : (
          <div className="relative pl-6 space-y-6 my-4 before:absolute before:left-2 before:top-2 before:bottom-2 before:w-[2px] before:bg-border">
            {requisition.approvals.map((approval: any, idx: number) => {
              const config = ACTION_CONFIG[approval.action] || {
                label: approval.action,
                color: "bg-muted text-muted-foreground border-border",
                icon: Clock,
              };
              const Icon = config.icon;

              return (
                <div key={approval.id || idx} className="relative group">
                  {/* Dot */}
                  <div className="absolute -left-[27px] top-1 w-4 h-4 rounded-full bg-background border-2 border-primary flex items-center justify-center shadow-sm">
                    <div className="w-1.5 h-1.5 rounded-full bg-primary" />
                  </div>

                  <div className="p-3.5 bg-card rounded-xl border border-border/80 shadow-xs space-y-2">
                    <div className="flex items-center justify-between flex-wrap gap-2">
                      <div className="flex items-center gap-1.5">
                        <Badge variant="outline" className={`gap-1 font-semibold text-xs py-0.5 px-2 ${config.color}`}>
                          <Icon className="w-3.5 h-3.5" />
                          {config.label}
                        </Badge>
                      </div>
                      <span className="text-[11px] text-muted-foreground font-mono">
                        {new Date(approval.createdAt).toLocaleString(undefined, {
                          dateStyle: "medium",
                          timeStyle: "short",
                        })}
                      </span>
                    </div>

                    <div className="text-xs flex items-center gap-1.5 text-muted-foreground">
                      <span>By</span>
                      <strong className="text-foreground">
                        {approval.performedBy?.firstName} {approval.performedBy?.lastName}
                      </strong>
                      <span className="text-[10px] px-1.5 py-0.2 bg-muted rounded font-semibold">
                        {approval.performedBy?.role}
                      </span>
                    </div>

                    {approval.budgetAmount && (
                      <div className="flex items-center gap-1 text-xs font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 px-2.5 py-1 rounded-md w-fit">
                        <IndianRupee className="w-3.5 h-3.5" />
                        Allocated Budget: ₹{Number(approval.budgetAmount).toLocaleString()}
                      </div>
                    )}

                    {approval.comments && (
                      <p className="text-xs text-foreground bg-muted/40 p-2.5 rounded-lg border text-pretty italic">
                        &ldquo;{approval.comments}&rdquo;
                      </p>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}

        <DialogFooter className="border-t pt-3">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Close
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
