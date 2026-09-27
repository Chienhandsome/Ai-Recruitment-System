"use client";

import React, { useState, useEffect } from "react";
import {
  ArrowLeft, Edit, Trash2, CheckCircle2, Bot, MapPin, Briefcase,
  DollarSign, Clock, FileText, Award, HelpCircle, User, Sparkles, Filter, Search,
  GraduationCap, Code, AlertTriangle, ExternalLink, ThumbsUp, ThumbsDown, ChevronRight,
  Phone, Mail, FolderGit2, ShieldCheck, Calendar, Video, Plus, Loader2, TrendingUp, Users
} from "lucide-react";
import {
  type JobPostingData,
  type RecruiterApplicationDetail,
  type RecruiterApplicationListItem,
  getRecruiterApplicationDetail,
  getRecruiterApplications,
  getRecruiterJobDetail,
  deleteRecruiterJob,
  updateRecruiterJob,
} from "@/lib/recruiter-api";
import {
  type InterviewData,
  interviewTypeLabels,
  interviewStatusLabels,
  candidateResponseLabels,
  updateInterview,
} from "@/lib/interview-api";
import { ScheduleInterviewModal } from "./interviews/ScheduleInterviewModal";
import { InterviewFeedbackModal } from "./interviews/InterviewFeedbackModal";
import { AdjustJobQuotaModal } from "./jobs/AdjustJobQuotaModal";
import { ExtendJobDeadlineModal } from "./jobs/ExtendJobDeadlineModal";
import { format, isPast, isToday, differenceInDays } from "date-fns";
import { ApplicationStageActions } from "./applications/ApplicationStageActions";
import { applicationStageLabels, applicationStageStyles } from "@/lib/application-stage";
import { CandidateScoringWorkspace } from "./CandidateScoringWorkspace";
import { toast } from "sonner";

interface JobDetailViewProps {
  jobId: string;
  token: string;
  onBack: () => void;
  onEdit: (job: JobPostingData) => void;
  onJobDeleted: () => void;
  defaultTab?: "info" | "candidates";
  initialSelectedAppId?: string | null;
}

const AI_PENDING_STATUSES = new Set([
  "UPLOADED",
  "QUEUED",
  "PARSING",
  "NORMALIZING",
  "MATCHING",
  "SCORING",
]);

function isAiEvaluationPending(status: unknown): boolean {
  return typeof status === "string" && AI_PENDING_STATUSES.has(status);
}

function listItemToLegacyApplication(item: RecruiterApplicationListItem) {
  return {
    id: item.id,
    currentStage: item.currentStage,
    hrDecision: item.hrDecision,
    processingStatus: item.processingStatus,
    appliedAt: item.appliedAt,
    updatedAt: item.updatedAt,
    allowedTransitions: item.allowedTransitions,
    candidate: {
      id: item.candidate.id,
      desiredTitle: item.candidate.desiredTitle,
      user: {
        fullName: item.candidate.fullName,
        email: item.candidate.email,
        avatarUrl: item.candidate.avatarUrl,
      },
      workExperiences: [],
      educations: [],
      projects: [],
      candidateSkills: [],
    },
    aiMatchingResults: item.latestAiResult ? [item.latestAiResult] : [],
    interviews: [],
  };
}

