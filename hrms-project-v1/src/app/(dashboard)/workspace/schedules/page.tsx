"use client";

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import axios from "axios";
import { Calendar as CalendarIcon, Clock, Users, ArrowLeft, ArrowRight, Sun, Moon, Coffee, Loader2 } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

export default function SchedulesPage() {
  const [currentWeek, setCurrentWeek] = useState("Upcoming 7 Days");

  // Fetch real schedule data from our new NestJS endpoint
  const { data: schedules, isLoading, error } = useQuery({
    queryKey: ["mySchedule"],
    queryFn: async () => {
      const token = localStorage.getItem("hrms_token");
      const response = await axios.get(
        `${process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000"}/schedules/me`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      return response.data;
    },
  });

  // Helper to format date into "Today", "Tomorrow", or "Oct 25"
  const formatScheduleDate = (dateString: string) => {
    const date = new Date(dateString);
    const today = new Date();
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    if (date.toDateString() === today.toDateString()) return "Today";
    if (date.toDateString() === tomorrow.toDateString()) return "Tomorrow";
    
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  };

  // Helper to get the short day name (e.g., "Mon")
  const getDayName = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', { weekday: 'short' });
  };

  const getShiftIcon = (isDayOff: boolean, isNightShift?: boolean) => {
    if (isDayOff) return <Coffee className="w-5 h-5 text-slate-400" />;
    if (isNightShift) return <Moon className="w-5 h-5 text-indigo-500" />;
    return <Sun className="w-5 h-5 text-amber-500" />;
  };

  const getShiftStyle = (isDayOff: boolean, isNightShift?: boolean) => {
    if (isDayOff) return "bg-slate-50 border-slate-200 text-slate-500 opacity-75";
    if (isNightShift) return "bg-indigo-50 border-indigo-200 text-indigo-900";
    return "bg-amber-50 border-amber-200 text-amber-900";
  };

  if (isLoading) {
    return (
      <div className="flex h-96 items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-emerald-500" />
      </div>
    );
  }

  return (
    <div className="p-8 max-w-6xl mx-auto space-y-8">
      {/* Page Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-slate-900">My Schedule</h1>
          <p className="text-slate-500 mt-1">View your assigned shifts and weekly roster.</p>
        </div>
        
        {/* Week Navigation */}
        <div className="flex items-center space-x-4 bg-white border border-slate-200 rounded-xl p-1 shadow-sm">
          <Button variant="ghost" size="icon" className="h-8 w-8 hover:bg-slate-100">
            <ArrowLeft className="w-4 h-4 text-slate-600" />
          </Button>
          <span className="text-sm font-semibold text-slate-700 min-w-[140px] text-center flex items-center justify-center">
            <CalendarIcon className="w-4 h-4 mr-2 text-emerald-500" /> {currentWeek}
          </span>
          <Button variant="ghost" size="icon" className="h-8 w-8 hover:bg-slate-100">
            <ArrowRight className="w-4 h-4 text-slate-600" />
          </Button>
        </div>
      </div>

      {/* Weekly Visual Grid */}
      <Card className="border-slate-200 shadow-sm overflow-hidden">
        <CardHeader className="bg-slate-50/50 border-b border-slate-100 pb-4">
          <CardTitle className="text-lg">Weekly Overview</CardTitle>
          <CardDescription>A quick glance at your week ahead.</CardDescription>
        </CardHeader>
        <CardContent className="p-6">
          {schedules?.length === 0 ? (
            <div className="text-center py-8 text-slate-500">No shifts assigned for this week yet.</div>
          ) : (
            <div className="grid grid-cols-2 md:grid-cols-5 lg:grid-cols-7 gap-4">
              {schedules?.map((schedule: any) => (
                <div key={schedule.id} className={`flex flex-col p-4 rounded-xl border ${getShiftStyle(schedule.isDayOff, schedule.shift?.isNightShift)} transition-all hover:shadow-md`}>
                  <div className="flex justify-between items-start mb-4">
                    <div>
                      <p className="text-sm font-bold uppercase tracking-wider">{getDayName(schedule.date)}</p>
                      <p className="text-xs font-medium opacity-80">{formatScheduleDate(schedule.date)}</p>
                    </div>
                    {getShiftIcon(schedule.isDayOff, schedule.shift?.isNightShift)}
                  </div>
                  <div className="mt-auto space-y-1">
                    <Badge variant="outline" className="bg-white/50 border-white/40 shadow-sm text-xs truncate w-full flex justify-center">
                      {schedule.isDayOff ? 'Day Off' : schedule.shift?.name}
                    </Badge>
                    <p className="text-xs font-semibold mt-2 text-center">
                      {schedule.isDayOff ? '--:--' : `${schedule.shift?.startTime} - ${schedule.shift?.endTime}`}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Detailed List View */}
      <Card className="border-slate-200 shadow-sm">
        <CardHeader>
          <CardTitle className="text-lg flex items-center">
            <Clock className="w-5 h-5 mr-2 text-indigo-500" /> Upcoming Shifts Details
          </CardTitle>
        </CardHeader>
        <CardContent>
          {schedules?.filter((s: any) => !s.isDayOff).length === 0 ? (
            <div className="text-center py-6 text-slate-500">No upcoming active shifts to display.</div>
          ) : (
            <div className="space-y-4">
              {schedules?.filter((s: any) => !s.isDayOff).map((schedule: any) => (
                <div key={schedule.id} className="flex flex-col sm:flex-row items-start sm:items-center justify-between p-4 border border-slate-100 rounded-xl bg-slate-50 hover:bg-slate-100/50 transition-colors">
                  <div className="flex items-center space-x-4 mb-3 sm:mb-0">
                    <div className={`p-3 rounded-xl ${schedule.shift?.isNightShift ? 'bg-indigo-100' : 'bg-amber-100'}`}>
                      {getShiftIcon(false, schedule.shift?.isNightShift)}
                    </div>
                    <div>
                      <h4 className="font-semibold text-slate-900">
                        {formatScheduleDate(schedule.date)} ({getDayName(schedule.date)})
                      </h4>
                      <p className="text-sm text-slate-500 flex items-center mt-1">
                        <Clock className="w-3.5 h-3.5 mr-1" /> {schedule.shift?.startTime} - {schedule.shift?.endTime}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-4 w-full sm:w-auto justify-between sm:justify-end">
                    <Badge variant="secondary">{schedule.shift?.name}</Badge>
                    <Button variant="outline" size="sm" className="hidden md:flex">View Team</Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}