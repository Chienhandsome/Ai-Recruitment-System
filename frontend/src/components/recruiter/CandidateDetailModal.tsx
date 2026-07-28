"use client";

import React, { useState } from "react";
import { 
  X, CheckCircle2, AlertTriangle, ExternalLink, Award, Briefcase, 
  GraduationCap, Code, FileText, User, Sparkles, ThumbsUp, ThumbsDown, 
  ChevronRight, Calendar, DollarSign, MapPin
} from "lucide-react";

export interface CandidateEvaluationData {
  id: string;
  candidateId: string;
  name: string;
  email: string;
  phone?: string;
  avatar?: string;
  city?: string;
  expectedSalary?: string;
  preferredModel?: string;
  appliedDate: string;
  status: "APPLIED" | "SHORTLISTED" | "INTERVIEW_SCHEDULED" | "REJECTED" | "HIRED";
  
  // 12 AI Evaluation Pillars
  aiScore: number;
  scoreBreakdown: {
    skillScore: number;
    experienceScore: number;
    educationScore: number;
    projectScore: number;
  };
  resumeSummary: string;
  matchedSkills: { name: string; category?: string }[];
  missingSkills: { name: string; isMandatory?: boolean }[];
  missingRequiredSkills: string[];
  experienceAnalysis: {
    totalYears: number;
    relevanceLevel: "HIGH" | "MEDIUM" | "LOW";
    summary: string;
  };
  educationAnalysis: {
    degreeLevel: string;
    major?: string;
    schoolName?: string;
    isMatched: boolean;
  };
  certificateAnalysis: {
    matchedCertificates: string[];
    missingCertificates: string[];
  };
  projectAnalysis: {
    matchedProjectsCount: number;
    highlights: string[];
  };
  aiExplanation: {
    strengths: string[];
    gaps: string[];
    weaknesses: string[];
    reasoningSummary: string;
  };
  missingRequirements: string[];
  proofOfWorkLinks: { type: string; title: string; url: string }[];
}

interface CandidateDetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  candidate: CandidateEvaluationData | null;
  onStatusChange?: (newStatus: CandidateEvaluationData["status"]) => void;
}

