'use client';

import React from 'react';
import {
  Bot,
  Calendar,
  Clock,
  ExternalLink,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  Sparkles,
  ShieldCheck,
  Video,
} from 'lucide-react';
import { type AiInterviewSession, type AiInterviewStatus } from '@/lib/interview-api';

interface CandidateAiInterviewCardProps {
  session: AiInterviewSession;
  roundIndex?: number;
}

const aiStatusLabels: Record<AiInterviewStatus, { label: string; bg: string; text: string; border: string }> = {
  CREATED: {
    label: 'Chưa làm bài • Sẵn sàng',
    bg: 'bg-blue-50',
    text: 'text-[#2563EB]',
    border: 'border-blue-200',
  },
  IN_PROGRESS: {
    label: 'Đang làm dở',
    bg: 'bg-indigo-50',
    text: 'text-indigo-700',
    border: 'border-indigo-200',
  },
  COMPLETED: {
    label: 'Đã hoàn thành',
    bg: 'bg-emerald-50',
    text: 'text-emerald-700',
    border: 'border-emerald-200',
  },
  EXPIRED: {
    label: 'Đã hết hạn',
    bg: 'bg-slate-100',
    text: 'text-slate-600',
    border: 'border-slate-300',
  },
  TERMINATED: {
    label: 'Đã dừng / Hủy',
    bg: 'bg-rose-50',
    text: 'text-rose-700',
    border: 'border-rose-200',
  },
};

