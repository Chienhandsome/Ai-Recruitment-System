/* eslint-disable @next/next/no-img-element */
"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
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
  CreditCard,
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
  Info,
  Play,
} from "lucide-react";

import { CreateJobWizard } from "./CreateJobWizard";
import { Candidate360Modal } from "./Candidate360Modal";
import { RecruiterApplicationsRanking } from "./applications/RecruiterApplicationsRanking";
import { RecruiterInterviewsWorkspace } from "./interviews/RecruiterInterviewsWorkspace";
import { RecruiterNotificationBell } from "./RecruiterNotificationBell";
import { RecruiterProfileModal } from "./RecruiterProfileModal";
import { JobsWorkspace } from "./JobsWorkspace";
import { DashboardTab } from "./DashboardTab";
import {
  getRecruiterApplications,
  getRecruiterActionHub,
  getRecruiterAnalytics,
  getRecruiterJobs,
  getRecruiterApplicationDetail,
  type RecruiterProfileData,
  type RecruiterDashboardStats,
  type RecruiterActionHubData,
  type RecruiterAnalyticsData,
  type PendingCandidateActionItem,
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
  const [targetAppId, setTargetAppId] = useState<string | null>(null);

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

  const handleNavigateToApplication = async (applicationId: string, jobId?: string) => {
    setTargetAppId(applicationId);
    setTargetJobTab("candidates");
    if (jobId) {
      setTargetJobId(jobId);
      setActiveTab("jobs");
    } else {
      try {
        const appDetail = await getRecruiterApplicationDetail(token, applicationId);
        if (appDetail?.job?.id) {
          setTargetJobId(appDetail.job.id);
        }
      } catch (err) {
        console.warn('Failed to resolve job from application:', err);
      }
      setActiveTab("jobs");
    }
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
              <Link
                href="/recruiter/billing"
                className="px-4 py-2 text-xs font-bold rounded-lg transition-all flex items-center gap-1.5 text-[#1F2937] hover:text-[#2563EB] hover:bg-white/60"
              >
                <CreditCard className="w-3.5 h-3.5" />
                Gói dịch vụ
              </Link>
            </nav>
          </div>

          {/* Action Controls */}
          <div className="flex items-center gap-3">
            {/* Notification Bell for Recruiter (with today's interview reminders) */}
            <RecruiterNotificationBell
              token={token}
              onNavigateToInterviews={() => setActiveTab("interviews")}
              onNavigateToApplication={handleNavigateToApplication}
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
                        <Link
                          href="/recruiter/billing"
                          onClick={() => setIsUserMenuOpen(false)}
                          className="w-full flex items-center gap-2 px-3 py-2 text-sm text-[#0F172A] hover:bg-[#F8FAFC] rounded-lg transition-colors"
                        >
                          <CreditCard className="size-4 text-[#64748B]" />
                          Gói dịch vụ & Hạn mức
                        </Link>
                        <Link href="/recruiter/talent-pool" className="w-full flex items-center gap-2 px-3 py-2 text-sm text-[#0F172A] hover:bg-[#F8FAFC] rounded-lg">
                          <User className="size-4 text-[#64748B]" /> Ứng viên đang tìm việc
                        </Link>
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
            onNavigateToApplication={handleNavigateToApplication}
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
            selectedApplicationId={targetAppId}
            onClearSelectedJob={() => {
              setTargetJobId(null);
              setTargetAppId(null);
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
