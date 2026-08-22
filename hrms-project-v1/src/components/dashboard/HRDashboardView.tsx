"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import axios from "axios";
import Link from "next/link";
import { useState } from "react";
import { Users, UserCheck, UserX, Clock, Megaphone, FileText, Calendar, Check, X, Loader2, Award, ClipboardList, Send, Calculator } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";

export function HRDashboardView() {
  const queryClient = useQueryClient();
  const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000";
  const getToken = () => localStorage.getItem("hrms_token");

  // Local state for Announcement Publisher
  const [announcementForm, setAnnouncementForm] = useState({ title: "", content: "" });
  const [publishing, setPublishing] = useState(false);

  // 1. Fetch Current User Profile
  const { data: currentUser } = useQuery({
    queryKey: ["currentUserProfile"],
    queryFn: async () => {
      const response = await axios.get(`${API_URL}/auth/me`, {
        headers: { Authorization: `Bearer ${getToken()}` }
      });
      return response.data;
    },
  });

  // 2. Fetch Admin Stats (Total employees, present, absent, late)
  const { data: stats, isLoading: loadingStats } = useQuery({
    queryKey: ["adminDashboardStats"],
    queryFn: async () => {
      const response = await axios.get(`${API_URL}/attendance/admin-stats`, {
        headers: { Authorization: `Bearer ${getToken()}` }
      });
      return response.data;
    },
  });

  // 3. Fetch Company Leave Requests
  const { data: leaves, isLoading: loadingLeaves } = useQuery({
    queryKey: ["companyLeaves"],
    queryFn: async () => {
      const response = await axios.get(`${API_URL}/leaves/company`, {
        headers: { Authorization: `Bearer ${getToken()}` }
      });
      return response.data;
    },
  });

  // 4. Fetch Announcements
  const { data: announcements } = useQuery({
    queryKey: ["hrAnnouncements"],
    queryFn: async () => {
      const response = await axios.get(`${API_URL}/announcements`, {
        headers: { Authorization: `Bearer ${getToken()}` }
      });
      return response.data;
    },
  });

  // 5. Mutation for Leave Approval
  const statusMutation = useMutation({
    mutationFn: async ({ id, status }: { id: string; status: string }) => {
      await axios.patch(
        `${API_URL}/leaves/${id}/status`,
        { status },
        { headers: { Authorization: `Bearer ${getToken()}` } }
      );
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["companyLeaves"] });
      queryClient.invalidateQueries({ queryKey: ["adminDashboardStats"] });
      alert("Leave status updated successfully.");
    },
    onError: (err: any) => {
      alert(err.response?.data?.message || "Failed to update leave status.");
    }
  });

  // 6. Mutation for Publishing Announcement
  const publishMutation = useMutation({
    mutationFn: async (data: typeof announcementForm) => {
      await axios.post(`${API_URL}/announcements`, data, {
        headers: { Authorization: `Bearer ${getToken()}` }
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["hrAnnouncements"] });
      setAnnouncementForm({ title: "", content: "" });
      alert("Announcement published successfully to all employees!");
    },
    onError: (err: any) => {
      alert(err.response?.data?.message || "Failed to publish announcement.");
    }
  });

  const handlePublish = (e: React.FormEvent) => {
    e.preventDefault();
    if (!announcementForm.title.trim() || !announcementForm.content.trim()) return;
    publishMutation.mutate(announcementForm);
  };

  const getGreeting = () => {
    const currentHour = new Date().getHours();
    if (currentHour < 12) return "Good morning";
    if (currentHour < 17) return "Good afternoon";
    return "Good evening";
  };

  // Filter pending leaves
  const pendingLeaves = leaves?.filter((req: any) => req.status === "PENDING") || [];

  return (
    <div className="p-8 max-w-7xl mx-auto space-y-6">
      
      {/* TOP BANNER */}
      <div className="bg-gradient-to-r from-emerald-600 to-teal-600 rounded-3xl p-8 text-white flex flex-col justify-between shadow-sm relative overflow-hidden">
        <div className="relative z-10">
          <span className="bg-white/20 text-xs px-3 py-1 rounded-full font-medium">HR Dashboard</span>
          <h1 className="text-3xl font-bold mt-4">
            {getGreeting()}, {currentUser?.firstName || 'HR Officer'}!
          </h1>
          <p className="text-emerald-50 mt-2 max-w-md text-sm">
            You have full administrative privileges to oversee organization metrics, process payroll, review document requests, and manage employee leave approvals.
          </p>
        </div>
      </div>

      {/* GLOBAL STATS */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Link href="/workspace/employees" className="block cursor-pointer">
          <Card className="bg-emerald-50/50 border-emerald-100 shadow-sm hover:shadow-md hover:bg-emerald-50/80 transition-all duration-200">
            <CardContent className="p-6">
              <div className="flex justify-between items-start">
                <div>
                  <p className="text-sm font-medium text-emerald-600">Total Headcount</p>
                  <span className="text-4xl font-bold text-emerald-900 mt-2 block">
                    {loadingStats ? "--" : stats?.totalEmployees}
                  </span>
                </div>
                <div className="p-3 bg-emerald-100 rounded-lg text-emerald-600"><Users className="w-5 h-5" /></div>
              </div>
            </CardContent>
          </Card>
        </Link>

        <Link href="/workspace/attendance" className="block cursor-pointer">
          <Card className="bg-blue-50/50 border-blue-100 shadow-sm hover:shadow-md hover:bg-blue-50/80 transition-all duration-200">
            <CardContent className="p-6">
              <div className="flex justify-between items-start">
                <div>
                  <p className="text-sm font-medium text-blue-600">Present Today</p>
                  <span className="text-4xl font-bold text-blue-900 mt-2 block">
                    {loadingStats ? "--" : stats?.presentToday}
                  </span>
                </div>
                <div className="p-3 bg-blue-100 rounded-lg text-blue-600"><UserCheck className="w-5 h-5" /></div>
              </div>
            </CardContent>
          </Card>
        </Link>

        <Link href="/workspace/attendance" className="block cursor-pointer">
          <Card className="bg-rose-50/50 border-rose-100 shadow-sm hover:shadow-md hover:bg-rose-50/80 transition-all duration-200">
            <CardContent className="p-6">
              <div className="flex justify-between items-start">
                <div>
                  <p className="text-sm font-medium text-rose-600">Absent / Off</p>
                  <span className="text-4xl font-bold text-rose-900 mt-2 block">
                    {loadingStats ? "--" : stats?.absentToday}
                  </span>
                </div>
                <div className="p-3 bg-rose-100 rounded-lg text-rose-600"><UserX className="w-5 h-5" /></div>
              </div>
            </CardContent>
          </Card>
        </Link>

        <Link href="/workspace/attendance" className="block cursor-pointer">
          <Card className="bg-amber-50/50 border-amber-100 shadow-sm hover:shadow-md hover:bg-amber-50/80 transition-all duration-200">
            <CardContent className="p-6">
              <div className="flex justify-between items-start">
                <div>
                  <p className="text-sm font-medium text-amber-600">Late Clock-Ins</p>
                  <span className="text-4xl font-bold text-amber-900 mt-2 block">
                    {loadingStats ? "--" : stats?.lateToday}
                  </span>
                </div>
                <div className="p-3 bg-amber-100 rounded-lg text-amber-600"><Clock className="w-5 h-5" /></div>
              </div>
            </CardContent>
          </Card>
        </Link>
      </div>

      {/* MAIN CONTENT SPLIT */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Left Side: Leaves and Actions */}
        <div className="lg:col-span-2 space-y-6">
          
          {/* Pending Leaves */}
          <Card className="border-slate-200 shadow-sm">
            <CardHeader className="pb-3 border-b">
              <CardTitle className="text-base font-bold text-slate-900 flex items-center">
                <ClipboardList className="w-4 h-4 mr-2 text-emerald-500" /> Pending Leave Approvals
              </CardTitle>
              <CardDescription>Review employee time-off requests. Click Approve to update leave allocations.</CardDescription>
            </CardHeader>
            <CardContent className="p-0">
              {loadingLeaves ? (
                <div className="flex justify-center items-center h-48"><Loader2 className="w-6 h-6 animate-spin text-emerald-500" /></div>
              ) : pendingLeaves.length === 0 ? (
                <div className="p-12 text-center text-slate-500 text-sm">No leave requests pending HR decision.</div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse text-xs">
                    <thead>
                      <tr className="border-b bg-slate-50 text-slate-500 font-semibold uppercase tracking-wider">
                        <th className="p-4">Employee</th>
                        <th className="p-4">Type</th>
                        <th className="p-4">Dates</th>
                        <th className="p-4">Days</th>
                        <th className="p-4 text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {pendingLeaves.slice(0, 5).map((req: any) => (
                        <tr key={req.id} className="border-b hover:bg-slate-50/50">
                          <td className="p-4">
                            <div className="font-semibold text-slate-900">{req.employee?.firstName} {req.employee?.lastName}</div>
                            <div className="text-slate-400 font-normal">{req.employee?.employeeCode}</div>
                          </td>
                          <td className="p-4"><Badge variant="outline">{req.type}</Badge></td>
                          <td className="p-4 text-slate-600">
                            {new Date(req.startDate).toLocaleDateString()} - {new Date(req.endDate).toLocaleDateString()}
                          </td>
                          <td className="p-4 text-slate-600 font-semibold">{req.totalDays}</td>
                          <td className="p-4 text-right space-x-2">
                            <Button 
                              size="sm" 
                              className="bg-emerald-500 hover:bg-emerald-600 text-white h-7 px-2"
                              onClick={() => statusMutation.mutate({ id: req.id, status: 'APPROVED' })}
                              disabled={statusMutation.isPending}
                            >
                              <Check className="w-3.5 h-3.5 mr-0.5" /> Approve
                            </Button>
                            <Button 
                              size="sm" 
                              variant="destructive"
                              className="h-7 px-2"
                              onClick={() => statusMutation.mutate({ id: req.id, status: 'REJECTED' })}
                              disabled={statusMutation.isPending}
                            >
                              <X className="w-3.5 h-3.5 mr-0.5" /> Reject
                            </Button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Quick Operations Shortcuts */}
          <Card className="border-slate-200 shadow-sm">
            <CardHeader className="pb-3 border-b">
              <CardTitle className="text-base font-bold text-slate-900 flex items-center">
                <Award className="w-4 h-4 mr-2 text-emerald-500" /> Operational Shortcuts
              </CardTitle>
            </CardHeader>
            <CardContent className="p-6 grid grid-cols-2 sm:grid-cols-4 gap-4">
              <Link href="/workspace/employees" className="flex flex-col items-center justify-center p-4 bg-slate-50 hover:bg-slate-100 rounded-2xl border text-center transition-colors">
                <Users className="w-6 h-6 text-emerald-600 mb-2" />
                <span className="text-xs font-semibold text-slate-700">Employees Directory</span>
              </Link>
              <Link href="/workspace/payroll/admin" className="flex flex-col items-center justify-center p-4 bg-slate-50 hover:bg-slate-100 rounded-2xl border text-center transition-colors">
                <Calculator className="w-6 h-6 text-emerald-600 mb-2" />
                <span className="text-xs font-semibold text-slate-700">Payroll Processing</span>
              </Link>
              <Link href="/workspace/leave/admin/settings" className="flex flex-col items-center justify-center p-4 bg-slate-50 hover:bg-slate-100 rounded-2xl border text-center transition-colors">
                <Calendar className="w-6 h-6 text-emerald-600 mb-2" />
                <span className="text-xs font-semibold text-slate-700">Leave Policies</span>
              </Link>
              <Link href="/workspace/documents/admin" className="flex flex-col items-center justify-center p-4 bg-slate-50 hover:bg-slate-100 rounded-2xl border text-center transition-colors">
                <FileText className="w-6 h-6 text-emerald-600 mb-2" />
                <span className="text-xs font-semibold text-slate-700">Documents Hub</span>
              </Link>
            </CardContent>
          </Card>
        </div>

        {/* Right Side: Announcement Publisher */}
        <div className="space-y-6">
          
          {/* Announcement Publisher Form */}
          <Card className="border-slate-200 shadow-sm">
            <CardHeader className="pb-3 border-b">
              <CardTitle className="text-base font-bold text-slate-900 flex items-center">
                <Megaphone className="w-4 h-4 mr-2 text-emerald-500" /> Broadcast Announcement
              </CardTitle>
              <CardDescription>Publish updates to all employees instantly.</CardDescription>
            </CardHeader>
            <CardContent className="p-6">
              <form onSubmit={handlePublish} className="space-y-4">
                <div className="space-y-1">
                  <label className="text-[11px] font-semibold text-slate-500">Announcement Title</label>
                  <Input 
                    placeholder="e.g. Office Holiday Notice" 
                    value={announcementForm.title}
                    onChange={(e) => setAnnouncementForm({...announcementForm, title: e.target.value})}
                    className="text-xs"
                    required
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[11px] font-semibold text-slate-500">Message Content</label>
                  <Textarea 
                    placeholder="Describe the notice in detail..." 
                    value={announcementForm.content}
                    onChange={(e) => setAnnouncementForm({...announcementForm, content: e.target.value})}
                    className="text-xs min-h-[100px]"
                    required
                  />
                </div>
                <Button 
                  type="submit" 
                  disabled={publishMutation.isPending || !announcementForm.title || !announcementForm.content}
                  className="w-full bg-emerald-600 hover:bg-emerald-700 text-white text-xs h-9"
                >
                  {publishMutation.isPending ? (
                    <><Loader2 className="w-3.5 h-3.5 mr-1.5 animate-spin" /> Publishing...</>
                  ) : (
                    <><Send className="w-3.5 h-3.5 mr-1.5" /> Publish Notice</>
                  )}
                </Button>
              </form>
            </CardContent>
          </Card>

          {/* Recent Broadcasts list */}
          <Card className="border-slate-200 shadow-sm">
            <CardHeader className="pb-3">
              <CardTitle className="text-base font-bold text-slate-900 flex items-center">
                <Megaphone className="w-4 h-4 mr-2 text-emerald-500" /> Recent Broadcasts
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {announcements?.length === 0 ? (
                <p className="text-xs text-slate-500 italic text-center py-4">No recent broadcasts published.</p>
              ) : (
                announcements?.slice(0, 3).map((ann: any) => (
                  <div key={ann.id} className="p-3 bg-slate-50 rounded-xl border border-slate-100 space-y-1">
                    <h4 className="text-xs font-bold text-slate-800">{ann.title}</h4>
                    <p className="text-[11px] text-slate-600 line-clamp-2">{ann.content}</p>
                    <span className="text-[9px] text-slate-400 block mt-1">{new Date(ann.createdAt).toLocaleDateString()}</span>
                  </div>
                ))
              )}
            </CardContent>
          </Card>

        </div>

      </div>

    </div>
  );
}
