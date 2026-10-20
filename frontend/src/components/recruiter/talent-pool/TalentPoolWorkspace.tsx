'use client';

import Link from 'next/link';
import { useEffect, useRef, useState } from 'react';
import {
  AlertCircle,
  ArrowRight,
  ChevronLeft,
  ChevronRight,
  Filter,
  Loader2,
  LockKeyhole,
  RotateCw,
  Search,
  SearchX,
  ShieldCheck,
  Users,
  Wallet,
  X,
} from 'lucide-react';
import { toast } from 'sonner';
import {
  getMyEntitlement,
  getTalentProfile,
  searchTalentPool,
  unlockTalentProfile,
  type EntitlementStatus,
  type TalentPoolCard,
} from '@/lib/billing-api';
import type { RecruiterProfileData } from '@/lib/recruiter-api';
import { RecruiterHeader } from '../RecruiterHeader';
import { RecruiterProfileModal } from '../RecruiterProfileModal';
import { TalentCandidateCard, TalentPoolSkeleton } from './TalentCandidateCard';
import { TalentProfileDrawer } from './TalentProfileDrawer';

type Filters = { search: string; desiredTitle: string; skill: string };
const emptyFilters: Filters = { search: '', desiredTitle: '', skill: '' };
const fields = [
  { key: 'search', label: 'Từ khóa', placeholder: 'Tên, giới thiệu...' },
  { key: 'desiredTitle', label: 'Vị trí mong muốn', placeholder: 'Ví dụ: Backend Developer' },
  { key: 'skill', label: 'Kỹ năng', placeholder: 'Ví dụ: Java, React...' },
] as const;
const message = (error: unknown, fallback: string) =>
  error instanceof Error ? error.message : fallback;

