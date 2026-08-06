// src/components/wizard/Step1CompanyInfo.tsx
"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { useSetupWizardStore } from "@/store/useSetupWizardStore";
import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";

// 1. Define the validation rules for Step 1
const step1Schema = z.object({
  companyName: z.string().min(2, "Company Name is required"),
  industry: z.string().min(2, "Industry is required"),
  companySize: z.string().min(1, "Company size is required (e.g., 1-50)"),
  email: z.string().email("Invalid company email address"),
  phone: z.string().min(10, "Valid phone number required"),
  website: z.string().url("Must be a valid URL").optional().or(z.literal("")),
  adminFullName: z.string().min(2, "Admin full name is required"),
  adminEmail: z.string().email("Invalid admin email address"),
  adminPhone: z.string().min(10, "Valid admin phone required"),
});

export default function Step1CompanyInfo() {
  // 2. Connect to our Zustand memory bank
  const { formData, updateFormData, nextStep } = useSetupWizardStore();

  // 3. Initialize the form with data from Zustand (so it remembers inputs if the user clicks "Back")
  const form = useForm<z.infer<typeof step1Schema>>({
    resolver: zodResolver(step1Schema),
    defaultValues: {
      companyName: formData.companyName || "",
      industry: formData.industry || "",
      companySize: formData.companySize || "",
      email: formData.email || "",
      phone: formData.phone || "",
      website: formData.website || "",
      adminFullName: formData.adminFullName || "",
      adminEmail: formData.adminEmail || "",
      adminPhone: formData.adminPhone || "",
    },
  });

  // 4. When the user hits "Next", save to Zustand and move to Step 2
  function onSubmit(values: z.infer<typeof step1Schema>) {
    updateFormData(values);
    nextStep();
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        
        {/* COMPANY DETAILS SECTION */}
        <div>
          <h3 className="text-lg font-semibold text-slate-900 mb-4 border-b pb-2">Company Details</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <FormField
              control={form.control}
              name="companyName"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Company Name</FormLabel>
                  <FormControl>
                    <Input placeholder="Acme Corp" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="industry"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Industry</FormLabel>
                  <FormControl>
                    <Input placeholder="Technology" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="email"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Company Email</FormLabel>
                  <FormControl>
                    <Input placeholder="hello@acmecorp.com" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="phone"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Company Phone</FormLabel>
                  <FormControl>
                    <Input placeholder="+1 555 123 4567" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="website"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Website (Optional)</FormLabel>
                  <FormControl>
                    <Input placeholder="https://acmecorp.com" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
             <FormField
              control={form.control}
              name="companySize"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Company Size</FormLabel>
                  <FormControl>
                    <Input placeholder="10-50" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>
        </div>

        {/* ADMIN DETAILS SECTION */}
        <div className="pt-4">
          <h3 className="text-lg font-semibold text-slate-900 mb-4 border-b pb-2">Administrator Details</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <FormField
              control={form.control}
              name="adminFullName"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Admin Full Name</FormLabel>
                  <FormControl>
                    <Input placeholder="Alex Morgan" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="adminEmail"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Admin Email (Login ID)</FormLabel>
                  <FormControl>
                    <Input placeholder="alex@acmecorp.com" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="adminPhone"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Admin Phone</FormLabel>
                  <FormControl>
                    <Input placeholder="+1 555 987 6543" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>
        </div>

        {/* SUBMIT BUTTON */}
        <div className="pt-6 flex justify-end">
          <Button type="submit" className="bg-emerald-500 hover:bg-emerald-600 text-white">
            Next Step
          </Button>
        </div>
      </form>
    </Form>
  );
}