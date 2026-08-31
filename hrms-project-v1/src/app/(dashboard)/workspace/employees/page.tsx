"use client";

import { AddEmployeeModal } from "@/components/employees/AddEmployeeModal";
import { EditEmployeeModal } from "@/components/employees/EditEmployeeModal";
import { useEffect, useState } from "react";
import axios from "axios";
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
  MoreHorizontal 
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
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
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedRole, setSelectedRole] = useState("");
  const [selectedDepartment, setSelectedDepartment] = useState("");
  const [viewMode, setViewMode] = useState<"card" | "list">("card");

  const canCreate = useModulePermission("employees", "create");
  const canEdit = useModulePermission("employees", "edit");
  const canDelete = useModulePermission("employees", "delete");

  useEffect(() => {
    async function fetchEmployees() {
      try {
        const token = localStorage.getItem("hrms_token");
        const response = await axios.get(
          `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000'}/employees`,
          { headers: { Authorization: `Bearer ${token}` } }
        );
        setEmployees(response.data);
      } catch (error) {
        console.error("Failed to fetch employees", error);
      } finally {
        setLoading(false);
      }
    }
    fetchEmployees();
  }, []);

  async function handleDeleteEmployee(employeeId: string) {
    const confirmDelete = window.confirm("Are you sure you want to deactivate and remove this employee?");
    if (!confirmDelete) return;

    try {
      const token = localStorage.getItem("hrms_token");
      await axios.delete(
        `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000'}/employees/${employeeId}`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      
      setEmployees(employees.filter(emp => emp.id !== employeeId));
    } catch (error: any) {
      console.error("Failed to delete employee", error);
      alert(error.response?.data?.message || "Failed to delete employee");
    }
  }

  const getProfilePhotoUrl = (photoPath?: string) => {
    if (!photoPath) return "";
    if (photoPath.startsWith("http://") || photoPath.startsWith("https://")) {
      return photoPath;
    }
    const backendUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000";
    return `${backendUrl}${photoPath}`;
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

  // Filter Logic
  const filteredEmployees = employees.filter(emp => {
    const matchesSearch = 
      `${emp.firstName} ${emp.lastName}`.toLowerCase().includes(searchTerm.toLowerCase()) ||
      emp.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (emp.employeeCode && emp.employeeCode.toLowerCase().includes(searchTerm.toLowerCase()));
      
    const matchesRole = selectedRole ? emp.role === selectedRole : true;
    
    const matchesDept = selectedDepartment 
      ? emp.department?.name === selectedDepartment 
      : true;
      
    return matchesSearch && matchesRole && matchesDept;
  });

  // Calculate statistics
  const totalCount = employees.length;
  const maleCount = employees.filter(emp => emp.gender === 'MALE' || emp.gender === 'male' || (emp as any).gender === 'Male').length;
  const femaleCount = employees.filter(emp => emp.gender === 'FEMALE' || emp.gender === 'female' || (emp as any).gender === 'Female').length;
  
  const newCount = employees.filter(emp => {
    if (!emp.createdAt) return false;
    const createdDate = new Date(emp.createdAt);
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    return createdDate >= thirtyDaysAgo;
  }).length;

  // Extract unique departments for filtering
  const departmentsList = Array.from(
    new Set(employees.map(emp => emp.department?.name).filter(Boolean))
  ) as string[];

  return (
    <div className="p-8 max-w-7xl mx-auto space-y-6">
      {/* Header section */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Employee Directory</h1>
          <p className="text-muted-foreground mt-1">Add and manage your organization's employees.</p>
        </div>
        <div className="flex justify-between items-center shrink-0">
          {canCreate && <AddEmployeeModal />}
        </div>
      </div>

      {/* Dynamic Statistics Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {/* Total Employees */}
        <div className="bg-card border border-border rounded-2xl p-5 flex items-center gap-4 shadow-sm hover:shadow-md transition-all">
          <div className="h-12 w-12 rounded-xl bg-violet-100 dark:bg-violet-900/20 flex items-center justify-center text-violet-600 dark:text-violet-400 shrink-0">
            <Users className="h-5 w-5" />
          </div>
          <div>
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Total Employee</p>
            <h3 className="text-2xl font-bold text-foreground mt-0.5">{totalCount}</h3>
          </div>
        </div>

        {/* New Employees */}
        <div className="bg-card border border-border rounded-2xl p-5 flex items-center gap-4 shadow-sm hover:shadow-md transition-all">
          <div className="h-12 w-12 rounded-xl bg-orange-100 dark:bg-orange-900/20 flex items-center justify-center text-orange-600 dark:text-orange-400 shrink-0">
            <UserPlus className="h-5 w-5" />
          </div>
          <div>
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">New Employee</p>
            <h3 className="text-2xl font-bold text-foreground mt-0.5">{newCount}</h3>
          </div>
        </div>

        {/* Male Employees */}
        <div className="bg-card border border-border rounded-2xl p-5 flex items-center gap-4 shadow-sm hover:shadow-md transition-all">
          <div className="h-12 w-12 rounded-xl bg-blue-100 dark:bg-blue-900/20 flex items-center justify-center text-blue-600 dark:text-blue-400 shrink-0">
            <User className="h-5 w-5" />
          </div>
          <div>
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Male</p>
            <h3 className="text-2xl font-bold text-foreground mt-0.5">{maleCount}</h3>
          </div>
        </div>

        {/* Female Employees */}
        <div className="bg-card border border-border rounded-2xl p-5 flex items-center gap-4 shadow-sm hover:shadow-md transition-all">
          <div className="h-12 w-12 rounded-xl bg-emerald-100 dark:bg-emerald-900/20 flex items-center justify-center text-emerald-600 dark:text-emerald-400 shrink-0">
            <User className="h-5 w-5" />
          </div>
          <div>
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Female</p>
            <h3 className="text-2xl font-bold text-foreground mt-0.5">{femaleCount}</h3>
          </div>
        </div>
      </div>

      {/* Filters & View Toggle Bar */}
      <div className="bg-card border border-border rounded-2xl p-4 shadow-sm flex flex-col md:flex-row justify-between items-stretch md:items-center gap-4">
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 flex-1">
          {/* Search by Name/ID */}
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground/60" />
            <Input 
              placeholder="Search by name or ID..." 
              className="pl-9 bg-card border-border h-10 rounded-lg text-sm"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>

          {/* Select Role */}
          <select 
            value={selectedRole}
            onChange={(e) => setSelectedRole(e.target.value)}
            className="h-10 px-3 py-1.5 rounded-lg border border-border bg-card text-foreground text-sm focus:outline-none focus:ring-1 focus:ring-primary w-full sm:w-44 capitalize cursor-pointer"
          >
            <option value="">Select Role</option>
            <option value="SUPER_ADMIN">Super Admin</option>
            <option value="HR_HEAD">HR Head</option>
            <option value="OWNER">Owner</option>
            <option value="MANAGER">Manager</option>
            <option value="EMPLOYEE">Employee</option>
          </select>

          {/* Select Department */}
          <select
            value={selectedDepartment}
            onChange={(e) => setSelectedDepartment(e.target.value)}
            className="h-10 px-3 py-1.5 rounded-lg border border-border bg-card text-foreground text-sm focus:outline-none focus:ring-1 focus:ring-primary w-full sm:w-48 cursor-pointer"
          >
            <option value="">Select Department</option>
            {departmentsList.map((deptName) => (
              <option key={deptName} value={deptName}>
                {deptName}
              </option>
            ))}
          </select>
        </div>

        {/* Layout Switch Toggle */}
        <div className="flex items-center gap-2 self-end md:self-auto">
          <span className="text-xs text-muted-foreground font-semibold uppercase tracking-wider hidden sm:inline mr-1">View Mode</span>
          <div className="flex items-center border border-border rounded-lg p-1 bg-muted/20">
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
        <div className="p-12 flex justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      ) : (
        <>
          {/* Card View (Wider layout by setting max columns to 4 on desktop, 3 on lg screens) */}
          {viewMode === "card" && (
            <div>
              {filteredEmployees.length === 0 ? (
                <div className="p-12 text-center text-muted-foreground border border-dashed border-border rounded-2xl">
                  No employees found.
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                  {filteredEmployees.map((emp) => {
                    const badgeStyle = getBadgeStyle(emp);
                    const designationName = emp.designation?.name || emp.role.replace('_', ' ').toLowerCase();
                    
                    return (
                      <div 
                        key={emp.id} 
                        className="bg-card border border-border rounded-2xl shadow-sm relative p-5 flex flex-col items-center text-center transition-all hover:shadow-md hover:border-muted-foreground/30 group"
                      >
                        {/* Settings Ellipsis Dropdown (Edit / Delete) */}
                        {(canEdit || canDelete) && (
                          <div className="absolute top-4 right-4 z-10">
                            <DropdownMenu>
                              <DropdownMenuTrigger className="h-8 w-8 hover:bg-muted flex items-center justify-center rounded-full cursor-pointer border-0 bg-transparent focus:outline-none">
                                <MoreHorizontal className="h-4 w-4 text-muted-foreground/80" />
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end" className="w-40 bg-card border border-border shadow-md rounded-xl p-1">
                                {canEdit && (
                                  <div className="w-full flex justify-start px-1 py-0.5" onClick={(e) => e.stopPropagation()}>
                                    <EditEmployeeModal employee={emp} />
                                  </div>
                                )}
                                {canDelete && (
                                  <div className="px-1 py-0.5 border-t border-border mt-0.5" onClick={(e) => e.stopPropagation()}>
                                    <Button
                                      variant="ghost"
                                      size="sm"
                                      className="w-full justify-start text-destructive hover:bg-destructive/10 hover:text-destructive text-left h-9 font-medium"
                                      onClick={() => handleDeleteEmployee(emp.id)}
                                    >
                                      <Trash2 className="size-4 mr-2" /> Deactivate
                                    </Button>
                                  </div>
                                )}
                              </DropdownMenuContent>
                            </DropdownMenu>
                          </div>
                        )}

                        {/* Centered Profile Photo */}
                        <Avatar className="h-20 w-20 border-2 border-background shadow-sm mt-2">
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
                          className="inline-block px-3 py-0.5 rounded-full text-[11px] font-semibold border capitalize mt-1.5 mb-4"
                          style={badgeStyle}
                        >
                          {designationName}
                        </span>

                        {/* Employee Details (ID, Email, Dept) */}
                        <div className="w-full space-y-2 text-left text-xs border-t border-border/80 pt-4 mt-auto">
                          {/* ID */}
                          <div className="flex items-center text-muted-foreground gap-2">
                            <IdCard className="h-3.5 w-3.5 shrink-0 text-muted-foreground/60" />
                            <span className="font-semibold uppercase tracking-wider text-muted-foreground/50 w-10">ID</span>
                            <span className="font-mono text-[10px] text-foreground font-semibold bg-muted/60 px-1.5 py-0.5 rounded border border-border">
                              {emp.employeeCode || "N/A"}
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

                        {/* Reporting Manager */}
                        <div className="w-full text-left text-[11px] text-muted-foreground/80 mt-3 pt-3 border-t border-border/50">
                          <span>
                            Reporting Manager:{" "}
                            <span className="font-semibold text-foreground">
                              {emp.reportingManager
                                ? `${emp.reportingManager.firstName} ${emp.reportingManager.lastName}`
                                : "No Manager"}
                            </span>
                          </span>
                        </div>

                        {/* Action Buttons (excluding phone call button) */}
                        <div className="flex items-center gap-4 mt-5 border-t border-border/50 w-full pt-4 justify-center">
                          {/* Email */}
                          <a 
                            href={`mailto:${emp.email}`} 
                            className="flex items-center justify-center h-9 w-9 rounded-full bg-orange-100 hover:bg-orange-200 text-orange-600 transition-colors shadow-sm cursor-pointer"
                            title={`Email ${emp.firstName}`}
                          >
                            <Mail className="h-4 w-4" />
                          </a>
                          
                          {/* View Profile */}
                          <Link 
                            href={`/workspace/employees/${emp.id}`} 
                            className="flex items-center justify-center h-9 w-9 rounded-full bg-blue-100 hover:bg-blue-200 text-blue-600 transition-colors shadow-sm cursor-pointer"
                            title="View Profile Details"
                          >
                            <User className="h-4 w-4" />
                          </Link>
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
            <div className="bg-card rounded-2xl border border-border shadow-sm overflow-hidden">
              <Table>
                <TableHeader>
                  <TableRow className="border-b border-border">
                    <TableHead>Name</TableHead>
                    <TableHead>Employee ID</TableHead>
                    <TableHead>Email</TableHead>
                    <TableHead>Role</TableHead>
                    <TableHead>Reporting Manager</TableHead>
                    <TableHead>Department</TableHead>
                    <TableHead>Designation</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredEmployees.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={8} className="h-24 text-center text-muted-foreground">
                        No employees found.
                      </TableCell>
                    </TableRow>
                  ) : (
                    filteredEmployees.map((emp) => (
                      <TableRow key={emp.id} className="border-b border-border hover:bg-muted/10">
                        <TableCell className="font-medium text-foreground">
                          {emp.firstName} {emp.lastName}
                        </TableCell>
                        
                        <TableCell>
                          {emp.employeeCode ? (
                            <Badge variant="secondary" className="bg-muted text-muted-foreground border-border font-mono text-xs tracking-wider">
                              {emp.employeeCode}
                            </Badge>
                          ) : (
                            <span className="text-muted-foreground/60 text-xs italic">N/A</span>
                          )}
                        </TableCell>

                        <TableCell className="text-muted-foreground">{emp.email}</TableCell>
                        <TableCell>
                          <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-primary/20 text-secondary border border-primary/10 capitalize">
                            {emp.role.replace('_', ' ').toLowerCase()}
                          </span>
                        </TableCell>
                        <TableCell className="text-muted-foreground">
                          {emp.reportingManager ? (
                            <span className="font-medium text-foreground">
                              {emp.reportingManager.firstName} {emp.reportingManager.lastName}
                            </span>
                          ) : (
                            <span className="text-muted-foreground/60 italic text-xs">No Manager</span>
                          )}
                        </TableCell>
                        <TableCell className="text-muted-foreground">
                          {emp.department?.name || 'Unassigned'}
                        </TableCell>
                        <TableCell>
                          {emp.designation ? (
                            <span
                              className="px-2.5 py-0.5 rounded-full text-xs font-semibold border"
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
                            {canEdit && <EditEmployeeModal employee={emp} />}
                            {canDelete && (
                              <Button
                                variant="ghost"
                                size="sm"
                                className="text-destructive hover:bg-destructive/10 hover:text-destructive cursor-pointer"
                                onClick={() => handleDeleteEmployee(emp.id)}
                              >
                                <Trash2 className="size-4" /> Deactivate
                              </Button>
                            )}
                          </div>
                        </TableCell>
                      </TableRow>
                    ))
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