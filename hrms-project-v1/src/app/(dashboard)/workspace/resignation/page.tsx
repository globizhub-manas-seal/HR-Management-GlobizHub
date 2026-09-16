"use client";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import axios from "axios";
import {
  LogOut,
  Calendar,
  Clock,
  CheckCircle2,
  XCircle,
  AlertCircle,
  Clock3,
  Building2,
  ShieldCheck,
  Laptop,
  CreditCard,
  FileText,
  UserCheck,
  Search,
  Check,
  RotateCcw,
  ChevronRight,
  Loader2,
  Info,
  CalendarDays,
  Send,
  AlertTriangle,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
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
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/components/ToastProvider";
import { useViewMode } from "@/context/ViewModeContext";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000";

const REASON_OPTIONS = [
  { value: "BETTER_OPPORTUNITY", label: "Better Opportunity / Career Growth" },
  { value: "HIGHER_STUDIES", label: "Pursuing Higher Education" },
  { value: "CAREER_CHANGE", label: "Change of Career / Field" },
  { value: "RELOCATION", label: "Relocation / Moving Abroad" },
  { value: "PERSONAL_REASONS", label: "Personal / Family Reasons" },
  { value: "HEALTH_MEDICAL", label: "Health or Medical Grounds" },
  { value: "OTHER", label: "Other Reasons" },
];

export default function ResignationModulePage() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { user, activeRole } = useViewMode();

  const isHrOrAdmin = ["SUPER_ADMIN", "OWNER", "HR_HEAD"].includes(
    activeRole || user?.role
  );
  const isManager = (activeRole || user?.role) === "MANAGER";
  const canManage = isHrOrAdmin || isManager;

  const [activeTab, setActiveTab] = useState(canManage ? "approvals" : "my");

  // Modals
  const [isApplyModalOpen, setIsApplyModalOpen] = useState(false);
  const [isWithdrawModalOpen, setIsWithdrawModalOpen] = useState(false);
  const [selectedResignationForReview, setSelectedResignationForReview] = useState<any>(null);
  const [selectedResignationForClearance, setSelectedResignationForClearance] = useState<any>(null);
  const [isFinalizeModalOpen, setIsFinalizeModalOpen] = useState(false);

  // Filter & Search
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [searchQuery, setSearchQuery] = useState("");

  // Form states
  const [applyForm, setApplyForm] = useState({
    reason: "BETTER_OPPORTUNITY",
    reasonDetails: "",
    requestedLastWorkingDay: "",
  });

  const [reviewForm, setReviewForm] = useState({
    decision: "APPROVED" as "APPROVED" | "REJECTED",
    comment: "",
    approvedLastWorkingDay: "",
    rejectionReason: "",
  });

  const [clearanceForm, setClearanceForm] = useState({
    department: "it" as "it" | "assets" | "finance" | "hr",
    completed: false,
    notes: "",
  });

  const [exitInterviewNotes, setExitInterviewNotes] = useState("");

  const getToken = () => (typeof window !== "undefined" ? localStorage.getItem("hrms_token") : null);

  // 1. Fetch My Resignations
  const { data: myData, isLoading: loadingMy } = useQuery({
    queryKey: ["myResignations"],
    queryFn: async () => {
      const res = await axios.get(`${API_URL}/resignation/my`, {
        headers: { Authorization: `Bearer ${getToken()}` },
      });
      return res.data;
    },
  });

  // 2. Fetch Company Resignations (if Manager or HR)
  const { data: companyResignations, isLoading: loadingCompany } = useQuery({
    queryKey: ["companyResignations", statusFilter],
    queryFn: async () => {
      if (!canManage) return [];
      const res = await axios.get(`${API_URL}/resignation/company`, {
        params: statusFilter !== "ALL" ? { status: statusFilter } : {},
        headers: { Authorization: `Bearer ${getToken()}` },
      });
      return res.data;
    },
    enabled: canManage,
  });

  // 3. Fetch Resignation Stats
  const { data: stats } = useQuery({
    queryKey: ["resignationStats"],
    queryFn: async () => {
      if (!canManage) return null;
      const res = await axios.get(`${API_URL}/resignation/stats`, {
        headers: { Authorization: `Bearer ${getToken()}` },
      });
      return res.data;
    },
    enabled: canManage,
  });

  // Mutations
  // A. Apply
  const applyMutation = useMutation({
    mutationFn: async (payload: any) => {
      return axios.post(`${API_URL}/resignation/apply`, payload, {
        headers: { Authorization: `Bearer ${getToken()}` },
      });
    },
    onSuccess: () => {
      toast("Resignation submitted successfully", "success");
      setIsApplyModalOpen(false);
      setApplyForm({ reason: "BETTER_OPPORTUNITY", reasonDetails: "", requestedLastWorkingDay: "" });
      queryClient.invalidateQueries({ queryKey: ["myResignations"] });
      queryClient.invalidateQueries({ queryKey: ["companyResignations"] });
      queryClient.invalidateQueries({ queryKey: ["resignationStats"] });
    },
    onError: (err: any) => {
      toast(err.response?.data?.message || "Failed to submit resignation", "error");
    },
  });

  // B. Withdraw
  const withdrawMutation = useMutation({
    mutationFn: async (resignationId: string) => {
      return axios.post(`${API_URL}/resignation/${resignationId}/withdraw`, {}, {
        headers: { Authorization: `Bearer ${getToken()}` },
      });
    },
    onSuccess: () => {
      toast("Resignation request withdrawn successfully", "success");
      setIsWithdrawModalOpen(false);
      queryClient.invalidateQueries({ queryKey: ["myResignations"] });
      queryClient.invalidateQueries({ queryKey: ["companyResignations"] });
      queryClient.invalidateQueries({ queryKey: ["resignationStats"] });
    },
    onError: (err: any) => {
      toast(err.response?.data?.message || "Failed to withdraw resignation", "error");
    },
  });

  // C. Review (Manager or HR)
  const reviewMutation = useMutation({
    mutationFn: async ({ id, endpoint, payload }: { id: string; endpoint: string; payload: any }) => {
      return axios.patch(`${API_URL}/resignation/${id}/${endpoint}`, payload, {
        headers: { Authorization: `Bearer ${getToken()}` },
      });
    },
    onSuccess: () => {
      toast("Review submitted successfully", "success");
      setSelectedResignationForReview(null);
      setReviewForm({ decision: "APPROVED", comment: "", approvedLastWorkingDay: "", rejectionReason: "" });
      queryClient.invalidateQueries({ queryKey: ["companyResignations"] });
      queryClient.invalidateQueries({ queryKey: ["resignationStats"] });
      queryClient.invalidateQueries({ queryKey: ["myResignations"] });
    },
    onError: (err: any) => {
      toast(err.response?.data?.message || "Failed to submit review", "error");
    },
  });

  // D. Update Clearance
  const clearanceMutation = useMutation({
    mutationFn: async ({ id, payload }: { id: string; payload: any }) => {
      return axios.patch(`${API_URL}/resignation/${id}/clearance`, payload, {
        headers: { Authorization: `Bearer ${getToken()}` },
      });
    },
    onSuccess: (res) => {
      toast("Department clearance updated", "success");
      setSelectedResignationForClearance(res.data);
      queryClient.invalidateQueries({ queryKey: ["companyResignations"] });
      queryClient.invalidateQueries({ queryKey: ["myResignations"] });
    },
    onError: (err: any) => {
      toast(err.response?.data?.message || "Failed to update clearance", "error");
    },
  });

  // E. Finalize Separation
  const finalizeMutation = useMutation({
    mutationFn: async ({ id, exitInterviewNotes }: { id: string; exitInterviewNotes?: string }) => {
      return axios.post(
        `${API_URL}/resignation/${id}/finalize`,
        { exitInterviewNotes },
        { headers: { Authorization: `Bearer ${getToken()}` } }
      );
    },
    onSuccess: () => {
      toast("Offboarding finalized and employee separation recorded", "success");
      setIsFinalizeModalOpen(false);
      setSelectedResignationForClearance(null);
      setExitInterviewNotes("");
      queryClient.invalidateQueries({ queryKey: ["companyResignations"] });
      queryClient.invalidateQueries({ queryKey: ["resignationStats"] });
    },
    onError: (err: any) => {
      toast(err.response?.data?.message || "Failed to finalize offboarding", "error");
    },
  });

  // Calculate default last working day based on noticePeriodDays
  const noticeDays = myData?.noticePeriodDays ?? 30;
  const suggestedLastDay = new Date();
  suggestedLastDay.setDate(suggestedLastDay.getDate() + noticeDays);
  const suggestedLastDayStr = suggestedLastDay.toISOString().split("T")[0];

  const activeResignation = myData?.activeResignation;

  // Days left calculation helper
  const calculateDaysLeft = (targetDate?: string) => {
    if (!targetDate) return 0;
    const diffTime = new Date(targetDate).getTime() - new Date().getTime();
    return Math.max(0, Math.ceil(diffTime / (1000 * 60 * 60 * 24)));
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "PENDING":
        return <Badge className="bg-amber-500/15 text-amber-600 dark:text-amber-400 border-amber-500/30">Pending Manager Review</Badge>;
      case "UNDER_REVIEW":
        return <Badge className="bg-blue-500/15 text-blue-600 dark:text-blue-400 border-blue-500/30">Pending HR Approval</Badge>;
      case "APPROVED":
        return <Badge className="bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border-emerald-500/30">Serving Notice Period</Badge>;
      case "COMPLETED":
        return <Badge className="bg-purple-500/15 text-purple-600 dark:text-purple-400 border-purple-500/30">Separated / Completed</Badge>;
      case "REJECTED":
        return <Badge className="bg-rose-500/15 text-rose-600 dark:text-rose-400 border-rose-500/30">Rejected</Badge>;
      case "WITHDRAWN":
        return <Badge className="bg-muted text-muted-foreground border-border">Withdrawn</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  const filteredCompanyResignations = (companyResignations || []).filter((item: any) => {
    if (!searchQuery) return true;
    const name = `${item.employee?.firstName || ""} ${item.employee?.lastName || ""}`.toLowerCase();
    const email = (item.employee?.email || "").toLowerCase();
    const code = (item.employee?.employeeCode || "").toLowerCase();
    const query = searchQuery.toLowerCase();
    return name.includes(query) || email.includes(query) || code.includes(query);
  });

  return (
    <div className="p-6 md:p-8 max-w-7xl mx-auto space-y-8">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold tracking-tight text-foreground">Employee Resignation & Exit</h1>
            <Badge variant="outline" className="text-xs bg-primary/10 text-primary border-primary/20">
              Offboarding Hub
            </Badge>
          </div>
          <p className="text-sm text-muted-foreground mt-1">
            Manage employee departure requests, notice period calculations, and multi-department clearance.
          </p>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-3">
          {!activeResignation && (
            <Button
              onClick={() => {
                setApplyForm({
                  reason: "BETTER_OPPORTUNITY",
                  reasonDetails: "",
                  requestedLastWorkingDay: suggestedLastDayStr,
                });
                setIsApplyModalOpen(true);
              }}
              className="gap-2 shadow-sm"
            >
              <LogOut className="w-4 h-4" />
              Submit Resignation
            </Button>
          )}
        </div>
      </div>

      {/* Admin / Manager KPI Stats Bar */}
      {canManage && stats && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Card className="border-border/60 shadow-sm bg-card/50 backdrop-blur">
            <CardHeader className="p-4 pb-2">
              <CardDescription className="text-xs font-medium">Pending Review</CardDescription>
              <CardTitle className="text-2xl font-bold text-amber-500">{stats.pendingReview}</CardTitle>
            </CardHeader>
            <CardContent className="p-4 pt-0 text-xs text-muted-foreground flex items-center gap-1.5">
              <Clock3 className="w-3.5 h-3.5" /> Awaiting manager / HR review
            </CardContent>
          </Card>

          <Card className="border-border/60 shadow-sm bg-card/50 backdrop-blur">
            <CardHeader className="p-4 pb-2">
              <CardDescription className="text-xs font-medium">Serving Notice</CardDescription>
              <CardTitle className="text-2xl font-bold text-emerald-500">{stats.noticePeriod}</CardTitle>
            </CardHeader>
            <CardContent className="p-4 pt-0 text-xs text-muted-foreground flex items-center gap-1.5">
              <CalendarDays className="w-3.5 h-3.5" /> Actively serving notice period
            </CardContent>
          </Card>

          <Card className="border-border/60 shadow-sm bg-card/50 backdrop-blur">
            <CardHeader className="p-4 pb-2">
              <CardDescription className="text-xs font-medium">Completed Offboardings</CardDescription>
              <CardTitle className="text-2xl font-bold text-purple-500">{stats.completed}</CardTitle>
            </CardHeader>
            <CardContent className="p-4 pt-0 text-xs text-muted-foreground flex items-center gap-1.5">
              <ShieldCheck className="w-3.5 h-3.5" /> Successfully transitioned
            </CardContent>
          </Card>

          <Card className="border-border/60 shadow-sm bg-card/50 backdrop-blur">
            <CardHeader className="p-4 pb-2">
              <CardDescription className="text-xs font-medium">Total Resignation Cases</CardDescription>
              <CardTitle className="text-2xl font-bold text-foreground">{stats.total}</CardTitle>
            </CardHeader>
            <CardContent className="p-4 pt-0 text-xs text-muted-foreground flex items-center gap-1.5">
              <Building2 className="w-3.5 h-3.5" /> Lifetime records tracked
            </CardContent>
          </Card>
        </div>
      )}

      {/* Main Tabs Navigation */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        {canManage && (
          <TabsList className="bg-muted/60 p-1 border border-border/40 rounded-xl">
            <TabsTrigger value="approvals" className="rounded-lg text-xs font-semibold gap-2">
              <Building2 className="w-4 h-4" />
              Company Resignations
              {stats?.pendingReview ? (
                <span className="ml-1.5 px-1.5 py-0.2 bg-amber-500 text-white rounded-full text-[10px]">
                  {stats.pendingReview}
                </span>
              ) : null}
            </TabsTrigger>
            <TabsTrigger value="clearance" className="rounded-lg text-xs font-semibold gap-2">
              <ShieldCheck className="w-4 h-4" />
              Clearance & Offboarding
            </TabsTrigger>
            <TabsTrigger value="my" className="rounded-lg text-xs font-semibold gap-2">
              <UserCheck className="w-4 h-4" />
              My Resignation Portal
            </TabsTrigger>
          </TabsList>
        )}

        {/* ----------------- TAB 1: COMPANY RESIGNATIONS (MANAGERS / HR) ----------------- */}
        {canManage && (
          <TabsContent value="approvals" className="space-y-4">
            <Card className="border-border/60 shadow-sm">
              <CardHeader className="pb-3 border-b border-border/40">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div>
                    <CardTitle className="text-lg">Resignation Approvals Pipeline</CardTitle>
                    <CardDescription>
                      Review departure requests submitted by team members, negotiate release dates, and track approvals.
                    </CardDescription>
                  </div>

                  {/* Filter & Search Toolbar */}
                  <div className="flex flex-wrap items-center gap-2">
                    <div className="relative w-48 sm:w-64">
                      <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                      <Input
                        placeholder="Search employee..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="pl-9 h-9 text-xs rounded-lg"
                      />
                    </div>

                    <Select
                      value={statusFilter}
                      onValueChange={(val) => setStatusFilter(val || "ALL")}
                    >
                      <SelectTrigger className="h-9 text-xs w-36 rounded-lg">
                        <SelectValue placeholder="Filter status" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="ALL">All Statuses</SelectItem>
                        <SelectItem value="PENDING">Pending Manager</SelectItem>
                        <SelectItem value="UNDER_REVIEW">Pending HR</SelectItem>
                        <SelectItem value="APPROVED">Serving Notice</SelectItem>
                        <SelectItem value="COMPLETED">Completed</SelectItem>
                        <SelectItem value="REJECTED">Rejected</SelectItem>
                        <SelectItem value="WITHDRAWN">Withdrawn</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </CardHeader>

              <CardContent className="p-0">
                <Table>
                  <TableHeader>
                    <TableRow className="bg-muted/30">
                      <TableHead className="w-[240px]">Employee</TableHead>
                      <TableHead>Department</TableHead>
                      <TableHead>Submission Date</TableHead>
                      <TableHead>Requested Last Day</TableHead>
                      <TableHead>Approved Last Day</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {loadingCompany ? (
                      <TableRow>
                        <TableCell colSpan={7} className="text-center py-10">
                          <Loader2 className="w-6 h-6 animate-spin mx-auto text-primary" />
                          <p className="text-xs text-muted-foreground mt-2">Loading resignation records...</p>
                        </TableCell>
                      </TableRow>
                    ) : filteredCompanyResignations.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={7} className="text-center py-12 text-muted-foreground text-sm">
                          No resignation requests found matching the current criteria.
                        </TableCell>
                      </TableRow>
                    ) : (
                      filteredCompanyResignations.map((item: any) => {
                        const empName = `${item.employee?.firstName || ""} ${item.employee?.lastName || ""}`;
                        const canReviewAsManager =
                          isManager &&
                          !isHrOrAdmin &&
                          item.status === "PENDING";
                        const canReviewAsHr =
                          isHrOrAdmin &&
                          ["PENDING", "UNDER_REVIEW"].includes(item.status);

                        return (
                          <TableRow key={item.id} className="hover:bg-muted/20">
                            <TableCell>
                              <div className="flex items-center gap-3">
                                <div className="w-9 h-9 rounded-full bg-primary/10 border border-primary/20 flex items-center justify-center font-bold text-xs text-primary shrink-0">
                                  {item.employee?.firstName?.[0]}
                                  {item.employee?.lastName?.[0]}
                                </div>
                                <div>
                                  <div className="font-semibold text-sm text-foreground">{empName}</div>
                                  <div className="text-xs text-muted-foreground font-mono">
                                    {item.employee?.employeeCode || item.employee?.email}
                                  </div>
                                </div>
                              </div>
                            </TableCell>

                            <TableCell className="text-xs text-muted-foreground">
                              {item.employee?.department?.name || "General"}
                            </TableCell>

                            <TableCell className="text-xs text-muted-foreground">
                              {new Date(item.submissionDate).toLocaleDateString()}
                            </TableCell>

                            <TableCell className="text-xs font-medium">
                              {new Date(item.requestedLastWorkingDay).toLocaleDateString()}
                            </TableCell>

                            <TableCell className="text-xs font-semibold text-foreground">
                              {item.approvedLastWorkingDay
                                ? new Date(item.approvedLastWorkingDay).toLocaleDateString()
                                : "—"}
                            </TableCell>

                            <TableCell>{getStatusBadge(item.status)}</TableCell>

                            <TableCell className="text-right">
                              <div className="flex items-center justify-end gap-2">
                                {(canReviewAsManager || canReviewAsHr) && (
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    className="h-8 text-xs font-medium rounded-lg"
                                    onClick={() => {
                                      setSelectedResignationForReview(item);
                                      setReviewForm({
                                        decision: "APPROVED",
                                        comment: "",
                                        approvedLastWorkingDay:
                                          item.requestedLastWorkingDay?.split("T")[0] || "",
                                        rejectionReason: "",
                                      });
                                    }}
                                  >
                                    Review Request
                                  </Button>
                                )}

                                {item.status === "APPROVED" && (
                                  <Button
                                    size="sm"
                                    variant="secondary"
                                    className="h-8 text-xs font-medium rounded-lg"
                                    onClick={() => {
                                      setSelectedResignationForClearance(item);
                                      setActiveTab("clearance");
                                    }}
                                  >
                                    Clearance Checklist
                                  </Button>
                                )}
                              </div>
                            </TableCell>
                          </TableRow>
                        );
                      })
                    )}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>
        )}

        {/* ----------------- TAB 2: CLEARANCE & OFFBOARDING (MANAGERS / HR) ----------------- */}
        {canManage && (
          <TabsContent value="clearance" className="space-y-6">
            <Card className="border-border/60 shadow-sm">
              <CardHeader className="pb-3 border-b border-border/40">
                <CardTitle className="text-lg">Departmental Clearance & Separation Protocol</CardTitle>
                <CardDescription>
                  Verify handover tasks, asset returns, IT account deprovisioning, and final settlement before archiving the employee.
                </CardDescription>
              </CardHeader>
              <CardContent className="pt-6 space-y-6">
                {/* Employee Selector for Clearance */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 rounded-xl bg-muted/40 border border-border/50">
                  <div className="space-y-1">
                    <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                      Selected Employee for Clearance:
                    </span>
                    <div className="text-base font-bold text-foreground">
                      {selectedResignationForClearance
                        ? `${selectedResignationForClearance.employee?.firstName} ${selectedResignationForClearance.employee?.lastName} (${selectedResignationForClearance.employee?.employeeCode || selectedResignationForClearance.employee?.email})`
                        : "Please select an employee serving notice below"}
                    </div>
                  </div>

                  {selectedResignationForClearance && isHrOrAdmin && (
                    <Button
                      variant="destructive"
                      size="sm"
                      className="rounded-lg gap-2"
                      onClick={() => setIsFinalizeModalOpen(true)}
                    >
                      <LogOut className="w-4 h-4" />
                      Finalize Separation & Deactivate
                    </Button>
                  )}
                </div>

                {/* Notice Period Employees Quick Switcher */}
                <div className="flex flex-wrap gap-2">
                  <span className="text-xs text-muted-foreground self-center mr-2">Serving Notice:</span>
                  {(companyResignations || [])
                    .filter((r: any) => ["APPROVED", "COMPLETED"].includes(r.status))
                    .map((item: any) => {
                      const isSelected = selectedResignationForClearance?.id === item.id;
                      return (
                        <Button
                          key={item.id}
                          variant={isSelected ? "default" : "outline"}
                          size="sm"
                          className="h-8 text-xs rounded-lg"
                          onClick={() => setSelectedResignationForClearance(item)}
                        >
                          {item.employee?.firstName} {item.employee?.lastName}
                          {item.status === "COMPLETED" && " (Completed)"}
                        </Button>
                      );
                    })}
                </div>

                {selectedResignationForClearance ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {/* 1. IT Access Revocation */}
                    <Card className="border-border/60 bg-card/60">
                      <CardHeader className="p-4 pb-2 flex flex-row items-center justify-between">
                        <div className="flex items-center gap-2">
                          <Laptop className="w-4 h-4 text-blue-500" />
                          <CardTitle className="text-sm font-semibold">IT & System Access</CardTitle>
                        </div>
                        <Badge
                          variant={
                            selectedResignationForClearance.clearanceChecklist?.it?.completed
                              ? "default"
                              : "outline"
                          }
                          className={
                            selectedResignationForClearance.clearanceChecklist?.it?.completed
                              ? "bg-emerald-500 text-white"
                              : ""
                          }
                        >
                          {selectedResignationForClearance.clearanceChecklist?.it?.completed
                            ? "Cleared"
                            : "Pending"}
                        </Badge>
                      </CardHeader>
                      <CardContent className="p-4 pt-2 text-xs space-y-3">
                        <p className="text-muted-foreground">
                          Email suspension, cloud credentials, VPN, repository write access deprovisioning.
                        </p>
                        <div className="flex items-center justify-between pt-2 border-t border-border/40">
                          <span className="text-[11px] text-muted-foreground italic">
                            Notes: {selectedResignationForClearance.clearanceChecklist?.it?.notes || "None"}
                          </span>
                          <Button
                            size="sm"
                            variant="outline"
                            className="h-7 text-xs rounded-lg"
                            onClick={() => {
                              clearanceMutation.mutate({
                                id: selectedResignationForClearance.id,
                                payload: {
                                  department: "it",
                                  completed: !selectedResignationForClearance.clearanceChecklist?.it?.completed,
                                  notes: "Access deactivation verified by admin",
                                },
                              });
                            }}
                          >
                            Toggle IT Clearance
                          </Button>
                        </div>
                      </CardContent>
                    </Card>

                    {/* 2. Physical Assets & Equipment Return */}
                    <Card className="border-border/60 bg-card/60">
                      <CardHeader className="p-4 pb-2 flex flex-row items-center justify-between">
                        <div className="flex items-center gap-2">
                          <Building2 className="w-4 h-4 text-amber-500" />
                          <CardTitle className="text-sm font-semibold">Hardware & Assets</CardTitle>
                        </div>
                        <Badge
                          variant={
                            selectedResignationForClearance.clearanceChecklist?.assets?.completed
                              ? "default"
                              : "outline"
                          }
                          className={
                            selectedResignationForClearance.clearanceChecklist?.assets?.completed
                              ? "bg-emerald-500 text-white"
                              : ""
                          }
                        >
                          {selectedResignationForClearance.clearanceChecklist?.assets?.completed
                            ? "Returned"
                            : "Pending Return"}
                        </Badge>
                      </CardHeader>
                      <CardContent className="p-4 pt-2 text-xs space-y-3">
                        <p className="text-muted-foreground">
                          Company laptop, secondary monitors, access cards, office keys, peripherals.
                        </p>
                        <div className="flex items-center justify-between pt-2 border-t border-border/40">
                          <span className="text-[11px] text-muted-foreground italic">
                            Notes: {selectedResignationForClearance.clearanceChecklist?.assets?.notes || "None"}
                          </span>
                          <Button
                            size="sm"
                            variant="outline"
                            className="h-7 text-xs rounded-lg"
                            onClick={() => {
                              clearanceMutation.mutate({
                                id: selectedResignationForClearance.id,
                                payload: {
                                  department: "assets",
                                  completed: !selectedResignationForClearance.clearanceChecklist?.assets?.completed,
                                  notes: "Physical hardware verified and returned",
                                },
                              });
                            }}
                          >
                            Toggle Assets Return
                          </Button>
                        </div>
                      </CardContent>
                    </Card>

                    {/* 3. Finance & Settlement */}
                    <Card className="border-border/60 bg-card/60">
                      <CardHeader className="p-4 pb-2 flex flex-row items-center justify-between">
                        <div className="flex items-center gap-2">
                          <CreditCard className="w-4 h-4 text-emerald-500" />
                          <CardTitle className="text-sm font-semibold">Finance & Final Dues</CardTitle>
                        </div>
                        <Badge
                          variant={
                            selectedResignationForClearance.clearanceChecklist?.finance?.completed
                              ? "default"
                              : "outline"
                          }
                          className={
                            selectedResignationForClearance.clearanceChecklist?.finance?.completed
                              ? "bg-emerald-500 text-white"
                              : ""
                          }
                        >
                          {selectedResignationForClearance.clearanceChecklist?.finance?.completed
                            ? "Settled"
                            : "Pending Calculation"}
                        </Badge>
                      </CardHeader>
                      <CardContent className="p-4 pt-2 text-xs space-y-3">
                        <p className="text-muted-foreground">
                          Leave encashment, pending expense claims, final salary settlement, PF/gratuity clearance.
                        </p>
                        <div className="flex items-center justify-between pt-2 border-t border-border/40">
                          <span className="text-[11px] text-muted-foreground italic">
                            Notes: {selectedResignationForClearance.clearanceChecklist?.finance?.notes || "None"}
                          </span>
                          <Button
                            size="sm"
                            variant="outline"
                            className="h-7 text-xs rounded-lg"
                            onClick={() => {
                              clearanceMutation.mutate({
                                id: selectedResignationForClearance.id,
                                payload: {
                                  department: "finance",
                                  completed: !selectedResignationForClearance.clearanceChecklist?.finance?.completed,
                                  notes: "Final settlement amount verified",
                                },
                              });
                            }}
                          >
                            Toggle Finance Clearance
                          </Button>
                        </div>
                      </CardContent>
                    </Card>

                    {/* 4. HR Formalities & Exit Interview */}
                    <Card className="border-border/60 bg-card/60">
                      <CardHeader className="p-4 pb-2 flex flex-row items-center justify-between">
                        <div className="flex items-center gap-2">
                          <FileText className="w-4 h-4 text-purple-500" />
                          <CardTitle className="text-sm font-semibold">HR & Exit Formalities</CardTitle>
                        </div>
                        <Badge
                          variant={
                            selectedResignationForClearance.clearanceChecklist?.hr?.completed
                              ? "default"
                              : "outline"
                          }
                          className={
                            selectedResignationForClearance.clearanceChecklist?.hr?.completed
                              ? "bg-emerald-500 text-white"
                              : ""
                          }
                        >
                          {selectedResignationForClearance.clearanceChecklist?.hr?.completed
                            ? "Completed"
                            : "Pending Interview"}
                        </Badge>
                      </CardHeader>
                      <CardContent className="p-4 pt-2 text-xs space-y-3">
                        <p className="text-muted-foreground">
                          Exit interview questionnaire, handover sign-off by manager, service certificate generation.
                        </p>
                        <div className="flex items-center justify-between pt-2 border-t border-border/40">
                          <span className="text-[11px] text-muted-foreground italic">
                            Notes: {selectedResignationForClearance.clearanceChecklist?.hr?.notes || "None"}
                          </span>
                          <Button
                            size="sm"
                            variant="outline"
                            className="h-7 text-xs rounded-lg"
                            onClick={() => {
                              clearanceMutation.mutate({
                                id: selectedResignationForClearance.id,
                                payload: {
                                  department: "hr",
                                  completed: !selectedResignationForClearance.clearanceChecklist?.hr?.completed,
                                  notes: "Exit interview recorded",
                                },
                              });
                            }}
                          >
                            Toggle HR Clearance
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  </div>
                ) : (
                  <div className="text-center py-12 text-sm text-muted-foreground border border-dashed rounded-xl">
                    Select an employee above to manage their offboarding clearance tasks.
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        )}

        {/* ----------------- TAB 3: MY RESIGNATION PORTAL (EVERY EMPLOYEE) ----------------- */}
        <TabsContent value="my" className="space-y-6">
          {/* Hero / Active Status Card */}
          {activeResignation ? (
            <Card className="border-border/60 shadow-md bg-gradient-to-br from-card via-card to-primary/5">
              <CardHeader className="pb-4 border-b border-border/40">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div>
                    <div className="flex items-center gap-2">
                      <CardTitle className="text-lg">Active Resignation Tracker</CardTitle>
                      {getStatusBadge(activeResignation.status)}
                    </div>
                    <CardDescription className="mt-1">
                      Submitted on {new Date(activeResignation.submissionDate).toLocaleDateString()} &bull;
                      Standard Notice Period: {activeResignation.noticePeriodDays} Days
                    </CardDescription>
                  </div>

                  {["PENDING", "UNDER_REVIEW"].includes(activeResignation.status) && (
                    <Button
                      variant="outline"
                      size="sm"
                      className="text-rose-600 dark:text-rose-400 border-rose-500/30 hover:bg-rose-500/10 rounded-lg gap-1.5"
                      onClick={() => setIsWithdrawModalOpen(true)}
                    >
                      <RotateCcw className="w-3.5 h-3.5" />
                      Withdraw Resignation
                    </Button>
                  )}
                </div>
              </CardHeader>

              <CardContent className="pt-6 space-y-6">
                {/* Visual Progress Pipeline */}
                <div className="space-y-2">
                  <div className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                    Separation Lifecycle Progress
                  </div>
                  <div className="grid grid-cols-5 gap-2 pt-2">
                    {[
                      { step: 1, label: "Application Submitted", done: true },
                      {
                        step: 2,
                        label: "Manager Review",
                        done: ["UNDER_REVIEW", "APPROVED", "COMPLETED"].includes(activeResignation.status),
                      },
                      {
                        step: 3,
                        label: "HR Approval",
                        done: ["APPROVED", "COMPLETED"].includes(activeResignation.status),
                      },
                      {
                        step: 4,
                        label: "Serving Notice",
                        done: ["APPROVED", "COMPLETED"].includes(activeResignation.status),
                      },
                      {
                        step: 5,
                        label: "Clearance & Exit",
                        done: activeResignation.status === "COMPLETED",
                      },
                    ].map((s) => (
                      <div key={s.step} className="flex flex-col items-center text-center gap-1.5">
                        <div
                          className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold transition-all ${s.done
                              ? "bg-primary text-primary-foreground shadow-sm shadow-primary/30"
                              : "bg-muted text-muted-foreground border border-border"
                            }`}
                        >
                          {s.done ? <Check className="w-4 h-4" /> : s.step}
                        </div>
                        <span className="text-[11px] font-medium leading-tight text-foreground/80">
                          {s.label}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Key Dates & Countdown Box */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-2">
                  <div className="p-4 rounded-xl bg-card border border-border/60">
                    <span className="text-xs text-muted-foreground">Requested Last Working Day</span>
                    <div className="text-base font-bold text-foreground mt-1">
                      {new Date(activeResignation.requestedLastWorkingDay).toLocaleDateString()}
                    </div>
                  </div>

                  <div className="p-4 rounded-xl bg-card border border-border/60">
                    <span className="text-xs text-muted-foreground">Approved Last Working Day</span>
                    <div className="text-base font-bold text-foreground mt-1">
                      {activeResignation.approvedLastWorkingDay
                        ? new Date(activeResignation.approvedLastWorkingDay).toLocaleDateString()
                        : "Pending HR Approval"}
                    </div>
                  </div>

                  <div className="p-4 rounded-xl bg-primary/10 border border-primary/20">
                    <span className="text-xs text-primary font-medium">Days Remaining in Notice</span>
                    <div className="text-2xl font-black text-primary mt-1">
                      {calculateDaysLeft(
                        activeResignation.approvedLastWorkingDay || activeResignation.requestedLastWorkingDay
                      )}{" "}
                      <span className="text-xs font-semibold">Days</span>
                    </div>
                  </div>
                </div>

                {/* Feedback Notes */}
                {(activeResignation.managerComment || activeResignation.hrComment) && (
                  <div className="space-y-3 pt-2">
                    <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                      Management Communication
                    </span>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      {activeResignation.managerComment && (
                        <div className="p-3.5 rounded-lg bg-muted/40 border border-border/40 text-xs">
                          <span className="font-semibold text-foreground">Manager Note: </span>
                          <p className="mt-1 text-muted-foreground">{activeResignation.managerComment}</p>
                        </div>
                      )}
                      {activeResignation.hrComment && (
                        <div className="p-3.5 rounded-lg bg-muted/40 border border-border/40 text-xs">
                          <span className="font-semibold text-foreground">HR Note: </span>
                          <p className="mt-1 text-muted-foreground">{activeResignation.hrComment}</p>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* Clearance Checklist Summary for Employee */}
                <div className="space-y-2 pt-2">
                  <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                    My Clearance Protocol Status
                  </span>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                    {[
                      {
                        label: "IT System Access",
                        icon: Laptop,
                        completed: activeResignation.clearanceChecklist?.it?.completed,
                      },
                      {
                        label: "Company Assets",
                        icon: Building2,
                        completed: activeResignation.clearanceChecklist?.assets?.completed,
                      },
                      {
                        label: "Finance Dues",
                        icon: CreditCard,
                        completed: activeResignation.clearanceChecklist?.finance?.completed,
                      },
                      {
                        label: "HR Formalities",
                        icon: FileText,
                        completed: activeResignation.clearanceChecklist?.hr?.completed,
                      },
                    ].map((dep, idx) => (
                      <div
                        key={idx}
                        className={`p-3 rounded-lg border flex items-center gap-2.5 ${dep.completed
                            ? "bg-emerald-500/10 border-emerald-500/30 text-emerald-600 dark:text-emerald-400"
                            : "bg-muted/30 border-border/40 text-muted-foreground"
                          }`}
                      >
                        <dep.icon className="w-4 h-4 shrink-0" />
                        <div className="min-w-0">
                          <div className="text-xs font-semibold truncate">{dep.label}</div>
                          <div className="text-[10px]">{dep.completed ? "Cleared" : "Pending"}</div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </CardContent>
            </Card>
          ) : (
            /* No Active Resignation: Information & Policy Hero */
            <Card className="border-border/60 shadow-sm">
              <CardContent className="p-8 text-center space-y-4">
                <div className="w-14 h-14 rounded-2xl bg-primary/10 border border-primary/20 text-primary flex items-center justify-center mx-auto shadow-inner">
                  <LogOut className="w-7 h-7" />
                </div>
                <div className="max-w-md mx-auto space-y-1">
                  <h3 className="text-lg font-bold text-foreground">No Active Resignation Request</h3>
                  <p className="text-xs text-muted-foreground">
                    Your employment status is active in the company. In case you wish to resign, the standard notice
                    period policy is <strong className="text-foreground">{noticeDays} days</strong>.
                  </p>
                </div>
                <div>
                  <Button
                    onClick={() => {
                      setApplyForm({
                        reason: "BETTER_OPPORTUNITY",
                        reasonDetails: "",
                        requestedLastWorkingDay: suggestedLastDayStr,
                      });
                      setIsApplyModalOpen(true);
                    }}
                    className="gap-2 shadow-sm"
                  >
                    <LogOut className="w-4 h-4" />
                    Submit Resignation Letter
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Past History Table */}
          <Card className="border-border/60 shadow-sm">
            <CardHeader className="pb-3 border-b border-border/40">
              <CardTitle className="text-base">Resignation History</CardTitle>
              <CardDescription>Records of your past resignation applications or requests.</CardDescription>
            </CardHeader>
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow className="bg-muted/30">
                    <TableHead>Submission Date</TableHead>
                    <TableHead>Reason</TableHead>
                    <TableHead>Requested Last Day</TableHead>
                    <TableHead>Approved Last Day</TableHead>
                    <TableHead>Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {loadingMy ? (
                    <TableRow>
                      <TableCell colSpan={5} className="text-center py-8">
                        <Loader2 className="w-5 h-5 animate-spin mx-auto text-primary" />
                      </TableCell>
                    </TableRow>
                  ) : !myData?.resignations?.length ? (
                    <TableRow>
                      <TableCell colSpan={5} className="text-center py-8 text-xs text-muted-foreground">
                        No previous resignation history found.
                      </TableCell>
                    </TableRow>
                  ) : (
                    myData.resignations.map((item: any) => (
                      <TableRow key={item.id}>
                        <TableCell className="text-xs">
                          {new Date(item.submissionDate).toLocaleDateString()}
                        </TableCell>
                        <TableCell className="text-xs font-medium">
                          {REASON_OPTIONS.find((r) => r.value === item.reason)?.label || item.reason}
                        </TableCell>
                        <TableCell className="text-xs">
                          {new Date(item.requestedLastWorkingDay).toLocaleDateString()}
                        </TableCell>
                        <TableCell className="text-xs">
                          {item.approvedLastWorkingDay
                            ? new Date(item.approvedLastWorkingDay).toLocaleDateString()
                            : "—"}
                        </TableCell>
                        <TableCell>{getStatusBadge(item.status)}</TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* ========================================================= */}
      {/* MODAL 1: SUBMIT RESIGNATION DIALOG                         */}
      {/* ========================================================= */}
      <Dialog open={isApplyModalOpen} onOpenChange={setIsApplyModalOpen}>
        <DialogContent className="sm:max-w-[520px]">
          <DialogHeader>
            <DialogTitle className="text-lg font-bold flex items-center gap-2">
              <LogOut className="w-5 h-5 text-rose-500" />
              Submit Resignation
            </DialogTitle>
            <DialogDescription className="text-xs">
              Formalize your departure request. Please review notice period requirements before submitting.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-2">
            {/* Policy Alert */}
            <div className="p-3 rounded-lg bg-blue-500/10 border border-blue-500/20 text-xs text-blue-700 dark:text-blue-300 flex items-start gap-2">
              <Info className="w-4 h-4 shrink-0 mt-0.5" />
              <div>
                Standard Company Notice Period is <strong>{noticeDays} Days</strong>. Your earliest standard release
                date is <strong>{suggestedLastDay.toLocaleDateString()}</strong>.
              </div>
            </div>

            {/* Departure Reason */}
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-foreground">Primary Reason for Leaving</label>
              <Select
                value={applyForm.reason}
                onValueChange={(val) => setApplyForm({ ...applyForm, reason: val || "BETTER_OPPORTUNITY" })}
              >
                <SelectTrigger className="h-9 text-xs rounded-lg">
                  <SelectValue placeholder="Select primary reason" />
                </SelectTrigger>
                <SelectContent>
                  {REASON_OPTIONS.map((opt) => (
                    <SelectItem key={opt.value} value={opt.value} className="text-xs">
                      {opt.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Requested Last Working Day */}
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-foreground">Requested Last Working Day</label>
              <Input
                type="date"
                value={applyForm.requestedLastWorkingDay}
                min={new Date().toISOString().split("T")[0]}
                onChange={(e) => setApplyForm({ ...applyForm, requestedLastWorkingDay: e.target.value })}
                className="h-9 text-xs rounded-lg"
              />
              {applyForm.requestedLastWorkingDay &&
                new Date(applyForm.requestedLastWorkingDay) < suggestedLastDay && (
                  <p className="text-[11px] text-amber-600 dark:text-amber-400 flex items-center gap-1 mt-1">
                    <AlertTriangle className="w-3.5 h-3.5" /> Notice period is shorter than {noticeDays} days. Early
                    release requires HR approval.
                  </p>
                )}
            </div>

            {/* Detailed Explanation / Handover Plan */}
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-foreground">Resignation Remarks / Handover Note</label>
              <Textarea
                placeholder="Share context regarding your departure, projects to transition, or message for leadership..."
                value={applyForm.reasonDetails}
                onChange={(e) => setApplyForm({ ...applyForm, reasonDetails: e.target.value })}
                className="text-xs min-h-[90px] rounded-lg"
              />
            </div>
          </div>

          <DialogFooter className="gap-2">
            <Button variant="outline" size="sm" onClick={() => setIsApplyModalOpen(false)}>
              Cancel
            </Button>
            <Button
              size="sm"
              disabled={!applyForm.requestedLastWorkingDay || applyMutation.isPending}
              onClick={() => applyMutation.mutate(applyForm)}
              className="gap-2"
            >
              {applyMutation.isPending ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 animate-spin" /> Submitting...
                </>
              ) : (
                <>
                  <Send className="w-3.5 h-3.5" /> Submit Application
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ========================================================= */}
      {/* MODAL 2: WITHDRAW RESIGNATION DIALOG                       */}
      {/* ========================================================= */}
      <Dialog open={isWithdrawModalOpen} onOpenChange={setIsWithdrawModalOpen}>
        <DialogContent className="sm:max-w-[420px]">
          <DialogHeader>
            <DialogTitle className="text-base font-bold flex items-center gap-2">
              <AlertCircle className="w-5 h-5 text-amber-500" />
              Withdraw Resignation Request
            </DialogTitle>
            <DialogDescription className="text-xs">
              Are you sure you want to withdraw your resignation? This will cancel your departure request and maintain
              your active employment status.
            </DialogDescription>
          </DialogHeader>

          <DialogFooter className="gap-2">
            <Button variant="outline" size="sm" onClick={() => setIsWithdrawModalOpen(false)}>
              Keep Resignation
            </Button>
            <Button
              variant="destructive"
              size="sm"
              disabled={withdrawMutation.isPending}
              onClick={() => {
                if (activeResignation) {
                  withdrawMutation.mutate(activeResignation.id);
                }
              }}
            >
              {withdrawMutation.isPending ? "Withdrawing..." : "Confirm Withdrawal"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ========================================================= */}
      {/* MODAL 3: REVIEW RESIGNATION (MANAGER / HR)                 */}
      {/* ========================================================= */}
      {selectedResignationForReview && (
        <Dialog
          open={!!selectedResignationForReview}
          onOpenChange={() => setSelectedResignationForReview(null)}
        >
          <DialogContent className="sm:max-w-[540px]">
            <DialogHeader>
              <DialogTitle className="text-base font-bold flex items-center gap-2">
                <Building2 className="w-4 h-4 text-primary" />
                Review Resignation: {selectedResignationForReview.employee?.firstName}{" "}
                {selectedResignationForReview.employee?.lastName}
              </DialogTitle>
              <DialogDescription className="text-xs">
                {isHrOrAdmin
                  ? "HR Review: Set official last working day and authorize notice period."
                  : "Manager Review: Provide your recommendation and handover feedback."}
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4 py-2">
              {/* Employee Summary Details */}
              <div className="p-3 rounded-lg bg-muted/40 border border-border/50 text-xs space-y-1.5">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Employee Code:</span>
                  <span className="font-mono font-medium">{selectedResignationForReview.employee?.employeeCode}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Department:</span>
                  <span className="font-medium">{selectedResignationForReview.employee?.department?.name || "General"}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Reason:</span>
                  <span className="font-medium">
                    {REASON_OPTIONS.find((r) => r.value === selectedResignationForReview.reason)?.label ||
                      selectedResignationForReview.reason}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Requested Last Day:</span>
                  <span className="font-semibold text-foreground">
                    {new Date(selectedResignationForReview.requestedLastWorkingDay).toLocaleDateString()}
                  </span>
                </div>
                {selectedResignationForReview.reasonDetails && (
                  <div className="pt-1 border-t border-border/40">
                    <span className="text-muted-foreground">Employee Remarks:</span>
                    <p className="mt-0.5 text-foreground italic">{selectedResignationForReview.reasonDetails}</p>
                  </div>
                )}
              </div>

              {/* Decision Radio */}
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-foreground">Review Decision</label>
                <div className="flex gap-4">
                  <label className="flex items-center gap-2 text-xs font-medium cursor-pointer">
                    <input
                      type="radio"
                      name="decision"
                      value="APPROVED"
                      checked={reviewForm.decision === "APPROVED"}
                      onChange={() => setReviewForm({ ...reviewForm, decision: "APPROVED" })}
                    />
                    Recommend / Approve Resignation
                  </label>
                  <label className="flex items-center gap-2 text-xs font-medium cursor-pointer text-rose-600">
                    <input
                      type="radio"
                      name="decision"
                      value="REJECTED"
                      checked={reviewForm.decision === "REJECTED"}
                      onChange={() => setReviewForm({ ...reviewForm, decision: "REJECTED" })}
                    />
                    Reject Request
                  </label>
                </div>
              </div>

              {/* If HR and Approved: Adjust or Confirm Last Working Day */}
              {isHrOrAdmin && reviewForm.decision === "APPROVED" && (
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-foreground">Approved Official Last Working Day</label>
                  <Input
                    type="date"
                    value={reviewForm.approvedLastWorkingDay}
                    onChange={(e) => setReviewForm({ ...reviewForm, approvedLastWorkingDay: e.target.value })}
                    className="h-9 text-xs rounded-lg"
                  />
                  <span className="text-[11px] text-muted-foreground">
                    Notice period will begin immediately upon approval.
                  </span>
                </div>
              )}

              {/* Rejection Reason if Rejected */}
              {reviewForm.decision === "REJECTED" && (
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-foreground">Reason for Rejection</label>
                  <Textarea
                    placeholder="Provide specific justification for rejection..."
                    value={reviewForm.rejectionReason}
                    onChange={(e) => setReviewForm({ ...reviewForm, rejectionReason: e.target.value })}
                    className="text-xs min-h-[70px] rounded-lg"
                  />
                </div>
              )}

              {/* Review Comments */}
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-foreground">Reviewer Remarks / Transition Plan</label>
                <Textarea
                  placeholder="Enter remarks regarding handover, severance, or replacement..."
                  value={reviewForm.comment}
                  onChange={(e) => setReviewForm({ ...reviewForm, comment: e.target.value })}
                  className="text-xs min-h-[70px] rounded-lg"
                />
              </div>
            </div>

            <DialogFooter className="gap-2">
              <Button variant="outline" size="sm" onClick={() => setSelectedResignationForReview(null)}>
                Cancel
              </Button>
              <Button
                size="sm"
                variant={reviewForm.decision === "APPROVED" ? "default" : "destructive"}
                disabled={reviewMutation.isPending}
                onClick={() => {
                  const endpoint = isHrOrAdmin ? "hr-review" : "manager-review";
                  reviewMutation.mutate({
                    id: selectedResignationForReview.id,
                    endpoint,
                    payload: reviewForm,
                  });
                }}
              >
                {reviewMutation.isPending ? "Submitting..." : "Confirm Review"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}

      {/* ========================================================= */}
      {/* MODAL 4: FINALIZE SEPARATION DIALOG                        */}
      {/* ========================================================= */}
      {isFinalizeModalOpen && selectedResignationForClearance && (
        <Dialog open={isFinalizeModalOpen} onOpenChange={setIsFinalizeModalOpen}>
          <DialogContent className="sm:max-w-[480px]">
            <DialogHeader>
              <DialogTitle className="text-base font-bold flex items-center gap-2">
                <LogOut className="w-5 h-5 text-rose-500" />
                Finalize Separation & Archive Employee
              </DialogTitle>
              <DialogDescription className="text-xs">
                This will formally conclude the offboarding protocol for{" "}
                <strong>
                  {selectedResignationForClearance.employee?.firstName}{" "}
                  {selectedResignationForClearance.employee?.lastName}
                </strong>
                . Their status will transition to RESIGNED and system credentials archived.
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-3 py-2">
              <div className="p-3 rounded-lg bg-amber-500/10 border border-amber-500/20 text-xs text-amber-800 dark:text-amber-300">
                Ensure all departmental clearance tasks (IT access, hardware return, financial settlement) have been
                completed before proceeding.
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-foreground">HR Exit Interview Summary & Notes</label>
                <Textarea
                  placeholder="Record summary of exit interview feedback, reasons, and parting remarks..."
                  value={exitInterviewNotes}
                  onChange={(e) => setExitInterviewNotes(e.target.value)}
                  className="text-xs min-h-[90px] rounded-lg"
                />
              </div>
            </div>

            <DialogFooter className="gap-2">
              <Button variant="outline" size="sm" onClick={() => setIsFinalizeModalOpen(false)}>
                Cancel
              </Button>
              <Button
                variant="destructive"
                size="sm"
                disabled={finalizeMutation.isPending}
                onClick={() => {
                  finalizeMutation.mutate({
                    id: selectedResignationForClearance.id,
                    exitInterviewNotes,
                  });
                }}
              >
                {finalizeMutation.isPending ? "Finalizing..." : "Complete Separation"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}
