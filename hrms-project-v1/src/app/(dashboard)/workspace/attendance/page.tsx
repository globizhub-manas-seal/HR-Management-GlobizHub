"use client";

import { useQuery } from "@tanstack/react-query";
import axios from "axios";
import { Loader2, CalendarClock } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

// Helper function to color-code attendance statuses
const getStatusBadge = (status: string) => {
  switch (status) {
    case 'PRESENT':
      return <Badge className="bg-emerald-500 hover:bg-emerald-600">Present</Badge>;
    case 'LATE':
      return <Badge className="bg-amber-500 hover:bg-amber-600">Late</Badge>;
    case 'ABSENT':
      return <Badge variant="destructive">Absent</Badge>;
    case 'SHIFT_GIVEN':
      return <Badge className="bg-slate-400 hover:bg-slate-500 text-white border-none">Shift Given</Badge>;
    case 'PROXY_SHIFT_SWAP':
      return <Badge className="bg-indigo-500 hover:bg-indigo-600 text-white border-none">Proxy Present</Badge>;
    default:
      return <Badge variant="outline">{status}</Badge>;
  }
};

// Helper function to format time safely
const formatTime = (dateString?: string | null) => {
  if (!dateString) return "--:--";
  return new Date(dateString).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
};

export default function AttendanceHistoryPage() {
  const { data: history, isLoading, error } = useQuery({
    queryKey: ["attendanceHistory"],
    queryFn: async () => {
      const token = localStorage.getItem("hrms_token");
      const response = await axios.get(
        `${process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000"}/attendance/my-history`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      return response.data;
    },
  });

  return (
    <div className="p-8 max-w-6xl mx-auto space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-slate-900">My Attendance</h1>
        <p className="text-slate-500 mt-1">View your daily check-ins, check-outs, and working hours.</p>
      </div>

      <Card className="border-slate-200 shadow-sm">
        <CardHeader className="bg-slate-50/50 border-b border-slate-100">
          <CardTitle className="flex items-center text-lg text-slate-800">
            <CalendarClock className="mr-2 h-5 w-5 text-emerald-500" />
            Last 30 Days
          </CardTitle>
          <CardDescription>A log of your recent time-tracking history.</CardDescription>
        </CardHeader>
        <CardContent className="p-0">
          {isLoading ? (
            <div className="flex justify-center items-center h-48 text-emerald-500">
              <Loader2 className="h-8 w-8 animate-spin" />
            </div>
          ) : error ? (
            <div className="p-6 text-center text-red-500">Failed to load attendance history.</div>
          ) : history?.length === 0 ? (
            <div className="p-12 text-center text-slate-500">
              No attendance records found. Start clocking in from your dashboard!
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow className="bg-slate-50/50 hover:bg-slate-50/50">
                  <TableHead className="font-semibold text-slate-700">Date</TableHead>
                  <TableHead className="font-semibold text-slate-700">Shift</TableHead>
                  <TableHead className="font-semibold text-slate-700">Status</TableHead>
                  <TableHead className="font-semibold text-slate-700">Check In</TableHead>
                  <TableHead className="font-semibold text-slate-700">Check Out</TableHead>
                  <TableHead className="font-semibold text-slate-700 text-right">Total Hours</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {history.map((record: any) => {
                  const isGiver = record.status === 'SHIFT_GIVEN';
                  const isProxy = record.status === 'PROXY_SHIFT_SWAP';

                  return (
                    <TableRow key={record.id}>
                      <TableCell className="font-medium text-slate-900">
                        {new Date(record.date).toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric' })}
                      </TableCell>
                      <TableCell>
                        <div className="text-xs">
                          <p className="font-semibold text-slate-700">{record.shift?.name || 'Standard Shift'}</p>
                          {isGiver && (
                            <p className="text-[10px] text-indigo-600 font-medium">
                              Given to: {record.shiftSwapRequest?.requester?.firstName} {record.shiftSwapRequest?.requester?.lastName}
                            </p>
                          )}
                          {isProxy && (
                            <p className="text-[10px] text-emerald-600 font-medium">
                              Proxy for: {record.shiftSwapRequest?.target?.firstName} {record.shiftSwapRequest?.target?.lastName}
                            </p>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>{getStatusBadge(record.status)}</TableCell>
                      <TableCell className="text-slate-600">{formatTime(record.checkInTime)}</TableCell>
                      <TableCell className="text-slate-600">{formatTime(record.checkOutTime)}</TableCell>
                      <TableCell className="text-right font-medium text-slate-700">
                        {record.workingHours ? `${record.workingHours} hrs` : '--'}
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}