function detailToLegacyApplication(detail: RecruiterApplicationDetail) {
  const snapshot = detail.profileSnapshot as {
    evaluationInput?: {
      candidate_profile?: {
        work_experiences?: Array<Record<string, unknown>>;
        educations?: Array<Record<string, unknown>>;
        projects?: Array<Record<string, unknown>>;
        skills?: Array<Record<string, unknown>>;
      };
    };
  } | null;
  const profile = snapshot?.evaluationInput?.candidate_profile;

  return {
    id: detail.id,
    currentStage: detail.currentStage,
    hrDecision: detail.hrDecision,
    hrNotes: detail.hrNotes,
    processingStatus: detail.processingStatus,
    evaluationError: detail.evaluationError,
    appliedAt: detail.appliedAt,
    updatedAt: detail.updatedAt,
    allowedTransitions: detail.allowedTransitions,
    candidate: {
      id: detail.candidate.id,
      desiredTitle: detail.candidate.desiredTitle,
      user: {
        fullName: detail.candidate.fullName,
        email: detail.candidate.email,
        phone: detail.candidate.phone,
        avatarUrl: detail.candidate.avatarUrl,
      },
      workExperiences: (profile?.work_experiences ?? []).map((item) => ({
        companyName: item.company_name,
        positionTitle: item.position_title,
        startDate: item.start_date,
        endDate: item.end_date,
        description: item.description,
        achievements: item.achievements,
      })),
      educations: (profile?.educations ?? []).map((item) => ({
        schoolName: item.school_name,
        degree: item.degree,
        major: item.major,
        startDate: item.start_date,
        endDate: item.end_date,
      })),
      projects: (profile?.projects ?? []).map((item) => ({
        projectName: item.project_name,
        projectRole: item.project_role,
        description: item.description,
        technologies: item.technologies,
        projectUrl: item.project_url,
      })),
      candidateSkills: (profile?.skills ?? []).map((item) => ({
        proficiencyLevel: item.proficiency_level,
        skill: { name: item.skill_name },
      })),
    },
    aiMatchingResults: detail.latestAiResult ? [detail.latestAiResult] : [],
    interviews: detail.interviews || [],
    offer: detail.offer || null,
  };
}

