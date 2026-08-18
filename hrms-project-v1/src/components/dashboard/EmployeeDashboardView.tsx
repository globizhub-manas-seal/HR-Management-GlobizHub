"use client";

import { useQuery } from "@tanstack/react-query";
import axios from "axios";
import Link from "next/link";
import { Clock, Calendar, Users, MessageSquare, Megaphone, Award, FileText, CheckCircle2 } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { AttendanceWidget } from "@/components/dashboard/AttendanceWidget";

export function EmployeeDashboardView() {
  const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000";

  // 1. Fetch Attendance Stats
  const { data: stats } = useQuery({
    queryKey: ["myDashboardStats"],
    queryFn: async () => {
      const token = localStorage.getItem("hrms_token");
      const response = await axios.get(`${API_URL}/attendance/my-stats`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      return response.data;
    },
  });

  // 2. Fetch Current Employee Profile (for the name)
  const { data: currentUser } = useQuery({
    queryKey: ["currentUserProfile"],
    queryFn: async () => {
      const token = localStorage.getItem("hrms_token");
      // Adjust this endpoint if your actual route is /auth/me or /users/me
      const response = await axios.get(`${API_URL}/auth/me`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      return response.data;
    },
  });

  // 3. Fetch All Employees (for Coworker listing)
  const { data: employees } = useQuery({
    queryKey: ["allEmployees"],
    queryFn: async () => {
      const token = localStorage.getItem("hrms_token");
      const response = await axios.get(`${API_URL}/employees`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      return response.data;
    },
  });

  // 4. Fetch Announcements
  const { data: announcements } = useQuery({
    queryKey: ["myDashboardAnnouncements"],
    queryFn: async () => {
      const token = localStorage.getItem("hrms_token");
      const response = await axios.get(`${API_URL}/announcements`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      return response.data;
    },
  });

  // 5. Fetch Holidays
  const { data: holidays } = useQuery({
    queryKey: ["myDashboardHolidays"],
    queryFn: async () => {
      const token = localStorage.getItem("hrms_token");
      const response = await axios.get(`${API_URL}/leaves/holidays`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      return response.data;
    },
  });

  // Filter department coworkers (exclude self)
  const coworkers = employees?.filter(
    (emp: any) => emp.department?.name === currentUser?.department?.name && emp.id !== currentUser?.id
  ) || [];

  // Count upcoming holidays
  const upcomingHolidaysCount = holidays?.filter((h: any) => new Date(h.date) >= new Date()).length || 0;

  // 6. Time-based Greeting
  const getGreeting = () => {
    const currentHour = new Date().getHours();
    if (currentHour < 12) return "Good morning";
    if (currentHour < 17) return "Good afternoon";
    return "Good evening";
  };

  return (
    <div className="p-8 max-w-7xl mx-auto space-y-6">
      
      {/* TOP ROW: Welcome Banner & Quick Timer Widget */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Welcome Card */}
        <div className="lg:col-span-2 bg-gradient-to-r from-indigo-600 to-violet-600 rounded-3xl p-8 text-white flex flex-col justify-between shadow-sm relative overflow-hidden">
          <div className="relative z-10">
            <span className="bg-white/20 text-xs px-3 py-1 rounded-full font-medium">Employee Portal</span>
            
            {/* ✅ UPDATED: Dynamic Greeting and Name */}
            <h1 className="text-3xl font-bold mt-4">
              {getGreeting()}, {currentUser?.firstName || 'Employee'}!
            </h1>
            
            <p className="text-indigo-100 mt-2 max-w-md text-sm">
              Your status today is tracked securely. Check your hours, manage your schedule, and stay connected with your team.
            </p>
          </div>
          <div className="mt-6 flex items-center space-x-4 relative z-10">
            <div className="bg-white/10 px-4 py-2 rounded-2xl backdrop-blur-sm">
              <p className="text-xs text-indigo-200">Monthly Attendance</p>
              <p className="text-xl font-bold">{stats?.attendancePercentage || 0}%</p>
            </div>
            <div className="bg-white/10 px-4 py-2 rounded-2xl backdrop-blur-sm">
              <p className="text-xs text-indigo-200">Hours Today</p>
              <p className="text-xl font-bold">{stats?.workingHours || 0} hrs</p>
            </div>
          </div>
        </div>

        {/* Attendance Action Widget */}
        <div>
          <AttendanceWidget />
        </div>

      </div>

      {/* SECOND ROW: Grid Layout matching your Mockup */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Left Column (Team & Notifications) */}
        <div className="space-y-6">
          
          {/* Your Team Card */}
          <Card className="border-slate-200 shadow-sm">
            <CardHeader className="pb-3">
              <CardTitle className="text-base font-bold text-slate-900 flex items-center">
                <Users className="w-4 h-4 mr-2 text-indigo-500" /> Your Team
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center space-x-2">
                {coworkers.slice(0, 3).map((emp: any, index: number) => {
                  const initials = `${emp.firstName?.[0] || ""}${emp.lastName?.[0] || ""}`.toUpperCase();
                  const bgColors = [
                    "bg-emerald-100 text-emerald-700",
                    "bg-blue-100 text-blue-700",
                    "bg-amber-100 text-amber-700",
                  ];
                  return (
                    <div
                      key={emp.id}
                      className={`w-10 h-10 rounded-full ${bgColors[index % bgColors.length]} font-bold flex items-center justify-center text-sm border-2 border-white ${
                        index > 0 ? "-ml-4" : ""
                      }`}
                      title={`${emp.firstName} ${emp.lastName}`}
                    >
                      {initials}
                    </div>
                  );
                })}
                {coworkers.length > 3 && (
                  <div className="w-10 h-10 rounded-full bg-slate-100 text-slate-600 font-semibold flex items-center justify-center text-xs border-2 border-white -ml-4">
                    +{coworkers.length - 3}
                  </div>
                )}
                {coworkers.length === 0 && (
                  <p className="text-xs text-slate-500 italic">No department coworkers found.</p>
                )}
              </div>
              <p className="text-xs text-slate-400 mt-4">
                {currentUser?.department?.name || "General"} Department Members
              </p>
            </CardContent>
          </Card>

          {/* HR Chat Widget */}
          <Card className="border-slate-200 shadow-sm">
            <CardHeader className="pb-3">
              <CardTitle className="text-base font-bold text-slate-900 flex items-center">
                <MessageSquare className="w-4 h-4 mr-2 text-indigo-500" /> HR Chat Support
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <p className="text-xs text-slate-500">Have questions about your payroll, leaves, or policies? Reach out directly.</p>
              <Button className="w-full bg-slate-900 hover:bg-slate-800 text-white text-xs">
                Send us a message
              </Button>
            </CardContent>
          </Card>

        </div>

        {/* Middle Column (Holidays & Leave Info) */}
        <div className="space-y-6">
          
          <Card className="border-slate-200 shadow-sm">
            <CardHeader className="pb-3">
              <CardTitle className="text-base font-bold text-slate-900 flex items-center">
                <Calendar className="w-4 h-4 mr-2 text-indigo-500" /> Holidays & Leaves
              </CardTitle>
            </CardHeader>
            <CardContent className="grid grid-cols-2 gap-4 text-center">
              <div className="bg-slate-50 p-4 rounded-xl border border-slate-100">
                <p className="text-2xl font-bold text-slate-900">{upcomingHolidaysCount}</p>
                <p className="text-xs text-slate-500 mt-1">Upcoming Holidays</p>
              </div>
              <div className="bg-slate-50 p-4 rounded-xl border border-slate-100">
                <p className="text-2xl font-bold text-indigo-600">{stats?.presentDays || 0}</p>
                <p className="text-xs text-slate-500 mt-1">Days Present</p>
              </div>
            </CardContent>
          </Card>

          {/* Last Reports Card */}
          <Card className="border-slate-200 shadow-sm">
            <CardHeader className="pb-3">
              <CardTitle className="text-base font-bold text-slate-900 flex items-center">
                <FileText className="w-4 h-4 mr-2 text-indigo-500" /> Quick Reports
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <Link href="/workspace/attendance" className="flex justify-between items-center p-2.5 bg-slate-50 hover:bg-slate-100 rounded-lg cursor-pointer text-xs font-medium text-slate-700 transition-colors">
                <span>Overtime Balance</span>
                <span className="text-indigo-600 font-bold">View →</span>
              </Link>
              <Link href="/workspace/leave" className="flex justify-between items-center p-2.5 bg-slate-50 hover:bg-slate-100 rounded-lg cursor-pointer text-xs font-medium text-slate-700 transition-colors">
                <span>Leave Summary</span>
                <span className="text-indigo-600 font-bold">View →</span>
              </Link>
              <Link href="/workspace/my-payslips" className="flex justify-between items-center p-2.5 bg-slate-50 hover:bg-slate-100 rounded-lg cursor-pointer text-xs font-medium text-slate-700 transition-colors">
                <span>Payslips</span>
                <span className="text-indigo-600 font-bold">View →</span>
              </Link>
            </CardContent>
          </Card>

        </div>

        {/* Right Column (Announcements) */}
        <div>
          <Card className="border-slate-200 shadow-sm h-full flex flex-col justify-between">
            <div>
              <CardHeader className="pb-3">
                <CardTitle className="text-base font-bold text-slate-900 flex items-center">
                  <Megaphone className="w-4 h-4 mr-2 text-indigo-500" /> Announcements
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {announcements && announcements.length > 0 ? (
                  announcements.slice(0, 3).map((ann: any) => (
                    <div key={ann.id} className="bg-indigo-50/50 p-4 rounded-xl border border-indigo-100 space-y-2">
                      <div className="flex justify-between items-center">
                        <span className="text-[10px] font-bold bg-indigo-100 text-indigo-700 px-2 py-0.5 rounded-full">
                          Update
                        </span>
                        <span className="text-[10px] text-slate-400">
                          {new Date(ann.createdAt).toLocaleDateString()}
                        </span>
                      </div>
                      <h4 className="text-sm font-semibold text-slate-900">{ann.title}</h4>
                      <p className="text-xs text-slate-600 leading-relaxed whitespace-pre-line">{ann.content}</p>
                    </div>
                  ))
                ) : (
                  <div className="text-center py-8 text-slate-400 text-xs border border-dashed border-slate-200 rounded-xl bg-slate-50/50">
                    No active company announcements.
                  </div>
                )}
              </CardContent>
            </div>
            <div className="p-6 pt-0">
              <p className="text-[11px] text-slate-400 text-center">TeamHub HRMS System v1.0</p>
            </div>
          </Card>
        </div>

      </div>

    </div>
  );
}