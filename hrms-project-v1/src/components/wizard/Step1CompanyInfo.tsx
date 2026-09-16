// src/components/wizard/Step1CompanyInfo.tsx
"use client";

import { useState } from "react";
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
import { Eye, EyeOff } from "lucide-react";
import api from "@/lib/api";

// 1. Define the validation rules for Step 1
const step1Schema = z.object({
  companyName: z.string().min(2, "Company Name is required"),
  industry: z.string().min(2, "Industry is required"),
  companySize: z.string().min(1, "Company size is required (e.g., 1-50)"),
  email: z.string().email("Invalid company email address"),
  phone: z.string().min(10, "Valid phone number required"),
  website: z.string().url("Must be a valid URL").optional().or(z.literal("")),
  adminFirstName: z.string().min(2, "Admin first name is required"),
  adminLastName: z.string().min(2, "Admin last name is required"),
  adminEmail: z.string().email("Invalid admin email address"),
  adminPhone: z.string().min(10, "Valid admin phone required"),
  adminPassword: z.string().min(6, "Password must be at least 6 characters"),
  confirmPassword: z.string().min(1, "Please retype your password"),
}).refine((data) => data.adminPassword === data.confirmPassword, {
  message: "Passwords do not match",
  path: ["confirmPassword"],
});

export default function Step1CompanyInfo() {
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isCheckingEmail, setIsCheckingEmail] = useState(false);
  
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
      adminFirstName: formData.adminFirstName || "",
      adminLastName: formData.adminLastName || "",
      adminEmail: formData.adminEmail || "",
      adminPhone: formData.adminPhone || "",
      adminPassword: formData.adminPassword || "",
      confirmPassword: "",
    },
  });

  // 4. When the user hits "Next", save to Zustand and move to Step 2
  async function onSubmit(values: z.infer<typeof step1Schema>) {
    setIsCheckingEmail(true);
    form.clearErrors("adminEmail");

    try {
      const response = await api.post("/auth/check-registration-email", {
        email: values.adminEmail,
      });

      if (!response.data.available) {
        form.setError("adminEmail", {
          type: "manual",
          message: "An account already exists with this email",
        });
        return;
      }

      const { confirmPassword: _confirmPassword, ...step1Data } = values;
      updateFormData(step1Data);
      nextStep();
    } catch {
      form.setError("adminEmail", {
        type: "manual",
        message: "Unable to verify this email. Please try again.",
      });
    } finally {
      setIsCheckingEmail(false);
    }
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
              name="adminFirstName"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Admin First Name</FormLabel>
                  <FormControl>
                    <Input placeholder="Alex" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="adminLastName"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Admin Last Name</FormLabel>
                  <FormControl>
                    <Input placeholder="Morgan" {...field} />
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
            <FormField
              control={form.control}
              name="adminPassword"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Admin Password</FormLabel>
                  <FormControl>
                    <div className="relative">
                      <Input
                        type={showPassword ? "text" : "password"}
                        placeholder="••••••••"
                        {...field}
                      />
                      <button
                        type="button"
                        className="absolute right-3 top-2.5 text-slate-500 hover:text-slate-700"
                        onClick={() => setShowPassword(!showPassword)}
                      >
                        {showPassword ? (
                          <EyeOff className="h-5 w-5" />
                        ) : (
                          <Eye className="h-5 w-5" />
                        )}
                      </button>
                    </div>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="confirmPassword"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Retype Admin Password</FormLabel>
                  <FormControl>
                    <div className="relative">
                      <Input
                        type={showConfirmPassword ? "text" : "password"}
                        placeholder="••••••••"
                        autoComplete="new-password"
                        {...field}
                      />
                      <button
                        type="button"
                        className="absolute right-3 top-2.5 text-slate-500 hover:text-slate-700"
                        onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                      >
                        {showConfirmPassword ? (
                          <EyeOff className="h-5 w-5" />
                        ) : (
                          <Eye className="h-5 w-5" />
                        )}
                      </button>
                    </div>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>
        </div>

        {/* SUBMIT BUTTON */}
        <div className="pt-6 flex justify-end">
          <Button type="submit" disabled={isCheckingEmail} className="bg-emerald-500 hover:bg-emerald-600 text-white">
            {isCheckingEmail ? "Checking…" : "Next Step"}
          </Button>
        </div>
      </form>
    </Form>
  );
}
