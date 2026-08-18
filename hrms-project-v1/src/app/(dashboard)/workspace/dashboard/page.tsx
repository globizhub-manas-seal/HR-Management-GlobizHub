"use client";

import { useQuery } from "@tanstack/react-query";
import axios from "axios";
import { Loader2 } from "lucide-react";
import { EmployeeDashboardView } from "@/components/dashboard/EmployeeDashboardView";
import { Users, UserCheck, UserX, Clock } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { AttendanceWidget } from "@/components/dashboard/AttendanceWidget";

export default function DashboardRouter() {
  // 1. Fetch current logged-in user's profile to check their role
  const { data: user, isLoading: userLoading } = useQuery({
    queryKey: ["userProfile"],
    queryFn: async () => {
      const token = localStorage.getItem("hrms_token");
      const response = await axios.get(
        `${process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000"}/auth/me`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      return response.data;
    },
  });

  // 2. Fetch Admin Stats (only relevant if they are an admin/HR)
  const { data: stats, isLoading: statsLoading } = useQuery({
    queryKey: ["adminDashboardStats"],
    queryFn: async () => {
      const token = localStorage.getItem("hrms_token");
      const response = await axios.get(
        `${process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000"}/attendance/admin-stats`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      return response.data;
    },
    enabled: user?.role === 'SUPER_ADMIN' || user?.role === 'HR_HEAD', // Only query if admin
    refetchInterval: 60000,
  });

  if (userLoading) {
    return (
      <div className="flex h-96 items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-emerald-500" />
      </div>
    );
  }

  // 3. If the user is a standard EMPLOYEE, show their personalized dashboard!
  if (user?.role === 'EMPLOYEE') {
    return (
      <div className="p-8 max-w-7xl mx-auto">
        <EmployeeDashboardView />
      </div>
    );
  }

  // 4. Otherwise, show the Company-Wide Super Admin / HR Dashboard
  return (
    <div className="p-8 max-w-7xl mx-auto space-y-8">
      <div>
        <h1 className="text-3xl font-bold text-slate-900">Admin Dashboard</h1>
        <p className="text-slate-500 mt-1">Here is what is happening across your workspace today.</p>
      </div>

      {/* STAT CARDS ROW */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card className="bg-emerald-50/50 border-emerald-100 shadow-sm">
          <CardContent className="p-6">
            <div className="flex justify-between items-start">
              <div>
                <p className="text-sm font-medium text-emerald-600">Total Employees</p>
                <div className="flex items-baseline mt-2">
                  <span className="text-4xl font-bold text-emerald-900">
                    {statsLoading ? "--" : stats?.totalEmployees}
                  </span>
                </div>
              </div>
              <div className="p-3 bg-emerald-100 rounded-lg text-emerald-600"><Users className="w-5 h-5" /></div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-blue-50/50 border-blue-100 shadow-sm">
          <CardContent className="p-6">
            <div className="flex justify-between items-start">
              <div>
                <p className="text-sm font-medium text-blue-600">Present Today</p>
                <div className="flex items-baseline mt-2">
                  <span className="text-4xl font-bold text-blue-900">
                    {statsLoading ? "--" : stats?.presentToday}
                  </span>
                </div>
              </div>
              <div className="p-3 bg-blue-100 rounded-lg text-blue-600"><UserCheck className="w-5 h-5" /></div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-rose-50/50 border-rose-100 shadow-sm">
          <CardContent className="p-6">
            <div className="flex justify-between items-start">
              <div>
                <p className="text-sm font-medium text-rose-600">Absent / Pending</p>
                <div className="flex items-baseline mt-2">
                  <span className="text-4xl font-bold text-rose-900">
                    {statsLoading ? "--" : stats?.absentToday}
                  </span>
                </div>
              </div>
              <div className="p-3 bg-rose-100 rounded-lg text-rose-600"><UserX className="w-5 h-5" /></div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-amber-50/50 border-amber-100 shadow-sm">
          <CardContent className="p-6">
            <div className="flex justify-between items-start">
              <div>
                <p className="text-sm font-medium text-amber-600">Late Arrivals</p>
                <div className="flex items-baseline mt-2">
                  <span className="text-4xl font-bold text-amber-900">
                    {statsLoading ? "--" : stats?.lateToday}
                  </span>
                </div>
              </div>
              <div className="p-3 bg-amber-100 rounded-lg text-amber-600"><Clock className="w-5 h-5" /></div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* DASHBOARD WIDGETS ROW */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="md:col-span-1">
          <AttendanceWidget />
        </div>
        <div className="md:col-span-2 bg-white rounded-xl border border-slate-200 shadow-sm p-6 flex flex-col justify-between">
          <div className="flex justify-between items-center mb-6">
            <div>
              <h3 className="text-base font-bold text-slate-900">Today's Attendance Breakdown</h3>
              <p className="text-xs text-slate-500 mt-0.5">Real-time presence rate across all departments.</p>
            </div>
            <div className="flex items-center space-x-2 text-xs font-semibold text-slate-600 bg-slate-50 border px-3 py-1.5 rounded-lg shadow-sm">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
              <span>Live Status</span>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-8 items-center flex-1">
            {/* SVG Ring Gauge */}
            <div className="relative flex justify-center items-center">
              <svg className="w-40 h-40 transform -rotate-90">
                {/* Background Ring */}
                <circle cx="80" cy="80" r="65" strokeWidth="12" stroke="#f1f5f9" fill="transparent" />
                {/* Present Ring */}
                <circle
                  cx="80"
                  cy="80"
                  r="65"
                  strokeWidth="12"
                  stroke="url(#presentGrad)"
                  strokeDasharray={`${2 * Math.PI * 65}`}
                  strokeDashoffset={`${
                    2 * Math.PI * 65 * (1 - (stats?.presentToday || 0) / (stats?.totalEmployees || 1))
                  }`}
                  strokeLinecap="round"
                  fill="transparent"
                  className="transition-all duration-1000 ease-out"
                />
              </svg>
              {/* Radial Gradients Definition */}
              <svg className="w-0 h-0">
                <defs>
                  <linearGradient id="presentGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                    <stop offset="0%" stopColor="#10b981" />
                    <stop offset="100%" stopColor="#059669" />
                  </linearGradient>
                </defs>
              </svg>
              {/* Central Text */}
              <div className="absolute flex flex-col items-center">
                <span className="text-3xl font-black text-slate-900">
                  {stats?.totalEmployees
                    ? Math.round((stats.presentToday / stats.totalEmployees) * 100)
                    : 0}%
                </span>
                <span className="text-[10px] uppercase font-bold tracking-wider text-slate-400 mt-1">Presence</span>
              </div>
            </div>

            {/* Progress Bars */}
            <div className="space-y-4">
              <div className="space-y-1.5">
                <div className="flex justify-between text-xs font-semibold text-slate-600">
                  <span>Present Today</span>
                  <span>{stats?.presentToday || 0} / {stats?.totalEmployees || 0}</span>
                </div>
                <div className="w-full h-2.5 bg-slate-100 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-emerald-500 rounded-full transition-all duration-1000"
                    style={{ width: `${stats?.totalEmployees ? (stats.presentToday / stats.totalEmployees) * 100 : 0}%` }}
                  ></div>
                </div>
              </div>

              <div className="space-y-1.5">
                <div className="flex justify-between text-xs font-semibold text-slate-600">
                  <span>Late Arrivals</span>
                  <span>{stats?.lateToday || 0} / {stats?.totalEmployees || 0}</span>
                </div>
                <div className="w-full h-2.5 bg-slate-100 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-amber-500 rounded-full transition-all duration-1000"
                    style={{ width: `${stats?.totalEmployees ? (stats.lateToday / stats.totalEmployees) * 100 : 0}%` }}
                  ></div>
                </div>
              </div>

              <div className="space-y-1.5">
                <div className="flex justify-between text-xs font-semibold text-slate-600">
                  <span>Absent / Off</span>
                  <span>{stats?.absentToday || 0} / {stats?.totalEmployees || 0}</span>
                </div>
                <div className="w-full h-2.5 bg-slate-100 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-rose-500 rounded-full transition-all duration-1000"
                    style={{ width: `${stats?.totalEmployees ? (stats.absentToday / stats.totalEmployees) * 100 : 0}%` }}
                  ></div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}