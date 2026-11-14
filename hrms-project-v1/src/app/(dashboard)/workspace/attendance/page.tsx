"use client";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { attendanceApi } from "@/lib/api";
import {
  CalendarClock,
  Clock,
  Download,
  Search,
  Users,
  UserCheck,
  AlertCircle,
  FileSpreadsheet,
  CheckCircle,
  ChevronLeft,
  ChevronRight,
  FileText,
  Building,
  RefreshCw,
  Plus,
  ShieldCheck,
  CalendarDays,
} from "lucide-react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { TableSkeleton } from "@/components/skeletons";
import { EmptyState } from "@/components/ui/empty-state";
import { useModulePermission } from "@/context/PermissionContext";
import Link from "next/link";

// Status Badge with Apple HIG styling
const getStatusBadge = (status: string) => {
  switch (status) {
    case "PRESENT":
      return <Badge variant="success">Present</Badge>;
    case "LATE":
      return <Badge variant="warning">Late</Badge>;
    case "HALF_DAY":
      return (
        <Badge className="bg-amber-100 text-amber-800 dark:bg-amber-900/40 dark:text-amber-300 border-amber-200">
          Half Day
        </Badge>
      );
    case "ABSENT":
      return <Badge variant="destructive">Absent</Badge>;
    case "ON_LEAVE":
      return (
        <Badge className="bg-blue-100 text-blue-800 dark:bg-blue-900/40 dark:text-blue-300 border-blue-200">
          On Leave
        </Badge>
      );
    case "SHIFT_GIVEN":
      return <Badge variant="secondary">Shift Given</Badge>;
    case "PROXY_SHIFT_SWAP":
      return <Badge variant="default">Proxy Present</Badge>;
    default:
      return <Badge variant="outline">{status}</Badge>;
  }
};

const getVerificationBadge = (method?: string | null) => {
  if (!method || method === "NONE") return null;
  switch (method) {
    case "GPS":
      return (
        <span className="inline-flex items-center text-[11px] font-medium text-emerald-700 bg-emerald-50 dark:bg-emerald-950/40 dark:text-emerald-400 px-2 py-0.5 rounded-full border border-emerald-200">
          GPS Verified
        </span>
      );
    case "WIFI_IP":
      return (
        <span className="inline-flex items-center text-[11px] font-medium text-blue-700 bg-blue-50 dark:bg-blue-950/40 dark:text-blue-400 px-2 py-0.5 rounded-full border border-blue-200">
          Office Wi-Fi
        </span>
      );
    case "MANUAL_CORRECTION":
      return (
        <span className="inline-flex items-center text-[11px] font-medium text-purple-700 bg-purple-50 dark:bg-purple-950/40 dark:text-purple-400 px-2 py-0.5 rounded-full border border-purple-200">
          Regularized
        </span>
      );
    default:
      return (
        <span className="inline-flex items-center text-[11px] text-muted-foreground bg-muted px-2 py-0.5 rounded-full">
          {method}
        </span>
      );
  }
};

const formatTime = (dateString?: string | null) => {
  if (!dateString) return "--:--";
  return new Date(dateString).toLocaleTimeString([], {
    hour: "2-digit",
    minute: "2-digit",
  });
};

