"use client";

import React, { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import axios from "axios";
import { Plus, Trash2, ShieldAlert, GraduationCap, Briefcase, LogOut, Loader2 } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

function EmployeeLifecycleManager({ employeeId }: { employeeId: string }) {
  const queryClient = useQueryClient();
  
  // Local state for the forms
  const [skillForm, setSkillForm] = useState({ name: "", proficiencyLevel: "INTERMEDIATE" });
  const [contactForm, setContactForm] = useState({ name: "", relationship: "", phone: "" });

  // Query: Fetch employee details including skills and contacts
  const { data: fullEmployee, isLoading: isLoadingEmployee, refetch } = useQuery({
    queryKey: ["employeeDetails", employeeId],
    queryFn: async () => {
      const token = localStorage.getItem("hrms_token");
      const res = await axios.get(
        `${process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000"}/employees/${employeeId}`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      return res.data;
    },
  });

  // Mutation: Add Skill
  const addSkillMutation = useMutation({
    mutationFn: async (data: any) => {
      const token = localStorage.getItem("hrms_token");
      await axios.post(`${process.env.NEXT_PUBLIC_API_URL}/employees/${employeeId}/skills`, data, {
        headers: { Authorization: `Bearer ${token}` }
      });
    },
    onSuccess: () => {
      refetch();
      setSkillForm({ name: "", proficiencyLevel: "INTERMEDIATE" });
      queryClient.invalidateQueries({ queryKey: ["employeeDetails", employeeId] });
      alert("Skill added successfully!");
    },
  });

  // Mutation: Delete Skill
  const deleteSkillMutation = useMutation({
    mutationFn: async (skillId: string) => {
      const token = localStorage.getItem("hrms_token");
      await axios.delete(`${process.env.NEXT_PUBLIC_API_URL}/employees/${employeeId}/skills/${skillId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
    },
    onSuccess: () => {
      refetch();
      queryClient.invalidateQueries({ queryKey: ["employeeDetails", employeeId] });
      alert("Skill deleted successfully!");
    },
  });

  // Mutation: Add Emergency Contact
  const addContactMutation = useMutation({
    mutationFn: async (data: any) => {
      const token = localStorage.getItem("hrms_token");
      await axios.post(`${process.env.NEXT_PUBLIC_API_URL}/employees/${employeeId}/emergency-contacts`, data, {
        headers: { Authorization: `Bearer ${token}` }
      });
    },
    onSuccess: () => {
      refetch();
      setContactForm({ name: "", relationship: "", phone: "" });
      queryClient.invalidateQueries({ queryKey: ["employeeDetails", employeeId] });
      alert("Emergency contact added!");
    },
  });

  // Mutation: Delete Emergency Contact
  const deleteContactMutation = useMutation({
    mutationFn: async (contactId: string) => {
      const token = localStorage.getItem("hrms_token");
      await axios.delete(`${process.env.NEXT_PUBLIC_API_URL}/employees/${employeeId}/emergency-contacts/${contactId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
    },
    onSuccess: () => {
      refetch();
      queryClient.invalidateQueries({ queryKey: ["employeeDetails", employeeId] });
      alert("Emergency contact removed!");
    },
  });

  return (
    <div className="w-full space-y-6 mt-8">
      <Tabs defaultValue="skills" className="w-full">
        <TabsList className="grid w-full grid-cols-4 h-12 bg-slate-100">
          <TabsTrigger value="skills"><GraduationCap className="w-4 h-4 mr-2" /> Skills</TabsTrigger>
          <TabsTrigger value="contacts"><ShieldAlert className="w-4 h-4 mr-2" /> Emergency</TabsTrigger>
          <TabsTrigger value="history"><Briefcase className="w-4 h-4 mr-2" /> History</TabsTrigger>
          <TabsTrigger value="exit" className="text-rose-600 data-[state=active]:text-rose-700"><LogOut className="w-4 h-4 mr-2" /> Offboarding</TabsTrigger>
        </TabsList>

        {/* SKILLS TAB */}
        <TabsContent value="skills" className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle>Skills & Certifications</CardTitle>
              <CardDescription>Track employee competencies for future role matching.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* List of current skills */}
              <div className="space-y-2 border rounded-lg p-4 bg-slate-50/50">
                <h4 className="text-sm font-semibold text-slate-800">Current Skills</h4>
                {isLoadingEmployee ? (
                  <div className="flex justify-center py-4"><Loader2 className="h-5 w-5 animate-spin text-emerald-500" /></div>
                ) : !fullEmployee?.skills?.length ? (
                  <p className="text-xs text-slate-500 py-4 text-center">No skills added yet.</p>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                    {fullEmployee.skills.map((skill: any) => (
                      <div key={skill.id} className="flex justify-between items-center bg-white p-3 rounded-lg border text-sm shadow-sm">
                        <div>
                          <span className="font-semibold text-slate-800">{skill.name}</span>
                          <span className="ml-2 px-2 py-0.5 rounded-full bg-slate-100 text-slate-600 font-medium capitalize text-xs">
                            {skill.proficiencyLevel.toLowerCase()}
                          </span>
                        </div>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-8 w-8 p-0 text-red-500 hover:text-red-700 hover:bg-red-50"
                          onClick={() => deleteSkillMutation.mutate(skill.id)}
                          disabled={deleteSkillMutation.isPending}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Form to add skill */}
              <div className="flex gap-4 items-end bg-slate-50 p-4 rounded-lg border">
                <div className="flex-1 space-y-2">
                  <label className="text-sm font-medium">Skill / Certification Name</label>
                  <Input 
                    placeholder="e.g. React.js, AWS Certified" 
                    value={skillForm.name} 
                    onChange={(e) => setSkillForm({...skillForm, name: e.target.value})} 
                  />
                </div>
                <div className="w-48 space-y-2">
                  <label className="text-sm font-medium">Proficiency</label>
                  <select 
                    className="w-full border-slate-200 rounded-md p-2 text-sm bg-white border h-10"
                    value={skillForm.proficiencyLevel}
                    onChange={(e) => setSkillForm({...skillForm, proficiencyLevel: e.target.value})}
                  >
                    <option value="BEGINNER">Beginner</option>
                    <option value="INTERMEDIATE">Intermediate</option>
                    <option value="ADVANCED">Advanced</option>
                    <option value="EXPERT">Expert</option>
                  </select>
                </div>
                <Button 
                  onClick={() => addSkillMutation.mutate(skillForm)}
                  disabled={!skillForm.name || addSkillMutation.isPending}
                  className="bg-emerald-600 hover:bg-emerald-700 text-white h-10"
                >
                  <Plus className="w-4 h-4 mr-2" /> Add Skill
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* EMERGENCY CONTACTS TAB */}
        <TabsContent value="contacts" className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle>Emergency Contacts</CardTitle>
              <CardDescription>Who to contact in case of a medical emergency.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* List of current emergency contacts */}
              <div className="space-y-2 border rounded-lg p-4 bg-slate-50/50">
                <h4 className="text-sm font-semibold text-slate-800">Current Emergency Contacts</h4>
                {isLoadingEmployee ? (
                  <div className="flex justify-center py-4"><Loader2 className="h-5 w-5 animate-spin text-emerald-500" /></div>
                ) : !fullEmployee?.emergencyContacts?.length ? (
                  <p className="text-xs text-slate-500 py-4 text-center">No emergency contacts added yet.</p>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                    {fullEmployee.emergencyContacts.map((contact: any) => (
                      <div key={contact.id} className="flex justify-between items-center bg-white p-3 rounded-lg border text-sm shadow-sm">
                        <div>
                          <span className="font-semibold text-slate-800">{contact.name}</span>
                          <span className="text-slate-400 mx-1">({contact.relationship})</span>
                          <span className="text-slate-500 font-mono ml-2">{contact.phone}</span>
                        </div>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-8 w-8 p-0 text-red-500 hover:text-red-700 hover:bg-red-50"
                          onClick={() => deleteContactMutation.mutate(contact.id)}
                          disabled={deleteContactMutation.isPending}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Form to add emergency contact */}
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4 items-end bg-slate-50 p-4 rounded-lg border">
                <div className="space-y-2">
                  <label className="text-sm font-medium">Full Name</label>
                  <Input 
                    placeholder="Jane Doe" 
                    value={contactForm.name} 
                    onChange={(e) => setContactForm({...contactForm, name: e.target.value})} 
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">Relationship</label>
                  <Input 
                    placeholder="e.g. Spouse, Parent" 
                    value={contactForm.relationship} 
                    onChange={(e) => setContactForm({...contactForm, relationship: e.target.value})} 
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">Phone Number</label>
                  <Input 
                    placeholder="+1 555-0123" 
                    value={contactForm.phone} 
                    onChange={(e) => setContactForm({...contactForm, phone: e.target.value})} 
                  />
                </div>
                <Button 
                  onClick={() => addContactMutation.mutate(contactForm)}
                  disabled={!contactForm.name || !contactForm.phone || addContactMutation.isPending}
                  className="bg-emerald-600 hover:bg-emerald-700 text-white w-full h-10"
                >
                  <Plus className="w-4 h-4 mr-2" /> Add Contact
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* OFFBOARDING / EXIT TAB */}
        <TabsContent value="exit" className="mt-6">
          <Card className="border-rose-100 shadow-sm">
            <CardHeader className="bg-rose-50/50 border-b border-rose-100">
              <CardTitle className="text-rose-700">Initiate Offboarding</CardTitle>
              <CardDescription>Mark this employee as exiting the company.</CardDescription>
            </CardHeader>
            <CardContent className="pt-6 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium text-slate-700">Exit Date</label>
                  <Input type="date" />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium text-slate-700">Reason</label>
                  <select className="w-full border-slate-200 rounded-md p-2 text-sm bg-white border">
                    <option value="RESIGNED">Resigned</option>
                    <option value="TERMINATED">Terminated</option>
                    <option value="RETIRED">Retired</option>
                  </select>
                </div>
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium text-slate-700">HR Interview Notes (Optional)</label>
                <textarea className="w-full border-slate-200 rounded-md p-3 text-sm border min-h-[100px]" placeholder="Enter any notes from the exit interview..."></textarea>
              </div>
              <Button variant="destructive" className="w-full">Process Exit & Revoke Access</Button>
            </CardContent>
          </Card>
        </TabsContent>

      </Tabs>
    </div>
  );
}

export default function EmployeeLifecyclePage({ params }: { params: Promise<{ id: string }> }) {
  const { id: employeeId } = React.use(params);
  return (
    <div className="p-8 max-w-5xl mx-auto">
      <div>
        <h1 className="text-3xl font-bold text-slate-900">Employee Lifecycle</h1>
        <p className="text-slate-500 mt-1">Manage employee offboarding, skills, emergency contacts, and history.</p>
      </div>
      <EmployeeLifecycleManager employeeId={employeeId} />
    </div>
  );
}