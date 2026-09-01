"use client";

import React, { useState, useMemo, useEffect } from "react";
import {
  User, Sparkles, Code, Briefcase, GraduationCap, Award,
  ShieldCheck, AlertTriangle, ThumbsUp, ThumbsDown, Mail, Phone,
  DollarSign, FolderGit2, Calendar, CheckCircle2, XCircle, ArrowRight,
  Search, Filter, Clock, ChevronRight, Video, Plus, ExternalLink,
  HelpCircle, Eye, Info, Check, X, AlertCircle, Globe
} from "lucide-react";
import {
  type JobPostingData,
  type RecruiterApplicationDetail,
} from "@/lib/recruiter-api";
import { ApplicationStageActions } from "./applications/ApplicationStageActions";
import { applicationStageLabels, applicationStageStyles } from "@/lib/application-stage";
import {
  type InterviewData,
  interviewTypeLabels,
  interviewStatusLabels,
  candidateResponseLabels,
} from "@/lib/interview-api";
import { format } from "date-fns";

export type PillarDimension = "skills" | "experience" | "education" | "other";

interface CandidateScoringWorkspaceProps {
  job: JobPostingData;
  applications: any[];
  selectedAppId: string | null;
  selectedApplicationDetail: RecruiterApplicationDetail | null;
  onSelectApplication: (appId: string) => void;
  token: string;
  onRefresh: () => void;
  onScheduleInterview: () => void;
  onFeedbackInterview: (interview: InterviewData) => void;
}

const AI_PENDING_STATUSES = new Set([
  "UPLOADED", "QUEUED", "PARSING", "NORMALIZING", "MATCHING", "SCORING"
]);

function isAiEvaluationPending(status: unknown): boolean {
  return typeof status === "string" && AI_PENDING_STATUSES.has(status);
}

