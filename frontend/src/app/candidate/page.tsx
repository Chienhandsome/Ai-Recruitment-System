import type { Metadata } from 'next';
import Link from 'next/link';
import {
  BriefcaseBusiness,
  ChevronDown,
  Search,
  SlidersHorizontal,
  Sparkles,
  Target,
} from 'lucide-react';
import { JobCard } from '@/components/candidate/job-card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  getCandidateJobCategories,
  getCandidateJobs,
  getCandidateRecommendedJobs,
  type CandidateEmploymentType,
  type CandidateJobCategory,
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
  if (tab) params.set('tab', tab);
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

  const activeFilterCount = [
    query.search,
    query.categoryId,
    query.employmentType,
    query.workingModel,
    query.location,
  ].filter(Boolean).length;
  const resetHref = isRecommendedTab ? '/candidate?tab=recommended' : '/candidate?tab=all';

  return (
    <div className="pb-14">
      <section className="border-b border-blue-100/80 bg-[linear-gradient(115deg,#f8fbff_0%,#eef5ff_55%,#f8fafc_100%)]">
        <div className="mx-auto grid w-full max-w-[1480px] gap-8 px-4 py-9 sm:px-6 sm:py-11 lg:grid-cols-[minmax(0,1fr)_320px] lg:items-end lg:px-8">
          <header className="max-w-3xl">
            <p className="flex items-center gap-2 text-sm font-semibold text-[#1D4ED8]">
              <BriefcaseBusiness className="size-4" strokeWidth={1.8} />
              {isRecommendedTab ? 'Cơ hội dành riêng cho bạn' : 'Cơ hội nghề nghiệp mới'}
            </p>
            <h1 className="mt-3 max-w-3xl text-3xl font-bold leading-[1.12] tracking-[-0.035em] text-slate-950 sm:text-4xl lg:text-[2.75rem]">
              {isRecommendedTab
                ? 'Công việc phù hợp với chuyên môn của bạn'
                : 'Tìm công việc đúng với định hướng của bạn'}
            </h1>
            <p className="mt-4 max-w-2xl text-base leading-7 text-slate-600">
              {isRecommendedTab
                ? 'Khám phá cơ hội được ưu tiên theo kỹ năng và kinh nghiệm trong hồ sơ.'
                : 'Tìm kiếm theo kỹ năng, hình thức làm việc và định hướng nghề nghiệp.'}
            </p>
          </header>

          <div className="hidden rounded-2xl border border-blue-100 bg-white/85 p-5 shadow-[0_18px_45px_-36px_rgba(37,99,235,0.65)] lg:block">
            <div className="flex items-center justify-between">
              <span className="flex size-10 items-center justify-center rounded-xl bg-blue-50 text-[#2563EB]">
                {isRecommendedTab ? <Target className="size-5" /> : <BriefcaseBusiness className="size-5" />}
              </span>
              {isRecommendedTab && (
                <span className="rounded-lg bg-blue-50 px-2.5 py-1 text-xs font-semibold text-[#1D4ED8]">
                  AI Matching
                </span>
              )}
            </div>
            <div className="mt-5 flex items-end gap-2">
              <strong className="font-mono text-4xl font-semibold tracking-tight text-slate-950">
                {jobs.meta.total}
              </strong>
              <span className="pb-1 text-sm font-medium text-slate-500">vị trí</span>
            </div>
            <p className="mt-1 text-sm text-slate-600">
              {isRecommendedTab ? 'được đề xuất từ hồ sơ của bạn' : 'đang mở nhận ứng viên'}
            </p>
          </div>
        </div>
      </section>

      <div className="mx-auto w-full max-w-[1480px] px-4 pt-6 sm:px-6 lg:px-8 lg:pt-8">
        <details className="group mb-5 rounded-2xl border bg-white shadow-sm lg:hidden">
          <summary className="flex cursor-pointer list-none items-center justify-between gap-4 px-4 py-3.5 [&::-webkit-details-marker]:hidden">
            <span className="flex items-center gap-2 text-sm font-semibold text-slate-900">
              <SlidersHorizontal className="size-4 text-[#2563EB]" strokeWidth={1.8} />
              Bộ lọc tìm kiếm
              {activeFilterCount > 0 && (
                <span className="flex size-5 items-center justify-center rounded-full bg-[#2563EB] text-[11px] font-bold text-white">
                  {activeFilterCount}
                </span>
              )}
            </span>
            <ChevronDown className="size-4 text-slate-500 transition-transform duration-200 group-open:rotate-180 motion-reduce:transition-none" />
          </summary>
          <div className="border-t px-4 py-5">
            <FilterForm
              query={query}
              categories={categories}
              activeTab={activeTab}
              resetHref={resetHref}
              idSuffix="mobile"
            />
          </div>
        </details>

        <div className="grid items-start gap-7 lg:grid-cols-[300px_minmax(0,1fr)] xl:gap-9">
          <aside className="sticky top-24 hidden rounded-2xl border bg-white p-5 shadow-[0_16px_42px_-38px_rgba(15,23,42,0.75)] lg:block">
            <div className="flex items-start justify-between gap-3">
              <div>
                <div className="flex items-center gap-2">
                  <SlidersHorizontal className="size-4 text-[#2563EB]" strokeWidth={1.8} />
                  <h2 className="font-bold text-slate-950">Bộ lọc</h2>
                </div>
                <p className="mt-1.5 text-xs leading-5 text-slate-500">
                  Thu hẹp kết quả theo nhu cầu của bạn.
                </p>
              </div>
              {activeFilterCount > 0 && (
                <span className="rounded-lg bg-blue-50 px-2 py-1 text-xs font-semibold text-[#1D4ED8]">
                  {activeFilterCount} đã chọn
                </span>
              )}
            </div>
            <div className="mt-5 border-t pt-5">
              <FilterForm
                query={query}
                categories={categories}
                activeTab={activeTab}
                resetHref={resetHref}
                idSuffix="desktop"
              />
            </div>
          </aside>

          <section aria-labelledby="job-results-heading" className="min-w-0">
            <div className="flex flex-col gap-4 border-b pb-5 sm:flex-row sm:items-end sm:justify-between">
              <div>
                <div className="flex flex-wrap items-center gap-2.5">
                  <h2 id="job-results-heading" className="text-xl font-bold tracking-tight text-slate-950 sm:text-2xl">
                    {isRecommendedTab ? 'Đề xuất nổi bật' : 'Việc làm mới nhất'}
                  </h2>
                  {isRecommendedTab && (
                    <span className="inline-flex items-center gap-1.5 rounded-lg bg-blue-50 px-2.5 py-1 text-xs font-semibold text-[#1D4ED8]">
                      <Sparkles className="size-3.5" />
                      Cá nhân hóa
                    </span>
                  )}
                </div>
                <p className="mt-1.5 text-sm text-slate-500">
                  {jobs.meta.total > 0
                    ? `${jobs.meta.total} cơ hội ${isRecommendedTab ? 'phù hợp với hồ sơ' : 'đang tuyển dụng'}`
                    : 'Chưa có kết quả phù hợp với lựa chọn hiện tại'}
                </p>
              </div>

              {session?.access_token && (
                <div className="inline-flex w-fit rounded-xl bg-slate-100 p-1 text-sm">
                  <Link
                    href={jobsHref(query, 1, 'recommended')}
                    className={`inline-flex items-center gap-1.5 rounded-lg px-3.5 py-2 text-sm font-semibold transition-[background-color,color,box-shadow,transform] active:translate-y-px ${
                      isRecommendedTab
                        ? 'bg-white text-[#1D4ED8] shadow-sm'
                        : 'text-slate-500 hover:text-slate-900'
                    }`}
                  >
                    <Sparkles className="size-3.5" />
                    Dành cho bạn
                  </Link>
                  <Link
                    href={jobsHref(query, 1, 'all')}
                    className={`inline-flex items-center rounded-lg px-3.5 py-2 text-sm font-semibold transition-[background-color,color,box-shadow,transform] active:translate-y-px ${
                      !isRecommendedTab
                        ? 'bg-white text-slate-900 shadow-sm'
                        : 'text-slate-500 hover:text-slate-900'
                    }`}
                  >
                    Tất cả việc làm
                  </Link>
                </div>
              )}
            </div>

            {jobs.data.length > 0 ? (
              <div className="mt-5 grid gap-5 2xl:grid-cols-2">
                {jobs.data.map((job) => (
                  <JobCard key={job.id} job={job} />
                ))}
              </div>
            ) : (
              <div className="mt-5 rounded-2xl border bg-white px-6 py-16 text-center shadow-[0_16px_42px_-38px_rgba(15,23,42,0.75)]">
                <span className="mx-auto flex size-12 items-center justify-center rounded-2xl bg-blue-50 text-[#2563EB]">
                  {isRecommendedTab ? <Sparkles className="size-6" /> : <BriefcaseBusiness className="size-6" />}
                </span>
                <h3 className="mt-5 text-lg font-bold text-slate-950">
                  {isRecommendedTab
                    ? 'Chưa tìm thấy công việc phù hợp với hồ sơ'
                    : 'Chưa tìm thấy công việc phù hợp'}
                </h3>
                <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-slate-500">
                  {isRecommendedTab
                    ? 'Cập nhật thêm kỹ năng hoặc vị trí mong muốn để nhận đề xuất chính xác hơn.'
                    : 'Thử từ khóa ngắn hơn hoặc bỏ bớt một vài điều kiện lọc.'}
                </p>
                <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
                  {isRecommendedTab && (
                    <Button asChild className="rounded-xl bg-[#2563EB] text-white hover:bg-[#1D4ED8] active:translate-y-px">
                      <Link href="/candidate/profile">Cập nhật hồ sơ</Link>
                    </Button>
                  )}
                  <Button asChild variant="outline" className="rounded-xl active:translate-y-px">
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
                className="mt-7 flex items-center justify-between rounded-2xl border bg-white p-3 shadow-sm"
              >
                {jobs.meta.page > 1 ? (
                  <Button asChild variant="outline" size="sm" className="rounded-xl">
                    <Link href={jobsHref(query, jobs.meta.page - 1, activeTab)}>Trang trước</Link>
                  </Button>
                ) : (
                  <Button variant="outline" size="sm" className="rounded-xl" disabled>
                    Trang trước
                  </Button>
                )}
                <span className="font-mono text-xs font-semibold text-slate-500">
                  {jobs.meta.page} / {jobs.meta.totalPages}
                </span>
                {jobs.meta.page < jobs.meta.totalPages ? (
                  <Button asChild variant="outline" size="sm" className="rounded-xl">
                    <Link href={jobsHref(query, jobs.meta.page + 1, activeTab)}>Trang sau</Link>
                  </Button>
                ) : (
                  <Button variant="outline" size="sm" className="rounded-xl" disabled>
                    Trang sau
                  </Button>
                )}
              </nav>
            )}
          </section>
        </div>
      </div>
    </div>
  );
}

