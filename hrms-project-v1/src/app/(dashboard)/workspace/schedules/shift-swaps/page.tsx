"use client";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import axios from "axios";
import { format } from "date-fns";
import { 
  CalendarClock, 
  ArrowLeftRight, 
  Loader2, 
  Send, 
  CheckCircle, 
  XCircle, 
  AlertCircle, 
  Undo,
  HelpCircle,
  FileText,
  User,
  ArrowRight
} from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import Link from "next/link";

export default function ShiftSwapsPage() {
  const queryClient = useQueryClient();
  const [isOpen, setIsOpen] = useState(false);
  const [cancelReasonOpen, setCancelReasonOpen] = useState<string | null>(null);
  
  // Form States
  const [targetEmployeeId, setTargetEmployeeId] = useState("");
  const [date, setDate] = useState("");
  const [reason, setReason] = useState("");
  const [cancelReason, setCancelReason] = useState("");

  const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000";

  // 1. Fetch current logged-in employee details
  const { data: me } = useQuery({
    queryKey: ["myProfile"],
    queryFn: async () => {
      const token = localStorage.getItem("hrms_token");
      const res = await axios.get(`${API_URL}/auth/me`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      return res.data;
    }
  });

  // 2. Fetch all employees in company (to pick a target)
  const { data: employees, isLoading: loadingEmployees } = useQuery({
    queryKey: ["allEmployees"],
    queryFn: async () => {
      const token = localStorage.getItem("hrms_token");
      const res = await axios.get(`${API_URL}/employees`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      return res.data;
    }
  });

  // Filter out the logged-in employee
  const targetEmployeeOptions = employees?.filter((emp: any) => emp.id !== me?.id) || [];

  // 3. Query B's schedule for selected date
  const { data: targetSchedule, isLoading: loadingTargetSchedule } = useQuery({
  queryKey: ["targetSchedule", targetEmployeeId, date],

  queryFn: async () => {
    if (!targetEmployeeId || !date) return null;

    console.log("================================");
    console.log("🔍 FETCHING TARGET SCHEDULE");
    console.log("Target Employee ID:", targetEmployeeId);
    console.log("Selected Date:", date);
    console.log("================================");

    const token = localStorage.getItem("hrms_token");

    const url = `${API_URL}/schedules/employee/${targetEmployeeId}?date=${date}`;

    console.log("Request URL:", url);

    const res = await axios.get(url, {
      headers: { Authorization: `Bearer ${token}` }
    });

    console.log("✅ API STATUS:", res.status);
    console.log("✅ API RESPONSE:", res.data);
    console.log("✅ API RESPONSE JSON:", JSON.stringify(res.data, null, 2));

    return res.data;
  },

  enabled: !!targetEmployeeId && !!date
});

  // 4. Fetch Sent, Received, and Manager Approval Requests
  const { data: swapData, isLoading: loadingSwaps } = useQuery({
    queryKey: ["shiftSwaps"],
    queryFn: async () => {
      const token = localStorage.getItem("hrms_token");
      const res = await axios.get(`${API_URL}/shift-swaps/my-requests`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      return res.data;
    }
  });

  // Mutations
  const createRequestMutation = useMutation({
    mutationFn: async (payload: any) => {
      const token = localStorage.getItem("hrms_token");
      const res = await axios.post(`${API_URL}/shift-swaps/request`, payload, {
        headers: { Authorization: `Bearer ${token}` }
      });
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["shiftSwaps"] });
      alert("Shift transfer request submitted successfully!");
      setIsOpen(false);
      setTargetEmployeeId("");
      setDate("");
      setReason("");
    },
    onError: (err: any) => {
      alert(err.response?.data?.message || "Failed to create request.");
    }
  });

  const respondRequestMutation = useMutation({
    mutationFn: async ({ id, accept }: { id: string; accept: boolean }) => {
      const token = localStorage.getItem("hrms_token");
      const res = await axios.post(`${API_URL}/shift-swaps/${id}/respond`, { accept }, {
        headers: { Authorization: `Bearer ${token}` }
      });
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["shiftSwaps"] });
      alert("Response recorded successfully!");
    },
    onError: (err: any) => {
      alert(err.response?.data?.message || "Failed to submit response.");
    }
  });

  const approveRequestMutation = useMutation({
    mutationFn: async ({ id, approve }: { id: string; approve: boolean }) => {
      const token = localStorage.getItem("hrms_token");
      const res = await axios.post(`${API_URL}/shift-swaps/${id}/approve`, { approve }, {
        headers: { Authorization: `Bearer ${token}` }
      });
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["shiftSwaps"] });
      alert("Approval action processed!");
    },
    onError: (err: any) => {
      alert(err.response?.data?.message || "Approval action failed.");
    }
  });

  const cancelRequestMutation = useMutation({
    mutationFn: async ({ id, reason }: { id: string; reason?: string }) => {
      const token = localStorage.getItem("hrms_token");
      const res = await axios.post(`${API_URL}/shift-swaps/${id}/cancel`, { reason }, {
        headers: { Authorization: `Bearer ${token}` }
      });
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["shiftSwaps"] });
      alert("Cancellation request processed.");
      setCancelReasonOpen(null);
      setCancelReason("");
    },
    onError: (err: any) => {
      alert(err.response?.data?.message || "Cancellation failed.");
    }
  });

  const ackCancelMutation = useMutation({
    mutationFn: async (id: string) => {
      const token = localStorage.getItem("hrms_token");
      const res = await axios.post(`${API_URL}/shift-swaps/${id}/acknowledge-cancel`, {}, {
        headers: { Authorization: `Bearer ${token}` }
      });
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["shiftSwaps"] });
      alert("Cancellation request acknowledged. Awaiting manager approval.");
    },
    onError: (err: any) => {
      alert(err.response?.data?.message || "Failed to acknowledge cancellation.");
    }
  });

  const approveCancelMutation = useMutation({
    mutationFn: async ({ id, approve }: { id: string; approve: boolean }) => {
      const token = localStorage.getItem("hrms_token");
      const res = await axios.post(`${API_URL}/shift-swaps/${id}/approve-cancel`, { approve }, {
        headers: { Authorization: `Bearer ${token}` }
      });
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["shiftSwaps"] });
      alert("Cancellation approval action processed!");
    },
    onError: (err: any) => {
      alert(err.response?.data?.message || "Cancellation approval failed.");
    }
  });

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "PENDING_EMPLOYEE":
        return <Badge className="bg-blue-500 text-white">Pending Consent</Badge>;
      case "PENDING_MANAGER":
        return <Badge className="bg-purple-500 text-white">Pending Manager</Badge>;
      case "APPROVED":
        return <Badge className="bg-emerald-500 text-white">Approved</Badge>;
      case "REJECTED_BY_EMPLOYEE":
        return <Badge variant="destructive">Declined by Giver</Badge>;
      case "REJECTED_BY_MANAGER":
        return <Badge variant="destructive">Rejected by Manager</Badge>;
      case "CANCELLED":
        return <Badge variant="secondary">Cancelled</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  const handleCreateRequest = (e: React.FormEvent) => {
    e.preventDefault();
    if (!targetEmployeeId || !date || !targetSchedule?.shift?.id) {
      alert("Please ensure Employee, Date and Shift Details are loaded.");
      return;
    }
    createRequestMutation.mutate({
      targetEmployeeId,
      date,
      targetShiftId: targetSchedule.shift.id,
      reason
    });
  };

  const handleCancelClick = (reqId: string, status: string, dateStr: string, shiftTime: string) => {
    const shiftStart = new Date(dateStr);
    const [hours, minutes] = shiftTime.split(':').map(Number);
    shiftStart.setHours(hours || 0, minutes || 0, 0, 0);

    const now = new Date();
    const diffMs = shiftStart.getTime() - now.getTime();
    const diffHours = diffMs / (1000 * 60 * 60);

    if (status === "APPROVED" && diffHours <= 24) {
      // Cancellation within 24h requires a manager reason
      setCancelReasonOpen(reqId);
    } else {
      // Direct cancel
      if (confirm("Are you sure you want to cancel this request?")) {
        cancelRequestMutation.mutate({ id: reqId });
      }
    }
  };

  if (loadingSwaps || loadingEmployees) {
    return (
      <div className="flex h-96 items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-emerald-500" />
      </div>
    );
  }

  return (
    <div className="p-8 max-w-6xl mx-auto space-y-8">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <Link href="/workspace/schedules" className="text-sm text-slate-500 hover:text-slate-800 flex items-center mb-2">
            <ArrowLeftRight className="w-4 h-4 mr-1 Rotate-90" /> Back to Schedules
          </Link>
          <h1 className="text-3xl font-bold text-slate-900">Shift Swaps & Transfers</h1>
          <p className="text-slate-500 mt-1">Request a colleague to give up their shift, give consent, or approve transfers.</p>
        </div>

        {/* Initiate Request Modal */}
        <Dialog open={isOpen} onOpenChange={setIsOpen}>
          <DialogTrigger render={
            <Button className="bg-emerald-500 hover:bg-emerald-600 text-white shadow-md transition-all flex items-center">
              <CalendarClock className="w-4 h-4 mr-2" /> Request Shift Transfer
            </Button>
          } />
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>New Shift Transfer Request</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleCreateRequest} className="space-y-4 pt-4">
              <div>
                <label className="text-sm font-semibold text-slate-700">1. Select Date</label>
                <Input 
                  type="date" 
                  value={date} 
                  onChange={(e) => setDate(e.target.value)} 
                  className="mt-1"
                  required
                />
              </div>

              <div>
                <label className="text-sm font-semibold text-slate-700">2. Select Shift Owner (Employee B)</label>
                <Select value={targetEmployeeId} onValueChange={(val) => setTargetEmployeeId(val || "")} required>
                  <SelectTrigger className="mt-1">
                    <SelectValue placeholder="Select Colleague..." />
                  </SelectTrigger>
                  <SelectContent>
                    {targetEmployeeOptions.map((emp: any) => (
                      <SelectItem key={emp.id} value={emp.id}>
                        {emp.firstName} {emp.lastName} ({emp.email})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Dynamic Shift Fetching Feedback */}
              {targetEmployeeId && date && (
                <Card className="bg-slate-50 border-slate-200 mt-2">
                  <CardContent className="py-3 px-4">
                    {loadingTargetSchedule ? (
                      <div className="flex items-center text-slate-500 text-sm">
                        <Loader2 className="h-4 w-4 animate-spin mr-2 text-emerald-500" />
                        Fetching colleague's schedule...
                      </div>
                    ) : targetSchedule?.shift ? (
                      <div className="text-slate-800 text-sm space-y-1">
                        <p className="font-bold flex items-center text-emerald-700">
                          <CheckCircle className="w-4 h-4 mr-1 text-emerald-500" /> Shift Found!
                        </p>
                        <p className="font-semibold text-slate-700">Shift Name: {targetSchedule.shift.name}</p>
                        <p className="text-slate-600">Hours: {targetSchedule.shift.startTime} - {targetSchedule.shift.endTime}</p>
                      </div>
                    ) : (
                      <div className="text-amber-700 text-sm font-semibold flex items-start">
                        <AlertCircle className="w-4 h-4 mr-1.5 mt-0.5 text-amber-500 flex-shrink-0" />
                        No active shift assigned to this colleague on this date.
                      </div>
                    )}
                  </CardContent>
                </Card>
              )}

              <div>
                <label className="text-sm font-semibold text-slate-700">Reason for Request</label>
                <Textarea 
                  placeholder="Explain why you need this shift coverage..." 
                  value={reason} 
                  onChange={(e) => setReason(e.target.value)} 
                  className="mt-1"
                />
              </div>

              <div className="pt-2 flex justify-end space-x-2">
                <Button type="button" variant="outline" onClick={() => setIsOpen(false)}>Cancel</Button>
                <Button 
                  type="submit" 
                  className="bg-emerald-500 hover:bg-emerald-600 text-white"
                  disabled={!targetSchedule?.shift || createRequestMutation.isPending}
                >
                  {createRequestMutation.isPending ? "Submitting..." : "Send Request"}
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Main Grid Lists */}
      <div className="space-y-8">
        
        {/* SECTION 1: RECEIVED REQUESTS (Others requesting your shift) */}
        <Card className="border-slate-200 shadow-sm">
          <CardHeader className="bg-slate-50/50 border-b border-slate-100">
            <CardTitle className="text-lg flex items-center text-slate-800">
              <Undo className="w-5 h-5 mr-2 text-indigo-500" /> Requests Requiring Your Consent
            </CardTitle>
            <CardDescription>Colleagues who want to work your shift. Your Accept is their consent.</CardDescription>
          </CardHeader>
          <CardContent className="p-4">
            {swapData?.received?.length === 0 ? (
              <div className="text-center py-6 text-slate-500 text-sm">No incoming swap requests found.</div>
            ) : (
              <div className="space-y-4">
                {swapData?.received?.map((req: any) => (
                  <div key={req.id} className="p-4 border border-slate-100 rounded-xl bg-slate-50 hover:bg-slate-100/50 transition-colors flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div className="space-y-2">
                      <div className="flex items-center space-x-2">
                        <User className="w-4 h-4 text-slate-400" />
                        <span className="font-bold text-slate-900">{req.requester.firstName} {req.requester.lastName}</span>
                        <span className="text-slate-500 text-xs">requests coverage for</span>
                        <Badge variant="outline" className="bg-white">{format(new Date(req.date), "EEE, MMM d")}</Badge>
                      </div>
                      
                      <div className="text-xs text-slate-600 space-y-1">
                        <p className="font-semibold text-indigo-600">Your Shift: {req.originalShiftName} ({req.originalShiftStart} - {req.originalShiftEnd})</p>
                        {req.reason && <p className="italic text-slate-500 flex items-center"><FileText className="w-3.5 h-3.5 mr-1" /> "{req.reason}"</p>}
                      </div>

                      {/* Cancellation request visual */}
                      {req.cancellationRequested && (
                        <div className="text-xs bg-amber-50 border border-amber-200 text-amber-900 rounded-lg p-2 flex items-center justify-between">
                          <span className="font-semibold flex items-center">
                            <AlertCircle className="w-4 h-4 mr-1 text-amber-500" />
                            Requester requests cancellation: "{req.cancellationReason}"
                          </span>
                          {!req.cancellationTargetAck && (
                            <Button 
                              size="sm" 
                              variant="outline" 
                              className="bg-white hover:bg-amber-100 text-amber-900 border-amber-300 ml-2"
                              onClick={() => ackCancelMutation.mutate(req.id)}
                            >
                              Acknowledge Cancel
                            </Button>
                          )}
                          {req.cancellationTargetAck && <Badge variant="secondary" className="bg-amber-200 text-amber-900">Acknowledged</Badge>}
                        </div>
                      )}
                    </div>

                    <div className="flex items-center gap-2 self-end md:self-center">
                      {req.status === "PENDING_EMPLOYEE" ? (
                        <>
                          <Button 
                            size="sm" 
                            variant="outline" 
                            className="text-red-600 hover:text-red-700 hover:bg-red-50 border-red-200"
                            onClick={() => respondRequestMutation.mutate({ id: req.id, accept: false })}
                          >
                            <XCircle className="w-4 h-4 mr-1" /> Decline
                          </Button>
                          <Button 
                            size="sm" 
                            className="bg-emerald-500 hover:bg-emerald-600 text-white"
                            onClick={() => respondRequestMutation.mutate({ id: req.id, accept: true })}
                          >
                            <CheckCircle className="w-4 h-4 mr-1" /> Consent
                          </Button>
                        </>
                      ) : (
                        getStatusBadge(req.status)
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* SECTION 2: SENT REQUESTS (Requests you have made) */}
        <Card className="border-slate-200 shadow-sm">
          <CardHeader className="bg-slate-50/50 border-b border-slate-100">
            <CardTitle className="text-lg flex items-center text-slate-800">
              <Send className="w-5 h-5 mr-2 text-emerald-500" /> Shift Coverage Requests You Sent
            </CardTitle>
            <CardDescription>View status of shift coverage you requested from colleagues.</CardDescription>
          </CardHeader>
          <CardContent className="p-4">
            {swapData?.sent?.length === 0 ? (
              <div className="text-center py-6 text-slate-500 text-sm">No requests sent yet.</div>
            ) : (
              <div className="space-y-4">
                {swapData?.sent?.map((req: any) => (
                  <div key={req.id} className="p-4 border border-slate-100 rounded-xl bg-slate-50 hover:bg-slate-100/50 transition-colors flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div className="space-y-2">
                      <div className="flex items-center space-x-2">
                        <span className="text-slate-500 text-xs">Request to work shift of</span>
                        <span className="font-bold text-slate-900">{req.target.firstName} {req.target.lastName}</span>
                        <span className="text-slate-500 text-xs">on</span>
                        <Badge variant="outline" className="bg-white">{format(new Date(req.date), "EEE, MMM d")}</Badge>
                      </div>

                      <div className="text-xs text-slate-600 space-y-1">
                        <p className="font-semibold text-emerald-700">Target Shift: {req.originalShiftName} ({req.originalShiftStart} - {req.originalShiftEnd})</p>
                        {req.reason && <p className="italic text-slate-500 flex items-center"><FileText className="w-3.5 h-3.5 mr-1" /> "{req.reason}"</p>}
                      </div>

                      {/* Manager Display */}
                      {req.manager && (
                        <p className="text-[11px] text-slate-400">
                          Approver: Manager {req.manager.firstName} {req.manager.lastName}
                        </p>
                      )}

                      {/* Cancellation status warning */}
                      {req.cancellationRequested && (
                        <div className="text-xs text-amber-800 bg-amber-50 rounded-lg p-2 flex items-center">
                          <AlertCircle className="w-4 h-4 mr-1 text-amber-500" />
                          Cancellation requested. Awaiting colleague acknowledgement & manager approval.
                        </div>
                      )}
                    </div>

                    <div className="flex items-center gap-2 self-end md:self-center">
                      {getStatusBadge(req.status)}
                      
                      {/* Cancel Trigger */}
                      {req.status !== "CANCELLED" && req.status !== "REJECTED_BY_EMPLOYEE" && req.status !== "REJECTED_BY_MANAGER" && !req.cancellationRequested && (
                        <Button 
                          size="sm" 
                          variant="ghost" 
                          className="text-slate-500 hover:text-red-600 hover:bg-red-50"
                          onClick={() => handleCancelClick(req.id, req.status, req.date, req.originalShiftStart)}
                        >
                          Cancel
                        </Button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* SECTION 3: MANAGER APPROVALS (Approvals pending manager's review) */}
        {(me?.role === "MANAGER" || me?.role === "SUPER_ADMIN" || me?.role === "HR_HEAD") && (
          <Card className="border-slate-200 shadow-sm border-l-purple-500 border-l-4">
            <CardHeader className="bg-slate-50/50 border-b border-slate-100">
              <CardTitle className="text-lg flex items-center text-slate-800">
                <CheckCircle className="w-5 h-5 mr-2 text-purple-600" /> Approvals Pending Your Action (Manager / Admin)
              </CardTitle>
              <CardDescription>Review and approve or reject shift transfer requests from your team.</CardDescription>
            </CardHeader>
            <CardContent className="p-4">
              {swapData?.approvals?.length === 0 ? (
                <div className="text-center py-6 text-slate-500 text-sm">No approval tasks assigned.</div>
              ) : (
                <div className="space-y-4">
                  {swapData?.approvals?.map((req: any) => (
                    <div key={req.id} className="p-4 border border-slate-100 rounded-xl bg-slate-50 hover:bg-slate-100/50 transition-colors flex flex-col md:flex-row md:items-center justify-between gap-4">
                      <div className="space-y-2">
                        <div className="flex flex-wrap items-center gap-1.5 text-sm">
                          <span className="font-bold text-slate-900">{req.requester.firstName} {req.requester.lastName}</span>
                          <span className="text-slate-500 text-xs">wants to take shift of</span>
                          <span className="font-bold text-slate-950">{req.target.firstName} {req.target.lastName}</span>
                          <span className="text-slate-500 text-xs">on</span>
                          <Badge variant="outline" className="bg-white">{format(new Date(req.date), "EEE, MMM d")}</Badge>
                        </div>

                        <div className="text-xs text-slate-600 space-y-1">
                          <p className="font-semibold text-slate-800">Swapped Shift: {req.originalShiftName} ({req.originalShiftStart} - {req.originalShiftEnd})</p>
                          {req.reason && <p className="italic text-slate-500"><span className="font-semibold">Reason:</span> "{req.reason}"</p>}
                        </div>

                        {/* Cancellation pending review info */}
                        {req.cancellationRequested && (
                          <div className="text-xs border border-amber-200 bg-amber-50/50 rounded-lg p-2.5 space-y-1.5">
                            <p className="font-bold text-amber-900 flex items-center">
                              <AlertCircle className="w-4 h-4 mr-1 text-amber-500" />
                              cancellation request details
                            </p>
                            <p className="text-amber-800">Reason: "{req.cancellationReason}"</p>
                            <div className="flex space-x-2 pt-1">
                              <Button 
                                size="xs" 
                                variant="outline"
                                className="bg-white hover:bg-red-50 text-red-600 border-red-200"
                                onClick={() => approveCancelMutation.mutate({ id: req.id, approve: false })}
                              >
                                Decline Cancel
                              </Button>
                              <Button 
                                size="xs"
                                className="bg-red-500 hover:bg-red-600 text-white"
                                onClick={() => approveCancelMutation.mutate({ id: req.id, approve: true })}
                              >
                                Approve Cancel
                              </Button>
                            </div>
                          </div>
                        )}
                      </div>

                      <div className="flex items-center gap-2 self-end md:self-center">
                        {req.status === "PENDING_MANAGER" ? (
                          <>
                            <Button 
                              size="sm" 
                              variant="outline" 
                              className="text-red-600 hover:text-red-700 hover:bg-red-50 border-red-200"
                              onClick={() => approveRequestMutation.mutate({ id: req.id, approve: false })}
                            >
                              Reject
                            </Button>
                            <Button 
                              size="sm" 
                              className="bg-emerald-500 hover:bg-emerald-600 text-white"
                              onClick={() => approveRequestMutation.mutate({ id: req.id, approve: true })}
                            >
                              Approve
                            </Button>
                          </>
                        ) : (
                          getStatusBadge(req.status)
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        )}

      </div>

      {/* Cancellation Reason Dialog (for within 24h cancellations) */}
      <Dialog open={!!cancelReasonOpen} onOpenChange={(open) => !open && setCancelReasonOpen(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Urgent Cancellation Reason Required</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 pt-4">
            <p className="text-sm text-slate-500">
              This shift starts within 24 hours. A manager must approve this cancellation. Please provide a brief explanation.
            </p>
            <Textarea
              placeholder="e.g. Family emergency, sudden illness..."
              value={cancelReason}
              onChange={(e) => setCancelReason(e.target.value)}
              required
            />
            <div className="flex justify-end space-x-2 pt-2">
              <Button variant="outline" onClick={() => setCancelReasonOpen(null)}>Cancel</Button>
              <Button 
                className="bg-red-500 hover:bg-red-600 text-white"
                disabled={!cancelReason || cancelRequestMutation.isPending}
                onClick={() => {
                  if (cancelReasonOpen) {
                    cancelRequestMutation.mutate({ id: cancelReasonOpen, reason: cancelReason });
                  }
                }}
              >
                {cancelRequestMutation.isPending ? "Submitting..." : "Submit Cancellation Request"}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

    </div>
  );
}
