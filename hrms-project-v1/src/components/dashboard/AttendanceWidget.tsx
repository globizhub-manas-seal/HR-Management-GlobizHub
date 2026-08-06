"use client";

import { useState } from "react";
import axios from "axios";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Clock, MapPin, Loader2, LogIn, LogOut, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";

export function AttendanceWidget() {
  const queryClient = useQueryClient();
  const [locationError, setLocationError] = useState("");
  const [successMessage, setSuccessMessage] = useState("");

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
      queryClient.invalidateQueries({ queryKey: ["dashboardData"] });
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
      queryClient.invalidateQueries({ queryKey: ["dashboardData"] });
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
      // Browser doesn't support GPS, send nulls (Backend will rely on IP Address)
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
        // User denied GPS or it failed. Send nulls so backend can try IP verification.
        clockInMutation.mutate({ latitude: null, longitude: null });
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
    );
  };

  return (
    <Card className="border-slate-200 shadow-sm">
      <CardHeader className="pb-3">
        <CardTitle className="text-lg font-bold text-slate-900 flex items-center">
          <Clock className="w-5 h-5 mr-2 text-emerald-500" />
          Time & Attendance
        </CardTitle>
        <CardDescription>Record your daily attendance</CardDescription>
      </CardHeader>
      
      <CardContent className="space-y-4">
        {/* Status Messages */}
        {locationError && (
          <Alert variant="destructive" className="py-2">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription className="text-xs ml-2">{locationError}</AlertDescription>
          </Alert>
        )}
        {successMessage && (
          <Alert className="py-2 bg-emerald-50 text-emerald-700 border-emerald-200">
            <MapPin className="h-4 w-4 text-emerald-600" />
            <AlertDescription className="text-xs ml-2 font-medium">{successMessage}</AlertDescription>
          </Alert>
        )}

        {/* Action Buttons */}
        <div className="grid grid-cols-2 gap-3 pt-2">
          <Button 
            onClick={handleClockIn} 
            disabled={clockInMutation.isPending || clockOutMutation.isPending}
            className="w-full bg-emerald-500 hover:bg-emerald-600 text-white shadow-sm h-12"
          >
            {clockInMutation.isPending ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <>
                <LogIn className="mr-2 h-4 w-4" /> Clock In
              </>
            )}
          </Button>

          <Button 
            onClick={() => clockOutMutation.mutate()} 
            disabled={clockInMutation.isPending || clockOutMutation.isPending}
            variant="outline"
            className="w-full text-slate-700 border-slate-300 hover:bg-slate-50 h-12"
          >
            {clockOutMutation.isPending ? (
              <Loader2 className="h-4 w-4 animate-spin text-slate-500" />
            ) : (
              <>
                <LogOut className="mr-2 h-4 w-4" /> Clock Out
              </>
            )}
          </Button>
        </div>

        <p className="text-[11px] text-slate-400 text-center pt-2">
          Your location or IP address will be securely recorded for verification.
        </p>
      </CardContent>
    </Card>
  );
}