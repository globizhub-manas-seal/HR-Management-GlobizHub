"use client";

import { useQuery } from "@tanstack/react-query";
import axios from "axios";
import { CalendarClock } from "lucide-react";
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
import { TableSkeleton } from "@/components/skeletons";
import { EmptyState } from "@/components/ui/empty-state";

// Helper function to color-code attendance statuses with Apple HIG tinted pills
const getStatusBadge = (status: string) => {
  switch (status) {
    case 'PRESENT':
      return <Badge variant="success">Present</Badge>;
    case 'LATE':
      return <Badge variant="warning">Late</Badge>;
    case 'ABSENT':
      return <Badge variant="destructive">Absent</Badge>;
    case 'SHIFT_GIVEN':
      return <Badge variant="secondary">Shift Given</Badge>;
    case 'PROXY_SHIFT_SWAP':
      return <Badge variant="default">Proxy Present</Badge>;
    default:
      return <Badge variant="outline">{status}</Badge>;
  }
};

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
    <div className="max-w-[1200px] mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8 space-y-8">
      <div>
        <h1 className="type-large-title font-bold text-foreground tracking-tight">My Attendance</h1>
        <p className="type-subhead text-label-secondary mt-1">View your daily check-ins, check-outs, and working hours.</p>
      </div>

      <Card>
        <CardHeader className="pb-3 border-b border-hairline border-separator/50 flex flex-row items-center justify-between">
          <div className="space-y-0.5">
            <CardTitle className="type-headline font-semibold text-foreground flex items-center">
              <CalendarClock className="size-4 mr-2 text-primary stroke-[1.5]" />
              Last 30 Days
            </CardTitle>
            <CardDescription className="type-footnote text-label-secondary">
              A log of your recent time-tracking history.
            </CardDescription>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          {isLoading ? (
            <div className="p-4">
              <TableSkeleton rowCount={6} columnCount={5} showSearch={false} showAvatar={false} />
            </div>
          ) : error ? (
            <div className="p-8 text-center text-destructive type-subhead">Failed to load attendance history.</div>
          ) : history?.length === 0 ? (
            <EmptyState
              icon={CalendarClock}
              title="No Attendance Records"
              description="No attendance records found yet. Start clocking in from your workspace dashboard!"
            />
          ) : (
            <div className="overflow-x-auto" tabIndex={0} aria-label="Attendance records table. Scroll horizontally to view all columns.">
              <Table className="min-w-[680px]">
                <TableHeader>
                  <TableRow>
                    <TableHead>Date</TableHead>
                    <TableHead>Shift</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Check In</TableHead>
                    <TableHead>Check Out</TableHead>
                    <TableHead className="text-right">Total Hours</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {history.map((record: any) => {
                    const isGiver = record.status === 'SHIFT_GIVEN';
                    const isProxy = record.status === 'PROXY_SHIFT_SWAP';

                    return (
                      <TableRow key={record.id}>
                        <TableCell className="font-medium text-foreground">
                          {new Date(record.date).toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric' })}
                        </TableCell>
                        <TableCell>
                          <div className="text-[13px]">
                            <p className="font-semibold text-foreground">{record.shift?.name || 'Standard Shift'}</p>
                            {isGiver && (
                              <p className="type-caption text-primary font-medium">
                                Given to: {record.shiftSwapRequest?.requester?.firstName} {record.shiftSwapRequest?.requester?.lastName}
                              </p>
                            )}
                            {isProxy && (
                              <p className="type-caption text-status-green font-medium">
                                Proxy for: {record.shiftSwapRequest?.target?.firstName} {record.shiftSwapRequest?.target?.lastName}
                              </p>
                            )}
                          </div>
                        </TableCell>
                        <TableCell>{getStatusBadge(record.status)}</TableCell>
                        <TableCell className="text-label-secondary tabular-nums">{formatTime(record.checkInTime)}</TableCell>
                        <TableCell className="text-label-secondary tabular-nums">{formatTime(record.checkOutTime)}</TableCell>
                        <TableCell className="text-right font-medium text-foreground tabular-nums">
                          {record.workingHours ? `${record.workingHours} hrs` : '--'}
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
