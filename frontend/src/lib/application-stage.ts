import type { ApplicationStage } from "@/lib/recruiter-api";

export const applicationStageLabels: Record<ApplicationStage, string> = {
  RECEIVED: "Đã tiếp nhận",
  SCREENING: "Đang xem xét",
  SHORTLISTED: "Đã qua vòng hồ sơ",
  INTERVIEW_SCHEDULED: "Đã lên lịch phỏng vấn",
  INTERVIEWED: "Đã phỏng vấn",
  OFFERED: "Đã gửi đề nghị",
  HIRED: "Đã tuyển dụng",
  REJECTED: "Chưa phù hợp",
  WITHDRAWN: "Đã rút hồ sơ",
};

export const applicationStageStyles: Record<ApplicationStage, string> = {
  RECEIVED: "border-slate-200 bg-slate-100 text-slate-700",
  SCREENING: "border-blue-200 bg-blue-50 text-blue-700",
  SHORTLISTED: "border-emerald-200 bg-emerald-50 text-emerald-700",
  INTERVIEW_SCHEDULED: "border-violet-200 bg-violet-50 text-violet-700",
  INTERVIEWED: "border-indigo-200 bg-indigo-50 text-indigo-700",
  OFFERED: "border-amber-200 bg-amber-50 text-amber-700",
  HIRED: "border-emerald-300 bg-emerald-100 text-emerald-800",
  REJECTED: "border-rose-200 bg-rose-50 text-rose-700",
  WITHDRAWN: "border-slate-300 bg-slate-100 text-slate-600",
};
