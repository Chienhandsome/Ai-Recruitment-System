'use client';

import React, { useState } from 'react';
import {
  Calendar,
  Clock,
  Video,
  MapPin,
  CheckCircle2,
  CalendarClock,
  XCircle,
  ExternalLink,
  Download,
  Phone,
  Mail,
  User,
  Loader2,
  ChevronDown,
} from 'lucide-react';
import { toast } from 'sonner';
import {
  type InterviewData,
  interviewTypeLabels,
  candidateResponseLabels,
  candidateResponseStyles,
  respondToInterview,
  generateGoogleCalendarUrl,
  downloadIcsFile,
} from '@/lib/interview-api';
import { CandidateRescheduleModal } from './CandidateRescheduleModal';

interface CandidateInterviewCardProps {
  interview: InterviewData;
  token: string;
  recruiterInfo?: {
    title?: string | null;
    fullName?: string | null;
    email?: string | null;
    phone?: string | null;
  } | null;
  onRefresh: () => void | Promise<void>;
  roundIndex?: number;
}

export function CandidateInterviewCard({
  interview,
  token,
  recruiterInfo,
  onRefresh,
  roundIndex = 1,
}: CandidateInterviewCardProps) {
  const [isRescheduleModalOpen, setIsRescheduleModalOpen] = useState(false);
  const [submittingAction, setSubmittingAction] = useState<'ACCEPT' | 'DECLINE' | null>(null);
  const [showCalendarMenu, setShowCalendarMenu] = useState(false);

  const responseStatus = interview.candidateResponse || 'PENDING';
  const responseStyle = candidateResponseStyles[responseStatus];

  const handleAccept = async () => {
    setSubmittingAction('ACCEPT');
    try {
      await respondToInterview(token, interview.id, {
        response: 'ACCEPTED',
      });
      toast.success('Đã xác nhận tham gia buổi phỏng vấn! Lịch hẹn đã được cập nhật.');
      await onRefresh();
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : 'Không thể xác nhận phỏng vấn',
      );
    } finally {
      setSubmittingAction(null);
    }
  };

  const handleDecline = async () => {
    const confirmDecline = window.confirm(
      'Bạn có chắc chắn muốn từ chối buổi phỏng vấn này không? Hành động này sẽ hủy lịch hẹn hiện tại.',
    );
    if (!confirmDecline) return;

    const reason = window.prompt(
      'Vui lòng nhập lý do từ chối (để HR nắm được thông tin):',
      'Đã tìm được công việc phù hợp khác',
    );
    if (reason === null) return;

    setSubmittingAction('DECLINE');
    try {
      await respondToInterview(token, interview.id, {
        response: 'DECLINED',
        candidateNotes: reason.trim() || 'Ứng viên từ chối phỏng vấn',
      });
      toast.info('Đã gửi thông báo từ chối tới nhà tuyển dụng.');
      await onRefresh();
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : 'Không thể từ chối phỏng vấn',
      );
    } finally {
      setSubmittingAction(null);
    }
  };

  const handleGoogleCalendar = () => {
    const url = generateGoogleCalendarUrl(interview);
    window.open(url, '_blank', 'noopener,noreferrer');
    setShowCalendarMenu(false);
  };

  const handleDownloadIcs = () => {
    downloadIcsFile(interview);
    toast.success('Đã tải file .ics về máy!');
    setShowCalendarMenu(false);
  };

  const isPending = responseStatus === 'PENDING';
  const isRescheduled = responseStatus === 'RESCHEDULE_REQUESTED';
  const isAccepted = responseStatus === 'ACCEPTED';
  const isDeclined = responseStatus === 'DECLINED';

  return (
    <>
      <div className="rounded-2xl border border-blue-200 bg-[#EFF6FF] p-4 sm:p-5 space-y-3.5 shadow-sm transition hover:shadow-md">
        {/* Header: Round & Status Badges */}
        <div className="flex flex-wrap items-center justify-between gap-2.5 pb-2 border-b border-blue-100">
          <div className="flex items-center gap-2">
            <span className="flex size-6 items-center justify-center rounded-full bg-[#2563EB] text-[11px] font-extrabold text-white">
              {roundIndex}
            </span>
            <h4 className="text-sm font-bold text-[#1F2937] flex items-center gap-1.5">
              <Calendar className="size-4 text-[#2563EB]" />
              {interview.title}
            </h4>
          </div>

          <div className="flex flex-wrap items-center gap-1.5">
            {/* Type badge */}
            <span className="text-[11px] font-semibold px-2.5 py-0.5 rounded-full bg-white text-slate-700 border border-slate-200 shadow-2xs">
              {interviewTypeLabels[interview.type] || interview.type}
            </span>

            {/* Candidate Response Badge */}
            <span
              className={`inline-flex items-center gap-1.5 text-[11px] font-bold px-2.5 py-0.5 rounded-full border ${responseStyle.bg} ${responseStyle.text} ${responseStyle.border}`}
            >
              <span className={`size-1.5 rounded-full ${responseStyle.dot} ${isPending ? 'animate-ping' : ''}`} />
              {candidateResponseLabels[responseStatus]}
            </span>
          </div>
        </div>

        {/* Date, Time & Location Info */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 text-xs text-slate-700 font-medium">
          <div className="flex items-center gap-2 bg-white/70 p-2.5 rounded-xl border border-blue-100/60">
            <Clock className="size-4 text-[#2563EB] shrink-0" />
            <div>
              <span className="font-bold text-slate-800">
                {new Date(interview.scheduledAt).toLocaleString('vi-VN', {
                  weekday: 'short',
                  day: '2-digit',
                  month: '2-digit',
                  year: 'numeric',
                  hour: '2-digit',
                  minute: '2-digit',
                })}
              </span>
              <span className="text-slate-500 ml-1.5">({interview.durationMinutes} phút)</span>
            </div>
          </div>

          {interview.locationOrLink && (
            <div className="flex items-center gap-2 bg-white/70 p-2.5 rounded-xl border border-blue-100/60 overflow-hidden">
              {interview.type === 'ONLINE' ? (
                <Video className="size-4 text-[#2563EB] shrink-0" />
              ) : (
                <MapPin className="size-4 text-[#2563EB] shrink-0" />
              )}
              <div className="truncate">
                {interview.locationOrLink.startsWith('http') ? (
                  <a
                    href={interview.locationOrLink}
                    target="_blank"
                    rel="noreferrer"
                    className="font-bold text-[#2563EB] hover:underline flex items-center gap-1"
                  >
                    Vào phòng họp trực tuyến <ExternalLink className="size-3" />
                  </a>
                ) : (
                  <span className="truncate text-slate-800" title={interview.locationOrLink}>
                    {interview.locationOrLink}
                  </span>
                )}
              </div>
            </div>
          )}
        </div>

        {/* HR Notes / Checklist */}
        {interview.interviewerNotes && (
          <div className="rounded-xl bg-white/80 p-3 border border-blue-100 text-xs text-slate-700 leading-relaxed">
            <span className="font-bold text-[#2563EB]">📌 Dặn dò từ Nhà tuyển dụng:</span>{' '}
            <span className="italic">{interview.interviewerNotes}</span>
          </div>
        )}

        {/* Reschedule Requested Details Banner */}
        {isRescheduled && (
          <div className="rounded-xl bg-orange-50/90 p-3 border border-orange-200 text-xs text-orange-900 space-y-1.5">
            <div className="flex items-center gap-1.5 font-bold text-orange-800">
              <CalendarClock className="size-4 text-orange-600" />
              Đã gửi đề xuất dời lịch tới Nhà tuyển dụng
            </div>
            {interview.candidateNotes && (
              <p className="text-orange-700">Lý do: {interview.candidateNotes}</p>
            )}
            {interview.proposedSlots && Array.isArray(interview.proposedSlots) && (
              <div className="text-[11px] text-orange-800">
                <span className="font-semibold">Khung giờ đề xuất:</span>{' '}
                {interview.proposedSlots
                  .map((s) => new Date(s).toLocaleString('vi-VN', { hour: '2-digit', minute: '2-digit', day: '2-digit', month: '2-digit' }))
                  .join(' | ')}
              </div>
            )}
            <p className="text-[10px] text-orange-600 italic">
              HR sẽ xem xét và cập nhật lại thời gian trong thời gian sớm nhất.
            </p>
          </div>
        )}

        {/* Candidate Declined Banner */}
        {isDeclined && (
          <div className="rounded-xl bg-slate-100 p-3 border border-slate-200 text-xs text-slate-600">
            <div className="flex items-center gap-1.5 font-bold text-slate-700">
              <XCircle className="size-4 text-slate-500" />
              Bạn đã từ chối buổi phỏng vấn này
            </div>
            {interview.candidateNotes && (
              <p className="mt-1 text-slate-500 text-[11px]">Lý do: {interview.candidateNotes}</p>
            )}
          </div>
        )}

        {/* Action Buttons & Calendar Tools */}
        <div className="flex flex-wrap items-center justify-between gap-2 pt-1">
          {/* Calendar Export Tool */}
          <div className="relative">
            <button
              type="button"
              onClick={() => setShowCalendarMenu(!showCalendarMenu)}
              className="flex items-center gap-1.5 rounded-xl border border-blue-200 bg-white px-3 py-1.5 text-xs font-bold text-[#2563EB] shadow-2xs hover:bg-blue-50 transition active:scale-95"
            >
              <Calendar className="size-3.5" />
              Thêm vào lịch
              <ChevronDown className="size-3 text-slate-400" />
            </button>

            {showCalendarMenu && (
              <div className="absolute left-0 bottom-full mb-1.5 z-20 w-52 rounded-xl border border-slate-200 bg-white p-1.5 shadow-xl animate-in fade-in zoom-in-95 duration-150">
                <button
                  type="button"
                  onClick={handleGoogleCalendar}
                  className="flex w-full items-center gap-2 rounded-lg px-2.5 py-1.5 text-xs font-semibold text-slate-700 hover:bg-blue-50 hover:text-[#2563EB] transition"
                >
                  <ExternalLink className="size-3.5" /> Google Calendar
                </button>
                <button
                  type="button"
                  onClick={handleDownloadIcs}
                  className="flex w-full items-center gap-2 rounded-lg px-2.5 py-1.5 text-xs font-semibold text-slate-700 hover:bg-blue-50 hover:text-[#2563EB] transition"
                >
                  <Download className="size-3.5" /> Tải file .ics (Outlook / Apple)
                </button>
              </div>
            )}
          </div>

          {/* RSVP Actions for Candidate */}
          <div className="flex items-center gap-2">
            {(isPending || isRescheduled) && (
              <>
                <button
                  type="button"
                  disabled={submittingAction !== null}
                  onClick={handleAccept}
                  className="flex items-center gap-1.5 rounded-xl bg-[#2563EB] px-3.5 py-1.5 text-xs font-bold text-white shadow-sm hover:bg-[#1d4ed8] active:scale-95 transition disabled:opacity-50"
                >
                  {submittingAction === 'ACCEPT' ? (
                    <Loader2 className="size-3.5 animate-spin" />
                  ) : (
                    <CheckCircle2 className="size-3.5" />
                  )}
                  {isRescheduled ? 'Giữ lịch cũ' : 'Xác nhận tham gia'}
                </button>

                {isPending && (
                  <button
                    type="button"
                    disabled={submittingAction !== null}
                    onClick={() => setIsRescheduleModalOpen(true)}
                    className="flex items-center gap-1 rounded-xl border border-slate-300 bg-white px-3 py-1.5 text-xs font-bold text-slate-700 hover:bg-slate-50 active:scale-95 transition"
                  >
                    <CalendarClock className="size-3.5 text-slate-500" />
                    Đề xuất dời lịch
                  </button>
                )}

                {isPending && (
                  <button
                    type="button"
                    disabled={submittingAction !== null}
                    onClick={handleDecline}
                    className="rounded-xl px-2.5 py-1.5 text-xs font-semibold text-slate-500 hover:text-rose-600 hover:bg-rose-50 transition"
                  >
                    {submittingAction === 'DECLINE' ? (
                      <Loader2 className="size-3.5 animate-spin" />
                    ) : (
                      'Từ chối'
                    )}
                  </button>
                )}
              </>
            )}

            {isAccepted && (
              <span className="flex items-center gap-1.5 text-xs font-bold text-emerald-700 bg-emerald-100/70 border border-emerald-200 px-3 py-1.5 rounded-xl">
                <CheckCircle2 className="size-4" /> Đã sẵn sàng tham gia
              </span>
            )}
          </div>
        </div>

        {/* Emergency HR Contact Footer */}
        {recruiterInfo && (recruiterInfo.email || recruiterInfo.phone) && (
          <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-blue-100/70 text-[11px] text-slate-500">
            <span className="flex items-center gap-1 text-slate-600">
              <User className="size-3 text-[#2563EB]" />
              HR phụ trách: <strong>{recruiterInfo.fullName || 'Nhà tuyển dụng'}</strong>
              {recruiterInfo.title && ` (${recruiterInfo.title})`}
            </span>
            <div className="flex items-center gap-3">
              {recruiterInfo.phone && (
                <a
                  href={`tel:${recruiterInfo.phone}`}
                  className="flex items-center gap-1 font-semibold text-[#2563EB] hover:underline"
                >
                  <Phone className="size-3" /> {recruiterInfo.phone}
                </a>
              )}
              {recruiterInfo.email && (
                <a
                  href={`mailto:${recruiterInfo.email}`}
                  className="flex items-center gap-1 font-semibold text-[#2563EB] hover:underline"
                >
                  <Mail className="size-3" /> {recruiterInfo.email}
                </a>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Reschedule Modal */}
      {isRescheduleModalOpen && (
        <CandidateRescheduleModal
          isOpen={isRescheduleModalOpen}
          onClose={() => setIsRescheduleModalOpen(false)}
          token={token}
          interviewId={interview.id}
          interviewTitle={interview.title}
          currentScheduledAt={interview.scheduledAt}
          onSuccess={onRefresh}
        />
      )}
    </>
  );
}
