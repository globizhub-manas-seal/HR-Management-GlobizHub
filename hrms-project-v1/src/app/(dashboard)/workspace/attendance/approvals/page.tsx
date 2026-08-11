"use client";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import axios from "axios";
import { CheckCircle, XCircle, Clock, Calendar, MessageSquare } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";

export default function AttendanceApprovalsPage() {
  const queryClient = useQueryClient();
  const [reviewNotes, setReviewNotes] = useState<{ [key: string]: string }>({});

  // 1. Fetch Pending Corrections
  const { data: corrections, isLoading } = useQuery({
    queryKey: ["pendingCorrections"],
    queryFn: async () => {
      const token = localStorage.getItem("hrms_token");
      const res = await axios.get(`${process.env.NEXT_PUBLIC_API_URL}/attendance/corrections/pending`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      return res.data;
    }
  });

  // 2. Mutation to Review (Approve/Reject)
  const reviewMutation = useMutation({
    mutationFn: async ({ id, status, note }: { id: string, status: 'APPROVED' | 'REJECTED', note?: string }) => {
      const token = localStorage.getItem("hrms_token");
      await axios.patch(`${process.env.NEXT_PUBLIC_API_URL}/attendance/corrections/${id}/review`, 
        { status, note },
        { headers: { Authorization: `Bearer ${token}` } }
      );
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["pendingCorrections"] });
    }
  });

  const handleReview = (id: string, status: 'APPROVED' | 'REJECTED') => {
    reviewMutation.mutate({ id, status, note: reviewNotes[id] });
  };

  const formatTime = (dateString?: string) => {
    if (!dateString) return "N/A";
    return new Date(dateString).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  if (isLoading) return <div className="p-8 text-slate-500">Loading pending requests...</div>;

  return (
    <div className="p-4 md:p-8 max-w-5xl mx-auto space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-slate-900">Attendance Approvals</h1>
        <p className="text-slate-500 mt-1">Review and approve manual clock-in corrections and overtime requests.</p>
      </div>

      {corrections?.length === 0 ? (
        <Card className="bg-slate-50 border-dashed">
          <CardContent className="flex flex-col items-center justify-center h-48 text-slate-500">
            <CheckCircle className="w-12 h-12 text-emerald-400 mb-4" />
            <p className="font-medium">All caught up!</p>
            <p className="text-sm">There are no pending attendance corrections.</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {corrections?.map((req: any) => (
            <Card key={req.id} className="border-slate-200 shadow-sm overflow-hidden">
              <div className="flex flex-col md:flex-row">
                
                {/* Left Side: Details */}
                <div className="p-6 flex-1 bg-white">
                  <div className="flex justify-between items-start mb-4">
                    <div>
                      <h3 className="font-bold text-lg text-slate-900">{req.employee.firstName} {req.employee.lastName}</h3>
                      <p className="text-sm text-slate-500">{req.employee.email}</p>
                    </div>
                    <Badge variant="outline" className="bg-amber-50 text-amber-700 border-amber-200">Pending Review</Badge>
                  </div>

                  <div className="grid grid-cols-2 gap-4 mb-4">
                    <div className="space-y-1">
                      <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider flex items-center"><Calendar className="w-3 h-3 mr-1"/> Date</span>
                      <p className="font-medium">{new Date(req.date).toLocaleDateString()}</p>
                    </div>
                    <div className="space-y-1">
                      <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider flex items-center"><Clock className="w-3 h-3 mr-1"/> Requested Times</span>
                      <p className="font-medium text-emerald-600">
                        {formatTime(req.requestedCheckIn)} - {formatTime(req.requestedCheckOut)}
                      </p>
                    </div>
                  </div>

                  <div className="bg-slate-50 p-3 rounded-md text-sm text-slate-700 border border-slate-100 flex items-start">
                    <MessageSquare className="w-4 h-4 mr-2 text-slate-400 mt-0.5 shrink-0" />
                    <p><strong>Reason:</strong> {req.reason}</p>
                  </div>
                </div>

                {/* Right Side: Action Area */}
                <div className="bg-slate-50 p-6 md:w-72 flex flex-col justify-center border-t md:border-t-0 md:border-l border-slate-100">
                  <label className="text-xs font-semibold text-slate-500 mb-2">Manager Note (Optional)</label>
                  <Input 
                    placeholder="e.g. Approved, please remember next time." 
                    className="mb-4 bg-white text-sm"
                    value={reviewNotes[req.id] || ""}
                    onChange={(e) => setReviewNotes({ ...reviewNotes, [req.id]: e.target.value })}
                  />
                  
                  <div className="flex space-x-2">
                    <Button 
                      className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white"
                      onClick={() => handleReview(req.id, 'APPROVED')}
                      disabled={reviewMutation.isPending}
                    >
                      <CheckCircle className="w-4 h-4 mr-1" /> Approve
                    </Button>
                    <Button 
                      variant="outline"
                      className="flex-1 text-rose-600 hover:bg-rose-50 hover:text-rose-700 border-rose-200"
                      onClick={() => handleReview(req.id, 'REJECTED')}
                      disabled={reviewMutation.isPending}
                    >
                      <XCircle className="w-4 h-4 mr-1" /> Reject
                    </Button>
                  </div>
                </div>

              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}