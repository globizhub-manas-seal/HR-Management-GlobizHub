"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import axios from "axios";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useState, useEffect } from "react";
import {
  Loader2,
  Save,
  MapPin,
  Wifi,
  Clock,
  Shield,
  Building,
  Network,
  Banknote,
  Plus,
  Trash2,
  Upload,
  X,
} from "lucide-react";
import Link from "next/link";

export default function SettingsPage() {
  const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000";
  const token =
    typeof window !== "undefined" ? localStorage.getItem("hrms_token") : "";
  const headers = { Authorization: `Bearer ${token}` };

  const { data: branches } = useQuery({
    queryKey: ["branches"],
    queryFn: async () =>
      (
        await axios.get(
          `${process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000"}/organization/branches`,
          { headers },
        )
      ).data,
  });

  const { data: departments } = useQuery({
    queryKey: ["departments"],
    queryFn: async () =>
      (
        await axios.get(
          `${process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000"}/organization/departments`,
          { headers },
        )
      ).data,
  });

  const { data: roles } = useQuery({
    queryKey: ["roles"],
    queryFn: async () =>
      (
        await axios.get(
          `${process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000"}/organization/roles`,
          { headers },
        )
      ).data,
  });

  const queryClient = useQueryClient();
  const [formData, setFormData] = useState<any>({});
  const [isUploading, setIsUploading] = useState(false); // <-- NEW STATE FOR UPLOAD

  // 1. Fetch Current Settings
  const { data: settings, isLoading } = useQuery({
    queryKey: ["companySettings"],
    queryFn: async () => {
      const res = await axios.get(
        `${process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000"}/settings`,
        {
          headers,
        },
      );
      return res.data;
    },
  });

  useEffect(() => {
    if (settings) setFormData(settings);
  }, [settings]);

  // 2. Mutation to Save Settings
  const saveMutation = useMutation({
    mutationFn: async (updatedData: any) => {
      await axios.patch(
        `${process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000"}/settings`,
        updatedData,
        {
          headers,
        },
      );
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["companySettings"] });
      alert("Settings saved successfully!");
    },
  });

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>,
  ) => {
    const { name, value, type } = e.target;
    const finalValue =
      type === "checkbox" ? (e.target as HTMLInputElement).checked : value;
    setFormData((prev: any) => ({ ...prev, [name]: finalValue }));
  };

  const handleSave = () => {
    const dataToSave = {
      ...formData,
      allowedRadiusMeters: parseInt(formData.allowedRadiusMeters || 100),
      gracePeriodMinutes: parseInt(formData.gracePeriodMinutes || 15),
      defaultCasualLeaves: parseInt(formData.defaultCasualLeaves || 12),
      defaultSickLeaves: parseInt(formData.defaultSickLeaves || 10),
      defaultEarnedLeaves: parseInt(formData.defaultEarnedLeaves || 15),
      sessionTimeoutHours: parseInt(formData.sessionTimeoutHours || 24),
      officeLatitude: formData.officeLatitude
        ? parseFloat(formData.officeLatitude)
        : null,
      officeLongitude: formData.officeLongitude
        ? parseFloat(formData.officeLongitude)
        : null,
    };
    saveMutation.mutate(dataToSave);
  };

  // Add this near your other state variables at the top of SettingsPage
  const [localPreview, setLocalPreview] = useState<string | null>(null);

  // Update your handleHeaderUpload function
  const handleHeaderUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // ✅ INSTANT LOCAL PREVIEW: Show the image immediately before it even finishes uploading
    const objectUrl = URL.createObjectURL(file);
    setLocalPreview(objectUrl);
    setIsUploading(true);

    const uploadData = new FormData();
    uploadData.append("file", file);

    try {
      const res = await axios.post(
        `${process.env.NEXT_PUBLIC_API_URL}/documents/payslip-letterhead`,
        uploadData,
        {
          headers: { ...headers, "Content-Type": "multipart/form-data" },
        },
      );

      setFormData((prev: any) => ({
        ...prev,
        payslipHeaderUrl: res.data.fileUrl,
      }));
      queryClient.invalidateQueries({ queryKey: ["companySettings"] });
    } catch (error: any) {
      alert(error.response?.data?.message || "Failed to upload header image.");
      setLocalPreview(null); // Revert preview on failure
    } finally {
      setIsUploading(false);
    }
  };

  // Update your removeHeader function
  const removeHeader = async () => {
    try {
      // ✅ Call backend to physically delete the file
      await axios.delete(
        `${process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000"}/documents/payslip-letterhead`,
        { headers },
      );
      setFormData((prev: any) => ({ ...prev, payslipHeaderUrl: null }));
      setLocalPreview(null); // ✅ Clear the local preview too
      queryClient.invalidateQueries({ queryKey: ["companySettings"] });
    } catch (error) {
      alert("Failed to remove header image.");
    }
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
      () =>
        alert(
          "Unable to retrieve your location. Please allow location access.",
        ),
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
    return (
      <div className="flex h-96 items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-emerald-500" />
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-6xl space-y-6 p-4 sm:p-6 lg:p-8">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="min-w-0">
          <h1 className="text-2xl font-bold text-slate-900 sm:text-3xl">
            Company Settings
          </h1>
          <p className="text-slate-500 mt-1">
            Manage your organization's core configuration and rules.
          </p>
        </div>
        <Button
          onClick={handleSave}
          disabled={saveMutation.isPending || isUploading}
          className="w-full shrink-0 bg-emerald-500 text-white hover:bg-emerald-600 sm:w-auto"
        >
          {saveMutation.isPending ? (
            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
          ) : (
            <Save className="w-4 h-4 mr-2" />
          )}
          Save Changes
        </Button>
      </div>

      <Tabs defaultValue="general" className="w-full">
        <TabsList className="flex flex-row overflow-x-auto max-w-full w-full justify-start gap-1 p-1 bg-slate-100 rounded-lg lg:grid lg:grid-cols-7 lg:h-auto whitespace-nowrap scrollbar-none flex-nowrap h-auto py-1.5 shrink-0">
          <TabsTrigger value="general" className="flex-none flex-shrink-0 min-w-0 px-4 py-2.5 text-xs sm:text-sm">
            <Building className="mr-1.5 h-4 w-4 shrink-0" /> General
          </TabsTrigger>
          <TabsTrigger value="organization" className="flex-none flex-shrink-0 min-w-0 px-4 py-2.5 text-xs sm:text-sm">
            <Network className="mr-1.5 h-4 w-4 shrink-0" /> Organization
          </TabsTrigger>
          <TabsTrigger value="attendance" className="flex-none flex-shrink-0 min-w-0 px-4 py-2.5 text-xs sm:text-sm">
            <MapPin className="mr-1.5 h-4 w-4 shrink-0" /> Attendance
          </TabsTrigger>
          <TabsTrigger value="shifts" className="flex-none flex-shrink-0 min-w-0 px-4 py-2.5 text-xs sm:text-sm">
            <Clock className="mr-1.5 h-4 w-4 shrink-0" /> Shifts
          </TabsTrigger>
          <TabsTrigger value="leaves" className="flex-none flex-shrink-0 min-w-0 px-4 py-2.5 text-xs sm:text-sm">
            <Wifi className="mr-1.5 h-4 w-4 shrink-0" /> Leaves
          </TabsTrigger>
          <TabsTrigger value="payroll" className="flex-none flex-shrink-0 min-w-0 px-4 py-2.5 text-xs sm:text-sm">
            <Banknote className="mr-1.5 h-4 w-4 shrink-0" /> Payroll
          </TabsTrigger>
          <TabsTrigger value="security" className="flex-none flex-shrink-0 min-w-0 px-4 py-2.5 text-xs sm:text-sm">
            <Shield className="mr-1.5 h-4 w-4 shrink-0" /> Security
          </TabsTrigger>
        </TabsList>

        {/* ... TAB 1: GENERAL ... */}
        <TabsContent value="general" className="mt-6 space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Corporate Identity</CardTitle>
              <CardDescription>
                Your official registered company details.
              </CardDescription>
            </CardHeader>
            <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <label className="text-sm font-medium">
                  Display Name (Brand)
                </label>
                <Input
                  name="companyName"
                  value={formData.companyName || ""}
                  onChange={handleChange}
                  placeholder="e.g. Acme Corp"
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Legal Entity Name</label>
                <Input
                  name="legalName"
                  value={formData.legalName || ""}
                  onChange={handleChange}
                  placeholder="e.g. Acme Corporation Pvt. Ltd."
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Industry / Sector</label>
                <Input
                  name="industry"
                  value={formData.industry || ""}
                  onChange={handleChange}
                  placeholder="e.g. SaaS, Healthcare"
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Company Website</label>
                <Input
                  name="website"
                  type="url"
                  value={formData.website || ""}
                  onChange={handleChange}
                  placeholder="https://..."
                />
              </div>
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
                  <span className="text-sm text-slate-500">
                    {formData.themeColor || "#10b981"}
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Legal & Compliance</CardTitle>
              <CardDescription>
                Tax and government registration numbers.
              </CardDescription>
            </CardHeader>
            <CardContent className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="space-y-2">
                <label className="text-sm font-medium">
                  Registration No. (CIN)
                </label>
                <Input
                  name="registrationNumber"
                  value={formData.registrationNumber || ""}
                  onChange={handleChange}
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">
                  Tax ID (GSTIN/VAT/EIN)
                </label>
                <Input
                  name="taxId"
                  value={formData.taxId || ""}
                  onChange={handleChange}
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">
                  Date of Incorporation
                </label>
                <Input
                  type="date"
                  name="incorporationDate"
                  value={formData.incorporationDate || ""}
                  onChange={handleChange}
                />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Contact & Headquarters</CardTitle>
              <CardDescription>
                Primary communication and billing address.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="space-y-2">
                  <label className="text-sm font-medium">Official Email</label>
                  <Input
                    type="email"
                    name="officialEmail"
                    value={formData.officialEmail || ""}
                    onChange={handleChange}
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">
                    Support/Contact Phone
                  </label>
                  <Input
                    type="tel"
                    name="officialPhone"
                    value={formData.officialPhone || ""}
                    onChange={handleChange}
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">Time Zone</label>
                  <select
                    name="timeZone"
                    value={formData.timeZone || "UTC"}
                    onChange={handleChange}
                    className="w-full border rounded-md p-2 text-sm bg-white"
                  >
                    <option value="Asia/Kolkata">Asia/Kolkata (IST)</option>
                    <option value="America/New_York">
                      America/New_York (EST)
                    </option>
                    <option value="Europe/London">Europe/London (GMT)</option>
                    <option value="UTC">UTC</option>
                  </select>
                </div>
              </div>

              <div className="border-t pt-6 grid grid-cols-1 md:grid-cols-4 gap-6">
                <div className="md:col-span-4 space-y-2">
                  <label className="text-sm font-medium">Street Address</label>
                  <Input
                    name="officeAddress"
                    value={formData.officeAddress || ""}
                    onChange={handleChange}
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">City</label>
                  <Input
                    name="city"
                    value={formData.city || ""}
                    onChange={handleChange}
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">
                    State / Province
                  </label>
                  <Input
                    name="state"
                    value={formData.state || ""}
                    onChange={handleChange}
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">Country</label>
                  <Input
                    name="country"
                    value={formData.country || ""}
                    onChange={handleChange}
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">
                    ZIP / Postal Code
                  </label>
                  <Input
                    name="zipCode"
                    value={formData.zipCode || ""}
                    onChange={handleChange}
                  />
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* ... TAB 2: ORGANIZATION ... */}
        <TabsContent value="organization" className="mt-6 space-y-6">
          <div className="grid grid-cols-1 gap-4 md:grid-cols-3 md:gap-6">
            <Card className="col-span-1">
              <CardHeader className="flex flex-row items-start justify-between gap-3 pb-2">
                <div className="min-w-0">
                  <CardTitle className="text-lg">Branches</CardTitle>
                  <CardDescription>Manage office locations.</CardDescription>
                </div>
                <Button size="sm" variant="outline" className="h-8 shrink-0">
                  <Plus className="w-4 h-4 mr-1" /> Add
                </Button>
              </CardHeader>
              <CardContent>
                <div className="space-y-3 mt-4">
                  {branches?.length === 0 && (
                    <p className="text-sm text-slate-500">No branches added.</p>
                  )}
                  {branches?.map((branch: any) => (
                    <div
                      key={branch.id}
                      className="flex items-center justify-between gap-2 p-3 border rounded-lg bg-slate-50"
                    >
                      <span className="min-w-0 truncate text-sm font-medium">
                        {branch.name}
                      </span>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-6 w-6 text-rose-500"
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            <Card className="col-span-1">
              <CardHeader className="flex flex-row items-start justify-between gap-3 pb-2">
                <div className="min-w-0">
                  <CardTitle className="text-lg">Departments</CardTitle>
                  <CardDescription>Company divisions.</CardDescription>
                </div>
                <Button size="sm" variant="outline" className="h-8 shrink-0">
                  <Plus className="w-4 h-4 mr-1" /> Add
                </Button>
              </CardHeader>
              <CardContent>
                <div className="space-y-3 mt-4">
                  {departments?.length === 0 && (
                    <p className="text-sm text-slate-500">
                      No departments added.
                    </p>
                  )}
                  {departments?.map((dept: any) => (
                    <div
                      key={dept.id}
                      className="flex items-center justify-between gap-2 p-3 border rounded-lg bg-slate-50"
                    >
                      <span className="min-w-0 truncate text-sm font-medium">
                        {dept.name}
                      </span>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-6 w-6 text-rose-500"
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            <Card className="col-span-1">
              <CardHeader className="flex flex-row items-start justify-between gap-3 pb-2">
                <div className="min-w-0">
                  <CardTitle className="text-lg">Roles</CardTitle>
                  <CardDescription>Job designations.</CardDescription>
                </div>
                <Button size="sm" variant="outline" className="h-8 shrink-0">
                  <Plus className="w-4 h-4 mr-1" /> Add
                </Button>
              </CardHeader>
              <CardContent>
                <div className="space-y-3 mt-4">
                  {roles?.length === 0 && (
                    <p className="text-sm text-slate-500">No roles added.</p>
                  )}
                  {roles?.map((role: any) => (
                    <div
                      key={role.id}
                      className="flex items-center justify-between gap-2 p-3 border rounded-lg bg-slate-50"
                    >
                      <span className="min-w-0 truncate text-sm font-medium">
                        {role.name}
                      </span>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-6 w-6 text-rose-500"
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* ... TAB 3: ATTENDANCE ... */}
        <TabsContent value="attendance" className="mt-6 space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>GPS & Wi-Fi Restrictions</CardTitle>
              <CardDescription>
                Configure how employees can clock in.
              </CardDescription>
            </CardHeader>
            <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div className="space-y-4">
                <h3 className="font-semibold text-slate-700 border-b pb-2">
                  Location Setup
                </h3>
                <div className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    name="enableGps"
                    checked={formData.enableGps || false}
                    onChange={handleChange}
                    className="w-4 h-4 text-emerald-600"
                  />
                  <label className="text-sm font-medium">
                    Enable GPS Verification
                  </label>
                </div>

                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <div className="space-y-2">
                    <label className="text-sm font-medium">
                      Office Latitude
                    </label>
                    <Input
                      type="number"
                      step="any"
                      name="officeLatitude"
                      value={formData.officeLatitude || ""}
                      onChange={handleChange}
                      placeholder="e.g. 28.6139"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium">
                      Office Longitude
                    </label>
                    <Input
                      type="number"
                      step="any"
                      name="officeLongitude"
                      value={formData.officeLongitude || ""}
                      onChange={handleChange}
                      placeholder="e.g. 77.2090"
                    />
                  </div>
                </div>

                <Button
                  variant="secondary"
                  size="sm"
                  onClick={handleAutoLocation}
                  className="w-full bg-blue-50 text-blue-600 hover:bg-blue-100 border border-blue-200"
                >
                  <MapPin className="w-4 h-4 mr-2" /> Detect Current Location
                </Button>

                <div className="space-y-2 pt-2">
                  <label className="text-sm font-medium">
                    Allowed Radius (meters)
                  </label>
                  <select
                    name="allowedRadiusMeters"
                    value={formData.allowedRadiusMeters || 100}
                    onChange={handleChange}
                    className="w-full border rounded-md p-2 text-sm bg-white"
                  >
                    <option value="25">25m (Very Strict)</option>
                    <option value="50">50m</option>
                    <option value="100">100m (Standard)</option>
                    <option value="200">200m</option>
                  </select>
                </div>
              </div>

              <div className="space-y-4">
                <h3 className="font-semibold text-slate-700 border-b pb-2">
                  Network Setup
                </h3>
                <div className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    name="isIpRestrictionOn"
                    checked={formData.isIpRestrictionOn || false}
                    onChange={handleChange}
                    className="w-4 h-4 text-emerald-600"
                  />
                  <label className="text-sm font-medium">
                    Enable Wi-Fi / IP Restriction
                  </label>
                </div>

                <div className="space-y-2 pt-2">
                  <label className="text-sm font-medium">
                    Office IP Address
                  </label>
                  <div className="flex flex-col gap-2 sm:flex-row">
                    <Input
                      type="text"
                      name="officeIpAddress"
                      value={formData.officeIpAddress || ""}
                      onChange={handleChange}
                      placeholder="e.g., 192.168.1.38"
                      className="flex-1"
                    />
                    <Button
                      variant="secondary"
                      onClick={handleAutoIP}
                      className="bg-emerald-50 text-emerald-700 hover:bg-emerald-100 border border-emerald-200"
                    >
                      <Wifi className="w-4 h-4 mr-2" /> Detect IP
                    </Button>
                  </div>
                  <p className="text-xs text-slate-500">
                    Employees must be on this network to clock in.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* ... TAB 4: SHIFTS ... */}
        <TabsContent value="shifts" className="mt-6 space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Shift & Timing Rules</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
                <div className="space-y-2">
                  <label className="text-sm font-medium">
                    Office Start Time
                  </label>
                  <Input
                    type="time"
                    name="officeStartTime"
                    value={formData.officeStartTime || "09:00"}
                    onChange={handleChange}
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">Office End Time</label>
                  <Input
                    type="time"
                    name="officeEndTime"
                    value={formData.officeEndTime || "18:00"}
                    onChange={handleChange}
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">
                    Grace Period (Minutes)
                  </label>
                  <Input
                    type="number"
                    name="gracePeriodMinutes"
                    value={formData.gracePeriodMinutes || 15}
                    onChange={handleChange}
                  />
                </div>
              </div>

              <div className="space-y-3 pt-4 border-t">
                <label className="text-sm font-medium">Working Days</label>
                <div className="flex flex-wrap gap-2">
                  {[
                    "Monday",
                    "Tuesday",
                    "Wednesday",
                    "Thursday",
                    "Friday",
                    "Saturday",
                    "Sunday",
                  ].map((day) => (
                    <label
                      key={day}
                      className={`px-4 py-2 border rounded-full text-sm cursor-pointer transition-colors ${formData.workingDays?.includes(day) ? "bg-emerald-100 border-emerald-500 text-emerald-800" : "bg-slate-50 hover:bg-slate-100 text-slate-600"}`}
                    >
                      <input
                        type="checkbox"
                        className="hidden"
                        checked={formData.workingDays?.includes(day) || false}
                        onChange={(e) => {
                          const currentDays = formData.workingDays || [];
                          const newDays = e.target.checked
                            ? [...currentDays, day]
                            : currentDays.filter((d: string) => d !== day);
                          setFormData({ ...formData, workingDays: newDays });
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

        {/* ... TAB 5: LEAVES ... */}
        <TabsContent value="leaves" className="mt-6 space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Default Leave Quotas</CardTitle>
              <CardDescription>
                Set the standard annual leave balances for new employees.
              </CardDescription>
            </CardHeader>
            <CardContent className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="space-y-2">
                <label className="text-sm font-medium">Casual Leaves</label>
                <Input
                  type="number"
                  name="defaultCasualLeaves"
                  value={formData.defaultCasualLeaves || 12}
                  onChange={handleChange}
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">
                  Sick/Medical Leaves
                </label>
                <Input
                  type="number"
                  name="defaultSickLeaves"
                  value={formData.defaultSickLeaves || 10}
                  onChange={handleChange}
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Earned Leaves</label>
                <Input
                  type="number"
                  name="defaultEarnedLeaves"
                  value={formData.defaultEarnedLeaves || 15}
                  onChange={handleChange}
                />
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* ... TAB 6: PAYROLL (MODIFIED) ... */}
        <TabsContent value="payroll" className="mt-6 space-y-6">
          <Card className="overflow-hidden">
            <CardHeader className="bg-gradient-to-r from-indigo-50 to-white">
              <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <CardTitle className="flex items-center gap-2">
                    <Banknote className="h-5 w-5 text-indigo-600" /> Payroll
                    templates
                  </CardTitle>
                  <CardDescription className="mt-1">
                    Create reusable salary structures for consistent CTC
                    calculations.
                  </CardDescription>
                </div>
                <Button
                  asChild
                  className="w-full shrink-0 bg-indigo-600 text-white hover:bg-indigo-700 sm:w-auto"
                >
                  <Link href="/workspace/settings/payroll">
                    Manage templates
                  </Link>
                </Button>
              </div>
            </CardHeader>
            <CardContent className="grid gap-3 p-6 text-sm text-slate-600 sm:grid-cols-3">
              <p>
                <span className="font-semibold text-slate-900">CTC rules</span>
                <br />
                Basic, HRA and PF percentages.
              </p>
              <p>
                <span className="font-semibold text-slate-900">Allowances</span>
                <br />
                Fixed conveyance and medical amounts.
              </p>
              <p>
                <span className="font-semibold text-slate-900">Deductions</span>
                <br />
                Professional tax configuration.
              </p>
            </CardContent>
          </Card>

          {/* NEW UPLOAD CARD */}
          <Card>
            <CardHeader>
              <CardTitle>Payslip Letterhead</CardTitle>
              <CardDescription>
                Upload a wide image to be displayed at the top of all PDF
                payslips.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="max-w-2xl">
                {/* ✅ Use localPreview first, fallback to formData */}
                {localPreview || formData.payslipHeaderUrl ? (
                  <div className="relative group rounded-lg border border-slate-200 overflow-hidden bg-slate-50">
                    <img
                      src={localPreview || formData.payslipHeaderUrl}
                      alt="Payslip Header Preview"
                      className="w-full h-auto object-contain"
                    />
                    <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                      <Button
                        variant="destructive"
                        size="sm"
                        onClick={removeHeader}
                      >
                        <X className="w-4 h-4 mr-2" /> Remove Image
                      </Button>
                    </div>
                  </div>
                ) : (
                  <label
                    className={`flex flex-col items-center justify-center w-full h-32 sm:h-48 border-2 border-dashed rounded-lg cursor-pointer transition-colors ${isUploading ? "bg-slate-50 border-slate-300" : "bg-slate-50/50 hover:bg-slate-50 border-slate-300 hover:border-indigo-400"}`}
                  >
                    <div className="flex flex-col items-center justify-center pt-5 pb-6">
                      {isUploading ? (
                        <>
                          <Loader2 className="w-8 h-8 text-indigo-500 animate-spin mb-3" />
                          <p className="text-sm text-slate-500">Uploading...</p>
                        </>
                      ) : (
                        <>
                          <Upload className="w-8 h-8 text-slate-400 mb-3" />
                          <p className="mb-2 text-sm text-slate-500 font-medium">
                            Click to upload header image
                          </p>
                          <p className="text-xs text-slate-400">
                            PNG, JPG, or WEBP — max 2 MB (recommended: 800×200
                            px)
                          </p>
                        </>
                      )}
                    </div>
                    <input
                      type="file"
                      className="hidden"
                      accept="image/png, image/jpeg, image/webp"
                      onChange={handleHeaderUpload}
                      disabled={isUploading}
                    />
                  </label>
                )}
                <p className="text-xs text-slate-500 mt-3 flex items-center">
                  <Shield className="w-3 h-3 mr-1" />
                  If no image is provided, payslips will default to rendering
                  the company name as text.
                </p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* ... TAB 7: SECURITY ... */}
        <TabsContent value="security" className="mt-6 space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Security & Access</CardTitle>
              <CardDescription>
                Configure session timeouts and device restrictions.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  name="allowMultipleDevices"
                  checked={formData.allowMultipleDevices || false}
                  onChange={handleChange}
                  className="w-4 h-4 text-emerald-600"
                />
                <label className="text-sm font-medium">
                  Allow Multiple Devices
                </label>
              </div>
              <div className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  name="auditLogsEnabled"
                  checked={formData.auditLogsEnabled ?? true}
                  onChange={handleChange}
                  className="w-4 h-4 text-emerald-600"
                />
                <label className="text-sm font-medium">
                  Enable Audit Logs (Recommended)
                </label>
              </div>
              <div className="space-y-2 max-w-sm">
                <label className="text-sm font-medium">
                  Session Timeout (Hours)
                </label>
                <Input
                  type="number"
                  name="sessionTimeoutHours"
                  value={formData.sessionTimeoutHours || 24}
                  onChange={handleChange}
                />
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
