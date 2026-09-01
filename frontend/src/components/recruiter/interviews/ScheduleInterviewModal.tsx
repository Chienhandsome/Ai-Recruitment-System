'use client';

import React, { useState, useEffect } from 'react';
import {
  X,
  Calendar,
  Clock,
  Video,
  MapPin,
  FileText,
  Loader2,
  Sparkles,
  User,
  Briefcase,
} from 'lucide-react';
import { toast } from 'sonner';
import {
  type InterviewData,
  type InterviewType,
  createInterview,
  updateInterview,
  interviewTypeLabels,
} from '@/lib/interview-api';

interface ScheduleInterviewModalProps {
  isOpen: boolean;
  onClose: () => void;
  token: string;
  applicationId: string;
  candidateName: string;
  jobTitle: string;
  onSuccess: () => void | Promise<void>;
  interviewToEdit?: InterviewData | null;
  existingInterviewsCount?: number;
}

export function ScheduleInterviewModal({
  isOpen,
  onClose,
  token,
  applicationId,
  candidateName,
  jobTitle,
  onSuccess,
  interviewToEdit,
  existingInterviewsCount = 0,
}: ScheduleInterviewModalProps) {
  const formatDatetimeLocal = (d: Date) => {
    const pad = (n: number) => n.toString().padStart(2, '0');
    return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
  };

  const getDefaultDateTime = () => {
    if (interviewToEdit?.scheduledAt) {
      return formatDatetimeLocal(new Date(interviewToEdit.scheduledAt));
    }
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    tomorrow.setHours(9, 0, 0, 0);
    return formatDatetimeLocal(tomorrow);
  };

  const [title, setTitle] = useState(
    interviewToEdit?.title ||
      (existingInterviewsCount > 0
        ? `Phỏng vấn Vòng ${existingInterviewsCount + 1} - ${jobTitle}`
        : `Phỏng vấn - ${jobTitle}`),
  );
  const [type, setType] = useState<InterviewType>(interviewToEdit?.type || 'ONLINE');
  const [scheduledAt, setScheduledAt] = useState(getDefaultDateTime());
  const [durationMinutes, setDurationMinutes] = useState(interviewToEdit?.durationMinutes || 60);
  const [locationOrLink, setLocationOrLink] = useState(interviewToEdit?.locationOrLink || '');
  const [interviewerNotes, setInterviewerNotes] = useState(interviewToEdit?.interviewerNotes || '');
  const [submitting, setSubmitting] = useState(false);

  // Sync state whenever modal is opened or interviewToEdit / existingInterviewsCount changes
  useEffect(() => {
    if (isOpen) {
      if (interviewToEdit) {
        setTitle(interviewToEdit.title);
        setType(interviewToEdit.type || 'ONLINE');
        setScheduledAt(formatDatetimeLocal(new Date(interviewToEdit.scheduledAt)));
        setDurationMinutes(interviewToEdit.durationMinutes || 60);
        setLocationOrLink(interviewToEdit.locationOrLink || '');
        setInterviewerNotes(interviewToEdit.interviewerNotes || '');
      } else {
        const nextRound = existingInterviewsCount + 1;
        const defaultTitle =
          existingInterviewsCount > 0
            ? `Phỏng vấn Vòng ${nextRound} - ${jobTitle}`
            : `Phỏng vấn - ${jobTitle}`;
        setTitle(defaultTitle);
        setType('ONLINE');
        setScheduledAt(getDefaultDateTime());
        setDurationMinutes(60);
        setLocationOrLink('');
        setInterviewerNotes('');
      }
    }
  }, [isOpen, interviewToEdit, existingInterviewsCount, jobTitle]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) {
      toast.error('Vui lòng nhập tiêu đề buổi phỏng vấn');
      return;
    }
    if (!scheduledAt) {
      toast.error('Vui lòng chọn thời gian phỏng vấn');
      return;
    }

    setSubmitting(true);
    try {
      if (interviewToEdit) {
        await updateInterview(token, interviewToEdit.id, {
          title: title.trim(),
          type,
          scheduledAt: new Date(scheduledAt).toISOString(),
          durationMinutes,
          locationOrLink: locationOrLink.trim() || undefined,
          interviewerNotes: interviewerNotes.trim() || undefined,
          status: 'SCHEDULED',
          candidateResponse: 'PENDING',
        });
        toast.success('Đã cập nhật lịch phỏng vấn và gửi thông báo tới ứng viên!');
      } else {
        await createInterview(token, {
          applicationId,
          title: title.trim(),
          type,
          scheduledAt: new Date(scheduledAt).toISOString(),
          durationMinutes,
          locationOrLink: locationOrLink.trim() || undefined,
          interviewerNotes: interviewerNotes.trim() || undefined,
        });
        toast.success(
          existingInterviewsCount > 0
            ? `Đã lên lịch phỏng vấn Vòng ${existingInterviewsCount + 1} thành công!`
            : 'Đã lên lịch phỏng vấn và cập nhật trạng thái hồ sơ!',
        );
      }
      await onSuccess();
      onClose();
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : 'Không thể lưu lịch phỏng vấn',
      );
    } finally {
      setSubmitting(false);
    }
  };

  const durationOptions = [30, 45, 60, 90];

  return (
    <div className="fixed inset-0 z-[90] flex items-center justify-center bg-slate-950/60 p-4 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="w-full max-w-xl rounded-2xl border border-slate-200 bg-white shadow-2xl overflow-hidden font-sans">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-100 bg-[#EFF6FF] px-6 py-4">
          <div className="flex items-center gap-3">
            <div className="flex size-10 items-center justify-center rounded-xl bg-[#2563EB] text-white shadow-sm">
              <Calendar className="size-5" />
            </div>
            <div>
              <h2 className="text-base font-extrabold text-[#1F2937]">
                {interviewToEdit
                  ? 'Đổi Ngày Giờ / Chỉnh Sửa Phỏng Vấn'
                  : existingInterviewsCount > 0
                    ? `Lên Lịch Phỏng Vấn Vòng ${existingInterviewsCount + 1}`
                    : 'Lên Lịch Phỏng Vấn'}
              </h2>
              <div className="flex items-center gap-2 mt-0.5 text-xs text-slate-500">
                <span className="flex items-center gap-1 font-semibold text-[#2563EB]">
                  <User className="size-3" /> {candidateName}
                </span>
                <span>•</span>
                <span className="flex items-center gap-1 truncate max-w-[200px]">
                  <Briefcase className="size-3" /> {jobTitle}
                </span>
              </div>
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
        <form onSubmit={handleSubmit} className="p-6 space-y-4 max-h-[80vh] overflow-y-auto">
          {/* Informational Context Banner */}
          {interviewToEdit ? (
            <div className="rounded-xl bg-amber-50 p-3 border border-amber-200 text-xs text-amber-900 flex items-start gap-2.5">
              <Clock className="size-4 text-amber-600 shrink-0 mt-0.5" />
              <div>
                <p className="font-bold">Đang đổi thời gian cho buổi phỏng vấn hiện tại</p>
                <p className="text-[11px] text-amber-700 mt-0.5">
                  Thời gian mới sẽ cập nhật cho buổi này và gửi thông báo mời ứng viên xác nhận lại.
                </p>
              </div>
            </div>
          ) : existingInterviewsCount > 0 ? (
            <div className="rounded-xl bg-blue-50 p-3 border border-blue-200 text-xs text-blue-900 flex items-start gap-2.5">
              <Sparkles className="size-4 text-[#2563EB] shrink-0 mt-0.5" />
              <div>
                <p className="font-bold">Tạo thêm vòng phỏng vấn mới (Vòng {existingInterviewsCount + 1})</p>
                <p className="text-[11px] text-blue-700 mt-0.5">
                  Buổi phỏng vấn trước đó và kết quả đánh giá vẫn được giữ nguyên vẹn trong hồ sơ ứng viên.
                </p>
              </div>
            </div>
          ) : null}

          {/* Tiêu đề */}
          <div>
            <label className="block text-xs font-bold text-[#1F2937] uppercase tracking-wider mb-1.5">
              Tiêu đề buổi phỏng vấn <span className="text-rose-500">*</span>
            </label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="VD: Phỏng vấn Vòng 1 - Kỹ thuật Frontend"
              className="w-full rounded-xl border border-blue-200 bg-[#EFF6FF]/40 px-3.5 py-2.5 text-xs font-medium text-[#1F2937] outline-none focus:border-[#2563EB] focus:ring-2 focus:ring-blue-100 transition-all"
              required
            />
          </div>

          {/* Hình thức & Thời lượng */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-[#1F2937] uppercase tracking-wider mb-1.5">
                Hình thức phỏng vấn
              </label>
              <select
                value={type}
                onChange={(e) => setType(e.target.value as InterviewType)}
                className="w-full rounded-xl border border-blue-200 bg-[#EFF6FF]/40 px-3.5 py-2.5 text-xs font-bold text-[#1F2937] outline-none focus:border-[#2563EB] focus:ring-2 focus:ring-blue-100 transition-all cursor-pointer"
              >
                {Object.entries(interviewTypeLabels).map(([key, label]) => (
                  <option key={key} value={key}>
                    {label}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-[#1F2937] uppercase tracking-wider mb-1.5">
                Thời lượng (phút)
              </label>
              <div className="flex gap-1.5">
                {durationOptions.map((opt) => (
                  <button
                    key={opt}
                    type="button"
                    onClick={() => setDurationMinutes(opt)}
                    className={`flex-1 py-2 text-xs font-extrabold rounded-lg border transition-all ${
                      durationMinutes === opt
                        ? 'bg-[#2563EB] text-white border-[#2563EB] shadow-sm'
                        : 'bg-white text-slate-700 border-slate-200 hover:border-blue-300'
                    }`}
                  >
                    {opt}p
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Ngày & Giờ */}
          <div>
            <label className="block text-xs font-bold text-[#1F2937] uppercase tracking-wider mb-1.5">
              Thời gian bắt đầu <span className="text-rose-500">*</span>
            </label>
            <div className="relative">
              <input
                type="datetime-local"
                value={scheduledAt}
                onChange={(e) => setScheduledAt(e.target.value)}
                className="w-full rounded-xl border border-blue-200 bg-[#EFF6FF]/40 px-3.5 py-2.5 text-xs font-semibold text-[#1F2937] outline-none focus:border-[#2563EB] focus:ring-2 focus:ring-blue-100 transition-all cursor-pointer"
                required
              />
            </div>
          </div>

          {/* Link phòng họp / Địa chỉ */}
          <div>
            <label className="block text-xs font-bold text-[#1F2937] uppercase tracking-wider mb-1.5 flex items-center justify-between">
              <span>{type === 'ONLINE' ? 'Link phòng họp (Google Meet / Zoom)' : 'Địa điểm phỏng vấn'}</span>
              {type === 'ONLINE' ? (
                <Video className="size-3.5 text-[#2563EB]" />
              ) : (
                <MapPin className="size-3.5 text-[#2563EB]" />
              )}
            </label>
            <input
              type="text"
              value={locationOrLink}
              onChange={(e) => setLocationOrLink(e.target.value)}
              placeholder={
                type === 'ONLINE'
                  ? 'https://meet.google.com/xxx-yyyy-zzz hoặc Zoom link'
                  : 'Tầng 5, Tòa nhà Innovation, 123 Đường Công Nghệ, Q.1'
              }
              className="w-full rounded-xl border border-blue-200 bg-[#EFF6FF]/40 px-3.5 py-2.5 text-xs font-medium text-[#1F2937] outline-none focus:border-[#2563EB] focus:ring-2 focus:ring-blue-100 transition-all"
            />
          </div>

          {/* Ghi chú */}
          <div>
            <label className="block text-xs font-bold text-[#1F2937] uppercase tracking-wider mb-1.5 flex items-center justify-between">
              <span>Ghi chú &amp; Hướng dẫn chuẩn bị</span>
              <FileText className="size-3.5 text-slate-400" />
            </label>
            <textarea
              value={interviewerNotes}
              onChange={(e) => setInterviewerNotes(e.target.value)}
              rows={3}
              placeholder="VD: Ứng viên chuẩn bị slide giới thiệu dự án tiêu biểu, kiểm tra mic và webcam trước 5 phút..."
              className="w-full rounded-xl border border-slate-200 p-3 text-xs font-medium text-[#1F2937] outline-none focus:border-[#2563EB] focus:ring-2 focus:ring-blue-100 resize-none transition-all"
            />
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
                  Đang lưu lịch...
                </>
              ) : (
                <>
                  <Calendar className="size-4" />
                  {interviewToEdit ? 'Lưu Lịch Phỏng Vấn Mới' : 'Xác nhận Lên Lịch'}
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
