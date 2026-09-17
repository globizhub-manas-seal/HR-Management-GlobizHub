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
  Calendar,
  Clock,
  Video,
  MapPin,
  Users,
  AlertTriangle,
  CheckCircle2,
  X,
} from "lucide-react";
import { useToast } from "@/components/ToastProvider";

interface ScheduleInterviewModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  application: any;
  rounds: any[];
  onSuccess?: () => void;
}

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000";

export function ScheduleInterviewModal({
  open,
  onOpenChange,
  application,
  rounds,
  onSuccess,
}: ScheduleInterviewModalProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const [selectedRoundId, setSelectedRoundId] = useState("");
  const [scheduledDate, setScheduledDate] = useState("");
  const [scheduledTime, setScheduledTime] = useState("11:00");
  const [durationMinutes, setDurationMinutes] = useState(60);
  const [timezone, setTimezone] = useState("Asia/Kolkata");
  const [mode, setMode] = useState("GOOGLE_MEET");
  const [meetingLink, setMeetingLink] = useState("");
  const [location, setLocation] = useState("");
  const [notes, setNotes] = useState("");
  const [selectedInterviewers, setSelectedInterviewers] = useState<
    Array<{ employeeId: string; role: string }>
  >([]);

  const [conflictError, setConflictError] = useState<string | null>(null);

  const getToken = () =>
    typeof window !== "undefined" ? localStorage.getItem("hrms_token") : null;

  // Set default round and date
  useEffect(() => {
    if (open) {
      setConflictError(null);
      const activeRounds = rounds?.filter((r) => r.isActive !== false) || [];
      if (activeRounds.length > 0 && !selectedRoundId) {
        setSelectedRoundId(activeRounds[0].id);
        setDurationMinutes(activeRounds[0].durationMinutes || 60);
      }

      // Default to tomorrow 11:00 AM
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);
      setScheduledDate(tomorrow.toISOString().split("T")[0]);
    }
  }, [open, rounds]);

  // When round changes, update default duration
  const handleRoundChange = (roundId: string) => {
    setSelectedRoundId(roundId);
    const round = rounds?.find((r) => r.id === roundId);
    if (round?.durationMinutes) {
      setDurationMinutes(round.durationMinutes);
    }
  };

  // 1. Fetch Company Employees for Interviewer Assignment
  const { data: employees, isLoading: employeesLoading } = useQuery({
    queryKey: ["employeesList"],
    queryFn: async () => {
      const res = await axios.get(`${API_URL}/employees`, {
        headers: { Authorization: `Bearer ${getToken()}` },
      });
      return res.data;
    },
    enabled: open,
  });

  // 2. Schedule Mutation
  const scheduleMutation = useMutation({
    mutationFn: async () => {
      if (!selectedRoundId) throw new Error("Please select an interview round");
      if (!scheduledDate || !scheduledTime) throw new Error("Please select scheduled date and time");
      if (selectedInterviewers.length === 0) throw new Error("Please assign at least one interviewer");

      const combinedDateTime = new Date(`${scheduledDate}T${scheduledTime}:00`);
      if (isNaN(combinedDateTime.getTime())) {
        throw new Error("Invalid date or time provided");
      }

      const payload = {
        interviewRoundId: selectedRoundId,
        scheduledAt: combinedDateTime.toISOString(),
        durationMinutes: Number(durationMinutes),
        timezone,
        mode,
        meetingLink: meetingLink.trim() || undefined,
        location: location.trim() || undefined,
        notes: notes.trim() || undefined,
        interviewers: selectedInterviewers,
      };

      const res = await axios.post(
        `${API_URL}/recruitment/applications/${application.id}/interviews`,
        payload,
        { headers: { Authorization: `Bearer ${getToken()}` } }
      );
      return res.data;
    },
    onSuccess: () => {
      toast("Interview successfully scheduled", "success");
      setConflictError(null);
      queryClient.invalidateQueries({ queryKey: ["candidateInterviews", application.id] });
      queryClient.invalidateQueries({ queryKey: ["candidateTimeline", application.id] });
      queryClient.invalidateQueries({ queryKey: ["companyApplications"] });
      onSuccess?.();
      onOpenChange(false);
    },
    onError: (err: any) => {
      if (err.response?.status === 409) {
        setConflictError(err.response?.data?.message || "Interviewer schedule conflict detected");
      } else {
        toast(err.response?.data?.message || err.message || "Failed to schedule interview", "error");
      }
    },
  });

  const addInterviewer = (empId: string) => {
    if (!empId) return;
    if (selectedInterviewers.some((i) => i.employeeId === empId)) return;
    const isFirst = selectedInterviewers.length === 0;
    setSelectedInterviewers((prev) => [
      ...prev,
      { employeeId: empId, role: isFirst ? "PRIMARY" : "PANEL" },
    ]);
  };

  const removeInterviewer = (empId: string) => {
    setSelectedInterviewers((prev) => prev.filter((i) => i.employeeId !== empId));
  };

  const setInterviewerRole = (empId: string, role: string) => {
    setSelectedInterviewers((prev) =>
      prev.map((i) => (i.employeeId === empId ? { ...i, role } : i))
    );
  };

  if (!application) return null;

  const candidate = application.candidate || {};
  const activeRounds = rounds?.filter((r) => r.isActive !== false) || [];

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-center justify-between border-b pb-2.5">
            <span className="font-mono text-xs font-bold text-primary px-2 py-0.5 bg-primary/10 rounded-md">
              Schedule Interview
            </span>
            <span className="text-xs text-muted-foreground">
              Candidate: <strong className="text-foreground">{candidate.firstName} {candidate.lastName}</strong>
            </span>
          </div>
          <DialogTitle className="text-lg font-bold pt-1">
            Schedule Candidate Interview
          </DialogTitle>
          <DialogDescription className="text-xs">
            Select the interview round, date/time, mode, and assign employee interviewers with conflict checking.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-2 text-xs">
          {/* Schedule Conflict Alert Banner */}
          {conflictError && (
            <div className="p-3 bg-destructive/10 border border-destructive/20 rounded-xl flex items-start gap-2.5">
              <AlertTriangle className="w-4 h-4 text-destructive shrink-0 mt-0.5" />
              <div className="space-y-1">
                <span className="font-bold text-destructive text-xs block">
                  Interviewer Conflict Detected
                </span>
                <p className="text-[11px] text-foreground leading-relaxed">{conflictError}</p>
              </div>
            </div>
          )}

          {/* Round Selector */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="space-y-1">
              <label className="font-semibold text-foreground">Interview Round *</label>
              {activeRounds.length === 0 ? (
                <div className="p-2 border rounded-md bg-muted/40 text-muted-foreground text-xs">
                  No active rounds configured. Please configure the interview pipeline first.
                </div>
              ) : (
                <Select value={selectedRoundId} onValueChange={(val) => { if (typeof val === "string" && val) handleRoundChange(val); }}>
                  <SelectTrigger className="h-9 text-xs">
                    <SelectValue placeholder="Select interview round" />
                  </SelectTrigger>
                  <SelectContent>
                    {activeRounds.map((r) => (
                      <SelectItem key={r.id} value={r.id}>
                        {r.name} ({r.type} • {r.durationMinutes}m)
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            </div>

            <div className="space-y-1">
              <label className="font-semibold text-foreground">Interview Mode *</label>
              <Select value={mode} onValueChange={(val) => { if (typeof val === "string" && val) setMode(val); }}>
                <SelectTrigger className="h-9 text-xs">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="GOOGLE_MEET">Google Meet (Video)</SelectItem>
                  <SelectItem value="MS_TEAMS">Microsoft Teams (Video)</SelectItem>
                  <SelectItem value="IN_PERSON">In Person (Office)</SelectItem>
                  <SelectItem value="PHONE">Phone Call</SelectItem>
                  <SelectItem value="OTHER">Other Platform</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Date, Time & Duration */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="space-y-1">
              <label className="font-semibold text-foreground">Date *</label>
              <Input
                type="date"
                value={scheduledDate}
                onChange={(e) => setScheduledDate(e.target.value)}
                className="h-9 text-xs"
              />
            </div>

            <div className="space-y-1">
              <label className="font-semibold text-foreground">Start Time *</label>
              <Input
                type="time"
                value={scheduledTime}
                onChange={(e) => setScheduledTime(e.target.value)}
                className="h-9 text-xs"
              />
            </div>

            <div className="space-y-1">
              <label className="font-semibold text-foreground">Duration (Minutes) *</label>
              <Input
                type="number"
                min={15}
                step={15}
                value={durationMinutes}
                onChange={(e) => setDurationMinutes(Number(e.target.value))}
                className="h-9 text-xs"
              />
            </div>
          </div>

          {/* Meeting Link or Location */}
          <div className="space-y-1">
            <label className="font-semibold text-foreground">
              {mode === "IN_PERSON" ? "Office Location / Meeting Room" : "Meeting Link (URL)"}
            </label>
            <Input
              placeholder={
                mode === "IN_PERSON"
                  ? "e.g. Conference Room 3B, Bangalore HQ"
                  : "e.g. https://meet.google.com/xyz-abcd-efg"
              }
              value={mode === "IN_PERSON" ? location : meetingLink}
              onChange={(e) =>
                mode === "IN_PERSON" ? setLocation(e.target.value) : setMeetingLink(e.target.value)
              }
              className="h-9 text-xs"
            />
          </div>

          {/* Assigned Interviewers */}
          <div className="space-y-2 p-3 bg-muted/30 rounded-xl border">
            <div className="flex items-center justify-between">
              <label className="font-bold text-xs uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
                <Users className="w-3.5 h-3.5" />
                Assign Interviewers from Team
              </label>
              <span className="text-[11px] text-muted-foreground">
                {selectedInterviewers.length} Assigned
              </span>
            </div>

            {/* Employee Selector Dropdown */}
            <Select onValueChange={(val) => { if (typeof val === "string" && val) addInterviewer(val); }}>
              <SelectTrigger className="h-8 text-xs bg-background">
                <SelectValue placeholder="+ Select employee to assign..." />
              </SelectTrigger>
              <SelectContent>
                {employeesLoading ? (
                  <SelectItem value="loading" disabled>
                    Loading employees...
                  </SelectItem>
                ) : (
                  employees
                    ?.filter(
                      (e: any) => !selectedInterviewers.some((i) => i.employeeId === e.id)
                    )
                    .map((e: any) => (
                      <SelectItem key={e.id} value={e.id}>
                        {e.firstName} {e.lastName} ({e.email})
                      </SelectItem>
                    ))
                )}
              </SelectContent>
            </Select>

            {/* Assigned Interviewers List */}
            {selectedInterviewers.length > 0 && (
              <div className="space-y-1.5 pt-1">
                {selectedInterviewers.map((assigned) => {
                  const emp = employees?.find((e: any) => e.id === assigned.employeeId);
                  return (
                    <div
                      key={assigned.employeeId}
                      className="flex items-center justify-between gap-2 p-2 bg-card rounded-lg border text-xs"
                    >
                      <div>
                        <span className="font-semibold text-foreground block">
                          {emp ? `${emp.firstName} ${emp.lastName}` : "Employee"}
                        </span>
                        <span className="text-[10px] text-muted-foreground">
                          {emp?.designation?.name || emp?.email}
                        </span>
                      </div>

                      <div className="flex items-center gap-2">
                        <Select
                          value={assigned.role}
                          onValueChange={(val) => { if (typeof val === "string" && val) setInterviewerRole(assigned.employeeId, val); }}
                        >
                          <SelectTrigger className="h-7 text-[11px] w-28 bg-background">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="PRIMARY">Primary</SelectItem>
                            <SelectItem value="PANEL">Panel Member</SelectItem>
                            <SelectItem value="OBSERVER">Observer (View Only)</SelectItem>
                          </SelectContent>
                        </Select>

                        <Button
                          size="sm"
                          variant="ghost"
                          className="h-7 w-7 p-0 text-muted-foreground hover:text-destructive"
                          onClick={() => removeInterviewer(assigned.employeeId)}
                        >
                          <X className="w-3.5 h-3.5" />
                        </Button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Notes */}
          <div className="space-y-1">
            <label className="font-semibold text-foreground">Interview Notes / Instructions</label>
            <Textarea
              placeholder="Add agenda, specific focus areas, or instructions for the interview panel..."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="text-xs h-16 resize-none"
            />
          </div>
        </div>

        <DialogFooter className="border-t pt-3">
          <Button variant="outline" onClick={() => onOpenChange(false)} className="text-xs">
            Cancel
          </Button>
          <Button
            className="text-xs font-semibold"
            onClick={() => scheduleMutation.mutate()}
            disabled={scheduleMutation.isPending || activeRounds.length === 0}
          >
            {scheduleMutation.isPending ? (
              <Loader2 className="w-3.5 h-3.5 animate-spin mr-1" />
            ) : (
              <Calendar className="w-3.5 h-3.5 mr-1" />
            )}
            Confirm & Schedule
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
