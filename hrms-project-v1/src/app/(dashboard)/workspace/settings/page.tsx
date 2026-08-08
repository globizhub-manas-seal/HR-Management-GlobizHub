"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import axios from "axios";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useState, useEffect } from "react";
import { Loader2, Save, MapPin, Wifi, Clock, Shield, Building, Network, Banknote, Plus, Trash2 } from "lucide-react";

export default function SettingsPage() {

  // ... underneath your existing settings useQuery ...
  
  const token = typeof window !== 'undefined' ? localStorage.getItem("hrms_token") : "";
  const headers = { Authorization: `Bearer ${token}` };

  const { data: branches } = useQuery({
    queryKey: ["branches"],
    queryFn: async () => (await axios.get(`${process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000"}/organization/branches`, { headers })).data
  });
  
  const { data: departments } = useQuery({
    queryKey: ["departments"],
    queryFn: async () => (await axios.get(`${process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000"}/organization/departments`, { headers })).data
  });
  
  const { data: roles } = useQuery({
    queryKey: ["roles"],
    queryFn: async () => (await axios.get(`${process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000"}/organization/roles`, { headers })).data
  });

  const queryClient = useQueryClient();
  const [formData, setFormData] = useState<any>({});

  // 1. Fetch Current Settings
  const { data: settings, isLoading } = useQuery({
    queryKey: ["companySettings"],
    queryFn: async () => {
      const token = localStorage.getItem("hrms_token");
      const res = await axios.get(`${process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000"}/settings`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      return res.data;
    },
  });

  useEffect(() => {
    if (settings) setFormData(settings);
  }, [settings]);

  // 2. Mutation to Save Settings
  const saveMutation = useMutation({
    mutationFn: async (updatedData: any) => {
      const token = localStorage.getItem("hrms_token");
      await axios.patch(`${process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000"}/settings`, updatedData, {
        headers: { Authorization: `Bearer ${token}` }
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["companySettings"] });
      alert("Settings saved successfully!");
    },
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    const finalValue = type === 'checkbox' ? (e.target as HTMLInputElement).checked : value;
    setFormData((prev: any) => ({ ...prev, [name]: finalValue }));
  };

  const handleSave = () => {
    // Convert string fields to exact numeric types before sending to Prisma
    const dataToSave = {
      ...formData,
      allowedRadiusMeters: parseInt(formData.allowedRadiusMeters || 100),
      gracePeriodMinutes: parseInt(formData.gracePeriodMinutes || 15),
      defaultCasualLeaves: parseInt(formData.defaultCasualLeaves || 12),
      defaultSickLeaves: parseInt(formData.defaultSickLeaves || 10),
      defaultEarnedLeaves: parseInt(formData.defaultEarnedLeaves || 15),
      sessionTimeoutHours: parseInt(formData.sessionTimeoutHours || 24),
      
      // Explicitly convert latitude and longitude to Floats
      officeLatitude: formData.officeLatitude ? parseFloat(formData.officeLatitude) : null,
      officeLongitude: formData.officeLongitude ? parseFloat(formData.officeLongitude) : null,
    };
    
    saveMutation.mutate(dataToSave);
  };

  // --- Auto-Detect Utilities ---
  const handleAutoLocation = () => {
    if (!navigator.geolocation) {
      alert("Geolocation is not supported by your browser");
      return;
    }
    navigator.geolocation.getCurrentPosition(
      (position) => {
        setFormData((prev: any) => ({
          ...prev,
          officeLatitude: position.coords.latitude.toString(),
          officeLongitude: position.coords.longitude.toString(),
        }));
      },
      () => alert("Unable to retrieve your location. Please allow location access.")
    );
  };

  const handleAutoIP = async () => {
    try {
      const res = await axios.get("https://api.ipify.org?format=json");
      setFormData((prev: any) => ({
        ...prev,
        officeIpAddress: res.data.ip,
      }));
    } catch (error) {
      alert("Failed to fetch IP address.");
    }
  };

  if (isLoading) {
    return <div className="flex h-96 items-center justify-center"><Loader2 className="h-8 w-8 animate-spin text-emerald-500" /></div>;
  }

  return (
    <div className="p-8 max-w-6xl mx-auto space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-slate-900">Company Settings</h1>
          <p className="text-slate-500 mt-1">Manage your organization's core configuration and rules.</p>
        </div>
        <Button onClick={handleSave} disabled={saveMutation.isPending} className="bg-emerald-500 hover:bg-emerald-600 text-white">
          {saveMutation.isPending ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Save className="w-4 h-4 mr-2" />}
          Save Changes
        </Button>
      </div>

      {/* The main Tabs wrapper that provides context for all triggers and content */}
     <Tabs defaultValue="general" className="w-full">
        
        {/* Updated Navigation Bar */}
        <TabsList className="flex w-full h-auto flex-wrap gap-2 bg-slate-100 p-1">
          <TabsTrigger value="general" className="flex-1 min-w-[120px]"><Building className="w-4 h-4 mr-2" /> General</TabsTrigger>
          <TabsTrigger value="organization" className="flex-1 min-w-[120px]"><Network className="w-4 h-4 mr-2" /> Organization</TabsTrigger>
          <TabsTrigger value="attendance" className="flex-1 min-w-[120px]"><MapPin className="w-4 h-4 mr-2" /> Attendance</TabsTrigger>
          <TabsTrigger value="shifts" className="flex-1 min-w-[120px]"><Clock className="w-4 h-4 mr-2" /> Shifts</TabsTrigger>
          <TabsTrigger value="leaves" className="flex-1 min-w-[120px]"><Wifi className="w-4 h-4 mr-2" /> Leaves</TabsTrigger>
          <TabsTrigger value="payroll" className="flex-1 min-w-[120px]"><Banknote className="w-4 h-4 mr-2" /> Payroll</TabsTrigger>
          <TabsTrigger value="security" className="flex-1 min-w-[120px]"><Shield className="w-4 h-4 mr-2" /> Security</TabsTrigger>
        </TabsList>

        {/* TAB 1: GENERAL (Organization Profile) */}
        <TabsContent value="general" className="mt-6 space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Corporate Identity</CardTitle>
              <CardDescription>Your official registered company details.</CardDescription>
            </CardHeader>
            <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <label className="text-sm font-medium">Display Name (Brand)</label>
                <Input name="companyName" value={formData.companyName || ""} onChange={handleChange} placeholder="e.g. Acme Corp" />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Legal Entity Name</label>
                <Input name="legalName" value={formData.legalName || ""} onChange={handleChange} placeholder="e.g. Acme Corporation Pvt. Ltd." />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Industry / Sector</label>
                <Input name="industry" value={formData.industry || ""} onChange={handleChange} placeholder="e.g. SaaS, Healthcare" />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Company Website</label>
                <Input name="website" type="url" value={formData.website || ""} onChange={handleChange} placeholder="https://..." />
              </div>
              {/* Add this inside the Corporate Identity CardContent */}
              <div className="space-y-2">
                <label className="text-sm font-medium">Brand Theme Color</label>
                <div className="flex items-center space-x-3">
                  <Input 
                    type="color" 
                    name="themeColor" 
                    value={formData.themeColor || "#10b981"} 
                    onChange={handleChange} 
                    className="w-16 h-10 p-1 cursor-pointer" 
                  />
                  <span className="text-sm text-slate-500">{formData.themeColor || "#10b981"}</span>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Legal & Compliance</CardTitle>
              <CardDescription>Tax and government registration numbers.</CardDescription>
            </CardHeader>
            <CardContent className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="space-y-2">
                <label className="text-sm font-medium">Registration No. (CIN)</label>
                <Input name="registrationNumber" value={formData.registrationNumber || ""} onChange={handleChange} />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Tax ID (GSTIN/VAT/EIN)</label>
                <Input name="taxId" value={formData.taxId || ""} onChange={handleChange} />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Date of Incorporation</label>
                <Input type="date" name="incorporationDate" value={formData.incorporationDate || ""} onChange={handleChange} />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Contact & Headquarters</CardTitle>
              <CardDescription>Primary communication and billing address.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="space-y-2">
                  <label className="text-sm font-medium">Official Email</label>
                  <Input type="email" name="officialEmail" value={formData.officialEmail || ""} onChange={handleChange} />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">Support/Contact Phone</label>
                  <Input type="tel" name="officialPhone" value={formData.officialPhone || ""} onChange={handleChange} />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">Time Zone</label>
                  <select name="timeZone" value={formData.timeZone || "UTC"} onChange={handleChange} className="w-full border rounded-md p-2 text-sm bg-white">
                    <option value="Asia/Kolkata">Asia/Kolkata (IST)</option>
                    <option value="America/New_York">America/New_York (EST)</option>
                    <option value="Europe/London">Europe/London (GMT)</option>
                    <option value="UTC">UTC</option>
                  </select>
                </div>
              </div>

              <div className="border-t pt-6 grid grid-cols-1 md:grid-cols-4 gap-6">
                <div className="md:col-span-4 space-y-2">
                  <label className="text-sm font-medium">Street Address</label>
                  <Input name="officeAddress" value={formData.officeAddress || ""} onChange={handleChange} />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">City</label>
                  <Input name="city" value={formData.city || ""} onChange={handleChange} />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">State / Province</label>
                  <Input name="state" value={formData.state || ""} onChange={handleChange} />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">Country</label>
                  <Input name="country" value={formData.country || ""} onChange={handleChange} />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">ZIP / Postal Code</label>
                  <Input name="zipCode" value={formData.zipCode || ""} onChange={handleChange} />
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* TAB: ORGANIZATION (Branches, Departments, Roles) */}
        <TabsContent value="organization" className="mt-6 space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            
            {/* Branches Card */}
            <Card className="col-span-1">
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <div>
                  <CardTitle className="text-lg">Branches</CardTitle>
                  <CardDescription>Manage office locations.</CardDescription>
                </div>
                <Button size="sm" variant="outline" className="h-8"><Plus className="w-4 h-4 mr-1" /> Add</Button>
              </CardHeader>
              <CardContent>
              <div className="space-y-3 mt-4">
                {branches?.length === 0 && <p className="text-sm text-slate-500">No branches added.</p>}
                {branches?.map((branch: any) => (
                  <div key={branch.id} className="flex justify-between items-center p-3 border rounded-lg bg-slate-50">
                    <span className="text-sm font-medium">{branch.name}</span>
                    <Button variant="ghost" size="icon" className="h-6 w-6 text-rose-500"><Trash2 className="w-4 h-4" /></Button>
                  </div>
                ))}
              </div>
              </CardContent>
            </Card>

            {/* Departments Card */}
            <Card className="col-span-1">
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <div>
                  <CardTitle className="text-lg">Departments</CardTitle>
                  <CardDescription>Company divisions.</CardDescription>
                </div>
                <Button size="sm" variant="outline" className="h-8"><Plus className="w-4 h-4 mr-1" /> Add</Button>
              </CardHeader>
              <CardContent>
               <div className="space-y-3 mt-4">
                {departments?.length === 0 && <p className="text-sm text-slate-500">No departments added.</p>}
                {departments?.map((dept: any) => (
                  <div key={dept.id} className="flex justify-between items-center p-3 border rounded-lg bg-slate-50">
                    <span className="text-sm font-medium">{dept.name}</span>
                    <Button variant="ghost" size="icon" className="h-6 w-6 text-rose-500"><Trash2 className="w-4 h-4" /></Button>
                  </div>
                ))}
              </div>
              </CardContent>
            </Card>

            {/* Roles Card */}
            <Card className="col-span-1">
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <div>
                  <CardTitle className="text-lg">Roles</CardTitle>
                  <CardDescription>Job designations.</CardDescription>
                </div>
                <Button size="sm" variant="outline" className="h-8"><Plus className="w-4 h-4 mr-1" /> Add</Button>
              </CardHeader>
              <CardContent>
               <div className="space-y-3 mt-4">
                {roles?.length === 0 && <p className="text-sm text-slate-500">No roles added.</p>}
                {roles?.map((role: any) => (
                  <div key={role.id} className="flex justify-between items-center p-3 border rounded-lg bg-slate-50">
                    <span className="text-sm font-medium">{role.name}</span>
                    <Button variant="ghost" size="icon" className="h-6 w-6 text-rose-500"><Trash2 className="w-4 h-4" /></Button>
                  </div>
                ))}
              </div>
              </CardContent>
            </Card>

          </div>
        </TabsContent>

        {/* TAB 2: ATTENDANCE CONFIGURATION */}
        <TabsContent value="attendance" className="mt-6 space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>GPS & Wi-Fi Restrictions</CardTitle>
              <CardDescription>Configure how employees can clock in.</CardDescription>
            </CardHeader>
            <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-8">
              
              <div className="space-y-4">
                <h3 className="font-semibold text-slate-700 border-b pb-2">Location Setup</h3>
                <div className="flex items-center space-x-2">
                  <input type="checkbox" name="enableGps" checked={formData.enableGps || false} onChange={handleChange} className="w-4 h-4 text-emerald-600" />
                  <label className="text-sm font-medium">Enable GPS Verification</label>
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Office Latitude</label>
                    <Input type="number" step="any" name="officeLatitude" value={formData.officeLatitude || ""} onChange={handleChange} placeholder="e.g. 28.6139" />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Office Longitude</label>
                    <Input type="number" step="any" name="officeLongitude" value={formData.officeLongitude || ""} onChange={handleChange} placeholder="e.g. 77.2090" />
                  </div>
                </div>
                
                <Button variant="secondary" size="sm" onClick={handleAutoLocation} className="w-full bg-blue-50 text-blue-600 hover:bg-blue-100 border border-blue-200">
                  <MapPin className="w-4 h-4 mr-2" /> Detect Current Location
                </Button>

                <div className="space-y-2 pt-2">
                  <label className="text-sm font-medium">Allowed Radius (meters)</label>
                  <select name="allowedRadiusMeters" value={formData.allowedRadiusMeters || 100} onChange={handleChange} className="w-full border rounded-md p-2 text-sm bg-white">
                    <option value="25">25m (Very Strict)</option>
                    <option value="50">50m</option>
                    <option value="100">100m (Standard)</option>
                    <option value="200">200m</option>
                  </select>
                </div>
              </div>

              <div className="space-y-4">
                <h3 className="font-semibold text-slate-700 border-b pb-2">Network Setup</h3>
                <div className="flex items-center space-x-2">
                  <input type="checkbox" name="isIpRestrictionOn" checked={formData.isIpRestrictionOn || false} onChange={handleChange} className="w-4 h-4 text-emerald-600" />
                  <label className="text-sm font-medium">Enable Wi-Fi / IP Restriction</label>
                </div>
                
                <div className="space-y-2 pt-2">
                  <label className="text-sm font-medium">Office IP Address</label>
                  <div className="flex space-x-2">
                    <Input type="text" name="officeIpAddress" value={formData.officeIpAddress || ""} onChange={handleChange} placeholder="e.g., 192.168.1.38" className="flex-1" />
                    <Button variant="secondary" onClick={handleAutoIP} className="bg-emerald-50 text-emerald-700 hover:bg-emerald-100 border border-emerald-200">
                      <Wifi className="w-4 h-4 mr-2" /> Detect IP
                    </Button>
                  </div>
                  <p className="text-xs text-slate-500">Employees must be on this network to clock in.</p>
                </div>
              </div>

            </CardContent>
          </Card>
        </TabsContent>

        {/* TAB 3: SHIFTS */}
        <TabsContent value="shifts" className="mt-6 space-y-6">
           <Card>
            <CardHeader>
              <CardTitle>Shift & Timing Rules</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label className="text-sm font-medium">Office Start Time</label>
                  <Input type="time" name="officeStartTime" value={formData.officeStartTime || "09:00"} onChange={handleChange} />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">Office End Time</label>
                  <Input type="time" name="officeEndTime" value={formData.officeEndTime || "18:00"} onChange={handleChange} />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">Grace Period (Minutes)</label>
                  <Input type="number" name="gracePeriodMinutes" value={formData.gracePeriodMinutes || 15} onChange={handleChange} />
                </div>
              </div>

              {/* Working Days Selector */}
              <div className="space-y-3 pt-4 border-t">
                <label className="text-sm font-medium">Working Days</label>
                <div className="flex flex-wrap gap-2">
                  {["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"].map(day => (
                    <label key={day} className={`px-4 py-2 border rounded-full text-sm cursor-pointer transition-colors ${formData.workingDays?.includes(day) ? 'bg-emerald-100 border-emerald-500 text-emerald-800' : 'bg-slate-50 hover:bg-slate-100 text-slate-600'}`}>
                      <input 
                        type="checkbox" 
                        className="hidden"
                        checked={formData.workingDays?.includes(day) || false}
                        onChange={(e) => {
                          const currentDays = formData.workingDays || [];
                          const newDays = e.target.checked 
                            ? [...currentDays, day] 
                            : currentDays.filter((d: string) => d !== day);
                          setFormData({...formData, workingDays: newDays});
                        }}
                      />
                      {day}
                    </label>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* TAB 4: LEAVES */}
        <TabsContent value="leaves" className="mt-6 space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Default Leave Quotas</CardTitle>
              <CardDescription>Set the standard annual leave balances for new employees.</CardDescription>
            </CardHeader>
            <CardContent className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="space-y-2">
                <label className="text-sm font-medium">Casual Leaves</label>
                <Input type="number" name="defaultCasualLeaves" value={formData.defaultCasualLeaves || 12} onChange={handleChange} />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Sick/Medical Leaves</label>
                <Input type="number" name="defaultSickLeaves" value={formData.defaultSickLeaves || 10} onChange={handleChange} />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Earned Leaves</label>
                <Input type="number" name="defaultEarnedLeaves" value={formData.defaultEarnedLeaves || 15} onChange={handleChange} />
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* TAB: PAYROLL (Salary Structures) */}
        <TabsContent value="payroll" className="mt-6 space-y-6">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <div>
                <CardTitle>Salary Structures & Allowances</CardTitle>
                <CardDescription>Define how CTC is broken down into Basic, HRA, and Allowances.</CardDescription>
              </div>
              <Button className="bg-emerald-500 hover:bg-emerald-600 text-white"><Plus className="w-4 h-4 mr-2" /> Create Structure</Button>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
                <div className="p-4 border rounded-xl bg-slate-50 space-y-2">
                  <div className="flex justify-between items-center mb-4">
                    <h4 className="font-bold text-slate-900">Standard Tier 1</h4>
                    <span className="px-2 py-1 bg-emerald-100 text-emerald-700 text-xs rounded-full font-medium">Default</span>
                  </div>
                  <div className="flex justify-between text-sm"><span className="text-slate-500">Basic Pay:</span> <span className="font-medium">50% of CTC</span></div>
                  <div className="flex justify-between text-sm"><span className="text-slate-500">HRA:</span> <span className="font-medium">20% of Basic</span></div>
                  <div className="flex justify-between text-sm"><span className="text-slate-500">Special Allowance:</span> <span className="font-medium">Remaining</span></div>
                  <div className="flex justify-end pt-4 space-x-2">
                    <Button variant="outline" size="sm">Edit</Button>
                    <Button variant="ghost" size="sm" className="text-rose-500">Delete</Button>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* TAB 5: SECURITY */}
        <TabsContent value="security" className="mt-6 space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Security & Access</CardTitle>
              <CardDescription>Configure session timeouts and device restrictions.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex items-center space-x-2">
                <input type="checkbox" name="allowMultipleDevices" checked={formData.allowMultipleDevices || false} onChange={handleChange} className="w-4 h-4 text-emerald-600" />
                <label className="text-sm font-medium">Allow Multiple Devices</label>
              </div>
              <div className="flex items-center space-x-2">
                <input type="checkbox" name="auditLogsEnabled" checked={formData.auditLogsEnabled ?? true} onChange={handleChange} className="w-4 h-4 text-emerald-600" />
                <label className="text-sm font-medium">Enable Audit Logs (Recommended)</label>
              </div>
              <div className="space-y-2 max-w-sm">
                <label className="text-sm font-medium">Session Timeout (Hours)</label>
                <Input type="number" name="sessionTimeoutHours" value={formData.sessionTimeoutHours || 24} onChange={handleChange} />
              </div>
            </CardContent>
          </Card>
        </TabsContent>

      </Tabs>
    </div>
  );
}