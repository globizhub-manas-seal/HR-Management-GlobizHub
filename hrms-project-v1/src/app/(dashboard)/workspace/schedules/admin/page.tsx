"use client";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import axios from "axios";
import { API_BASE_URL } from "@/lib/api";
import {
  Calendar as CalendarIcon,
  Plus,
  Clock,
  Loader2,
  Pencil,
  Trash2,
  Grid,
  ChevronLeft,
  ChevronRight,
  Repeat,
  AlertTriangle,
  CheckCircle2,
  Filter,
  Moon,
  Sun,
  Users,
  Layers,
  ArrowRight,
} from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { TableSkeleton } from "@/components/skeletons";

export default function EnterpriseScheduleManager() {
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState<"matrix" | "bulk" | "templates">("matrix");

  // --- Date Range for Roster Matrix (Default current week Mon-Sun) ---
  const getInitialWeek = () => {
    const today = new Date();
    const day = today.getDay();
    const diff = today.getDate() - day + (day === 0 ? -6 : 1); // Adjust when day is Sunday
    const monday = new Date(today.setDate(diff));
    const sunday = new Date(monday);
    sunday.setDate(monday.getDate() + 6);
    return {
      start: monday.toISOString().split("T")[0],
      end: sunday.toISOString().split("T")[0],
    };
  };

  const initialWeek = getInitialWeek();
  const [matrixStartDate, setMatrixStartDate] = useState(initialWeek.start);
  const [matrixEndDate, setMatrixEndDate] = useState(initialWeek.end);
  const [departmentFilter, setDepartmentFilter] = useState("");

  // Shift Template Modal & Form
  const [isShiftModalOpen, setIsShiftModalOpen] = useState(false);
  const [editingShift, setEditingShift] = useState<any | null>(null);
  const [shiftForm, setShiftForm] = useState({
    name: "",
    startTime: "09:00",
    endTime: "17:00",
    isNightShift: false,
    allowMultiPunch: false,
  });

  // Bulk Assignment Form
  const [bulkMode, setBulkMode] = useState<"RANGE" | "ROTATION">("RANGE");
  const [bulkForm, setBulkForm] = useState({
    targetType: "DEPARTMENT", // "DEPARTMENT" | "EMPLOYEES"
    departmentId: "",
    employeeIds: [] as string[],
    shiftId: "",
    isDayOff: false,
    startDate: initialWeek.start,
    endDate: initialWeek.end,
    daysOfWeek: [1, 2, 3, 4, 5], // Mon-Fri default
    overrideConflict: false,
    overrideReason: "",
  });

  // Cyclical Rotational Pattern Form
  const [rotationForm, setRotationForm] = useState({
    employeeIds: [] as string[],
    startDate: initialWeek.start,
    cycles: 2,
    pattern: [
      { shiftId: "", isDayOff: false },
      { shiftId: "", isDayOff: false },
      { shiftId: "", isDayOff: true },
    ],
    overrideConflict: false,
    overrideReason: "",
  });

  // Conflict Modal State
  const [complianceConflicts, setComplianceConflicts] = useState<any[]>([]);
  const [isConflictModalOpen, setIsConflictModalOpen] = useState(false);
  const [pendingAction, setPendingAction] = useState<"BULK" | "ROTATION" | null>(null);

  // 1. Fetch Employees
  const { data: employees, isLoading: loadingEmps } = useQuery({
    queryKey: ["adminEmployees"],
    queryFn: async () => {
      const token = localStorage.getItem("hrms_token");
      const res = await axios.get(`${API_BASE_URL}/employees`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      return res.data;
    },
  });

  // 2. Fetch Departments
  const { data: departments } = useQuery({
    queryKey: ["adminDepartments"],
    queryFn: async () => {
      const token = localStorage.getItem("hrms_token");
      const res = await axios.get(`${API_BASE_URL}/organization/departments`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      return res.data;
    },
  });

  // 3. Fetch Active Shift Templates
  const { data: shifts, isLoading: loadingShifts } = useQuery({
    queryKey: ["activeShifts"],
    queryFn: async () => {
      const token = localStorage.getItem("hrms_token");
      const res = await axios.get(`${API_BASE_URL}/schedules/shifts`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      return res.data;
    },
  });

  // 4. Fetch Visual Roster Matrix Grid
  const {
    data: rosterMatrix,
    isLoading: loadingMatrix,
    refetch: refetchMatrix,
  } = useQuery({
    queryKey: ["rosterMatrix", matrixStartDate, matrixEndDate, departmentFilter],
    queryFn: async () => {
      const token = localStorage.getItem("hrms_token");
      const params = new URLSearchParams({
        startDate: matrixStartDate,
        endDate: matrixEndDate,
      });
      if (departmentFilter) {
        params.append("departmentId", departmentFilter);
      }
      const res = await axios.get(`${API_BASE_URL}/schedules/matrix?${params.toString()}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      return res.data;
    },
    enabled: activeTab === "matrix",
  });

  // Shift Template Mutations
  const saveShiftMutation = useMutation({
    mutationFn: async (payload: typeof shiftForm) => {
      const token = localStorage.getItem("hrms_token");
      if (editingShift?.id) {
        return axios.patch(`${API_BASE_URL}/schedules/shifts/${editingShift.id}`, payload, {
          headers: { Authorization: `Bearer ${token}` },
        });
      }
      return axios.post(`${API_BASE_URL}/schedules/shifts`, payload, {
        headers: { Authorization: `Bearer ${token}` },
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["activeShifts"] });
      setIsShiftModalOpen(false);
      setEditingShift(null);
      setShiftForm({ name: "", startTime: "09:00", endTime: "17:00", isNightShift: false, allowMultiPunch: false });
    },
  });

  const deleteShiftMutation = useMutation({
    mutationFn: async (id: string) => {
      const token = localStorage.getItem("hrms_token");
      return axios.delete(`${API_BASE_URL}/schedules/shifts/${id}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["activeShifts"] });
    },
  });

  // Bulk Assign Schedule Mutation
  const bulkAssignMutation = useMutation({
    mutationFn: async (payload: any) => {
      const token = localStorage.getItem("hrms_token");
      const res = await axios.post(`${API_BASE_URL}/schedules/bulk-assign`, payload, {
        headers: { Authorization: `Bearer ${token}` },
      });
      return res.data;
    },
    onSuccess: (data) => {
      if (data?.requiresOverride) {
        setComplianceConflicts(data.conflicts || []);
        setPendingAction("BULK");
        setIsConflictModalOpen(true);
      } else {
        alert(`Success: Assigned ${data.totalAssigned || 0} shift slots successfully!`);
        queryClient.invalidateQueries({ queryKey: ["rosterMatrix"] });
        setIsConflictModalOpen(false);
      }
    },
    onError: (err: any) => {
      alert(err.response?.data?.message || "Failed to bulk assign schedules.");
    },
  });

  // Rotational Pattern Mutation
  const applyRotationMutation = useMutation({
    mutationFn: async (payload: any) => {
      const token = localStorage.getItem("hrms_token");
      const res = await axios.post(`${API_BASE_URL}/schedules/apply-rotation`, payload, {
        headers: { Authorization: `Bearer ${token}` },
      });
      return res.data;
    },
    onSuccess: (data) => {
      if (data?.requiresOverride) {
        setComplianceConflicts(data.conflicts || []);
        setPendingAction("ROTATION");
        setIsConflictModalOpen(true);
      } else {
        alert(`Success: Rotational schedule generated for ${data.totalAssigned || 0} shift days across ${data.cycles} cycles!`);
        queryClient.invalidateQueries({ queryKey: ["rosterMatrix"] });
        setIsConflictModalOpen(false);
      }
    },
    onError: (err: any) => {
      alert(err.response?.data?.message || "Failed to apply rotational pattern.");
    },
  });

  // Week Navigator Handlers
  const handleNavigateWeek = (offsetDays: number) => {
    const curStart = new Date(matrixStartDate);
    curStart.setDate(curStart.getDate() + offsetDays);
    const curEnd = new Date(curStart);
    curEnd.setDate(curStart.getDate() + 6);
    setMatrixStartDate(curStart.toISOString().split("T")[0]);
    setMatrixEndDate(curEnd.toISOString().split("T")[0]);
  };

  // Conflict Override Confirmation Handler
  const handleConfirmOverride = () => {
    if (pendingAction === "BULK") {
      bulkAssignMutation.mutate({
        ...bulkForm,
        employeeIds: bulkForm.targetType === "EMPLOYEES" ? bulkForm.employeeIds : undefined,
        overrideConflict: true,
        overrideReason: bulkForm.overrideReason || "Manager statutory emergency override",
      });
    } else if (pendingAction === "ROTATION") {
      applyRotationMutation.mutate({
        ...rotationForm,
        overrideConflict: true,
        overrideReason: rotationForm.overrideReason || "Manager rotational emergency override",
      });
    }
  };

  if (loadingEmps || loadingShifts) {
    return (
      <div className="p-8 max-w-7xl mx-auto">
        <TableSkeleton rowCount={6} columnCount={6} title="Enterprise Roster & Shift Center" subtitle="Manage bulk schedules, rotational shifts, and visual roster matrices." showAvatar={false} />
      </div>
    );
  }

  return (
    <div className="p-6 md:p-8 max-w-7xl mx-auto space-y-6">
      {/* Top Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-200 pb-5">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-3xl font-bold tracking-tight text-slate-900">Enterprise Roster & Shift Operations</h1>
            <Badge variant="outline" className="bg-emerald-50 text-emerald-700 border-emerald-200 text-xs">
              SaaS Ready
            </Badge>
          </div>
          <p className="text-slate-500 mt-1 text-sm">
            Visual matrix grids, rotational cyclic roster generation, statutory 11h rest compliance, and manager RBAC.
          </p>
        </div>

        {/* Tab Controls */}
        <div className="flex items-center bg-slate-100 p-1 rounded-lg border border-slate-200">
          <button
            onClick={() => setActiveTab("matrix")}
            className={`flex items-center gap-2 px-3.5 py-1.5 text-xs font-semibold rounded-md transition-all ${
              activeTab === "matrix" ? "bg-white text-slate-900 shadow-sm" : "text-slate-600 hover:text-slate-900"
            }`}
          >
            <Grid className="w-3.5 h-3.5 text-indigo-500" /> Roster Matrix Grid
          </button>
          <button
            onClick={() => setActiveTab("bulk")}
            className={`flex items-center gap-2 px-3.5 py-1.5 text-xs font-semibold rounded-md transition-all ${
              activeTab === "bulk" ? "bg-white text-slate-900 shadow-sm" : "text-slate-600 hover:text-slate-900"
            }`}
          >
            <Repeat className="w-3.5 h-3.5 text-emerald-500" /> Bulk & Rotation Generator
          </button>
          <button
            onClick={() => setActiveTab("templates")}
            className={`flex items-center gap-2 px-3.5 py-1.5 text-xs font-semibold rounded-md transition-all ${
              activeTab === "templates" ? "bg-white text-slate-900 shadow-sm" : "text-slate-600 hover:text-slate-900"
            }`}
          >
            <Clock className="w-3.5 h-3.5 text-amber-500" /> Shift Templates
          </button>
        </div>
      </div>

      {/* ============================================================ */}
      {/* TAB 1: VISUAL ROSTER MATRIX GRID */}
      {/* ============================================================ */}
      {activeTab === "matrix" && (
        <div className="space-y-4">
          {/* Filter & Navigation Bar */}
          <Card className="border-slate-200 shadow-sm">
            <CardContent className="p-4 flex flex-col md:flex-row items-center justify-between gap-4">
              <div className="flex flex-wrap items-center gap-3">
                <div className="flex items-center gap-1.5 bg-slate-50 border rounded-md px-2 py-1">
                  <Button variant="ghost" size="sm" className="h-7 w-7 p-0" onClick={() => handleNavigateWeek(-7)}>
                    <ChevronLeft className="w-4 h-4 text-slate-600" />
                  </Button>
                  <span className="text-xs font-medium text-slate-700 px-2">
                    {matrixStartDate} <span className="text-slate-400">to</span> {matrixEndDate}
                  </span>
                  <Button variant="ghost" size="sm" className="h-7 w-7 p-0" onClick={() => handleNavigateWeek(7)}>
                    <ChevronRight className="w-4 h-4 text-slate-600" />
                  </Button>
                </div>

                <div className="flex items-center gap-2">
                  <Filter className="w-3.5 h-3.5 text-slate-400" />
                  <select
                    value={departmentFilter}
                    onChange={(e) => setDepartmentFilter(e.target.value)}
                    className="border rounded-md px-2 py-1 text-xs bg-white text-slate-700 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                  >
                    <option value="">All Departments</option>
                    {departments?.map((dept: any) => (
                      <option key={dept.id} value={dept.id}>
                        {dept.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Legend */}
              <div className="flex items-center gap-3 text-xs text-slate-600">
                <span className="flex items-center gap-1">
                  <span className="w-2.5 h-2.5 rounded-full bg-emerald-500"></span> Day Shift
                </span>
                <span className="flex items-center gap-1">
                  <span className="w-2.5 h-2.5 rounded-full bg-indigo-600"></span> Night Shift 🌙
                </span>
                <span className="flex items-center gap-1">
                  <span className="w-2.5 h-2.5 rounded-full bg-slate-300"></span> Day Off
                </span>
                <span className="flex items-center gap-1">
                  <span className="w-2.5 h-2.5 rounded-full bg-amber-500"></span> Swap/Override
                </span>
              </div>
            </CardContent>
          </Card>

          {/* Matrix Grid Table */}
          <Card className="border-slate-200 shadow-sm overflow-hidden">
            <CardHeader className="bg-slate-50/75 border-b border-slate-100 py-3">
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-base font-semibold text-slate-800">Shift Roster Grid</CardTitle>
                  <CardDescription className="text-xs">
                    Showing scheduled shifts, rotational assignments, and approved swap overrides.
                  </CardDescription>
                </div>
                <Badge variant="secondary" className="text-xs font-medium">
                  {rosterMatrix?.totalEmployees || 0} Staff Members
                </Badge>
              </div>
            </CardHeader>
            <CardContent className="p-0">
              {loadingMatrix ? (
                <div className="py-16 text-center text-slate-400">
                  <Loader2 className="w-6 h-6 animate-spin mx-auto mb-2 text-indigo-500" />
                  Loading Roster Matrix...
                </div>
              ) : rosterMatrix?.matrix?.length === 0 ? (
                <div className="py-16 text-center text-slate-500 text-sm">
                  No employee schedules found in the selected date window.
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <Table className="w-full text-xs">
                    <TableHeader className="bg-slate-100/70 border-b border-slate-200">
                      <TableRow>
                        <TableHead className="min-w-[180px] font-semibold text-slate-900 sticky left-0 bg-slate-100 z-10">
                          Employee
                        </TableHead>
                        {rosterMatrix?.days?.map((d: string) => {
                          const dateObj = new Date(d);
                          const dayName = dateObj.toLocaleDateString("en-US", { weekday: "short" });
                          const isWeekend = dayName === "Sun" || dayName === "Sat";
                          return (
                            <TableHead
                              key={d}
                              className={`text-center min-w-[120px] font-semibold ${
                                isWeekend ? "bg-slate-200/50 text-slate-800" : "text-slate-700"
                              }`}
                            >
                              <div className="text-[11px] font-bold uppercase">{dayName}</div>
                              <div className="text-[10px] text-slate-500">{d.slice(5)}</div>
                            </TableHead>
                          );
                        })}
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {rosterMatrix?.matrix?.map((row: any) => (
                        <TableRow key={row.employeeId} className="hover:bg-slate-50/50">
                          {/* Sticky Employee Identity Cell */}
                          <TableCell className="font-medium sticky left-0 bg-white z-10 border-r border-slate-100">
                            <div className="font-semibold text-slate-900">{row.employeeName}</div>
                            <div className="text-[11px] text-slate-400">
                              {row.employeeCode ? `${row.employeeCode} • ` : ""}
                              {row.department}
                            </div>
                          </TableCell>

                          {/* Day Cells */}
                          {rosterMatrix?.days?.map((d: string) => {
                            const cell = row.days?.[d];
                            if (!cell || cell.shiftName === "Unassigned") {
                              return (
                                <TableCell key={d} className="text-center p-2 text-slate-300">
                                  —
                                </TableCell>
                              );
                            }

                            if (cell.isDayOff) {
                              return (
                                <TableCell key={d} className="text-center p-2">
                                  <span className="inline-block px-2 py-1 rounded bg-slate-100 text-slate-500 text-[11px] font-medium border border-slate-200">
                                    Off
                                  </span>
                                </TableCell>
                              );
                            }

                            return (
                              <TableCell key={d} className="text-center p-2">
                                <div
                                  className={`rounded-md p-1.5 text-[11px] border leading-tight ${
                                    cell.isOverride
                                      ? "bg-amber-50 text-amber-900 border-amber-200"
                                      : cell.isNightShift
                                      ? "bg-indigo-50 text-indigo-900 border-indigo-200"
                                      : "bg-emerald-50 text-emerald-900 border-emerald-200"
                                  }`}
                                >
                                  <div className="font-semibold truncate flex items-center justify-center gap-1">
                                    {cell.isNightShift && <Moon className="w-3 h-3 text-indigo-600" />}
                                    {cell.shiftName}
                                  </div>
                                  <div className="text-[10px] opacity-75 mt-0.5">
                                    {cell.startTime} - {cell.endTime}
                                  </div>
                                  {cell.isOverride && (
                                    <div className="text-[9px] font-medium text-amber-700 mt-0.5">
                                      Swap Override
                                    </div>
                                  )}
                                </div>
                              </TableCell>
                            );
                          })}
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      )}

      {/* ============================================================ */}
      {/* TAB 2: BULK & ROTATIONAL ROSTER GENERATOR */}
      {/* ============================================================ */}
      {activeTab === "bulk" && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Generator Config Card */}
          <Card className="lg:col-span-2 border-slate-200 shadow-sm">
            <CardHeader className="bg-slate-50/75 border-b border-slate-100">
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-base font-semibold text-slate-900">
                    {bulkMode === "RANGE" ? "Bulk Shift Allocator" : "Cyclical Rotational Pattern Generator"}
                  </CardTitle>
                  <CardDescription className="text-xs">
                    {bulkMode === "RANGE"
                      ? "Assign fixed shift timings across multiple employees or an entire department."
                      : "Build recurring rotation patterns (e.g. 2 Morning, 2 Evening, 2 Night, 2 Off) across cycles."}
                  </CardDescription>
                </div>
                <div className="flex items-center bg-slate-200 p-0.5 rounded-md text-xs">
                  <button
                    onClick={() => setBulkMode("RANGE")}
                    className={`px-2.5 py-1 rounded font-medium ${
                      bulkMode === "RANGE" ? "bg-white text-slate-900 shadow-xs" : "text-slate-600"
                    }`}
                  >
                    Fixed Date Range
                  </button>
                  <button
                    onClick={() => setBulkMode("ROTATION")}
                    className={`px-2.5 py-1 rounded font-medium ${
                      bulkMode === "ROTATION" ? "bg-white text-slate-900 shadow-xs" : "text-slate-600"
                    }`}
                  >
                    Rotational Pattern
                  </button>
                </div>
              </div>
            </CardHeader>
            <CardContent className="p-6 space-y-5">
              {/* Target Selector */}
              <div>
                <label className="text-xs font-semibold text-slate-700 block mb-1.5">Target Audience</label>
                {bulkMode === "RANGE" && (
                  <div className="flex gap-4 mb-3 text-xs">
                    <label className="flex items-center gap-1.5 cursor-pointer">
                      <input
                        type="radio"
                        checked={bulkForm.targetType === "DEPARTMENT"}
                        onChange={() => setBulkForm({ ...bulkForm, targetType: "DEPARTMENT" })}
                      />
                      Entire Department
                    </label>
                    <label className="flex items-center gap-1.5 cursor-pointer">
                      <input
                        type="radio"
                        checked={bulkForm.targetType === "EMPLOYEES"}
                        onChange={() => setBulkForm({ ...bulkForm, targetType: "EMPLOYEES" })}
                      />
                      Specific Staff Members
                    </label>
                  </div>
                )}

                {bulkMode === "RANGE" && bulkForm.targetType === "DEPARTMENT" ? (
                  <select
                    value={bulkForm.departmentId}
                    onChange={(e) => setBulkForm({ ...bulkForm, departmentId: e.target.value })}
                    className="w-full border rounded-md p-2 text-sm bg-white"
                  >
                    <option value="">-- Choose Target Department --</option>
                    {departments?.map((dept: any) => (
                      <option key={dept.id} value={dept.id}>
                        {dept.name}
                      </option>
                    ))}
                  </select>
                ) : (
                  <div className="border rounded-md p-3 max-h-48 overflow-y-auto space-y-1.5 bg-slate-50/50">
                    {employees?.map((emp: any) => {
                      const selected =
                        bulkMode === "RANGE"
                          ? bulkForm.employeeIds.includes(emp.id)
                          : rotationForm.employeeIds.includes(emp.id);
                      return (
                        <label
                          key={emp.id}
                          className="flex items-center gap-2 text-xs text-slate-700 hover:bg-slate-100 p-1.5 rounded cursor-pointer"
                        >
                          <input
                            type="checkbox"
                            checked={selected}
                            onChange={(e) => {
                              if (bulkMode === "RANGE") {
                                const next = e.target.checked
                                  ? [...bulkForm.employeeIds, emp.id]
                                  : bulkForm.employeeIds.filter((id) => id !== emp.id);
                                setBulkForm({ ...bulkForm, employeeIds: next });
                              } else {
                                const next = e.target.checked
                                  ? [...rotationForm.employeeIds, emp.id]
                                  : rotationForm.employeeIds.filter((id) => id !== emp.id);
                                setRotationForm({ ...rotationForm, employeeIds: next });
                              }
                            }}
                          />
                          <span className="font-medium">
                            {emp.firstName} {emp.lastName}
                          </span>
                          <span className="text-slate-400">({emp.department?.name || "General"})</span>
                        </label>
                      );
                    })}
                  </div>
                )}
              </div>

              {/* Mode 1: Fixed Date Range Inputs */}
              {bulkMode === "RANGE" ? (
                <>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="text-xs font-semibold text-slate-700 block mb-1">Start Date</label>
                      <Input
                        type="date"
                        value={bulkForm.startDate}
                        onChange={(e) => setBulkForm({ ...bulkForm, startDate: e.target.value })}
                      />
                    </div>
                    <div>
                      <label className="text-xs font-semibold text-slate-700 block mb-1">End Date</label>
                      <Input
                        type="date"
                        value={bulkForm.endDate}
                        onChange={(e) => setBulkForm({ ...bulkForm, endDate: e.target.value })}
                      />
                    </div>
                  </div>

                  {/* Shift Selection */}
                  <div>
                    <label className="text-xs font-semibold text-slate-700 block mb-1">Shift Assignment</label>
                    <select
                      value={bulkForm.shiftId}
                      onChange={(e) => setBulkForm({ ...bulkForm, shiftId: e.target.value, isDayOff: false })}
                      className="w-full border rounded-md p-2 text-sm bg-white"
                    >
                      <option value="">-- Choose Shift Template --</option>
                      {shifts?.map((s: any) => (
                        <option key={s.id} value={s.id}>
                          {s.name} ({s.startTime} - {s.endTime}) {s.isNightShift ? "🌙 Night" : "☀️ Day"}
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Days of Week Filter */}
                  <div>
                    <label className="text-xs font-semibold text-slate-700 block mb-1.5">
                      Apply On Days of the Week
                    </label>
                    <div className="flex flex-wrap gap-2 text-xs">
                      {[
                        { label: "Mon", day: 1 },
                        { label: "Tue", day: 2 },
                        { label: "Wed", day: 3 },
                        { label: "Thu", day: 4 },
                        { label: "Fri", day: 5 },
                        { label: "Sat", day: 6 },
                        { label: "Sun", day: 0 },
                      ].map((item) => {
                        const active = bulkForm.daysOfWeek.includes(item.day);
                        return (
                          <button
                            key={item.day}
                            type="button"
                            onClick={() => {
                              const next = active
                                ? bulkForm.daysOfWeek.filter((d) => d !== item.day)
                                : [...bulkForm.daysOfWeek, item.day];
                              setBulkForm({ ...bulkForm, daysOfWeek: next });
                            }}
                            className={`px-3 py-1.5 rounded-md font-medium border transition-colors ${
                              active
                                ? "bg-indigo-600 text-white border-indigo-600"
                                : "bg-white text-slate-600 border-slate-200 hover:bg-slate-50"
                            }`}
                          >
                            {item.label}
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  <Button
                    onClick={() => {
                      bulkAssignMutation.mutate({
                        ...bulkForm,
                        employeeIds: bulkForm.targetType === "EMPLOYEES" ? bulkForm.employeeIds : undefined,
                        overrideConflict: false,
                      });
                    }}
                    disabled={bulkAssignMutation.isPending || (!bulkForm.shiftId && !bulkForm.isDayOff)}
                    className="w-full bg-indigo-600 hover:bg-indigo-700 text-white"
                  >
                    {bulkAssignMutation.isPending ? (
                      <Loader2 className="w-4 h-4 animate-spin mr-2" />
                    ) : (
                      <CheckCircle2 className="w-4 h-4 mr-2" />
                    )}
                    Execute Bulk Shift Assignment
                  </Button>
                </>
              ) : (
                /* Mode 2: Rotational Pattern Builder */
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="text-xs font-semibold text-slate-700 block mb-1">Rotation Starts On</label>
                      <Input
                        type="date"
                        value={rotationForm.startDate}
                        onChange={(e) => setRotationForm({ ...rotationForm, startDate: e.target.value })}
                      />
                    </div>
                    <div>
                      <label className="text-xs font-semibold text-slate-700 block mb-1">
                        Number of Cycles to Repeat
                      </label>
                      <Input
                        type="number"
                        min={1}
                        max={12}
                        value={rotationForm.cycles}
                        onChange={(e) => setRotationForm({ ...rotationForm, cycles: parseInt(e.target.value) || 1 })}
                      />
                    </div>
                  </div>

                  {/* Pattern Steps Builder */}
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <label className="text-xs font-semibold text-slate-700">
                        Cyclical Shift Pattern Sequence ({rotationForm.pattern.length} Days per Cycle)
                      </label>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() =>
                          setRotationForm({
                            ...rotationForm,
                            pattern: [...rotationForm.pattern, { shiftId: "", isDayOff: false }],
                          })
                        }
                        className="h-7 text-xs"
                      >
                        <Plus className="w-3 h-3 mr-1" /> Add Step
                      </Button>
                    </div>

                    <div className="space-y-2">
                      {rotationForm.pattern.map((step, idx) => (
                        <div key={idx} className="flex items-center gap-2 bg-slate-50 p-2 rounded-md border text-xs">
                          <span className="font-bold text-slate-500 w-12">Day {idx + 1}</span>
                          <select
                            value={step.shiftId || (step.isDayOff ? "OFF" : "")}
                            onChange={(e) => {
                              const val = e.target.value;
                              const updated = [...rotationForm.pattern];
                              if (val === "OFF") {
                                updated[idx] = { shiftId: "", isDayOff: true };
                              } else {
                                updated[idx] = { shiftId: val, isDayOff: false };
                              }
                              setRotationForm({ ...rotationForm, pattern: updated });
                            }}
                            className="flex-1 border rounded p-1.5 bg-white text-xs"
                          >
                            <option value="">-- Choose Shift or Off --</option>
                            <option value="OFF">⛔ Statutory Day Off</option>
                            {shifts?.map((s: any) => (
                              <option key={s.id} value={s.id}>
                                {s.name} ({s.startTime} - {s.endTime}) {s.isNightShift ? "🌙" : "☀️"}
                              </option>
                            ))}
                          </select>
                          {rotationForm.pattern.length > 1 && (
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-7 w-7 p-0 text-rose-500 hover:text-rose-700"
                              onClick={() => {
                                const updated = rotationForm.pattern.filter((_, i) => i !== idx);
                                setRotationForm({ ...rotationForm, pattern: updated });
                              }}
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </Button>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>

                  <Button
                    onClick={() => {
                      applyRotationMutation.mutate({
                        ...rotationForm,
                        overrideConflict: false,
                      });
                    }}
                    disabled={applyRotationMutation.isPending || rotationForm.employeeIds.length === 0}
                    className="w-full bg-emerald-600 hover:bg-emerald-700 text-white"
                  >
                    {applyRotationMutation.isPending ? (
                      <Loader2 className="w-4 h-4 animate-spin mr-2" />
                    ) : (
                      <Repeat className="w-4 h-4 mr-2" />
                    )}
                    Generate & Rollout Rotational Roster
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Quick Info & Statutory Standards Card */}
          <Card className="border-slate-200 shadow-sm bg-slate-50/50">
            <CardHeader>
              <CardTitle className="text-sm font-semibold flex items-center text-slate-800">
                <AlertTriangle className="w-4 h-4 mr-2 text-amber-500" /> Statutory Compliance Engine
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-xs text-slate-600 leading-relaxed">
              <div className="bg-white p-3 rounded-md border border-slate-200">
                <div className="font-semibold text-slate-800 mb-0.5">11-Hour Minimum Rest Period</div>
                <div>
                  Statutory labor law mandates at least 11 consecutive hours of rest between consecutive shifts.
                  Scheduling an early morning shift immediately following a night shift will trigger an automatic
                  compliance block.
                </div>
              </div>

              <div className="bg-white p-3 rounded-md border border-slate-200">
                <div className="font-semibold text-slate-800 mb-0.5">Max 6 Consecutive Working Days</div>
                <div>
                  Employees cannot be scheduled for more than 6 consecutive working days without a statutory weekly rest
                  day. Rotational patterns automatically audit consecutive stretches.
                </div>
              </div>

              <div className="bg-white p-3 rounded-md border border-slate-200">
                <div className="font-semibold text-slate-800 mb-0.5">Night Shift Payroll Premium</div>
                <div>
                  All night shifts completed in this roster automatically accrue into monthly payroll as the
                  configured Night Shift Allowance rate u/s company settings.
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* ============================================================ */}
      {/* TAB 3: SHIFT TEMPLATES MANAGEMENT */}
      {/* ============================================================ */}
      {activeTab === "templates" && (
        <Card className="border-slate-200 shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between pb-4 border-b">
            <div>
              <CardTitle className="text-base font-semibold">Active Shift Templates</CardTitle>
              <CardDescription className="text-xs">
                Configure shift boundaries, cross-midnight flags, and split shift rules.
              </CardDescription>
            </div>
            <Button
              onClick={() => {
                setEditingShift(null);
                setShiftForm({
                  name: "",
                  startTime: "09:00",
                  endTime: "17:00",
                  isNightShift: false,
                  allowMultiPunch: false,
                });
                setIsShiftModalOpen(true);
              }}
              className="bg-emerald-600 hover:bg-emerald-700 text-white text-xs h-9"
            >
              <Plus className="w-3.5 h-3.5 mr-1.5" /> Create Shift Template
            </Button>
          </CardHeader>
          <CardContent className="p-0">
            <Table>
              <TableHeader className="bg-slate-50 text-xs">
                <TableRow>
                  <TableHead>Shift Name</TableHead>
                  <TableHead>Timings</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Multi-Punch / Split</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody className="text-xs">
                {shifts?.map((s: any) => (
                  <TableRow key={s.id}>
                    <TableCell className="font-semibold text-slate-900">{s.name}</TableCell>
                    <TableCell>
                      {s.startTime} - {s.endTime}
                    </TableCell>
                    <TableCell>
                      {s.isNightShift ? (
                        <Badge variant="outline" className="bg-indigo-50 text-indigo-700 border-indigo-200 text-[11px]">
                          🌙 Night Shift
                        </Badge>
                      ) : (
                        <Badge variant="outline" className="bg-amber-50 text-amber-700 border-amber-200 text-[11px]">
                          ☀️ Day Shift
                        </Badge>
                      )}
                    </TableCell>
                    <TableCell>
                      {s.allowMultiPunch ? (
                        <span className="text-emerald-600 font-medium">Allowed</span>
                      ) : (
                        <span className="text-slate-400">Disabled</span>
                      )}
                    </TableCell>
                    <TableCell className="text-right space-x-1">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => {
                          setEditingShift(s);
                          setShiftForm({
                            name: s.name,
                            startTime: s.startTime,
                            endTime: s.endTime,
                            isNightShift: s.isNightShift,
                            allowMultiPunch: s.allowMultiPunch || false,
                          });
                          setIsShiftModalOpen(true);
                        }}
                      >
                        <Pencil className="w-3.5 h-3.5 text-slate-600" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="hover:text-rose-600"
                        onClick={() => deleteShiftMutation.mutate(s.id)}
                      >
                        <Trash2 className="w-3.5 h-3.5 text-rose-500" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}

      {/* ============================================================ */}
      {/* MODAL 1: CREATE / EDIT SHIFT TEMPLATE */}
      {/* ============================================================ */}
      <Dialog open={isShiftModalOpen} onOpenChange={setIsShiftModalOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editingShift ? "Edit Shift Template" : "New Shift Template"}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 pt-2 text-xs">
            <div>
              <label className="font-semibold text-slate-700 block mb-1">Shift Name</label>
              <Input
                placeholder="e.g. Night Emergency Shift"
                value={shiftForm.name}
                onChange={(e) => setShiftForm({ ...shiftForm, name: e.target.value })}
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="font-semibold text-slate-700 block mb-1">Start Time</label>
                <Input
                  type="time"
                  value={shiftForm.startTime}
                  onChange={(e) => setShiftForm({ ...shiftForm, startTime: e.target.value })}
                />
              </div>
              <div>
                <label className="font-semibold text-slate-700 block mb-1">End Time</label>
                <Input
                  type="time"
                  value={shiftForm.endTime}
                  onChange={(e) => setShiftForm({ ...shiftForm, endTime: e.target.value })}
                />
              </div>
            </div>
            <div className="flex items-center space-x-2 pt-2">
              <input
                type="checkbox"
                id="isNightShift"
                checked={shiftForm.isNightShift}
                onChange={(e) => setShiftForm({ ...shiftForm, isNightShift: e.target.checked })}
                className="w-4 h-4 text-emerald-600 rounded"
              />
              <label htmlFor="isNightShift" className="font-medium text-slate-700 cursor-pointer">
                Cross-midnight / Night Shift (Eligible for Night Shift Allowance)
              </label>
            </div>
            <div className="flex items-center space-x-2">
              <input
                type="checkbox"
                id="allowMultiPunch"
                checked={shiftForm.allowMultiPunch}
                onChange={(e) => setShiftForm({ ...shiftForm, allowMultiPunch: e.target.checked })}
                className="w-4 h-4 text-emerald-600 rounded"
              />
              <label htmlFor="allowMultiPunch" className="font-medium text-slate-700 cursor-pointer">
                Allow Split Sessions / Multi-Punch Verification
              </label>
            </div>
            <Button
              onClick={() => saveShiftMutation.mutate(shiftForm)}
              disabled={saveShiftMutation.isPending || !shiftForm.name}
              className="w-full bg-slate-900 hover:bg-slate-800 text-white mt-2"
            >
              {saveShiftMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
              {editingShift ? "Update Shift Template" : "Save Shift Template"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* ============================================================ */}
      {/* MODAL 2: STATUTORY COMPLIANCE CONFLICT OVERRIDE DIALOG */}
      {/* ============================================================ */}
      <Dialog open={isConflictModalOpen} onOpenChange={setIsConflictModalOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-rose-600 text-base">
              <AlertTriangle className="w-5 h-5" /> Statutory Compliance Conflicts Detected
            </DialogTitle>
            <DialogDescription className="text-xs text-slate-500">
              The automated compliance engine detected rest-period or consecutive-day labor law violations.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-2.5 max-h-60 overflow-y-auto py-2">
            {complianceConflicts.map((c, idx) => (
              <div key={idx} className="p-2.5 rounded-md bg-rose-50 border border-rose-200 text-xs">
                <div className="font-semibold text-rose-800 flex items-center justify-between">
                  <span>{c.type === "REST_PERIOD_VIOLATION" ? "Rest Period Violation (<11h)" : "Max 6 Days Violation"}</span>
                  <span className="text-[10px] text-rose-500">{c.date}</span>
                </div>
                <div className="text-rose-700 mt-1">{c.message}</div>
              </div>
            ))}
          </div>

          <div className="pt-2">
            <label className="text-xs font-semibold text-slate-700 block mb-1">
              Manager Justification Reason (Required for Audit Trail)
            </label>
            <Input
              placeholder="e.g. Critical hospital emergency / production line coverage"
              onChange={(e) => {
                if (pendingAction === "BULK") {
                  setBulkForm({ ...bulkForm, overrideReason: e.target.value });
                } else {
                  setRotationForm({ ...rotationForm, overrideReason: e.target.value });
                }
              }}
              className="text-xs"
            />
          </div>

          <DialogFooter className="gap-2 sm:gap-0 pt-2">
            <Button variant="outline" size="sm" onClick={() => setIsConflictModalOpen(false)}>
              Cancel
            </Button>
            <Button
              size="sm"
              onClick={handleConfirmOverride}
              className="bg-rose-600 hover:bg-rose-700 text-white"
            >
              Acknowledge & Force Override
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
