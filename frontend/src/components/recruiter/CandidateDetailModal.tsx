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
  processingStatus?: "PENDING" | "MATCHING" | "COMPLETED" | "FAILED";
  confidenceScore?: number;
  evidence?: { skillName: string; evidenceText: string; source: string }[];
  strengths?: string[];
  gaps?: string[];
  
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
    if (score >= 80) return "text-emerald-600 bg-emerald-50 border-emerald-200 font-bold";
    if (score >= 60) return "text-amber-600 bg-amber-50 border-amber-200 font-bold";
    return "text-rose-600 bg-rose-50 border-rose-200 font-bold";
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm transition-all overflow-hidden">
      <div className="bg-white w-full max-w-5xl rounded-2xl shadow-2xl flex flex-col max-h-[92vh] border border-slate-200">
        
        {/* Modal Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 bg-[#EFF6FF]/60">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-full bg-[#2563EB] flex items-center justify-center text-white font-bold text-lg shadow-md">
              {candidate.name.charAt(0)}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-xl font-extrabold text-[#1F2937]">{candidate.name}</h2>
                <span className={`text-xs font-bold px-2.5 py-0.5 rounded-full border ${getScoreColor(candidate.aiScore)}`}>
                  {candidate.aiScore} / 100 Điểm AI
                </span>
                {candidate.confidenceScore !== undefined && (
                  <span className={`text-xs font-bold px-2.5 py-0.5 rounded-full border ${candidate.confidenceScore >= 0.8 ? 'text-emerald-700 bg-emerald-100 border-emerald-300' : candidate.confidenceScore >= 0.5 ? 'text-amber-700 bg-amber-100 border-amber-300' : 'text-rose-700 bg-rose-100 border-rose-300'}`} title="Độ tin cậy của AI dựa trên lượng dữ liệu hồ sơ">
                    Độ tin cậy: {Math.round(candidate.confidenceScore * 100)}%
                  </span>
                )}
              </div>
              <p className="text-xs text-slate-500 mt-0.5 flex items-center gap-3">
                <span>📧 {candidate.email}</span>
                {candidate.phone && <span>📞 {candidate.phone}</span>}
                {candidate.city && <span>📍 {candidate.city}</span>}
              </p>
            </div>
          </div>
          
          <button onClick={onClose} className="p-2 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-100 transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6 relative">
          
          {/* Loading Overlay if MATCHING */}
          {candidate.processingStatus === "MATCHING" && (
            <div className="absolute inset-0 z-10 flex flex-col items-center justify-center bg-white/80 backdrop-blur-sm rounded-b-2xl">
              <div className="w-10 h-10 border-4 border-[#2563EB] border-t-transparent rounded-full animate-spin"></div>
              <p className="mt-4 text-[#1F2937] font-bold">AI đang phân tích hồ sơ...</p>
            </div>
          )}
          
          {/* Missing Requirements Warning Banner */}
          {candidate.missingRequirements && candidate.missingRequirements.length > 0 && (
            <div className="p-4 bg-rose-50 border border-rose-200 rounded-xl flex gap-3">
              <AlertTriangle className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />
              <div>
                <h4 className="text-sm font-bold text-rose-900">Cảnh báo Tiêu chí Bắt buộc Thiếu (Missing Requirements)</h4>
                <ul className="list-disc list-inside text-xs text-rose-700 mt-1 space-y-0.5 font-medium">
                  {candidate.missingRequirements.map((req, idx) => (
                    <li key={idx}>{req}</li>
                  ))}
                </ul>
              </div>
            </div>
          )}

          {/* 1. Candidate Profile & Proof of Work Links */}
          <div className="grid grid-cols-3 gap-4 p-4 bg-[#EFF6FF]/40 border border-blue-100 rounded-xl">
            <div>
              <span className="text-xs text-slate-500 block">Lương mong muốn</span>
              <span className="text-sm font-bold text-[#1F2937]">{candidate.expectedSalary || "Thỏa thuận"}</span>
            </div>
            <div>
              <span className="text-xs text-slate-500 block">Mô hình ưa thích</span>
              <span className="text-sm font-bold text-[#1F2937]">{candidate.preferredModel || "Không chỉ định"}</span>
            </div>
            <div>
              <span className="text-xs text-slate-500 block">Bằng chứng năng lực (Links)</span>
              {candidate.proofOfWorkLinks && candidate.proofOfWorkLinks.length > 0 ? (
                <div className="flex flex-wrap gap-1 mt-1">
                  {candidate.proofOfWorkLinks.map((link, idx) => (
                    <a key={idx} href={link.url} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 text-xs text-[#2563EB] font-bold hover:underline">
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
            <h3 className="text-sm font-bold text-[#1F2937] flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-[#2563EB]" /> Tóm tắt Hồ sơ bởi AI (AI Resume Summary)
            </h3>
            <p className="text-sm text-slate-700 leading-relaxed bg-[#EFF6FF] p-4 rounded-xl border border-blue-200">
              {candidate.resumeSummary}
            </p>
          </div>

          {/* 3. AI Score Breakdown */}
          <div className="space-y-2">
            <h3 className="text-sm font-bold text-[#1F2937]">Phân rã Điểm số (Score Breakdown)</h3>
            <div className="grid grid-cols-4 gap-4">
              <div className="p-3 bg-[#EFF6FF] border border-blue-200 rounded-xl text-center">
                <span className="text-xs text-slate-500 block">Kỹ năng (Skill)</span>
                <span className="text-lg font-extrabold text-[#2563EB]">{candidate.scoreBreakdown.skillScore}%</span>
              </div>
              <div className="p-3 bg-[#EFF6FF] border border-blue-200 rounded-xl text-center">
                <span className="text-xs text-slate-500 block">Kinh nghiệm (Exp)</span>
                <span className="text-lg font-extrabold text-[#2563EB]">{candidate.scoreBreakdown.experienceScore}%</span>
              </div>
              <div className="p-3 bg-[#EFF6FF] border border-blue-200 rounded-xl text-center">
                <span className="text-xs text-slate-500 block">Học vấn (Education)</span>
                <span className="text-lg font-extrabold text-[#2563EB]">{candidate.scoreBreakdown.educationScore}%</span>
              </div>
              <div className="p-3 bg-[#EFF6FF] border border-blue-200 rounded-xl text-center">
                <span className="text-xs text-slate-500 block">Dự án (Project)</span>
                <span className="text-lg font-extrabold text-[#2563EB]">{candidate.scoreBreakdown.projectScore}%</span>
              </div>
            </div>
          </div>

          {/* 4. Skill Matching & Experience Analysis */}
          <div className="grid grid-cols-2 gap-6">
            {/* Skill Matching */}
            <div className="space-y-2">
              <h3 className="text-sm font-bold text-[#1F2937] flex items-center gap-2">
                <Code className="w-4 h-4 text-[#2563EB]" /> Đối chiếu Kỹ năng (Skill Matching)
              </h3>
              <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl space-y-3">
                <div>
                  <span className="text-xs font-bold text-emerald-700 block mb-1">Kỹ năng khớp (Matched):</span>
                  <div className="flex flex-wrap gap-1">
                    {candidate.matchedSkills?.map((sk, idx) => {
                      const ev = candidate.evidence?.find(e => e.skillName === sk.name);
                      return (
                        <div key={idx} className="group relative inline-block">
                          <span className="px-2 py-0.5 text-xs rounded font-bold bg-emerald-100 text-emerald-800 border border-emerald-200 cursor-help inline-block">
                            ✓ {sk.name}
                          </span>
                          {ev && (
                            <div className="absolute z-50 left-0 bottom-full mb-1 hidden group-hover:block w-64 p-2 bg-slate-800 text-white text-xs rounded shadow-lg pointer-events-none">
                              <p className="font-bold text-blue-300 mb-1">Bằng chứng từ: {ev.source}</p>
                              <p className="italic">"...{ev.evidenceText}..."</p>
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
                {candidate.missingSkills && candidate.missingSkills.length > 0 && (
                  <div>
                    <span className="text-xs font-bold text-rose-600 block mb-1">Kỹ năng thiếu (Missing):</span>
                    <div className="flex flex-wrap gap-1">
                      {candidate.missingSkills?.map((sk, idx) => (
                        <span key={idx} className={`px-2 py-0.5 text-xs rounded font-bold border ${sk.isMandatory ? 'bg-rose-100 text-rose-800 border-rose-200' : 'bg-amber-100 text-amber-800 border-amber-200'}`}>
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
                <h3 className="text-sm font-bold text-[#1F2937] flex items-center gap-2">
                  <Briefcase className="w-4 h-4 text-[#2563EB]" /> Kinh nghiệm (Experience)
                </h3>
                <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-700">
                  <p className="font-bold text-[#2563EB]">{candidate.experienceAnalysis?.totalYears ?? (candidate.scoreBreakdown?.experienceScore ? "Đã tính" : 0)} năm kinh nghiệm thực tế</p>
                  <p className="mt-1">{candidate.experienceAnalysis?.summary || "Không có tóm tắt kinh nghiệm."}</p>
                </div>
              </div>

              <div className="space-y-2">
                <h3 className="text-sm font-bold text-[#1F2937] flex items-center gap-2">
                  <GraduationCap className="w-4 h-4 text-[#2563EB]" /> Học vấn & Chứng chỉ
                </h3>
                <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-700 space-y-1">
                  <p>🎓 <strong>Bằng cấp:</strong> {candidate.educationAnalysis?.degreeLevel || "Đại học"} - {candidate.educationAnalysis?.schoolName || "Đã xác minh"}</p>
                  <p>📜 <strong>Chứng chỉ:</strong> {candidate.certificateAnalysis?.matchedCertificates?.join(", ") || "Chưa ghi nhận"}</p>
                </div>
              </div>
            </div>
          </div>

          {/* 5. AI Explanation (Strengths, Gaps, Reasoning) */}
          <div className="space-y-2">
            <h3 className="text-sm font-bold text-[#1F2937]">Giải thích Chi tiết của AI (AI Explanation)</h3>
            <div className="grid grid-cols-2 gap-4">
              <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-xl">
                <span className="text-xs font-bold text-emerald-800 flex items-center gap-1 mb-2">
                  <ThumbsUp className="w-4 h-4" /> Điểm mạnh nổi bật (Strengths)
                </span>
                <ul className="list-disc list-inside text-xs text-slate-700 space-y-1">
                  {(candidate.aiExplanation?.strengths || candidate.strengths || []).map((str, idx) => (
                    <li key={idx}>{str}</li>
                  ))}
                </ul>
              </div>

              <div className="p-4 bg-rose-50 border border-rose-200 rounded-xl">
                <span className="text-xs font-bold text-rose-800 flex items-center gap-1 mb-2">
                  <ThumbsDown className="w-4 h-4" /> Điểm hạn chế (Gaps & Weaknesses)
                </span>
                <ul className="list-disc list-inside text-xs text-slate-700 space-y-1">
                  {(candidate.aiExplanation?.gaps || candidate.gaps || []).map((gap, idx) => (
                    <li key={idx}>{gap}</li>
                  ))}
                </ul>
              </div>
            </div>
            <p className="text-xs text-slate-600 italic p-3 bg-[#EFF6FF] rounded-xl border border-blue-200">
              💬 <strong>Lý do chấm điểm:</strong> {candidate.aiExplanation?.reasoningSummary || candidate.resumeSummary || "Không có thông tin lý giải chi tiết."}
            </p>
          </div>

        </div>

        {/* Modal Footer (Recruiter Actions) */}
        <div className="px-6 py-4 border-t border-slate-200 bg-[#EFF6FF]/60 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-xs text-slate-500 font-bold">Trạng thái hiện tại:</span>
            <span className={`text-xs font-bold px-2.5 py-0.5 rounded-full ${
              candidate.status === 'SHORTLISTED' ? 'bg-emerald-100 text-emerald-800' :
              candidate.status === 'REJECTED' ? 'bg-rose-100 text-rose-800' :
              candidate.status === 'INTERVIEW_SCHEDULED' ? 'bg-blue-100 text-[#2563EB]' :
              'bg-slate-100 text-slate-700'
            }`}>
              {candidate.status}
            </span>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={() => handleAction("REJECTED")}
              disabled={updating}
              className="px-4 py-2 text-xs font-bold text-rose-600 hover:bg-rose-50 rounded-xl transition-colors border border-rose-200 disabled:opacity-50"
            >
              Loại hồ sơ (Reject)
            </button>
            <button
              onClick={() => handleAction("SHORTLISTED")}
              disabled={updating}
              className="px-4 py-2 text-xs font-bold text-emerald-700 bg-emerald-100 hover:bg-emerald-200 rounded-xl transition-colors border border-emerald-300 disabled:opacity-50"
            >
              Duyệt Phỏng vấn (Shortlist)
            </button>
            <button
              onClick={() => handleAction("HIRED")}
              disabled={updating}
              className="px-5 py-2 text-xs font-bold text-white bg-[#2563EB] hover:bg-[#1D4ED8] rounded-xl transition-colors shadow-md disabled:opacity-50"
            >
              Tuyển dụng (Hire)
            </button>
          </div>
        </div>

      </div>
    </div>
  );
}
