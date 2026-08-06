"use client";

import { useQuery } from "@tanstack/react-query";
import axios from "axios";
import { UserCheck, Clock, Calendar, CheckCircle2, XCircle, Percent, Loader2 } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { AttendanceWidget } from "@/components/dashboard/AttendanceWidget";

export function EmployeeDashboardView() {
  const { data: stats, isLoading } = useQuery({
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

  const formatTime = (dateString?: string | null) => {
    if (!dateString) return "--:--";
    return new Date(dateString).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold text-slate-900">My Dashboard</h1>
        <p className="text-slate-500 mt-1">Track your daily status, attendance history, and monthly summary.</p>
      </div>

      {/* STAT CARDS ROW */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        
        {/* Today's Status */}
        <Card className="bg-emerald-50/50 border-emerald-100 shadow-sm">
          <CardContent className="p-6">
            <div className="flex justify-between items-start">
              <div>
                <p className="text-sm font-medium text-emerald-600">Today's Status</p>
                <div className="flex items-baseline mt-3">
                  {isLoading ? (
                    <span className="text-xl font-bold text-slate-400">Loading...</span>
                  ) : (
                    <Badge className={
                      stats?.todayStatus === 'PRESENT' ? 'bg-emerald-600 text-lg px-3 py-1' :
                      stats?.todayStatus === 'LATE' ? 'bg-amber-500 text-lg px-3 py-1' :
                      stats?.todayStatus === 'ABSENT' ? 'bg-rose-600 text-lg px-3 py-1' :
                      'bg-slate-400 text-lg px-3 py-1'
                    }>
                      {stats?.todayStatus}
                    </Badge>
                  )}
                </div>
              </div>
              <div className="p-3 bg-emerald-100 rounded-lg text-emerald-600"><CheckCircle2 className="w-5 h-5" /></div>
            </div>
          </CardContent>
        </Card>

        {/* Check In / Out Times */}
        <Card className="bg-blue-50/50 border-blue-100 shadow-sm">
          <CardContent className="p-6">
            <div className="flex justify-between items-start">
              <div>
                <p className="text-sm font-medium text-blue-600">Check In / Out</p>
                <div className="flex items-center space-x-2 mt-2 text-blue-950 font-semibold">
                  <span className="text-lg">{isLoading ? "--:--" : formatTime(stats?.checkInTime)}</span>
                  <span className="text-slate-400">to</span>
                  <span className="text-lg">{isLoading ? "--:--" : formatTime(stats?.checkOutTime)}</span>
                </div>
              </div>
              <div className="p-3 bg-blue-100 rounded-lg text-blue-600"><Clock className="w-5 h-5" /></div>
            </div>
          </CardContent>
        </Card>

        {/* Working Hours */}
        <Card className="bg-indigo-50/50 border-indigo-100 shadow-sm">
          <CardContent className="p-6">
            <div className="flex justify-between items-start">
              <div>
                <p className="text-sm font-medium text-indigo-600">Working Hours Today</p>
                <div className="flex items-baseline mt-2">
                  <span className="text-4xl font-bold text-indigo-900">
                    {isLoading ? "--" : `${stats?.workingHours || 0} hrs`}
                  </span>
                </div>
              </div>
              <div className="p-3 bg-indigo-100 rounded-lg text-indigo-600"><Calendar className="w-5 h-5" /></div>
            </div>
          </CardContent>
        </Card>

        {/* Present Days (Month) */}
        <Card className="bg-teal-50/50 border-teal-100 shadow-sm">
          <CardContent className="p-6">
            <div className="flex justify-between items-start">
              <div>
                <p className="text-sm font-medium text-teal-600">Present Days (Month)</p>
                <div className="flex items-baseline mt-2">
                  <span className="text-4xl font-bold text-teal-900">
                    {isLoading ? "--" : stats?.presentDays}
                  </span>
                </div>
              </div>
              <div className="p-3 bg-teal-100 rounded-lg text-teal-600"><UserCheck className="w-5 h-5" /></div>
            </div>
          </CardContent>
        </Card>

        {/* Absent Days (Month) */}
        <Card className="bg-rose-50/50 border-rose-100 shadow-sm">
          <CardContent className="p-6">
            <div className="flex justify-between items-start">
              <div>
                <p className="text-sm font-medium text-rose-600">Absent Days (Month)</p>
                <div className="flex items-baseline mt-2">
                  <span className="text-4xl font-bold text-rose-900">
                    {isLoading ? "--" : stats?.absentDays}
                  </span>
                </div>
              </div>
              <div className="p-3 bg-rose-100 rounded-lg text-rose-600"><XCircle className="w-5 h-5" /></div>
            </div>
          </CardContent>
        </Card>

        {/* Attendance % */}
        <Card className="bg-amber-50/50 border-amber-100 shadow-sm">
          <CardContent className="p-6">
            <div className="flex justify-between items-start">
              <div>
                <p className="text-sm font-medium text-amber-600">Attendance Rate</p>
                <div className="flex items-baseline mt-2">
                  <span className="text-4xl font-bold text-amber-900">
                    {isLoading ? "--" : `${stats?.attendancePercentage}%`}
                  </span>
                </div>
              </div>
              <div className="p-3 bg-amber-100 rounded-lg text-amber-600"><Percent className="w-5 h-5" /></div>
            </div>
          </CardContent>
        </Card>

      </div>

      {/* WIDGETS ROW */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="md:col-span-1">
          <AttendanceWidget />
        </div>
        <div className="md:col-span-2 bg-white rounded-xl border border-slate-200 shadow-sm p-6 flex items-center justify-center text-slate-400">
          Personal performance and timeline widgets can go here
        </div>
      </div>
    </div>
  );
}