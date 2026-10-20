'use client';

import { useState } from 'react';
import { ArrowUpRight, CheckCircle2, Loader2, LockKeyhole, MapPin, UserRound } from 'lucide-react';
import type { TalentPoolCard } from '@/lib/billing-api';

export function TalentSkills({ skills }: { skills: TalentPoolCard['skills'] }) {
  const [expanded, setExpanded] = useState(false);
  return (
    <div className="flex flex-wrap gap-1.5">
      {(expanded ? skills : skills.slice(0, 5)).map(({ skill }) => (
        <span
          key={skill.id}
          className="rounded-md border border-slate-200 bg-slate-50 px-2 py-1 text-[11px] font-medium text-slate-600"
        >
          {skill.name}
        </span>
      ))}
      {skills.length > 5 && (
        <button
          type="button"
          onClick={() => setExpanded(!expanded)}
          className="rounded-md px-2 py-1 text-[11px] font-semibold text-blue-700 hover:bg-blue-50 focus-visible:outline-2 focus-visible:outline-blue-600"
        >
          {expanded ? 'Thu gọn' : `+${skills.length - 5} kỹ năng`}
        </button>
      )}
    </div>
  );
}

export function TalentCandidateCard({
  candidate,
  canUnlock,
  busy,
  disabled,
  onView,
  onUnlock,
}: {
  candidate: TalentPoolCard;
  canUnlock: boolean;
  busy: boolean;
  disabled: boolean;
  onView: () => void;
  onUnlock: () => void;
}) {
  const [expandedSummary, setExpandedSummary] = useState(false);
  return (
    <article className="flex min-w-0 flex-col rounded-2xl border border-slate-200 bg-white p-5 shadow-xs transition-colors hover:border-blue-200">
      <div className="flex items-start gap-3">
        <div className="flex size-11 shrink-0 items-center justify-center rounded-xl border border-blue-100 bg-blue-50 text-blue-600">
          <UserRound className="size-5" />
        </div>
        <div className="min-w-0 flex-1">
          <h2 className="break-words text-sm font-extrabold text-slate-900">
            {candidate.displayName}
          </h2>
          <p className="mt-0.5 break-words text-xs font-medium text-slate-600">
            {candidate.desiredTitle || 'Chưa cập nhật vị trí'}
          </p>
        </div>
        <span className="inline-flex shrink-0 items-center gap-1 rounded-md bg-emerald-50 px-2 py-1 text-[10px] font-bold text-emerald-700">
          <CheckCircle2 className="size-3" />
          <span className="hidden sm:inline">Đang tìm việc</span>
        </span>
      </div>
      {candidate.locationHint && (
        <p className="mt-3 flex items-center gap-1.5 text-xs text-slate-500">
          <MapPin className="size-3.5 shrink-0" />
          {candidate.locationHint}
        </p>
      )}
      <div className="my-4 flex-1">
        <p
          className={`whitespace-pre-wrap break-words text-xs leading-6 text-slate-600 ${expandedSummary ? '' : 'line-clamp-3'}`}
        >
          {candidate.professionalSummary || 'Ứng viên chưa bổ sung giới thiệu.'}
        </p>
        {candidate.professionalSummary && candidate.professionalSummary.length > 180 && (
          <button
            type="button"
            onClick={() => setExpandedSummary(!expandedSummary)}
            className="mt-1 text-xs font-semibold text-blue-700 hover:underline"
          >
            {expandedSummary ? 'Thu gọn' : 'Đọc thêm'}
          </button>
        )}
      </div>
      <TalentSkills skills={candidate.skills} />
      <div className="mt-5 flex flex-wrap items-center justify-between gap-3 border-t border-slate-100 pt-4">
        <button
          type="button"
          onClick={onView}
          disabled={disabled}
          className="inline-flex items-center gap-1 text-xs font-bold text-blue-700 hover:underline focus-visible:outline-2 focus-visible:outline-blue-600 disabled:opacity-50"
        >
          Xem hồ sơ
          <ArrowUpRight className="size-3.5" />
        </button>
        {candidate.contactUnlocked ? (
          <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-emerald-700">
            <CheckCircle2 className="size-3.5" />
            Đã mở liên hệ
          </span>
        ) : (
          <button
            type="button"
            onClick={onUnlock}
            disabled={!canUnlock || disabled}
            title={
              !canUnlock ? 'Bạn đã hết lượt mở khóa' : 'Mở thông tin liên hệ bằng 1 lượt trong gói'
            }
            className="inline-flex items-center justify-center gap-1.5 rounded-lg bg-[#2563EB] px-3 py-2 text-xs font-bold text-white transition-colors hover:bg-blue-700 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600 disabled:cursor-not-allowed disabled:bg-slate-100 disabled:text-slate-500"
          >
            {busy ? (
              <Loader2 className="size-3.5 animate-spin" />
            ) : (
              <LockKeyhole className="size-3.5" />
            )}
            {busy ? 'Đang mở...' : 'Mở liên hệ · 1 lượt'}
          </button>
        )}
      </div>
    </article>
  );
}

export function TalentPoolSkeleton() {
  return (
    <div
      role="status"
      aria-label="Đang tải danh sách ứng viên"
      className="grid gap-4 md:grid-cols-2 xl:grid-cols-3"
    >
      {Array.from({ length: 6 }, (_, i) => (
        <div
          key={i}
          aria-hidden="true"
          className="rounded-2xl border border-slate-200 bg-white p-5 motion-safe:animate-pulse"
        >
          <div className="flex gap-3">
            <div className="size-11 rounded-xl bg-slate-100" />
            <div className="flex-1 space-y-2 py-1">
              <div className="h-3 w-1/2 rounded bg-slate-100" />
              <div className="h-3 w-3/4 rounded bg-slate-100" />
            </div>
          </div>
          <div className="my-6 space-y-2">
            <div className="h-3 rounded bg-slate-100" />
            <div className="h-3 rounded bg-slate-100" />
            <div className="h-3 w-2/3 rounded bg-slate-100" />
          </div>
          <div className="flex gap-2">
            <div className="h-6 w-16 rounded bg-slate-100" />
            <div className="h-6 w-20 rounded bg-slate-100" />
          </div>
          <div className="mt-5 h-10 border-t border-slate-100" />
        </div>
      ))}
    </div>
  );
}
