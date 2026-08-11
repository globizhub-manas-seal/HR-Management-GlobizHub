"use client";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import axios from "axios";
import { Calculator, CheckCircle, AlertCircle, DollarSign, Settings2, PlayCircle } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";

export default function PayrollDashboard() {
  const queryClient = useQueryClient();
  const [month, setMonth] = useState(new Date().getMonth() + 1);
  const [year, setYear] = useState(new Date().getFullYear());
  
  // State for the Salary Structure Modal
  const [selectedEmpId, setSelectedEmpId] = useState("");
  const [structForm, setStructForm] = useState({ basicSalary: 0, hra: 0, otherAllowances: 0, pfContribution: 0, taxDeduction: 0 });
  const [isModalOpen, setIsModalOpen] = useState(false);

  // 1. Fetch all employees (Assume your /employees endpoint returns their salaryStructure)
  const { data: employees, isLoading } = useQuery({
    queryKey: ["employeesPayrollData"],
    queryFn: async () => {
      const token = localStorage.getItem("hrms_token");
      const res = await axios.get(`${process.env.NEXT_PUBLIC_API_URL}/employees`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      return res.data;
    }
  });

  // 2. Mutation: Process Payroll
  const processMutation = useMutation({
    mutationFn: async (empId: string) => {
      const token = localStorage.getItem("hrms_token");
      await axios.post(`${process.env.NEXT_PUBLIC_API_URL}/payroll/process/${empId}`, 
        { month, year },
        { headers: { Authorization: `Bearer ${token}` }}
      );
    },
    onSuccess: () => {
      alert("Payroll processed successfully!");
      queryClient.invalidateQueries({ queryKey: ["employeesPayrollData"] });
    },
    onError: (err: any) => {
      alert(err.response?.data?.message || "Failed to process payroll.");
    }
  });

  // 3. Mutation: Update Salary Structure
  const structureMutation = useMutation({
    mutationFn: async () => {
      const token = localStorage.getItem("hrms_token");
      // Convert string inputs to numbers
      const payload = {
        basicSalary: Number(structForm.basicSalary),
        hra: Number(structForm.hra),
        otherAllowances: Number(structForm.otherAllowances),
        pfContribution: Number(structForm.pfContribution),
        taxDeduction: Number(structForm.taxDeduction),
      };
      await axios.post(`${process.env.NEXT_PUBLIC_API_URL}/payroll/structure/${selectedEmpId}`, payload, {
        headers: { Authorization: `Bearer ${token}` }
      });
    },
    onSuccess: () => {
      setIsModalOpen(false);
      queryClient.invalidateQueries({ queryKey: ["employeesPayrollData"] });
    }
  });

  const openStructureModal = (emp: any) => {
    setSelectedEmpId(emp.id);
    setStructForm({
      basicSalary: emp.salaryStructure?.basicSalary || 0,
      hra: emp.salaryStructure?.hra || 0,
      otherAllowances: emp.salaryStructure?.otherAllowances || 0,
      pfContribution: emp.salaryStructure?.pfContribution || 0,
      taxDeduction: emp.salaryStructure?.taxDeduction || 0,
    });
    setIsModalOpen(true);
  };

  if (isLoading) return <div className="p-8 text-slate-500">Loading payroll engine...</div>;

  return (
    <div className="p-4 md:p-8 max-w-6xl mx-auto space-y-6">
      <div className="flex items-center space-x-3 mb-6">
        <div className="p-3 bg-emerald-600 rounded-lg text-white">
          <Calculator className="w-6 h-6" />
        </div>
        <div>
          <h1 className="text-3xl font-bold text-slate-900">Payroll Engine</h1>
          <p className="text-slate-500 mt-1">Manage salary structures and process monthly payouts.</p>
        </div>
      </div>

      <Tabs defaultValue="run" className="w-full">
        <TabsList className="w-full max-w-md grid grid-cols-2 bg-slate-100">
          <TabsTrigger value="run"><PlayCircle className="w-4 h-4 mr-2" /> Run Payroll</TabsTrigger>
          <TabsTrigger value="structures"><Settings2 className="w-4 h-4 mr-2" /> Salary Structures</TabsTrigger>
        </TabsList>

        {/* TAB 1: RUN PAYROLL */}
        <TabsContent value="run" className="mt-6 space-y-4">
          <Card className="border-emerald-100 bg-emerald-50/30">
            <CardContent className="pt-6 flex flex-col md:flex-row gap-4 items-end">
              <div className="space-y-2 flex-1">
                <label className="text-sm font-semibold text-slate-700">Select Month</label>
                <select className="w-full p-2 border rounded-md" value={month} onChange={(e) => setMonth(Number(e.target.value))}>
                  {Array.from({ length: 12 }, (_, i) => (<option key={i+1} value={i+1}>{new Date(0, i).toLocaleString('default', { month: 'long' })}</option>))}
                </select>
              </div>
              <div className="space-y-2 flex-1">
                <label className="text-sm font-semibold text-slate-700">Select Year</label>
                <Input type="number" value={year} onChange={(e) => setYear(Number(e.target.value))} />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Employee Roster</CardTitle>
              <CardDescription>Click process to calculate attendance, deductions, and generate payslips for {month}/{year}.</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {employees?.map((emp: any) => (
                  <div key={emp.id} className="flex items-center justify-between p-4 border rounded-lg hover:bg-slate-50 transition-colors">
                    <div>
                      <p className="font-semibold text-slate-900">{emp.firstName} {emp.lastName}</p>
                      <p className="text-sm text-slate-500">{emp.email}</p>
                    </div>
                    <div>
                      {!emp.salaryStructure ? (
                        <div className="flex items-center text-amber-600 text-sm font-medium">
                          <AlertCircle className="w-4 h-4 mr-1" /> Needs Setup
                        </div>
                      ) : (
                        <Button 
                          onClick={() => processMutation.mutate(emp.id)}
                          disabled={processMutation.isPending}
                          className="bg-slate-900 hover:bg-slate-800 text-white"
                        >
                          <PlayCircle className="w-4 h-4 mr-2" /> Process Pay
                        </Button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* TAB 2: SALARY STRUCTURES */}
        <TabsContent value="structures" className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle>Financial Templates</CardTitle>
              <CardDescription>Set the base pay and static allowances/deductions for each employee.</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {employees?.map((emp: any) => (
                  <div key={emp.id} className="flex flex-col md:flex-row items-center justify-between p-4 border rounded-lg bg-white shadow-sm">
                    <div className="flex-1 mb-2 md:mb-0">
                      <p className="font-semibold text-slate-900">{emp.firstName} {emp.lastName}</p>
                      <p className="text-sm text-slate-500">{emp.department?.name || 'No Department'}</p>
                    </div>
                    
                    <div className="flex-1 flex space-x-8 text-sm">
                      <div>
                        <p className="text-slate-500">Basic Pay</p>
                        <p className="font-medium">${emp.salaryStructure?.basicSalary || 0}</p>
                      </div>
                      <div>
                        <p className="text-slate-500">Total Deductions</p>
                        <p className="font-medium text-rose-600">
                          ${(emp.salaryStructure?.pfContribution || 0) + (emp.salaryStructure?.taxDeduction || 0)}
                        </p>
                      </div>
                    </div>

                    <Button variant="outline" onClick={() => openStructureModal(emp)}>
                      <Settings2 className="w-4 h-4 mr-2" /> Edit Config
                    </Button>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* SETUP SALARY MODAL */}
      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Configure Salary Structure</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 pt-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">Basic Salary</label>
                <Input type="number" value={structForm.basicSalary} onChange={(e) => setStructForm({...structForm, basicSalary: e.target.value as any})} />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">HRA</label>
                <Input type="number" value={structForm.hra} onChange={(e) => setStructForm({...structForm, hra: e.target.value as any})} />
              </div>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Other Fixed Allowances</label>
              <Input type="number" value={structForm.otherAllowances} onChange={(e) => setStructForm({...structForm, otherAllowances: e.target.value as any})} />
            </div>
            <hr />
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-sm font-medium text-rose-600">PF Contribution</label>
                <Input type="number" value={structForm.pfContribution} onChange={(e) => setStructForm({...structForm, pfContribution: e.target.value as any})} />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium text-rose-600">Standard Tax Deduction</label>
                <Input type="number" value={structForm.taxDeduction} onChange={(e) => setStructForm({...structForm, taxDeduction: e.target.value as any})} />
              </div>
            </div>
            <Button className="w-full mt-4 bg-emerald-600 hover:bg-emerald-700" onClick={() => structureMutation.mutate()} disabled={structureMutation.isPending}>
              {structureMutation.isPending ? "Saving..." : "Save Structure"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}