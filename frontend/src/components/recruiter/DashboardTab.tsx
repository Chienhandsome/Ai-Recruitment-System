/* eslint-disable @next/next/no-img-element */
"use client";

import React, { useState, useEffect } from "react";
import {
  Briefcase,
  Users,
  Calendar,
  Clock,
  Video,
  CheckCircle2,
  RotateCw,
  Filter,
  AlertCircle,
  ArrowRight,
  ChevronRight,
  Layers,
  Flame,
  Search,
  Plus,
  Sparkles,
  Info,
  Play,
} from "lucide-react";
import {
  getRecruiterActionHub,
  getRecruiterAnalytics,
  getRecruiterJobs,
  type RecruiterActionHubData,
  type RecruiterAnalyticsData,
  type PendingCandidateActionItem,
  type ActionQueueItem,
  type UpcomingInterviewItem,
  type JobPostingData,
} from "@/lib/recruiter-api";
import { parseISO, format } from "date-fns";

export interface DashboardTabProps {
  token: string;
  onOpenCreateJob: () => void;
  onNavigateToInterviews: () => void;
  onNavigateToJob: (jobId: string, tab?: "info" | "candidates") => void;
  onNavigateToApplication: (applicationId: string, jobId?: string) => void;
  onNavigateToJobsList: () => void;
}

