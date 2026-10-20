'use client';

import React, { useState } from 'react';
import {
  X,
  ShieldAlert,
  Loader2,
  CheckCircle2,
  Send,
  MessageSquare,
  AlertTriangle,
  ExternalLink,
} from 'lucide-react';
import { toast } from 'sonner';
import {
  candidateRespondWarranty,
  type WarrantyClaimInfo,
} from '@/lib/contract-api';

interface CandidateWarrantyFeedbackModalProps {
  isOpen: boolean;
  onClose: () => void;
  token: string;
  contractId: string;
  contractNumber: string;
  jobTitle: string;
  existingClaim?: WarrantyClaimInfo | null;
  onSuccess: () => void | Promise<void>;
}

export function CandidateWarrantyFeedbackModal({
  isOpen,
  onClose,
  token,
  contractId,
  contractNumber,
  jobTitle,
  existingClaim,
  onSuccess,
}: CandidateWarrantyFeedbackModalProps) {
  const [feedback, setFeedback] = useState<string>('');
  const [submitting, setSubmitting] = useState<boolean>(false);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!feedback.trim() || feedback.trim().length < 5) {
      toast.error('Vui lòng nhập nội dung giải trình chi tiết (tối thiểu 5 ký tự).');
      return;
    }

    try {
      setSubmitting(true);
      await candidateRespondWarranty(token, contractId, feedback.trim());
      toast.success('Đã gửi ý kiến phản hồi thành công. Ban Quản trị sẽ đối soát công tâm.');
      await onSuccess();
      onClose();
    } catch (err: any) {
      toast.error(err.message || 'Không thể gửi phản hồi. Vui lòng thử lại.');
    } finally {
      setSubmitting(false);
    }
  };

  const hasResponded = Boolean(existingClaim?.candidateResponse);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-200">
      <div
        className="relative w-full max-w-lg bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100 bg-slate-50/50">
          <div className="flex items-center gap-2.5">
            <div className="flex size-9 items-center justify-center rounded-xl bg-amber-50 text-amber-600 border border-amber-200">
              <ShieldAlert className="size-4.5" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-slate-900">
                Phản Hồi Sự Cố Nhận Việc / Nghỉ Việc Sớm
              </h3>
              <p className="text-2xs text-slate-500">
                Mã HĐ: <span className="font-mono font-bold text-[#2563EB]">{contractNumber}</span> • Vị trí: {jobTitle}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-100 transition-colors"
          >
            <X className="size-4" />
          </button>
        </div>

        {/* Content */}
        <div className="p-5 space-y-4 text-xs">
          {/* Claim info from HR */}
          <div className="rounded-xl border border-amber-200 bg-amber-50/60 p-3.5 space-y-2">
            <div className="flex items-center justify-between">
              <span className="font-bold text-amber-900 flex items-center gap-1.5">
                <AlertTriangle className="size-3.5 text-amber-600" />
                Thông tin ghi nhận từ Nhà tuyển dụng:
              </span>
              <span className="font-mono text-2xs px-2 py-0.5 rounded bg-white/80 font-bold border border-amber-200 text-amber-900">
                {existingClaim?.claimNumber || 'N/A'}
              </span>
            </div>
            <div className="text-2xs text-amber-950 space-y-1">
              <div>
                <strong>Lý do khai báo:</strong>{' '}
                {existingClaim?.reason === 'NO_SHOW'
                  ? 'Ứng viên không đến nhận việc ngày đầu (No-Show)'
                  : 'Ứng viên tự ý nghỉ việc trong 30 ngày thử việc (Early Resignation)'}
              </div>
              {existingClaim?.note && (
                <div className="pt-1 text-slate-700 italic border-t border-amber-200/70">
                  "{existingClaim.note}"
                </div>
              )}
            </div>
          </div>

          {hasResponded ? (
            /* Already responded */
            <div className="rounded-xl border border-emerald-200 bg-emerald-50/50 p-4 space-y-2">
              <div className="flex items-center gap-2 text-emerald-800 font-semibold">
                <CheckCircle2 className="size-4 text-emerald-600" />
                Bạn đã gửi phản hồi giải trình
              </div>
              <p className="text-slate-800 italic bg-white/80 p-2.5 rounded-lg border border-emerald-100">
                "{existingClaim?.candidateResponse}"
              </p>
              <div className="text-2xs text-slate-500 pt-1">
                Gửi lúc:{' '}
                {existingClaim?.candidateRespondedAt
                  ? new Date(existingClaim.candidateRespondedAt).toLocaleString('vi-VN')
                  : 'N/A'}
              </div>
              <div className="flex justify-end pt-2">
                <button
                  type="button"
                  onClick={onClose}
                  className="px-4 py-2 text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-xl transition-colors cursor-pointer"
                >
                  Đóng
                </button>
              </div>
            </div>
          ) : (
            /* Form to submit response */
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block font-bold text-slate-900 mb-1.5">
                  Ý kiến phản hồi / Giải trình của bạn <span className="text-rose-500">*</span>
                </label>
                <p className="text-2xs text-slate-500 mb-2 leading-relaxed">
                  Để bảo vệ quyền lợi cá nhân và đảm bảo tính công tâm, bạn có thể nêu rõ lý do (ví dụ: đã xin phép thôi việc theo quy định, hoặc công ty thay đổi điều kiện lao động...). Ban Quản trị sàn sẽ xem xét trước khi xử lý.
                </p>
                <textarea
                  rows={4}
                  value={feedback}
                  onChange={(e) => setFeedback(e.target.value)}
                  placeholder="Nhập chi tiết ý kiến phản hồi hoặc giải trình của bạn tại đây..."
                  className="w-full text-xs rounded-xl border border-slate-300 p-3 text-slate-900 focus:border-[#2563EB] focus:ring-1 focus:ring-[#2563EB] outline-hidden placeholder:text-slate-400"
                  required
                />
              </div>

              <div className="flex items-center justify-end gap-2.5 pt-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={onClose}
                  disabled={submitting}
                  className="px-4 py-2 text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-xl transition-colors disabled:opacity-50 cursor-pointer"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  disabled={submitting || !feedback.trim()}
                  className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-bold text-white bg-[#2563EB] hover:bg-blue-700 rounded-xl shadow-xs transition-colors disabled:opacity-50 cursor-pointer"
                >
                  {submitting ? (
                    <>
                      <Loader2 className="size-3.5 animate-spin" />
                      Đang gửi...
                    </>
                  ) : (
                    <>
                      <Send className="size-3.5" />
                      Gửi Phản Hồi Cho Ban Quản Trị
                    </>
                  )}
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
