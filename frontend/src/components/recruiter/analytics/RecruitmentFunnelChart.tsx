'use client';

import React from 'react';
import { Filter, Users, ArrowDown, Award, Sparkles, CheckCircle2, UserCheck, XCircle } from 'lucide-react';
import type { FunnelStageData } from '@/lib/recruiter-api';

interface RecruitmentFunnelChartProps {
  funnel: FunnelStageData[];
}

export function RecruitmentFunnelChart({ funnel }: RecruitmentFunnelChartProps) {
  // Exclude REJECTED for main linear funnel, display REJECTED separately as drop-off summary
  const mainFunnel = funnel.filter((f) => f.stage !== 'REJECTED');
  const rejectedStage = funnel.find((f) => f.stage === 'REJECTED');

  const stageIcons: Record<string, React.ReactNode> = {
    RECEIVED: <Users className="size-4 text-[#2563EB]" />,
    SCREENING: <Filter className="size-4 text-blue-600" />,
    SHORTLISTED: <Sparkles className="size-4 text-indigo-600" />,
    INTERVIEW_SCHEDULED: <Award className="size-4 text-purple-600" />,
    OFFERED: <CheckCircle2 className="size-4 text-emerald-600" />,
    HIRED: <UserCheck className="size-4 text-emerald-700" />,
  };

  const stageGradient: Record<string, string> = {
    RECEIVED: 'from-[#2563EB] to-blue-600',
    SCREENING: 'from-blue-600 to-indigo-600',
    SHORTLISTED: 'from-indigo-600 to-purple-600',
    INTERVIEW_SCHEDULED: 'from-purple-600 to-pink-600',
    OFFERED: 'from-emerald-500 to-teal-600',
    HIRED: 'from-emerald-600 to-emerald-800',
  };

  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm space-y-6 font-sans">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-4 border-b border-slate-100">
        <div>
          <h3 className="text-base font-extrabold text-[#1F2937] flex items-center gap-2">
            <Filter className="size-5 text-[#2563EB]" />
            Phễu Chuyển Đổi Tuyển Dụng (Recruitment Funnel)
          </h3>
          <p className="text-xs text-slate-500 mt-0.5">
            Tỷ lệ chuyển đổi ứng viên qua các giai đoạn từ Nộp hồ sơ đến Tuyển dụng thành công
          </p>
        </div>
        {rejectedStage && (
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs font-bold self-start sm:self-auto">
            <XCircle className="size-4" />
            <span>Chưa phù hợp: <strong>{rejectedStage.count}</strong> hồ sơ</span>
          </div>
        )}
      </div>

      <div className="space-y-4">
        {mainFunnel.map((item, idx) => {
          const prevCount = idx > 0 ? mainFunnel[idx - 1].count : item.count;
          const stepConversion = prevCount > 0 ? Math.round((item.count / prevCount) * 100) : 0;

          return (
            <div key={item.stage} className="space-y-1.5 group">
              <div className="flex items-center justify-between text-xs">
                <div className="flex items-center gap-2 min-w-[140px]">
                  <div className="flex size-7 items-center justify-center rounded-lg bg-[#EFF6FF] border border-blue-100">
                    {stageIcons[item.stage] || <Users className="size-3.5" />}
                  </div>
                  <span className="font-extrabold text-[#1F2937]">{item.label}</span>
                </div>

                <div className="flex items-center gap-4">
                  {idx > 0 && (
                    <span className="hidden sm:inline-flex items-center gap-1 text-[11px] font-semibold text-slate-500">
                      <ArrowDown className="size-3 text-slate-400" /> {stepConversion}% so với bước trước
                    </span>
                  )}
                  <div className="text-right">
                    <span className="font-extrabold text-sm text-[#1F2937]">{item.count}</span>
                    <span className="text-[11px] font-semibold text-slate-400 ml-1.5">
                      ({item.percentage}%)
                    </span>
                  </div>
                </div>
              </div>

              {/* Progress Bar with Gradient */}
              <div className="h-3 w-full rounded-full bg-slate-100 overflow-hidden p-0.5 border border-slate-200/60">
                <div
                  className={`h-full rounded-full bg-gradient-to-r ${
                    stageGradient[item.stage] || 'from-[#2563EB] to-[#3B82F6]'
                  } transition-all duration-500`}
                  style={{ width: `${Math.max(item.percentage, item.count > 0 ? 4 : 0)}%` }}
                />
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
