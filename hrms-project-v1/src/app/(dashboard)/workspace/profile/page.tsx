"use client";

import { useState } from "react";
import { User, Lock, MapPin, Bell, Palette, FileText, Smartphone, Upload, Camera } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";

export default function EmployeeProfileSettings() {
  // In a real app, you would fetch this via React Query from /employees/me
  const [formData, setFormData] = useState<any>({
    firstName: "Davis",
    lastName: "Levin",
    email: "davis@acmecorp.com",
    phone: "+1 555-0192",
    employeeId: "EMP-0042",
    department: "Engineering",
    designation: "Frontend Developer",
    joiningDate: "2023-08-15",
  });

  return (
    <div className="p-4 md:p-8 max-w-6xl mx-auto space-y-8">
      <div>
        <h1 className="text-3xl font-bold text-slate-900">Account Settings</h1>
        <p className="text-slate-500 mt-1">Manage your profile, security, and personal preferences.</p>
      </div>

      {/* Set orientation to vertical so Radix understands the layout intent */}
      <Tabs defaultValue="profile" orientation="vertical" className="flex flex-col md:flex-row gap-8 w-full">
        
        {/* Sidebar Tabs */}
        {/* Removed h-auto and added shrink-0 to prevent the sidebar from crushing on small screens */}
        <TabsList className="flex flex-col w-full md:w-64 bg-transparent space-y-2 h-full items-start justify-start p-0 shrink-0">
          <TabsTrigger value="profile" className="w-full justify-start px-4 py-3 text-sm font-medium data-[state=active]:bg-emerald-50 data-[state=active]:text-emerald-700 data-[state=active]:shadow-none rounded-lg transition-colors">
            <User className="w-4 h-4 mr-3" /> Profile
          </TabsTrigger>
          <TabsTrigger value="security" className="w-full justify-start px-4 py-3 text-sm font-medium data-[state=active]:bg-emerald-50 data-[state=active]:text-emerald-700 data-[state=active]:shadow-none rounded-lg transition-colors">
            <Lock className="w-4 h-4 mr-3" /> Account & Security
          </TabsTrigger>
          <TabsTrigger value="attendance" className="w-full justify-start px-4 py-3 text-sm font-medium data-[state=active]:bg-emerald-50 data-[state=active]:text-emerald-700 data-[state=active]:shadow-none rounded-lg transition-colors">
            <MapPin className="w-4 h-4 mr-3" /> Attendance Prefs
          </TabsTrigger>
          <TabsTrigger value="notifications" className="w-full justify-start px-4 py-3 text-sm font-medium data-[state=active]:bg-emerald-50 data-[state=active]:text-emerald-700 data-[state=active]:shadow-none rounded-lg transition-colors">
            <Bell className="w-4 h-4 mr-3" /> Notifications
          </TabsTrigger>
          <TabsTrigger value="appearance" className="w-full justify-start px-4 py-3 text-sm font-medium data-[state=active]:bg-emerald-50 data-[state=active]:text-emerald-700 data-[state=active]:shadow-none rounded-lg transition-colors">
            <Palette className="w-4 h-4 mr-3" /> Appearance
          </TabsTrigger>
          <TabsTrigger value="documents" className="w-full justify-start px-4 py-3 text-sm font-medium data-[state=active]:bg-emerald-50 data-[state=active]:text-emerald-700 data-[state=active]:shadow-none rounded-lg transition-colors">
            <FileText className="w-4 h-4 mr-3" /> Documents
          </TabsTrigger>
          <TabsTrigger value="devices" className="w-full justify-start px-4 py-3 text-sm font-medium data-[state=active]:bg-emerald-50 data-[state=active]:text-emerald-700 data-[state=active]:shadow-none rounded-lg transition-colors">
            <Smartphone className="w-4 h-4 mr-3" /> Devices
          </TabsTrigger>
        </TabsList>

        {/* Content Area */}
        <div className="flex-1 w-full min-w-0">
          
          {/* TAB 1: PROFILE */}
          <TabsContent value="profile" className="m-0 focus-visible:outline-none focus-visible:ring-0">
            <Card className="border-slate-200 shadow-sm">
              <CardHeader className="border-b border-slate-100 bg-slate-50/50 pb-4">
                <CardTitle className="text-lg text-slate-800">Personal Information</CardTitle>
              </CardHeader>
              <CardContent className="space-y-8 pt-6">
                
                <div className="flex flex-col sm:flex-row items-center sm:items-start gap-6">
                  <Avatar className="h-24 w-24 border-4 border-white shadow-md">
                    <AvatarImage src="" />
                    <AvatarFallback className="bg-emerald-100 text-emerald-700 text-2xl font-bold">DL</AvatarFallback>
                  </Avatar>
                  <div className="text-center sm:text-left space-y-3">
                    <Button variant="outline" size="sm" className="bg-white"><Camera className="w-4 h-4 mr-2" /> Change Photo</Button>
                    <p className="text-xs text-slate-500">JPG, GIF or PNG. Max size of 2MB.</p>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2"><label className="text-sm font-medium text-slate-700">First Name</label><Input value={formData.firstName} className="bg-white" readOnly /></div>
                  <div className="space-y-2"><label className="text-sm font-medium text-slate-700">Last Name</label><Input value={formData.lastName} className="bg-white" readOnly /></div>
                  <div className="space-y-2"><label className="text-sm font-medium text-slate-700">Phone Number</label><Input value={formData.phone} className="bg-white" readOnly /></div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-slate-700">Blood Group</label>
                    <select className="w-full border-slate-200 rounded-md p-2 text-sm bg-white border outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500">
                      <option>O+</option><option>A+</option><option>B+</option><option>AB+</option>
                    </select>
                  </div>
                </div>

                <div className="border-t border-slate-100 pt-8 mt-4">
                  <h3 className="text-sm font-semibold text-slate-800 mb-6">Company Details (Read-Only)</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2"><label className="text-sm font-medium text-slate-500">Employee ID</label><Input value={formData.employeeId} disabled className="bg-slate-50 cursor-not-allowed text-slate-600" /></div>
                    <div className="space-y-2"><label className="text-sm font-medium text-slate-500">Department</label><Input value={formData.department} disabled className="bg-slate-50 cursor-not-allowed text-slate-600" /></div>
                    <div className="space-y-2"><label className="text-sm font-medium text-slate-500">Designation</label><Input value={formData.designation} disabled className="bg-slate-50 cursor-not-allowed text-slate-600" /></div>
                    <div className="space-y-2"><label className="text-sm font-medium text-slate-500">Joining Date</label><Input value={formData.joiningDate} disabled className="bg-slate-50 cursor-not-allowed text-slate-600" /></div>
                  </div>
                </div>
                
                <div className="pt-4 flex justify-end">
                  <Button className="bg-emerald-600 hover:bg-emerald-700 text-white shadow-sm px-8">Save Changes</Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* TAB 6: DOCUMENTS */}
          <TabsContent value="documents" className="m-0 focus-visible:outline-none focus-visible:ring-0">
            <Card className="border-slate-200 shadow-sm">
              <CardHeader className="border-b border-slate-100 bg-slate-50/50 pb-4">
                <CardTitle className="text-lg text-slate-800">Identity Documents</CardTitle>
                <CardDescription>Upload your personal KYC documents for HR verification.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6 pt-6">
                
                {/* PAN Card Upload */}
                <div className="p-5 border border-slate-200 rounded-xl bg-white shadow-sm flex flex-col md:flex-row gap-6 items-start md:items-center justify-between">
                  <div className="flex-1 space-y-3 w-full">
                    <div className="flex items-center space-x-3">
                      <span className="font-semibold text-slate-800">PAN Card</span>
                      <Badge className="bg-emerald-100 text-emerald-700 hover:bg-emerald-100 border-emerald-200">Verified</Badge>
                    </div>
                    <Input placeholder="Enter PAN Number" value="ABCDE1234F" readOnly className="max-w-xs bg-slate-50 text-slate-600 cursor-not-allowed" />
                  </div>
                  <Button variant="outline" size="sm" disabled className="w-full md:w-auto shrink-0 bg-slate-50"><Upload className="w-4 h-4 mr-2" /> Uploaded</Button>
                </div>

                {/* Secure ID Upload Placeholder */}
                <div className="p-5 border border-slate-200 rounded-xl bg-white shadow-sm flex flex-col md:flex-row gap-6 items-start md:items-center justify-between">
                  <div className="flex-1 space-y-3 w-full">
                    <div className="flex items-center space-x-3">
                      <span className="font-semibold text-slate-800">Aadhaar Card</span>
                      <Badge variant="outline" className="text-amber-700 bg-amber-50 border-amber-200">Pending</Badge>
                    </div>
                    <Input placeholder="[Aadhaar Redacted]" className="max-w-xs bg-white focus-visible:ring-emerald-500" />
                  </div>
                  <Button variant="outline" size="sm" className="w-full md:w-auto shrink-0 border-slate-300 hover:bg-slate-50"><Upload className="w-4 h-4 mr-2" /> Upload Front & Back</Button>
                </div>
                
              </CardContent>
            </Card>
          </TabsContent>

          {/* TAB 7: DEVICES */}
          <TabsContent value="devices" className="m-0 focus-visible:outline-none focus-visible:ring-0">
             <Card className="border-slate-200 shadow-sm">
              <CardHeader className="border-b border-slate-100 bg-slate-50/50 pb-4">
                <CardTitle className="text-lg text-slate-800">Registered Devices</CardTitle>
                <CardDescription>Manage devices authorized for attendance check-ins.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6 pt-6">
                <div className="flex items-center justify-between p-5 border border-slate-200 rounded-xl bg-white shadow-sm">
                  <div>
                    <p className="font-semibold text-slate-800 flex items-center">
                      <Smartphone className="w-4 h-4 mr-2 text-slate-400" /> Windows Chrome (Current)
                    </p>
                    <p className="text-xs text-slate-500 mt-1.5 ml-6">Last active: Just now • IP: 192.168.1.1</p>
                  </div>
                  <Badge className="bg-emerald-100 text-emerald-700 hover:bg-emerald-100 border-emerald-200">Approved</Badge>
                </div>
                
                <div className="pt-2">
                  <Button className="w-full bg-slate-900 hover:bg-slate-800 text-white shadow-sm h-11">Register New Device</Button>
                  <p className="text-xs text-center text-slate-500 mt-3">New devices require HR approval before clocking in.</p>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Placeholders */}
          <TabsContent value="security" className="m-0 focus-visible:outline-none"><Card className="shadow-sm"><CardHeader><CardTitle>Security</CardTitle></CardHeader></Card></TabsContent>
          <TabsContent value="attendance" className="m-0 focus-visible:outline-none"><Card className="shadow-sm"><CardHeader><CardTitle>Attendance Prefs</CardTitle></CardHeader></Card></TabsContent>
          <TabsContent value="notifications" className="m-0 focus-visible:outline-none"><Card className="shadow-sm"><CardHeader><CardTitle>Notifications</CardTitle></CardHeader></Card></TabsContent>
          <TabsContent value="appearance" className="m-0 focus-visible:outline-none"><Card className="shadow-sm"><CardHeader><CardTitle>Appearance</CardTitle></CardHeader></Card></TabsContent>

        </div>
      </Tabs>
    </div>
  );
}