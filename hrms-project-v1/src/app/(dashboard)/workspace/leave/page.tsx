"use client";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import axios from "axios";
import { 
  Calendar, Clock, CheckCircle2, XCircle, 
  Plus, Loader2, CalendarDays, Activity, Briefcase
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { 
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter 
} from "@/components/ui/dialog";
import { 
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue 
} from "@/components/ui/select";
import { 
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow 
} from "@/components/ui/table";

export default function EmployeeLeavePage() {
  const queryClient = useQueryClient();
  const [isApplyModalOpen, setIsApplyModalOpen] = useState(false);
  
  // Form State
  const [leaveForm, setLeaveForm] = useState({
    type: "CASUAL",
    startDate: "",
    endDate: "",
    reason: ""
  });

  const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000";
  const getToken = () => localStorage.getItem("hrms_token");

  // Fetch Leave Balance
  const { data: balance, isLoading: loadingBalance } = useQuery({
    queryKey: ["myLeaveBalance"],
    queryFn: async () => {
      const res = await axios.get(`${API_URL}/leaves/balance`, {
        headers: { Authorization: `Bearer ${getToken()}` }
      });
      return res.data;
    }
  });

  // Fetch Leave History
  const { data: leaveHistory, isLoading: loadingHistory } = useQuery({
    queryKey: ["myLeaves"],
    queryFn: async () => {
      const res = await axios.get(`${API_URL}/leaves/my`, {
        headers: { Authorization: `Bearer ${getToken()}` }
      });
      return res.data;
    }
  });

  // Apply for Leave Mutation
  const applyMutation = useMutation({
    mutationFn: async (formData: typeof leaveForm) => {
      await axios.post(`${API_URL}/leaves`, formData, {
        headers: { Authorization: `Bearer ${getToken()}` }
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["myLeaves"] });
      queryClient.invalidateQueries({ queryKey: ["myLeaveBalance"] });
      setIsApplyModalOpen(false);
      setLeaveForm({ type: "CASUAL", startDate: "", endDate: "", reason: "" });
    },
    onError: (error: any) => {
      alert(error.response?.data?.message || "Failed to apply for leave");
    }
  });

  // UI Helpers
  const getStatusBadge = (status: string) => {
    switch(status) {
      case "APPROVED": return <div className="flex items-center text-emerald-600 bg-emerald-50 px-2.5 py-1 rounded-full text-xs font-semibold border border-emerald-100"><CheckCircle2 className="w-3.5 h-3.5 mr-1" /> Approved</div>;
      case "PENDING": return <div className="flex items-center text-amber-600 bg-amber-50 px-2.5 py-1 rounded-full text-xs font-semibold border border-amber-100"><Clock className="w-3.5 h-3.5 mr-1" /> Pending</div>;
      case "REJECTED": return <div className="flex items-center text-rose-600 bg-rose-50 px-2.5 py-1 rounded-full text-xs font-semibold border border-rose-100"><XCircle className="w-3.5 h-3.5 mr-1" /> Rejected</div>;
      default: return null;
    }
  };

  const calculateDays = (start: string, end: string) => {
    if (!start || !end) return 0;
    const s = new Date(start);
    const e = new Date(end);
    if (e < s) return 0;
    return Math.ceil((e.getTime() - s.getTime()) / (1000 * 3600 * 24)) + 1;
  };

  const requestedDays = calculateDays(leaveForm.startDate, leaveForm.endDate);

  if (loadingBalance || loadingHistory) {
    return <div className="flex justify-center items-center h-screen"><Loader2 className="w-8 h-8 animate-spin text-indigo-600" /></div>;
  }

  return (
    <div className="p-8 max-w-6xl mx-auto font-sans space-y-8 bg-slate-50/50 min-h-screen">
      
      {/* HEADER */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold text-slate-900 tracking-tight">Leave</h1>
          <p className="text-slate-500 mt-1">Manage your leave balances and upcoming Leaves.</p>
        </div>
        <Button 
          onClick={() => setIsApplyModalOpen(true)}
          className="bg-indigo-600 hover:bg-indigo-700 text-white shadow-sm"
        >
          <Plus className="w-4 h-4 mr-2" /> Request Time Off
        </Button>
      </div>

      {/* BALANCE CARDS */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm relative overflow-hidden group">
          <div className="absolute top-0 right-0 w-2 h-full bg-blue-500"></div>
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold text-slate-700">Casual Leave</h3>
            <div className="p-2 bg-blue-50 rounded-lg text-blue-600"><CalendarDays className="w-5 h-5" /></div>
          </div>
          <div className="flex items-baseline space-x-2">
            <span className="text-4xl font-bold text-slate-900">{balance?.casual || 0}</span>
            <span className="text-sm font-medium text-slate-500">days available</span>
          </div>
        </div>

        <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm relative overflow-hidden">
          <div className="absolute top-0 right-0 w-2 h-full bg-rose-500"></div>
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold text-slate-700">Medical Leave</h3>
            <div className="p-2 bg-rose-50 rounded-lg text-rose-600"><Activity className="w-5 h-5" /></div>
          </div>
          <div className="flex items-baseline space-x-2">
            <span className="text-4xl font-bold text-slate-900">{balance?.medical || 0}</span>
            <span className="text-sm font-medium text-slate-500">days available</span>
          </div>
        </div>

        <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm relative overflow-hidden">
          <div className="absolute top-0 right-0 w-2 h-full bg-emerald-500"></div>
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold text-slate-700">Earned Leave</h3>
            <div className="p-2 bg-emerald-50 rounded-lg text-emerald-600"><Briefcase className="w-5 h-5" /></div>
          </div>
          <div className="flex items-baseline space-x-2">
            <span className="text-4xl font-bold text-slate-900">{balance?.earned || 0}</span>
            <span className="text-sm font-medium text-slate-500">days available</span>
          </div>
        </div>
      </div>

      {/* LEAVE HISTORY TABLE */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="p-6 border-b border-slate-100 flex items-center">
          <Calendar className="w-5 h-5 mr-2 text-indigo-500" />
          <h2 className="text-lg font-bold text-slate-900">Leave History</h2>
        </div>
        
        {leaveHistory?.length === 0 ? (
          <div className="p-12 text-center text-slate-500">
            You haven't requested any time off yet.
          </div>
        ) : (
          <Table>
            <TableHeader className="bg-slate-50/50">
              <TableRow>
                <TableHead>Type</TableHead>
                <TableHead>Date Range</TableHead>
                <TableHead>Days</TableHead>
                <TableHead>Reason</TableHead>
                <TableHead className="text-right">Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {leaveHistory?.map((leave: any) => (
                <TableRow key={leave.id}>
                  <TableCell className="font-medium text-slate-900">{leave.type.replace("_", " ")}</TableCell>
                  <TableCell className="text-slate-600">
                    {new Date(leave.startDate).toLocaleDateString()} - {new Date(leave.endDate).toLocaleDateString()}
                  </TableCell>
                  <TableCell className="text-slate-600 font-medium">
                    {calculateDays(leave.startDate, leave.endDate)}
                  </TableCell>
                  <TableCell className="text-slate-500 max-w-[200px] truncate">{leave.reason}</TableCell>
                  <TableCell className="text-right flex justify-end">
                    {getStatusBadge(leave.status)}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </div>

      {/* APPLY FOR LEAVE MODAL */}
      <Dialog open={isApplyModalOpen} onOpenChange={setIsApplyModalOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="text-xl font-bold">Request Time Off</DialogTitle>
          </DialogHeader>
          
          <div className="space-y-5 py-4">
            <div className="space-y-2">
              <label className="text-sm font-medium text-slate-700">Leave Type</label>
              <Select value={leaveForm.type} onValueChange={(val) => setLeaveForm({...leaveForm, type: val || "CASUAL"})}>
                <SelectTrigger className="bg-slate-50 border-slate-200">
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

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-sm font-medium text-slate-700">Start Date</label>
                <Input 
                  type="date" 
                  value={leaveForm.startDate} 
                  onChange={(e) => setLeaveForm({...leaveForm, startDate: e.target.value})}
                  className="bg-slate-50 border-slate-200"
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium text-slate-700">End Date</label>
                <Input 
                  type="date" 
                  value={leaveForm.endDate} 
                  onChange={(e) => setLeaveForm({...leaveForm, endDate: e.target.value})}
                  className="bg-slate-50 border-slate-200"
                />
              </div>
            </div>

            {requestedDays > 0 && (
              <div className="p-3 bg-indigo-50 border border-indigo-100 rounded-lg flex items-center justify-between">
                <span className="text-sm text-indigo-700 font-medium">Total requested days:</span>
                <span className="text-lg font-bold text-indigo-700">{requestedDays}</span>
              </div>
            )}

            <div className="space-y-2">
              <label className="text-sm font-medium text-slate-700">Reason</label>
              <Textarea 
                placeholder="Brief reason for your time off..." 
                value={leaveForm.reason}
                onChange={(e) => setLeaveForm({...leaveForm, reason: e.target.value})}
                className="bg-slate-50 border-slate-200 resize-none h-24"
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsApplyModalOpen(false)}>Cancel</Button>
            <Button 
              onClick={() => applyMutation.mutate(leaveForm)}
              disabled={!leaveForm.startDate || !leaveForm.endDate || !leaveForm.reason || applyMutation.isPending || requestedDays <= 0}
              className="bg-indigo-600 hover:bg-indigo-700 text-white"
            >
              {applyMutation.isPending ? "Submitting..." : "Submit Request"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}