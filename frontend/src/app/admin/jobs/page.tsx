"use client";

import React, { useState, useEffect } from "react";
import {
  Search,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  Trash2,
  Building2,
  MapPin,
  DollarSign,
  Loader2,
  Check,
  AlertCircle,
  RefreshCw,
} from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import {
  fetchAdminJobs,
  updateAdminJobStatus,
  deleteAdminJob,
  AdminJobData,
} from "@/lib/admin-api";

export default function AdminJobsPage() {
  const [jobs, setJobs] = useState<AdminJobData[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState("");
  const [successMsg, setSuccessMsg] = useState("");

  // Filters & Search
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedStatusFilter, setSelectedStatusFilter] = useState("ALL");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const getAuthToken = async () => {
    const supabase = createClient();
    const { data } = await supabase.auth.getSession();
    return data.session?.access_token ?? "";
  };

  const loadJobsData = async () => {
    setIsLoading(true);
    setErrorMsg("");
    try {
      const token = await getAuthToken();
      if (!token) throw new Error("Phiên đăng nhập quản trị đã hết hạn");
      const data = await fetchAdminJobs(token, selectedStatusFilter, searchQuery);
      setJobs(data);
    } catch (err: unknown) {
      console.error("[AdminJobs] Error loading jobs:", err);
      setErrorMsg(err instanceof Error ? err.message : "Không thể nạp danh sách tin tuyển dụng từ server");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    const timeoutId = window.setTimeout(() => {
      void loadJobsData();
    }, 0);
    return () => window.clearTimeout(timeoutId);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedStatusFilter]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    loadJobsData();
  };

  const handleStatusChange = async (jobId: string, jobTitle: string, newStatus: string) => {
    setIsSubmitting(true);
    setErrorMsg("");
    try {
      const token = await getAuthToken();
      await updateAdminJobStatus(token, jobId, newStatus);
      const statusLabel =
        newStatus === "PUBLISHED"
          ? "Phê Duyệt Đăng Tin"
          : newStatus === "PAUSED"
          ? "Tạm Dừng / Khóa Tin"
          : newStatus === "CLOSED"
          ? "Đóng Tin Tuyển Dụng"
          : "Chuyển Nháp";
      setSuccessMsg(`Đã cập nhật trạng thái "${statusLabel}" cho bài đăng "${jobTitle}"!`);
      await loadJobsData();
    } catch (err: unknown) {
      setErrorMsg(err instanceof Error ? err.message : "Cập nhật trạng thái thất bại");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteJob = async (jobId: string, jobTitle: string) => {
    if (!confirm(`Bạn có chắc chắn muốn xóa vĩnh viễn tin tuyển dụng "${jobTitle}" khỏi hệ thống?`)) {
      return;
    }
    setIsSubmitting(true);
    setErrorMsg("");
    try {
      const token = await getAuthToken();
      await deleteAdminJob(token, jobId);
      setSuccessMsg(`Đã xóa vĩnh viễn tin tuyển dụng "${jobTitle}"!`);
      await loadJobsData();
    } catch (err: unknown) {
      setErrorMsg(err instanceof Error ? err.message : "Xóa bài đăng thất bại");
    } finally {
      setIsSubmitting(false);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "PUBLISHED":
        return (
          <span className="inline-flex items-center gap-1 bg-emerald-50 text-emerald-700 border border-emerald-200 px-2.5 py-1 rounded-md text-xs font-bold">
            <CheckCircle2 className="w-3.5 h-3.5" /> Đang Hiển Thị
          </span>
        );
      case "DRAFT":
        return (
          <span className="inline-flex items-center gap-1 bg-amber-50 text-amber-700 border border-amber-200 px-2.5 py-1 rounded-md text-xs font-bold">
            <RefreshCw className="w-3.5 h-3.5" /> Chờ Kiểm Duyệt
          </span>
        );
      case "PAUSED":
        return (
          <span className="inline-flex items-center gap-1 bg-rose-50 text-rose-700 border border-rose-200 px-2.5 py-1 rounded-md text-xs font-bold">
            <AlertTriangle className="w-3.5 h-3.5" /> Tạm Dừng / Khóa
          </span>
        );
      case "CLOSED":
        return (
          <span className="inline-flex items-center gap-1 bg-slate-100 text-slate-600 border border-slate-200 px-2.5 py-1 rounded-md text-xs font-bold">
            <XCircle className="w-3.5 h-3.5" /> Đã Đóng
          </span>
        );
      default:
        return (
          <span className="bg-slate-100 text-slate-700 px-2.5 py-1 rounded-md text-xs font-bold">
            {status}
          </span>
        );
    }
  };

  const formatSalary = (min?: number | null, max?: number | null, currency: string = "VND") => {
    if (!min && !max) return "Thỏa thuận";
    const formatNum = (num: number) => (num / 1000000).toLocaleString() + " Tr";
    if (min && max) return `${formatNum(min)} - ${formatNum(max)} ${currency}`;
    if (min) return `Từ ${formatNum(min)} ${currency}`;
    if (max) return `Đến ${formatNum(max)} ${currency}`;
    return "Thỏa thuận";
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-[#0F172A] tracking-tight">Jobs Moderation - Kiểm Duyệt Tin Tuyển Dụng</h1>
          <p className="text-xs text-[#64748B] mt-0.5">
            Quản lý, phê duyệt tin tuyển dụng mới đăng và xử lý tin tuyển dụng vi phạm từ CSDL
          </p>
        </div>

        {/* Status Filter Tabs */}
        <div className="flex bg-[#E2E8F0] p-1 rounded-xl text-xs font-medium self-start sm:self-auto overflow-x-auto">
          {[
            { id: "ALL", label: "Tất cả" },
            { id: "DRAFT", label: "Chờ Duyệt" },
            { id: "PUBLISHED", label: "Đang Hiển Thị" },
            { id: "PAUSED", label: "Tạm Dừng" },
            { id: "CLOSED", label: "Đã Đóng" },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setSelectedStatusFilter(tab.id)}
              className={`px-3 py-1.5 rounded-lg whitespace-nowrap transition-all ${
                selectedStatusFilter === tab.id
                  ? "bg-white text-[#2563EB] font-bold shadow-sm"
                  : "text-[#64748B]"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Notifications */}
      {errorMsg && (
        <div className="p-3.5 bg-rose-50 border border-rose-200 rounded-xl text-xs font-semibold text-rose-700 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-rose-600" />
            <span>{errorMsg}</span>
          </div>
          <button onClick={() => setErrorMsg("")} className="text-rose-400 hover:text-rose-700"><XCircle className="w-4 h-4" /></button>
        </div>
      )}

      {successMsg && (
        <div className="p-3.5 bg-emerald-50 border border-emerald-200 rounded-xl text-xs font-semibold text-emerald-700 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Check className="w-4 h-4 text-emerald-600" />
            <span>{successMsg}</span>
          </div>
          <button onClick={() => setSuccessMsg("")} className="text-emerald-400 hover:text-emerald-700"><XCircle className="w-4 h-4" /></button>
        </div>
      )}

      {/* Main Container */}
      <div className="bg-white rounded-2xl border border-blue-100 p-6 shadow-sm space-y-6">
        {/* Controls: Search */}
        <form onSubmit={handleSearchSubmit} className="flex flex-col sm:flex-row items-center gap-3">
          <div className="relative flex-1 w-full">
            <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-[#94A3B8]" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Tìm kiếm theo Tiêu đề, Mã tin, Tên công ty hoặc từ khóa..."
              className="w-full pl-10 pr-4 py-2.5 text-sm bg-slate-50 border border-[#E2E8F0] rounded-xl focus:outline-none focus:ring-2 focus:ring-[#2563EB]/20 focus:border-[#2563EB] text-[#0F172A]"
            />
          </div>
          <button
            type="submit"
            className="w-full sm:w-auto px-5 py-2.5 bg-[#2563EB] text-white font-bold text-xs rounded-xl hover:bg-[#1D4ED8] transition-all shadow-sm"
          >
            Tìm Kiếm
          </button>
        </form>

        {/* Jobs List */}
        {isLoading ? (
          <div className="py-20 flex flex-col items-center justify-center bg-white rounded-xl border border-blue-100">
            <Loader2 className="w-8 h-8 animate-spin text-[#2563EB] mb-3" />
            <p className="text-xs font-semibold text-[#64748B]">Đang kết nối CSDL và nạp danh sách tin tuyển dụng...</p>
          </div>
        ) : jobs.length === 0 ? (
          <div className="py-16 text-center text-xs text-[#64748B] italic bg-slate-50 rounded-xl border border-dashed border-[#E2E8F0]">
            Không tìm thấy tin tuyển dụng nào phù hợp với bộ lọc.
          </div>
        ) : (
          <div className="space-y-4">
            {jobs.map((job) => (
              <div
                key={job.id}
                className="p-5 bg-white border border-[#E2E8F0] rounded-2xl hover:border-blue-200 transition-all shadow-xs space-y-4"
              >
                {/* Header Row */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-[#F1F5F9]">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-[11px] font-mono font-bold bg-slate-100 text-slate-600 px-2 py-0.5 rounded">
                        {job.jobCode}
                      </span>
                      <h3 className="font-bold text-[#0F172A] text-base">{job.title}</h3>
                    </div>
                    <div className="flex items-center gap-4 text-xs text-[#64748B] flex-wrap">
                      <span className="flex items-center gap-1 font-semibold text-[#2563EB]">
                        <Building2 className="w-3.5 h-3.5" /> {job.company}
                      </span>
                      <span>•</span>
                      <span className="flex items-center gap-1">
                        <MapPin className="w-3.5 h-3.5 text-slate-400" /> {job.location}
                      </span>
                      <span>•</span>
                      <span className="flex items-center gap-1">
                        <DollarSign className="w-3.5 h-3.5 text-emerald-600" /> {formatSalary(job.minSalary, job.maxSalary, job.currency)}
                      </span>
                    </div>
                  </div>

                  <div>{getStatusBadge(job.status)}</div>
                </div>

                {/* Body Details */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  {/* Skills tags */}
                  <div className="flex items-center gap-1.5 flex-wrap">
                    {job.skills && job.skills.length > 0 ? (
                      job.skills.map((skillName, idx) => (
                        <span
                          key={idx}
                          className="text-[11px] font-semibold bg-[#EFF6FF] text-[#2563EB] px-2.5 py-0.5 rounded-md border border-blue-100"
                        >
                          {skillName}
                        </span>
                      ))
                    ) : (
                      <span className="text-xs text-slate-400 italic">Công ty chưa gắn tag kỹ năng</span>
                    )}
                  </div>

                  {/* Moderation Actions Bar */}
                  <div className="flex items-center gap-2 self-end sm:self-auto flex-wrap">
                    {job.status !== "PUBLISHED" && (
                      <button
                        onClick={() => handleStatusChange(job.id, job.title, "PUBLISHED")}
                        disabled={isSubmitting}
                        className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl transition-all shadow-sm"
                      >
                        <CheckCircle2 className="w-3.5 h-3.5" /> Phê Duyệt Tin
                      </button>
                    )}

                    {job.status !== "PAUSED" && (
                      <button
                        onClick={() => handleStatusChange(job.id, job.title, "PAUSED")}
                        disabled={isSubmitting}
                        className="flex items-center gap-1.5 px-3 py-1.5 bg-amber-500 hover:bg-amber-600 text-white font-bold text-xs rounded-xl transition-all shadow-sm"
                      >
                        <AlertTriangle className="w-3.5 h-3.5" /> Tạm Dừng / Khóa
                      </button>
                    )}

                    {job.status !== "CLOSED" && (
                      <button
                        onClick={() => handleStatusChange(job.id, job.title, "CLOSED")}
                        disabled={isSubmitting}
                        className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-100 border border-[#E2E8F0] hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-xl transition-all"
                      >
                        <XCircle className="w-3.5 h-3.5" /> Đóng Tin
                      </button>
                    )}

                    <button
                      onClick={() => handleDeleteJob(job.id, job.title)}
                      disabled={isSubmitting}
                      className="p-1.5 text-rose-500 hover:bg-rose-50 rounded-xl transition-all"
                      title="Xóa vĩnh viễn"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
