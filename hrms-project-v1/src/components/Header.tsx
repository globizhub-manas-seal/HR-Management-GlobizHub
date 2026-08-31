"use client";

import { useState } from "react";
import { useQuery,useMutation, useQueryClient } from "@tanstack/react-query";
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
  Check, Trash,
  Sun, Moon
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
import { useViewMode } from "@/context/ViewModeContext";
import { useTheme } from "@/context/ThemeContext";

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

  const { user, activeRole, isViewAsUser, setIsViewAsUser, isLoading } = useViewMode();
  const { theme, toggleTheme } = useTheme();

  const handleLogout = async () => {
    const token = localStorage.getItem("hrms_token");
    const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000";
    if (token) {
      try {
        await axios.post(`${API_URL}/auth/logout`, {}, {
          headers: { Authorization: `Bearer ${token}` }
        });
      } catch (err) {
        console.error("Failed to log logout action on backend", err);
      }
    }
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

  // Indigo border on top of header for visual distinction when in Manager Mode
  const isManagerMode = user?.role === "MANAGER" && !isViewAsUser;

  return (
    <header className={`flex items-center justify-between h-16 px-6 bg-card border-b border-border transition-all ${isManagerMode ? "border-t-2 border-t-primary" : ""}`}>
      <div className="flex items-center space-x-4">
        {/* Small and medium screens: open the sidebar as a drawer. */}
        <Sheet open={open} onOpenChange={setOpen}>
          <SheetTrigger
            className="inline-flex rounded-md p-2 transition-colors hover:bg-primary/10 lg:hidden"
            aria-label="Open navigation menu"
          >
            <Menu className="h-5 w-5" />
          </SheetTrigger>
          <SheetContent side="left" className="p-0 w-64 data-[side=left]:w-64 data-[side=left]:sm:max-w-64">
            <Sidebar role={activeRole} className="flex h-full" />
          </SheetContent>
        </Sheet>

        {/* Breadcrumb */}
        <div className="hidden md:flex text-sm font-medium text-muted-foreground">
          <span className="text-muted-foreground/60">Workspace</span>
          <span className="mx-2">/</span>
          <span className="text-foreground">{formatBreadcrumb()}</span>
        </div>
      </div>

      {/* Right Side */}
      <div className="flex items-center space-x-4 lg:space-x-6">
        {/* Search */}
        <div className="hidden md:flex relative w-72">
          <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground/60" />

          <Input
            placeholder="Search employees... (Ctrl + K)"
            className="pl-10 rounded-full bg-muted/40 border-border focus-visible:ring-primary"
          />
        </div>

        {/* View As User Toggle (for Managers only) */}
        {!isLoading && user?.role === "MANAGER" && (
          <div className="flex items-center space-x-3 bg-muted/40 border border-border px-3 py-1.5 rounded-full select-none shadow-sm transition-all duration-200">
            {isViewAsUser ? (
              <span className="flex items-center text-[11px] font-bold text-secondary bg-primary/20 px-2.5 py-0.5 rounded-full border border-primary/30">
                <span className="h-1.5 w-1.5 mr-1.5 rounded-full bg-primary animate-pulse" />
                User View
              </span>
            ) : (
              <span className="flex items-center text-[11px] font-bold text-muted-foreground bg-border/80 px-2.5 py-0.5 rounded-full border border-border">
                <span className="h-1.5 w-1.5 mr-1.5 rounded-full bg-muted-foreground" />
                Manager Mode
              </span>
            )}
            
            <button
              onClick={() => setIsViewAsUser(!isViewAsUser)}
              className={`relative inline-flex h-5 w-10 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                isViewAsUser ? "bg-primary" : "bg-border hover:bg-border/80"
              }`}
              aria-label="Toggle user view mode"
            >
              <span
                className={`pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                  isViewAsUser ? "translate-x-5" : "translate-x-0"
                }`}
              />
            </button>
          </div>
        )}

        {/* Theme Toggle Button */}
        <button
          onClick={toggleTheme}
          className="flex items-center justify-center w-10 h-10 rounded-xl hover:bg-muted text-muted-foreground hover:text-foreground transition-all duration-200 border border-transparent hover:border-border cursor-pointer focus:outline-none"
          aria-label="Toggle dark/light theme"
        >
          {theme === "dark" ? (
            <Sun className="h-5 w-5 text-amber-400 hover:text-amber-300 transition-transform duration-300 hover:rotate-45" />
          ) : (
            <Moon className="h-5 w-5 text-slate-700 hover:text-slate-900 transition-transform duration-300 hover:-rotate-12" />
          )}
        </button>

        {/* Notification Dropdown */}
        <DropdownMenu>
          {/* Removed asChild and Button. Applied styles directly to the Trigger */}
          <DropdownMenuTrigger className="relative flex items-center justify-center w-10 h-10 rounded-md hover:bg-muted text-muted-foreground hover:text-foreground transition-colors focus:outline-none cursor-pointer">
            <Bell className="h-5 w-5" />
            <NotificationDot /> 
          </DropdownMenuTrigger>

          <DropdownMenuContent align="end" className="w-80 p-0">
            <div className="flex items-center justify-between px-4 py-3 border-b border-border bg-muted/30">
              <span className="font-semibold text-foreground">Notifications</span>
              <MarkAllReadButton />
            </div>
            
            <NotificationList />
            
          </DropdownMenuContent>
        </DropdownMenu>

        {/* Profile */}
        <DropdownMenu>
         <DropdownMenuTrigger 
            className={buttonVariants({ 
              variant: "ghost", 
              className: "flex items-center gap-2 hover:bg-transparent cursor-pointer border-0 outline-none" 
            })}
          >
            {isLoading ? (
              <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
            ) : (
              <>
                <div className="hidden lg:flex flex-col items-end">
                  <span className="text-sm font-semibold text-foreground">
                    {user?.firstName} {user?.lastName}
                  </span>
                  <span className="mt-1 rounded-full bg-muted px-2 py-0.5 text-[10px] font-medium text-muted-foreground">
                    {user?.role === "SUPER_ADMIN"
                      ? "CEO / Admin"
                      : user?.role === "HR_HEAD"
                      ? "HR Manager"
                      : user?.role}
                  </span>
                </div>

                <Avatar className="h-9 w-9 border border-border">
                  <AvatarImage
                    src={user?.profileImage || ""}
                    alt={user?.firstName}
                  />
                  <AvatarFallback className="bg-primary/20 text-secondary font-bold">
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

// Helper components to keep Header clean
const fetchNotifications = async () => {
  const token = localStorage.getItem("hrms_token");
  if (!token) return [];
  const res = await axios.get(`${process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000"}/notifications/unread`, {
    headers: { Authorization: `Bearer ${token}` }
  });
  return res.data;
};

function NotificationDot() {
  const { data: notifications } = useQuery({ queryKey: ["notifications"], queryFn: fetchNotifications, refetchInterval: 30000 }); // Polls every 30s
  if (!notifications || notifications.length === 0) return null;
  return <span className="absolute top-1.5 right-1.5 h-2 w-2 rounded-full bg-rose-500 border-2 border-white" />;
}

function MarkAllReadButton() {
  const queryClient = useQueryClient();
  const markAllMutation = useMutation({
    mutationFn: async () => {
      const token = localStorage.getItem("hrms_token");
      await axios.patch(`${process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000"}/notifications/read-all`, {}, { headers: { Authorization: `Bearer ${token}` }});
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["notifications"] })
  });

  return (
    <button onClick={() => markAllMutation.mutate()} className="text-xs text-amber-600 hover:text-amber-700 font-medium flex items-center">
      <Check className="w-3 h-3 mr-1" /> Mark all read
    </button>
  );
}

function NotificationList() {
  const queryClient = useQueryClient();
  const { data: notifications, isLoading } = useQuery({ queryKey: ["notifications"], queryFn: fetchNotifications });

  const readMutation = useMutation({
    mutationFn: async (id: string) => {
      const token = localStorage.getItem("hrms_token");
      await axios.patch(`${process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000"}/notifications/${id}/read`, {}, { headers: { Authorization: `Bearer ${token}` }});
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["notifications"] })
  });

  if (isLoading) return <div className="p-8 text-center text-sm text-muted-foreground">Loading...</div>;
  if (!notifications || notifications.length === 0) {
    return <div className="p-8 text-center text-sm text-muted-foreground">You're all caught up! 🎉</div>;
  }

  return (
    <div className="max-h-[300px] overflow-y-auto">
      {notifications.map((notif: any) => (
        <div key={notif.id} className="p-4 border-b border-border hover:bg-primary/10 transition-colors flex items-start justify-between group cursor-pointer" onClick={() => readMutation.mutate(notif.id)}>
          <div className="space-y-1 pr-4">
            <p className="text-sm font-semibold text-foreground">{notif.title}</p>
            <p className="text-xs text-muted-foreground line-clamp-2">{notif.message}</p>
            <p className="text-[10px] text-muted-foreground/60 mt-2">{new Date(notif.createdAt).toLocaleDateString()} at {new Date(notif.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</p>
          </div>
          <div className="w-2 h-2 mt-1 rounded-full bg-primary shrink-0 group-hover:hidden" />
          <Check className="w-4 h-4 text-muted-foreground/40 hidden group-hover:block shrink-0" />
        </div>
      ))}
    </div>
  );
}
