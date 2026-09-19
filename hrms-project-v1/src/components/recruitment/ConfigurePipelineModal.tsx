"use client";

import { useState } from "react";
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
  Plus,
  Trash2,
  Sparkles,
  CheckCircle2,
  Clock,
  Layers,
  Archive,
  ArrowUpDown,
  FileCheck,
} from "lucide-react";
import { useToast } from "@/components/ToastProvider";

interface ConfigurePipelineModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  job: any;
  onSuccess?: () => void;
}

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000";

export function ConfigurePipelineModal({
  open,
  onOpenChange,
  job,
  onSuccess,
}: ConfigurePipelineModalProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const [isAddingRound, setIsAddingRound] = useState(false);
  const [editingRoundId, setEditingRoundId] = useState<string | null>(null);

  // Form state
  const [name, setName] = useState("");
  const [type, setType] = useState("TECHNICAL");
  const [durationMinutes, setDurationMinutes] = useState<number | string>(60);
  const [isRequired, setIsRequired] = useState(true);
  const [description, setDescription] = useState("");
  const [criteria, setCriteria] = useState<
    Array<{
      name: string;
      description?: string;
      weight: number;
      maxRating: number;
    }>
  >([
    { name: "Technical Competency", weight: 1.0, maxRating: 5 },
    { name: "Problem Solving", weight: 1.0, maxRating: 5 },
  ]);

  const getToken = () =>
    typeof window !== "undefined" ? localStorage.getItem("hrms_token") : null;

  // 1. Fetch Rounds
  const { data: rounds, isLoading } = useQuery({
    queryKey: ["interviewRounds", job?.id],
    queryFn: async () => {
      if (!job?.id) return [];
      const res = await axios.get(
        `${API_URL}/recruitment/jobs/${job.id}/interview-rounds`,
        { headers: { Authorization: `Bearer ${getToken()}` } },
      );
      return res.data;
    },
    enabled: !!job?.id && open,
  });

  // 2. Load Standard Template Mutation
  const seedTemplateMutation = useMutation({
    mutationFn: async () => {
      const res = await axios.post(
        `${API_URL}/recruitment/jobs/${job.id}/interview-rounds/default`,
        {},
        { headers: { Authorization: `Bearer ${getToken()}` } },
      );
      return res.data;
    },
    onSuccess: () => {
      toast("Standard 3-round interview pipeline created", "success");
      queryClient.invalidateQueries({ queryKey: ["interviewRounds", job.id] });
      onSuccess?.();
    },
    onError: (err: any) => {
      toast(
        err.response?.data?.message || "Failed to seed default pipeline",
        "error",
      );
    },
  });

  // 3. Save Round (Create or Update)
  const saveRoundMutation = useMutation({
    mutationFn: async () => {
      if (!name.trim()) throw new Error("Round name is required");
      if (criteria.length === 0)
        throw new Error("At least one evaluation criterion is required");

      const payload = {
        name: name.trim(),
        type,
        durationMinutes: Number(durationMinutes),
        isRequired,
        description: description.trim() || undefined,
        criteria,
      };

      if (editingRoundId) {
        return axios.patch(
          `${API_URL}/recruitment/interview-rounds/${editingRoundId}`,
          payload,
          { headers: { Authorization: `Bearer ${getToken()}` } },
        );
      } else {
        return axios.post(
          `${API_URL}/recruitment/jobs/${job.id}/interview-rounds`,
          payload,
          { headers: { Authorization: `Bearer ${getToken()}` } },
        );
      }
    },
    onSuccess: () => {
      toast(
        editingRoundId
          ? "Round updated successfully"
          : "Round added to pipeline",
        "success",
      );
      resetForm();
      queryClient.invalidateQueries({ queryKey: ["interviewRounds", job.id] });
      onSuccess?.();
    },
    onError: (err: any) => {
      toast(
        err.response?.data?.message || err.message || "Failed to save round",
        "error",
      );
    },
  });

  // 4. Delete / Archive Round
  const deleteRoundMutation = useMutation({
    mutationFn: async (roundId: string) => {
      const res = await axios.delete(
        `${API_URL}/recruitment/interview-rounds/${roundId}`,
        { headers: { Authorization: `Bearer ${getToken()}` } },
      );
      return res.data;
    },
    onSuccess: (data) => {
      toast(data.message || "Round updated", "success");
      queryClient.invalidateQueries({ queryKey: ["interviewRounds", job.id] });
      onSuccess?.();
    },
    onError: (err: any) => {
      toast(err.response?.data?.message || "Failed to remove round", "error");
    },
  });

  const resetForm = () => {
    setIsAddingRound(false);
    setEditingRoundId(null);
    setName("");
    setType("TECHNICAL");
    setDurationMinutes(60);
    setIsRequired(true);
    setDescription("");
    setCriteria([
      { name: "Technical Competency", weight: 1.0, maxRating: 5 },
      { name: "Problem Solving", weight: 1.0, maxRating: 5 },
    ]);
  };

  const handleEditRound = (round: any) => {
    setEditingRoundId(round.id);
    setName(round.name);
    setType(round.type);
    setDurationMinutes(round.durationMinutes);
    setIsRequired(round.isRequired);
    setDescription(round.description || "");
    setCriteria(
      round.criteria?.length > 0
        ? round.criteria.map((c: any) => ({
            name: c.name,
            description: c.description || "",
            weight: c.weight || 1.0,
            maxRating: c.maxRating || 5,
          }))
        : [{ name: "General Evaluation", weight: 1.0, maxRating: 5 }],
    );
    setIsAddingRound(true);
  };

  const addCriterion = () => {
    setCriteria((prev) => [...prev, { name: "", weight: 1.0, maxRating: 5 }]);
  };

  const removeCriterion = (index: number) => {
    setCriteria((prev) => prev.filter((_, i) => i !== index));
  };

  const updateCriterion = (index: number, field: string, val: any) => {
    setCriteria((prev) =>
      prev.map((c, i) => (i === index ? { ...c, [field]: val } : c)),
    );
  };

  if (!job) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-center justify-between border-b pb-3">
            <div className="flex items-center gap-2">
              <span className="font-mono text-xs font-bold text-primary px-2 py-0.5 bg-primary/10 rounded-md">
                {job.jobCode}
              </span>
              <span className="text-xs text-muted-foreground">
                Interview Pipeline
              </span>
            </div>
          </div>
          <DialogTitle className="text-xl font-bold pt-1">
            Interview Rounds: {job.title}
          </DialogTitle>
          <DialogDescription className="text-xs">
            Configure custom interview rounds and structured evaluation criteria
            for this job opening.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-2">
          {/* Action Bar */}
          {!isAddingRound && (
            <div className="flex flex-wrap items-center justify-between gap-2 p-3 bg-muted/30 border rounded-xl">
              <div className="flex items-center gap-2">
                <Layers className="w-4 h-4 text-primary" />
                <span className="text-xs font-semibold text-foreground">
                  {rounds?.length || 0} Configured Round
                  {rounds?.length === 1 ? "" : "s"}
                </span>
              </div>

              <div className="flex items-center gap-2">
                {(!rounds || rounds.length === 0) && (
                  <Button
                    size="sm"
                    variant="outline"
                    className="text-xs font-semibold"
                    onClick={() => seedTemplateMutation.mutate()}
                    disabled={seedTemplateMutation.isPending}
                  >
                    {seedTemplateMutation.isPending ? (
                      <Loader2 className="w-3.5 h-3.5 animate-spin mr-1.5" />
                    ) : (
                      <Sparkles className="w-3.5 h-3.5 text-amber-500 mr-1.5" />
                    )}
                    Load Standard Pipeline
                  </Button>
                )}

                <Button
                  size="sm"
                  className="text-xs font-semibold"
                  onClick={() => {
                    resetForm();
                    setIsAddingRound(true);
                  }}
                >
                  <Plus className="w-3.5 h-3.5 mr-1" /> Add Round
                </Button>
              </div>
            </div>
          )}

          {/* Form to Add / Edit Round */}
          {isAddingRound && (
            <div className="p-4 border rounded-xl bg-card space-y-4 shadow-xs">
              <div className="flex items-center justify-between border-b pb-2">
                <span className="text-xs font-bold uppercase tracking-wider text-foreground">
                  {editingRoundId
                    ? "Edit Interview Round"
                    : "New Interview Round"}
                </span>
                <Button
                  size="sm"
                  variant="ghost"
                  className="h-7 text-xs"
                  onClick={resetForm}
                >
                  Cancel
                </Button>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
                <div className="sm:col-span-2 space-y-1">
                  <label className="font-semibold text-foreground">
                    Round Name *
                  </label>
                  <Input
                    placeholder="e.g. System Architecture & Coding"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="h-8 text-xs"
                  />
                </div>

                <div className="space-y-1">
                  <label className="font-semibold text-foreground">
                    Round Type *
                  </label>
                  <Select
                    value={type}
                    onValueChange={(val) => {
                      if (typeof val === "string" && val) setType(val);
                    }}
                  >
                    <SelectTrigger className="h-8 text-xs">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="HR">
                        HR / Recruiter Screening
                      </SelectItem>
                      <SelectItem value="TECHNICAL">
                        Technical Interview
                      </SelectItem>
                      <SelectItem value="MANAGER">Hiring Manager</SelectItem>
                      <SelectItem value="ASSESSMENT">
                        Assessment / Assignment
                      </SelectItem>
                      <SelectItem value="LEADERSHIP">Leadership</SelectItem>
                      <SelectItem value="CULTURE">Culture Fit</SelectItem>
                      <SelectItem value="OTHER">Other</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                <div className="space-y-1">
                  <label className="font-semibold text-foreground">
                    Duration (Minutes)
                  </label>
                  <Input
                    type="number"
                    min={15}
                    step={15}
                    value={durationMinutes}
                    onChange={(e) =>
                      setDurationMinutes(
                        e.target.value === "" ? "" : Number(e.target.value),
                      )
                    }
                    className="h-8 text-xs"
                  />
                </div>

                <div className="space-y-1">
                  <label className="font-semibold text-foreground">
                    Requirement
                  </label>
                  <div className="flex items-center gap-2 pt-1.5">
                    <input
                      type="checkbox"
                      id="isRequired"
                      checked={isRequired}
                      onChange={(e) => setIsRequired(e.target.checked)}
                      className="rounded border-input text-primary focus:ring-primary w-4 h-4"
                    />
                    <label
                      htmlFor="isRequired"
                      className="text-xs text-muted-foreground font-medium cursor-pointer"
                    >
                      Mandatory round for candidate selection
                    </label>
                  </div>
                </div>
              </div>

              <div className="space-y-1 text-xs">
                <label className="font-semibold text-foreground">
                  Round Instructions / Description
                </label>
                <Textarea
                  placeholder="Notes for interviewers on what to assess in this round..."
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="text-xs h-16 resize-none"
                />
              </div>

              {/* Criteria Builder */}
              <div className="space-y-2 pt-2 border-t">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
                    <FileCheck className="w-3.5 h-3.5" />
                    Evaluation Criteria (Scorecard Questions)
                  </span>
                  <Button
                    size="sm"
                    variant="outline"
                    className="h-6 text-[11px] font-semibold"
                    onClick={addCriterion}
                  >
                    <Plus className="w-3 h-3 mr-1" /> Add Criterion
                  </Button>
                </div>

                <div className="space-y-2">
                  {criteria.map((crit, idx) => (
                    <div
                      key={idx}
                      className="flex items-center gap-2 p-2 bg-muted/40 rounded-lg border text-xs"
                    >
                      <span className="font-mono text-muted-foreground w-4 text-center">
                        {idx + 1}.
                      </span>
                      <Input
                        placeholder="Criterion name (e.g. Problem Solving & Logic)"
                        value={crit.name}
                        onChange={(e) =>
                          updateCriterion(idx, "name", e.target.value)
                        }
                        className="h-7 text-xs flex-1 bg-background"
                      />
                      <Button
                        size="sm"
                        variant="ghost"
                        className="h-7 w-7 p-0 text-muted-foreground hover:text-destructive"
                        onClick={() => removeCriterion(idx)}
                        disabled={criteria.length <= 1}
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </Button>
                    </div>
                  ))}
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t">
                <Button
                  size="sm"
                  variant="outline"
                  onClick={resetForm}
                  className="text-xs"
                >
                  Cancel
                </Button>
                <Button
                  size="sm"
                  className="text-xs font-semibold"
                  onClick={() => saveRoundMutation.mutate()}
                  disabled={saveRoundMutation.isPending}
                >
                  {saveRoundMutation.isPending ? (
                    <Loader2 className="w-3.5 h-3.5 animate-spin mr-1" />
                  ) : (
                    <CheckCircle2 className="w-3.5 h-3.5 mr-1" />
                  )}
                  {editingRoundId ? "Update Round" : "Save Round"}
                </Button>
              </div>
            </div>
          )}

          {/* Existing Rounds List */}
          {isLoading ? (
            <div className="py-12 text-center text-xs text-muted-foreground">
              <Loader2 className="w-5 h-5 animate-spin mx-auto mb-2 text-primary" />
              Loading interview rounds...
            </div>
          ) : !rounds || rounds.length === 0 ? (
            !isAddingRound && (
              <div className="py-10 text-center border rounded-xl bg-card space-y-2 text-xs text-muted-foreground">
                <Layers className="w-8 h-8 mx-auto text-muted-foreground/50 mb-1" />
                <p className="font-medium text-foreground">
                  No interview rounds configured yet
                </p>
                <p className="text-[11px] max-w-sm mx-auto">
                  Click <strong>Load Standard Pipeline</strong> to seed a
                  standard 3-round template or create custom rounds.
                </p>
              </div>
            )
          ) : (
            <div className="space-y-3">
              {rounds.map((round: any, index: number) => (
                <div
                  key={round.id}
                  className={`p-3.5 rounded-xl border bg-card transition-colors ${
                    !round.isActive ? "opacity-60 bg-muted/20" : ""
                  }`}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="w-5 h-5 rounded-full bg-primary/10 text-primary font-bold text-[10px] flex items-center justify-center">
                          {round.sequence || index + 1}
                        </span>
                        <h4 className="font-bold text-sm text-foreground">
                          {round.name}
                        </h4>
                        <Badge
                          variant="outline"
                          className="text-[10px] uppercase font-bold"
                        >
                          {round.type}
                        </Badge>
                        {!round.isActive && (
                          <Badge
                            variant="secondary"
                            className="text-[10px] text-amber-600 bg-amber-500/10"
                          >
                            Archived
                          </Badge>
                        )}
                        {round.isRequired && (
                          <Badge variant="secondary" className="text-[10px]">
                            Mandatory
                          </Badge>
                        )}
                      </div>

                      <div className="flex items-center gap-3 text-[11px] text-muted-foreground pt-0.5">
                        <span className="flex items-center gap-1">
                          <Clock className="w-3 h-3" /> {round.durationMinutes}{" "}
                          min
                        </span>
                        <span>•</span>
                        <span>
                          {round.criteria?.length || 0} Evaluation Criteria
                        </span>
                        {round._count?.interviews > 0 && (
                          <>
                            <span>•</span>
                            <span className="text-foreground font-semibold">
                              {round._count.interviews} Conducted Interview
                              {round._count.interviews === 1 ? "" : "s"}
                            </span>
                          </>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center gap-1 shrink-0">
                      <Button
                        size="sm"
                        variant="outline"
                        className="h-7 text-xs"
                        onClick={() => handleEditRound(round)}
                      >
                        Edit
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        className="h-7 text-xs text-destructive hover:bg-destructive/10"
                        onClick={() => deleteRoundMutation.mutate(round.id)}
                        disabled={deleteRoundMutation.isPending}
                      >
                        {round._count?.interviews > 0 ? (
                          <Archive className="w-3.5 h-3.5" />
                        ) : (
                          <Trash2 className="w-3.5 h-3.5" />
                        )}
                      </Button>
                    </div>
                  </div>

                  {/* Criteria pill preview */}
                  {round.criteria && round.criteria.length > 0 && (
                    <div className="flex flex-wrap gap-1.5 pt-2.5 mt-2.5 border-t">
                      {round.criteria.map((c: any) => (
                        <span
                          key={c.id}
                          className="px-2 py-0.5 rounded-md bg-muted/60 text-[10px] font-medium text-foreground"
                        >
                          {c.name}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>

        <DialogFooter className="border-t pt-3">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Done
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
