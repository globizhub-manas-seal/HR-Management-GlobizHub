"use client";

import { useState, useEffect } from "react";
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
  Briefcase,
  Plus,
  Trash2,
  HelpCircle,
  Sparkles,
  Building,
  CheckCircle2,
  AlertCircle,
} from "lucide-react";
import { useToast } from "@/components/ToastProvider";

interface CreateJobModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
  preselectedManpowerReq?: any;
  isHrOrAdmin: boolean;
}

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000";

interface ScreeningQuestion {
  id: string;
  question: string;
  type: "YES_NO" | "NUMBER" | "MULTIPLE_CHOICE" | "TEXT";
  required: boolean;
  options?: string[];
}

export function CreateJobModal({
  open,
  onOpenChange,
  onSuccess,
  preselectedManpowerReq,
  isHrOrAdmin,
}: CreateJobModalProps) {
  const { toast } = useToast();
  const [mode, setMode] = useState<"MANPOWER" | "DIRECT">("MANPOWER");
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Dropdowns
  const [approvedRequisitions, setApprovedRequisitions] = useState<any[]>([]);
  const [departments, setDepartments] = useState<any[]>([]);
  const [designations, setDesignations] = useState<any[]>([]);

  // Selected Requisition
  const [selectedReqId, setSelectedReqId] = useState<string>("");

  // Form
  const [formData, setFormData] = useState({
    title: "",
    departmentId: "",
    designationId: "",
    location: "",
    workplaceType: "ON_SITE",
    employmentType: "FULL_TIME",
    openings: 1,
    description: "",
    responsibilities: "",
    requirements: "",
    skills: [] as string[],
    salaryMin: "",
    salaryMax: "",
    showSalaryRange: false,
    applicationDeadline: "",
    directHiringReason: "DIRECT_HIRE",
    directHiringJustification: "",
  });

  const [skillInput, setSkillInput] = useState("");
  const [questions, setQuestions] = useState<ScreeningQuestion[]>([]);

  const getToken = () => (typeof window !== "undefined" ? localStorage.getItem("hrms_token") : null);

  useEffect(() => {
    if (open) {
      const headers = { Authorization: `Bearer ${getToken()}` };

      // Load approved requisitions
      axios
        .get(`${API_URL}/recruitment/manpower?status=APPROVED`, { headers })
        .then((res) => setApprovedRequisitions(res.data || []))
        .catch(() => {});

      axios
        .get(`${API_URL}/organization/departments`, { headers })
        .then((res) => setDepartments(res.data || []))
        .catch(() => {});

      axios
        .get(`${API_URL}/organization/designations`, { headers })
        .then((res) => setDesignations(res.data || []))
        .catch(() => {});

      if (preselectedManpowerReq) {
        setMode("MANPOWER");
        setSelectedReqId(preselectedManpowerReq.id);
        populateFromManpower(preselectedManpowerReq);
      } else {
        setMode("MANPOWER");
        setSelectedReqId("");
        resetForm();
      }
    }
  }, [open, preselectedManpowerReq]);

  const populateFromManpower = (mReq: any) => {
    setFormData({
      title: `${mReq.designation?.name || "Position"}`,
      departmentId: mReq.departmentId,
      designationId: mReq.designationId,
      location: mReq.location || "Guwahati",
      workplaceType: "ON_SITE",
      employmentType: mReq.employmentType || "FULL_TIME",
      openings: mReq.positionsCount || 1,
      description: `We are looking for a motivated and talented ${mReq.designation?.name} to join our ${mReq.department?.name} team.`,
      responsibilities: `• Design, develop, and maintain high quality software solutions.\n• Collaborate with cross-functional teams to define requirements.\n• Troubleshoot, test, and maintain core application logic.`,
      requirements: `• Minimum ${mReq.minExperienceYears || 0} years of relevant industry experience.\n• Strong problem solving and communication skills.\n• Relevant education in Computer Science or related domain.`,
      skills: mReq.requiredSkills || [],
      salaryMin: mReq.minSalary ? String(mReq.minSalary) : "",
      salaryMax: mReq.maxSalary ? String(mReq.maxSalary) : "",
      showSalaryRange: true,
      applicationDeadline: mReq.expectedJoiningDate ? mReq.expectedJoiningDate.split("T")[0] : "",
      directHiringReason: "DIRECT_HIRE",
      directHiringJustification: "",
    });

    // Default screening questions
    setQuestions([
      {
        id: "q1",
        question: `Do you have ${mReq.minExperienceYears || 1}+ years of relevant experience in this domain?`,
        type: "YES_NO",
        required: true,
      },
      {
        id: "q2",
        question: "What is your official notice period (in days)?",
        type: "NUMBER",
        required: true,
      },
      {
        id: "q3",
        question: "Are you comfortable with the specified work location and schedule?",
        type: "YES_NO",
        required: true,
      },
    ]);
  };

  const resetForm = () => {
    setFormData({
      title: "",
      departmentId: "",
      designationId: "",
      location: "",
      workplaceType: "ON_SITE",
      employmentType: "FULL_TIME",
      openings: 1,
      description: "",
      responsibilities: "",
      requirements: "",
      skills: [],
      salaryMin: "",
      salaryMax: "",
      showSalaryRange: false,
      applicationDeadline: "",
      directHiringReason: "DIRECT_HIRE",
      directHiringJustification: "",
    });
    setQuestions([]);
  };

  const handleSelectRequisition = (reqId: string) => {
    setSelectedReqId(reqId);
    const found = approvedRequisitions.find((r) => r.id === reqId);
    if (found) {
      populateFromManpower(found);
    }
  };

  const addSkill = () => {
    const trimmed = skillInput.trim();
    if (trimmed && !formData.skills.includes(trimmed)) {
      setFormData((prev) => ({ ...prev, skills: [...prev.skills, trimmed] }));
      setSkillInput("");
    }
  };

  const removeSkill = (s: string) => {
    setFormData((prev) => ({ ...prev, skills: prev.skills.filter((k) => k !== s) }));
  };

  const addQuestion = () => {
    const newQ: ScreeningQuestion = {
      id: `q_${Date.now()}`,
      question: "",
      type: "YES_NO",
      required: true,
    };
    setQuestions([...questions, newQ]);
  };

  const updateQuestion = (index: number, updates: Partial<ScreeningQuestion>) => {
    const updated = [...questions];
    updated[index] = { ...updated[index], ...updates };
    setQuestions(updated);
  };

  const removeQuestion = (index: number) => {
    setQuestions(questions.filter((_, i) => i !== index));
  };

  const handleSaveDraft = async () => {
    if (mode === "MANPOWER" && !selectedReqId) {
      toast("Please select an approved manpower requisition", "error");
      return;
    }

    if (!formData.title || !formData.departmentId || !formData.description) {
      toast("Title, Department, and Description are required", "error");
      return;
    }

    if (mode === "DIRECT" && !formData.directHiringJustification.trim()) {
      toast("Direct hiring justification is mandatory", "error");
      return;
    }

    setIsSubmitting(true);
    try {
      const headers = { Authorization: `Bearer ${getToken()}` };
      const payload: any = {
        title: formData.title,
        departmentId: formData.departmentId,
        designationId: formData.designationId || null,
        location: formData.location || "Remote",
        workplaceType: formData.workplaceType,
        employmentType: formData.employmentType,
        openings: Number(formData.openings) || 1,
        description: formData.description,
        responsibilities: formData.responsibilities,
        requirements: formData.requirements,
        skills: formData.skills,
        screeningQuestions: questions.filter((q) => q.question.trim().length > 0),
        salaryMin: formData.salaryMin ? Number(formData.salaryMin) : null,
        salaryMax: formData.salaryMax ? Number(formData.salaryMax) : null,
        showSalaryRange: formData.showSalaryRange,
        applicationDeadline: formData.applicationDeadline || null,
      };

      if (mode === "MANPOWER") {
        payload.manpowerRequisitionId = selectedReqId;
        await axios.post(`${API_URL}/recruitment/jobs/from-manpower`, payload, { headers });
        toast("Job Requisition draft created from approved manpower requisition!", "success");
      } else {
        payload.directHiringReason = formData.directHiringReason;
        payload.directHiringJustification = formData.directHiringJustification;
        await axios.post(`${API_URL}/recruitment/jobs/direct`, payload, { headers });
        toast("Direct Job Requisition draft created!", "success");
      }

      onSuccess();
      onOpenChange(false);
    } catch (err: any) {
      toast(err.response?.data?.message || "Failed to create job requisition", "error");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-lg bg-primary/10 text-primary">
              <Briefcase className="w-5 h-5" />
            </div>
            <div>
              <DialogTitle className="text-xl font-bold">Create Job Vacancy</DialogTitle>
              <DialogDescription>
                Define the public job description, requirements, and candidate screening questions.
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        {/* Normal vs Exception Mode Switcher */}
        <div className="flex items-center gap-2 p-1.5 bg-muted/50 rounded-xl border my-1">
          <button
            type="button"
            onClick={() => setMode("MANPOWER")}
            className={`flex-1 py-2 px-3 text-xs font-bold rounded-lg transition-all flex items-center justify-center gap-2 ${
              mode === "MANPOWER" ? "bg-card text-foreground shadow-xs" : "text-muted-foreground hover:text-foreground"
            }`}
          >
            <CheckCircle2 className="w-4 h-4 text-emerald-500" />
            From Approved Requisition (Normal Path)
          </button>

          {isHrOrAdmin && (
            <button
              type="button"
              onClick={() => setMode("DIRECT")}
              className={`flex-1 py-2 px-3 text-xs font-bold rounded-lg transition-all flex items-center justify-center gap-2 ${
                mode === "DIRECT" ? "bg-card text-foreground shadow-xs" : "text-muted-foreground hover:text-foreground"
              }`}
            >
              <AlertCircle className="w-4 h-4 text-amber-500" />
              Direct Job (Admin Exception)
            </button>
          )}
        </div>

        {/* Source Selection */}
        {mode === "MANPOWER" ? (
          <div className="p-3 bg-muted/20 rounded-xl border space-y-2">
            <label className="text-xs font-bold text-foreground block">
              Select Approved Manpower Requisition *
            </label>
            <Select value={selectedReqId} onValueChange={(val) => val && handleSelectRequisition(val)}>
              <SelectTrigger>
                <SelectValue placeholder="Choose an approved requisition..." />
              </SelectTrigger>
              <SelectContent>
                {approvedRequisitions.length === 0 ? (
                  <div className="p-2 text-xs text-muted-foreground text-center">
                    No approved manpower requisitions available.
                  </div>
                ) : (
                  approvedRequisitions.map((req) => (
                    <SelectItem key={req.id} value={req.id}>
                      {req.requisitionNumber} — {req.designation?.name} ({req.department?.name}, {req.positionsCount} pos)
                    </SelectItem>
                  ))
                )}
              </SelectContent>
            </Select>
            <span className="text-[11px] text-muted-foreground block">
              Snapshot isolation: details from the approved manpower request are securely copied to prevent drift.
            </span>
          </div>
        ) : (
          <div className="p-3 bg-amber-500/10 border border-amber-500/20 rounded-xl space-y-3">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-bold text-amber-900 dark:text-amber-200 block mb-1">
                  Direct Hiring Reason *
                </label>
                <Select
                  value={formData.directHiringReason}
                  onValueChange={(val) => val && setFormData({ ...formData, directHiringReason: val })}
                >
                  <SelectTrigger className="bg-background">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="DIRECT_HIRE">Direct Hire</SelectItem>
                    <SelectItem value="REPLACEMENT">Emergency Replacement</SelectItem>
                    <SelectItem value="EMERGENCY_HIRE">Emergency Hiring</SelectItem>
                    <SelectItem value="INTERNAL_POSITION">Internal Position</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <label className="text-xs font-bold text-amber-900 dark:text-amber-200 block mb-1">
                  Executive Justification *
                </label>
                <Input
                  placeholder="Explain why manpower requisition was bypassed"
                  className="bg-background"
                  value={formData.directHiringJustification}
                  onChange={(e) => setFormData({ ...formData, directHiringJustification: e.target.value })}
                />
              </div>
            </div>
          </div>
        )}

        {/* Job Details Form */}
        <div className="space-y-4 py-2">
          <div className="grid grid-cols-3 gap-3">
            <div className="col-span-2">
              <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider block mb-1">
                Job Title *
              </label>
              <Input
                placeholder="e.g. Senior Backend Developer"
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              />
            </div>

            <div>
              <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider block mb-1">
                Openings *
              </label>
              <Input
                type="number"
                min="1"
                value={formData.openings}
                onChange={(e) => setFormData({ ...formData, openings: parseInt(e.target.value) || 1 })}
              />
            </div>
          </div>

          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider block mb-1">
                Department *
              </label>
              <Select
                value={formData.departmentId}
                onValueChange={(val) => val && setFormData({ ...formData, departmentId: val })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Department" />
                </SelectTrigger>
                <SelectContent>
                  {departments.map((d) => (
                    <SelectItem key={d.id} value={d.id}>
                      {d.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider block mb-1">
                Workplace Mode
              </label>
              <Select
                value={formData.workplaceType}
                onValueChange={(val) => val && setFormData({ ...formData, workplaceType: val })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ON_SITE">On-Site</SelectItem>
                  <SelectItem value="HYBRID">Hybrid</SelectItem>
                  <SelectItem value="REMOTE">Remote</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider block mb-1">
                Location
              </label>
              <Input
                placeholder="e.g. Guwahati / Remote"
                value={formData.location}
                onChange={(e) => setFormData({ ...formData, location: e.target.value })}
              />
            </div>
          </div>

          <div>
            <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider block mb-1">
              About the Role / Description *
            </label>
            <Textarea
              rows={3}
              placeholder="High-level overview of the position..."
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider block mb-1">
                Key Responsibilities *
              </label>
              <Textarea
                rows={4}
                placeholder="List day-to-day responsibilities..."
                value={formData.responsibilities}
                onChange={(e) => setFormData({ ...formData, responsibilities: e.target.value })}
              />
            </div>

            <div>
              <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider block mb-1">
                Requirements & Qualifications *
              </label>
              <Textarea
                rows={4}
                placeholder="List qualifications and experience..."
                value={formData.requirements}
                onChange={(e) => setFormData({ ...formData, requirements: e.target.value })}
              />
            </div>
          </div>

          {/* Structured Screening Questions Builder */}
          <div className="p-4 bg-muted/25 rounded-xl border space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <span className="text-xs font-bold uppercase tracking-wider block text-foreground">
                  Structured Screening Questions
                </span>
                <span className="text-[11px] text-muted-foreground">
                  Asked to candidates when applying for automated pre-screening.
                </span>
              </div>
              <Button type="button" variant="outline" size="sm" onClick={addQuestion} className="h-8">
                <Plus className="w-3.5 h-3.5 mr-1" /> Add Question
              </Button>
            </div>

            {questions.length === 0 ? (
              <div className="py-4 text-center text-xs text-muted-foreground italic bg-background/50 rounded-lg border">
                No screening questions defined. Click &ldquo;Add Question&rdquo; to add pre-screening checks.
              </div>
            ) : (
              <div className="space-y-2">
                {questions.map((q, idx) => (
                  <div key={q.id || idx} className="p-3 bg-background rounded-lg border space-y-2 text-xs">
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-muted-foreground font-bold">{idx + 1}.</span>
                      <Input
                        placeholder="e.g. Do you have experience with NestJS?"
                        value={q.question}
                        onChange={(e) => updateQuestion(idx, { question: e.target.value })}
                        className="flex-1"
                      />
                      <Select
                        value={q.type}
                        onValueChange={(val: any) => val && updateQuestion(idx, { type: val })}
                      >
                        <SelectTrigger className="w-[140px]">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="YES_NO">Yes / No</SelectItem>
                          <SelectItem value="NUMBER">Number (Years)</SelectItem>
                          <SelectItem value="TEXT">Short Text</SelectItem>
                          <SelectItem value="MULTIPLE_CHOICE">Multi Choice</SelectItem>
                        </SelectContent>
                      </Select>

                      <div className="flex items-center gap-1 px-2 py-1 bg-muted rounded">
                        <input
                          type="checkbox"
                          checked={q.required}
                          onChange={(e) => updateQuestion(idx, { required: e.target.checked })}
                          id={`req-${idx}`}
                        />
                        <label htmlFor={`req-${idx}`} className="text-[11px] font-semibold cursor-pointer">
                          Required
                        </label>
                      </div>

                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        className="text-destructive h-8 w-8"
                        onClick={() => removeQuestion(idx)}
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </Button>
                    </div>

                    {q.type === "MULTIPLE_CHOICE" && (
                      <div className="pl-6">
                        <Input
                          placeholder="Options separated by comma (e.g. On-site, Hybrid, Remote)"
                          value={q.options?.join(", ") || ""}
                          onChange={(e) =>
                            updateQuestion(idx, {
                              options: e.target.value.split(",").map((s) => s.trim()).filter(Boolean),
                            })
                          }
                        />
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        <DialogFooter className="border-t pt-3 flex items-center justify-between">
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={isSubmitting}>
            Cancel
          </Button>

          <Button onClick={handleSaveDraft} disabled={isSubmitting} className="font-semibold">
            {isSubmitting ? <Loader2 className="w-4 h-4 animate-spin mr-1" /> : null}
            Save Draft Job Requisition
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
