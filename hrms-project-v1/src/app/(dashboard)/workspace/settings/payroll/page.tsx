"use client";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import axios from "axios";
import Link from "next/link";
import { 
  ArrowLeft, Briefcase, Plus, Percent, Receipt, Loader2, Calculator, Pencil 
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { 
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter 
} from "@/components/ui/dialog";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default function PayrollSettingsPage() {
  const queryClient = useQueryClient();
  const [isModalOpen, setIsModalOpen] = useState(false);
  
  // Track if we are editing an existing template
  const [editingId, setEditingId] = useState<string | null>(null);
  
  // Template Form State
  const defaultForm = {
    name: "",
    basicPercentOfCtc: 40,
    hraPercentOfCtc: 20,
    pfPercentOfBasic: 12,
    conveyanceFixed: 1600,
    isConveyancePercent: false,
    medicalFixed: 1250,
    isMedicalPercent: false,
    profTaxFixed: 200,
    isProfTaxPercent: false
  };
  const [form, setForm] = useState(defaultForm);

  const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000";
  const getToken = () => localStorage.getItem("hrms_token");

  // 1. Fetch Existing Templates
  const { data: templates, isLoading } = useQuery({
    queryKey: ["salaryTemplates"],
    queryFn: async () => {
      const res = await axios.get(`${API_URL}/payroll/templates`, {
        headers: { Authorization: `Bearer ${getToken()}` }
      });
      return res.data;
    }
  });

  // 2. Save Mutation (Handles both Create & Update)
  const saveMutation = useMutation({
    mutationFn: async (payload: typeof form) => {
      if (editingId) {
        // UPDATE existing
        await axios.patch(`${API_URL}/payroll/templates/${editingId}`, payload, {
          headers: { Authorization: `Bearer ${getToken()}` }
        });
      } else {
        // CREATE new
        await axios.post(`${API_URL}/payroll/templates`, payload, {
          headers: { Authorization: `Bearer ${getToken()}` }
        });
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["salaryTemplates"] });
      setIsModalOpen(false);
      setEditingId(null);
      setForm(defaultForm);
    },
    onError: (error: any) => {
      alert(error.response?.data?.message || "Failed to save template.");
    }
  });

  // Open Modal for New Template
  const handleOpenNew = () => {
    setEditingId(null);
    setForm(defaultForm);
    setIsModalOpen(true);
  };

  // Open Modal to Edit Template
  const handleOpenEdit = (template: any) => {
    setEditingId(template.id);
    setForm({
      name: template.name,
      basicPercentOfCtc: template.basicPercentOfCtc,
      hraPercentOfCtc: template.hraPercentOfCtc,
      pfPercentOfBasic: template.pfPercentOfBasic,
      conveyanceFixed: template.conveyanceFixed,
      isConveyancePercent: template.isConveyancePercent || false,
      medicalFixed: template.medicalFixed,
      isMedicalPercent: template.isMedicalPercent || false,
      profTaxFixed: template.profTaxFixed,
      isProfTaxPercent: template.isProfTaxPercent || false
    });
    setIsModalOpen(true);
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(amount);
  };

  return (
    <div className="min-h-screen max-w-6xl mx-auto space-y-6 bg-slate-50/50 p-4 font-sans sm:space-y-8 sm:p-6 lg:p-8">
      
      {/* HEADER */}
      <div className="flex flex-col gap-4 border-b border-slate-200 pb-6 sm:flex-row sm:items-end sm:justify-between">
        <div className="min-w-0">
          <Button asChild variant="ghost" size="sm" className="-ml-2 mb-2 text-slate-600">
            <Link href="/workspace/settings"><ArrowLeft className="mr-1 h-4 w-4" /> All settings</Link>
          </Button>
          <h1 className="flex text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl">
            <Calculator className="mr-3 h-7 w-7 shrink-0 text-indigo-600 sm:h-8 sm:w-8" />
            Payroll Settings
          </h1>
          <p className="text-slate-500 mt-1">Configure global salary templates and compensation rules.</p>
        </div>

        {/* CREATE TEMPLATE BUTTON */}
        <Button onClick={handleOpenNew} className="w-full bg-indigo-600 text-white shadow-sm hover:bg-indigo-700 sm:w-auto">
          <Plus className="w-4 h-4 mr-2" /> New Salary Template
        </Button>
      </div>

      {/* TEMPLATE MODAL (Used for both Create and Edit) */}
      <Dialog open={isModalOpen} onOpenChange={(open) => {
        if (!open) {
          setIsModalOpen(false);
          setEditingId(null);
        }
      }}>
        <DialogContent className="max-h-[90vh] w-[calc(100%-2rem)] overflow-y-auto bg-white sm:max-w-2xl">
          <DialogHeader>
            <DialogTitle>{editingId ? "Edit Salary Template" : "Create Salary Template"}</DialogTitle>
          </DialogHeader>
          <div className="space-y-6 py-4">
            <div className="space-y-2">
              <label className="text-sm font-medium text-slate-700">Template Name</label>
              <Input 
                placeholder="e.g., Software Engineer - Grade A" 
                value={form.name} 
                onChange={e => setForm({...form, name: e.target.value})}
                className="font-semibold text-lg"
              />
            </div>

            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 sm:gap-8">
              {/* PERCENTAGE RULES */}
              <div className="space-y-4">
                <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wider border-b pb-2">Dynamic Rules (% of CTC)</h4>
                
                <div className="space-y-2">
                  <label className="text-sm font-medium text-slate-700 flex justify-between">
                    <span>Basic Pay</span> <span className="text-slate-400">% of CTC</span>
                  </label>
                  <div className="relative">
                    <Percent className="w-4 h-4 absolute right-3 top-1/2 -translate-y-1/2 text-slate-400" />
                    <Input type="number" value={form.basicPercentOfCtc} onChange={e => setForm({...form, basicPercentOfCtc: Number(e.target.value)})} />
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium text-slate-700 flex justify-between">
                    <span>House Rent (HRA)</span> <span className="text-slate-400">% of CTC</span>
                  </label>
                  <div className="relative">
                    <Percent className="w-4 h-4 absolute right-3 top-1/2 -translate-y-1/2 text-slate-400" />
                    <Input type="number" value={form.hraPercentOfCtc} onChange={e => setForm({...form, hraPercentOfCtc: Number(e.target.value)})} />
                  </div>
                </div>

                <div className="space-y-2 pt-2 border-t border-slate-100">
                  <label className="text-sm font-medium text-slate-700 flex justify-between text-rose-600">
                    <span>Employer PF</span> <span className="text-slate-400">% of Basic</span>
                  </label>
                  <div className="relative">
                    <Percent className="w-4 h-4 absolute right-3 top-1/2 -translate-y-1/2 text-slate-400" />
                    <Input type="number" value={form.pfPercentOfBasic} onChange={e => setForm({...form, pfPercentOfBasic: Number(e.target.value)})} />
                  </div>
                </div>
              </div>

              {/* FIXED MONTHLY ALLOWANCES */}
              <div className="space-y-4">
                <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wider border-b pb-2">Fixed Monthly Components</h4>
                
                <div className="space-y-2">
                  <div className="flex justify-between items-center">
                    <label className="text-sm font-medium text-slate-700">Conveyance Allowance</label>
                    <select
                      value={form.isConveyancePercent ? "percent" : "fixed"}
                      onChange={e => setForm({...form, isConveyancePercent: e.target.value === "percent"})}
                      className="text-xs border rounded px-1.5 py-0.5 bg-slate-50 border-slate-200 outline-none"
                    >
                      <option value="fixed">₹ Fixed</option>
                      <option value="percent">% of CTC</option>
                    </select>
                  </div>
                  <div className="relative">
                    <span className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 text-xs font-bold">
                      {form.isConveyancePercent ? "%" : "₹"}
                    </span>
                    <Input type="number" value={form.conveyanceFixed} onChange={e => setForm({...form, conveyanceFixed: Number(e.target.value)})} />
                  </div>
                </div>

                <div className="space-y-2">
                  <div className="flex justify-between items-center">
                    <label className="text-sm font-medium text-slate-700">Medical Allowance</label>
                    <select
                      value={form.isMedicalPercent ? "percent" : "fixed"}
                      onChange={e => setForm({...form, isMedicalPercent: e.target.value === "percent"})}
                      className="text-xs border rounded px-1.5 py-0.5 bg-slate-50 border-slate-200 outline-none"
                    >
                      <option value="fixed">₹ Fixed</option>
                      <option value="percent">% of CTC</option>
                    </select>
                  </div>
                  <div className="relative">
                    <span className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 text-xs font-bold">
                      {form.isMedicalPercent ? "%" : "₹"}
                    </span>
                    <Input type="number" value={form.medicalFixed} onChange={e => setForm({...form, medicalFixed: Number(e.target.value)})} />
                  </div>
                </div>

                <div className="space-y-2 pt-2 border-t border-slate-100">
                  <div className="flex justify-between items-center">
                    <label className="text-sm font-medium text-slate-700 text-rose-600">Professional Tax</label>
                    <select
                      value={form.isProfTaxPercent ? "percent" : "fixed"}
                      onChange={e => setForm({...form, isProfTaxPercent: e.target.value === "percent"})}
                      className="text-xs border rounded px-1.5 py-0.5 bg-slate-50 border-slate-200 outline-none text-rose-600"
                    >
                      <option value="fixed">₹ Fixed</option>
                      <option value="percent">% of CTC</option>
                    </select>
                  </div>
                  <div className="relative">
                    <span className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 text-xs font-bold">
                      {form.isProfTaxPercent ? "%" : "₹"}
                    </span>
                    <Input type="number" value={form.profTaxFixed} onChange={e => setForm({...form, profTaxFixed: Number(e.target.value)})} />
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-amber-50 border border-amber-200 p-4 rounded-lg text-sm text-amber-800">
              <strong>Note:</strong> Special Allowance is automatically calculated at the time of assignment as the remaining balance to match the exact CTC.
            </div>

          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsModalOpen(false)}>Cancel</Button>
            <Button onClick={() => saveMutation.mutate(form)} disabled={!form.name || saveMutation.isPending} className="bg-indigo-600 hover:bg-indigo-700 text-white">
              {saveMutation.isPending ? "Saving..." : (editingId ? "Update Template" : "Save Template")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* TEMPLATE GRID */}
      {isLoading ? (
        <div className="flex justify-center p-12 text-indigo-500 animate-pulse"><Loader2 className="w-8 h-8 animate-spin" /></div>
      ) : templates?.length === 0 ? (
        <div className="text-center p-16 border-2 border-dashed border-slate-200 rounded-2xl bg-white text-slate-500">
          <Receipt className="w-12 h-12 mx-auto text-slate-300 mb-3" />
          <h3 className="text-lg font-bold text-slate-900 mb-1">No Templates Found</h3>
          <p className="text-sm">Create your first CTC template to automate salary assignments.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {templates?.map((template: any) => (
            <Card key={template.id} className="border-slate-200 shadow-sm hover:shadow-md transition-all">
              <CardHeader className="pb-3 border-b border-slate-100 bg-slate-50/50 rounded-t-xl flex flex-row items-start justify-between">
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center">
                    <Briefcase className="w-5 h-5" />
                  </div>
                  <div>
                    <CardTitle className="text-base font-bold text-slate-900 leading-tight">{template.name}</CardTitle>
                    <p className="text-xs text-slate-500 mt-0.5">CTC Driven Template</p>
                  </div>
                </div>
                {/* EDIT BUTTON */}
                <Button 
                  variant="ghost" 
                  size="icon" 
                  className="h-8 w-8 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 -mr-2"
                  onClick={() => handleOpenEdit(template)}
                >
                  <Pencil className="w-4 h-4" />
                </Button>
              </CardHeader>
              <CardContent className="pt-4 space-y-4">
                
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <p className="text-slate-500 text-xs uppercase font-semibold">Basic</p>
                    <p className="font-medium text-slate-900">{template.basicPercentOfCtc}% of CTC</p>
                  </div>
                  <div>
                    <p className="text-slate-500 text-xs uppercase font-semibold">HRA</p>
                    <p className="font-medium text-slate-900">{template.hraPercentOfCtc}% of CTC</p>
                  </div>
                  <div>
                    <p className="text-rose-500 text-xs uppercase font-semibold">PF Deduction</p>
                    <p className="font-medium text-slate-900">{template.pfPercentOfBasic}% of Basic</p>
                  </div>
                  <div>
                    <p className="text-slate-500 text-xs uppercase font-semibold">Special Allow.</p>
                    <p className="font-medium text-slate-900 text-xs">Auto (Balance)</p>
                  </div>
                </div>

                <div className="pt-4 border-t border-slate-100">
                  <p className="text-slate-500 text-xs uppercase font-semibold mb-2">Fixed Monthly Components</p>
                  <div className="flex justify-between text-sm">
                    <span className="text-slate-600">Conveyance:</span>
                    <span className="font-medium text-slate-900">
                      {template.isConveyancePercent ? `${template.conveyanceFixed}% of CTC` : formatCurrency(template.conveyanceFixed)}
                    </span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-slate-600">Medical:</span>
                    <span className="font-medium text-slate-900">
                      {template.isMedicalPercent ? `${template.medicalFixed}% of CTC` : formatCurrency(template.medicalFixed)}
                    </span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-rose-600">Prof. Tax:</span>
                    <span className="font-medium text-rose-600">
                      {template.isProfTaxPercent ? `-${template.profTaxFixed}% of CTC` : `-${formatCurrency(template.profTaxFixed)}`}
                    </span>
                  </div>
                </div>

              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}