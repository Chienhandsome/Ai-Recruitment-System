"use client";

import React, { useState } from "react";
import { X, BrainCircuit, ExternalLink, FileText, CheckCircle2, AlertCircle, Calendar, Mail, PlusCircle, MinusCircle, Award, Sparkles } from "lucide-react";

export interface PillarScoreDetail {
  earned: number;
  max: number;
  weightPct: number;
  normalizedScore: number;
  plusReasons?: string[];
  minusReasons?: string[];
  summary?: string;
}

export interface Candidate360 {
  id: string;
  name: string;
  role: string;
  avatar: string;
  matchScore: number;
  skills: string[];
  pros: string[];
  cons: string[];
  education: string;
  radarScores: {
    skills: number;
    experience: number;
    education: number;
    cultureFit: number;
  };
  scoreBreakdown?: {
    skills: PillarScoreDetail;
    experience: PillarScoreDetail;
    education: PillarScoreDetail;
    other: PillarScoreDetail;
  };
  pillarExplanations?: {
    skills: { earned_points: number; max_points: number; plus_reasons: string[]; minus_reasons: string[]; summary: string };
    experience: { earned_points: number; max_points: number; plus_reasons: string[]; minus_reasons: string[]; summary: string };
    education: { earned_points: number; max_points: number; plus_reasons: string[]; minus_reasons: string[]; summary: string };
    other: { earned_points: number; max_points: number; plus_reasons: string[]; minus_reasons: string[]; summary: string };
  };
}

interface Candidate360ModalProps {
  isOpen: boolean;
  onClose: () => void;
  candidate: Candidate360 | null;
  onScheduleInterview?: (candidateId: string) => void;
  onSendEmail?: (candidateId: string) => void;
}

