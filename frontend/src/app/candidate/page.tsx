import type { Metadata } from 'next';
import Link from 'next/link';
import { redirect } from 'next/navigation';
import { BriefcaseBusiness, Search, SlidersHorizontal, Sparkles } from 'lucide-react';
import { JobCard } from '@/components/candidate/job-card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  getCandidateJobCategories,
  getCandidateJobs,
  getCandidateRecommendedJobs,
  type CandidateEmploymentType,
  type CandidateJobQuery,
  type CandidateWorkingModel,
} from '@/lib/candidate-api';
import { employmentTypeLabels, workingModelLabels } from '@/lib/job-display';
import { createClient } from '@/lib/supabase/server';

export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title: 'Việc làm | SmartRecruit AI',
  description: 'Tìm kiếm cơ hội việc làm phù hợp với kỹ năng và định hướng của bạn.',
};

type JobsSearchParams = Promise<Record<string, string | string[] | undefined>>;

const employmentTypes = Object.keys(employmentTypeLabels) as CandidateEmploymentType[];
const workingModels = Object.keys(workingModelLabels) as CandidateWorkingModel[];

function firstValue(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] : value;
}

function positiveInteger(value: string | undefined, fallback: number) {
  const parsed = Number(value);
  return Number.isInteger(parsed) && parsed > 0 ? parsed : fallback;
}

function enumValue<T extends string>(value: string | undefined, values: T[]) {
  return value && values.includes(value as T) ? (value as T) : undefined;
}

function jobsHref(query: CandidateJobQuery, page: number, tab?: string) {
  const params = new URLSearchParams();
  if (tab) {
    params.set('tab', tab);
  }
  Object.entries({ ...query, page }).forEach(([key, value]) => {
    if (value !== undefined && value !== '' && key !== 'limit') {
      params.set(key, String(value));
    }
  });
  return `/candidate?${params.toString()}`;
}

