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
  Filter,
  Plus,
  ChevronRight,
  TrendingUp,
  Eye,
  X,
  Bot,
  Zap,
  LayoutGrid,
  LayoutList,
  LogOut,
  User,
} from "lucide-react";

import { KanbanBoard, ApplicationStage, KanbanCandidate } from "./KanbanBoard";
import { Candidate360Modal } from "./Candidate360Modal";
import { RecruiterProfileModal } from "./RecruiterProfileModal";
import { JobsWorkspace } from "./JobsWorkspace";
import type { RecruiterProfileData, RecruiterDashboardStats } from "@/lib/recruiter-api";
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

export interface JobPosting {
  id: string;
  title: string;
  department: string;
  location: string;
  applicantsCount: number;
  shortlistedCount: number;
  avgMatchScore: number;
  status: "ACTIVE" | "PAUSED" | "CLOSED";
  postedDate: string;
}

// Mock Data Removed - System uses live API data
const MOCK_CANDIDATES: Candidate[] = [];
const MOCK_JOBS: JobPosting[] = [];

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
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);

  useEffect(() => {
    setProfile(initialProfile);
  }, [initialProfile]);

  const handleProfileUpdated = (updatedProfile: RecruiterProfileData) => {
    setProfile(updatedProfile);
    router.refresh();
  };

  const handleLogout = async () => {
    const supabase = createClient();
    await supabase.auth.signOut();
    window.location.href = "/login"; // Force hard redirect to clear router cache
  };

  return (
    <div className="min-h-screen bg-[#F8FAFC] text-[#0F172A] font-sans">
      {/* Top Header Bar */}
      <header className="sticky top-0 z-30 bg-white/80 backdrop-blur-md border-b border-[#E2E8F0] px-6 py-3.5 flex items-center justify-between">
        <div className="flex items-center gap-6">
          <div className="flex items-center gap-2.5">
            <div className="h-9 w-9 rounded-xl bg-[#2563EB] flex items-center justify-center text-white font-bold text-lg shadow-sm">
              <BrainCircuit className="w-5 h-5" />
            </div>
            <div>
              <span className="font-bold text-lg tracking-tight text-[#0F172A]">SmartRecruit</span>
              <span className="text-xs font-mono px-1.5 py-0.5 ml-1.5 rounded bg-blue-50 text-[#2563EB] border border-blue-100 font-semibold">
                {profile?.company?.name ? profile.company.name.toUpperCase() : "AI WORKSPACE"}
              </span>
            </div>
          </div>

          {/* Navigation Tabs */}
          <nav className="hidden md:flex items-center gap-1 bg-[#F1F5F9] p-1 rounded-xl border border-[#E2E8F0]">
            <button
              onClick={() => setActiveTab("dashboard")}
              className={`px-4 py-1.5 text-sm font-medium rounded-lg transition-all ${
                activeTab === "dashboard"
                  ? "bg-white text-[#2563EB] shadow-sm font-semibold"
                  : "text-[#64748B] hover:text-[#0F172A]"
              }`}
            >
              Dashboard Tổng quan
            </button>
            <button
              onClick={() => setActiveTab("jobs")}
              className={`px-4 py-1.5 text-sm font-medium rounded-lg transition-all ${
                activeTab === "jobs"
                  ? "bg-white text-[#2563EB] shadow-sm font-semibold"
                  : "text-[#64748B] hover:text-[#0F172A]"
              }`}
            >
              Quản lý Bài đăng
            </button>
            <button
              onClick={() => setActiveTab("candidates")}
              className={`px-4 py-1.5 text-sm font-medium rounded-lg transition-all ${
                activeTab === "candidates"
                  ? "bg-white text-[#2563EB] shadow-sm font-semibold"
                  : "text-[#64748B] hover:text-[#0F172A]"
              }`}
            >
              Xếp hạng Ứng viên AI
            </button>
          </nav>
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-3">
          <div className="relative hidden lg:block">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-[#94A3B8]" />
            <input
              type="text"
              placeholder="Tìm kiếm ứng viên, kỹ năng (CMD+K)..."
              className="w-64 pl-9 pr-4 py-1.5 text-xs bg-[#F1F5F9] border border-[#E2E8F0] rounded-lg focus:outline-none focus:ring-1 focus:ring-[#2563EB] text-[#0F172A] placeholder-[#94A3B8]"
            />
          </div>

          <button
            onClick={() => setIsCreateJobOpen(true)}
            className="flex items-center gap-2 px-4 py-2 bg-[#2563EB] hover:bg-[#1D4ED8] text-white text-xs font-semibold rounded-xl shadow-sm transition-all active:scale-[0.98]"
          >
            <Plus className="w-4 h-4" />
            Tạo bài tuyển dụng bằng AI
          </button>

          <div className="h-8 w-[1px] bg-[#E2E8F0] mx-1"></div>

          <div className="flex items-center gap-3">
            <div className="relative">
              <button 
                onClick={() => setIsUserMenuOpen(!isUserMenuOpen)}
                className="flex items-center gap-3 focus:outline-none"
              >
                <div className="h-9 w-9 rounded-full bg-[#E2E8F0] overflow-hidden border border-[#CBD5E1] flex items-center justify-center font-bold text-[#64748B] hover:ring-2 hover:ring-[#2563EB]/20 transition-all">
                  {profile?.user?.avatarUrl ? (
                    <img src={profile.user.avatarUrl} alt="Avatar" className="w-full h-full object-cover" />
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
                        <User className="w-4 h-4 text-[#64748B]" />
                        Hồ sơ cá nhân
                      </button>
                      <button 
                        onClick={handleLogout}
                        className="w-full flex items-center gap-2 px-3 py-2 text-sm text-rose-600 hover:bg-rose-50 rounded-lg transition-colors mt-1"
                      >
                        <LogOut className="w-4 h-4" />
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
            candidates={MOCK_CANDIDATES}
            stats={stats}
            onOpenReport={(cand) => setSelectedCandidateForReport(cand)}
            onOpenCreateJob={() => setIsCreateJobOpen(true)}
          />
        )}

        {/* Tab 2: Job Management */}
        {activeTab === "jobs" && <JobsWorkspace initialData={null} token={token} />}

        {/* Tab 3: Candidate Ranking */}
        {activeTab === "candidates" && (
          <CandidatesTab
            candidates={MOCK_CANDIDATES}
            onOpenReport={(cand) => setSelectedCandidateForReport(cand)}
          />
        )}
      </main>

      {/* Modal 1: Create Job Wizard (Function 3) */}
      {isCreateJobOpen && <CreateJobWizardModal onClose={() => setIsCreateJobOpen(false)} />}

      {/* Modal 2: Candidate 360 Degree Profile & AI Report (Function 5) */}
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

      {/* Modal 3: Recruiter Profile */}
      <RecruiterProfileModal 
        isOpen={isProfileModalOpen} 
        onClose={() => setIsProfileModalOpen(false)} 
        profile={profile}
        onProfileUpdated={handleProfileUpdated}
      />
    </div>
  );
}

