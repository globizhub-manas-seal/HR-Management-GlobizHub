"use client";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import axios from "axios";
import { Calendar as CalendarIcon, Plus, UserPlus, Clock, Loader2 } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";

export default function AdminScheduleManager() {
  const queryClient = useQueryClient();
  const [shiftForm, setShiftForm] = useState({ name: "", startTime: "09:00", endTime: "17:00", isNightShift: false });
  const [assignForm, setAssignForm] = useState({ employeeId: "", shiftId: "", date: "", isDayOff: false });

  // 1. Fetch Employees
  const { data: employees, isLoading: loadingEmps } = useQuery({
    queryKey: ["adminEmployees"],
    queryFn: async () => {
      const token = localStorage.getItem("hrms_token");
      const res = await axios.get(`${process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000"}/employees`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      return res.data;
    },
  });

  // 2. Fetch Active Shifts
  const { data: shifts, isLoading: loadingShifts } = useQuery({
    queryKey: ["activeShifts"],
    queryFn: async () => {
      const token = localStorage.getItem("hrms_token");
      const res = await axios.get(`${process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000"}/schedules/shifts`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      return res.data;
    },
  });

  // 3. Create Shift Mutation
 const createShiftMutation = useMutation({
  mutationFn: async (newShift: typeof shiftForm) => {
    const token = localStorage.getItem("hrms_token");

    const url = `${
      process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000"
    }/schedules/shifts`;

    const res = await axios.post(url, newShift, {
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
    });

    return res.data;
  },

  onSuccess: () => {
    queryClient.invalidateQueries({
      queryKey: ["activeShifts"],
    });

    setShiftForm({
      name: "",
      startTime: "09:00",
      endTime: "17:00",
      isNightShift: false,
    });
  },

  onError: () => {
    // Handle error through UI later
  },
});

  // 4. Assign Shift Mutation
  const assignScheduleMutation = useMutation({
    mutationFn: async (payload: typeof assignForm) => {
      const token = localStorage.getItem("hrms_token");
      const res = await axios.post(`${process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000"}/schedules/assign`, payload, {
        headers: { Authorization: `Bearer ${token}` }
      });
      return res.data;
    },
    onSuccess: () => {
      alert("Schedule assigned successfully!");
    },
  });

  if (loadingEmps || loadingShifts) return <div className="flex justify-center p-12"><Loader2 className="h-8 w-8 animate-spin text-emerald-500" /></div>;

  return (
    <div className="p-8 max-w-6xl mx-auto space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-slate-900">Schedule Manager</h1>
          <p className="text-slate-500 mt-1">Create shift templates and assign them to your team.</p>
        </div>
        
        {/* Create Shift Modal */}
        <Dialog>
          <DialogTrigger render={<Button className="bg-emerald-500 hover:bg-emerald-600 text-white" />}>
            <Plus className="w-4 h-4 mr-2" /> Create Shift
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>New Shift Template</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 pt-4">
              <div>
                <label className="text-sm font-medium">Shift Name</label>
                <Input placeholder="e.g. Morning Shift" value={shiftForm.name} onChange={(e) => setShiftForm({...shiftForm, name: e.target.value})} />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium">Start Time</label>
                  <Input type="time" value={shiftForm.startTime} onChange={(e) => setShiftForm({...shiftForm, startTime: e.target.value})} />
                </div>
                <div>
                  <label className="text-sm font-medium">End Time</label>
                  <Input type="time" value={shiftForm.endTime} onChange={(e) => setShiftForm({...shiftForm, endTime: e.target.value})} />
                </div>
              </div>
              <div className="flex items-center space-x-2">
                <input type="checkbox" checked={shiftForm.isNightShift} onChange={(e) => setShiftForm({...shiftForm, isNightShift: e.target.checked})} className="w-4 h-4 text-emerald-600" />
                <label className="text-sm">Is this a Night Shift?</label>
              </div>
              <Button onClick={() => createShiftMutation.mutate(shiftForm)} className="w-full bg-slate-900 hover:bg-slate-800 text-white">Save Shift Template</Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Left Column: Assign Shift Form */}
        <Card className="col-span-1 border-slate-200">
          <CardHeader className="bg-slate-50 border-b border-slate-100">
            <CardTitle className="text-lg flex items-center"><UserPlus className="w-5 h-5 mr-2 text-indigo-500" /> Assign Shift</CardTitle>
            <CardDescription>Allocate a shift to an employee for a specific date.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4 pt-4">
            <div>
              <label className="text-sm font-medium">Select Employee</label>
              <select className="w-full border rounded-md p-2 text-sm bg-white" onChange={(e) => setAssignForm({...assignForm, employeeId: e.target.value})}>
                <option value="">-- Choose Employee --</option>
                {employees?.map((emp: any) => (
                  <option key={emp.id} value={emp.id}>{emp.firstName} {emp.lastName}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="text-sm font-medium">Date</label>
              <Input type="date" onChange={(e) => setAssignForm({...assignForm, date: e.target.value})} />
            </div>
            <div>
              <label className="text-sm font-medium">Select Shift</label>
              <select className="w-full border rounded-md p-2 text-sm bg-white" onChange={(e) => setAssignForm({...assignForm, shiftId: e.target.value, isDayOff: false})}>
                <option value="">-- Choose Shift --</option>
                {shifts?.map((s: any) => (
                  <option key={s.id} value={s.id}>{s.name} ({s.startTime} - {s.endTime})</option>
                ))}
              </select>
            </div>
            <div className="flex items-center space-x-2 py-2 border-y my-2">
              <input type="checkbox" onChange={(e) => setAssignForm({...assignForm, isDayOff: e.target.checked, shiftId: ""})} className="w-4 h-4" />
              <label className="text-sm font-medium text-rose-600">Mark as Day Off</label>
            </div>
            <Button onClick={() => assignScheduleMutation.mutate(assignForm)} disabled={assignScheduleMutation.isPending || !assignForm.employeeId || !assignForm.date} className="w-full bg-emerald-500 hover:bg-emerald-600 text-white">
              {assignScheduleMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : "Assign Schedule"}
            </Button>
          </CardContent>
        </Card>

        {/* Right Column: Shift Templates List */}
        <Card className="col-span-1 md:col-span-2 border-slate-200">
          <CardHeader>
            <CardTitle className="text-lg flex items-center"><Clock className="w-5 h-5 mr-2 text-amber-500" /> Active Shift Templates</CardTitle>
          </CardHeader>
          <CardContent>
            {shifts?.length === 0 ? (
              <div className="text-center py-8 text-slate-500">No shift templates created yet. Click 'Create Shift' to add one.</div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Shift Name</TableHead>
                    <TableHead>Timings</TableHead>
                    <TableHead>Type</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {shifts?.map((s: any) => (
                    <TableRow key={s.id}>
                      <TableCell className="font-semibold">{s.name}</TableCell>
                      <TableCell>{s.startTime} - {s.endTime}</TableCell>
                      <TableCell>{s.isNightShift ? "Night Shift 🌙" : "Day Shift ☀️"}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}