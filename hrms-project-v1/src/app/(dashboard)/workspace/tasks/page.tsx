"use client";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import axios from "axios";
import { CheckSquare, Plus, Loader2, Calendar, ClipboardList, Clock, CheckCircle2, User, Play, ListTodo } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { useViewMode } from "@/context/ViewModeContext";

export default function TasksPage() {
  const queryClient = useQueryClient();
  const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000";
  
  const [taskForm, setTaskForm] = useState({ employeeId: "", title: "", description: "", dueDate: "" });
  const [isAssignOpen, setIsAssignOpen] = useState(false);

  // Consume profile and active role from global ViewModeContext
  const { user, activeRole, isLoading: loadingProfile } = useViewMode();

  const isAdmin = activeRole !== "EMPLOYEE";

  // 2. Fetch Employee's Own Tasks
  const { data: myTasks, isLoading: loadingMyTasks } = useQuery({
    queryKey: ["myTasks"],
    queryFn: async () => {
      const token = localStorage.getItem("hrms_token");
      const res = await axios.get(`${API_URL}/tasks/me`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      return res.data;
    }
  });

  // 3. Fetch Company Tasks (Admins only)
  const { data: companyTasks, isLoading: loadingCompanyTasks } = useQuery({
    queryKey: ["companyTasks"],
    queryFn: async () => {
      const token = localStorage.getItem("hrms_token");
      const res = await axios.get(`${API_URL}/tasks`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      return res.data;
    },
    enabled: isAdmin
  });

  // 4. Fetch Employees (for Assign Task selector, Admins only)
  const { data: employees } = useQuery({
    queryKey: ["employeesListTasks"],
    queryFn: async () => {
      const token = localStorage.getItem("hrms_token");
      const res = await axios.get(`${API_URL}/employees`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      return res.data;
    },
    enabled: isAdmin
  });

  // 5. Mutation: Create Task (Admin/HR)
  const createTaskMutation = useMutation({
    mutationFn: async (payload: typeof taskForm) => {
      const token = localStorage.getItem("hrms_token");
      await axios.post(`${API_URL}/tasks`, payload, {
        headers: { Authorization: `Bearer ${token}` }
      });
    },
    onSuccess: () => {
      setIsAssignOpen(false);
      setTaskForm({ employeeId: "", title: "", description: "", dueDate: "" });
      queryClient.invalidateQueries({ queryKey: ["companyTasks"] });
      queryClient.invalidateQueries({ queryKey: ["myTasks"] });
    },
    onError: (err: any) => {
      alert(err.response?.data?.message || "Failed to create task");
    }
  });

  // 6. Mutation: Update Task Status (Employee)
  const updateStatusMutation = useMutation({
    mutationFn: async ({ id, status }: { id: string; status: string }) => {
      const token = localStorage.getItem("hrms_token");
      await axios.patch(`${API_URL}/tasks/${id}/status`, { status }, {
        headers: { Authorization: `Bearer ${token}` }
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["myTasks"] });
      queryClient.invalidateQueries({ queryKey: ["companyTasks"] });
    }
  });

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "COMPLETED":
        return <Badge className="bg-emerald-500 hover:bg-emerald-600">Completed</Badge>;
      case "IN_PROGRESS":
        return <Badge className="bg-blue-500 hover:bg-blue-600">In Progress</Badge>;
      default:
        return <Badge className="bg-slate-400 hover:bg-slate-500">Pending</Badge>;
    }
  };

  if (loadingProfile || loadingMyTasks || (isAdmin && loadingCompanyTasks)) {
    return (
      <div className="flex h-96 items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-emerald-500" />
      </div>
    );
  }

  return (
    <div className="p-8 max-w-6xl mx-auto space-y-8 font-sans">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-slate-900 flex items-center">
            <CheckSquare className="w-8 h-8 mr-3 text-indigo-600" /> Tasks Dashboard
          </h1>
          <p className="text-slate-500 mt-1">Manage, assign, and track workspace operations.</p>
        </div>

        {isAdmin && (
          <Dialog open={isAssignOpen} onOpenChange={setIsAssignOpen}>
            <DialogTrigger className="inline-flex items-center justify-center rounded-xl text-sm font-semibold transition-colors bg-indigo-600 hover:bg-indigo-700 text-white h-10 px-4 py-2 shadow-sm">
              <Plus className="w-4 h-4 mr-2" /> Assign Task
            </DialogTrigger>
            <DialogContent className="bg-white rounded-2xl">
              <DialogHeader>
                <DialogTitle>Assign Task to Employee</DialogTitle>
              </DialogHeader>
              <div className="space-y-4 pt-4">
                <div>
                  <label className="text-xs font-bold text-slate-600 uppercase">Select Employee</label>
                  <select
                    className="w-full border rounded-lg p-2.5 text-sm bg-white mt-1"
                    value={taskForm.employeeId}
                    onChange={(e) => setTaskForm({ ...taskForm, employeeId: e.target.value })}
                  >
                    <option value="">-- Choose Employee --</option>
                    {employees?.map((emp: any) => (
                      <option key={emp.id} value={emp.id}>
                        {emp.firstName} {emp.lastName}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="text-xs font-bold text-slate-600 uppercase">Task Title</label>
                  <Input
                    placeholder="e.g. Upload compliance certificate"
                    value={taskForm.title}
                    onChange={(e) => setTaskForm({ ...taskForm, title: e.target.value })}
                    className="mt-1"
                  />
                </div>
                <div>
                  <label className="text-xs font-bold text-slate-600 uppercase">Description</label>
                  <Textarea
                    placeholder="Provide details about the task..."
                    value={taskForm.description}
                    onChange={(e) => setTaskForm({ ...taskForm, description: e.target.value })}
                    className="mt-1 resize-none"
                  />
                </div>
                <div>
                  <label className="text-xs font-bold text-slate-600 uppercase">Due Date</label>
                  <Input
                    type="date"
                    value={taskForm.dueDate}
                    onChange={(e) => setTaskForm({ ...taskForm, dueDate: e.target.value })}
                    className="mt-1"
                  />
                </div>
                <Button
                  onClick={() => createTaskMutation.mutate(taskForm)}
                  disabled={createTaskMutation.isPending || !taskForm.employeeId || !taskForm.title}
                  className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-semibold rounded-lg mt-2"
                >
                  {createTaskMutation.isPending ? "Assigning..." : "Assign Task"}
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left/Middle Columns: Employee Checklist */}
        <div className={`${isAdmin ? "lg:col-span-2" : "lg:col-span-3"} space-y-4`}>
          <h2 className="text-lg font-bold text-slate-800 flex items-center">
            <ClipboardList className="w-5 h-5 mr-2 text-indigo-500" /> My Tasks
          </h2>

          <div className="space-y-4">
            {myTasks && myTasks.length > 0 ? (
              myTasks.map((task: any) => (
                <Card key={task.id} className="border-slate-200 shadow-sm">
                  <CardHeader className="pb-2 flex flex-row items-center justify-between space-y-0">
                    <div>
                      <CardTitle className="text-base font-bold text-slate-900">{task.title}</CardTitle>
                      {task.dueDate && (
                        <CardDescription className="flex items-center text-xs mt-1">
                          <Calendar className="w-3.5 h-3.5 mr-1 text-slate-400" /> Due:{" "}
                          {new Date(task.dueDate).toLocaleDateString()}
                        </CardDescription>
                      )}
                    </div>
                    <div>{getStatusBadge(task.status)}</div>
                  </CardHeader>
                  <CardContent className="pt-2 space-y-4">
                    {task.description && <p className="text-xs text-slate-600 leading-relaxed">{task.description}</p>}

                    <div className="flex space-x-2 pt-2 border-t">
                      {task.status !== "IN_PROGRESS" && task.status !== "COMPLETED" && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => updateStatusMutation.mutate({ id: task.id, status: "IN_PROGRESS" })}
                          className="text-xs text-blue-600 border-blue-200 hover:bg-blue-50/50"
                        >
                          <Play className="w-3.5 h-3.5 mr-1" /> Start Work
                        </Button>
                      )}
                      {task.status !== "COMPLETED" && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => updateStatusMutation.mutate({ id: task.id, status: "COMPLETED" })}
                          className="text-xs text-emerald-600 border-emerald-200 hover:bg-emerald-50/50"
                        >
                          <CheckCircle2 className="w-3.5 h-3.5 mr-1" /> Mark Complete
                        </Button>
                      )}
                    </div>
                  </CardContent>
                </Card>
              ))
            ) : (
              <div className="text-center py-12 border border-dashed border-slate-200 rounded-2xl bg-white text-slate-500">
                <ListTodo className="w-8 h-8 mx-auto text-slate-300 mb-2" />
                <p className="text-sm">You have no tasks assigned to you.</p>
              </div>
            )}
          </div>
        </div>

        {/* Right Column: Company Board (Admin only) */}
        {isAdmin && (
          <div className="lg:col-span-1 space-y-4">
            <h2 className="text-lg font-bold text-slate-800 flex items-center">
              <ClipboardList className="w-5 h-5 mr-2 text-emerald-500" /> Company Task Roster
            </h2>

            <div className="space-y-3">
              {companyTasks && companyTasks.length > 0 ? (
                companyTasks.map((task: any) => (
                  <Card key={task.id} className="border-slate-200 shadow-sm p-4 space-y-3">
                    <div className="flex justify-between items-start">
                      <h4 className="font-bold text-sm text-slate-900">{task.title}</h4>
                      {getStatusBadge(task.status)}
                    </div>

                    <div className="flex items-center text-xs text-slate-500">
                      <User className="w-3.5 h-3.5 mr-1 text-slate-400" />
                      <span>
                        Assignee: <strong>{task.employee?.firstName} {task.employee?.lastName}</strong>
                      </span>
                    </div>

                    {task.dueDate && (
                      <div className="flex items-center text-xs text-slate-500">
                        <Clock className="w-3.5 h-3.5 mr-1 text-slate-400" />
                        <span>Due: {new Date(task.dueDate).toLocaleDateString()}</span>
                      </div>
                    )}
                  </Card>
                ))
              ) : (
                <p className="text-center text-xs text-slate-400 py-8">No tasks assigned across the company.</p>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