// Sub-Component: Dashboard Tab (Functions 1 & Overview)
function DashboardTab({
  candidates,
  stats,
  onOpenReport,
  onOpenCreateJob,
}: {
  candidates: Candidate[];
  stats: RecruiterDashboardStats | null;
  onOpenReport: (cand: Candidate) => void;
  onOpenCreateJob: () => void;
}) {
  return (
    <div className="space-y-6">
      {/* Hero Stats Bento Row */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white p-5 rounded-2xl border border-[#E2E8F0] shadow-sm hover:-translate-y-[2px] transition-all">
          <div className="flex items-center justify-between text-[#64748B] text-xs font-semibold">
            <span>TIN TUYỂN DỤNG ACTIVE</span>
            <Briefcase className="w-4 h-4 text-[#2563EB]" />
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-3xl font-bold text-[#0F172A] tracking-tight">{stats?.totalActiveJobs ?? 0} Roles</span>
            <span className="text-xs text-emerald-600 font-semibold flex items-center gap-0.5">
              <TrendingUp className="w-3 h-3" /> Dashboard Live
            </span>
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-[#E2E8F0] shadow-sm hover:-translate-y-[2px] transition-all">
          <div className="flex items-center justify-between text-[#64748B] text-xs font-semibold">
            <span>ỨNG VIÊN NỘP HÔM NAY</span>
            <Users className="w-4 h-4 text-[#2563EB]" />
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-3xl font-bold text-[#0F172A] tracking-tight">{stats?.newApplicationsToday ?? 0} CV</span>
            <span className="text-xs font-mono bg-emerald-50 text-emerald-700 px-1.5 py-0.5 rounded font-semibold border border-emerald-100">
              Tổng số {stats?.totalCandidates ?? 0}
            </span>
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-[#E2E8F0] shadow-sm hover:-translate-y-[2px] transition-all">
          <div className="flex items-center justify-between text-[#64748B] text-xs font-semibold">
            <span>TỶ LỆ AI MATCH TỐT</span>
            <BrainCircuit className="w-4 h-4 text-[#10B981]" />
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-3xl font-bold text-[#0F172A] tracking-tight font-mono">87.4%</span>
            <span className="text-xs text-[#64748B]">Điểm khớp trung bình</span>
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-[#E2E8F0] shadow-sm hover:-translate-y-[2px] transition-all">
          <div className="flex items-center justify-between text-[#64748B] text-xs font-semibold">
            <span>ỨNG VIÊN TIỀM NĂNG</span>
            <Sparkles className="w-4 h-4 text-amber-500" />
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-3xl font-bold text-[#0F172A] tracking-tight">8 Hồ sơ</span>
            <span className="text-xs text-blue-600 font-semibold">AI Match &gt;85%</span>
          </div>
        </div>
      </div>

      {/* Main Workspace Row: 8 + 4 Asymmetric Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left 8 Cols: Candidate AI Ranking Snapshot */}
        <div className="lg:col-span-8 bg-white rounded-2xl border border-[#E2E8F0] p-6 shadow-sm">
          <div className="flex items-center justify-between mb-5">
            <div>
              <h2 className="text-base font-bold text-[#0F172A] tracking-tight">
                Top Ứng Viên Khớp Điểm AI Cao Nhất
              </h2>
              <p className="text-xs text-[#64748B] mt-0.5">
                Tự động sắp xếp theo điểm AI Match Score từ cao xuống thấp
              </p>
            </div>
            <span className="text-xs font-mono text-[#2563EB] font-semibold bg-blue-50 px-2 py-1 rounded-lg">
              Updated Live
            </span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-[#E2E8F0] text-[#64748B] uppercase font-semibold text-[11px]">
                  <th className="pb-3 pr-4">Ứng viên</th>
                  <th className="pb-3 px-3">Vị trí</th>
                  <th className="pb-3 px-3 text-center">AI Match Score</th>
                  <th className="pb-3 px-3">Kỹ năng nổi bật</th>
                  <th className="pb-3 pl-3 text-right">Thao tác</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#F1F5F9]">
                {candidates.slice(0, 3).map((cand) => (
                  <tr key={cand.id} className="hover:bg-[#F8FAFC] transition-colors">
                    <td className="py-3.5 pr-4">
                      <div className="flex items-center gap-3">
                        <img
                          src={cand.avatar}
                          alt={cand.name}
                          className="w-9 h-9 rounded-full object-cover border border-[#CBD5E1]"
                        />
                        <div>
                          <p className="font-bold text-[#0F172A]">{cand.name}</p>
                          <p className="text-[11px] text-[#64748B]">{cand.experienceYears} năm kinh nghiệm</p>
                        </div>
                      </div>
                    </td>
                    <td className="py-3.5 px-3 font-medium text-[#0F172A]">{cand.roleApplied}</td>
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
                    <td className="py-3.5 px-3">
                      <div className="flex flex-wrap gap-1">
                        {cand.skillsFit.slice(0, 2).map((s) => (
                          <span
                            key={s.skill}
                            className="bg-[#F1F5F9] text-[#0F172A] text-[10px] font-mono px-2 py-0.5 rounded border border-[#E2E8F0]"
                          >
                            {s.skill} {s.fitScore}%
                          </span>
                        ))}
                      </div>
                    </td>
                    <td className="py-3.5 pl-3 text-right">
                      <button
                        onClick={() => onOpenReport(cand)}
                        className="inline-flex items-center gap-1 px-3 py-1.5 bg-[#F1F5F9] hover:bg-[#E2E8F0] text-[#2563EB] font-semibold text-[11px] rounded-lg transition-colors"
                      >
                        <Eye className="w-3.5 h-3.5" />
                        Báo cáo AI
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Right 4 Cols: AI Hiring Assistant & Smart Insights */}
        <div className="lg:col-span-4 bg-gradient-to-br from-[#0F172A] to-[#1E293B] text-white rounded-2xl p-6 shadow-md flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <Bot className="w-5 h-5 text-emerald-400" />
                <span className="font-bold text-sm tracking-tight">AI Hiring Assistant</span>
              </div>
              <span className="text-[10px] font-mono bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 px-2 py-0.5 rounded-full font-semibold">
                ACTIVE
              </span>
            </div>

            <div className="bg-white/5 border border-white/10 rounded-xl p-4 space-y-3 mb-4 backdrop-blur-sm">
              <div className="flex items-center gap-2 text-emerald-400 text-xs font-semibold">
                <Zap className="w-4 h-4" />
                <span>Gợi ý thông minh tự động</span>
              </div>
              <p className="text-xs text-slate-300 leading-relaxed">
                Hệ thống phát hiện **3 ứng viên phù hợp cao** (Match Score &gt; 92%) vừa ứng tuyển vị trí Senior Frontend. Đề xuất chuyển thẳng sang vòng phỏng vấn kỹ thuật.
              </p>
            </div>
          </div>

          <button
            onClick={onOpenCreateJob}
            className="w-full py-2.5 bg-[#2563EB] hover:bg-[#1D4ED8] text-white font-semibold text-xs rounded-xl shadow transition-all flex items-center justify-center gap-2 active:scale-[0.98]"
          >
            <Plus className="w-4 h-4" />
            Tạo bài tuyển dụng bằng AI Assistant
          </button>
        </div>
      </div>
    </div>
  );
}

// Sub-Component: Jobs Tab (Function 2)
function JobsTab({
  jobs,
  onOpenCreateJob,
}: {
  jobs: JobPosting[];
  onOpenCreateJob: () => void;
}) {
  const [filterStatus, setFilterStatus] = useState<"ALL" | "ACTIVE" | "PAUSED">("ALL");

  const filtered = jobs.filter((j) => (filterStatus === "ALL" ? true : j.status === filterStatus));

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-[#0F172A] tracking-tight">Quản Lý Bài Đăng Tuyển Dụng</h1>
          <p className="text-xs text-[#64748B] mt-0.5">
            Xem và cấu hình các tin tuyển dụng đang mở trong hệ thống
          </p>
        </div>

        <div className="flex items-center gap-3">
          <div className="flex bg-[#E2E8F0] p-1 rounded-xl text-xs font-medium">
            <button
              onClick={() => setFilterStatus("ALL")}
              className={`px-3 py-1 rounded-lg ${filterStatus === "ALL" ? "bg-white text-[#2563EB] font-bold shadow-sm" : "text-[#64748B]"}`}
            >
              Tất cả ({jobs.length})
            </button>
            <button
              onClick={() => setFilterStatus("ACTIVE")}
              className={`px-3 py-1 rounded-lg ${filterStatus === "ACTIVE" ? "bg-white text-[#2563EB] font-bold shadow-sm" : "text-[#64748B]"}`}
            >
              Đang mở
            </button>
            <button
              onClick={() => setFilterStatus("PAUSED")}
              className={`px-3 py-1 rounded-lg ${filterStatus === "PAUSED" ? "bg-white text-[#2563EB] font-bold shadow-sm" : "text-[#64748B]"}`}
            >
              Tạm dừng
            </button>
          </div>

          <button
            onClick={onOpenCreateJob}
            className="flex items-center gap-2 px-4 py-2 bg-[#2563EB] hover:bg-[#1D4ED8] text-white text-xs font-semibold rounded-xl shadow-sm transition-all"
          >
            <Plus className="w-4 h-4" />
            Tạo bài mới
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {filtered.map((job) => (
          <div
            key={job.id}
            className="bg-white rounded-2xl border border-[#E2E8F0] p-5 shadow-sm hover:shadow-md transition-all flex flex-col justify-between"
          >
            <div>
              <div className="flex items-start justify-between">
                <div>
                  <h3 className="font-bold text-sm text-[#0F172A]">{job.title}</h3>
                  <p className="text-xs text-[#64748B] mt-0.5">
                    {job.department} • {job.location}
                  </p>
                </div>
                <span
                  className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                    job.status === "ACTIVE"
                      ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                      : "bg-amber-50 text-amber-700 border border-amber-200"
                  }`}
                >
                  {job.status}
                </span>
              </div>

              <div className="mt-4 grid grid-cols-3 gap-2 py-3 px-3 bg-[#F8FAFC] rounded-xl border border-[#F1F5F9] text-center">
                <div>
                  <p className="text-[10px] text-[#64748B] uppercase font-semibold">Ứng viên</p>
                  <p className="text-base font-bold text-[#0F172A] mt-0.5">{job.applicantsCount}</p>
                </div>
                <div>
                  <p className="text-[10px] text-[#64748B] uppercase font-semibold">Shortlist</p>
                  <p className="text-base font-bold text-[#2563EB] mt-0.5">{job.shortlistedCount}</p>
                </div>
                <div>
                  <p className="text-[10px] text-[#64748B] uppercase font-semibold">AI Fit Score</p>
                  <p className="text-base font-bold font-mono text-emerald-600 mt-0.5">
                    {job.avgMatchScore}%
                  </p>
                </div>
              </div>
            </div>

            <div className="mt-4 pt-3 border-t border-[#F1F5F9] flex items-center justify-between text-xs">
              <span className="text-[11px] text-[#94A3B8]">Đăng ngày: {job.postedDate}</span>
              <button className="text-[#2563EB] font-semibold hover:underline flex items-center gap-1">
                Quản lý ứng viên <ChevronRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// Sub-Component: Candidates Ranking Tab (Function 4)
function CandidatesTab({
  candidates,
  onOpenReport,
}: {
  candidates: Candidate[];
  onOpenReport: (cand: Candidate) => void;
}) {
  const [minScore, setMinScore] = useState(70);
  const [viewMode, setViewMode] = useState<"list" | "kanban">("kanban");

  const filtered = candidates.filter((c) => c.matchScore >= minScore);

  const mapToKanban = (c: Candidate): KanbanCandidate => ({
    id: c.id,
    name: c.name,
    avatar: c.avatar,
    matchScore: c.matchScore,
    stage: (c.status === "NEW" ? "RECEIVED" : c.status) as ApplicationStage,
    appliedDate: c.appliedDate,
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-[#0F172A] tracking-tight">
            Sàng Lọc & Bảng Xếp Hạng Ứng Viên AI
          </h1>
          <p className="text-xs text-[#64748B] mt-0.5">
            Hệ thống chấm điểm tương thích CV tự động dựa trên JD
          </p>
        </div>

        <div className="flex items-center gap-3">
          {/* View Toggle */}
          <div className="flex bg-[#E2E8F0] p-1 rounded-xl text-xs font-medium">
            <button
              onClick={() => setViewMode("kanban")}
              className={`px-3 py-1.5 flex items-center gap-2 rounded-lg ${viewMode === "kanban" ? "bg-white text-[#2563EB] font-bold shadow-sm" : "text-[#64748B]"}`}
            >
              <LayoutGrid className="w-3.5 h-3.5" /> Pipeline
            </button>
            <button
              onClick={() => setViewMode("list")}
              className={`px-3 py-1.5 flex items-center gap-2 rounded-lg ${viewMode === "list" ? "bg-white text-[#2563EB] font-bold shadow-sm" : "text-[#64748B]"}`}
            >
              <LayoutList className="w-3.5 h-3.5" /> Bảng xếp hạng
            </button>
          </div>

          <div className="flex items-center gap-2 bg-white border border-[#E2E8F0] px-3 py-1.5 rounded-xl text-xs">
            <Filter className="w-3.5 h-3.5 text-[#64748B]" />
            <span className="text-[#64748B]">Điểm AI Match tối thiểu:</span>
            <span className="font-mono font-bold text-[#2563EB]">{minScore}%</span>
            <input
              type="range"
              min="50"
              max="95"
              value={minScore}
              onChange={(e) => setMinScore(Number(e.target.value))}
              className="w-24 accent-[#2563EB]"
            />
          </div>
        </div>
      </div>

      {viewMode === "kanban" ? (
        <div className="h-[600px]">
          <KanbanBoard 
            candidates={filtered.map(mapToKanban)}
            onCandidateClick={(kCand) => {
              const cand = candidates.find(c => c.id === kCand.id);
              if (cand) onOpenReport(cand);
            }}
            onMoveCandidate={() => {}}
          />
        </div>
      ) : (
      <div className="bg-white rounded-2xl border border-[#E2E8F0] p-6 shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-[#E2E8F0] text-[#64748B] uppercase font-semibold text-[11px]">
                <th className="pb-3 pr-4">Họ và tên</th>
                <th className="pb-3 px-3">Vị trí nộp</th>
                <th className="pb-3 px-3 text-center">AI Score</th>
                <th className="pb-3 px-3">Phân tích kỹ năng (Skills Fit)</th>
                <th className="pb-3 px-3">AI Tóm tắt</th>
                <th className="pb-3 pl-3 text-right">Thao tác</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#F1F5F9]">
              {filtered.map((cand) => (
                <tr key={cand.id} className="hover:bg-[#F8FAFC] transition-colors">
                  <td className="py-4 pr-4">
                    <div className="flex items-center gap-3">
                      <img
                        src={cand.avatar}
                        alt={cand.name}
                        className="w-10 h-10 rounded-full object-cover border border-[#CBD5E1]"
                      />
                      <div>
                        <p className="font-bold text-[#0F172A] text-sm">{cand.name}</p>
                        <p className="text-[11px] text-[#64748B]">{cand.experienceYears} năm EXP</p>
                      </div>
                    </div>
                  </td>
                  <td className="py-4 px-3 font-medium text-[#0F172A]">{cand.roleApplied}</td>
                  <td className="py-4 px-3 text-center">
                    <span
                      className={`inline-block font-mono font-bold text-xs px-3 py-1 rounded-full ${
                        cand.matchScore >= 85
                          ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                          : "bg-amber-50 text-amber-700 border border-amber-200"
                      }`}
                    >
                      {cand.matchScore}%
                    </span>
                  </td>
                  <td className="py-4 px-3">
                    <div className="flex flex-wrap gap-1 max-w-xs">
                      {cand.skillsFit.map((s) => (
                        <span
                          key={s.skill}
                          className="bg-[#F1F5F9] text-[#0F172A] text-[10px] font-mono px-2 py-0.5 rounded border border-[#E2E8F0]"
                        >
                          {s.skill} {s.fitScore}%
                        </span>
                      ))}
                    </div>
                  </td>
                  <td className="py-4 px-3 text-[#64748B] max-w-xs leading-relaxed">
                    {cand.aiSummary}
                  </td>
                  <td className="py-4 pl-3 text-right">
                    <button
                      onClick={() => onOpenReport(cand)}
                      className="inline-flex items-center gap-1.5 px-3.5 py-1.5 bg-[#2563EB] text-white font-semibold text-xs rounded-xl shadow-sm hover:bg-[#1D4ED8] transition-all"
                    >
                      <Eye className="w-3.5 h-3.5" />
                      Xem báo cáo AI
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
      )}
    </div>
  );
}

// Sub-Component: Create Job Wizard Modal (Function 3)
function CreateJobWizardModal({ onClose }: { onClose: () => void }) {
  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [jobTitle, setJobTitle] = useState("Senior Frontend Engineer");
  const [generatedJd, setGeneratedJd] = useState(
    "Xây dựng và tối ưu giao diện web app Next.js/React cho hệ thống SaaS tuyển dụng AI..."
  );

  // Weights
  const [hardSkillsWeight, setHardSkillsWeight] = useState(40);
  const [expWeight, setExpWeight] = useState(30);
  const [eduWeight, setEduWeight] = useState(15);

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl border border-[#E2E8F0] shadow-xl w-full max-w-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Modal Header */}
        <div className="px-6 py-4 border-b border-[#E2E8F0] flex items-center justify-between bg-[#F8FAFC]">
          <div>
            <h2 className="font-bold text-base text-[#0F172A]">
              Tạo Bài Tuyển Dụng & Cấu Hình AI (Bước {step}/3)
            </h2>
            <p className="text-xs text-[#64748B]">
              {step === 1 && "Thông tin công việc cơ bản"}
              {step === 2 && "Nội dung JD được sinh bởi AI Assistant"}
              {step === 3 && "Cấu hình trọng số chấm điểm AI Match"}
            </p>
          </div>
          <button onClick={onClose} className="p-1 text-[#94A3B8] hover:text-[#0F172A]">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Content */}
        <div className="p-6 overflow-y-auto space-y-5 flex-1">
          {step === 1 && (
            <div className="space-y-4 text-xs">
              <div>
                <label className="block font-bold text-[#0F172A] mb-1">Tên vị trí tuyển dụng</label>
                <input
                  type="text"
                  value={jobTitle}
                  onChange={(e) => setJobTitle(e.target.value)}
                  className="w-full px-3 py-2 border border-[#E2E8F0] rounded-xl focus:ring-1 focus:ring-[#2563EB] focus:outline-none"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block font-bold text-[#0F172A] mb-1">Phòng ban</label>
                  <input
                    type="text"
                    defaultValue="Engineering"
                    className="w-full px-3 py-2 border border-[#E2E8F0] rounded-xl focus:ring-1 focus:ring-[#2563EB] focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block font-bold text-[#0F172A] mb-1">Địa điểm</label>
                  <input
                    type="text"
                    defaultValue="Hà Nội (Hybrid)"
                    className="w-full px-3 py-2 border border-[#E2E8F0] rounded-xl focus:ring-1 focus:ring-[#2563EB] focus:outline-none"
                  />
                </div>
              </div>
            </div>
          )}

          {step === 2 && (
            <div className="space-y-4 text-xs">
              <div className="flex items-center justify-between">
                <span className="font-bold text-[#0F172A]">Nội dung JD gợi ý bởi AI</span>
                <button
                  onClick={() => setGeneratedJd((prev) => prev + " [AI Updated]")}
                  className="text-[#2563EB] font-semibold flex items-center gap-1 hover:underline"
                >
                  <Sparkles className="w-3.5 h-3.5" /> Tạo lại nội dung
                </button>
              </div>
              <textarea
                rows={6}
                value={generatedJd}
                onChange={(e) => setGeneratedJd(e.target.value)}
                className="w-full p-3 border border-[#E2E8F0] rounded-xl focus:ring-1 focus:ring-[#2563EB] focus:outline-none font-sans leading-relaxed text-[#0F172A]"
              ></textarea>
            </div>
          )}

          {step === 3 && (
            <div className="space-y-5 text-xs">
              <p className="font-bold text-[#0F172A]">Điều chỉnh trọng số đánh giá điểm AI Match %</p>

              <div className="space-y-3 bg-[#F8FAFC] p-4 rounded-xl border border-[#F1F5F9]">
                <div>
                  <div className="flex justify-between font-semibold mb-1">
                    <span>1. Kỹ năng chuyên môn (Hard Skills)</span>
                    <span className="font-mono text-[#2563EB]">{hardSkillsWeight}%</span>
                  </div>
                  <input
                    type="range"
                    min="20"
                    max="60"
                    value={hardSkillsWeight}
                    onChange={(e) => setHardSkillsWeight(Number(e.target.value))}
                    className="w-full accent-[#2563EB]"
                  />
                </div>

                <div>
                  <div className="flex justify-between font-semibold mb-1">
                    <span>2. Số năm kinh nghiệm (Experience)</span>
                    <span className="font-mono text-[#2563EB]">{expWeight}%</span>
                  </div>
                  <input
                    type="range"
                    min="10"
                    max="50"
                    value={expWeight}
                    onChange={(e) => setExpWeight(Number(e.target.value))}
                    className="w-full accent-[#2563EB]"
                  />
                </div>

                <div>
                  <div className="flex justify-between font-semibold mb-1">
                    <span>3. Học vấn & Bằng cấp (Education)</span>
                    <span className="font-mono text-[#2563EB]">{eduWeight}%</span>
                  </div>
                  <input
                    type="range"
                    min="5"
                    max="30"
                    value={eduWeight}
                    onChange={(e) => setEduWeight(Number(e.target.value))}
                    className="w-full accent-[#2563EB]"
                  />
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="px-6 py-4 border-t border-[#E2E8F0] flex items-center justify-between bg-[#F8FAFC]">
          {step > 1 ? (
            <button
              onClick={() => setStep((s) => (s === 3 ? 2 : 1))}
              className="px-4 py-2 bg-white border border-[#E2E8F0] text-[#0F172A] font-semibold text-xs rounded-xl"
            >
              Quay lại
            </button>
          ) : (
            <div></div>
          )}

          {step < 3 ? (
            <button
              onClick={() => setStep((s) => (s === 1 ? 2 : 3))}
              className="px-4 py-2 bg-[#2563EB] hover:bg-[#1D4ED8] text-white font-semibold text-xs rounded-xl shadow-sm"
            >
              Tiếp tục
            </button>
          ) : (
            <button
              onClick={onClose}
              className="px-5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-xs rounded-xl shadow-sm"
            >
              Hoàn tất & Hoạt động
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

