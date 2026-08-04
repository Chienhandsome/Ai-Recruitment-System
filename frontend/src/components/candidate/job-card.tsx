import Link from 'next/link';
import { ArrowRight, BriefcaseBusiness, Clock3, MapPin, WalletCards } from 'lucide-react';
import type { CandidateJobSummary } from '@/lib/candidate-api';
import {
  employmentTypeLabels,
  formatJobDate,
  formatSalary,
  workingModelLabels,
} from '@/lib/job-display';
import { CompanyLogo } from '@/components/candidate/company-logo';

export function JobCard({ job }: { job: CandidateJobSummary }) {
  const companyName = job.company?.name ?? 'Công ty tuyển dụng';

  return (
    <article className="group flex h-full flex-col rounded-2xl border bg-surface p-5 transition-[border-color,box-shadow,transform] duration-200 hover:-translate-y-0.5 hover:border-primary/30 hover:shadow-[0_18px_45px_-32px_rgba(37,99,235,0.55)] motion-reduce:transform-none">
      <div className="flex items-start gap-3">
        <CompanyLogo name={companyName} logoUrl={job.company?.logoUrl} />
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-medium text-muted-foreground">{companyName}</p>
          <Link
            href={`/candidate/jobs/${job.id}`}
            className="mt-1 block text-lg font-bold leading-snug text-foreground outline-none transition-colors hover:text-primary focus-visible:rounded focus-visible:ring-2 focus-visible:ring-ring"
          >
            {job.title}
          </Link>
        </div>
      </div>

      <div className="mt-5 grid gap-2 text-sm text-muted-foreground sm:grid-cols-2">
        <span className="flex min-w-0 items-center gap-2">
          <MapPin className="size-4 shrink-0 text-primary" strokeWidth={1.8} />
          <span className="truncate">{job.location ?? 'Chưa cập nhật'}</span>
        </span>
        <span className="flex items-center gap-2">
          <BriefcaseBusiness className="size-4 shrink-0 text-primary" strokeWidth={1.8} />
          {workingModelLabels[job.workingModel]}
        </span>
        <span className="flex items-center gap-2">
          <WalletCards className="size-4 shrink-0 text-primary" strokeWidth={1.8} />
          <span className="truncate font-semibold text-foreground">
            {formatSalary(job.minSalary, job.maxSalary, job.currency)}
          </span>
        </span>
        <span className="flex items-center gap-2">
          <Clock3 className="size-4 shrink-0 text-primary" strokeWidth={1.8} />
          Đăng {formatJobDate(job.publishedAt)}
        </span>
      </div>

      <div className="mt-4 flex flex-wrap gap-2">
        <span className="rounded-md bg-secondary px-2.5 py-1 text-xs font-semibold text-secondary-foreground">
          {employmentTypeLabels[job.employmentType]}
        </span>
        {job.category && (
          <span className="rounded-md bg-muted px-2.5 py-1 text-xs font-medium text-muted-foreground">
            {job.category.name}
          </span>
        )}
        {job.skills.slice(0, 3).map((skill) => (
          <span
            key={skill.id}
            className="rounded-md border px-2.5 py-1 text-xs font-medium text-muted-foreground"
          >
            {skill.name}
          </span>
        ))}
      </div>

      <div className="mt-auto flex items-end justify-between gap-4 pt-5">
        <p className="text-xs text-muted-foreground">
          Hạn nộp: {job.expiryDate ? formatJobDate(job.expiryDate) : 'Không giới hạn'}
        </p>
        <Link
          href={`/candidate/jobs/${job.id}`}
          className="inline-flex shrink-0 items-center gap-1.5 rounded-md px-2 py-1 text-sm font-semibold text-primary outline-none transition-colors hover:bg-secondary focus-visible:ring-2 focus-visible:ring-ring active:translate-y-px"
        >
          Xem chi tiết
          <ArrowRight className="size-4" strokeWidth={1.8} />
        </Link>
      </div>
    </article>
  );
}
