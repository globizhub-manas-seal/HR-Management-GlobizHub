"use client";

import { useQuery } from "@tanstack/react-query";
import axios from "axios";
import Link from "next/link";
import { Loader2, Users, UserCheck, UserX, Clock, Settings, Calendar, ShieldCheck, Activity, Megaphone } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { AttendanceWidget } from "@/components/dashboard/AttendanceWidget";

export function AdminDashboardView() {
  const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000";
  const getToken = () => localStorage.getItem("hrms_token");

  // 1. Fetch Admin Stats
  const { data: stats, isLoading: statsLoading } = useQuery({
    queryKey: ["adminDashboardStats"],
    queryFn: async () => {
      const response = await axios.get(`${API_URL}/attendance/admin-stats`, {
        headers: { Authorization: `Bearer ${getToken()}` }
      });
      return response.data;
    },
    refetchInterval: 60000,
  });

  // 2. Fetch company announcements
  const { data: announcements } = useQuery({
    queryKey: ["adminAnnouncements"],
    queryFn: async () => {
      const response = await axios.get(`${API_URL}/announcements`, {
        headers: { Authorization: `Bearer ${getToken()}` }
      });
      return response.data;
    },
  });

  // 3. Fetch Recent Audit Logs (Live Activity Feed)
  const { data: auditLogs, isLoading: logsLoading } = useQuery({
    queryKey: ["adminAuditLogs"],
    queryFn: async () => {
      const response = await axios.get(`${API_URL}/audit?limit=8`, {
        headers: { Authorization: `Bearer ${getToken()}` }
      });
      return response.data;
    },
    refetchInterval: 30000, // Refresh every 30s
    retry: false,
  });

  // 4. Fetch All Employees Leave Balances
  const { data: leaveBalances, isLoading: balancesLoading } = useQuery({
    queryKey: ["companyLeaveBalances"],
    queryFn: async () => {
      const response = await axios.get(`${API_URL}/leaves/company-balances`, {
        headers: { Authorization: `Bearer ${getToken()}` }
      });
      return response.data;
    },
    retry: false,
  });

  const formatLogMessage = (log: any) => {
    if (log.newValue?.description) {
      return log.newValue.description;
    }
    const actorName = log.actor ? `${log.actor.firstName} ${log.actor.lastName}` : "System";
    switch (log.action) {
      case "LOGIN":
        return `${actorName} logged in to HRMS.`;
      case "LOGOUT":
        return `${actorName} logged out of HRMS.`;
      case "DOWNLOAD":
        return `${actorName} downloaded a payslip.`;
      case "APPROVE":
        return `${actorName} approved a request.`;
      case "REJECT":
        return `${actorName} rejected a request.`;
      case "CREATE":
        if (log.entity === "LeaveRequest") {
          return `${actorName} submitted a leave request.`;
        }
        if (log.entity === "Employee") {
          return `${actorName} added a new employee.`;
        }
        return `${actorName} created a new ${log.entity}.`;
      case "UPDATE":
        return `${actorName} updated ${log.entity}.`;
      case "DELETE":
        return `${actorName} deleted ${log.entity}.`;
      default:
        return `${actorName} performed action: ${log.action} on ${log.entity}.`;
    }
  };

  return (
    <div className="p-8 max-w-7xl mx-auto space-y-8 font-sans">
      <div>
        <h1 className="text-3xl font-bold text-slate-900">Admin Dashboard</h1>
        <p className="text-slate-500 mt-1">Here is what is happening across your workspace today.</p>
      </div>

      {/* STAT CARDS ROW */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Link href="/workspace/employees" className="block cursor-pointer">
          <Card className="bg-emerald-50/50 border-emerald-100 shadow-sm hover:shadow-md hover:bg-emerald-50/80 transition-all duration-200">
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
        </Link>

        <Link href="/workspace/attendance" className="block cursor-pointer">
          <Card className="bg-blue-50/50 border-blue-100 shadow-sm hover:shadow-md hover:bg-blue-50/80 transition-all duration-200">
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
        </Link>

        <Link href="/workspace/attendance" className="block cursor-pointer">
          <Card className="bg-rose-50/50 border-rose-100 shadow-sm hover:shadow-md hover:bg-rose-50/80 transition-all duration-200">
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
        </Link>

        <Link href="/workspace/attendance" className="block cursor-pointer">
          <Card className="bg-amber-50/50 border-amber-100 shadow-sm hover:shadow-md hover:bg-amber-50/80 transition-all duration-200">
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
        </Link>
      </div>

      {/* DUAL SECTION LAYOUT */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column: Live Activities Feed */}
        <Card className="border-slate-200 shadow-sm lg:col-span-2">
          <CardHeader className="pb-3 border-b flex flex-row items-center justify-between">
            <div className="space-y-1">
              <CardTitle className="text-base font-bold text-slate-900 flex items-center">
                <Activity className="w-4 h-4 mr-2 text-rose-500 animate-pulse" /> Live Employee Activities
              </CardTitle>
              <CardDescription className="text-xs text-slate-500">Real-time view of logins, logouts, and payslip downloads.</CardDescription>
            </div>
            <span className="text-[10px] text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full font-semibold border border-emerald-100">Live Feed</span>
          </CardHeader>
          <CardContent className="p-0">
            {logsLoading ? (
              <div className="flex justify-center items-center h-48">
                <Loader2 className="w-6 h-6 animate-spin text-rose-500" />
              </div>
            ) : !auditLogs || auditLogs.length === 0 ? (
              <p className="text-xs text-slate-500 italic text-center py-12">No recent employee activities logged.</p>
            ) : (
              <div className="divide-y divide-slate-100 max-h-[340px] overflow-y-auto">
                {auditLogs.map((log: any) => (
                  <div key={log.id} className="p-4 hover:bg-slate-50/50 flex justify-between items-start gap-4 transition-colors">
                    <div className="space-y-1">
                      <p className="text-xs text-slate-800 font-medium leading-relaxed">
                        {formatLogMessage(log)}
                      </p>
                      <p className="text-[10px] text-slate-400">
                        {log.actor?.email || "System"} {log.ipAddress && `• ${log.ipAddress}`}
                      </p>
                    </div>
                    <span className="text-[9px] font-semibold text-slate-400 bg-slate-100 px-1.5 py-0.5 rounded shrink-0">
                      {new Date(log.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Right Column: Admin Shortcuts */}
        <Card className="border-slate-200 shadow-sm lg:col-span-1">
          <CardHeader className="pb-3 border-b">
            <CardTitle className="text-base font-bold text-slate-900 flex items-center">
              <Settings className="w-4 h-4 mr-2 text-indigo-500" /> Admin Shortcuts
            </CardTitle>
          </CardHeader>
          <CardContent className="p-6 space-y-3">
            <Link href="/workspace/settings" className="flex items-center justify-between p-3 bg-slate-50 hover:bg-slate-100 border rounded-xl text-xs font-semibold text-slate-700 transition-colors">
              <span className="flex items-center"><Settings className="w-4 h-4 mr-2 text-slate-400" /> Company Settings</span>
              <span className="text-slate-400">Configure →</span>
            </Link>
            <Link href="/workspace/schedules/admin" className="flex items-center justify-between p-3 bg-slate-50 hover:bg-slate-100 border rounded-xl text-xs font-semibold text-slate-700 transition-colors">
              <span className="flex items-center"><Calendar className="w-4 h-4 mr-2 text-slate-400" /> Shift Schedules</span>
              <span className="text-slate-400">Manage →</span>
            </Link>
            <Link href="/workspace/employees" className="flex items-center justify-between p-3 bg-slate-50 hover:bg-slate-100 border rounded-xl text-xs font-semibold text-slate-700 transition-colors">
              <span className="flex items-center"><ShieldCheck className="w-4 h-4 mr-2 text-slate-400" /> System Roles & Directory</span>
              <span className="text-slate-400">Modify →</span>
            </Link>
          </CardContent>
        </Card>
      </div>

      {/* ROW 3: LEAVE BALANCES & ANNOUNCEMENTS */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left: Leave Balances Table */}
        <Card className="border-slate-200 shadow-sm lg:col-span-2">
          <CardHeader className="pb-3 border-b">
            <CardTitle className="text-base font-bold text-slate-900 flex items-center">
              <Calendar className="w-4 h-4 mr-2 text-indigo-500" /> Employee Leave Balances
            </CardTitle>
            <CardDescription className="text-xs text-slate-500">Direct overview of casual, medical, and earned leaves remaining per employee.</CardDescription>
          </CardHeader>
          <CardContent className="p-0">
            {balancesLoading ? (
              <div className="flex justify-center items-center h-48">
                <Loader2 className="w-6 h-6 animate-spin text-indigo-500" />
              </div>
            ) : !leaveBalances || leaveBalances.length === 0 ? (
              <div className="p-12 text-center text-slate-500 text-sm">No employee leave balance allocations found.</div>
            ) : (
              <div className="overflow-x-auto max-h-[300px] overflow-y-auto">
                <table className="w-full text-left border-collapse text-xs">
                  <thead className="sticky top-0 bg-slate-50 border-b border-slate-200">
                    <tr className="text-slate-500 font-semibold uppercase tracking-wider">
                      <th className="p-4">Employee</th>
                      <th className="p-4">Casual Leaves</th>
                      <th className="p-4">Medical Leaves</th>
                      <th className="p-4">Earned Leaves</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {leaveBalances.map((emp: any) => (
                      <tr key={emp.id} className="hover:bg-slate-50/50 transition-colors">
                        <td className="p-4">
                          <div className="font-semibold text-slate-900">{emp.firstName} {emp.lastName}</div>
                          <div className="text-slate-400 font-normal">{emp.employeeCode || "N/A"}</div>
                        </td>
                        <td className="p-4 font-semibold text-slate-700">
                          <span className="bg-emerald-50 text-emerald-700 px-2 py-1 rounded border border-emerald-100">{emp.balance?.casual ?? 0} remaining</span>
                        </td>
                        <td className="p-4 font-semibold text-slate-700">
                          <span className="bg-blue-50 text-blue-700 px-2 py-1 rounded border border-blue-100">{emp.balance?.medical ?? 0} remaining</span>
                        </td>
                        <td className="p-4 font-semibold text-slate-700">
                          <span className="bg-indigo-50 text-indigo-700 px-2 py-1 rounded border border-indigo-100">{emp.balance?.earned ?? 0} remaining</span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Right: Broadcast Announcements */}
        <Card className="border-slate-200 shadow-sm lg:col-span-1">
          <CardHeader className="pb-3 border-b flex items-center justify-between">
            <CardTitle className="text-base font-bold text-slate-900 flex items-center">
              <Megaphone className="w-4 h-4 mr-2 text-rose-500" /> Announcements
            </CardTitle>
          </CardHeader>
          <CardContent className="p-6">
            {announcements?.length === 0 ? (
              <p className="text-xs text-slate-500 italic text-center py-6">No recent notices published.</p>
            ) : (
              <div className="space-y-4 max-h-[300px] overflow-y-auto pr-1">
                {announcements?.slice(0, 3).map((ann: any) => (
                  <div key={ann.id} className="p-4 bg-slate-50 rounded-xl border border-slate-100 space-y-1">
                    <h4 className="text-xs font-bold text-slate-800">{ann.title}</h4>
                    <p className="text-[11px] text-slate-600 line-clamp-3 leading-relaxed">{ann.content}</p>
                    <span className="text-[9px] text-slate-400 block mt-2">{new Date(ann.createdAt).toLocaleDateString()}</span>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
