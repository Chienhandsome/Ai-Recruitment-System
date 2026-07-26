"use client";

import React, { useState } from "react";
import { X, BrainCircuit, ExternalLink, MapPin, Briefcase, FileText, CheckCircle2, AlertCircle, TrendingUp } from "lucide-react";

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
}

interface Candidate360ModalProps {
  isOpen: boolean;
  onClose: () => void;
  candidate: Candidate360 | null;
}

export function Candidate360Modal({ isOpen, onClose, candidate }: Candidate360ModalProps) {
  const [activeTab, setActiveTab] = useState<"ai_report" | "parsed_resume" | "interviews">("ai_report");

  if (!isOpen || !candidate) return null;

  const getScoreColor = (score: number) => {
    if (score >= 90) return "text-emerald-600";
    if (score >= 70) return "text-amber-600";
    return "text-rose-600";
  };

  return (
    <div className="fixed inset-0 z-50 flex bg-[#0F172A]/40 backdrop-blur-sm p-4 md:p-6 justify-center">
      <div className="bg-white rounded-3xl w-full max-w-7xl flex flex-col md:flex-row overflow-hidden shadow-2xl animate-in fade-in zoom-in-95 duration-200">
        
        {/* Left Pane (PDF / Resume Viewer) - 50% width */}
        <div className="hidden md:flex w-1/2 bg-[#F8FAFC] border-r border-[#E2E8F0] flex-col">
          <div className="px-6 py-4 border-b border-[#E2E8F0] flex items-center justify-between bg-white">
            <h3 className="font-semibold text-[#0F172A] flex items-center gap-2">
              <FileText className="w-5 h-5 text-[#64748B]" />
              Bản gốc CV (PDF)
            </h3>
            <button className="text-sm font-medium text-[#2563EB] hover:underline flex items-center gap-1">
              Mở toàn màn hình <ExternalLink className="w-4 h-4" />
            </button>
          </div>
          <div className="flex-1 p-6 flex items-center justify-center">
            {/* Fake PDF Viewer */}
            <div className="w-full max-w-md bg-white border border-[#E2E8F0] shadow-sm rounded-lg h-[80%] flex flex-col items-center justify-center gap-3">
              <FileText className="w-16 h-16 text-[#CBD5E1]" />
              <p className="text-[#64748B] font-medium">Bản xem trước PDF sẽ hiển thị ở đây</p>
              <p className="text-xs text-[#94A3B8]">Dữ liệu đã được trích xuất sang báo cáo AI bên phải</p>
            </div>
          </div>
        </div>

        {/* Right Pane (AI Report & Profile) - 50% width */}
        <div className="w-full md:w-1/2 flex flex-col h-full bg-white relative">
          
          {/* Header */}
          <div className="px-6 py-5 border-b border-[#E2E8F0] flex justify-between items-start">
            <div className="flex gap-4">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={candidate.avatar} alt={candidate.name} className="w-14 h-14 rounded-2xl object-cover border border-[#E2E8F0] shadow-sm" />
              <div>
                <h2 className="text-xl font-bold text-[#0F172A]">{candidate.name}</h2>
                <p className="text-[#64748B] text-sm font-medium">{candidate.role}</p>
                <div className="flex items-center gap-3 mt-2 text-xs text-[#64748B] font-medium">
                  <span className="flex items-center gap-1"><MapPin className="w-3.5 h-3.5" /> Hồ Chí Minh</span>
                  <span className="flex items-center gap-1"><Briefcase className="w-3.5 h-3.5" /> 3 năm kinh nghiệm</span>
                </div>
              </div>
            </div>
            <button onClick={onClose} className="p-2 text-[#64748B] hover:bg-gray-100 rounded-full transition-colors">
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* HR Decision Action Bar */}
          <div className="px-6 py-3 bg-[#F8FAFC] border-b border-[#E2E8F0] flex items-center justify-between">
            <span className="text-sm font-semibold text-[#0F172A]">Quyết định Nhân sự:</span>
            <div className="flex items-center gap-2">
              <button className="px-4 py-1.5 text-xs font-bold text-rose-700 bg-rose-50 border border-rose-200 rounded-lg hover:bg-rose-100 transition-colors">Từ chối</button>
              <button className="px-4 py-1.5 text-xs font-bold text-amber-700 bg-amber-50 border border-amber-200 rounded-lg hover:bg-amber-100 transition-colors">Cân nhắc</button>
              <button className="px-4 py-1.5 text-xs font-bold text-white bg-[#2563EB] shadow-sm rounded-lg hover:bg-[#1D4ED8] transition-colors">Tiến hành phỏng vấn</button>
            </div>
          </div>

          {/* Tabs */}
          <div className="flex border-b border-[#E2E8F0] px-6 mt-2">
            {[
              { id: "ai_report", label: "Báo cáo AI Match" },
              { id: "parsed_resume", label: "Hồ sơ trích xuất" },
              { id: "interviews", label: "Lịch phỏng vấn" }
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as "ai_report" | "parsed_resume" | "interviews")}
                className={`pb-3 pt-2 px-4 text-sm font-semibold transition-colors border-b-2 ${
                  activeTab === tab.id
                    ? "border-[#2563EB] text-[#2563EB]"
                    : "border-transparent text-[#64748B] hover:text-[#0F172A]"
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          {/* Tab Content */}
          <div className="flex-1 overflow-y-auto p-6">
            {activeTab === "ai_report" && (
              <div className="space-y-6">
                
                {/* Overall Score */}
                <div className="flex items-center gap-6 p-5 bg-blue-50/50 border border-blue-100 rounded-2xl">
                  <div className="relative w-20 h-20 flex items-center justify-center">
                    <svg className="w-full h-full -rotate-90" viewBox="0 0 36 36">
                      <path className="text-blue-100" d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" fill="none" stroke="currentColor" strokeWidth="3" />
                      <path className="text-[#2563EB]" strokeDasharray={`${candidate.matchScore}, 100`} d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" fill="none" stroke="currentColor" strokeWidth="3" />
                    </svg>
                    <div className="absolute flex flex-col items-center">
                      <span className="text-xl font-black font-mono text-[#0F172A]">{candidate.matchScore}%</span>
                    </div>
                  </div>
                  <div>
                    <h3 className="font-bold text-[#0F172A] text-lg flex items-center gap-2">
                      <BrainCircuit className="w-5 h-5 text-[#2563EB]" /> AI Match Score
                    </h3>
                    <p className="text-sm text-[#64748B] mt-1 leading-relaxed">
                      Ứng viên có độ phù hợp rất cao. Kỹ năng chuyên môn khớp 95% với yêu cầu công việc. Tuy nhiên thiếu kinh nghiệm về quản lý nhóm (Team Lead).
                    </p>
                  </div>
                </div>

                {/* Sub Scores (Radar Metrics Fake) */}
                <div>
                  <h4 className="text-sm font-bold text-[#0F172A] mb-4">Chi tiết Đánh giá</h4>
                  <div className="space-y-3">
                    {Object.entries(candidate.radarScores).map(([key, score]) => (
                      <div key={key} className="flex items-center gap-4">
                        <span className="w-24 text-xs font-semibold text-[#64748B] capitalize">{key}</span>
                        <div className="flex-1 h-2.5 bg-[#E2E8F0] rounded-full overflow-hidden">
                          <div className={`h-full rounded-full ${score >= 80 ? 'bg-[#10B981]' : score >= 60 ? 'bg-[#F59E0B]' : 'bg-[#EF4444]'}`} style={{ width: `${score}%` }}></div>
                        </div>
                        <span className={`w-8 text-right text-xs font-bold font-mono ${getScoreColor(score)}`}>{score}%</span>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  {/* Pros */}
                  <div className="bg-emerald-50/50 border border-emerald-100 rounded-xl p-4">
                    <h4 className="text-sm font-bold text-emerald-800 flex items-center gap-2 mb-3">
                      <CheckCircle2 className="w-4 h-4" /> Điểm mạnh
                    </h4>
                    <ul className="space-y-2">
                      {candidate.pros.map((pro, i) => (
                        <li key={i} className="text-xs text-emerald-700 font-medium flex items-start gap-2">
                          <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 mt-1 shrink-0" /> {pro}
                        </li>
                      ))}
                    </ul>
                  </div>
                  {/* Cons */}
                  <div className="bg-amber-50/50 border border-amber-100 rounded-xl p-4">
                    <h4 className="text-sm font-bold text-amber-800 flex items-center gap-2 mb-3">
                      <AlertCircle className="w-4 h-4" /> Cần lưu ý
                    </h4>
                    <ul className="space-y-2">
                      {candidate.cons.map((con, i) => (
                        <li key={i} className="text-xs text-amber-700 font-medium flex items-start gap-2">
                          <span className="w-1.5 h-1.5 rounded-full bg-amber-400 mt-1 shrink-0" /> {con}
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              </div>
            )}
            
            {activeTab !== "ai_report" && (
              <div className="flex flex-col items-center justify-center h-48 text-[#64748B]">
                <TrendingUp className="w-10 h-10 mb-3 text-[#CBD5E1]" />
                <p className="text-sm font-medium">Chức năng đang được phát triển</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