export function DashboardTab({
  token,
  onOpenCreateJob,
  onNavigateToInterviews,
  onNavigateToJob,
  onNavigateToApplication,
  onNavigateToJobsList,
}: DashboardTabProps) {
  const [selectedJobId, setSelectedJobId] = useState<string>("");
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [candidateFilterTab, setCandidateFilterTab] = useState<"all" | "ai_review" | "new_apply" | "reschedule">("all");
  const [jobsList, setJobsList] = useState<JobPostingData[]>([]);
  const [hubData, setHubData] = useState<RecruiterActionHubData | null>(null);
  const [analyticsData, setAnalyticsData] = useState<RecruiterAnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchActionHubData = async (jobId?: string) => {
    if (!token) return;
    setLoading(true);
    setError(null);
    try {
      const [hubRes, jobsRes, analyticsRes] = await Promise.all([
        getRecruiterActionHub(token, jobId || undefined),
        jobsList.length === 0 ? getRecruiterJobs(token, { status: "PUBLISHED" }) : Promise.resolve({ data: jobsList }),
        getRecruiterAnalytics(token, jobId || undefined).catch((err) => {
          if (err?.status === 403 || err?.message?.includes('HR Pro') || err?.message?.includes('recruitmentStats')) {
            console.info("[Dashboard] Thống kê chuyên sâu (Analytics) bị giới hạn ở gói Miễn phí — đang hiển thị tổng quan mặc định.");
          } else {
            console.warn("Analytics not available or entitlement limited", err);
          }
          return null;
        }),
      ]);
      setHubData(hubRes);
      if (jobsRes?.data) {
        setJobsList(jobsRes.data);
      }
      if (analyticsRes) {
        setAnalyticsData(analyticsRes);
      }
    } catch (err: any) {
      console.error("Failed to load recruiter action hub data", err);
      setError(err?.message || "Không thể tải dữ liệu Dashboard.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchActionHubData(selectedJobId);
  }, [selectedJobId, token]);

  const kpis = hubData?.kpis;
  const todayInterviews: UpcomingInterviewItem[] = hubData?.todayInterviews || [];
  const upcomingInterviews: UpcomingInterviewItem[] = hubData?.upcomingInterviews || [];
  const actionQueue: ActionQueueItem[] = hubData?.actionQueue || [];
  const pendingActions: PendingCandidateActionItem[] = hubData?.pendingCandidateActions || [];

  // Categorize pending candidate actions
  const aiReviewActions = pendingActions.filter(a => a.actionType === 'AI_INTERVIEW_REVIEW');
  const newApplyActions = pendingActions.filter(a => a.actionType === 'NEW_APPLICATION');
  const rescheduleActions = pendingActions.filter(a => a.actionType === 'RESCHEDULE_REQUEST');

  // Filter candidate items by selected tab and search query
  const filteredCandidates = pendingActions.filter(cand => {
    if (candidateFilterTab === 'ai_review') return cand.actionType === 'AI_INTERVIEW_REVIEW';
    if (candidateFilterTab === 'new_apply') return cand.actionType === 'NEW_APPLICATION';
    if (candidateFilterTab === 'reschedule') return cand.actionType === 'RESCHEDULE_REQUEST';
    return true;
  }).filter(cand => {
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase();
    return (
      cand.candidateName.toLowerCase().includes(q) ||
      cand.jobTitle.toLowerCase().includes(q) ||
      cand.jobCode.toLowerCase().includes(q)
    );
  });

  // Filter action queue jobs by search query
  const filteredQueue = actionQueue.filter((item: ActionQueueItem) => {
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase();
    return (
      item.title.toLowerCase().includes(q) ||
      item.jobCode.toLowerCase().includes(q) ||
      item.departmentName.toLowerCase().includes(q)
    );
  });

  return (
    <div className="space-y-6">
      {/* 1. Header Toolbar: Action-First Focus, Filter & Search */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-4 sm:p-5 rounded-2xl border border-slate-200 shadow-xs">
        <div className="flex items-center gap-3">
          <div className="flex size-10 items-center justify-center rounded-xl bg-[#2563EB] text-white shadow-xs shrink-0">
            <Layers className="size-5" />
          </div>
          <div>
            <h1 className="text-base font-extrabold text-[#1F2937]">
              Dashboard Điều Hành Tuyển Dụng
            </h1>
            <p className="text-xs text-slate-500">
              Hàng đợi xử lý hồ sơ, bài phỏng vấn AI chờ HR chấm điểm và lịch phỏng vấn
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          {/* Quick Search */}
          <div className="relative min-w-[200px] flex-1 sm:flex-initial">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-3.5 text-slate-400" />
            <input
              type="text"
              placeholder="Tìm theo vị trí, ứng viên..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-8 pr-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-100 focus:border-[#2563EB]"
            />
          </div>

          {/* Job Filter Dropdown */}
          <div className="flex items-center gap-2">
            <Filter className="size-3.5 text-[#2563EB]" />
            <select
              value={selectedJobId}
              onChange={(e) => setSelectedJobId(e.target.value)}
              className="rounded-xl border border-blue-200 bg-[#EFF6FF] px-3 py-2 text-xs font-bold text-[#1F2937] outline-none focus:border-[#2563EB] focus:ring-2 focus:ring-blue-100 transition-all cursor-pointer max-w-[220px]"
            >
              <option value="">Tất cả vị trí ({jobsList.length} JD)</option>
              {jobsList.map((job) => (
                <option key={job.id} value={job.id}>
                  {job.title}
                </option>
              ))}
            </select>
          </div>

          {/* Refresh Button */}
          <button
            type="button"
            onClick={() => fetchActionHubData(selectedJobId)}
            disabled={loading}
            className="flex size-9 items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-600 hover:bg-[#EFF6FF] hover:text-[#2563EB] transition-colors disabled:opacity-50 shrink-0"
            title="Làm mới dữ liệu"
          >
            <RotateCw className={`size-4 ${loading ? "animate-spin text-[#2563EB]" : ""}`} />
          </button>

          {/* Create Job CTA */}
          <button
            onClick={onOpenCreateJob}
            className="px-3.5 py-2 rounded-xl bg-[#2563EB] hover:bg-[#1D4ED8] text-white text-xs font-bold transition-all shadow-xs flex items-center gap-1.5 active:scale-[0.98]"
          >
            <Plus className="size-4" />
            <span>Tạo tin tuyển dụng</span>
          </button>
        </div>
      </div>

      {/* Error state banner with retry */}
      {error && (
        <div className="p-4 rounded-2xl bg-rose-50 border border-rose-200 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <AlertCircle className="size-5 text-rose-600 shrink-0" />
            <p className="text-xs font-bold text-rose-800">{error}</p>
          </div>
          <button
            onClick={() => fetchActionHubData(selectedJobId)}
            className="px-3 py-1.5 bg-rose-600 hover:bg-rose-700 text-white rounded-lg text-xs font-bold transition-colors"
          >
            Thử lại
          </button>
        </div>
      )}

      {/* 2. 4 Action KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* KPI 1: Tin đang mở */}
        <div
          onClick={onNavigateToJobsList}
          className="bg-white rounded-2xl border border-slate-200 p-4 shadow-xs hover:border-blue-300 hover:shadow-sm transition-all cursor-pointer group flex flex-col justify-between"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500">Tin đang mở</span>
            <div className="p-2 rounded-xl bg-blue-50 text-[#2563EB] group-hover:bg-[#2563EB] group-hover:text-white transition-colors">
              <Briefcase className="size-4" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline justify-between">
            <span className="text-3xl font-extrabold text-[#1F2937]">
              {loading ? "-" : kpis?.openJobs ?? jobsList.length}
            </span>
            <span className="text-xs font-semibold text-[#2563EB] flex items-center gap-0.5">
              Quản lý JD <ChevronRight className="size-3" />
            </span>
          </div>
        </div>

        {/* KPI 2: Tổng hồ sơ */}
        <div className="bg-white rounded-2xl border border-slate-200 p-4 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500">Tổng hồ sơ</span>
            <div className="p-2 rounded-xl bg-indigo-50 text-indigo-600">
              <Users className="size-4" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline justify-between">
            <span className="text-3xl font-extrabold text-[#1F2937]">
              {loading ? "-" : kpis?.totalApplications ?? 0}
            </span>
            <span className="text-xs text-slate-400">Hồ sơ đã nộp</span>
          </div>
        </div>

        {/* KPI 3: CẦN XỬ LÝ (ƯU TIÊN) */}
        <div className="bg-white rounded-2xl border-2 border-amber-300 p-4 shadow-xs flex flex-col justify-between bg-gradient-to-br from-amber-50/50 to-white">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1.5">
              <span className="text-xs font-bold uppercase tracking-wider text-amber-900">Cần xử lý</span>
              <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-amber-500 text-white">
                ƯU TIÊN
              </span>
            </div>
            <div className="p-2 rounded-xl bg-amber-500 text-white">
              <Flame className="size-4" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline justify-between">
            <span className="text-3xl font-black text-amber-950">
              {loading ? "-" : kpis?.pendingActions ?? pendingActions.length}
            </span>
            <span className="text-xs font-bold text-amber-800">
              {aiReviewActions.length > 0 ? `${aiReviewActions.length} bài AI cần HR chấm` : "CV mới & Cần review"}
            </span>
          </div>
        </div>

        {/* KPI 4: Phỏng vấn sắp tới */}
        <div
          onClick={onNavigateToInterviews}
          className="bg-white rounded-2xl border border-slate-200 p-4 shadow-xs hover:border-emerald-300 hover:shadow-sm transition-all cursor-pointer group flex flex-col justify-between"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500">Phỏng vấn sắp tới</span>
            <div className="p-2 rounded-xl bg-emerald-50 text-emerald-600 group-hover:bg-emerald-600 group-hover:text-white transition-colors">
              <Calendar className="size-4" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline justify-between">
            <span className="text-3xl font-extrabold text-[#1F2937]">
              {loading ? "-" : kpis?.upcomingInterviews ?? upcomingInterviews.length}
            </span>
            <span className="text-xs font-semibold text-emerald-600 flex items-center gap-0.5">
              {todayInterviews.length > 0 ? `${todayInterviews.length} ca hôm nay` : "Xem lịch"} <ChevronRight className="size-3" />
            </span>
          </div>
        </div>
      </div>

      {/* 3. 🔔 PHỎNG VẤN HÔM NAY (TODAY'S INTERVIEW BANNER) */}
      {loading ? (
        <div className="h-20 bg-white rounded-2xl border border-slate-200 animate-pulse p-4 flex items-center gap-4">
          <div className="size-10 rounded-xl bg-slate-200"></div>
          <div className="space-y-2 flex-1">
            <div className="h-4 bg-slate-200 rounded w-1/4"></div>
            <div className="h-3 bg-slate-100 rounded w-1/2"></div>
          </div>
        </div>
      ) : todayInterviews.length > 0 ? (
        <div className="p-4 rounded-2xl bg-gradient-to-r from-blue-700 to-[#2563EB] text-white shadow-xs space-y-3">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-xl bg-white/20 backdrop-blur-xs text-white shrink-0">
                <Calendar className="size-5 text-amber-300" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h2 className="font-extrabold text-sm text-white">LỊCH PHỎNG VẤN HÔM NAY</h2>
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-amber-400 text-amber-950">
                    {todayInterviews.length} CA SẮP DIỄN RA
                  </span>
                </div>
                <p className="text-xs text-blue-100 mt-0.5">
                  Các buổi phỏng vấn diễn ra trong ngày hôm nay. Hãy sẵn sàng trước giờ hẹn.
                </p>
              </div>
            </div>
            <button
              onClick={onNavigateToInterviews}
              className="px-3.5 py-1.5 rounded-xl bg-white text-[#2563EB] hover:bg-blue-50 font-bold text-xs shadow-2xs transition-all flex items-center justify-center gap-1.5 shrink-0 self-start sm:self-auto"
            >
              Xem không gian Lịch phỏng vấn <ArrowRight className="size-3" />
            </button>
          </div>

          {/* List of today interviews */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2.5 pt-1">
            {todayInterviews.map((it: UpcomingInterviewItem) => {
              const timeStr = format(parseISO(it.scheduledAt), "HH:mm");
              const isVideo = it.type === "ONLINE" || it.locationOrLink?.startsWith("http");

              return (
                <div
                  key={it.id}
                  className="bg-white/10 backdrop-blur-md border border-white/20 rounded-xl p-3 text-white flex items-center justify-between gap-2"
                >
                  <div className="flex items-center gap-2.5 min-w-0">
                    <div className="size-8 rounded-full bg-white/20 flex items-center justify-center font-bold text-xs text-white shrink-0 border border-white/30">
                      {it.candidate.avatarUrl ? (
                        <img src={it.candidate.avatarUrl} alt={it.candidate.fullName} className="size-full rounded-full object-cover" />
                      ) : (
                        it.candidate.fullName.charAt(0).toUpperCase()
                      )}
                    </div>
                    <div className="min-w-0">
                      <p className="font-bold text-xs truncate text-white">{it.candidate.fullName}</p>
                      <p className="text-[11px] text-blue-100 truncate">{it.job.title}</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    <span className="font-mono text-xs font-bold px-2 py-0.5 rounded bg-amber-400 text-amber-950">
                      {timeStr}
                    </span>
                    {isVideo && it.locationOrLink && (
                      <a
                        href={it.locationOrLink}
                        target="_blank"
                        rel="noreferrer"
                        className="px-2 py-1 rounded-lg bg-white text-[#2563EB] hover:bg-blue-50 font-bold text-[10px] flex items-center gap-1 transition-colors shadow-2xs"
                      >
                        <Video className="size-3" /> Meet
                      </a>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      ) : (
        <div className="bg-white rounded-2xl border border-slate-200 p-4 shadow-xs flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-emerald-50 text-emerald-600 shrink-0">
              <CheckCircle2 className="size-5" />
            </div>
            <div>
              <p className="text-xs font-bold text-[#1F2937]">✓ Hôm nay không có lịch phỏng vấn cần thực hiện</p>
              <p className="text-[11px] text-slate-500">Bạn có thể tập trung vào việc sàng lọc hồ sơ và chấm điểm bài phỏng vấn AI trong hàng việc bên dưới.</p>
            </div>
          </div>
          <button
            onClick={onNavigateToInterviews}
            className="px-3.5 py-1.5 rounded-xl border border-slate-200 bg-slate-50 hover:bg-[#EFF6FF] hover:border-blue-200 hover:text-[#2563EB] text-slate-700 text-xs font-bold transition-all shrink-0"
          >
            Mở Lịch phỏng vấn →
          </button>
        </div>
      )}

      {/* 4. MAIN ACTION WORKSPACE: 2 COLUMNS (8 COLS LEFT / 4 COLS RIGHT) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left Column (8 cols): Hàng việc cần HR hành động & Hàng đợi Job */}
        <div className="lg:col-span-8 space-y-6">

          {/* CARD A: HÀNG VIỆC CẦN HR HÀNH ĐỘNG (STRICTLY 2-LINE SCANNING) */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
            <div className="p-4 border-b border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="font-bold text-sm text-[#1F2937]">Hàng việc cần HR hành động</h3>
                  <span className="px-2 py-0.5 rounded-full text-xs font-mono font-bold bg-amber-100 text-amber-900 border border-amber-200">
                    {pendingActions.length} tác vụ
                  </span>
                </div>
                <p className="text-xs text-slate-500 mt-0.5">
                  Bao gồm bài phỏng vấn AI chờ chấm điểm, hồ sơ mới nộp và yêu cầu đổi lịch
                </p>
              </div>

              {/* Filter tabs */}
              <div className="flex items-center gap-1 bg-slate-100 p-0.5 rounded-xl text-[11px] font-bold text-slate-600">
                <button
                  onClick={() => setCandidateFilterTab("all")}
                  className={`px-2.5 py-1 rounded-lg transition-all ${
                    candidateFilterTab === "all" ? "bg-white text-[#2563EB] shadow-2xs" : "hover:text-slate-900"
                  }`}
                >
                  Tất cả ({pendingActions.length})
                </button>
                <button
                  onClick={() => setCandidateFilterTab("ai_review")}
                  className={`px-2.5 py-1 rounded-lg transition-all ${
                    candidateFilterTab === "ai_review" ? "bg-white text-[#2563EB] shadow-2xs" : "hover:text-slate-900"
                  }`}
                >
                  Bài AI chờ chấm ({aiReviewActions.length})
                </button>
                <button
                  onClick={() => setCandidateFilterTab("new_apply")}
                  className={`px-2.5 py-1 rounded-lg transition-all ${
                    candidateFilterTab === "new_apply" ? "bg-white text-[#2563EB] shadow-2xs" : "hover:text-slate-900"
                  }`}
                >
                  CV mới ({newApplyActions.length})
                </button>
                <button
                  onClick={() => setCandidateFilterTab("reschedule")}
                  className={`px-2.5 py-1 rounded-lg transition-all ${
                    candidateFilterTab === "reschedule" ? "bg-white text-[#2563EB] shadow-2xs" : "hover:text-slate-900"
                  }`}
                >
                  Đổi lịch ({rescheduleActions.length})
                </button>
              </div>
            </div>

            {/* Candidate list items (strictly 2 lines each) */}
            {filteredCandidates.length > 0 ? (
              <div className="divide-y divide-slate-100 text-xs">
                {filteredCandidates.map((cand) => {
                  const isAiReview = cand.actionType === 'AI_INTERVIEW_REVIEW';
                  const isReschedule = cand.actionType === 'RESCHEDULE_REQUEST';
                  const isNewApply = cand.actionType === 'NEW_APPLICATION';

                  return (
                    <div
                      key={cand.applicationId}
                      className={`p-4 transition-colors flex flex-col sm:flex-row sm:items-center justify-between gap-3 ${
                        isAiReview ? "bg-blue-50/20 hover:bg-blue-50/50" : isReschedule ? "bg-violet-50/20 hover:bg-violet-50/50" : "hover:bg-slate-50/70"
                      }`}
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        {/* Avatar */}
                        <div className="size-10 rounded-full bg-blue-100 text-[#2563EB] font-extrabold text-sm flex items-center justify-center border border-blue-200 shrink-0">
                          {cand.avatarUrl ? (
                            <img src={cand.avatarUrl} alt={cand.candidateName} className="size-full rounded-full object-cover" />
                          ) : (
                            cand.candidateName.charAt(0).toUpperCase()
                          )}
                        </div>

                        {/* 2-Line Body */}
                        <div className="min-w-0">
                          {/* Line 1: Name + Status Badge + Time */}
                          <div className="flex items-center gap-2 flex-wrap">
                            <span 
                              onClick={() => onNavigateToApplication(cand.applicationId, cand.jobId)}
                              className="font-bold text-[#1F2937] hover:text-[#2563EB] cursor-pointer transition-colors"
                            >
                              {cand.candidateName}
                            </span>

                            {isAiReview && (
                              <span className="px-2 py-0.5 rounded bg-blue-100 text-[#2563EB] font-bold text-[10px]">
                                {cand.actionLabel}
                              </span>
                            )}

                            {isReschedule && (
                              <span className="px-2 py-0.5 rounded bg-violet-100 text-violet-800 font-bold text-[10px]">
                                {cand.actionLabel}
                              </span>
                            )}

                            {isNewApply && cand.aiScore && cand.aiScore >= 80 && (
                              <span className="font-mono px-2 py-0.5 rounded bg-emerald-50 text-emerald-700 border border-emerald-200 font-bold text-[10px]">
                                {cand.actionLabel}
                              </span>
                            )}

                            {isNewApply && (!cand.aiScore || cand.aiScore < 80) && (
                              <span className="px-2 py-0.5 rounded bg-slate-100 text-slate-600 font-bold text-[10px]">
                                {cand.actionLabel}
                              </span>
                            )}

                            <span className="text-[10px] text-slate-400">
                              · {new Date(cand.appliedAt).toLocaleDateString("vi-VN")}
                            </span>
                          </div>

                          {/* Line 2: Role applied & Key details */}
                          <p className="text-slate-600 mt-0.5 truncate">
                            Vị trí: <strong>{cand.jobTitle}</strong>
                            {isReschedule && cand.rescheduleNote && (
                              <span className="text-violet-700 font-medium ml-1">· Lý do: {cand.rescheduleNote}</span>
                            )}
                          </p>
                        </div>
                      </div>

                      {/* Right Action Buttons */}
                      <div className="shrink-0 self-end sm:self-center flex items-center gap-2">
                        {isAiReview && (
                          <button
                            onClick={() => onNavigateToApplication(cand.applicationId, cand.jobId)}
                            className="px-3.5 py-2 rounded-xl bg-[#2563EB] hover:bg-[#1D4ED8] text-white font-bold text-xs shadow-xs transition-all flex items-center gap-1.5 active:scale-[0.98]"
                          >
                            <Play className="size-3.5 fill-current" />
                            <span>Xem video & Chấm điểm</span>
                          </button>
                        )}

                        {isReschedule && (
                          <>
                            <button
                              onClick={() => onNavigateToApplication(cand.applicationId, cand.jobId)}
                              className="px-3 py-1.5 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 font-bold text-xs text-slate-700 transition-colors"
                            >
                              Đổi giờ khác
                            </button>
                            <button
                              onClick={onNavigateToInterviews}
                              className="px-3 py-1.5 rounded-xl bg-violet-600 hover:bg-violet-700 text-white font-bold text-xs transition-colors"
                            >
                              Xác nhận giờ mới
                            </button>
                          </>
                        )}

                        {isNewApply && (
                          <>
                            <button
                              onClick={() => onNavigateToApplication(cand.applicationId, cand.jobId)}
                              className="px-3 py-1.5 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 font-bold text-xs text-slate-700 transition-colors"
                            >
                              Xem hồ sơ 360°
                            </button>
                            <button
                              onClick={() => onNavigateToApplication(cand.applicationId, cand.jobId)}
                              className="px-3 py-1.5 rounded-xl bg-[#2563EB] hover:bg-[#1D4ED8] text-white font-bold text-xs transition-colors"
                            >
                              Lên lịch phỏng vấn
                            </button>
                          </>
                        )}

                        {!isAiReview && !isReschedule && !isNewApply && (
                          <button
                            onClick={() => onNavigateToApplication(cand.applicationId, cand.jobId)}
                            className="px-3 py-1.5 rounded-xl bg-[#2563EB] hover:bg-[#1D4ED8] text-white font-bold text-xs transition-colors"
                          >
                            Xem hồ sơ
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="p-8 text-center flex flex-col items-center justify-center space-y-2">
                <div className="size-10 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center">
                  <CheckCircle2 className="size-5" />
                </div>
                <h4 className="text-sm font-bold text-[#1F2937]">Không có hồ sơ nào cần xử lý trong mục này</h4>
                <p className="text-xs text-slate-500 max-w-sm">
                  Tất cả các hồ sơ và bài phỏng vấn AI đã được đánh giá. Bạn có thể kiểm tra các tab khác hoặc tạo thêm bài tuyển dụng mới.
                </p>
              </div>
            )}
          </div>

          {/* CARD B: TIẾN ĐỘ BÀI TUYỂN DỤNG ĐANG MỞ (JOB PIPELINE) */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
            <div className="p-4 border-b border-slate-200 flex items-center justify-between">
              <div>
                <h3 className="font-bold text-sm text-[#1F2937]">Tiến độ bài tuyển dụng đang mở ({filteredQueue.length} vị trí)</h3>
                <p className="text-xs text-slate-500 mt-0.5">Khối lượng hồ sơ thực tế và tình trạng xử lý theo từng bài đăng</p>
              </div>
              <button
                onClick={onNavigateToJobsList}
                className="text-xs font-bold text-[#2563EB] hover:underline flex items-center gap-1"
              >
                Xem toàn bộ JD <ChevronRight className="size-3.5" />
              </button>
            </div>

            {loading ? (
              <div className="p-4 space-y-3">
                {[1, 2].map((i) => (
                  <div key={i} className="h-24 bg-slate-100 rounded-xl animate-pulse"></div>
                ))}
              </div>
            ) : filteredQueue.length > 0 ? (
              <div className="divide-y divide-slate-100">
                {filteredQueue.map((job: ActionQueueItem) => {
                  return (
                    <div key={job.jobId} className="p-5 hover:bg-slate-50/50 transition-colors">
                      <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
                        <div className="space-y-2 flex-1">
                          <div className="flex items-center gap-2">
                            <span className="font-mono text-[10px] font-extrabold px-2 py-0.5 rounded bg-blue-50 text-[#2563EB] border border-blue-100">
                              {job.jobCode}
                            </span>
                            <span className="text-xs font-semibold text-slate-500">{job.departmentName}</span>
                          </div>
                          <h4 
                            onClick={() => onNavigateToJob(job.jobId, "candidates")}
                            className="font-bold text-sm text-[#1F2937] hover:text-[#2563EB] cursor-pointer transition-colors"
                          >
                            {job.title}
                          </h4>

                          {/* Workload badges */}
                          <div className="flex flex-wrap items-center gap-2 pt-1">
                            {job.highMatchCount > 0 && (
                              <span className="inline-flex items-center gap-1 text-xs font-bold px-2.5 py-1 rounded-lg bg-emerald-50 text-emerald-700 border border-emerald-200">
                                <Sparkles className="size-3 text-emerald-600" />
                                {job.highMatchCount} ứng viên AI khớp cao (≥{job.autoShortlistThreshold}%)
                              </span>
                            )}
                            {job.pendingReviewCount > 0 && (
                              <span className="inline-flex items-center gap-1 text-xs font-bold px-2.5 py-1 rounded-lg bg-blue-50 text-blue-700 border border-blue-200">
                                <Video className="size-3 text-[#2563EB]" />
                                {job.pendingReviewCount} bài AI / CV chờ HR chấm
                              </span>
                            )}
                            {job.rescheduleCount > 0 && (
                              <span className="inline-flex items-center gap-1 text-xs font-bold px-2.5 py-1 rounded-lg bg-violet-50 text-violet-700 border border-violet-200">
                                <Calendar className="size-3 text-violet-600" />
                                {job.rescheduleCount} ứng viên xin đổi lịch
                              </span>
                            )}
                            {job.highMatchCount === 0 && job.pendingReviewCount === 0 && job.rescheduleCount === 0 && (
                              <span className="text-xs font-medium text-slate-400 px-2 py-0.5 rounded bg-slate-50 border border-slate-200">
                                Đã xử lý hết hồ sơ cần duyệt
                              </span>
                            )}
                          </div>
                        </div>

                        <div className="flex sm:flex-col items-center sm:items-end justify-between sm:justify-start gap-2 shrink-0">
                          <span className="text-xs text-slate-400 font-medium">
                            {job.totalApplications} hồ sơ đã nộp
                          </span>
                          <button
                            onClick={() => onNavigateToJob(job.jobId, "candidates")}
                            className="px-4 py-2 rounded-xl bg-[#2563EB] hover:bg-[#1D4ED8] text-white text-xs font-bold transition-all flex items-center gap-1.5 shadow-xs active:scale-[0.98]"
                          >
                            <span>Xem danh sách ứng viên</span>
                            <ArrowRight className="size-3.5" />
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="p-8 text-center text-slate-500 text-xs">
                Không tìm thấy bài đăng nào phù hợp với bộ lọc.
              </div>
            )}
          </div>

        </div>

        {/* Right Column (4 cols): Lịch sắp tới, Chất lượng AI & Hướng dẫn */}
        <div className="lg:col-span-4 space-y-6">

          {/* Widget 1: Lịch phỏng vấn sắp tới */}
          <div className="bg-white rounded-2xl border border-slate-200 p-4 shadow-xs space-y-3">
            <div className="flex items-center justify-between pb-2 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <Calendar className="size-4 text-[#2563EB]" />
                <h3 className="font-extrabold text-sm text-[#1F2937]">LỊCH SẮP TỚI ({upcomingInterviews.length})</h3>
              </div>
              <button
                onClick={onNavigateToInterviews}
                className="text-xs font-bold text-[#2563EB] hover:underline"
              >
                Xem tất cả
              </button>
            </div>

            {upcomingInterviews.length > 0 ? (
              <div className="space-y-2.5">
                {upcomingInterviews.map((it: UpcomingInterviewItem) => {
                  const dateObj = parseISO(it.scheduledAt);
                  const dateStr = format(dateObj, "dd/MM · HH:mm");

                  return (
                    <div
                      key={it.id}
                      onClick={onNavigateToInterviews}
                      className="p-3 rounded-xl border border-slate-200 hover:border-blue-300 transition-colors cursor-pointer space-y-2 group"
                    >
                      <div className="flex items-center justify-between text-xs">
                        <span className="font-mono font-bold px-2 py-0.5 rounded-lg bg-blue-50 text-[#2563EB] border border-blue-100">
                          {dateStr}
                        </span>
                        <span className="text-[11px] text-slate-400 font-medium flex items-center gap-1">
                          <Clock className="size-3" /> {it.durationMinutes}p
                        </span>
                      </div>
                      <div className="flex items-center gap-2.5">
                        <div className="size-8 rounded-full bg-slate-100 text-slate-600 font-bold text-xs flex items-center justify-center border border-slate-200 shrink-0">
                          {it.candidate.avatarUrl ? (
                            <img src={it.candidate.avatarUrl} alt={it.candidate.fullName} className="size-full rounded-full object-cover" />
                          ) : (
                            it.candidate.fullName.charAt(0).toUpperCase()
                          )}
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className="font-bold text-xs text-[#1F2937] truncate group-hover:text-[#2563EB] transition-colors">
                            {it.candidate.fullName}
                          </p>
                          <p className="text-[11px] text-slate-500 truncate">
                            {it.job.title}
                          </p>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="p-6 text-center space-y-1">
                <Calendar className="size-6 text-slate-300 mx-auto" />
                <p className="text-xs font-bold text-slate-600">Không có lịch phỏng vấn sắp tới</p>
                <p className="text-[11px] text-slate-400">Các buổi phỏng vấn đã lên lịch sẽ hiển thị tại đây.</p>
              </div>
            )}
          </div>

          {/* Widget 2: Phân bổ chất lượng hồ sơ AI đã lọc */}
          <div className="bg-white rounded-2xl border border-slate-200 p-4 shadow-xs space-y-3">
            <div className="flex items-center justify-between pb-2 border-b border-slate-100">
              <h3 className="font-extrabold text-sm text-[#1F2937]">Chất lượng hồ sơ AI đã lọc</h3>
              <span className="text-xs font-mono font-bold text-slate-500">
                {kpis?.totalApplications ?? 0} hồ sơ
              </span>
            </div>

            {analyticsData?.scoreDistribution && analyticsData.scoreDistribution.length > 0 ? (
              <div className="space-y-2 text-xs">
                {analyticsData.scoreDistribution.map((item) => (
                  <div key={item.range}>
                    <div className="flex justify-between text-[11px] font-semibold text-slate-600 mb-1">
                      <span>{item.label} ({item.range}%)</span>
                      <span className="font-mono">{item.count} hồ sơ ({item.percentage}%)</span>
                    </div>
                    <div className="w-full bg-slate-100 h-1.5 rounded-full overflow-hidden">
                      <div
                        className="h-full rounded-full transition-all"
                        style={{ width: `${item.percentage}%`, backgroundColor: item.color }}
                      ></div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="space-y-2 text-xs">
                <div>
                  <div className="flex justify-between text-[11px] font-semibold text-slate-600 mb-1">
                    <span>Xuất sắc (90 - 100%)</span>
                    <span className="font-mono">Khớp kỹ năng cao</span>
                  </div>
                  <div className="w-full bg-slate-100 h-1.5 rounded-full overflow-hidden">
                    <div className="bg-emerald-500 h-full rounded-full" style={{ width: "35%" }}></div>
                  </div>
                </div>
                <div>
                  <div className="flex justify-between text-[11px] font-semibold text-slate-600 mb-1">
                    <span>Tốt (80 - 89%)</span>
                    <span className="font-mono">Đạt ngưỡng Shortlist</span>
                  </div>
                  <div className="w-full bg-slate-100 h-1.5 rounded-full overflow-hidden">
                    <div className="bg-blue-500 h-full rounded-full" style={{ width: "45%" }}></div>
                  </div>
                </div>
                <div>
                  <div className="flex justify-between text-[11px] font-semibold text-slate-600 mb-1">
                    <span>Khá & Cần xem xét (&lt;80%)</span>
                    <span className="font-mono">Cần HR đánh giá</span>
                  </div>
                  <div className="w-full bg-slate-100 h-1.5 rounded-full overflow-hidden">
                    <div className="bg-amber-400 h-full rounded-full" style={{ width: "20%" }}></div>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Widget 3: Ghi chú quy trình phỏng vấn AI cho HR */}
          <div className="p-4 rounded-2xl bg-[#EFF6FF] border border-blue-200 text-xs text-blue-900 space-y-1.5">
            <div className="flex items-center gap-1.5 font-bold text-xs text-[#2563EB]">
              <Info className="size-4" />
              <span>Quy trình Chấm điểm Phỏng vấn AI</span>
            </div>
            <p className="text-[11px] leading-relaxed text-slate-600">
              Hệ thống AI tự động ghi hình và chuyển giọng nói thành văn bản (transcript). 
              <strong>HR là người trực tiếp xem video</strong>, chấm điểm từng câu hỏi từ 1 - 10, đưa ra nhận xét chung và quyết định ứng viên đạt hay không đạt qua vòng.
            </p>
          </div>

        </div>
      </div>
    </div>
  );
}
