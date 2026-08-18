"use client";

import { AddEmployeeModal } from "@/components/employees/AddEmployeeModal";
import { EditEmployeeModal } from "@/components/employees/EditEmployeeModal";
import { useEffect, useState } from "react";
import axios from "axios";
import { Loader2, Search, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge"; // ✅ Added Badge import
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

interface Employee {
  id: string;
  employeeCode?: string; // ✅ Added employeeCode to the interface
  firstName: string;
  lastName: string;
  email: string;
  role: "SUPER_ADMIN" | "HR_HEAD" | "OWNER" | "MANAGER" | "EMPLOYEE";
  department?: { name: string };
}

export default function EmployeeDirectoryPage() {
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");

  useEffect(() => {
    async function fetchEmployees() {
      try {
        const token = localStorage.getItem("hrms_token");
        const response = await axios.get(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000'}/employees`, {
          headers: { Authorization: `Bearer ${token}` }
        });
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
      await axios.delete(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000'}/employees/${employeeId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      // Instantly remove the employee from the UI without reloading the page
      setEmployees(employees.filter(emp => emp.id !== employeeId));
    } catch (error: any) {
      console.error("Failed to delete employee", error);
      alert(error.response?.data?.message || "Failed to delete employee");
    }
  }

  const filteredEmployees = employees.filter(emp => 
    `${emp.firstName} ${emp.lastName}`.toLowerCase().includes(searchTerm.toLowerCase()) ||
    emp.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (emp.employeeCode && emp.employeeCode.toLowerCase().includes(searchTerm.toLowerCase())) // ✅ Added search by ID
  );

  return (
    <div className="p-8 max-w-7xl mx-auto space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-slate-900">Employee Directory</h1>
          <p className="text-slate-500 mt-1">Manage your team members and their roles.</p>
        </div>
       <div className="flex justify-between items-center">
       
        
        {/* Replace the old button with our new Component! */}
        <AddEmployeeModal />
        
      </div>
      </div>

      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="p-4 border-b border-slate-200 bg-slate-50 flex items-center">
          <div className="relative w-72">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
            <Input 
              placeholder="Search employees or IDs..." 
              className="pl-9 bg-white"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </div>

        {loading ? (
          <div className="p-12 flex justify-center">
            <Loader2 className="h-8 w-8 animate-spin text-emerald-500" />
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Employee ID</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>Role</TableHead>
                <TableHead>Department</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredEmployees.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="h-24 text-center text-slate-500">
                    No employees found.
                  </TableCell>
                </TableRow>
              ) : (
                filteredEmployees.map((emp) => (
                  <TableRow key={emp.id}>
                    <TableCell className="font-medium text-slate-900">
                      {emp.firstName} {emp.lastName}
                    </TableCell>
                    
                    <TableCell>
                      {emp.employeeCode ? (
                        <Badge variant="secondary" className="bg-slate-100 text-slate-700 font-mono text-xs tracking-wider">
                          {emp.employeeCode}
                        </Badge>
                      ) : (
                        <span className="text-slate-400 text-xs italic">N/A</span>
                      )}
                    </TableCell>

                    <TableCell className="text-slate-500">{emp.email}</TableCell>
                    <TableCell>
                      <span className="px-2.5 py-0.5 rounded-full text-xs font-medium bg-emerald-100 text-emerald-700 capitalize">
                        {emp.role.replace('_', ' ').toLowerCase()}
                      </span>
                    </TableCell>
                    <TableCell className="text-slate-500">
                      {emp.department?.name || 'Unassigned'}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="inline-flex items-center gap-1">
                        <EditEmployeeModal employee={emp} />
                        <Button
                          variant="ghost"
                          size="sm"
                          className="text-red-600 hover:bg-red-50 hover:text-red-700"
                          onClick={() => handleDeleteEmployee(emp.id)}
                        >
                          <Trash2 className="size-4" /> Deactivate
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        )}
      </div>
    </div>
  );
}