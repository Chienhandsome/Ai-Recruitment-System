'use client';

import React from 'react';
import { Calendar, Clock, Video, MapPin, ExternalLink, User } from 'lucide-react';
import { format } from 'date-fns';
import type { UpcomingInterviewItem } from '@/lib/recruiter-api';

interface UpcomingInterviewsWidgetProps {
  interviews: UpcomingInterviewItem[];
  onViewAll?: () => void;
}

export function UpcomingInterviewsWidget({ interviews, onViewAll }: UpcomingInterviewsWidgetProps) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm space-y-4 font-sans flex flex-col justify-between">
      <div>
        <div className="flex items-center justify-between pb-3 border-b border-slate-100 mb-3">
          <div className="flex items-center gap-2">
            <div className="flex size-8 items-center justify-center rounded-xl bg-[#EFF6FF] text-[#2563EB] border border-blue-200">
              <Calendar className="size-4" />
            </div>
            <div>
              <h3 className="text-sm font-extrabold text-[#1F2937]">Lịch Phỏng Vấn Sắp Tới</h3>
              <p className="text-[11px] text-slate-500">Các buổi phỏng vấn đã được lên lịch</p>
            </div>
          </div>
          {onViewAll ? (
            <button
              type="button"
              onClick={onViewAll}
              className="text-xs font-bold text-[#2563EB] hover:underline"
            >
              Xem tất cả ({interviews.length}) →
            </button>
          ) : (
            <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-blue-50 text-[#2563EB] border border-blue-200">
              {interviews.length} buổi
            </span>
          )}
        </div>

        {interviews.length > 0 ? (
          <div className="space-y-3">
            {interviews.map((item) => (
              <div
                key={item.id}
                className="p-3.5 rounded-xl border border-slate-200 bg-[#F8FAFC] hover:border-blue-300 hover:bg-[#EFF6FF]/30 transition-all space-y-2.5"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-2.5 min-w-0">
                    <div className="size-8 rounded-full bg-[#2563EB] text-white font-bold text-xs flex items-center justify-center shrink-0 overflow-hidden shadow-xs">
                      {item.candidate.avatarUrl ? (
                        <img
                          src={item.candidate.avatarUrl}
                          alt=""
                          className="size-full object-cover"
                        />
                      ) : (
                        item.candidate.fullName.charAt(0) || 'U'
                      )}
                    </div>
                    <div className="min-w-0">
                      <h4 className="font-bold text-xs text-[#1F2937] truncate">
                        {item.candidate.fullName}
                      </h4>
                      <p className="text-[11px] text-[#2563EB] font-semibold truncate">
                        {item.job.title}
                      </p>
                    </div>
                  </div>

                  <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-blue-100 text-[#2563EB] shrink-0 border border-blue-200">
                    {item.title}
                  </span>
                </div>

                <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-slate-200/60 text-xs text-slate-600">
                  <div className="flex items-center gap-1.5 font-medium">
                    <Clock className="size-3.5 text-slate-400 shrink-0" />
                    <span>
                      {format(new Date(item.scheduledAt), 'HH:mm - dd/MM/yyyy')} ({item.durationMinutes}p)
                    </span>
                  </div>

                  {item.locationOrLink && (
                    <div>
                      {item.locationOrLink.startsWith('http') ? (
                        <a
                          href={item.locationOrLink}
                          target="_blank"
                          rel="noreferrer"
                          className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-[#2563EB] hover:bg-[#1D4ED8] text-white text-[11px] font-bold shadow-xs transition-all"
                        >
                          <Video className="size-3" /> Vào phòng họp
                        </a>
                      ) : (
                        <span className="flex items-center gap-1 text-[11px] text-slate-600 truncate max-w-[160px]">
                          <MapPin className="size-3 text-slate-400" /> {item.locationOrLink}
                        </span>
                      )}
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="py-8 text-center bg-[#EFF6FF]/30 rounded-xl border border-dashed border-blue-200 space-y-1">
            <Calendar className="size-7 mx-auto text-blue-400 stroke-1" />
            <p className="text-xs font-bold text-[#1F2937]">Không có lịch phỏng vấn sắp tới</p>
            <p className="text-[11px] text-slate-500">
              Hãy chọn ứng viên trong danh sách bài đăng để lên lịch mới.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