export function TalentPoolWorkspace({
  token,
  initialProfile,
}: {
  token: string;
  initialProfile: RecruiterProfileData | null;
}) {
  const [profile, setProfile] = useState(initialProfile);
  const [showProfile, setShowProfile] = useState(false);
  const [entitlement, setEntitlement] = useState<EntitlementStatus | null>(null);
  const [filters, setFilters] = useState(emptyFilters);
  const [applied, setApplied] = useState(emptyFilters);
  const [rows, setRows] = useState<TalentPoolCard[]>([]);
  const [meta, setMeta] = useState({ total: 0, page: 1, totalPages: 0 });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selected, setSelected] = useState<TalentPoolCard | null>(null);
  const [detailLoading, setDetailLoading] = useState(false);
  const [detailError, setDetailError] = useState<string | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [quotaStale, setQuotaStale] = useState(false);
  const listRequest = useRef(0);
  const detailRequest = useRef(0);
  const unlocking = useRef(false);
  const mounted = useRef(true);

  useEffect(() => {
    const list = listRequest;
    const detail = detailRequest;
    mounted.current = true;
    const id = ++listRequest.current;
    const boot = async () => {
      try {
        const status = await getMyEntitlement(token, 'EMPLOYER');
        if (!mounted.current || id !== listRequest.current) return;
        setEntitlement(status);
        if (status.talentPoolAccess) {
          const result = await searchTalentPool(token, {});
          if (!mounted.current || id !== listRequest.current) return;
          setRows(result.data);
          setMeta(result.meta);
        }
      } catch (e) {
        if (mounted.current && id === listRequest.current)
          setError(message(e, 'Không tải được kho ứng viên.'));
      } finally {
        if (mounted.current && id === listRequest.current) setLoading(false);
      }
    };
    void boot();
    return () => {
      mounted.current = false;
      list.current++;
      detail.current++;
    };
  }, [token]);

  const loadPage = async (page: number, criteria = applied) => {
    if (unlocking.current) return;
    const id = ++listRequest.current;
    setLoading(true);
    setError(null);
    setApplied(criteria);
    try {
      // Recheck rights and quota as packages may change while the page is open.
      const status = await getMyEntitlement(token, 'EMPLOYER');
      if (!mounted.current || id !== listRequest.current) return;
      setEntitlement(status);
      setQuotaStale(false);
      if (!status.talentPoolAccess) {
        setRows([]);
        setMeta({ total: 0, page: 1, totalPages: 0 });
        return;
      }
      const result = await searchTalentPool(token, { ...criteria, page });
      if (!mounted.current || id !== listRequest.current) return;
      setRows(result.data);
      setMeta(result.meta);
    } catch (e) {
      if (!mounted.current || id !== listRequest.current) return;
      setRows([]);
      setError(message(e, 'Không tải được danh sách ứng viên.'));
    } finally {
      if (mounted.current && id === listRequest.current) setLoading(false);
    }
  };

  const viewProfile = async (candidate: TalentPoolCard) => {
    const id = ++detailRequest.current;
    setSelected(candidate);
    setDetailLoading(true);
    setDetailError(null);
    try {
      const full = await getTalentProfile(token, candidate.id);
      if (mounted.current && id === detailRequest.current) {
        setSelected(full);
        setRows((prev) => prev.map((row) => (row.id === full.id ? full : row)));
      }
    } catch (e) {
      if (mounted.current && id === detailRequest.current) {
        // Do not retain previously unlocked contacts when access is no longer valid.
        setSelected({ ...candidate, contact: null, contactUnlocked: false });
        const text = message(e, 'Không tải được hồ sơ. Ứng viên có thể đã ngừng chia sẻ.');
        setDetailError(text);
        const result = await searchTalentPool(token, { ...applied, page: meta.page }).catch(
          () => null,
        );
        if (result && mounted.current && id === detailRequest.current) {
          setRows(result.data);
          setMeta(result.meta);
          if (!result.data.some((row) => row.id === candidate.id)) {
            setSelected(null);
            toast.error(text);
          }
        }
      }
    } finally {
      if (mounted.current && id === detailRequest.current) setDetailLoading(false);
    }
  };

  const unlockProfile = async (candidate: TalentPoolCard) => {
    if (unlocking.current || quotaStale || !entitlement || entitlement.cvUnlockRemaining <= 0)
      return;
    unlocking.current = true;
    setBusyId(candidate.id);
    setDetailError(null);
    const id = ++detailRequest.current;
    setSelected(candidate);
    setDetailLoading(false);
    try {
      const full = await unlockTalentProfile(token, candidate.id);
      if (!mounted.current) return;
      setRows((prev) => prev.map((row) => (row.id === full.id ? full : row)));
      if (id === detailRequest.current) setSelected(full);
      toast.success('Đã mở thông tin liên hệ. Xem lại hồ sơ này không mất thêm lượt.');
      // Never guess quota: another tab may have already unlocked this profile.
      try {
        const status = await getMyEntitlement(token, 'EMPLOYER');
        if (mounted.current) {
          setEntitlement(status);
          setQuotaStale(false);
        }
      } catch {
        if (mounted.current) setQuotaStale(true);
      }
    } catch (e) {
      if (!mounted.current) return;
      const text = message(e, 'Không thể mở liên hệ. Vui lòng thử lại.');
      toast.error(text);
      if (id === detailRequest.current) setDetailError(text);
      const [result, status] = await Promise.allSettled([
        searchTalentPool(token, { ...applied, page: meta.page }),
        getMyEntitlement(token, 'EMPLOYER'),
      ]);
      if (!mounted.current) return;
      if (result.status === 'fulfilled') {
        setRows(result.value.data);
        setMeta(result.value.meta);
        if (
          id === detailRequest.current &&
          !result.value.data.some((row) => row.id === candidate.id)
        ) {
          setSelected(null);
          setError(text);
        }
      }
      if (status.status === 'fulfilled') {
        setEntitlement(status.value);
        setQuotaStale(false);
      } else setQuotaStale(true);
    } finally {
      unlocking.current = false;
      if (mounted.current) setBusyId(null);
    }
  };

  const clearFilters = () => {
    setFilters(emptyFilters);
    void loadPage(1, emptyFilters);
  };
  const hasFilters = Object.values(applied).some((value) => value.trim());
  const canUnlock =
    !!entitlement?.talentPoolAccess && entitlement.cvUnlockRemaining > 0 && !quotaStale;
  const pending = loading || busyId !== null;

  return (
    <div className="min-h-dvh bg-[#F8FAFC] text-[#1F2937]">
      <RecruiterHeader
        token={token}
        profile={profile}
        activeSection="talent-pool"
        onOpenProfile={() => setShowProfile(true)}
      />
      <main className="mx-auto max-w-[1440px] space-y-5 px-4 py-6 sm:px-6">
        <section className="flex flex-col justify-between gap-5 rounded-2xl border border-slate-200 bg-white p-5 shadow-xs sm:p-6 lg:flex-row lg:items-center">
          <div className="flex items-start gap-3">
            <span className="flex size-11 shrink-0 items-center justify-center rounded-xl bg-[#2563EB] text-white">
              <Users className="size-5" />
            </span>
            <div>
              <h1 className="text-lg font-extrabold text-slate-900 sm:text-xl">Kho ứng viên</h1>
              <p className="mt-1 max-w-xl text-xs leading-6 text-slate-500">
                Khám phá ứng viên đang tìm việc, xem kinh nghiệm và kết nối với người phù hợp.
              </p>
            </div>
          </div>
          {entitlement ? (
            <div className="flex flex-wrap items-center gap-x-5 gap-y-3 rounded-xl border border-blue-100 bg-blue-50/60 px-4 py-3 lg:shrink-0">
              <div>
                <p className="text-[10px] font-semibold text-slate-500">Gói đang sử dụng</p>
                <p className="mt-1 text-xs font-extrabold text-slate-800">
                  {entitlement.packageName}
                </p>
              </div>
              {entitlement.talentPoolAccess && (
                <div className="border-l border-blue-100 pl-5">
                  <p className="text-[10px] font-semibold text-slate-500">Lượt mở liên hệ</p>
                  <p className="mt-0.5 text-lg font-extrabold tabular-nums text-blue-700">
                    {quotaStale ? '—' : entitlement.cvUnlockRemaining}
                    <span className="ml-1 text-[10px] font-medium text-slate-500">
                      {quotaStale ? 'Chờ cập nhật' : 'còn lại'}
                    </span>
                  </p>
                </div>
              )}
              <Link
                href="/recruiter/billing"
                className="inline-flex items-center gap-1 text-xs font-bold text-blue-700 hover:underline"
              >
                Quản lý gói
                <ArrowRight className="size-3.5" />
              </Link>
            </div>
          ) : (
            <div role="status" className="flex items-center gap-2 text-xs text-slate-500">
              <Loader2 className="size-4 animate-spin" />
              {loading ? 'Đang kiểm tra quyền truy cập...' : 'Chưa tải được thông tin gói'}
            </div>
          )}
        </section>

        {entitlement && !entitlement.talentPoolAccess ? (
          <section className="rounded-2xl border border-slate-200 bg-white px-6 py-14 text-center shadow-xs">
            <span className="mx-auto flex size-14 items-center justify-center rounded-2xl bg-blue-50 text-blue-600">
              <LockKeyhole className="size-6" />
            </span>
            <h2 className="mt-5 text-base font-extrabold text-slate-900">
              Mở rộng nguồn ứng viên cho đội ngũ của bạn
            </h2>
            <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-slate-500">
              Gói hiện tại chưa có quyền truy cập kho ứng viên. Xem các gói HR để tìm kiếm hồ sơ và
              mở thông tin liên hệ.
            </p>
            <Link
              href="/recruiter/billing"
              className="mt-6 inline-flex items-center gap-2 rounded-xl bg-blue-600 px-5 py-3 text-xs font-bold text-white hover:bg-blue-700"
            >
              Xem gói dịch vụ
              <ArrowRight className="size-4" />
            </Link>
          </section>
        ) : (
          <>
            <section
              aria-label="Bộ lọc ứng viên"
              className="rounded-2xl border border-slate-200 bg-white p-5 shadow-xs"
            >
              <div className="mb-4 flex items-center gap-2 text-xs font-extrabold text-slate-800">
                <Filter className="size-4 text-blue-600" />
                Tìm ứng viên phù hợp
              </div>
              <form
                onSubmit={(event) => {
                  event.preventDefault();
                  void loadPage(
                    1,
                    Object.fromEntries(
                      Object.entries(filters).map(([key, value]) => [key, value.trim()]),
                    ) as Filters,
                  );
                }}
                className="grid items-end gap-3 sm:grid-cols-2 lg:grid-cols-[1.2fr_1fr_1fr_auto]"
              >
                {fields.map((field) => (
                  <label
                    key={field.key}
                    htmlFor={`talent-${field.key}`}
                    className="text-[11px] font-bold text-slate-600"
                  >
                    {field.label}
                    <input
                      id={`talent-${field.key}`}
                      name={field.key}
                      value={filters[field.key]}
                      onChange={(event) =>
                        setFilters((prev) => ({ ...prev, [field.key]: event.target.value }))
                      }
                      maxLength={100}
                      disabled={pending || !entitlement}
                      placeholder={field.placeholder}
                      className="mt-2 block h-10 w-full rounded-xl border border-slate-200 bg-slate-50 px-3 text-xs font-normal text-slate-800 outline-none transition-colors placeholder:text-slate-500 focus:border-blue-500 focus:bg-white focus:ring-2 focus:ring-blue-100 disabled:opacity-60"
                    />
                  </label>
                ))}
                <button
                  type="submit"
                  disabled={pending || !entitlement}
                  className="inline-flex h-10 items-center justify-center gap-2 rounded-xl bg-[#2563EB] px-5 text-xs font-bold text-white hover:bg-blue-700 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600 disabled:opacity-50"
                >
                  <Search className="size-4" />
                  Tìm ứng viên
                </button>
              </form>
              {hasFilters && (
                <div className="mt-4 flex flex-wrap items-center gap-2 border-t border-slate-100 pt-3">
                  {fields
                    .filter(({ key }) => applied[key])
                    .map(({ key, label }) => (
                      <span
                        key={key}
                        className="max-w-full break-words rounded-lg bg-blue-50 px-2.5 py-1.5 text-[11px] text-blue-700"
                      >
                        {label}: <strong>{applied[key]}</strong>
                      </span>
                    ))}
                  <button
                    type="button"
                    onClick={clearFilters}
                    disabled={pending}
                    className="inline-flex items-center gap-1 rounded-lg px-2 py-1.5 text-[11px] font-semibold text-slate-500 hover:bg-slate-100 disabled:opacity-50"
                  >
                    <X className="size-3" />
                    Xóa bộ lọc
                  </button>
                </div>
              )}
            </section>

            {entitlement?.talentPoolAccess &&
              (entitlement.cvUnlockRemaining <= 0 || quotaStale) && (
                <div className="flex items-start gap-3 rounded-xl border border-amber-200 bg-amber-50 p-4 text-xs leading-5 text-amber-900">
                  <Wallet className="mt-0.5 size-4 shrink-0" />
                  <p>
                    {quotaStale
                      ? 'Đã xử lý yêu cầu nhưng chưa cập nhật được hạn mức. Làm mới danh sách để tiếp tục mở liên hệ.'
                      : 'Bạn đã hết lượt mở liên hệ. Vẫn có thể xem lại hồ sơ đã mở khi còn quyền truy cập kho ứng viên.'}{' '}
                    <Link href="/recruiter/billing" className="font-bold underline">
                      Xem gói dịch vụ
                    </Link>
                  </p>
                </div>
              )}

            <section aria-label="Kết quả tìm kiếm" aria-busy={loading}>
              <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
                <div className="flex items-center gap-2">
                  <h2 className="text-sm font-extrabold text-slate-800">Ứng viên đang tìm việc</h2>
                  <span
                    aria-live="polite"
                    className="rounded-md border border-slate-200 bg-white px-2 py-0.5 text-xs font-bold tabular-nums text-slate-500"
                  >
                    {loading || error ? '—' : meta.total}
                  </span>
                </div>
                <button
                  type="button"
                  disabled={pending}
                  onClick={() => void loadPage(meta.page)}
                  className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-600 hover:border-blue-200 hover:text-blue-700 focus-visible:outline-2 focus-visible:outline-blue-600 disabled:opacity-50"
                >
                  <RotateCw className={`size-3.5 ${loading ? 'animate-spin' : ''}`} />
                  Làm mới danh sách
                </button>
              </div>
              {error ? (
                <div
                  role="alert"
                  className="flex flex-col items-center rounded-2xl border border-rose-200 bg-white p-10 text-center"
                >
                  <AlertCircle className="size-8 text-rose-500" />
                  <h3 className="mt-3 text-sm font-bold text-slate-900">Không tải được dữ liệu</h3>
                  <p className="mt-2 max-w-lg text-xs leading-6 text-slate-600">{error}</p>
                  <button
                    type="button"
                    disabled={pending}
                    onClick={() => void loadPage(meta.page)}
                    className="mt-4 rounded-lg border border-slate-200 px-4 py-2 text-xs font-bold text-blue-700 hover:bg-blue-50 disabled:opacity-50"
                  >
                    Thử lại
                  </button>
                </div>
              ) : loading ? (
                <TalentPoolSkeleton />
              ) : rows.length ? (
                <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
                  {rows.map((candidate) => (
                    <TalentCandidateCard
                      key={candidate.id}
                      candidate={candidate}
                      canUnlock={canUnlock}
                      busy={busyId === candidate.id}
                      disabled={busyId !== null}
                      onView={() => void viewProfile(candidate)}
                      onUnlock={() => void unlockProfile(candidate)}
                    />
                  ))}
                </div>
              ) : (
                <div className="flex min-h-72 flex-col items-center justify-center rounded-2xl border border-slate-200 bg-white px-6 py-12 text-center shadow-xs">
                  <span className="flex size-14 items-center justify-center rounded-2xl border border-slate-100 bg-slate-50 text-slate-400">
                    {hasFilters ? <SearchX className="size-6" /> : <Users className="size-6" />}
                  </span>
                  <h3 className="mt-5 text-sm font-extrabold text-slate-900">
                    {hasFilters
                      ? 'Chưa tìm thấy ứng viên phù hợp'
                      : 'Chưa có ứng viên đang tìm việc'}
                  </h3>
                  <p className="mt-2 max-w-md text-xs leading-6 text-slate-500">
                    {hasFilters
                      ? 'Thử từ khóa khác hoặc bỏ bớt điều kiện để mở rộng kết quả tìm kiếm.'
                      : 'Hồ sơ sẽ xuất hiện khi ứng viên bật tìm việc và đồng ý chia sẻ. Bạn có thể quay lại kiểm tra sau.'}
                  </p>
                  {hasFilters && (
                    <button
                      type="button"
                      onClick={clearFilters}
                      className="mt-5 inline-flex items-center gap-2 rounded-xl border border-blue-200 bg-blue-50 px-4 py-2.5 text-xs font-bold text-blue-700 hover:bg-blue-100"
                    >
                      <X className="size-3.5" />
                      Xóa bộ lọc
                    </button>
                  )}
                </div>
              )}
              {!loading && !error && meta.totalPages > 1 && (
                <nav
                  aria-label="Phân trang ứng viên"
                  className="mt-5 flex items-center justify-between gap-3 rounded-xl border border-slate-200 bg-white px-4 py-3"
                >
                  <span className="text-xs text-slate-500">
                    Trang <strong className="text-slate-800">{meta.page}</strong> /{' '}
                    {meta.totalPages}
                  </span>
                  <div className="flex gap-2">
                    <button
                      type="button"
                      aria-label="Trang trước"
                      disabled={pending || meta.page <= 1}
                      onClick={() => void loadPage(meta.page - 1)}
                      className="rounded-lg border border-slate-200 p-2 hover:bg-slate-50 disabled:opacity-40"
                    >
                      <ChevronLeft className="size-4" />
                    </button>
                    <button
                      type="button"
                      aria-label="Trang sau"
                      disabled={pending || meta.page >= meta.totalPages}
                      onClick={() => void loadPage(meta.page + 1)}
                      className="rounded-lg border border-slate-200 p-2 hover:bg-slate-50 disabled:opacity-40"
                    >
                      <ChevronRight className="size-4" />
                    </button>
                  </div>
                </nav>
              )}
            </section>
            <p className="flex items-start gap-2 px-1 text-[11px] leading-5 text-slate-500">
              <ShieldCheck className="mt-0.5 size-3.5 shrink-0" />
              Chỉ hiển thị hồ sơ đã đồng ý chia sẻ và còn thời hạn tìm việc. Thông tin liên hệ được
              bảo vệ cho đến khi mở khóa.
            </p>
          </>
        )}
      </main>
      <TalentProfileDrawer
        candidate={selected}
        loading={detailLoading}
        unlocking={busyId !== null}
        canUnlock={canUnlock}
        error={detailError}
        onClose={() => {
          detailRequest.current++;
          setSelected(null);
          setDetailLoading(false);
        }}
        onRetry={() => {
          if (selected) void viewProfile(selected);
        }}
        onUnlock={() => {
          if (selected) void unlockProfile(selected);
        }}
      />
      <RecruiterProfileModal
        isOpen={showProfile}
        onClose={() => setShowProfile(false)}
        profile={profile}
        onProfileUpdated={setProfile}
      />
    </div>
  );
}
