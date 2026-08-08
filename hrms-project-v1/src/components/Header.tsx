"use client";

import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import axios from "axios";
import { useRouter, usePathname } from "next/navigation";
import {
  Search,
  Bell,
  LogOut,
  Loader2,
  User,
  Shield,
  Menu,
} from "lucide-react";

import { Input } from "@/components/ui/input";
import { Button, buttonVariants } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Sheet, SheetContent, SheetTrigger } from "./ui/sheet";
import Sidebar from "./Sidebar";

export default function Header() {
  const router = useRouter();
  const pathname = usePathname();
  const queryClient = useQueryClient();

  const [open, setOpen] = useState(false);
  const [prevPathname, setPrevPathname] = useState(pathname);

  if (pathname !== prevPathname) {
    setPrevPathname(pathname);
    setOpen(false);
  }

  const { data: user, isLoading } = useQuery({
    queryKey: ["userProfile"],
    queryFn: async () => {
      const token = localStorage.getItem("hrms_token");

      const res = await axios.get(
        `${process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000"}/auth/me`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        },
      );

      return res.data;
    },
  });

  const handleLogout = () => {
    localStorage.removeItem("hrms_token");
    queryClient.clear();
    router.push("/login");
  };

  const getInitials = (firstName?: string, lastName?: string) => {
    if (!firstName) return "U";

    return `${firstName.charAt(0)}${lastName?.charAt(0) || ""}`.toUpperCase();
  };

  const formatBreadcrumb = () => {
    const paths = pathname.split("/").filter(Boolean);

    if (paths.length < 2) return "Dashboard";

    const current = paths[paths.length - 1];

    return current
      .split("-")
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
      .join(" ");
  };

  return (
    <header className="flex items-center justify-between h-16 px-6 bg-white border-b border-slate-200">
      <div className="flex items-center space-x-4">
        {/* Mobile Hamburger */}
        <Sheet open={open} onOpenChange={setOpen}>
          <SheetTrigger className="md:hidden p-2 hover:bg-slate-100 rounded-md">
            <Menu className="h-5 w-5" />
          </SheetTrigger>
          <SheetContent side="left" className="p-0 w-64 data-[side=left]:w-64 data-[side=left]:sm:max-w-64">
            <Sidebar role={user?.role} className="flex h-full" />
          </SheetContent>
        </Sheet>

        {/* Breadcrumb */}
        <div className="hidden md:flex text-sm font-medium text-slate-500">
          <span className="text-slate-400">Workspace</span>
          <span className="mx-2">/</span>
          <span className="text-slate-900">{formatBreadcrumb()}</span>
        </div>
      </div>

      {/* Right Side */}
      <div className="flex items-center space-x-4 lg:space-x-6">
        {/* Search */}
        <div className="hidden md:flex relative w-72">
          <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />

          <Input
            placeholder="Search employees... (Ctrl + K)"
            className="pl-10 rounded-full bg-slate-50 border-slate-200 focus-visible:ring-emerald-500"
          />
        </div>

        {/* Notification */}
        <Button
          variant="ghost"
          size="icon"
          className="relative text-slate-500 hover:text-slate-900"
        >
          <Bell className="h-5 w-5" />

          <span className="absolute top-1.5 right-1.5 h-2 w-2 rounded-full bg-rose-500 border-2 border-white" />
        </Button>

        {/* Profile */}
        <DropdownMenu>
         <DropdownMenuTrigger 
            className={buttonVariants({ 
              variant: "ghost", 
              className: "flex items-center gap-2 hover:bg-transparent cursor-pointer border-0 outline-none" 
            })}
          >
            {isLoading ? (
              <Loader2 className="h-5 w-5 animate-spin text-slate-400" />
            ) : (
              <>
                <div className="hidden lg:flex flex-col items-end">
                  <span className="text-sm font-semibold text-slate-900">
                    {user?.firstName} {user?.lastName}
                  </span>
                  <span className="mt-1 rounded-full bg-slate-100 px-2 py-0.5 text-[10px] font-medium text-slate-500">
                    {user?.role === "SUPER_ADMIN"
                      ? "CEO / Admin"
                      : user?.role === "HR_HEAD"
                      ? "HR Manager"
                      : user?.role}
                  </span>
                </div>

                <Avatar className="h-9 w-9 border border-slate-200">
                  <AvatarImage
                    src={user?.profileImage || ""}
                    alt={user?.firstName}
                  />
                  <AvatarFallback className="bg-emerald-100 text-emerald-700 font-bold">
                    {getInitials(user?.firstName, user?.lastName)}
                  </AvatarFallback>
                </Avatar>
              </>
            )}
          </DropdownMenuTrigger>

        <DropdownMenuContent align="end" className="w-60">
            {/* Wrap the label in a group to satisfy the UI context */}
            <DropdownMenuGroup>
              <DropdownMenuLabel>My Account</DropdownMenuLabel>
            </DropdownMenuGroup>

            <DropdownMenuSeparator />

            <DropdownMenuGroup>
              {/* Profile Settings (Fixed Navigation) */}
              <DropdownMenuItem
                onClick={() => router.push("/workspace/profile")}
                className="flex items-center cursor-pointer"
              >
                <User className="mr-2 h-4 w-4" />
                <span>Profile Settings</span>
              </DropdownMenuItem>

              {/* Manage Sessions (Fixed Navigation) */}
              <DropdownMenuItem
                onClick={() => router.push("/workspace/manage-sessions")}
                className="flex items-center cursor-pointer"
              >
                <Shield className="mr-2 h-4 w-4" />
                <span>Manage Sessions</span>
              </DropdownMenuItem>
            </DropdownMenuGroup>

            <DropdownMenuSeparator />

            <DropdownMenuItem
              onClick={handleLogout}
              className="text-rose-600 focus:text-rose-600 cursor-pointer"
            >
              <LogOut className="mr-2 h-4 w-4" />
              <span>Log out</span>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  );
}
