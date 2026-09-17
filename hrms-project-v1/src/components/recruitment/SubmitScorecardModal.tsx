"use client";

import { useState, useEffect } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
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
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import {
  Loader2,
  Star,
  CheckCircle2,
  HelpCircle,
  FileCheck,
  Lock,
  MessageSquare,
} from "lucide-react";
import { useToast } from "@/components/ToastProvider";

interface SubmitScorecardModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  interview: any;
  onSuccess?: () => void;
}

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000";

export function SubmitScorecardModal({
  open,
  onOpenChange,
  interview,
  onSuccess,
}: SubmitScorecardModalProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const [recommendation, setRecommendation] = useState<string>("YES");
  const [strengths, setStrengths] = useState("");
  const [concerns, setConcerns] = useState("");
  const [privateNotes, setPrivateNotes] = useState("");
  const [sharedFeedback, setSharedFeedback] = useState("");
  const [ratings, setRatings] = useState<Record<string, { rating: number; comment: string }>>({});

  const getToken = () =>
    typeof window !== "undefined" ? localStorage.getItem("hrms_token") : null;

  const round = interview?.interviewRound;
  const criteria = round?.criteria || [];

  // Initialize ratings on modal open
  useEffect(() => {
    if (open && criteria.length > 0) {
      const initial: Record<string, { rating: number; comment: string }> = {};
      criteria.forEach((c: any) => {
        initial[c.id] = { rating: 4, comment: "" };
      });
      setRatings(initial);
      setRecommendation("YES");
      setStrengths("");
      setConcerns("");
      setPrivateNotes("");
      setSharedFeedback("");
    }
  }, [open, interview]);

  const submitMutation = useMutation({
    mutationFn: async () => {
      const evaluations = Object.entries(ratings).map(([criterionId, val]) => ({
        criterionId,
        rating: Number(val.rating),
        comment: val.comment.trim() || undefined,
      }));

      // Calculate average rating
      const avg =
        evaluations.length > 0
          ? Number(
              (
                evaluations.reduce((sum, e) => sum + e.rating, 0) / evaluations.length
              ).toFixed(1)
            )
          : 4.0;

      const payload = {
        overallRating: avg,
        recommendation,
        strengths: strengths.trim() || undefined,
        concerns: concerns.trim() || undefined,
        privateNotes: privateNotes.trim() || undefined,
        sharedFeedback: sharedFeedback.trim() || undefined,
        evaluations,
      };

      const res = await axios.post(
        `${API_URL}/recruitment/interviews/${interview.id}/scorecards`,
        payload,
        { headers: { Authorization: `Bearer ${getToken()}` } }
      );
      return res.data;
    },
    onSuccess: () => {
      toast("Interview scorecard submitted successfully", "success");
      queryClient.invalidateQueries({
        queryKey: ["interviewScorecards", interview.id],
      });
      queryClient.invalidateQueries({
        queryKey: ["candidateInterviews", interview.applicationId],
      });
      queryClient.invalidateQueries({
        queryKey: ["candidateTimeline", interview.applicationId],
      });
      onSuccess?.();
      onOpenChange(false);
    },
    onError: (err: any) => {
      toast(err.response?.data?.message || "Failed to submit scorecard", "error");
    },
  });

  const setCriterionRating = (critId: string, ratingVal: number) => {
    setRatings((prev) => ({
      ...prev,
      [critId]: {
        rating: ratingVal,
        comment: prev[critId]?.comment || "",
      },
    }));
  };

  const setCriterionComment = (critId: string, commentVal: string) => {
    setRatings((prev) => ({
      ...prev,
      [critId]: {
        rating: prev[critId]?.rating || 3,
        comment: commentVal,
      },
    }));
  };

  if (!interview) return null;

  const candidate = interview.application?.candidate || {};

  const RECOMMENDATIONS = [
    { value: "STRONG_YES", label: "Strong Yes", desc: "Top candidate • Strong hire recommendation", color: "border-emerald-500 bg-emerald-500/10 text-emerald-600" },
    { value: "YES", label: "Yes", desc: "Meets role bar • Recommend proceeding", color: "border-blue-500 bg-blue-500/10 text-blue-600" },
    { value: "NEUTRAL", label: "Neutral", desc: "Borderline / Mixed signals", color: "border-amber-500 bg-amber-500/10 text-amber-600" },
    { value: "NO", label: "No", desc: "Does not meet role requirements", color: "border-orange-500 bg-orange-500/10 text-orange-600" },
    { value: "STRONG_NO", label: "Strong No", desc: "Definite pass • Significant skill/culture gaps", color: "border-destructive bg-destructive/10 text-destructive" },
  ];

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-center justify-between border-b pb-2.5">
            <Badge variant="outline" className="text-[10px] uppercase font-bold">
              {round?.type || "Interview"} Scorecard
            </Badge>
            <span className="text-xs text-muted-foreground">
              Candidate: <strong className="text-foreground">{candidate.firstName} {candidate.lastName}</strong>
            </span>
          </div>
          <DialogTitle className="text-lg font-bold pt-1">
            Scorecard: {round?.name || "Interview Evaluation"}
          </DialogTitle>
          <DialogDescription className="text-xs">
            Submit your objective rating across criteria, qualitative feedback, and final recommendation.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-5 py-2 text-xs">
          {/* Structured Criteria Matrix */}
          <div className="space-y-3">
            <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
              <FileCheck className="w-3.5 h-3.5" />
              Evaluation Criteria Ratings (1 to 5 Stars)
            </span>

            {criteria.length === 0 ? (
              <div className="p-3 bg-muted/30 border rounded-lg text-muted-foreground text-xs italic">
                No specific criteria defined for this round. Use qualitative feedback below.
              </div>
            ) : (
              <div className="space-y-2.5">
                {criteria.map((c: any, index: number) => {
                  const current = ratings[c.id] || { rating: 4, comment: "" };
                  return (
                    <div
                      key={c.id}
                      className="p-3 bg-card border rounded-xl space-y-2 transition-colors"
                    >
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                        <div>
                          <span className="font-semibold text-foreground block">
                            {index + 1}. {c.name}
                          </span>
                          {c.description && (
                            <span className="text-[11px] text-muted-foreground">
                              {c.description}
                            </span>
                          )}
                        </div>

                        {/* Star Rating Buttons */}
                        <div className="flex items-center gap-1 shrink-0">
                          {[1, 2, 3, 4, 5].map((star) => (
                            <button
                              key={star}
                              type="button"
                              onClick={() => setCriterionRating(c.id, star)}
                              className={`p-1 rounded hover:bg-muted transition-colors ${
                                star <= current.rating
                                  ? "text-amber-500 fill-amber-500"
                                  : "text-muted-foreground/30"
                              }`}
                            >
                              <Star className={`w-4 h-4 ${star <= current.rating ? "fill-amber-500" : ""}`} />
                            </button>
                          ))}
                          <span className="text-xs font-bold ml-1.5 text-foreground">
                            {current.rating} / 5
                          </span>
                        </div>
                      </div>

                      <input
                        type="text"
                        placeholder="Optional comment on this criterion..."
                        value={current.comment}
                        onChange={(e) => setCriterionComment(c.id, e.target.value)}
                        className="w-full h-7 px-2 text-[11px] bg-muted/40 rounded border text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary"
                      />
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Hiring Recommendation Radio Buttons */}
          <div className="space-y-2">
            <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground block">
              Overall Hiring Recommendation *
            </span>
            <div className="grid grid-cols-1 sm:grid-cols-5 gap-2">
              {RECOMMENDATIONS.map((r) => (
                <button
                  key={r.value}
                  type="button"
                  onClick={() => setRecommendation(r.value)}
                  className={`p-2.5 rounded-xl border text-left flex flex-col justify-between transition-all ${
                    recommendation === r.value
                      ? `${r.color} ring-2 ring-primary/40 font-bold`
                      : "bg-card hover:bg-muted/40 text-muted-foreground"
                  }`}
                >
                  <span className="text-xs font-bold block">{r.label}</span>
                  <span className="text-[10px] text-muted-foreground mt-1 line-clamp-2 leading-tight">
                    {r.desc}
                  </span>
                </button>
              ))}
            </div>
          </div>

          {/* Qualitative Strengths and Concerns */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="space-y-1">
              <label className="font-semibold text-emerald-600 dark:text-emerald-400">
                Key Strengths Demonstrated
              </label>
              <Textarea
                placeholder="What did the candidate excel at? Specific positive signals..."
                value={strengths}
                onChange={(e) => setStrengths(e.target.value)}
                className="text-xs h-20 resize-none"
              />
            </div>

            <div className="space-y-1">
              <label className="font-semibold text-destructive">
                Areas of Concern / Growth
              </label>
              <Textarea
                placeholder="Any red flags, gaps in knowledge, or areas needing validation..."
                value={concerns}
                onChange={(e) => setConcerns(e.target.value)}
                className="text-xs h-20 resize-none"
              />
            </div>
          </div>

          {/* Shared Feedback vs Private Notes */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="space-y-1">
              <label className="font-semibold text-foreground flex items-center gap-1">
                <MessageSquare className="w-3.5 h-3.5 text-primary" />
                Shared Feedback (Visible to Panel)
              </label>
              <Textarea
                placeholder="Summary thoughts shared with the rest of the interview panel..."
                value={sharedFeedback}
                onChange={(e) => setSharedFeedback(e.target.value)}
                className="text-xs h-20 resize-none"
              />
            </div>

            <div className="space-y-1">
              <label className="font-semibold text-foreground flex items-center gap-1">
                <Lock className="w-3.5 h-3.5 text-amber-500" />
                Private Notes (Recruiter & HR Only)
              </label>
              <Textarea
                placeholder="Confidential notes only visible to you and HR Head / Admins..."
                value={privateNotes}
                onChange={(e) => setPrivateNotes(e.target.value)}
                className="text-xs h-20 resize-none"
              />
            </div>
          </div>
        </div>

        <DialogFooter className="border-t pt-3">
          <Button variant="outline" onClick={() => onOpenChange(false)} className="text-xs">
            Cancel
          </Button>
          <Button
            className="text-xs font-semibold"
            onClick={() => submitMutation.mutate()}
            disabled={submitMutation.isPending}
          >
            {submitMutation.isPending ? (
              <Loader2 className="w-3.5 h-3.5 animate-spin mr-1" />
            ) : (
              <CheckCircle2 className="w-3.5 h-3.5 mr-1" />
            )}
            Submit Evaluation Scorecard
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
