import type { Metadata } from 'next';
import Link from 'next/link';
import { redirect } from 'next/navigation';
import {
  BriefcaseBusiness,
  Building2,
  Calendar,
  CalendarDays,
  Clock,
  MapPin,
  Video,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  type CandidateApplicationStage,
  getMyApplications,
} from '@/lib/candidate-api';
import { applicationStageLabels, applicationStageStyles } from '@/lib/application-stage';
import { interviewTypeLabels } from '@/lib/interview-api';
import { AutoMarkRead } from '@/components/candidate/AutoMarkRead';
import { CandidateApplicationInterviews } from '@/components/candidate/CandidateApplicationInterviews';
import { createClient } from '@/lib/supabase/server';

export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title: 'Đơn ứng tuyển | SmartRecruit AI',
  description: 'Theo dõi trạng thái các hồ sơ bạn đã ứng tuyển.',
};

type SearchParams = Promise<Record<string, string | string[] | undefined>>;

const stages = Object.keys(applicationStageLabels) as CandidateApplicationStage[];

function first(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] : value;
}

function applicationsHref(stage: CandidateApplicationStage | undefined, page: number) {
  const params = new URLSearchParams();
  if (stage) params.set('stage', stage);
  if (page > 1) params.set('page', String(page));
  return `/candidate/applications${params.size ? `?${params.toString()}` : ''}`;
}

