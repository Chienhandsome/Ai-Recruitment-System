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
  Award,
  CheckCircle2,
  RotateCw,
  Filter,
} from "lucide-react";

import { CreateJobWizard } from "./CreateJobWizard";
import { Candidate360Modal } from "./Candidate360Modal";
import { RecruiterApplicationsRanking } from "./applications/RecruiterApplicationsRanking";
import { RecruiterProfileModal } from "./RecruiterProfileModal";
import { JobsWorkspace } from "./JobsWorkspace";
import { RecruitmentFunnelChart } from "./analytics/RecruitmentFunnelChart";
import { UpcomingInterviewsWidget } from "./analytics/UpcomingInterviewsWidget";
import { AiScoreDistributionChart } from "./analytics/AiScoreDistributionChart";
import { TopSkillsCompetenceWidget } from "./analytics/TopSkillsCompetenceWidget";
import {
  getRecruiterApplications,
  getRecruiterAnalytics,
  getRecruiterJobs,
  type RecruiterProfileData,
  type RecruiterDashboardStats,
  type RecruiterAnalyticsData,
  type JobPostingData,
} from "@/lib/recruiter-api";
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
}: {
  profile: RecruiterProfileData | null;
  stats: RecruiterDashboardStats | null;
  token: string;
}) {
  const router = useRouter();
  const [profile, setProfile] = useState<RecruiterProfileData | null>(initialProfile);
  const [activeTab, setActiveTab] = useState<"dashboard" | "jobs" | "candidates">("dashboard");
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

  const handleProfileUpdated = (updatedProfile: RecruiterProfileData) => {
    setProfile(updatedProfile);
    router.refresh();
  };

  const handleLogout = async () => {
    const supabase = createClient();
    await supabase.auth.signOut();
    window.location.href = "/login";
  };

  return (
    <div className="min-h-screen bg-[#F8FAFC] text-[#0F172A] font-sans">
      {/* Top Header Bar */}
      <header className="sticky top-0 z-30 bg-white/80 backdrop-blur-md border-b border-[#E2E8F0] px-6 py-3.5 flex items-center justify-between">
        <div className="flex items-center gap-6">
          <div className="flex items-center gap-2.5">
            <div className="size-9 rounded-xl bg-[#2563EB] flex items-center justify-center text-white font-bold text-lg shadow-sm">
              <BrainCircuit className="size-5" />
            </div>
            <div>
              <span className="font-bold text-lg tracking-tight text-[#0F172A]">SmartRecruit</span>
              <span className="text-xs font-mono px-1.5 py-0.5 ml-1.5 rounded bg-blue-50 text-[#2563EB] border border-blue-100 font-semibold">
                {profile?.company?.name ? profile.company.name.toUpperCase() : "AI WORKSPACE"}
              </span>
            </div>
          </div>

          {/* Navigation Tabs */}
          <nav className="hidden md:flex items-center gap-1 bg-[#EFF6FF] p-1.5 rounded-xl border border-blue-100">
            <button
              onClick={() => setActiveTab("dashboard")}
              className={`px-4 py-2 text-xs font-bold rounded-lg transition-all ${
                activeTab === "dashboard"
                  ? "bg-[#2563EB] text-white shadow-md"
                  : "text-[#1F2937] hover:text-[#2563EB] hover:bg-white/60"
              }`}
            >
              Dashboard Thống kê
            </button>
            <button
              onClick={() => setActiveTab("jobs")}
              className={`px-4 py-2 text-xs font-bold rounded-lg transition-all ${
                activeTab === "jobs"
                  ? "bg-[#2563EB] text-white shadow-md"
                  : "text-[#1F2937] hover:text-[#2563EB] hover:bg-white/60"
              }`}
            >
              Quản lý Bài đăng
            </button>
            <button
              onClick={() => setActiveTab("candidates")}
              className={`px-4 py-2 text-xs font-bold rounded-lg transition-all ${
                activeTab === "candidates"
                  ? "bg-[#2563EB] text-white shadow-md"
                  : "text-[#1F2937] hover:text-[#2563EB] hover:bg-white/60"
              }`}
            >
              Xếp hạng Ứng viên AI
            </button>
          </nav>
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-3">
          <div className="relative hidden lg:block">
            <Search className="size-4 absolute left-3 top-1/2 -translate-y-1/2 text-[#3B82F6]" />
            <input
              type="text"
              placeholder="Tìm kiếm ứng viên, kỹ năng (CMD+K)..."
              className="w-64 pl-9 pr-4 py-2 text-xs bg-[#EFF6FF] border border-blue-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#2563EB] text-[#1F2937] placeholder-blue-400"
            />
          </div>

          <button
            onClick={() => setIsCreateJobOpen(true)}
            className="flex items-center gap-2 px-4 py-2 bg-[#2563EB] hover:bg-[#1D4ED8] text-white text-xs font-bold rounded-xl shadow-md transition-all active:scale-[0.98]"
          >
            <Plus className="size-4" />
            Tạo bài tuyển dụng bằng AI
          </button>

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
      </header>

      {/* Main Workspace Body */}
      <main className="max-w-[1440px] mx-auto p-6 space-y-6">
        {/* Tab 1: Dashboard */}
        {activeTab === "dashboard" && (
          <DashboardTab
            candidates={topCandidates}
            stats={stats}
            token={token}
            onOpenReport={(cand) => setSelectedCandidateForReport(cand)}
            onOpenCreateJob={() => setIsCreateJobOpen(true)}
          />
        )}

        {/* Tab 2: Job Management */}
        {activeTab === "jobs" && <JobsWorkspace initialData={null} token={token} />}

        {/* Tab 3: Candidate Ranking */}
        {activeTab === "candidates" && (
          <RecruiterApplicationsRanking token={token} />
        )}
      </main>

      {/* Modal: Create Job Wizard */}
      <CreateJobWizard
        isOpen={isCreateJobOpen}
        onClose={() => setIsCreateJobOpen(false)}
        token={token}
        onSuccess={() => { setIsCreateJobOpen(false); router.refresh(); }}
      />

      {/* Modal: Candidate 360 Degree Profile & AI Report */}
      <Candidate360Modal
        isOpen={!!selectedCandidateForReport}
        onClose={() => setSelectedCandidateForReport(null)}
        candidate={
          selectedCandidateForReport
            ? {
                id: selectedCandidateForReport.id,
                name: selectedCandidateForReport.name,
                role: selectedCandidateForReport.roleApplied,
                avatar: selectedCandidateForReport.avatar,
                matchScore: selectedCandidateForReport.matchScore,
                skills: selectedCandidateForReport.skillsFit.map((s) => s.skill),
                pros: selectedCandidateForReport.pros,
                cons: selectedCandidateForReport.cons,
                education: selectedCandidateForReport.education,
                radarScores: selectedCandidateForReport.radarScores,
              }
            : null
        }
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

// Sub-Component: Enhanced Dashboard Tab
function DashboardTab({
  candidates,
  stats,
  token,
  onOpenReport,
  onOpenCreateJob,
}: {
  candidates: Candidate[];
  stats: RecruiterDashboardStats | null;
  token: string;
  onOpenReport: (cand: Candidate) => void;
  onOpenCreateJob: () => void;
}) {
  const [selectedJobId, setSelectedJobId] = useState<string>("");
  const [jobsList, setJobsList] = useState<JobPostingData[]>([]);
  const [analytics, setAnalytics] = useState<RecruiterAnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchAnalyticsData = async (jobId?: string) => {
    if (!token) return;
    setLoading(true);
    try {
      const [analyticsRes, jobsRes] = await Promise.all([
        getRecruiterAnalytics(token, jobId || undefined),
        jobsList.length === 0 ? getRecruiterJobs(token) : Promise.resolve({ data: jobsList }),
      ]);
      setAnalytics(analyticsRes);
      if (jobsRes?.data) {
        setJobsList(jobsRes.data);
      }
    } catch (err) {
      console.error("Failed to load recruiter analytics", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAnalyticsData(selectedJobId);
  }, [selectedJobId, token]);

  const kpis = analytics?.kpis;

  return (
    <div className="space-y-6">
      {/* Header Toolbar: Filter by Job & Refresh */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-4 rounded-2xl border border-slate-200 shadow-sm">
        <div className="flex items-center gap-3">
          <div className="flex size-9 items-center justify-center rounded-xl bg-[#2563EB] text-white shadow-sm">
            <TrendingUp className="size-5" />
          </div>
          <div>
            <h2 className="text-base font-extrabold text-[#1F2937]">
              Dashboard Thống Kê Tuyển Dụng
            </h2>
            <p className="text-xs text-slate-500">
              Phân tích hiệu suất chuyển đổi, chất lượng ứng viên AI và lịch phỏng vấn
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          {/* Job Filter Dropdown */}
          <div className="flex items-center gap-2">
            <Filter className="size-4 text-[#2563EB]" />
            <select
              value={selectedJobId}
              onChange={(e) => setSelectedJobId(e.target.value)}
              className="rounded-xl border border-blue-200 bg-[#EFF6FF] px-3.5 py-2 text-xs font-bold text-[#1F2937] outline-none focus:border-[#2563EB] focus:ring-2 focus:ring-blue-100 transition-all cursor-pointer max-w-[240px]"
            >
              <option value="">Tất cả bài đăng ({jobsList.length} JD)</option>
              {jobsList.map((job) => (
                <option key={job.id} value={job.id}>
                  {job.title}
                </option>
              ))}
            </select>
          </div>

          <button
            type="button"
            onClick={() => fetchAnalyticsData(selectedJobId)}
            disabled={loading}
            className="flex size-9 items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-600 hover:bg-[#EFF6FF] hover:text-[#2563EB] transition-colors disabled:opacity-50"
            title="Làm mới dữ liệu"
          >
            <RotateCw className={`size-4 ${loading ? "animate-spin text-[#2563EB]" : ""}`} />
          </button>
        </div>
      </div>

      {/* Hero Stats Bento Grid: 6 KPI Cards */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3.5">
        {/* Card 1: Active Jobs */}
        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm hover:border-blue-300 transition-all">
          <div className="flex items-center justify-between text-slate-500 text-[11px] font-bold">
            <span className="truncate uppercase">Tin đang mở</span>
            <Briefcase className="size-4 text-[#2563EB] shrink-0" />
          </div>
          <div className="mt-2 flex items-baseline justify-between">
            <span className="text-2xl font-extrabold text-[#1F2937] tracking-tight">
              {kpis?.totalActiveJobs ?? stats?.totalActiveJobs ?? 0}
            </span>
            <span className="text-[10px] font-bold text-slate-400">Roles</span>
          </div>
        </div>

        {/* Card 2: Total Applications */}
        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm hover:border-blue-300 transition-all">
          <div className="flex items-center justify-between text-slate-500 text-[11px] font-bold">
            <span className="truncate uppercase">Tổng hồ sơ</span>
            <Users className="size-4 text-[#2563EB] shrink-0" />
          </div>
          <div className="mt-2 flex items-baseline justify-between">
            <span className="text-2xl font-extrabold text-[#1F2937] tracking-tight">
              {kpis?.totalApplications ?? stats?.totalCandidates ?? 0}
            </span>
            <span className="text-[10px] font-bold text-slate-400">CV</span>
          </div>
        </div>

        {/* Card 3: New this week */}
        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm hover:border-blue-300 transition-all">
          <div className="flex items-center justify-between text-slate-500 text-[11px] font-bold">
            <span className="truncate uppercase">Mới tuần này</span>
            <Sparkles className="size-4 text-amber-500 shrink-0" />
          </div>
          <div className="mt-2 flex items-baseline justify-between">
            <span className="text-2xl font-extrabold text-[#2563EB] tracking-tight">
              +{kpis?.newApplicationsThisWeek ?? stats?.newApplicationsToday ?? 0}
            </span>
            <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 px-1.5 py-0.5 rounded border border-emerald-200">
              +{kpis?.newApplicationsToday ?? 0} hôm nay
            </span>
          </div>
        </div>

        {/* Card 4: Total Interviews */}
        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm hover:border-blue-300 transition-all">
          <div className="flex items-center justify-between text-slate-500 text-[11px] font-bold">
            <span className="truncate uppercase">Phỏng vấn</span>
            <Calendar className="size-4 text-purple-600 shrink-0" />
          </div>
          <div className="mt-2 flex items-baseline justify-between">
            <span className="text-2xl font-extrabold text-[#1F2937] tracking-tight">
              {kpis?.totalInterviews ?? 0}
            </span>
            <span className="text-[10px] font-bold text-slate-400">Buổi</span>
          </div>
        </div>

        {/* Card 5: Total Hired */}
        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm hover:border-blue-300 transition-all">
          <div className="flex items-center justify-between text-slate-500 text-[11px] font-bold">
            <span className="truncate uppercase">Đã tuyển dụng</span>
            <CheckCircle2 className="size-4 text-emerald-600 shrink-0" />
          </div>
          <div className="mt-2 flex items-baseline justify-between">
            <span className="text-2xl font-extrabold text-emerald-700 tracking-tight">
              {kpis?.totalHired ?? 0}
            </span>
            <span className="text-[10px] font-bold text-slate-500">
              Rate: {kpis?.hireConversionRate ?? 0}%
            </span>
          </div>
        </div>

        {/* Card 6: Average AI Score */}
        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm hover:border-blue-300 transition-all">
          <div className="flex items-center justify-between text-slate-500 text-[11px] font-bold">
            <span className="truncate uppercase">Điểm AI TB</span>
            <Award className="size-4 text-[#2563EB] shrink-0" />
          </div>
          <div className="mt-2 flex items-baseline justify-between">
            <span className="text-2xl font-extrabold text-[#2563EB] tracking-tight">
              {kpis?.avgAiScore ?? 0}
            </span>
            <span className="text-[10px] font-bold text-slate-400">/100</span>
          </div>
        </div>
      </div>

      {/* Row 1: Funnel Chart (8 cols) + Upcoming Interviews (4 cols) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        <div className="lg:col-span-8">
          <RecruitmentFunnelChart funnel={analytics?.funnel ?? []} />
        </div>
        <div className="lg:col-span-4">
          <UpcomingInterviewsWidget interviews={analytics?.upcomingInterviews ?? []} />
        </div>
      </div>

      {/* Row 2: AI Score Distribution (6 cols) + Top Skills (6 cols) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        <div className="lg:col-span-6">
          <AiScoreDistributionChart
            distribution={analytics?.scoreDistribution ?? []}
            avgScore={kpis?.avgAiScore ?? 0}
          />
        </div>
        <div className="lg:col-span-6">
          <TopSkillsCompetenceWidget topSkills={analytics?.topSkills ?? []} />
        </div>
      </div>

      {/* Row 3: Top AI Candidates Table (8 cols) + AI Assistant Card (4 cols) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left 8 Cols: Candidate AI Ranking Snapshot */}
        <div className="lg:col-span-8 bg-white rounded-2xl border border-slate-200 p-6 shadow-sm flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-5">
              <div>
                <h2 className="text-base font-bold text-[#1F2937] tracking-tight">
                  Top Ứng Viên Khớp Điểm AI Cao Nhất
                </h2>
                <p className="text-xs text-slate-500 mt-0.5">
                  Tự động sắp xếp theo điểm AI Match Score từ cao xuống thấp
                </p>
              </div>
              <span className="text-xs font-mono text-[#2563EB] font-bold bg-[#EFF6FF] px-3 py-1 rounded-lg border border-blue-200">
                Updated Live
              </span>
            </div>

            {candidates.length > 0 ? (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead>
                    <tr className="border-b border-slate-200 text-slate-500 uppercase font-bold text-[11px]">
                      <th className="pb-3 pr-4">Ứng viên</th>
                      <th className="pb-3 px-3">Vị trí</th>
                      <th className="pb-3 px-3 text-center">AI Match Score</th>
                      <th className="pb-3 pl-3 text-right">Trạng thái</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {candidates.slice(0, 5).map((cand) => (
                      <tr key={cand.id} className="hover:bg-slate-50 transition-colors cursor-pointer" onClick={() => onOpenReport(cand)}>
                        <td className="py-3.5 pr-4">
                          <div className="flex items-center gap-3">
                            <img
                              src={cand.avatar}
                              alt={cand.name}
                              className="size-9 rounded-full object-cover border border-slate-200"
                            />
                            <p className="font-bold text-[#1F2937]">{cand.name}</p>
                          </div>
                        </td>
                        <td className="py-3.5 px-3 font-medium text-[#1F2937]">{cand.roleApplied}</td>
                        <td className="py-3.5 px-3 text-center">
                          <span
                            className={`inline-block font-mono font-bold text-xs px-2.5 py-1 rounded-full ${
                              cand.matchScore >= 85
                                ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                                : "bg-amber-50 text-amber-700 border border-amber-200"
                            }`}
                          >
                            {cand.matchScore}%
                          </span>
                        </td>
                        <td className="py-3.5 pl-3 text-right">
                          <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                            cand.status === "SHORTLISTED" ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                              : cand.status === "SCREENING" ? "bg-blue-50 text-blue-700 border border-blue-200"
                              : cand.status === "REJECTED" ? "bg-rose-50 text-rose-700 border border-rose-200"
                              : "bg-slate-50 text-slate-600 border border-slate-200"
                          }`}>
                            {cand.status}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="py-12 text-center flex flex-col items-center justify-center bg-[#EFF6FF]/40 rounded-xl border border-dashed border-blue-200">
                <div className="p-3 bg-white rounded-full shadow-sm border border-blue-100 mb-3">
                  <BrainCircuit className="size-8 text-[#2563EB]" />
                </div>
                <h4 className="text-sm font-bold text-[#1F2937]">Chưa có hồ sơ ứng viên nộp CV</h4>
                <p className="text-xs text-slate-500 max-w-sm mt-1">Khi ứng viên nộp hồ sơ, AI sẽ tự động phân tích kỹ năng, tính điểm Match Score và xếp hạng tại đây.</p>
              </div>
            )}
          </div>
        </div>

        {/* Right 4 Cols: AI Hiring Assistant Card */}
        <div className="lg:col-span-4 bg-[#EFF6FF] border border-blue-200 text-[#1F2937] rounded-2xl p-6 shadow-sm flex flex-col justify-between min-h-[320px]">
          <div>
            <div className="flex items-center justify-between mb-4 pb-3 border-b border-blue-200">
              <div className="flex items-center gap-2">
                <div className="p-2 bg-white rounded-xl border border-blue-200 shadow-sm">
                  <Bot className="size-5 text-[#2563EB]" />
                </div>
                <span className="font-extrabold text-sm tracking-tight text-[#1F2937]">AI Hiring Assistant</span>
              </div>
              <span className="text-[10px] font-mono bg-emerald-100 text-emerald-700 border border-emerald-300 px-2.5 py-0.5 rounded-full font-extrabold">
                ACTIVE
              </span>
            </div>

            <div className="bg-white border border-blue-100 rounded-xl p-4 space-y-2 mb-4 shadow-sm">
              <div className="flex items-center gap-2 text-[#2563EB] text-xs font-bold">
                <Zap className="size-4 text-amber-500" />
                <span>Gợi ý thông minh tự động</span>
              </div>
              <p className="text-xs text-[#1F2937] leading-relaxed font-medium">
                Hệ thống AI sẵn sàng phân tích CV, trích xuất kỹ năng và chấm điểm so khớp cho bài tuyển dụng của bạn.
              </p>
            </div>
          </div>

          <button
            onClick={onOpenCreateJob}
            className="w-full py-3 bg-[#2563EB] hover:bg-[#1D4ED8] text-white font-bold text-xs rounded-xl shadow-md transition-all flex items-center justify-center gap-2 active:scale-[0.98]"
          >
            <Plus className="size-4" />
            Tạo bài tuyển dụng bằng AI Assistant
          </button>
        </div>
      </div>
    </div>
  );
}
