"use client";

import { useState, useEffect } from "react";
import axios from "axios";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import {
  Loader2,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  Play,
  IndianRupee,
  Clock,
  User,
  Building,
} from "lucide-react";
import { useToast } from "@/components/ToastProvider";

interface RequisitionReviewModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  requisition: any;
  onSuccess: () => void;
}

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000";

export function RequisitionReviewModal({
  open,
  onOpenChange,
  requisition,
  onSuccess,
}: RequisitionReviewModalProps) {
  const { toast } = useToast();
  const [activeAction, setActiveAction] = useState<"APPROVE" | "CHANGES" | "REJECT">("APPROVE");
  const [budgetAmount, setBudgetAmount] = useState("");
  const [comments, setComments] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const getToken = () => (typeof window !== "undefined" ? localStorage.getItem("hrms_token") : null);

  useEffect(() => {
    if (requisition) {
      setBudgetAmount(requisition.budgetAmount ? String(requisition.budgetAmount) : "");
      setComments("");
      setActiveAction("APPROVE");
    }
  }, [requisition]);

  if (!requisition) return null;

  const handleStartReview = async () => {
    setIsSubmitting(true);
    try {
      const headers = { Authorization: `Bearer ${getToken()}` };
      await axios.post(`${API_URL}/recruitment/manpower/${requisition.id}/start-review`, {}, { headers });
      toast("Requisition marked UNDER_REVIEW", "success");
      onSuccess();
    } catch (err: any) {
      toast(err.response?.data?.message || "Failed to start review", "error");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDecision = async () => {
    setIsSubmitting(true);
    try {
      const headers = { Authorization: `Bearer ${getToken()}` };

      if (activeAction === "APPROVE") {
        await axios.post(
          `${API_URL}/recruitment/manpower/${requisition.id}/approve`,
          {
            budgetAmount: budgetAmount ? Number(budgetAmount) : undefined,
            comments: comments || "Approved by HR/Management",
          },
          { headers },
        );
        toast("Requisition & budget approved successfully!", "success");
      } else if (activeAction === "CHANGES") {
        if (!comments.trim()) {
          toast("Comments are mandatory when requesting changes", "error");
          setIsSubmitting(false);
          return;
        }
        await axios.post(
          `${API_URL}/recruitment/manpower/${requisition.id}/request-changes`,
          { comments },
          { headers },
        );
        toast("Changes requested from requester", "success");
      } else if (activeAction === "REJECT") {
        if (!comments.trim()) {
          toast("Reason is mandatory when rejecting a requisition", "error");
          setIsSubmitting(false);
          return;
        }
        await axios.post(
          `${API_URL}/recruitment/manpower/${requisition.id}/reject`,
          { comments },
          { headers },
        );
        toast("Requisition rejected", "error");
      }

      onSuccess();
      onOpenChange(false);
    } catch (err: any) {
      toast(err.response?.data?.message || "Failed to execute decision", "error");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="font-mono text-sm px-2.5 py-1 bg-primary/10 text-primary font-bold rounded-md">
                {requisition.requisitionNumber}
              </span>
              <Badge variant="outline" className="font-semibold">
                {requisition.status}
              </Badge>
            </div>
          </div>
          <DialogTitle className="text-xl font-bold pt-2">
            Review Manpower Request: {requisition.designation?.name}
          </DialogTitle>
          <DialogDescription>
            Verify headcount justification, experience requirements, and approved hiring budget.
          </DialogDescription>
        </DialogHeader>

        {/* Snapshot Summary Cards */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 my-2 text-xs">
          <div className="p-3 bg-muted/40 rounded-xl border">
            <span className="text-muted-foreground block mb-1">Department</span>
            <span className="font-bold flex items-center gap-1">
              <Building className="w-3.5 h-3.5 text-primary" />
              {requisition.department?.name}
            </span>
          </div>

          <div className="p-3 bg-muted/40 rounded-xl border">
            <span className="text-muted-foreground block mb-1">Headcount</span>
            <span className="font-bold text-sm text-primary">
              {requisition.positionsCount} {requisition.positionsCount > 1 ? "Openings" : "Opening"}
            </span>
          </div>

          <div className="p-3 bg-muted/40 rounded-xl border">
            <span className="text-muted-foreground block mb-1">Experience</span>
            <span className="font-bold">
              {requisition.minExperienceYears} - {requisition.maxExperienceYears || "Any"} yrs
            </span>
          </div>

          <div className="p-3 bg-muted/40 rounded-xl border">
            <span className="text-muted-foreground block mb-1">Requested By</span>
            <span className="font-bold flex items-center gap-1 truncate">
              <User className="w-3.5 h-3.5 text-muted-foreground" />
              {requisition.requestedBy?.firstName} {requisition.requestedBy?.lastName}
            </span>
          </div>
        </div>

        {/* Salary & Justification info */}
        <div className="space-y-3 p-3 bg-muted/20 rounded-xl border text-xs">
          <div className="flex items-center justify-between">
            <span className="text-muted-foreground font-medium">Hiring Reason:</span>
            <Badge variant="secondary" className="font-semibold">
              {requisition.hiringReason}
            </Badge>
          </div>

          <div className="flex items-center justify-between">
            <span className="text-muted-foreground font-medium">Expected Salary Range:</span>
            <span className="font-bold">
              ₹{requisition.minSalary ? Number(requisition.minSalary).toLocaleString() : "N/A"} - ₹
              {requisition.maxSalary ? Number(requisition.maxSalary).toLocaleString() : "N/A"}
            </span>
          </div>

          {requisition.justification && (
            <div className="pt-2 border-t">
              <span className="text-muted-foreground font-semibold block mb-1">Business Justification:</span>
              <p className="text-foreground italic">{requisition.justification}</p>
            </div>
          )}
        </div>

        {/* Action Workflow Logic */}
        {requisition.status === "SUBMITTED" ? (
          <div className="p-4 bg-amber-500/10 border border-amber-500/30 rounded-xl text-center space-y-3 my-2">
            <div className="flex items-center justify-center gap-2 text-amber-600 font-semibold text-sm">
              <Clock className="w-4 h-4" />
              This requisition has been submitted and is awaiting review.
            </div>
            <p className="text-xs text-muted-foreground">
              To enforce multi-step governance, click <strong>Start Review</strong> to examine the budget and log your review session before rendering a final decision.
            </p>
            <Button
              onClick={handleStartReview}
              disabled={isSubmitting}
              className="bg-amber-600 hover:bg-amber-700 text-white font-semibold"
            >
              {isSubmitting ? <Loader2 className="w-4 h-4 animate-spin mr-1" /> : <Play className="w-4 h-4 mr-1" />}
              Start Review Session
            </Button>
          </div>
        ) : requisition.status === "UNDER_REVIEW" ? (
          <div className="space-y-4 pt-2">
            {/* Action Switcher */}
            <div className="grid grid-cols-3 gap-2 p-1 bg-muted rounded-xl border">
              <button
                type="button"
                onClick={() => setActiveAction("APPROVE")}
                className={`py-2 text-xs font-bold rounded-lg transition-all flex items-center justify-center gap-1.5 ${
                  activeAction === "APPROVE"
                    ? "bg-emerald-600 text-white shadow-sm"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                <CheckCircle2 className="w-4 h-4" />
                Approve
              </button>

              <button
                type="button"
                onClick={() => setActiveAction("CHANGES")}
                className={`py-2 text-xs font-bold rounded-lg transition-all flex items-center justify-center gap-1.5 ${
                  activeAction === "CHANGES"
                    ? "bg-amber-600 text-white shadow-sm"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                <AlertTriangle className="w-4 h-4" />
                Request Changes
              </button>

              <button
                type="button"
                onClick={() => setActiveAction("REJECT")}
                className={`py-2 text-xs font-bold rounded-lg transition-all flex items-center justify-center gap-1.5 ${
                  activeAction === "REJECT"
                    ? "bg-destructive text-destructive-foreground shadow-sm"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                <XCircle className="w-4 h-4" />
                Reject
              </button>
            </div>

            {/* Action Specific Fields */}
            {activeAction === "APPROVE" && (
              <div className="space-y-3 p-4 bg-emerald-500/10 border border-emerald-500/20 rounded-xl">
                <div>
                  <label className="text-xs font-bold text-emerald-800 dark:text-emerald-300 block mb-1">
                    Confirmed Hiring Budget Amount (₹) *
                  </label>
                  <div className="relative">
                    <IndianRupee className="w-4 h-4 absolute left-3 top-3 text-muted-foreground" />
                    <Input
                      type="number"
                      placeholder="e.g. 1600000"
                      className="pl-9 bg-background font-semibold text-foreground"
                      value={budgetAmount}
                      onChange={(e) => setBudgetAmount(e.target.value)}
                    />
                  </div>
                  <span className="text-[11px] text-muted-foreground block mt-1">
                    Verify that this headcount fits into the annual department budget.
                  </span>
                </div>

                <div>
                  <label className="text-xs font-bold text-emerald-800 dark:text-emerald-300 block mb-1">
                    Approval Remarks
                  </label>
                  <Input
                    placeholder="e.g. Approved within Q3 hiring plan"
                    className="bg-background"
                    value={comments}
                    onChange={(e) => setComments(e.target.value)}
                  />
                </div>
              </div>
            )}

            {activeAction === "CHANGES" && (
              <div className="space-y-3 p-4 bg-amber-500/10 border border-amber-500/20 rounded-xl">
                <label className="text-xs font-bold text-amber-800 dark:text-amber-300 block mb-1">
                  Required Modifications (Mandatory) *
                </label>
                <Textarea
                  rows={3}
                  placeholder="Specify what needs to be adjusted (e.g. Please reduce salary bounds or reduce headcount to 1)..."
                  className="bg-background"
                  value={comments}
                  onChange={(e) => setComments(e.target.value)}
                />
              </div>
            )}

            {activeAction === "REJECT" && (
              <div className="space-y-3 p-4 bg-destructive/10 border border-destructive/20 rounded-xl">
                <label className="text-xs font-bold text-destructive block mb-1">
                  Rejection Reason (Mandatory) *
                </label>
                <Textarea
                  rows={3}
                  placeholder="Explain why this position cannot be approved (e.g. Hiring freeze, budget unavailable)..."
                  className="bg-background"
                  value={comments}
                  onChange={(e) => setComments(e.target.value)}
                />
              </div>
            )}
          </div>
        ) : (
          <div className="p-3 bg-muted/30 rounded-xl text-xs text-muted-foreground text-center">
            This requisition is currently in <strong>{requisition.status}</strong> status. No active review actions are required.
          </div>
        )}

        <DialogFooter className="pt-2 border-t flex items-center justify-between">
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={isSubmitting}>
            Cancel
          </Button>

          {requisition.status === "UNDER_REVIEW" && (
            <Button
              onClick={handleDecision}
              disabled={isSubmitting}
              className={`font-semibold ${
                activeAction === "APPROVE"
                  ? "bg-emerald-600 hover:bg-emerald-700 text-white"
                  : activeAction === "CHANGES"
                  ? "bg-amber-600 hover:bg-amber-700 text-white"
                  : "bg-destructive hover:bg-destructive/90 text-white"
              }`}
            >
              {isSubmitting ? <Loader2 className="w-4 h-4 animate-spin mr-1" /> : null}
              {activeAction === "APPROVE" && "Approve Requisition & Budget"}
              {activeAction === "CHANGES" && "Send Change Request"}
              {activeAction === "REJECT" && "Confirm Rejection"}
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