export function CandidateScoringWorkspace({
  job,
  applications,
  selectedAppId,
  selectedApplicationDetail,
  onSelectApplication,
  token,
  onRefresh,
  onScheduleInterview,
  onFeedbackInterview,
}: CandidateScoringWorkspaceProps) {
  // Local state for search, filter & active explanation dimension
  const [searchQuery, setSearchQuery] = useState("");
  const [levelFilter, setLevelFilter] = useState<"ALL" | "HIGH" | "MEDIUM" | "LOW">("ALL");
  const [activePillar, setActivePillar] = useState<PillarDimension | null>("skills");

  // Reset active explanation dimension or keep skills when changing candidate
  useEffect(() => {
    // When selectedAppId changes, keep default pillar or reset to skills
    setActivePillar("skills");
  }, [selectedAppId]);

  // Sort & filter candidate applications
  const sortedAndFilteredApps = useMemo(() => {
    return [...applications]
      .filter((app) => {
        const aiResult = app.aiMatchingResults?.[0];
        const fullName = app.candidate?.user?.fullName?.toLowerCase() || "";
        const email = app.candidate?.user?.email?.toLowerCase() || "";
        const title = app.candidate?.desiredTitle?.toLowerCase() || "";
        const q = searchQuery.toLowerCase().trim();

        const matchSearch = !q || fullName.includes(q) || email.includes(q) || title.includes(q);
        const matchLevel = levelFilter === "ALL" || aiResult?.matchLevel === levelFilter;

        return matchSearch && matchLevel;
      })
      .sort((a, b) => {
        const scoreA = a.aiMatchingResults?.[0] ? Number(a.aiMatchingResults[0].overallScore) : 0;
        const scoreB = b.aiMatchingResults?.[0] ? Number(b.aiMatchingResults[0].overallScore) : 0;
        return scoreB - scoreA;
      });
  }, [applications, searchQuery, levelFilter]);

  // Determine active candidate
  const currentAppListItem = useMemo(() => {
    if (!sortedAndFilteredApps.length) return null;
    return sortedAndFilteredApps.find((app) => app.id === selectedAppId) || sortedAndFilteredApps[0];
  }, [sortedAndFilteredApps, selectedAppId]);

  const activeAppId = currentAppListItem?.id || null;

  // Weights configuration from Job
  const sWeight = Number(job.skillWeight) || 40;
  const eWeight = Number(job.experienceWeight) || 30;
  const edWeight = Number(job.educationWeight) || 15;
  const oWeight = Number(job.otherWeight) || 15;

  // Active candidate details
  const detail = selectedApplicationDetail && selectedApplicationDetail.id === activeAppId
    ? selectedApplicationDetail
    : null;

  const snapshot = detail?.profileSnapshot as {
    evaluationInput?: {
      candidate_profile?: {
        professional_summary?: string;
        work_experiences?: Array<Record<string, unknown>>;
        educations?: Array<Record<string, unknown>>;
        projects?: Array<Record<string, unknown>>;
        skills?: Array<Record<string, unknown>>;
      };
    };
  } | null;
  const snapshotProfile = snapshot?.evaluationInput?.candidate_profile;

  const professionalSummary = (detail?.candidate as any)?.professionalSummary || snapshotProfile?.professional_summary || null;

  const workExps = (((detail?.candidate as any)?.workExperiences?.length
    ? (detail?.candidate as any).workExperiences
    : (snapshotProfile?.work_experiences ?? []).map((item) => ({
        companyName: item.company_name,
        positionTitle: item.position_title,
        startDate: item.start_date,
        endDate: item.end_date,
        description: item.description,
        achievements: item.achievements,
      }))) || []
  ) as Array<Record<string, any>>;

  const educations = (((detail?.candidate as any)?.educations?.length
    ? (detail?.candidate as any).educations
    : (snapshotProfile?.educations ?? []).map((item) => ({
        schoolName: item.school_name,
        degree: item.degree,
        major: item.major,
        startDate: item.start_date,
        endDate: item.end_date,
      }))) || []
  ) as Array<Record<string, any>>;

  const projects = (((detail?.candidate as any)?.projects?.length
    ? (detail?.candidate as any).projects
    : (snapshotProfile?.projects ?? []).map((item) => ({
        projectName: item.project_name,
        projectRole: item.project_role,
        description: item.description,
        technologies: item.technologies,
        projectUrl: item.project_url,
      }))) || []
  ) as Array<Record<string, any>>;

  const certifications = (((detail?.candidate as any)?.certifications?.length
    ? (detail?.candidate as any).certifications
    : ((snapshotProfile as any)?.certifications ?? []).map((item: any) => ({
        name: item.certification_name || item.name,
        issuingOrg: item.issuing_organization || item.issuingOrg,
        issuedDate: item.issued_date || item.issuedDate,
        credentialUrl: item.credential_url || item.credentialUrl,
      }))) || []
  ) as Array<Record<string, any>>;

  const languages = (((detail?.candidate as any)?.languages?.length
    ? (detail?.candidate as any).languages
    : ((snapshotProfile as any)?.languages ?? []).map((item: any) => ({
        language: item.language,
        proficiency: item.proficiency,
      }))) || []
  ) as Array<Record<string, any>>;

  const candidateSkills = (((detail?.candidate as any)?.candidateSkills?.length
    ? (detail?.candidate as any).candidateSkills
    : (snapshotProfile?.skills ?? []).map((item) => ({
        proficiencyLevel: item.proficiency_level,
        skill: { name: item.skill_name },
      }))) || []
  ) as Array<Record<string, any>>;

  const aiResult = (detail?.latestAiResult as any) || (currentAppListItem?.aiMatchingResults?.[0] as any);
  const candUser = detail?.candidate || currentAppListItem?.candidate?.user;
  const desiredTitle = detail?.candidate?.desiredTitle || currentAppListItem?.candidate?.desiredTitle;
  const overallScore = aiResult ? Math.round(Number(aiResult.overallScore)) : 0;
  const matchLevel = aiResult?.matchLevel || "UNDETERMINED";
  const isPending = !aiResult && isAiEvaluationPending(currentAppListItem?.processingStatus);
  const isFailed = !aiResult && currentAppListItem?.processingStatus === "FAILED";

  // Calibrate pillar points from pillar_explanations (post domain modifier & mandatory penalties)
  const pillarExplanations = (aiResult?.inputSnapshot as any)?.pillar_explanations || (aiResult?.pillarExplanations as any);

  // Raw base calculations
  const rawSkillsPts = (Number(aiResult?.skillScore) || 0) * (sWeight / 100);
  const rawExpPts = (Number(aiResult?.experienceScore) || 0) * (eWeight / 100);
  const rawEduPts = (Number(aiResult?.educationScore) || 0) * (edWeight / 100);
  const rawOtherPts = (Number(aiResult?.projectScore) || 0) * (oWeight / 100);
  const rawTotalPts = +(rawSkillsPts + rawExpPts + rawEduPts + rawOtherPts).toFixed(1);

  // Calibrated pillar points
  const sPts = pillarExplanations?.skills?.earned_points != null
    ? Number(Number(pillarExplanations.skills.earned_points).toFixed(1))
    : +rawSkillsPts.toFixed(1);

  const ePts = pillarExplanations?.experience?.earned_points != null
    ? Number(Number(pillarExplanations.experience.earned_points).toFixed(1))
    : +rawExpPts.toFixed(1);

  const edPts = pillarExplanations?.education?.earned_points != null
    ? Number(Number(pillarExplanations.education.earned_points).toFixed(1))
    : +rawEduPts.toFixed(1);

  const oPts = pillarExplanations?.other?.earned_points != null
    ? Number(Number(pillarExplanations.other.earned_points).toFixed(1))
    : +rawOtherPts.toFixed(1);

  // Effective percentages (score achieved relative to pillar weight)
  const sPercent = Math.min(100, Math.round((sPts / sWeight) * 100));
  const ePercent = Math.min(100, Math.round((ePts / eWeight) * 100));
  const edPercent = Math.min(100, Math.round((edPts / edWeight) * 100));
  const oPercent = Math.min(100, Math.round((oPts / oWeight) * 100));

  // Check if domain modifier or mandatory gating reduced the score
  const hasPenaltyAdjustment = rawTotalPts > overallScore + 5;

  // Pillar configuration items
  const pillarCards = [
    {
      id: "skills" as PillarDimension,
      label: "KỸ NĂNG",
      subLabel: "Chuyên môn & Nghiệp vụ",
      icon: Code,
      score: sPts,
      maxScore: sWeight,
      percent: sPercent,
      color: "blue",
      activeBorder: "border-[#2563EB] ring-2 ring-[#2563EB]/20 bg-[#EFF6FF]",
      badgeColor: "bg-blue-100 text-[#2563EB]",
      barColor: "bg-[#2563EB]",
    },
    {
      id: "experience" as PillarDimension,
      label: "KINH NGHIỆM",
      subLabel: "Thâm niên & Cấp bậc",
      icon: Briefcase,
      score: ePts,
      maxScore: eWeight,
      percent: ePercent,
      color: "emerald",
      activeBorder: "border-emerald-600 ring-2 ring-emerald-600/20 bg-emerald-50/70",
      badgeColor: "bg-emerald-100 text-emerald-800",
      barColor: "bg-emerald-600",
    },
    {
      id: "education" as PillarDimension,
      label: "HỌC VẤN",
      subLabel: "Bằng cấp & Chuyên ngành",
      icon: GraduationCap,
      score: edPts,
      maxScore: edWeight,
      percent: edPercent,
      color: "purple",
      activeBorder: "border-purple-600 ring-2 ring-purple-600/20 bg-purple-50/70",
      badgeColor: "bg-purple-100 text-purple-800",
      barColor: "bg-purple-600",
    },
    {
      id: "other" as PillarDimension,
      label: "NGOẠI NGỮ & CHỨNG CHỈ",
      subLabel: "Ngoại ngữ, Chứng chỉ & Dự án",
      icon: Award,
      score: oPts,
      maxScore: oWeight,
      percent: oPercent,
      color: "amber",
      activeBorder: "border-amber-600 ring-2 ring-amber-600/20 bg-amber-50/70",
      badgeColor: "bg-amber-100 text-amber-800",
      barColor: "bg-amber-600",
    },
  ];

  return (
    <div className="space-y-4">
      {/* ========================================================================= */}
      {/* 2-COLUMN CANDIDATE SCORING WORKSPACE (MASTER - DETAIL)                    */}
      {/* ========================================================================= */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        
        {/* ======================================================================= */}
        {/* LEFT COLUMN: CANDIDATE MASTER LIST (lg:col-span-4)                      */}
        {/* ======================================================================= */}
        <div className="lg:col-span-4 space-y-3">
          {/* Search & Filter Header */}
          <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-2xs space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-black text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
                <Sparkles className="w-4 h-4 text-[#2563EB]" /> Xếp Hạng Ứng Viên ({sortedAndFilteredApps.length})
              </h3>
              <span className="text-[11px] font-bold text-slate-500 bg-slate-100 px-2 py-0.5 rounded-md">
                Tổng: {applications.length}
              </span>
            </div>

            {/* Search Input */}
            <div className="relative">
              <Search className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
              <input
                type="text"
                placeholder="Tìm tên, email, chức danh..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl outline-none text-[#1F2937] focus:bg-white focus:border-[#2563EB] focus:ring-2 focus:ring-[#2563EB]/20 transition-all"
              />
            </div>

            {/* Match Level Filter Chips */}
            <div className="flex items-center gap-1.5 pt-1 overflow-x-auto text-[11px] font-bold">
              <button
                type="button"
                onClick={() => setLevelFilter("ALL")}
                className={`px-2.5 py-1 rounded-lg border transition-all ${
                  levelFilter === "ALL"
                    ? "bg-[#1F2937] text-white border-[#1F2937]"
                    : "bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100"
                }`}
              >
                Tất cả ({applications.length})
              </button>
              <button
                type="button"
                onClick={() => setLevelFilter("HIGH")}
                className={`px-2.5 py-1 rounded-lg border transition-all ${
                  levelFilter === "HIGH"
                    ? "bg-emerald-600 text-white border-emerald-600"
                    : "bg-emerald-50 text-emerald-800 border-emerald-200 hover:bg-emerald-100"
                }`}
              >
                Cao (≥80đ)
              </button>
              <button
                type="button"
                onClick={() => setLevelFilter("MEDIUM")}
                className={`px-2.5 py-1 rounded-lg border transition-all ${
                  levelFilter === "MEDIUM"
                    ? "bg-amber-600 text-white border-amber-600"
                    : "bg-amber-50 text-amber-800 border-amber-200 hover:bg-amber-100"
                }`}
              >
                Trung bình
              </button>
              <button
                type="button"
                onClick={() => setLevelFilter("LOW")}
                className={`px-2.5 py-1 rounded-lg border transition-all ${
                  levelFilter === "LOW"
                    ? "bg-rose-600 text-white border-rose-600"
                    : "bg-rose-50 text-rose-800 border-rose-200 hover:bg-rose-100"
                }`}
              >
                Thấp
              </button>
            </div>
          </div>

          {/* Candidate List Cards */}
          <div className="space-y-2 max-h-[calc(100vh-280px)] overflow-y-auto pr-1">
            {sortedAndFilteredApps.length > 0 ? (
              sortedAndFilteredApps.map((app, idx) => {
                const appAi = app.aiMatchingResults?.[0];
                const appUser = app.candidate?.user || app.candidate;
                const score = appAi ? Math.round(Number(appAi.overallScore)) : 0;
                const isSelected = activeAppId === app.id;
                const matchedCount = appAi?.matchedSkills?.length || 0;
                const appPending = !appAi && isAiEvaluationPending(app.processingStatus);

                return (
                  <div
                    key={app.id}
                    onClick={() => onSelectApplication(app.id)}
                    role="button"
                    tabIndex={0}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" || e.key === " ") {
                        e.preventDefault();
                        onSelectApplication(app.id);
                      }
                    }}
                    aria-label={`Ứng viên ${appUser?.fullName || "Ứng viên"}, điểm AI: ${score} trên 100`}
                    aria-selected={isSelected}
                    className={`p-3.5 rounded-2xl border transition-all cursor-pointer relative ${
                      isSelected
                        ? "bg-[#EFF6FF] border-[#2563EB] shadow-md ring-2 ring-[#2563EB]/20 z-10"
                        : "bg-white border-slate-200 hover:border-blue-300 hover:bg-slate-50/80"
                    }`}
                  >
                    <div className="flex items-start justify-between gap-3">
                      {/* Rank & Avatar & Name */}
                      <div className="flex items-center gap-3 min-w-0">
                        <div
                          className={`w-7 h-7 rounded-lg flex items-center justify-center font-black text-xs shrink-0 ${
                            idx === 0
                              ? "bg-amber-100 text-amber-800 border border-amber-300"
                              : idx === 1
                              ? "bg-slate-200 text-slate-700 border border-slate-300"
                              : idx === 2
                              ? "bg-orange-100 text-orange-800 border border-orange-300"
                              : "bg-slate-100 text-slate-500"
                          }`}
                        >
                          #{idx + 1}
                        </div>

                        <div className="w-9 h-9 rounded-full bg-[#2563EB] text-white font-black flex items-center justify-center text-xs overflow-hidden shrink-0 shadow-2xs">
                          {appUser?.avatarUrl ? (
                            <img src={appUser.avatarUrl} alt="" className="w-full h-full object-cover" />
                          ) : (
                            appUser?.fullName?.charAt(0) || "U"
                          )}
                        </div>

                        <div className="min-w-0">
                          <h4 className="font-extrabold text-xs text-[#1F2937] truncate">
                            {appUser?.fullName || "Ứng viên"}
                          </h4>
                          <p className="text-[11px] text-slate-500 truncate">
                            {app.candidate?.desiredTitle || "Ứng viên"}
                          </p>
                        </div>
                      </div>

                      {/* Score Badge */}
                      <div className="text-right shrink-0">
                        {appPending ? (
                          <span className="text-[10px] font-bold px-2 py-1 rounded-md bg-blue-50 text-[#2563EB] animate-pulse">
                            Đang chấm...
                          </span>
                        ) : (
                          <div className="flex flex-col items-end">
                            <span
                              className={`text-base font-black leading-none ${
                                score >= (job.autoShortlistThreshold || 80)
                                  ? "text-emerald-600"
                                  : score < (job.autoRejectThreshold || 40)
                                  ? "text-rose-600"
                                  : "text-amber-500"
                              }`}
                            >
                              {score} <span className="text-[10px] text-slate-400 font-normal">/ 100</span>
                            </span>
                            <span
                              className={`text-[9px] font-extrabold uppercase px-1.5 py-0.2 rounded mt-1 border ${
                                appAi?.matchLevel === "HIGH"
                                  ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                                  : appAi?.matchLevel === "MEDIUM"
                                  ? "bg-amber-50 text-amber-700 border-amber-200"
                                  : "bg-rose-50 text-rose-700 border-rose-200"
                              }`}
                            >
                              {appAi?.matchLevel || "LOW"}
                            </span>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Bottom Metadata: Stage & Skills matched */}
                    <div className="flex items-center justify-between gap-2 mt-2.5 pt-2 border-t border-slate-100 text-[10px]">
                      <span className="font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                        ✓ {matchedCount} Kỹ năng
                      </span>
                      <span
                        className={`font-bold px-2 py-0.5 rounded border ${
                          applicationStageStyles[app.currentStage as keyof typeof applicationStageStyles] ||
                          "bg-slate-100 text-slate-700 border-slate-200"
                        }`}
                      >
                        {applicationStageLabels[app.currentStage as keyof typeof applicationStageLabels] || app.currentStage}
                      </span>
                    </div>
                  </div>
                );
              })
            ) : (
              <div className="p-8 bg-white rounded-2xl border border-slate-200 text-center text-slate-400 text-xs">
                Không tìm thấy ứng viên phù hợp với bộ lọc.
              </div>
            )}
          </div>
        </div>

        {/* ======================================================================= */}
        {/* RIGHT COLUMN: CANDIDATE DETAIL & SCORING STUDIO (lg:col-span-8)         */}
        {/* ======================================================================= */}
        <div className="lg:col-span-8 space-y-4">
          {currentAppListItem ? (
            <>
              {/* 1. STICKY CANDIDATE HEADER */}
              <div className="sticky top-2 z-20 bg-white/95 backdrop-blur-md p-5 rounded-2xl border border-slate-200 shadow-md space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  {/* Candidate Identity */}
                  <div className="flex items-center gap-3.5 min-w-0">
                    <div className="w-14 h-14 rounded-2xl bg-[#2563EB] text-white font-black text-xl flex items-center justify-center shrink-0 shadow-sm">
                      {candUser?.avatarUrl ? (
                        <img src={candUser.avatarUrl} alt="" className="w-full h-full object-cover rounded-2xl" />
                      ) : (
                        candUser?.fullName?.charAt(0) || "U"
                      )}
                    </div>
                    <div className="min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <h2 className="text-lg font-black text-[#1F2937] truncate">
                          {candUser?.fullName || "Ứng viên"}
                        </h2>
                        <span
                          className={`text-xs font-black px-2.5 py-0.5 rounded-full border ${
                            applicationStageStyles[currentAppListItem.currentStage as keyof typeof applicationStageStyles] ||
                            "bg-slate-100 text-slate-700 border-slate-200"
                          }`}
                        >
                          {applicationStageLabels[currentAppListItem.currentStage as keyof typeof applicationStageLabels] || currentAppListItem.currentStage}
                        </span>
                      </div>
                      <p className="text-xs text-slate-500 font-semibold truncate flex items-center gap-2 mt-0.5">
                        <span className="text-[#2563EB] font-bold">{desiredTitle || "Ứng viên"}</span>
                        <span>•</span>
                        <span>{candUser?.email}</span>
                        {candUser?.phone && (
                          <>
                            <span>•</span>
                            <span>{candUser.phone}</span>
                          </>
                        )}
                      </p>
                    </div>
                  </div>

                  {/* AI Overall Score Hero Badge */}
                  <div className="flex items-center gap-3 bg-gradient-to-br from-slate-50 to-blue-50/50 px-4 py-2.5 rounded-2xl border border-blue-200 shrink-0">
                    <div className="text-right">
                      <span className="text-[10px] font-black text-slate-400 uppercase tracking-wider block">
                        ĐIỂM AI MATCHING
                      </span>
                      <span
                        className={`text-2xl font-black ${
                          overallScore >= (job.autoShortlistThreshold || 80)
                            ? "text-emerald-600"
                            : overallScore < (job.autoRejectThreshold || 40)
                            ? "text-rose-600"
                            : "text-amber-500"
                        }`}
                      >
                        {overallScore}{" "}
                        <span className="text-xs font-normal text-slate-400">/ 100</span>
                      </span>
                    </div>

                    <div className="flex flex-col items-end gap-1">
                      <span
                        className={`text-[11px] font-black px-2.5 py-0.5 rounded-full border ${
                          matchLevel === "HIGH"
                            ? "bg-emerald-100 text-emerald-800 border-emerald-300"
                            : matchLevel === "MEDIUM"
                            ? "bg-amber-100 text-amber-800 border-amber-300"
                            : "bg-rose-100 text-rose-800 border-rose-300"
                        }`}
                      >
                        {matchLevel} MATCH
                      </span>
                      {aiResult?.confidenceScore !== undefined && (
                        <span className="text-[10px] font-bold text-slate-500 flex items-center gap-1">
                          <ShieldCheck className="w-3 h-3 text-emerald-600" />
                          Phủ dữ liệu {Math.round(Number(aiResult.confidenceScore) * 100)}%
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                {/* Quick Stage Actions & Interview trigger */}
                {detail && (
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-3 border-t border-slate-100">
                    <span className="text-xs text-slate-500 font-medium">
                      Quyết định tuyển dụng cho ứng viên này:
                    </span>
                    <ApplicationStageActions
                      token={token}
                      applicationId={detail.id}
                      currentStage={detail.currentStage}
                      allowedTransitions={detail.allowedTransitions}
                      currentHrNotes={detail.hrNotes}
                      onUpdated={onRefresh}
                      onScheduleInterview={onScheduleInterview}
                    />
                  </div>
                )}
              </div>

              {/* 2. FOUR INTERACTIVE SCORE CARDS (4 TRỌNG SỐ ĐIỂM THÀNH PHẦN) */}
              <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs space-y-3">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-xs font-black text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
                      <Sparkles className="w-4 h-4 text-[#2563EB]" /> 4 Tiêu Chí Chấm Điểm AI (Interactive Score Cards)
                    </h3>
                    <p className="text-[11px] text-slate-500 font-medium mt-0.5">
                      Click vào từng thẻ để xem chi tiết bằng chứng và lý do AI chấm điểm tương ứng.
                    </p>
                  </div>
                  <span className="text-[11px] font-mono font-bold text-[#2563EB] bg-blue-50 px-2.5 py-1 rounded-lg border border-blue-200">
                    {sPts} + {ePts} + {edPts} + {oPts} = {overallScore} đ
                  </span>
                </div>

                {/* 4 Cards Grid */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3" role="tablist" aria-label="Tiêu chí chấm điểm AI">
                  {pillarCards.map((card) => {
                    const Icon = card.icon;
                    const isActive = activePillar === card.id;

                    return (
                      <button
                        key={card.id}
                        type="button"
                        role="tab"
                        aria-selected={isActive}
                        aria-controls={`panel-${card.id}`}
                        id={`tab-${card.id}`}
                        onClick={() => setActivePillar(card.id)}
                        className={`p-3.5 rounded-xl border text-left transition-all relative overflow-hidden group focus:outline-none focus:ring-2 focus:ring-[#2563EB] ${
                          isActive
                            ? `${card.activeBorder} shadow-sm`
                            : "bg-slate-50/80 border-slate-200 hover:border-slate-300 hover:bg-white"
                        }`}
                      >
                        {/* Top: Icon + Label */}
                        <div className="flex items-center justify-between gap-1 mb-2">
                          <span className="text-[10px] font-black uppercase tracking-wider text-slate-600 flex items-center gap-1">
                            <Icon className={`w-3.5 h-3.5 ${isActive ? "text-[#2563EB]" : "text-slate-400"}`} />
                            {card.label}
                          </span>
                          {isActive && (
                            <span className="w-2 h-2 rounded-full bg-[#2563EB] animate-pulse" />
                          )}
                        </div>

                        {/* Middle: Score / Max */}
                        <div className="flex items-baseline gap-1 my-1">
                          <span className="text-xl font-black text-[#1F2937]">
                            {card.score}
                          </span>
                          <span className="text-xs font-bold text-slate-400">
                            / {card.maxScore} đ
                          </span>
                        </div>

                        {/* Progress Bar */}
                        <div className="w-full bg-slate-200/80 rounded-full h-1.5 overflow-hidden my-2">
                          <div
                            className={`h-full rounded-full transition-all duration-300 ${card.barColor}`}
                            style={{ width: `${card.percent}%` }}
                          />
                        </div>

                        {/* Bottom hint */}
                        <div className="flex items-center justify-between text-[10px] font-bold pt-1 text-slate-500">
                          <span>{card.percent}% đạt</span>
                          <span className={`${isActive ? "text-[#2563EB] font-black" : "text-slate-400 group-hover:text-slate-700"}`}>
                            {isActive ? "Đang xem" : "Xem →"}
                          </span>
                        </div>
                      </button>
                    );
                  })}
                </div>

                {/* Domain / Gating Adjustment Alert Banner */}
                {hasPenaltyAdjustment && (
                  <div className="p-3.5 bg-amber-50 border border-amber-200 rounded-xl flex items-start gap-2.5 text-xs text-amber-900 shadow-2xs">
                    <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                    <div className="space-y-1">
                      <div className="flex flex-wrap items-center gap-2 font-black">
                        <span>ĐIỂM SỐ ĐÃ ĐƯỢC ĐIỀU CHỈNH GIẢM THEO TIÊU CHUẨN ĐẶC THÙ NGÀNH</span>
                        <span className="text-[10px] px-2 py-0.5 bg-amber-200 text-amber-900 rounded font-bold uppercase">
                          Hệ số Ngành / Gating Tiên quyết
                        </span>
                      </div>
                      <p className="text-[11px] text-amber-800 leading-relaxed">
                        Điểm kỹ thuật ban đầu: <strong>{rawTotalPts}/100 đ</strong> (Kỹ năng: {rawSkillsPts.toFixed(1)}đ, Kinh nghiệm: {rawExpPts.toFixed(1)}đ, Học vấn: {rawEduPts.toFixed(1)}đ, Dự án: {rawOtherPts.toFixed(1)}đ).
                        Hồ sơ có <strong>sai lệch về mô hình ngành hàng cốt lõi</strong> hoặc <strong>thiếu hụt tiêu chí tiên quyết</strong>, nên điểm thực nhận của các tiêu chí đã được tự động áp dụng hệ số điều chỉnh chính xác ({sPts} + {ePts} + {edPts} + {oPts} = {overallScore} đ).
                      </p>
                    </div>
                  </div>
                )}
              </div>

              {/* ================================================================= */}
              {/* 3. DYNAMIC EXPLANATION PANEL (CHỈ DUY NHẤT 1 PANEL ĐƯỢC HIỂN THỊ) */}
              {/* ================================================================= */}
              <div
                id={`panel-${activePillar}`}
                role="tabpanel"
                aria-labelledby={`tab-${activePillar}`}
                className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-5"
              >
                {!activePillar ? (
                  <div className="p-8 text-center bg-slate-50 rounded-xl border border-dashed border-slate-200 text-slate-500 text-xs space-y-2">
                    <Sparkles className="w-6 h-6 mx-auto text-slate-400" />
                    <p className="font-bold">Chọn một tiêu chí điểm số ở trên để xem cách AI đánh giá ứng viên.</p>
                  </div>
                ) : activePillar === "skills" ? (
                  /* ======================= EXPLANATION: SKILLS ======================= */
                  <div className="space-y-5">
                    {/* Header */}
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100">
                      <div className="flex items-center gap-2.5">
                        <div className="p-2.5 rounded-xl bg-blue-50 text-[#2563EB] border border-blue-200">
                          <Code className="w-5 h-5" />
                        </div>
                        <div>
                          <h4 className="font-black text-sm text-[#1F2937]">GIẢI THÍCH CHI TIẾT: TIÊU CHÍ KỸ NĂNG CHUYÊN MÔN</h4>
                          <p className="text-xs text-slate-500">Đối chiếu danh mục kỹ năng JD với bằng chứng thực tế trong hồ sơ</p>
                        </div>
                      </div>
                      <div className="text-right bg-blue-50 px-3.5 py-1.5 rounded-xl border border-blue-200 shrink-0">
                        <span className="text-[10px] font-bold text-slate-500 block uppercase">Đóng góp vào tổng điểm</span>
                        <span className="text-sm font-black text-[#2563EB]">{sPts} / {sWeight} điểm ({sPercent}%)</span>
                      </div>
                    </div>

                    {/* 1. JD Requirements vs Matched Evidence */}
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <h5 className="text-xs font-black text-emerald-800 uppercase tracking-wider flex items-center gap-1.5">
                          <CheckCircle2 className="w-4 h-4 text-emerald-600" /> 1. Bằng chứng Kỹ năng Xác thực thành công ({aiResult?.matchedSkills?.length || 0})
                        </h5>
                        <span className="text-[11px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                          Đã xác thực qua AI Embedder & Bằng chứng thực tế
                        </span>
                      </div>

                      {aiResult?.matchedSkills && aiResult.matchedSkills.length > 0 ? (
                        <div className="space-y-3">
                          {aiResult.matchedSkills.map((sk: any, i: number) => {
                            const skName = typeof sk === "string" ? sk : sk?.name || "";
                            const isMand = typeof sk === "object" ? Boolean(sk?.isMandatory) : !(aiResult?.missingRequiredSkills || []).includes(skName);
                            const ev = (aiResult?.evidence || []).find((e: any) => e.skillName === skName || e.skill_name === skName);

                            return (
                              <div
                                key={i}
                                className="p-4 bg-emerald-50/70 border border-emerald-200 rounded-xl space-y-2.5 text-xs shadow-2xs"
                              >
                                <div className="flex flex-wrap items-center justify-between gap-2">
                                  <div className="flex items-center gap-2">
                                    <span className="font-black text-emerald-950 text-sm flex items-center gap-1.5">
                                      <Check className="w-4 h-4 text-emerald-700 shrink-0" /> {skName}
                                    </span>
                                    {sk.proficiencyLevel && (
                                      <span className="px-2 py-0.5 text-[10px] font-bold rounded bg-white text-emerald-800 border border-emerald-300">
                                        Cấp độ: {sk.proficiencyLevel}
                                      </span>
                                    )}
                                  </div>
                                  <span className={`text-[10px] font-black px-2.5 py-1 rounded-full ${
                                    isMand ? "bg-emerald-200 text-emerald-900 border border-emerald-300" : "bg-emerald-100 text-emerald-800"
                                  }`}>
                                    {isMand ? "Tiêu chí Tiên quyết (Mandatory) ✓" : "Kỹ năng Bổ trợ ✓"}
                                  </span>
                                </div>

                                {/* Years Gap / Seniority Analysis */}
                                {sk.years_gap?.penalty_msg ? (
                                  <div className="p-2.5 bg-amber-50 border border-amber-200 rounded-lg text-amber-900 text-[11px] font-medium flex items-start gap-1.5">
                                    <AlertTriangle className="w-3.5 h-3.5 text-amber-600 shrink-0 mt-0.5" />
                                    <span>{sk.years_gap.penalty_msg}</span>
                                  </div>
                                ) : sk.years_gap?.bonus_msg ? (
                                  <div className="p-2.5 bg-emerald-100/80 border border-emerald-300 rounded-lg text-emerald-900 text-[11px] font-medium flex items-start gap-1.5">
                                    <Sparkles className="w-3.5 h-3.5 text-emerald-700 shrink-0 mt-0.5" />
                                    <span>{sk.years_gap.bonus_msg}</span>
                                  </div>
                                ) : null}

                                {/* Quote Evidence Box */}
                                {ev ? (
                                  <div className="bg-white p-3 rounded-xl border border-emerald-200 shadow-2xs space-y-1.5">
                                    <div className="flex items-center justify-between text-[11px]">
                                      <span className="font-bold text-[#2563EB] flex items-center gap-1">
                                        📌 Bằng chứng trích xuất từ: <strong>{ev.source}</strong>
                                      </span>
                                      {ev.confidence && (
                                        <span className="text-slate-400 font-medium text-[10px]">
                                          Độ khớp: {Math.round(Number(ev.confidence) * 100)}%
                                        </span>
                                      )}
                                    </div>
                                    <p className="italic text-xs text-slate-700 leading-relaxed bg-slate-50 p-2.5 rounded-lg border border-slate-100">
                                      "{ev.evidenceText}"
                                    </p>
                                  </div>
                                ) : (
                                  <p className="text-[11px] text-slate-500 italic bg-white/70 p-2 rounded-lg border border-emerald-100">
                                    Xác thực thông qua ngữ cảnh công việc và dữ liệu hồ sơ khai báo.
                                  </p>
                                )}
                              </div>
                            );
                          })}
                        </div>
                      ) : (
                        <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 text-slate-500 text-xs italic">
                          Chưa tìm thấy bằng chứng kỹ năng khớp trực tiếp với yêu cầu JD.
                        </div>
                      )}
                    </div>

                    {/* 2. Missing Skills Analysis */}
                    {aiResult?.missingSkills && aiResult.missingSkills.length > 0 && (
                      <div className="space-y-3 pt-3 border-t border-slate-100">
                        <div className="flex items-center justify-between">
                          <h5 className="text-xs font-black text-rose-800 uppercase tracking-wider flex items-center gap-1.5">
                            <AlertCircle className="w-4 h-4 text-rose-600" /> 2. Kỹ năng Chưa tìm thấy Bằng chứng hoặc Thiếu hụt ({aiResult.missingSkills.length})
                          </h5>
                          <span className="text-[11px] font-bold text-rose-700 bg-rose-50 px-2 py-0.5 rounded border border-rose-200">
                            Cần phỏng vấn xác thực thêm
                          </span>
                        </div>

                        <div className="space-y-2.5">
                          {aiResult.missingSkills.map((sk: any, i: number) => {
                            const skName = typeof sk === "string" ? sk : sk?.name || "";
                            const isMand = typeof sk === "object" ? Boolean(sk?.isMandatory) : (aiResult?.missingRequiredSkills || []).includes(skName);
                            
                            // Find specific gap message from AI
                            const gapsList: string[] = Array.isArray(aiResult?.gaps) ? aiResult.gaps : [];
                            const cleanName = skName.toLowerCase().split("(")[0].trim();
                            const matchedGap = gapsList.find((g: string) => {
                              const gl = g.toLowerCase();
                              return gl.includes(cleanName) || gl.includes(skName.toLowerCase());
                            });

                            const gapExplanation = matchedGap || (
                              isMand
                                ? `Chưa ghi nhận thâm niên hoặc bằng chứng thực tế liên quan đến kỹ năng tiên quyết: "${skName}". AI đã áp dụng cơ chế trừ điểm theo tiêu chuẩn Mandatory Gating.`
                                : `Chưa tìm thấy bằng chứng hoặc từ khóa bổ trợ xác thực kỹ năng "${skName}" trong lịch sử làm việc và dự án thực tế của ứng viên.`
                            );

                            return (
                              <div
                                key={i}
                                className="p-3.5 bg-rose-50/80 border border-rose-200 rounded-xl text-xs space-y-1.5"
                              >
                                <div className="flex flex-wrap items-center justify-between gap-2">
                                  <span className="font-bold text-rose-950 text-sm flex items-center gap-1.5">
                                    <span className="text-rose-600 font-black">✕</span> {skName}
                                  </span>
                                  <span className={`text-[10px] font-black px-2.5 py-0.5 rounded-full ${
                                    isMand ? "bg-rose-200 text-rose-900 border border-rose-300" : "bg-slate-200 text-slate-700"
                                  }`}>
                                    {isMand ? "Tiêu chí Tiên quyết (Trừ điểm)" : "Kỹ năng Bổ trợ"}
                                  </span>
                                </div>
                                <p className="text-[11px] text-rose-800 leading-relaxed font-medium bg-white/70 p-2.5 rounded-lg border border-rose-100">
                                  {gapExplanation}
                                </p>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    )}
                  </div>
                ) : activePillar === "experience" ? (
                  /* ======================= EXPLANATION: EXPERIENCE ======================= */
                  <div className="space-y-5">
                    {/* Header */}
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100">
                      <div className="flex items-center gap-2.5">
                        <div className="p-2.5 rounded-xl bg-emerald-50 text-emerald-700 border border-emerald-200">
                          <Briefcase className="w-5 h-5" />
                        </div>
                        <div>
                          <h4 className="font-black text-sm text-[#1F2937]">GIẢI THÍCH CHI TIẾT: TIÊU CHÍ KINH NGHIỆM & CẤP BẬC</h4>
                          <p className="text-xs text-slate-500">Đánh giá thâm niên tích lũy, cấp bậc quản lý & độ tương đồng chức danh</p>
                        </div>
                      </div>
                      <div className="text-right bg-emerald-50 px-3.5 py-1.5 rounded-xl border border-emerald-200 shrink-0">
                        <span className="text-[10px] font-bold text-slate-500 block uppercase">Đóng góp vào tổng điểm</span>
                        <span className="text-sm font-black text-emerald-800">{ePts} / {eWeight} điểm ({ePercent}%)</span>
                      </div>
                    </div>

                    {/* Level Fit & Tenure Evaluation KPI Grid */}
                    <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl space-y-3 text-xs">
                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                        <div className="bg-white p-3 rounded-xl border border-slate-200 shadow-2xs">
                          <span className="text-slate-400 block text-[10px] font-bold uppercase">Cấp bậc Ứng viên</span>
                          <strong className="text-[#1F2937] text-sm block mt-0.5">{aiResult?.candidateExperienceLevel || "Chưa xác định"}</strong>
                        </div>
                        <div className="bg-white p-3 rounded-xl border border-slate-200 shadow-2xs">
                          <span className="text-slate-400 block text-[10px] font-bold uppercase">Yêu cầu JD</span>
                          <strong className="text-[#1F2937] text-sm block mt-0.5">{aiResult?.requiredExperienceLevel || job.experienceLevel || "JUNIOR"}</strong>
                        </div>
                        <div className="bg-white p-3 rounded-xl border border-slate-200 shadow-2xs">
                          <span className="text-slate-400 block text-[10px] font-bold uppercase">Độ phù hợp Level</span>
                          <strong className="text-[#2563EB] text-sm block mt-0.5">
                            {aiResult?.levelFitScore !== undefined && aiResult?.levelFitScore !== null ? `${Math.round(Number(aiResult.levelFitScore))}/100` : "—"}
                          </strong>
                        </div>
                        <div className="bg-white p-3 rounded-xl border border-slate-200 shadow-2xs">
                          <span className="text-slate-400 block text-[10px] font-bold uppercase">Tổng thâm niên</span>
                          <strong className="text-emerald-700 text-sm block mt-0.5">
                            {Number(aiResult?.totalExperienceYears || 0).toFixed(1)} năm
                          </strong>
                        </div>
                      </div>

                      {/* Management Level Status Banner */}
                      <div className={`p-3 rounded-xl border flex items-center justify-between gap-2 ${
                        aiResult?.levelEligible === true
                          ? "bg-emerald-100/70 text-emerald-900 border-emerald-300"
                          : "bg-amber-100/70 text-amber-900 border-amber-300"
                      }`}>
                        <div className="flex items-center gap-2">
                          {aiResult?.levelEligible === true ? (
                            <CheckCircle2 className="w-4 h-4 text-emerald-700 shrink-0" />
                          ) : (
                            <AlertTriangle className="w-4 h-4 text-amber-700 shrink-0" />
                          )}
                          <span className="font-bold text-xs">
                            {aiResult?.levelEligible === true
                              ? "Ứng viên đáp ứng đầy đủ điều kiện về cấp bậc và thâm niên quản lý thực tế."
                              : "Ứng viên chưa đạt đủ điều kiện thâm niên quản lý yêu cầu (cần phỏng vấn thêm)."}
                          </span>
                        </div>
                        <span className="text-[10px] font-black uppercase px-2 py-0.5 bg-white rounded border">
                          {aiResult?.levelEligible === true ? "ĐỦ ĐIỀU KIỆN" : "CẦN LƯU Ý"}
                        </span>
                      </div>

                      {/* Level Evidence Items Checklist */}
                      {aiResult?.levelEvidence && (
                        <div className="pt-2 border-t border-slate-200 space-y-1.5">
                          <span className="font-bold text-slate-700 block text-xs">Bằng chứng xác thực thâm niên & cấp bậc:</span>
                          <ul className="space-y-1">
                            {(Array.isArray(aiResult.levelEvidence)
                              ? aiResult.levelEvidence
                              : Array.isArray(aiResult.levelEvidence?.evidence)
                              ? aiResult.levelEvidence.evidence
                              : ["Đã xác thực qua lịch sử công tác."]
                            ).map((it: string, idx: number) => (
                              <li key={idx} className="flex items-start gap-1.5 text-slate-700 text-xs">
                                <span className="text-emerald-600 font-bold">✓</span>
                                <span>{it}</span>
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}
                    </div>
                  </div>
                ) : activePillar === "education" ? (
                  /* ======================= EXPLANATION: EDUCATION ======================= */
                  <div className="space-y-5">
                    {/* Header */}
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100">
                      <div className="flex items-center gap-2.5">
                        <div className="p-2.5 rounded-xl bg-purple-50 text-purple-700 border border-purple-200">
                          <GraduationCap className="w-5 h-5" />
                        </div>
                        <div>
                          <h4 className="font-black text-sm text-[#1F2937]">GIẢI THÍCH CHI TIẾT: TIÊU CHÍ HỌC VẤN & BẰNG CẤP</h4>
                          <p className="text-xs text-slate-500">Đối chiếu trình độ đào tạo, chuyên ngành và xếp loại học lực</p>
                        </div>
                      </div>
                      <div className="text-right bg-purple-50 px-3.5 py-1.5 rounded-xl border border-purple-200 shrink-0">
                        <span className="text-[10px] font-bold text-slate-500 block uppercase">Đóng góp vào tổng điểm</span>
                        <span className="text-sm font-black text-purple-800">{edPts} / {edWeight} điểm ({edPercent}%)</span>
                      </div>
                    </div>

                    <div className="p-4 bg-purple-50/50 border border-purple-200 rounded-xl space-y-3 text-xs">
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                        <div className="bg-white p-3 rounded-xl border border-purple-200 shadow-2xs">
                          <span className="text-slate-400 block text-[10px] font-bold uppercase">Trình độ cao nhất của ứng viên</span>
                          <strong className="text-purple-950 text-sm block mt-0.5">
                            {educations?.[0]?.degree || "Đại học / Cử nhân"} — {educations?.[0]?.major || "Quản trị Kinh doanh"}
                          </strong>
                        </div>
                        <div className="bg-white p-3 rounded-xl border border-purple-200 shadow-2xs">
                          <span className="text-slate-400 block text-[10px] font-bold uppercase">Yêu cầu tối thiểu của JD</span>
                          <strong className="text-slate-800 text-sm block mt-0.5">
                            {(job as any).minEducationLevel || (job.requirements ? "Theo yêu cầu bài đăng" : "Đại học trở lên")}
                          </strong>
                        </div>
                      </div>

                      <p className="text-slate-700 leading-relaxed pt-1">
                        Hệ thống đã phân tích mức độ tương đồng giữa ngành đào tạo và yêu cầu đặc thù của công việc để tính điểm học vấn chính xác.
                      </p>
                    </div>
                  </div>
                ) : (
                  /* ======================= EXPLANATION: OTHER / LANGUAGES & CERTIFICATIONS ======================= */
                  <div className="space-y-5">
                    {/* Header */}
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100">
                      <div className="flex items-center gap-2.5">
                        <div className="p-2.5 rounded-xl bg-amber-50 text-amber-700 border border-amber-200">
                          <Award className="w-5 h-5" />
                        </div>
                        <div>
                          <h4 className="font-black text-sm text-[#1F2937]">GIẢI THÍCH CHI TIẾT: TIÊU CHÍ NGOẠI NGỮ & CHỨNG CHỈ</h4>
                          <p className="text-xs text-slate-500">Đánh giá trình độ ngoại ngữ, chứng chỉ chuyên môn và các dự án bổ trợ</p>
                        </div>
                      </div>
                      <div className="text-right bg-amber-50 px-3.5 py-1.5 rounded-xl border border-amber-200 shrink-0">
                        <span className="text-[10px] font-bold text-slate-500 block uppercase">Đóng góp vào tổng điểm</span>
                        <span className="text-sm font-black text-amber-800">{oPts} / {oWeight} điểm ({oPercent}%)</span>
                      </div>
                    </div>

                    <div className="p-4 bg-amber-50/50 border border-amber-200 rounded-xl space-y-4 text-xs">
                      <p className="text-slate-700 leading-relaxed">
                        Điểm số thành phần này phản ánh việc ứng viên sở hữu chứng chỉ chuyên môn, trình độ ngoại ngữ (Tiếng Anh, v.v.) và các dự án thực tế bổ trợ liên quan trực tiếp đến vị trí tuyển dụng.
                      </p>

                      {/* 1. Ngoại ngữ (Languages) */}
                      <div className="space-y-2 pt-2 border-t border-amber-200">
                        <span className="font-bold text-amber-950 block text-xs flex items-center gap-1.5">
                          <Globe className="w-3.5 h-3.5 text-amber-700" /> Trình độ Ngoại ngữ ({languages.length}):
                        </span>
                        {languages.length > 0 ? (
                          <div className="flex flex-wrap gap-2">
                            {languages.map((lang: any, idx: number) => (
                              <div key={idx} className="px-3 py-1.5 bg-white rounded-xl border border-amber-300 shadow-2xs flex items-center gap-2">
                                <span className="font-bold text-[#1F2937]">{lang.language || "Ngoại ngữ"}</span>
                                <span className="px-2 py-0.5 rounded bg-amber-100 text-amber-800 text-[10px] font-extrabold font-mono">
                                  {lang.proficiency || "Thành thạo"}
                                </span>
                              </div>
                            ))}
                          </div>
                        ) : (
                          <p className="text-slate-500 italic text-[11px]">Đã ghi nhận năng lực ngoại ngữ qua thông tin tổng hợp trong CV.</p>
                        )}
                      </div>

                      {/* 2. Chứng chỉ chuyên môn (Certifications) */}
                      <div className="space-y-2 pt-2 border-t border-amber-200">
                        <span className="font-bold text-amber-950 block text-xs flex items-center gap-1.5">
                          <Award className="w-3.5 h-3.5 text-amber-700" /> Chứng chỉ nghề nghiệp ({certifications.length}):
                        </span>
                        {certifications.length > 0 ? (
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                            {certifications.map((cert: any, idx: number) => (
                              <div key={idx} className="p-2.5 bg-white rounded-xl border border-amber-300 shadow-2xs space-y-1">
                                <div className="font-bold text-amber-950 text-xs flex items-center justify-between">
                                  <span>📜 {cert.name}</span>
                                  {cert.issuedDate && (
                                    <span className="text-[10px] text-slate-400 font-normal">{cert.issuedDate}</span>
                                  )}
                                </div>
                                {cert.issuingOrg && (
                                  <p className="text-[11px] text-slate-500">Tổ chức cấp: {cert.issuingOrg}</p>
                                )}
                              </div>
                            ))}
                          </div>
                        ) : (
                          <p className="text-slate-500 italic text-[11px]">Chưa khai báo chứng chỉ bổ sung.</p>
                        )}
                      </div>

                      {/* 3. Dự án bổ trợ (Projects) */}
                      {projects && projects.length > 0 && (
                        <div className="space-y-2 pt-2 border-t border-amber-200">
                          <span className="font-bold text-amber-950 block text-xs flex items-center gap-1.5">
                            <FolderGit2 className="w-3.5 h-3.5 text-amber-700" /> Dự án thực tế đã ghi nhận ({projects.length}):
                          </span>
                          <div className="flex flex-wrap gap-1.5">
                            {projects.map((p: any, idx: number) => (
                              <span key={idx} className="px-2.5 py-1 bg-white rounded-lg border border-amber-300 text-amber-900 font-semibold text-[11px]">
                                📁 {p.projectName} ({p.projectRole || "Thành viên"})
                              </span>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* ================================================================= */}
                {/* 3B. DEDICATED STRENGTHS & GAPS STUDIO (ĐIỂM MẠNH & RỦI RO TỔNG THỂ) */}
                {/* ================================================================= */}
                {aiResult && (
                  <div className="pt-4 border-t border-slate-200 space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {/* Left: Strengths */}
                      <div className="p-4 bg-emerald-50/80 border border-emerald-200 rounded-2xl space-y-2.5">
                        <div className="flex items-center justify-between pb-2 border-b border-emerald-200/60">
                          <span className="text-xs font-black text-emerald-900 flex items-center gap-1.5 uppercase tracking-wider">
                            <ThumbsUp className="w-4 h-4 text-emerald-600" /> Điểm Mạnh Nổi Bật ({aiResult.strengths?.length || 0})
                          </span>
                          <span className="text-[10px] font-bold bg-emerald-200/70 text-emerald-900 px-2 py-0.5 rounded-full">
                            CỘNG ĐIỂM
                          </span>
                        </div>
                        {aiResult.strengths && aiResult.strengths.length > 0 ? (
                          <ul className="space-y-1.5 text-xs text-slate-700">
                            {aiResult.strengths.map((str: string, idx: number) => (
                              <li key={idx} className="flex items-start gap-2 leading-relaxed">
                                <span className="text-emerald-600 font-bold shrink-0 mt-0.5">✓</span>
                                <span>{str}</span>
                              </li>
                            ))}
                          </ul>
                        ) : (
                          <p className="text-xs text-slate-400 italic">Chưa ghi nhận điểm mạnh nổi trội.</p>
                        )}
                      </div>

                      {/* Right: Gaps & Risks */}
                      <div className="p-4 bg-rose-50/80 border border-rose-200 rounded-2xl space-y-2.5">
                        <div className="flex items-center justify-between pb-2 border-b border-rose-200/60">
                          <span className="text-xs font-black text-rose-900 flex items-center gap-1.5 uppercase tracking-wider">
                            <ThumbsDown className="w-4 h-4 text-rose-600" /> Hạn Chế & Rủi Ro Cần Lưu Ý ({aiResult.gaps?.length || 0})
                          </span>
                          <span className="text-[10px] font-bold bg-rose-200/70 text-rose-900 px-2 py-0.5 rounded-full">
                            TRỪ ĐIỂM
                          </span>
                        </div>
                        {aiResult.gaps && aiResult.gaps.length > 0 ? (
                          <ul className="space-y-1.5 text-xs text-slate-700">
                            {aiResult.gaps.map((gap: string, idx: number) => (
                              <li key={idx} className="flex items-start gap-2 leading-relaxed">
                                <span className="text-rose-600 font-bold shrink-0 mt-0.5">⚠️</span>
                                <span>{gap}</span>
                              </li>
                            ))}
                          </ul>
                        ) : (
                          <p className="text-xs text-emerald-700 font-medium italic">Không phát hiện rủi ro hay thiếu sót đáng kể.</p>
                        )}
                      </div>
                    </div>

                    {/* Executive AI Reasoning Summary */}
                    {aiResult?.reasoningSummary && (
                      <div className="p-4 bg-gradient-to-r from-blue-50/90 to-indigo-50/60 border border-blue-200 rounded-2xl space-y-1.5 text-xs">
                        <span className="font-black text-[#2563EB] uppercase tracking-wider block text-[11px] flex items-center gap-1.5">
                          <Sparkles className="w-4 h-4" /> TỔNG KẾT SUY LUẬN TỪ AI MATCHING ENGINE:
                        </span>
                        <p className="text-slate-800 leading-relaxed italic bg-white/80 p-3 rounded-xl border border-blue-100">
                          "{aiResult.reasoningSummary}"
                        </p>
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* ================================================================= */}
              {/* 4. FULL CANDIDATE PROFILE (THÔNG TIN HỒ SƠ CHI TIẾT)              */}
              {/* ================================================================= */}
              <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs space-y-5">
                <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                  <h3 className="text-xs font-black text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
                    <User className="w-4 h-4 text-[#2563EB]" /> Hồ Sơ Ứng Viên Chi Tiết (Full Candidate Profile)
                  </h3>
                  <span className="text-[11px] text-slate-400 font-medium">Đối chiếu hồ sơ gốc</span>
                </div>

                {/* Professional Summary */}
                {professionalSummary && (
                  <div className="space-y-1.5 text-xs">
                    <span className="font-bold text-slate-700 block">Tóm tắt sự nghiệp:</span>
                    <p className="p-3 bg-slate-50 rounded-xl border border-slate-200 text-slate-600 leading-relaxed">
                      {professionalSummary}
                    </p>
                  </div>
                )}

                {/* Work Experiences */}
                <div className="space-y-3">
                  <h5 className="text-xs font-black text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
                    <Briefcase className="w-3.5 h-3.5 text-[#2563EB]" /> Kinh nghiệm làm việc ({workExps.length})
                  </h5>
                  {workExps.length > 0 ? (
                    <div className="space-y-3">
                      {workExps.map((exp: any, idx: number) => (
                        <div key={idx} className="p-4 bg-slate-50 border border-slate-200 rounded-xl space-y-2 text-xs">
                          <div className="flex items-start justify-between gap-2">
                            <div>
                              <h6 className="font-black text-slate-900 text-xs">{exp.positionTitle}</h6>
                              <p className="font-bold text-[#2563EB] text-[11px]">{exp.companyName}</p>
                            </div>
                            <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-blue-100 text-[#2563EB] shrink-0">
                              {exp.startDate ? format(new Date(exp.startDate), "MM/yyyy") : ""} - {exp.isCurrent ? "Hiện tại" : (exp.endDate ? format(new Date(exp.endDate), "MM/yyyy") : "")}
                            </span>
                          </div>

                          {exp.description && (
                            <p className="text-slate-600 leading-relaxed">{exp.description}</p>
                          )}

                          {exp.achievements && (
                            <div className="p-2.5 bg-emerald-50/80 border border-emerald-200 rounded-lg text-emerald-800 text-[11px] font-medium">
                              🏆 <strong>Thành tựu:</strong> {exp.achievements}
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-xs text-slate-400 italic p-3 bg-slate-50 rounded-xl">Chưa cập nhật kinh nghiệm làm việc.</p>
                  )}
                </div>

                {/* Real-World Projects */}
                <div className="space-y-3">
                  <h5 className="text-xs font-black text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
                    <FolderGit2 className="w-3.5 h-3.5 text-[#2563EB]" /> Dự án thực tế ({projects.length})
                  </h5>
                  {projects.length > 0 ? (
                    <div className="space-y-3">
                      {projects.map((proj: any, idx: number) => (
                        <div key={idx} className="p-3.5 bg-slate-50 border border-slate-200 rounded-xl space-y-1.5 text-xs">
                          <div className="flex items-center justify-between">
                            <h6 className="font-black text-slate-900">{proj.projectName}</h6>
                            {proj.projectRole && (
                              <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-slate-200 text-slate-700">{proj.projectRole}</span>
                            )}
                          </div>
                          {proj.description && <p className="text-slate-600 text-[11px] leading-relaxed">{proj.description}</p>}
                          {proj.technologies && proj.technologies.length > 0 && (
                            <div className="flex flex-wrap gap-1 pt-1">
                              {proj.technologies.map((t: string, tIdx: number) => (
                                <span key={tIdx} className="px-2 py-0.5 text-[10px] font-bold bg-white text-slate-700 rounded border border-slate-200">
                                  {t}
                                </span>
                              ))}
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-xs text-slate-400 italic p-3 bg-slate-50 rounded-xl">Chưa cập nhật dự án.</p>
                  )}
                </div>

                {/* Education */}
                <div className="space-y-3">
                  <h5 className="text-xs font-black text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
                    <GraduationCap className="w-3.5 h-3.5 text-[#2563EB]" /> Học vấn & Bằng cấp ({educations.length})
                  </h5>
                  {educations.length > 0 ? (
                    <div className="space-y-2">
                      {educations.map((edu: any, idx: number) => (
                        <div key={idx} className="p-3 bg-slate-50 border border-slate-200 rounded-xl text-xs space-y-1">
                          <div className="flex justify-between font-bold text-slate-900">
                            <span>🎓 {edu.schoolName}</span>
                            <span className="text-slate-500 font-normal text-[10px]">{edu.degree}</span>
                          </div>
                          <p className="text-slate-600">Chuyên ngành: <strong>{edu.major}</strong></p>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-xs text-slate-400 italic p-3 bg-slate-50 rounded-xl">Chưa cập nhật học vấn.</p>
                  )}
                </div>

                {/* Declared Skills */}
                <div className="space-y-3">
                  <h5 className="text-xs font-black text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
                    <Code className="w-3.5 h-3.5 text-[#2563EB]" /> Kỹ năng tự khai báo ({candidateSkills.length})
                  </h5>
                  {candidateSkills.length > 0 ? (
                    <div className="flex flex-wrap gap-1.5 p-3 bg-slate-50 border border-slate-200 rounded-xl">
                      {candidateSkills.map((sk: any, idx: number) => (
                        <span key={idx} className="px-2.5 py-1 text-xs font-bold rounded-lg bg-white text-slate-800 border border-slate-300 shadow-2xs">
                          {sk.skill?.name || "Kỹ năng"} <span className="text-[10px] text-[#2563EB] font-mono">({sk.proficiencyLevel})</span>
                        </span>
                      ))}
                    </div>
                  ) : (
                    <p className="text-xs text-slate-400 italic p-3 bg-slate-50 rounded-xl">Chưa cập nhật danh sách kỹ năng.</p>
                  )}
                </div>

                {/* Interviews List */}
                <div className="space-y-3">
                  <div className="flex items-center justify-between pb-2 border-b border-slate-100">
                    <h5 className="text-xs font-black text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
                      <Calendar className="w-3.5 h-3.5 text-[#2563EB]" /> Lịch phỏng vấn & Đánh giá ({detail?.interviews?.length || 0})
                    </h5>
                    <button
                      type="button"
                      onClick={onScheduleInterview}
                      className="inline-flex items-center gap-1 text-[11px] font-bold text-[#2563EB] hover:underline"
                    >
                      <Plus className="w-3 h-3" /> Lên lịch mới
                    </button>
                  </div>

                  {detail?.interviews && detail.interviews.length > 0 ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      {detail.interviews.map((item: InterviewData) => (
                        <div key={item.id} className="p-3.5 rounded-xl border border-slate-200 bg-slate-50 text-xs space-y-2">
                          <div className="flex items-start justify-between gap-2">
                            <div>
                              <h6 className="font-bold text-slate-900">{item.title}</h6>
                              <div className="flex items-center gap-1.5 mt-1">
                                <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-blue-50 text-[#2563EB] border border-blue-200">
                                  {interviewTypeLabels[item.type] || item.type}
                                </span>
                                <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-slate-200 text-slate-700">
                                  {interviewStatusLabels[item.status] || item.status}
                                </span>
                              </div>
                            </div>
                            {item.score !== undefined && item.score !== null ? (
                              <span className="text-xs font-black text-[#2563EB] bg-white px-2 py-1 rounded border border-slate-200">
                                {Number(item.score)}/100
                              </span>
                            ) : (
                              <button
                                type="button"
                                onClick={() => onFeedbackInterview(item)}
                                className="px-2 py-1 rounded bg-emerald-600 text-white text-[10px] font-bold hover:bg-emerald-700"
                              >
                                Chấm điểm
                              </button>
                            )}
                          </div>
                          <div className="text-[11px] text-slate-500 flex items-center gap-1">
                            <Clock className="w-3 h-3 text-slate-400" />
                            {format(new Date(item.scheduledAt), "HH:mm dd/MM/yyyy")} ({item.durationMinutes} phút)
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-xs text-slate-400 italic p-3 bg-slate-50 rounded-xl">Chưa có lịch phỏng vấn.</p>
                  )}
                </div>
              </div>
            </>
          ) : (
            <div className="p-12 bg-white rounded-2xl border border-slate-200 text-center text-slate-400 space-y-2">
              <User className="w-10 h-10 mx-auto text-[#2563EB]/40" />
              <h4 className="font-bold text-sm text-slate-700">Chọn một ứng viên từ danh sách bên trái</h4>
              <p className="text-xs text-slate-500">
                Không gian làm việc sẽ hiển thị điểm AI Matching và chi tiết giải thích cho ứng viên được chọn.
              </p>
            </div>
          )}
        </div>

      </div>
    </div>
  );
}