export function JobDetailView({
  jobId,
  token,
  onBack,
  onEdit,
  onJobDeleted,
  defaultTab = "info",
  initialSelectedAppId = null,
}: JobDetailViewProps) {
  const [activeTab, setActiveTab] = useState<"info" | "candidates">(initialSelectedAppId ? "candidates" : defaultTab);
  const [job, setJob] = useState<JobPostingData | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedAppId, setSelectedAppId] = useState<string | null>(initialSelectedAppId || null);

  useEffect(() => {
    if (initialSelectedAppId) {
      setSelectedAppId(initialSelectedAppId);
      setActiveTab("candidates");
    }
  }, [initialSelectedAppId]);
  const [searchCandidate, setSearchCandidate] = useState("");
  const [isScheduleModalOpen, setIsScheduleModalOpen] = useState(false);
  const [feedbackInterview, setFeedbackInterview] = useState<InterviewData | null>(null);
  const [selectedApplicationDetail, setSelectedApplicationDetail] =
    useState<RecruiterApplicationDetail | null>(null);
  const [interviewToEdit, setInterviewToEdit] = useState<InterviewData | null>(null);
  const [acceptingSlotId, setAcceptingSlotId] = useState<string | null>(null);
  const [isQuotaModalOpen, setIsQuotaModalOpen] = useState(false);
  const [isExpiryModalOpen, setIsExpiryModalOpen] = useState(false);

  const handleAcceptProposedSlot = async (interview: InterviewData, slotIso: string) => {
    const slotKey = `${interview.id}-${slotIso}`;
    setAcceptingSlotId(slotKey);
    try {
      await updateInterview(token, interview.id, {
        scheduledAt: slotIso,
        status: 'SCHEDULED',
        candidateResponse: 'ACCEPTED',
      });
      toast.success(
        `Đã chấp nhận khung giờ ${format(new Date(slotIso), 'HH:mm dd/MM/yyyy')} và chốt lịch phỏng vấn!`,
      );
      await refreshApplications();
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : 'Không thể cập nhật lịch phỏng vấn',
      );
    } finally {
      setAcceptingSlotId(null);
    }
  };

  const fetchJobDetail = async () => {
    setLoading(true);
    try {
      const [data, applications] = await Promise.all([
        getRecruiterJobDetail(token, jobId),
        getRecruiterApplications(token, { jobId, limit: 100 }),
      ]);
      const hydratedJob = {
        ...data,
        applications: applications.data.map(listItemToLegacyApplication),
      };
      setJob(hydratedJob);

      if (hydratedJob.applications.length > 0) {
        const sorted = [...hydratedJob.applications].sort((a: any, b: any) => {
          const scoreA = a.aiMatchingResults?.[0] ? Number(a.aiMatchingResults[0].overallScore) : 0;
          const scoreB = b.aiMatchingResults?.[0] ? Number(b.aiMatchingResults[0].overallScore) : 0;
          return scoreB - scoreA;
        });
        setSelectedAppId(sorted[0].id);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchJobDetail();
  }, [jobId]);

  useEffect(() => {
    if (!selectedAppId) {
      setSelectedApplicationDetail(null);
      return;
    }
    let cancelled = false;
    getRecruiterApplicationDetail(token, selectedAppId)
      .then((detail) => {
        if (!cancelled) setSelectedApplicationDetail(detail);
      })
      .catch((error) => console.error("Failed to load application detail", error));
    return () => {
      cancelled = true;
    };
  }, [selectedAppId, token]);

  const refreshApplications = async () => {
    const applications = await getRecruiterApplications(token, { jobId, limit: 100 });
    setJob((current) =>
      current
        ? {
          ...current,
          applications: applications.data.map(listItemToLegacyApplication),
        }
        : current,
    );
    if (selectedAppId) {
      setSelectedApplicationDetail(
        await getRecruiterApplicationDetail(token, selectedAppId),
      );
    }
  };

  const hasPendingEvaluations =
    job?.applications?.some(
      (application: {
        processingStatus?: unknown;
        aiMatchingResults?: unknown[];
      }) =>
        isAiEvaluationPending(application.processingStatus) &&
        !application.aiMatchingResults?.[0],
    ) ?? false;

  useEffect(() => {
    if (!hasPendingEvaluations) return;

    let cancelled = false;
    let isFetching = false;
    const intervalId = window.setInterval(async () => {
      if (isFetching) return;
      isFetching = true;
      try {
        const applications = await getRecruiterApplications(token, {
          jobId,
          limit: 100,
        });
        if (!cancelled) {
          setJob((current) =>
            current
              ? {
                ...current,
                applications: applications.data.map(listItemToLegacyApplication),
              }
              : current,
          );
        }
      } catch (error) {
        console.error("Failed to refresh pending AI evaluations", error);
      } finally {
        isFetching = false;
      }
    }, 10_000);

    return () => {
      cancelled = true;
      window.clearInterval(intervalId);
    };
  }, [hasPendingEvaluations, jobId, token]);

  const handleDelete = async () => {
    if (!window.confirm("Bạn có chắc chắn muốn xóa bài đăng nháp này?")) return;
    try {
      await deleteRecruiterJob(token, jobId);
      onJobDeleted();
    } catch (err: any) {
      alert(`Xóa thất bại: ${err?.message || "Lỗi không xác định"}`);
    }
  };

  const handleStatusChange = async (newStatus: string) => {
    try {
      await updateRecruiterJob(token, jobId, { status: newStatus });
      fetchJobDetail();
    } catch (err: any) {
      alert(`Cập nhật trạng thái thất bại: ${err?.message}`);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#2563EB]"></div>
      </div>
    );
  }

  if (!job) {
    return (
      <div className="p-8 text-center text-slate-500">
        Không tìm thấy thông tin bài tuyển dụng.
        <button onClick={onBack} className="block mx-auto mt-4 text-[#2563EB] font-medium underline">Quay lại danh sách</button>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full space-y-6">

      {/* Header & Navigation */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
        <div className="space-y-1">
          <button onClick={onBack} className="inline-flex items-center gap-1.5 text-xs font-bold text-slate-500 hover:text-[#2563EB] mb-2 transition-colors">
            <ArrowLeft className="w-4 h-4" /> Quay lại Danh sách Bài tuyển dụng
          </button>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-extrabold text-[#1F2937]">{job.title}</h1>
            <span className="text-xs font-mono px-2 py-0.5 rounded bg-[#EFF6FF] text-[#2563EB] font-bold border border-blue-200">
              {job.jobCode}
            </span>
            <span className={`text-xs font-bold px-2.5 py-0.5 rounded-full border ${job.status === "PUBLISHED" ? "bg-emerald-50 text-emerald-700 border-emerald-200" :
                job.status === "DRAFT" ? "bg-amber-50 text-amber-700 border-amber-200" :
                  "bg-slate-100 text-slate-700 border-slate-300"
              }`}>
              {job.status === "PUBLISHED" ? "ĐANG TUYỂN" : job.status === "DRAFT" ? "BẢN NHÁP" : job.status}
            </span>
          </div>
          <p className="text-xs text-slate-500 font-medium">
            Tạo ngày: {new Date(job.createdAt).toLocaleDateString("vi-VN")}
          </p>
        </div>

        {/* Header Quick Actions */}
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setIsQuotaModalOpen(true)}
            className="inline-flex items-center gap-1.5 px-3 py-2 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 text-xs font-bold rounded-xl border border-emerald-200 transition-colors shadow-sm"
          >
            <TrendingUp className="w-4 h-4" /> Chỉ tiêu: {job.hiredCount ?? (job.applications?.filter((a: any) => a.currentStage === "HIRED").length || 0)}/{job.targetHires ?? 1}
          </button>
          <button
            type="button"
            onClick={() => setIsExpiryModalOpen(true)}
            className="inline-flex items-center gap-1.5 px-3 py-2 bg-[#EFF6FF] hover:bg-blue-100 text-[#2563EB] text-xs font-bold rounded-xl border border-blue-200 transition-colors shadow-sm"
          >
            <Calendar className="w-4 h-4" /> Gia hạn
          </button>
          {job.status === "DRAFT" && (
            <button
              onClick={() => handleStatusChange("PUBLISHED")}
              className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl shadow-md transition-all"
            >
              Xuất bản (Publish)
            </button>
          )}
          {job.status === "PUBLISHED" && (
            <button
              onClick={() => handleStatusChange("CLOSED")}
              className="px-4 py-2 bg-slate-200 hover:bg-slate-300 text-slate-800 text-xs font-bold rounded-xl transition-all"
            >
              Đóng tuyển dụng
            </button>
          )}
          <button
            onClick={() => onEdit(job)}
            className="inline-flex items-center gap-1.5 px-4 py-2 bg-[#EFF6FF] hover:bg-blue-100 text-[#2563EB] text-xs font-bold rounded-xl border border-blue-200 transition-colors shadow-sm"
          >
            <Edit className="w-4 h-4" /> Chỉnh sửa JD
          </button>
          {job.status === "DRAFT" && (
            <button
              onClick={handleDelete}
              className="p-2 text-rose-500 hover:bg-rose-50 rounded-xl transition-colors"
              title="Xóa bài nháp"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>

      {/* Alert Banner if Closed for Quota or Expired */}
      {job.status === "CLOSED" && job.closeReason === "QUOTA_REACHED" && (
        <div className="p-4 bg-amber-50 border border-amber-200 rounded-2xl flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-sm">
          <div className="flex items-start gap-3">
            <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
            <div>
              <h4 className="text-sm font-bold text-amber-900">
                Vị trí tuyển dụng đã tự động đóng vì đã tuyển đủ chỉ tiêu ({job.hiredCount ?? (job.applications?.filter((a: any) => a.currentStage === "HIRED").length || 0)}/{job.targetHires ?? 1} người)
              </h4>
              <p className="text-xs text-amber-700 mt-0.5">
                Các ứng viên còn lại trong quy trình được bảo lưu an toàn trong Talent Pool. Bạn có thể tăng thêm chỉ tiêu bất kỳ lúc nào để mở lại tin và tiếp tục tuyển chọn.
              </p>
            </div>
          </div>
          <button
            onClick={() => setIsQuotaModalOpen(true)}
            className="inline-flex items-center gap-1.5 px-4 py-2 bg-[#2563EB] hover:bg-[#1D4ED8] text-white text-xs font-bold rounded-xl shadow-md transition-all shrink-0"
          >
            <TrendingUp className="w-4 h-4" /> Tăng chỉ tiêu & Mở lại
          </button>
        </div>
      )}

      {job.status === "CLOSED" && job.closeReason === "EXPIRED" && (
        <div className="p-4 bg-rose-50 border border-rose-200 rounded-2xl flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-sm">
          <div className="flex items-start gap-3">
            <Clock className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />
            <div>
              <h4 className="text-sm font-bold text-rose-900">
                Tin tuyển dụng đã tự động đóng do quá hạn nộp hồ sơ ({job.expiryDate ? format(new Date(job.expiryDate), "dd/MM/yyyy") : ""})
              </h4>
              <p className="text-xs text-rose-700 mt-0.5">
                Gia hạn ngày hết hạn mới để tự động mở lại tin trên bảng tuyển dụng và tiếp tục nhận hồ sơ từ ứng viên.
              </p>
            </div>
          </div>
          <button
            onClick={() => setIsExpiryModalOpen(true)}
            className="inline-flex items-center gap-1.5 px-4 py-2 bg-[#2563EB] hover:bg-[#1D4ED8] text-white text-xs font-bold rounded-xl shadow-md transition-all shrink-0"
          >
            <Calendar className="w-4 h-4" /> Gia hạn thời hạn tuyển dụng
          </button>
        </div>
      )}

      {/* Tabs Switcher */}
      <div className="flex p-1 bg-[#EFF6FF] rounded-xl border border-blue-100">
        <button
          onClick={() => setActiveTab("info")}
          className={`flex-1 py-2.5 text-xs font-extrabold rounded-lg transition-all flex items-center justify-center gap-2 ${activeTab === "info"
              ? "bg-[#2563EB] text-white shadow-md"
              : "text-slate-600 hover:text-[#2563EB]"
            }`}
        >
          <FileText className="w-4 h-4" /> Thông tin Chi tiết JD
        </button>
        <button
          onClick={() => setActiveTab("candidates")}
          className={`flex-1 py-2.5 text-xs font-extrabold rounded-lg transition-all flex items-center justify-center gap-2 ${activeTab === "candidates"
              ? "bg-[#2563EB] text-white shadow-md"
              : "text-slate-600 hover:text-[#2563EB]"
            }`}
        >
          <Bot className="w-4 h-4" /> Đánh giá Ứng viên AI ({job.applications?.length || 0})
        </button>
      </div>

      {/* TAB 1: Job Description Info */}
      {activeTab === "info" && (() => {
        const hired = job.hiredCount ?? (job.applications?.filter((a: any) => a.currentStage === "HIRED").length || 0);
        const quota = job.targetHires ?? 1;
        const progress = quota > 0 ? Math.min(100, Math.round((hired / quota) * 100)) : 0;
        const expiry = job.expiryDate ? new Date(job.expiryDate) : null;
        const isExpired = expiry ? isPast(expiry) && !isToday(expiry) : false;
        const daysLeft = expiry ? differenceInDays(expiry, new Date()) : null;

        return (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

            {/* Main Info */}
            <div className="lg:col-span-2 space-y-6">

              {/* Headcount Quota & Expiry Tracker */}
              <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-4">
                  <div className="flex items-center gap-3">
                    <div className="p-2.5 bg-[#EFF6FF] text-[#2563EB] rounded-xl border border-blue-200">
                      <Users className="w-5 h-5" />
                    </div>
                    <div>
                      <span className="text-xs font-bold text-slate-400 uppercase tracking-wider block">Tiến độ Tuyển dụng (Headcount)</span>
                      <h3 className="text-lg font-extrabold text-[#1F2937]">
                        Đã tuyển {hired} / {quota} chỉ tiêu ({progress}%)
                      </h3>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => setIsQuotaModalOpen(true)}
                      className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-[#2563EB] hover:bg-[#1D4ED8] text-white text-xs font-bold rounded-xl shadow-sm transition-all active:scale-95"
                    >
                      <TrendingUp className="w-4 h-4" /> Tăng chỉ tiêu (+)
                    </button>
                    <button
                      type="button"
                      onClick={() => setIsExpiryModalOpen(true)}
                      className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-[#EFF6FF] hover:bg-blue-100 text-[#2563EB] text-xs font-bold rounded-xl border border-blue-200 transition-colors"
                    >
                      <Calendar className="w-4 h-4" /> Gia hạn tin
                    </button>
                  </div>
                </div>

                {/* Progress bar */}
                <div className="space-y-1.5">
                  <div className="flex justify-between text-xs font-bold">
                    <span className="text-slate-600">Ứng viên đã nhận việc (HIRED): <strong className="text-[#2563EB]">{hired}</strong></span>
                    <span className={hired >= quota ? "text-emerald-600 font-extrabold" : "text-slate-600"}>
                      {hired >= quota ? "✓ ĐÃ ĐẠT CHỈ TIÊU (100%)" : `Còn thiếu ${quota - hired} vị trí`}
                    </span>
                  </div>
                  <div className="w-full bg-slate-100 h-3 rounded-full overflow-hidden p-0.5 border border-slate-200">
                    <div
                      className={`h-full rounded-full transition-all duration-500 ${
                        hired >= quota ? "bg-emerald-500" : "bg-[#2563EB]"
                      }`}
                      style={{ width: `${progress}%` }}
                    />
                  </div>
                </div>

                {/* Status details footer */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2 text-xs">
                  <div className="flex items-center gap-2 p-2.5 bg-slate-50 rounded-xl border border-slate-100">
                    <Clock className="w-4 h-4 text-slate-400 shrink-0" />
                    <span className="text-slate-600">
                      Thời hạn: <strong>{expiry ? format(expiry, "dd/MM/yyyy") : "Không giới hạn"}</strong>
                      {isExpired ? " (Đã hết hạn)" : daysLeft !== null && daysLeft <= 3 && daysLeft >= 0 ? ` (Còn ${daysLeft === 0 ? "hôm nay" : `${daysLeft} ngày`})` : ""}
                    </span>
                  </div>
                  <div className="flex items-center gap-2 p-2.5 bg-slate-50 rounded-xl border border-slate-100">
                    <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
                    <span className="text-slate-600">
                      Chính sách: <strong>{job.autoCloseOnQuota ? "Tự động đóng khi đủ chỉ tiêu" : "Giữ mở tuyển liên tục"}</strong>
                    </span>
                  </div>
                </div>
              </div>

              {/* Quick Metrics */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 bg-white p-4 rounded-xl border border-slate-200">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-[#EFF6FF] text-[#2563EB] rounded-lg">
                  <MapPin className="w-5 h-5" />
                </div>
                <div>
                  <span className="text-[10px] text-slate-400 font-bold block uppercase">Địa điểm</span>
                  <span className="text-xs font-bold text-slate-700">{job.location || "Chưa cập nhật"}</span>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <div className="p-2 bg-[#EFF6FF] text-[#2563EB] rounded-lg">
                  <Briefcase className="w-5 h-5" />
                </div>
                <div>
                  <span className="text-[10px] text-slate-400 font-bold block uppercase">Hình thức</span>
                  <span className="text-xs font-bold text-slate-700">{job.employmentType || "Toàn thời gian"}</span>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <div className="p-2 bg-[#EFF6FF] text-[#2563EB] rounded-lg">
                  <DollarSign className="w-5 h-5" />
                </div>
                <div>
                  <span className="text-[10px] text-slate-400 font-bold block uppercase">Mức lương</span>
                  <span className="text-xs font-bold text-slate-700">
                    {job.minSalary ? `${job.minSalary.toLocaleString()} - ${job.maxSalary?.toLocaleString()} ${job.currency || 'VND'}` : "Thỏa thuận"}
                  </span>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <div className="p-2 bg-[#EFF6FF] text-[#2563EB] rounded-lg">
                  <Clock className="w-5 h-5" />
                </div>
                <div>
                  <span className="text-[10px] text-slate-400 font-bold block uppercase">Kinh nghiệm</span>
                  <span className="text-xs font-bold text-slate-700">{job.requiredExperienceYears || 0} năm</span>
                </div>
              </div>
            </div>

            {/* Description */}
            <div className="bg-white p-6 rounded-2xl border border-slate-200 space-y-3">
              <h3 className="text-base font-extrabold text-[#1F2937] flex items-center gap-2 border-b pb-2">
                <FileText className="w-5 h-5 text-[#2563EB]" /> Mô tả Công việc (Job Description)
              </h3>
              <div className="text-xs text-slate-700 leading-relaxed whitespace-pre-line font-medium">
                {job.description}
              </div>
            </div>

            {/* Requirements */}
            <div className="bg-white p-6 rounded-2xl border border-slate-200 space-y-3">
              <h3 className="text-base font-extrabold text-[#1F2937] flex items-center gap-2 border-b pb-2">
                <CheckCircle2 className="w-5 h-5 text-[#2563EB]" /> Yêu cầu ứng viên (Requirements)
              </h3>
              <div className="text-xs text-slate-700 leading-relaxed whitespace-pre-line font-medium">
                {job.requirements || "Không có yêu cầu chi tiết."}
              </div>
            </div>
          </div>

          {/* Sidebar Info: Job Skills & Criteria */}
          <div className="space-y-6">

            {/* Skills Card */}
            <div className="bg-white p-6 rounded-2xl border border-slate-200 space-y-4">
              <h3 className="text-sm font-extrabold text-[#1F2937] flex items-center gap-2 border-b pb-2">
                <Award className="w-4 h-4 text-[#2563EB]" /> Kỹ năng Yêu cầu
              </h3>

              <div className="space-y-3">
                <div>
                  <span className="text-xs font-bold text-[#2563EB] block mb-1.5">Bắt buộc (Mandatory):</span>
                  <div className="flex flex-wrap gap-1.5">
                    {job.jobSkills?.filter(s => s.requirementType === "MANDATORY").map((s) => (
                      <span key={s.id} className="px-2.5 py-1 bg-blue-50 text-[#2563EB] text-xs font-bold rounded-lg border border-blue-200">
                        {s.skill.name}
                      </span>
                    ))}
                    {(!job.jobSkills || job.jobSkills.filter(s => s.requirementType === "MANDATORY").length === 0) && (
                      <span className="text-xs text-slate-400 italic">Chưa quy định</span>
                    )}
                  </div>
                </div>

                <div>
                  <span className="text-xs font-bold text-slate-600 block mb-1.5">Ưu tiên / Điểm cộng (Preferred):</span>
                  <div className="flex flex-wrap gap-1.5">
                    {job.jobSkills?.filter(s => s.requirementType !== "MANDATORY").map((s) => (
                      <span key={s.id} className="px-2.5 py-1 bg-slate-100 text-slate-700 text-xs font-semibold rounded-lg border border-slate-200">
                        {s.skill.name}
                      </span>
                    ))}
                    {(!job.jobSkills || job.jobSkills.filter(s => s.requirementType !== "MANDATORY").length === 0) && (
                      <span className="text-xs text-slate-400 italic">Không có</span>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* AI Screening Settings */}
            <div className="bg-white p-6 rounded-2xl border border-slate-200 space-y-4">
              <h3 className="text-sm font-extrabold text-[#1F2937] flex items-center gap-2 border-b pb-2">
                <Sparkles className="w-4 h-4 text-[#2563EB]" /> Cấu hình Chấm điểm AI
              </h3>

              <div className="space-y-3 text-xs">
                <div className="flex justify-between items-center bg-[#EFF6FF] p-2.5 rounded-lg border border-blue-100">
                  <span className="text-slate-600 font-medium">Ngưỡng Tự động Duyệt:</span>
                  <span className="font-extrabold text-emerald-600">{job.autoShortlistThreshold || 80} Điểm</span>
                </div>

                <div className="flex justify-between items-center bg-[#EFF6FF] p-2.5 rounded-lg border border-blue-100">
                  <span className="text-slate-600 font-medium">Yêu cầu level:</span>
                  <span className="font-extrabold text-[#2563EB]">
                    {job.experienceLevel || "JUNIOR"} · {job.levelRequirementMode === "REQUIRED" ? "Bắt buộc" : "Cảnh báo"}
                  </span>
                </div>

                <div className="flex justify-between items-center bg-[#EFF6FF] p-2.5 rounded-lg border border-blue-100">
                  <span className="text-slate-600 font-medium">Ngưỡng Tự động Loại:</span>
                  <span className="font-extrabold text-rose-600">{job.autoRejectThreshold || 40} Điểm</span>
                </div>

                <div className="flex justify-between items-center bg-[#EFF6FF] p-2.5 rounded-lg border border-blue-100">
                  <span className="text-slate-600 font-medium">Loại nếu thiếu Skill bắt buộc:</span>
                  <span className={`font-bold px-2 py-0.5 rounded text-[11px] ${job.rejectOnMissingMandatory !== false ? "bg-rose-100 text-rose-700" : "bg-slate-200 text-slate-700"
                    }`}>
                    {job.rejectOnMissingMandatory !== false ? "Bật (Auto-Reject)" : "Tắt"}
                  </span>
                </div>

                <div className="pt-2 border-t border-blue-200/60 space-y-1.5">
                  <span className="font-bold text-slate-700 block text-[11px] uppercase tracking-wider">Phân bổ Trọng số Chấm điểm:</span>
                  <div className="grid grid-cols-2 gap-2 text-[11px]">
                    <div className="bg-white p-2 rounded-lg border border-blue-100 flex justify-between">
                      <span className="text-slate-500">Kỹ năng:</span>
                      <span className="font-bold text-[#2563EB]">{job.skillWeight || 40}%</span>
                    </div>
                    <div className="bg-white p-2 rounded-lg border border-blue-100 flex justify-between">
                      <span className="text-slate-500">Kinh nghiệm:</span>
                      <span className="font-bold text-[#2563EB]">{job.experienceWeight || 30}%</span>
                    </div>
                    <div className="bg-white p-2 rounded-lg border border-blue-100 flex justify-between">
                      <span className="text-slate-500">Học vấn:</span>
                      <span className="font-bold text-[#2563EB]">{job.educationWeight || 15}%</span>
                    </div>
                    <div className="bg-slate-50 p-2 rounded border border-slate-100 flex items-center justify-between">
                      <span className="text-xs text-slate-500 font-bold">Ngoại ngữ / Chứng chỉ</span>
                      <span className="font-bold text-[#2563EB]">{job.otherWeight || 15}%</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

          </div>
        </div>
        );
      })()}

      {/* TAB 2: AI Candidate Evaluation — Candidate Scoring Workspace */}
      {activeTab === "candidates" && (
        <div className="space-y-6">
          {job.applications && job.applications.length > 0 ? (
            <CandidateScoringWorkspace
              job={job}
              applications={job.applications}
              selectedAppId={selectedAppId}
              selectedApplicationDetail={selectedApplicationDetail}
              onSelectApplication={(appId) => setSelectedAppId(appId)}
              token={token}
              onRefresh={refreshApplications}
              onScheduleInterview={() => {
                setInterviewToEdit(null);
                setIsScheduleModalOpen(true);
              }}
              onFeedbackInterview={(interview) => setFeedbackInterview(interview)}
            />
          ) : (
            <div className="p-12 text-center bg-white rounded-2xl border border-slate-200 text-slate-500 space-y-2">
              <User className="w-10 h-10 mx-auto text-[#2563EB]/60" />
              <h4 className="text-base font-bold text-[#1F2937]">Chưa có hồ sơ ứng viên nộp vào bài đăng này</h4>
              <p className="text-xs text-slate-500 max-w-md mx-auto">
                Khi ứng viên ứng tuyển, AI sẽ tự động đọc hồ sơ đã được cập nhật của ứng viên để tính điểm và hiển thị danh sách xếp hạng tại đây.
              </p>
            </div>
          )}
        </div>
      )}

      {/* MODALS */}
      {isScheduleModalOpen && selectedApplicationDetail && (
        <ScheduleInterviewModal
          isOpen={isScheduleModalOpen}
          onClose={() => {
            setIsScheduleModalOpen(false);
            setInterviewToEdit(null);
          }}
          token={token}
          applicationId={selectedApplicationDetail.id}
          candidateName={selectedApplicationDetail.candidate?.fullName || "Ứng viên"}
          jobTitle={job.title}
          interviewToEdit={interviewToEdit}
          existingInterviewsCount={selectedApplicationDetail.interviews?.length || 0}
          onSuccess={refreshApplications}
        />
      )}

      {feedbackInterview && selectedApplicationDetail && (
        <InterviewFeedbackModal
          isOpen={!!feedbackInterview}
          onClose={() => setFeedbackInterview(null)}
          token={token}
          interview={feedbackInterview}
          candidateName={selectedApplicationDetail.candidate?.fullName || "Ứng viên"}
          onSuccess={refreshApplications}
        />
      )}

      {isQuotaModalOpen && (
        <AdjustJobQuotaModal
          isOpen={isQuotaModalOpen}
          onClose={() => setIsQuotaModalOpen(false)}
          job={job}
          token={token}
          onSuccess={(updatedJob) => {
            setJob((prev) => (prev ? { ...prev, ...updatedJob } : updatedJob));
            fetchJobDetail();
          }}
        />
      )}

      {isExpiryModalOpen && (
        <ExtendJobDeadlineModal
          isOpen={isExpiryModalOpen}
          onClose={() => setIsExpiryModalOpen(false)}
          job={job}
          token={token}
          onSuccess={(updatedJob) => {
            setJob((prev) => (prev ? { ...prev, ...updatedJob } : updatedJob));
            fetchJobDetail();
          }}
        />
      )}
    </div>
  );
}