function FilterForm({
  query,
  categories,
  activeTab,
  resetHref,
  idSuffix,
}: {
  query: CandidateJobQuery;
  categories: CandidateJobCategory[];
  activeTab: string;
  resetHref: string;
  idSuffix: string;
}) {
  return (
    <form action="/candidate" className="space-y-4">
      <div className="space-y-2">
        <label htmlFor={`search-${idSuffix}`} className="text-sm font-semibold text-slate-800">
          Từ khóa
        </label>
        <div className="relative">
          <Search
            className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-slate-400"
            strokeWidth={1.8}
          />
          <Input
            id={`search-${idSuffix}`}
            name="search"
            defaultValue={query.search}
            placeholder="Vị trí, công ty, kỹ năng"
            maxLength={100}
            className="h-11 rounded-xl border-slate-200 bg-slate-50 pl-9 text-slate-900 placeholder:text-slate-400 focus-visible:bg-white"
          />
        </div>
      </div>

      <FilterSelect id={`categoryId-${idSuffix}`} name="categoryId" label="Ngành nghề" defaultValue={query.categoryId}>
        <option value="">Tất cả ngành nghề</option>
        {categories.map((category) => (
          <option key={category.id} value={category.id}>
            {category.name}
          </option>
        ))}
      </FilterSelect>

      <FilterSelect id={`employmentType-${idSuffix}`} name="employmentType" label="Loại hình" defaultValue={query.employmentType}>
        <option value="">Tất cả loại hình</option>
        {employmentTypes.map((type) => (
          <option key={type} value={type}>
            {employmentTypeLabels[type]}
          </option>
        ))}
      </FilterSelect>

      <FilterSelect id={`workingModel-${idSuffix}`} name="workingModel" label="Hình thức làm việc" defaultValue={query.workingModel}>
        <option value="">Tất cả hình thức</option>
        {workingModels.map((model) => (
          <option key={model} value={model}>
            {workingModelLabels[model]}
          </option>
        ))}
      </FilterSelect>

      <div className="space-y-2">
        <label htmlFor={`location-${idSuffix}`} className="text-sm font-semibold text-slate-800">
          Địa điểm
        </label>
        <Input
          id={`location-${idSuffix}`}
          name="location"
          defaultValue={query.location}
          placeholder="Hồ Chí Minh, Hà Nội"
          maxLength={100}
          className="h-11 rounded-xl border-slate-200 bg-slate-50 text-slate-900 placeholder:text-slate-400 focus-visible:bg-white"
        />
      </div>

      <input type="hidden" name="tab" value={activeTab} />
      <div className="grid grid-cols-2 gap-2 pt-1">
        <Button type="submit" className="h-11 rounded-xl bg-[#2563EB] font-semibold text-white hover:bg-[#1D4ED8] active:translate-y-px">
          Áp dụng
        </Button>
        <Button asChild variant="outline" className="h-11 rounded-xl border-slate-200 bg-white active:translate-y-px">
          <Link href={resetHref}>Đặt lại</Link>
        </Button>
      </div>
    </form>
  );
}

function FilterSelect({
  id,
  name,
  label,
  defaultValue,
  children,
}: {
  id: string;
  name: string;
  label: string;
  defaultValue?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="space-y-2">
      <label htmlFor={id} className="text-sm font-semibold text-slate-800">
        {label}
      </label>
      <select
        id={id}
        name={name}
        defaultValue={defaultValue ?? ''}
        className="flex h-11 w-full rounded-xl border border-slate-200 bg-slate-50 px-3 text-sm text-slate-900 outline-none transition-colors focus:border-[#2563EB] focus:bg-white focus:ring-2 focus:ring-blue-100"
      >
        {children}
      </select>
    </div>
  );
}