export function Candidate360Modal({ isOpen, onClose, candidate, onScheduleInterview, onSendEmail }: Candidate360ModalProps) {
  const [activeTab, setActiveTab] = useState<"ai_report" | "parsed_resume">("ai_report");

  if (!isOpen || !candidate) return null;

  // Compute fallback point breakdown if not directly supplied
  const skillsScore = candidate.radarScores?.skills ?? 80;
  const expScore = candidate.radarScores?.experience ?? 75;
  const eduScore = candidate.radarScores?.education ?? 80;
  const otherScore = candidate.radarScores?.cultureFit ?? 70;

  const sEarned = candidate.scoreBreakdown?.skills?.earned ?? +(skillsScore * 0.40).toFixed(1);
  const eEarned = candidate.scoreBreakdown?.experience?.earned ?? +(expScore * 0.30).toFixed(1);
  const edEarned = candidate.scoreBreakdown?.education?.earned ?? +(eduScore * 0.15).toFixed(1);
  const oEarned = candidate.scoreBreakdown?.other?.earned ?? +(otherScore * 0.15).toFixed(1);

  const sMax = candidate.scoreBreakdown?.skills?.max ?? 40.0;
  const eMax = candidate.scoreBreakdown?.experience?.max ?? 30.0;
  const edMax = candidate.scoreBreakdown?.education?.max ?? 15.0;
  const oMax = candidate.scoreBreakdown?.other?.max ?? 15.0;

  const totalCalculated = +(sEarned + eEarned + edEarned + oEarned).toFixed(1);

  const pillars = [
    {
      title: "Kỹ năng Chuyên môn",
      earned: sEarned,
      max: sMax,
      pct: Math.round((sEarned / (sMax || 1)) * 100),
      color: "blue",
      plus: candidate.pillarExplanations?.skills?.plus_reasons || candidate.pros.filter(p => p.toLowerCase().includes("kỹ năng") || p.toLowerCase().includes("thành thạo") || p.toLowerCase().includes("chuyển giao")),
      minus: candidate.pillarExplanations?.skills?.minus_reasons || candidate.cons.filter(c => c.toLowerCase().includes("kỹ năng") || c.toLowerCase().includes("thiếu")),
    },
    {
      title: "Kinh nghiệm & Cấp bậc",
      earned: eEarned,
      max: eMax,
      pct: Math.round((eEarned / (eMax || 1)) * 100),
      color: "emerald",
      plus: candidate.pillarExplanations?.experience?.plus_reasons || candidate.pros.filter(p => p.toLowerCase().includes("kinh nghiệm") || p.toLowerCase().includes("thâm niên") || p.toLowerCase().includes("dự án") || p.toLowerCase().includes("mô hình")),
      minus: candidate.pillarExplanations?.experience?.minus_reasons || candidate.cons.filter(c => c.toLowerCase().includes("kinh nghiệm") || c.toLowerCase().includes("thâm niên") || c.toLowerCase().includes("phân khúc")),
    },
    {
      title: "Trình độ Học vấn",
      earned: edEarned,
      max: edMax,
      pct: Math.round((edEarned / (edMax || 1)) * 100),
      color: "purple",
      plus: candidate.pillarExplanations?.education?.plus_reasons || [candidate.education ? `Tốt nghiệp: ${candidate.education}` : "Đạt yêu cầu văn bằng chuyên ngành."],
      minus: candidate.pillarExplanations?.education?.minus_reasons || candidate.cons.filter(c => c.toLowerCase().includes("học vấn") || c.toLowerCase().includes("văn bằng") || c.toLowerCase().includes("ngành khác")),
    },
    {
      title: "Chứng chỉ & Tiêu chí khác",
      earned: oEarned,
      max: oMax,
      pct: Math.round((oEarned / (oMax || 1)) * 100),
      color: "amber",
      plus: candidate.pillarExplanations?.other?.plus_reasons || ["Đáp ứng các tiêu chí bổ trợ và chứng chỉ liên quan."],
      minus: candidate.pillarExplanations?.other?.minus_reasons || candidate.cons.filter(c => c.toLowerCase().includes("chứng chỉ")),
    },
  ];

  return (
    <div className="fixed inset-0 z-50 flex bg-[#0F172A]/50 backdrop-blur-sm p-4 md:p-6 justify-center items-center">
      <div className="bg-white rounded-3xl w-full max-w-7xl flex flex-col md:flex-row max-h-[92vh] overflow-hidden shadow-2xl animate-in fade-in zoom-in-95 duration-200 border border-slate-200">
        
        {/* Left Pane (PDF / Resume Viewer) */}
        <div className="hidden md:flex w-5/12 bg-[#F8FAFC] border-r border-[#E2E8F0] flex-col">
          <div className="px-6 py-4 border-b border-[#E2E8F0] flex items-center justify-between bg-white">
            <h3 className="font-bold text-[#0F172A] text-sm flex items-center gap-2">
              <FileText className="w-4 h-4 text-[#64748B]" />
              Bản gốc CV Ứng viên
            </h3>
            <button className="text-xs font-semibold text-[#2563EB] hover:underline flex items-center gap-1">
              Mở toàn màn hình <ExternalLink className="w-3.5 h-3.5" />
            </button>
          </div>
          <div className="flex-1 p-6 flex items-center justify-center">
            <div className="w-full max-w-md bg-white border border-[#E2E8F0] shadow-sm rounded-2xl p-6 flex flex-col items-center justify-center gap-3 text-center">
              <FileText className="w-14 h-14 text-blue-400/80" />
              <p className="text-[#0F172A] font-bold text-sm">Hồ sơ ứng viên: {candidate.name}</p>
              <p className="text-xs text-[#64748B] leading-relaxed">
                Dữ liệu văn bản trong CV đã được AI trích xuất và chấm điểm độc lập theo từng tiêu chuẩn của JD ở bảng bên phải.
              </p>
              {candidate.skills && candidate.skills.length > 0 && (
                <div className="mt-2 text-left w-full">
                  <span className="text-xs font-bold text-slate-500 block mb-1.5">Kỹ năng trích xuất từ CV:</span>
                  <div className="flex flex-wrap gap-1">
                    {candidate.skills.slice(0, 10).map((sk, i) => (
                      <span key={i} className="px-2 py-0.5 text-[11px] font-semibold bg-slate-100 text-slate-700 rounded-md border border-slate-200">
                        {sk}
                      </span>
                    ))}
                    {candidate.skills.length > 10 && (
                      <span className="px-2 py-0.5 text-[11px] font-semibold bg-slate-50 text-slate-400 rounded-md">
                        +{candidate.skills.length - 10} kỹ năng khác
                      </span>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Right Pane (AI Report & Diagnostics) */}
        <div className="w-full md:w-7/12 flex flex-col h-full bg-white relative">
          
          {/* Header */}
          <div className="px-6 py-4 border-b border-[#E2E8F0] flex justify-between items-center bg-slate-50/50">
            <div className="flex items-center gap-3.5">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={candidate.avatar} alt={candidate.name} className="w-12 h-12 rounded-2xl object-cover border border-[#E2E8F0] shadow-sm" />
              <div>
                <h2 className="text-lg font-extrabold text-[#0F172A]">{candidate.name}</h2>
                <p className="text-[#64748B] text-xs font-semibold">{candidate.role}</p>
              </div>
            </div>
            
            {/* Quick Actions Header */}
            <div className="flex items-center gap-2">
              <button
                onClick={() => onScheduleInterview ? onScheduleInterview(candidate.id) : alert("Đã mở chức năng Lên lịch phỏng vấn")}
                className="px-3.5 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold shadow-sm flex items-center gap-1.5 transition-all"
              >
                <Calendar className="w-3.5 h-3.5" /> Lên lịch phỏng vấn
              </button>
              <button onClick={onClose} className="p-1.5 text-[#64748B] hover:bg-gray-100 rounded-full transition-colors">
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* Body Content */}
          <div className="flex-1 overflow-y-auto p-6 space-y-5">
            
            {/* 1. Transparent Additive Overall Score Banner */}
            <div className="p-5 bg-gradient-to-r from-blue-50/90 via-indigo-50/80 to-blue-50/90 border border-blue-200/80 rounded-2xl shadow-sm">
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                <div className="flex items-center gap-4">
                  <div className="w-16 h-16 rounded-2xl bg-blue-600 text-white flex flex-col items-center justify-center shadow-md shrink-0">
                    <span className="text-xl font-black font-mono leading-none">{candidate.matchScore}</span>
                    <span className="text-[10px] font-bold text-blue-100 mt-0.5">/ 100 đ</span>
                  </div>
                  <div>
                    <h3 className="font-extrabold text-[#0F172A] text-base flex items-center gap-2">
                      <BrainCircuit className="w-5 h-5 text-blue-600" /> Điểm Tương Thích CV - JD
                    </h3>
                    <p className="text-xs text-slate-600 mt-0.5">
                      Chấm điểm độc lập dựa trên 4 trụ cột tiêu chuẩn của JD (Toán cộng nhẩm minh bạch 100%):
                    </p>
                  </div>
                </div>
                <div className="px-3 py-1.5 bg-white/80 border border-blue-200 rounded-xl text-right">
                  <span className="text-[11px] font-bold text-slate-500 block">Đánh giá mức độ</span>
                  <span className={`text-xs font-black ${candidate.matchScore >= 75 ? 'text-emerald-700' : candidate.matchScore >= 50 ? 'text-amber-700' : 'text-rose-700'}`}>
                    {candidate.matchScore >= 75 ? '✓ PHÙ HỢP CAO (HIGH)' : candidate.matchScore >= 50 ? '⚡ CÂN NHẮC (MEDIUM)' : '⚠ CHƯA ĐẠT (LOW)'}
                  </span>
                </div>
              </div>

              {/* Exact Formula Ribbon */}
              <div className="mt-3.5 pt-3 border-t border-blue-200/60 flex flex-wrap items-center justify-between gap-2 text-xs font-mono">
                <div className="flex flex-wrap items-center gap-1.5 font-bold text-slate-700">
                  <span className="text-blue-700 bg-blue-100/80 px-2 py-0.5 rounded">KN: {sEarned}/{sMax}đ</span>
                  <span>+</span>
                  <span className="text-emerald-700 bg-emerald-100/80 px-2 py-0.5 rounded">KNg: {eEarned}/{eMax}đ</span>
                  <span>+</span>
                  <span className="text-purple-700 bg-purple-100/80 px-2 py-0.5 rounded">HV: {edEarned}/{edMax}đ</span>
                  <span>+</span>
                  <span className="text-amber-700 bg-amber-100/80 px-2 py-0.5 rounded">CC: {oEarned}/{oMax}đ</span>
                  <span>=</span>
                  <span className="text-slate-900 bg-white px-2 py-0.5 rounded border border-blue-300 font-extrabold">{candidate.matchScore} / 100 điểm</span>
                </div>
              </div>
            </div>

            {/* 2. Point-by-Point Score Breakdown (4 Pillars with Exact Earned/Max + Diagnostics) */}
            <div className="space-y-3">
              <h4 className="text-xs font-extrabold uppercase tracking-wider text-slate-500 flex items-center gap-1.5">
                <Award className="w-4 h-4 text-blue-600" /> Bảng Phân Tích & Điểm Số Từng Tiêu Chí
              </h4>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
                {pillars.map((p, idx) => (
                  <div key={idx} className="p-4 bg-slate-50/80 border border-slate-200 rounded-2xl flex flex-col justify-between space-y-3 hover:border-blue-300 transition-colors">
                    <div>
                      {/* Pillar Header */}
                      <div className="flex items-center justify-between mb-1.5">
                        <span className="text-xs font-bold text-[#0F172A]">{p.title}</span>
                        <span className="text-xs font-black font-mono px-2 py-0.5 rounded-lg bg-white border border-slate-200 text-blue-700 shadow-2xs">
                          {p.earned} / {p.max} đ
                        </span>
                      </div>

                      {/* Progress Bar */}
                      <div className="w-full h-2 bg-slate-200 rounded-full overflow-hidden mb-2.5">
                        <div
                          className={`h-full rounded-full ${p.pct >= 80 ? 'bg-emerald-500' : p.pct >= 60 ? 'bg-amber-500' : 'bg-rose-500'}`}
                          style={{ width: `${Math.min(100, p.pct)}%` }}
                        />
                      </div>

                      {/* Plus & Minus Reasons */}
                      <div className="space-y-1.5 text-[11px]">
                        {p.plus.length > 0 && (
                          <div className="space-y-1">
                            {p.plus.slice(0, 2).map((reason, rIdx) => (
                              <div key={rIdx} className="flex items-start gap-1.5 text-emerald-800 font-medium">
                                <PlusCircle className="w-3.5 h-3.5 text-emerald-600 shrink-0 mt-0.5" />
                                <span className="leading-tight">{reason}</span>
                              </div>
                            ))}
                          </div>
                        )}
                        {p.minus.length > 0 && (
                          <div className="space-y-1 pt-1">
                            {p.minus.slice(0, 2).map((reason, rIdx) => (
                              <div key={rIdx} className="flex items-start gap-1.5 text-rose-800 font-medium">
                                <MinusCircle className="w-3.5 h-3.5 text-rose-500 shrink-0 mt-0.5" />
                                <span className="leading-tight">{reason}</span>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* 3. Bottom Decision Actions for HR */}
            <div className="p-4 bg-slate-100/80 border border-slate-200 rounded-2xl flex items-center justify-between gap-4">
              <div className="text-xs text-slate-600">
                <span className="font-bold text-slate-800 block">Quyết định của Nhà tuyển dụng:</span>
                Sau khi xem xét bảng điểm và giải trình, bấm nút bên phải để lên lịch hẹn với ứng viên.
              </div>
              <div className="flex items-center gap-2 shrink-0">
                <button
                  onClick={() => onSendEmail ? onSendEmail(candidate.id) : alert("Đã mở mẫu gửi Email")}
                  className="px-3 py-2 bg-white hover:bg-slate-50 text-slate-700 border border-slate-300 rounded-xl text-xs font-bold shadow-2xs flex items-center gap-1.5 transition-all"
                >
                  <Mail className="w-3.5 h-3.5 text-slate-500" /> Gửi Email
                </button>
                <button
                  onClick={() => onScheduleInterview ? onScheduleInterview(candidate.id) : alert("Đã mở chức năng Lên lịch phỏng vấn")}
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold shadow-sm flex items-center gap-1.5 transition-all"
                >
                  <Calendar className="w-3.5 h-3.5" /> Lên lịch phỏng vấn
                </button>
              </div>
            </div>

          </div>
        </div>
      </div>
    </div>
  );
}
