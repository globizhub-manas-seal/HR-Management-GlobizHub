"use client";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
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
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/components/ToastProvider";
import {
  FileText,
  Mail,
  Phone,
  Briefcase,
  MapPin,
  ExternalLink,
  Calendar,
  CheckCircle2,
  XCircle,
  Clock,
  UserCheck,
  AlertCircle,
  Loader2,
  HelpCircle,
  Star,
  Video,
  Plus,
  Layers,
  History,
  CheckSquare,
  Award,
  Sparkles,
  ChevronRight,
  ShieldCheck,
  Banknote,
  FileCheck,
  Send,
  Edit,
  AlertTriangle,
  ArrowRight,
  Printer,
} from "lucide-react";
import { ScheduleInterviewModal } from "./ScheduleInterviewModal";
import { SubmitScorecardModal } from "./SubmitScorecardModal";
import { CreateOfferModal } from "./CreateOfferModal";
import { OfferLetterPreviewModal } from "./OfferLetterPreviewModal";
import { CandidateConversionModal } from "./CandidateConversionModal";
import { useViewMode } from "@/context/ViewModeContext";
import Link from "next/link";

interface ApplicationDetailModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  application: any;
  onSuccess?: () => void;
}

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000";

export function ApplicationDetailModal({
  open,
  onOpenChange,
  application,
  onSuccess,
}: ApplicationDetailModalProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { user, activeRole } = useViewMode();

  const isHrOrAdmin = [
    "SUPER_ADMIN",
    "OWNER",
    "HR_HEAD",
    "ADMIN",
  ].includes(activeRole || user?.role || "");

  const [activeTab, setActiveTab] = useState("overview");
  const [reviewNotes, setReviewNotes] = useState("");
  const [decisionNotes, setDecisionNotes] = useState("");

  // Sub-modals state
  const [isScheduleModalOpen, setIsScheduleModalOpen] = useState(false);
  const [selectedInterviewForScorecard, setSelectedInterviewForScorecard] = useState<any>(null);
  const [isConversionModalOpen, setIsConversionModalOpen] = useState(false);

  // Phase 4: Job Offer States
  const [isCreateOfferModalOpen, setIsCreateOfferModalOpen] = useState(false);
  const [isRevisingOffer, setIsRevisingOffer] = useState(false);
  const [isOfferLetterModalOpen, setIsOfferLetterModalOpen] = useState(false);
  const [selectedOfferVersionIndex, setSelectedOfferVersionIndex] = useState(0);

  // Offer Review (Approval / Rejection) Modal
  const [isReviewModalOpen, setIsReviewModalOpen] = useState(false);
  const [reviewAction, setReviewAction] = useState<"APPROVE" | "REJECT">("APPROVE");
  const [reviewComments, setReviewComments] = useState("");

  // Candidate Decline Modal
  const [isDeclineModalOpen, setIsDeclineModalOpen] = useState(false);
  const [declineReason, setDeclineReason] = useState("");

  // Offer Withdraw Modal
  const [isWithdrawModalOpen, setIsWithdrawModalOpen] = useState(false);
  const [withdrawalReason, setWithdrawalReason] = useState("");

  const getToken = () =>
    typeof window !== "undefined" ? localStorage.getItem("hrms_token") : null;

  // Phase 4: Fetch Candidate Offer & Versions
  const { data: jobOffer, isLoading: loadingOffer } = useQuery({
    queryKey: ["candidateOffer", application?.id],
    queryFn: async () => {
      if (!application?.id) return null;
      const res = await axios.get(
        `${API_URL}/recruitment/applications/${application.id}/offer`,
        { headers: { Authorization: `Bearer ${getToken()}` } }
      );
      return res.data;
    },
    enabled: !!application?.id && open,
  });

  // Offer Action Mutations
  const submitOfferMutation = useMutation({
    mutationFn: async () => {
      const res = await axios.post(
        `${API_URL}/recruitment/offers/${jobOffer.id}/submit`,
        {},
        { headers: { Authorization: `Bearer ${getToken()}` } }
      );
      return res.data;
    },
    onSuccess: () => {
      toast("Offer submitted for internal CTC approval", "success");
      queryClient.invalidateQueries({ queryKey: ["candidateOffer", application.id] });
      queryClient.invalidateQueries({ queryKey: ["candidateTimeline", application.id] });
    },
    onError: (err: any) => {
      toast(err.response?.data?.message || "Failed to submit offer", "error");
    },
  });

  const reviewOfferMutation = useMutation({
    mutationFn: async () => {
      const res = await axios.post(
        `${API_URL}/recruitment/offers/${jobOffer.id}/review`,
        { action: reviewAction, comments: reviewComments || undefined },
        { headers: { Authorization: `Bearer ${getToken()}` } }
      );
      return res.data;
    },
    onSuccess: () => {
      toast(
        reviewAction === "APPROVE" ? "Offer CTC approved!" : "Offer draft rejected.",
        "success"
      );
      setIsReviewModalOpen(false);
      setReviewComments("");
      queryClient.invalidateQueries({ queryKey: ["candidateOffer", application.id] });
      queryClient.invalidateQueries({ queryKey: ["candidateTimeline", application.id] });
    },
    onError: (err: any) => {
      toast(err.response?.data?.message || "Failed to review offer", "error");
    },
  });

  const sendOfferMutation = useMutation({
    mutationFn: async () => {
      const res = await axios.post(
        `${API_URL}/recruitment/offers/${jobOffer.id}/send`,
        {},
        { headers: { Authorization: `Bearer ${getToken()}` } }
      );
      return res.data;
    },
    onSuccess: () => {
      toast("Offer sent to candidate! Application status is now OFFER", "success");
      queryClient.invalidateQueries({ queryKey: ["candidateOffer", application.id] });
      queryClient.invalidateQueries({ queryKey: ["candidateTimeline", application.id] });
      queryClient.invalidateQueries({ queryKey: ["companyApplications"] });
      onSuccess?.();
    },
    onError: (err: any) => {
      toast(err.response?.data?.message || "Failed to send offer", "error");
    },
  });

  const recordResponseMutation = useMutation({
    mutationFn: async (responseType: "ACCEPTED" | "DECLINED") => {
      const res = await axios.post(
        `${API_URL}/recruitment/offers/${jobOffer.id}/response`,
        {
          response: responseType,
          declineReason: responseType === "DECLINED" ? declineReason : undefined,
        },
        { headers: { Authorization: `Bearer ${getToken()}` } }
      );
      return res.data;
    },
    onSuccess: (_, responseType) => {
      if (responseType === "ACCEPTED") {
        toast("Offer accepted! Candidate is ready for Onboarding (Phase 5).", "success");
      } else {
        toast("Candidate decline recorded.", "success");
        setIsDeclineModalOpen(false);
        setDeclineReason("");
      }
      queryClient.invalidateQueries({ queryKey: ["candidateOffer", application.id] });
      queryClient.invalidateQueries({ queryKey: ["candidateTimeline", application.id] });
      queryClient.invalidateQueries({ queryKey: ["companyApplications"] });
      queryClient.invalidateQueries({ queryKey: ["recruitmentStats"] });
      onSuccess?.();
    },
    onError: (err: any) => {
      toast(err.response?.data?.message || "Failed to record response", "error");
    },
  });

  const withdrawOfferMutation = useMutation({
    mutationFn: async () => {
      const res = await axios.post(
        `${API_URL}/recruitment/offers/${jobOffer.id}/withdraw`,
        { reason: withdrawalReason },
        { headers: { Authorization: `Bearer ${getToken()}` } }
      );
      return res.data;
    },
    onSuccess: () => {
      toast("Offer withdrawn.", "success");
      setIsWithdrawModalOpen(false);
      setWithdrawalReason("");
      queryClient.invalidateQueries({ queryKey: ["candidateOffer", application.id] });
      queryClient.invalidateQueries({ queryKey: ["candidateTimeline", application.id] });
      queryClient.invalidateQueries({ queryKey: ["companyApplications"] });
      onSuccess?.();
    },
    onError: (err: any) => {
      toast(err.response?.data?.message || "Failed to withdraw offer", "error");
    },
  });

  // 1. Fetch Candidate Interviews
  const { data: interviews, isLoading: loadingInterviews } = useQuery({
    queryKey: ["candidateInterviews", application?.id],
    queryFn: async () => {
      if (!application?.id) return [];
      const res = await axios.get(
        `${API_URL}/recruitment/applications/${application.id}/interviews`,
        { headers: { Authorization: `Bearer ${getToken()}` } }
      );
      return res.data;
    },
    enabled: !!application?.id && open,
  });

  // 2. Fetch Job Configured Rounds
  const { data: rounds } = useQuery({
    queryKey: ["interviewRounds", application?.jobRequisitionId],
    queryFn: async () => {
      if (!application?.jobRequisitionId) return [];
      const res = await axios.get(
        `${API_URL}/recruitment/jobs/${application.jobRequisitionId}/interview-rounds`,
        { headers: { Authorization: `Bearer ${getToken()}` } }
      );
      return res.data;
    },
    enabled: !!application?.jobRequisitionId && open,
  });

  // 3. Fetch Candidate Activity Timeline
  const { data: timelineData, isLoading: loadingTimeline } = useQuery({
    queryKey: ["candidateTimeline", application?.id],
    queryFn: async () => {
      if (!application?.id) return null;
      const res = await axios.get(
        `${API_URL}/recruitment/applications/${application.id}/timeline`,
        { headers: { Authorization: `Bearer ${getToken()}` } }
      );
      return res.data;
    },
    enabled: !!application?.id && open,
  });

  // 4. Update Status Mutation (Phase 2 stages: SCREENING, SHORTLISTED, REJECTED)
  const statusMutation = useMutation({
    mutationFn: async ({ status, notes }: { status: string; notes?: string }) => {
      const res = await axios.patch(
        `${API_URL}/recruitment/applications/${application.id}/status`,
        { status, reviewNotes: notes },
        { headers: { Authorization: `Bearer ${getToken()}` } }
      );
      return res.data;
    },
    onSuccess: (data) => {
      toast(`Application status updated to ${data.status}`, "success");
      setReviewNotes("");
      queryClient.invalidateQueries({ queryKey: ["companyApplications"] });
      queryClient.invalidateQueries({ queryKey: ["recruitmentStats"] });
      queryClient.invalidateQueries({ queryKey: ["candidateTimeline", application.id] });
      onSuccess?.();
    },
    onError: (err: any) => {
      toast(err.response?.data?.message || "Failed to update application status", "error");
    },
  });

  // 5. Final Decision Mutation (SELECTED / REJECTED)
  const decisionMutation = useMutation({
    mutationFn: async (decision: "SELECTED" | "REJECTED") => {
      const res = await axios.post(
        `${API_URL}/recruitment/applications/${application.id}/decision`,
        { decision, notes: decisionNotes || undefined },
        { headers: { Authorization: `Bearer ${getToken()}` } }
      );
      return res.data;
    },
    onSuccess: (data) => {
      toast(`Candidate successfully marked as ${data.status}`, "success");
      setDecisionNotes("");
      queryClient.invalidateQueries({ queryKey: ["companyApplications"] });
      queryClient.invalidateQueries({ queryKey: ["recruitmentStats"] });
      queryClient.invalidateQueries({ queryKey: ["candidateTimeline", application.id] });
      onSuccess?.();
      onOpenChange(false);
    },
    onError: (err: any) => {
      toast(err.response?.data?.message || "Failed to record hiring decision", "error");
    },
  });

  // 6. Complete / Update Interview Status Mutation
  const interviewStatusMutation = useMutation({
    mutationFn: async ({
      interviewId,
      status,
    }: {
      interviewId: string;
      status: string;
    }) => {
      const res = await axios.patch(
        `${API_URL}/recruitment/interviews/${interviewId}/status`,
        { status },
        { headers: { Authorization: `Bearer ${getToken()}` } }
      );
      return res.data;
    },
    onSuccess: (data) => {
      toast(`Interview status updated to ${data.status}`, "success");
      queryClient.invalidateQueries({ queryKey: ["candidateInterviews", application.id] });
      queryClient.invalidateQueries({ queryKey: ["candidateTimeline", application.id] });
    },
    onError: (err: any) => {
      toast(err.response?.data?.message || "Failed to update interview", "error");
    },
  });

  if (!application) return null;

  const candidate = application.candidate || {};
  const job = application.jobRequisition || {};
  const screeningAnswers = (application.screeningAnswers as Record<string, any>) || {};
  const questions = (job.screeningQuestions as Array<any>) || [];

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "APPLIED":
        return <Badge variant="outline" className="bg-blue-500/10 text-blue-600 border-blue-500/20 font-bold">Applied</Badge>;
      case "SCREENING":
        return <Badge variant="outline" className="bg-amber-500/10 text-amber-600 border-amber-500/20 font-bold">In Screening</Badge>;
      case "SHORTLISTED":
        return <Badge variant="outline" className="bg-emerald-500/10 text-emerald-600 border-emerald-500/20 font-bold">Shortlisted</Badge>;
      case "INTERVIEW":
        return <Badge variant="outline" className="bg-purple-500/10 text-purple-600 border-purple-500/20 font-bold">Interviewing</Badge>;
      case "SELECTED":
        return <Badge variant="outline" className="bg-emerald-600/15 text-emerald-700 dark:text-emerald-400 border-emerald-500/30 font-bold">Selected (Ready for Offer)</Badge>;
      case "OFFER":
        return <Badge variant="outline" className="bg-indigo-600/15 text-indigo-700 dark:text-indigo-400 border-indigo-500/30 font-bold">Offer Sent</Badge>;
      case "OFFER_ACCEPTED":
        return <Badge variant="outline" className="bg-emerald-600/20 text-emerald-800 dark:text-emerald-300 border-emerald-600 font-bold">Offer Accepted 🎉</Badge>;
      case "HIRED":
        return <Badge variant="outline" className="bg-emerald-700 text-white font-black shadow-sm">Hired / Onboarding 🌟</Badge>;
      case "REJECTED":
        return <Badge variant="outline" className="bg-destructive/10 text-destructive border-destructive/20 font-bold">Rejected</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  const getOfferStatusBadge = (status: string) => {
    switch (status) {
      case "DRAFT":
        return <Badge variant="outline" className="bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-300">Draft</Badge>;
      case "PENDING_APPROVAL":
        return <Badge variant="outline" className="bg-amber-50 dark:bg-amber-950 text-amber-700 dark:text-amber-400 border-amber-300">Pending Approval</Badge>;
      case "APPROVED":
        return <Badge variant="outline" className="bg-emerald-50 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-400 border-emerald-300 font-bold">Approved</Badge>;
      case "REJECTED":
        return <Badge variant="outline" className="bg-rose-50 dark:bg-rose-950 text-rose-700 dark:text-rose-400 border-rose-300 font-bold">Rejected by HR</Badge>;
      case "SENT":
        return <Badge variant="outline" className="bg-blue-50 dark:bg-blue-950 text-blue-700 dark:text-blue-400 border-blue-300 font-bold">Offer Sent</Badge>;
      case "ACCEPTED":
        return <Badge variant="outline" className="bg-emerald-100 dark:bg-emerald-900 text-emerald-800 dark:text-emerald-200 border-emerald-500 font-bold">Accepted 🎉</Badge>;
      case "DECLINED":
        return <Badge variant="outline" className="bg-rose-100 dark:bg-rose-900 text-rose-800 dark:text-rose-200 border-rose-400">Declined by Candidate</Badge>;
      case "EXPIRED":
        return <Badge variant="outline" className="bg-amber-100 dark:bg-amber-900 text-amber-800 dark:text-amber-200 border-amber-400">Expired</Badge>;
      case "WITHDRAWN":
        return <Badge variant="outline" className="bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300 border-slate-400">Withdrawn</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  const getInterviewStatusBadge = (status: string) => {
    switch (status) {
      case "SCHEDULED":
        return <Badge variant="outline" className="bg-blue-500/10 text-blue-600 border-blue-500/20 font-semibold">Scheduled</Badge>;
      case "CONFIRMED":
        return <Badge variant="outline" className="bg-cyan-500/10 text-cyan-600 border-cyan-500/20 font-semibold">Confirmed</Badge>;
      case "IN_PROGRESS":
        return <Badge variant="outline" className="bg-amber-500/10 text-amber-600 border-amber-500/20 font-semibold">In Progress</Badge>;
      case "COMPLETED":
        return <Badge variant="outline" className="bg-emerald-500/10 text-emerald-600 border-emerald-500/20 font-semibold">Completed</Badge>;
      case "RESCHEDULED":
        return <Badge variant="outline" className="bg-purple-500/10 text-purple-600 border-purple-500/20 font-semibold">Rescheduled</Badge>;
      case "CANCELLED":
        return <Badge variant="outline" className="bg-destructive/10 text-destructive border-destructive/20">Cancelled</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  const STAGES = ["APPLIED", "SCREENING", "SHORTLISTED", "INTERVIEW", "SELECTED", "OFFER", "OFFER_ACCEPTED", "HIRED"];
  const currentStageIndex = STAGES.indexOf(application.status);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-4xl max-h-[92vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex flex-wrap items-center justify-between gap-2 border-b pb-3">
            <div className="flex items-center gap-2">
              <span className="font-mono text-xs font-bold text-primary px-2 py-0.5 bg-primary/10 rounded-md">
                {application.applicationNumber}
              </span>
              <span className="text-xs text-muted-foreground">
                for <strong className="text-foreground">{job.title || "Position"}</strong> ({job.jobCode})
              </span>
            </div>
            <div>{getStatusBadge(application.status)}</div>
          </div>

          {/* Candidate Name & Title */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pt-2">
            <div>
              <DialogTitle className="text-xl font-bold flex items-center gap-2">
                {candidate.firstName} {candidate.lastName}
                {candidate.currentTitle && (
                  <span className="text-sm font-normal text-muted-foreground">
                    • {candidate.currentTitle}
                  </span>
                )}
              </DialogTitle>
              <DialogDescription className="text-xs">
                Applied on {new Date(application.createdAt).toLocaleDateString()} via{" "}
                <span className="font-semibold text-foreground">Globizhub Careers</span>
              </DialogDescription>
            </div>
          </div>

          {/* Visual Lifecycle Stepper */}
          <div className="pt-3">
            <div className="flex items-center justify-between bg-muted/40 p-2 rounded-xl border">
              {STAGES.map((st, idx) => {
                const isPassed = currentStageIndex >= idx;
                const isCurrent = application.status === st;
                return (
                  <div key={st} className="flex items-center gap-1.5 text-xs">
                    <span
                      className={`w-5 h-5 rounded-full flex items-center justify-center font-bold text-[10px] ${
                        isCurrent
                          ? "bg-primary text-primary-foreground ring-2 ring-primary/40"
                          : isPassed
                          ? "bg-emerald-500 text-white"
                          : "bg-muted text-muted-foreground"
                      }`}
                    >
                      {idx + 1}
                    </span>
                    <span
                      className={`hidden sm:inline font-semibold text-[11px] ${
                        isCurrent
                          ? "text-primary font-bold"
                          : isPassed
                          ? "text-foreground"
                          : "text-muted-foreground"
                      }`}
                    >
                      {st === "INTERVIEW" ? "Interview" : st.charAt(0) + st.slice(1).toLowerCase()}
                    </span>
                    {idx < STAGES.length - 1 && (
                      <ChevronRight className="w-3.5 h-3.5 text-muted-foreground/50 mx-1 hidden sm:inline" />
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          {/* PHASE 5: ACTION REQUIRED OR HIRED CELEBRATION BANNERS */}
          {application.status === "OFFER_ACCEPTED" && (
            <div className="mt-3 rounded-xl border border-emerald-500/30 bg-emerald-500/10 p-3.5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
              <div className="flex items-center gap-2.5">
                <div className="h-9 w-9 rounded-full bg-emerald-500 text-white flex items-center justify-center shrink-0 shadow-md">
                  <Sparkles className="h-5 w-5" />
                </div>
                <div>
                  <p className="font-bold text-sm text-emerald-900 dark:text-emerald-100">
                    Candidate Accepted Employment Offer! 🎉
                  </p>
                  <p className="text-xs text-emerald-700 dark:text-emerald-300">
                    Ready to assign official Employee ID, seed payroll salary structure, and provision onboarding checklist.
                  </p>
                </div>
              </div>
              {isHrOrAdmin && (
                <Button
                  onClick={() => setIsConversionModalOpen(true)}
                  className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold shrink-0 shadow-sm gap-2 text-xs h-9"
                >
                  <UserCheck className="h-4 w-4" />
                  Onboard as Employee
                </Button>
              )}
            </div>
          )}

          {application.status === "HIRED" && (
            <div className="mt-3 rounded-xl border border-blue-500/30 bg-blue-500/10 p-3.5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
              <div className="flex items-center gap-2.5">
                <div className="h-9 w-9 rounded-full bg-blue-600 text-white flex items-center justify-center shrink-0 shadow-md">
                  <ShieldCheck className="h-5 w-5" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <p className="font-bold text-sm text-blue-900 dark:text-blue-100">
                      Hired & Onboarding Underway 🌟
                    </p>
                    {application.employee?.employeeCode && (
                      <Badge variant="outline" className="font-mono font-bold bg-background text-foreground">
                        {application.employee.employeeCode}
                      </Badge>
                    )}
                  </div>
                  <p className="text-xs text-blue-700 dark:text-blue-300">
                    Employee record provisioned in ONBOARDING status. Direct payroll seeded from verified offer.
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                <Button asChild variant="outline" size="sm" className="h-8 text-xs">
                  <Link href="/workspace/employees">Employee Directory</Link>
                </Button>
                <Button asChild size="sm" className="bg-blue-600 hover:bg-blue-700 text-white font-bold h-8 text-xs">
                  <Link href="/workspace/onboarding">Onboarding Hub</Link>
                </Button>
              </div>
            </div>
          )}
        </DialogHeader>

        {/* 6-Tab Navigation Console */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4 pt-2">
          <TabsList className="bg-muted/60 p-1 border grid grid-cols-6 text-xs">
            <TabsTrigger value="overview" className="text-xs font-semibold">
              Overview
            </TabsTrigger>
            <TabsTrigger value="screening" className="text-xs font-semibold">
              Screening ({questions.length})
            </TabsTrigger>
            <TabsTrigger value="interviews" className="text-xs font-semibold flex items-center gap-1">
              Interviews
              {interviews && interviews.length > 0 && (
                <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-primary/10 text-primary font-bold">
                  {interviews.length}
                </span>
              )}
            </TabsTrigger>
            <TabsTrigger value="evaluation" className="text-xs font-semibold flex items-center gap-1">
              Scorecards
            </TabsTrigger>
            <TabsTrigger value="offer" className="text-xs font-semibold flex items-center gap-1">
              <Banknote className="w-3.5 h-3.5 text-indigo-500" />
              Offer & CTC
              {jobOffer && (
                <span className="text-[9px] px-1.5 py-0.2 rounded-full bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 font-bold">
                  v{jobOffer.currentVersion}
                </span>
              )}
            </TabsTrigger>
            <TabsTrigger value="timeline" className="text-xs font-semibold flex items-center gap-1">
              <History className="w-3 h-3" />
              Timeline
            </TabsTrigger>
          </TabsList>

          {/* TAB 1: OVERVIEW & RESUME */}
          <TabsContent value="overview" className="space-y-4 text-xs">
            {/* Candidate Details Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 p-3.5 bg-muted/30 rounded-xl border">
              <div className="flex items-center gap-2">
                <Mail className="w-4 h-4 text-muted-foreground shrink-0" />
                <div className="overflow-hidden">
                  <span className="text-muted-foreground block text-[10px]">Email</span>
                  <a
                    href={`mailto:${candidate.email}`}
                    className="font-semibold text-primary hover:underline truncate block"
                  >
                    {candidate.email}
                  </a>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <Phone className="w-4 h-4 text-muted-foreground shrink-0" />
                <div>
                  <span className="text-muted-foreground block text-[10px]">Phone</span>
                  <span className="font-semibold text-foreground">
                    {candidate.phone || "Not provided"}
                  </span>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <Briefcase className="w-4 h-4 text-muted-foreground shrink-0" />
                <div>
                  <span className="text-muted-foreground block text-[10px]">Total Experience</span>
                  <span className="font-semibold text-foreground">
                    {candidate.totalExperienceYears !== undefined && candidate.totalExperienceYears !== null
                      ? `${candidate.totalExperienceYears} Years`
                      : "Not specified"}
                  </span>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <MapPin className="w-4 h-4 text-muted-foreground shrink-0" />
                <div>
                  <span className="text-muted-foreground block text-[10px]">Current Location</span>
                  <span className="font-semibold text-foreground">
                    {candidate.currentLocation || "Not provided"}
                  </span>
                </div>
              </div>

              {candidate.currentCompany && (
                <div className="flex items-center gap-2">
                  <Briefcase className="w-4 h-4 text-muted-foreground shrink-0" />
                  <div>
                    <span className="text-muted-foreground block text-[10px]">Current Employer</span>
                    <span className="font-semibold text-foreground">{candidate.currentCompany}</span>
                  </div>
                </div>
              )}

              <div className="flex items-center gap-2">
                <FileText className="w-4 h-4 text-primary shrink-0" />
                <div>
                  <span className="text-muted-foreground block text-[10px]">Resume File</span>
                  {application.resumeUrl ? (
                    <a
                      href={application.resumeUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="font-bold text-primary hover:underline flex items-center gap-1"
                    >
                      View Resume Document <ExternalLink className="w-3 h-3 inline" />
                    </a>
                  ) : (
                    <span className="text-muted-foreground italic">No resume file uploaded</span>
                  )}
                </div>
              </div>
            </div>

            {/* Social Links */}
            {(candidate.linkedinUrl || candidate.portfolioUrl) && (
              <div className="flex items-center gap-4 px-1">
                {candidate.linkedinUrl && (
                  <a
                    href={candidate.linkedinUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="text-xs text-blue-600 hover:underline flex items-center gap-1 font-medium"
                  >
                    <ExternalLink className="w-3 h-3" /> LinkedIn Profile
                  </a>
                )}
                {candidate.portfolioUrl && (
                  <a
                    href={candidate.portfolioUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="text-xs text-primary hover:underline flex items-center gap-1 font-medium"
                  >
                    <ExternalLink className="w-3 h-3" /> Portfolio / Website
                  </a>
                )}
              </div>
            )}

            {/* Cover Letter */}
            {application.coverLetter && (
              <div className="space-y-1.5">
                <span className="text-xs font-bold uppercase tracking-wider block text-muted-foreground">
                  Cover Note / Letter
                </span>
                <p className="p-3 bg-card border rounded-lg text-foreground whitespace-pre-line leading-relaxed">
                  {application.coverLetter}
                </p>
              </div>
            )}

            {/* Stage Transition Box (For APPLIED or SCREENING) */}
            {(application.status === "APPLIED" || application.status === "SCREENING") && (
              <div className="p-4 bg-muted/40 border rounded-xl space-y-3">
                <span className="text-xs font-bold uppercase tracking-wider block text-foreground">
                  Recruiter Screening Actions
                </span>

                <Textarea
                  placeholder="Screening notes or comments..."
                  value={reviewNotes}
                  onChange={(e) => setReviewNotes(e.target.value)}
                  className="text-xs h-16 bg-background resize-none"
                />

                <div className="flex flex-wrap items-center gap-2 pt-1">
                  {application.status === "APPLIED" && (
                    <Button
                      size="sm"
                      className="text-xs font-semibold bg-amber-600 hover:bg-amber-700 text-white"
                      onClick={() =>
                        statusMutation.mutate({
                          status: "SCREENING",
                          notes: reviewNotes || undefined,
                        })
                      }
                      disabled={statusMutation.isPending}
                    >
                      <Clock className="w-3.5 h-3.5 mr-1" /> Move to Screening
                    </Button>
                  )}

                  <Button
                    size="sm"
                    className="text-xs font-semibold bg-emerald-600 hover:bg-emerald-700 text-white"
                    onClick={() =>
                      statusMutation.mutate({
                        status: "SHORTLISTED",
                        notes: reviewNotes || undefined,
                      })
                    }
                    disabled={statusMutation.isPending}
                  >
                    <CheckCircle2 className="w-3.5 h-3.5 mr-1" /> Shortlist Candidate
                  </Button>

                  <Button
                    size="sm"
                    variant="outline"
                    className="text-xs font-semibold text-destructive border-destructive/30 hover:bg-destructive/10"
                    onClick={() =>
                      statusMutation.mutate({
                        status: "REJECTED",
                        notes: reviewNotes || undefined,
                      })
                    }
                    disabled={statusMutation.isPending}
                  >
                    <XCircle className="w-3.5 h-3.5 mr-1" /> Reject
                  </Button>
                </div>
              </div>
            )}
          </TabsContent>

          {/* TAB 2: SCREENING QUESTIONS */}
          <TabsContent value="screening" className="space-y-3 text-xs">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
                <HelpCircle className="w-3.5 h-3.5" />
                Screening Questions Scorecard
              </span>
              <span className="text-[11px] text-muted-foreground">
                {questions.length} question{questions.length === 1 ? "" : "s"}
              </span>
            </div>

            {questions.length === 0 ? (
              <div className="p-4 text-center border rounded-xl bg-card text-muted-foreground text-xs italic">
                No custom screening questions configured for this job vacancy.
              </div>
            ) : (
              <div className="space-y-2.5">
                {questions.map((q, idx) => {
                  const rawAnswer = screeningAnswers[q.id];
                  const answerStr =
                    rawAnswer === true
                      ? "Yes"
                      : rawAnswer === false
                      ? "No"
                      : rawAnswer !== undefined && rawAnswer !== null && rawAnswer !== ""
                      ? String(rawAnswer)
                      : "No answer provided";

                  return (
                    <div key={q.id || idx} className="p-3.5 bg-card rounded-xl border space-y-1.5">
                      <div className="flex items-start justify-between gap-2">
                        <span className="font-semibold text-foreground">
                          {idx + 1}. {q.question}
                        </span>
                        <div className="flex items-center gap-1.5 shrink-0">
                          <Badge variant="outline" className="text-[10px] uppercase">
                            {q.type}
                          </Badge>
                          {q.required && (
                            <Badge variant="secondary" className="text-[10px]">
                              Required
                            </Badge>
                          )}
                        </div>
                      </div>
                      <div className="pt-1 flex items-center gap-2">
                        <span className="text-[11px] text-muted-foreground font-medium">
                          Candidate Answer:
                        </span>
                        <span className="px-2.5 py-0.5 bg-muted rounded-md font-bold text-foreground">
                          {answerStr}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </TabsContent>

          {/* TAB 3: INTERVIEWS */}
          <TabsContent value="interviews" className="space-y-4 text-xs">
            {/* Top Toolbar */}
            <div className="flex flex-wrap items-center justify-between gap-2 p-3 bg-muted/30 border rounded-xl">
              <div className="flex items-center gap-2">
                <Layers className="w-4 h-4 text-primary" />
                <span className="font-semibold text-foreground">
                  Interview Sessions ({interviews?.length || 0})
                </span>
              </div>

              {(application.status === "SHORTLISTED" || application.status === "INTERVIEW") && (
                <Button
                  size="sm"
                  className="text-xs font-semibold"
                  onClick={() => setIsScheduleModalOpen(true)}
                >
                  <Plus className="w-3.5 h-3.5 mr-1" /> Schedule Interview
                </Button>
              )}
            </div>

            {/* Interviews List */}
            {loadingInterviews ? (
              <div className="py-10 text-center text-xs text-muted-foreground">
                <Loader2 className="w-5 h-5 animate-spin mx-auto mb-2 text-primary" />
                Loading interview sessions...
              </div>
            ) : !interviews || interviews.length === 0 ? (
              <div className="py-10 text-center border rounded-xl bg-card space-y-2 text-xs text-muted-foreground">
                <Video className="w-8 h-8 mx-auto text-muted-foreground/40 mb-1" />
                <p className="font-semibold text-foreground">No interviews scheduled yet</p>
                <p className="text-[11px]">
                  Click <strong>Schedule Interview</strong> above to schedule an interview round for this candidate.
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                {interviews.map((item: any) => {
                  const startTime = new Date(item.scheduledAt);
                  const isCompleted = item.status === "COMPLETED";

                  return (
                    <div
                      key={item.id}
                      className="p-4 bg-card border rounded-xl space-y-3 shadow-xs"
                    >
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b pb-2.5">
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-sm text-foreground">
                            {item.interviewRound?.name || "Interview Round"}
                          </span>
                          <Badge variant="outline" className="text-[10px] uppercase font-bold">
                            {item.interviewRound?.type}
                          </Badge>
                          {getInterviewStatusBadge(item.status)}
                        </div>

                        {/* Action buttons */}
                        <div className="flex items-center gap-1.5 shrink-0">
                          {item.status !== "COMPLETED" && item.status !== "CANCELLED" && (
                            <Button
                              size="sm"
                              variant="outline"
                              className="h-7 text-xs font-semibold text-emerald-600 border-emerald-500/30 hover:bg-emerald-500/10"
                              onClick={() =>
                                interviewStatusMutation.mutate({
                                  interviewId: item.id,
                                  status: "COMPLETED",
                                })
                              }
                              disabled={interviewStatusMutation.isPending}
                            >
                              <CheckCircle2 className="w-3.5 h-3.5 mr-1" /> Mark Completed
                            </Button>
                          )}

                          <Button
                            size="sm"
                            className="h-7 text-xs font-semibold"
                            onClick={() => setSelectedInterviewForScorecard(item)}
                          >
                            <Star className="w-3.5 h-3.5 mr-1 text-amber-400" />
                            {item.scorecards?.length > 0 ? "View / Submit Scorecard" : "Submit Scorecard"}
                          </Button>
                        </div>
                      </div>

                      {/* Details Grid */}
                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-[11px]">
                        <div className="flex items-center gap-2">
                          <Calendar className="w-3.5 h-3.5 text-primary shrink-0" />
                          <div>
                            <span className="text-muted-foreground block text-[10px]">Date & Time</span>
                            <span className="font-semibold text-foreground">
                              {startTime.toLocaleString("en-US", {
                                dateStyle: "medium",
                                timeStyle: "short",
                              })}
                            </span>
                          </div>
                        </div>

                        <div className="flex items-center gap-2">
                          <Clock className="w-3.5 h-3.5 text-primary shrink-0" />
                          <div>
                            <span className="text-muted-foreground block text-[10px]">Duration & Mode</span>
                            <span className="font-semibold text-foreground">
                              {item.durationMinutes} min • {item.mode}
                            </span>
                          </div>
                        </div>

                        <div className="flex items-center gap-2">
                          <Video className="w-3.5 h-3.5 text-primary shrink-0" />
                          <div className="overflow-hidden">
                            <span className="text-muted-foreground block text-[10px]">Meeting Info</span>
                            {item.meetingLink ? (
                              <a
                                href={item.meetingLink}
                                target="_blank"
                                rel="noreferrer"
                                className="font-semibold text-primary hover:underline truncate block"
                              >
                                Join Video Call <ExternalLink className="w-2.5 h-2.5 inline" />
                              </a>
                            ) : item.location ? (
                              <span className="font-semibold text-foreground truncate block">
                                {item.location}
                              </span>
                            ) : (
                              <span className="text-muted-foreground italic">No link provided</span>
                            )}
                          </div>
                        </div>
                      </div>

                      {/* Assigned Interviewers & Scorecards */}
                      <div className="pt-2 border-t flex flex-wrap items-center justify-between gap-2">
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <span className="text-[10px] text-muted-foreground font-semibold uppercase mr-1">
                            Panel:
                          </span>
                          {item.interviewers?.map((inv: any) => (
                            <span
                              key={inv.id}
                              className="px-2 py-0.5 rounded-md bg-muted/60 text-[10px] font-medium text-foreground flex items-center gap-1"
                            >
                              {inv.employee?.firstName} {inv.employee?.lastName}
                              <span className="text-[9px] text-muted-foreground">
                                ({inv.role})
                              </span>
                            </span>
                          ))}
                        </div>

                        {item.scorecards && item.scorecards.length > 0 && (
                          <div className="flex items-center gap-1.5">
                            <span className="text-[10px] font-semibold text-emerald-600 dark:text-emerald-400">
                              {item.scorecards.length} Scorecard{item.scorecards.length === 1 ? "" : "s"} Submitted
                            </span>
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </TabsContent>

          {/* TAB 4: EVALUATION & SCORECARDS */}
          <TabsContent value="evaluation" className="space-y-4 text-xs">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
                <Award className="w-3.5 h-3.5" />
                Interviewer Scorecards Summary
              </span>
            </div>

            {loadingInterviews ? (
              <div className="py-8 text-center text-xs text-muted-foreground">
                <Loader2 className="w-5 h-5 animate-spin mx-auto mb-2 text-primary" />
                Loading evaluation scorecards...
              </div>
            ) : !interviews || interviews.every((i: any) => !i.scorecards || i.scorecards.length === 0) ? (
              <div className="py-10 text-center border rounded-xl bg-card space-y-2 text-xs text-muted-foreground">
                <Star className="w-8 h-8 mx-auto text-muted-foreground/40 mb-1" />
                <p className="font-semibold text-foreground">No scorecards submitted yet</p>
                <p className="text-[11px]">
                  Interviewers can submit evaluation scorecards for scheduled rounds under the <strong>Interviews</strong> tab.
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                {interviews.flatMap((iv: any) =>
                  (iv.scorecards || []).map((sc: any) => (
                    <div
                      key={sc.id}
                      className="p-4 bg-card border rounded-xl space-y-2.5 shadow-xs"
                    >
                      <div className="flex flex-wrap items-center justify-between gap-2 border-b pb-2">
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-sm text-foreground">
                            {sc.interviewer?.firstName} {sc.interviewer?.lastName}
                          </span>
                          <span className="text-muted-foreground text-xs">
                            for <strong>{iv.interviewRound?.name}</strong>
                          </span>
                        </div>

                        <div className="flex items-center gap-2">
                          <Badge
                            variant="outline"
                            className="bg-primary/10 text-primary border-primary/20 font-bold"
                          >
                            ⭐ {sc.overallRating}/5 Rating
                          </Badge>
                          <Badge
                            variant="outline"
                            className="bg-emerald-500/10 text-emerald-600 border-emerald-500/20 font-bold"
                          >
                            {sc.recommendation}
                          </Badge>
                        </div>
                      </div>

                      {sc.sharedFeedback && (
                        <div>
                          <span className="text-[10px] font-bold text-muted-foreground uppercase block mb-0.5">
                            Shared Feedback
                          </span>
                          <p className="text-foreground bg-muted/30 p-2 rounded border">
                            {sc.sharedFeedback}
                          </p>
                        </div>
                      )}

                      {sc.strengths && (
                        <div>
                          <span className="text-[10px] font-bold text-emerald-600 uppercase block mb-0.5">
                            Strengths
                          </span>
                          <p className="text-foreground">{sc.strengths}</p>
                        </div>
                      )}

                      {sc.concerns && (
                        <div>
                          <span className="text-[10px] font-bold text-destructive uppercase block mb-0.5">
                            Concerns
                          </span>
                          <p className="text-foreground">{sc.concerns}</p>
                        </div>
                      )}
                    </div>
                  ))
                )}
              </div>
            )}
          </TabsContent>

          {/* TAB 5: TIMELINE */}
          <TabsContent value="timeline" className="space-y-4 text-xs">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
                <History className="w-3.5 h-3.5" />
                Immutable Candidate Journey Timeline
              </span>
            </div>

            {loadingTimeline ? (
              <div className="py-8 text-center text-xs text-muted-foreground">
                <Loader2 className="w-5 h-5 animate-spin mx-auto mb-2 text-primary" />
                Loading activity trail...
              </div>
            ) : !timelineData || !timelineData.activities || timelineData.activities.length === 0 ? (
              <div className="p-4 text-center border rounded-xl bg-card text-muted-foreground text-xs italic">
                No activity records found for this candidate yet.
              </div>
            ) : (
              <div className="relative pl-6 border-l-2 border-muted space-y-6 my-2">
                {timelineData.activities.map((act: any) => {
                  const dateStr = new Date(act.createdAt).toLocaleString("en-US", {
                    dateStyle: "medium",
                    timeStyle: "short",
                  });

                  return (
                    <div key={act.id} className="relative group">
                      {/* Timeline Dot */}
                      <span className="absolute -left-[31px] top-1 w-3.5 h-3.5 rounded-full bg-primary ring-4 ring-background" />

                      <div className="space-y-1">
                        <div className="flex flex-wrap items-center justify-between gap-1">
                          <span className="font-bold text-sm text-foreground">
                            {act.title}
                          </span>
                          <span className="text-[10px] text-muted-foreground font-mono">
                            {dateStr}
                          </span>
                        </div>

                        {act.description && (
                          <p className="text-foreground leading-relaxed">
                            {act.description}
                          </p>
                        )}

                        {act.performedBy && (
                          <span className="text-[10px] text-muted-foreground block pt-0.5">
                            By: {act.performedBy.firstName} {act.performedBy.lastName} ({act.performedBy.role})
                          </span>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </TabsContent>

          {/* TAB 5: OFFER & CTC MANAGEMENT */}
          <TabsContent value="offer" className="space-y-4 text-xs">
            {loadingOffer ? (
              <div className="py-12 flex flex-col items-center justify-center text-muted-foreground gap-2">
                <Loader2 className="w-6 h-6 animate-spin text-primary" />
                <span>Loading candidate offer details...</span>
              </div>
            ) : !jobOffer ? (
              <div className="py-12 text-center rounded-xl border border-dashed border-slate-200 dark:border-slate-800 p-8 space-y-4">
                <div className="h-12 w-12 rounded-full bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 flex items-center justify-center mx-auto">
                  <Banknote className="h-6 w-6" />
                </div>
                <div className="max-w-md mx-auto space-y-1">
                  <h4 className="font-bold text-base text-slate-900 dark:text-slate-100">
                    No Job Offer Formulated Yet
                  </h4>
                  <p className="text-xs text-slate-500">
                    {application.status === "SELECTED"
                      ? "This candidate has passed evaluation and is marked SELECTED. Formulate an employment offer to structure their CTC, allowances, and schedule."
                      : "Job offer formulation becomes available once the candidate successfully completes interviews and is marked as SELECTED."}
                  </p>
                </div>
                {application.status === "SELECTED" && (
                  <Button
                    onClick={() => {
                      setIsRevisingOffer(false);
                      setIsCreateOfferModalOpen(true);
                    }}
                    className="bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-xs"
                  >
                    <Plus className="w-3.5 h-3.5 mr-1.5" /> Formulate Job Offer & CTC
                  </Button>
                )}
              </div>
            ) : (
              (() => {
                const activeVersion =
                  jobOffer.versions?.[selectedOfferVersionIndex] ||
                  jobOffer.versions?.[0];
                if (!activeVersion) return null;

                return (
                  <div className="space-y-4">
                    {/* Version Switcher Bar & Current Status */}
                    <div className="flex flex-wrap items-center justify-between gap-2 p-3 bg-muted/30 rounded-xl border">
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-sm text-foreground">
                          {jobOffer.offerCode}
                        </span>
                        {getOfferStatusBadge(activeVersion.status)}
                        {activeVersion.isBudgetException && (
                          <Badge variant="outline" className="bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-400 border-amber-300 text-[10px]">
                            Budget Exception
                          </Badge>
                        )}
                      </div>

                      {/* Multi-Version History Selector */}
                      {jobOffer.versions.length > 1 && (
                        <div className="flex items-center gap-1.5">
                          <span className="text-[11px] text-muted-foreground font-medium">
                            Version History:
                          </span>
                          {jobOffer.versions.map((v: any, vIdx: number) => (
                            <Button
                              key={v.id}
                              size="sm"
                              variant={selectedOfferVersionIndex === vIdx ? "default" : "outline"}
                              onClick={() => setSelectedOfferVersionIndex(vIdx)}
                              className="h-6 text-[11px] px-2 font-mono"
                            >
                              v{v.version} {v.status === "APPROVED" ? "✓" : ""}
                            </Button>
                          ))}
                        </div>
                      )}
                    </div>

                    {/* KPI Summary Cards */}
                    <div className="grid grid-cols-2 lg:grid-cols-4 gap-3.5">
                      <div className="p-3.5 rounded-xl bg-slate-900 text-white dark:bg-slate-900 border border-slate-800 shadow-sm flex flex-col justify-between">
                        <span className="text-[11px] uppercase tracking-wider text-slate-400 block font-semibold truncate">
                          Total Annual CTC
                        </span>
                        <span className="text-lg font-bold font-mono text-emerald-400 mt-1">
                          ₹{activeVersion.totalCtc?.toLocaleString()}
                        </span>
                      </div>

                      <div className="p-3.5 rounded-xl bg-muted/40 border shadow-sm flex flex-col justify-between">
                        <span className="text-[11px] uppercase tracking-wider text-muted-foreground block font-semibold truncate">
                          Monthly Gross
                        </span>
                        <span className="text-base font-bold font-mono text-foreground mt-1">
                          ₹{activeVersion.grossMonthly?.toLocaleString()}
                        </span>
                      </div>

                      <div className="p-3.5 rounded-xl bg-emerald-500/10 border border-emerald-500/20 shadow-sm flex flex-col justify-between">
                        <span className="text-[11px] uppercase tracking-wider text-emerald-700 dark:text-emerald-400 block font-semibold truncate">
                          Net Take-Home
                        </span>
                        <div className="flex items-baseline gap-1 mt-1">
                          <span className="text-base font-bold font-mono text-emerald-700 dark:text-emerald-400">
                            ₹{activeVersion.netMonthly?.toLocaleString()}
                          </span>
                          <span className="text-[10px] font-normal text-muted-foreground">/mo</span>
                        </div>
                      </div>

                      <div className="p-3.5 rounded-xl bg-muted/40 border shadow-sm flex flex-col justify-between">
                        <span className="text-[11px] uppercase tracking-wider text-muted-foreground block font-semibold truncate">
                          Expected Joining
                        </span>
                        <span className="text-sm font-bold text-foreground mt-1">
                          {new Date(activeVersion.joiningDate).toLocaleDateString(undefined, {
                            day: "2-digit",
                            month: "short",
                            year: "numeric",
                          })}
                        </span>
                      </div>
                    </div>

                    {/* Revision Reason Callout (if present on this version) */}
                    {activeVersion.revisionReason && (
                      <div className="p-3 rounded-lg bg-amber-500/10 border border-amber-500/20 text-xs text-amber-800 dark:text-amber-300">
                        <strong>Revision Notes (v{activeVersion.version}):</strong> {activeVersion.revisionReason}
                      </div>
                    )}

                    {/* Approver Feedback Callout (if rejected or approved with notes) */}
                    {activeVersion.reviewNotes && (
                      <div
                        className={`p-3 rounded-lg text-xs border ${
                          activeVersion.status === "REJECTED"
                            ? "bg-rose-500/10 border-rose-500/20 text-rose-800 dark:text-rose-300"
                            : "bg-emerald-500/10 border-emerald-500/20 text-emerald-800 dark:text-emerald-300"
                        }`}
                      >
                        <strong>
                          Approver Review ({activeVersion.reviewedBy?.firstName || "Management"}):
                        </strong>{" "}
                        {activeVersion.reviewNotes}
                      </div>
                    )}

                    {/* Budget Exception Callout */}
                    {activeVersion.isBudgetException && activeVersion.budgetJustification && (
                      <div className="p-3 rounded-lg bg-amber-500/10 border border-amber-500/20 text-xs text-amber-800 dark:text-amber-300">
                        <strong>Budget Exception Justification:</strong> {activeVersion.budgetJustification}
                      </div>
                    )}

                    {/* Candidate Decline Callout */}
                    {jobOffer.status === "DECLINED" && jobOffer.declineReason && (
                      <div className="p-3 rounded-lg bg-rose-500/10 border border-rose-500/20 text-xs text-rose-800 dark:text-rose-300">
                        <strong>Candidate Decline Reason:</strong> {jobOffer.declineReason}
                      </div>
                    )}

                    {/* Withdrawal Reason Callout */}
                    {jobOffer.status === "WITHDRAWN" && jobOffer.withdrawalReason && (
                      <div className="p-3 rounded-lg bg-slate-500/10 border border-slate-500/20 text-xs text-slate-700 dark:text-slate-300">
                        <strong>Withdrawal Justification:</strong> {jobOffer.withdrawalReason}
                      </div>
                    )}

                    {/* Annexure-A Compensation Breakdown Table */}
                    <div className="rounded-xl border overflow-hidden">
                      <div className="bg-muted/40 px-3 py-2 border-b flex items-center justify-between">
                        <span className="font-bold text-xs uppercase tracking-wider text-muted-foreground">
                          Annexure-A Compensation Breakdown (v{activeVersion.version})
                        </span>
                        <span className="text-[11px] font-mono text-muted-foreground">
                          SalaryStructure Parity
                        </span>
                      </div>
                      <table className="w-full text-xs">
                        <tbody className="divide-y divide-border">
                          <tr className="bg-muted/10">
                            <td className="py-1.5 px-3 font-medium">Basic Salary</td>
                            <td className="py-1.5 px-3 text-right font-mono">₹{activeVersion.basicSalary?.toLocaleString()}/mo</td>
                            <td className="py-1.5 px-3 text-right font-mono text-muted-foreground">₹{(activeVersion.basicSalary * 12)?.toLocaleString()}/yr</td>
                          </tr>
                          <tr>
                            <td className="py-1.5 px-3 font-medium">HRA</td>
                            <td className="py-1.5 px-3 text-right font-mono">₹{(activeVersion.hra || 0)?.toLocaleString()}/mo</td>
                            <td className="py-1.5 px-3 text-right font-mono text-muted-foreground">₹{((activeVersion.hra || 0) * 12)?.toLocaleString()}/yr</td>
                          </tr>
                          <tr className="bg-muted/10">
                            <td className="py-1.5 px-3 font-medium">Conveyance Allowance</td>
                            <td className="py-1.5 px-3 text-right font-mono">₹{(activeVersion.conveyanceAllowance || 0)?.toLocaleString()}/mo</td>
                            <td className="py-1.5 px-3 text-right font-mono text-muted-foreground">₹{((activeVersion.conveyanceAllowance || 0) * 12)?.toLocaleString()}/yr</td>
                          </tr>
                          <tr>
                            <td className="py-1.5 px-3 font-medium">Medical Allowance</td>
                            <td className="py-1.5 px-3 text-right font-mono">₹{(activeVersion.medicalAllowance || 0)?.toLocaleString()}/mo</td>
                            <td className="py-1.5 px-3 text-right font-mono text-muted-foreground">₹{((activeVersion.medicalAllowance || 0) * 12)?.toLocaleString()}/yr</td>
                          </tr>
                          <tr className="bg-muted/10">
                            <td className="py-1.5 px-3 font-medium">Special Allowance</td>
                            <td className="py-1.5 px-3 text-right font-mono">₹{(activeVersion.specialAllowance || 0)?.toLocaleString()}/mo</td>
                            <td className="py-1.5 px-3 text-right font-mono text-muted-foreground">₹{((activeVersion.specialAllowance || 0) * 12)?.toLocaleString()}/yr</td>
                          </tr>
                          {activeVersion.otherAllowances > 0 && (
                            <tr>
                              <td className="py-1.5 px-3 font-medium">Other Allowances</td>
                              <td className="py-1.5 px-3 text-right font-mono">₹{activeVersion.otherAllowances?.toLocaleString()}/mo</td>
                              <td className="py-1.5 px-3 text-right font-mono text-muted-foreground">₹{(activeVersion.otherAllowances * 12)?.toLocaleString()}/yr</td>
                            </tr>
                          )}
                          <tr className="bg-indigo-50/50 dark:bg-indigo-950/30 font-bold">
                            <td className="py-2 px-3">Gross Monthly Earnings</td>
                            <td className="py-2 px-3 text-right font-mono text-indigo-600 dark:text-indigo-400">₹{activeVersion.grossMonthly?.toLocaleString()}</td>
                            <td className="py-2 px-3 text-right font-mono text-indigo-600 dark:text-indigo-400">₹{activeVersion.annualGross?.toLocaleString()}</td>
                          </tr>
                          <tr>
                            <td className="py-1.5 px-3 text-muted-foreground">Less: PF Employee Contribution</td>
                            <td className="py-1.5 px-3 text-right font-mono text-rose-600">- ₹{(activeVersion.pfContribution || 0)?.toLocaleString()}</td>
                            <td className="py-1.5 px-3 text-right font-mono text-rose-600">- ₹{((activeVersion.pfContribution || 0) * 12)?.toLocaleString()}</td>
                          </tr>
                          <tr className="bg-muted/10">
                            <td className="py-1.5 px-3 text-muted-foreground">Less: Professional Tax (PT)</td>
                            <td className="py-1.5 px-3 text-right font-mono text-rose-600">- ₹{(activeVersion.professionalTax || 0)?.toLocaleString()}</td>
                            <td className="py-1.5 px-3 text-right font-mono text-rose-600">- ₹{((activeVersion.professionalTax || 0) * 12)?.toLocaleString()}</td>
                          </tr>
                          <tr className="bg-emerald-50/50 dark:bg-emerald-950/30 font-bold text-emerald-800 dark:text-emerald-300">
                            <td className="py-2 px-3">Net In-Hand Take-Home</td>
                            <td className="py-2 px-3 text-right font-mono">₹{activeVersion.netMonthly?.toLocaleString()}</td>
                            <td className="py-2 px-3 text-right font-mono">₹{(activeVersion.netMonthly * 12)?.toLocaleString()}</td>
                          </tr>
                          {activeVersion.annualPerformanceBonus > 0 && (
                            <tr>
                              <td className="py-1.5 px-3 font-medium">Annual Performance Bonus (Variable)</td>
                              <td className="py-1.5 px-3 text-right font-mono text-muted-foreground">—</td>
                              <td className="py-1.5 px-3 text-right font-mono">₹{activeVersion.annualPerformanceBonus?.toLocaleString()}</td>
                            </tr>
                          )}
                          {activeVersion.joiningBonus > 0 && (
                            <tr className="bg-muted/10">
                              <td className="py-1.5 px-3 font-medium">One-Time Sign-on / Joining Bonus</td>
                              <td className="py-1.5 px-3 text-right font-mono text-muted-foreground">—</td>
                              <td className="py-1.5 px-3 text-right font-mono">₹{activeVersion.joiningBonus?.toLocaleString()}</td>
                            </tr>
                          )}
                          <tr className="bg-slate-900 text-white font-black">
                            <td className="py-2 px-3 uppercase tracking-wider">Total Annual CTC</td>
                            <td className="py-2 px-3 text-right font-mono text-slate-400">—</td>
                            <td className="py-2 px-3 text-right font-mono text-emerald-400">₹{activeVersion.totalCtc?.toLocaleString()}</td>
                          </tr>
                        </tbody>
                      </table>
                    </div>

                    {/* Governance Action Bar */}
                    <div className="p-3.5 bg-muted/30 rounded-xl border flex flex-wrap items-center justify-between gap-3">
                      <div className="text-xs text-muted-foreground">
                        Status: <strong className="text-foreground">{activeVersion.status}</strong> • Created:{" "}
                        {new Date(activeVersion.createdAt).toLocaleDateString()}
                      </div>

                      <div className="flex flex-wrap items-center gap-2">
                        {/* DRAFT ACTIONS */}
                        {activeVersion.status === "DRAFT" && (
                          <>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => {
                                setIsRevisingOffer(false);
                                setIsCreateOfferModalOpen(true);
                              }}
                              className="text-xs h-8"
                            >
                              <Edit className="w-3.5 h-3.5 mr-1" /> Edit Draft
                            </Button>
                            <Button
                              size="sm"
                              onClick={() => submitOfferMutation.mutate()}
                              disabled={submitOfferMutation.isPending}
                              className="bg-indigo-600 hover:bg-indigo-700 text-white text-xs h-8 font-semibold"
                            >
                              {submitOfferMutation.isPending ? (
                                <Loader2 className="w-3.5 h-3.5 animate-spin mr-1" />
                              ) : (
                                <Send className="w-3.5 h-3.5 mr-1" />
                              )}
                              Submit for Internal Approval
                            </Button>
                          </>
                        )}

                        {/* PENDING APPROVAL ACTIONS */}
                        {activeVersion.status === "PENDING_APPROVAL" && (
                          <>
                            {isHrOrAdmin ? (
                              <>
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() => {
                                    setReviewAction("REJECT");
                                    setIsReviewModalOpen(true);
                                  }}
                                  className="text-xs h-8 text-rose-600 border-rose-300 hover:bg-rose-50"
                                >
                                  <XCircle className="w-3.5 h-3.5 mr-1" /> Reject Offer
                                </Button>
                                <Button
                                  size="sm"
                                  onClick={() => {
                                    setReviewAction("APPROVE");
                                    setIsReviewModalOpen(true);
                                  }}
                                  className="bg-emerald-600 hover:bg-emerald-700 text-white text-xs h-8 font-semibold"
                                >
                                  <CheckCircle2 className="w-3.5 h-3.5 mr-1" /> Approve Offer CTC
                                </Button>
                              </>
                            ) : (
                              <span className="text-xs text-amber-600 font-semibold italic">
                                Awaiting HR Head Approval
                              </span>
                            )}
                          </>
                        )}

                        {/* REJECTED ACTIONS */}
                        {activeVersion.status === "REJECTED" && (
                          <Button
                            size="sm"
                            onClick={() => {
                              setIsRevisingOffer(true);
                              setIsCreateOfferModalOpen(true);
                            }}
                            className="bg-indigo-600 hover:bg-indigo-700 text-white text-xs h-8 font-semibold"
                          >
                            <Edit className="w-3.5 h-3.5 mr-1" /> Revise Offer (v{jobOffer.currentVersion + 1})
                          </Button>
                        )}

                        {/* APPROVED ACTIONS */}
                        {activeVersion.status === "APPROVED" && (
                          <>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => setIsOfferLetterModalOpen(true)}
                              className="text-xs h-8"
                            >
                              <FileCheck className="w-3.5 h-3.5 mr-1" /> Preview Offer Letter
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => setIsWithdrawModalOpen(true)}
                              className="text-xs h-8 text-slate-600"
                            >
                              Withdraw
                            </Button>
                            <Button
                              size="sm"
                              onClick={() => sendOfferMutation.mutate()}
                              disabled={sendOfferMutation.isPending}
                              className="bg-indigo-600 hover:bg-indigo-700 text-white text-xs h-8 font-semibold"
                            >
                              {sendOfferMutation.isPending ? (
                                <Loader2 className="w-3.5 h-3.5 animate-spin mr-1" />
                              ) : (
                                <Send className="w-3.5 h-3.5 mr-1" />
                              )}
                              Send Offer to Candidate
                            </Button>
                          </>
                        )}

                        {/* SENT ACTIONS */}
                        {activeVersion.status === "SENT" && (
                          <>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => setIsOfferLetterModalOpen(true)}
                              className="text-xs h-8"
                            >
                              <FileCheck className="w-3.5 h-3.5 mr-1" /> View Letter
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => setIsWithdrawModalOpen(true)}
                              className="text-xs h-8 text-slate-600"
                            >
                              Withdraw
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => setIsDeclineModalOpen(true)}
                              className="text-xs h-8 text-rose-600 border-rose-300 hover:bg-rose-50"
                            >
                              Record Decline
                            </Button>
                            <Button
                              size="sm"
                              onClick={() => recordResponseMutation.mutate("ACCEPTED")}
                              disabled={recordResponseMutation.isPending}
                              className="bg-emerald-600 hover:bg-emerald-700 text-white text-xs h-8 font-semibold"
                            >
                              {recordResponseMutation.isPending ? (
                                <Loader2 className="w-3.5 h-3.5 animate-spin mr-1" />
                              ) : (
                                <CheckCircle2 className="w-3.5 h-3.5 mr-1" />
                              )}
                              Record Acceptance 🎉
                            </Button>
                          </>
                        )}

                        {/* ACCEPTED ACTIONS */}
                        {activeVersion.status === "ACCEPTED" && (
                          <div className="flex items-center gap-2">
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => setIsOfferLetterModalOpen(true)}
                              className="text-xs h-8"
                            >
                              <FileCheck className="w-3.5 h-3.5 mr-1" /> View Accepted Offer
                            </Button>
                            {application.status === "HIRED" ? (
                              <Badge className="bg-emerald-700 text-white font-black text-xs py-1 px-2.5">
                                Onboarded as Employee 🌟
                              </Badge>
                            ) : (
                              isHrOrAdmin && (
                                <Button
                                  size="sm"
                                  onClick={() => setIsConversionModalOpen(true)}
                                  className="bg-emerald-600 hover:bg-emerald-700 text-white text-xs h-8 font-bold gap-1.5 shadow-sm"
                                >
                                  <UserCheck className="w-3.5 h-3.5" />
                                  Onboard as Employee
                                </Button>
                              )
                            )}
                          </div>
                        )}

                        {/* DECLINED / EXPIRED ACTIONS */}
                        {(activeVersion.status === "DECLINED" || activeVersion.status === "EXPIRED") && (
                          <Button
                            size="sm"
                            onClick={() => {
                              setIsRevisingOffer(true);
                              setIsCreateOfferModalOpen(true);
                            }}
                            className="bg-indigo-600 hover:bg-indigo-700 text-white text-xs h-8 font-semibold"
                          >
                            <Edit className="w-3.5 h-3.5 mr-1" /> Counter-Propose / Revise (v{jobOffer.currentVersion + 1})
                          </Button>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })()
            )}
          </TabsContent>
        </Tabs>

        {/* CANDIDATE FINAL HIRING DECISION BAR (When in INTERVIEW stage) */}
        {application.status === "INTERVIEW" && (
          <div className="p-4 bg-emerald-500/10 border border-emerald-500/20 rounded-xl space-y-3 mt-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-emerald-800 dark:text-emerald-400 uppercase tracking-wider flex items-center gap-1.5">
                <ShieldCheck className="w-4 h-4" />
                Final Candidate Selection Decision
              </span>
              <span className="text-[11px] text-muted-foreground">
                All rounds reviewed • Ready for final decision
              </span>
            </div>

            <Textarea
              placeholder="Add final selection notes or reason for hiring decision..."
              value={decisionNotes}
              onChange={(e) => setDecisionNotes(e.target.value)}
              className="text-xs h-14 bg-background resize-none"
            />

            <div className="flex items-center justify-between pt-1">
              <span className="text-[11px] text-muted-foreground">
                Selecting candidate will advance status to <strong>SELECTED</strong> (Ready for Phase 4 Offer Management).
              </span>

              <div className="flex items-center gap-2">
                <Button
                  size="sm"
                  variant="outline"
                  className="text-xs font-semibold text-destructive border-destructive/30 hover:bg-destructive/10"
                  onClick={() => decisionMutation.mutate("REJECTED")}
                  disabled={decisionMutation.isPending}
                >
                  <XCircle className="w-3.5 h-3.5 mr-1" /> Reject Candidate
                </Button>

                <Button
                  size="sm"
                  className="text-xs font-semibold bg-emerald-600 hover:bg-emerald-700 text-white shadow-sm"
                  onClick={() => decisionMutation.mutate("SELECTED")}
                  disabled={decisionMutation.isPending}
                >
                  {decisionMutation.isPending ? (
                    <Loader2 className="w-3.5 h-3.5 animate-spin mr-1" />
                  ) : (
                    <Award className="w-3.5 h-3.5 mr-1" />
                  )}
                  Mark as Selected (Ready for Offer)
                </Button>
              </div>
            </div>
          </div>
        )}

        {/* CANDIDATE SELECTED BANNER: PROMPT TO FORMULATE OFFER */}
        {application.status === "SELECTED" && !jobOffer && (
          <div className="p-4 bg-indigo-500/10 border border-indigo-500/20 rounded-xl flex items-center justify-between mt-2">
            <div>
              <span className="text-xs font-bold text-indigo-900 dark:text-indigo-300 uppercase tracking-wider flex items-center gap-1.5">
                <Banknote className="w-4 h-4 text-indigo-600" />
                Candidate Selected • Formulate Job Offer
              </span>
              <p className="text-[11px] text-muted-foreground mt-0.5">
                Candidate is approved for hiring. You can now structure their CTC compensation and generate their offer letter.
              </p>
            </div>
            <Button
              size="sm"
              onClick={() => {
                setIsRevisingOffer(false);
                setIsCreateOfferModalOpen(true);
              }}
              className="bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-xs shrink-0"
            >
              <Plus className="w-3.5 h-3.5 mr-1" /> Formulate Job Offer
            </Button>
          </div>
        )}

        <DialogFooter className="border-t pt-3">
          <Button variant="outline" onClick={() => onOpenChange(false)} className="text-xs">
            Close
          </Button>
        </DialogFooter>
      </DialogContent>

      {/* Sub-Modal: Schedule Interview */}
      <ScheduleInterviewModal
        open={isScheduleModalOpen}
        onOpenChange={setIsScheduleModalOpen}
        application={application}
        rounds={rounds || []}
        onSuccess={() => {
          queryClient.invalidateQueries({ queryKey: ["candidateInterviews", application.id] });
          queryClient.invalidateQueries({ queryKey: ["candidateTimeline", application.id] });
        }}
      />

      {/* Sub-Modal: Submit Scorecard */}
      {selectedInterviewForScorecard && (
        <SubmitScorecardModal
          open={!!selectedInterviewForScorecard}
          onOpenChange={(op) => !op && setSelectedInterviewForScorecard(null)}
          interview={selectedInterviewForScorecard}
          onSuccess={() => {
            queryClient.invalidateQueries({ queryKey: ["candidateInterviews", application.id] });
            queryClient.invalidateQueries({ queryKey: ["candidateTimeline", application.id] });
          }}
        />
      )}

      {/* Phase 4 Sub-Modal: Create / Revise Job Offer */}
      <CreateOfferModal
        open={isCreateOfferModalOpen}
        onOpenChange={setIsCreateOfferModalOpen}
        application={application}
        existingOffer={isRevisingOffer ? jobOffer : undefined}
        onSuccess={() => {
          queryClient.invalidateQueries({ queryKey: ["candidateOffer", application.id] });
          queryClient.invalidateQueries({ queryKey: ["candidateTimeline", application.id] });
          queryClient.invalidateQueries({ queryKey: ["companyApplications"] });
        }}
      />

      {/* Phase 4 Sub-Modal: Offer Letter Preview */}
      {jobOffer && (
        <OfferLetterPreviewModal
          open={isOfferLetterModalOpen}
          onOpenChange={setIsOfferLetterModalOpen}
          offer={jobOffer}
          versionData={jobOffer.versions?.[selectedOfferVersionIndex]}
        />
      )}

      {/* Phase 4 Sub-Modal: Review Offer (Approve / Reject) */}
      <Dialog open={isReviewModalOpen} onOpenChange={setIsReviewModalOpen}>
        <DialogContent className="max-w-md p-5 space-y-4">
          <DialogHeader>
            <DialogTitle className="text-base font-bold flex items-center gap-2">
              {reviewAction === "APPROVE" ? (
                <>
                  <CheckCircle2 className="w-5 h-5 text-emerald-600" />
                  Approve Offer CTC Package
                </>
              ) : (
                <>
                  <XCircle className="w-5 h-5 text-rose-600" />
                  Reject Offer Draft
                </>
              )}
            </DialogTitle>
            <DialogDescription className="text-xs">
              {reviewAction === "APPROVE"
                ? "Confirm compensation and CTC breakdown approval for this candidate."
                : "Provide feedback explaining why this offer draft is rejected and what needs revision."}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-foreground">
              Review Notes / Feedback {reviewAction === "REJECT" && <span className="text-rose-500">*</span>}
            </label>
            <Textarea
              rows={3}
              value={reviewComments}
              onChange={(e) => setReviewComments(e.target.value)}
              placeholder={
                reviewAction === "APPROVE"
                  ? "Optional approval notes..."
                  : "Explain required changes (e.g. reduce variable bonus, align base with band)..."
              }
              className="text-xs"
            />
          </div>

          <DialogFooter className="pt-2">
            <Button variant="outline" size="sm" onClick={() => setIsReviewModalOpen(false)}>
              Cancel
            </Button>
            <Button
              size="sm"
              onClick={() => {
                if (reviewAction === "REJECT" && !reviewComments.trim()) {
                  toast("Please provide feedback for rejection", "error");
                  return;
                }
                reviewOfferMutation.mutate();
              }}
              disabled={reviewOfferMutation.isPending}
              className={
                reviewAction === "APPROVE"
                  ? "bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-xs"
                  : "bg-rose-600 hover:bg-rose-700 text-white font-semibold text-xs"
              }
            >
              {reviewOfferMutation.isPending && (
                <Loader2 className="w-3.5 h-3.5 animate-spin mr-1" />
              )}
              {reviewAction === "APPROVE" ? "Confirm Approval" : "Confirm Rejection"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Phase 4 Sub-Modal: Record Candidate Decline */}
      <Dialog open={isDeclineModalOpen} onOpenChange={setIsDeclineModalOpen}>
        <DialogContent className="max-w-md p-5 space-y-4">
          <DialogHeader>
            <DialogTitle className="text-base font-bold flex items-center gap-2 text-rose-600">
              <XCircle className="w-5 h-5" />
              Record Candidate Offer Decline
            </DialogTitle>
            <DialogDescription className="text-xs">
              Record candidate feedback on why the offer was declined.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-foreground">
              Decline Reason / Candidate Notes
            </label>
            <Textarea
              rows={3}
              value={declineReason}
              onChange={(e) => setDeclineReason(e.target.value)}
              placeholder="e.g. Accepted another counter-offer, location relocation mismatch, compensation expectation..."
              className="text-xs"
            />
          </div>

          <DialogFooter className="pt-2">
            <Button variant="outline" size="sm" onClick={() => setIsDeclineModalOpen(false)}>
              Cancel
            </Button>
            <Button
              size="sm"
              onClick={() => recordResponseMutation.mutate("DECLINED")}
              disabled={recordResponseMutation.isPending}
              className="bg-rose-600 hover:bg-rose-700 text-white font-semibold text-xs"
            >
              {recordResponseMutation.isPending && (
                <Loader2 className="w-3.5 h-3.5 animate-spin mr-1" />
              )}
              Record Decline
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Phase 4 Sub-Modal: Withdraw Offer */}
      <Dialog open={isWithdrawModalOpen} onOpenChange={setIsWithdrawModalOpen}>
        <DialogContent className="max-w-md p-5 space-y-4">
          <DialogHeader>
            <DialogTitle className="text-base font-bold flex items-center gap-2 text-slate-800 dark:text-slate-200">
              <AlertTriangle className="w-5 h-5 text-amber-500" />
              Withdraw Job Offer
            </DialogTitle>
            <DialogDescription className="text-xs">
              Rescind this offer. The application will be rolled back to SELECTED stage.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-foreground">
              Withdrawal Justification <span className="text-rose-500">*</span>
            </label>
            <Textarea
              rows={3}
              required
              value={withdrawalReason}
              onChange={(e) => setWithdrawalReason(e.target.value)}
              placeholder="Reason for withdrawing offer..."
              className="text-xs"
            />
          </div>

          <DialogFooter className="pt-2">
            <Button variant="outline" size="sm" onClick={() => setIsWithdrawModalOpen(false)}>
              Cancel
            </Button>
            <Button
              size="sm"
              onClick={() => {
                if (!withdrawalReason.trim()) {
                  toast("Please provide withdrawal reason", "error");
                  return;
                }
                withdrawOfferMutation.mutate();
              }}
              disabled={withdrawOfferMutation.isPending}
              className="bg-slate-800 hover:bg-slate-900 text-white font-semibold text-xs"
            >
              {withdrawOfferMutation.isPending && (
                <Loader2 className="w-3.5 h-3.5 animate-spin mr-1" />
              )}
              Confirm Withdrawal
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* CANDIDATE CONVERSION & ONBOARDING MODAL (PHASE 5) */}
      <CandidateConversionModal
        open={isConversionModalOpen}
        onOpenChange={setIsConversionModalOpen}
        application={application}
        job={job}
        offer={jobOffer}
        onConverted={() => {
          queryClient.invalidateQueries({ queryKey: ["application", application.id] });
          if (onSuccess) onSuccess();
        }}
      />
    </Dialog>
  );
}