export default async function CandidateApplicationsPage({
  searchParams,
}: {
  searchParams: SearchParams;
}) {
  const params = await searchParams;
  const rawStage = first(params.stage);
  const stage = stages.includes(rawStage as CandidateApplicationStage)
    ? (rawStage as CandidateApplicationStage)
    : undefined;
  const parsedPage = Number(first(params.page));
  const page = Number.isInteger(parsedPage) && parsedPage > 0 ? parsedPage : 1;

  const supabase = await createClient();
  const {
    data: { session },
  } = await supabase.auth.getSession();
  if (!session?.access_token) redirect('/login');

  const applications = await getMyApplications(session.access_token, {
    stage,
    page,
    limit: 20,
  });

  return (
    <div className="mx-auto w-full max-w-6xl px-4 py-8 sm:px-6 lg:px-8 lg:py-10">
      <header className="flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="flex items-center gap-2 text-sm font-semibold text-primary">
            <BriefcaseBusiness className="size-4" strokeWidth={1.8} />
            {applications.meta.total} đơn ứng tuyển
          </p>
          <h1 className="mt-2 text-3xl font-extrabold tracking-tight text-foreground">
            Hành trình ứng tuyển
          </h1>
          <p className="mt-2 max-w-2xl text-sm leading-relaxed text-muted-foreground">
            Theo dõi tiến trình xử lý hồ sơ. Ghi chú nội bộ và đánh giá chi tiết của recruiter không hiển thị tại đây.
          </p>
        </div>

        <form action="/candidate/applications" className="flex items-center gap-2">
          <select
            name="stage"
            defaultValue={stage ?? ''}
            className="h-10 rounded-md border border-input bg-background px-3 text-sm font-medium outline-none focus:border-ring focus:ring-2 focus:ring-ring/20"
          >
            <option value="">Tất cả trạng thái</option>
            {stages.map((value) => (
              <option key={value} value={value}>{applicationStageLabels[value]}</option>
            ))}
          </select>
          <Button type="submit" variant="outline">Lọc</Button>
        </form>
      </header>

      <AutoMarkRead />

      {applications.data.length === 0 ? (
        <section className="mt-8 rounded-2xl border bg-surface px-6 py-16 text-center">
          <BriefcaseBusiness className="mx-auto size-11 text-primary" strokeWidth={1.5} />
          <h2 className="mt-4 text-lg font-bold text-foreground">Chưa có đơn ứng tuyển</h2>
          <p className="mt-2 text-sm text-muted-foreground">
            Khám phá các vị trí phù hợp và gửi hồ sơ đầu tiên của bạn.
          </p>
          <Button asChild className="mt-5">
            <Link href="/candidate">Tìm việc làm</Link>
          </Button>
        </section>
      ) : (
        <section className="mt-8 grid gap-4">
          {applications.data.map((application) => (
            <article
              key={application.id}
              className={`rounded-2xl border p-5 shadow-sm transition-shadow hover:shadow-md ${
                application.hasUnreadUpdate
                  ? 'border-blue-300 bg-blue-50/30 ring-1 ring-blue-300'
                  : 'border-slate-200 bg-surface'
              }`}
            >
              <div className="flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <h2 className="truncate text-lg font-extrabold text-foreground">
                      {application.job.title}
                    </h2>
                    <span className={`rounded-full border px-2.5 py-1 text-xs font-bold ${applicationStageStyles[application.currentStage]}`}>
                      {applicationStageLabels[application.currentStage]}
                    </span>
                    {application.hasUnreadUpdate && (
                      <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-extrabold bg-rose-50 text-rose-700 border border-rose-200 shadow-2xs">
                        <span className="size-2 rounded-full bg-rose-500 animate-pulse" />
                        Cập nhật mới
                      </span>
                    )}
                  </div>
                  <div className="mt-3 flex flex-wrap gap-x-5 gap-y-2 text-sm text-muted-foreground">
                    <span className="flex items-center gap-1.5">
                      <Building2 className="size-4" />
                      {application.job.company?.name ?? 'Nhà tuyển dụng'}
                    </span>
                    {application.job.location && (
                      <span className="flex items-center gap-1.5">
                        <MapPin className="size-4" />
                        {application.job.location}
                      </span>
                    )}
                    <span className="flex items-center gap-1.5">
                      <CalendarDays className="size-4" />
                      Nộp ngày {new Date(application.appliedAt).toLocaleDateString('vi-VN')}
                    </span>
                  </div>
                  <p className="mt-3 text-xs font-semibold text-muted-foreground">
                    {application.processingStatus === 'COMPLETED'
                      ? 'Hồ sơ đã được tiếp nhận và phân tích.'
                      : application.processingStatus === 'FAILED'
                        ? 'Hồ sơ đã được tiếp nhận; nhà tuyển dụng sẽ xem xét thủ công.'
                        : 'Hồ sơ đã được tiếp nhận và đang được xử lý.'}
                  </p>

                  {/* Lịch phỏng vấn đa vòng & tương tác phản hồi 2 chiều */}
                  {application.interviews && application.interviews.length > 0 && (
                    <CandidateApplicationInterviews
                      interviews={application.interviews}
                      token={session.access_token}
                      recruiterInfo={application.job.recruiter}
                    />
                  )}
                </div>
                <Button asChild variant="outline" size="sm">
                  <Link href={`/candidate/jobs/${application.job.id}`}>Xem công việc</Link>
                </Button>
              </div>
            </article>
          ))}
        </section>
      )}

      {applications.meta.totalPages > 1 && (
        <nav className="mt-7 flex items-center justify-between rounded-xl border bg-surface p-3" aria-label="Phân trang đơn ứng tuyển">
          {applications.meta.page > 1 ? (
            <Button asChild variant="outline" size="sm">
              <Link href={applicationsHref(stage, applications.meta.page - 1)}>Trang trước</Link>
            </Button>
          ) : (
            <Button variant="outline" size="sm" disabled>Trang trước</Button>
          )}
          <span className="text-sm font-semibold text-muted-foreground">
            {applications.meta.page} / {applications.meta.totalPages}
          </span>
          {applications.meta.page < applications.meta.totalPages ? (
            <Button asChild variant="outline" size="sm">
              <Link href={applicationsHref(stage, applications.meta.page + 1)}>Trang sau</Link>
            </Button>
          ) : (
            <Button variant="outline" size="sm" disabled>Trang sau</Button>
          )}
        </nav>
      )}
    </div>
  );
}
