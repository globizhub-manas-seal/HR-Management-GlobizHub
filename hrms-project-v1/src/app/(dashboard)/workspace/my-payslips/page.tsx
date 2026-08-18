"use client";

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import axios from "axios";
import { Banknote, Calendar, Download, FileText, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
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
        headers: { Authorization: `Bearer ${getToken()}` },
      });
      return res.data;
    },
  });

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR",
    }).format(amount);
  };

  const getMonthName = (monthNum: number) => {
    const date = new Date();
    date.setMonth(monthNum - 1);
    return date.toLocaleString("default", { month: "long" });
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
          <p className="text-slate-500 mt-1">
            View and download your official monthly payslips.
          </p>
        </div>
      </div>

      {/* PAYSLIP GRID */}
      {isLoading ? (
        <div className="flex justify-center p-12 text-indigo-500">
          <Loader2 className="w-8 h-8 animate-spin" />
        </div>
      ) : payslips?.length === 0 ? (
        <div className="text-center p-16 border-2 border-dashed border-slate-200 rounded-2xl bg-white text-slate-500">
          <FileText className="w-12 h-12 mx-auto text-slate-300 mb-3" />
          <h3 className="text-lg font-bold text-slate-900 mb-1">
            No Payslips Available
          </h3>
          <p className="text-sm">
            Your payslips will appear here once HR approves and processes them.
          </p>
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
                  <p className="text-xs font-semibold text-slate-500 mt-1">
                    PROCESSED SALARY
                  </p>
                </div>
                <div className="w-10 h-10 rounded-full bg-indigo-50 text-indigo-600 flex items-center justify-center group-hover:bg-indigo-600 group-hover:text-white transition-colors">
                  <FileText className="w-5 h-5" />
                </div>
              </CardHeader>
              <CardContent className="pt-5">
                <div className="flex justify-between items-end mb-4">
                  <p className="text-sm text-slate-500 font-medium">
                    Net Transfer
                  </p>
                  <p className="text-2xl font-black text-slate-900">
                    {formatCurrency(payslip.netSalary)}
                  </p>
                </div>

                <div className="flex justify-between items-center text-xs text-slate-500 mt-4 pt-4 border-t border-slate-100">
                  <span className="flex items-center">
                    <Calendar className="w-3.5 h-3.5 mr-1" />{" "}
                    {payslip.totalWorkingDays} Working Days
                  </span>
                  {payslip.unpaidLeaves > 0 && (
                    <span className="text-rose-500 font-medium">
                      {payslip.unpaidLeaves} LOP Days
                    </span>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* THE PRINTABLE PAYSLIP MODAL */}
      <Dialog
        open={!!selectedPayslip}
        onOpenChange={(open) => !open && setSelectedPayslip(null)}
      >
        <DialogContent className="max-h-[92vh] overflow-y-auto sm:max-w-3xl bg-white p-4 sm:p-6 custom-scrollbar">
          <DialogHeader className="print:hidden">
            <DialogTitle>Official Payslip</DialogTitle>
          </DialogHeader>

          {selectedPayslip && (
            <div
              className="p-4 sm:p-6 border border-slate-200 rounded-2xl mt-2 bg-white shadow-sm"
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
                    alt="Company Header"
                    className="w-full h-auto max-h-24 object-contain mx-auto mb-4"
                  />
                ) : (
                  <h2 className="text-2xl font-bold text-slate-900 uppercase tracking-widest">
                    {selectedPayslip.breakdown?.meta?.companyName ||
                      selectedPayslip.company?.name ||
                      "Company Name"}
                  </h2>
                )}
                <p className="text-slate-500 mt-1">
                  Payslip for the month of {getMonthName(selectedPayslip.month)}{" "}
                  {selectedPayslip.year}
                </p>
              </div>

              {/* Consolidated Employee Summary */}
              <div className="grid grid-cols-1 sm:grid-cols-2 print:grid-cols-2 gap-4 sm:gap-8 mb-8 text-sm border-b pb-6 border-slate-100">
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
                      <span className="text-rose-600 font-bold">
                        {selectedPayslip.unpaidLeaves}
                      </span>
                    </span>
                  </div>
                </div>
              </div>

              {/* Salary Breakdown Tables */}
              <div className="grid grid-cols-1 md:grid-cols-2 print:grid-cols-2 gap-6 mb-8">
                {/* EARNINGS */}
                <div className="border border-slate-200 rounded-xl overflow-hidden shadow-inner bg-slate-50/20">
                  <div className="bg-slate-50 p-3 border-b border-slate-200 font-bold text-slate-700 uppercase text-xs tracking-wider flex justify-between">
                    <span>Earnings</span>
                    <span>Amount</span>
                  </div>
                  <div className="p-3 border-b border-slate-200 flex justify-between text-sm">
                    <span className="text-slate-600">Basic</span>
                    <span className="font-medium text-slate-900">
                      {formatCurrency(
                        selectedPayslip.breakdown?.earnings?.basic || 0,
                      )}
                    </span>
                  </div>
                  <div className="p-3 border-b border-slate-200 flex justify-between text-sm">
                    <span className="text-slate-600">House Rent Allowance</span>
                    <span className="font-medium text-slate-900">
                      {formatCurrency(
                        selectedPayslip.breakdown?.earnings?.hra || 0,
                      )}
                    </span>
                  </div>
                  <div className="p-3 border-b border-slate-200 flex justify-between text-sm">
                    <span className="text-slate-600">Conveyance Allowance</span>
                    <span className="font-medium text-slate-900">
                      {formatCurrency(
                        selectedPayslip.breakdown?.earnings?.conveyance || 0,
                      )}
                    </span>
                  </div>
                  <div className="p-3 border-b border-slate-200 flex justify-between text-sm">
                    <span className="text-slate-600">Medical Allowance</span>
                    <span className="font-medium text-slate-900">
                      {formatCurrency(
                        selectedPayslip.breakdown?.earnings?.medical || 0,
                      )}
                    </span>
                  </div>
                  <div className="p-3 border-b border-slate-200 flex justify-between text-sm">
                    <span className="text-slate-600">Special Allowance</span>
                    <span className="font-medium text-slate-900">
                      {formatCurrency(
                        selectedPayslip.breakdown?.earnings?.special || 0,
                      )}
                    </span>
                  </div>

                  <div className="p-3 flex justify-between font-bold bg-slate-100/50">
                    <span className="text-slate-900">Total Earnings</span>
                    <span className="text-emerald-600">
                      {formatCurrency(
                        selectedPayslip.breakdown?.earnings?.total || 0,
                      )}
                    </span>
                  </div>
                </div>

                {/* DEDUCTIONS */}
                <div className="border border-slate-200 rounded-xl overflow-hidden shadow-inner bg-slate-50/20">
                  <div className="bg-slate-50 p-3 border-b border-slate-200 font-bold text-slate-700 uppercase text-xs tracking-wider flex justify-between">
                    <span>Deductions</span>
                    <span>Amount</span>
                  </div>
                  <div className="p-3 border-b border-slate-200 flex justify-between text-sm">
                    <span className="text-slate-600">EPF contribution</span>
                    <span className="font-medium text-slate-900">
                      {formatCurrency(
                        selectedPayslip.breakdown?.deductions?.pf || 0,
                      )}
                    </span>
                  </div>
                  <div className="p-3 border-b border-slate-200 flex justify-between text-sm">
                    <span className="text-slate-600">Income Tax</span>
                    <span className="font-medium text-slate-900">
                      {formatCurrency(
                        selectedPayslip.breakdown?.deductions?.tax || 0,
                      )}
                    </span>
                  </div>
                  <div className="p-3 border-b border-slate-200 flex justify-between text-sm">
                    <span className="text-slate-600">Professional Tax</span>
                    <span className="font-medium text-slate-900">
                      {formatCurrency(
                        selectedPayslip.breakdown?.deductions?.profTax || 0,
                      )}
                    </span>
                  </div>
                  <div className="p-3 border-b border-slate-200 flex justify-between text-sm">
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
                  {/* Empty Spacer to align with Earnings (hidden on mobile, shown on md+) */}
                  <div className="p-3 border-b border-slate-200 flex justify-between text-sm text-transparent select-none hidden md:flex print:flex">
                    Spacer
                  </div>

                  <div className="p-3 flex justify-between font-bold bg-slate-100/50">
                    <span className="text-slate-900">Total Deductions</span>
                    <span className="text-rose-600">
                      {formatCurrency(
                        selectedPayslip.breakdown?.deductions?.total || 0,
                      )}
                    </span>
                  </div>
                </div>
              </div>

              {/* Net Salary */}
              <div className="bg-indigo-50 border border-indigo-100 rounded-2xl p-6 flex flex-col sm:flex-row gap-4 justify-between sm:items-center">
                <div>
                  <p className="text-sm font-semibold text-indigo-950 uppercase tracking-wider">
                    Net Salary Payable
                  </p>
                  <p className="text-xs text-indigo-700 mt-1">
                    Total Earnings minus Total Deductions
                  </p>
                </div>
                <div className="text-3xl font-black text-indigo-800">
                  {formatCurrency(selectedPayslip.netSalary)}
                </div>
              </div>

              <div className="mt-8 text-center text-xs text-slate-400">
                This is a computer-generated document. No signature is required.
              </div>
            </div>
          )}

          <DialogFooter className="print:hidden mt-4 gap-2 flex-col sm:flex-row">
            <Button variant="outline" className="rounded-xl border-slate-200" onClick={() => setSelectedPayslip(null)}>
              Close
            </Button>
            <Button
              className="bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl shadow-sm"
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
