"use client";

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import axiosInstance from "axios";
import { Calendar as CalendarIcon, Clock, Users, ArrowLeft, ArrowRight, Sun, Moon, Coffee, Loader2, ArrowLeftRight } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import Link from "next/link";

export default function SchedulesPage() {
  const [currentWeek, setCurrentWeek] = useState("Upcoming 7 Days");
  const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000";

  // Fetch logged-in user profile
  const { data: me } = useQuery({
    queryKey: ["myProfile"],
    queryFn: async () => {
      const token = localStorage.getItem("hrms_token");
      const response = await axiosInstance.get(`${API_URL}/auth/me`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      return response.data;
    },
  });

  // Fetch real schedule data from NestJS endpoint
  const { data: schedules, isLoading, error } = useQuery({
    queryKey: ["mySchedule"],
    queryFn: async () => {
      const token = localStorage.getItem("hrms_token");
      const response = await axiosInstance.get(`${API_URL}/schedules/me`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      return response.data;
    },
  });

  const formatScheduleDate = (dateString: string) => {
    const date = new Date(dateString);
    const today = new Date();
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    if (date.toDateString() === today.toDateString()) return "Today";
    if (date.toDateString() === tomorrow.toDateString()) return "Tomorrow";
    
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  };

  const getDayName = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', { weekday: 'short' });
  };

  const getShiftIcon = (isDayOff: boolean, isNightShift?: boolean) => {
    if (isDayOff) return <Coffee className="w-5 h-5 text-slate-400" />;
    if (isNightShift) return <Moon className="w-5 h-5 text-indigo-500" />;
    return <Sun className="w-5 h-5 text-amber-500" />;
  };

  const getShiftStyle = (isDayOff: boolean, isNightShift?: boolean, isOverride?: boolean) => {
    if (isOverride) {
      if (isDayOff) return "bg-rose-50 border-rose-200 text-rose-900"; // Given away
      return "bg-emerald-50 border-emerald-200 text-emerald-950 shadow-sm"; // Proxy swap
    }
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
          <h1 className="text-3xl font-bold text-slate-900">My Roster</h1>
          <p className="text-slate-500 mt-1">View your assigned shifts, schedules, and active overrides.</p>
        </div>
        
        <div className="flex items-center gap-3">
          <Link href="/workspace/schedules/shift-swaps">
            <Button variant="outline" className="flex items-center border-slate-200 hover:bg-slate-50">
              <ArrowLeftRight className="w-4 h-4 mr-2 text-indigo-500" /> Shift Swaps
            </Button>
          </Link>

          {/* Week Navigation */}
          <div className="flex items-center space-x-2 bg-white border border-slate-200 rounded-xl p-1 shadow-sm">
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
      </div>

      {/* Weekly Visual Grid */}
      <Card className="border-slate-200 shadow-sm overflow-hidden">
        <CardHeader className="bg-slate-50/50 border-b border-slate-100 pb-4">
          <CardTitle className="text-lg">Weekly Overview</CardTitle>
          <CardDescription>A quick glance at your week ahead showing active schedules.</CardDescription>
        </CardHeader>
        <CardContent className="p-6">
          {schedules?.length === 0 ? (
            <div className="text-center py-8 text-slate-500">No shifts assigned for this week yet.</div>
          ) : (
            <div className="grid grid-cols-2 md:grid-cols-5 lg:grid-cols-7 gap-4">
              {schedules?.map((schedule: any) => {
                const isGiver = schedule.isOverride && schedule.isDayOff;
                const isProxy = schedule.isOverride && !schedule.isDayOff;
                
                return (
                  <div key={schedule.id} className={`flex flex-col p-4 rounded-xl border ${getShiftStyle(schedule.isDayOff, schedule.shift?.isNightShift, schedule.isOverride)} transition-all hover:shadow-md`}>
                    <div className="flex justify-between items-start mb-4">
                      <div>
                        <p className="text-sm font-bold uppercase tracking-wider">{getDayName(schedule.date)}</p>
                        <p className="text-xs font-medium opacity-80">{formatScheduleDate(schedule.date)}</p>
                      </div>
                      {getShiftIcon(schedule.isDayOff, schedule.shift?.isNightShift)}
                    </div>
                    
                    <div className="mt-auto space-y-2">
                      <Badge variant="outline" className={`bg-white/50 border-white/40 shadow-sm text-xs truncate w-full flex justify-center ${schedule.isOverride ? 'font-bold' : ''}`}>
                        {isGiver ? 'Shift Given' : isProxy ? 'Proxy Swap' : schedule.isDayOff ? 'Day Off' : schedule.shift?.name}
                      </Badge>
                      
                      {/* Override details */}
                      {isGiver && (
                        <p className="text-[10px] text-rose-700 font-semibold text-center truncate">
                          To {schedule.relatedSwapRequest?.requester?.firstName}
                        </p>
                      )}
                      {isProxy && (
                        <p className="text-[10px] text-emerald-800 font-semibold text-center truncate">
                          For {schedule.relatedSwapRequest?.target?.firstName}
                        </p>
                      )}
                      
                      <p className="text-xs font-semibold mt-2 text-center">
                        {schedule.isDayOff ? '--:--' : `${schedule.shift?.startTime} - ${schedule.shift?.endTime}`}
                      </p>
                    </div>
                  </div>
                );
              })}
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
          {schedules?.filter((s: any) => !s.isDayOff || s.isOverride).length === 0 ? (
            <div className="text-center py-6 text-slate-500">No upcoming active shifts to display.</div>
          ) : (
            <div className="space-y-4">
              {schedules?.filter((s: any) => !s.isDayOff || s.isOverride).map((schedule: any) => {
                const isGiver = schedule.isOverride && schedule.isDayOff;
                const isProxy = schedule.isOverride && !schedule.isDayOff;

                return (
                  <div key={schedule.id} className={`flex flex-col sm:flex-row items-start sm:items-center justify-between p-4 border rounded-xl transition-colors ${
                    isGiver ? 'bg-rose-50/40 border-rose-100 hover:bg-rose-50/70' :
                    isProxy ? 'bg-emerald-50/40 border-emerald-100 hover:bg-emerald-50/70' :
                    'bg-slate-50 border-slate-100 hover:bg-slate-100/50'
                  }`}>
                    <div className="flex items-center space-x-4 mb-3 sm:mb-0">
                      <div className={`p-3 rounded-xl ${
                        isGiver ? 'bg-rose-100 text-rose-600' :
                        isProxy ? 'bg-emerald-100 text-emerald-600' :
                        schedule.shift?.isNightShift ? 'bg-indigo-100 text-indigo-600' : 'bg-amber-100 text-amber-600'
                      }`}>
                        {getShiftIcon(schedule.isDayOff, schedule.shift?.isNightShift)}
                      </div>
                      <div>
                        <h4 className="font-semibold text-slate-900">
                          {formatScheduleDate(schedule.date)} ({getDayName(schedule.date)})
                          {schedule.isOverride && (
                            <span className="ml-2 text-xs font-bold uppercase tracking-wider text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded-full border border-indigo-100">
                              Override
                            </span>
                          )}
                        </h4>
                        <p className="text-sm text-slate-500 flex items-center mt-1">
                          <Clock className="w-3.5 h-3.5 mr-1" /> 
                          {isGiver ? "No attendance required" : `${schedule.shift?.startTime} - ${schedule.shift?.endTime}`}
                          {isGiver && (
                            <span className="ml-1 text-slate-400">
                              (Shift transferred to {schedule.relatedSwapRequest?.requester?.firstName} {schedule.relatedSwapRequest?.requester?.lastName})
                            </span>
                          )}
                          {isProxy && (
                            <span className="ml-1 text-slate-500 font-medium">
                              (Proxy working on behalf of {schedule.relatedSwapRequest?.target?.firstName} {schedule.relatedSwapRequest?.target?.lastName})
                            </span>
                          )}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center space-x-4 w-full sm:w-auto justify-between sm:justify-end">
                      <Badge variant={isGiver ? "destructive" : isProxy ? "default" : "secondary"}>
                        {isGiver ? 'Shift Given' : isProxy ? 'Proxy' : schedule.shift?.name}
                      </Badge>
                      <Button variant="outline" size="sm" className="hidden md:flex">View Team</Button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}