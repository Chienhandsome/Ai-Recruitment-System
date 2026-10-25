'use client';

import Link from 'next/link';
import { useEffect, useRef } from 'react';
import {
  BriefcaseBusiness,
  CheckCircle2,
  ExternalLink,
  GraduationCap,
  Loader2,
  LockKeyhole,
  Mail,
  MapPin,
  Phone,
  ShieldCheck,
  Send,
  X,
} from 'lucide-react';
import type { TalentPoolCard } from '@/lib/billing-api';
import { TalentSkills } from './TalentCandidateCard';

function safeWebLink(value: string) {
  try {
    const url = new URL(value);
    return ['https:', 'http:'].includes(url.protocol) ? url.href : null;
  } catch {
    return null;
  }
}

function month(value: string) {
  const date = new Date(value);
  return Number.isNaN(date.getTime())
    ? ''
    : date.toLocaleDateString('vi-VN', { month: '2-digit', year: 'numeric' });
}

export function TalentProfileDrawer({
  candidate,
  loading,
  unlocking,
  canUnlock,
  error,
  onClose,
  onRetry,
  onUnlock,
  onInvite,
}: {
  candidate: TalentPoolCard | null;
  loading: boolean;
  unlocking: boolean;
  canUnlock: boolean;
  error: string | null;
  onClose: () => void;
  onRetry: () => void;
  onUnlock: () => void;
  onInvite: () => void;
}) {
  const dialog = useRef<HTMLDialogElement>(null);
  const open = candidate !== null;
  useEffect(() => {
    const element = dialog.current;
    if (!element || !open) return;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    if (!element.open) element.showModal();
    return () => {
      element.close();
      document.body.style.overflow = previousOverflow;
    };
  }, [open]);

  return (
    <dialog
      ref={dialog}
      aria-labelledby="talent-profile-title"
      onCancel={onClose}
      onClick={(event) => {
        if (event.target === event.currentTarget) onClose();
      }}
      className="fixed inset-0 m-0 ml-auto h-dvh max-h-dvh w-full max-w-none border-0 bg-transparent p-0 text-slate-700 backdrop:bg-slate-900/40 sm:max-w-xl"
    >
      {candidate && (
        <div className="flex h-full flex-col bg-white shadow-2xl">
          <header className="flex items-center justify-between gap-3 border-b border-slate-200 px-5 py-4 sm:px-6">
            <div>
              <p className="text-[11px] font-semibold text-slate-500">Kho ứng viên</p>
              <h2
                id="talent-profile-title"
                className="mt-0.5 text-base font-extrabold text-slate-900"
              >
                Chi tiết hồ sơ
              </h2>
            </div>
            <button
              type="button"
              autoFocus
              onClick={onClose}
              aria-label="Đóng hồ sơ"
              className="rounded-lg p-2 text-slate-500 hover:bg-slate-100 focus-visible:outline-2 focus-visible:outline-blue-600"
            >
              <X className="size-5" />
            </button>
          </header>
          <div
            className="flex-1 space-y-7 overflow-y-auto overscroll-contain p-5 sm:p-6"
            aria-busy={loading}
          >
            <section>
              <div className="mb-3 inline-flex items-center gap-1.5 rounded-md bg-emerald-50 px-2 py-1 text-[11px] font-bold text-emerald-700">
                <CheckCircle2 className="size-3.5" />
                Đang tìm việc
              </div>
              <h3 className="break-words text-xl font-extrabold text-slate-900">
                {candidate.displayName}
              </h3>
              <p className="mt-1 text-sm text-slate-600">{candidate.desiredTitle}</p>
              {candidate.locationHint && (
                <p className="mt-2 flex items-center gap-1.5 text-xs text-slate-500">
                  <MapPin className="size-3.5" />
                  {candidate.locationHint}
                </p>
              )}
              <p className="mt-4 whitespace-pre-wrap break-words text-sm leading-6 text-slate-600">
                {candidate.professionalSummary}
              </p>
            </section>
            {candidate.skills.length > 0 && (
              <section>
                <h3 className="mb-3 text-xs font-extrabold text-slate-900">Kỹ năng chuyên môn</h3>
                <TalentSkills key={candidate.id} skills={candidate.skills} />
              </section>
            )}
            <section className="rounded-xl border border-blue-100 bg-blue-50/60 p-4">
              <h3 className="flex items-center gap-2 text-xs font-extrabold text-slate-900">
                <ShieldCheck className="size-4 text-blue-600" />
                Thông tin liên hệ
              </h3>
              {candidate.contactUnlocked && candidate.contact ? (
                <div className="mt-3 space-y-3 text-sm">
                  <a
                    href={`mailto:${candidate.contact.email}`}
                    className="flex items-center gap-2 break-all text-blue-700 hover:underline"
                  >
                    <Mail className="size-4 shrink-0" />
                    {candidate.contact.email}
                  </a>
                  {candidate.contact.phone && (
                    <a
                      href={`tel:${candidate.contact.phone}`}
                      className="flex items-center gap-2 text-slate-700 hover:underline"
                    >
                      <Phone className="size-4" />
                      {candidate.contact.phone}
                    </a>
                  )}
                  {candidate.contact.address && (
                    <p className="flex items-start gap-2">
                      <MapPin className="mt-0.5 size-4 shrink-0" />
                      {candidate.contact.address}
                    </p>
                  )}
                  {(
                    [
                      ['LinkedIn', candidate.contact.linkedinUrl],
                      ['GitHub', candidate.contact.githubUrl],
                      ['Portfolio', candidate.contact.portfolioUrl],
                    ] as const
                  ).map(([label, value]) => {
                    const href = value ? safeWebLink(value) : null;
                    return href ? (
                      <a
                        key={label}
                        href={href}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1.5 rounded-md border border-blue-100 bg-white px-2.5 py-1.5 text-xs font-semibold text-blue-700 hover:bg-blue-50 mr-2"
                      >
                        {label}
                        <ExternalLink className="size-3" />
                      </a>
                    ) : null;
                  })}
                </div>
              ) : (
                <p className="mt-2 text-xs leading-5 text-slate-600">
                  {candidate.privacyNote ||
                    'Thông tin liên hệ được ẩn để bảo vệ quyền riêng tư. Mở khóa bằng 1 lượt trong gói của bạn.'}
                </p>
              )}
            </section>
            {error ? (
              <div
                role="alert"
                className="rounded-xl border border-rose-200 bg-rose-50 p-4 text-xs leading-5 text-rose-700"
              >
                {error}
                <button
                  type="button"
                  onClick={onRetry}
                  disabled={loading || unlocking}
                  className="ml-2 font-bold underline disabled:opacity-50"
                >
                  Thử lại
                </button>
              </div>
            ) : loading ? (
              <p role="status" className="flex items-center gap-2 text-xs text-slate-500">
                <Loader2 className="size-4 animate-spin" />
                Đang tải kinh nghiệm và học vấn...
              </p>
            ) : (
              <>
                <section>
                  <h3 className="mb-4 flex items-center gap-2 text-xs font-extrabold text-slate-900">
                    <BriefcaseBusiness className="size-4 text-blue-600" />
                    Kinh nghiệm làm việc
                  </h3>
                  {candidate.workExperiences?.length ? (
                    <div className="space-y-5 border-l-2 border-slate-100 pl-4">
                      {candidate.workExperiences.map((item, i) => (
                        <div key={i}>
                          <p className="text-sm font-bold text-slate-800">{item.positionTitle}</p>
                          <p className="mt-0.5 text-xs text-slate-600">{item.companyName}</p>
                          <p className="mt-1 text-[11px] text-slate-500">
                            {month(item.startDate)} –{' '}
                            {item.isCurrent
                              ? 'Hiện tại'
                              : item.endDate
                                ? month(item.endDate)
                                : 'Chưa cập nhật'}
                          </p>
                          {item.description && (
                            <p className="mt-2 whitespace-pre-wrap break-words text-xs leading-6 text-slate-600">
                              {item.description}
                            </p>
                          )}
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-xs text-slate-500">Chưa bổ sung kinh nghiệm.</p>
                  )}
                </section>
                <section>
                  <h3 className="mb-4 flex items-center gap-2 text-xs font-extrabold text-slate-900">
                    <GraduationCap className="size-4 text-blue-600" />
                    Học vấn
                  </h3>
                  <div className="space-y-4">
                    {candidate.educations?.length ? (
                      candidate.educations.map((item, i) => (
                        <div key={i}>
                          <p className="text-sm font-bold text-slate-800">{item.schoolName}</p>
                          <p className="mt-1 text-xs text-slate-600">
                            {[item.degree, item.major].filter(Boolean).join(' · ')}
                          </p>
                        </div>
                      ))
                    ) : (
                      <p className="text-xs text-slate-500">Chưa bổ sung học vấn.</p>
                    )}
                  </div>
                </section>
              </>
            )}
          </div>
          <footer className="border-t border-slate-200 bg-white p-5 sm:px-6">
            {candidate.contactUnlocked ? (
              <div className="space-y-3">
                <p className="flex items-center justify-center gap-2 text-xs font-semibold text-emerald-700">
                  <CheckCircle2 className="size-4" />
                  Đã mở liên hệ · Xem lại không mất lượt
                </p>
                <button
                  type="button"
                  onClick={onInvite}
                  disabled={loading || !!error || unlocking}
                  className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-blue-600 px-4 py-3 text-xs font-bold text-white hover:bg-blue-700 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600 disabled:opacity-50"
                >
                  <Send className="size-4" />
                  Mời ứng tuyển
                </button>
              </div>
            ) : (
              <>
                <button
                  type="button"
                  onClick={onUnlock}
                  disabled={!canUnlock || unlocking || loading || !!error}
                  className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-[#2563EB] px-4 py-3 text-xs font-bold text-white hover:bg-blue-700 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600 disabled:cursor-not-allowed disabled:bg-slate-100 disabled:text-slate-500"
                >
                  {unlocking ? (
                    <Loader2 className="size-4 animate-spin" />
                  ) : (
                    <LockKeyhole className="size-4" />
                  )}
                  {unlocking ? 'Đang mở liên hệ...' : 'Mở liên hệ · 1 lượt'}
                </button>
                {!canUnlock && (
                  <p className="mt-2 text-center text-xs text-slate-600">
                    Bạn đã hết lượt.{' '}
                    <Link
                      href="/recruiter/billing"
                      className="font-semibold text-blue-700 underline"
                    >
                      Xem gói dịch vụ
                    </Link>
                  </p>
                )}
              </>
            )}
          </footer>
        </div>
      )}
    </dialog>
  );
}
