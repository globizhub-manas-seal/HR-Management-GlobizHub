"use client";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import axios from "axios";
import { 
  Calculator, Calendar as CalendarIcon, CheckCircle2, 
  Clock, Download, FileText, Loader2, Plus, Search, 
  TrendingDown, TrendingUp, Users 
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { 
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogTrigger ,DialogDescription
} from "@/components/ui/dialog";
import { 
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue 
} from "@/components/ui/select";
import { 
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow 
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";

export default function HRPayrollDashboard() {
  const queryClient = useQueryClient();
  
  // State for Month/Year filtering
  const currentDate = new Date();
  const [selectedMonth, setSelectedMonth] = useState((currentDate.getMonth() + 1).toString());
  const [selectedYear, setSelectedYear] = useState(currentDate.getFullYear().toString());

  // State for the Payslip View Modal
  const [selectedPayslip, setSelectedPayslip] = useState<any>(null);
  
  // State for Generation Modal
  const [isGenerateModalOpen, setIsGenerateModalOpen] = useState(false);
  const [empToGenerate, setEmpToGenerate] = useState("");

  const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000";
  const getToken = () => localStorage.getItem("hrms_token");

  // --- ADD THESE STATE VARIABLES ---
  const [isSalaryModalOpen, setIsSalaryModalOpen] = useState(false);
  const [empForSalary, setEmpForSalary] = useState("");
  const [salaryForm, setSalaryForm] = useState({
    basicSalary: 50000,
    hra: 10000,
    otherAllowances: 5000,
    pfContribution: 3000,
    taxDeduction: 2000
  });

  // --- ADD THIS MUTATION ---
  const salaryMutation = useMutation({
    mutationFn: async () => {
      await axios.post(`${API_URL}/payroll/salary-structure`, 
        { employeeId: empForSalary, ...salaryForm },
        { headers: { Authorization: `Bearer ${getToken()}` } }
      );
    },
    onSuccess: () => {
      setIsSalaryModalOpen(false);
      alert("Salary structure assigned! You can now run their payroll.");
    }
  });

  // 1. Fetch Payroll Records for the selected month
  const { data: payrolls, isLoading: loadingPayrolls } = useQuery({
    queryKey: ["companyPayroll", selectedMonth, selectedYear],
    queryFn: async () => {
      const res = await axios.get(`${API_URL}/payroll/company`, {
        params: { month: selectedMonth, year: selectedYear },
        headers: { Authorization: `Bearer ${getToken()}` }
      });
      return res.data;
    }
  });

  // 2. Fetch Employees (for the dropdown in the Generate Modal)
  const { data: employees } = useQuery({
    queryKey: ["companyEmployees"],
    queryFn: async () => {
      const res = await axios.get(`${API_URL}/employees`, {
        headers: { Authorization: `Bearer ${getToken()}` }
      });
      return res.data;
    }
  });

  // 3. Generate Payroll Mutation
  const generateMutation = useMutation({
    mutationFn: async () => {
      await axios.post(`${API_URL}/payroll/generate`, 
        { 
          employeeId: empToGenerate, 
          month: parseInt(selectedMonth), 
          year: parseInt(selectedYear) 
        },
        { headers: { Authorization: `Bearer ${getToken()}` } }
      );
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["companyPayroll", selectedMonth, selectedYear] });
      setIsGenerateModalOpen(false);
      setEmpToGenerate("");
      alert("Payroll generated successfully!");
    },
    onError: (error: any) => {
      alert(error.response?.data?.message || "Failed to generate payroll");
    }
  });

  // UI Helpers
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR' }).format(amount);
  };

  const getStatusBadge = (status: string) => {
    switch(status) {
      case "APPROVED": 
      case "PAID": 
        return <Badge className="bg-emerald-50 text-emerald-700 border-emerald-200"><CheckCircle2 className="w-3 h-3 mr-1"/> {status}</Badge>;
      case "DRAFT": 
        return <Badge className="bg-amber-50 text-amber-700 border-amber-200"><Clock className="w-3 h-3 mr-1"/> Draft</Badge>;
      default: 
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  // Status Update Mutation (DRAFT -> APPROVED)
  const statusMutation = useMutation({
    mutationFn: async ({ id, status }: { id: string, status: string }) => {
      await axios.patch(`${API_URL}/payroll/${id}/status`, 
        { status },
        { headers: { Authorization: `Bearer ${getToken()}` } }
      );
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["companyPayroll", selectedMonth, selectedYear] });
    },
    onError: (error: any) => {
      alert(error.response?.data?.message || "Failed to update status");
    }
  });

  // Calculate Summary Stats
  const totalPayout = payrolls?.reduce((sum: number, record: any) => sum + record.netSalary, 0) || 0;
  const totalDeductions = payrolls?.reduce((sum: number, record: any) => sum + record.deductions, 0) || 0;

  return (
    <div className="p-8 max-w-7xl mx-auto space-y-8 font-sans min-h-screen bg-slate-50/50">
      
      {/* HEADER & CONTROLS */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-4">
        <div>
          <h1 className="text-3xl font-bold text-slate-900 tracking-tight flex items-center">
            <Calculator className="w-8 h-8 mr-3 text-indigo-600" />
            Payroll Processing
          </h1>
          <p className="text-slate-500 mt-1">Generate, review, and approve monthly employee salaries.</p>
        </div>

        <div className="flex items-center gap-3 bg-white p-2 rounded-xl border border-slate-200 shadow-sm">
          <CalendarIcon className="w-5 h-5 text-slate-400 ml-2" />
          <Select value={selectedMonth} onValueChange={setSelectedMonth}>
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
          
          <Select value={selectedYear} onValueChange={setSelectedYear}>
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
            <p className="text-sm font-medium text-slate-500 uppercase tracking-wider">Total Net Payout</p>
            <h3 className="text-2xl font-bold text-slate-900 mt-1">{formatCurrency(totalPayout)}</h3>
          </div>
        </div>

        <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm flex items-center space-x-4">
          <div className="w-12 h-12 rounded-xl bg-rose-50 text-rose-600 flex items-center justify-center">
            <TrendingDown className="w-6 h-6" />
          </div>
          <div>
            <p className="text-sm font-medium text-slate-500 uppercase tracking-wider">Total Deductions</p>
            <h3 className="text-2xl font-bold text-slate-900 mt-1">{formatCurrency(totalDeductions)}</h3>
          </div>
        </div>

        <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm flex items-center space-x-4">
          <div className="w-12 h-12 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
            <Users className="w-6 h-6" />
          </div>
          <div>
            <p className="text-sm font-medium text-slate-500 uppercase tracking-wider">Processed Employees</p>
            <h3 className="text-2xl font-bold text-slate-900 mt-1">{payrolls?.length || 0}</h3>
          </div>
        </div>
      </div>

      {/* TABLE AND ACTIONS */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        
        {/* Table Toolbar */}
        <div className="p-4 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
          <div className="relative w-64">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <Input placeholder="Search employee..." className="pl-9 h-9 bg-white border-slate-200" />
          </div>
          
          <div className="flex gap-3">
            <Button variant="outline" className="h-9 text-slate-600 border-slate-200">
              <Download className="w-4 h-4 mr-2" /> Export CSV
            </Button>

            {/* NEW SET SALARY BUTTON */}
            <Dialog open={isSalaryModalOpen} onOpenChange={setIsSalaryModalOpen}>
              <DialogTrigger asChild>
                <Button variant="outline" className="h-9 text-indigo-600 border-indigo-200 hover:bg-indigo-50">
                  <Calculator className="w-4 h-4 mr-2" /> Assign Salary
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-md">
                <DialogHeader>
                  <DialogTitle>Set Employee Salary Structure</DialogTitle>
                </DialogHeader>
                <div className="space-y-4 py-4">
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-slate-700">Select Employee</label>
                    <Select value={empForSalary} onValueChange={setEmpForSalary}>
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
                  
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <label className="text-sm font-medium text-slate-700">Basic Salary</label>
                      <Input type="number" value={salaryForm.basicSalary} onChange={(e) => setSalaryForm({...salaryForm, basicSalary: Number(e.target.value)})} />
                    </div>
                    <div className="space-y-2">
                      <label className="text-sm font-medium text-slate-700">HRA</label>
                      <Input type="number" value={salaryForm.hra} onChange={(e) => setSalaryForm({...salaryForm, hra: Number(e.target.value)})} />
                    </div>
                    <div className="space-y-2">
                      <label className="text-sm font-medium text-slate-700">Other Allowances</label>
                      <Input type="number" value={salaryForm.otherAllowances} onChange={(e) => setSalaryForm({...salaryForm, otherAllowances: Number(e.target.value)})} />
                    </div>
                    <div className="space-y-2">
                      <label className="text-sm font-medium text-slate-700 text-rose-600">PF Deduction</label>
                      <Input type="number" value={salaryForm.pfContribution} onChange={(e) => setSalaryForm({...salaryForm, pfContribution: Number(e.target.value)})} />
                    </div>
                  </div>
                </div>
                <DialogFooter>
                  <Button variant="outline" onClick={() => setIsSalaryModalOpen(false)}>Cancel</Button>
                  <Button onClick={() => salaryMutation.mutate()} disabled={!empForSalary || salaryMutation.isPending} className="bg-indigo-600 text-white">
                    {salaryMutation.isPending ? "Saving..." : "Save Salary"}
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>

            {/* EXISTING Run Payroll Button... */}
            
            <Dialog open={isGenerateModalOpen} onOpenChange={setIsGenerateModalOpen}>
              <DialogTrigger asChild>
                <Button className="h-9 bg-indigo-600 hover:bg-indigo-700 text-white">
                  <Plus className="w-4 h-4 mr-2" /> Run Payroll Engine
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-md">
                <DialogHeader>
                  <DialogTitle>Run Payroll Calculation</DialogTitle>
                </DialogHeader>
                <div className="space-y-4 py-4">
                  <p className="text-sm text-slate-500">
                    This will calculate Loss of Pay (LOP), taxes, and net salary for the selected employee for <strong>Month {selectedMonth}/{selectedYear}</strong>.
                  </p>
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-slate-700">Select Employee</label>
                    <Select value={empToGenerate} onValueChange={setEmpToGenerate}>
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
                  <Button variant="outline" onClick={() => setIsGenerateModalOpen(false)}>Cancel</Button>
                  <Button 
                    onClick={() => generateMutation.mutate()} 
                    disabled={!empToGenerate || generateMutation.isPending}
                    className="bg-indigo-600 hover:bg-indigo-700 text-white"
                  >
                    {generateMutation.isPending ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Calculator className="w-4 h-4 mr-2" />}
                    Calculate Now
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </div>
        </div>

        {/* Data Table */}
        {loadingPayrolls ? (
          <div className="p-12 flex justify-center"><Loader2 className="w-8 h-8 animate-spin text-indigo-600" /></div>
        ) : payrolls?.length === 0 ? (
          <div className="p-16 text-center text-slate-500">
            <Calculator className="w-12 h-12 mx-auto text-slate-300 mb-3" />
            <p className="text-lg font-medium text-slate-900">No payroll records found</p>
            <p className="text-sm mt-1">Run the payroll engine to generate salaries for {selectedMonth}/{selectedYear}.</p>
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow className="bg-slate-50/50 hover:bg-slate-50/50">
                <TableHead>Employee</TableHead>
                <TableHead>Working Days</TableHead>
                <TableHead className="text-right">Gross Earnings</TableHead>
                <TableHead className="text-right text-rose-600">Deductions (inc. LOP)</TableHead>
                <TableHead className="text-right font-bold">Net Salary</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {payrolls?.map((record: any) => (
                <TableRow key={record.id} className="hover:bg-slate-50/80 cursor-pointer">
                  <TableCell>
                    <div className="font-semibold text-slate-900">{record.employee.firstName} {record.employee.lastName}</div>
                    <div className="text-xs text-slate-500">{record.employee.employeeCode}</div>
                  </TableCell>
                  <TableCell>
                    <div className="text-sm text-slate-700">{record.presentDays} / {record.totalWorkingDays} days</div>
                    {record.unpaidLeaves > 0 && (
                      <div className="text-xs text-rose-500 font-medium">{record.unpaidLeaves} LOP days</div>
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
                  <TableCell>
                    {getStatusBadge(record.status)}
                  </TableCell>
                <TableCell className="text-right flex justify-end gap-2">
                    {/* Approve Button (Only show if DRAFT) */}
                    {record.status === "DRAFT" && (
                      <Button 
                        variant="outline" 
                        size="sm" 
                        className="text-emerald-600 border-emerald-200 hover:bg-emerald-50"
                        onClick={(e) => {
                          e.stopPropagation();
                          statusMutation.mutate({ id: record.id, status: 'APPROVED' });
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
            <div className="p-6 border border-slate-200 rounded-lg mt-2 bg-white" id="printable-payslip">
              
              {/* Header */}
              <div className="text-center mb-8 border-b border-slate-200 pb-6">
                <h2 className="text-2xl font-bold text-slate-900 uppercase tracking-widest">
                  {selectedPayslip.company?.name || "Company Name"}
                </h2>
                <p className="text-slate-500 mt-1">Payslip for the month of {new Date(selectedPayslip.year, selectedPayslip.month - 1).toLocaleString('default', { month: 'long' })} {selectedPayslip.year}</p>
              </div>

              {/* Employee Summary */}
              <div className="grid grid-cols-2 gap-8 mb-8 text-sm">
                <div className="space-y-2">
                  <div className="flex justify-between"><span className="text-slate-500">Employee Name:</span> <span className="font-semibold text-slate-900">{selectedPayslip.employee?.firstName} {selectedPayslip.employee?.lastName}</span></div>
                  <div className="flex justify-between"><span className="text-slate-500">Employee ID:</span> <span className="font-semibold text-slate-900">{selectedPayslip.employee?.employeeCode || 'N/A'}</span></div>
                </div>
                <div className="space-y-2">
                  <div className="flex justify-between"><span className="text-slate-500">Total Working Days:</span> <span className="font-semibold text-slate-900">{selectedPayslip.totalWorkingDays}</span></div>
                  <div className="flex justify-between"><span className="text-slate-500">Loss of Pay (LOP) Days:</span> <span className="font-semibold text-rose-600">{selectedPayslip.unpaidLeaves}</span></div>
                </div>
              </div>

              {/* Salary Breakdown Tables */}
              <div className="grid grid-cols-2 gap-0 border-t border-l border-slate-200 mb-8">
                
                {/* EARNINGS */}
                <div>
                  <div className="bg-slate-50 p-3 border-r border-b border-slate-200 font-bold text-slate-700 text-center uppercase text-xs tracking-wider">Earnings</div>
                  <div className="p-3 border-r border-b border-slate-200 flex justify-between text-sm">
                    <span className="text-slate-600">Basic Pay</span>
                    <span className="font-medium text-slate-900">{formatCurrency(selectedPayslip.breakdown?.earnings?.basic || 0)}</span>
                  </div>
                  <div className="p-3 border-r border-b border-slate-200 flex justify-between text-sm">
                    <span className="text-slate-600">House Rent Allowance (HRA)</span>
                    <span className="font-medium text-slate-900">{formatCurrency(selectedPayslip.breakdown?.earnings?.hra || 0)}</span>
                  </div>
                  <div className="p-3 border-r border-b border-slate-200 flex justify-between text-sm">
                    <span className="text-slate-600">Other Allowances</span>
                    <span className="font-medium text-slate-900">{formatCurrency(selectedPayslip.breakdown?.earnings?.other || 0)}</span>
                  </div>
                  {/* Empty spacer to balance heights */}
                  <div className="p-3 border-r border-b border-slate-200 flex justify-between text-sm text-transparent select-none"> Spacer </div>
                  
                  <div className="p-3 border-r border-b border-slate-200 flex justify-between font-bold bg-slate-50">
                    <span className="text-slate-900">Total Earnings</span>
                    <span className="text-emerald-600">{formatCurrency(selectedPayslip.breakdown?.earnings?.total || 0)}</span>
                  </div>
                </div>

                {/* DEDUCTIONS */}
                <div>
                  <div className="bg-slate-50 p-3 border-r border-b border-slate-200 font-bold text-slate-700 text-center uppercase text-xs tracking-wider">Deductions</div>
                  <div className="p-3 border-r border-b border-slate-200 flex justify-between text-sm">
                    <span className="text-slate-600">Provident Fund (PF)</span>
                    <span className="font-medium text-slate-900">{formatCurrency(selectedPayslip.breakdown?.deductions?.pf || 0)}</span>
                  </div>
                  <div className="p-3 border-r border-b border-slate-200 flex justify-between text-sm">
                    <span className="text-slate-600">Tax Deducted at Source (TDS)</span>
                    <span className="font-medium text-slate-900">{formatCurrency(selectedPayslip.breakdown?.deductions?.tax || 0)}</span>
                  </div>
                  <div className="p-3 border-r border-b border-slate-200 flex justify-between text-sm">
                    <span className="text-slate-600 flex items-center">Loss of Pay <Badge variant="outline" className="ml-2 text-[10px] py-0">{selectedPayslip.unpaidLeaves} days</Badge></span>
                    <span className="font-medium text-rose-600">{formatCurrency(selectedPayslip.breakdown?.deductions?.lop || 0)}</span>
                  </div>
                  {/* Empty spacer */}
                  <div className="p-3 border-r border-b border-slate-200 flex justify-between text-sm text-transparent select-none"> Spacer </div>
                  
                  <div className="p-3 border-r border-b border-slate-200 flex justify-between font-bold bg-slate-50">
                    <span className="text-slate-900">Total Deductions</span>
                    <span className="text-rose-600">{formatCurrency(selectedPayslip.breakdown?.deductions?.total || 0)}</span>
                  </div>
                </div>
              </div>

              {/* Net Salary Highlight */}
              <div className="bg-indigo-50 border border-indigo-100 rounded-lg p-6 flex justify-between items-center">
                <div>
                  <p className="text-sm font-semibold text-indigo-900 uppercase tracking-wider">Net Salary Payable</p>
                  <p className="text-xs text-indigo-700 mt-1">Total Earnings minus Total Deductions</p>
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
            <Button variant="outline" onClick={() => setSelectedPayslip(null)}>Close</Button>
            <Button 
              className="bg-indigo-600 hover:bg-indigo-700 text-white"
              onClick={() => window.print()}
            >
              <Download className="w-4 h-4 mr-2" /> Download / Print PDF
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

    </div>
  );
}