// src/components/Header.tsx
"use client";

import { Search, Globe, Bell, LogOut } from "lucide-react";
import { Input } from "@/components/ui/input";
import { useRouter } from "next/navigation";
import { useQueryClient } from "@tanstack/react-query";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

export default function Header() {
  const router = useRouter();
  const queryClient = useQueryClient();

  const handleLogout = () => {
    localStorage.removeItem("hrms_token");
    queryClient.clear(); // Flushes the React Query cache!
    router.push("/login");
  };

  return (
    <header className="h-20 bg-white border-b flex items-center justify-between px-8 flex-shrink-0">
      
      {/* Left Side: Greeting */}
      <div>
        <p className="text-sm text-slate-500">Hello Davis!</p>
        <h1 className="text-2xl font-bold text-slate-900">Good Morning</h1>
      </div>

      {/* Right Side: Search, Icons, Profile */}
      <div className="flex items-center space-x-6">
        
        {/* Search Bar */}
        <div className="relative w-72">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
          <Input 
            placeholder="Search anything" 
            className="pl-10 bg-slate-50 border-none rounded-full focus-visible:ring-emerald-500"
          />
        </div>

        {/* Icon Buttons */}
        <div className="flex items-center space-x-3 text-slate-400">
          <button className="hover:text-slate-600 transition-colors p-2 bg-slate-50 rounded-full">
            <Globe className="h-5 w-5" />
          </button>
          <button className="relative hover:text-slate-600 transition-colors p-2 bg-slate-50 rounded-full">
            <Bell className="h-5 w-5" />
            <span className="absolute top-1.5 right-1.5 h-2.5 w-2.5 bg-red-500 rounded-full border-2 border-white"></span>
          </button>
        </div>

        {/* Profile Dropdown */}
        <div className="pl-4 border-l">
          <DropdownMenu>
            <DropdownMenuTrigger className="flex items-center outline-none cursor-pointer hover:opacity-80 transition-opacity">
              <div className="w-10 h-10 rounded-full bg-emerald-100 border border-emerald-200 flex-shrink-0 overflow-hidden">
                <img src="https://i.pravatar.cc/150?u=davis" alt="Profile" className="w-full h-full object-cover" />
              </div>
              <div className="ml-3 hidden md:block text-left">
                <p className="text-sm font-semibold text-slate-900 leading-none">Davis Levin</p>
                <p className="text-xs text-slate-500 mt-1">User</p>
              </div>
            </DropdownMenuTrigger>
            
            <DropdownMenuContent align="end" className="w-48 mt-2">
              <DropdownMenuLabel>My Account</DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem 
                onClick={handleLogout} 
                className="text-red-600 focus:text-red-700 focus:bg-red-50 cursor-pointer"
              >
                <LogOut className="mr-2 h-4 w-4" />
                <span>Log out</span>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

      </div>
    </header>
  );
}