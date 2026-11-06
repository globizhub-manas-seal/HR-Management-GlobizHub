"use client";

import api, { API_BASE_URL } from "@/lib/api";

import { useQuery } from "@tanstack/react-query";
import axios from "axios";
import Link from "next/link";
import { Users, UserCheck, UserX, Clock, Settings, Calendar, ShieldCheck, Activity, Megaphone } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { BroadcastNotificationModal } from "@/components/notifications/BroadcastNotificationModal";

export function AdminDashboardView() {
  const API_URL = API_BASE_URL;
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

  // 3. Fetch Recent Audit Logs
  const { data: auditLogs, isLoading: logsLoading } = useQuery({
    queryKey: ["adminAuditLogs"],
    queryFn: async () => {
      const response = await axios.get(`${API_URL}/audit?limit=8`, {
        headers: { Authorization: `Bearer ${getToken()}` }
      });
      return response.data;
    },
    refetchInterval: 30000,
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
        return `${actorName} approved a leave request.`;
      case "REJECT":
        return `${actorName} rejected a request.`;
      default:
        return `${actorName} performed ${log.action.toLowerCase()} on ${log.module || "the system"}.`;
    }
  };

  return (
    <div className="max-w-[1200px] mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8 space-y-8">
      {/* Header with Apple Large Title */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="type-large-title text-foreground tracking-tight">Admin Dashboard</h1>
          <p className="type-subhead text-label-secondary mt-1">Here is what is happening across your workspace today.</p>
        </div>
        <BroadcastNotificationModal
          trigger={
            <Button variant="default" size="default" className="shrink-0 gap-2 font-medium">
              <Megaphone className="size-4 stroke-[1.5]" /> Broadcast Notification
            </Button>
          }
        />
      </div>

      {/* STAT CARDS ROW */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
        <Link href="/workspace/employees" className="block cursor-pointer">
          <Card className="hover:scale-[1.01] transition-transform duration-150">
            <CardContent className="p-5 sm:p-6">
              <div className="flex justify-between items-start">
                <div>
                  <p className="type-subhead text-label-secondary font-medium">Total Employees</p>
                  <div className="flex items-baseline mt-2">
                    {statsLoading ? (
                      <Skeleton className="h-8 w-16" />
                    ) : (
                      <span className="type-title-1 font-bold text-foreground tabular-nums">
                        {stats?.totalEmployees ?? 0}
                      </span>
                    )}
                  </div>
                </div>
                <div className="p-2.5 bg-primary/12 text-primary rounded-[12px]">
                  <Users className="size-5 stroke-[1.5]" />
                </div>
              </div>
            </CardContent>
          </Card>
        </Link>

        <Link href="/workspace/attendance" className="block cursor-pointer">
          <Card className="hover:scale-[1.01] transition-transform duration-150">
            <CardContent className="p-5 sm:p-6">
              <div className="flex justify-between items-start">
                <div>
                  <p className="type-subhead text-label-secondary font-medium">Present Today</p>
                  <div className="flex items-baseline mt-2">
                    {statsLoading ? (
                      <Skeleton className="h-8 w-16" />
                    ) : (
                      <span className="type-title-1 font-bold text-foreground tabular-nums">
                        {stats?.presentToday ?? 0}
                      </span>
                    )}
                  </div>
                </div>
                <div className="p-2.5 bg-[rgba(52,199,89,0.15)] text-status-green rounded-[12px]">
                  <UserCheck className="size-5 stroke-[1.5]" />
                </div>
              </div>
            </CardContent>
          </Card>
        </Link>

        <Link href="/workspace/attendance" className="block cursor-pointer">
          <Card className="hover:scale-[1.01] transition-transform duration-150">
            <CardContent className="p-5 sm:p-6">
              <div className="flex justify-between items-start">
                <div>
                  <p className="type-subhead text-label-secondary font-medium">Absent / Pending</p>
                  <div className="flex items-baseline mt-2">
                    {statsLoading ? (
                      <Skeleton className="h-8 w-16" />
                    ) : (
                      <span className="type-title-1 font-bold text-foreground tabular-nums">
                        {stats?.absentToday ?? 0}
                      </span>
                    )}
                  </div>
                </div>
                <div className="p-2.5 bg-[rgba(255,59,48,0.15)] text-destructive rounded-[12px]">
                  <UserX className="size-5 stroke-[1.5]" />
                </div>
              </div>
            </CardContent>
          </Card>
        </Link>

        <Link href="/workspace/attendance" className="block cursor-pointer">
          <Card className="hover:scale-[1.01] transition-transform duration-150">
            <CardContent className="p-5 sm:p-6">
              <div className="flex justify-between items-start">
                <div>
                  <p className="type-subhead text-label-secondary font-medium">Late Arrivals</p>
                  <div className="flex items-baseline mt-2">
                    {statsLoading ? (
                      <Skeleton className="h-8 w-16" />
                    ) : (
                      <span className="type-title-1 font-bold text-foreground tabular-nums">
                        {stats?.lateToday ?? 0}
                      </span>
                    )}
                  </div>
                </div>
                <div className="p-2.5 bg-[rgba(255,149,0,0.15)] text-status-orange rounded-[12px]">
                  <Clock className="size-5 stroke-[1.5]" />
                </div>
              </div>
            </CardContent>
          </Card>
        </Link>
      </div>

      {/* DUAL SECTION LAYOUT */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column: Live Activities Feed */}
        <Card className="lg:col-span-2">
          <CardHeader className="pb-3 border-b border-hairline border-separator/50 flex flex-row items-center justify-between">
            <div className="space-y-0.5">
              <CardTitle className="type-headline font-semibold text-foreground flex items-center">
                <Activity className="size-4 mr-2 text-primary animate-pulse stroke-[1.5]" /> Live Activities
              </CardTitle>
              <CardDescription className="type-footnote text-label-secondary">
                Real-time feed of employee logins, logouts, and actions.
              </CardDescription>
            </div>
            <Badge variant="default">Live Feed</Badge>
          </CardHeader>
          <CardContent className="p-0">
            {logsLoading ? (
              <div className="p-5 divide-y divide-separator/40 space-y-3">
                {Array.from({ length: 4 }).map((_, i) => (
                  <div key={`log-skel-${i}`} className="pt-3 first:pt-0 flex justify-between items-start gap-4">
                    <div className="space-y-1.5 flex-1">
                      <Skeleton className="h-4 w-3/4" />
                      <Skeleton className="h-3 w-1/3" />
                    </div>
                    <Skeleton className="h-4 w-12" />
                  </div>
                ))}
              </div>
            ) : !auditLogs || auditLogs.length === 0 ? (
              <p className="type-footnote text-label-tertiary text-center py-12">No recent employee activities logged.</p>
            ) : (
              <div className="divide-y divide-separator/40 max-h-[340px] overflow-y-auto">
                {auditLogs.map((log: any) => (
                  <div key={log.id} className="p-4 hover:bg-fill/40 flex justify-between items-start gap-4 transition-colors">
                    <div className="space-y-1">
                      <p className="type-body text-foreground font-medium">
                        {formatLogMessage(log)}
                      </p>
                      <p className="type-caption text-label-tertiary">
                        {log.actor?.email || "System"} {log.ipAddress && `• ${log.ipAddress}`}
                      </p>
                    </div>
                    <span className="type-caption text-label-secondary bg-fill px-2 py-0.5 rounded-[6px] shrink-0 tabular-nums">
                      {new Date(log.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Right Column: Admin Shortcuts */}
        <div className="lg:col-span-1 space-y-6">
          <Card>
            <CardHeader className="pb-3 border-b border-hairline border-separator/50">
              <CardTitle className="type-headline font-semibold text-foreground flex items-center">
                <Settings className="size-4 mr-2 text-primary stroke-[1.5]" /> Admin Shortcuts
              </CardTitle>
            </CardHeader>
            <CardContent className="p-4 sm:p-5 space-y-2.5">
              <Link href="/workspace/settings" className="flex items-center justify-between p-3 bg-fill/50 hover:bg-fill rounded-[12px] text-[14px] font-medium text-foreground transition-all active:scale-[0.98]">
                <span className="flex items-center"><Settings className="size-4 mr-2.5 text-label-secondary stroke-[1.5]" /> Company Settings</span>
                <span className="type-caption text-label-tertiary">Configure →</span>
              </Link>
              <Link href="/workspace/schedules/admin" className="flex items-center justify-between p-3 bg-fill/50 hover:bg-fill rounded-[12px] text-[14px] font-medium text-foreground transition-all active:scale-[0.98]">
                <span className="flex items-center"><Calendar className="size-4 mr-2.5 text-label-secondary stroke-[1.5]" /> Shift Schedules</span>
                <span className="type-caption text-label-tertiary">Manage →</span>
              </Link>
              <Link href="/workspace/employees" className="flex items-center justify-between p-3 bg-fill/50 hover:bg-fill rounded-[12px] text-[14px] font-medium text-foreground transition-all active:scale-[0.98]">
                <span className="flex items-center"><ShieldCheck className="size-4 mr-2.5 text-label-secondary stroke-[1.5]" /> System Roles & Directory</span>
                <span className="type-caption text-label-tertiary">Modify →</span>
              </Link>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* ROW 3: LEAVE BALANCES & ANNOUNCEMENTS */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left: Leave Balances Table */}
        <Card className="lg:col-span-2">
          <CardHeader className="pb-3 border-b border-hairline border-separator/50">
            <CardTitle className="type-headline font-semibold text-foreground flex items-center">
              <Calendar className="size-4 mr-2 text-primary stroke-[1.5]" /> Employee Leave Balances
            </CardTitle>
            <CardDescription className="type-footnote text-label-secondary">Direct overview of casual, medical, and earned leaves remaining.</CardDescription>
          </CardHeader>
          <CardContent className="p-0">
            {balancesLoading ? (
              <div className="p-5 divide-y divide-separator/40 space-y-3">
                {Array.from({ length: 4 }).map((_, i) => (
                  <div key={`bal-skel-${i}`} className="pt-3 first:pt-0 flex items-center justify-between gap-4">
                    <div className="space-y-1.5 flex-1">
                      <Skeleton className="h-4 w-32" />
                      <Skeleton className="h-3 w-20" />
                    </div>
                    <div className="flex gap-2">
                      <Skeleton className="h-6 w-20 rounded-full" />
                      <Skeleton className="h-6 w-20 rounded-full" />
                    </div>
                  </div>
                ))}
              </div>
            ) : !leaveBalances || leaveBalances.length === 0 ? (
              <div className="p-12 text-center text-label-tertiary text-sm">No employee leave balance allocations found.</div>
            ) : (
              <div className="overflow-x-auto max-h-[300px] overflow-y-auto">
                <table className="w-full text-left border-collapse text-[13px]">
                  <thead className="sticky top-0 material-translucent border-b border-hairline border-separator">
                    <tr className="text-label-secondary font-semibold">
                      <th className="p-3.5 pl-5">Employee</th>
                      <th className="p-3.5">Casual</th>
                      <th className="p-3.5">Medical</th>
                      <th className="p-3.5 pr-5">Earned</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-separator/40">
                    {leaveBalances.map((emp: any) => (
                      <tr key={emp.id} className="hover:bg-fill/40 transition-colors">
                        <td className="p-3.5 pl-5">
                          <div className="font-semibold text-foreground">{emp.firstName} {emp.lastName}</div>
                          <div className="type-caption text-label-tertiary font-normal">{emp.employeeCode || "N/A"}</div>
                        </td>
                        <td className="p-3.5">
                          <Badge variant="default" className="tabular-nums font-medium">
                            {emp.balance?.casual ?? 0} days
                          </Badge>
                        </td>
                        <td className="p-3.5">
                          <Badge variant="secondary" className="tabular-nums font-medium">
                            {emp.balance?.medical ?? 0} days
                          </Badge>
                        </td>
                        <td className="p-3.5 pr-5">
                          <Badge variant="success" className="tabular-nums font-medium">
                            {emp.balance?.earned ?? 0} days
                          </Badge>
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
        <Card className="lg:col-span-1">
          <CardHeader className="pb-3 border-b border-hairline border-separator/50 flex items-center justify-between">
            <CardTitle className="type-headline font-semibold text-foreground flex items-center">
              <Megaphone className="size-4 mr-2 text-primary stroke-[1.5]" /> Announcements
            </CardTitle>
          </CardHeader>
          <CardContent className="p-5">
            {announcements?.length === 0 ? (
              <p className="type-footnote text-label-tertiary italic text-center py-8">No recent notices published.</p>
            ) : (
              <div className="space-y-3 max-h-[300px] overflow-y-auto pr-1">
                {announcements?.slice(0, 3).map((ann: any) => (
                  <div key={ann.id} className="p-3.5 bg-fill/40 rounded-[14px] border-0 space-y-1">
                    <h4 className="type-subhead font-semibold text-foreground">{ann.title}</h4>
                    <p className="type-footnote text-label-secondary line-clamp-3 leading-relaxed">{ann.content}</p>
                    <span className="type-caption text-label-tertiary block pt-1">{new Date(ann.createdAt).toLocaleDateString()}</span>
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
