"use client";

import axios from "axios";
import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Loader2, Pencil, Plus, Trash2, GraduationCap, ShieldAlert, User, Mail, Building } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

const employeeSchema = z.object({
  firstName: z.string().min(2, "First name is required"),
  lastName: z.string().min(2, "Last name is required"),
  email: z.string().email("Invalid email address"),
  role: z.enum(["SUPER_ADMIN", "HR_HEAD", "OWNER", "MANAGER", "EMPLOYEE"]),
  reportingManagerId: z.string().optional().nullable(),
  departmentId: z.string().optional().nullable(),
  designationId: z.string().optional().nullable(),
});

type EmployeeForEdit = z.infer<typeof employeeSchema> & { id: string };

export function EditEmployeeModal({ employee }: { employee: EmployeeForEdit }) {
  const [open, setOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [managers, setManagers] = useState<any[]>([]);
  const [departments, setDepartments] = useState<any[]>([]);
  const [designations, setDesignations] = useState<any[]>([]);
  const queryClient = useQueryClient();

  // Local state for skills and emergency contacts forms
  const [skillForm, setSkillForm] = useState({ name: "", proficiencyLevel: "INTERMEDIATE" });
  const [contactForm, setContactForm] = useState({ name: "", relationship: "", phone: "" });

  const form = useForm<z.infer<typeof employeeSchema>>({
    resolver: zodResolver(employeeSchema),
    defaultValues: employee,
  });

  useEffect(() => {
    if (open) {
      const token = localStorage.getItem("hrms_token");
      const headers = { Authorization: `Bearer ${token}` };
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';
      
      axios.get(`${apiUrl}/employees`, { headers })
        .then(res => {
          console.log("DEBUG: fetched managers list:", res.data);
          setManagers(res.data);
        })
        .catch(err => console.error("Failed to load employees for managers list", err));

      axios.get(`${apiUrl}/organization/departments`, { headers })
        .then(res => {
          console.log("DEBUG: fetched departments list:", res.data);
          setDepartments(res.data);
        })
        .catch(err => console.error("Failed to load departments", err));

      axios.get(`${apiUrl}/organization/designations`, { headers })
        .then(res => {
          console.log("DEBUG: fetched designations list:", res.data);
          setDesignations(res.data);
        })
        .catch(err => console.error("Failed to load designations", err));
    }
  }, [open]);

  useEffect(() => {
    if (open && employee) {
      form.reset({
        firstName: employee.firstName || "",
        lastName: employee.lastName || "",
        email: employee.email || "",
        role: employee.role,
        reportingManagerId: (employee as any).reportingManagerId || ((employee as any).reportingManager?.id) || "",
        departmentId: (employee as any).departmentId || ((employee as any).department?.id) || "",
        designationId: (employee as any).designationId || ((employee as any).designation?.id) || "",
      });
    }
  }, [employee, form, open]);

  // Query: Fetch full employee details including skills and emergency contacts
  const { data: fullEmployee, isLoading: isLoadingEmployee, refetch } = useQuery({
    queryKey: ["employeeDetails", employee.id],
    queryFn: async () => {
      const token = localStorage.getItem("hrms_token");
      const res = await axios.get(
        `${process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000"}/employees/${employee.id}`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      return res.data;
    },
    enabled: open,
  });

  // Mutation: Save standard details
  async function onSubmit(values: z.infer<typeof employeeSchema>) {
    setIsSubmitting(true);
    try {
      const token = localStorage.getItem("hrms_token");
      const payload = {
        ...values,
        departmentId: values.departmentId === "none" || !values.departmentId ? null : values.departmentId,
        reportingManagerId: values.reportingManagerId === "none" || !values.reportingManagerId ? null : values.reportingManagerId,
        designationId: values.designationId === "none" || !values.designationId ? null : values.designationId,
      };
      await axios.patch(
        `${process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000"}/employees/${employee.id}`,
        payload,
        { headers: { Authorization: `Bearer ${token}` } },
      );
      setOpen(false);
      window.location.reload();
    } catch (error: any) {
      console.error("Failed to update employee", error);
      alert(error.response?.data?.message || "Failed to update employee");
    } finally {
      setIsSubmitting(false);
    }
  }
  // Mutation: Add Skill
  const addSkillMutation = useMutation({
    mutationFn: async (data: any) => {
      const token = localStorage.getItem("hrms_token");
      await axios.post(`${process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000"}/employees/${employee.id}/skills`, data, {
        headers: { Authorization: `Bearer ${token}` }
      });
    },
    onSuccess: () => {
      refetch();
      setSkillForm({ name: "", proficiencyLevel: "INTERMEDIATE" });
      queryClient.invalidateQueries({ queryKey: ["employeeDetails", employee.id] });
    },
    onError: (error: any) => {
      alert(error.response?.data?.message || "Failed to add skill");
    }
  });

  // Mutation: Delete Skill
  const deleteSkillMutation = useMutation({
    mutationFn: async (skillId: string) => {
      const token = localStorage.getItem("hrms_token");
      await axios.delete(`${process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000"}/employees/${employee.id}/skills/${skillId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
    },
    onSuccess: () => {
      refetch();
      queryClient.invalidateQueries({ queryKey: ["employeeDetails", employee.id] });
    },
    onError: (error: any) => {
      alert(error.response?.data?.message || "Failed to delete skill");
    }
  });

  // Mutation: Add Emergency Contact
  const addContactMutation = useMutation({
    mutationFn: async (data: any) => {
      const token = localStorage.getItem("hrms_token");
      await axios.post(`${process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000"}/employees/${employee.id}/emergency-contacts`, data, {
        headers: { Authorization: `Bearer ${token}` }
      });
    },
    onSuccess: () => {
      refetch();
      setContactForm({ name: "", relationship: "", phone: "" });
      queryClient.invalidateQueries({ queryKey: ["employeeDetails", employee.id] });
    },
    onError: (error: any) => {
      alert(error.response?.data?.message || "Failed to add contact");
    }
  });

  // Mutation: Delete Emergency Contact
  const deleteContactMutation = useMutation({
    mutationFn: async (contactId: string) => {
      const token = localStorage.getItem("hrms_token");
      await axios.delete(`${process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000"}/employees/${employee.id}/emergency-contacts/${contactId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
    },
    onSuccess: () => {
      refetch();
      queryClient.invalidateQueries({ queryKey: ["employeeDetails", employee.id] });
    },
    onError: (error: any) => {
      alert(error.response?.data?.message || "Failed to delete contact");
    }
  });

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger render={<Button variant="ghost" className="text-emerald-600 hover:text-emerald-700" />}>
        <Pencil className="size-4" /> Edit
      </DialogTrigger>
      <DialogContent className="sm:max-w-[550px]">
        <DialogHeader>
          <DialogTitle>Edit employee</DialogTitle>
          <DialogDescription>Update directory information, system role, skills, and emergency contacts.</DialogDescription>
        </DialogHeader>

        <Tabs defaultValue="details" className="w-full mt-2">
          <TabsList className="grid w-full grid-cols-3 h-10 bg-slate-100 mb-4">
            <TabsTrigger value="details">Details</TabsTrigger>
            <TabsTrigger value="skills" className="flex items-center gap-1">
              <GraduationCap className="h-4 w-4" /> Skills
            </TabsTrigger>
            <TabsTrigger value="contacts" className="flex items-center gap-1">
              <ShieldAlert className="h-4 w-4" /> Emergency
            </TabsTrigger>
          </TabsList>

          {/* TAB: DETAILS */}
          <TabsContent value="details" className="focus-visible:outline-none">
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-5 pt-1">
                
                {/* SECTION 1: Personal Profile */}
                <div className="bg-slate-50/60 p-4 rounded-xl border border-slate-100/80 space-y-4">
                  <div className="flex items-center gap-2 border-b border-slate-100 pb-2 mb-1">
                    <User className="h-4 w-4 text-emerald-600" />
                    <h3 className="text-xs font-bold text-slate-700 uppercase tracking-wider">Personal Profile</h3>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <FormField control={form.control} name="firstName" render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-xs font-semibold text-slate-600">First Name</FormLabel>
                        <FormControl>
                          <Input {...field} className="h-9 text-sm border-slate-200 focus-visible:ring-emerald-500 rounded-lg bg-white" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )} />
                    <FormField control={form.control} name="lastName" render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-xs font-semibold text-slate-600">Last Name</FormLabel>
                        <FormControl>
                          <Input {...field} className="h-9 text-sm border-slate-200 focus-visible:ring-emerald-500 rounded-lg bg-white" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )} />
                  </div>

                  <FormField control={form.control} name="email" render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-xs font-semibold text-slate-600">Work Email</FormLabel>
                      <FormControl>
                        <div className="relative">
                          <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                          <Input type="email" {...field} className="h-9 pl-9 text-sm border-slate-200 focus-visible:ring-emerald-500 rounded-lg bg-white" />
                        </div>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )} />
                </div>

                {/* SECTION 2: Employment & Org Hierarchy */}
                <div className="bg-slate-50/60 p-4 rounded-xl border border-slate-100/80 space-y-4">
                  <div className="flex items-center gap-2 border-b border-slate-100 pb-2 mb-1">
                    <Building className="h-4 w-4 text-emerald-600" />
                    <h3 className="text-xs font-bold text-slate-700 uppercase tracking-wider">Employment & Org Hierarchy</h3>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <FormField control={form.control} name="role" render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-xs font-semibold text-slate-600">System Role</FormLabel>
                        <Select value={field.value} onValueChange={field.onChange}>
                          <FormControl>
                            <SelectTrigger className="h-9 text-sm border-slate-200 focus:ring-emerald-500 rounded-lg bg-white">
                              <SelectValue placeholder="Select a role">
                                {(value) => {
                                  const rolesMap: Record<string, string> = {
                                    SUPER_ADMIN: "Super Admin",
                                    HR_HEAD: "HR Admin",
                                    OWNER: "Owner",
                                    MANAGER: "Manager",
                                    EMPLOYEE: "Standard Employee",
                                  };
                                  return rolesMap[value as string] || value;
                                }}
                              </SelectValue>
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="SUPER_ADMIN">Super Admin</SelectItem>
                            <SelectItem value="HR_HEAD">HR Admin</SelectItem>
                            <SelectItem value="OWNER">Owner</SelectItem>
                            <SelectItem value="MANAGER">Manager</SelectItem>
                            <SelectItem value="EMPLOYEE">Standard Employee</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )} />

                    <FormField control={form.control} name="departmentId" render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-xs font-semibold text-slate-600">Department</FormLabel>
                        <Select key={departments.length} value={field.value || "none"} onValueChange={field.onChange}>
                          <FormControl>
                            <SelectTrigger className="h-9 text-sm border-slate-200 focus:ring-emerald-500 rounded-lg bg-white">
                              <SelectValue placeholder="Select department">
                                {(value) => {
                                  if (value === "none" || !value) return "None";
                                  return departments.find(d => d.id === value)?.name || value;
                                }}
                              </SelectValue>
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="none">None</SelectItem>
                            {departments.map((dept) => (
                              <SelectItem key={dept.id} value={dept.id}>{dept.name}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )} />

                    <FormField control={form.control} name="designationId" render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-xs font-semibold text-slate-600">Designation</FormLabel>
                        <Select key={designations.length} value={field.value || "none"} onValueChange={field.onChange}>
                          <FormControl>
                            <SelectTrigger className="h-9 text-sm border-slate-200 focus:ring-emerald-500 rounded-lg bg-white">
                              <SelectValue placeholder="Select designation">
                                {(value) => {
                                  if (value === "none" || !value) return "None";
                                  return designations.find(d => d.id === value)?.name || value;
                                }}
                              </SelectValue>
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="none">None</SelectItem>
                            {designations.map((designation) => (
                              <SelectItem key={designation.id} value={designation.id}>{designation.name}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )} />

                    <FormField control={form.control} name="reportingManagerId" render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-xs font-semibold text-slate-600">Reporting Manager</FormLabel>
                        <Select key={managers.length} value={field.value || "none"} onValueChange={field.onChange}>
                          <FormControl>
                            <SelectTrigger className="h-9 text-sm border-slate-200 focus:ring-emerald-500 rounded-lg bg-white">
                              <SelectValue placeholder="Select manager">
                                {(value) => {
                                  if (value === "none" || !value) return "None";
                                  const mgr = managers.find(m => m.id === value);
                                  return mgr ? `${mgr.firstName} ${mgr.lastName} (${mgr.role.replace('_', ' ').toLowerCase()})` : value;
                                }}
                              </SelectValue>
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="none">None</SelectItem>
                            {managers.filter(mgr => mgr.id !== employee?.id).map((mgr) => (
                              <SelectItem key={mgr.id} value={mgr.id}>
                                {mgr.firstName} {mgr.lastName} ({mgr.role.replace('_', ' ').toLowerCase()})
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )} />
                  </div>
                </div>


                <div className="flex justify-end pt-2">
                  <Button type="submit" disabled={isSubmitting} className="bg-emerald-600 hover:bg-emerald-700 text-white font-medium px-6 py-2 rounded-lg transition-all shadow-sm">
                    {isSubmitting ? <><Loader2 className="mr-2 size-4 animate-spin" />Saving...</> : "Save changes"}
                  </Button>
                </div>
              </form>
            </Form>
          </TabsContent>

          {/* TAB: SKILLS */}
          <TabsContent value="skills" className="space-y-4 focus-visible:outline-none">
            <div className="space-y-2">
              <h4 className="text-sm font-semibold text-slate-800">Current Skills & Certifications</h4>
              <div className="space-y-1.5 max-h-48 overflow-y-auto border rounded-md p-2 bg-slate-50 min-h-[80px]">
                {isLoadingEmployee ? (
                  <div className="flex justify-center py-4"><Loader2 className="h-5 w-5 animate-spin text-emerald-500" /></div>
                ) : !fullEmployee?.skills?.length ? (
                  <p className="text-xs text-slate-500 py-4 text-center">No skills added yet.</p>
                ) : (
                  fullEmployee.skills.map((skill: any) => (
                    <div key={skill.id} className="flex justify-between items-center bg-white p-2 rounded border text-xs">
                      <div>
                        <span className="font-semibold text-slate-800">{skill.name}</span>
                        <span className="ml-2 px-1.5 py-0.5 rounded bg-slate-100 text-slate-600 font-medium capitalize text-[10px]">
                          {skill.proficiencyLevel.toLowerCase()}
                        </span>
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-6 w-6 p-0 text-red-500 hover:text-red-700 hover:bg-red-50"
                        onClick={() => deleteSkillMutation.mutate(skill.id)}
                        disabled={deleteSkillMutation.isPending}
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                  ))
                )}
              </div>
            </div>

            <div className="flex gap-2 items-end bg-slate-50 p-3 rounded-md border text-xs">
              <div className="flex-1 space-y-1">
                <label className="text-xs font-medium text-slate-700">Skill Name</label>
                <Input
                  placeholder="React.js"
                  className="h-8 text-xs bg-white"
                  value={skillForm.name}
                  onChange={(e) => setSkillForm({ ...skillForm, name: e.target.value })}
                />
              </div>
              <div className="w-28 space-y-1">
                <label className="text-xs font-medium text-slate-700">Proficiency</label>
                <select
                  className="w-full h-8 border-slate-200 rounded-md p-1 bg-white border text-xs outline-none"
                  value={skillForm.proficiencyLevel}
                  onChange={(e) => setSkillForm({ ...skillForm, proficiencyLevel: e.target.value })}
                >
                  <option value="BEGINNER">Beginner</option>
                  <option value="INTERMEDIATE">Intermediate</option>
                  <option value="ADVANCED">Advanced</option>
                  <option value="EXPERT">Expert</option>
                </select>
              </div>
              <Button
                size="sm"
                className="h-8 bg-emerald-600 hover:bg-emerald-700 text-white text-xs"
                onClick={() => addSkillMutation.mutate(skillForm)}
                disabled={!skillForm.name || addSkillMutation.isPending}
              >
                <Plus className="w-3.5 h-3.5 mr-1" /> Add
              </Button>
            </div>
          </TabsContent>

          {/* TAB: EMERGENCY */}
          <TabsContent value="contacts" className="space-y-4 focus-visible:outline-none">
            <div className="space-y-2">
              <h4 className="text-sm font-semibold text-slate-800">Current Emergency Contacts</h4>
              <div className="space-y-1.5 max-h-48 overflow-y-auto border rounded-md p-2 bg-slate-50 min-h-[80px]">
                {isLoadingEmployee ? (
                  <div className="flex justify-center py-4"><Loader2 className="h-5 w-5 animate-spin text-emerald-500" /></div>
                ) : !fullEmployee?.emergencyContacts?.length ? (
                  <p className="text-xs text-slate-500 py-4 text-center">No emergency contacts added yet.</p>
                ) : (
                  fullEmployee.emergencyContacts.map((contact: any) => (
                    <div key={contact.id} className="flex justify-between items-center bg-white p-2 rounded border text-xs">
                      <div>
                        <span className="font-semibold text-slate-800">{contact.name}</span>
                        <span className="text-slate-400 mx-1">({contact.relationship})</span>
                        <span className="text-slate-500 font-mono ml-2">{contact.phone}</span>
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-6 w-6 p-0 text-red-500 hover:text-red-700 hover:bg-red-50"
                        onClick={() => deleteContactMutation.mutate(contact.id)}
                        disabled={deleteContactMutation.isPending}
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                  ))
                )}
              </div>
            </div>

            <div className="grid grid-cols-1 gap-2 bg-slate-50 p-3 rounded-md border text-xs">
              <div className="grid grid-cols-3 gap-2">
                <div className="space-y-1">
                  <label className="text-xs font-medium text-slate-700">Full Name</label>
                  <Input
                    placeholder="Jane Doe"
                    className="h-8 text-xs bg-white"
                    value={contactForm.name}
                    onChange={(e) => setContactForm({ ...contactForm, name: e.target.value })}
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-medium text-slate-700">Relationship</label>
                  <Input
                    placeholder="Spouse"
                    className="h-8 text-xs bg-white"
                    value={contactForm.relationship}
                    onChange={(e) => setContactForm({ ...contactForm, relationship: e.target.value })}
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-medium text-slate-700">Phone</label>
                  <Input
                    placeholder="+1 555-0123"
                    className="h-8 text-xs bg-white"
                    value={contactForm.phone}
                    onChange={(e) => setContactForm({ ...contactForm, phone: e.target.value })}
                  />
                </div>
              </div>
              <div className="flex justify-end">
                <Button
                  size="sm"
                  className="h-8 bg-emerald-600 hover:bg-emerald-700 text-white text-xs mt-1"
                  onClick={() => addContactMutation.mutate(contactForm)}
                  disabled={!contactForm.name || !contactForm.phone || addContactMutation.isPending}
                >
                  <Plus className="w-3.5 h-3.5 mr-1" /> Add Contact
                </Button>
              </div>
            </div>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}
