"use client";

import api, { API_BASE_URL } from "@/lib/api";

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
import { CardGridSkeleton } from "@/components/skeletons";
import { EmptyState } from "@/components/ui/empty-state";

export default function EmployeePayslipPage() {
  const [selectedPayslip, setSelectedPayslip] = useState<any>(null);

  const API_URL = API_BASE_URL;
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
    <div className="max-w-[1200px] mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8 space-y-8">
      {/* HEADER */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="type-large-title font-bold text-foreground tracking-tight flex items-center">
            <Banknote className="size-8 mr-3 text-primary stroke-[1.5]" />
            My Salary Slips
          </h1>
          <p className="type-subhead text-label-secondary mt-1">
            View and download your official monthly payslips.
          </p>
        </div>
      </div>

      {/* PAYSLIP GRID */}
      {isLoading ? (
        <CardGridSkeleton count={6} columns={3} showAvatar={false} />
      ) : payslips?.length === 0 ? (
        <EmptyState
          icon={FileText}
          title="No Payslips Available"
          description="Your payslips will appear here once processed and approved by HR."
        />
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
          {payslips?.map((payslip: any) => (
            <Card
              key={payslip.id}
              className="hover:scale-[1.01] transition-transform cursor-pointer group"
              onClick={() => setSelectedPayslip(payslip)}
            >
              <CardHeader className="pb-3 flex flex-row items-start justify-between space-y-0 border-b border-hairline border-separator/50">
                <div>
                  <CardTitle className="type-headline font-semibold text-foreground">
                    {getMonthName(payslip.month)} {payslip.year}
                  </CardTitle>
                  <p className="type-caption font-semibold text-label-secondary tracking-wider mt-1 uppercase">
                    Processed Salary
                  </p>
                </div>
                <div className="size-10 rounded-[12px] bg-primary/12 text-primary flex items-center justify-center transition-colors">
                  <FileText className="size-5 stroke-[1.5]" />
                </div>
              </CardHeader>
              <CardContent className="pt-4">
                <div className="flex justify-between items-end mb-4">
                  <p className="type-subhead text-label-secondary font-medium">
                    Net Transfer
                  </p>
                  <p className="type-title-1 font-bold text-foreground tabular-nums">
                    {formatCurrency(payslip.netSalary)}
                  </p>
                </div>

                <div className="flex justify-between items-center type-caption text-label-secondary pt-3 border-t border-hairline border-separator/40">
                  <span className="flex items-center">
                    <Calendar className="size-3.5 mr-1 stroke-[1.5]" />
                    {payslip.totalWorkingDays} Working Days
                  </span>
                  {payslip.unpaidLeaves > 0 && (
                    <span className="text-destructive font-medium tabular-nums">
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
        <DialogContent className="max-h-[92vh] overflow-y-auto sm:max-w-3xl bg-card p-4 sm:p-6 custom-scrollbar">
          <DialogHeader className="print:hidden">
            <DialogTitle className="type-title-2 font-semibold">Official Payslip</DialogTitle>
          </DialogHeader>

          {selectedPayslip && (
            <div
              className="p-4 sm:p-6 border border-hairline border-separator rounded-[16px] mt-2 bg-card apple-shadow-card"
              id="printable-payslip"
            >
              {/* Header */}
              <div className="text-center mb-6 border-b border-hairline border-separator pb-4">
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
                  <h2 className="type-title-2 font-bold text-foreground uppercase tracking-widest">
                    {selectedPayslip.breakdown?.meta?.companyName ||
                      selectedPayslip.company?.name ||
                      "Company Name"}
                  </h2>
                )}
                <p className="type-subhead text-label-secondary mt-1">
                  Payslip for the month of {getMonthName(selectedPayslip.month)}{" "}
                  {selectedPayslip.year}
                </p>
              </div>

              {/* Consolidated Employee Summary */}
              <div className="grid grid-cols-1 sm:grid-cols-2 print:grid-cols-2 gap-4 sm:gap-6 mb-6 text-sm border-b border-hairline border-separator/40 pb-4">
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-label-secondary">Employee Name:</span>{" "}
                    <span className="font-semibold text-foreground">
                      {selectedPayslip.employee?.firstName}{" "}
                      {selectedPayslip.employee?.lastName}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-label-secondary">Employee ID:</span>{" "}
                    <span className="font-semibold text-foreground tabular-nums">
                      {selectedPayslip.employee?.employeeCode || "N/A"}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-label-secondary">Designation:</span>{" "}
                    <span className="font-semibold text-foreground">
                      {selectedPayslip.employee?.designation ||
                        "Software Engineer"}
                    </span>
                  </div>
                </div>
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-label-secondary">PF A/C Number:</span>{" "}
                    <span className="font-semibold text-foreground tabular-nums">
                      {selectedPayslip.employee?.pfAccountNumber || "N/A"}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-label-secondary">UAN Number:</span>{" "}
                    <span className="font-semibold text-foreground tabular-nums">
                      {selectedPayslip.employee?.uanNumber || "N/A"}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-label-secondary">Paid Days / LOP:</span>{" "}
                    <span className="font-semibold text-foreground tabular-nums">
                      {selectedPayslip.presentDays} /{" "}
                      <span className="text-destructive font-bold tabular-nums">
                        {selectedPayslip.unpaidLeaves}
                      </span>
                    </span>
                  </div>
                </div>
              </div>

              {/* Salary Breakdown Tables */}
              <div className="grid grid-cols-1 md:grid-cols-2 print:grid-cols-2 gap-4 mb-6">
                {/* EARNINGS */}
                <div className="border border-hairline border-separator rounded-[12px] overflow-hidden bg-fill/20">
                  <div className="bg-fill/40 p-3 border-b border-hairline border-separator font-bold text-label-secondary uppercase text-[11px] tracking-wider flex justify-between">
                    <span>Earnings</span>
                    <span>Amount</span>
                  </div>
                  <div className="p-2.5 border-b border-hairline border-separator/40 flex justify-between text-[13px]">
                    <span className="text-label-secondary">Basic</span>
                    <span className="font-medium text-foreground tabular-nums">
                      {formatCurrency(
                        selectedPayslip.breakdown?.earnings?.basic || 0,
                      )}
                    </span>
                  </div>
                  <div className="p-2.5 border-b border-hairline border-separator/40 flex justify-between text-[13px]">
                    <span className="text-label-secondary">House Rent Allowance</span>
                    <span className="font-medium text-foreground tabular-nums">
                      {formatCurrency(
                        selectedPayslip.breakdown?.earnings?.hra || 0,
                      )}
                    </span>
                  </div>
                  <div className="p-2.5 border-b border-hairline border-separator/40 flex justify-between text-[13px]">
                    <span className="text-label-secondary">Conveyance Allowance</span>
                    <span className="font-medium text-foreground tabular-nums">
                      {formatCurrency(
                        selectedPayslip.breakdown?.earnings?.conveyance || 0,
                      )}
                    </span>
                  </div>
                  <div className="p-2.5 flex justify-between text-[13px]">
                    <span className="text-label-secondary">Medical Allowance</span>
                    <span className="font-medium text-foreground tabular-nums">
                      {formatCurrency(
                        selectedPayslip.breakdown?.earnings?.medical || 0,
                      )}
                    </span>
                  </div>
                </div>

                {/* DEDUCTIONS */}
                <div className="border border-hairline border-separator rounded-[12px] overflow-hidden bg-fill/20">
                  <div className="bg-fill/40 p-3 border-b border-hairline border-separator font-bold text-label-secondary uppercase text-[11px] tracking-wider flex justify-between">
                    <span>Deductions</span>
                    <span>Amount</span>
                  </div>
                  <div className="p-2.5 border-b border-hairline border-separator/40 flex justify-between text-[13px]">
                    <span className="text-label-secondary">Provident Fund (PF)</span>
                    <span className="font-medium text-destructive tabular-nums">
                      {formatCurrency(
                        selectedPayslip.breakdown?.deductions?.pf || 0,
                      )}
                    </span>
                  </div>
                  <div className="p-2.5 border-b border-hairline border-separator/40 flex justify-between text-[13px]">
                    <span className="text-label-secondary">Professional Tax</span>
                    <span className="font-medium text-destructive tabular-nums">
                      {formatCurrency(
                        selectedPayslip.breakdown?.deductions?.pt || 0,
                      )}
                    </span>
                  </div>
                  <div className="p-2.5 flex justify-between text-[13px]">
                    <span className="text-label-secondary">Income Tax (TDS)</span>
                    <span className="font-medium text-destructive tabular-nums">
                      {formatCurrency(
                        selectedPayslip.breakdown?.deductions?.tds || 0,
                      )}
                    </span>
                  </div>
                </div>
              </div>

              {/* Net Pay Highlight Banner */}
              <div className="p-4 rounded-[12px] bg-primary/10 border border-hairline border-primary/20 flex justify-between items-center">
                <span className="type-headline font-semibold text-foreground">Net Payable Salary:</span>
                <span className="type-title-1 font-bold text-primary tabular-nums">
                  {formatCurrency(selectedPayslip.netSalary)}
                </span>
              </div>
            </div>
          )}

          <DialogFooter className="mt-4 print:hidden">
            <Button
              variant="default"
              size="default"
              onClick={() => window.print()}
              className="gap-2"
            >
              <Download className="size-4 stroke-[1.5]" /> Print / Download PDF
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
