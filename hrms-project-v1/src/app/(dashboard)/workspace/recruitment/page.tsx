"use client";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import axios from "axios";
import {
  Briefcase,
  Users,
  Clock,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  Plus,
  Search,
  History,
  Send,
  Play,
  Pause,
  Eye,
  Edit,
  Ban,
  Building,
  MapPin,
  IndianRupee,
  ChevronRight,
  Filter,
  Loader2,
  FileText,
  UserCheck,
  Layers,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { useToast } from "@/components/ToastProvider";
import { useViewMode } from "@/context/ViewModeContext";
import { NewRequisitionModal } from "@/components/recruitment/NewRequisitionModal";
import { RequisitionReviewModal } from "@/components/recruitment/RequisitionReviewModal";
import { RequisitionHistoryModal } from "@/components/recruitment/RequisitionHistoryModal";
import { CreateJobModal } from "@/components/recruitment/CreateJobModal";
import { ApplicationDetailModal } from "@/components/recruitment/ApplicationDetailModal";
import { ConfigurePipelineModal } from "@/components/recruitment/ConfigurePipelineModal";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000";

export default function RecruitmentPage() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { user, activeRole } = useViewMode();

  const currentRole = activeRole || user?.role;
  const isHrOrAdmin = ["SUPER_ADMIN", "OWNER", "HR_HEAD"].includes(currentRole);

  const [activeTab, setActiveTab] = useState("manpower");

  // Filters
  const [manpowerStatusFilter, setManpowerStatusFilter] = useState("ALL");
  const [manpowerSearch, setManpowerSearch] = useState("");

  const [jobStatusFilter, setJobStatusFilter] = useState("ALL");
  const [jobSearch, setJobSearch] = useState("");

  const [applicationStatusFilter, setApplicationStatusFilter] = useState("ALL");
  const [applicationJobFilter, setApplicationJobFilter] = useState("ALL");
  const [applicationSearch, setApplicationSearch] = useState("");
  const [selectedApplication, setSelectedApplication] = useState<any>(null);

  // Modals state
  const [isNewReqOpen, setIsNewReqOpen] = useState(false);
  const [editingReq, setEditingReq] = useState<any>(null);

  const [reviewReq, setReviewReq] = useState<any>(null);
  const [historyReqId, setHistoryReqId] = useState<string | null>(null);

  const [isCreateJobOpen, setIsCreateJobOpen] = useState(false);
  const [selectedManpowerForJob, setSelectedManpowerForJob] = useState<any>(null);

  const [viewJobModal, setViewJobModal] = useState<any>(null);
  const [configuredJobForPipeline, setConfiguredJobForPipeline] = useState<any>(null);

  const getToken = () => (typeof window !== "undefined" ? localStorage.getItem("hrms_token") : null);

  // 1. Fetch Dashboard Stats
  const { data: stats, isLoading: statsLoading } = useQuery({
    queryKey: ["recruitmentStats"],
    queryFn: async () => {
      const res = await axios.get(`${API_URL}/recruitment/manpower/stats`, {
        headers: { Authorization: `Bearer ${getToken()}` },
      });
      return res.data;
    },
  });

  // 2. Fetch Manpower Requisitions
  const { data: manpowerList, isLoading: loadingManpower } = useQuery({
    queryKey: ["manpowerRequisitions", manpowerStatusFilter, manpowerSearch],
    queryFn: async () => {
      const res = await axios.get(`${API_URL}/recruitment/manpower`, {
        params: {
          status: manpowerStatusFilter !== "ALL" ? manpowerStatusFilter : undefined,
          search: manpowerSearch || undefined,
        },
        headers: { Authorization: `Bearer ${getToken()}` },
      });
      return res.data;
    },
  });

  // 3. Fetch Job Requisitions
  const { data: jobList, isLoading: loadingJobs } = useQuery({
    queryKey: ["jobRequisitions", jobStatusFilter, jobSearch],
    queryFn: async () => {
      const res = await axios.get(`${API_URL}/recruitment/jobs`, {
        params: {
          status: jobStatusFilter !== "ALL" ? jobStatusFilter : undefined,
          search: jobSearch || undefined,
        },
        headers: { Authorization: `Bearer ${getToken()}` },
      });
      return res.data;
    },
  });

  // 4. Fetch Applications
  const { data: applicationList, isLoading: loadingApplications } = useQuery({
    queryKey: ["companyApplications", applicationStatusFilter, applicationJobFilter, applicationSearch],
    queryFn: async () => {
      const res = await axios.get(`${API_URL}/recruitment/applications`, {
        params: {
          status: applicationStatusFilter !== "ALL" ? applicationStatusFilter : undefined,
          jobRequisitionId: applicationJobFilter !== "ALL" ? applicationJobFilter : undefined,
          search: applicationSearch || undefined,
        },
        headers: { Authorization: `Bearer ${getToken()}` },
      });
      return res.data;
    },
  });

  // Manpower Actions: Submit
  const submitRequisitionMutation = useMutation({
    mutationFn: async (id: string) => {
      return axios.post(`${API_URL}/recruitment/manpower/${id}/submit`, {}, {
        headers: { Authorization: `Bearer ${getToken()}` },
      });
    },
    onSuccess: () => {
      toast("Requisition submitted for approval", "success");
      queryClient.invalidateQueries({ queryKey: ["manpowerRequisitions"] });
      queryClient.invalidateQueries({ queryKey: ["recruitmentStats"] });
    },
    onError: (err: any) => toast(err.response?.data?.message || "Failed to submit requisition", "error"),
  });

  // Manpower Actions: Cancel
  const cancelRequisitionMutation = useMutation({
    mutationFn: async (id: string) => {
      return axios.post(`${API_URL}/recruitment/manpower/${id}/cancel`, {}, {
        headers: { Authorization: `Bearer ${getToken()}` },
      });
    },
    onSuccess: () => {
      toast("Requisition cancelled", "success");
      queryClient.invalidateQueries({ queryKey: ["manpowerRequisitions"] });
      queryClient.invalidateQueries({ queryKey: ["recruitmentStats"] });
    },
    onError: (err: any) => toast(err.response?.data?.message || "Failed to cancel requisition", "error"),
  });

  // Job Actions: State machine calls
  const jobActionMutation = useMutation({
    mutationFn: async ({ id, action }: { id: string; action: string }) => {
      return axios.post(`${API_URL}/recruitment/jobs/${id}/${action}`, {}, {
        headers: { Authorization: `Bearer ${getToken()}` },
      });
    },
    onSuccess: (_, vars) => {
      toast(`Job action '${vars.action}' succeeded`, "success");
      queryClient.invalidateQueries({ queryKey: ["jobRequisitions"] });
      queryClient.invalidateQueries({ queryKey: ["recruitmentStats"] });
    },
    onError: (err: any) => toast(err.response?.data?.message || "Job action failed", "error"),
  });

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "DRAFT":
        return <Badge variant="outline" className="bg-slate-500/10 text-slate-600 border-slate-500/20">Draft</Badge>;
      case "SUBMITTED":
        return <Badge variant="outline" className="bg-blue-500/10 text-blue-600 border-blue-500/20 font-semibold">Submitted</Badge>;
      case "UNDER_REVIEW":
        return <Badge variant="outline" className="bg-amber-500/10 text-amber-600 border-amber-500/20 font-semibold">Under Review</Badge>;
      case "CHANGES_REQUESTED":
        return <Badge variant="outline" className="bg-orange-500/10 text-orange-600 border-orange-500/20 font-semibold">Changes Needed</Badge>;
      case "APPROVED":
        return <Badge variant="outline" className="bg-emerald-500/10 text-emerald-600 border-emerald-500/20 font-semibold">Approved</Badge>;
      case "REJECTED":
        return <Badge variant="outline" className="bg-destructive/10 text-destructive border-destructive/20 font-semibold">Rejected</Badge>;
      case "CANCELLED":
        return <Badge variant="outline" className="bg-muted text-muted-foreground">Cancelled</Badge>;
      case "PENDING_APPROVAL":
        return <Badge variant="outline" className="bg-purple-500/10 text-purple-600 border-purple-500/20 font-semibold">Pending Approval</Badge>;
      case "PUBLISHED":
        return <Badge variant="outline" className="bg-emerald-500/10 text-emerald-600 border-emerald-500/20 font-semibold">Published</Badge>;
      case "PAUSED":
        return <Badge variant="outline" className="bg-amber-500/10 text-amber-600 border-amber-500/20 font-semibold">Paused</Badge>;
      case "CLOSED":
        return <Badge variant="outline" className="bg-slate-500/10 text-slate-600 border-slate-500/20">Closed</Badge>;
      case "APPLIED":
        return <Badge variant="outline" className="bg-blue-500/10 text-blue-600 border-blue-500/20 font-bold">Applied</Badge>;
      case "SCREENING":
        return <Badge variant="outline" className="bg-amber-500/10 text-amber-600 border-amber-500/20 font-bold">Screening</Badge>;
      case "SHORTLISTED":
        return <Badge variant="outline" className="bg-emerald-500/10 text-emerald-600 border-emerald-500/20 font-bold">Shortlisted</Badge>;
      case "INTERVIEW":
        return <Badge variant="outline" className="bg-purple-500/10 text-purple-600 border-purple-500/20 font-bold">Interviewing</Badge>;
      case "SELECTED":
        return <Badge variant="outline" className="bg-emerald-600/15 text-emerald-700 dark:text-emerald-400 border-emerald-500/30 font-bold">Selected</Badge>;
      case "OFFER":
        return <Badge variant="outline" className="bg-indigo-600/15 text-indigo-700 dark:text-indigo-400 border-indigo-500/30 font-bold">Offer Sent</Badge>;
      case "OFFER_ACCEPTED":
        return <Badge variant="outline" className="bg-emerald-600/20 text-emerald-800 dark:text-emerald-300 border-emerald-600 font-bold">Offer Accepted 🎉</Badge>;
      case "HIRED":
        return <Badge variant="outline" className="bg-emerald-700 text-white font-black shadow-sm">Hired 🌟</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  return (
    <div className="space-y-6 pb-12 px-6 py-2">
      {/* Header Section */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b pb-5">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold tracking-tight text-foreground">
              Recruitment & Hiring
            </h1>
           
          </div>
          <p className="text-xs text-muted-foreground mt-1">
            Enterprise requisition governance: Manpower justification &rarr; Budget review &rarr; Job vacancies.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <Button
            variant="outline"
            onClick={() => {
              setSelectedManpowerForJob(null);
              setIsCreateJobOpen(true);
            }}
            className="text-xs font-semibold"
          >
            <Briefcase className="w-3.5 h-3.5 mr-1.5" />
            Create Job Vacancy
          </Button>

          <Button
            onClick={() => {
              setEditingReq(null);
              setIsNewReqOpen(true);
            }}
            className="text-xs font-semibold shadow-sm"
          >
            <Plus className="w-4 h-4 mr-1" />
            Request Manpower
          </Button>
        </div>
      </div>

      {/* KPI Cards (4 Metric Cards matching requirement #10) */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="border-border shadow-xs">
          <CardHeader className="pb-2">
            <CardDescription className="text-xs font-medium uppercase tracking-wider">
              Open Requisitions
            </CardDescription>
            <CardTitle className="text-2xl font-black text-foreground">
              {statsLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : stats?.openRequisitions ?? 0}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <span className="text-[11px] text-muted-foreground">Active workforce requests</span>
          </CardContent>
        </Card>

        <Card className="border-border shadow-xs">
          <CardHeader className="pb-2">
            <CardDescription className="text-xs font-medium uppercase tracking-wider">
              Pending Approval
            </CardDescription>
            <CardTitle className="text-2xl font-black text-amber-600 dark:text-amber-400">
              {statsLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : stats?.pendingApprovals ?? 0}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <span className="text-[11px] text-muted-foreground">Awaiting review or decision</span>
          </CardContent>
        </Card>

        <Card className="border-border shadow-xs">
          <CardHeader className="pb-2">
            <CardDescription className="text-xs font-medium uppercase tracking-wider">
              Open Positions
            </CardDescription>
            <CardTitle className="text-2xl font-black text-primary">
              {statsLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : stats?.openPositions ?? 0}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <span className="text-[11px] text-muted-foreground">Headcount in active jobs</span>
          </CardContent>
        </Card>

        <Card className="border-border shadow-xs">
          <CardHeader className="pb-2">
            <CardDescription className="text-xs font-medium uppercase tracking-wider">
              Positions Filled
            </CardDescription>
            <CardTitle className="text-2xl font-black text-emerald-600 dark:text-emerald-400">
              {statsLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : stats?.positionsFilled ?? 0}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <span className="text-[11px] text-muted-foreground">Successful candidate placements</span>
          </CardContent>
        </Card>
      </div>

      {/* Main Tabs Hub */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
        <TabsList className="bg-muted/60 p-1 border">
          <TabsTrigger value="manpower" className="text-xs font-bold gap-2">
            <Users className="w-3.5 h-3.5" />
            Manpower Requisitions
            {manpowerList && (
              <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-background font-semibold">
                {manpowerList.length}
              </span>
            )}
          </TabsTrigger>
          <TabsTrigger value="jobs" className="text-xs font-bold gap-2">
            <Briefcase className="w-3.5 h-3.5" />
            Job Requisitions & Vacancies
            {jobList && (
              <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-background font-semibold">
                {jobList.length}
              </span>
            )}
          </TabsTrigger>
          <TabsTrigger value="applications" className="text-xs font-bold gap-2">
            <UserCheck className="w-3.5 h-3.5" />
            Candidates & Applications
            {applicationList && (
              <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-background font-semibold">
                {applicationList.length}
              </span>
            )}
          </TabsTrigger>
        </TabsList>

        {/* TAB 1: MANPOWER REQUISITIONS */}
        <TabsContent value="manpower" className="space-y-4">
          {/* Filter Toolbar */}
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3 p-3 bg-card rounded-xl border">
            <div className="relative w-full sm:w-80">
              <Search className="w-4 h-4 absolute left-3 top-2.5 text-muted-foreground" />
              <Input
                placeholder="Search requisition #, role, dept..."
                className="pl-9 h-9 text-xs"
                value={manpowerSearch}
                onChange={(e) => setManpowerSearch(e.target.value)}
              />
            </div>

            <div className="flex items-center gap-2 w-full sm:w-auto">
              <span className="text-xs text-muted-foreground whitespace-nowrap">Status:</span>
              <Select value={manpowerStatusFilter} onValueChange={(val) => setManpowerStatusFilter(val || "ALL")}>
                <SelectTrigger className="h-9 text-xs w-[160px]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ALL">All Statuses</SelectItem>
                  <SelectItem value="DRAFT">Draft</SelectItem>
                  <SelectItem value="SUBMITTED">Submitted</SelectItem>
                  <SelectItem value="UNDER_REVIEW">Under Review</SelectItem>
                  <SelectItem value="CHANGES_REQUESTED">Changes Needed</SelectItem>
                  <SelectItem value="APPROVED">Approved</SelectItem>
                  <SelectItem value="REJECTED">Rejected</SelectItem>
                  <SelectItem value="CANCELLED">Cancelled</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Manpower Table */}
          <div className="rounded-xl border bg-card overflow-hidden shadow-xs">
            <Table>
              <TableHeader>
                <TableRow className="bg-muted/40 text-xs">
                  <TableHead className="font-bold">MR Code</TableHead>
                  <TableHead className="font-bold">Position / Title</TableHead>
                  <TableHead className="font-bold">Department</TableHead>
                  <TableHead className="font-bold text-center">Openings</TableHead>
                  <TableHead className="font-bold">Reason</TableHead>
                  <TableHead className="font-bold">Salary / Budget</TableHead>
                  <TableHead className="font-bold">Status</TableHead>
                  <TableHead className="font-bold">Requester</TableHead>
                  <TableHead className="font-bold text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>

              <TableBody>
                {loadingManpower ? (
                  <TableRow>
                    <TableCell colSpan={9} className="h-40 text-center text-xs text-muted-foreground">
                      <Loader2 className="w-6 h-6 animate-spin mx-auto mb-2 text-primary" />
                      Loading manpower requisitions...
                    </TableCell>
                  </TableRow>
                ) : !manpowerList || manpowerList.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={9} className="h-40 text-center text-xs text-muted-foreground">
                      No manpower requisitions found. Click <strong>Request Manpower</strong> to submit a workforce need.
                    </TableCell>
                  </TableRow>
                ) : (
                  manpowerList.map((req: any) => (
                    <TableRow key={req.id} className="text-xs hover:bg-muted/30 transition-colors">
                      <TableCell className="font-mono font-bold text-foreground">
                        {req.requisitionNumber}
                      </TableCell>

                      <TableCell>
                        <span className="font-bold text-foreground block">{req.designation?.name}</span>
                        <span className="text-[11px] text-muted-foreground">{req.employmentType}</span>
                      </TableCell>

                      <TableCell className="font-medium text-muted-foreground">
                        {req.department?.name}
                      </TableCell>

                      <TableCell className="text-center font-bold">
                        <span className="px-2 py-0.5 rounded-md bg-primary/10 text-primary">
                          {req.positionsCount}
                        </span>
                      </TableCell>

                      <TableCell>
                        <Badge variant="secondary" className="text-[10px] font-semibold">
                          {req.hiringReason}
                        </Badge>
                      </TableCell>

                      <TableCell>
                        {req.budgetAmount ? (
                          <span className="font-semibold text-emerald-600 dark:text-emerald-400">
                            ₹{Number(req.budgetAmount).toLocaleString()}
                          </span>
                        ) : req.minSalary || req.maxSalary ? (
                          <span className="text-muted-foreground">
                            ₹{req.minSalary ? Number(req.minSalary).toLocaleString() : "0"} - ₹
                            {req.maxSalary ? Number(req.maxSalary).toLocaleString() : "N/A"}
                          </span>
                        ) : (
                          <span className="text-muted-foreground italic">Unspecified</span>
                        )}
                      </TableCell>

                      <TableCell>{getStatusBadge(req.status)}</TableCell>

                      <TableCell>
                        <span className="font-medium block text-foreground">
                          {req.requestedBy?.firstName} {req.requestedBy?.lastName}
                        </span>
                        <span className="text-[10px] text-muted-foreground">
                          {new Date(req.createdAt).toLocaleDateString()}
                        </span>
                      </TableCell>

                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          {/* History Button */}
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-7 w-7 text-muted-foreground hover:text-foreground"
                            title="Approval History"
                            onClick={() => setHistoryReqId(req.id)}
                          >
                            <History className="w-3.5 h-3.5" />
                          </Button>

                          {/* DRAFT or CHANGES_REQUESTED -> Submit / Edit */}
                          {(req.status === "DRAFT" || req.status === "CHANGES_REQUESTED") && (
                            <>
                              <Button
                                variant="outline"
                                size="sm"
                                className="h-7 text-[11px] font-medium"
                                onClick={() => {
                                  setEditingReq(req);
                                  setIsNewReqOpen(true);
                                }}
                              >
                                <Edit className="w-3 h-3 mr-1" /> Edit
                              </Button>

                              <Button
                                size="sm"
                                className="h-7 text-[11px] font-semibold bg-primary"
                                onClick={() => submitRequisitionMutation.mutate(req.id)}
                                disabled={submitRequisitionMutation.isPending}
                              >
                                <Send className="w-3 h-3 mr-1" /> Submit
                              </Button>
                            </>
                          )}

                          {/* SUBMITTED / UNDER_REVIEW -> HR Review */}
                          {(req.status === "SUBMITTED" || req.status === "UNDER_REVIEW") && isHrOrAdmin && (
                            <Button
                              size="sm"
                              className="h-7 text-[11px] font-semibold bg-amber-600 hover:bg-amber-700 text-white"
                              onClick={() => setReviewReq(req)}
                            >
                              <Play className="w-3 h-3 mr-1" /> Review
                            </Button>
                          )}

                          {/* APPROVED -> Create Job Shortcut */}
                          {req.status === "APPROVED" && (
                            <Button
                              size="sm"
                              variant="outline"
                              className="h-7 text-[11px] font-semibold text-emerald-600 border-emerald-500/30 hover:bg-emerald-500/10"
                              onClick={() => {
                                setSelectedManpowerForJob(req);
                                setIsCreateJobOpen(true);
                              }}
                            >
                              <Briefcase className="w-3 h-3 mr-1" /> Create Job
                            </Button>
                          )}

                          {/* Cancel if active */}
                          {["DRAFT", "SUBMITTED", "CHANGES_REQUESTED"].includes(req.status) && (
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-7 w-7 text-destructive hover:bg-destructive/10"
                              title="Cancel Requisition"
                              onClick={() => {
                                if (confirm("Are you sure you want to cancel this requisition?")) {
                                  cancelRequisitionMutation.mutate(req.id);
                                }
                              }}
                            >
                              <Ban className="w-3.5 h-3.5" />
                            </Button>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </TabsContent>

        {/* TAB 2: JOB REQUISITIONS */}
        <TabsContent value="jobs" className="space-y-4">
          {/* Job Filter Toolbar */}
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3 p-3 bg-card rounded-xl border">
            <div className="relative w-full sm:w-80">
              <Search className="w-4 h-4 absolute left-3 top-2.5 text-muted-foreground" />
              <Input
                placeholder="Search job code, title, department..."
                className="pl-9 h-9 text-xs"
                value={jobSearch}
                onChange={(e) => setJobSearch(e.target.value)}
              />
            </div>

            <div className="flex items-center gap-2 w-full sm:w-auto">
              <span className="text-xs text-muted-foreground whitespace-nowrap">Status:</span>
              <Select value={jobStatusFilter} onValueChange={(val) => setJobStatusFilter(val || "ALL")}>
                <SelectTrigger className="h-9 text-xs w-[160px]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ALL">All Statuses</SelectItem>
                  <SelectItem value="DRAFT">Draft</SelectItem>
                  <SelectItem value="PENDING_APPROVAL">Pending Approval</SelectItem>
                  <SelectItem value="APPROVED">Approved</SelectItem>
                  <SelectItem value="PUBLISHED">Published</SelectItem>
                  <SelectItem value="PAUSED">Paused</SelectItem>
                  <SelectItem value="CLOSED">Closed</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Job Table */}
          <div className="rounded-xl border bg-card overflow-hidden shadow-xs">
            <Table>
              <TableHeader>
                <TableRow className="bg-muted/40 text-xs">
                  <TableHead className="font-bold">Job Code</TableHead>
                  <TableHead className="font-bold">Job Title</TableHead>
                  <TableHead className="font-bold">Department & Location</TableHead>
                  <TableHead className="font-bold">Mode</TableHead>
                  <TableHead className="font-bold text-center">Openings / Filled</TableHead>
                  <TableHead className="font-bold">Origin</TableHead>
                  <TableHead className="font-bold">Status</TableHead>
                  <TableHead className="font-bold text-right">Lifecycle Actions</TableHead>
                </TableRow>
              </TableHeader>

              <TableBody>
                {loadingJobs ? (
                  <TableRow>
                    <TableCell colSpan={8} className="h-40 text-center text-xs text-muted-foreground">
                      <Loader2 className="w-6 h-6 animate-spin mx-auto mb-2 text-primary" />
                      Loading job vacancies...
                    </TableCell>
                  </TableRow>
                ) : !jobList || jobList.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={8} className="h-40 text-center text-xs text-muted-foreground">
                      No job vacancies created yet. Click <strong>Create Job Vacancy</strong> to start.
                    </TableCell>
                  </TableRow>
                ) : (
                  jobList.map((job: any) => (
                    <TableRow key={job.id} className="text-xs hover:bg-muted/30 transition-colors">
                      <TableCell className="font-mono font-bold text-foreground">
                        {job.jobCode}
                      </TableCell>

                      <TableCell>
                        <span className="font-bold text-foreground block">{job.title}</span>
                        <span className="text-[11px] text-muted-foreground">{job.employmentType}</span>
                      </TableCell>

                      <TableCell>
                        <span className="font-medium text-foreground block">{job.department?.name}</span>
                        <span className="text-[11px] text-muted-foreground flex items-center gap-1">
                          <MapPin className="w-3 h-3" /> {job.location}
                        </span>
                      </TableCell>

                      <TableCell>
                        <Badge variant="outline" className="text-[10px]">
                          {job.workplaceType}
                        </Badge>
                      </TableCell>

                      <TableCell className="text-center font-semibold">
                        <span className="text-foreground">{job.filledCount}</span> /{" "}
                        <span className="text-primary font-bold">{job.openings}</span>
                      </TableCell>

                      <TableCell>
                        {job.manpowerRequisition ? (
                          <span className="font-mono text-[11px] text-muted-foreground">
                            {job.manpowerRequisition.requisitionNumber}
                          </span>
                        ) : (
                          <Badge variant="secondary" className="text-[10px]">Direct</Badge>
                        )}
                      </TableCell>

                      <TableCell>{getStatusBadge(job.status)}</TableCell>

                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          {/* View details */}
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-7 w-7 text-muted-foreground hover:text-foreground"
                            title="View Vacancy Details"
                            onClick={() => setViewJobModal(job)}
                          >
                            <Eye className="w-3.5 h-3.5" />
                          </Button>

                          <Button
                            size="sm"
                            variant="outline"
                            className="h-7 text-[11px] font-semibold"
                            title="Configure Interview Rounds & Pipeline"
                            onClick={() => setConfiguredJobForPipeline(job)}
                          >
                            <Layers className="w-3 h-3 mr-1 text-primary" /> Pipeline
                          </Button>

                          {/* DRAFT -> Submit */}
                          {job.status === "DRAFT" && (
                            <Button
                              size="sm"
                              className="h-7 text-[11px] font-semibold"
                              onClick={() => jobActionMutation.mutate({ id: job.id, action: "submit" })}
                              disabled={jobActionMutation.isPending}
                            >
                              <Send className="w-3 h-3 mr-1" /> Submit
                            </Button>
                          )}

                          {/* PENDING_APPROVAL -> Approve (HR) */}
                          {job.status === "PENDING_APPROVAL" && isHrOrAdmin && (
                            <Button
                              size="sm"
                              className="h-7 text-[11px] font-semibold bg-emerald-600 hover:bg-emerald-700 text-white"
                              onClick={() => jobActionMutation.mutate({ id: job.id, action: "approve" })}
                              disabled={jobActionMutation.isPending}
                            >
                              <CheckCircle2 className="w-3 h-3 mr-1" /> Approve
                            </Button>
                          )}

                          {/* APPROVED -> Publish (HR) */}
                          {job.status === "APPROVED" && isHrOrAdmin && (
                            <Button
                              size="sm"
                              className="h-7 text-[11px] font-semibold bg-primary text-primary-foreground"
                              onClick={() => jobActionMutation.mutate({ id: job.id, action: "publish" })}
                              disabled={jobActionMutation.isPending}
                            >
                              <Play className="w-3 h-3 mr-1" /> Publish Job
                            </Button>
                          )}

                          {/* PUBLISHED -> Pause / Close */}
                          {job.status === "PUBLISHED" && isHrOrAdmin && (
                            <>
                              <Button
                                size="sm"
                                variant="outline"
                                className="h-7 text-[11px] font-semibold text-amber-600 border-amber-500/30"
                                onClick={() => jobActionMutation.mutate({ id: job.id, action: "pause" })}
                                disabled={jobActionMutation.isPending}
                              >
                                <Pause className="w-3 h-3 mr-1" /> Pause
                              </Button>

                              <Button
                                size="sm"
                                variant="outline"
                                className="h-7 text-[11px] font-semibold text-destructive border-destructive/30"
                                onClick={() => jobActionMutation.mutate({ id: job.id, action: "close" })}
                                disabled={jobActionMutation.isPending}
                              >
                                Close
                              </Button>
                            </>
                          )}

                          {/* PAUSED -> Resume */}
                          {job.status === "PAUSED" && isHrOrAdmin && (
                            <Button
                              size="sm"
                              className="h-7 text-[11px] font-semibold bg-emerald-600 hover:bg-emerald-700 text-white"
                              onClick={() => jobActionMutation.mutate({ id: job.id, action: "resume" })}
                              disabled={jobActionMutation.isPending}
                            >
                              <Play className="w-3 h-3 mr-1" /> Resume
                            </Button>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </TabsContent>

        {/* TAB 3: CANDIDATES & APPLICATIONS */}
        <TabsContent value="applications" className="space-y-4">
          {/* Filter Toolbar */}
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3 p-3 bg-card rounded-xl border">
            <div className="relative w-full sm:w-80">
              <Search className="w-4 h-4 absolute left-3 top-2.5 text-muted-foreground" />
              <Input
                placeholder="Search candidate name, email, phone..."
                className="pl-9 h-9 text-xs"
                value={applicationSearch}
                onChange={(e) => setApplicationSearch(e.target.value)}
              />
            </div>

            <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto">
              <div className="flex items-center gap-1.5">
                <span className="text-xs text-muted-foreground whitespace-nowrap">Job:</span>
                <Select value={applicationJobFilter} onValueChange={(val) => setApplicationJobFilter(val || "ALL")}>
                  <SelectTrigger className="h-9 text-xs w-[170px]">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="ALL">All Jobs</SelectItem>
                    {jobList?.map((j: any) => (
                      <SelectItem key={j.id} value={j.id}>
                        {j.title} ({j.jobCode})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="flex items-center gap-1.5">
                <span className="text-xs text-muted-foreground whitespace-nowrap">Status:</span>
                <Select value={applicationStatusFilter} onValueChange={(val) => setApplicationStatusFilter(val || "ALL")}>
                  <SelectTrigger className="h-9 text-xs w-[150px]">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="ALL">All Statuses</SelectItem>
                    <SelectItem value="APPLIED">Applied</SelectItem>
                    <SelectItem value="SCREENING">Screening</SelectItem>
                    <SelectItem value="SHORTLISTED">Shortlisted</SelectItem>
                    <SelectItem value="INTERVIEW">Interviewing</SelectItem>
                    <SelectItem value="SELECTED">Selected</SelectItem>
                    <SelectItem value="OFFER">Offer Sent</SelectItem>
                    <SelectItem value="OFFER_ACCEPTED">Offer Accepted</SelectItem>
                    <SelectItem value="HIRED">Hired</SelectItem>
                    <SelectItem value="REJECTED">Rejected</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>

          {/* Applications Table */}
          <div className="rounded-xl border bg-card overflow-hidden shadow-xs">
            <Table>
              <TableHeader>
                <TableRow className="bg-muted/40 text-xs">
                  <TableHead className="font-bold">App #</TableHead>
                  <TableHead className="font-bold">Candidate</TableHead>
                  <TableHead className="font-bold">Applied Position</TableHead>
                  <TableHead className="font-bold">Experience</TableHead>
                  <TableHead className="font-bold">Location</TableHead>
                  <TableHead className="font-bold">Status</TableHead>
                  <TableHead className="font-bold">Source</TableHead>
                  <TableHead className="font-bold">Applied On</TableHead>
                  <TableHead className="font-bold text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>

              <TableBody>
                {loadingApplications ? (
                  <TableRow>
                    <TableCell colSpan={9} className="h-40 text-center text-xs text-muted-foreground">
                      <Loader2 className="w-6 h-6 animate-spin mx-auto mb-2 text-primary" />
                      Loading candidate applications...
                    </TableCell>
                  </TableRow>
                ) : !applicationList || applicationList.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={9} className="h-40 text-center text-xs text-muted-foreground">
                      No applications received yet. Publish job vacancies on Globizhub Careers to begin receiving candidates.
                    </TableCell>
                  </TableRow>
                ) : (
                  applicationList.map((app: any) => (
                    <TableRow key={app.id} className="text-xs hover:bg-muted/30 transition-colors">
                      <TableCell className="font-mono font-bold text-foreground">
                        {app.applicationNumber}
                      </TableCell>

                      <TableCell>
                        <div className="flex flex-col">
                          <span className="font-bold text-foreground">
                            {app.candidate?.firstName} {app.candidate?.lastName}
                          </span>
                          <span className="text-[11px] text-muted-foreground">
                            {app.candidate?.email}
                          </span>
                        </div>
                      </TableCell>

                      <TableCell>
                        <span className="font-medium text-foreground block">
                          {app.jobRequisition?.title}
                        </span>
                        <span className="font-mono text-[11px] text-muted-foreground">
                          {app.jobRequisition?.jobCode}
                        </span>
                      </TableCell>

                      <TableCell className="font-medium">
                        {app.candidate?.totalExperience !== undefined && app.candidate?.totalExperience !== null
                          ? `${app.candidate?.totalExperience} yrs`
                          : "N/A"}
                      </TableCell>

                      <TableCell className="text-muted-foreground">
                        {app.candidate?.currentLocation || "—"}
                      </TableCell>

                      <TableCell>{getStatusBadge(app.status)}</TableCell>

                      <TableCell>
                        <Badge variant="secondary" className="text-[10px] font-semibold">
                          {app.source === "GLOBIZHUB_CAREERS" ? "Globizhub Careers" : app.source}
                        </Badge>
                      </TableCell>

                      <TableCell className="text-muted-foreground">
                        {new Date(app.createdAt).toLocaleDateString()}
                      </TableCell>

                      <TableCell className="text-right">
                        <Button
                          size="sm"
                          variant="outline"
                          className="h-7 text-xs font-semibold"
                          onClick={() => setSelectedApplication(app)}
                        >
                          <Eye className="w-3.5 h-3.5 mr-1" /> Review
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </TabsContent>
      </Tabs>

      {/* Modals */}
      <NewRequisitionModal
        open={isNewReqOpen}
        onOpenChange={setIsNewReqOpen}
        initialData={editingReq}
        onSuccess={() => {
          queryClient.invalidateQueries({ queryKey: ["manpowerRequisitions"] });
          queryClient.invalidateQueries({ queryKey: ["recruitmentStats"] });
        }}
      />

      <RequisitionReviewModal
        open={!!reviewReq}
        onOpenChange={(op) => !op && setReviewReq(null)}
        requisition={reviewReq}
        onSuccess={() => {
          queryClient.invalidateQueries({ queryKey: ["manpowerRequisitions"] });
          queryClient.invalidateQueries({ queryKey: ["recruitmentStats"] });
        }}
      />

      <RequisitionHistoryModal
        open={!!historyReqId}
        onOpenChange={(op: boolean) => !op && setHistoryReqId(null)}
        requisitionId={historyReqId}
      />

      <CreateJobModal
        open={isCreateJobOpen}
        onOpenChange={setIsCreateJobOpen}
        preselectedManpowerReq={selectedManpowerForJob}
        isHrOrAdmin={isHrOrAdmin}
        onSuccess={() => {
          queryClient.invalidateQueries({ queryKey: ["jobRequisitions"] });
          queryClient.invalidateQueries({ queryKey: ["recruitmentStats"] });
        }}
      />

      {/* Application Detail / Review Modal */}
      <ApplicationDetailModal
        open={!!selectedApplication}
        onOpenChange={(op) => !op && setSelectedApplication(null)}
        application={selectedApplication}
        onSuccess={() => {
          queryClient.invalidateQueries({ queryKey: ["companyApplications"] });
          queryClient.invalidateQueries({ queryKey: ["recruitmentStats"] });
        }}
      />

      {/* Configure Interview Pipeline Modal */}
      <ConfigurePipelineModal
        open={!!configuredJobForPipeline}
        onOpenChange={(op) => !op && setConfiguredJobForPipeline(null)}
        job={configuredJobForPipeline}
        onSuccess={() => {
          queryClient.invalidateQueries({ queryKey: ["jobRequisitions"] });
        }}
      />

      {/* View Job Details Modal */}
      {viewJobModal && (
        <Dialog open={!!viewJobModal} onOpenChange={(op) => !op && setViewJobModal(null)}>
          <DialogContent className="sm:max-w-2xl max-h-[85vh] overflow-y-auto">
            <DialogHeader>
              <div className="flex items-center justify-between">
                <span className="font-mono text-sm font-bold text-primary px-2.5 py-1 bg-primary/10 rounded-md">
                  {viewJobModal.jobCode}
                </span>
                {getStatusBadge(viewJobModal.status)}
              </div>
              <DialogTitle className="text-xl font-bold pt-2">{viewJobModal.title}</DialogTitle>
              <DialogDescription>
                {viewJobModal.department?.name} • {viewJobModal.location} ({viewJobModal.workplaceType})
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4 py-2 text-xs">
              <div className="grid grid-cols-3 gap-3 p-3 bg-muted/30 rounded-xl border">
                <div>
                  <span className="text-muted-foreground block mb-1">Openings</span>
                  <span className="font-bold text-sm">{viewJobModal.openings} positions</span>
                </div>
                <div>
                  <span className="text-muted-foreground block mb-1">Employment</span>
                  <span className="font-bold">{viewJobModal.employmentType}</span>
                </div>
                <div>
                  <span className="text-muted-foreground block mb-1">Salary Range</span>
                  <span className="font-bold">
                    ₹{viewJobModal.salaryMin ? Number(viewJobModal.salaryMin).toLocaleString() : "N/A"} - ₹
                    {viewJobModal.salaryMax ? Number(viewJobModal.salaryMax).toLocaleString() : "N/A"}
                  </span>
                </div>
              </div>

              <div>
                <span className="text-xs font-bold uppercase tracking-wider block mb-1 text-muted-foreground">
                  Description
                </span>
                <p className="text-foreground whitespace-pre-line bg-card p-3 rounded-lg border">
                  {viewJobModal.description}
                </p>
              </div>

              {viewJobModal.responsibilities && (
                <div>
                  <span className="text-xs font-bold uppercase tracking-wider block mb-1 text-muted-foreground">
                    Responsibilities
                  </span>
                  <p className="text-foreground whitespace-pre-line bg-card p-3 rounded-lg border">
                    {viewJobModal.responsibilities}
                  </p>
                </div>
              )}

              {viewJobModal.requirements && (
                <div>
                  <span className="text-xs font-bold uppercase tracking-wider block mb-1 text-muted-foreground">
                    Requirements
                  </span>
                  <p className="text-foreground whitespace-pre-line bg-card p-3 rounded-lg border">
                    {viewJobModal.requirements}
                  </p>
                </div>
              )}

              {viewJobModal.screeningQuestions && Array.isArray(viewJobModal.screeningQuestions) && viewJobModal.screeningQuestions.length > 0 && (
                <div>
                  <span className="text-xs font-bold uppercase tracking-wider block mb-1 text-muted-foreground">
                    Screening Questions ({viewJobModal.screeningQuestions.length})
                  </span>
                  <div className="space-y-1.5">
                    {viewJobModal.screeningQuestions.map((q: any, i: number) => (
                      <div key={q.id || i} className="p-2.5 bg-muted/40 rounded-lg border flex items-center justify-between">
                        <span className="font-medium text-foreground">
                          {i + 1}. {q.question}
                        </span>
                        <div className="flex items-center gap-1.5">
                          <Badge variant="outline" className="text-[10px]">{q.type}</Badge>
                          {q.required && <Badge variant="secondary" className="text-[10px]">Required</Badge>}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            <DialogFooter className="border-t pt-3">
              <Button variant="outline" onClick={() => setViewJobModal(null)}>
                Close
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}
