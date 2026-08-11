"use client";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import axios from "axios";
import { Calendar, Plus, Trash2, Loader2, PartyPopper } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export default function HolidayCalendarPage() {
  const queryClient = useQueryClient();
  const [formData, setFormData] = useState({ name: "", date: "", type: "NATIONAL" });

  // 1. Fetch Holidays
  const { data: holidays, isLoading } = useQuery({
    queryKey: ["holidays"],
    queryFn: async () => {
      const token = localStorage.getItem("hrms_token");
      const res = await axios.get(`${process.env.NEXT_PUBLIC_API_URL}/leave/holidays`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      return res.data;
    }
  });

  // 2. Add Holiday Mutation
  const addHolidayMutation = useMutation({
    mutationFn: async (data: any) => {
      const token = localStorage.getItem("hrms_token");
      await axios.post(`${process.env.NEXT_PUBLIC_API_URL}/leave/holidays`, data, {
        headers: { Authorization: `Bearer ${token}` }
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["holidays"] });
      setFormData({ name: "", date: "", type: "NATIONAL" });
    }
  });

  // 3. Delete Holiday Mutation
  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const token = localStorage.getItem("hrms_token");
      await axios.delete(`${process.env.NEXT_PUBLIC_API_URL}/leave/holidays/${id}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["holidays"] })
  });

  if (isLoading) return <div className="p-8"><Loader2 className="w-8 h-8 animate-spin text-emerald-500" /></div>;

  return (
    <div className="p-4 md:p-8 max-w-5xl mx-auto space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-slate-900">Holiday Calendar</h1>
        <p className="text-slate-500 mt-1">Manage public and company holidays. These days will not be deducted from employee leave balances.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        
        {/* ADD HOLIDAY FORM */}
        <div className="md:col-span-1">
          <Card className="sticky top-6">
            <CardHeader>
              <CardTitle className="text-lg">Add New Holiday</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">Holiday Name</label>
                <Input 
                  placeholder="e.g. Diwali, Christmas" 
                  value={formData.name}
                  onChange={(e) => setFormData({...formData, name: e.target.value})}
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Date</label>
                <Input 
                  type="date"
                  value={formData.date}
                  onChange={(e) => setFormData({...formData, date: e.target.value})}
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Type</label>
                <select 
                  className="w-full border-slate-200 rounded-md p-2 text-sm bg-white border"
                  value={formData.type}
                  onChange={(e) => setFormData({...formData, type: e.target.value})}
                >
                  <option value="NATIONAL">National Holiday</option>
                  <option value="REGIONAL">Regional Holiday</option>
                  <option value="COMPANY">Company Holiday</option>
                </select>
              </div>
              <Button 
                className="w-full bg-emerald-600 hover:bg-emerald-700 text-white"
                onClick={() => addHolidayMutation.mutate(formData)}
                disabled={!formData.name || !formData.date || addHolidayMutation.isPending}
              >
                <Plus className="w-4 h-4 mr-2" /> Add to Calendar
              </Button>
            </CardContent>
          </Card>
        </div>

        {/* HOLIDAYS LIST */}
        <div className="md:col-span-2 space-y-4">
          {holidays?.length === 0 ? (
            <div className="bg-slate-50 border-2 border-dashed rounded-xl h-64 flex flex-col items-center justify-center text-slate-500">
              <Calendar className="w-12 h-12 mb-4 text-slate-300" />
              <p>No holidays added for this year.</p>
            </div>
          ) : (
            holidays?.map((holiday: any) => (
              <div key={holiday.id} className="flex items-center justify-between p-4 border rounded-xl bg-white shadow-sm">
                <div className="flex items-center space-x-4">
                  <div className="bg-emerald-100 p-3 rounded-lg text-emerald-700">
                    <PartyPopper className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-slate-900">{holiday.name}</h3>
                    <p className="text-sm text-slate-500">
                      {new Date(holiday.date).toLocaleDateString(undefined, { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
                    </p>
                  </div>
                </div>
                <div className="flex items-center space-x-4">
                  <span className={`text-xs font-semibold px-2 py-1 rounded-full ${holiday.type === 'NATIONAL' ? 'bg-blue-100 text-blue-700' : 'bg-purple-100 text-purple-700'}`}>
                    {holiday.type}
                  </span>
                  <Button 
                    variant="ghost" 
                    size="icon" 
                    className="text-rose-400 hover:text-rose-600 hover:bg-rose-50"
                    onClick={() => deleteMutation.mutate(holiday.id)}
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}