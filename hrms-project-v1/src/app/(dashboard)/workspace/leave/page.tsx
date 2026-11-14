"use client";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { leavesApi } from "@/lib/api";
import { 
  Calendar, Clock, CheckCircle2, XCircle, 
  Plus, Loader2, CalendarDays, Activity, Briefcase
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { 
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription 
} from "@/components/ui/dialog";
import { 
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue 
} from "@/components/ui/select";
import { 
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow 
} from "@/components/ui/table";
import { Skeleton } from "@/components/ui/skeleton";
import { TableSkeleton } from "@/components/skeletons";
import { EmptyState } from "@/components/ui/empty-state";
import { useToast } from "@/components/ToastProvider";

export default function EmployeeLeavePage() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [isApplyModalOpen, setIsApplyModalOpen] = useState(false);
  
  // Form State
  const [leaveForm, setLeaveForm] = useState({
    type: "CASUAL",
    startDate: "",
    endDate: "",
    reason: "",
    isHalfDay: false,
    halfDaySession: "FIRST_HALF" as "FIRST_HALF" | "SECOND_HALF",
  });

  // Fetch Leave Balance
  const { data: balance, isLoading: loadingBalance } = useQuery({
    queryKey: ["myLeaveBalance"],
    queryFn: leavesApi.getMyBalance,
  });

  // Fetch Leave History
  const { data: leaveHistory, isLoading: loadingHistory } = useQuery({
    queryKey: ["myLeaves"],
    queryFn: leavesApi.getMyLeaves,
  });

  // Apply for Leave Mutation
  const applyMutation = useMutation({
    mutationFn: (formData: typeof leaveForm) =>
      leavesApi.applyLeave({
        type: formData.type,
        startDate: formData.startDate,
        endDate: formData.isHalfDay ? formData.startDate : formData.endDate,
        reason: formData.reason,
        isHalfDay: formData.isHalfDay,
        halfDaySession: formData.isHalfDay ? formData.halfDaySession : undefined,
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["myLeaves"] });
      queryClient.invalidateQueries({ queryKey: ["myLeaveBalance"] });
      setIsApplyModalOpen(false);
      setLeaveForm({
        type: "CASUAL",
        startDate: "",
        endDate: "",
        reason: "",
        isHalfDay: false,
        halfDaySession: "FIRST_HALF",
      });
      toast("Your leave request has been submitted.");
    },
    onError: (error: any) => {
      toast(error.response?.data?.message || "Failed to apply for leave", "error");
    }
  });

  // Withdraw Leave Mutation
  const withdrawMutation = useMutation({
    mutationFn: (id: string) => leavesApi.withdrawLeave(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["myLeaves"] });
      queryClient.invalidateQueries({ queryKey: ["myLeaveBalance"] });
      toast("Leave request withdrawn successfully.");
    },
    onError: (err: any) => {
      toast(err.response?.data?.message || "Failed to withdraw leave request", "error");
    },
  });

  // Apple HIG Semantic Status Badges
  const getStatusBadge = (status: string) => {
    switch(status) {
      case "APPROVED":
        return <Badge variant="success">Approved</Badge>;
      case "PENDING":
        return <Badge variant="warning">Pending</Badge>;
      case "REJECTED":
        return <Badge variant="destructive">Rejected</Badge>;
      case "WITHDRAWN":
        return <Badge variant="secondary">Withdrawn</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  const calculateDays = (start: string, end: string) => {
    if (!start || !end) return 0;
    const s = new Date(start);
    const e = new Date(end);
    if (e < s) return 0;
    return Math.ceil((e.getTime() - s.getTime()) / (1000 * 3600 * 24)) + 1;
  };

  const requestedDays = leaveForm.isHalfDay
    ? 0.5
    : calculateDays(leaveForm.startDate, leaveForm.endDate);

  return (
    <div className="max-w-[1200px] mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8 space-y-8">
      {/* HEADER */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="type-large-title font-bold text-foreground tracking-tight">Leave Management</h1>
          <p className="type-subhead text-label-secondary mt-1">Manage your leave balances and upcoming time off.</p>
        </div>
        <Button 
          variant="default"
          size="default"
          onClick={() => setIsApplyModalOpen(true)}
          className="gap-2 shrink-0"
        >
          <Plus className="size-4 stroke-[1.5]" /> Request Time Off
        </Button>
      </div>

      {/* BALANCE CARDS */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 sm:gap-6">
        {loadingBalance ? (
          Array.from({ length: 3 }).map((_, i) => (
            <div key={`bal-skel-${i}`} className="bg-card rounded-[20px] p-5 sm:p-6 apple-shadow-card space-y-4">
              <div className="flex items-center justify-between">
                <Skeleton className="h-5 w-28" />
                <Skeleton className="size-9 rounded-[10px]" />
              </div>
              <div className="space-y-1">
                <Skeleton className="h-8 w-16" />
                <Skeleton className="h-3.5 w-24" />
              </div>
            </div>
          ))
        ) : (
          <>
            <div className="bg-card rounded-[20px] p-5 sm:p-6 apple-shadow-card border-0 dark:border dark:border-hairline dark:border-separator flex flex-col justify-between hover:scale-[1.01] transition-transform">
              <div className="flex items-center justify-between mb-4">
                <h3 className="type-headline font-semibold text-foreground">Casual Leave</h3>
                <div className="p-2.5 bg-primary/12 rounded-[12px] text-primary">
                  <CalendarDays className="size-5 stroke-[1.5]" />
                </div>
              </div>
              <div className="flex items-baseline gap-2">
                <span className="type-title-1 font-bold text-foreground tabular-nums">{balance?.casual || 0}</span>
                <span className="type-subhead text-label-secondary">days available</span>
              </div>
            </div>

            <div className="bg-card rounded-[20px] p-5 sm:p-6 apple-shadow-card border-0 dark:border dark:border-hairline dark:border-separator flex flex-col justify-between hover:scale-[1.01] transition-transform">
              <div className="flex items-center justify-between mb-4">
                <h3 className="type-headline font-semibold text-foreground">Medical Leave</h3>
                <div className="p-2.5 bg-[rgba(255,59,48,0.15)] rounded-[12px] text-destructive">
                  <Activity className="size-5 stroke-[1.5]" />
                </div>
              </div>
              <div className="flex items-baseline gap-2">
                <span className="type-title-1 font-bold text-foreground tabular-nums">{balance?.medical || 0}</span>
                <span className="type-subhead text-label-secondary">days available</span>
              </div>
            </div>

            <div className="bg-card rounded-[20px] p-5 sm:p-6 apple-shadow-card border-0 dark:border dark:border-hairline dark:border-separator flex flex-col justify-between hover:scale-[1.01] transition-transform">
              <div className="flex items-center justify-between mb-4">
                <h3 className="type-headline font-semibold text-foreground">Earned Leave</h3>
                <div className="p-2.5 bg-[rgba(52,199,89,0.15)] rounded-[12px] text-status-green">
                  <Briefcase className="size-5 stroke-[1.5]" />
                </div>
              </div>
              <div className="flex items-baseline gap-2">
                <span className="type-title-1 font-bold text-foreground tabular-nums">{balance?.earned || 0}</span>
                <span className="type-subhead text-label-secondary">days available</span>
              </div>
            </div>
          </>
        )}
      </div>

      {/* LEAVE HISTORY TABLE */}
      {loadingHistory ? (
        <div className="bg-card rounded-[20px] p-6 apple-shadow-card">
          <TableSkeleton rowCount={5} columnCount={5} showSearch={false} showAvatar={false} />
        </div>
      ) : (
        <div className="bg-card rounded-[20px] border-0 dark:border dark:border-hairline dark:border-separator apple-shadow-card overflow-hidden">
          <div className="p-5 border-b border-hairline border-separator/50 flex items-center">
            <Calendar className="size-5 mr-2 text-primary stroke-[1.5]" />
            <h2 className="type-headline font-semibold text-foreground">Leave History</h2>
          </div>
          
          {leaveHistory?.length === 0 ? (
            <EmptyState
              icon={Calendar}
              title="No Leave Requests"
              description="You haven't requested any time off yet."
              actionLabel="Request Time Off"
              onAction={() => setIsApplyModalOpen(true)}
            />
          ) : (
            <div className="overflow-x-auto" tabIndex={0} aria-label="Leave history table. Scroll horizontally to view all columns.">
              <Table className="min-w-[750px]">
                <TableHeader>
                  <TableRow>
                    <TableHead>Type</TableHead>
                    <TableHead>Date Range</TableHead>
                    <TableHead>Days</TableHead>
                    <TableHead>Reason</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Action</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {leaveHistory?.map((leave: any) => {
                    const isWithdrawable =
                      leave.status === "PENDING" ||
                      (leave.status === "APPROVED" &&
                        new Date(leave.endDate) >= new Date());

                    return (
                      <TableRow key={leave.id}>
                        <TableCell className="font-medium text-foreground">
                          {leave.type.replace("_", " ")}
                        </TableCell>
                        <TableCell className="text-label-secondary tabular-nums">
                          {new Date(leave.startDate).toLocaleDateString()} -{" "}
                          {new Date(leave.endDate).toLocaleDateString()}
                        </TableCell>
                        <TableCell className="text-foreground font-medium tabular-nums">
                          {leave.totalDays !== undefined
                            ? `${leave.totalDays} day${leave.totalDays !== 1 ? "s" : ""}`
                            : calculateDays(leave.startDate, leave.endDate)}
                        </TableCell>
                        <TableCell className="max-w-[240px]">
                          <p className="text-label-secondary truncate">
                            {leave.reason}
                          </p>
                          {leave.rejectionReason && (
                            <p
                              className="text-xs text-rose-600 font-medium mt-0.5 truncate"
                              title={leave.rejectionReason}
                            >
                              Rejected: {leave.rejectionReason}
                            </p>
                          )}
                        </TableCell>
                        <TableCell>{getStatusBadge(leave.status)}</TableCell>
                        <TableCell className="text-right">
                          {isWithdrawable && (
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => withdrawMutation.mutate(leave.id)}
                              disabled={withdrawMutation.isPending}
                              className="text-xs text-rose-600 hover:text-rose-700 hover:bg-rose-50 dark:hover:bg-rose-950/40 h-8 px-2.5 font-medium"
                            >
                              {leave.status === "PENDING" ? "Withdraw" : "Cancel"}
                            </Button>
                          )}
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>
          )}
        </div>
      )}

      {/* APPLY FOR LEAVE MODAL */}
      <Dialog open={isApplyModalOpen} onOpenChange={setIsApplyModalOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle className="type-title-2 font-semibold">Request Time Off</DialogTitle>
            <DialogDescription className="type-subhead text-label-secondary">
              Select your leave category, date range, and reason.
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4 py-2">
            <div className="space-y-1.5">
              <label htmlFor="leave-type" className="type-subhead text-label-secondary font-medium">Leave Type</label>
              <Select value={leaveForm.type} onValueChange={(val) => setLeaveForm({...leaveForm, type: val || "CASUAL"})}>
                <SelectTrigger id="leave-type">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="CASUAL">Casual Leave</SelectItem>
                  <SelectItem value="MEDICAL">Medical Leave</SelectItem>
                  <SelectItem value="EARNED">Earned Leave</SelectItem>
                  <SelectItem value="UNPAID">Unpaid Leave</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Half Day Checkbox */}
            <div className="flex items-center gap-2 pt-1 pb-1">
              <input
                type="checkbox"
                id="half-day-toggle"
                checked={leaveForm.isHalfDay}
                onChange={(e) =>
                  setLeaveForm({
                    ...leaveForm,
                    isHalfDay: e.target.checked,
                    endDate: e.target.checked ? leaveForm.startDate : leaveForm.endDate,
                  })
                }
                className="rounded border-input text-primary focus:ring-primary h-4 w-4 cursor-pointer"
              />
              <label
                htmlFor="half-day-toggle"
                className="text-sm font-medium text-foreground cursor-pointer select-none"
              >
                Apply for Half Day (0.5 working day)
              </label>
            </div>

            {leaveForm.isHalfDay ? (
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <label htmlFor="leave-date" className="type-subhead text-label-secondary font-medium">Date</label>
                  <Input 
                    type="date" 
                    id="leave-date"
                    value={leaveForm.startDate} 
                    onChange={(e) => setLeaveForm({...leaveForm, startDate: e.target.value, endDate: e.target.value})}
                  />
                </div>
                <div className="space-y-1.5">
                  <label htmlFor="leave-session" className="type-subhead text-label-secondary font-medium">Half Day Session</label>
                  <Select
                    value={leaveForm.halfDaySession}
                    onValueChange={(val: any) =>
                      setLeaveForm({ ...leaveForm, halfDaySession: val })
                    }
                  >
                    <SelectTrigger id="leave-session">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="FIRST_HALF">First Half (Morning)</SelectItem>
                      <SelectItem value="SECOND_HALF">Second Half (Afternoon)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            ) : (
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <label htmlFor="leave-start-date" className="type-subhead text-label-secondary font-medium">Start Date</label>
                  <Input 
                    type="date" 
                    id="leave-start-date"
                    value={leaveForm.startDate} 
                    onChange={(e) => setLeaveForm({...leaveForm, startDate: e.target.value})}
                  />
                </div>
                <div className="space-y-1.5">
                  <label htmlFor="leave-end-date" className="type-subhead text-label-secondary font-medium">End Date</label>
                  <Input 
                    type="date" 
                    id="leave-end-date"
                    value={leaveForm.endDate} 
                    onChange={(e) => setLeaveForm({...leaveForm, endDate: e.target.value})}
                  />
                </div>
              </div>
            )}

            {requestedDays > 0 && (
              <div className="p-3 bg-primary/10 rounded-[10px] flex items-center justify-between border border-hairline border-primary/20">
                <span className="type-subhead text-primary font-medium">Total requested days:</span>
                <span className="type-headline font-bold text-primary tabular-nums">
                  {requestedDays} {requestedDays === 1 ? "day" : "days"}
                </span>
              </div>
            )}

            <div className="space-y-1.5">
              <label htmlFor="leave-reason" className="type-subhead text-label-secondary font-medium">Reason</label>
              <Textarea 
                placeholder="Brief reason for your time off..." 
                id="leave-reason"
                value={leaveForm.reason}
                onChange={(e) => setLeaveForm({...leaveForm, reason: e.target.value})}
                className="resize-none h-24"
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" size="default" onClick={() => setIsApplyModalOpen(false)}>Cancel</Button>
            <Button 
              variant="default"
              size="default"
              onClick={() => applyMutation.mutate(leaveForm)}
              disabled={!leaveForm.startDate || (!leaveForm.isHalfDay && !leaveForm.endDate) || !leaveForm.reason || applyMutation.isPending || requestedDays <= 0}
            >
              {applyMutation.isPending ? "Submitting..." : "Submit Request"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
