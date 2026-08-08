"use client";

import { useQuery } from "@tanstack/react-query";
import axios from "axios";
import { Clock, Calendar, Users, MessageSquare, Megaphone, Award, FileText, CheckCircle2 } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { AttendanceWidget } from "@/components/dashboard/AttendanceWidget";

export function EmployeeDashboardView() {
  const { data: stats } = useQuery({
    queryKey: ["myDashboardStats"],
    queryFn: async () => {
      const token = localStorage.getItem("hrms_token");
      const response = await axios.get(
        `${process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000"}/attendance/my-stats`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      return response.data;
    },
  });

  return (
    <div className="p-8 max-w-7xl mx-auto space-y-6">
      
      {/* TOP ROW: Welcome Banner & Quick Timer Widget */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Welcome Card */}
        <div className="lg:col-span-2 bg-gradient-to-r from-indigo-600 to-violet-600 rounded-3xl p-8 text-white flex flex-col justify-between shadow-sm relative overflow-hidden">
          <div className="relative z-10">
            <span className="bg-white/20 text-xs px-3 py-1 rounded-full font-medium">Employee Portal</span>
            <h1 className="text-3xl font-bold mt-4">Hello Employee, Welcome!</h1>
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
                <div className="w-10 h-10 rounded-full bg-emerald-100 text-emerald-700 font-bold flex items-center justify-center text-sm border-2 border-white">
                  AM
                </div>
                <div className="w-10 h-10 rounded-full bg-blue-100 text-blue-700 font-bold flex items-center justify-center text-sm border-2 border-white -ml-4">
                  JD
                </div>
                <div className="w-10 h-10 rounded-full bg-amber-100 text-amber-700 font-bold flex items-center justify-center text-sm border-2 border-white -ml-4">
                  SK
                </div>
                <div className="w-10 h-10 rounded-full bg-slate-100 text-slate-600 font-semibold flex items-center justify-center text-xs border-2 border-white -ml-4">
                  +5
                </div>
              </div>
              <p className="text-xs text-slate-400 mt-4">Department Members Active</p>
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
                <p className="text-2xl font-bold text-slate-900">3</p>
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
              <div className="flex justify-between items-center p-2.5 bg-slate-50 hover:bg-slate-100 rounded-lg cursor-pointer text-xs font-medium text-slate-700 transition-colors">
                <span>Overtime Balance</span>
                <span className="text-indigo-600 font-bold">View →</span>
              </div>
              <div className="flex justify-between items-center p-2.5 bg-slate-50 hover:bg-slate-100 rounded-lg cursor-pointer text-xs font-medium text-slate-700 transition-colors">
                <span>Leave Summary</span>
                <span className="text-indigo-600 font-bold">View →</span>
              </div>
              <div className="flex justify-between items-center p-2.5 bg-slate-50 hover:bg-slate-100 rounded-lg cursor-pointer text-xs font-medium text-slate-700 transition-colors">
                <span>Payslips</span>
                <span className="text-indigo-600 font-bold">View →</span>
              </div>
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
                <div className="bg-indigo-50/50 p-4 rounded-xl border border-indigo-100 space-y-2">
                  <span className="text-[10px] font-bold bg-indigo-100 text-indigo-700 px-2 py-0.5 rounded-full">New Update</span>
                  <h4 className="text-sm font-semibold text-slate-900">Cafeteria Service Launched!</h4>
                  <p className="text-xs text-slate-600 leading-relaxed">
                    Great news! We are thrilled to announce the opening of our new office cafeteria starting today. Enjoy a variety of meals and snacks.
                  </p>
                </div>
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