// src/components/wizard/Step9Branches.tsx
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
import { MapPin } from "lucide-react";

const step9Schema = z.object({
  branches: z.array(z.string()).min(1, "Select at least one branch location to continue"),
});

const DEFAULT_BRANCHES = [
  "Head Office", 
  "Delhi", 
  "Mumbai", 
  "Bangalore", 
  "Hyderabad",
  "Pune",
  "Remote"
];

export default function Step9Branches() {
  const { formData, updateFormData, nextStep } = useSetupWizardStore();

  const form = useForm<z.infer<typeof step9Schema>>({
    resolver: zodResolver(step9Schema),
    defaultValues: {
      branches: formData.branches || [],
    },
  });

  function onSubmit(values: z.infer<typeof step9Schema>) {
    updateFormData(values);
    nextStep();
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        
        <FormField
          control={form.control}
          name="branches"
          render={() => (
            <FormItem>
              <div className="mb-4">
                <FormLabel className="text-base text-slate-900">Office Locations</FormLabel>
                <p className="text-sm text-slate-500">Select the standard locations where your employees operate.</p>
              </div>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                {DEFAULT_BRANCHES.map((branch) => (
                  <FormField
                    key={branch}
                    control={form.control}
                    name="branches"
                    render={({ field }) => {
                      const isChecked = field.value?.includes(branch);
                      return (
                        <FormItem
                          key={branch}
                          className={`flex flex-row items-center space-x-3 space-y-0 p-4 border rounded-xl cursor-pointer transition-colors ${
                            isChecked ? "border-emerald-500 bg-emerald-50" : "border-slate-200 bg-white hover:border-emerald-200"
                          }`}
                        >
                          <FormControl>
                            <input
                              type="checkbox"
                              className="h-4 w-4 rounded border-slate-300 text-emerald-600 focus:ring-emerald-500 cursor-pointer"
                              checked={isChecked}
                              onChange={(e) => {
                                return e.target.checked
                                  ? field.onChange([...field.value, branch])
                                  : field.onChange(
                                      field.value?.filter((value) => value !== branch)
                                    )
                              }}
                            />
                          </FormControl>
                          <div className="flex items-center space-x-2">
                            <MapPin className={`h-4 w-4 ${isChecked ? "text-emerald-600" : "text-slate-400"}`} />
                            <FormLabel className="font-medium text-slate-900 cursor-pointer mb-0">
                              {branch}
                            </FormLabel>
                          </div>
                        </FormItem>
                      )
                    }}
                  />
                ))}
              </div>
              <FormMessage />
            </FormItem>
          )}
        />

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