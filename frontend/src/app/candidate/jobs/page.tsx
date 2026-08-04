import Link from 'next/link';
import { redirect } from 'next/navigation';
import { BriefcaseBusiness, Search, SlidersHorizontal } from 'lucide-react';
import { JobCard } from '@/components/candidate/job-card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  getCandidateJobCategories,
  getCandidateJobs,
  type CandidateEmploymentType,
  type CandidateJobQuery,
  type CandidateWorkingModel,
} from '@/lib/candidate-api';
import { employmentTypeLabels, workingModelLabels } from '@/lib/job-display';
import { createClient } from '@/lib/supabase/server';

export const dynamic = 'force-dynamic';

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

function jobsHref(query: CandidateJobQuery, page: number) {
  const params = new URLSearchParams();
  Object.entries({ ...query, page }).forEach(([key, value]) => {
    if (value !== undefined && value !== '' && key !== 'limit') {
      params.set(key, String(value));
    }
  });
  return `/candidate/jobs?${params.toString()}`;
}

export default async function CandidateJobsPage({
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
  if (!session?.access_token) redirect('/login');

  const [jobs, categories] = await Promise.all([
    getCandidateJobs(session.access_token, query),
    getCandidateJobCategories(),
  ]);

  return (
    <div className="mx-auto w-full max-w-7xl px-4 py-8 sm:px-6 lg:px-8 lg:py-10">
      <header className="max-w-3xl">
        <p className="flex items-center gap-2 text-sm font-semibold text-primary">
          <BriefcaseBusiness className="size-4" strokeWidth={1.8} />
          {jobs.meta.total} vị trí đang tuyển
        </p>
        <h1 className="mt-2 text-3xl font-extrabold tracking-tight text-foreground sm:text-4xl">
          Khám phá công việc phù hợp
        </h1>
        <p className="mt-3 max-w-2xl text-base leading-relaxed text-muted-foreground">
          Tìm kiếm cơ hội theo kỹ năng, hình thức làm việc và định hướng nghề nghiệp của bạn.
        </p>
      </header>

      <div className="mt-8 grid items-start gap-6 lg:grid-cols-[280px_minmax(0,1fr)]">
        <aside className="rounded-2xl border bg-surface p-5 lg:sticky lg:top-24">
          <div className="flex items-center gap-2">
            <SlidersHorizontal className="size-4 text-primary" strokeWidth={1.8} />
            <h2 className="font-bold text-foreground">Bộ lọc</h2>
          </div>

          <form action="/candidate/jobs" className="mt-5 space-y-4">
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

            <div className="grid grid-cols-2 gap-2 pt-1">
              <Button type="submit" className="active:translate-y-px">
                Áp dụng
              </Button>
              <Button asChild variant="outline">
                <Link href="/candidate/jobs">Đặt lại</Link>
              </Button>
            </div>
          </form>
        </aside>

        <section aria-labelledby="job-results-heading">
          <div className="flex items-end justify-between gap-4">
            <div>
              <h2 id="job-results-heading" className="text-xl font-bold text-foreground">
                Việc làm mới nhất
              </h2>
              <p className="mt-1 text-sm text-muted-foreground">
                Trang {jobs.meta.page} / {Math.max(jobs.meta.totalPages, 1)}
              </p>
            </div>
          </div>

          {jobs.data.length > 0 ? (
            <div className="mt-4 grid gap-4 xl:grid-cols-2">
              {jobs.data.map((job) => (
                <JobCard key={job.id} job={job} />
              ))}
            </div>
          ) : (
            <div className="mt-4 rounded-2xl border bg-surface px-6 py-14 text-center">
              <BriefcaseBusiness className="mx-auto size-10 text-primary" strokeWidth={1.5} />
              <h3 className="mt-4 text-lg font-bold text-foreground">
                Chưa tìm thấy công việc phù hợp
              </h3>
              <p className="mx-auto mt-2 max-w-md text-sm leading-relaxed text-muted-foreground">
                Hãy thử từ khóa ngắn hơn hoặc bỏ bớt một vài điều kiện lọc.
              </p>
              <Button asChild variant="outline" className="mt-5">
                <Link href="/candidate/jobs">Xem tất cả việc làm</Link>
              </Button>
            </div>
          )}

          {jobs.meta.totalPages > 1 && (
            <nav
              aria-label="Phân trang việc làm"
              className="mt-7 flex items-center justify-between rounded-xl border bg-surface p-3"
            >
              {jobs.meta.page > 1 ? (
                <Button asChild variant="outline" size="sm">
                  <Link href={jobsHref(query, jobs.meta.page - 1)}>Trang trước</Link>
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
                  <Link href={jobsHref(query, jobs.meta.page + 1)}>Trang sau</Link>
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
