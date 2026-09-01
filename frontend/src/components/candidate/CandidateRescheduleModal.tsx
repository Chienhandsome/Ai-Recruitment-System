'use client';

import React, { useState } from 'react';
import { X, Calendar, Clock, Plus, Trash2, Loader2, AlertCircle } from 'lucide-react';
import { toast } from 'sonner';
import { respondToInterview } from '@/lib/interview-api';

interface CandidateRescheduleModalProps {
  isOpen: boolean;
  onClose: () => void;
  token: string;
  interviewId: string;
  interviewTitle: string;
  currentScheduledAt: string;
  onSuccess: () => void | Promise<void>;
}

const COMMON_REASONS = [
  'Trùng lịch làm việc / lịch học tập',
  'Có việc gia đình / cá nhân đột xuất',
  'Vấn đề sức khỏe cần nghỉ ngơi',
  'Cần thêm thời gian chuẩn bị',
  'Lý do khác',
];

export function CandidateRescheduleModal({
  isOpen,
  onClose,
  token,
  interviewId,
  interviewTitle,
  currentScheduledAt,
  onSuccess,
}: CandidateRescheduleModalProps) {
  const getDefaultDateTime = (daysAhead: number, hour: number) => {
    const d = new Date();
    d.setDate(d.getDate() + daysAhead);
    d.setHours(hour, 0, 0, 0);
    const pad = (n: number) => n.toString().padStart(2, '0');
    return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
  };

  const [selectedReason, setSelectedReason] = useState(COMMON_REASONS[0]);
  const [customReason, setCustomReason] = useState('');
  const [proposedSlots, setProposedSlots] = useState<string[]>([
    getDefaultDateTime(2, 9),
    getDefaultDateTime(2, 14),
  ]);
  const [submitting, setSubmitting] = useState(false);

  if (!isOpen) return null;

  const handleAddSlot = () => {
    if (proposedSlots.length >= 3) {
      toast.info('Bạn chỉ có thể đề xuất tối đa 3 khung giờ');
      return;
    }
    setProposedSlots([...proposedSlots, getDefaultDateTime(3, 9)]);
  };

  const handleRemoveSlot = (index: number) => {
    if (proposedSlots.length <= 1) {
      toast.error('Vui lòng để lại ít nhất 1 khung giờ đề xuất');
      return;
    }
    setProposedSlots(proposedSlots.filter((_, i) => i !== index));
  };

  const handleSlotChange = (index: number, val: string) => {
    const updated = [...proposedSlots];
    updated[index] = val;
    setProposedSlots(updated);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const validSlots = proposedSlots
      .map((s) => s.trim())
      .filter((s) => Boolean(s));

    if (validSlots.length === 0) {
      toast.error('Vui lòng chọn ít nhất một khung giờ đề xuất');
      return;
    }

    const isoSlots: string[] = [];
    for (const slot of validSlots) {
      const dt = new Date(slot);
      if (isNaN(dt.getTime())) {
        toast.error('Khung giờ đề xuất không hợp lệ');
        return;
      }
      if (dt.getTime() <= Date.now()) {
        toast.error('Khung giờ đề xuất phải ở trong tương lai');
        return;
      }
      isoSlots.push(dt.toISOString());
    }

    const noteParts: string[] = [selectedReason];
    if (customReason.trim()) {
      noteParts.push(customReason.trim());
    }
    const fullNotes = noteParts.join(' - ');

    setSubmitting(true);
    try {
      await respondToInterview(token, interviewId, {
        response: 'RESCHEDULE_REQUESTED',
        candidateNotes: fullNotes,
        proposedSlots: isoSlots,
      });

      toast.success('Đã gửi đề xuất dời lịch tới nhà tuyển dụng thành công!');
      await onSuccess();
      onClose();
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : 'Không thể gửi đề xuất dời lịch',
      );
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-950/60 p-4 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="relative w-full max-w-lg rounded-2xl border border-slate-200 bg-white p-6 shadow-2xl animate-in zoom-in-95 duration-200">
        {/* Close Button */}
        <button
          type="button"
          onClick={onClose}
          disabled={submitting}
          className="absolute right-4 top-4 rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-700 transition"
          aria-label="Đóng"
        >
          <X className="size-5" />
        </button>

        {/* Header */}
        <div className="flex items-start gap-3 pb-4 border-b border-slate-100">
          <div className="rounded-xl bg-[#EFF6FF] p-2.5 text-[#2563EB]">
            <Calendar className="size-5" />
          </div>
          <div>
            <h3 className="text-lg font-bold text-[#1F2937]">Đề xuất dời lịch phỏng vấn</h3>
            <p className="text-xs text-slate-500 mt-0.5">{interviewTitle}</p>
          </div>
        </div>

        {/* Current Time Alert */}
        <div className="mt-4 flex items-center gap-2 rounded-xl bg-amber-50 p-3 border border-amber-200/70 text-xs text-amber-800">
          <AlertCircle className="size-4 shrink-0 text-amber-600" />
          <span>
            Lịch hiện tại: <strong>{new Date(currentScheduledAt).toLocaleString('vi-VN')}</strong>
          </span>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="mt-4 space-y-4">
          {/* Reason Select */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1.5">
              Lý do xin dời lịch <span className="text-rose-500">*</span>
            </label>
            <select
              value={selectedReason}
              onChange={(e) => setSelectedReason(e.target.value)}
              className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm text-slate-800 outline-none focus:border-[#2563EB] focus:ring-2 focus:ring-[#2563EB]/20 transition"
            >
              {COMMON_REASONS.map((r) => (
                <option key={r} value={r}>
                  {r}
                </option>
              ))}
            </select>
          </div>

          {/* Detailed Reason Notes */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1.5">
              Chi tiết / Ghi chú thêm cho Nhà tuyển dụng
            </label>
            <textarea
              value={customReason}
              onChange={(e) => setCustomReason(e.target.value)}
              rows={2}
              maxLength={500}
              placeholder="Nhập chi tiết lý do hoặc nhắn gửi thêm nếu cần..."
              className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-xs text-slate-800 outline-none focus:border-[#2563EB] focus:ring-2 focus:ring-[#2563EB]/20 transition placeholder:text-slate-400"
            />
          </div>

          {/* Proposed Slots */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="block text-xs font-semibold text-slate-700">
                Các khung giờ bạn có thể tham gia <span className="text-rose-500">*</span>
              </label>
              {proposedSlots.length < 3 && (
                <button
                  type="button"
                  onClick={handleAddSlot}
                  className="flex items-center gap-1 text-xs font-bold text-[#2563EB] hover:text-[#3B82F6] transition"
                >
                  <Plus className="size-3.5" /> Thêm khung giờ
                </button>
              )}
            </div>

            <div className="space-y-2">
              {proposedSlots.map((slot, index) => (
                <div key={index} className="flex items-center gap-2">
                  <div className="relative flex-1">
                    <Clock className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-slate-400" />
                    <input
                      type="datetime-local"
                      required
                      value={slot}
                      onChange={(e) => handleSlotChange(index, e.target.value)}
                      className="w-full rounded-xl border border-slate-300 bg-white pl-9 pr-3 py-2 text-xs text-slate-800 outline-none focus:border-[#2563EB] focus:ring-2 focus:ring-[#2563EB]/20 transition"
                    />
                  </div>
                  {proposedSlots.length > 1 && (
                    <button
                      type="button"
                      onClick={() => handleRemoveSlot(index)}
                      className="rounded-lg p-2 text-slate-400 hover:bg-rose-50 hover:text-rose-600 transition"
                      title="Xóa khung giờ này"
                    >
                      <Trash2 className="size-4" />
                    </button>
                  )}
                </div>
              ))}
            </div>
            <p className="text-[11px] text-slate-400 mt-1">
              Gợi ý: Đề xuất 2–3 khung giờ để HR và Hội đồng phỏng vấn dễ sắp xếp nhất.
            </p>
          </div>

          {/* Actions */}
          <div className="flex items-center justify-end gap-2.5 pt-4 border-t border-slate-100">
            <button
              type="button"
              onClick={onClose}
              disabled={submitting}
              className="rounded-xl px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 transition"
            >
              Hủy bỏ
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="flex items-center gap-2 rounded-xl bg-[#2563EB] px-4 py-2 text-xs font-bold text-white shadow-sm hover:bg-[#1d4ed8] active:scale-[0.98] transition disabled:opacity-50"
            >
              {submitting ? (
                <>
                  <Loader2 className="size-3.5 animate-spin" /> Đang gửi...
                </>
              ) : (
                'Gửi đề xuất dời lịch'
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