export default async function CandidateHomePage({
  searchParams,
}: {
  searchParams: JobsSearchParams;
}) {
  const params = await searchParams;
  const query: CandidateJobQuery = {
    search: firstValue(params.search)?.trim() || undefined,
    categoryId: firstValue(params.categoryId) || undefined,
    employmentType: enumValue(firstValue(params.employmentType), employmentTypes),
    workingModel: enumValue(firstValue(params.workingModel), workingModels),
    location: firstValue(params.location)?.trim() || undefined,
    page: positiveInteger(firstValue(params.page), 1),
    limit: 12,
  };

  const supabase = await createClient();
  const {
    data: { session },
  } = await supabase.auth.getSession();

  const rawTab = firstValue(params.tab);
  const activeTab = session?.access_token
    ? (rawTab === 'all' ? 'all' : 'recommended')
    : 'all';
  const isRecommendedTab = Boolean(session?.access_token && activeTab === 'recommended');

  const [jobs, categories] = await Promise.all([
    isRecommendedTab
      ? getCandidateRecommendedJobs(session?.access_token, query)
      : getCandidateJobs(session?.access_token, query),
    getCandidateJobCategories(),
  ]);

  return (
    <div className="mx-auto w-full max-w-7xl px-4 py-8 sm:px-6 lg:px-8 lg:py-10">
      <header className="max-w-3xl">
        <p className="flex items-center gap-2 text-sm font-semibold text-[#2563EB]">
          <BriefcaseBusiness className="size-4" strokeWidth={1.8} />
          {jobs.meta.total} {isRecommendedTab ? 'việc làm phù hợp với bạn' : 'vị trí đang tuyển'}
        </p>
        <h1 className="mt-2 text-3xl font-extrabold tracking-tight text-foreground sm:text-4xl">
          {isRecommendedTab ? 'Việc làm gợi ý cho chuyên môn của bạn' : 'Khám phá công việc phù hợp'}
        </h1>
        <p className="mt-3 max-w-2xl text-base leading-relaxed text-muted-foreground">
          {isRecommendedTab
            ? 'Hệ thống tự động lọc và ưu tiên các công việc phù hợp với kỹ năng và định hướng trong hồ sơ của bạn.'
            : 'Tìm kiếm cơ hội theo kỹ năng, hình thức làm việc và định hướng nghề nghiệp của bạn.'}
        </p>
      </header>

      <div className="mt-8 grid items-start gap-6 lg:grid-cols-[280px_minmax(0,1fr)]">
        <aside className="rounded-2xl border bg-surface p-5 lg:sticky lg:top-24">
          <div className="flex items-center gap-2">
            <SlidersHorizontal className="size-4 text-primary" strokeWidth={1.8} />
            <h2 className="font-bold text-foreground">Bộ lọc</h2>
          </div>

          <form action="/candidate" className="mt-5 space-y-4">
            <div className="space-y-2">
              <label htmlFor="search" className="text-sm font-semibold text-foreground">
                Từ khóa
              </label>
              <div className="relative">
                <Search
                  className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground"
                  strokeWidth={1.8}
                />
                <Input
                  id="search"
                  name="search"
                  defaultValue={query.search}
                  placeholder="Vị trí, công ty, kỹ năng"
                  maxLength={100}
                  className="pl-9"
                />
              </div>
            </div>

            <FilterSelect id="categoryId" label="Ngành nghề" defaultValue={query.categoryId}>
              <option value="">Tất cả ngành nghề</option>
              {categories.map((category) => (
                <option key={category.id} value={category.id}>
                  {category.name}
                </option>
              ))}
            </FilterSelect>

            <FilterSelect id="employmentType" label="Loại hình" defaultValue={query.employmentType}>
              <option value="">Tất cả loại hình</option>
              {employmentTypes.map((type) => (
                <option key={type} value={type}>
                  {employmentTypeLabels[type]}
                </option>
              ))}
            </FilterSelect>

            <FilterSelect
              id="workingModel"
              label="Hình thức làm việc"
              defaultValue={query.workingModel}
            >
              <option value="">Tất cả hình thức</option>
              {workingModels.map((model) => (
                <option key={model} value={model}>
                  {workingModelLabels[model]}
                </option>
              ))}
            </FilterSelect>

            <div className="space-y-2">
              <label htmlFor="location" className="text-sm font-semibold text-foreground">
                Địa điểm
              </label>
              <Input
                id="location"
                name="location"
                defaultValue={query.location}
                placeholder="Hồ Chí Minh, Hà Nội"
                maxLength={100}
              />
            </div>

            <input type="hidden" name="tab" value={activeTab} />
            <div className="grid grid-cols-2 gap-2 pt-1">
              <Button type="submit" className="active:translate-y-px">
                Áp dụng
              </Button>
              <Button asChild variant="outline">
                <Link href={isRecommendedTab ? '/candidate?tab=recommended' : '/candidate?tab=all'}>
                  Đặt lại
                </Link>
              </Button>
            </div>
          </form>
        </aside>

        <section aria-labelledby="job-results-heading">
          <div className="flex flex-col gap-4 border-b pb-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <div className="flex items-center gap-2">
                <h2 id="job-results-heading" className="text-xl font-bold text-foreground">
                  {isRecommendedTab ? 'Việc làm phù hợp với bạn' : 'Tất cả việc làm mới nhất'}
                </h2>
                {isRecommendedTab && (
                  <span className="inline-flex items-center gap-1 rounded-full bg-[#EFF6FF] px-2.5 py-0.5 text-xs font-bold text-[#2563EB]">
                    <Sparkles className="size-3" />
                    AI Matching
                  </span>
                )}
              </div>
              <p className="mt-1 text-sm text-muted-foreground">
                {isRecommendedTab
                  ? `Hệ thống gợi ý dựa trên kỹ năng và chuyên môn trong hồ sơ của bạn`
                  : `Trang ${jobs.meta.page} / ${Math.max(jobs.meta.totalPages, 1)}`}
              </p>
            </div>

            {session?.access_token && (
              <div className="inline-flex rounded-xl bg-secondary/80 p-1 text-sm">
                <Link
                  href={jobsHref(query, 1, 'recommended')}
                  className={`inline-flex items-center gap-1.5 rounded-lg px-3.5 py-1.5 text-sm font-semibold transition-all ${
                    isRecommendedTab
                      ? 'bg-background text-[#2563EB] shadow-sm'
                      : 'text-muted-foreground hover:text-foreground'
                  }`}
                >
                  <Sparkles className="size-3.5 text-[#2563EB]" />
                  Dành cho bạn
                </Link>
                <Link
                  href={jobsHref(query, 1, 'all')}
                  className={`inline-flex items-center gap-1.5 rounded-lg px-3.5 py-1.5 text-sm font-semibold transition-all ${
                    !isRecommendedTab
                      ? 'bg-background text-foreground shadow-sm'
                      : 'text-muted-foreground hover:text-foreground'
                  }`}
                >
                  Tất cả việc làm
                </Link>
              </div>
            )}
          </div>

          {jobs.data.length > 0 ? (
            <div className="mt-4 grid gap-4 xl:grid-cols-2">
              {jobs.data.map((job) => (
                <JobCard key={job.id} job={job} />
              ))}
            </div>
          ) : (
            <div className="mt-4 rounded-2xl border bg-surface px-6 py-14 text-center">
              {isRecommendedTab ? (
                <Sparkles className="mx-auto size-10 text-[#2563EB]" strokeWidth={1.5} />
              ) : (
                <BriefcaseBusiness className="mx-auto size-10 text-primary" strokeWidth={1.5} />
              )}
              <h3 className="mt-4 text-lg font-bold text-foreground">
                {isRecommendedTab
                  ? 'Chưa tìm thấy công việc phù hợp với hồ sơ'
                  : 'Chưa tìm thấy công việc phù hợp'}
              </h3>
              <p className="mx-auto mt-2 max-w-md text-sm leading-relaxed text-muted-foreground">
                {isRecommendedTab
                  ? 'Hãy cập nhật thêm kỹ năng hoặc vị trí mong muốn trong Hồ sơ cá nhân để nhận gợi ý chuẩn xác, hoặc duyệt toàn bộ việc làm.'
                  : 'Hãy thử từ khóa ngắn hơn hoặc bỏ bớt một vài điều kiện lọc.'}
              </p>
              <div className="mt-5 flex flex-wrap items-center justify-center gap-3">
                {isRecommendedTab && (
                  <Button asChild className="bg-[#2563EB] text-white hover:bg-[#1d4ed8]">
                    <Link href="/candidate/profile">Cập nhật hồ sơ cá nhân</Link>
                  </Button>
                )}
                <Button asChild variant="outline">
                  <Link href={jobsHref(query, 1, isRecommendedTab ? 'all' : undefined)}>
                    Xem tất cả việc làm
                  </Link>
                </Button>
              </div>
            </div>
          )}

          {jobs.meta.totalPages > 1 && (
            <nav
              aria-label="Phân trang việc làm"
              className="mt-7 flex items-center justify-between rounded-xl border bg-surface p-3"
            >
              {jobs.meta.page > 1 ? (
                <Button asChild variant="outline" size="sm">
                  <Link href={jobsHref(query, jobs.meta.page - 1, activeTab)}>Trang trước</Link>
                </Button>
              ) : (
                <Button variant="outline" size="sm" disabled>
                  Trang trước
                </Button>
              )}
              <span className="text-sm font-semibold text-muted-foreground">
                {jobs.meta.page} / {jobs.meta.totalPages}
              </span>
              {jobs.meta.page < jobs.meta.totalPages ? (
                <Button asChild variant="outline" size="sm">
                  <Link href={jobsHref(query, jobs.meta.page + 1, activeTab)}>Trang sau</Link>
                </Button>
              ) : (
                <Button variant="outline" size="sm" disabled>
                  Trang sau
                </Button>
              )}
            </nav>
          )}
        </section>
      </div>
    </div>
  );
}

function FilterSelect({
  id,
  label,
  defaultValue,
  children,
}: {
  id: string;
  label: string;
  defaultValue?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="space-y-2">
      <label htmlFor={id} className="text-sm font-semibold text-foreground">
        {label}
      </label>
      <select
        id={id}
        name={id}
        defaultValue={defaultValue ?? ''}
        className="flex h-10 w-full rounded-md border border-input bg-background px-3 text-sm text-foreground outline-none focus:border-ring focus:ring-2 focus:ring-ring/20"
      >
        {children}
      </select>
    </div>
  );
}
