"use client";

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import axios from "axios";
import { FileText, Download, Calendar, DollarSign, Briefcase, Printer } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";

export default function MyPayslipsPage() {
  const [selectedPayslipId, setSelectedPayslipId] = useState<string | null>(null);

  // 1. Fetch the logged-in employee's payslips
  const { data: payslips, isLoading } = useQuery({
    queryKey: ["myPayslips"],
    queryFn: async () => {
      const token = localStorage.getItem("hrms_token");
      const res = await axios.get(`${process.env.NEXT_PUBLIC_API_URL}/payroll/my-payslips`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      return res.data;
    }
  });

  // Find the currently selected payslip to display on the right side
  const selectedPayslip = payslips?.find((p: any) => p.id === selectedPayslipId) || payslips?.[0];

  const handlePrint = () => {
    window.print(); // Simple MVP print-to-PDF functionality
  };

  const getMonthName = (monthNumber: number) => {
    const date = new Date();
    date.setMonth(monthNumber - 1);
    return date.toLocaleString('default', { month: 'long' });
  };

  if (isLoading) return <div className="p-8 text-slate-500">Loading your financial records...</div>;

  return (
    <div className="p-4 md:p-8 max-w-6xl mx-auto space-y-6">
      <div className="flex items-center space-x-3 mb-6 print:hidden">
        <div className="p-3 bg-indigo-600 rounded-lg text-white">
          <FileText className="w-6 h-6" />
        </div>
        <div>
          <h1 className="text-3xl font-bold text-slate-900">My Payslips</h1>
          <p className="text-slate-500 mt-1">View and download your monthly salary statements.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* LEFT COLUMN: HISTORY LIST (Hidden when printing) */}
        <div className="lg:col-span-1 space-y-4 print:hidden">
          <h3 className="font-semibold text-slate-700 uppercase tracking-wider text-xs mb-2">History</h3>
          {payslips?.length === 0 ? (
            <Card className="bg-slate-50 border-dashed">
              <CardContent className="p-6 text-center text-slate-500">
                No payslips generated yet.
              </CardContent>
            </Card>
          ) : (
            payslips?.map((slip: any) => (
              <Card 
                key={slip.id} 
                className={`cursor-pointer transition-all hover:border-indigo-300 ${selectedPayslip?.id === slip.id ? 'border-indigo-500 bg-indigo-50/50 shadow-sm' : ''}`}
                onClick={() => setSelectedPayslipId(slip.id)}
              >
                <CardContent className="p-4 flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <div className={`p-2 rounded-md ${selectedPayslip?.id === slip.id ? 'bg-indigo-100 text-indigo-700' : 'bg-slate-100 text-slate-500'}`}>
                      <Calendar className="w-5 h-5" />
                    </div>
                    <div>
                      <p className="font-bold text-slate-900">{getMonthName(slip.month)} {slip.year}</p>
                      <p className="text-xs text-slate-500">Net: ${slip.netSalary.toLocaleString()}</p>
                    </div>
                  </div>
                  <Badge variant="outline" className="bg-emerald-50 text-emerald-700 border-emerald-200">
                    PAID
                  </Badge>
                </CardContent>
              </Card>
            ))
          )}
        </div>

        {/* RIGHT COLUMN: DETAILED PAYSLIP */}
        <div className="lg:col-span-2">
          {selectedPayslip ? (
            <Card className="border-slate-200 shadow-sm print:shadow-none print:border-none">
              
              {/* PAYSLIP HEADER */}
              <CardHeader className="bg-slate-50/50 border-b border-slate-100 flex flex-row items-start justify-between print:bg-white">
                <div>
                  <CardTitle className="text-2xl text-slate-900">Salary Slip</CardTitle>
                  <CardDescription className="text-base font-medium text-indigo-600 mt-1">
                    {getMonthName(selectedPayslip.month)} {selectedPayslip.year}
                  </CardDescription>
                </div>
                <Button variant="outline" onClick={handlePrint} className="print:hidden">
                  <Printer className="w-4 h-4 mr-2" /> Download PDF
                </Button>
              </CardHeader>

              <CardContent className="p-6 md:p-8 space-y-8">
                {/* ATTENDANCE SUMMARY */}
                <div className="grid grid-cols-3 gap-4 p-4 bg-slate-50 rounded-xl border border-slate-100">
                  <div className="text-center">
                    <p className="text-xs font-semibold text-slate-500 uppercase">Paid Days</p>
                    <p className="text-xl font-bold text-slate-900">{selectedPayslip.presentDays} / {selectedPayslip.totalWorkingDays}</p>
                  </div>
                  <div className="text-center border-l border-slate-200">
                    <p className="text-xs font-semibold text-slate-500 uppercase">Loss of Pay</p>
                    <p className="text-xl font-bold text-rose-600">{selectedPayslip.unpaidLeaves} Days</p>
                  </div>
                  <div className="text-center border-l border-slate-200">
                    <p className="text-xs font-semibold text-slate-500 uppercase">Overtime</p>
                    <p className="text-xl font-bold text-emerald-600">{selectedPayslip.overtimeHours} Hrs</p>
                  </div>
                </div>

                {/* EARNINGS & DEDUCTIONS TABLE */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  {/* Earnings */}
                  <div>
                    <h4 className="font-bold text-slate-700 border-b pb-2 mb-4">Earnings</h4>
                    <div className="space-y-3 text-sm">
                      <div className="flex justify-between">
                        <span className="text-slate-600">Basic Pay</span>
                        <span className="font-medium">${selectedPayslip.breakdown?.earnings?.basic?.toLocaleString() || 0}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-600">House Rent Allowance (HRA)</span>
                        <span className="font-medium">${selectedPayslip.breakdown?.earnings?.hra?.toLocaleString() || 0}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-600">Other Allowances</span>
                        <span className="font-medium">${selectedPayslip.breakdown?.earnings?.otherAllowances?.toLocaleString() || 0}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-600">Overtime Pay</span>
                        <span className="font-medium text-emerald-600">+ ${selectedPayslip.breakdown?.earnings?.overtime?.toLocaleString() || 0}</span>
                      </div>
                    </div>
                  </div>

                  {/* Deductions */}
                  <div>
                    <h4 className="font-bold text-slate-700 border-b pb-2 mb-4">Deductions</h4>
                    <div className="space-y-3 text-sm">
                      <div className="flex justify-between">
                        <span className="text-slate-600">Provident Fund (PF)</span>
                        <span className="font-medium">${selectedPayslip.breakdown?.deductions?.providentFund?.toLocaleString() || 0}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-600">Standard Tax / TDS</span>
                        <span className="font-medium">${selectedPayslip.breakdown?.deductions?.tax?.toLocaleString() || 0}</span>
                      </div>
                      {selectedPayslip.breakdown?.deductions?.lossOfPay > 0 && (
                        <div className="flex justify-between">
                          <span className="text-rose-600 font-medium">Loss of Pay (Unpaid Leave)</span>
                          <span className="font-bold text-rose-600">- ${selectedPayslip.breakdown?.deductions?.lossOfPay?.toLocaleString()}</span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                <Separator />

                {/* TOTALS */}
                <div className="flex justify-between items-end bg-indigo-50 p-6 rounded-xl border border-indigo-100">
                  <div className="space-y-1">
                    <p className="text-sm font-semibold text-indigo-900 uppercase">Net Salary Payable</p>
                    <p className="text-xs text-indigo-600 font-medium">Amount transferred to bank account</p>
                  </div>
                  <div className="text-right">
                    <p className="text-4xl font-black text-indigo-700">${selectedPayslip.netSalary.toLocaleString()}</p>
                  </div>
                </div>

              </CardContent>
            </Card>
          ) : (
            <div className="h-full flex items-center justify-center text-slate-400">
              Select a payslip from the left to view details.
            </div>
          )}
        </div>

      </div>
    </div>
  );
}