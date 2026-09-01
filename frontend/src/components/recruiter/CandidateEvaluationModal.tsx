"use client";

import React, { useState, useEffect, useRef } from "react";
import {
  X, User, Sparkles, Code, Briefcase, GraduationCap, Award,
  ShieldCheck, AlertTriangle, ThumbsUp, ThumbsDown, Mail, Phone,
  DollarSign, FolderGit2, Calendar, ChevronDown, ChevronUp,
  CheckCircle2, XCircle, ArrowRight, Lightbulb, FileText,
  TrendingUp, Clock, Building2, BookOpen
} from "lucide-react";
import {
  type JobPostingData,
  type RecruiterApplicationDetail,
} from "@/lib/recruiter-api";
import { ApplicationStageActions } from "./applications/ApplicationStageActions";
import { applicationStageLabels, applicationStageStyles } from "@/lib/application-stage";
import { format } from "date-fns";

interface CandidateEvaluationModalProps {
  isOpen: boolean;
  onClose: () => void;
  activeApp: any;
  selectedApplicationDetail: RecruiterApplicationDetail | null;
  job: JobPostingData;
  token: string;
  rankIndex: number;
  onRefresh: () => void;
  onScheduleInterview: () => void;
  onFeedbackInterview: (interview: any) => void;
}

type PillarKey = "skills" | "experience" | "education" | "other";

const PILLAR_CONFIG = [
  {
    id: "skills" as PillarKey,
    label: "Kỹ Năng",
    shortLabel: "Kỹ năng",
    icon: Code,
    colorClass: "blue",
    activeBg: "bg-blue-50",
    activeBorder: "border-blue-500",
    activeRing: "ring-blue-500",
    scoreColor: "text-blue-700",
    badgeBg: "bg-blue-100 text-blue-800 border-blue-200",
    headerBg: "bg-blue-900",
    pillBg: "bg-blue-50 border-blue-200 text-blue-800",
  },
  {
    id: "experience" as PillarKey,
    label: "Kinh Nghiệm",
    shortLabel: "Kinh nghiệm",
    icon: Briefcase,
    colorClass: "emerald",
    activeBg: "bg-emerald-50",
    activeBorder: "border-emerald-500",
    activeRing: "ring-emerald-500",
    scoreColor: "text-emerald-700",
    badgeBg: "bg-emerald-100 text-emerald-800 border-emerald-200",
    headerBg: "bg-emerald-900",
    pillBg: "bg-emerald-50 border-emerald-200 text-emerald-800",
  },
  {
    id: "education" as PillarKey,
    label: "Học Vấn",
    shortLabel: "Học vấn",
    icon: GraduationCap,
    colorClass: "purple",
    activeBg: "bg-purple-50",
    activeBorder: "border-purple-500",
    activeRing: "ring-purple-500",
    scoreColor: "text-purple-700",
    badgeBg: "bg-purple-100 text-purple-800 border-purple-200",
    headerBg: "bg-purple-900",
    pillBg: "bg-purple-50 border-purple-200 text-purple-800",
  },
  {
    id: "other" as PillarKey,
    label: "Chứng Chỉ & Dự Án",
    shortLabel: "Dự án & CC",
    icon: Award,
    colorClass: "amber",
    activeBg: "bg-amber-50",
    activeBorder: "border-amber-500",
    activeRing: "ring-amber-500",
    scoreColor: "text-amber-700",
    badgeBg: "bg-amber-100 text-amber-800 border-amber-200",
    headerBg: "bg-amber-900",
    pillBg: "bg-amber-50 border-amber-200 text-amber-800",
  },
];

function getMatchLevelColor(level: string | undefined) {
  if (level === "HIGH") return "bg-emerald-100 text-emerald-800 border-emerald-300";
  if (level === "MEDIUM") return "bg-amber-100 text-amber-800 border-amber-300";
  return "bg-rose-100 text-rose-800 border-rose-300";
}

function getScoreColor(score: number, highThreshold = 80, lowThreshold = 40) {
  if (score >= highThreshold) return "text-emerald-600";
  if (score < lowThreshold) return "text-rose-600";
  return "text-amber-500";
}

