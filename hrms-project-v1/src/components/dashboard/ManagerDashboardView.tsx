"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import axios from "axios";
import Link from "next/link";
import { useState } from "react";
import { Clock, Calendar, Users, Megaphone, FileText, CheckCircle2, UserCheck, UserX, Check, X, Loader2, ArrowLeftRight } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { usePermissions } from "@/context/PermissionContext";
import { AttendanceWidget } from "@/components/dashboard/AttendanceWidget";

export function ManagerDashboardView() {
  const { isWidgetEnabled } = usePermissions();
  const showClockIn = isWidgetEnabled("clock_in_widget");
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
        <div className="bg-gradient-to-r from-secondary to-primary rounded-3xl p-8 text-white flex flex-col justify-between shadow-md relative overflow-hidden border border-border">
          <div className="absolute right-0 top-0 -mt-6 -mr-6 w-48 h-48 rounded-full bg-white/10 blur-2xl pointer-events-none" />
          <div className="absolute left-1/3 bottom-0 -mb-10 w-64 h-64 rounded-full bg-primary/20 blur-3xl pointer-events-none" />
          
          <div className="relative z-10 flex flex-col md:flex-row md:items-center md:justify-between gap-6">
            <div>
              <span className="bg-white/20 text-xs px-3 py-1.5 rounded-full font-semibold uppercase tracking-wider backdrop-blur-sm">
                Manager Workspace
              </span>
              
              <h1 className="text-3xl font-extrabold mt-4 tracking-tight text-white">
                {getGreeting()}, {currentUser?.firstName || 'Manager'}!
              </h1>
              
              <p className="text-white/80 mt-2 max-w-xl text-sm leading-relaxed">
                Welcome back to your dashboard. You have active administrative control of your team. Review direct reports, manage pending leave approvals, and inspect schedules.
              </p>
            </div>
            
            <div className="flex items-center space-x-4 shrink-0">
              <div className="bg-white/10 px-5 py-3 rounded-2xl backdrop-blur-md border border-white/10 shadow-inner">
                <p className="text-xs text-primary/80 font-medium">My Attendance</p>
                <p className="text-2xl font-black text-white mt-0.5">{myStats?.attendancePercentage || 0}%</p>
              </div>
              <div className="bg-white/10 px-5 py-3 rounded-2xl backdrop-blur-md border border-white/10 shadow-inner">
                <p className="text-xs text-primary/80 font-medium">Direct Reports</p>
                <p className="text-2xl font-black text-white mt-0.5">{directReports.length} Team</p>
              </div>
            </div>
          </div>
        </div>

      </div>

      {/* STAT CARDS ROW */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card className="bg-secondary text-secondary-foreground border-secondary shadow-sm hover:shadow-md hover:bg-secondary/90 transition-all duration-200">
          <CardContent className="p-6">
            <div className="flex justify-between items-start">
              <div>
                <p className="text-sm font-medium text-primary">Direct Reports</p>
                <span className="text-4xl font-bold text-secondary-foreground mt-2 block">
                  {directReports.length}
                </span>
              </div>
              <div className="p-3 bg-primary/20 text-primary rounded-lg"><Users className="w-5 h-5" /></div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-primary/20 text-secondary border-primary/30 shadow-sm hover:shadow-md hover:bg-primary/30 transition-all duration-200">
          <CardContent className="p-6">
            <div className="flex justify-between items-start">
              <div>
                <p className="text-sm font-medium text-secondary/80">Active Today</p>
                <span className="text-4xl font-bold text-secondary mt-2 block">
                  {presentReports}
                </span>
              </div>
              <div className="p-3 bg-primary text-secondary rounded-lg"><UserCheck className="w-5 h-5" /></div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-card text-foreground border-border shadow-sm hover:shadow-md hover:bg-muted/10 transition-all duration-200">
          <CardContent className="p-6">
            <div className="flex justify-between items-start">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Absent / Off</p>
                <span className="text-4xl font-bold text-foreground mt-2 block">
                  {absentReports}
                </span>
              </div>
              <div className="p-3 bg-rose-500/10 text-rose-600 rounded-lg"><UserX className="w-5 h-5" /></div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-card text-foreground border-border shadow-sm hover:shadow-md hover:bg-muted/10 transition-all duration-200">
          <CardContent className="p-6">
            <div className="flex justify-between items-start">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Pending Approvals</p>
                <span className="text-4xl font-bold text-foreground mt-2 block">
                  {approvals?.length || 0}
                </span>
              </div>
              <div className="p-3 bg-amber-500/10 text-amber-600 rounded-lg"><Clock className="w-5 h-5" /></div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* MAIN GRID */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Left/Middle Column - Leaves Approvals */}
        <div className="lg:col-span-2 space-y-6">
          <Card className="border-border bg-card shadow-sm">
            <CardHeader className="pb-3 border-b border-border">
              <CardTitle className="text-base font-bold text-foreground flex items-center">
                <CheckCircle2 className="w-4 h-4 mr-2 text-primary" /> Pending Team Leave Approvals
              </CardTitle>
              <CardDescription>Leave requests from your direct reports that require your decision.</CardDescription>
            </CardHeader>
            <CardContent className="p-0">
              {loadingApprovals ? (
                <div className="flex justify-center items-center h-48"><Loader2 className="w-6 h-6 animate-spin text-primary" /></div>
              ) : !approvals || approvals.length === 0 ? (
                <div className="p-12 text-center text-muted-foreground text-sm">No pending leave requests found.</div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse text-xs">
                    <thead>
                      <tr className="border-b border-border bg-muted/20 text-muted-foreground font-semibold uppercase tracking-wider">
                        <th className="p-4">Employee</th>
                        <th className="p-4">Type</th>
                        <th className="p-4">Dates</th>
                        <th className="p-4">Days</th>
                        <th className="p-4 text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {approvals.map((req: any) => (
                        <tr key={req.id} className="border-b border-border hover:bg-muted/10">
                          <td className="p-4">
                            <div className="font-semibold text-foreground">{req.employee?.firstName} {req.employee?.lastName}</div>
                            <div className="text-muted-foreground/60 font-normal">{req.employee?.employeeCode}</div>
                          </td>
                          <td className="p-4"><Badge variant="outline" className="border-border">{req.type}</Badge></td>
                          <td className="p-4 text-muted-foreground">
                            {new Date(req.startDate).toLocaleDateString()} - {new Date(req.endDate).toLocaleDateString()}
                          </td>
                          <td className="p-4 text-muted-foreground font-semibold">{req.totalDays}</td>
                          <td className="p-4 text-right space-x-2">
                            <Button 
                              size="sm" 
                              className="bg-primary hover:bg-primary/90 text-secondary font-bold h-7 px-2"
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
          <Card className="border-border bg-card shadow-sm">
            <CardHeader className="pb-3 border-b border-border">
              <CardTitle className="text-base font-bold text-foreground flex items-center">
                <FileText className="w-4 h-4 mr-2 text-primary" /> Team Reports Shortcuts
              </CardTitle>
            </CardHeader>
            <CardContent className="p-6 grid grid-cols-2 sm:grid-cols-4 gap-4">
              <Link href="/workspace/employees" className="flex flex-col items-center justify-center p-4 bg-muted/20 hover:bg-muted/40 border border-border rounded-2xl text-center transition-colors">
                <Users className="w-6 h-6 text-primary mb-2" />
                <span className="text-xs font-semibold text-foreground">Team Directory</span>
              </Link>
              <Link href="/workspace/leave/admin" className="flex flex-col items-center justify-center p-4 bg-muted/20 hover:bg-muted/40 border border-border rounded-2xl text-center transition-colors">
                <Calendar className="w-6 h-6 text-primary mb-2" />
                <span className="text-xs font-semibold text-foreground">Time-off Approvals</span>
              </Link>
              <Link href="/workspace/schedules/shift-swaps" className="flex flex-col items-center justify-center p-4 bg-muted/20 hover:bg-muted/40 border border-border rounded-2xl text-center transition-colors">
                <ArrowLeftRight className="w-6 h-6 text-primary mb-2" />
                <span className="text-xs font-semibold text-foreground">Shift Swaps</span>
              </Link>
              <Link href="/workspace/attendance" className="flex flex-col items-center justify-center p-4 bg-muted/20 hover:bg-muted/40 border border-border rounded-2xl text-center transition-colors">
                <Clock className="w-6 h-6 text-primary mb-2" />
                <span className="text-xs font-semibold text-foreground">Attendance Log</span>
              </Link>
            </CardContent>
          </Card>
        </div>

        {/* Right Column - Direct Reports list & Announcements */}
        <div className="space-y-6">
          {showClockIn && <AttendanceWidget />}
          
          {/* Direct Reports List */}
          <Card className="border-border bg-card shadow-sm">
            <CardHeader className="pb-3">
              <CardTitle className="text-base font-bold text-foreground flex items-center">
                <Users className="w-4 h-4 mr-2 text-primary" /> Direct Reports
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {directReports.length === 0 ? (
                <p className="text-xs text-muted-foreground italic text-center py-4">No direct reports assigned to you.</p>
              ) : (
                directReports.map((emp: any) => (
                  <div key={emp.id} className="flex items-center justify-between p-2 bg-muted/10 rounded-xl border border-border">
                    <div className="flex items-center space-x-2.5">
                      <div className="w-8 h-8 rounded-full bg-primary/20 text-secondary font-bold flex items-center justify-center text-xs border border-primary/20">
                        {emp.firstName?.[0]}{emp.lastName?.[0]}
                      </div>
                      <div>
                        <p className="text-xs font-semibold text-foreground">{emp.firstName} {emp.lastName}</p>
                        <p className="text-[10px] text-muted-foreground/60">{emp.department?.name || 'Staff'}</p>
                      </div>
                    </div>
                    <Badge className={emp.status === 'ACTIVE' ? 'bg-primary/20 text-secondary border border-primary/20' : 'bg-muted text-muted-foreground border-border'} variant="outline">
                      {emp.status}
                    </Badge>
                  </div>
                ))
              )}
            </CardContent>
          </Card>

          {/* Announcements Card */}
          <Card className="border-border bg-card shadow-sm">
            <CardHeader className="pb-3">
              <CardTitle className="text-base font-bold text-foreground flex items-center">
                <Megaphone className="w-4 h-4 mr-2 text-primary" /> Announcements
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
               {!announcements || announcements.length === 0 ? (
                <p className="text-xs text-muted-foreground italic text-center py-4">No recent announcements.</p>
              ) : (
                announcements.slice(0, 3).map((ann: any) => (
                  <div key={ann.id} className="p-3 bg-muted/10 rounded-xl border border-border space-y-1">
                    <h4 className="text-xs font-bold text-foreground">{ann.title}</h4>
                    <p className="text-[11px] text-muted-foreground line-clamp-2">{ann.content}</p>
                    <span className="text-[9px] text-muted-foreground/60 block mt-1">{new Date(ann.createdAt).toLocaleDateString()}</span>
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
