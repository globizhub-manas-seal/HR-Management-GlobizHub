"use client";

import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import axios from "axios";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import {
  Loader2,
  Banknote,
  Calendar,
  AlertTriangle,
  CheckCircle2,
  Sparkles,
  Building2,
  Briefcase,
  User,
  Clock,
  ShieldCheck,
} from "lucide-react";
import { useToast } from "@/components/ToastProvider";

interface CreateOfferModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  application: any;
  existingOffer?: any; // If revising
  onSuccess?: () => void;
}

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000";

export function CreateOfferModal({
  open,
  onOpenChange,
  application,
  existingOffer,
  onSuccess,
}: CreateOfferModalProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const isRevision = !!existingOffer;
  const latestVersionData = existingOffer?.versions?.[0] || null;

  // Compensation States
  const [targetAnnualCtc, setTargetAnnualCtc] = useState<number>(1200000);
  const [basicSalary, setBasicSalary] = useState<number>(50000);
  const [hra, setHra] = useState<number>(20000);
  const [conveyanceAllowance, setConveyanceAllowance] = useState<number>(1600);
  const [medicalAllowance, setMedicalAllowance] = useState<number>(1250);
  const [specialAllowance, setSpecialAllowance] = useState<number>(27150);
  const [otherAllowances, setOtherAllowances] = useState<number>(0);

  const [pfContribution, setPfContribution] = useState<number>(6000);
  const [professionalTax, setProfessionalTax] = useState<number>(200);
  const [taxDeduction, setTaxDeduction] = useState<number>(0);

  const [annualPerformanceBonus, setAnnualPerformanceBonus] = useState<number>(0);
  const [joiningBonus, setJoiningBonus] = useState<number>(0);

  // Terms States
  const [joiningDate, setJoiningDate] = useState<string>("");
  const [expiryDate, setExpiryDate] = useState<string>("");
  const [probationMonths, setProbationMonths] = useState<number>(3);
  const [noticePeriodDays, setNoticePeriodDays] = useState<number>(30);
  const [reportingManagerId, setReportingManagerId] = useState<string>("");
  const [workplaceType, setWorkplaceType] = useState<string>("ON_SITE");
  const [termsAndConditions, setTermsAndConditions] = useState<string>(
    "1. This offer is contingent upon successful reference and background verification.\n2. Standard working hours and company code of conduct apply.\n3. Intellectual property created during employment belongs solely to the organization."
  );

  // Revision & Exception States
  const [revisionReason, setRevisionReason] = useState<string>("");
  const [budgetJustification, setBudgetJustification] = useState<string>("");

  const getToken = () =>
    typeof window !== "undefined" ? localStorage.getItem("hrms_token") : null;

  // Initialize dates and existing values
  useEffect(() => {
    if (open) {
      const today = new Date();
      const defaultJoining = new Date(today);
      defaultJoining.setDate(today.getDate() + 30);
      const defaultExpiry = new Date(today);
      defaultExpiry.setDate(today.getDate() + 7);

      setJoiningDate(defaultJoining.toISOString().split("T")[0]);
      setExpiryDate(defaultExpiry.toISOString().split("T")[0]);

      if (latestVersionData) {
        setBasicSalary(latestVersionData.basicSalary || 0);
        setHra(latestVersionData.hra || 0);
        setConveyanceAllowance(latestVersionData.conveyanceAllowance || 0);
        setMedicalAllowance(latestVersionData.medicalAllowance || 0);
        setSpecialAllowance(latestVersionData.specialAllowance || 0);
        setOtherAllowances(latestVersionData.otherAllowances || 0);
        setPfContribution(latestVersionData.pfContribution || 0);
        setProfessionalTax(latestVersionData.professionalTax || 0);
        setTaxDeduction(latestVersionData.taxDeduction || 0);
        setAnnualPerformanceBonus(latestVersionData.annualPerformanceBonus || 0);
        setJoiningBonus(latestVersionData.joiningBonus || 0);
        setTargetAnnualCtc(latestVersionData.totalCtc || 0);
        if (latestVersionData.joiningDate) {
          setJoiningDate(new Date(latestVersionData.joiningDate).toISOString().split("T")[0]);
        }
        if (latestVersionData.expiryDate) {
          setExpiryDate(new Date(latestVersionData.expiryDate).toISOString().split("T")[0]);
        }
        setProbationMonths(latestVersionData.probationDurationMonths || 3);
        setNoticePeriodDays(latestVersionData.noticePeriodDays || 30);
        setReportingManagerId(latestVersionData.reportingManagerId || "");
        setWorkplaceType(latestVersionData.workplaceType || "ON_SITE");
        setBudgetJustification(latestVersionData.budgetJustification || "");
        setRevisionReason("");
      } else {
        // Initial defaults using standard proportions for 12 LPA
        suggestProportions(1200000, 0, 0);
      }
    }
  }, [open, existingOffer]);

  // Fetch Potential Reporting Managers (Employees)
  const { data: managers } = useQuery({
    queryKey: ["companyEmployeesList"],
    queryFn: async () => {
      const res = await axios.get(`${API_URL}/employee`, {
        headers: { Authorization: `Bearer ${getToken()}` },
      });
      return res.data || [];
    },
    enabled: open,
  });

  // Reconciled Financial Math
  const computedGrossMonthly =
    basicSalary +
    hra +
    conveyanceAllowance +
    medicalAllowance +
    specialAllowance +
    otherAllowances;

  const computedTotalDeductions = pfContribution + professionalTax + taxDeduction;
  const computedNetMonthly = computedGrossMonthly - computedTotalDeductions;
  const computedAnnualBaseSalary = basicSalary * 12;
  const computedAnnualGross = computedGrossMonthly * 12;
  const computedTotalCtc =
    computedAnnualGross + annualPerformanceBonus + joiningBonus;

  // Budget comparison against requisition
  const reqSalaryMin = application?.jobRequisition?.salaryMin
    ? Number(application.jobRequisition.salaryMin)
    : null;
  const reqSalaryMax = application?.jobRequisition?.salaryMax
    ? Number(application.jobRequisition.salaryMax)
    : null;

  const isAboveBudget = reqSalaryMax ? computedTotalCtc > reqSalaryMax : false;

  // "Suggest Standard Proportions" helper
  function suggestProportions(targetCtc: number, perfBonus: number, joinBonus: number) {
    const annualBaseOutflow = Math.max(0, targetCtc - perfBonus - joinBonus);
    const targetMonthlyGross = Math.round(annualBaseOutflow / 12);

    const basic = Math.round(targetMonthlyGross * 0.5);
    const calculatedHra = Math.round(basic * 0.4);
    const conveyance = 1600;
    const medical = 1250;
    const special = Math.max(0, targetMonthlyGross - (basic + calculatedHra + conveyance + medical));
    const pf = Math.round(basic * 0.12);
    const pt = 200;

    setBasicSalary(basic);
    setHra(calculatedHra);
    setConveyanceAllowance(conveyance);
    setMedicalAllowance(medical);
    setSpecialAllowance(special);
    setOtherAllowances(0);
    setPfContribution(pf);
    setProfessionalTax(pt);
  }

  // Handle Quick Target CTC Apply
  const handleApplyTargetCtc = () => {
    if (!targetAnnualCtc || targetAnnualCtc <= 0) return;
    suggestProportions(targetAnnualCtc, annualPerformanceBonus, joiningBonus);
    toast(`Structured monthly breakdown for ₹${targetAnnualCtc.toLocaleString()} Annual CTC`, "success");
  };

  // Mutation to Create or Revise Offer
  const offerMutation = useMutation({
    mutationFn: async () => {
      const payload: any = {
        basicSalary,
        hra,
        conveyanceAllowance,
        medicalAllowance,
        specialAllowance,
        otherAllowances,
        grossMonthly: computedGrossMonthly,
        pfContribution,
        taxDeduction,
        professionalTax,
        netMonthly: computedNetMonthly,
        annualBaseSalary: computedAnnualBaseSalary,
        annualGross: computedAnnualGross,
        annualPerformanceBonus,
        joiningBonus,
        totalCtc: computedTotalCtc,
        isBudgetException: isAboveBudget,
        budgetJustification: isAboveBudget ? budgetJustification : undefined,
        departmentId: application.jobRequisition?.departmentId,
        designationId: application.jobRequisition?.designationId,
        joiningDate: new Date(joiningDate).toISOString(),
        expiryDate: new Date(expiryDate).toISOString(),
        probationDurationMonths: probationMonths,
        noticePeriodDays,
        reportingManagerId: reportingManagerId || undefined,
        workplaceType,
        termsAndConditions,
      };

      if (isRevision) {
        if (!revisionReason.trim()) {
          throw new Error("A revision reason is required when creating a new version.");
        }
        payload.revisionReason = revisionReason;
        const res = await axios.post(
          `${API_URL}/recruitment/offers/${existingOffer.id}/revise`,
          payload,
          { headers: { Authorization: `Bearer ${getToken()}` } }
        );
        return res.data;
      } else {
        const res = await axios.post(
          `${API_URL}/recruitment/applications/${application.id}/offer`,
          payload,
          { headers: { Authorization: `Bearer ${getToken()}` } }
        );
        return res.data;
      }
    },
    onSuccess: (data) => {
      toast(
        isRevision
          ? `Offer revised to version ${data.currentVersion} saved as draft.`
          : `Offer ${data.offerCode} created successfully.`,
        "success"
      );
      queryClient.invalidateQueries({ queryKey: ["candidateOffer", application?.id] });
      queryClient.invalidateQueries({ queryKey: ["candidateTimeline", application?.id] });
      queryClient.invalidateQueries({ queryKey: ["jobApplications"] });
      onSuccess?.();
      onOpenChange(false);
    },
    onError: (err: any) => {
      toast(
        err.response?.data?.message || err.message || "Failed to save offer",
        "error"
      );
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!joiningDate || !expiryDate) {
      toast("Please provide both Expected Joining Date and Offer Expiry Date", "error");
      return;
    }
    if (new Date(expiryDate) <= new Date()) {
      toast("Offer Expiry Date must be in the future", "error");
      return;
    }
    if (isAboveBudget && !budgetJustification.trim()) {
      toast(`Proposed CTC exceeds requisition max (₹${reqSalaryMax?.toLocaleString()}). A budget justification is required.`, "error");
      return;
    }
    if (isRevision && !revisionReason.trim()) {
      toast("Please specify why this offer is being revised.", "error");
      return;
    }

    offerMutation.mutate();
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-6xl max-h-[92vh] overflow-y-auto p-0 gap-0 border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 shadow-2xl rounded-2xl">
        <DialogHeader className="p-6 pb-4 border-b border-slate-100 dark:border-slate-800/80 bg-slate-50/50 dark:bg-slate-900/40">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-600 dark:text-indigo-400">
                <Banknote className="h-5 w-5" />
              </div>
              <div>
                <DialogTitle className="text-xl font-bold text-slate-900 dark:text-slate-50 flex items-center gap-2">
                  {isRevision
                    ? `Revise Job Offer — Version ${existingOffer?.currentVersion + 1}`
                    : "Formulate Job Offer & CTC"}
                  {isRevision && (
                    <Badge variant="outline" className="bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-400 border-amber-300">
                      Revision
                    </Badge>
                  )}
                </DialogTitle>
                <DialogDescription className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                  Candidate:{" "}
                  <span className="font-semibold text-slate-700 dark:text-slate-300">
                    {application?.candidate?.firstName} {application?.candidate?.lastName}
                  </span>{" "}
                  • Role:{" "}
                  <span className="font-semibold text-slate-700 dark:text-slate-300">
                    {application?.jobRequisition?.title}
                  </span>
                </DialogDescription>
              </div>
            </div>

            {/* Requisition Approved Budget Tag */}
            {reqSalaryMax && (
              <div className="text-right">
                <span className="text-[11px] font-medium text-slate-400 block uppercase tracking-wider">
                  Requisition Band
                </span>
                <span className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                  ₹{(reqSalaryMin || 0).toLocaleString()} – ₹{reqSalaryMax.toLocaleString()}
                </span>
              </div>
            )}
          </div>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {/* Quick Target CTC Calculator Bar */}
          <div className="p-4 rounded-xl border border-indigo-100 dark:border-indigo-950/60 bg-gradient-to-r from-indigo-50/50 via-white to-violet-50/40 dark:from-indigo-950/20 dark:via-slate-900 dark:to-violet-950/20">
            <div className="flex flex-col md:flex-row md:items-end gap-3">
              <div className="flex-1 space-y-1">
                <label className="text-xs font-semibold text-slate-700 dark:text-slate-200 flex items-center gap-1.5">
                  <Sparkles className="h-3.5 w-3.5 text-indigo-500" />
                  Target Annual CTC (₹)
                </label>
                <Input
                  type="number"
                  min="0"
                  step="10000"
                  value={targetAnnualCtc}
                  onChange={(e) => setTargetAnnualCtc(Number(e.target.value))}
                  placeholder="e.g. 1200000"
                  className="font-mono text-sm bg-white dark:bg-slate-900 font-semibold"
                />
              </div>
              <Button
                type="button"
                variant="outline"
                onClick={handleApplyTargetCtc}
                className="border-indigo-200 dark:border-indigo-800 text-indigo-600 dark:text-indigo-400 hover:bg-indigo-50 dark:hover:bg-indigo-950/50 h-9 text-xs font-semibold shrink-0"
              >
                <Sparkles className="h-3.5 w-3.5 mr-1.5" />
                Suggest Proportions
              </Button>
            </div>
            <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-2">
              Populates monthly earnings (50% Basic, 40% HRA, standard travel/medical) and deductions (12% PF, PT) matching company payroll structure. You can customize any line item below.
            </p>
          </div>

          {/* Revision Reason (If revision mode) */}
          {isRevision && (
            <div className="p-4 rounded-xl border border-amber-200 dark:border-amber-900/60 bg-amber-50/40 dark:bg-amber-950/20 space-y-1.5">
              <label className="text-xs font-semibold text-amber-900 dark:text-amber-300 flex items-center gap-1.5">
                <AlertTriangle className="h-3.5 w-3.5 text-amber-600" />
                Revision Justification <span className="text-red-500">*</span>
              </label>
              <Textarea
                rows={2}
                required
                value={revisionReason}
                onChange={(e) => setRevisionReason(e.target.value)}
                placeholder="Explain why this revision is being formulated (e.g. Candidate counter-proposal of ₹14 LPA, revised variable bonus band)..."
                className="text-xs bg-white dark:bg-slate-900 border-amber-300 dark:border-amber-800"
              />
            </div>
          )}

          {/* Budget Overrun Warning & Exception Justification */}
          {isAboveBudget && (
            <div className="p-4 rounded-xl border border-rose-200 dark:border-rose-900/60 bg-rose-50/40 dark:bg-rose-950/20 space-y-2">
              <div className="flex items-center gap-2 text-rose-700 dark:text-rose-400 font-semibold text-xs">
                <AlertTriangle className="h-4 w-4 shrink-0 text-rose-600" />
                <span>⚠️ Proposed CTC (₹{computedTotalCtc.toLocaleString()}) exceeds requisition maximum of ₹{reqSalaryMax?.toLocaleString()}</span>
              </div>
              <p className="text-[11px] text-rose-600 dark:text-rose-400">
                This offer will require explicit budget exception approval by the HR Head. Please provide a written justification below.
              </p>
              <Textarea
                rows={2}
                required
                value={budgetJustification}
                onChange={(e) => setBudgetJustification(e.target.value)}
                placeholder="Candidate possesses specialized architecture skills and 6 years domain expertise; exception requested..."
                className="text-xs bg-white dark:bg-slate-900 border-rose-300 dark:border-rose-800"
              />
            </div>
          )}

          {/* Section: Monthly Earnings & Deductions Breakdown */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Monthly Earnings (Parity with SalaryStructure) */}
            <div className="space-y-3 p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/30 dark:bg-slate-900/30">
              <div className="flex items-center justify-between pb-2 border-b border-slate-100 dark:border-slate-800">
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-900 dark:text-slate-100 flex items-center gap-1.5">
                  <Building2 className="h-3.5 w-3.5 text-indigo-500" />
                  Monthly Earnings
                </h4>
                <span className="text-xs font-mono font-bold text-indigo-600 dark:text-indigo-400">
                  Gross: ₹{computedGrossMonthly.toLocaleString()}
                </span>
              </div>

              <div className="space-y-2 text-xs">
                <div className="grid grid-cols-2 items-center gap-2">
                  <label className="text-slate-600 dark:text-slate-400">Basic Salary</label>
                  <Input
                    type="number"
                    min="0"
                    value={basicSalary}
                    onChange={(e) => setBasicSalary(Number(e.target.value))}
                    className="h-8 text-xs font-mono text-right"
                  />
                </div>
                <div className="grid grid-cols-2 items-center gap-2">
                  <label className="text-slate-600 dark:text-slate-400">HRA</label>
                  <Input
                    type="number"
                    min="0"
                    value={hra}
                    onChange={(e) => setHra(Number(e.target.value))}
                    className="h-8 text-xs font-mono text-right"
                  />
                </div>
                <div className="grid grid-cols-2 items-center gap-2">
                  <label className="text-slate-600 dark:text-slate-400">Conveyance Allowance</label>
                  <Input
                    type="number"
                    min="0"
                    value={conveyanceAllowance}
                    onChange={(e) => setConveyanceAllowance(Number(e.target.value))}
                    className="h-8 text-xs font-mono text-right"
                  />
                </div>
                <div className="grid grid-cols-2 items-center gap-2">
                  <label className="text-slate-600 dark:text-slate-400">Medical Allowance</label>
                  <Input
                    type="number"
                    min="0"
                    value={medicalAllowance}
                    onChange={(e) => setMedicalAllowance(Number(e.target.value))}
                    className="h-8 text-xs font-mono text-right"
                  />
                </div>
                <div className="grid grid-cols-2 items-center gap-2">
                  <label className="text-slate-600 dark:text-slate-400">Special Allowance</label>
                  <Input
                    type="number"
                    min="0"
                    value={specialAllowance}
                    onChange={(e) => setSpecialAllowance(Number(e.target.value))}
                    className="h-8 text-xs font-mono text-right"
                  />
                </div>
                <div className="grid grid-cols-2 items-center gap-2">
                  <label className="text-slate-600 dark:text-slate-400">Other Allowances</label>
                  <Input
                    type="number"
                    min="0"
                    value={otherAllowances}
                    onChange={(e) => setOtherAllowances(Number(e.target.value))}
                    className="h-8 text-xs font-mono text-right"
                  />
                </div>
              </div>
            </div>

            {/* Monthly Deductions & Net Salary */}
            <div className="space-y-3 p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/30 dark:bg-slate-900/30">
              <div className="flex items-center justify-between pb-2 border-b border-slate-100 dark:border-slate-800">
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-900 dark:text-slate-100 flex items-center gap-1.5">
                  <ShieldCheck className="h-3.5 w-3.5 text-rose-500" />
                  Monthly Deductions
                </h4>
                <span className="text-xs font-mono font-bold text-rose-600 dark:text-rose-400">
                  Total: ₹{computedTotalDeductions.toLocaleString()}
                </span>
              </div>

              <div className="space-y-2 text-xs">
                <div className="grid grid-cols-2 items-center gap-2">
                  <label className="text-slate-600 dark:text-slate-400">PF Employee Contribution</label>
                  <Input
                    type="number"
                    min="0"
                    value={pfContribution}
                    onChange={(e) => setPfContribution(Number(e.target.value))}
                    className="h-8 text-xs font-mono text-right"
                  />
                </div>
                <div className="grid grid-cols-2 items-center gap-2">
                  <label className="text-slate-600 dark:text-slate-400">Professional Tax</label>
                  <Input
                    type="number"
                    min="0"
                    value={professionalTax}
                    onChange={(e) => setProfessionalTax(Number(e.target.value))}
                    className="h-8 text-xs font-mono text-right"
                  />
                </div>
                <div className="grid grid-cols-2 items-center gap-2">
                  <label className="text-slate-600 dark:text-slate-400">Tax / TDS Deduction</label>
                  <Input
                    type="number"
                    min="0"
                    value={taxDeduction}
                    onChange={(e) => setTaxDeduction(Number(e.target.value))}
                    className="h-8 text-xs font-mono text-right"
                  />
                </div>

                {/* Net Take-Home Highlight Card */}
                <div className="mt-4 p-3 rounded-lg bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-between">
                  <span className="text-xs font-semibold text-emerald-800 dark:text-emerald-300">
                    Net Monthly In-Hand:
                  </span>
                  <span className="text-sm font-mono font-bold text-emerald-700 dark:text-emerald-400">
                    ₹{computedNetMonthly.toLocaleString()}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Section: Annual Incentives & Total CTC */}
          <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50 space-y-3">
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-900 dark:text-slate-100 flex items-center gap-1.5">
              <Briefcase className="h-3.5 w-3.5 text-indigo-500" />
              Annual Incentives & Total Cost To Company (CTC)
            </h4>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="space-y-1">
                <label className="text-xs text-slate-600 dark:text-slate-400">Annual Gross (12 × Gross)</label>
                <Input
                  type="text"
                  disabled
                  value={`₹${computedAnnualGross.toLocaleString()}`}
                  className="h-8 text-xs font-mono font-semibold bg-slate-100 dark:bg-slate-800"
                />
              </div>
              <div className="space-y-1">
                <label className="text-xs text-slate-600 dark:text-slate-400">Annual Performance Bonus (₹)</label>
                <Input
                  type="number"
                  min="0"
                  value={annualPerformanceBonus}
                  onChange={(e) => setAnnualPerformanceBonus(Number(e.target.value))}
                  className="h-8 text-xs font-mono"
                />
              </div>
              <div className="space-y-1">
                <label className="text-xs text-slate-600 dark:text-slate-400">Joining / Sign-on Bonus (₹)</label>
                <Input
                  type="number"
                  min="0"
                  value={joiningBonus}
                  onChange={(e) => setJoiningBonus(Number(e.target.value))}
                  className="h-8 text-xs font-mono"
                />
              </div>
            </div>

            {/* Total Annual CTC Banner */}
            <div className="mt-2 p-3 rounded-xl bg-slate-900 text-white dark:bg-slate-900 flex items-center justify-between">
              <div>
                <span className="text-[11px] uppercase tracking-wider text-slate-400 block">
                  Total Annual CTC
                </span>
                <span className="text-lg font-bold font-mono text-emerald-400">
                  ₹{computedTotalCtc.toLocaleString()}
                </span>
              </div>
              <div className="text-right">
                <span className="text-[11px] text-slate-400 block">Annual Base Salary</span>
                <span className="text-sm font-semibold font-mono text-slate-200">
                  ₹{computedAnnualBaseSalary.toLocaleString()}
                </span>
              </div>
            </div>
          </div>

          {/* Section: Offer Terms & Details */}
          <div className="space-y-3 p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/30 dark:bg-slate-900/30">
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-900 dark:text-slate-100 flex items-center gap-1.5">
              <Clock className="h-3.5 w-3.5 text-indigo-500" />
              Employment Terms & Governance
            </h4>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="space-y-1">
                <label className="text-xs font-medium text-slate-700 dark:text-slate-300">
                  Expected Joining Date <span className="text-red-500">*</span>
                </label>
                <Input
                  type="date"
                  required
                  value={joiningDate}
                  onChange={(e) => setJoiningDate(e.target.value)}
                  className="h-8 text-xs"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-medium text-slate-700 dark:text-slate-300">
                  Offer Expiry Date <span className="text-red-500">*</span>
                </label>
                <Input
                  type="date"
                  required
                  value={expiryDate}
                  onChange={(e) => setExpiryDate(e.target.value)}
                  className="h-8 text-xs"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-medium text-slate-700 dark:text-slate-300">
                  Workplace Type
                </label>
                <Select value={workplaceType} onValueChange={(val) => val && setWorkplaceType(val)}>
                  <SelectTrigger className="h-8 text-xs">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="ON_SITE">On-Site (Office)</SelectItem>
                    <SelectItem value="HYBRID">Hybrid</SelectItem>
                    <SelectItem value="REMOTE">Remote</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="space-y-1">
                <label className="text-xs font-medium text-slate-700 dark:text-slate-300">
                  Probation Period (Months)
                </label>
                <Input
                  type="number"
                  min="0"
                  max="12"
                  value={probationMonths}
                  onChange={(e) => setProbationMonths(Number(e.target.value))}
                  className="h-8 text-xs"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-medium text-slate-700 dark:text-slate-300">
                  Notice Period (Days)
                </label>
                <Input
                  type="number"
                  min="0"
                  value={noticePeriodDays}
                  onChange={(e) => setNoticePeriodDays(Number(e.target.value))}
                  className="h-8 text-xs"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-medium text-slate-700 dark:text-slate-300">
                  Reporting Manager
                </label>
                <Select
                  value={reportingManagerId}
                  onValueChange={(val) => val && setReportingManagerId(val)}
                >
                  <SelectTrigger className="h-8 text-xs">
                    <SelectValue placeholder="Select Manager" />
                  </SelectTrigger>
                  <SelectContent>
                    {managers?.map((m: any) => (
                      <SelectItem key={m.id} value={m.id}>
                        {m.firstName} {m.lastName} ({m.email})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-1 pt-1">
              <label className="text-xs font-medium text-slate-700 dark:text-slate-300">
                Terms & Conditions / Special Covenants
              </label>
              <Textarea
                rows={3}
                value={termsAndConditions}
                onChange={(e) => setTermsAndConditions(e.target.value)}
                className="text-xs font-mono"
              />
            </div>
          </div>

          <DialogFooter className="pt-2 border-t border-slate-100 dark:border-slate-800">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              className="text-xs"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={offerMutation.isPending}
              className="bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold px-5"
            >
              {offerMutation.isPending && (
                <Loader2 className="h-3.5 w-3.5 mr-2 animate-spin" />
              )}
              {isRevision ? "Save & Create Version" : "Save Offer Draft"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
