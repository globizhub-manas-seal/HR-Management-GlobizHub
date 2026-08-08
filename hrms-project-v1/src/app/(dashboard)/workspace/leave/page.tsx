"use client";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import axios from "axios";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { CalendarClock, Plus, Loader2, CheckCircle, XCircle, Clock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";

const leaveSchema = z.object({
  type: z.string().min(1, "Select a leave type"),
  startDate: z.string().min(1, "Start date is required"),
  endDate: z.string().min(1, "End date is required"),
  reason: z.string().min(5, "Please provide a brief reason"),
});

export default function LeavePage() {
  const queryClient = useQueryClient();
  const [open, setOpen] = useState(false);

  const { data, isLoading } = useQuery({
    queryKey: ["myLeaves"],
    queryFn: async () => {
      const token = localStorage.getItem("hrms_token");
      const res = await axios.get(`${process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000"}/leaves/my`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      return res.data;
    },
  });

  const form = useForm<z.infer<typeof leaveSchema>>({
    resolver: zodResolver(leaveSchema),
    defaultValues: { type: "CASUAL", startDate: "", endDate: "", reason: "" },
  });

  const mutation = useMutation({
    mutationFn: async (values: z.infer<typeof leaveSchema>) => {
      const token = localStorage.getItem("hrms_token");
      await axios.post(`${process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000"}/leaves`, values, {
        headers: { Authorization: `Bearer ${token}` }
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["myLeaves"] });
      setOpen(false);
      form.reset();
    },
  });

  return (
    <div className="p-8 max-w-6xl mx-auto space-y-8">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-slate-900">Time Off & Leaves</h1>
          <p className="text-slate-500 mt-1">Manage your leave requests and view balances.</p>
        </div>

        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger
            render={
              <Button className="bg-emerald-500 hover:bg-emerald-600 text-white" />
            }
          >
            <Plus className="w-4 h-4 mr-2" /> Request Leave
          </DialogTrigger>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>New Leave Request</DialogTitle>
            </DialogHeader>
            <Form {...form}>
              <form onSubmit={form.handleSubmit((v) => mutation.mutate(v))} className="space-y-4">
                <FormField control={form.control} name="type" render={({ field }) => (
                  <FormItem>
                    <FormLabel>Leave Type</FormLabel>
                    <FormControl>
                      <select {...field} className="w-full border rounded-md p-2 text-sm bg-white">
                        <option value="CASUAL">Casual Leave</option>
                        <option value="MEDICAL">Medical Leave</option>
                        <option value="EARNED">Earned Leave</option>
                        <option value="MATERNITY">Maternity Leave</option>
                        <option value="PATERNITY">Paternity Leave</option>
                        <option value="UNPAID">Unpaid Leave</option>
                      </select>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )} />
                <div className="grid grid-cols-2 gap-4">
                  <FormField control={form.control} name="startDate" render={({ field }) => (
                    <FormItem>
                      <FormLabel>Start Date</FormLabel>
                      <FormControl><Input type="date" {...field} /></FormControl>
                      <FormMessage />
                    </FormItem>
                  )} />
                  <FormField control={form.control} name="endDate" render={({ field }) => (
                    <FormItem>
                      <FormLabel>End Date</FormLabel>
                      <FormControl><Input type="date" {...field} /></FormControl>
                      <FormMessage />
                    </FormItem>
                  )} />
                </div>
                <FormField control={form.control} name="reason" render={({ field }) => (
                  <FormItem>
                    <FormLabel>Reason</FormLabel>
                    <FormControl><Input placeholder="Reason for time off..." {...field} /></FormControl>
                    <FormMessage />
                  </FormItem>
                )} />
                <Button type="submit" className="w-full bg-emerald-500 hover:bg-emerald-600 text-white" disabled={mutation.isPending}>
                  {mutation.isPending ? <Loader2 className="animate-spin w-4 h-4" /> : "Submit Request"}
                </Button>
              </form>
            </Form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Leave Balances Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="bg-emerald-50/50 border-emerald-100">
          <CardContent className="p-6">
            <p className="text-sm font-medium text-emerald-600">Casual Leave Balance</p>
            <p className="text-3xl font-bold text-emerald-900 mt-2">{isLoading ? "--" : data?.balance?.casual ?? 12} Days</p>
          </CardContent>
        </Card>
        <Card className="bg-blue-50/50 border-blue-100">
          <CardContent className="p-6">
            <p className="text-sm font-medium text-blue-600">Medical Leave Balance</p>
            <p className="text-3xl font-bold text-blue-900 mt-2">{isLoading ? "--" : data?.balance?.medical ?? 10} Days</p>
          </CardContent>
        </Card>
        <Card className="bg-indigo-50/50 border-indigo-100">
          <CardContent className="p-6">
            <p className="text-sm font-medium text-indigo-600">Earned Leave Balance</p>
            <p className="text-3xl font-bold text-indigo-900 mt-2">{isLoading ? "--" : data?.balance?.earned ?? 15} Days</p>
          </CardContent>
        </Card>
      </div>

      {/* Leave History List */}
      <Card className="border-slate-200">
        <CardHeader>
          <CardTitle className="text-lg">My Request History</CardTitle>
          <CardDescription>Track the status of your submitted leave applications.</CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex justify-center py-8"><Loader2 className="animate-spin text-emerald-500" /></div>
          ) : data?.requests?.length === 0 ? (
            <p className="text-center text-slate-400 py-8">No leave requests found.</p>
          ) : (
            <div className="space-y-4">
              {data.requests.map((req: any) => (
                <div key={req.id} className="flex items-center justify-between p-4 border rounded-xl bg-slate-50/50">
                  <div>
                    <div className="flex items-center space-x-2">
                      <span className="font-semibold text-slate-900">{req.type} LEAVE</span>
                      <Badge className={
                        req.status === 'APPROVED' ? 'bg-emerald-500' :
                        req.status === 'REJECTED' ? 'bg-rose-500' : 'bg-amber-500'
                      }>
                        {req.status}
                      </Badge>
                    </div>
                    <p className="text-xs text-slate-500 mt-1">
                      {new Date(req.startDate).toLocaleDateString()} → {new Date(req.endDate).toLocaleDateString()}
                    </p>
                    <p className="text-xs text-slate-600 mt-2 italic">"{req.reason}"</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}