export function CandidateAiInterviewCard({
  session,
  roundIndex = 1,
}: CandidateAiInterviewCardProps) {
  const statusConfig = aiStatusLabels[session.status] || aiStatusLabels.CREATED;
  const expiresAt = new Date(session.expiresAt);
  const isExpired = Date.now() > expiresAt.getTime() || session.status === 'EXPIRED';
  const canStart = !isExpired && (session.status === 'CREATED' || session.status === 'IN_PROGRESS');

  // Calculate remaining time
  const msRemaining = expiresAt.getTime() - Date.now();
  let remainingText = '';
  if (msRemaining > 0 && canStart) {
    const hours = Math.floor(msRemaining / (1000 * 60 * 60));
    const days = Math.floor(hours / 24);
    if (days > 0) {
      remainingText = `(Còn khoảng ${days} ngày ${hours % 24} giờ)`;
    } else {
      remainingText = `(Còn khoảng ${hours} giờ)`;
    }
  }

  return (
    <div className="rounded-2xl border border-blue-100 bg-[#EFF6FF]/40 p-4 sm:p-5 shadow-xs transition-all hover:shadow-sm">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-2.5 pb-3 border-b border-blue-100/80">
        <div className="flex items-center gap-2">
          <span className="inline-flex items-center justify-center w-6 h-6 rounded-lg bg-[#2563EB] text-white font-bold text-xs shadow-2xs">
            {roundIndex}
          </span>
          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-[#EFF6FF] border border-blue-200 text-[#2563EB]">
            <Sparkles className="w-3 h-3 text-[#2563EB]" /> Phỏng vấn tự động với AI
          </span>
        </div>

        <span
          className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold border ${statusConfig.bg} ${statusConfig.text} ${statusConfig.border}`}
        >
          {session.status === 'COMPLETED' ? (
            <CheckCircle2 className="w-3 h-3" />
          ) : session.status === 'EXPIRED' || session.status === 'TERMINATED' ? (
            <XCircle className="w-3 h-3" />
          ) : (
            <Bot className="w-3 h-3 animate-pulse" />
          )}
          {statusConfig.label}
        </span>
      </div>

      {/* Main Info */}
      <div className="mt-3.5 space-y-3">
        <div>
          <h4 className="text-sm sm:text-base font-bold text-[#1F2937] leading-snug">
            {session.round?.title || 'Phỏng vấn sơ tuyển năng lực qua Trợ lý AI'}
          </h4>
          <p className="text-xs text-slate-600 mt-1">
            Buổi phỏng vấn tương tác âm thanh & video trực tuyến trên trình duyệt. Trợ lý AI sẽ lần lượt đặt các câu hỏi chuyên môn và tình huống để ghi nhận câu trả lời của bạn.
          </p>
        </div>

        {/* Schedule & Expiry Time */}
        <div className="flex flex-wrap items-center gap-x-5 gap-y-2 text-xs text-slate-600 bg-white/80 p-2.5 rounded-xl border border-blue-100">
          <div className="flex items-center gap-1.5">
            <Clock className="w-3.5 h-3.5 text-[#2563EB]" />
            <span>Hạn chót hoàn thành:</span>
            <span className="font-semibold text-slate-900">
              {expiresAt.toLocaleString('vi-VN', {
                hour: '2-digit',
                minute: '2-digit',
                day: '2-digit',
                month: '2-digit',
                year: 'numeric',
              })}
            </span>
            {remainingText && (
              <span className="text-[#2563EB] font-medium">{remainingText}</span>
            )}
          </div>
          <div className="flex items-center gap-1.5">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
            <span>Được bảo mật & tự động chấm điểm</span>
          </div>
        </div>

        {/* Status Callout or Launch Action */}
        {canStart ? (
          <div className="mt-3 pt-1 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 bg-white p-3.5 rounded-xl border border-blue-200/80 shadow-2xs">
            <div className="space-y-0.5 text-xs">
              <span className="font-bold text-[#1F2937] block">Sẵn sàng thực hiện bài thi</span>
              <span className="text-slate-500 block">
                Hãy chuẩn bị nơi yên tĩnh, webcam và micro hoạt động tốt trước khi bắt đầu.
              </span>
            </div>
            <a
              href={session.launchUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl bg-[#2563EB] hover:bg-[#1D4ED8] text-white font-bold text-xs shadow-xs transition-all active:scale-[0.98] shrink-0"
            >
              <Video className="w-4 h-4" />
              <span>Vào làm bài phỏng vấn AI</span>
              <ExternalLink className="w-3.5 h-3.5 opacity-80" />
            </a>
          </div>
        ) : session.status === 'COMPLETED' ? (
          <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-xs text-emerald-900 flex items-start gap-2.5">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
            <div className="space-y-0.5">
              <span className="font-bold block">Bạn đã hoàn thành buổi phỏng vấn AI</span>
              <span className="text-emerald-700 block">
                Câu trả lời và video của bạn đã được lưu lại an toàn. Nhà tuyển dụng sẽ xem xét kết quả và thông báo bước tiếp theo tới bạn.
              </span>
              {session.round?.resultScore !== undefined && session.round?.resultScore !== null && (
                <div className="mt-1 font-bold text-emerald-800">
                  Điểm đánh giá sơ bộ: {Number(session.round.resultScore)}/100 điểm
                </div>
              )}
            </div>
          </div>
        ) : session.status === 'TERMINATED' ? (
          <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-xs text-rose-900 flex items-start gap-2.5">
            <XCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
            <div>
              <span className="font-bold block">Phiên phỏng vấn AI đã bị kết thúc</span>
              <span className="text-rose-700 block">
                {session.terminationReason || 'Phiên phỏng vấn đã được đóng theo quyết định của quy trình tuyển dụng.'}
              </span>
            </div>
          </div>
        ) : (
          <div className="p-3 rounded-xl bg-slate-100 border border-slate-200 text-xs text-slate-700 flex items-start gap-2.5">
            <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
            <div>
              <span className="font-bold block">Link phỏng vấn đã hết hạn</span>
              <span className="text-slate-600 block">
                Hạn chót làm bài thi phỏng vấn đã qua. Nếu bạn gặp sự cố kỹ thuật hoặc lý do bất khả kháng, vui lòng liên hệ nhà tuyển dụng để xin gia hạn hoặc cấp link mới.
              </span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
