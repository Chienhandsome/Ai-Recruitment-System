import type { Metadata } from 'next';
import Link from 'next/link';
import { redirect } from 'next/navigation';
import {
  ArrowRight,
  BriefcaseBusiness,
  Building2,
  CalendarDays,
  MapPin,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  type CandidateApplicationStage,
  getMyApplications,
} from '@/lib/candidate-api';
import { applicationStageLabels, applicationStageStyles } from '@/lib/application-stage';
import { CandidateApplicationInterviews } from '@/components/candidate/CandidateApplicationInterviews';
import { CandidateOfferCard } from '@/components/candidate/offers/CandidateOfferCard';
import { CandidatePremiumActions } from '@/components/candidate/CandidatePremiumActions';
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

function processingCopy(status: string) {
  if (status === 'COMPLETED') return 'Hồ sơ đã được tiếp nhận và phân tích.';
  if (status === 'FAILED') {
    return 'Hồ sơ đã tiếp nhận; nhà tuyển dụng sẽ xem xét thủ công.';
  }
  return 'Hồ sơ đã được tiếp nhận và đang được xử lý.';
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
    <div className="min-h-full bg-[#F8FAFC]">
      <div className="mx-auto w-full max-w-5xl px-4 py-8 sm:px-6 lg:px-8 lg:py-10">
        <header className="overflow-hidden rounded-2xl border border-[#BFDBFE]/70 bg-gradient-to-br from-[#EFF6FF] via-white to-white p-5 sm:p-6">
          <div className="flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between">
            <div className="min-w-0">
              <div className="inline-flex items-center gap-2 rounded-full border border-[#BFDBFE] bg-white/80 px-3 py-1 text-xs font-bold text-[#2563EB]">
                <BriefcaseBusiness className="size-3.5" strokeWidth={2} />
                {applications.meta.total} đơn ứng tuyển
              </div>
              <h1 className="mt-3 text-2xl font-extrabold tracking-tight text-[#1F2937] sm:text-3xl">
                Đơn ứng tuyển
              </h1>
              <p className="mt-1.5 max-w-xl text-sm leading-relaxed text-slate-600">
                Theo dõi tiến trình hồ sơ, phỏng vấn và công cụ AI hỗ trợ cho từng tin.
              </p>
            </div>
            <Button asChild className="shrink-0 bg-[#2563EB] hover:bg-[#1D4ED8]">
              <Link href="/candidate/jobs">
                Tìm việc khác
                <ArrowRight className="ml-1.5 size-4" />
              </Link>
            </Button>
          </div>

          <nav
            className="mt-5 -mx-1 flex gap-2 overflow-x-auto px-1 pb-1"
            aria-label="Lọc theo trạng thái"
          >
            <Link
              href={applicationsHref(undefined, 1)}
              className={`shrink-0 rounded-full border px-3.5 py-1.5 text-xs font-bold transition-colors ${
                !stage
                  ? 'border-[#2563EB] bg-[#2563EB] text-white'
                  : 'border-slate-200 bg-white text-slate-600 hover:border-[#93C5FD] hover:text-[#2563EB]'
              }`}
            >
              Tất cả
            </Link>
            {stages.map((value) => {
              const active = stage === value;
              return (
                <Link
                  key={value}
                  href={applicationsHref(value, 1)}
                  className={`shrink-0 rounded-full border px-3.5 py-1.5 text-xs font-bold transition-colors ${
                    active
                      ? 'border-[#2563EB] bg-[#2563EB] text-white'
                      : 'border-slate-200 bg-white text-slate-600 hover:border-[#93C5FD] hover:text-[#2563EB]'
                  }`}
                >
                  {applicationStageLabels[value]}
                </Link>
              );
            })}
          </nav>
        </header>

        {applications.data.length === 0 ? (
          <section className="mt-6 rounded-2xl border border-dashed border-slate-300 bg-white px-6 py-16 text-center">
            <div className="mx-auto flex size-14 items-center justify-center rounded-2xl bg-[#EFF6FF] text-[#2563EB]">
              <BriefcaseBusiness className="size-7" strokeWidth={1.6} />
            </div>
            <h2 className="mt-4 text-lg font-extrabold text-[#1F2937]">
              Chưa có đơn ứng tuyển
            </h2>
            <p className="mx-auto mt-2 max-w-md text-sm text-slate-600">
              Khám phá các vị trí phù hợp và gửi hồ sơ đầu tiên của bạn.
            </p>
            <Button asChild className="mt-5 bg-[#2563EB] hover:bg-[#1D4ED8]">
              <Link href="/candidate/jobs">Tìm việc làm</Link>
            </Button>
          </section>
        ) : (
          <section className="mt-6 space-y-4">
            {applications.data.map((application) => {
              const unread = application.hasUnreadUpdate;
              return (
                <article
                  key={application.id}
                  className={`overflow-hidden rounded-2xl border bg-white shadow-[0_1px_2px_rgba(15,23,42,0.04)] transition-shadow hover:shadow-[0_8px_24px_rgba(37,99,235,0.08)] ${
                    unread
                      ? 'border-[#93C5FD] ring-1 ring-[#BFDBFE]'
                      : 'border-slate-200'
                  }`}
                >
                  <div
                    className={`h-1 w-full ${
                      unread ? 'bg-[#2563EB]' : 'bg-gradient-to-r from-[#BFDBFE] to-transparent'
                    }`}
                  />

                  <div className="p-4 sm:p-5">
                    <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                      <div className="min-w-0 flex-1">
                        <div className="flex flex-wrap items-center gap-2">
                          <h2 className="text-base font-extrabold leading-snug text-[#1F2937] sm:text-lg">
                            {application.job.title}
                          </h2>
                          <span
                            className={`rounded-full border px-2.5 py-0.5 text-[11px] font-bold ${applicationStageStyles[application.currentStage]}`}
                          >
                            {applicationStageLabels[application.currentStage]}
                          </span>
                          {unread && (
                            <span className="inline-flex items-center gap-1.5 rounded-full border border-rose-200 bg-rose-50 px-2 py-0.5 text-[11px] font-extrabold text-rose-700">
                              <span className="size-1.5 rounded-full bg-rose-500" />
                              Cập nhật mới
                            </span>
                          )}
                        </div>

                        <div className="mt-2.5 flex flex-wrap gap-x-4 gap-y-1.5 text-xs text-slate-600 sm:text-sm">
                          <span className="inline-flex items-center gap-1.5">
                            <Building2 className="size-3.5 shrink-0 text-slate-400" />
                            <span className="font-medium">
                              {application.job.company?.name ?? 'Nhà tuyển dụng'}
                            </span>
                          </span>
                          {application.job.location && (
                            <span className="inline-flex items-center gap-1.5">
                              <MapPin className="size-3.5 shrink-0 text-slate-400" />
                              {application.job.location}
                            </span>
                          )}
                          <span className="inline-flex items-center gap-1.5">
                            <CalendarDays className="size-3.5 shrink-0 text-slate-400" />
                            Nộp {new Date(application.appliedAt).toLocaleDateString('vi-VN')}
                          </span>
                        </div>

                        <p className="mt-2 text-xs font-medium text-slate-500">
                          {processingCopy(application.processingStatus)}
                        </p>
                      </div>

                      <Button
                        asChild
                        variant="outline"
                        size="sm"
                        className="shrink-0 border-slate-200 font-semibold text-[#1F2937] hover:border-[#93C5FD] hover:bg-[#EFF6FF] hover:text-[#2563EB]"
                      >
                        <Link href={`/candidate/jobs/${application.job.id}`}>
                          Xem công việc
                          <ArrowRight className="ml-1 size-3.5" />
                        </Link>
                      </Button>
                    </div>

                    {application.offer && (
                      <div className="mt-4">
                        <CandidateOfferCard
                          offer={application.offer}
                          token={session.access_token}
                          jobTitle={application.job.title}
                          companyName={application.job.company?.name}
                        />
                      </div>
                    )}

                    {((application.interviews && application.interviews.length > 0) ||
                      (application.aiInterviewSessions &&
                        application.aiInterviewSessions.length > 0)) && (
                      <div className="mt-4">
                        <CandidateApplicationInterviews
                          interviews={application.interviews || []}
                          aiSessions={application.aiInterviewSessions || []}
                          token={session.access_token}
                          recruiterInfo={application.job.recruiter}
                        />
                      </div>
                    )}

                    <CandidatePremiumActions
                      jobId={application.job.id}
                      applicationId={application.id}
                      hasApplied
                      compact
                    />
                  </div>
                </article>
              );
            })}
          </section>
        )}

        {applications.meta.totalPages > 1 && (
          <nav
            className="mt-6 flex items-center justify-between rounded-xl border border-slate-200 bg-white px-3 py-2.5"
            aria-label="Phân trang đơn ứng tuyển"
          >
            {applications.meta.page > 1 ? (
              <Button asChild variant="outline" size="sm">
                <Link href={applicationsHref(stage, applications.meta.page - 1)}>
                  Trang trước
                </Link>
              </Button>
            ) : (
              <Button variant="outline" size="sm" disabled>
                Trang trước
              </Button>
            )}
            <span className="text-sm font-semibold text-slate-600">
              {applications.meta.page} / {applications.meta.totalPages}
            </span>
            {applications.meta.page < applications.meta.totalPages ? (
              <Button asChild variant="outline" size="sm">
                <Link href={applicationsHref(stage, applications.meta.page + 1)}>
                  Trang sau
                </Link>
              </Button>
            ) : (
              <Button variant="outline" size="sm" disabled>
                Trang sau
              </Button>
            )}
          </nav>
        )}
      </div>
    </div>
  );
}
