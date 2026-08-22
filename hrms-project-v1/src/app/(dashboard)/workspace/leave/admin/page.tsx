"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import axios from "axios";
import { Loader2, CalendarCheck, Check, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useViewMode } from "@/context/ViewModeContext";

export default function AdminLeaveApprovalPage() {
  const queryClient = useQueryClient();
  const router = useRouter();

  // Fetch current user details from global workspace ViewModeContext
  const { user, activeRole, isLoading: isLoadingUser } = useViewMode();

  // Redirect users in Employee mode back to the standard leaves page
  useEffect(() => {
    if (!isLoadingUser && activeRole === "EMPLOYEE") {
      router.push("/workspace/leave");
    }
  }, [activeRole, isLoadingUser, router]);

  // Fetch leave requests for approvals
  const { data: leaves, isLoading: isLoadingLeaves, error } = useQuery({
    queryKey: ["adminCompanyLeaves", activeRole],
    queryFn: async () => {
      const token = localStorage.getItem("hrms_token");
      const endpoint = activeRole === 'MANAGER' ? 'approvals' : 'company';
      const res = await axios.get(`${process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000"}/leaves/${endpoint}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      return res.data;
    },
    enabled: !!activeRole,
  });

  // Mutation to update leave status (APPROVE / REJECT)
  const statusMutation = useMutation({
    mutationFn: async ({ id, status }: { id: string; status: string }) => {
      const token = localStorage.getItem("hrms_token");
      await axios.patch(
        `${process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000"}/leaves/${id}/status`,
        { status },
        { headers: { Authorization: `Bearer ${token}` } }
      );
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["adminCompanyLeaves"] });
    },
  });

  const isLoading = isLoadingUser || isLoadingLeaves;

  return (
    <div className="p-8 max-w-6xl mx-auto space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-slate-900">Leave Approvals</h1>
        <p className="text-slate-500 mt-1">Review and manage pending time-off requests from your team members.</p>
      </div>

      <Card className="border-slate-200 shadow-sm">
        <CardHeader className="bg-slate-50/50 border-b border-slate-100">
          <CardTitle className="flex items-center text-lg text-slate-800">
            <CalendarCheck className="mr-2 h-5 w-5 text-emerald-500" />
            Company Leave Requests
          </CardTitle>
          <CardDescription>Approve or reject employee leave applications.</CardDescription>
        </CardHeader>
        <CardContent className="p-0">
          {isLoading ? (
            <div className="flex justify-center items-center h-48 text-emerald-500">
              <Loader2 className="h-8 w-8 animate-spin" />
            </div>
          ) : error ? (
            <div className="p-6 text-center text-red-500">Failed to load leave requests. (Ensure you are logged in as Admin/HR).</div>
          ) : leaves?.length === 0 ? (
            <div className="p-12 text-center text-slate-500">No leave requests found from your employees yet.</div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow className="bg-slate-50/50 hover:bg-slate-50/50">
                  <TableHead className="font-semibold text-slate-700">Employee</TableHead>
                  <TableHead className="font-semibold text-slate-700">Type</TableHead>
                  <TableHead className="font-semibold text-slate-700">Dates</TableHead>
                  <TableHead className="font-semibold text-slate-700">Reason</TableHead>
                  <TableHead className="font-semibold text-slate-700">Status</TableHead>
                  <TableHead className="font-semibold text-slate-700 text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {leaves.map((req: any) => (
                  <TableRow key={req.id}>
                    <TableCell className="font-medium text-slate-900">
                      {req.employee?.firstName} {req.employee?.lastName}
                      <span className="block text-xs text-slate-400 font-normal">{req.employee?.email}</span>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline" className="font-semibold">{req.type}</Badge>
                    </TableCell>
                    <TableCell className="text-slate-600 text-xs">
                      {new Date(req.startDate).toLocaleDateString()} → {new Date(req.endDate).toLocaleDateString()}
                    </TableCell>
                    <TableCell className="text-slate-600 italic max-w-xs truncate">{req.reason}</TableCell>
                    <TableCell>
                      <Badge className={
                        req.status === 'APPROVED' ? 'bg-emerald-500' :
                        req.status === 'REJECTED' ? 'bg-rose-500' : 'bg-amber-500'
                      }>
                        {req.status}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right space-x-2">
                      {req.status === 'PENDING' && (
                        <>
                          <Button 
                            size="sm" 
                            className="bg-emerald-500 hover:bg-emerald-600 text-white h-8 px-3"
                            onClick={() => statusMutation.mutate({ id: req.id, status: 'APPROVED' })}
                            disabled={statusMutation.isPending}
                          >
                            <Check className="w-4 h-4 mr-1" /> Approve
                          </Button>
                          <Button 
                            size="sm" 
                            variant="destructive"
                            className="h-8 px-3"
                            onClick={() => statusMutation.mutate({ id: req.id, status: 'REJECTED' })}
                            disabled={statusMutation.isPending}
                          >
                            <X className="w-4 h-4 mr-1" /> Reject
                          </Button>
                        </>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}