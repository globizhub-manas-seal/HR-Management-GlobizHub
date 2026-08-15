"use client";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import axios from "axios";
import { 
  Settings, Plus, FileText, CheckCircle2, 
  XCircle, Clock, ShieldAlert, Briefcase
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { 
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogTrigger
} from "@/components/ui/dialog";
import { 
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue 
} from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

export default function LeaveSettingsPage() {
  const queryClient = useQueryClient();
  const [isModalOpen, setIsModalOpen] = useState(false);
  
  // New Policy Form State
  const [form, setForm] = useState({
    name: "",
    type: "CASUAL",
    daysPerYear: 12,
    isPaid: true,
    requiresApproval: true,
    carryForward: false
  });

  const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000";
  const getToken = () => localStorage.getItem("hrms_token");

  // Fetch Existing Policies
  const { data: policies, isLoading } = useQuery({
    queryKey: ["leavePolicies"],
    queryFn: async () => {
      const res = await axios.get(`${API_URL}/leaves/policy`, {
        headers: { Authorization: `Bearer ${getToken()}` }
      });
      return res.data;
    }
  });

  // Create Policy Mutation
  const createMutation = useMutation({
    mutationFn: async (newPolicy: typeof form) => {
      await axios.post(`${API_URL}/leaves/policy`, newPolicy, {
        headers: { Authorization: `Bearer ${getToken()}` }
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["leavePolicies"] });
      setIsModalOpen(false);
      setForm({ name: "", type: "CASUAL", daysPerYear: 12, isPaid: true, requiresApproval: true, carryForward: false });
    }
  });

  // UI Helpers
  const getTypeIcon = (type: string) => {
    switch (type) {
      case "CASUAL": return <Briefcase className="w-5 h-5 text-blue-500" />;
      case "MEDICAL": return <ShieldAlert className="w-5 h-5 text-rose-500" />;
      case "EARNED": return <CheckCircle2 className="w-5 h-5 text-emerald-500" />;
      case "UNPAID": return <XCircle className="w-5 h-5 text-slate-500" />;
      default: return <FileText className="w-5 h-5 text-indigo-500" />;
    }
  };

  return (
    <div className="p-8 max-w-6xl mx-auto space-y-8 font-sans min-h-screen bg-slate-50/50">
      
      {/* HEADER */}
      <div className="flex justify-between items-end gap-4">
        <div>
          <h1 className="text-3xl font-bold text-slate-900 tracking-tight flex items-center">
            <Settings className="w-8 h-8 mr-3 text-indigo-600" />
            Leave Policies
          </h1>
          <p className="text-slate-500 mt-1">Configure company-wide time off rules, accruals, and payroll impacts.</p>
        </div>

        {/* CREATE POLICY BUTTON & MODAL */}
        <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
          <DialogTrigger render={
            <Button className="bg-indigo-600 hover:bg-indigo-700 text-white shadow-sm">
              <Plus className="w-4 h-4 mr-2" /> Create Policy
            </Button>
          } />
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>New Leave Policy</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 py-4">
              
              <div className="space-y-2">
                <label className="text-sm font-medium text-slate-700">Policy Name</label>
                <Input 
                  placeholder="e.g., Annual Earned Leave" 
                  value={form.name} 
                  onChange={e => setForm({...form, name: e.target.value})}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium text-slate-700">Leave Type</label>
                  <Select value={form.type} onValueChange={(val) => setForm({...form, type: val || "CASUAL"})}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="CASUAL">Casual</SelectItem>
                      <SelectItem value="MEDICAL">Medical (Sick)</SelectItem>
                      <SelectItem value="EARNED">Earned</SelectItem>
                      <SelectItem value="MATERNITY">Maternity</SelectItem>
                      <SelectItem value="PATERNITY">Paternity</SelectItem>
                      <SelectItem value="UNPAID">Unpaid</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium text-slate-700">Days Per Year</label>
                  <Input 
                    type="number" 
                    value={form.daysPerYear} 
                    onChange={e => setForm({...form, daysPerYear: parseFloat(e.target.value)})}
                  />
                </div>
              </div>

              {/* Toggles (Using checkboxes styled nicely for simplicity) */}
              <div className="space-y-3 pt-2">
                <label className="flex items-center space-x-3 p-3 border border-slate-200 rounded-lg bg-slate-50 cursor-pointer hover:bg-slate-100 transition-colors">
                  <input type="checkbox" className="w-4 h-4 accent-indigo-600" checked={form.isPaid} onChange={e => setForm({...form, isPaid: e.target.checked})} />
                  <div>
                    <p className="text-sm font-semibold text-slate-900">Paid Leave</p>
                    <p className="text-xs text-slate-500">If unchecked, Payroll will deduct salary for these days.</p>
                  </div>
                </label>

                <label className="flex items-center space-x-3 p-3 border border-slate-200 rounded-lg bg-slate-50 cursor-pointer hover:bg-slate-100 transition-colors">
                  <input type="checkbox" className="w-4 h-4 accent-indigo-600" checked={form.requiresApproval} onChange={e => setForm({...form, requiresApproval: e.target.checked})} />
                  <div>
                    <p className="text-sm font-semibold text-slate-900">Requires Manager Approval</p>
                    <p className="text-xs text-slate-500">Employee must wait for a manager to approve the request.</p>
                  </div>
                </label>

                <label className="flex items-center space-x-3 p-3 border border-slate-200 rounded-lg bg-slate-50 cursor-pointer hover:bg-slate-100 transition-colors">
                  <input type="checkbox" className="w-4 h-4 accent-indigo-600" checked={form.carryForward} onChange={e => setForm({...form, carryForward: e.target.checked})} />
                  <div>
                    <p className="text-sm font-semibold text-slate-900">Carry Forward</p>
                    <p className="text-xs text-slate-500">Unused days roll over to the next year instead of expiring.</p>
                  </div>
                </label>
              </div>

            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsModalOpen(false)}>Cancel</Button>
              <Button onClick={() => createMutation.mutate(form)} disabled={!form.name || createMutation.isPending} className="bg-indigo-600 hover:bg-indigo-700 text-white">
                {createMutation.isPending ? "Saving..." : "Save Policy"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {/* EXISTING POLICIES GRID */}
      {isLoading ? (
        <div className="flex justify-center p-12 text-indigo-500 animate-pulse">Loading policies...</div>
      ) : policies?.length === 0 ? (
        <div className="text-center p-16 border-2 border-dashed border-slate-200 rounded-2xl bg-white text-slate-500">
          <Settings className="w-12 h-12 mx-auto text-slate-300 mb-3" />
          <h3 className="text-lg font-bold text-slate-900 mb-1">No Leave Policies Found</h3>
          <p className="text-sm">Create your first policy (e.g., Casual Leave) to start tracking time off.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {policies?.map((policy: any) => (
            <Card key={policy.id} className="border-slate-200 shadow-sm hover:shadow-md transition-all">
              <CardHeader className="pb-3 flex flex-row items-start justify-between space-y-0">
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 rounded-xl bg-slate-50 flex items-center justify-center border border-slate-100">
                    {getTypeIcon(policy.type)}
                  </div>
                  <div>
                    <CardTitle className="text-lg font-bold text-slate-900 leading-tight">{policy.name}</CardTitle>
                    <p className="text-xs font-semibold text-slate-500 tracking-wider mt-0.5">{policy.type}</p>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="flex items-end justify-between py-4 border-b border-slate-100">
                  <div>
                    <p className="text-sm font-medium text-slate-500 mb-1">Annual Quota</p>
                    <div className="flex items-baseline space-x-1">
                      <span className="text-2xl font-bold text-slate-900">{policy.daysPerYear}</span>
                      <span className="text-sm text-slate-500">days</span>
                    </div>
                  </div>
                  {policy.isPaid ? (
                    <Badge className="bg-emerald-50 text-emerald-700 hover:bg-emerald-100 border-emerald-200">Paid Leave</Badge>
                  ) : (
                    <Badge variant="outline" className="bg-rose-50 text-rose-700 hover:bg-rose-100 border-rose-200">Unpaid Leave</Badge>
                  )}
                </div>
                
                <div className="pt-4 space-y-2">
                  <div className="flex items-center text-sm text-slate-600">
                    {policy.requiresApproval ? <CheckCircle2 className="w-4 h-4 mr-2 text-indigo-500" /> : <XCircle className="w-4 h-4 mr-2 text-slate-300" />}
                    Manager Approval Required
                  </div>
                  <div className="flex items-center text-sm text-slate-600">
                    {policy.carryForward ? <CheckCircle2 className="w-4 h-4 mr-2 text-indigo-500" /> : <XCircle className="w-4 h-4 mr-2 text-slate-300" />}
                    Carry Unused Days to Next Year
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}