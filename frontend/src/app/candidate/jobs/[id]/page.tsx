import Link from 'next/link';
import { notFound, redirect } from 'next/navigation';
import {
  ArrowLeft,
  BadgeCheck,
  BriefcaseBusiness,
  CalendarDays,
  CheckCircle2,
  Clock3,
  GraduationCap,
  MapPin,
  WalletCards,
} from 'lucide-react';
import { CompanyLogo } from '@/components/candidate/company-logo';
import { Button } from '@/components/ui/button';
import { CandidateApiError, getCandidateJobDetail } from '@/lib/candidate-api';
import {
  employmentTypeLabels,
  experienceLevelLabels,
  formatJobDate,
  formatSalary,
  workingModelLabels,
} from '@/lib/job-display';
import { createClient } from '@/lib/supabase/server';

export const dynamic = 'force-dynamic';

export default async function CandidateJobDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();
  const {
    data: { session },
  } = await supabase.auth.getSession();
  if (!session?.access_token) redirect('/login');

  let job;
  try {
    job = await getCandidateJobDetail(session.access_token, id);
  } catch (error) {
    if (error instanceof CandidateApiError && error.status === 404) notFound();
    throw error;
  }

  const companyName = job.company?.name ?? 'Công ty tuyển dụng';

  return (
    <div className="mx-auto w-full max-w-6xl px-4 py-8 sm:px-6 lg:px-8 lg:py-10">
      <Link
        href="/candidate/jobs"
        className="inline-flex items-center gap-2 rounded-md text-sm font-semibold text-muted-foreground outline-none transition-colors hover:text-primary focus-visible:ring-2 focus-visible:ring-ring"
      >
        <ArrowLeft className="size-4" strokeWidth={1.8} />
        Quay lại danh sách
      </Link>

      <div className="mt-5 rounded-2xl border bg-surface p-5 sm:p-7">
        <div className="flex flex-col gap-5 sm:flex-row sm:items-start">
          <CompanyLogo
            name={companyName}
            logoUrl={job.company?.logoUrl}
            className="size-16 rounded-2xl"
          />
          <div className="min-w-0 flex-1">
            <p className="font-semibold text-primary">{companyName}</p>
            <h1 className="mt-1 text-2xl font-extrabold tracking-tight text-foreground sm:text-3xl">
              {job.title}
            </h1>
            <div className="mt-4 flex flex-wrap gap-x-5 gap-y-2 text-sm text-muted-foreground">
              <span className="flex items-center gap-2">
                <MapPin className="size-4 text-primary" strokeWidth={1.8} />
                {job.location ?? 'Chưa cập nhật'}
              </span>
              <span className="flex items-center gap-2">
                <BriefcaseBusiness className="size-4 text-primary" strokeWidth={1.8} />
                {workingModelLabels[job.workingModel]}
              </span>
              <span className="flex items-center gap-2">
                <Clock3 className="size-4 text-primary" strokeWidth={1.8} />
                Đăng ngày {formatJobDate(job.publishedAt)}
              </span>
            </div>
          </div>
        </div>
      </div>

      <div className="mt-6 grid items-start gap-6 lg:grid-cols-[minmax(0,1fr)_320px]">
        <main className="space-y-5">
          <JobSection title="Mô tả công việc" content={job.description} />
          <JobSection title="Yêu cầu công việc" content={job.requirements} />
          <JobSection title="Quyền lợi" content={job.benefits} />

          <section className="rounded-2xl border bg-surface p-5 sm:p-6">
            <h2 className="text-lg font-bold text-foreground">Kỹ năng cần thiết</h2>
            {job.skills.length > 0 ? (
              <div className="mt-4 grid gap-3 sm:grid-cols-2">
                {job.skills.map((skill) => (
                  <div
                    key={skill.id}
                    className="flex items-start gap-3 rounded-xl bg-muted px-4 py-3"
                  >
                    <CheckCircle2
                      className="mt-0.5 size-4 shrink-0 text-primary"
                      strokeWidth={1.8}
                    />
                    <div>
                      <p className="text-sm font-semibold text-foreground">{skill.name}</p>
                      <p className="mt-0.5 text-xs text-muted-foreground">
                        {requirementLabel(skill.requirementType)}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="mt-3 text-sm text-muted-foreground">
                Nhà tuyển dụng chưa cung cấp danh sách kỹ năng cụ thể.
              </p>
            )}
          </section>

          {job.certificates.length > 0 && (
            <section className="rounded-2xl border bg-surface p-5 sm:p-6">
              <h2 className="text-lg font-bold text-foreground">Chứng chỉ ưu tiên</h2>
              <div className="mt-4 grid gap-3 sm:grid-cols-2">
                {job.certificates.map((certificate) => (
                  <div
                    key={certificate.id}
                    className="flex items-start gap-3 rounded-xl border px-4 py-3"
                  >
                    <BadgeCheck className="mt-0.5 size-5 shrink-0 text-primary" strokeWidth={1.8} />
                    <div>
                      <p className="text-sm font-semibold text-foreground">{certificate.name}</p>
                      <p className="mt-0.5 text-xs text-muted-foreground">
                        {requirementLabel(certificate.requirementType)}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </section>
          )}
        </main>

        <aside className="space-y-4 lg:sticky lg:top-24">
          <section className="rounded-2xl border bg-surface p-5">
            <h2 className="font-bold text-foreground">Thông tin vị trí</h2>
            <dl className="mt-4 space-y-4">
              <JobFact
                icon={<WalletCards />}
                label="Mức lương"
                value={formatSalary(job.minSalary, job.maxSalary, job.currency)}
              />
              <JobFact
                icon={<BriefcaseBusiness />}
                label="Loại hình"
                value={employmentTypeLabels[job.employmentType]}
              />
              <JobFact
                icon={<GraduationCap />}
                label="Cấp độ"
                value={experienceLevelLabels[job.experienceLevel] ?? job.experienceLevel}
              />
              <JobFact
                icon={<CalendarDays />}
                label="Hạn nộp"
                value={job.expiryDate ? formatJobDate(job.expiryDate) : 'Không giới hạn'}
              />
            </dl>
          </section>

          <section className="rounded-2xl border bg-secondary p-5">
            <h2 className="font-bold text-foreground">Chuẩn bị hồ sơ nổi bật</h2>
            <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
              Cập nhật CV và kỹ năng để sẵn sàng khi tính năng ứng tuyển được mở.
            </p>
            <Button asChild className="mt-4 w-full active:translate-y-px">
              <Link href="/candidate/profile">Cập nhật hồ sơ</Link>
            </Button>
          </section>
        </aside>
      </div>
    </div>
  );
}

function JobSection({ title, content }: { title: string; content: string | null }) {
  return (
    <section className="rounded-2xl border bg-surface p-5 sm:p-6">
      <h2 className="text-lg font-bold text-foreground">{title}</h2>
      <p className="mt-3 whitespace-pre-line text-sm leading-7 text-muted-foreground">
        {content?.trim() || 'Nhà tuyển dụng chưa cập nhật nội dung này.'}
      </p>
    </section>
  );
}

function JobFact({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
  return (
    <div className="flex items-start gap-3">
      <span className="mt-0.5 text-primary [&_svg]:size-4 [&_svg]:stroke-[1.8]">{icon}</span>
      <div>
        <dt className="text-xs font-medium text-muted-foreground">{label}</dt>
        <dd className="mt-0.5 text-sm font-semibold text-foreground">{value}</dd>
      </div>
    </div>
  );
}

function requirementLabel(value: string) {
  if (value === 'MANDATORY') return 'Bắt buộc';
  if (value === 'PREFERRED') return 'Ưu tiên';
  return 'Điểm cộng';
}
