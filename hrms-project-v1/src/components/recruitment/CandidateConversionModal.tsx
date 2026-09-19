"use client";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import axios from "axios";
import Link from "next/link";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/components/ToastProvider";
import {
  UserCheck,
  CheckCircle2,
  Calendar,
  Building,
  Mail,
  Phone,
  ShieldCheck,
  Banknote,
  FileCheck,
  Sparkles,
  ArrowRight,
  AlertCircle,
  Loader2,
  Lock,
  CheckSquare,
  Users,
} from "lucide-react";

interface CandidateConversionModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  application: any;
  job: any;
  offer: any;
  onConverted?: (result: any) => void;
}

export function CandidateConversionModal({
  open,
  onOpenChange,
  application,
  job,
  offer,
  onConverted,
}: CandidateConversionModalProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000";

  // Find accepted version or latest
  const acceptedVersion =
    offer?.versions?.find((v: any) => v.status === "ACCEPTED") ||
    offer?.versions?.[0];

  const defaultJoiningDate = acceptedVersion?.joiningDate
    ? new Date(acceptedVersion.joiningDate).toISOString().split("T")[0]
    : "";

  const [joiningDate, setJoiningDate] = useState(defaultJoiningDate);
  const [notes, setNotes] = useState("");
  const [conversionResult, setConversionResult] = useState<any>(null);

  const { data: previewData } = useQuery({
    queryKey: ["conversion-preview", application?.id],
    queryFn: async () => {
      const res = await axios.get(
        `${apiUrl}/recruitment/applications/${application.id}/conversion-preview`,
        { withCredentials: true }
      );
      return res.data;
    },
    enabled: open && !!application?.id,
  });

  const convertMutation = useMutation({
    mutationFn: async () => {
      const payload: any = {};
      if (joiningDate) payload.joiningDate = new Date(joiningDate).toISOString();
      if (notes.trim()) payload.notes = notes.trim();

      const res = await axios.post(
        `${apiUrl}/recruitment/applications/${application.id}/convert`,
        payload,
        {
          headers: {
            Authorization: `Bearer ${localStorage.getItem("hrms_token")}`,
          },
        }
      );
      return res.data;
    },
    onSuccess: (data) => {
      setConversionResult(data);
      toast(
        `Candidate successfully onboarded! Assigned Employee Code ${data.employee.employeeCode}. Onboarding case provisioned.`,
        "success"
      );
      queryClient.invalidateQueries({ queryKey: ["applications"] });
      queryClient.invalidateQueries({ queryKey: ["application", application.id] });
      queryClient.invalidateQueries({ queryKey: ["requisitions"] });
      queryClient.invalidateQueries({ queryKey: ["jobRequisitions"] });
      queryClient.invalidateQueries({ queryKey: ["employees"] });
      queryClient.invalidateQueries({ queryKey: ["onboardingCases"] });
      if (onConverted) onConverted(data);
    },
    onError: (err: any) => {
      const msg =
        err.response?.data?.message ||
        "Failed to onboard candidate as employee.";
      toast(msg, "error");
    },
  });

  const handleClose = () => {
    if (conversionResult) {
      setConversionResult(null);
    }
    onOpenChange(false);
  };

  const candidate = application?.candidate || {};

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-center gap-2">
            <div className="h-9 w-9 rounded-full bg-emerald-500/15 flex items-center justify-center text-emerald-600">
              <UserCheck className="h-5 w-5" />
            </div>
            <div>
              <DialogTitle className="text-xl font-bold">
                {conversionResult
                  ? "Onboarding Commenced! 🎉"
                  : "Onboard as Employee"}
              </DialogTitle>
              <DialogDescription className="text-xs">
                {conversionResult
                  ? "Candidate has been converted into an Employee with payroll and onboarding case activated."
                  : "Review pre-flight provisioning: generate sequence ID, seed payroll, and initialize onboarding tasks."}
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        {conversionResult ? (
          // SUCCESS SCREEN
          <div className="space-y-5 py-4">
            <div className="rounded-xl border border-emerald-500/30 bg-emerald-500/10 p-5 text-center space-y-3">
              <div className="inline-flex h-14 w-14 items-center justify-center rounded-full bg-emerald-500 text-white shadow-lg shadow-emerald-500/30">
                <CheckCircle2 className="h-8 w-8" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-emerald-900 dark:text-emerald-100">
                  {conversionResult.employee.firstName}{" "}
                  {conversionResult.employee.lastName} is officially on the team!
                </h3>
                <p className="text-xs text-emerald-800 dark:text-emerald-300 mt-1">
                  Official Employee Code Assigned:
                </p>
                <div className="inline-block mt-2 font-mono text-xl font-black tracking-widest px-4 py-1.5 bg-background border border-emerald-500/40 rounded-lg text-emerald-600 shadow-sm">
                  {conversionResult.employee.employeeCode}
                </div>
              </div>
            </div>

            {/* Status & Modules Breakdown */}
            <div className="grid grid-cols-2 gap-3 text-xs">
              <div className="rounded-lg border bg-card p-3 space-y-1">
                <span className="text-muted-foreground font-semibold flex items-center gap-1.5">
                  <ShieldCheck className="h-3.5 w-3.5 text-blue-500" />
                  Employment Status
                </span>
                <p className="font-bold text-sm text-foreground flex items-center gap-1.5">
                  <Badge variant="outline" className="bg-blue-500/10 text-blue-600 font-bold">
                    ONBOARDING
                  </Badge>
                </p>
                <p className="text-[11px] text-muted-foreground">
                  Transitions to ACTIVE upon completion of verification tasks.
                </p>
              </div>

              <div className="rounded-lg border bg-card p-3 space-y-1">
                <span className="text-muted-foreground font-semibold flex items-center gap-1.5">
                  <Banknote className="h-3.5 w-3.5 text-emerald-500" />
                  Payroll Seeding
                </span>
                <p className="font-bold text-sm text-emerald-600">
                  Active Salary Structure
                </p>
                <p className="text-[11px] text-muted-foreground">
                  Seeded directly from accepted offer with 100% mathematical parity.
                </p>
              </div>

              <div className="rounded-lg border bg-card p-3 space-y-1">
                <span className="text-muted-foreground font-semibold flex items-center gap-1.5">
                  <CheckSquare className="h-3.5 w-3.5 text-purple-500" />
                  Onboarding Case
                </span>
                <p className="font-bold text-sm text-foreground">
                  Case ID: #{conversionResult.onboardingCase?.id?.slice(0, 8)}...
                </p>
                <p className="text-[11px] text-muted-foreground">
                  Department & statutory compliance tasks have been assigned.
                </p>
              </div>

              <div className="rounded-lg border bg-card p-3 space-y-1">
                <span className="text-muted-foreground font-semibold flex items-center gap-1.5">
                  <Mail className="h-3.5 w-3.5 text-amber-500" />
                  Portal Invitation
                </span>
                <p className="font-bold text-sm text-foreground">
                  Invitation Sent
                </p>
                <p className="text-[11px] text-muted-foreground">
                  Welcome email dispatched with one-time secure password setup link.
                </p>
              </div>
            </div>

            {/* Requisition Status */}
            {conversionResult.requisition && (
              <div className="rounded-lg border bg-muted/40 p-3 text-xs flex items-center justify-between">
                <span>
                  Requisition Openings:{" "}
                  <strong>
                    {conversionResult.requisition.newFilledCount} filled
                  </strong>
                </span>
                {conversionResult.requisition.isClosed && (
                  <Badge variant="outline" className="bg-slate-500/10 text-slate-700 font-bold">
                    Requisition Auto-Closed (Openings Met)
                  </Badge>
                )}
              </div>
            )}

            <DialogFooter className="flex items-center justify-between sm:justify-between gap-2 pt-2 border-t">
              <Button variant="outline" onClick={handleClose}>
                Done
              </Button>
              <div className="flex items-center gap-2">
                <Button asChild variant="outline">
                  <Link href="/workspace/employees">
                    <Users className="h-4 w-4 mr-1.5" />
                    Employee Directory
                  </Link>
                </Button>
                <Button asChild className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold">
                  <Link href="/workspace/onboarding">
                    Onboarding Hub
                    <ArrowRight className="h-4 w-4 ml-1.5" />
                  </Link>
                </Button>
              </div>
            </DialogFooter>
          </div>
        ) : (
          // PRE-FLIGHT REVIEW SCREEN
          <div className="space-y-4 py-2 text-sm">
            {/* Candidate & Position Identity Card */}
            <div className="rounded-xl border bg-card p-4 space-y-3">
              <div className="flex items-start justify-between">
                <div>
                  <h3 className="text-base font-bold text-foreground">
                    {candidate.firstName} {candidate.lastName}
                  </h3>
                  <div className="flex flex-wrap items-center gap-3 text-xs text-muted-foreground mt-1">
                    <span className="flex items-center gap-1">
                      <Mail className="h-3.5 w-3.5" /> {candidate.email}
                    </span>
                    {candidate.phone && (
                      <span className="flex items-center gap-1">
                        <Phone className="h-3.5 w-3.5" /> {candidate.phone}
                      </span>
                    )}
                  </div>
                </div>
                <Badge variant="outline" className="bg-emerald-600/15 text-emerald-700 border-emerald-500/30 font-bold">
                  Offer Accepted 🎉
                </Badge>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 pt-2 border-t text-xs">
                <div>
                  <span className="text-muted-foreground">Target Role:</span>
                  <p className="font-semibold text-foreground">{job?.title || "Position"}</p>
                </div>
                <div>
                  <span className="text-muted-foreground">Department:</span>
                  <p className="font-semibold text-foreground">{job?.department?.name || "General"}</p>
                </div>
                <div>
                  <span className="text-muted-foreground">Job Code:</span>
                  <p className="font-mono text-foreground">{job?.jobCode}</p>
                </div>
              </div>
            </div>

            {/* Compensation & Structure Snapshot */}
            {acceptedVersion && (
              <div className="rounded-xl border bg-muted/20 p-4 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
                    <Banknote className="h-3.5 w-3.5 text-emerald-600" />
                    Salary Structure Snapshot (100% Payroll Parity)
                  </span>
                  <Badge variant="outline" className="bg-emerald-50 text-emerald-700 border-emerald-300 font-mono text-[10px]">
                    Offer Version {acceptedVersion.version}
                  </Badge>
                </div>

                <div className="grid grid-cols-3 gap-2 pt-2 text-xs">
                  <div className="bg-background rounded-lg border p-2">
                    <span className="text-muted-foreground text-[11px]">Basic Monthly</span>
                    <p className="font-bold text-foreground">
                      ₹{acceptedVersion.basicSalary?.toLocaleString("en-IN")}
                    </p>
                  </div>
                  <div className="bg-background rounded-lg border p-2">
                    <span className="text-muted-foreground text-[11px]">Gross Monthly</span>
                    <p className="font-bold text-foreground">
                      ₹{acceptedVersion.grossMonthly?.toLocaleString("en-IN")}
                    </p>
                  </div>
                  <div className="bg-background rounded-lg border p-2">
                    <span className="text-muted-foreground text-[11px]">Net Monthly</span>
                    <p className="font-bold text-emerald-600">
                      ₹{acceptedVersion.netMonthly?.toLocaleString("en-IN")}
                    </p>
                  </div>
                </div>

                <div className="flex items-center justify-between text-xs pt-1 px-1">
                  <span className="text-muted-foreground">
                    Total Annual CTC (Cost to Company):
                  </span>
                  <strong className="font-bold text-foreground">
                    ₹{acceptedVersion.totalCtc?.toLocaleString("en-IN")}/yr
                  </strong>
                </div>
              </div>
            )}

            {/* Provisioning Actions Preview */}
            <div className="rounded-xl border border-blue-500/20 bg-blue-500/5 p-4 space-y-2.5 text-xs">
              <span className="font-bold text-blue-900 dark:text-blue-200 flex items-center gap-1.5">
                <Sparkles className="h-4 w-4 text-blue-600" />
                Automated Handover Pipeline
              </span>
              <ul className="space-y-1.5 text-muted-foreground pl-1">
                <li className="flex items-center gap-2">
                  <span className="h-1.5 w-1.5 rounded-full bg-blue-600" />
                  <span>
                    Generates official company Employee Code:{" "}
                    <strong className="font-mono text-foreground">
                      {previewData?.targetEmployeeCode || "Calculating..."}
                    </strong>
                    {previewData?.format && (
                      <span className="text-[11px] text-muted-foreground ml-1">
                        (Preset: {previewData.format})
                      </span>
                    )}
                  </span>
                </li>
                <li className="flex items-center gap-2">
                  <span className="h-1.5 w-1.5 rounded-full bg-blue-600" />
                  <span>
                    Sets initial employment status to{" "}
                    <strong className="text-foreground">ONBOARDING</strong> (account secured, no default passwords)
                  </span>
                </li>
                <li className="flex items-center gap-2">
                  <span className="h-1.5 w-1.5 rounded-full bg-blue-600" />
                  <span>
                    Seeds <strong className="text-foreground">SalaryStructure</strong> directly without manual re-entry
                  </span>
                </li>
                <li className="flex items-center gap-2">
                  <span className="h-1.5 w-1.5 rounded-full bg-blue-600" />
                  <span>
                    Generates <strong className="text-foreground">OnboardingCase</strong> with department/statutory checklist
                  </span>
                </li>
                <li className="flex items-center gap-2">
                  <span className="h-1.5 w-1.5 rounded-full bg-blue-600" />
                  <span>
                    Marks recruitment application as <strong className="text-foreground">HIRED</strong> and updates filled openings
                  </span>
                </li>
              </ul>
            </div>

            {/* Form Adjustments */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
              <div className="space-y-1.5">
                <Label htmlFor="joiningDate" className="text-xs font-semibold">
                  Confirmed Joining Date
                </Label>
                <Input
                  id="joiningDate"
                  type="date"
                  value={joiningDate}
                  onChange={(e) => setJoiningDate(e.target.value)}
                  className="h-9 text-xs"
                />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="notes" className="text-xs font-semibold">
                  Internal Conversion Notes (Optional)
                </Label>
                <Input
                  id="notes"
                  placeholder="e.g. Asset handover pre-approved by IT"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  className="h-9 text-xs"
                />
              </div>
            </div>

            <DialogFooter className="flex items-center justify-between sm:justify-between gap-2 pt-3 border-t">
              <Button
                variant="outline"
                onClick={handleClose}
                disabled={convertMutation.isPending}
              >
                Cancel
              </Button>
              <Button
                onClick={() => convertMutation.mutate()}
                disabled={convertMutation.isPending}
                className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold gap-2"
              >
                {convertMutation.isPending ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Provisioning Employee...
                  </>
                ) : (
                  <>
                    <UserCheck className="h-4 w-4" />
                    Confirm & Onboard Employee
                  </>
                )}
              </Button>
            </DialogFooter>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
