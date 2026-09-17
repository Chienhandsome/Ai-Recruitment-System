import Link from 'next/link';
import {
  ArrowUpRight,
  BriefcaseBusiness,
  CalendarDays,
  CheckCircle2,
  Clock3,
  MapPin,
  Sparkles,
  WalletCards,
} from 'lucide-react';
import type { CandidateJobSummary } from '@/lib/candidate-api';
import {
  employmentTypeLabels,
  formatJobDate,
  formatSalary,
  workingModelLabels,
} from '@/lib/job-display';
import { CompanyLogo } from '@/components/candidate/company-logo';

function matchTone(score: number) {
  if (score >= 80) {
    return {
      label: 'Rất phù hợp',
      className: 'border-emerald-200 bg-emerald-50 text-emerald-700',
    };
  }
  if (score >= 50) {
    return {
      label: 'Phù hợp',
      className: 'border-blue-200 bg-blue-50 text-blue-700',
    };
  }
  return {
    label: 'Có thể cân nhắc',
    className: 'border-amber-200 bg-amber-50 text-amber-700',
  };
}

export function JobCard({ job }: { job: CandidateJobSummary }) {
  const companyName = job.company?.name ?? 'Công ty tuyển dụng';
  const match = typeof job.matchScore === 'number' ? matchTone(job.matchScore) : null;

  return (
    <article className="group flex h-full min-h-[360px] min-w-0 max-w-full flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white p-5 shadow-[0_12px_35px_-32px_rgba(15,23,42,0.75)] transition-[border-color,box-shadow,transform] duration-200 hover:-translate-y-0.5 hover:border-blue-200 hover:shadow-[0_22px_48px_-34px_rgba(37,99,235,0.5)] motion-reduce:transform-none sm:p-6">
      <div className="flex items-start gap-3.5">
        <CompanyLogo
          name={companyName}
          logoUrl={job.company?.logoUrl}
          className="size-12 rounded-xl border-slate-200 bg-slate-50"
        />
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-start justify-between gap-x-3 gap-y-2">
            <p className="min-w-0 truncate pt-0.5 text-sm font-medium text-slate-500">{companyName}</p>
            {match && typeof job.matchScore === 'number' && job.matchScore > 0 && (
              <span className={`inline-flex shrink-0 items-center gap-1.5 rounded-lg border px-2.5 py-1 text-xs font-semibold ${match.className}`}>
                <Sparkles className="size-3.5" />
                <span className="font-mono">{job.matchScore}%</span>
                <span className="hidden 2xl:inline">{match.label}</span>
              </span>
            )}
          </div>
          <Link
            href={`/candidate/jobs/${job.id}`}
            className="mt-1.5 line-clamp-2 block text-lg font-bold leading-[1.35] tracking-[-0.015em] text-slate-950 outline-none transition-colors hover:text-[#1D4ED8] focus-visible:rounded-md focus-visible:ring-2 focus-visible:ring-[#2563EB] sm:text-xl xl:min-h-[3.4rem]"
          >
            {job.title}
          </Link>
        </div>
      </div>

      <div className="mt-5 grid gap-x-5 gap-y-3 border-y border-slate-100 py-4 text-sm text-slate-600 sm:grid-cols-2">
        <span className="flex min-w-0 items-center gap-2.5">
          <MapPin className="size-4 shrink-0 text-[#2563EB]" strokeWidth={1.8} />
          <span className="truncate">{job.location ?? 'Chưa cập nhật'}</span>
        </span>
        <span className="flex min-w-0 items-center gap-2.5">
          <BriefcaseBusiness className="size-4 shrink-0 text-[#2563EB]" strokeWidth={1.8} />
          <span className="truncate">{workingModelLabels[job.workingModel]}</span>
        </span>
        <span className="flex min-w-0 items-center gap-2.5">
          <WalletCards className="size-4 shrink-0 text-[#2563EB]" strokeWidth={1.8} />
          <span className="truncate font-semibold text-slate-800">
            {formatSalary(job.minSalary, job.maxSalary, job.currency)}
          </span>
        </span>
        <span className="flex min-w-0 items-center gap-2.5">
          <Clock3 className="size-4 shrink-0 text-[#2563EB]" strokeWidth={1.8} />
          <span className="truncate">Đăng {formatJobDate(job.publishedAt)}</span>
        </span>
      </div>

      {job.matchedSkills && job.matchedSkills.length > 0 && (
        <div className="mt-4 flex items-center gap-2 rounded-xl bg-blue-50 px-3 py-2 text-xs font-medium text-[#1D4ED8]">
          <CheckCircle2 className="size-4 shrink-0" strokeWidth={1.8} />
          <span className="truncate">
            Kỹ năng khớp: <strong className="font-semibold">{job.matchedSkills.join(', ')}</strong>
          </span>
        </div>
      )}

      <div className="mt-4 flex flex-wrap gap-2">
        <span className="rounded-lg bg-blue-50 px-2.5 py-1 text-xs font-semibold text-[#1D4ED8]">
          {employmentTypeLabels[job.employmentType]}
        </span>
        {job.category && (
          <span className="rounded-lg bg-slate-100 px-2.5 py-1 text-xs font-medium text-slate-600">
            {job.category.name}
          </span>
        )}
        {job.skills.slice(0, 2).map((skill) => (
          <span
            key={skill.id}
            className="max-w-full truncate rounded-lg border border-slate-200 px-2.5 py-1 text-xs font-medium text-slate-600"
          >
            {skill.name}
          </span>
        ))}
        {job.skills.length > 2 && (
          <span className="rounded-lg border border-slate-200 px-2.5 py-1 text-xs font-medium text-slate-500">
            +{job.skills.length - 2}
          </span>
        )}
      </div>

      <div className="mt-auto flex items-center justify-between gap-4 pt-5">
        <p className="flex min-w-0 items-center gap-1.5 text-xs text-slate-500">
          <CalendarDays className="size-3.5 shrink-0" strokeWidth={1.8} />
          <span className="truncate">
            Hạn nộp {job.expiryDate ? formatJobDate(job.expiryDate) : 'không giới hạn'}
          </span>
        </p>
        <Link
          href={`/candidate/jobs/${job.id}`}
          className="inline-flex shrink-0 items-center gap-1.5 rounded-xl px-3 py-2 text-sm font-semibold text-[#1D4ED8] outline-none transition-[background-color,transform] hover:bg-blue-50 focus-visible:ring-2 focus-visible:ring-[#2563EB] active:translate-y-px"
        >
          Xem vị trí
          <ArrowUpRight className="size-4 transition-transform duration-200 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 motion-reduce:transition-none" strokeWidth={1.8} />
        </Link>
      </div>
    </article>
  );
}
