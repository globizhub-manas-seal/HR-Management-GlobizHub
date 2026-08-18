"use client";

import { useQuery } from "@tanstack/react-query";
import axios from "axios";
import { Clock, ShieldAlert, Coffee, Sun, Moon, CalendarDays, Loader2 } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

export default function ShiftsPage() {
  const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000";

  // 1. Fetch Company Settings (for rules)
  const { data: settings, isLoading: loadingSettings } = useQuery({
    queryKey: ["companySettings"],
    queryFn: async () => {
      const token = localStorage.getItem("hrms_token");
      const res = await axios.get(`${API_URL}/settings`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      return res.data;
    }
  });

  // 2. Fetch Active Shifts
  const { data: shifts, isLoading: loadingShifts } = useQuery({
    queryKey: ["companyShifts"],
    queryFn: async () => {
      const token = localStorage.getItem("hrms_token");
      const res = await axios.get(`${API_URL}/schedules/shifts`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      return res.data;
    }
  });

  const getShiftIcon = (isNightShift?: boolean) => {
    if (isNightShift) return <Moon className="w-5 h-5 text-indigo-500" />;
    return <Sun className="w-5 h-5 text-amber-500" />;
  };

  const getShiftStyle = (isNightShift?: boolean) => {
    if (isNightShift) return "bg-indigo-50/50 border-indigo-100 text-indigo-900";
    return "bg-amber-50/50 border-amber-100 text-amber-900";
  };

  if (loadingSettings || loadingShifts) {
    return (
      <div className="flex h-96 items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-emerald-500" />
      </div>
    );
  }

  return (
    <div className="p-8 max-w-6xl mx-auto space-y-8 font-sans">
      <div>
        <h1 className="text-3xl font-bold text-slate-900">Shift Timings & Policies</h1>
        <p className="text-slate-500 mt-1">Review active shift templates and workspace rules.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Left Column: Rules & Policies */}
        <div className="md:col-span-1 space-y-6">
          <Card className="border-slate-200 shadow-sm">
            <CardHeader className="bg-slate-50 border-b border-slate-100">
              <CardTitle className="text-base font-bold text-slate-900 flex items-center">
                <ShieldAlert className="w-4 h-4 mr-2 text-indigo-500" /> Policy Rules
              </CardTitle>
              <CardDescription>Rules applied to shift timings.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-5 pt-5 text-sm">
              <div className="flex justify-between border-b pb-3.5">
                <span className="text-slate-500">Grace Period</span>
                <span className="font-semibold text-slate-900">{settings?.gracePeriodMinutes || 15} minutes</span>
              </div>
              <div className="flex justify-between border-b pb-3.5">
                <span className="text-slate-500">Full-Day Minimum</span>
                <span className="font-semibold text-slate-900">{settings?.minimumHoursForFullDay || 8.0} hours</span>
              </div>
              <div className="flex justify-between border-b pb-3.5">
                <span className="text-slate-500">Half-Day Minimum</span>
                <span className="font-semibold text-slate-900">{settings?.halfDayMinHours || 4.0} hours</span>
              </div>
              <div className="flex justify-between pb-1">
                <span className="text-slate-500">Device Restrictions</span>
                <span className="font-semibold text-slate-900">
                  {settings?.oneDevicePerEmployee ? "1 Device Limit" : "Multiple Allowed"}
                </span>
              </div>
            </CardContent>
          </Card>

          <Card className="border-slate-200 shadow-sm">
            <CardHeader className="bg-slate-50 border-b border-slate-100">
              <CardTitle className="text-base font-bold text-slate-900 flex items-center">
                <CalendarDays className="w-4 h-4 mr-2 text-indigo-500" /> Working Days
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-5 flex flex-wrap gap-2">
              {settings?.workingDays && settings.workingDays.length > 0 ? (
                settings.workingDays.map((day: string) => (
                  <Badge key={day} variant="secondary" className="bg-slate-100 text-slate-700 capitalize">
                    {day.toLowerCase()}
                  </Badge>
                ))
              ) : (
                <span className="text-slate-400 italic text-xs">No working days set.</span>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Right Column: Active Shifts */}
        <div className="md:col-span-2 space-y-4">
          <h2 className="text-lg font-bold text-slate-800 flex items-center">
            <Clock className="w-5 h-5 mr-2 text-indigo-500" /> Standard Roster Shifts
          </h2>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {shifts && shifts.length > 0 ? (
              shifts.map((s: any) => (
                <div
                  key={s.id}
                  className={`flex flex-col justify-between p-5 rounded-2xl border ${getShiftStyle(
                    s.isNightShift
                  )} transition-all hover:shadow-md`}
                >
                  <div className="flex justify-between items-start mb-4">
                    <div>
                      <h4 className="font-bold text-slate-900 text-base">{s.name}</h4>
                      <p className="text-xs opacity-75 mt-0.5">
                        {s.isNightShift ? "Scheduled Over Night" : "Scheduled Day shift"}
                      </p>
                    </div>
                    {getShiftIcon(s.isNightShift)}
                  </div>

                  <div className="mt-auto pt-4 border-t border-slate-200/40">
                    <p className="text-xs opacity-80 uppercase tracking-wider font-semibold">Hours</p>
                    <p className="text-lg font-black mt-1">
                      {s.startTime} - {s.endTime}
                    </p>
                  </div>
                </div>
              ))
            ) : (
              <div className="col-span-2 text-center py-12 border border-dashed border-slate-200 rounded-2xl bg-white text-slate-500">
                <Coffee className="w-8 h-8 mx-auto text-slate-300 mb-2" />
                <p className="text-sm">No company shift definitions found.</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
