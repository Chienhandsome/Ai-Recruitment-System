/* eslint-disable @next/next/no-img-element */
"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import {
  Briefcase,
  Users,
  BrainCircuit,
  Sparkles,
  Search,
  Plus,
  TrendingUp,
  X,
  Bot,
  Zap,
  LogOut,
  User,
  Calendar,
  Clock,
  Video,
  Award,
  CheckCircle2,
  RotateCw,
  Filter,
  AlertCircle,
  ArrowRight,
  ChevronRight,
  ExternalLink,
  Layers,
  Flame,
} from "lucide-react";

import { CreateJobWizard } from "./CreateJobWizard";
import { Candidate360Modal } from "./Candidate360Modal";
import { RecruiterApplicationsRanking } from "./applications/RecruiterApplicationsRanking";
import { RecruiterInterviewsWorkspace } from "./interviews/RecruiterInterviewsWorkspace";
import { RecruiterNotificationBell } from "./RecruiterNotificationBell";
import { RecruiterProfileModal } from "./RecruiterProfileModal";
import { JobsWorkspace } from "./JobsWorkspace";
import {
  getRecruiterApplications,
  getRecruiterActionHub,
  getRecruiterJobs,
  type RecruiterProfileData,
  type RecruiterDashboardStats,
  type RecruiterActionHubData,
  type ActionQueueItem,
  type UpcomingInterviewItem,
  type JobPostingData,
} from "@/lib/recruiter-api";
import { type InterviewData } from "@/lib/interview-api";
import { isToday, parseISO, format } from "date-fns";
import { createClient } from "@/lib/supabase/client";

// Types
export interface Candidate {
  id: string;
  name: string;
  avatar: string;
  roleApplied: string;
  matchScore: number;
  skillsFit: { skill: string; fitScore: number }[];
  experienceYears: number;
  aiSummary: string;
  status: "SHORTLISTED" | "SCREENING" | "REJECTED" | "NEW";
  appliedDate: string;
  pros: string[];
  cons: string[];
  education: string;
  radarScores: {
    skills: number;
    experience: number;
    education: number;
    cultureFit: number;
  };
}

