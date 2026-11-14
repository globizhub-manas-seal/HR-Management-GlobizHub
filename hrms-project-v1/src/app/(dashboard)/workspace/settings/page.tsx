"use client";

import api, { settingsApi, organizationApi } from "@/lib/api";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
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
  IdCard,
  Sparkles,
  Check,
  Calendar,
  CreditCard,
} from "lucide-react";
import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { SettingsSkeleton } from "@/components/skeletons";

const HOURS = Array.from({ length: 12 }, (_, i) => (i + 1).toString().padStart(2, "0"));
const MINUTES = Array.from({ length: 60 }, (_, i) => i.toString().padStart(2, "0"));

const WORKING_DAYS = [
  { key: "MONDAY", label: "Monday" },
  { key: "TUESDAY", label: "Tuesday" },
  { key: "WEDNESDAY", label: "Wednesday" },
  { key: "THURSDAY", label: "Thursday" },
  { key: "FRIDAY", label: "Friday" },
  { key: "SATURDAY", label: "Saturday" },
  { key: "SUNDAY", label: "Sunday" },
];

function parse24hTo12h(timeStr: string) {
  if (!timeStr) return { hour: 9, minute: 0, period: "AM" };
  const [hStr, mStr] = timeStr.split(":");
  let h24 = parseInt(hStr) || 0;
  const m = parseInt(mStr) || 0;
  const period = h24 >= 12 ? "PM" : "AM";
  let h12 = h24 % 12;
  if (h12 === 0) h12 = 12;
  return { hour: h12, minute: m, period };
}

function format12hTo24h(hour: number, minute: number, period: string) {
  let h24 = hour % 12;
  if (period === "PM") h24 += 12;
  const hStr = h24.toString().padStart(2, "0");
  const mStr = minute.toString().padStart(2, "0");
  return `${hStr}:${mStr}`;
}

