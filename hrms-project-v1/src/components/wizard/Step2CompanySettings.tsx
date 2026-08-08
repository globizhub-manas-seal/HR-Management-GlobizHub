// src/components/wizard/Step2CompanySettings.tsx
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

const step2Schema = z.object({
  themeColor: z.string().min(4, "Theme color is required"),
  shiftStartTime: z.string().min(1, "Start time is required"),
  shiftEndTime: z.string().min(1, "End time is required"),
  attendanceMethod: z.string().min(1, "Attendance method is required"),
  workDays: z.array(z.string()).min(1, "Select at least one working day"),
});

const DAYS_OF_WEEK = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];
const ATTENDANCE_METHODS = ["MANUAL", "GPS", "QR", "FACE_RECOGNITION", "BIOMETRIC", "RFID"];

export default function Step2CompanySettings() {
  const { formData, updateFormData, nextStep, prevStep } = useSetupWizardStore();

  const form = useForm<z.infer<typeof step2Schema>>({
    resolver: zodResolver(step2Schema),
    defaultValues: {
      themeColor: formData.themeColor,
      shiftStartTime: formData.shiftStartTime,
      shiftEndTime: formData.shiftEndTime,
      attendanceMethod: formData.attendanceMethod,
      workDays: formData.workDays,
    },
  });

  function onSubmit(values: z.infer<typeof step2Schema>) {
    updateFormData(values);
    nextStep();
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* THEME COLOR */}
          <FormField
            control={form.control}
            name="themeColor"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Brand Theme Color</FormLabel>
                <FormControl>
                  <div className="flex items-center space-x-2">
                    <Input type="color" className="w-16 h-10 p-1" {...field} />
                    <span className="text-sm text-slate-500 font-mono">{field.value}</span>
                  </div>
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          {/* ATTENDANCE METHOD */}
          <FormField
            control={form.control}
            name="attendanceMethod"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Default Attendance Method</FormLabel>
                <FormControl>
                  <select 
                    {...field} 
                    className="flex h-10 w-full rounded-md border border-slate-200 bg-white px-3 py-2 text-sm ring-offset-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500"
                  >
                    {ATTENDANCE_METHODS.map((method) => (
                      <option key={method} value={method}>
                        {method.replace("_", " ")}
                      </option>
                    ))}
                  </select>
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          {/* SHIFT TIMINGS */}
          <FormField
            control={form.control}
            name="shiftStartTime"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Standard Shift Start Time</FormLabel>
                <FormControl>
                  <Input type="time" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="shiftEndTime"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Standard Shift End Time</FormLabel>
                <FormControl>
                  <Input type="time" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

       {/* WORKING DAYS MULTI-SELECT */}
        <div className="pt-4 border-t">
          <FormField
            control={form.control}
            name="workDays"
            render={() => (
              <FormItem>
                <div className="mb-4">
                  <FormLabel className="text-base text-slate-900">Working Days</FormLabel>
                  <p className="text-sm text-slate-500">Select the standard working days for your organization.</p>
                </div>
                <div className="flex flex-wrap gap-3">
                  {DAYS_OF_WEEK.map((day) => (
                    <FormField
                      key={day}
                      control={form.control}
                      name="workDays"
                      render={({ field }) => {
                        return (
                          <FormItem
                            key={day}
                            className="flex flex-row items-start space-x-2 space-y-0"
                          >
                            <FormControl>
                              <input
                                type="checkbox"
                                className="h-4 w-4 rounded border-slate-300 text-emerald-600 focus:ring-emerald-500"
                                checked={field.value?.includes(day)}
                                onChange={(e) => {
                                  return e.target.checked
                                    ? field.onChange([...field.value, day])
                                    : field.onChange(
                                        field.value?.filter((value) => value !== day)
                                      )
                                }}
                              />
                            </FormControl>
                            <FormLabel className="font-normal text-slate-700 cursor-pointer">
                              {day}
                            </FormLabel>
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