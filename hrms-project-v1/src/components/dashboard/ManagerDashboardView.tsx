"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import axios from "axios";
import Link from "next/link";
import { useState } from "react";
import { Clock, Calendar, Users, Megaphone, FileText, CheckCircle2, UserCheck, UserX, Check, X, Loader2 } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

export function ManagerDashboardView() {
  const queryClient = useQueryClient();
  const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000";
  const getToken = () => localStorage.getItem("hrms_token");

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

  // 2. Fetch Direct Reports Leaves for Approval
  const { data: approvals, isLoading: loadingApprovals } = useQuery({
    queryKey: ["managerApprovals"],
    queryFn: async () => {
      const response = await axios.get(`${API_URL}/leaves/approvals`, {
        headers: { Authorization: `Bearer ${getToken()}` }
      });
      return response.data;
    },
  });

  // 3. Fetch All Employees (to filter Direct Reports)
  const { data: employees } = useQuery({
    queryKey: ["allEmployees"],
    queryFn: async () => {
      const response = await axios.get(`${API_URL}/employees`, {
        headers: { Authorization: `Bearer ${getToken()}` }
      });
      return response.data;
    },
  });

  // 4. Fetch Announcements
  const { data: announcements } = useQuery({
    queryKey: ["managerAnnouncements"],
    queryFn: async () => {
      const response = await axios.get(`${API_URL}/announcements`, {
        headers: { Authorization: `Bearer ${getToken()}` }
      });
      return response.data;
    },
  });

  // 5. Fetch Personal Attendance Stats
  const { data: myStats } = useQuery({
    queryKey: ["myDashboardStats"],
    queryFn: async () => {
      const response = await axios.get(`${API_URL}/attendance/my-stats`, {
        headers: { Authorization: `Bearer ${getToken()}` }
      });
      return response.data;
    },
  });

  // 6. Mutation for Leave Approval
  const statusMutation = useMutation({
    mutationFn: async ({ id, status }: { id: string; status: string }) => {
      await axios.patch(
        `${API_URL}/leaves/${id}/status`,
        { status },
        { headers: { Authorization: `Bearer ${getToken()}` } }
      );
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["managerApprovals"] });
      alert("Leave request processed successfully.");
    },
    onError: (err: any) => {
      alert(err.response?.data?.message || "Failed to process leave request.");
    }
  });

  // Filter Direct Reports
  const directReports = employees?.filter(
    (emp: any) => emp.reportingManagerId === currentUser?.id
  ) || [];

  const presentReports = directReports.filter((emp: any) => emp.status === "ACTIVE").length;
  const absentReports = directReports.length - presentReports;

  const getGreeting = () => {
    const currentHour = new Date().getHours();
    if (currentHour < 12) return "Good morning";
    if (currentHour < 17) return "Good afternoon";
    return "Good evening";
  };

  return (
    <div className="p-8 max-w-7xl mx-auto space-y-6">
      
      {/* TOP ROW: Welcome Banner & Quick Details */}
      <div className="grid grid-cols-1 gap-6">
        
        {/* Welcome Card */}
        <div className="bg-gradient-to-r from-violet-600 via-indigo-600 to-purple-600 rounded-3xl p-8 text-white flex flex-col justify-between shadow-md relative overflow-hidden border border-violet-500/20">
          <div className="absolute right-0 top-0 -mt-6 -mr-6 w-48 h-48 rounded-full bg-white/10 blur-2xl pointer-events-none" />
          <div className="absolute left-1/3 bottom-0 -mb-10 w-64 h-64 rounded-full bg-indigo-500/20 blur-3xl pointer-events-none" />
          
          <div className="relative z-10 flex flex-col md:flex-row md:items-center md:justify-between gap-6">
            <div>
              <span className="bg-white/20 text-xs px-3 py-1.5 rounded-full font-semibold uppercase tracking-wider backdrop-blur-sm">
                Manager Workspace
              </span>
              
              <h1 className="text-3xl font-extrabold mt-4 tracking-tight">
                {getGreeting()}, {currentUser?.firstName || 'Manager'}!
              </h1>
              
              <p className="text-indigo-100 mt-2 max-w-xl text-sm leading-relaxed">
                Welcome back to your dashboard. You have active administrative control of your team. Review direct reports, manage pending leave approvals, and inspect schedules.
              </p>
            </div>
            
            <div className="flex items-center space-x-4 shrink-0">
              <div className="bg-white/10 px-5 py-3 rounded-2xl backdrop-blur-md border border-white/10 shadow-inner">
                <p className="text-xs text-indigo-200 font-medium">My Attendance</p>
                <p className="text-2xl font-black text-white mt-0.5">{myStats?.attendancePercentage || 0}%</p>
              </div>
              <div className="bg-white/10 px-5 py-3 rounded-2xl backdrop-blur-md border border-white/10 shadow-inner">
                <p className="text-xs text-indigo-200 font-medium">Direct Reports</p>
                <p className="text-2xl font-black text-white mt-0.5">{directReports.length} Team</p>
              </div>
            </div>
          </div>
        </div>

      </div>

      {/* STAT CARDS ROW */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card className="bg-violet-50/50 border-violet-100 shadow-sm">
          <CardContent className="p-6">
            <div className="flex justify-between items-start">
              <div>
                <p className="text-sm font-medium text-violet-600">Direct Reports</p>
                <span className="text-4xl font-bold text-violet-900 mt-2 block">
                  {directReports.length}
                </span>
              </div>
              <div className="p-3 bg-violet-100 rounded-lg text-violet-600"><Users className="w-5 h-5" /></div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-emerald-50/50 border-emerald-100 shadow-sm">
          <CardContent className="p-6">
            <div className="flex justify-between items-start">
              <div>
                <p className="text-sm font-medium text-emerald-600">Active Today</p>
                <span className="text-4xl font-bold text-emerald-900 mt-2 block">
                  {presentReports}
                </span>
              </div>
              <div className="p-3 bg-emerald-100 rounded-lg text-emerald-600"><UserCheck className="w-5 h-5" /></div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-rose-50/50 border-rose-100 shadow-sm">
          <CardContent className="p-6">
            <div className="flex justify-between items-start">
              <div>
                <p className="text-sm font-medium text-rose-600">Absent / Off</p>
                <span className="text-4xl font-bold text-rose-900 mt-2 block">
                  {absentReports}
                </span>
              </div>
              <div className="p-3 bg-rose-100 rounded-lg text-rose-600"><UserX className="w-5 h-5" /></div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-amber-50/50 border-amber-100 shadow-sm">
          <CardContent className="p-6">
            <div className="flex justify-between items-start">
              <div>
                <p className="text-sm font-medium text-amber-600">Pending Approvals</p>
                <span className="text-4xl font-bold text-amber-900 mt-2 block">
                  {approvals?.length || 0}
                </span>
              </div>
              <div className="p-3 bg-amber-100 rounded-lg text-amber-600"><Clock className="w-5 h-5" /></div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* MAIN GRID */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Left/Middle Column - Leaves Approvals */}
        <div className="lg:col-span-2 space-y-6">
          <Card className="border-slate-200 shadow-sm">
            <CardHeader className="pb-3 border-b">
              <CardTitle className="text-base font-bold text-slate-900 flex items-center">
                <CheckCircle2 className="w-4 h-4 mr-2 text-indigo-500" /> Pending Team Leave Approvals
              </CardTitle>
              <CardDescription>Leave requests from your direct reports that require your decision.</CardDescription>
            </CardHeader>
            <CardContent className="p-0">
              {loadingApprovals ? (
                <div className="flex justify-center items-center h-48"><Loader2 className="w-6 h-6 animate-spin text-indigo-500" /></div>
              ) : !approvals || approvals.length === 0 ? (
                <div className="p-12 text-center text-slate-500 text-sm">No pending leave requests found.</div>
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
                      {approvals.map((req: any) => (
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

          {/* Quick links for reports */}
          <Card className="border-slate-200 shadow-sm">
            <CardHeader className="pb-3 border-b">
              <CardTitle className="text-base font-bold text-slate-900 flex items-center">
                <FileText className="w-4 h-4 mr-2 text-indigo-500" /> Team Reports Shortcuts
              </CardTitle>
            </CardHeader>
            <CardContent className="p-6 grid grid-cols-1 sm:grid-cols-3 gap-4">
              <Link href="/workspace/employees" className="flex flex-col items-center justify-center p-4 bg-slate-50 hover:bg-slate-100 rounded-2xl border text-center transition-colors">
                <Users className="w-6 h-6 text-indigo-500 mb-2" />
                <span className="text-xs font-semibold text-slate-700">Team Directory</span>
              </Link>
              <Link href="/workspace/leave/admin" className="flex flex-col items-center justify-center p-4 bg-slate-50 hover:bg-slate-100 rounded-2xl border text-center transition-colors">
                <Calendar className="w-6 h-6 text-indigo-500 mb-2" />
                <span className="text-xs font-semibold text-slate-700">Time-off Approvals</span>
              </Link>
              <Link href="/workspace/attendance" className="flex flex-col items-center justify-center p-4 bg-slate-50 hover:bg-slate-100 rounded-2xl border text-center transition-colors">
                <Clock className="w-6 h-6 text-indigo-500 mb-2" />
                <span className="text-xs font-semibold text-slate-700">Attendance Log</span>
              </Link>
            </CardContent>
          </Card>
        </div>

        {/* Right Column - Direct Reports list & Announcements */}
        <div className="space-y-6">
          
          {/* Direct Reports List */}
          <Card className="border-slate-200 shadow-sm">
            <CardHeader className="pb-3">
              <CardTitle className="text-base font-bold text-slate-900 flex items-center">
                <Users className="w-4 h-4 mr-2 text-indigo-500" /> Direct Reports
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {directReports.length === 0 ? (
                <p className="text-xs text-slate-500 italic text-center py-4">No direct reports assigned to you.</p>
              ) : (
                directReports.map((emp: any) => (
                  <div key={emp.id} className="flex items-center justify-between p-2 bg-slate-50 rounded-xl border border-slate-100">
                    <div className="flex items-center space-x-2.5">
                      <div className="w-8 h-8 rounded-full bg-indigo-50 text-indigo-700 font-bold flex items-center justify-center text-xs border">
                        {emp.firstName?.[0]}{emp.lastName?.[0]}
                      </div>
                      <div>
                        <p className="text-xs font-semibold text-slate-800">{emp.firstName} {emp.lastName}</p>
                        <p className="text-[10px] text-slate-400">{emp.department?.name || 'Staff'}</p>
                      </div>
                    </div>
                    <Badge className={emp.status === 'ACTIVE' ? 'bg-emerald-50 text-emerald-700 border-emerald-100' : 'bg-slate-100 text-slate-600'} variant="outline">
                      {emp.status}
                    </Badge>
                  </div>
                ))
              )}
            </CardContent>
          </Card>

          {/* Announcements Card */}
          <Card className="border-slate-200 shadow-sm">
            <CardHeader className="pb-3">
              <CardTitle className="text-base font-bold text-slate-900 flex items-center">
                <Megaphone className="w-4 h-4 mr-2 text-indigo-500" /> Announcements
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
               {!announcements || announcements.length === 0 ? (
                <p className="text-xs text-slate-500 italic text-center py-4">No recent announcements.</p>
              ) : (
                announcements.slice(0, 3).map((ann: any) => (
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
