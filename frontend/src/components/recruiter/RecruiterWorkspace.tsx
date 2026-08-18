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
} from "lucide-react";

import { CreateJobWizard } from "./CreateJobWizard";
import { Candidate360Modal } from "./Candidate360Modal";
import { RecruiterApplicationsRanking } from "./applications/RecruiterApplicationsRanking";
import { RecruiterProfileModal } from "./RecruiterProfileModal";
import { JobsWorkspace } from "./JobsWorkspace";
import {
  getRecruiterApplications,
  type RecruiterProfileData,
  type RecruiterDashboardStats,
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
    getRecruiterApplications(token, { page: 1, limit: 3 })
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

          {/* Navigation Tabs (Design System Secondary Pill Container) */}
          <nav className="hidden md:flex items-center gap-1 bg-[#EFF6FF] p-1.5 rounded-xl border border-blue-100">
            <button
              onClick={() => setActiveTab("dashboard")}
              className={`px-4 py-2 text-xs font-bold rounded-lg transition-all ${
                activeTab === "dashboard"
                  ? "bg-[#2563EB] text-white shadow-md"
                  : "text-[#1F2937] hover:text-[#2563EB] hover:bg-white/60"
              }`}
            >
              Dashboard Tổng quan
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
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-[#3B82F6]" />
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
            candidates={topCandidates}
            stats={stats}
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

// Sub-Component: Dashboard Tab
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
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="bg-white p-5 rounded-2xl border border-blue-100 shadow-sm hover:-translate-y-[2px] transition-all">
          <div className="flex items-center justify-between text-slate-500 text-xs font-bold">
            <span>TIN TUYỂN DỤNG ACTIVE</span>
            <Briefcase className="w-4 h-4 text-[#2563EB]" />
          </div>
          <div className="mt-3 flex items-baseline justify-between">
            <span className="text-3xl font-extrabold text-[#1F2937] tracking-tight">{stats?.totalActiveJobs ?? 0} Roles</span>
            <span className="text-xs text-emerald-700 font-bold flex items-center gap-0.5 bg-emerald-50 px-2.5 py-1 rounded-full border border-emerald-200">
              <TrendingUp className="w-3 h-3" /> Dashboard Live
            </span>
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-blue-100 shadow-sm hover:-translate-y-[2px] transition-all">
          <div className="flex items-center justify-between text-slate-500 text-xs font-bold">
            <span>ỨNG VIÊN NỘP HÔM NAY</span>
            <Users className="w-4 h-4 text-[#2563EB]" />
          </div>
          <div className="mt-3 flex items-baseline justify-between">
            <span className="text-3xl font-extrabold text-[#1F2937] tracking-tight">{stats?.newApplicationsToday ?? 0} CV</span>
            <span className="text-xs font-mono bg-[#EFF6FF] text-[#2563EB] px-2.5 py-1 rounded-full font-bold border border-blue-200">
              Tổng số {stats?.totalCandidates ?? 0}
            </span>
          </div>
        </div>
      </div>

      {/* Main Workspace Row: 8 + 4 Asymmetric Grid */}
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
                    {candidates.slice(0, 3).map((cand) => (
                      <tr key={cand.id} className="hover:bg-slate-50 transition-colors cursor-pointer" onClick={() => onOpenReport(cand)}>
                        <td className="py-3.5 pr-4">
                          <div className="flex items-center gap-3">
                            {/* eslint-disable-next-line @next/next/no-img-element */}
                            <img
                              src={cand.avatar}
                              alt={cand.name}
                              className="w-9 h-9 rounded-full object-cover border border-slate-200"
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
                  <BrainCircuit className="w-8 h-8 text-[#2563EB]" />
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
                  <Bot className="w-5 h-5 text-[#2563EB]" />
                </div>
                <span className="font-extrabold text-sm tracking-tight text-[#1F2937]">AI Hiring Assistant</span>
              </div>
              <span className="text-[10px] font-mono bg-emerald-100 text-emerald-700 border border-emerald-300 px-2.5 py-0.5 rounded-full font-extrabold">
                ACTIVE
              </span>
            </div>

            <div className="bg-white border border-blue-100 rounded-xl p-4 space-y-2 mb-4 shadow-sm">
              <div className="flex items-center gap-2 text-[#2563EB] text-xs font-bold">
                <Zap className="w-4 h-4 text-amber-500" />
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
            <Plus className="w-4 h-4" />
            Tạo bài tuyển dụng bằng AI Assistant
          </button>
        </div>
      </div>
    </div>
  );
}