export default function SettingsPage() {
  const { data: branches } = useQuery({
    queryKey: ["branches"],
    queryFn: () => organizationApi.getBranches(),
  });

  const { data: departments } = useQuery({
    queryKey: ["departments"],
    queryFn: () => organizationApi.getDepartments(),
  });

  const { data: roles } = useQuery({
    queryKey: ["roles"],
    queryFn: () => organizationApi.getRoles(),
  });

  const queryClient = useQueryClient();
  const [formData, setFormData] = useState<any>({});

  const handleStartTimeChange = (type: "hour" | "minute" | "period", val: string) => {
    const timeVal = formData.officeStartTime || "09:00";
    const { hour, minute, period } = parse24hTo12h(timeVal);
    let newHour = hour;
    let newMinute = minute;
    let newPeriod = period;
    if (type === "hour") newHour = parseInt(val) || 12;
    if (type === "minute") newMinute = parseInt(val) || 0;
    if (type === "period") newPeriod = val as any;
    
    const time24h = format12hTo24h(newHour, newMinute, newPeriod);
    setFormData((prev: any) => ({ ...prev, officeStartTime: time24h }));
  };

  const handleEndTimeChange = (type: "hour" | "minute" | "period", val: string) => {
    const timeVal = formData.officeEndTime || "18:00";
    const { hour, minute, period } = parse24hTo12h(timeVal);
    let newHour = hour;
    let newMinute = minute;
    let newPeriod = period;
    if (type === "hour") newHour = parseInt(val) || 12;
    if (type === "minute") newMinute = parseInt(val) || 0;
    if (type === "period") newPeriod = val as any;
    
    const time24h = format12hTo24h(newHour, newMinute, newPeriod);
    setFormData((prev: any) => ({ ...prev, officeEndTime: time24h }));
  };
  const [isUploading, setIsUploading] = useState(false); // <-- NEW STATE FOR UPLOAD

  // State for Add forms in settings
  const [isAddingBranch, setIsAddingBranch] = useState(false);
  const [newBranchName, setNewBranchName] = useState("");

  const [isAddingDept, setIsAddingDept] = useState(false);
  const [newDeptName, setNewDeptName] = useState("");

  const [isAddingRole, setIsAddingRole] = useState(false);
  const [newRoleName, setNewRoleName] = useState("");

  // Branches mutations
  const addBranchMutation = useMutation({
    mutationFn: (name: string) => organizationApi.createBranch({ name }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["branches"] });
      setIsAddingBranch(false);
      setNewBranchName("");
    },
    onError: (err: any) => {
      alert(err.response?.data?.message || "Failed to add branch");
    },
  });

  const deleteBranchMutation = useMutation({
    mutationFn: (id: string) => organizationApi.deleteBranch(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["branches"] });
    },
    onError: (err: any) => {
      alert(err.response?.data?.message || "Failed to delete branch");
    },
  });

  // Departments mutations
  const addDeptMutation = useMutation({
    mutationFn: (name: string) => organizationApi.createDepartment({ name }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["departments"] });
      setIsAddingDept(false);
      setNewDeptName("");
    },
    onError: (err: any) => {
      alert(err.response?.data?.message || "Failed to add department");
    },
  });

  const deleteDeptMutation = useMutation({
    mutationFn: (id: string) => organizationApi.deleteDepartment(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["departments"] });
    },
    onError: (err: any) => {
      alert(err.response?.data?.message || "Failed to delete department");
    },
  });

  // Roles mutations
  const addRoleMutation = useMutation({
    mutationFn: (name: string) => organizationApi.createRole({ name }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["roles"] });
      setIsAddingRole(false);
      setNewRoleName("");
    },
    onError: (err: any) => {
      alert(err.response?.data?.message || "Failed to add role");
    },
  });

  const deleteRoleMutation = useMutation({
    mutationFn: (id: string) => organizationApi.deleteRole(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["roles"] });
    },
    onError: (err: any) => {
      alert(err.response?.data?.message || "Failed to delete role");
    },
  });

  // 1. Fetch Current Settings
  const { data: settings, isLoading } = useQuery({
    queryKey: ["companySettings"],
    queryFn: () => settingsApi.getSettings(),
  });

  useEffect(() => {
    if (settings) setFormData(settings);
  }, [settings]);

  // 2. Mutation to Save Settings
  const saveMutation = useMutation({
    mutationFn: (updatedData: any) => settingsApi.updateSettings(updatedData),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["companySettings"] });
      alert("Settings saved successfully!");
    },
    onError: (err: any) => {
      alert(err.response?.data?.message || "Failed to save settings");
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
      allowedRadiusMeters: parseInt(formData.allowedRadiusMeters || 100, 10),
      gracePeriodMinutes: parseInt(formData.gracePeriodMinutes || 15, 10),
      minimumHoursForFullDay: formData.minimumHoursForFullDay !== undefined && formData.minimumHoursForFullDay !== null && formData.minimumHoursForFullDay !== ""
        ? parseFloat(formData.minimumHoursForFullDay)
        : 8.0,
      halfDayMinHours: formData.halfDayMinHours !== undefined && formData.halfDayMinHours !== null && formData.halfDayMinHours !== ""
        ? parseFloat(formData.halfDayMinHours)
        : 4.0,
      defaultCasualLeaves: parseInt(formData.defaultCasualLeaves || 12, 10),
      defaultSickLeaves: parseInt(formData.defaultSickLeaves || 10, 10),
      defaultEarnedLeaves: parseInt(formData.defaultEarnedLeaves || 15, 10),
      noticePeriodDays: parseInt(formData.noticePeriodDays || 30, 10),
      sessionTimeoutHours: parseInt(formData.sessionTimeoutHours || 24, 10),
      officeLatitude: formData.officeLatitude
        ? parseFloat(formData.officeLatitude)
        : null,
      officeLongitude: formData.officeLongitude
        ? parseFloat(formData.officeLongitude)
        : null,
      employeeIdDigits: parseInt(formData.employeeIdDigits || 3, 10),
      payCycleStartDay: parseInt(formData.payCycleStartDay || 1, 10),
      payCycleEndDay: parseInt(formData.payCycleEndDay || 0, 10),
      nightShiftAllowanceRate: formData.nightShiftAllowanceRate !== undefined && formData.nightShiftAllowanceRate !== null && formData.nightShiftAllowanceRate !== ""
        ? parseFloat(formData.nightShiftAllowanceRate)
        : 0,
      workingDays: Array.isArray(formData.workingDays)
        ? formData.workingDays.map((d: string) => d.toUpperCase())
        : undefined,
    };
    saveMutation.mutate(dataToSave);
  };

  const [localPreview, setLocalPreview] = useState<string | null>(null);

  const handleHeaderUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // ✅ INSTANT LOCAL PREVIEW
    const objectUrl = URL.createObjectURL(file);
    setLocalPreview(objectUrl);
    setIsUploading(true);

    const uploadData = new FormData();
    uploadData.append("file", file);

    try {
      const res = await settingsApi.uploadPayslipHeader(uploadData);
      setFormData((prev: any) => ({
        ...prev,
        payslipHeaderUrl: res.fileUrl,
      }));
      queryClient.invalidateQueries({ queryKey: ["companySettings"] });
    } catch (error: any) {
      alert(error.response?.data?.message || "Failed to upload header image.");
      setLocalPreview(null);
    } finally {
      setIsUploading(false);
    }
  };

  const removeHeader = async () => {
    try {
      await api.delete("/documents/payslip-letterhead");
      setFormData((prev: any) => ({ ...prev, payslipHeaderUrl: null }));
      setLocalPreview(null);
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
      const res = await fetch("https://api.ipify.org?format=json");
      const data = await res.json();
      setFormData((prev: any) => ({
        ...prev,
        officeIpAddress: data.ip,
      }));
    } catch (error) {
      alert("Failed to fetch IP address.");
    }
  };

  const previewFormat = formData.employeeIdFormat || "{PREFIX}-{DEPT}-{NUMBER}";
  const defaultCompPrefix = formData.companyName
    ? formData.companyName.replace(/[^a-zA-Z0-9]/g, "").substring(0, 3).toUpperCase()
    : "EMP";
  const previewPrefix = formData.employeeIdPrefix || defaultCompPrefix;
  const previewDigits = parseInt(formData.employeeIdDigits || 3, 10);
  const currentYear = new Date().getFullYear().toString();
  const shortYear = currentYear.slice(-2);
  const previewSeq = "1".padStart(previewDigits || 3, "0");

  let previewEmployeeId = previewFormat
    .replace(/\{PREFIX\}|\[PREFIX\]/gi, previewPrefix || "EMP")
    .replace(/\{DEPT\}|\[DEPT\]/gi, "HR")
    .replace(/\{YEAR\}|\[YEAR\]/gi, currentYear)
    .replace(/\{YY\}|\[YY\]/gi, shortYear);

  if (/\{NUMBER\}|\[NUMBER\]/gi.test(previewEmployeeId)) {
    previewEmployeeId = previewEmployeeId.replace(/\{NUMBER\}|\[NUMBER\]/gi, previewSeq);
  } else {
    previewEmployeeId = `${previewEmployeeId}-${previewSeq}`;
  }

  if (isLoading) {
    return <SettingsSkeleton />;
  }

  return (
    <div className="max-w-[1200px] mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8 space-y-8">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="min-w-0">
          <h1 className="type-large-title font-bold text-foreground tracking-tight">Company Settings</h1>


          <p className="text-slate-500 mt-1">
            Manage your organization's core configuration and rules.
          </p>
        </div>
        <Button
          onClick={handleSave}
          disabled={saveMutation.isPending || isUploading}
          variant="default"
          size="default"
          className="w-full shrink-0 sm:w-auto"
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
        <TabsList className="flex flex-row overflow-x-auto max-w-full w-full justify-start gap-1 p-1.5 bg-card border-0 dark:border dark:border-hairline dark:border-separator rounded-[14px] apple-shadow-card lg:grid lg:grid-cols-8 lg:h-auto whitespace-nowrap scrollbar-none flex-nowrap h-auto shrink-0">
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
          <Link
            href="/workspace/settings/billing"
            className="flex-none flex-shrink-0 min-w-0 px-4 py-2.5 text-xs sm:text-sm inline-flex items-center justify-center font-medium rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted/50 transition-colors"
          >
            <CreditCard className="mr-1.5 h-4 w-4 shrink-0 text-violet-500" /> Billing
          </Link>
        </TabsList>

        {/* ... TAB 1: GENERAL ... */}
        <TabsContent value="general" className="mt-6 space-y-6">
          {/* Quick link to Subscription & Billing */}
          <div className="p-4 rounded-xl border border-border bg-gradient-to-r from-violet-500/5 via-violet-500/10 to-transparent flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 shadow-sm">
            <div>
              <h3 className="text-base font-semibold text-foreground flex items-center gap-2">
                <CreditCard className="w-5 h-5 text-violet-600" />
                Subscription, Quotas & Invoices
              </h3>
              <p className="text-sm text-muted-foreground mt-0.5">
                View your active plan, employee capacity usage, cloud storage, and download official tax receipts.
              </p>
            </div>
            <Button asChild variant="outline" className="shrink-0 bg-background">
              <Link href="/workspace/settings/billing">
                Manage Subscription &rarr;
              </Link>
            </Button>
          </div>
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
          {/* Quick link to Designations & Permissions */}
          <div className="p-4 rounded-xl border border-border bg-gradient-to-r from-primary/5 via-primary/10 to-transparent flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 shadow-sm">
            <div>
              <h3 className="text-base font-semibold text-foreground flex items-center gap-2">
                <Shield className="w-5 h-5 text-primary" />
                Designations & Permission Matrix
              </h3>
              <p className="text-sm text-muted-foreground mt-0.5">
                Configure job titles, customizable sidebar visibility, and granular module access control.
              </p>
            </div>
            <Button asChild variant="outline" className="shrink-0 bg-background">
              <Link href="/workspace/settings/designations">
                Manage Designations &rarr;
              </Link>
            </Button>
          </div>

          <div className="grid grid-cols-1 gap-4 md:grid-cols-3 md:gap-6">
            <Card className="col-span-1">
              <CardHeader className="flex flex-row items-start justify-between gap-3 pb-2">
                <div className="min-w-0">
                  <CardTitle className="text-lg">Branches</CardTitle>
                  <CardDescription>Manage office locations.</CardDescription>
                </div>
                <Button 
                  size="sm" 
                  variant="outline" 
                  className="h-8 shrink-0"
                  onClick={() => setIsAddingBranch(true)}
                >
                  <Plus className="w-4 h-4 mr-1" /> Add
                </Button>
              </CardHeader>
              <CardContent>
                {isAddingBranch && (
                  <div className="flex gap-2 items-center mb-4 mt-2 p-2 border rounded-lg bg-slate-50">
                    <Input 
                      placeholder="Branch Name" 
                      value={newBranchName} 
                      onChange={(e) => setNewBranchName(e.target.value)} 
                      className="h-8 text-sm"
                    />
                    <Button 
                      size="sm" 
                      onClick={() => addBranchMutation.mutate(newBranchName)} 
                      disabled={addBranchMutation.isPending}
                      className="h-8"
                    >
                      Save
                    </Button>
                    <Button 
                      size="sm" 
                      variant="ghost" 
                      onClick={() => {
                        setIsAddingBranch(false);
                        setNewBranchName("");
                      }}
                      className="h-8 px-2"
                    >
                      <X className="w-4 h-4" />
                    </Button>
                  </div>
                )}
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
                        className="h-6 w-6 text-rose-500 hover:text-rose-700 hover:bg-rose-50"
                        onClick={() => {
                          if (confirm(`Are you sure you want to delete branch "${branch.name}"?`)) {
                            deleteBranchMutation.mutate(branch.id);
                          }
                        }}
                        disabled={deleteBranchMutation.isPending}
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
                <Button 
                  size="sm" 
                  variant="outline" 
                  className="h-8 shrink-0"
                  onClick={() => setIsAddingDept(true)}
                >
                  <Plus className="w-4 h-4 mr-1" /> Add
                </Button>
              </CardHeader>
              <CardContent>
                {isAddingDept && (
                  <div className="flex gap-2 items-center mb-4 mt-2 p-2 border rounded-lg bg-slate-50">
                    <Input 
                      placeholder="Department Name" 
                      value={newDeptName} 
                      onChange={(e) => setNewDeptName(e.target.value)} 
                      className="h-8 text-sm"
                    />
                    <Button 
                      size="sm" 
                      onClick={() => addDeptMutation.mutate(newDeptName)} 
                      disabled={addDeptMutation.isPending}
                      className="h-8"
                    >
                      Save
                    </Button>
                    <Button 
                      size="sm" 
                      variant="ghost" 
                      onClick={() => {
                        setIsAddingDept(false);
                        setNewDeptName("");
                      }}
                      className="h-8 px-2"
                    >
                      <X className="w-4 h-4" />
                    </Button>
                  </div>
                )}
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
                        className="h-6 w-6 text-rose-500 hover:text-rose-700 hover:bg-rose-50"
                        onClick={() => {
                          if (confirm(`Are you sure you want to delete department "${dept.name}"?`)) {
                            deleteDeptMutation.mutate(dept.id);
                          }
                        }}
                        disabled={deleteDeptMutation.isPending}
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
                <Button 
                  size="sm" 
                  variant="outline" 
                  className="h-8 shrink-0"
                  onClick={() => setIsAddingRole(true)}
                >
                  <Plus className="w-4 h-4 mr-1" /> Add
                </Button>
              </CardHeader>
              <CardContent>
                {isAddingRole && (
                  <div className="flex gap-2 items-center mb-4 mt-2 p-2 border rounded-lg bg-slate-50">
                    <Input 
                      placeholder="Role Name" 
                      value={newRoleName} 
                      onChange={(e) => setNewRoleName(e.target.value)} 
                      className="h-8 text-sm"
                    />
                    <Button 
                      size="sm" 
                      onClick={() => addRoleMutation.mutate(newRoleName)} 
                      disabled={addRoleMutation.isPending}
                      className="h-8"
                    >
                      Save
                    </Button>
                    <Button 
                      size="sm" 
                      variant="ghost" 
                      onClick={() => {
                        setIsAddingRole(false);
                        setNewRoleName("");
                      }}
                      className="h-8 px-2"
                    >
                      <X className="w-4 h-4" />
                    </Button>
                  </div>
                )}
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
                        className="h-6 w-6 text-rose-500 hover:text-rose-700 hover:bg-rose-50"
                        onClick={() => {
                          if (confirm(`Are you sure you want to delete role "${role.name}"?`)) {
                            deleteRoleMutation.mutate(role.id);
                          }
                        }}
                        disabled={deleteRoleMutation.isPending}
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* EMPLOYEE ID FORMAT & GENERATION CARD */}
          <Card className="mt-6 border-border shadow-sm">
            <CardHeader className="border-b border-border/50 pb-4">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                <div className="flex items-center gap-3">
                  <div className="p-2.5 bg-emerald-500/10 text-emerald-600 rounded-xl">
                    <IdCard className="w-5 h-5" />
                  </div>
                  <div>
                    <CardTitle className="text-lg">Employee ID Format & Generation</CardTitle>
                    <CardDescription>
                      Configure the automated numbering pattern assigned to employees upon onboarding activation.
                    </CardDescription>
                  </div>
                </div>
                <div className="flex items-center gap-2 bg-emerald-50/80 border border-emerald-200/80 px-3.5 py-1.5 rounded-xl self-start sm:self-auto">
                  <Sparkles className="w-4 h-4 text-emerald-600 animate-pulse" />
                  <span className="text-xs font-medium text-slate-600">Live Preview:</span>
                  <Badge variant="outline" className="font-mono bg-white text-emerald-700 border-emerald-300 font-bold text-xs tracking-wide shadow-xs">
                    {previewEmployeeId}
                  </Badge>
                </div>
              </div>
            </CardHeader>
            <CardContent className="pt-6 space-y-6">
              {/* Presets Grid */}
              <div className="space-y-2">
                <label className="text-xs font-semibold text-slate-700">Choose a Format Template</label>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                  {[
                    {
                      label: "Company - Dept - Number",
                      value: "{PREFIX}-{DEPT}-{NUMBER}",
                      desc: "Default standard pattern (e.g. EMP-HR-001)",
                    },
                    {
                      label: "Company - Number",
                      value: "{PREFIX}-{NUMBER}",
                      desc: "Simple sequence (e.g. EMP-001)",
                    },
                    {
                      label: "Company - Year - Number",
                      value: "{PREFIX}-{YEAR}-{NUMBER}",
                      desc: "Yearly batch tracking (e.g. EMP-2026-001)",
                    },
                    {
                      label: "Company - Dept - Year - No",
                      value: "{PREFIX}-{DEPT}-{YEAR}-{NUMBER}",
                      desc: "Comprehensive breakdown (e.g. EMP-HR-2026-001)",
                    },
                  ].map((preset) => {
                    const isSelected = (formData.employeeIdFormat || "{PREFIX}-{DEPT}-{NUMBER}") === preset.value;
                    return (
                      <button
                        key={preset.value}
                        type="button"
                        onClick={() =>
                          setFormData((prev: any) => ({
                            ...prev,
                            employeeIdFormat: preset.value,
                          }))
                        }
                        className={`text-left p-3.5 rounded-xl border transition-all text-xs flex flex-col justify-between ${
                          isSelected
                            ? "border-emerald-500 bg-emerald-50/50 ring-2 ring-emerald-500/20 text-emerald-950 font-medium shadow-xs"
                            : "border-slate-200 hover:border-slate-300 bg-white text-slate-700"
                        }`}
                      >
                        <div className="flex items-center justify-between w-full mb-1">
                          <span className="font-bold">{preset.label}</span>
                          {isSelected && <Check className="w-3.5 h-3.5 text-emerald-600 shrink-0" />}
                        </div>
                        <span className="text-[11px] text-slate-500">{preset.desc}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Detailed Configuration */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 pt-2">
                <div className="space-y-2">
                  <label className="text-xs font-semibold text-slate-700">Company ID Prefix</label>
                  <Input
                    name="employeeIdPrefix"
                    value={formData.employeeIdPrefix ?? ""}
                    onChange={(e) =>
                      setFormData((prev: any) => ({
                        ...prev,
                        employeeIdPrefix: e.target.value.toUpperCase(),
                      }))
                    }
                    placeholder={defaultCompPrefix}
                    className="font-mono uppercase text-xs"
                    maxLength={10}
                  />
                  <p className="text-[11px] text-slate-500">
                    Default is first 3 letters of company name ({defaultCompPrefix}).
                  </p>
                </div>

                <div className="space-y-2">
                  <label className="text-xs font-semibold text-slate-700">Sequence Digits</label>
                  <select
                    name="employeeIdDigits"
                    value={formData.employeeIdDigits || 3}
                    onChange={handleChange}
                    className="flex h-10 w-full rounded-md border border-slate-200 bg-white px-3 py-2 text-xs focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500"
                  >
                    <option value={3}>3 Digits (e.g. 001, 002...)</option>
                    <option value={4}>4 Digits (e.g. 0001, 0002...)</option>
                    <option value={5}>5 Digits (e.g. 00001, 00002...)</option>
                    <option value={6}>6 Digits (e.g. 000001+)</option>
                  </select>
                  <p className="text-[11px] text-slate-500">
                    Zero-padding length for the sequential number.
                  </p>
                </div>

                <div className="space-y-2">
                  <label className="text-xs font-semibold text-slate-700">Custom Format Pattern</label>
                  <Input
                    name="employeeIdFormat"
                    value={formData.employeeIdFormat || "{PREFIX}-{DEPT}-{NUMBER}"}
                    onChange={handleChange}
                    placeholder="{PREFIX}-{DEPT}-{NUMBER}"
                    className="font-mono text-xs"
                  />
                  <p className="text-[11px] text-slate-500">
                    Supports delimiters like <code className="font-mono text-emerald-600">-</code> or <code className="font-mono text-emerald-600">/</code>
                  </p>
                </div>
              </div>

              {/* Available Tokens helper chips */}
              <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-200/80 space-y-2">
                <span className="text-xs font-semibold text-slate-700 block">
                  Click a token to append to custom format:
                </span>
                <div className="flex flex-wrap gap-2">
                  {[
                    { token: "{PREFIX}", label: "Prefix", desc: formData.employeeIdPrefix || defaultCompPrefix },
                    { token: "{DEPT}", label: "Dept", desc: "3-letter department code" },
                    { token: "{YEAR}", label: "Year (4-digit)", desc: new Date().getFullYear().toString() },
                    { token: "{YY}", label: "Year (2-digit)", desc: new Date().getFullYear().toString().slice(-2) },
                    { token: "{NUMBER}", label: "Sequential Number", desc: previewSeq },
                  ].map((item) => (
                    <button
                      key={item.token}
                      type="button"
                      onClick={() => {
                        const current = formData.employeeIdFormat || "";
                        if (!current.includes(item.token)) {
                          const separator = current.endsWith("-") || current.endsWith("/") || !current ? "" : "-";
                          setFormData((prev: any) => ({
                            ...prev,
                            employeeIdFormat: `${current}${separator}${item.token}`,
                          }));
                        }
                      }}
                      className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-white border border-slate-200 text-xs text-slate-700 hover:border-emerald-500 hover:bg-emerald-50/50 hover:text-emerald-900 transition-colors shadow-2xs font-mono"
                    >
                      <span className="font-bold text-emerald-600">{item.token}</span>
                      <span className="text-slate-400 font-sans text-[11px]">({item.desc})</span>
                    </button>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>
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
                  {(() => {
                    const { hour, minute, period } = parse24hTo12h(formData.officeStartTime || "09:00");
                    return (
                      <div className="flex gap-2">
                        <select
                          value={hour.toString().padStart(2, "0")}
                          onChange={(e) => handleStartTimeChange("hour", e.target.value)}
                          className="flex h-10 w-full rounded-md border border-slate-200 bg-white px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500"
                        >
                          {HOURS.map(h => <option key={h} value={h}>{h}</option>)}
                        </select>
                        <select
                          value={minute.toString().padStart(2, "0")}
                          onChange={(e) => handleStartTimeChange("minute", e.target.value)}
                          className="flex h-10 w-full rounded-md border border-slate-200 bg-white px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500"
                        >
                          {MINUTES.map(m => <option key={m} value={m}>{m}</option>)}
                        </select>
                        <select
                          value={period}
                          onChange={(e) => handleStartTimeChange("period", e.target.value)}
                          className="flex h-10 w-[80px] rounded-md border border-slate-200 bg-white px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 font-bold"
                        >
                          <option value="AM">AM</option>
                          <option value="PM">PM</option>
                        </select>
                      </div>
                    );
                  })()}
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">Office End Time</label>
                  {(() => {
                    const { hour, minute, period } = parse24hTo12h(formData.officeEndTime || "18:00");
                    return (
                      <div className="flex gap-2">
                        <select
                          value={hour.toString().padStart(2, "0")}
                          onChange={(e) => handleEndTimeChange("hour", e.target.value)}
                          className="flex h-10 w-full rounded-md border border-slate-200 bg-white px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500"
                        >
                          {HOURS.map(h => <option key={h} value={h}>{h}</option>)}
                        </select>
                        <select
                          value={minute.toString().padStart(2, "0")}
                          onChange={(e) => handleEndTimeChange("minute", e.target.value)}
                          className="flex h-10 w-full rounded-md border border-slate-200 bg-white px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500"
                        >
                          {MINUTES.map(m => <option key={m} value={m}>{m}</option>)}
                        </select>
                        <select
                          value={period}
                          onChange={(e) => handleEndTimeChange("period", e.target.value)}
                          className="flex h-10 w-[80px] rounded-md border border-slate-200 bg-white px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 font-bold"
                        >
                          <option value="AM">AM</option>
                          <option value="PM">PM</option>
                        </select>
                      </div>
                    );
                  })()}
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

              {/* Full-Day & Half-Day Hour Thresholds */}
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 pt-4 border-t">
                <div className="space-y-2">
                  <label className="text-sm font-medium">
                    Minimum Hours for Full Day
                  </label>
                  <Input
                    type="number"
                    step="0.5"
                    min="1"
                    max="24"
                    name="minimumHoursForFullDay"
                    value={formData.minimumHoursForFullDay ?? 8.0}
                    onChange={handleChange}
                    placeholder="e.g. 8.0"
                  />
                  <p className="text-xs text-muted-foreground">Required working hours to be marked as PRESENT.</p>
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">
                    Minimum Hours for Half Day
                  </label>
                  <Input
                    type="number"
                    step="0.5"
                    min="0.5"
                    max="12"
                    name="halfDayMinHours"
                    value={formData.halfDayMinHours ?? 4.0}
                    onChange={handleChange}
                    placeholder="e.g. 4.0"
                  />
                  <p className="text-xs text-muted-foreground">Threshold required to qualify for HALF_DAY instead of ABSENT.</p>
                </div>
              </div>

              <div className="space-y-3 pt-4 border-t">
                <label className="text-sm font-medium">Working Days</label>
                <div className="flex flex-wrap gap-2">
                  {WORKING_DAYS.map((day) => {
                    const isSelected = formData.workingDays?.some(
                      (d: string) => d.toUpperCase() === day.key
                    );
                    return (
                      <label
                        key={day.key}
                        className={`px-4 py-2 border rounded-full text-sm cursor-pointer transition-colors ${
                          isSelected
                            ? "bg-emerald-100 border-emerald-500 text-emerald-800 dark:bg-emerald-950/50 dark:border-emerald-600 dark:text-emerald-300"
                            : "bg-slate-50 hover:bg-slate-100 text-slate-600 dark:bg-slate-900 dark:text-slate-400 dark:hover:bg-slate-800"
                        }`}
                      >
                        <input
                          type="checkbox"
                          className="hidden"
                          checked={isSelected || false}
                          onChange={(e) => {
                            const current = (formData.workingDays || []).map((d: string) => d.toUpperCase());
                            const next = e.target.checked
                              ? [...current.filter((d: string) => d !== day.key), day.key]
                              : current.filter((d: string) => d !== day.key);
                            setFormData({ ...formData, workingDays: next });
                          }}
                        />
                        {day.label}
                      </label>
                    );
                  })}
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* ... TAB 5: LEAVES ... */}
        <TabsContent value="leaves" className="mt-6 space-y-6">
          {/* Quick link to Holidays */}
          <div className="p-4 rounded-xl border border-border bg-gradient-to-r from-emerald-500/5 via-emerald-500/10 to-transparent flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 shadow-sm">
            <div>
              <h3 className="text-base font-semibold text-foreground flex items-center gap-2">
                <Calendar className="w-5 h-5 text-emerald-600" />
                Public & Company Holidays
              </h3>
              <p className="text-sm text-muted-foreground mt-0.5">
                Manage non-working public holidays, regional festival calendars, and declared company off-days.
              </p>
            </div>
            <Button asChild variant="outline" className="shrink-0 bg-background">
              <Link href="/workspace/settings/holidays">
                Holiday Calendar &rarr;
              </Link>
            </Button>
          </div>

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

          {/* PAY CYCLE & ATTENDANCE CUTOFF RULES */}
          <Card>
            <CardHeader>
              <CardTitle>Pay Cycle & Attendance Cutoff Rules</CardTitle>
              <CardDescription>
                Configure monthly salary calculation periods, attendance cutoffs, and night shift allowances.
              </CardDescription>
            </CardHeader>
            <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <label className="text-sm font-medium">Pay Cycle Mode</label>
                <select
                  name="payCycleType"
                  value={formData.payCycleType || "CALENDAR_MONTH"}
                  onChange={handleChange}
                  className="w-full border rounded-md p-2 text-sm bg-background border-input"
                >
                  <option value="CALENDAR_MONTH">Calendar Month (1st to Month End)</option>
                  <option value="CUSTOM_CUTOFF">Custom Monthly Cutoff (e.g. 26th to 25th)</option>
                </select>
                <p className="text-xs text-muted-foreground">Determines the payroll cycle range and cutoff for automated processing.</p>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">Night Shift Allowance (₹ / shift)</label>
                <Input
                  type="number"
                  step="any"
                  name="nightShiftAllowanceRate"
                  value={formData.nightShiftAllowanceRate ?? 0}
                  onChange={handleChange}
                  placeholder="e.g. 250"
                />
                <p className="text-xs text-muted-foreground">Standard bonus credited for each night shift completed by workers.</p>
              </div>

              {formData.payCycleType === "CUSTOM_CUTOFF" && (
                <>
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Cutoff Start Day (1 - 31)</label>
                    <Input
                      type="number"
                      min="1"
                      max="31"
                      name="payCycleStartDay"
                      value={formData.payCycleStartDay || 26}
                      onChange={handleChange}
                    />
                    <p className="text-xs text-muted-foreground">Start day of the pay period from the previous month.</p>
                  </div>

                  <div className="space-y-2">
                    <label className="text-sm font-medium">Cutoff End Day (1 - 31)</label>
                    <Input
                      type="number"
                      min="1"
                      max="31"
                      name="payCycleEndDay"
                      value={formData.payCycleEndDay || 25}
                      onChange={handleChange}
                    />
                    <p className="text-xs text-muted-foreground">End day of the pay period in the current month.</p>
                  </div>
                </>
              )}
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
          {/* Quick link to Audit Logs */}
          <div className="p-4 rounded-xl border border-border bg-gradient-to-r from-slate-500/5 via-slate-500/10 to-transparent flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 shadow-sm">
            <div>
              <h3 className="text-base font-semibold text-foreground flex items-center gap-2">
                <Shield className="w-5 h-5 text-slate-700 dark:text-slate-300" />
                Security & Audit Trail
              </h3>
              <p className="text-sm text-muted-foreground mt-0.5">
                Inspect immutable system logs, employee changes, logins, and approvals across your workspace.
              </p>
            </div>
            <Button asChild variant="outline" className="shrink-0 bg-background">
              <Link href="/workspace/settings/audit-logs">
                View Audit Logs &rarr;
              </Link>
            </Button>
          </div>

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
