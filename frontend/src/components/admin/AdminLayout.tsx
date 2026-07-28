"use client";

import React, { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  BrainCircuit,
  Building,
  Briefcase,
  Users,
  LogOut,
  Menu,
  X,
  Settings,
  Bell
} from "lucide-react";
import type { AuthProfile } from "@/types/auth";
import { createClient } from "@/lib/supabase/client";

const MENU_ITEMS = [
  { name: "Dashboard", icon: LayoutDashboard, href: "/admin/dashboard" },
  { name: "Master Data & AI", icon: BrainCircuit, href: "/admin/skills" },
  { name: "Jobs Moderation", icon: Briefcase, href: "/admin/jobs" },
  { name: "Users", icon: Users, href: "/admin/users" },
];

export function AdminLayout({
  children,
  profile,
}: {
  children: React.ReactNode;
  profile: AuthProfile;
}) {
  const pathname = usePathname();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const handleLogout = async () => {
    const supabase = createClient();
    await supabase.auth.signOut();
    window.location.href = "/login";
  };

  return (
    <div className="min-h-screen bg-[#F8FAFC] text-[#0F172A] font-sans flex">
      {/* Sidebar - Desktop */}
      <aside className="hidden lg:flex flex-col w-64 bg-white border-r border-[#E2E8F0] fixed inset-y-0 z-20">
        <div className="flex items-center gap-3 h-16 px-6 border-b border-[#E2E8F0]">
          <div className="h-8 w-8 rounded-lg bg-[#2563EB] flex items-center justify-center text-white shadow-sm">
            <Settings className="w-4 h-4" />
          </div>
          <span className="font-bold text-lg tracking-tight text-[#0F172A]">
            Admin Portal
          </span>
        </div>

        <nav className="flex-1 px-4 py-6 space-y-1 overflow-y-auto">
          {MENU_ITEMS.map((item) => {
            const isActive = pathname.startsWith(item.href);
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all text-sm font-semibold ${
                  isActive
                    ? "bg-[#EFF6FF] text-[#2563EB]"
                    : "text-[#64748B] hover:bg-slate-50 hover:text-[#0F172A]"
                }`}
              >
                <item.icon
                  className={`w-5 h-5 ${
                    isActive ? "text-[#2563EB]" : "text-[#94A3B8]"
                  }`}
                />
                {item.name}
              </Link>
            );
          })}
        </nav>

        <div className="p-4 border-t border-[#E2E8F0]">
          <button
            onClick={handleLogout}
            className="flex items-center gap-3 px-3 py-2.5 w-full rounded-xl text-sm font-semibold text-rose-600 hover:bg-rose-50 transition-all"
          >
            <LogOut className="w-5 h-5" />
            Đăng xuất
          </button>
        </div>
      </aside>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col lg:pl-64 min-h-screen">
        {/* Topbar */}
        <header className="h-16 bg-white/80 backdrop-blur-md border-b border-[#E2E8F0] px-4 sm:px-6 flex items-center justify-between sticky top-0 z-10">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setIsMobileMenuOpen(true)}
              className="lg:hidden p-2 -ml-2 text-[#64748B] hover:text-[#0F172A] rounded-lg hover:bg-slate-50"
            >
              <Menu className="w-5 h-5" />
            </button>
            <h1 className="text-sm font-bold text-[#0F172A] hidden sm:block">
              {MENU_ITEMS.find((item) => pathname.startsWith(item.href))?.name || "Dashboard"}
            </h1>
          </div>

          <div className="flex items-center gap-4">
            <button className="relative p-2 text-[#64748B] hover:text-[#2563EB] transition-colors rounded-full hover:bg-[#EFF6FF]">
              <Bell className="w-5 h-5" />
              <span className="absolute top-1.5 right-2 w-2 h-2 bg-rose-500 rounded-full border-2 border-white"></span>
            </button>
            
            <div className="h-8 w-[1px] bg-[#E2E8F0]"></div>
            
            <div className="flex items-center gap-3">
              <div className="hidden sm:block text-right">
                <p className="text-xs font-bold text-[#0F172A] leading-tight">
                  {profile.fullName}
                </p>
                <p className="text-[10px] text-[#64748B] uppercase tracking-wider">
                  System Admin
                </p>
              </div>
              <div className="h-9 w-9 rounded-full bg-[#EFF6FF] border border-blue-200 flex items-center justify-center font-bold text-[#2563EB]">
                {profile.fullName.charAt(0).toUpperCase()}
              </div>
            </div>
          </div>
        </header>

        {/* Page Content */}
        <main className="flex-1 p-4 sm:p-6 lg:p-8">
          {children}
        </main>
      </div>

      {/* Mobile Sidebar Overlay */}
      {isMobileMenuOpen && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <div
            className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm"
            onClick={() => setIsMobileMenuOpen(false)}
          ></div>
          <aside className="fixed inset-y-0 left-0 w-64 bg-white shadow-xl flex flex-col">
            <div className="flex items-center justify-between h-16 px-6 border-b border-[#E2E8F0]">
              <div className="flex items-center gap-2">
                <div className="h-8 w-8 rounded-lg bg-[#2563EB] flex items-center justify-center text-white shadow-sm">
                  <Settings className="w-4 h-4" />
                </div>
                <span className="font-bold text-lg text-[#0F172A]">Admin</span>
              </div>
              <button
                onClick={() => setIsMobileMenuOpen(false)}
                className="p-1 -mr-1 text-[#64748B] hover:text-[#0F172A] rounded-md"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <nav className="flex-1 px-4 py-6 space-y-1 overflow-y-auto">
              {MENU_ITEMS.map((item) => {
                const isActive = pathname.startsWith(item.href);
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    onClick={() => setIsMobileMenuOpen(false)}
                    className={`flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all text-sm font-semibold ${
                      isActive
                        ? "bg-[#EFF6FF] text-[#2563EB]"
                        : "text-[#64748B] hover:bg-slate-50 hover:text-[#0F172A]"
                    }`}
                  >
                    <item.icon
                      className={`w-5 h-5 ${
                        isActive ? "text-[#2563EB]" : "text-[#94A3B8]"
                      }`}
                    />
                    {item.name}
                  </Link>
                );
              })}
            </nav>
          </aside>
        </div>
      )}
    </div>
  );
}