export function CandidateDetailModal({
  isOpen,
  onClose,
  candidate,
  onStatusChange,
}: CandidateDetailModalProps) {
  const [updating, setUpdating] = useState(false);

  if (!isOpen || !candidate) return null;

  const handleAction = async (status: CandidateEvaluationData["status"]) => {
    setUpdating(true);
    try {
      if (onStatusChange) {
        await onStatusChange(status);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setUpdating(false);
    }
  };

  const getScoreColor = (score: number) => {
    if (score >= 80) return "text-emerald-600 bg-emerald-50 dark:bg-emerald-500/10 border-emerald-200 dark:border-emerald-500/20";
    if (score >= 60) return "text-amber-600 bg-amber-50 dark:bg-amber-500/10 border-amber-200 dark:border-amber-500/20";
    return "text-rose-600 bg-rose-50 dark:bg-rose-500/10 border-rose-200 dark:border-rose-500/20";
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm transition-all overflow-hidden">
      <div className="bg-white dark:bg-[#121620] w-full max-w-5xl rounded-2xl shadow-2xl flex flex-col max-h-[92vh] border border-slate-200 dark:border-slate-800">
        
        {/* Modal Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 dark:border-slate-800/60 bg-slate-50/50 dark:bg-slate-800/20">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-full bg-indigo-100 dark:bg-indigo-500/20 flex items-center justify-center text-indigo-700 dark:text-indigo-400 font-bold text-lg border border-indigo-200 dark:border-indigo-500/30">
              {candidate.name.charAt(0)}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-xl font-bold text-slate-900 dark:text-white">{candidate.name}</h2>
                <span className={`text-xs font-semibold px-2.5 py-0.5 rounded-full border ${getScoreColor(candidate.aiScore)}`}>
                  {candidate.aiScore} / 100 Điểm AI
                </span>
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5 flex items-center gap-3">
                <span>📧 {candidate.email}</span>
                {candidate.phone && <span>📞 {candidate.phone}</span>}
                {candidate.city && <span>📍 {candidate.city}</span>}
              </p>
            </div>
          </div>
          
          <button onClick={onClose} className="p-2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          
          {/* Missing Requirements Warning Banner */}
          {candidate.missingRequirements && candidate.missingRequirements.length > 0 && (
            <div className="p-4 bg-rose-50 dark:bg-rose-500/10 border border-rose-200 dark:border-rose-500/20 rounded-xl flex gap-3">
              <AlertTriangle className="w-5 h-5 text-rose-600 dark:text-rose-400 shrink-0 mt-0.5" />
              <div>
                <h4 className="text-sm font-bold text-rose-900 dark:text-rose-300">Cảnh báo Tiêu chí Bắt buộc Thiếu (Missing Requirements)</h4>
                <ul className="list-disc list-inside text-xs text-rose-700 dark:text-rose-400 mt-1 space-y-0.5">
                  {candidate.missingRequirements.map((req, idx) => (
                    <li key={idx}>{req}</li>
                  ))}
                </ul>
              </div>
            </div>
          )}

          {/* 1. Candidate Profile & Proof of Work Links */}
          <div className="grid grid-cols-3 gap-4 p-4 bg-slate-50 dark:bg-[#0B0E14] border border-slate-200 dark:border-slate-800 rounded-xl">
            <div>
              <span className="text-xs text-slate-500 block">Lương mong muốn</span>
              <span className="text-sm font-semibold text-slate-900 dark:text-white">{candidate.expectedSalary || "Thỏa thuận"}</span>
            </div>
            <div>
              <span className="text-xs text-slate-500 block">Mô hình ưa thích</span>
              <span className="text-sm font-semibold text-slate-900 dark:text-white">{candidate.preferredModel || "Không chỉ định"}</span>
            </div>
            <div>
              <span className="text-xs text-slate-500 block">Bằng chứng năng lực (Links)</span>
              {candidate.proofOfWorkLinks && candidate.proofOfWorkLinks.length > 0 ? (
                <div className="flex flex-wrap gap-1 mt-1">
                  {candidate.proofOfWorkLinks.map((link, idx) => (
                    <a key={idx} href={link.url} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 text-xs text-indigo-600 dark:text-indigo-400 hover:underline">
                      <ExternalLink className="w-3 h-3" /> {link.title || link.type}
                    </a>
                  ))}
                </div>
              ) : (
                <span className="text-xs text-slate-400 italic">Chưa nộp link sản phẩm</span>
              )}
            </div>
          </div>

          {/* 2. Resume Executive Summary */}
          <div className="space-y-2">
            <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-indigo-600" /> Tóm tắt Hồ sơ bởi AI (AI Resume Summary)
            </h3>
            <p className="text-sm text-slate-600 dark:text-slate-300 leading-relaxed bg-indigo-50/50 dark:bg-indigo-500/5 p-4 rounded-xl border border-indigo-100 dark:border-indigo-500/10">
              {candidate.resumeSummary}
            </p>
          </div>

          {/* 3. AI Score Breakdown */}
          <div className="space-y-2">
            <h3 className="text-sm font-bold text-slate-900 dark:text-white">Phân rã Điểm số (Score Breakdown)</h3>
            <div className="grid grid-cols-4 gap-4">
              <div className="p-3 bg-slate-50 dark:bg-[#0B0E14] border border-slate-200 dark:border-slate-800 rounded-xl text-center">
                <span className="text-xs text-slate-500 block">Kỹ năng (Skill)</span>
                <span className="text-lg font-extrabold text-indigo-600 dark:text-indigo-400">{candidate.scoreBreakdown.skillScore}%</span>
              </div>
              <div className="p-3 bg-slate-50 dark:bg-[#0B0E14] border border-slate-200 dark:border-slate-800 rounded-xl text-center">
                <span className="text-xs text-slate-500 block">Kinh nghiệm (Exp)</span>
                <span className="text-lg font-extrabold text-indigo-600 dark:text-indigo-400">{candidate.scoreBreakdown.experienceScore}%</span>
              </div>
              <div className="p-3 bg-slate-50 dark:bg-[#0B0E14] border border-slate-200 dark:border-slate-800 rounded-xl text-center">
                <span className="text-xs text-slate-500 block">Học vấn (Education)</span>
                <span className="text-lg font-extrabold text-indigo-600 dark:text-indigo-400">{candidate.scoreBreakdown.educationScore}%</span>
              </div>
              <div className="p-3 bg-slate-50 dark:bg-[#0B0E14] border border-slate-200 dark:border-slate-800 rounded-xl text-center">
                <span className="text-xs text-slate-500 block">Dự án (Project)</span>
                <span className="text-lg font-extrabold text-indigo-600 dark:text-indigo-400">{candidate.scoreBreakdown.projectScore}%</span>
              </div>
            </div>
          </div>

          {/* 4. Skill Matching & Experience Analysis */}
          <div className="grid grid-cols-2 gap-6">
            {/* Skill Matching */}
            <div className="space-y-2">
              <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <Code className="w-4 h-4 text-slate-500" /> Đối chiếu Kỹ năng (Skill Matching)
              </h3>
              <div className="p-4 bg-slate-50 dark:bg-[#0B0E14] border border-slate-200 dark:border-slate-800 rounded-xl space-y-3">
                <div>
                  <span className="text-xs font-semibold text-emerald-600 block mb-1">Kỹ năng khớp (Matched):</span>
                  <div className="flex flex-wrap gap-1">
                    {candidate.matchedSkills.map((sk, idx) => (
                      <span key={idx} className="px-2 py-0.5 text-xs rounded bg-emerald-100 text-emerald-800 dark:bg-emerald-500/20 dark:text-emerald-300">
                        ✓ {sk.name}
                      </span>
                    ))}
                  </div>
                </div>
                {candidate.missingSkills.length > 0 && (
                  <div>
                    <span className="text-xs font-semibold text-rose-500 block mb-1">Kỹ năng thiếu (Missing):</span>
                    <div className="flex flex-wrap gap-1">
                      {candidate.missingSkills.map((sk, idx) => (
                        <span key={idx} className={`px-2 py-0.5 text-xs rounded ${sk.isMandatory ? 'bg-rose-100 text-rose-800 font-bold border border-rose-300' : 'bg-slate-200 text-slate-700 dark:bg-slate-700 dark:text-slate-300'}`}>
                          ✕ {sk.name} {sk.isMandatory && '(Bắt buộc)'}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Experience & Education */}
            <div className="space-y-4">
              <div className="space-y-2">
                <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
                  <Briefcase className="w-4 h-4 text-slate-500" /> Kinh nghiệm (Experience)
                </h3>
                <div className="p-3 bg-slate-50 dark:bg-[#0B0E14] border border-slate-200 dark:border-slate-800 rounded-xl text-xs text-slate-700 dark:text-slate-300">
                  <p className="font-semibold text-indigo-600">{candidate.experienceAnalysis.totalYears} năm kinh nghiệm thực tế</p>
                  <p className="mt-1">{candidate.experienceAnalysis.summary}</p>
                </div>
              </div>

              <div className="space-y-2">
                <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
                  <GraduationCap className="w-4 h-4 text-slate-500" /> Học vấn & Chứng chỉ
                </h3>
                <div className="p-3 bg-slate-50 dark:bg-[#0B0E14] border border-slate-200 dark:border-slate-800 rounded-xl text-xs text-slate-700 dark:text-slate-300 space-y-1">
                  <p>🎓 <strong>Bằng cấp:</strong> {candidate.educationAnalysis.degreeLevel} - {candidate.educationAnalysis.schoolName || "Đã xác minh"}</p>
                  <p>📜 <strong>Chứng chỉ:</strong> {candidate.certificateAnalysis.matchedCertificates.join(", ") || "Chưa ghi nhận"}</p>
                </div>
              </div>
            </div>
          </div>

          {/* 5. AI Explanation (Strengths, Gaps, Reasoning) */}
          <div className="space-y-2">
            <h3 className="text-sm font-bold text-slate-900 dark:text-white">Giải thích Chi tiết của AI (AI Explanation)</h3>
            <div className="grid grid-cols-2 gap-4">
              <div className="p-4 bg-emerald-50/50 dark:bg-emerald-500/5 border border-emerald-100 dark:border-emerald-500/10 rounded-xl">
                <span className="text-xs font-bold text-emerald-700 dark:text-emerald-400 flex items-center gap-1 mb-2">
                  <ThumbsUp className="w-4 h-4" /> Điểm mạnh nổi bật (Strengths)
                </span>
                <ul className="list-disc list-inside text-xs text-slate-700 dark:text-slate-300 space-y-1">
                  {candidate.aiExplanation.strengths.map((str, idx) => (
                    <li key={idx}>{str}</li>
                  ))}
                </ul>
              </div>

              <div className="p-4 bg-rose-50/50 dark:bg-rose-500/5 border border-rose-100 dark:border-rose-500/10 rounded-xl">
                <span className="text-xs font-bold text-rose-700 dark:text-rose-400 flex items-center gap-1 mb-2">
                  <ThumbsDown className="w-4 h-4" /> Điểm hạn chế (Gaps & Weaknesses)
                </span>
                <ul className="list-disc list-inside text-xs text-slate-700 dark:text-slate-300 space-y-1">
                  {candidate.aiExplanation.gaps.map((gap, idx) => (
                    <li key={idx}>{gap}</li>
                  ))}
                </ul>
              </div>
            </div>
            <p className="text-xs text-slate-500 italic p-3 bg-slate-50 dark:bg-[#0B0E14] rounded-lg">
              💬 <strong>Lý do chấm điểm:</strong> {candidate.aiExplanation.reasoningSummary}
            </p>
          </div>

        </div>

        {/* Modal Footer (Recruiter Actions) */}
        <div className="px-6 py-4 border-t border-slate-200 dark:border-slate-800/60 bg-slate-50 dark:bg-slate-800/20 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-xs text-slate-500">Trạng thái hiện tại:</span>
            <span className={`text-xs font-bold px-2.5 py-0.5 rounded-full ${
              candidate.status === 'SHORTLISTED' ? 'bg-emerald-100 text-emerald-800' :
              candidate.status === 'REJECTED' ? 'bg-rose-100 text-rose-800' :
              candidate.status === 'INTERVIEW_SCHEDULED' ? 'bg-indigo-100 text-indigo-800' :
              'bg-slate-100 text-slate-700'
            }`}>
              {candidate.status}
            </span>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={() => handleAction("REJECTED")}
              disabled={updating}
              className="px-4 py-2 text-xs font-semibold text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-500/10 rounded-lg transition-colors border border-rose-200 dark:border-rose-500/20 disabled:opacity-50"
            >
              Loại hồ sơ (Reject)
            </button>
            <button
              onClick={() => handleAction("SHORTLISTED")}
              disabled={updating}
              className="px-4 py-2 text-xs font-semibold text-emerald-700 bg-emerald-100 hover:bg-emerald-200 rounded-lg transition-colors border border-emerald-300 disabled:opacity-50"
            >
              Duyệt Phỏng vấn (Shortlist)
            </button>
            <button
              onClick={() => handleAction("HIRED")}
              disabled={updating}
              className="px-5 py-2 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg transition-colors shadow-sm disabled:opacity-50"
            >
              Tuyển dụng (Hire)
            </button>
          </div>
        </div>

      </div>
    </div>
  );
}
