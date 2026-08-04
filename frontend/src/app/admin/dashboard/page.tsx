"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import {
  Users,
  Briefcase,
  BrainCircuit,
  Building2,
  TrendingUp,
  AlertCircle,
  ArrowRight,
  Loader2,
  Sparkles,
  Layers,
} from "lucide-react";
import { fetchAdminDashboardStats, AdminDashboardStatsData } from "@/lib/admin-api";
import { createClient } from "@/lib/supabase/client";

export default function AdminDashboardPage() {
  const [stats, setStats] = useState<AdminDashboardStatsData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");

  const loadDashboardData = async () => {
    setIsLoading(true);
    setError("");
    try {
      const supabase = createClient();
      const { data: authData } = await supabase.auth.getSession();
      const token = authData.session?.access_token;
      if (!token) throw new Error("Phiên đăng nhập quản trị đã hết hạn");
      const data = await fetchAdminDashboardStats(token);
      setStats(data);
    } catch (err: unknown) {
      console.error("[AdminDashboard] Failed to load stats:", err);
      setError(err instanceof Error ? err.message : "Không thể nạp dữ liệu thống kê từ server");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    const timeoutId = window.setTimeout(() => {
      void loadDashboardData();
    }, 0);
    return () => window.clearTimeout(timeoutId);
  }, []);

  if (isLoading) {
    return (
      <div className="py-24 flex flex-col items-center justify-center bg-white rounded-3xl border border-blue-100 shadow-sm">
        <Loader2 className="w-9 h-9 animate-spin text-[#2563EB] mb-3" />
        <p className="text-sm font-semibold text-[#0F172A]">Đang kết nối CSDL và tổng hợp dữ liệu thực tế...</p>
        <p className="text-xs text-[#64748B] mt-1">SmartRecruit Real-time Analytics Engine</p>
      </div>
    );
  }

  if (error || !stats) {
    return (
      <div className="p-6 bg-rose-50 border border-rose-200 rounded-2xl text-rose-700 space-y-3">
        <div className="flex items-center gap-2 font-bold text-sm">
          <AlertCircle className="w-5 h-5 text-rose-600" />
          <span>Không thể tải dữ liệu Dashboard từ Database</span>
        </div>
        <p className="text-xs text-rose-600">{error}</p>
        <button
          onClick={loadDashboardData}
          className="px-4 py-2 bg-rose-600 text-white font-bold text-xs rounded-xl shadow-sm hover:bg-rose-700"
        >
          Thử Lại
        </button>
      </div>
    );
  }

  const { overview, recentJobs, topUnrecognizedSkills } = stats;

  return (
    <div className="space-y-8">
      {/* Top Banner Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-6 rounded-3xl border border-blue-100 shadow-sm">
        <div>
          <div className="flex items-center gap-2">
            <span className="p-1.5 bg-[#EFF6FF] text-[#2563EB] rounded-lg">
              <Sparkles className="w-4 h-4" />
            </span>
            <h1 className="text-2xl font-extrabold text-[#0F172A] tracking-tight">
              Dashboard Báo Cáo Hệ Thống
            </h1>
          </div>
          <p className="text-xs text-[#64748B] mt-1.5">
            Dữ liệu thời gian thực được tổng hợp trực tiếp từ cơ sở dữ liệu PostgreSQL SmartRecruit
          </p>
        </div>

        <button
          onClick={loadDashboardData}
          className="flex items-center gap-2 px-4 py-2 bg-[#EFF6FF] border border-blue-200 text-[#2563EB] hover:bg-blue-100 font-bold text-xs rounded-xl transition-all self-start sm:self-auto"
        >
          <TrendingUp className="w-4 h-4" /> Cập Nhật Dữ Liệu
        </button>
      </div>

      {/* Main Metric Cards Grid (Bento Style) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Card 1: Users */}
        <div className="bg-white p-5 rounded-2xl border border-blue-100 shadow-sm space-y-3 hover:-translate-y-0.5 transition-all">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-[#64748B]">Tổng Người Dùng</span>
            <div className="w-9 h-9 rounded-xl bg-blue-50 border border-blue-100 flex items-center justify-center text-[#2563EB]">
              <Users className="w-4 h-4" />
            </div>
          </div>
          <div className="text-3xl font-extrabold text-[#0F172A]">{overview.totalUsers}</div>
          <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-xs text-[#64748B]">
            <span>Ứng viên: <strong>{overview.totalCandidates}</strong></span>
            <span>NTD: <strong>{overview.totalRecruiters}</strong></span>
          </div>
        </div>

        {/* Card 2: Jobs */}
        <div className="bg-white p-5 rounded-2xl border border-blue-100 shadow-sm space-y-3 hover:-translate-y-0.5 transition-all">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-[#64748B]">Bài Đăng Tuyển Dụng</span>
            <div className="w-9 h-9 rounded-xl bg-emerald-50 border border-emerald-100 flex items-center justify-center text-emerald-600">
              <Briefcase className="w-4 h-4" />
            </div>
          </div>
          <div className="text-3xl font-extrabold text-[#0F172A]">{overview.totalJobs}</div>
          <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-xs text-[#64748B]">
            <span>Đang hiển thị: <strong className="text-emerald-600">{overview.activeJobs}</strong></span>
            <Link href="/admin/jobs" className="text-[#2563EB] hover:underline font-semibold flex items-center gap-0.5">
              Duyệt tin <ArrowRight className="w-3 h-3" />
            </Link>
          </div>
        </div>

        {/* Card 3: Master Data Skills */}
        <div className="bg-white p-5 rounded-2xl border border-blue-100 shadow-sm space-y-3 hover:-translate-y-0.5 transition-all">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-[#64748B]">Kỹ Năng Từ Điển</span>
            <div className="w-9 h-9 rounded-xl bg-purple-50 border border-purple-100 flex items-center justify-center text-purple-600">
              <BrainCircuit className="w-4 h-4" />
            </div>
          </div>
          <div className="text-3xl font-extrabold text-[#0F172A]">{overview.totalSkills}</div>
          <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-xs text-[#64748B]">
            <span>Danh mục: <strong>{overview.totalSkillCategories}</strong></span>
            <Link href="/admin/skills" className="text-[#2563EB] hover:underline font-semibold flex items-center gap-0.5">
              Quản lý <ArrowRight className="w-3 h-3" />
            </Link>
          </div>
        </div>

        {/* Card 4: AI Unrecognized Keywords */}
        <div className="bg-white p-5 rounded-2xl border border-rose-200 bg-rose-50/50 shadow-sm space-y-3 hover:-translate-y-0.5 transition-all">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-rose-700">Từ Khóa AI Chờ Duyệt</span>
            <div className="w-9 h-9 rounded-xl bg-rose-100 border border-rose-200 flex items-center justify-center text-rose-600">
              <AlertCircle className="w-4 h-4" />
            </div>
          </div>
          <div className="text-3xl font-extrabold text-rose-700">{overview.pendingUnrecognizedSkills}</div>
          <div className="pt-2 border-t border-rose-200/60 flex items-center justify-between text-xs text-rose-700">
            <span>Yêu cầu xử lý</span>
            <Link href="/admin/skills" className="font-bold text-rose-700 hover:underline flex items-center gap-0.5">
              Duyệt ngay <ArrowRight className="w-3 h-3" />
            </Link>
          </div>
        </div>
      </div>

      {/* Two Column Widgets */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Column 1 & 2: Recent Job Postings (2/3 width) */}
        <div className="lg:col-span-2 bg-white rounded-2xl border border-blue-100 p-6 shadow-sm space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <div className="flex items-center gap-2">
              <Building2 className="w-4 h-4 text-[#2563EB]" />
              <h2 className="font-bold text-[#0F172A] text-base">Tin Tuyển Dụng Mới Nhất trong Database</h2>
            </div>
            <Link href="/admin/jobs" className="text-xs font-bold text-[#2563EB] hover:underline flex items-center gap-1">
              Xem tất cả <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          {recentJobs.length === 0 ? (
            <div className="py-12 text-center text-xs text-[#64748B] italic">
              Chưa có tin tuyển dụng nào được khởi tạo trong CSDL.
            </div>
          ) : (
            <div className="divide-y divide-slate-100">
              {recentJobs.map((job) => (
                <div key={job.id} className="py-3 flex items-center justify-between hover:bg-slate-50 px-2 rounded-xl transition-colors">
                  <div className="space-y-0.5">
                    <p className="font-bold text-[#0F172A] text-sm">{job.title}</p>
                    <div className="flex items-center gap-3 text-xs text-[#64748B]">
                      <span>{job.company}</span>
                      <span>•</span>
                      <span className="bg-slate-100 px-2 py-0.5 rounded text-[11px] font-medium">{job.department}</span>
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    <span className="text-[10px] font-bold uppercase px-2 py-1 rounded bg-blue-50 text-[#2563EB] border border-blue-100">
                      {job.status}
                    </span>
                    <span className="text-[11px] text-slate-400 font-mono hidden sm:inline">
                      {new Date(job.createdAt).toLocaleDateString("vi-VN")}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Column 3: Top Unrecognized Skills Widget (1/3 width) */}
        <div className="bg-white rounded-2xl border border-rose-200 p-6 shadow-sm space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <div className="flex items-center gap-2">
              <Layers className="w-4 h-4 text-rose-600" />
              <h2 className="font-bold text-[#0F172A] text-base">Từ Khóa Lạ Tần Suất Cao</h2>
            </div>
          </div>

          {topUnrecognizedSkills.length === 0 ? (
            <div className="py-12 text-center text-xs text-[#64748B] italic">
              🎉 Không có từ khóa lạ nào chưa nhận diện!
            </div>
          ) : (
            <div className="space-y-2.5">
              {topUnrecognizedSkills.map((item) => (
                <div key={item.id} className="p-3 bg-rose-50/50 border border-rose-100 rounded-xl flex items-center justify-between">
                  <div>
                    <p className="font-bold text-[#0F172A] text-xs">{item.rawSkillName}</p>
                    <p className="text-[10px] text-slate-400">
                      {new Date(item.createdAt).toLocaleDateString("vi-VN")}
                    </p>
                  </div>
                  <span className="text-xs font-extrabold bg-rose-100 text-rose-700 px-2 py-1 rounded-lg">
                    {item.frequency} lần
                  </span>
                </div>
              ))}

              <Link
                href="/admin/skills"
                className="mt-3 w-full py-2.5 bg-[#EFF6FF] border border-blue-200 text-[#2563EB] font-bold text-xs rounded-xl hover:bg-blue-100 flex items-center justify-center gap-1.5 transition-all"
              >
                Vào Trang Duyệt Skills <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