export function RecruiterWorkspace({
  profile: initialProfile,
  stats,
  token,
  defaultTab = "dashboard",
}: {
  profile: RecruiterProfileData | null;
  stats: RecruiterDashboardStats | null;
  token: string;
  defaultTab?: "dashboard" | "jobs" | "interviews" | "candidates";
}) {
  const router = useRouter();
  const [profile, setProfile] = useState<RecruiterProfileData | null>(initialProfile);
  const [activeTab, setActiveTab] = useState<"dashboard" | "jobs" | "interviews" | "candidates">(defaultTab);
  const [isCreateJobOpen, setIsCreateJobOpen] = useState(false);
  const [isProfileModalOpen, setIsProfileModalOpen] = useState(false);
  const [selectedCandidateForReport, setSelectedCandidateForReport] = useState<Candidate | null>(null);
  const [topCandidates, setTopCandidates] = useState<Candidate[]>([]);
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);

  useEffect(() => {
    setProfile(initialProfile);
  }, [initialProfile]);

  useEffect(() => {
    if (!token) return;
    getRecruiterApplications(token, { page: 1, limit: 5 })
      .then((response) => {
        setTopCandidates(
          response.data.map((application) => {
            const score = Math.round(application.latestAiResult?.overallScore ?? 0);
            const status: Candidate["status"] =
              application.currentStage === "SHORTLISTED"
                ? "SHORTLISTED"
                : application.currentStage === "REJECTED"
                  ? "REJECTED"
                  : application.currentStage === "SCREENING"
                    ? "SCREENING"
                    : "NEW";
            return {
              id: application.id,
              name: application.candidate.fullName || "Ứng viên",
              avatar: application.candidate.avatarUrl || "/file.svg",
              roleApplied: application.job.title,
              matchScore: score,
              skillsFit: [],
              experienceYears: 0,
              aiSummary: application.latestAiResult ? `Match ${application.latestAiResult.matchLevel} — ${score}%` : "Chưa có phân tích từ AI",
              status,
              appliedDate: new Date(application.appliedAt).toLocaleDateString("vi-VN"),
              pros: [],
              cons: [],
              education: "Chưa tổng hợp",
              radarScores: {
                skills: score,
                experience: score,
                education: score,
                cultureFit: score,
              },
            };
          }),
        );
      })
      .catch((error) => console.error("Failed to load top applications", error));
  }, [token]);

  const [targetJobId, setTargetJobId] = useState<string | null>(null);
  const [targetJobTab, setTargetJobTab] = useState<"info" | "candidates">("candidates");

  useEffect(() => {
    if (defaultTab) {
      setActiveTab(defaultTab);
    }
  }, [defaultTab]);

  const handleProfileUpdated = (updated: RecruiterProfileData) => {
    setProfile(updated);
  };

  const handleLogout = async () => {
    const supabase = createClient();
    await supabase.auth.signOut();
    window.location.href = "/login";
  };

  const handleNavigateToJob = (jobId: string, initialTab: "info" | "candidates" = "candidates") => {
    setTargetJobId(jobId);
    setTargetJobTab(initialTab);
    setActiveTab("jobs");
  };

  return (
    <div className="min-h-screen bg-[#F8FAFC]">
      {/* Top Navbar */}
      <header className="sticky top-0 z-30 bg-white/80 backdrop-blur-md border-b border-[#E2E8F0]">
        <div className="max-w-[1440px] mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-8">
            {/* Logo */}
            <div className="flex items-center gap-3">
              <div className="size-10 rounded-xl bg-gradient-to-tr from-[#2563EB] to-indigo-500 flex items-center justify-center text-white shadow-md shadow-blue-500/20">
                <BrainCircuit className="size-6" />
              </div>
              <div>
                <span className="font-extrabold text-lg text-[#0F172A] tracking-tight">SmartRecruit</span>
                <span className="text-xs font-mono text-[#2563EB] font-bold ml-1.5 px-1.5 py-0.5 bg-blue-50 rounded">AI HR</span>
              </div>
            </div>

            {/* Navigation Tabs */}
            <nav className="flex items-center gap-1 bg-[#EFF6FF] p-1 rounded-xl border border-blue-100">
              <button
                onClick={() => {
                  setTargetJobId(null);
                  setActiveTab("dashboard");
                }}
                className={`px-4 py-2 text-xs font-bold rounded-lg transition-all ${
                  activeTab === "dashboard"
                    ? "bg-[#2563EB] text-white shadow-md"
                    : "text-[#1F2937] hover:text-[#2563EB] hover:bg-white/60"
                }`}
              >
                Dashboard
              </button>
              <button
                onClick={() => {
                  setTargetJobId(null);
                  setActiveTab("jobs");
                }}
                className={`px-4 py-2 text-xs font-bold rounded-lg transition-all ${
                  activeTab === "jobs"
                    ? "bg-[#2563EB] text-white shadow-md"
                    : "text-[#1F2937] hover:text-[#2563EB] hover:bg-white/60"
                }`}
              >
                Quản lý Bài đăng
              </button>
              <button
                onClick={() => {
                  setTargetJobId(null);
                  setActiveTab("interviews");
                }}
                className={`px-4 py-2 text-xs font-bold rounded-lg transition-all flex items-center gap-1.5 ${
                  activeTab === "interviews" || activeTab === "candidates"
                    ? "bg-[#2563EB] text-white shadow-md"
                    : "text-[#1F2937] hover:text-[#2563EB] hover:bg-white/60"
                }`}
              >
                <Calendar className="w-3.5 h-3.5" />
                Lịch phỏng vấn
              </button>
            </nav>
          </div>

          {/* Action Controls */}
          <div className="flex items-center gap-3">
            {/* Notification Bell for Recruiter (with today's interview reminders) */}
            <RecruiterNotificationBell
              token={token}
              onNavigateToInterviews={() => setActiveTab("interviews")}
            />

            <div className="h-8 w-[1px] bg-[#E2E8F0] mx-1"></div>

            <div className="flex items-center gap-3">
              <div className="relative">
                <button 
                  onClick={() => setIsUserMenuOpen(!isUserMenuOpen)}
                  className="flex items-center gap-3 focus:outline-none"
                >
                  <div className="size-9 rounded-full bg-[#E2E8F0] overflow-hidden border border-[#CBD5E1] flex items-center justify-center font-bold text-[#64748B] hover:ring-2 hover:ring-[#2563EB]/20 transition-all">
                    {profile?.user?.avatarUrl ? (
                      <img src={profile.user.avatarUrl} alt="Avatar" className="size-full object-cover" />
                    ) : (
                      profile?.user?.fullName ? profile.user.fullName.charAt(0).toUpperCase() : "R"
                    )}
                  </div>
                  <div className="hidden md:block text-left">
                    <p className="text-xs font-bold text-[#0F172A] leading-tight">
                      {profile?.user?.fullName ?? "Recruiter"}
                    </p>
                    <p className="text-[10px] text-[#64748B]">{profile?.title ?? "Hiring Team"}</p>
                  </div>
                </button>

                {/* User Dropdown */}
                {isUserMenuOpen && (
                  <>
                    <div 
                      className="fixed inset-0 z-40" 
                      onClick={() => setIsUserMenuOpen(false)}
                    ></div>
                    <div className="absolute right-0 mt-3 w-56 bg-white rounded-xl shadow-lg border border-[#E2E8F0] z-50 py-1.5 animate-in fade-in zoom-in-95 duration-200">
                      <div className="px-4 py-2 border-b border-[#E2E8F0]">
                        <p className="text-sm font-bold text-[#0F172A] truncate">{profile?.user?.fullName ?? "Recruiter"}</p>
                        <p className="text-xs text-[#64748B] truncate">{profile?.user?.email ?? ""}</p>
                      </div>
                      <div className="p-1.5">
                        <button 
                          onClick={() => {
                            setIsUserMenuOpen(false);
                            setIsProfileModalOpen(true);
                          }}
                          className="w-full flex items-center gap-2 px-3 py-2 text-sm text-[#0F172A] hover:bg-[#F8FAFC] rounded-lg transition-colors"
                        >
                          <User className="size-4 text-[#64748B]" />
                          Hồ sơ cá nhân
                        </button>
                        <button 
                          onClick={handleLogout}
                          className="w-full flex items-center gap-2 px-3 py-2 text-sm text-rose-600 hover:bg-rose-50 rounded-lg transition-colors mt-1"
                        >
                          <LogOut className="size-4" />
                          Đăng xuất
                        </button>
                      </div>
                    </div>
                  </>
                )}
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Main Workspace Body */}
      <main className="max-w-[1440px] mx-auto p-6 space-y-6">
        {/* Tab 1: Action-First Dashboard */}
        {activeTab === "dashboard" && (
          <DashboardTab
            token={token}
            onOpenCreateJob={() => setIsCreateJobOpen(true)}
            onNavigateToInterviews={() => setActiveTab("interviews")}
            onNavigateToJob={handleNavigateToJob}
            onNavigateToJobsList={() => {
              setTargetJobId(null);
              setActiveTab("jobs");
            }}
          />
        )}

        {/* Tab 2: Job Management */}
        {activeTab === "jobs" && (
          <JobsWorkspace
            initialData={null}
            token={token}
            selectedJobId={targetJobId}
            initialJobTab={targetJobTab}
            onClearSelectedJob={() => {
              setTargetJobId(null);
              setTargetJobTab("info");
            }}
          />
        )}

        {/* Tab 3: Interviews Workspace */}
        {(activeTab === "interviews" || activeTab === "candidates") && (
          <RecruiterInterviewsWorkspace token={token} />
        )}
      </main>

      {/* Modal: Create Job Wizard */}
      <CreateJobWizard
        isOpen={isCreateJobOpen}
        onClose={() => setIsCreateJobOpen(false)}
        token={token}
        onSuccess={() => { setIsCreateJobOpen(false); router.refresh(); }}
      />

      {/* Modal: Recruiter Profile */}
      <RecruiterProfileModal 
        isOpen={isProfileModalOpen} 
        onClose={() => setIsProfileModalOpen(false)} 
        profile={profile}
        onProfileUpdated={handleProfileUpdated}
      />
    </div>
  );
}

