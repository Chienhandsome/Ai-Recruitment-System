'use client';

import React, { useState } from 'react';
import {
  X,
  Award,
  FileText,
  Loader2,
  CheckCircle2,
  AlertCircle,
  XCircle,
  Sparkles,
  ArrowRight,
} from 'lucide-react';
import { toast } from 'sonner';
import {
  type InterviewData,
  submitInterviewFeedback,
} from '@/lib/interview-api';

interface InterviewFeedbackModalProps {
  isOpen: boolean;
  onClose: () => void;
  token: string;
  interview: InterviewData;
  candidateName: string;
  onSuccess: () => void | Promise<void>;
}

export function InterviewFeedbackModal({
  isOpen,
  onClose,
  token,
  interview,
  candidateName,
  onSuccess,
}: InterviewFeedbackModalProps) {
  const [score, setScore] = useState<number>(
    interview.score !== undefined && interview.score !== null
      ? Number(interview.score)
      : 80,
  );
  const [interviewerNotes, setInterviewerNotes] = useState(
    interview.interviewerNotes || '',
  );
  const [nextStage, setNextStage] = useState<string>('OFFERED');
  const [submitting, setSubmitting] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!interviewerNotes.trim()) {
      toast.error('Vui lòng nhập nhận xét đánh giá buổi phỏng vấn');
      return;
    }

    setSubmitting(true);
    try {
      await submitInterviewFeedback(token, interview.id, {
        score,
        interviewerNotes: interviewerNotes.trim(),
        nextStage,
      });

      toast.success('Đã lưu kết quả phỏng vấn và cập nhật trạng thái hồ sơ!');
      await onSuccess();
      onClose();
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : 'Không thể lưu kết quả phỏng vấn',
      );
    } finally {
      setSubmitting(false);
    }
  };

  const scoreCategories = [
    { label: 'Xuất sắc', min: 90, color: 'bg-emerald-50 text-emerald-700 border-emerald-200' },
    { label: 'Đạt yêu cầu', min: 70, color: 'bg-blue-50 text-[#2563EB] border-blue-200' },
    { label: 'Cân nhắc', min: 50, color: 'bg-amber-50 text-amber-700 border-amber-200' },
    { label: 'Không đạt', min: 0, color: 'bg-rose-50 text-rose-700 border-rose-200' },
  ];

  const currentCategory =
    score >= 90
      ? scoreCategories[0]
      : score >= 70
        ? scoreCategories[1]
        : score >= 50
          ? scoreCategories[2]
          : scoreCategories[3];

  return (
    <div className="fixed inset-0 z-[90] flex items-center justify-center bg-slate-950/60 p-4 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="w-full max-w-xl rounded-2xl border border-slate-200 bg-white shadow-2xl overflow-hidden font-sans">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-100 bg-[#EFF6FF] px-6 py-4">
          <div className="flex items-center gap-3">
            <div className="flex size-10 items-center justify-center rounded-xl bg-[#2563EB] text-white shadow-sm">
              <Award className="size-5" />
            </div>
            <div>
              <h2 className="text-base font-extrabold text-[#1F2937]">
                Đánh Giá &amp; Chấm Điểm Phỏng Vấn
              </h2>
              <p className="text-xs text-slate-500 mt-0.5">
                Ứng viên: <strong className="text-[#2563EB]">{candidateName}</strong> • {interview.title}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            disabled={submitting}
            className="rounded-lg p-2 text-slate-400 hover:bg-white hover:text-slate-600 transition-colors"
          >
            <X className="size-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-5 max-h-[80vh] overflow-y-auto">
          {/* Điểm số */}
          <div className="rounded-2xl border border-blue-100 bg-[#EFF6FF]/50 p-4 space-y-3">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold text-[#1F2937] uppercase tracking-wider">
                Điểm số đánh giá (Thang 100)
              </label>
              <div className="flex items-center gap-2">
                <span className={`text-xs font-bold px-2.5 py-0.5 rounded-full border ${currentCategory.color}`}>
                  {currentCategory.label}
                </span>
                <span className="text-2xl font-black text-[#2563EB] font-mono">
                  {score}<span className="text-sm font-semibold text-slate-400">/100</span>
                </span>
              </div>
            </div>

            <input
              type="range"
              min="0"
              max="100"
              value={score}
              onChange={(e) => setScore(Number(e.target.value))}
              className="w-full h-2 bg-blue-200 rounded-lg appearance-none cursor-pointer accent-[#2563EB]"
            />

            <div className="flex justify-between text-[11px] font-bold text-slate-400 px-1">
              <span>0 (Kém)</span>
              <span>50 (Trung bình)</span>
              <span>70 (Đạt)</span>
              <span>90+ (Xuất sắc)</span>
            </div>
          </div>

          {/* Nhận xét đánh giá */}
          <div>
            <label className="block text-xs font-bold text-[#1F2937] uppercase tracking-wider mb-1.5 flex items-center justify-between">
              <span>Nhận xét chi tiết sau phỏng vấn <span className="text-rose-500">*</span></span>
              <FileText className="size-3.5 text-slate-400" />
            </label>
            <textarea
              value={interviewerNotes}
              onChange={(e) => setInterviewerNotes(e.target.value)}
              rows={4}
              placeholder="VD: Ứng viên nắm chắc kiến thức React, Next.js và State Management. Trả lời tình huống hệ thống tốt. Thái độ cầu tiến, phù hợp văn hóa team..."
              className="w-full rounded-xl border border-slate-200 p-3 text-xs font-medium text-[#1F2937] outline-none focus:border-[#2563EB] focus:ring-2 focus:ring-blue-100 resize-none transition-all"
              required
            />
          </div>

          {/* Quyết định bước tiếp theo */}
          <div>
            <label className="block text-xs font-bold text-[#1F2937] uppercase tracking-wider mb-2">
              Quyết định chuyển bước tiếp theo
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
              <button
                type="button"
                onClick={() => setNextStage('OFFERED')}
                className={`p-3 rounded-xl border text-left transition-all flex flex-col justify-between ${
                  nextStage === 'OFFERED'
                    ? 'border-emerald-500 bg-emerald-50 ring-1 ring-emerald-500 shadow-sm'
                    : 'border-slate-200 bg-white hover:border-emerald-300'
                }`}
              >
                <div className="flex items-center gap-1.5 text-emerald-700 font-bold text-xs">
                  <CheckCircle2 className="size-4" />
                  Đạt $\rightarrow$ Gửi Offer
                </div>
                <span className="text-[10px] text-slate-500 mt-1">Chuyển sang bước Đề nghị nhận việc</span>
              </button>

              <button
                type="button"
                onClick={() => setNextStage('INTERVIEW_SCHEDULED')}
                className={`p-3 rounded-xl border text-left transition-all flex flex-col justify-between ${
                  nextStage === 'INTERVIEW_SCHEDULED'
                    ? 'border-blue-500 bg-blue-50 ring-1 ring-blue-500 shadow-sm'
                    : 'border-slate-200 bg-white hover:border-blue-300'
                }`}
              >
                <div className="flex items-center gap-1.5 text-[#2563EB] font-bold text-xs">
                  <Sparkles className="size-4" />
                  Phỏng vấn Vòng 2
                </div>
                <span className="text-[10px] text-slate-500 mt-1">Lên lịch thêm 1 vòng đánh giá tiếp theo</span>
              </button>

              <button
                type="button"
                onClick={() => setNextStage('REJECTED')}
                className={`p-3 rounded-xl border text-left transition-all flex flex-col justify-between ${
                  nextStage === 'REJECTED'
                    ? 'border-rose-500 bg-rose-50 ring-1 ring-rose-500 shadow-sm'
                    : 'border-slate-200 bg-white hover:border-rose-300'
                }`}
              >
                <div className="flex items-center gap-1.5 text-rose-700 font-bold text-xs">
                  <XCircle className="size-4" />
                  Chưa phù hợp
                </div>
                <span className="text-[10px] text-slate-500 mt-1">Từ chối hồ sơ ứng viên</span>
              </button>
            </div>
          </div>

          {/* Footer Action Buttons */}
          <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100">
            <button
              type="button"
              onClick={onClose}
              disabled={submitting}
              className="px-4 py-2.5 rounded-xl border border-slate-200 text-xs font-bold text-slate-600 hover:bg-slate-50 transition-colors disabled:opacity-50"
            >
              Hủy
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-[#2563EB] hover:bg-[#1D4ED8] text-white text-xs font-bold shadow-md shadow-blue-600/20 active:scale-95 transition-all disabled:opacity-50"
            >
              {submitting ? (
                <>
                  <Loader2 className="size-4 animate-spin" />
                  Đang lưu...
                </>
              ) : (
                <>
                  <Award className="size-4" />
                  Lưu Đánh Giá
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
