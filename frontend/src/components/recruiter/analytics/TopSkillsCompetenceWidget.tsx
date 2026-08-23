'use client';

import React from 'react';
import { Award, Code2, CheckCircle2 } from 'lucide-react';
import type { TopSkillStat } from '@/lib/recruiter-api';

interface TopSkillsCompetenceWidgetProps {
  topSkills: TopSkillStat[];
}

export function TopSkillsCompetenceWidget({ topSkills }: TopSkillsCompetenceWidgetProps) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm space-y-4 font-sans">
      <div className="flex items-center justify-between pb-3 border-b border-slate-100">
        <div className="flex items-center gap-2">
          <div className="flex size-8 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600 border border-emerald-200">
            <Code2 className="size-4" />
          </div>
          <div>
            <h3 className="text-sm font-extrabold text-[#1F2937]">Kỹ Năng Trọng Yếu &amp; Độ Khớp</h3>
            <p className="text-[11px] text-slate-500">Mức độ đáp ứng kỹ năng của ứng viên</p>
          </div>
        </div>
      </div>

      {topSkills.length > 0 ? (
        <div className="space-y-3">
          {topSkills.map((sk) => (
            <div key={sk.skill} className="space-y-1.5">
              <div className="flex items-center justify-between text-xs">
                <span className="font-bold text-[#1F2937] flex items-center gap-1.5">
                  <span className="size-1.5 rounded-full bg-[#2563EB]" />
                  {sk.skill}
                </span>
                <div className="text-right">
                  <span className="font-extrabold text-[#2563EB]">{sk.matchRate}%</span>
                  <span className="text-[10px] text-slate-400 font-medium ml-1">đáp ứng</span>
                </div>
              </div>

              <div className="h-2 w-full rounded-full bg-slate-100 overflow-hidden">
                <div
                  className="h-full rounded-full bg-gradient-to-r from-[#2563EB] to-emerald-500 transition-all duration-500"
                  style={{ width: `${Math.max(sk.matchRate, 4)}%` }}
                />
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="py-6 text-center text-slate-400 text-xs">
          Chưa có đủ dữ liệu kỹ năng yêu cầu.
        </div>
      )}
    </div>
  );
}
