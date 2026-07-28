"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { ShieldCheck, Eye, EyeOff, Loader2, Lock, User } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { bootstrapProfile } from "@/lib/auth-api";

export function AdminLoginForm() {
  const router = useRouter();
  const [usernameOrEmail, setUsernameOrEmail] = useState("admin");
  const [password, setPassword] = useState("admin 123");
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError("");

    try {
      const supabase = createClient();
      let inputVal = usernameOrEmail.trim().toLowerCase();
      
      // If user typed 'admin', map to 'admin@admin.com'
      if (inputVal === "admin") {
        inputVal = "admin@admin.com";
      }

      console.log("[AdminLogin] Signing in with:", inputVal);

      const { data, error: authError } = await supabase.auth.signInWithPassword({
        email: inputVal,
        password: password,
      });

      if (authError) {
        throw authError;
      }

      if (!data.session) {
        throw new Error("Không thể khởi tạo phiên làm việc.");
      }

      // Bootstrap profile to verify ADMIN role
      const profile = await bootstrapProfile(data.session.access_token);
      
      if (!profile.roles.includes("ADMIN")) {
        await supabase.auth.signOut();
        throw new Error("Tài khoản này không có quyền truy cập Admin!");
      }

      // Successful login -> Go to admin dashboard
      router.replace("/admin/dashboard");
      router.refresh();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Đăng nhập thất bại. Vui lòng kiểm tra lại thông tin.";
      console.error("[AdminLogin] Error:", msg);
      if (msg.includes("Invalid login credentials")) {
        setError("Tài khoản hoặc mật khẩu không chính xác.");
      } else {
        setError(msg);
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="w-full max-w-md p-8 bg-white rounded-2xl border border-blue-100 shadow-xl space-y-6">
      <div className="text-center space-y-2">
        <div className="mx-auto w-12 h-12 rounded-2xl bg-[#EFF6FF] border border-blue-200 flex items-center justify-center text-[#2563EB] shadow-sm">
          <ShieldCheck className="w-6 h-6" />
        </div>
        <h1 className="text-xl font-extrabold text-[#0F172A] tracking-tight">
          Đăng nhập Quản trị viên
        </h1>
        <p className="text-xs text-[#64748B]">
          Hệ thống Quản trị SmartRecruit AI Portal
        </p>
      </div>

      {error && (
        <div className="p-3.5 bg-rose-50 border border-rose-200 rounded-xl text-xs font-semibold text-rose-700 leading-relaxed">
          {error}
        </div>
      )}

      <form onSubmit={handleLogin} className="space-y-4">
        <div className="space-y-1.5">
          <label className="text-xs font-bold text-[#0F172A]">
            Tài khoản hoặc Email Admin
          </label>
          <div className="relative">
            <User className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-[#94A3B8]" />
            <input
              type="text"
              required
              value={usernameOrEmail}
              onChange={(e) => setUsernameOrEmail(e.target.value)}
              placeholder="admin hoặc admin@admin.com"
              className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-[#E2E8F0] rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#2563EB]/20 focus:border-[#2563EB] text-[#0F172A]"
              disabled={isLoading}
            />
          </div>
        </div>

        <div className="space-y-1.5">
          <label className="text-xs font-bold text-[#0F172A]">
            Mật khẩu
          </label>
          <div className="relative">
            <Lock className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-[#94A3B8]" />
            <input
              type={showPassword ? "text" : "password"}
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              className="w-full pl-10 pr-10 py-2.5 bg-slate-50 border border-[#E2E8F0] rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#2563EB]/20 focus:border-[#2563EB] text-[#0F172A]"
              disabled={isLoading}
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-[#94A3B8] hover:text-[#0F172A] p-1"
            >
              {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            </button>
          </div>
        </div>

        <button
          type="submit"
          disabled={isLoading}
          className="w-full py-3 bg-[#2563EB] hover:bg-[#1D4ED8] text-white font-bold text-sm rounded-xl shadow-md transition-all flex items-center justify-center gap-2 active:scale-[0.98] disabled:opacity-70"
        >
          {isLoading && <Loader2 className="w-4 h-4 animate-spin" />}
          Đăng Nhập Quản Trị
        </button>
      </form>

      {/* Account Info Hint Box */}
      <div className="p-3.5 bg-[#EFF6FF] border border-blue-200 rounded-xl text-xs text-[#1E40AF] space-y-1">
        <p className="font-bold flex items-center gap-1.5">
          <span>💡</span> Tài khoản mặc định:
        </p>
        <p className="font-mono text-[11px]">Tài khoản: <strong>admin</strong> (hoặc <strong>admin@admin.com</strong>)</p>
        <p className="font-mono text-[11px]">Mật khẩu: <strong>admin 123</strong></p>
      </div>
    </div>
  );
}
