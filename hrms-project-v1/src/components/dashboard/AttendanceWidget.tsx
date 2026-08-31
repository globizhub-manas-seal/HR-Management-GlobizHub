"use client";

import { useState, useEffect } from "react";
import axios from "axios";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Clock, MapPin, Loader2, LogIn, LogOut, AlertCircle, CheckCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";

export function AttendanceWidget() {
  const queryClient = useQueryClient();
  const [locationError, setLocationError] = useState("");
  const [successMessage, setSuccessMessage] = useState("");
  const [secondsWorked, setSecondsWorked] = useState(0);

  // 1. Fetch today's attendance stats for the logged-in user
  const { data: stats, isLoading: statsLoading } = useQuery({
    queryKey: ["myDashboardStats"],
    queryFn: async () => {
      const token = localStorage.getItem("hrms_token");
      const response = await axios.get(
        `${process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000"}/attendance/my-stats`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      return response.data;
    },
  });

  // Calculate work duration in seconds and manage ticking clock interval
  useEffect(() => {
    let interval: NodeJS.Timeout;

    const updateTimer = () => {
      if (stats?.checkInTime) {
        const start = new Date(stats.checkInTime).getTime();
        const end = stats.checkOutTime ? new Date(stats.checkOutTime).getTime() : Date.now();
        const diff = Math.max(0, Math.floor((end - start) / 1000));
        setSecondsWorked(diff);
      } else {
        setSecondsWorked(0);
      }
    };

    updateTimer();

    // Only tick when clocked in and not clocked out yet
    if (stats?.checkInTime && !stats?.checkOutTime) {
      interval = setInterval(updateTimer, 1000);
    }

    return () => {
      if (interval) clearInterval(interval);
    };
  }, [stats?.checkInTime, stats?.checkOutTime]);

  // Mutation for Clocking In
  const clockInMutation = useMutation({
    mutationFn: async (coords: { latitude: number | null; longitude: number | null }) => {
      const token = localStorage.getItem("hrms_token");
      const response = await axios.post(
        `${process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000"}/attendance/clock-in`,
        coords,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      return response.data;
    },
    onSuccess: (data) => {
      setSuccessMessage(data.message || "Successfully clocked in!");
      setLocationError("");
      queryClient.invalidateQueries({ queryKey: ["myDashboardStats"] });
      queryClient.invalidateQueries({ queryKey: ["adminDashboardStats"] });
    },
    onError: (error: any) => {
      setLocationError(error.response?.data?.message || "Failed to clock in. Please try again.");
      setSuccessMessage("");
    },
  });

  // Mutation for Clocking Out
  const clockOutMutation = useMutation({
    mutationFn: async () => {
      const token = localStorage.getItem("hrms_token");
      const response = await axios.post(
        `${process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000"}/attendance/clock-out`,
        {},
        { headers: { Authorization: `Bearer ${token}` } }
      );
      return response.data;
    },
    onSuccess: (data) => {
      setSuccessMessage(data.message || "Successfully clocked out!");
      setLocationError("");
      queryClient.invalidateQueries({ queryKey: ["myDashboardStats"] });
      queryClient.invalidateQueries({ queryKey: ["adminDashboardStats"] });
    },
    onError: (error: any) => {
      setLocationError(error.response?.data?.message || "Failed to clock out.");
      setSuccessMessage("");
    },
  });

  const handleClockIn = () => {
    setLocationError("");
    setSuccessMessage("");

    if (!navigator.geolocation) {
      clockInMutation.mutate({ latitude: null, longitude: null });
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        clockInMutation.mutate({
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
        });
      },
      (error) => {
        console.warn("Geolocation error:", error);
        clockInMutation.mutate({ latitude: null, longitude: null });
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
    );
  };

  const formatTime = (totalSeconds: number) => {
    const hrs = Math.floor(totalSeconds / 3600);
    const mins = Math.floor((totalSeconds % 3600) / 60);
    const secs = totalSeconds % 60;
    return `${hrs.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const isClockedIn = !!stats?.checkInTime && !stats?.checkOutTime;
  const hasClockedOut = !!stats?.checkInTime && !!stats?.checkOutTime;
  const hasNotClockedIn = !stats?.checkInTime;

  // SVG configurations for time tracker circle (Radius 50 -> Circumference 314.159)
  const radius = 50;
  const stroke = 6;
  const normalizedRadius = radius - stroke * 2;
  const circumference = normalizedRadius * 2 * Math.PI;
  
  // Progress is relative to an 8-hour workday (28,800 seconds)
  const workGoalSeconds = 8 * 3600;
  const progressPercent = Math.min(100, (secondsWorked / workGoalSeconds) * 100);
  const strokeDashoffset = circumference - (progressPercent / 100) * circumference;

  return (
    <Card className="border-border bg-card shadow-sm">
      <CardHeader className="pb-3">
        <CardTitle className="text-lg font-bold text-foreground flex items-center">
          <Clock className="w-5 h-5 mr-2 text-primary" />
          Time & Attendance
        </CardTitle>
        <CardDescription className="text-muted-foreground">Record your daily attendance</CardDescription>
      </CardHeader>
      
      <CardContent className="space-y-6 flex flex-col items-center">
        
        {/* CIRCULAR TIMER DISPLAY */}
        <div className="relative flex items-center justify-center w-36 h-36 my-2 select-none">
          <svg className="w-full h-full transform -rotate-90">
            {/* Background track circle */}
            <circle
              className="text-muted/40 stroke-current"
              strokeWidth={stroke}
              fill="transparent"
              r={normalizedRadius}
              cx={72}
              cy={72}
            />
            {/* Active yellow progress circle */}
            <circle
              className="text-primary stroke-current transition-all duration-500 ease-out"
              strokeWidth={stroke}
              strokeDasharray={circumference + " " + circumference}
              style={{ strokeDashoffset }}
              strokeLinecap="round"
              fill="transparent"
              r={normalizedRadius}
              cx={72}
              cy={72}
            />
          </svg>
          
          {/* Central digital clock values */}
          <div className="absolute flex flex-col items-center justify-center text-center">
            <span className="text-xl font-bold tracking-tight text-foreground font-mono">
              {statsLoading ? "00:00:00" : formatTime(secondsWorked)}
            </span>
            <span className="text-[9px] font-bold uppercase tracking-wider text-muted-foreground mt-1">
              {statsLoading ? (
                "Loading..."
              ) : isClockedIn ? (
                "Working Today"
              ) : hasClockedOut ? (
                "Shift Ended"
              ) : (
                "Work Time"
              )}
            </span>
          </div>
        </div>

        {/* Status Messages */}
        <div className="w-full space-y-2">
          {locationError && (
            <Alert variant="destructive" className="py-2">
              <AlertCircle className="h-4 w-4 animate-bounce" />
              <AlertDescription className="text-xs ml-2">{locationError}</AlertDescription>
            </Alert>
          )}
          {successMessage && (
            <Alert className="py-2 bg-primary/20 text-secondary border-primary/30">
              <MapPin className="h-4 w-4 text-primary" />
              <AlertDescription className="text-xs ml-2 font-medium">{successMessage}</AlertDescription>
            </Alert>
          )}
          {hasClockedOut && (
            <Alert className="py-2 bg-muted text-muted-foreground border-border">
              <CheckCircle className="h-4 w-4 text-muted-foreground" />
              <AlertDescription className="text-xs ml-2 font-medium">Your work record for today is complete.</AlertDescription>
            </Alert>
          )}
        </div>

        {/* Action Buttons */}
        <div className="grid grid-cols-2 gap-3 w-full pt-2">
          <Button 
            onClick={handleClockIn} 
            disabled={statsLoading || clockInMutation.isPending || clockOutMutation.isPending || isClockedIn || hasClockedOut}
            className="w-full bg-primary hover:bg-primary/90 text-secondary font-bold shadow-sm h-12"
          >
            {clockInMutation.isPending ? (
              <Loader2 className="h-4 w-4 animate-spin text-secondary" />
            ) : (
              <>
                <LogIn className="mr-2 h-4 w-4" /> Clock In
              </>
            )}
          </Button>

          <Button 
            onClick={() => clockOutMutation.mutate()} 
            disabled={statsLoading || clockInMutation.isPending || clockOutMutation.isPending || hasNotClockedIn || hasClockedOut}
            variant="outline"
            className="w-full text-foreground border-border hover:bg-muted/10 h-12"
          >
            {clockOutMutation.isPending ? (
              <Loader2 className="h-4 w-4 animate-spin text-muted-foreground/60" />
            ) : (
              <>
                <LogOut className="mr-2 h-4 w-4" /> Clock Out
              </>
            )}
          </Button>
        </div>

        <p className="text-[11px] text-muted-foreground/60 text-center">
          Your location or IP address will be securely recorded for verification.
        </p>
      </CardContent>
    </Card>
  );
}