export default function AttendanceHubPage() {
  const queryClient = useQueryClient();
  const canEdit = useModulePermission("attendance", "edit");
  const canView = useModulePermission("attendance", "view");
  const isPrivileged = canEdit || canView;

  // Tabs state
  const [activeTab, setActiveTab] = useState(isPrivileged ? "register" : "personal");

  // Company Register Filters
  const [selectedDate, setSelectedDate] = useState<string>(
    new Date().toISOString().split("T")[0]
  );
  const [selectedDepartment, setSelectedDepartment] = useState<string>("");
  const [selectedStatus, setSelectedStatus] = useState<string>("ALL");
  const [searchTerm, setSearchTerm] = useState<string>("");

  // Regularization Dialog State
  const [isRegularizeOpen, setIsRegularizeOpen] = useState(false);
  const [regularizeDate, setRegularizeDate] = useState(
    new Date().toISOString().split("T")[0]
  );
  const [requestedCheckIn, setRequestedCheckIn] = useState("09:00");
  const [requestedCheckOut, setRequestedCheckOut] = useState("18:00");
  const [regularizeReason, setRegularizeReason] = useState("");
  const [regularizeError, setRegularizeError] = useState("");
  const [regularizeSuccess, setRegularizeSuccess] = useState("");

  // 1. Fetch Personal Attendance History (My Attendance)
  const {
    data: personalHistory,
    isLoading: personalLoading,
    error: personalError,
  } = useQuery({
    queryKey: ["attendanceHistory"],
    queryFn: attendanceApi.getMyHistory,
  });

  // 2. Fetch Personal Dashboard Stats (My Attendance)
  const { data: myStats } = useQuery({
    queryKey: ["myDashboardStats"],
    queryFn: attendanceApi.getMyStats,
  });

  // 3. Fetch Company Attendance Register (Admin / HR)
  const {
    data: companyData,
    isLoading: registerLoading,
    refetch: refetchRegister,
  } = useQuery({
    queryKey: [
      "companyAttendanceRecords",
      selectedDate,
      selectedDepartment,
      selectedStatus,
      searchTerm,
    ],
    queryFn: () =>
      attendanceApi.getCompanyRecords({
        date: selectedDate,
        departmentId: selectedDepartment || undefined,
        status: selectedStatus !== "ALL" ? selectedStatus : undefined,
        search: searchTerm || undefined,
      }),
    enabled: isPrivileged,
  });

  // 4. Regularization Mutation
  const regularizeMutation = useMutation({
    mutationFn: async (payload: {
      date: string;
      requestedCheckIn?: string;
      requestedCheckOut?: string;
      reason: string;
    }) => attendanceApi.requestCorrection(payload),
    onSuccess: () => {
      setRegularizeSuccess("Regularization request submitted successfully!");
      setRegularizeError("");
      queryClient.invalidateQueries({ queryKey: ["attendanceHistory"] });
      queryClient.invalidateQueries({ queryKey: ["pendingCorrections"] });
      setTimeout(() => {
        setIsRegularizeOpen(false);
        setRegularizeSuccess("");
        setRegularizeReason("");
      }, 1500);
    },
    onError: (err: any) => {
      setRegularizeError(
        err.response?.data?.message || "Failed to submit regularization request."
      );
    },
  });

  const handleRegularizeSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setRegularizeError("");
    setRegularizeSuccess("");

    if (!regularizeReason.trim()) {
      setRegularizeError("Please provide a reason for the attendance correction.");
      return;
    }

    // Build ISO dates for check-in and check-out
    const checkInIso = requestedCheckIn
      ? `${regularizeDate}T${requestedCheckIn}:00`
      : undefined;
    const checkOutIso = requestedCheckOut
      ? `${regularizeDate}T${requestedCheckOut}:00`
      : undefined;

    regularizeMutation.mutate({
      date: regularizeDate,
      requestedCheckIn: checkInIso,
      requestedCheckOut: checkOutIso,
      reason: regularizeReason.trim(),
    });
  };

  // 5. Export Company Register to CSV
  const handleExportCsv = async () => {
    try {
      const blob = await attendanceApi.exportAttendanceCsv({
        date: selectedDate,
        departmentId: selectedDepartment || undefined,
        status: selectedStatus !== "ALL" ? selectedStatus : undefined,
        search: searchTerm || undefined,
      });
      const url = window.URL.createObjectURL(new Blob([blob]));
      const link = document.createElement("a");
      link.href = url;
      link.setAttribute("download", `attendance_register_${selectedDate}.csv`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
    } catch (err) {
      console.error("Export failed", err);
    }
  };

  // Date stepper
  const handleStepDay = (days: number) => {
    const current = new Date(selectedDate);
    current.setDate(current.getDate() + days);
    setSelectedDate(current.toISOString().split("T")[0]);
  };

  // Unique departments for filter
  const departments = Array.from(
    new Set(
      (companyData?.records || [])
        .map((r: any) => r.department)
        .filter((d: string) => d && d !== "Unassigned")
    )
  );

  return (
    <div className="max-w-[1300px] mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8 space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-border/40 pb-5">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-foreground tracking-tight flex items-center gap-2">
            <Clock className="w-7 h-7 text-primary" />
            Time & Attendance
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            Enterprise daily muster roll, personal check-ins, and regularization workflow.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <Button
            variant="outline"
            onClick={() => setIsRegularizeOpen(true)}
            className="flex items-center gap-1.5 shadow-sm"
          >
            <CalendarDays className="w-4 h-4 text-primary" />
            Request Regularization
          </Button>

          {isPrivileged && (
            <Button
              onClick={handleExportCsv}
              variant="default"
              className="bg-primary hover:bg-primary/90 text-secondary font-semibold flex items-center gap-1.5 shadow-sm"
            >
              <Download className="w-4 h-4" />
              Export Register (.csv)
            </Button>
          )}
        </div>
      </div>

      {/* Main Tabs Navigation */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="bg-muted/60 p-1 rounded-xl">
          {isPrivileged && (
            <TabsTrigger value="register" className="flex items-center gap-2 rounded-lg font-medium text-sm">
              <Users className="w-4 h-4" />
              Company Register
            </TabsTrigger>
          )}
          <TabsTrigger value="personal" className="flex items-center gap-2 rounded-lg font-medium text-sm">
            <CalendarClock className="w-4 h-4" />
            My Attendance
          </TabsTrigger>
          {isPrivileged && (
            <TabsTrigger value="approvals" className="flex items-center gap-2 rounded-lg font-medium text-sm">
              <ShieldCheck className="w-4 h-4" />
              Pending Approvals
            </TabsTrigger>
          )}
        </TabsList>

        {/* ========================================================================= */}
        {/* TAB 1: COMPANY REGISTER (ENTERPRISE MUSTER ROLL) */}
        {/* ========================================================================= */}
        {isPrivileged && (
          <TabsContent value="register" className="space-y-6">
            {/* KPI Cards Row */}
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
              <Card className="bg-card shadow-sm border-border/60">
                <CardContent className="p-4">
                  <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                    Total Staff
                  </span>
                  <p className="text-2xl font-bold text-foreground mt-1 tabular-nums">
                    {companyData?.stats?.total ?? "--"}
                  </p>
                </CardContent>
              </Card>

              <Card className="bg-card shadow-sm border-border/60">
                <CardContent className="p-4">
                  <span className="text-xs font-semibold text-emerald-600 dark:text-emerald-400 uppercase tracking-wider">
                    Present
                  </span>
                  <p className="text-2xl font-bold text-emerald-600 dark:text-emerald-400 mt-1 tabular-nums">
                    {companyData?.stats?.present ?? "--"}
                  </p>
                </CardContent>
              </Card>

              <Card className="bg-card shadow-sm border-border/60">
                <CardContent className="p-4">
                  <span className="text-xs font-semibold text-amber-600 dark:text-amber-400 uppercase tracking-wider">
                    Late
                  </span>
                  <p className="text-2xl font-bold text-amber-600 dark:text-amber-400 mt-1 tabular-nums">
                    {companyData?.stats?.late ?? "--"}
                  </p>
                </CardContent>
              </Card>

              <Card className="bg-card shadow-sm border-border/60">
                <CardContent className="p-4">
                  <span className="text-xs font-semibold text-orange-600 dark:text-orange-400 uppercase tracking-wider">
                    Half-Day
                  </span>
                  <p className="text-2xl font-bold text-orange-600 dark:text-orange-400 mt-1 tabular-nums">
                    {companyData?.stats?.halfDay ?? "--"}
                  </p>
                </CardContent>
              </Card>

              <Card className="bg-card shadow-sm border-border/60">
                <CardContent className="p-4">
                  <span className="text-xs font-semibold text-rose-600 dark:text-rose-400 uppercase tracking-wider">
                    Absent
                  </span>
                  <p className="text-2xl font-bold text-rose-600 dark:text-rose-400 mt-1 tabular-nums">
                    {companyData?.stats?.absent ?? "--"}
                  </p>
                </CardContent>
              </Card>

              <Card className="bg-card shadow-sm border-border/60">
                <CardContent className="p-4">
                  <span className="text-xs font-semibold text-blue-600 dark:text-blue-400 uppercase tracking-wider">
                    On Leave
                  </span>
                  <p className="text-2xl font-bold text-blue-600 dark:text-blue-400 mt-1 tabular-nums">
                    {companyData?.stats?.onLeave ?? "--"}
                  </p>
                </CardContent>
              </Card>
            </div>

            {/* Filter Bar */}
            <Card className="shadow-sm border-border/60">
              <CardContent className="p-4 space-y-4 sm:space-y-0 sm:flex sm:items-center sm:justify-between sm:gap-4">
                {/* Date Stepper */}
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={() => handleStepDay(-1)}
                    className="h-9 w-9 shrink-0"
                    title="Previous Day"
                  >
                    <ChevronLeft className="h-4 w-4" />
                  </Button>

                  <Input
                    type="date"
                    value={selectedDate}
                    onChange={(e) => setSelectedDate(e.target.value)}
                    className="h-9 w-40 text-sm font-medium tabular-nums"
                  />

                  <Button
                    variant="outline"
                    size="icon"
                    onClick={() => handleStepDay(1)}
                    className="h-9 w-9 shrink-0"
                    title="Next Day"
                  >
                    <ChevronRight className="h-4 w-4" />
                  </Button>

                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() =>
                      setSelectedDate(new Date().toISOString().split("T")[0])
                    }
                    className="text-xs text-primary font-medium"
                  >
                    Today
                  </Button>
                </div>

                {/* Search & Select Filters */}
                <div className="flex flex-wrap items-center gap-2.5 flex-1 max-w-2xl justify-end">
                  <div className="relative flex-1 min-w-[180px]">
                    <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                    <Input
                      placeholder="Search member, code, or email..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="pl-8 h-9 text-sm"
                    />
                  </div>

                  <select
                    value={selectedDepartment}
                    onChange={(e) => setSelectedDepartment(e.target.value)}
                    className="h-9 px-3 rounded-md border border-input bg-background text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-primary cursor-pointer"
                  >
                    <option value="">All Departments</option>
                    {departments.map((dept: any) => (
                      <option key={dept} value={dept}>
                        {dept}
                      </option>
                    ))}
                  </select>

                  <select
                    value={selectedStatus}
                    onChange={(e) => setSelectedStatus(e.target.value)}
                    className="h-9 px-3 rounded-md border border-input bg-background text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-primary cursor-pointer"
                  >
                    <option value="ALL">All Statuses</option>
                    <option value="PRESENT">Present</option>
                    <option value="LATE">Late</option>
                    <option value="HALF_DAY">Half-Day</option>
                    <option value="ABSENT">Absent</option>
                    <option value="ON_LEAVE">On Leave</option>
                  </select>

                  <Button
                    variant="outline"
                    size="icon"
                    onClick={() => refetchRegister()}
                    className="h-9 w-9 shrink-0"
                    title="Refresh Data"
                  >
                    <RefreshCw className="h-4 w-4" />
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* Daily Register Table */}
            <Card className="shadow-sm border-border/60">
              <CardContent className="p-0">
                {registerLoading ? (
                  <div className="p-4">
                    <TableSkeleton
                      rowCount={8}
                      columnCount={7}
                      showSearch={false}
                      showAvatar={true}
                    />
                  </div>
                ) : companyData?.records?.length === 0 ? (
                  <EmptyState
                    icon={Users}
                    title="No Attendance Records"
                    description="No employees matched your current date or filter criteria."
                  />
                ) : (
                  <div className="overflow-x-auto">
                    <Table className="min-w-[950px]">
                      <TableHeader>
                        <TableRow>
                          <TableHead>Employee</TableHead>
                          <TableHead>Department & Role</TableHead>
                          <TableHead>Status</TableHead>
                          <TableHead>Check In</TableHead>
                          <TableHead>Check Out</TableHead>
                          <TableHead>Work Hours</TableHead>
                          <TableHead>Overtime</TableHead>
                          <TableHead>Verification</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {companyData?.records?.map((record: any) => (
                          <TableRow key={record.id} className="hover:bg-muted/40">
                            {/* Employee Info */}
                            <TableCell>
                              <div className="flex items-center gap-3">
                                <div className="w-8 h-8 rounded-full bg-primary/10 text-primary font-bold text-xs flex items-center justify-center shrink-0">
                                  {record.name
                                    ?.split(" ")
                                    .map((n: string) => n[0])
                                    .join("")
                                    .substring(0, 2)
                                    .toUpperCase() || "EM"}
                                </div>
                                <div className="truncate">
                                  <p className="font-semibold text-foreground text-sm leading-tight">
                                    {record.name}
                                  </p>
                                  <p className="text-xs text-muted-foreground font-mono mt-0.5">
                                    {record.employeeCode} · {record.email}
                                  </p>
                                </div>
                              </div>
                            </TableCell>

                            {/* Department & Role */}
                            <TableCell>
                              <p className="text-xs font-medium text-foreground">
                                {record.department}
                              </p>
                              <p className="text-[11px] text-muted-foreground capitalize">
                                {record.designation?.toLowerCase()}
                              </p>
                            </TableCell>

                            {/* Status Badge */}
                            <TableCell>{getStatusBadge(record.status)}</TableCell>

                            {/* Punch In */}
                            <TableCell className="tabular-nums text-sm text-foreground">
                              {formatTime(record.checkInTime)}
                            </TableCell>

                            {/* Punch Out */}
                            <TableCell className="tabular-nums text-sm text-foreground">
                              {formatTime(record.checkOutTime)}
                            </TableCell>

                            {/* Working Hours */}
                            <TableCell className="tabular-nums text-sm font-medium text-foreground">
                              {record.workingHours > 0
                                ? `${record.workingHours} hrs`
                                : "--"}
                            </TableCell>

                            {/* Overtime */}
                            <TableCell className="tabular-nums text-sm font-medium text-amber-600 dark:text-amber-400">
                              {record.overtimeHours > 0
                                ? `+${record.overtimeHours} hrs`
                                : "--"}
                            </TableCell>

                            {/* Verification Badge */}
                            <TableCell>
                              {getVerificationBadge(record.verificationMethod)}
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        )}

        {/* ========================================================================= */}
        {/* TAB 2: MY ATTENDANCE (PERSONAL 30-DAY LOG) */}
        {/* ========================================================================= */}
        <TabsContent value="personal" className="space-y-6">
          {/* Quick Stats Cards */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <Card className="bg-card shadow-sm border-border/60">
              <CardContent className="p-4">
                <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                  Today's Status
                </span>
                <div className="mt-2">
                  {getStatusBadge(myStats?.todayStatus || "PENDING")}
                </div>
              </CardContent>
            </Card>

            <Card className="bg-card shadow-sm border-border/60">
              <CardContent className="p-4">
                <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                  Monthly Attendance
                </span>
                <p className="text-2xl font-bold text-primary mt-1 tabular-nums">
                  {myStats?.attendancePercentage ?? 0}%
                </p>
              </CardContent>
            </Card>

            <Card className="bg-card shadow-sm border-border/60">
              <CardContent className="p-4">
                <span className="text-xs font-semibold text-emerald-600 dark:text-emerald-400 uppercase tracking-wider">
                  Days Present
                </span>
                <p className="text-2xl font-bold text-foreground mt-1 tabular-nums">
                  {myStats?.presentDays ?? 0}
                </p>
              </CardContent>
            </Card>

            <Card className="bg-card shadow-sm border-border/60">
              <CardContent className="p-4">
                <span className="text-xs font-semibold text-rose-600 dark:text-rose-400 uppercase tracking-wider">
                  Days Absent
                </span>
                <p className="text-2xl font-bold text-foreground mt-1 tabular-nums">
                  {myStats?.absentDays ?? 0}
                </p>
              </CardContent>
            </Card>
          </div>

          <Card className="shadow-sm border-border/60">
            <CardHeader className="pb-3 border-b border-border/50 flex flex-row items-center justify-between">
              <div>
                <CardTitle className="text-base font-semibold text-foreground flex items-center">
                  <CalendarClock className="size-4 mr-2 text-primary stroke-[1.5]" />
                  Last 30 Days
                </CardTitle>
                <CardDescription className="text-xs text-muted-foreground">
                  A log of your daily check-in and check-out records.
                </CardDescription>
              </div>
            </CardHeader>
            <CardContent className="p-0">
              {personalLoading ? (
                <div className="p-4">
                  <TableSkeleton
                    rowCount={6}
                    columnCount={5}
                    showSearch={false}
                    showAvatar={false}
                  />
                </div>
              ) : personalError ? (
                <div className="p-8 text-center text-destructive text-sm">
                  Failed to load attendance history.
                </div>
              ) : personalHistory?.length === 0 ? (
                <EmptyState
                  icon={CalendarClock}
                  title="No Attendance Records"
                  description="No attendance records found. Start clocking in from your workspace dashboard!"
                />
              ) : (
                <div className="overflow-x-auto">
                  <Table className="min-w-[680px]">
                    <TableHeader>
                      <TableRow>
                        <TableHead>Date</TableHead>
                        <TableHead>Shift</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Check In</TableHead>
                        <TableHead>Check Out</TableHead>
                        <TableHead className="text-right">Total Hours</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {personalHistory.map((record: any) => {
                        const isGiver = record.status === "SHIFT_GIVEN";
                        const isProxy = record.status === "PROXY_SHIFT_SWAP";

                        return (
                          <TableRow key={record.id} className="hover:bg-muted/30">
                            <TableCell className="font-medium text-foreground text-sm">
                              {new Date(record.date).toLocaleDateString(
                                undefined,
                                {
                                  weekday: "short",
                                  month: "short",
                                  day: "numeric",
                                }
                              )}
                            </TableCell>
                            <TableCell>
                              <div className="text-[13px]">
                                <p className="font-semibold text-foreground">
                                  {record.shift?.name || "Standard Shift"}
                                </p>
                                {isGiver && (
                                  <p className="text-xs text-primary font-medium">
                                    Given to:{" "}
                                    {record.shiftSwapRequest?.requester?.firstName}{" "}
                                    {record.shiftSwapRequest?.requester?.lastName}
                                  </p>
                                )}
                                {isProxy && (
                                  <p className="text-xs text-emerald-600 font-medium">
                                    Proxy for:{" "}
                                    {record.shiftSwapRequest?.target?.firstName}{" "}
                                    {record.shiftSwapRequest?.target?.lastName}
                                  </p>
                                )}
                              </div>
                            </TableCell>
                            <TableCell>{getStatusBadge(record.status)}</TableCell>
                            <TableCell className="text-muted-foreground tabular-nums text-sm">
                              {formatTime(record.checkInTime)}
                            </TableCell>
                            <TableCell className="text-muted-foreground tabular-nums text-sm">
                              {formatTime(record.checkOutTime)}
                            </TableCell>
                            <TableCell className="text-right font-medium text-foreground tabular-nums text-sm">
                              {record.workingHours
                                ? `${record.workingHours} hrs`
                                : "--"}
                            </TableCell>
                          </TableRow>
                        );
                      })}
                    </TableBody>
                  </Table>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* ========================================================================= */}
        {/* TAB 3: PENDING APPROVALS SHORTCUT */}
        {/* ========================================================================= */}
        {isPrivileged && (
          <TabsContent value="approvals" className="space-y-4">
            <Card className="border-border/60">
              <CardHeader>
                <CardTitle className="text-lg font-bold text-foreground">
                  Attendance Regularization Approvals
                </CardTitle>
                <CardDescription>
                  Review and action employee requests for missed punches, biometric corrections, and half-day adjustments.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <p className="text-sm text-muted-foreground">
                  Navigate to the dedicated approvals interface to inspect reasons, timestamps, and leave notes.
                </p>
                <Link href="/workspace/attendance/approvals">
                  <Button className="bg-primary hover:bg-primary/90 text-secondary font-semibold">
                    Open Attendance Approvals Desk →
                  </Button>
                </Link>
              </CardContent>
            </Card>
          </TabsContent>
        )}
      </Tabs>

      {/* ========================================================================= */}
      {/* REQUEST REGULARIZATION DIALOG */}
      {/* ========================================================================= */}
      <Dialog open={isRegularizeOpen} onOpenChange={setIsRegularizeOpen}>
        <DialogContent className="sm:max-w-[480px]">
          <DialogHeader>
            <DialogTitle className="text-lg font-bold flex items-center gap-2 text-foreground">
              <CalendarDays className="w-5 h-5 text-primary" />
              Request Attendance Regularization
            </DialogTitle>
            <DialogDescription className="text-xs text-muted-foreground">
              Submit a correction request for missed clock-ins, biometric failures, or on-duty client visits.
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleRegularizeSubmit} className="space-y-4 py-2">
            {regularizeError && (
              <div className="p-3 text-xs text-rose-700 bg-rose-50 dark:bg-rose-950/40 border border-rose-200 rounded-lg flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{regularizeError}</span>
              </div>
            )}

            {regularizeSuccess && (
              <div className="p-3 text-xs text-emerald-700 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 rounded-lg flex items-center gap-2">
                <CheckCircle className="w-4 h-4 shrink-0" />
                <span>{regularizeSuccess}</span>
              </div>
            )}

            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-foreground uppercase tracking-wider">
                Date to Regularize *
              </label>
              <Input
                type="date"
                required
                value={regularizeDate}
                onChange={(e) => setRegularizeDate(e.target.value)}
                className="text-sm"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-foreground uppercase tracking-wider">
                  Check-In Time
                </label>
                <Input
                  type="time"
                  value={requestedCheckIn}
                  onChange={(e) => setRequestedCheckIn(e.target.value)}
                  className="text-sm font-mono"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-foreground uppercase tracking-wider">
                  Check-Out Time
                </label>
                <Input
                  type="time"
                  value={requestedCheckOut}
                  onChange={(e) => setRequestedCheckOut(e.target.value)}
                  className="text-sm font-mono"
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-foreground uppercase tracking-wider">
                Reason / Note *
              </label>
              <textarea
                required
                rows={3}
                placeholder="e.g. Forgot to clock in, on-site client presentation in morning, biometric scanner offline..."
                value={regularizeReason}
                onChange={(e) => setRegularizeReason(e.target.value)}
                className="w-full text-sm rounded-md border border-input bg-background p-2.5 text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
              />
            </div>

            <DialogFooter className="pt-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => setIsRegularizeOpen(false)}
                disabled={regularizeMutation.isPending}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={regularizeMutation.isPending}
                className="bg-primary hover:bg-primary/90 text-secondary font-semibold"
              >
                {regularizeMutation.isPending ? "Submitting..." : "Submit Correction"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
