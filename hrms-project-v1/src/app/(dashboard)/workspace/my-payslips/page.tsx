"use client";

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import axios from "axios";
import { 
  Banknote, Calendar, Download, FileText, Loader2 
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { 
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter 
} from "@/components/ui/dialog";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

export default function EmployeePayslipPage() {
  const [selectedPayslip, setSelectedPayslip] = useState<any>(null);

  const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000";
  const getToken = () => localStorage.getItem("hrms_token");

  // Fetch Employee's Own Payslips
  const { data: payslips, isLoading } = useQuery({
    queryKey: ["myPayslips"],
    queryFn: async () => {
      const res = await axios.get(`${API_URL}/payroll/my-payslips`, {
        headers: { Authorization: `Bearer ${getToken()}` }
      });
      return res.data;
    }
  });

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR' }).format(amount);
  };

  const getMonthName = (monthNum: number) => {
    const date = new Date();
    date.setMonth(monthNum - 1);
    return date.toLocaleString('default', { month: 'long' });
  };

  return (
    <div className="p-8 max-w-6xl mx-auto space-y-8 font-sans min-h-screen bg-slate-50/50">
      
      {/* HEADER */}
      <div className="flex justify-between items-end gap-4 border-b border-slate-200 pb-6">
        <div>
          <h1 className="text-3xl font-bold text-slate-900 tracking-tight flex items-center">
            <Banknote className="w-8 h-8 mr-3 text-indigo-600" />
            My Salary Slips
          </h1>
          <p className="text-slate-500 mt-1">View and download your official monthly payslips.</p>
        </div>
      </div>

      {/* PAYSLIP GRID */}
      {isLoading ? (
        <div className="flex justify-center p-12 text-indigo-500"><Loader2 className="w-8 h-8 animate-spin" /></div>
      ) : payslips?.length === 0 ? (
        <div className="text-center p-16 border-2 border-dashed border-slate-200 rounded-2xl bg-white text-slate-500">
          <FileText className="w-12 h-12 mx-auto text-slate-300 mb-3" />
          <h3 className="text-lg font-bold text-slate-900 mb-1">No Payslips Available</h3>
          <p className="text-sm">Your payslips will appear here once HR approves and processes them.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {payslips?.map((payslip: any) => (
            <Card 
              key={payslip.id} 
              className="border-slate-200 shadow-sm hover:shadow-md hover:border-indigo-200 transition-all cursor-pointer group"
              onClick={() => setSelectedPayslip(payslip)}
            >
              <CardHeader className="pb-3 flex flex-row items-start justify-between space-y-0 bg-slate-50/50 rounded-t-xl border-b border-slate-100">
                <div>
                  <CardTitle className="text-xl font-bold text-slate-900">
                    {getMonthName(payslip.month)} {payslip.year}
                  </CardTitle>
                  <p className="text-xs font-semibold text-slate-500 mt-1">PROCESSED SALARY</p>
                </div>
                <div className="w-10 h-10 rounded-full bg-indigo-50 text-indigo-600 flex items-center justify-center group-hover:bg-indigo-600 group-hover:text-white transition-colors">
                  <FileText className="w-5 h-5" />
                </div>
              </CardHeader>
              <CardContent className="pt-5">
                <div className="flex justify-between items-end mb-4">
                  <p className="text-sm text-slate-500 font-medium">Net Transfer</p>
                  <p className="text-2xl font-black text-slate-900">{formatCurrency(payslip.netSalary)}</p>
                </div>
                
                <div className="flex justify-between items-center text-xs text-slate-500 mt-4 pt-4 border-t border-slate-100">
                  <span className="flex items-center"><Calendar className="w-3.5 h-3.5 mr-1"/> {payslip.totalWorkingDays} Working Days</span>
                  {payslip.unpaidLeaves > 0 && <span className="text-rose-500 font-medium">{payslip.unpaidLeaves} LOP Days</span>}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* THE PRINTABLE PAYSLIP MODAL (Reused from Admin View) */}
      <Dialog open={!!selectedPayslip} onOpenChange={(open) => !open && setSelectedPayslip(null)}>
        <DialogContent className="sm:max-w-3xl bg-white">
          <DialogHeader className="print:hidden">
            <DialogTitle>Official Payslip</DialogTitle>
          </DialogHeader>
          
          {selectedPayslip && (
            <div className="p-6 border border-slate-200 rounded-lg mt-2 bg-white" id="printable-payslip">
              {/* Header */}
              <div className="text-center mb-8 border-b border-slate-200 pb-6">
                <h2 className="text-2xl font-bold text-slate-900 uppercase tracking-widest">Company Name</h2>
                <p className="text-slate-500 mt-1">Payslip for the month of {getMonthName(selectedPayslip.month)} {selectedPayslip.year}</p>
              </div>

              {/* Employee Summary */}
              <div className="grid grid-cols-2 gap-8 mb-8 text-sm">
                <div className="space-y-2">
                  <div className="flex justify-between"><span className="text-slate-500">Employee Name:</span> <span className="font-semibold text-slate-900">{selectedPayslip.employee.firstName} {selectedPayslip.employee.lastName}</span></div>
                  <div className="flex justify-between"><span className="text-slate-500">Employee ID:</span> <span className="font-semibold text-slate-900">{selectedPayslip.employee.employeeCode || 'N/A'}</span></div>
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
                  <div className="p-3 border-r border-b border-slate-200 flex justify-between text-sm text-transparent select-none"> Spacer </div>
                  <div className="p-3 border-r border-b border-slate-200 flex justify-between font-bold bg-slate-50">
                    <span className="text-slate-900">Total Deductions</span>
                    <span className="text-rose-600">{formatCurrency(selectedPayslip.breakdown?.deductions?.total || 0)}</span>
                  </div>
                </div>
              </div>

              {/* Net Salary */}
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
            <Button className="bg-indigo-600 hover:bg-indigo-700 text-white" onClick={() => window.print()}>
              <Download className="w-4 h-4 mr-2" /> Download / Print PDF
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

    </div>
  );
}