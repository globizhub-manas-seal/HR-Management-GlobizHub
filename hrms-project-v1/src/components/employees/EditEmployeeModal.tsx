"use client";

import axios from "axios";
import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Loader2, Pencil } from "lucide-react";
import { Button } from "@/components/ui/button";
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
});

type EmployeeForEdit = z.infer<typeof employeeSchema> & { id: string };

export function EditEmployeeModal({ employee }: { employee: EmployeeForEdit }) {
  const [open, setOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const form = useForm<z.infer<typeof employeeSchema>>({
    resolver: zodResolver(employeeSchema),
    defaultValues: employee,
  });

  useEffect(() => {
    if (open) form.reset(employee);
  }, [employee, form, open]);

  async function onSubmit(values: z.infer<typeof employeeSchema>) {
    setIsSubmitting(true);
    try {
      const token = localStorage.getItem("hrms_token");
      await axios.patch(
        `${process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000"}/employees/${employee.id}`,
        values,
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

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger render={<Button variant="ghost" className="text-emerald-600 hover:text-emerald-700" />}>
        <Pencil className="size-4" /> Edit
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Edit employee</DialogTitle>
          <DialogDescription>Update this employee&apos;s directory information and system role.</DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 pt-4">
            <div className="grid grid-cols-2 gap-4">
              <FormField control={form.control} name="firstName" render={({ field }) => (
                <FormItem><FormLabel>First Name</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>
              )} />
              <FormField control={form.control} name="lastName" render={({ field }) => (
                <FormItem><FormLabel>Last Name</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>
              )} />
            </div>
            <FormField control={form.control} name="email" render={({ field }) => (
              <FormItem><FormLabel>Work Email</FormLabel><FormControl><Input type="email" {...field} /></FormControl><FormMessage /></FormItem>
            )} />
            <FormField control={form.control} name="role" render={({ field }) => (
              <FormItem><FormLabel>System Role</FormLabel><Select value={field.value} onValueChange={field.onChange}>
                <FormControl><SelectTrigger><SelectValue placeholder="Select a role" /></SelectTrigger></FormControl>
                <SelectContent>
                  <SelectItem value="SUPER_ADMIN">Super Admin</SelectItem>
                  <SelectItem value="HR_HEAD">HR Admin</SelectItem>
                  <SelectItem value="OWNER">Owner</SelectItem>
                  <SelectItem value="MANAGER">Manager</SelectItem>
                  <SelectItem value="EMPLOYEE">Standard Employee</SelectItem>
                </SelectContent>
              </Select><FormMessage /></FormItem>
            )} />
            <div className="flex justify-end pt-4">
              <Button type="submit" disabled={isSubmitting} className="bg-emerald-500 hover:bg-emerald-600 text-white">
                {isSubmitting ? <><Loader2 className="mr-2 size-4 animate-spin" />Saving...</> : "Save changes"}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
