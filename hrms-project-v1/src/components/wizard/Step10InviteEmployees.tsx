// src/components/wizard/Step10InviteEmployees.tsx
"use client";

import { useState } from "react"; // ADDED
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
import { Textarea } from "@/components/ui/textarea";
import { Mail, Upload, FileSpreadsheet, Loader2 } from "lucide-react"; // ADDED Loader2
import { useRouter } from "next/navigation";
import axios from "axios"; // ADDED

const step10Schema = z.object({
  inviteEmails: z.string().optional(),
});

export default function Step10InviteEmployees() {
  const { formData, updateFormData } = useSetupWizardStore();
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false); // ADDED

  const form = useForm<z.infer<typeof step10Schema>>({
    resolver: zodResolver(step10Schema),
    defaultValues: {
      inviteEmails: formData.inviteEmails || "",
    },
  });

  // THE REAL API CALL
  async function onSubmit(values: z.infer<typeof step10Schema>) {
    setIsSubmitting(true);
    updateFormData(values);
    
    // Combine EVERYTHING from Zustand and this final step
    const finalPayload = { ...formData, ...values };
    
    try {
      // 1. Send the massive payload to NestJS
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000";
      const response = await axios.post(`${apiUrl}/auth/register`, finalPayload);
      
      // 2. Save the JWT token to local storage so the user is logged in
      localStorage.setItem('hrms_token', response.data.access_token);
      
      console.log("Success! Backend Response:", response.data);

      // 3. Send them to their new dashboard!
      router.push("/workspace/dashboard");
    } catch (error: any) {
      console.error("Registration failed:", error.response?.data || error.message);
      alert(error.response?.data?.message || "Registration failed. Check the console.");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          
          <div className="space-y-4 p-6 bg-white border border-slate-200 rounded-xl shadow-sm">
            <div className="flex items-center space-x-2 text-emerald-600 mb-2">
              <Mail className="h-5 w-5" />
              <h3 className="font-bold text-slate-900">Invite via Email</h3>
            </div>
            <p className="text-sm text-slate-500">Enter email addresses separated by commas. We will send them a secure link to join your workspace.</p>
            
            <FormField
              control={form.control}
              name="inviteEmails"
              render={({ field }) => (
                <FormItem>
                  <FormControl>
                    <Textarea 
                      placeholder="john@acmecorp.com, sarah@acmecorp.com..." 
                      className="min-h-[120px] resize-none"
                      {...field} 
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>

          <div className="space-y-4 p-6 bg-slate-50 border border-slate-200 rounded-xl border-dashed flex flex-col justify-center items-center text-center">
            <h3 className="font-bold text-slate-900">Bulk Upload</h3>
            <p className="text-sm text-slate-500 mb-4">Have a large team? Upload your employee directory instantly.</p>
            
            <div className="space-y-3 w-full">
              <Button type="button" variant="outline" className="w-full bg-white">
                <FileSpreadsheet className="mr-2 h-4 w-4 text-emerald-600" />
                Upload Excel File
              </Button>
              <Button type="button" variant="outline" className="w-full bg-white">
                <Upload className="mr-2 h-4 w-4 text-slate-600" />
                Upload CSV File
              </Button>
            </div>
            <p className="text-xs text-slate-400 mt-2 hover:underline cursor-pointer">Download sample template</p>
          </div>

        </div>

        {/* FINAL SUBMIT BUTTON WITH LOADING STATE */}
        <div className="pt-6 flex justify-end border-t border-slate-100 space-x-3">
          <Button 
            type="button"
            variant="outline"
            size="lg"
            disabled={isSubmitting}
            onClick={() => onSubmit({ inviteEmails: "" })}
            className="border-slate-200 text-slate-500 hover:bg-slate-50 font-bold px-8"
          >
            {isSubmitting ? (
              <>
                <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                Skipping...
              </>
            ) : (
              "Skip & Launch Workspace"
            )}
          </Button>
          <Button 
            size="lg" 
            type="submit" 
            disabled={isSubmitting}
            className="bg-emerald-500 hover:bg-emerald-600 text-white font-bold px-8"
          >
            {isSubmitting ? (
              <>
                <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                Creating Workspace...
              </>
            ) : (
              "Complete Setup & Launch Workspace"
            )}
          </Button>
        </div>
      </form>
    </Form>
  );
}