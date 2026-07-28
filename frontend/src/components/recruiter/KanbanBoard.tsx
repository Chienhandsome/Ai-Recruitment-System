"use client";

import React, { useState } from "react";
import { Search, Filter, MoreHorizontal, Calendar, BrainCircuit, GripVertical } from "lucide-react";

export type ApplicationStage = 
  | "RECEIVED"
  | "SCREENING"
  | "SHORTLISTED"
  | "INTERVIEW_SCHEDULED"
  | "INTERVIEWED"
  | "OFFERED"
  | "HIRED"
  | "REJECTED";

export interface KanbanCandidate {
  id: string;
  name: string;
  avatar: string;
  matchScore: number;
  stage: ApplicationStage;
  appliedDate: string;
  hrDecision?: "PENDING" | "ACCEPTED" | "REJECTED" | "CONSIDER";
}

interface KanbanBoardProps {
  candidates: KanbanCandidate[];
  onCandidateClick: (candidate: KanbanCandidate) => void;
  onMoveCandidate: (candidateId: string, newStage: ApplicationStage) => void;
}

const COLUMNS: { id: ApplicationStage; title: string; color: string }[] = [
  { id: "RECEIVED", title: "Mới nhận", color: "bg-gray-100 text-gray-700" },
  { id: "SCREENING", title: "Sàng lọc", color: "bg-blue-50 text-blue-700" },
  { id: "SHORTLISTED", title: "Đạt yêu cầu", color: "bg-indigo-50 text-indigo-700" },
  { id: "INTERVIEW_SCHEDULED", title: "Lịch phỏng vấn", color: "bg-purple-50 text-purple-700" },
  { id: "OFFERED", title: "Đề nghị", color: "bg-green-50 text-green-700" },
];

export function KanbanBoard({ candidates, onCandidateClick, onMoveCandidate }: KanbanBoardProps) {
  const [searchTerm, setSearchTerm] = useState("");
  const [draggedId, setDraggedId] = useState<string | null>(null);

  const filteredCandidates = candidates.filter(c => 
    c.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleDragStart = (e: React.DragEvent, id: string) => {
    setDraggedId(id);
    e.dataTransfer.effectAllowed = "move";
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = "move";
  };

  const handleDrop = (e: React.DragEvent, stage: ApplicationStage) => {
    e.preventDefault();
    if (draggedId) {
      onMoveCandidate(draggedId, stage);
      setDraggedId(null);
    }
  };

  const getScoreBadgeColor = (score: number) => {
    if (score >= 90) return "bg-emerald-100 text-emerald-700 border-emerald-200";
    if (score >= 70) return "bg-amber-100 text-amber-700 border-amber-200";
    return "bg-rose-100 text-rose-700 border-rose-200";
  };

  return (
    <div className="flex flex-col h-full w-full bg-white rounded-2xl shadow-sm border border-[#E2E8F0] overflow-hidden">
      {/* Board Toolbar */}
      <div className="px-6 py-4 border-b border-[#E2E8F0] flex items-center justify-between bg-[#F8FAFC]">
        <div className="flex items-center gap-3 w-1/3">
          <div className="relative w-full">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#64748B]" />
            <input
              type="text"
              placeholder="Tìm ứng viên..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-4 py-2 bg-white border border-[#E2E8F0] rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#2563EB]/20 transition-all"
            />
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button className="flex items-center gap-2 px-3 py-2 bg-white border border-[#E2E8F0] rounded-xl text-sm font-medium text-[#0F172A] hover:bg-gray-50 transition-colors">
            <Filter className="w-4 h-4" />
            Lọc AI Match
          </button>
        </div>
      </div>

      {/* Kanban Columns */}
      <div className="flex-1 overflow-x-auto p-6 bg-[#F8FAFC]">
        <div className="flex gap-6 min-w-max h-full items-start">
          {COLUMNS.map((col) => {
            const colCandidates = filteredCandidates.filter(c => c.stage === col.id);
            return (
              <div 
                key={col.id}
                className="w-[320px] flex flex-col max-h-full"
                onDragOver={handleDragOver}
                onDrop={(e) => handleDrop(e, col.id)}
              >
                {/* Column Header */}
                <div className="flex items-center justify-between mb-4 px-1">
                  <div className="flex items-center gap-2">
                    <span className={`px-2.5 py-1 rounded-md text-xs font-bold ${col.color}`}>
                      {col.title}
                    </span>
                    <span className="text-xs font-semibold text-[#64748B] bg-white border border-[#E2E8F0] px-2 py-0.5 rounded-full shadow-sm">
                      {colCandidates.length}
                    </span>
                  </div>
                  <button className="text-[#64748B] hover:text-[#0F172A] transition-colors">
                    <MoreHorizontal className="w-4 h-4" />
                  </button>
                </div>

                {/* Cards Container */}
                <div className={`flex-1 flex flex-col gap-3 min-h-[150px] p-2 -mx-2 rounded-xl transition-colors ${draggedId ? 'bg-gray-50 border border-dashed border-gray-300' : ''}`}>
                  {colCandidates.map((candidate) => (
                    <div
                      key={candidate.id}
                      draggable
                      onDragStart={(e) => handleDragStart(e, candidate.id)}
                      onClick={() => onCandidateClick(candidate)}
                      className="group bg-white p-4 rounded-xl border border-[#E2E8F0] shadow-sm hover:shadow-md hover:border-[#2563EB]/40 transition-all cursor-pointer flex flex-col gap-3"
                    >
                      {/* Card Header */}
                      <div className="flex items-start justify-between">
                        <div className="flex items-center gap-3">
                          <GripVertical className="w-4 h-4 text-transparent group-hover:text-gray-400 -ml-1 cursor-grab" />
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img 
                            src={candidate.avatar} 
                            alt={candidate.name} 
                            className="w-10 h-10 rounded-full object-cover ring-2 ring-gray-50"
                          />
                          <div>
                            <h4 className="font-semibold text-sm text-[#0F172A] leading-tight">{candidate.name}</h4>
                            <div className="flex items-center gap-1.5 mt-1 text-[11px] font-medium text-[#64748B]">
                              <Calendar className="w-3 h-3" />
                              {candidate.appliedDate}
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Card Body */}
                      <div className="flex items-center justify-between mt-1">
                        <div className={`flex items-center gap-1.5 px-2 py-1 rounded-md border font-mono text-xs font-bold ${getScoreBadgeColor(candidate.matchScore)}`}>
                          <BrainCircuit className="w-3.5 h-3.5" />
                          {candidate.matchScore}% Match
                        </div>
                        {candidate.hrDecision && (
                          <span className="text-[10px] uppercase font-bold tracking-wider text-[#64748B]">
                            {candidate.hrDecision}
                          </span>
                        )}
                      </div>
                    </div>
                  ))}
                  
                  {colCandidates.length === 0 && (
                    <div className="flex items-center justify-center h-24 border-2 border-dashed border-[#E2E8F0] rounded-xl text-xs text-[#94A3B8] font-medium">
                      Kéo thả ứng viên vào đây
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
