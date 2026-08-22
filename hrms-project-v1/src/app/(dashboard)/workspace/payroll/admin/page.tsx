"use client";

import { useEffect, useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import axios from "axios";
import {
  Calculator,
  Calendar as CalendarIcon,
  CheckCircle2,
  Clock,
  Download,
  FileText,
  Loader2,
  Plus,
  Search,
  TrendingDown,
  TrendingUp,
  Users,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogTrigger,
  DialogDescription,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";

export default function HRPayrollDashboard() {
  const queryClient = useQueryClient();

  // State for Month/Year filtering
  const currentDate = new Date();
  const [selectedMonth, setSelectedMonth] = useState(
    (currentDate.getMonth() + 1).toString(),
  );
  const [selectedYear, setSelectedYear] = useState(
    currentDate.getFullYear().toString(),
  );

  // State for the Payslip View Modal
  const [selectedPayslip, setSelectedPayslip] = useState<any>(null);

  // State for Generation Modal
  const [isGenerateModalOpen, setIsGenerateModalOpen] = useState(false);
  const [empToGenerate, setEmpToGenerate] = useState("");

  // --- NEW: Template Engine State ---
  const [annualCtc, setAnnualCtc] = useState<number | "">("");
  const [selectedTemplateId, setSelectedTemplateId] = useState("");

  const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000";
  const getToken = () => localStorage.getItem("hrms_token");

  // --- ADD THESE STATE VARIABLES ---
  const [isSalaryModalOpen, setIsSalaryModalOpen] = useState(false);
  const [empForSalary, setEmpForSalary] = useState("");
  const [salaryForm, setSalaryForm] = useState({
    basicSalary: 0,
    hra: 0,
    conveyanceAllowance: 0,
    medicalAllowance: 0,
    specialAllowance: 0,
    pfContribution: 0,
    taxDeduction: 0,
    professionalTax: 0,
  });

  // Fetch Templates
  const { data: templates } = useQuery({
    queryKey: ["salaryTemplates"],
    queryFn: async () => {
      const res = await axios.get(`${API_URL}/payroll/templates`, {
        headers: { Authorization: `Bearer ${getToken()}` },
      });
      return res.data;
    },
  });

  // --- ADD THIS MUTATION ---
  const salaryMutation = useMutation({
    mutationFn: async () => {
      await axios.post(
        `${API_URL}/payroll/salary-structure`,
        { employeeId: empForSalary, ...salaryForm },
        { headers: { Authorization: `Bearer ${getToken()}` } },
      );
    },
    onSuccess: () => {
      setIsSalaryModalOpen(false);
      alert("Salary structure assigned! You can now run their payroll.");
      // Reset form
      setEmpForSalary("");
      setAnnualCtc("");
      setSelectedTemplateId("");
    },
  });

  // 1. Fetch Payroll Records for the selected month
  const { data: payrolls, isLoading: loadingPayrolls } = useQuery({
    queryKey: ["companyPayroll", selectedMonth, selectedYear],
    queryFn: async () => {
      const res = await axios.get(`${API_URL}/payroll/company`, {
        params: { month: selectedMonth, year: selectedYear },
        headers: { Authorization: `Bearer ${getToken()}` },
      });
      return res.data;
    },
  });

  // 2. Fetch Employees (for the dropdown in the Generate Modal)
  const { data: employees } = useQuery({
    queryKey: ["companyEmployees"],
    queryFn: async () => {
      const res = await axios.get(`${API_URL}/employees`, {
        headers: { Authorization: `Bearer ${getToken()}` },
      });
      return res.data;
    },
  });

  // 3. Generate Payroll Mutation
  const generateMutation = useMutation({
    mutationFn: async () => {
      await axios.post(
        `${API_URL}/payroll/generate`,
        {
          employeeId: empToGenerate,
          month: parseInt(selectedMonth),
          year: parseInt(selectedYear),
        },
        { headers: { Authorization: `Bearer ${getToken()}` } },
      );
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["companyPayroll", selectedMonth, selectedYear],
      });
      setIsGenerateModalOpen(false);
      setEmpToGenerate("");
      alert("Payroll generated successfully!");
    },
    onError: (error: any) => {
      alert(error.response?.data?.message || "Failed to generate payroll");
    },
  });

  // UI Helpers
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR",
    }).format(amount);
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "APPROVED":
      case "PAID":
        return (
          <Badge className="bg-emerald-50 text-emerald-700 border-emerald-200">
            <CheckCircle2 className="w-3 h-3 mr-1" /> {status}
          </Badge>
        );
      case "DRAFT":
        return (
          <Badge className="bg-amber-50 text-amber-700 border-amber-200">
            <Clock className="w-3 h-3 mr-1" /> Draft
          </Badge>
        );
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  // Status Update Mutation (DRAFT -> APPROVED)
  const statusMutation = useMutation({
    mutationFn: async ({ id, status }: { id: string; status: string }) => {
      await axios.patch(
        `${API_URL}/payroll/${id}/status`,
        { status },
        { headers: { Authorization: `Bearer ${getToken()}` } },
      );
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["companyPayroll", selectedMonth, selectedYear],
      });
    },
    onError: (error: any) => {
      alert(error.response?.data?.message || "Failed to update status");
    },
  });

  // Calculate Summary Stats
  const totalPayout =
    payrolls?.reduce((sum: number, record: any) => sum + record.netSalary, 0) ||
    0;
  const totalDeductions =
    payrolls?.reduce(
      (sum: number, record: any) => sum + record.deductions,
      0,
    ) || 0;

  useEffect(() => {
    if (selectedTemplateId === "custom") {
      // Manual input mode for contractual / custom fixed salary
      return;
    }

    if (
      selectedTemplateId &&
      selectedTemplateId !== "none" &&
      annualCtc &&
      Number(annualCtc) > 0
    ) {
      const template = templates?.find((t: any) => t.id === selectedTemplateId);
      if (template) {
        const monthlyCtc = Number(annualCtc) / 12;

        // Calculate standard percentages
        const basic = monthlyCtc * (template.basicPercentOfCtc / 100);
        const hra = monthlyCtc * (template.hraPercentOfCtc / 100);
        const pf = basic * (template.pfPercentOfBasic / 100);

        // Fixed/Percentage Monthly Allowances
        const conveyance = template.isConveyancePercent
          ? monthlyCtc * (template.conveyanceFixed / 100)
          : template.conveyanceFixed;
        
        const medical = template.isMedicalPercent
          ? monthlyCtc * (template.medicalFixed / 100)
          : template.medicalFixed;
        
        const profTax = template.isProfTaxPercent
          ? monthlyCtc * (template.profTaxFixed / 100)
          : template.profTaxFixed;

        // Special Allowance is the "Balance" (Monthly CTC minus all other fixed components & PF)
        const fixedComponents =
          basic + hra + conveyance + medical + pf;
        const special = monthlyCtc - fixedComponents;

        // Auto-fill the form with calculations
        setSalaryForm({
          basicSalary: Math.round(basic),
          hra: Math.round(hra),
          conveyanceAllowance: Math.round(conveyance),
          medicalAllowance: Math.round(medical),
          specialAllowance: Math.round(special > 0 ? special : 0), // Prevents negative allowance
          pfContribution: Math.round(pf),
          taxDeduction: 0, // Defaults to 0 since it's typically a manual variable
          professionalTax: Math.round(profTax),
        });
      }
    }
  }, [annualCtc, selectedTemplateId, templates]);

  // Mapping lists for Base UI Select value lookup
  const employeeSelectItems = employees?.map((emp: any) => ({
    value: emp.id,
    label: `${emp.firstName} ${emp.lastName}`
  })) || [];

  const generateEmployeeSelectItems = employees?.map((emp: any) => ({
    value: emp.id,
    label: `${emp.firstName} ${emp.lastName} (${emp.employeeCode || ""})`
  })) || [];

  const templateSelectItems = [
    { value: "custom", label: "Custom / Fixed Salary (Contractual)" },
    ...(templates?.map((t: any) => ({
      value: t.id,
      label: t.name
    })) || [])
  ];

  return (
    <div className="p-8 max-w-7xl mx-auto space-y-8 font-sans min-h-screen bg-slate-50/50">
      {/* HEADER & CONTROLS */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-4">
        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold text-slate-900">Payroll</h1>
          <p className="mt-1 text-slate-500">Review, approve, and print employee payslips.</p>
        </div>

        <div className="flex items-center gap-3 bg-white p-2 rounded-xl border border-slate-200 shadow-sm">
          <CalendarIcon className="w-5 h-5 text-slate-400 ml-2" />
          <Select
            value={selectedMonth}
            onValueChange={(val) => setSelectedMonth(val || "")}
          >
            <SelectTrigger className="w-[140px] border-none shadow-none focus:ring-0">
              <SelectValue placeholder="Month" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="1">January</SelectItem>
              <SelectItem value="2">February</SelectItem>
              <SelectItem value="3">March</SelectItem>
              <SelectItem value="4">April</SelectItem>
              <SelectItem value="5">May</SelectItem>
              <SelectItem value="6">June</SelectItem>
              <SelectItem value="7">July</SelectItem>
              <SelectItem value="8">August</SelectItem>
              <SelectItem value="9">September</SelectItem>
              <SelectItem value="10">October</SelectItem>
              <SelectItem value="11">November</SelectItem>
              <SelectItem value="12">December</SelectItem>
            </SelectContent>
          </Select>

          <div className="w-px h-6 bg-slate-200"></div>

          <Select
            value={selectedYear}
            onValueChange={(val) => setSelectedYear(val || "")}
          >
            <SelectTrigger className="w-[100px] border-none shadow-none focus:ring-0">
              <SelectValue placeholder="Year" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="2024">2024</SelectItem>
              <SelectItem value="2025">2025</SelectItem>
              <SelectItem value="2026">2026</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* STATS CARDS */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm flex items-center space-x-4">
          <div className="w-12 h-12 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center">
            <TrendingUp className="w-6 h-6" />
          </div>
          <div>
            <p className="text-sm font-medium text-slate-500 uppercase tracking-wider">
              Total Net Payout
            </p>
            <h3 className="text-2xl font-bold text-slate-900 mt-1">
              {formatCurrency(totalPayout)}
            </h3>
          </div>
        </div>

        <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm flex items-center space-x-4">
          <div className="w-12 h-12 rounded-xl bg-rose-50 text-rose-600 flex items-center justify-center">
            <TrendingDown className="w-6 h-6" />
          </div>
          <div>
            <p className="text-sm font-medium text-slate-500 uppercase tracking-wider">
              Total Deductions
            </p>
            <h3 className="text-2xl font-bold text-slate-900 mt-1">
              {formatCurrency(totalDeductions)}
            </h3>
          </div>
        </div>

        <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm flex items-center space-x-4">
          <div className="w-12 h-12 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
            <Users className="w-6 h-6" />
          </div>
          <div>
            <p className="text-sm font-medium text-slate-500 uppercase tracking-wider">
              Processed Employees
            </p>
            <h3 className="text-2xl font-bold text-slate-900 mt-1">
              {payrolls?.length || 0}
            </h3>
          </div>
        </div>
      </div>

      {/* TABLE AND ACTIONS */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        {/* Table Toolbar */}
        <div className="p-4 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
          <div className="relative w-64">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <Input
              placeholder="Search employee..."
              className="pl-9 h-9 bg-white border-slate-200"
            />
          </div>

          <div className="flex gap-3">
            <Button
              variant="outline"
              className="h-9 text-slate-600 border-slate-200"
            >
              <Download className="w-4 h-4 mr-2" /> Export CSV
            </Button>

            {/* NEW SET SALARY BUTTON (MODIFIED & RESPONSIVE) */}
            <Dialog
              open={isSalaryModalOpen}
              onOpenChange={setIsSalaryModalOpen}
            >
              <DialogTrigger className="inline-flex h-9 items-center justify-center rounded-lg border border-indigo-200 bg-white px-2.5 text-sm font-medium text-indigo-600 transition-colors hover:bg-indigo-50">
                <Calculator className="mr-2 h-4 w-4" /> Assign Salary
              </DialogTrigger>
              <DialogContent className="sm:max-w-md">
                <DialogHeader>
                  <DialogTitle>Set Employee Salary Structure</DialogTitle>
                </DialogHeader>
                <div className="space-y-4 py-4">
                  {/* Employee Selection */}
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-slate-700">
                      Select Employee
                    </label>
                    <Select
                      value={empForSalary}
                      onValueChange={(val) => setEmpForSalary(val || "")}
                      items={employeeSelectItems}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select an employee..." />
                      </SelectTrigger>
                      <SelectContent>
                        {employees?.map((emp: any) => (
                          <SelectItem key={emp.id} value={emp.id}>
                            {emp.firstName} {emp.lastName}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Template & CTC Selection (Responsive Grid) */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <label className="text-sm font-medium text-slate-700">
                        Salary Template
                      </label>
                      <Select
                        value={selectedTemplateId}
                        onValueChange={(val) => {
                          setSelectedTemplateId(val || "");
                          if (val === "custom") {
                            setAnnualCtc("");
                            setSalaryForm({
                              basicSalary: 0,
                              hra: 0,
                              conveyanceAllowance: 0,
                              medicalAllowance: 0,
                              specialAllowance: 0,
                              pfContribution: 0,
                              taxDeduction: 0,
                              professionalTax: 0,
                            });
                          }
                        }}
                        items={templateSelectItems}
                      >
                        <SelectTrigger className="bg-white">
                          <SelectValue placeholder="Select Template..." />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="none" disabled>
                            Select Template
                          </SelectItem>
                          <SelectItem value="custom" className="text-indigo-600 font-semibold">
                            Custom / Fixed Salary (Contractual)
                          </SelectItem>
                          {templates?.map((t: any) => (
                            <SelectItem key={t.id} value={t.id}>
                              {t.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    {selectedTemplateId !== "custom" && (
                      <div className="space-y-2">
                        <label className="text-sm font-medium text-slate-700">
                          Annual CTC (₹)
                        </label>
                        <Input
                          type="number"
                          placeholder="e.g., 600000"
                          className="bg-white font-bold"
                          value={annualCtc}
                          onChange={(e) =>
                            setAnnualCtc(
                              e.target.value === "" ? "" : Number(e.target.value),
                            )
                          }
                          disabled={
                            !selectedTemplateId || selectedTemplateId === "none"
                          }
                        />
                      </div>
                    )}
                  </div>

                  {/* Calculated/Editable Salary Components */}
                  {selectedTemplateId && selectedTemplateId !== "none" && (
                    <div className="pt-4 border-t border-slate-100 space-y-3">
                      <div className="flex justify-between items-center">
                        <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wider">Salary Components (Monthly)</h4>
                        {selectedTemplateId !== "custom" && (
                          <span className="text-[10px] bg-indigo-50 text-indigo-700 font-semibold px-2 py-0.5 rounded-full">
                            Calculated from CTC
                          </span>
                        )}
                        {selectedTemplateId === "custom" && (
                          <span className="text-[10px] bg-amber-50 text-amber-700 font-semibold px-2 py-0.5 rounded-full animate-pulse">
                            Manual Editing Mode
                          </span>
                        )}
                      </div>
                      <div className="grid grid-cols-2 gap-3">
                        <div className="space-y-1">
                          <label className="text-[11px] font-medium text-slate-500">Basic Pay (₹)</label>
                          <Input
                            type="number"
                            value={salaryForm.basicSalary}
                            onChange={(e) => setSalaryForm({ ...salaryForm, basicSalary: Number(e.target.value) })}
                            className="h-8 text-xs font-semibold"
                          />
                        </div>
                        <div className="space-y-1">
                          <label className="text-[11px] font-medium text-slate-500">HRA (₹)</label>
                          <Input
                            type="number"
                            value={salaryForm.hra}
                            onChange={(e) => setSalaryForm({ ...salaryForm, hra: Number(e.target.value) })}
                            className="h-8 text-xs font-semibold"
                          />
                        </div>
                        <div className="space-y-1">
                          <label className="text-[11px] font-medium text-slate-500">Conveyance (₹)</label>
                          <Input
                            type="number"
                            value={salaryForm.conveyanceAllowance}
                            onChange={(e) => setSalaryForm({ ...salaryForm, conveyanceAllowance: Number(e.target.value) })}
                            className="h-8 text-xs font-semibold"
                          />
                        </div>
                        <div className="space-y-1">
                          <label className="text-[11px] font-medium text-slate-500">Medical (₹)</label>
                          <Input
                            type="number"
                            value={salaryForm.medicalAllowance}
                            onChange={(e) => setSalaryForm({ ...salaryForm, medicalAllowance: Number(e.target.value) })}
                            className="h-8 text-xs font-semibold"
                          />
                        </div>
                        <div className="space-y-1">
                          <label className="text-[11px] font-medium text-slate-500">Special Allowance (₹)</label>
                          <Input
                            type="number"
                            value={salaryForm.specialAllowance}
                            onChange={(e) => setSalaryForm({ ...salaryForm, specialAllowance: Number(e.target.value) })}
                            className="h-8 text-xs font-semibold"
                          />
                        </div>
                        <div className="space-y-1">
                          <label className="text-[11px] font-medium text-slate-500">Employer PF (₹)</label>
                          <Input
                            type="number"
                            value={salaryForm.pfContribution}
                            onChange={(e) => setSalaryForm({ ...salaryForm, pfContribution: Number(e.target.value) })}
                            className="h-8 text-xs font-semibold"
                          />
                        </div>
                        <div className="space-y-1 col-span-2">
                          <label className="text-[11px] font-medium text-rose-500">Professional Tax (₹)</label>
                          <Input
                            type="number"
                            value={salaryForm.professionalTax}
                            onChange={(e) => setSalaryForm({ ...salaryForm, professionalTax: Number(e.target.value) })}
                            className="h-8 text-xs font-semibold text-rose-600 border-rose-200"
                          />
                        </div>
                      </div>
                    </div>
                  )}
                </div>
                <DialogFooter>
                  <Button
                    variant="outline"
                    onClick={() => setIsSalaryModalOpen(false)}
                  >
                    Cancel
                  </Button>
                  <Button
                    onClick={() => salaryMutation.mutate()}
                    disabled={
                      !empForSalary ||
                      !selectedTemplateId ||
                      selectedTemplateId === "none" ||
                      (selectedTemplateId !== "custom" && !annualCtc) ||
                      salaryMutation.isPending
                    }
                    className="bg-indigo-600 text-white hover:bg-indigo-700"
                  >
                    {salaryMutation.isPending ? "Saving..." : "Save Salary"}
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>

            {/* EXISTING Run Payroll Button... */}
            <Dialog
              open={isGenerateModalOpen}
              onOpenChange={setIsGenerateModalOpen}
            >
              <DialogTrigger className="inline-flex h-9 items-center justify-center rounded-lg bg-indigo-600 px-2.5 text-sm font-medium text-white transition-colors hover:bg-indigo-700">
                <Plus className="mr-2 h-4 w-4" /> Run Payroll Engine
              </DialogTrigger>
              <DialogContent className="sm:max-w-md">
                <DialogHeader>
                  <DialogTitle>Run Payroll Calculation</DialogTitle>
                </DialogHeader>
                <div className="space-y-4 py-4">
                  <p className="text-sm text-slate-500">
                    This will calculate Loss of Pay (LOP), taxes, and net salary
                    for the selected employee for{" "}
                    <strong>
                      Month {selectedMonth}/{selectedYear}
                    </strong>
                    .
                  </p>
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-slate-700">
                      Select Employee
                    </label>
                    <Select
                      value={empToGenerate}
                      onValueChange={(val) => setEmpToGenerate(val || "")}
                      items={generateEmployeeSelectItems}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select an employee..." />
                      </SelectTrigger>
                      <SelectContent>
                        {employees?.map((emp: any) => (
                          <SelectItem key={emp.id} value={emp.id}>
                            {emp.firstName} {emp.lastName} ({emp.employeeCode})
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <DialogFooter>
                  <Button
                    variant="outline"
                    onClick={() => setIsGenerateModalOpen(false)}
                  >
                    Cancel
                  </Button>
                  <Button
                    onClick={() => generateMutation.mutate()}
                    disabled={!empToGenerate || generateMutation.isPending}
                    className="bg-indigo-600 hover:bg-indigo-700 text-white"
                  >
                    {generateMutation.isPending ? (
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    ) : (
                      <Calculator className="w-4 h-4 mr-2" />
                    )}
                    Calculate Now
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </div>
        </div>

        {/* Data Table */}
        {loadingPayrolls ? (
          <div className="p-12 flex justify-center">
            <Loader2 className="w-8 h-8 animate-spin text-indigo-600" />
          </div>
        ) : payrolls?.length === 0 ? (
          <div className="p-16 text-center text-slate-500">
            <Calculator className="w-12 h-12 mx-auto text-slate-300 mb-3" />
            <p className="text-lg font-medium text-slate-900">
              No payroll records found
            </p>
            <p className="text-sm mt-1">
              Run the payroll engine to generate salaries for {selectedMonth}/
              {selectedYear}.
            </p>
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow className="bg-slate-50/50 hover:bg-slate-50/50">
                <TableHead>Employee</TableHead>
                <TableHead>Working Days</TableHead>
                <TableHead className="text-right">Gross Earnings</TableHead>
                <TableHead className="text-right text-rose-600">
                  Deductions (inc. LOP)
                </TableHead>
                <TableHead className="text-right font-bold">
                  Net Salary
                </TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {payrolls?.map((record: any) => (
                <TableRow
                  key={record.id}
                  className="hover:bg-slate-50/80 cursor-pointer"
                >
                  <TableCell>
                    <div className="font-semibold text-slate-900">
                      {record.employee.firstName} {record.employee.lastName}
                    </div>
                    <div className="text-xs text-slate-500">
                      {record.employee.employeeCode}
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="text-sm text-slate-700">
                      {record.presentDays} / {record.totalWorkingDays} days
                    </div>
                    {record.unpaidLeaves > 0 && (
                      <div className="text-xs text-rose-500 font-medium">
                        {record.unpaidLeaves} LOP days
                      </div>
                    )}
                  </TableCell>
                  <TableCell className="text-right text-sm text-slate-700">
                    {formatCurrency(record.basicPay + record.allowances)}
                  </TableCell>
                  <TableCell className="text-right text-sm text-rose-600 font-medium">
                    - {formatCurrency(record.deductions)}
                  </TableCell>
                  <TableCell className="text-right font-bold text-slate-900">
                    {formatCurrency(record.netSalary)}
                  </TableCell>
                  <TableCell>{getStatusBadge(record.status)}</TableCell>
                  <TableCell className="text-right flex justify-end gap-2">
                    {/* Approve Button (Only show if DRAFT) */}
                    {record.status === "DRAFT" && (
                      <Button
                        variant="outline"
                        size="sm"
                        className="text-emerald-600 border-emerald-200 hover:bg-emerald-50"
                        onClick={(e) => {
                          e.stopPropagation();
                          statusMutation.mutate({
                            id: record.id,
                            status: "APPROVED",
                          });
                        }}
                        disabled={statusMutation.isPending}
                      >
                        <CheckCircle2 className="w-4 h-4 mr-1" /> Approve
                      </Button>
                    )}

                    {/* Fixed Payslip Preview Button */}
                    <Button
                      variant="ghost"
                      size="sm"
                      className="text-indigo-600 hover:bg-indigo-50"
                      onClick={(e) => {
                        e.stopPropagation();
                        setSelectedPayslip(record); // This triggers the Modal!
                      }}
                    >
                      <FileText className="w-4 h-4 mr-2" /> Payslip
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </div>

      {/* THE PRINTABLE PAYSLIP MODAL */}
      <Dialog
        open={selectedPayslip !== null}
        onOpenChange={(isOpen) => {
          if (!isOpen) setSelectedPayslip(null);
        }}
      >
        <DialogContent className="sm:max-w-3xl bg-white max-h-[90vh] overflow-y-auto">
          <DialogHeader className="print:hidden">
            <DialogTitle>Official Payslip</DialogTitle>
            <DialogDescription className="hidden">
              View and print the official salary breakdown.
            </DialogDescription>
          </DialogHeader>

          {selectedPayslip && (
            <div
              className="p-6 border border-slate-200 rounded-lg mt-2 bg-white"
              id="printable-payslip"
            >
              {/* Header */}
              <div className="text-center mb-8 border-b border-slate-200 pb-6">
                {selectedPayslip.breakdown?.meta?.letterheadUrl ||
                selectedPayslip.company?.settings?.payslipHeaderUrl ? (
                  <img
                    src={
                      selectedPayslip.breakdown?.meta?.letterheadUrl ||
                      selectedPayslip.company?.settings?.payslipHeaderUrl
                    }
                    alt="Company letterhead"
                    className="mx-auto mb-4 h-auto max-h-32 w-full object-contain"
                  />
                ) : (
                  <h2 className="text-2xl font-bold text-slate-900 uppercase tracking-widest">
                    {selectedPayslip.breakdown?.meta?.companyName ||
                      selectedPayslip.company?.name ||
                      "Company Name"}
                  </h2>
                )}
                <p className="text-slate-500 mt-1">
                  Payslip for the month of{" "}
                  {new Date(
                    selectedPayslip.year,
                    selectedPayslip.month - 1,
                  ).toLocaleString("default", { month: "long" })}{" "}
                  {selectedPayslip.year}
                </p>
              </div>

              {/* Employee Additional Summary (From PDF) */}
              <div className="grid grid-cols-2 gap-8 mb-8 text-sm">
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-slate-500">Employee Name:</span>{" "}
                    <span className="font-semibold text-slate-900">
                      {selectedPayslip.employee?.firstName}{" "}
                      {selectedPayslip.employee?.lastName}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">Employee ID:</span>{" "}
                    <span className="font-semibold text-slate-900">
                      {selectedPayslip.employee?.employeeCode || "N/A"}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">Designation:</span>{" "}
                    <span className="font-semibold text-slate-900">
                      {selectedPayslip.employee?.designation ||
                        "Software Engineer"}
                    </span>
                  </div>
                </div>
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-slate-500">PF A/C Number:</span>{" "}
                    <span className="font-semibold text-slate-900">
                      {selectedPayslip.employee?.pfAccountNumber || "N/A"}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">UAN Number:</span>{" "}
                    <span className="font-semibold text-slate-900">
                      {selectedPayslip.employee?.uanNumber || "N/A"}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">Paid Days / LOP:</span>{" "}
                    <span className="font-semibold text-slate-900">
                      {selectedPayslip.presentDays} /{" "}
                      <span className="text-rose-600">
                        {selectedPayslip.unpaidLeaves}
                      </span>
                    </span>
                  </div>
                </div>
              </div>

              {/* Salary Breakdown Tables */}
              <div className="grid grid-cols-2 gap-0 border-t border-l border-slate-200 mb-8">
                {/* EARNINGS */}
                <div>
                  <div className="bg-slate-50 p-3 border-r border-b border-slate-200 font-bold text-slate-700 uppercase text-xs tracking-wider flex justify-between">
                    <span>Earnings</span>
                    <span>Amount</span>
                  </div>
                  <div className="p-3 border-r border-b border-slate-200 flex justify-between text-sm">
                    <span className="text-slate-600">Basic</span>
                    <span className="font-medium text-slate-900">
                      {formatCurrency(
                        selectedPayslip.breakdown?.earnings?.basic || 0,
                      )}
                    </span>
                  </div>
                  <div className="p-3 border-r border-b border-slate-200 flex justify-between text-sm">
                    <span className="text-slate-600">House Rent Allowance</span>
                    <span className="font-medium text-slate-900">
                      {formatCurrency(
                        selectedPayslip.breakdown?.earnings?.hra || 0,
                      )}
                    </span>
                  </div>
                  <div className="p-3 border-r border-b border-slate-200 flex justify-between text-sm">
                    <span className="text-slate-600">Conveyance Allowance</span>
                    <span className="font-medium text-slate-900">
                      {formatCurrency(
                        selectedPayslip.breakdown?.earnings?.conveyance || 0,
                      )}
                    </span>
                  </div>
                  <div className="p-3 border-r border-b border-slate-200 flex justify-between text-sm">
                    <span className="text-slate-600">Medical Allowance</span>
                    <span className="font-medium text-slate-900">
                      {formatCurrency(
                        selectedPayslip.breakdown?.earnings?.medical || 0,
                      )}
                    </span>
                  </div>
                  <div className="p-3 border-r border-b border-slate-200 flex justify-between text-sm">
                    <span className="text-slate-600">Special Allowance</span>
                    <span className="font-medium text-slate-900">
                      {formatCurrency(
                        selectedPayslip.breakdown?.earnings?.special || 0,
                      )}
                    </span>
                  </div>

                  <div className="p-3 border-r border-b border-slate-200 flex justify-between font-bold bg-slate-50">
                    <span className="text-slate-900">Total Earnings</span>
                    <span className="text-emerald-600">
                      {formatCurrency(
                        selectedPayslip.breakdown?.earnings?.total || 0,
                      )}
                    </span>
                  </div>
                </div>

                {/* DEDUCTIONS */}
                <div>
                  <div className="bg-slate-50 p-3 border-r border-b border-slate-200 font-bold text-slate-700 uppercase text-xs tracking-wider flex justify-between">
                    <span>Deductions</span>
                    <span>Amount</span>
                  </div>
                  <div className="p-3 border-r border-b border-slate-200 flex justify-between text-sm">
                    <span className="text-slate-600">EPF contribution</span>
                    <span className="font-medium text-slate-900">
                      {formatCurrency(
                        selectedPayslip.breakdown?.deductions?.pf || 0,
                      )}
                    </span>
                  </div>
                  <div className="p-3 border-r border-b border-slate-200 flex justify-between text-sm">
                    <span className="text-slate-600">Income Tax</span>
                    <span className="font-medium text-slate-900">
                      {formatCurrency(
                        selectedPayslip.breakdown?.deductions?.tax || 0,
                      )}
                    </span>
                  </div>
                  <div className="p-3 border-r border-b border-slate-200 flex justify-between text-sm">
                    <span className="text-slate-600">Professional Tax</span>
                    <span className="font-medium text-slate-900">
                      {formatCurrency(
                        selectedPayslip.breakdown?.deductions?.profTax || 0,
                      )}
                    </span>
                  </div>
                  <div className="p-3 border-r border-b border-slate-200 flex justify-between text-sm">
                    <span className="text-slate-600 flex items-center">
                      Loss of Pay{" "}
                      <Badge
                        variant="outline"
                        className="ml-2 text-[10px] py-0"
                      >
                        {selectedPayslip.unpaidLeaves} days
                      </Badge>
                    </span>
                    <span className="font-medium text-rose-600">
                      {formatCurrency(
                        selectedPayslip.breakdown?.deductions?.lop || 0,
                      )}
                    </span>
                  </div>
                  {/* Empty Spacer to align with Earnings (which has 1 extra row) */}
                  <div className="p-3 border-r border-b border-slate-200 flex justify-between text-sm text-transparent select-none">
                    {" "}
                    Spacer{" "}
                  </div>

                  <div className="p-3 border-r border-b border-slate-200 flex justify-between font-bold bg-slate-50">
                    <span className="text-slate-900">Total Deductions</span>
                    <span className="text-rose-600">
                      {formatCurrency(
                        selectedPayslip.breakdown?.deductions?.total || 0,
                      )}
                    </span>
                  </div>
                </div>
              </div>

              {/* Net Salary Highlight */}
              <div className="bg-indigo-50 border border-indigo-100 rounded-lg p-6 flex justify-between items-center">
                <div>
                  <p className="text-sm font-semibold text-indigo-900 uppercase tracking-wider">
                    Net Salary Payable
                  </p>
                  <p className="text-xs text-indigo-700 mt-1">
                    Total Earnings minus Total Deductions
                  </p>
                </div>
                <div className="text-3xl font-black text-indigo-700">
                  {formatCurrency(selectedPayslip.netSalary)}
                </div>
              </div>

              <div className="mt-8 text-center text-xs text-slate-400">
                This is a computer-generated document. No signature is required.
              </div>
            </div>
          )}

          <DialogFooter className="print:hidden mt-4">
            <Button variant="outline" onClick={() => setSelectedPayslip(null)}>
              Close
            </Button>
            <Button
              className="bg-indigo-600 hover:bg-indigo-700 text-white"
              onClick={() => {
                axios.post(`${API_URL}/payroll/${selectedPayslip.id}/log-download`, {}, {
                  headers: { Authorization: `Bearer ${getToken()}` }
                }).catch(err => console.error("Failed to log download:", err));
                window.print();
              }}
            >
              <Download className="w-4 h-4 mr-2" /> Download / Print PDF
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