// ==========================================
// 🚀 ACTION-FIRST RECRUITER DASHBOARD TAB
// ==========================================
function DashboardTab({
  token,
  onOpenCreateJob,
  onNavigateToInterviews,
  onNavigateToJob,
  onNavigateToJobsList,
}: {
  token: string;
  onOpenCreateJob: () => void;
  onNavigateToInterviews: () => void;
  onNavigateToJob: (jobId: string, tab?: "info" | "candidates") => void;
  onNavigateToJobsList: () => void;
}) {
  const [selectedJobId, setSelectedJobId] = useState<string>("");
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [jobsList, setJobsList] = useState<JobPostingData[]>([]);
  const [hubData, setHubData] = useState<RecruiterActionHubData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchActionHubData = async (jobId?: string) => {
    if (!token) return;
    setLoading(true);
    setError(null);
    try {
      const [hubRes, jobsRes] = await Promise.all([
        getRecruiterActionHub(token, jobId || undefined),
        jobsList.length === 0 ? getRecruiterJobs(token, { status: "PUBLISHED" }) : Promise.resolve({ data: jobsList }),
      ]);
      setHubData(hubRes);
      if (jobsRes?.data) {
        setJobsList(jobsRes.data);
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

  // Filter action queue by search query
  const filteredQueue = actionQueue.filter((item: ActionQueueItem) => {
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase();
    return item.title.toLowerCase().includes(q) || item.jobCode.toLowerCase().includes(q) || item.departmentName.toLowerCase().includes(q);
  });

  return (
    <div className="space-y-6">
      {/* 1. Header Toolbar: Action-First Focus, Filter & Search */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-4 sm:p-5 rounded-2xl border border-slate-200 shadow-sm">
        <div className="flex items-center gap-3">
          <div className="flex size-10 items-center justify-center rounded-xl bg-[#2563EB] text-white shadow-sm shrink-0">
            <Layers className="size-5" />
          </div>
          <div>
            <h2 className="text-base font-extrabold text-[#1F2937]">
              Dashboard Điều Hành Tuyển Dụng
            </h2>
            <p className="text-xs text-slate-500">
              Hàng đợi xử lý hồ sơ, ứng viên AI khớp cao và lịch phỏng vấn cần hành động
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          {/* Quick Search */}
          <div className="relative min-w-[200px] flex-1 sm:flex-initial">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-3.5 text-slate-400" />
            <input
              type="text"
              placeholder="Tìm kiếm vị trí..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-8 pr-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-100 focus:border-blue-500 font-medium"
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
          className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm hover:border-blue-300 hover:shadow-md transition-all cursor-pointer group flex flex-col justify-between"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500">Tin đang mở</span>
            <div className="p-2.5 rounded-xl bg-blue-50 text-[#2563EB] group-hover:bg-[#2563EB] group-hover:text-white transition-colors">
              <Briefcase className="size-5" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline justify-between">
            <span className="text-3xl font-extrabold text-[#1F2937]">
              {loading ? "-" : kpis?.openJobs ?? 0}
            </span>
            <span className="text-xs font-medium text-slate-400 group-hover:text-[#2563EB] flex items-center gap-1 transition-colors">
              Quản lý JD <ChevronRight className="size-3.5" />
            </span>
          </div>
        </div>

        {/* KPI 2: Tổng hồ sơ */}
        <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500">Tổng hồ sơ</span>
            <div className="p-2.5 rounded-xl bg-indigo-50 text-indigo-600">
              <Users className="size-5" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline justify-between">
            <span className="text-3xl font-extrabold text-[#1F2937]">
              {loading ? "-" : kpis?.totalApplications ?? 0}
            </span>
            <span className="text-xs font-medium text-slate-400">
              Hồ sơ đã nộp
            </span>
          </div>
        </div>

        {/* KPI 3: CẦN XỬ LÝ (QUAN TRỌNG NHẤT) */}
        <div className="bg-gradient-to-br from-amber-50 to-orange-50/60 rounded-2xl border-2 border-amber-300/80 p-5 shadow-sm flex flex-col justify-between relative overflow-hidden">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1.5">
              <span className="text-xs font-extrabold uppercase tracking-wider text-amber-900">Cần xử lý</span>
              <span className="text-[10px] font-extrabold px-2 py-0.5 rounded-full bg-amber-500 text-white animate-pulse">
                ƯU TIÊN
              </span>
            </div>
            <div className="p-2.5 rounded-xl bg-amber-500 text-white shadow-xs">
              <Flame className="size-5" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline justify-between">
            <span className="text-3xl font-black text-amber-950">
              {loading ? "-" : kpis?.pendingActions ?? 0}
            </span>
            <span className="text-xs font-bold text-amber-800">
              CV mới & Chờ HR duyệt
            </span>
          </div>
        </div>

        {/* KPI 4: Phỏng vấn sắp tới */}
        <div 
          onClick={onNavigateToInterviews}
          className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm hover:border-emerald-300 hover:shadow-md transition-all cursor-pointer group flex flex-col justify-between"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500">Phỏng vấn sắp tới</span>
            <div className="p-2.5 rounded-xl bg-emerald-50 text-emerald-600 group-hover:bg-emerald-600 group-hover:text-white transition-colors">
              <Calendar className="size-5" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline justify-between">
            <span className="text-3xl font-extrabold text-[#1F2937]">
              {loading ? "-" : kpis?.upcomingInterviews ?? 0}
            </span>
            <span className="text-xs font-medium text-slate-400 group-hover:text-emerald-600 flex items-center gap-1 transition-colors">
              Xem lịch <ChevronRight className="size-3.5" />
            </span>
          </div>
        </div>
      </div>

      {/* 3. 🔔 PHỎNG VẤN HÔM NAY (TODAY'S INTERVIEW FOCUS) */}
      {loading ? (
        <div className="h-24 bg-white rounded-2xl border border-slate-200 animate-pulse p-4 flex items-center gap-4">
          <div className="size-12 rounded-xl bg-slate-200"></div>
          <div className="space-y-2 flex-1">
            <div className="h-4 bg-slate-200 rounded w-1/4"></div>
            <div className="h-3 bg-slate-100 rounded w-1/2"></div>
          </div>
        </div>
      ) : todayInterviews.length > 0 ? (
        <div className="p-5 rounded-2xl bg-gradient-to-r from-[#1D4ED8] via-[#2563EB] to-indigo-700 text-white shadow-md space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-white/20">
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-xl bg-white/20 backdrop-blur-xs text-white shrink-0">
                <Calendar className="size-6 text-amber-300" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="font-extrabold text-base tracking-tight text-white">
                    🔔 PHỎNG VẤN HÔM NAY
                  </h3>
                  <span className="px-2.5 py-0.5 rounded-full text-xs font-black bg-amber-400 text-amber-950 shadow-xs">
                    {todayInterviews.length} BUỔI HÔM NAY
                  </span>
                </div>
                <p className="text-xs text-blue-100">
                  Các buổi phỏng vấn diễn ra trong ngày hôm nay. Hãy sẵn sàng trước giờ hẹn.
                </p>
              </div>
            </div>
            <button
              onClick={onNavigateToInterviews}
              className="px-4 py-2 rounded-xl bg-white text-[#2563EB] hover:bg-blue-50 font-bold text-xs shadow-sm transition-all flex items-center justify-center gap-1.5 shrink-0"
            >
              Xem không gian Lịch phỏng vấn <ArrowRight className="size-3.5" />
            </button>
          </div>

          {/* List of today interviews */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            {todayInterviews.map((it: UpcomingInterviewItem) => {
              const timeStr = format(parseISO(it.scheduledAt), "HH:mm");
              const isVideo = it.type === "ONLINE" || it.locationOrLink?.startsWith("http");

              return (
                <div
                  key={it.id}
                  className="bg-white/10 backdrop-blur-md border border-white/20 rounded-xl p-3.5 text-white hover:bg-white/15 transition-all flex flex-col justify-between gap-3"
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-center gap-2.5">
                      <div className="size-8 rounded-full bg-white/20 flex items-center justify-center font-bold text-xs border border-white/30 text-white shrink-0">
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
                    <span className="font-mono text-xs font-bold px-2 py-0.5 rounded-lg bg-amber-400 text-amber-950 shrink-0">
                      {timeStr}
                    </span>
                  </div>

                  <div className="flex items-center justify-between pt-2 border-t border-white/10 text-[11px]">
                    <span className="text-blue-200 flex items-center gap-1">
                      <Clock className="size-3" /> {it.durationMinutes} phút
                    </span>
                    {isVideo && it.locationOrLink ? (
                      <a
                        href={it.locationOrLink}
                        target="_blank"
                        rel="noreferrer"
                        className="px-2.5 py-1 rounded-lg bg-white text-[#2563EB] hover:bg-blue-50 font-bold text-[10px] flex items-center gap-1 transition-colors"
                      >
                        <Video className="size-3" /> Vào phòng họp
                      </a>
                    ) : (
                      <span className="text-blue-200 text-[10px] truncate max-w-[140px]">
                        {it.locationOrLink || "Trực tiếp tại VP"}
                      </span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      ) : (
        <div className="bg-white rounded-2xl border border-slate-200 p-4 shadow-sm flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-emerald-50 text-emerald-600">
              <CheckCircle2 className="size-5" />
            </div>
            <div>
              <p className="text-xs font-bold text-[#1F2937]">✓ Hôm nay không có lịch phỏng vấn cần thực hiện</p>
              <p className="text-[11px] text-slate-500">Bạn có thể tập trung vào việc sàng lọc hồ sơ và đánh giá ứng viên AI trong hàng đợi bên dưới.</p>
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

      {/* 4. MAIN ACTION WORKSPACE: 2 COLUMNS */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left Column (8 cols): 🎯 HÀNG ĐỢI CẦN XỬ LÝ (ACTION QUEUE THEO JOB) */}
        <div className="lg:col-span-8 space-y-4">
          <div className="flex items-center justify-between bg-white p-4 rounded-2xl border border-slate-200 shadow-sm">
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-extrabold text-sm text-[#1F2937]">🎯 HÀNG ĐỢI CẦN XỬ LÝ</h3>
                <span className="px-2.5 py-0.5 rounded-full text-xs font-mono font-bold bg-blue-50 text-[#2563EB] border border-blue-200">
                  {filteredQueue.length} vị trí
                </span>
              </div>
              <p className="text-xs text-slate-500 mt-0.5">
                Các bài đăng đang có hồ sơ mới, ứng viên AI khớp cao hoặc đang chờ HR đánh giá
              </p>
            </div>

            <button
              onClick={onOpenCreateJob}
              className="px-3.5 py-2 rounded-xl bg-[#2563EB] hover:bg-[#1D4ED8] text-white text-xs font-bold shadow-sm transition-all flex items-center gap-1.5 shrink-0"
            >
              <Plus className="size-4" /> Tạo tin tuyển dụng
            </button>
          </div>

          {loading ? (
            <div className="space-y-3">
              {[1, 2, 3].map((i) => (
                <div key={i} className="h-32 bg-white rounded-2xl border border-slate-200 animate-pulse p-5">
                  <div className="h-4 bg-slate-200 rounded w-1/3 mb-3"></div>
                  <div className="h-3 bg-slate-100 rounded w-1/2 mb-4"></div>
                  <div className="flex gap-2">
                    <div className="h-6 bg-slate-100 rounded w-24"></div>
                    <div className="h-6 bg-slate-100 rounded w-28"></div>
                  </div>
                </div>
              ))}
            </div>
          ) : filteredQueue.length > 0 ? (
            <div className="space-y-3">
              {filteredQueue.map((job: ActionQueueItem) => {
                const hasPendingWorkload = job.newCount > 0 || job.highMatchCount > 0 || job.pendingReviewCount > 0 || job.rescheduleCount > 0;

                return (
                  <div
                    key={job.jobId}
                    className={`bg-white rounded-2xl border p-5 shadow-sm transition-all hover:shadow-md ${
                      hasPendingWorkload ? "border-slate-200 hover:border-blue-300" : "border-slate-100 opacity-80"
                    }`}
                  >
                    <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
                      <div className="space-y-2 flex-1">
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="font-mono text-[10px] font-extrabold px-2 py-0.5 rounded bg-blue-50 text-[#2563EB] border border-blue-100">
                            {job.jobCode}
                          </span>
                          <span className="text-[11px] font-bold text-slate-500">
                            {job.departmentName}
                          </span>
                        </div>
                        <h4 className="font-bold text-sm text-[#1F2937] hover:text-[#2563EB] transition-colors">
                          {job.title}
                        </h4>

                        {/* Workload Badges */}
                        <div className="flex flex-wrap items-center gap-2 pt-1">
                          {job.newCount > 0 && (
                            <span className="inline-flex items-center gap-1 text-xs font-bold px-2.5 py-1 rounded-lg bg-rose-50 text-rose-700 border border-rose-200">
                              <span className="size-2 rounded-full bg-rose-500 animate-ping"></span>
                              {job.newCount} hồ sơ mới nộp
                            </span>
                          )}

                          {job.highMatchCount > 0 && (
                            <span className="inline-flex items-center gap-1 text-xs font-bold px-2.5 py-1 rounded-lg bg-emerald-50 text-emerald-700 border border-emerald-200">
                              <Sparkles className="size-3 text-emerald-600" />
                              {job.highMatchCount} ứng viên AI khớp cao (≥{job.autoShortlistThreshold}%)
                            </span>
                          )}

                          {job.pendingReviewCount > 0 && (
                            <span className="inline-flex items-center gap-1 text-xs font-bold px-2.5 py-1 rounded-lg bg-amber-50 text-amber-700 border border-amber-200">
                              <AlertCircle className="size-3 text-amber-600" />
                              {job.pendingReviewCount} hồ sơ cần review
                            </span>
                          )}

                          {job.rescheduleCount > 0 && (
                            <span className="inline-flex items-center gap-1 text-xs font-bold px-2.5 py-1 rounded-lg bg-violet-50 text-violet-700 border border-violet-200">
                              <Calendar className="size-3 text-violet-600" />
                              {job.rescheduleCount} ứng viên xin đổi lịch
                            </span>
                          )}

                          {!hasPendingWorkload && (
                            <span className="text-xs font-medium text-slate-400 px-2 py-0.5 rounded bg-slate-50 border border-slate-200">
                              Đã xử lý hết hồ sơ (Tổng {job.totalApplications} hồ sơ)
                            </span>
                          )}
                        </div>
                      </div>

                      {/* Action Button */}
                      <div className="flex sm:flex-col items-center sm:items-end justify-between sm:justify-start gap-2 shrink-0">
                        <span className="text-[11px] text-slate-400 font-medium hidden sm:inline">
                          {job.totalApplications} hồ sơ
                        </span>
                        <button
                          onClick={() => onNavigateToJob(job.jobId, "candidates")}
                          className="w-full sm:w-auto px-4 py-2.5 rounded-xl bg-[#2563EB] hover:bg-[#1D4ED8] text-white text-xs font-bold shadow-sm transition-all flex items-center justify-center gap-1.5 active:scale-[0.98]"
                        >
                          <span>Xem ứng viên & Chấm điểm AI</span>
                          <ArrowRight className="size-3.5" />
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="bg-white rounded-2xl border border-slate-200 p-8 text-center flex flex-col items-center justify-center space-y-3">
              <div className="p-3.5 bg-emerald-50 rounded-full text-emerald-600">
                <CheckCircle2 className="size-8" />
              </div>
              <h4 className="text-sm font-bold text-[#1F2937]">✓ Bạn đã xử lý hết hồ sơ cần review!</h4>
              <p className="text-xs text-slate-500 max-w-md">
                Hiện tại không có ứng viên nào đang chờ HR duyệt. Bạn có thể tạo thêm bài tuyển dụng mới hoặc kiểm tra lại lịch phỏng vấn.
              </p>
              <button
                onClick={onOpenCreateJob}
                className="mt-2 px-4 py-2 bg-[#2563EB] text-white font-bold text-xs rounded-xl hover:bg-[#1D4ED8] transition-colors"
              >
                + Tạo bài tuyển dụng mới
              </button>
            </div>
          )}
        </div>

        {/* Right Column (4 cols): 📅 LỊCH PHỎNG VẤN SẮP TỚI (COMPACT TIMELINE) */}
        <div className="lg:col-span-4 space-y-4">
          <div className="bg-white rounded-2xl border border-slate-200 p-4 shadow-sm flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Calendar className="size-4 text-[#2563EB]" />
              <h3 className="font-extrabold text-sm text-[#1F2937]">LỊCH SẮP TỚI</h3>
            </div>
            <button
              onClick={onNavigateToInterviews}
              className="text-xs font-bold text-[#2563EB] hover:underline flex items-center gap-1"
            >
              Xem tất cả <ChevronRight className="size-3.5" />
            </button>
          </div>

          {loading ? (
            <div className="space-y-3">
              {[1, 2, 3].map((i) => (
                <div key={i} className="h-20 bg-white rounded-2xl border border-slate-200 animate-pulse p-4"></div>
              ))}
            </div>
          ) : upcomingInterviews.length > 0 ? (
            <div className="space-y-3">
              {upcomingInterviews.map((it: UpcomingInterviewItem) => {
                const dateObj = parseISO(it.scheduledAt);
                const dateStr = format(dateObj, "dd/MM");
                const timeStr = format(dateObj, "HH:mm");

                return (
                  <div
                    key={it.id}
                    onClick={onNavigateToInterviews}
                    className="bg-white rounded-2xl border border-slate-200 p-4 shadow-sm hover:border-blue-300 hover:shadow-md transition-all cursor-pointer space-y-2.5 group"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-1.5">
                        <span className="font-mono text-xs font-extrabold px-2 py-0.5 rounded-lg bg-blue-50 text-[#2563EB] border border-blue-100">
                          {dateStr}
                        </span>
                        <span className="font-mono text-xs font-bold text-slate-700">
                          {timeStr}
                        </span>
                      </div>
                      <span className="text-[10px] font-bold text-slate-400 flex items-center gap-1">
                        <Clock className="size-3" /> {it.durationMinutes}p
                      </span>
                    </div>

                    <div className="flex items-center gap-2.5">
                      <div className="size-8 rounded-full bg-slate-100 flex items-center justify-center font-bold text-xs text-slate-600 shrink-0 border border-slate-200">
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
            <div className="bg-white rounded-2xl border border-slate-200 p-6 text-center space-y-2">
              <div className="p-3 bg-slate-50 rounded-full text-slate-400 w-fit mx-auto">
                <Calendar className="size-6" />
              </div>
              <p className="text-xs font-bold text-[#1F2937]">Không có lịch phỏng vấn sắp tới</p>
              <p className="text-[11px] text-slate-500">
                Các buổi phỏng vấn được lên lịch với ứng viên sẽ hiển thị tại đây.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
