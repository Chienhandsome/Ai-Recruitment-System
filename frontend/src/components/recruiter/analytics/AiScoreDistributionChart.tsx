'use client';

import React from 'react';
import { BarChart3, Sparkles } from 'lucide-react';
import type { ScoreDistributionData } from '@/lib/recruiter-api';

interface AiScoreDistributionChartProps {
  distribution: ScoreDistributionData[];
  avgScore: number;
}

export function AiScoreDistributionChart({
  distribution,
  avgScore,
}: AiScoreDistributionChartProps) {
  const maxCount = Math.max(...distribution.map((d) => d.count), 1);

  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm space-y-5 font-sans">
      <div className="flex items-center justify-between pb-3 border-b border-slate-100">
        <div className="flex items-center gap-2">
          <div className="flex size-8 items-center justify-center rounded-xl bg-purple-50 text-purple-600 border border-purple-200">
            <BarChart3 className="size-4" />
          </div>
          <div>
            <h3 className="text-sm font-extrabold text-[#1F2937]">Phân Bố Điểm Khớp AI</h3>
            <p className="text-[11px] text-slate-500">Chất lượng ứng viên theo thang điểm 100</p>
          </div>
        </div>

        <div className="text-right bg-[#EFF6FF] px-3 py-1.5 rounded-xl border border-blue-200">
          <span className="text-[10px] font-bold text-slate-500 block uppercase">Điểm TB</span>
          <span className="text-base font-black text-[#2563EB]">{avgScore}/100</span>
        </div>
      </div>

      <div className="space-y-3">
        {distribution.map((item) => {
          const barHeightPercent = Math.round((item.count / maxCount) * 100);

          return (
            <div key={item.range} className="space-y-1">
              <div className="flex items-center justify-between text-xs">
                <div className="flex items-center gap-2">
                  <span
                    className="size-2.5 rounded-full"
                    style={{ backgroundColor: item.color }}
                  />
                  <span className="font-bold text-slate-700">
                    {item.range} điểm ({item.label})
                  </span>
                </div>
                <div className="font-extrabold text-[#1F2937]">
                  {item.count} <span className="text-[11px] font-medium text-slate-400">({item.percentage}%)</span>
                </div>
              </div>

              <div className="h-2.5 w-full rounded-full bg-slate-100 overflow-hidden">
                <div
                  className="h-full rounded-full transition-all duration-500"
                  style={{
                    width: `${Math.max(item.percentage, item.count > 0 ? 5 : 0)}%`,
                    backgroundColor: item.color,
                  }}
                />
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