function SkillsPillarDetail({ aiResult, job }: { aiResult: any; job: JobPostingData }) {
  const sWeight = Number(job.skillWeight) || 40;
  const sScore = Number(aiResult?.skillScore) || 0;
  const sPts = +(sScore * (sWeight / 100)).toFixed(1);
  const maxPts = sWeight;
  const lostPts = +(maxPts - sPts).toFixed(1);

  const matchedSkills: any[] = Array.isArray(aiResult?.matchedSkills) ? aiResult.matchedSkills : [];
  const missingSkills: any[] = Array.isArray(aiResult?.missingSkills) ? aiResult.missingSkills : [];
  const mandatoryRatio = typeof aiResult?.mandatorySkillRatio === "number" ? aiResult.mandatorySkillRatio : null;

  const directMatches = matchedSkills.filter((s: any) => typeof s === "string" || s?.source !== "transferable_skill");
  const transferableMatches = matchedSkills.filter((s: any) => typeof s === "object" && s?.source === "transferable_skill");
  const mandatoryMissing = missingSkills.filter((s: any) => typeof s === "object" ? s?.isMandatory : false);
  const optionalMissing = missingSkills.filter((s: any) => !(typeof s === "object" ? s?.isMandatory : false));

  // Interview probing questions based on skill gaps
  const probingQuestions: string[] = [];
  if (transferableMatches.length > 0) {
    probingQuestions.push("Bạn đã từng làm việc với các framework tương tự (như Vue.js / Angular) trước đây, bạn có thể mô tả sự khác biệt và cách bạn chuyển đổi tư duy sang React không?");
    probingQuestions.push("Hãy cho tôi xem một đoạn code mà bạn refactor từ cú pháp Vue/Angular sang React Hooks.");
  }
  if (mandatoryMissing.length > 0) {
    probingQuestions.push(`Bạn có kinh nghiệm gì liên quan đến ${mandatoryMissing.map((s: any) => s?.name || s).join(", ")} không? Bạn đã từng giải quyết bài toán tương tự như thế nào?`);
  }

  return (
    <div className="space-y-5">
      {/* Accounting Bridge */}
      <div className="bg-slate-900 rounded-xl p-4 space-y-2.5">
        <h6 className="text-xs font-black text-white uppercase tracking-wider flex items-center gap-2">
          <TrendingUp className="w-4 h-4 text-blue-400" /> Bảng Kê Toán Học Minh Bạch (Score Accounting)
        </h6>
        <div className="space-y-1.5">
          <div className="flex justify-between text-xs text-slate-300">
            <span>Điểm trần tối đa của JD:</span>
            <span className="font-bold text-white">{maxPts}.0 đ</span>
          </div>
          {directMatches.map((sk: any, i: number) => {
            const name = typeof sk === "string" ? sk : sk?.name || sk?.skillName || "Kỹ năng";
            return (
              <div key={i} className="flex justify-between text-xs text-emerald-300">
                <span>✓ Khớp trực tiếp: <strong className="text-emerald-200">{name}</strong></span>
                <span className="font-bold">+điểm</span>
              </div>
            );
          })}
          {transferableMatches.map((sk: any, i: number) => {
            const name = typeof sk === "string" ? sk : sk?.name || sk?.skillName || "Kỹ năng";
            const credit = sk?.creditRatio ? `(${Math.round(sk.creditRatio * 100)}%)` : "(~85%)";
            return (
              <div key={i} className="flex justify-between text-xs text-amber-300">
                <span>⇄ Chuyển giao: <strong className="text-amber-200">{name}</strong> {credit}</span>
                <span className="font-bold">+điểm (giảm)</span>
              </div>
            );
          })}
          {mandatoryMissing.map((sk: any, i: number) => {
            const name = typeof sk === "string" ? sk : sk?.name || sk?.skillName || "Kỹ năng";
            return (
              <div key={i} className="flex justify-between text-xs text-rose-300">
                <span>✗ Thiếu tiên quyết: <strong className="text-rose-200">{name}</strong></span>
                <span className="font-bold text-rose-400">−điểm</span>
              </div>
            );
          })}
          <div className="border-t border-slate-700 pt-2 flex justify-between text-sm font-black">
            <span className="text-slate-200">Tổng điểm trụ cột Kỹ năng:</span>
            <span className={sPts >= maxPts * 0.8 ? "text-emerald-400" : sPts >= maxPts * 0.5 ? "text-amber-400" : "text-rose-400"}>
              {sPts} / {maxPts} đ
            </span>
          </div>
          {lostPts > 0 && (
            <div className="text-[11px] text-slate-400 text-right">
              Mất {lostPts} đ so với điểm trần (Hiệu suất: {Math.round(sScore)}%)
            </div>
          )}
        </div>
      </div>

      {/* Skill Evidence */}
      <div className="space-y-3">
        <h6 className="text-xs font-black text-slate-700 uppercase tracking-wider flex items-center gap-2">
          <FileText className="w-4 h-4 text-blue-600" /> Trích Xuất Bằng Chứng Từ Hồ Sơ
        </h6>

        {matchedSkills.length > 0 && (
          <div className="space-y-2">
            <p className="text-[11px] font-bold text-emerald-700 flex items-center gap-1">
              <CheckCircle2 className="w-3.5 h-3.5" /> Kỹ năng khớp & Chuyển giao năng lực:
            </p>
            <div className="flex flex-wrap gap-1.5">
              {matchedSkills.map((sk: any, i: number) => {
                const name = typeof sk === "string" ? sk : sk?.name || sk?.skillName || "Kỹ năng";
                const isMan = typeof sk === "object" ? sk?.isMandatory : false;
                const isTransfer = typeof sk === "object" && sk?.source === "transferable_skill";
                const credit = isTransfer && sk?.creditRatio ? Math.round(sk.creditRatio * 100) : null;
                return (
                  <span key={i} className={`px-2.5 py-1 rounded-lg text-[11px] font-bold border flex items-center gap-1.5 ${
                    isTransfer ? "bg-amber-50 text-amber-900 border-amber-300" :
                    isMan ? "bg-emerald-50 text-emerald-900 border-emerald-300" :
                    "bg-white text-slate-800 border-slate-200"
                  }`}>
                    {name}
                    {isTransfer && (
                      <span className="text-[9px] px-1 rounded bg-amber-200 text-amber-900 font-black">
                        CHUYỂN GIAO {credit ? `${credit}%` : ""}
                      </span>
                    )}
                    {isMan && !isTransfer && (
                      <span className="text-[9px] px-1 rounded bg-emerald-200 text-emerald-900 font-black">BẮT BUỘC</span>
                    )}
                  </span>
                );
              })}
            </div>
          </div>
        )}

        {missingSkills.length > 0 && (
          <div className="space-y-2 mt-2">
            <p className="text-[11px] font-bold text-rose-700 flex items-center gap-1">
              <XCircle className="w-3.5 h-3.5" /> Kỹ năng chưa có bằng chứng xác thực:
            </p>
            <div className="flex flex-wrap gap-1.5">
              {missingSkills.map((sk: any, i: number) => {
                const name = typeof sk === "string" ? sk : sk?.name || sk?.skillName || "Kỹ năng";
                const isMan = typeof sk === "object" ? sk?.isMandatory : false;
                return (
                  <span key={i} className="px-2.5 py-1 rounded-lg text-[11px] font-bold bg-rose-50 text-rose-800 border border-rose-200 flex items-center gap-1.5">
                    {name}
                    {isMan && <span className="text-[9px] px-1 rounded bg-rose-200 text-rose-900 font-black">TIÊN QUYẾT</span>}
                  </span>
                );
              })}
            </div>
          </div>
        )}

        {mandatoryRatio !== null && (
          <div className="mt-2 p-3 bg-slate-50 rounded-lg border border-slate-200">
            <div className="flex justify-between text-xs font-bold text-slate-700 mb-1.5">
              <span>Tỷ lệ đáp ứng kỹ năng bắt buộc (Mandatory Ratio)</span>
              <span className={mandatoryRatio >= 0.88 ? "text-emerald-600" : mandatoryRatio >= 0.6 ? "text-amber-600" : "text-rose-600"}>
                {Math.round(mandatoryRatio * 100)}%
              </span>
            </div>
            <div className="w-full bg-slate-200 rounded-full h-2">
              <div
                className={`h-2 rounded-full transition-all ${mandatoryRatio >= 0.88 ? "bg-emerald-500" : mandatoryRatio >= 0.6 ? "bg-amber-500" : "bg-rose-500"}`}
                style={{ width: `${Math.round(mandatoryRatio * 100)}%` }}
              />
            </div>
            <p className="text-[11px] text-slate-500 mt-1.5">
              Ngưỡng bắt buộc tối thiểu của JD: <strong>88%</strong> để không bị chặn điểm
            </p>
          </div>
        )}
      </div>

      {/* Probing Questions */}
      {probingQuestions.length > 0 && (
        <div className="bg-gradient-to-br from-blue-900 to-indigo-900 rounded-xl p-4 space-y-2.5">
          <h6 className="text-xs font-black text-blue-200 uppercase tracking-wider flex items-center gap-2">
            <Lightbulb className="w-4 h-4 text-yellow-300" /> Gợi Ý Câu Hỏi Phỏng Vấn Kỹ Thuật
          </h6>
          <div className="space-y-2">
            {probingQuestions.map((q, i) => (
              <div key={i} className="flex gap-2.5 text-xs text-blue-100">
                <ArrowRight className="w-3.5 h-3.5 mt-0.5 shrink-0 text-yellow-300" />
                <span className="leading-relaxed">{q}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function ExperiencePillarDetail({ aiResult, job, workExps }: { aiResult: any; job: JobPostingData; workExps: any[] }) {
  const eWeight = Number(job.experienceWeight) || 30;
  const eScore = Number(aiResult?.experienceScore) || 0;
  const ePts = +(eScore * (eWeight / 100)).toFixed(1);
  const totalYears = aiResult?.totalExperienceYears ? Number(aiResult.totalExperienceYears) : null;
  const requiredYears = (job as any).minYearsOfExperience || 0;

  const fraudFlags: any[] = Array.isArray(aiResult?.fraudFlags) ? aiResult.fraudFlags : [];
  const highRiskFlags = fraudFlags.filter((f: any) => f?.severity === "HIGH");
  const infoFlags = fraudFlags.filter((f: any) => f?.severity === "INFO" || f?.severity === "WARNING");

  const probingQuestions: string[] = [];
  if (highRiskFlags.length > 0) {
    probingQuestions.push("Có một số mốc thời gian trong hồ sơ có vẻ không khớp với thực tế. Bạn có thể mô tả chi tiết lịch sử làm việc của mình từ năm 2020 đến nay không?");
    probingQuestions.push("Bạn đã từng làm việc song song ở nhiều công ty cùng lúc (full-time) không? Xin hãy giải thích cách bạn quản lý thời gian trong trường hợp đó.");
  }
  if (totalYears !== null && totalYears < requiredYears) {
    probingQuestions.push(`JD yêu cầu tối thiểu ${requiredYears} năm kinh nghiệm. Bạn có thể giải thích tại sao bạn tin rằng ${totalYears.toFixed(1)} năm kinh nghiệm của bạn đủ để đảm nhận vị trí Senior này?`);
  }

  return (
    <div className="space-y-5">
      {/* Score Accounting */}
      <div className="bg-slate-900 rounded-xl p-4 space-y-2.5">
        <h6 className="text-xs font-black text-white uppercase tracking-wider flex items-center gap-2">
          <TrendingUp className="w-4 h-4 text-emerald-400" /> Bảng Kê Toán Học Minh Bạch
        </h6>
        <div className="space-y-1.5">
          <div className="flex justify-between text-xs text-slate-300">
            <span>Điểm trần tối đa:</span>
            <span className="font-bold text-white">{eWeight}.0 đ</span>
          </div>
          {totalYears !== null && (
            <div className="flex justify-between text-xs">
              <span className="text-slate-300">Thâm niên tích lũy thực tế:</span>
              <span className={`font-bold ${totalYears >= requiredYears ? "text-emerald-300" : "text-amber-300"}`}>
                {totalYears.toFixed(1)} năm / {requiredYears} năm yêu cầu
              </span>
            </div>
          )}
          {highRiskFlags.length > 0 && (
            <div className="flex justify-between text-xs text-rose-300">
              <span>⚠ Trừ điểm cờ rủi ro niên đại / gian lận:</span>
              <span className="font-bold text-rose-400">−điểm</span>
            </div>
          )}
          <div className="border-t border-slate-700 pt-2 flex justify-between text-sm font-black">
            <span className="text-slate-200">Tổng điểm trụ cột Kinh nghiệm:</span>
            <span className={ePts >= eWeight * 0.8 ? "text-emerald-400" : ePts >= eWeight * 0.5 ? "text-amber-400" : "text-rose-400"}>
              {ePts} / {eWeight} đ
            </span>
          </div>
          <div className="text-[11px] text-slate-400 text-right">
            Hiệu suất: {Math.round(eScore)}% — Cấp bậc JD: <strong className="text-slate-200">{job.experienceLevel || "SENIOR"}</strong>
          </div>
        </div>
      </div>

      {/* Work History Evidence */}
      <div className="space-y-3">
        <h6 className="text-xs font-black text-slate-700 uppercase tracking-wider flex items-center gap-2">
          <FileText className="w-4 h-4 text-emerald-600" /> Lịch Sử Công Tác Trích Xuất Từ Hồ Sơ
        </h6>
        {workExps.length > 0 ? (
          <div className="space-y-2.5">
            {workExps.map((exp: any, i: number) => {
              const start = exp.startDate ? format(new Date(exp.startDate), "MM/yyyy") : "??";
              const end = exp.isCurrent ? "Hiện tại" : exp.endDate ? format(new Date(exp.endDate), "MM/yyyy") : "??";
              return (
                <div key={i} className="p-3 bg-white rounded-xl border border-slate-200 shadow-2xs space-y-1">
                  <div className="flex justify-between items-start">
                    <div>
                      <p className="text-xs font-black text-slate-900">{exp.positionTitle}</p>
                      <p className="text-[11px] text-slate-500 flex items-center gap-1">
                        <Building2 className="w-3 h-3" /> {exp.companyName}
                      </p>
                    </div>
                    <span className="text-[10px] bg-slate-100 text-slate-600 px-2 py-0.5 rounded font-bold flex items-center gap-1 shrink-0">
                      <Clock className="w-3 h-3" /> {start} – {end}
                    </span>
                  </div>
                  {exp.description && (
                    <p className="text-[11px] text-slate-600 leading-relaxed line-clamp-2">{exp.description}</p>
                  )}
                </div>
              );
            })}
          </div>
        ) : (
          <p className="text-xs text-slate-400 italic bg-slate-50 p-3 rounded-lg border border-slate-200">
            Chưa ghi nhận thông tin lịch sử công việc trong hồ sơ.
          </p>
        )}
      </div>

      {/* Fraud Flags */}
      {fraudFlags.length > 0 && (
        <div className="space-y-2">
          <h6 className="text-xs font-black text-slate-700 uppercase tracking-wider flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-rose-600" /> Kiểm Định Tính Toàn Vẹn Thời Gian
          </h6>
          {highRiskFlags.map((flag: any, i: number) => (
            <div key={i} className="p-3 bg-rose-50 border border-rose-200 rounded-xl flex gap-2.5">
              <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
              <div>
                <p className="text-xs font-black text-rose-800">{flag.type || "HIGH RISK"}</p>
                <p className="text-[11px] text-rose-700 leading-relaxed">{flag.description || flag.detail}</p>
              </div>
            </div>
          ))}
          {infoFlags.map((flag: any, i: number) => (
            <div key={i} className="p-3 bg-amber-50 border border-amber-200 rounded-xl flex gap-2.5">
              <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
              <div>
                <p className="text-xs font-black text-amber-800">{flag.type || "INFO"}</p>
                <p className="text-[11px] text-amber-700 leading-relaxed">{flag.description || flag.detail}</p>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Probing Questions */}
      {probingQuestions.length > 0 && (
        <div className="bg-gradient-to-br from-emerald-900 to-teal-900 rounded-xl p-4 space-y-2.5">
          <h6 className="text-xs font-black text-emerald-200 uppercase tracking-wider flex items-center gap-2">
            <Lightbulb className="w-4 h-4 text-yellow-300" /> Gợi Ý Câu Hỏi Phỏng Vấn
          </h6>
          <div className="space-y-2">
            {probingQuestions.map((q, i) => (
              <div key={i} className="flex gap-2.5 text-xs text-emerald-100">
                <ArrowRight className="w-3.5 h-3.5 mt-0.5 shrink-0 text-yellow-300" />
                <span className="leading-relaxed">{q}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function EducationPillarDetail({ aiResult, job, educations }: { aiResult: any; job: JobPostingData; educations: any[] }) {
  const edWeight = Number(job.educationWeight) || 15;
  const edScore = Number(aiResult?.educationScore) || 0;
  const edPts = +(edScore * (edWeight / 100)).toFixed(1);

  const probingQuestions: string[] = [];
  if (edPts < edWeight * 0.6) {
    probingQuestions.push("Chuyên ngành đào tạo của bạn không hoàn toàn trùng với lĩnh vực kỹ thuật phần mềm. Bạn đã tự học và phát triển kỹ năng kỹ thuật theo hướng nào?");
    probingQuestions.push("Bạn có các chứng chỉ kỹ thuật hoặc khóa học online nào (Coursera, Udemy, AWS, Google) để bổ sung cho bằng cấp chính thức không?");
  }

  return (
    <div className="space-y-5">
      <div className="bg-slate-900 rounded-xl p-4 space-y-2.5">
        <h6 className="text-xs font-black text-white uppercase tracking-wider flex items-center gap-2">
          <TrendingUp className="w-4 h-4 text-purple-400" /> Bảng Kê Toán Học Minh Bạch
        </h6>
        <div className="space-y-1.5">
          <div className="flex justify-between text-xs text-slate-300">
            <span>Điểm trần tối đa:</span>
            <span className="font-bold text-white">{edWeight}.0 đ</span>
          </div>
          <div className="flex justify-between text-xs text-slate-300">
            <span>Hiệu suất đạt được:</span>
            <span className={`font-bold ${edScore >= 80 ? "text-emerald-300" : edScore >= 60 ? "text-amber-300" : "text-rose-300"}`}>
              {Math.round(edScore)}%
            </span>
          </div>
          <div className="border-t border-slate-700 pt-2 flex justify-between text-sm font-black">
            <span className="text-slate-200">Tổng điểm trụ cột Học vấn:</span>
            <span className={edPts >= edWeight * 0.8 ? "text-emerald-400" : edPts >= edWeight * 0.5 ? "text-amber-400" : "text-rose-400"}>
              {edPts} / {edWeight} đ
            </span>
          </div>
        </div>
      </div>

      <div className="space-y-3">
        <h6 className="text-xs font-black text-slate-700 uppercase tracking-wider flex items-center gap-2">
          <BookOpen className="w-4 h-4 text-purple-600" /> Hồ Sơ Học Vấn Trích Xuất
        </h6>
        {educations.length > 0 ? (
          <div className="space-y-2.5">
            {educations.map((edu: any, i: number) => {
              const start = edu.startDate ? format(new Date(edu.startDate), "yyyy") : "??";
              const end = edu.endDate ? format(new Date(edu.endDate), "yyyy") : "??";
              return (
                <div key={i} className="p-3.5 bg-white rounded-xl border border-purple-100 shadow-2xs space-y-2">
                  <div className="flex justify-between items-start">
                    <div>
                      <p className="text-xs font-black text-slate-900">🎓 {edu.schoolName}</p>
                      <p className="text-[11px] font-bold text-purple-700 mt-0.5">{edu.degree}</p>
                    </div>
                    <span className="text-[10px] bg-purple-50 text-purple-700 border border-purple-200 px-2 py-0.5 rounded font-bold shrink-0">
                      {start} – {end}
                    </span>
                  </div>
                  {edu.major && (
                    <p className="text-[11px] text-slate-600">
                      Chuyên ngành: <strong className="text-slate-800">{edu.major}</strong>
                    </p>
                  )}
                </div>
              );
            })}
          </div>
        ) : (
          <p className="text-xs text-slate-400 italic bg-slate-50 p-3 rounded-lg border border-slate-200">
            Chưa ghi nhận thông tin học vấn chính thức trong hồ sơ.
          </p>
        )}
      </div>

      {probingQuestions.length > 0 && (
        <div className="bg-gradient-to-br from-purple-900 to-violet-900 rounded-xl p-4 space-y-2.5">
          <h6 className="text-xs font-black text-purple-200 uppercase tracking-wider flex items-center gap-2">
            <Lightbulb className="w-4 h-4 text-yellow-300" /> Gợi Ý Câu Hỏi Phỏng Vấn
          </h6>
          <div className="space-y-2">
            {probingQuestions.map((q, i) => (
              <div key={i} className="flex gap-2.5 text-xs text-purple-100">
                <ArrowRight className="w-3.5 h-3.5 mt-0.5 shrink-0 text-yellow-300" />
                <span className="leading-relaxed">{q}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function OtherPillarDetail({ aiResult, job, projects }: { aiResult: any; job: JobPostingData; projects: any[] }) {
  const oWeight = Number(job.otherWeight) || 15;
  const oScore = Number(aiResult?.projectScore) || 0;
  const oPts = +(oScore * (oWeight / 100)).toFixed(1);

  const probingQuestions: string[] = [];
  if (projects.length > 0) {
    probingQuestions.push("Hãy mô tả quy mô hệ thống lớn nhất bạn từng xây dựng? Số lượng người dùng đồng thời, lưu lượng truy cập và cách bạn scale hệ thống?");
    probingQuestions.push("Trong dự án nổi bật nhất của bạn, bạn đã đóng góp kỹ thuật cụ thể gì và kết quả định lượng (metrics) đo lường được là gì?");
  }
  if (oPts < oWeight * 0.5) {
    probingQuestions.push("Bạn có dự án cá nhân (side project), đóng góp Open Source, hoặc chứng chỉ kỹ thuật quốc tế nào không? Vui lòng chia sẻ GitHub hoặc portfolio.");
  }

  return (
    <div className="space-y-5">
      <div className="bg-slate-900 rounded-xl p-4 space-y-2.5">
        <h6 className="text-xs font-black text-white uppercase tracking-wider flex items-center gap-2">
          <TrendingUp className="w-4 h-4 text-amber-400" /> Bảng Kê Toán Học Minh Bạch
        </h6>
        <div className="space-y-1.5">
          <div className="flex justify-between text-xs text-slate-300">
            <span>Điểm trần tối đa:</span>
            <span className="font-bold text-white">{oWeight}.0 đ</span>
          </div>
          <div className="flex justify-between text-xs text-slate-300">
            <span>Số dự án nổi bật ghi nhận:</span>
            <span className="font-bold text-amber-300">{projects.length} dự án</span>
          </div>
          <div className="border-t border-slate-700 pt-2 flex justify-between text-sm font-black">
            <span className="text-slate-200">Tổng điểm Chứng chỉ & Dự án:</span>
            <span className={oPts >= oWeight * 0.8 ? "text-emerald-400" : oPts >= oWeight * 0.5 ? "text-amber-400" : "text-rose-400"}>
              {oPts} / {oWeight} đ
            </span>
          </div>
          <div className="text-[11px] text-slate-400 text-right">Hiệu suất: {Math.round(oScore)}%</div>
        </div>
      </div>

      {projects.length > 0 && (
        <div className="space-y-3">
          <h6 className="text-xs font-black text-slate-700 uppercase tracking-wider flex items-center gap-2">
            <FolderGit2 className="w-4 h-4 text-amber-600" /> Dự Án Nổi Bật Trích Xuất
          </h6>
          <div className="space-y-2.5">
            {projects.map((proj: any, i: number) => {
              const start = proj.startDate ? format(new Date(proj.startDate), "MM/yyyy") : "??";
              const end = proj.endDate ? format(new Date(proj.endDate), "MM/yyyy") : "Hiện tại";
              return (
                <div key={i} className="p-3.5 bg-white rounded-xl border border-amber-100 shadow-2xs space-y-2">
                  <div className="flex justify-between items-start">
                    <p className="text-xs font-black text-slate-900">🏗 {proj.projectName || proj.name || `Dự án ${i + 1}`}</p>
                    <span className="text-[10px] bg-amber-50 text-amber-700 border border-amber-200 px-2 py-0.5 rounded font-bold shrink-0">
                      {start} – {end}
                    </span>
                  </div>
                  {proj.role && <p className="text-[11px] text-amber-700 font-bold">Vai trò: {proj.role}</p>}
                  {proj.description && (
                    <p className="text-[11px] text-slate-600 leading-relaxed line-clamp-3">{proj.description}</p>
                  )}
                  {proj.technologies && (
                    <div className="flex flex-wrap gap-1">
                      {(Array.isArray(proj.technologies) ? proj.technologies : proj.technologies.split(",")).map((tech: string, ti: number) => (
                        <span key={ti} className="text-[10px] px-1.5 py-0.5 bg-amber-50 text-amber-800 border border-amber-200 rounded font-bold">{tech.trim()}</span>
                      ))}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {probingQuestions.length > 0 && (
        <div className="bg-gradient-to-br from-amber-900 to-orange-900 rounded-xl p-4 space-y-2.5">
          <h6 className="text-xs font-black text-amber-200 uppercase tracking-wider flex items-center gap-2">
            <Lightbulb className="w-4 h-4 text-yellow-300" /> Gợi Ý Câu Hỏi Phỏng Vấn
          </h6>
          <div className="space-y-2">
            {probingQuestions.map((q, i) => (
              <div key={i} className="flex gap-2.5 text-xs text-amber-100">
                <ArrowRight className="w-3.5 h-3.5 mt-0.5 shrink-0 text-yellow-300" />
                <span className="leading-relaxed">{q}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

export function CandidateEvaluationModal({
  isOpen,
  onClose,
  activeApp,
  selectedApplicationDetail,
  job,
  token,
  rankIndex,
  onRefresh,
  onScheduleInterview,
  onFeedbackInterview,
}: CandidateEvaluationModalProps) {
  const [activePillar, setActivePillar] = useState<PillarKey>("skills");
  const rightPanelRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => { document.body.style.overflow = ""; };
  }, [isOpen]);

  useEffect(() => {
    const handler = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [onClose]);

  if (!isOpen || !activeApp) return null;

  const aiResult = activeApp.aiMatchingResults?.[0];
  const cand = activeApp.candidate;
  const user = cand?.user;
  const score = aiResult ? Math.round(Number(aiResult.overallScore)) : 0;
  const workExps = cand?.workExperiences || [];
  const educations = cand?.educations || [];
  const projects = cand?.projects || [];
  const evaluationPending = !aiResult && !["FAILED", "MATCHED"].includes(activeApp.processingStatus || "");

  const sWeight = Number(job.skillWeight) || 40;
  const eWeight = Number(job.experienceWeight) || 30;
  const edWeight = Number(job.educationWeight) || 15;
  const oWeight = Number(job.otherWeight) || 15;
  const sScore = Number(aiResult?.skillScore) || 0;
  const eScore = Number(aiResult?.experienceScore) || 0;
  const edScore = Number(aiResult?.educationScore) || 0;
  const oScore = Number(aiResult?.projectScore) || 0;
  const sPts = +(sScore * (sWeight / 100)).toFixed(1);
  const ePts = +(eScore * (eWeight / 100)).toFixed(1);
  const edPts = +(edScore * (edWeight / 100)).toFixed(1);
  const oPts = +(oScore * (oWeight / 100)).toFixed(1);
  const pillarsData = [
    { ...PILLAR_CONFIG[0], pts: sPts, max: sWeight, score: sScore },
    { ...PILLAR_CONFIG[1], pts: ePts, max: eWeight, score: eScore },
    { ...PILLAR_CONFIG[2], pts: edPts, max: edWeight, score: edScore },
    { ...PILLAR_CONFIG[3], pts: oPts, max: oWeight, score: oScore },
  ];

  const activePillarConfig = PILLAR_CONFIG.find(p => p.id === activePillar)!;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Modal Container */}
      <div className="relative z-10 w-full max-w-7xl h-[95vh] bg-white rounded-2xl shadow-2xl flex flex-col overflow-hidden border border-slate-200">

        {/* ─── HEADER ─── */}
        <div className="flex items-center justify-between bg-gradient-to-r from-slate-900 to-slate-800 px-5 py-3.5 shrink-0">
          <div className="flex items-center gap-3 min-w-0">
            {/* Rank Badge */}
            <div className={`w-8 h-8 rounded-lg flex items-center justify-center font-black text-sm shrink-0 ${
              rankIndex === 0 ? "bg-amber-400 text-amber-900" :
              rankIndex === 1 ? "bg-slate-300 text-slate-800" :
              rankIndex === 2 ? "bg-orange-400 text-orange-900" :
              "bg-slate-600 text-slate-200"
            }`}>
              #{rankIndex + 1}
            </div>
            {/* Avatar */}
            <div className="w-9 h-9 rounded-full bg-blue-500 text-white font-bold flex items-center justify-center text-sm shrink-0 overflow-hidden">
              {user?.avatarUrl ? <img src={user.avatarUrl} alt="" className="w-full h-full object-cover" /> : (user?.fullName?.charAt(0) || "U")}
            </div>
            {/* Name & Title */}
            <div className="min-w-0">
              <h2 className="text-base font-black text-white truncate">{user?.fullName || "Ứng viên"}</h2>
              <p className="text-xs text-slate-400 truncate">{cand?.desiredTitle || user?.email}</p>
            </div>
            {/* Score Pill */}
            {aiResult && (
              <div className={`ml-2 flex items-baseline gap-1 px-3 py-1 rounded-lg border font-black shrink-0 ${getMatchLevelColor(aiResult.matchLevel)}`}>
                <span className="text-lg">{score}</span>
                <span className="text-xs font-normal">/ 100 đ</span>
              </div>
            )}
          </div>
          <button
            onClick={onClose}
            className="ml-4 p-1.5 rounded-lg bg-slate-700 hover:bg-slate-600 text-slate-300 hover:text-white transition-colors shrink-0"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* ─── BODY: 2 columns ─── */}
        <div className="flex flex-1 overflow-hidden">

          {/* LEFT COLUMN: Candidate Profile */}
          <div className="w-2/5 border-r border-slate-200 overflow-y-auto bg-slate-50/50 p-5 space-y-5">

            {/* Decision Actions */}
            {selectedApplicationDetail && selectedApplicationDetail.id === activeApp.id && (
              <div className="bg-white rounded-xl border border-blue-200 p-4 space-y-2">
                <h4 className="text-xs font-black text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
                  <CheckCircle2 className="w-4 h-4 text-blue-600" /> Quyết định Tuyển dụng
                </h4>
                <ApplicationStageActions
                  token={token}
                  applicationId={activeApp.id}
                  currentStage={selectedApplicationDetail.currentStage}
                  allowedTransitions={selectedApplicationDetail.allowedTransitions}
                  currentHrNotes={selectedApplicationDetail.hrNotes}
                  onUpdated={onRefresh}
                  onScheduleInterview={onScheduleInterview}
                />
              </div>
            )}

            {/* Contact Info */}
            <div className="bg-white rounded-xl border border-slate-200 p-4 space-y-3">
              <h4 className="text-xs font-black text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
                <User className="w-4 h-4 text-blue-600" /> Thông Tin Cá Nhân
              </h4>
              <div className="space-y-2 text-xs text-slate-600">
                <div className="flex items-center gap-2">
                  <Mail className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                  <span className="truncate">{user?.email}</span>
                </div>
                {user?.phone && (
                  <div className="flex items-center gap-2">
                    <Phone className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                    <span>{user.phone}</span>
                  </div>
                )}
                {cand?.expectedMinSalary && (
                  <div className="flex items-center gap-2">
                    <DollarSign className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                    <span>Kỳ vọng: <strong>{cand.expectedMinSalary} – {cand.expectedMaxSalary} VNĐ</strong></span>
                  </div>
                )}
                <div className="flex items-center gap-2">
                  <Calendar className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                  <span>Ứng tuyển: {new Date(activeApp.appliedAt).toLocaleDateString("vi-VN")}</span>
                </div>
              </div>
            </div>

            {/* Summary */}
            {cand?.professionalSummary && (
              <div className="bg-white rounded-xl border border-slate-200 p-4 space-y-2">
                <h4 className="text-xs font-black text-slate-700 uppercase tracking-wider">📝 Tóm tắt chuyên môn</h4>
                <p className="text-xs text-slate-600 leading-relaxed">{cand.professionalSummary}</p>
              </div>
            )}

            {/* Work Experience */}
            {workExps.length > 0 && (
              <div className="bg-white rounded-xl border border-slate-200 p-4 space-y-3">
                <h4 className="text-xs font-black text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
                  <Briefcase className="w-4 h-4 text-emerald-600" /> Kinh Nghiệm Làm Việc
                </h4>
                <div className="space-y-3">
                  {workExps.map((exp: any, i: number) => (
                    <div key={i} className="border-l-2 border-emerald-300 pl-3 space-y-0.5">
                      <p className="text-xs font-black text-slate-900">{exp.positionTitle}</p>
                      <p className="text-[11px] text-slate-500">{exp.companyName}</p>
                      <p className="text-[10px] text-slate-400">
                        {exp.startDate ? format(new Date(exp.startDate), "MM/yyyy") : "??"} – {exp.isCurrent ? "Hiện tại" : exp.endDate ? format(new Date(exp.endDate), "MM/yyyy") : "??"}
                      </p>
                      {exp.description && <p className="text-[11px] text-slate-600 leading-relaxed line-clamp-2">{exp.description}</p>}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Education */}
            {educations.length > 0 && (
              <div className="bg-white rounded-xl border border-slate-200 p-4 space-y-3">
                <h4 className="text-xs font-black text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
                  <GraduationCap className="w-4 h-4 text-purple-600" /> Học Vấn
                </h4>
                <div className="space-y-2">
                  {educations.map((edu: any, i: number) => (
                    <div key={i} className="border-l-2 border-purple-300 pl-3 space-y-0.5">
                      <p className="text-xs font-black text-slate-900">{edu.schoolName}</p>
                      <p className="text-[11px] font-bold text-purple-700">{edu.degree}</p>
                      {edu.major && <p className="text-[11px] text-slate-500">{edu.major}</p>}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Projects */}
            {projects.length > 0 && (
              <div className="bg-white rounded-xl border border-slate-200 p-4 space-y-3">
                <h4 className="text-xs font-black text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
                  <FolderGit2 className="w-4 h-4 text-amber-600" /> Dự Án Nổi Bật
                </h4>
                <div className="space-y-3">
                  {projects.map((proj: any, i: number) => (
                    <div key={i} className="border-l-2 border-amber-300 pl-3 space-y-1">
                      <p className="text-xs font-black text-slate-900">{proj.projectName || proj.name || `Dự án ${i + 1}`}</p>
                      {proj.role && <p className="text-[11px] font-bold text-amber-700">{proj.role}</p>}
                      {proj.description && <p className="text-[11px] text-slate-600 leading-relaxed line-clamp-2">{proj.description}</p>}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Skills Tags */}
            {cand?.candidateSkills?.length > 0 && (
              <div className="bg-white rounded-xl border border-slate-200 p-4 space-y-3">
                <h4 className="text-xs font-black text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
                  <Code className="w-4 h-4 text-blue-600" /> Kỹ Năng Khai Báo
                </h4>
                <div className="flex flex-wrap gap-1.5">
                  {cand.candidateSkills.map((sk: any, i: number) => {
                    const name = sk.skill?.name || sk.skillName || "Kỹ năng";
                    const reqSkill = ((job as any).requiredSkills || []).find((r: any) => r.skillName?.toLowerCase() === name.toLowerCase() || r.skill?.name?.toLowerCase() === name.toLowerCase());
                    const isMandatory = reqSkill?.isMandatory;
                    return (
                      <span key={i} className={`px-2 py-1 rounded-lg text-[11px] font-bold border ${isMandatory ? "bg-blue-50 text-blue-900 border-blue-300" : "bg-white text-slate-700 border-slate-200"}`}>
                        {name}
                        {isMandatory && <span className="ml-1 text-[9px] px-1 rounded bg-rose-200 text-rose-800 font-black">BẮT BUỘC</span>}
                      </span>
                    );
                  })}
                </div>
              </div>
            )}
          </div>

          {/* RIGHT COLUMN: AI Scoring + 3-Layer Explanation */}
          <div ref={rightPanelRef} className="w-3/5 overflow-y-auto p-5 space-y-5 bg-white">

            {/* Reasoning Summary */}
            {aiResult?.reasoningSummary && (
              <div className="p-4 bg-gradient-to-r from-slate-800 to-slate-700 rounded-xl border border-slate-600">
                <p className="text-xs font-black text-slate-300 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                  <Sparkles className="w-3.5 h-3.5 text-blue-400" /> Tóm Tắt Luận Giải AI
                </p>
                <p className="text-xs text-slate-100 leading-relaxed">💬 {aiResult.reasoningSummary}</p>
              </div>
            )}

            {/* Score overview */}
            {aiResult && (
              <div className="p-4 bg-gradient-to-br from-blue-50 to-indigo-50 border border-blue-200 rounded-xl flex items-center justify-between">
                <div>
                  <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">Tổng Điểm AI Matching</p>
                  <div className="flex items-baseline gap-2 mt-1">
                    <span className={`text-4xl font-black ${getScoreColor(score, job.autoShortlistThreshold || 80, job.autoRejectThreshold || 40)}`}>
                      {score}
                    </span>
                    <span className="text-sm font-bold text-slate-400">/ 100 ĐIỂM</span>
                  </div>
                  <p className="text-[11px] text-slate-500 mt-1 font-mono">
                    {sPts} + {ePts} + {edPts} + {oPts} = {+(sPts + ePts + edPts + oPts).toFixed(1)} đ
                  </p>
                </div>
                <div className="flex flex-col items-end gap-2">
                  <span className={`text-xs font-extrabold px-3 py-1 rounded-full border ${getMatchLevelColor(aiResult.matchLevel)}`}>
                    {aiResult.matchLevel === "HIGH" ? "✓ Phù hợp cao" : aiResult.matchLevel === "MEDIUM" ? "~ Phù hợp trung bình" : "✗ Ít phù hợp"}
                  </span>
                  {aiResult.confidenceScore !== undefined && (
                    <span className="text-[11px] font-bold px-2.5 py-0.5 rounded-full bg-white text-emerald-700 border border-emerald-200 flex items-center gap-1">
                      <ShieldCheck className="w-3.5 h-3.5 text-emerald-500" />
                      Độ phủ dữ liệu: {Math.round(Number(aiResult.confidenceScore) * 100)}%
                    </span>
                  )}
                  {aiResult.levelEligible === false && (
                    <span className="text-[11px] font-bold px-2.5 py-0.5 rounded-full bg-rose-800 text-white flex items-center gap-1">
                      <AlertTriangle className="w-3 h-3" /> Không đạt điều kiện bắt buộc
                    </span>
                  )}
                </div>
              </div>
            )}

            {!aiResult && (
              <div className={`rounded-xl border p-5 ${evaluationPending ? "border-blue-200 bg-blue-50 text-blue-800" : "border-rose-200 bg-rose-50 text-rose-800"}`}>
                <div className="flex items-center gap-3">
                  {evaluationPending
                    ? <div className="h-5 w-5 animate-spin rounded-full border-2 border-blue-600 border-t-transparent" />
                    : <AlertTriangle className="h-5 w-5 shrink-0" />
                  }
                  <div>
                    <p className="text-sm font-extrabold">
                      {evaluationPending ? "AI đang phân tích hồ sơ ứng viên..." : "AI chưa thể hoàn tất đánh giá"}
                    </p>
                    <p className="text-xs">
                      {evaluationPending ? "Kết quả sẽ cập nhật tự động." : "Vui lòng thử lại sau."}
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* 4 Pillar Interactive Tabs */}
            {aiResult && (
              <>
                <div>
                  <p className="text-[11px] font-black text-slate-500 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                    <Sparkles className="w-3 h-3 text-blue-500" /> Nhấn vào trụ cột để xem giải trình chi tiết & gợi ý phỏng vấn
                  </p>
                  <div className="grid grid-cols-4 gap-2">
                    {pillarsData.map((p) => {
                      const Icon = p.icon;
                      const isActive = activePillar === p.id;
                      return (
                        <button
                          key={p.id}
                          type="button"
                          onClick={() => {
                            setActivePillar(p.id);
                            rightPanelRef.current?.scrollTo({ top: rightPanelRef.current.scrollHeight, behavior: "smooth" });
                          }}
                          className={`p-3 rounded-xl border-2 transition-all flex flex-col gap-1.5 text-left ${
                            isActive
                              ? `${p.activeBg} ${p.activeBorder} ring-2 ${p.activeRing} shadow-md`
                              : "bg-white border-slate-200 hover:border-slate-300 hover:bg-slate-50"
                          }`}
                        >
                          <div className="flex items-center justify-between">
                            <span className="text-[10px] text-slate-500 font-bold truncate">{p.shortLabel}</span>
                            <Icon className={`w-3.5 h-3.5 shrink-0 ${isActive ? p.scoreColor : "text-slate-400"}`} />
                          </div>
                          <div className="flex items-baseline gap-1">
                            <span className={`text-xl font-black ${isActive ? p.scoreColor : "text-slate-700"}`}>{p.pts}</span>
                            <span className="text-[10px] text-slate-400 font-semibold">/ {p.max}đ</span>
                          </div>
                          {/* Progress bar */}
                          <div className="w-full bg-slate-100 rounded-full h-1.5">
                            <div
                              className={`h-1.5 rounded-full ${
                                p.score >= 80 ? "bg-emerald-500" : p.score >= 50 ? "bg-amber-500" : "bg-rose-500"
                              }`}
                              style={{ width: `${Math.min(100, Math.round(p.score))}%` }}
                            />
                          </div>
                          <div className="flex justify-between items-center">
                            <span className="text-[10px] text-slate-400">{Math.round(p.score)}%</span>
                            {isActive && <span className="text-[9px] font-black text-blue-600 uppercase">Chi tiết ▼</span>}
                          </div>
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Pillar Detail Card */}
                <div className={`rounded-xl border-2 p-5 transition-all ${
                  activePillar === "skills" ? "border-blue-200 bg-blue-50/30" :
                  activePillar === "experience" ? "border-emerald-200 bg-emerald-50/30" :
                  activePillar === "education" ? "border-purple-200 bg-purple-50/30" :
                  "border-amber-200 bg-amber-50/30"
                }`}>
                  <div className="flex items-center gap-2 mb-4 pb-3 border-b border-slate-200">
                    {(() => {
                      const Icon = activePillarConfig.icon;
                      return <Icon className={`w-5 h-5 ${activePillarConfig.scoreColor}`} />;
                    })()}
                    <h5 className="text-sm font-black text-slate-800">
                      Giải Trình Chuyên Sâu: {activePillarConfig.label}
                    </h5>
                    <span className={`ml-auto text-[11px] font-bold px-2.5 py-1 rounded-lg border ${activePillarConfig.badgeBg}`}>
                      {pillarsData.find(p => p.id === activePillar)?.pts} / {pillarsData.find(p => p.id === activePillar)?.max} đ
                    </span>
                  </div>

                  {activePillar === "skills" && <SkillsPillarDetail aiResult={aiResult} job={job} />}
                  {activePillar === "experience" && <ExperiencePillarDetail aiResult={aiResult} job={job} workExps={workExps} />}
                  {activePillar === "education" && <EducationPillarDetail aiResult={aiResult} job={job} educations={educations} />}
                  {activePillar === "other" && <OtherPillarDetail aiResult={aiResult} job={job} projects={projects} />}
                </div>

                {/* Strengths & Gaps */}
                {(aiResult.strengths?.length > 0 || aiResult.gaps?.length > 0) && (
                  <div className="grid grid-cols-2 gap-4">
                    {aiResult.strengths?.length > 0 && (
                      <div className="p-4 bg-emerald-50/80 border border-emerald-200 rounded-xl space-y-2">
                        <span className="text-xs font-extrabold text-emerald-800 flex items-center gap-1.5">
                          <ThumbsUp className="w-4 h-4 text-emerald-600" /> Điểm mạnh nổi bật
                        </span>
                        <ul className="list-disc list-inside text-xs text-slate-700 space-y-1 font-medium">
                          {aiResult.strengths.map((s: string, i: number) => <li key={i}>{s}</li>)}
                        </ul>
                      </div>
                    )}
                    {aiResult.gaps?.length > 0 && (
                      <div className="p-4 bg-rose-50/80 border border-rose-200 rounded-xl space-y-2">
                        <span className="text-xs font-extrabold text-rose-800 flex items-center gap-1.5">
                          <ThumbsDown className="w-4 h-4 text-rose-600" /> Điểm hạn chế cần chú ý
                        </span>
                        <ul className="list-disc list-inside text-xs text-slate-700 space-y-1 font-medium">
                          {aiResult.gaps.map((g: string, i: number) => <li key={i}>{g}</li>)}
                        </ul>
                      </div>
                    )}
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
