"use client";

import { AddEmployeeModal } from "@/components/employees/AddEmployeeModal";
import { BulkImportEmployeesModal } from "@/components/employees/BulkImportEmployeesModal";
import { useEffect, useState, useCallback } from "react";
import { useSearchParams } from "next/navigation";
import api, { employeesApi, API_BASE_URL } from "@/lib/api";
import { 
  Loader2, 
  Search, 
  Trash2, 
  LayoutGrid, 
  List, 
  Users, 
  UserPlus, 
  User, 
  Mail, 
  Building, 
  IdCard, 
  MoreHorizontal,
  Pencil,
  Send,
  Clock,
  CheckCircle2,
  AlertTriangle,
  UserCheck,
  Network
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { CardGridSkeleton, TableSkeleton } from "@/components/skeletons";
import { useModulePermission } from "@/context/PermissionContext";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import Link from "next/link";

interface Employee {
  id: string;
  employeeCode?: string;
  firstName: string;
  lastName: string;
  email: string;
  role: "SUPER_ADMIN" | "HR_HEAD" | "OWNER" | "MANAGER" | "EMPLOYEE";
  employmentStatus?: "INVITED" | "ONBOARDING" | "ACTIVE" | "NOTICE_PERIOD" | "TERMINATED" | "RESIGNED";
  department?: { id: string; name: string };
  designation?: { id: string; name: string; color?: string };
  reportingManager?: { id: string; firstName: string; lastName: string };
  reportingManagerId?: string;
  departmentId?: string;
  profilePhoto?: string;
  gender?: string;
  createdAt?: string;
}

export default function EmployeeDirectoryPage() {
  const searchParams = useSearchParams();
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [departments, setDepartments] = useState<Array<{ id: string; name: string }>>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedRole, setSelectedRole] = useState("");
  const [selectedDepartment, setSelectedDepartment] = useState("");
  const [selectedStatus, setSelectedStatus] = useState<string>("ALL");
  const [viewMode, setViewMode] = useState<"card" | "list">("card");
  const [resendingId, setResendingId] = useState<string | null>(null);

  useEffect(() => {
    setSearchTerm(searchParams.get("search") || "");
  }, [searchParams]);

  const canCreate = useModulePermission("employees", "create");
  const canEdit = useModulePermission("employees", "edit");
  const canDelete = useModulePermission("employees", "delete");

  // Fetch unique department list from company
  useEffect(() => {
    api.get("/organization/departments")
      .then((res) => setDepartments(res.data || []))
      .catch(() => {});
  }, []);

  // Fetch employees with server-side query filters
  const fetchEmployees = useCallback(async () => {
    try {
      setLoading(true);
      const params: any = {};
      if (selectedStatus && selectedStatus !== "ALL") {
        params.status = selectedStatus;
      } else {
        params.status = "ALL";
      }
      if (searchTerm.trim()) {
        params.search = searchTerm.trim();
      }
      if (selectedDepartment) {
        params.departmentId = selectedDepartment;
      }
      if (selectedRole) {
        params.role = selectedRole;
      }

      const data = await employeesApi.getAll(params);
      setEmployees(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error("Failed to fetch employees", error);
    } finally {
      setLoading(false);
    }
  }, [selectedStatus, searchTerm, selectedDepartment, selectedRole]);

  useEffect(() => {
    const handler = setTimeout(() => {
      fetchEmployees();
    }, 250);
    return () => clearTimeout(handler);
  }, [fetchEmployees]);

  async function handleDeleteEmployee(employeeId: string) {
    const confirmDelete = window.confirm("Are you sure you want to deactivate and remove this employee?");
    if (!confirmDelete) return;

    try {
      await employeesApi.delete(employeeId);
      setEmployees(employees.filter(emp => emp.id !== employeeId));
    } catch (error: any) {
      console.error("Failed to delete employee", error);
      alert(error.response?.data?.message || "Failed to delete employee");
    }
  }

  async function handleResendInvite(employeeId: string, email: string) {
    try {
      setResendingId(employeeId);
      await employeesApi.resendInvite(employeeId);
      alert(`Invitation email resent successfully to ${email}`);
    } catch (error: any) {
      alert(error.response?.data?.message || "Failed to resend invitation.");
    } finally {
      setResendingId(null);
    }
  }

  const getProfilePhotoUrl = (photoPath?: string) => {
    if (!photoPath) return "";
    if (photoPath.startsWith("http://") || photoPath.startsWith("https://")) {
      return photoPath;
    }
    return `${API_BASE_URL}${photoPath}`;
  };

  const getInitials = (firstName?: string, lastName?: string) => {
    if (!firstName) return "E";
    return `${firstName.charAt(0)}${lastName?.charAt(0) || ""}`.toUpperCase();
  };

  const getBadgeStyle = (emp: Employee) => {
    if (emp.designation) {
      return {
        backgroundColor: `${emp.designation.color || '#F97316'}15`,
        color: emp.designation.color || '#F97316',
        borderColor: `${emp.designation.color || '#F97316'}30`
      };
    }
    const roleColors: Record<string, string> = {
      SUPER_ADMIN: "#EA580C",
      HR_HEAD: "#DB2777",
      OWNER: "#7C3AED",
      MANAGER: "#2563EB",
      EMPLOYEE: "#059669",
    };
    const color = roleColors[emp.role] || "#4B5563";
    return {
      backgroundColor: `${color}15`,
      color: color,
      borderColor: `${color}30`
    };
  };

  const getStatusBadge = (status?: string) => {
    switch (status) {
      case "ACTIVE":
        return (
          <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 mr-1"></span> Active
          </span>
        );
      case "INVITED":
        return (
          <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-semibold bg-amber-50 text-amber-700 border border-amber-200">
            <Clock className="w-2.5 h-2.5 mr-1 text-amber-500" /> Invited
          </span>
        );
      case "ONBOARDING":
        return (
          <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-semibold bg-blue-50 text-blue-700 border border-blue-200">
            <Loader2 className="w-2.5 h-2.5 mr-1 text-blue-500 animate-spin" /> Onboarding
          </span>
        );
      case "NOTICE_PERIOD":
        return (
          <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-semibold bg-purple-50 text-purple-700 border border-purple-200">
            Notice Period
          </span>
        );
      case "TERMINATED":
        return (
          <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-semibold bg-rose-50 text-rose-700 border border-rose-200">
            Terminated
          </span>
        );
      case "RESIGNED":
        return (
          <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-semibold bg-slate-100 text-slate-700 border border-slate-200">
            Resigned
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
            Active
          </span>
        );
    }
  };

  // Instant client-side matching fallback
  const filteredEmployees = employees.filter(emp => {
    const matchesSearch = 
      `${emp.firstName} ${emp.lastName}`.toLowerCase().includes(searchTerm.toLowerCase()) ||
      emp.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (emp.employeeCode && emp.employeeCode.toLowerCase().includes(searchTerm.toLowerCase()));
      
    const matchesRole = selectedRole ? emp.role === selectedRole : true;
    
    const matchesDept = selectedDepartment 
      ? emp.departmentId === selectedDepartment || emp.department?.name === selectedDepartment
      : true;

    const matchesStatus =
      selectedStatus === "ALL"
        ? true
        : emp.employmentStatus === selectedStatus;
      
    return matchesSearch && matchesRole && matchesDept && matchesStatus;
  });

  // Calculate statistics across current pool
  const totalCount = employees.length;
  const activeCount = employees.filter(emp => emp.employmentStatus === 'ACTIVE' || !emp.employmentStatus).length;
  const invitedCount = employees.filter(emp => emp.employmentStatus === 'INVITED').length;
  const onboardingCount = employees.filter(emp => emp.employmentStatus === 'ONBOARDING').length;
  const terminatedCount = employees.filter(emp => emp.employmentStatus === 'TERMINATED' || emp.employmentStatus === 'RESIGNED').length;

  return (
    <div className="max-w-[1200px] mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8 space-y-6">
      {/* Header section */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="type-large-title font-bold text-foreground tracking-tight">Employee Directory</h1>
          <p className="type-subhead text-label-secondary mt-1">
            Search, filter, invite, and manage team members across all organizational departments.
          </p>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <Link href="/workspace/employees/org-chart">
            <Button variant="outline" className="apple-btn-secondary h-10 px-3.5 cursor-pointer gap-2">
              <Network className="h-4 w-4 text-primary" />
              <span className="hidden sm:inline">Org Chart</span>
            </Button>
          </Link>
          {canCreate && (
            <>
              <BulkImportEmployeesModal onImportSuccess={fetchEmployees} />
              <AddEmployeeModal />
            </>
          )}
        </div>
      </div>

      {/* Dynamic Statistics Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {/* Total Employees */}
        <div 
          onClick={() => setSelectedStatus("ALL")}
          className={`bg-card rounded-[16px] p-4 flex items-center gap-3.5 apple-shadow-card cursor-pointer border transition-all ${
            selectedStatus === "ALL" ? "border-primary ring-1 ring-primary" : "border-border/60 hover:border-primary/40"
          }`}
        >
          <div className="size-10 rounded-[10px] bg-primary/12 flex items-center justify-center text-primary shrink-0">
            <Users className="h-5 w-5" />
          </div>
          <div>
            <p className="text-[11px] font-semibold text-label-secondary uppercase tracking-wider">All Staff</p>
            <h3 className="text-xl font-bold text-foreground tabular-nums">{totalCount}</h3>
          </div>
        </div>

        {/* Active Employees */}
        <div 
          onClick={() => setSelectedStatus("ACTIVE")}
          className={`bg-card rounded-[16px] p-4 flex items-center gap-3.5 apple-shadow-card cursor-pointer border transition-all ${
            selectedStatus === "ACTIVE" ? "border-emerald-500 ring-1 ring-emerald-500" : "border-border/60 hover:border-emerald-400"
          }`}
        >
          <div className="size-10 rounded-[10px] bg-emerald-500/12 flex items-center justify-center text-emerald-600 shrink-0">
            <UserCheck className="h-5 w-5" />
          </div>
          <div>
            <p className="text-[11px] font-semibold text-label-secondary uppercase tracking-wider">Active</p>
            <h3 className="text-xl font-bold text-foreground tabular-nums">{activeCount}</h3>
          </div>
        </div>

        {/* Invited / Onboarding */}
        <div 
          onClick={() => setSelectedStatus("INVITED")}
          className={`bg-card rounded-[16px] p-4 flex items-center gap-3.5 apple-shadow-card cursor-pointer border transition-all ${
            selectedStatus === "INVITED" ? "border-amber-500 ring-1 ring-amber-500" : "border-border/60 hover:border-amber-400"
          }`}
        >
          <div className="size-10 rounded-[10px] bg-amber-500/15 flex items-center justify-center text-amber-600 shrink-0">
            <Clock className="h-5 w-5" />
          </div>
          <div>
            <p className="text-[11px] font-semibold text-label-secondary uppercase tracking-wider">Invited</p>
            <h3 className="text-xl font-bold text-foreground tabular-nums">{invitedCount}</h3>
          </div>
        </div>

        {/* Exited / Terminated */}
        <div 
          onClick={() => setSelectedStatus("TERMINATED")}
          className={`bg-card rounded-[16px] p-4 flex items-center gap-3.5 apple-shadow-card cursor-pointer border transition-all ${
            selectedStatus === "TERMINATED" ? "border-rose-500 ring-1 ring-rose-500" : "border-border/60 hover:border-rose-400"
          }`}
        >
          <div className="size-10 rounded-[10px] bg-rose-500/12 flex items-center justify-center text-rose-600 shrink-0">
            <Trash2 className="h-5 w-5" />
          </div>
          <div>
            <p className="text-[11px] font-semibold text-label-secondary uppercase tracking-wider">Terminated</p>
            <h3 className="text-xl font-bold text-foreground tabular-nums">{terminatedCount}</h3>
          </div>
        </div>
      </div>

      {/* Status Filter Tab Pills */}
      <div className="flex flex-wrap items-center gap-1.5 p-1 bg-muted/40 rounded-xl border border-border w-fit">
        {[
          { label: "All", value: "ALL", count: totalCount },
          { label: "Active", value: "ACTIVE", count: activeCount },
          { label: "Invited", value: "INVITED", count: invitedCount },
          { label: "Onboarding", value: "ONBOARDING", count: onboardingCount },
          { label: "Notice Period", value: "NOTICE_PERIOD" },
          { label: "Terminated", value: "TERMINATED", count: terminatedCount },
          { label: "Resigned", value: "RESIGNED" },
        ].map((tab) => {
          const active = selectedStatus === tab.value;
          return (
            <button
              key={tab.value}
              onClick={() => setSelectedStatus(tab.value)}
              className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-all flex items-center gap-1.5 cursor-pointer ${
                active
                  ? "bg-card text-foreground shadow-xs border border-border"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              <span>{tab.label}</span>
              {tab.count !== undefined && (
                <span className={`text-[10px] px-1.5 py-0.2 rounded-full ${
                  active ? "bg-primary/10 text-primary" : "bg-muted text-muted-foreground"
                }`}>
                  {tab.count}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* Filters & View Toggle Bar */}
      <div className="bg-card border border-border/80 rounded-[16px] p-3 sm:p-4 apple-shadow-card flex flex-col md:flex-row justify-between items-stretch md:items-center gap-3">
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 flex-1">
          {/* Search by Name/Email/ID */}
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground/60" />
            <Input 
              placeholder="Search by name, email, or employee ID..." 
              className="pl-9 bg-fill border-0 h-10 rounded-[10px] text-[13px]"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>

          {/* Select Department */}
          <select
            value={selectedDepartment}
            onChange={(e) => setSelectedDepartment(e.target.value)}
            className="h-10 px-3 py-1.5 rounded-[10px] border-0 bg-fill text-foreground text-[13px] focus:outline-none focus:ring-1 focus:ring-primary w-full sm:w-48 cursor-pointer"
          >
            <option value="">All Departments</option>
            {departments.map((dept) => (
              <option key={dept.id} value={dept.id}>
                {dept.name}
              </option>
            ))}
          </select>

          {/* Select Role */}
          <select 
            value={selectedRole}
            onChange={(e) => setSelectedRole(e.target.value)}
            className="h-10 px-3 py-1.5 rounded-[10px] border-0 bg-fill text-foreground text-[13px] focus:outline-none focus:ring-1 focus:ring-primary w-full sm:w-40 capitalize cursor-pointer"
          >
            <option value="">All Roles</option>
            <option value="SUPER_ADMIN">Super Admin</option>
            <option value="HR_HEAD">HR Head</option>
            <option value="OWNER">Owner</option>
            <option value="MANAGER">Manager</option>
            <option value="EMPLOYEE">Employee</option>
          </select>
        </div>

        {/* Layout Switch Toggle */}
        <div className="flex items-center gap-2 self-end md:self-auto">
          <span className="text-xs text-muted-foreground font-semibold uppercase tracking-wider hidden sm:inline mr-1">View</span>
          <div className="flex items-center rounded-[10px] p-1 bg-fill gap-1">
            <Button
              variant={viewMode === "card" ? "secondary" : "ghost"}
              size="sm"
              className="h-8 w-9 p-0 cursor-pointer"
              onClick={() => setViewMode("card")}
              title="Card View"
            >
              <LayoutGrid className="h-4 w-4" />
            </Button>
            <Button
              variant={viewMode === "list" ? "secondary" : "ghost"}
              size="sm"
              className="h-8 w-9 p-0 cursor-pointer"
              onClick={() => setViewMode("list")}
              title="List View"
            >
              <List className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>

      {loading ? (
        viewMode === "card" ? (
          <CardGridSkeleton count={8} columns={4} />
        ) : (
          <TableSkeleton rowCount={8} columnCount={8} showSearch={false} />
        )
      ) : (
        <>
          {/* Card View */}
          {viewMode === "card" && (
            <div>
              {filteredEmployees.length === 0 ? (
                <div className="p-12 text-center text-muted-foreground border border-dashed border-border rounded-2xl">
                  No employees found matching the selected filters.
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                  {filteredEmployees.map((emp) => {
                    const badgeStyle = getBadgeStyle(emp);
                    const designationName = emp.designation?.name || emp.role.replace('_', ' ').toLowerCase();
                    const isInvited = emp.employmentStatus === "INVITED";

                    return (
                      <div 
                        key={emp.id} 
                        className="bg-card border border-border/70 rounded-[20px] apple-shadow-card relative p-5 flex flex-col items-center text-center transition-all hover:scale-[1.01] group"
                      >
                        {/* Status Badge at Top Left */}
                        <div className="absolute top-4 left-4 z-10">
                          {getStatusBadge(emp.employmentStatus)}
                        </div>

                        {/* Settings Ellipsis Dropdown (Edit / Delete / Resend Invite) */}
                        <div className="absolute top-4 right-4 z-10">
                          <DropdownMenu>
                            <DropdownMenuTrigger className="h-8 w-8 hover:bg-muted flex items-center justify-center rounded-full cursor-pointer border-0 bg-transparent focus:outline-none">
                              <MoreHorizontal className="h-4 w-4 text-muted-foreground/80" />
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end" className="w-44 bg-card border border-border shadow-md rounded-xl p-1">
                              {isInvited && canCreate && (
                                <div className="w-full px-0.5 py-0.5" onClick={(e) => e.stopPropagation()}>
                                  <button
                                    onClick={() => handleResendInvite(emp.id, emp.email)}
                                    disabled={resendingId === emp.id}
                                    className="w-full flex items-center px-2 py-1.5 text-xs text-amber-700 hover:bg-amber-50 rounded-md cursor-pointer font-medium transition-colors"
                                  >
                                    <Send className="h-3.5 w-3.5 mr-2 text-amber-600" /> Resend Invite
                                  </button>
                                </div>
                              )}
                              {canEdit && (
                                <div className="w-full px-0.5 py-0.5" onClick={(e) => e.stopPropagation()}>
                                  <Link
                                    href={`/workspace/employees/${emp.id}`}
                                    className="w-full flex items-center px-2 py-1.5 text-xs text-foreground hover:bg-muted rounded-md cursor-pointer font-medium transition-colors"
                                  >
                                    <Pencil className="h-3.5 w-3.5 mr-2 text-primary" /> Edit Details
                                  </Link>
                                </div>
                              )}
                              {canDelete && (
                                <div className="px-1 py-0.5 border-t border-border mt-0.5" onClick={(e) => e.stopPropagation()}>
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    className="w-full justify-start text-destructive hover:bg-destructive/10 hover:text-destructive text-left h-8 font-medium text-xs"
                                    onClick={() => handleDeleteEmployee(emp.id)}
                                  >
                                    <Trash2 className="size-3.5 mr-2" /> Deactivate
                                  </Button>
                                </div>
                              )}
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </div>

                        {/* Centered Profile Photo */}
                        <Avatar className="h-20 w-20 border-2 border-background shadow-sm mt-5">
                          <AvatarImage
                            src={getProfilePhotoUrl(emp.profilePhoto)}
                            alt={`${emp.firstName} ${emp.lastName}`}
                            className="object-cover"
                          />
                          <AvatarFallback className="bg-primary/10 text-primary font-bold text-lg">
                            {getInitials(emp.firstName, emp.lastName)}
                          </AvatarFallback>
                        </Avatar>

                        {/* Employee Name */}
                        <h3 className="font-bold text-base text-foreground mt-3 leading-snug">
                          {emp.firstName} {emp.lastName}
                        </h3>

                        {/* Designation/Role Badge */}
                        <span 
                          className="inline-block px-3 py-0.5 rounded-full text-[11px] font-semibold border capitalize mt-1.5 mb-3"
                          style={badgeStyle}
                        >
                          {designationName}
                        </span>

                        {/* Employee Details (ID, Email, Dept) */}
                        <div className="w-full space-y-2 text-left text-xs border-t border-border/80 pt-3 mt-auto">
                          {/* ID */}
                          <div className="flex items-center text-muted-foreground gap-2">
                            <IdCard className="h-3.5 w-3.5 shrink-0 text-muted-foreground/60" />
                            <span className="font-semibold uppercase tracking-wider text-muted-foreground/50 w-10">ID</span>
                            <span className="font-mono text-[10px] text-foreground font-semibold bg-muted/60 px-1.5 py-0.5 rounded border border-border">
                              {emp.employeeCode || "Pending"}
                            </span>
                          </div>
                          
                          {/* Email */}
                          <div className="flex items-center text-muted-foreground gap-2">
                            <Mail className="h-3.5 w-3.5 shrink-0 text-muted-foreground/60" />
                            <span className="font-semibold uppercase tracking-wider text-muted-foreground/50 w-10">Email</span>
                            <span className="text-foreground font-medium truncate flex-1" title={emp.email}>
                              {emp.email}
                            </span>
                          </div>

                          {/* Department */}
                          <div className="flex items-center text-muted-foreground gap-2">
                            <Building className="h-3.5 w-3.5 shrink-0 text-muted-foreground/60" />
                            <span className="font-semibold uppercase tracking-wider text-muted-foreground/50 w-10">Dept</span>
                            <span className="text-foreground font-medium truncate flex-1">
                              {emp.department?.name || "Unassigned"}
                            </span>
                          </div>
                        </div>

                        {/* Action Buttons */}
                        <div className="flex items-center gap-3 mt-4 border-t border-border/50 w-full pt-3 justify-center">
                          {isInvited ? (
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleResendInvite(emp.id, emp.email)}
                              disabled={resendingId === emp.id}
                              className="text-xs h-8 border-amber-300 text-amber-800 hover:bg-amber-50 gap-1.5"
                            >
                              <Send className="h-3.5 w-3.5 text-amber-600" />
                              {resendingId === emp.id ? "Sending..." : "Resend Invite"}
                            </Button>
                          ) : (
                            <>
                              <a 
                                href={`mailto:${emp.email}`} 
                                className="flex items-center justify-center h-8 w-8 rounded-full bg-orange-100 hover:bg-orange-200 text-orange-600 transition-colors shadow-xs cursor-pointer"
                                title={`Email ${emp.firstName}`}
                              >
                                <Mail className="h-3.5 w-3.5" />
                              </a>
                              <Link 
                                href={`/workspace/employees/${emp.id}`} 
                                className="flex items-center justify-center h-8 w-8 rounded-full bg-blue-100 hover:bg-blue-200 text-blue-600 transition-colors shadow-xs cursor-pointer"
                                title="View Profile Details"
                              >
                                <User className="h-3.5 w-3.5" />
                              </Link>
                            </>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          {/* List View */}
          {viewMode === "list" && (
            <div className="bg-card rounded-[20px] border border-border apple-shadow-card overflow-hidden">
              <Table>
                <TableHeader>
                  <TableRow className="border-b border-border bg-muted/20">
                    <TableHead>Name</TableHead>
                    <TableHead>Employee ID</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Email</TableHead>
                    <TableHead>Role</TableHead>
                    <TableHead>Department</TableHead>
                    <TableHead>Designation</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredEmployees.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={8} className="h-24 text-center text-muted-foreground">
                        No employees found matching the selected filters.
                      </TableCell>
                    </TableRow>
                  ) : (
                    filteredEmployees.map((emp) => {
                      const isInvited = emp.employmentStatus === "INVITED";
                      return (
                        <TableRow key={emp.id} className="border-b border-border hover:bg-muted/10">
                          <TableCell>
                            <Link 
                              href={`/workspace/employees/${emp.id}`}
                              className="font-medium text-foreground hover:text-primary hover:underline transition-colors flex items-center gap-2"
                            >
                              <Avatar className="h-6 w-6">
                                <AvatarImage src={getProfilePhotoUrl(emp.profilePhoto)} />
                                <AvatarFallback className="text-[10px] font-bold">
                                  {getInitials(emp.firstName, emp.lastName)}
                                </AvatarFallback>
                              </Avatar>
                              <span>{emp.firstName} {emp.lastName}</span>
                            </Link>
                          </TableCell>
                          
                          <TableCell>
                            {emp.employeeCode ? (
                              <Badge variant="secondary" className="bg-muted text-muted-foreground border-border font-mono text-[11px] tracking-wider">
                                {emp.employeeCode}
                              </Badge>
                            ) : (
                              <span className="text-muted-foreground/60 text-xs italic">Pending</span>
                            )}
                          </TableCell>

                          {/* Status Cell */}
                          <TableCell>
                            {getStatusBadge(emp.employmentStatus)}
                          </TableCell>

                          <TableCell className="text-muted-foreground text-xs">{emp.email}</TableCell>
                          
                          <TableCell>
                            <span className="px-2 py-0.5 rounded-full text-[11px] font-bold bg-primary/20 text-secondary border border-primary/10 capitalize">
                              {emp.role.replace('_', ' ').toLowerCase()}
                            </span>
                          </TableCell>
                          
                          <TableCell className="text-muted-foreground text-xs">
                            {emp.department?.name || 'Unassigned'}
                          </TableCell>
                          
                          <TableCell>
                            {emp.designation ? (
                              <span
                                className="px-2 py-0.5 rounded-full text-[11px] font-semibold border"
                                style={{
                                  backgroundColor: `${emp.designation.color || '#6366F1'}20`,
                                  borderColor: `${emp.designation.color || '#6366F1'}40`,
                                  color: emp.designation.color || '#6366F1',
                                }}
                              >
                                {emp.designation.name}
                              </span>
                            ) : (
                              <span className="text-muted-foreground/60 italic text-xs">Unassigned</span>
                            )}
                          </TableCell>
                          
                          <TableCell className="text-right">
                            <div className="inline-flex items-center gap-1">
                              {isInvited && canCreate && (
                                <Button
                                  variant="outline"
                                  size="sm"
                                  className="text-xs h-7 px-2 border-amber-300 text-amber-800 hover:bg-amber-50"
                                  onClick={() => handleResendInvite(emp.id, emp.email)}
                                  disabled={resendingId === emp.id}
                                  title="Resend Invitation Email"
                                >
                                  <Send className="h-3 w-3 mr-1 text-amber-600" />
                                  {resendingId === emp.id ? "Sending..." : "Resend"}
                                </Button>
                              )}
                              {canEdit && (
                                <Link href={`/workspace/employees/${emp.id}`}>
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    className="text-primary hover:text-primary/80 hover:bg-primary/10 cursor-pointer text-xs h-7 px-2 font-medium"
                                  >
                                    <Pencil className="size-3 mr-1" /> Edit
                                  </Button>
                                </Link>
                              )}
                              {canDelete && (
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  className="text-destructive hover:bg-destructive/10 hover:text-destructive cursor-pointer h-7 w-7 p-0"
                                  onClick={() => handleDeleteEmployee(emp.id)}
                                  title="Deactivate employee"
                                >
                                  <Trash2 className="size-3.5" />
                                </Button>
                              )}
                            </div>
                          </TableCell>
                        </TableRow>
                      );
                    })
                  )}
                </TableBody>
              </Table>
            </div>
          )}
        </>
      )}
    </div>
  );
}
