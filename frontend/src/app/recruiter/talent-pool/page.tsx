'use client';

import Link from 'next/link';
import { useEffect, useRef, useState } from 'react';
import { ArrowLeft, Lock, Search, Unlock, ChevronLeft, ChevronRight } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import {
  getMyEntitlement,
  searchTalentPool,
  unlockTalentProfile,
  getTalentProfile,
  type EntitlementStatus,
  type TalentPoolCard,
} from '@/lib/billing-api';

type Filters = { search: string; desiredTitle: string; skill: string };
const emptyFilters: Filters = { search: '', desiredTitle: '', skill: '' };

export default function TalentPoolPage() {
  const [token, setToken] = useState('');
  const [entitlement, setEntitlement] = useState<EntitlementStatus | null>(null);
  const [filters, setFilters] = useState(emptyFilters);
  const [applied, setApplied] = useState(emptyFilters);
  const [rows, setRows] = useState<TalentPoolCard[]>([]);
  const [meta, setMeta] = useState({ total: 0, page: 1, totalPages: 0 });
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const requestId = useRef(0);

  useEffect(() => {
    let cancelled = false;
    const boot = async () => {
      try {
        const {
          data: { session },
        } = await createClient().auth.getSession();
        if (!session?.access_token) throw new Error('Vui lòng đăng nhập.');
        const status = await getMyEntitlement(session.access_token, 'EMPLOYER');
        if (cancelled) return;
        setToken(session.access_token);
        setEntitlement(status);
        if (status.talentPoolAccess) {
          const result = await searchTalentPool(session.access_token, {});
          if (cancelled) return;
          setRows(result.data);
          setMeta(result.meta);
        }
      } catch (e) {
        if (!cancelled) setError(e instanceof Error ? e.message : 'Không tải được kho ứng viên.');
      } finally {
        if (!cancelled) setLoading(false);
      }
    };
    void boot();
    return () => {
      cancelled = true;
    };
  }, []);

  const loadPage = async (page: number, criteria = applied) => {
    if (!token) return;
    const id = ++requestId.current;
    setLoading(true);
    setError(null);
    setExpandedId(null);
    try {
      const result = await searchTalentPool(token, { ...criteria, page });
      if (id !== requestId.current) return;
      setRows(result.data);
      setMeta(result.meta);
      setApplied(criteria);
    } catch (e) {
      if (id !== requestId.current) return;
      setRows([]);
      setMeta({ total: 0, page: 1, totalPages: 0 });
      setError(e instanceof Error ? e.message : 'Tìm kiếm thất bại.');
    } finally {
      if (id === requestId.current) setLoading(false);
    }
  };

  const actOnProfile = async (row: TalentPoolCard, unlock: boolean) => {
    if (!token) return;
    setBusyId(row.id);
    setError(null);
    try {
      const updated = unlock
        ? await unlockTalentProfile(token, row.id)
        : await getTalentProfile(token, row.id);
      setRows((prev) => prev.map((item) => (item.id === row.id ? updated : item)));
      setExpandedId(row.id);
      if (unlock) setEntitlement(await getMyEntitlement(token, 'EMPLOYER'));
    } catch (e) {
      setError(
        e instanceof Error ? e.message : 'Không tải được hồ sơ. Hồ sơ có thể đã ngừng chia sẻ.',
      );
      // Recheck visibility so a withdrawn profile is removed from the current page.
      const result = await searchTalentPool(token, { ...applied, page: meta.page }).catch(
        () => null,
      );
      setRows(result?.data ?? []);
      if (result) setMeta(result.meta);
      setExpandedId(null);
    } finally {
      setBusyId(null);
    }
  };

  return (
    <div className="min-h-screen bg-[#F8FAFC] text-[#0F172A]">
      <div className="mx-auto max-w-5xl px-4 py-8 sm:px-6">
        <Link
          href="/recruiter/dashboard"
          className="mb-4 inline-flex items-center gap-2 text-sm font-medium text-slate-500 hover:text-slate-800"
        >
          <ArrowLeft className="size-4" /> Không gian tuyển dụng
        </Link>
        <h1 className="text-2xl font-semibold tracking-tight sm:text-3xl">
          Ứng viên đang tìm việc
        </h1>
        <p className="mt-2 max-w-2xl text-sm text-slate-600">
          Hồ sơ đã chủ động đồng ý hiển thị và còn thời hạn tìm việc. Thông tin liên hệ được mở khóa
          bằng hạn mức gói của bạn.
        </p>
        {entitlement && (
          <p className="mt-3 text-sm text-slate-600">
            Gói: <strong>{entitlement.packageName}</strong>
            {entitlement.talentPoolAccess
              ? ` · Còn ${entitlement.cvUnlockRemaining} lượt mở khóa`
              : ' · Chưa có quyền truy cập kho ứng viên'}
          </p>
        )}
        {error && (
          <p
            role="alert"
            className="mt-4 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700"
          >
            {error}
          </p>
        )}
        {loading && !entitlement && (
          <p role="status" className="mt-6 text-sm text-slate-500">
            Đang kiểm tra quyền truy cập...
          </p>
        )}
        {!loading && !entitlement && (
          <button
            type="button"
            onClick={() => window.location.reload()}
            className="mt-4 text-sm font-medium text-blue-600 underline"
          >
            Tải lại
          </button>
        )}
        {entitlement && !entitlement.talentPoolAccess && (
          <div className="mt-8 rounded-xl border border-amber-200 bg-amber-50 p-6">
            <p className="font-medium text-amber-900">Cần gói HR có quyền truy cập kho ứng viên.</p>
            <Link
              href="/recruiter/billing"
              className="mt-4 inline-flex rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white"
            >
              Xem gói dịch vụ
            </Link>
          </div>
        )}
        {entitlement?.talentPoolAccess && (
          <>
            <form
              onSubmit={(e) => {
                e.preventDefault();
                void loadPage(1, filters);
              }}
              className="mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-4"
            >
              {(
                [
                  { key: 'search', label: 'Từ khóa', placeholder: 'Tên, giới thiệu...' },
                  {
                    key: 'desiredTitle',
                    label: 'Vị trí mong muốn',
                    placeholder: 'Ví dụ: Backend Developer',
                  },
                  { key: 'skill', label: 'Kỹ năng', placeholder: 'Ví dụ: Java' },
                ] as const
              ).map((field) => (
                <label key={field.key} className="text-sm font-medium text-slate-700">
                  {field.label}
                  <input
                    value={filters[field.key]}
                    onChange={(e) =>
                      setFilters((prev) => ({ ...prev, [field.key]: e.target.value }))
                    }
                    maxLength={100}
                    placeholder={field.placeholder}
                    className="mt-1 w-full rounded-lg border border-slate-300 bg-white px-3 py-2.5 text-sm font-normal outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                  />
                </label>
              ))}
              <button
                type="submit"
                disabled={loading}
                className="inline-flex items-center justify-center gap-2 self-end rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-blue-700 disabled:opacity-50"
              >
                <Search className="size-4" /> Tìm ứng viên
              </button>
            </form>
            <div className="mt-5 flex items-center justify-between gap-3 text-sm text-slate-600">
              <span>{meta.total} hồ sơ phù hợp</span>
              <button
                type="button"
                disabled={loading}
                onClick={() => void loadPage(meta.page)}
                className="font-medium text-blue-600 hover:underline disabled:opacity-50"
              >
                Cập nhật danh sách
              </button>
            </div>
            <div className="mt-4 space-y-4" aria-busy={loading}>
              {loading ? (
                <p role="status" className="py-8 text-center text-sm text-slate-500">
                  Đang tải danh sách...
                </p>
              ) : (
                <>
                  {rows.length === 0 && !error && (
                    <div className="rounded-xl border border-dashed border-slate-300 p-8 text-center text-sm text-slate-600">
                      Chưa có ứng viên đang tìm việc phù hợp. Thử bỏ bớt bộ lọc hoặc quay lại sau.
                    </div>
                  )}
                  {rows.map((row) => (
                    <article
                      key={row.id}
                      className="rounded-xl border border-slate-200 bg-white p-5"
                    >
                      <div className="flex flex-wrap items-start justify-between gap-3">
                        <div>
                          <h2 className="text-lg font-semibold">{row.displayName}</h2>
                          <p className="text-sm text-slate-600">
                            {row.desiredTitle}
                            {row.locationHint ? ` · ${row.locationHint}` : ''}
                          </p>
                          <p className="mt-1 text-xs font-medium text-emerald-700">Đang tìm việc</p>
                        </div>
                        {row.contactUnlocked ? (
                          <span className="inline-flex items-center gap-1 text-xs font-medium text-emerald-700">
                            <Unlock className="size-4" /> Đã mở khóa liên hệ
                          </span>
                        ) : (
                          <button
                            type="button"
                            disabled={busyId !== null || (entitlement.cvUnlockRemaining ?? 0) <= 0}
                            onClick={() => void actOnProfile(row, true)}
                            className="inline-flex items-center gap-2 rounded-lg border border-slate-300 px-3 py-2 text-sm font-medium hover:bg-slate-50 disabled:opacity-50"
                          >
                            <Lock className="size-4" />
                            {busyId === row.id ? 'Đang xử lý...' : 'Mở khóa liên hệ'}
                          </button>
                        )}
                      </div>
                      {row.professionalSummary && (
                        <p className="mt-3 whitespace-pre-wrap text-sm text-slate-700">
                          {row.professionalSummary}
                        </p>
                      )}
                      <div className="mt-3 flex flex-wrap gap-2">
                        {row.skills.map((item) => (
                          <span
                            key={item.skill.id}
                            className="rounded-md bg-slate-100 px-2.5 py-1 text-xs text-slate-700"
                          >
                            {item.skill.name}
                          </span>
                        ))}
                      </div>
                      {row.contactUnlocked && row.contact ? (
                        <div className="mt-4 rounded-lg bg-slate-50 p-3 text-sm text-slate-700">
                          <p>Email: {row.contact.email}</p>
                          {row.contact.phone && <p>Điện thoại: {row.contact.phone}</p>}
                          {row.contact.linkedinUrl && (
                            <p className="break-all">LinkedIn: {row.contact.linkedinUrl}</p>
                          )}
                        </div>
                      ) : (
                        <p className="mt-3 text-xs text-slate-500">{row.privacyNote}</p>
                      )}
                      <button
                        type="button"
                        disabled={busyId !== null}
                        aria-expanded={expandedId === row.id}
                        onClick={() =>
                          expandedId === row.id
                            ? setExpandedId(null)
                            : void actOnProfile(row, false)
                        }
                        className="mt-4 text-sm font-medium text-blue-600 hover:underline disabled:opacity-50"
                      >
                        {expandedId === row.id ? 'Thu gọn hồ sơ' : 'Xem kinh nghiệm và học vấn'}
                      </button>
                      {expandedId === row.id && (
                        <div className="mt-4 grid gap-5 border-t border-slate-100 pt-4 sm:grid-cols-2">
                          <div>
                            <h3 className="text-sm font-semibold">Kinh nghiệm</h3>
                            {row.workExperiences?.length ? (
                              row.workExperiences.map((item, i) => (
                                <div key={i} className="mt-3 text-sm text-slate-600">
                                  <p className="font-medium text-slate-800">{item.positionTitle}</p>
                                  <p>{item.companyName}</p>
                                  {item.description && (
                                    <p className="mt-1 whitespace-pre-wrap">{item.description}</p>
                                  )}
                                </div>
                              ))
                            ) : (
                              <p className="mt-2 text-sm text-slate-500">
                                Chưa bổ sung kinh nghiệm.
                              </p>
                            )}
                          </div>
                          <div>
                            <h3 className="text-sm font-semibold">Học vấn</h3>
                            {row.educations?.length ? (
                              row.educations.map((item, i) => (
                                <div key={i} className="mt-3 text-sm text-slate-600">
                                  <p className="font-medium text-slate-800">{item.schoolName}</p>
                                  <p>{[item.degree, item.major].filter(Boolean).join(' · ')}</p>
                                </div>
                              ))
                            ) : (
                              <p className="mt-2 text-sm text-slate-500">Chưa bổ sung học vấn.</p>
                            )}
                          </div>
                        </div>
                      )}
                    </article>
                  ))}
                </>
              )}
            </div>
            {meta.totalPages > 1 && (
              <nav
                aria-label="Phân trang ứng viên"
                className="mt-6 flex items-center justify-center gap-4"
              >
                <button
                  type="button"
                  aria-label="Trang trước"
                  disabled={loading || meta.page <= 1}
                  onClick={() => void loadPage(meta.page - 1)}
                  className="rounded-lg border border-slate-300 p-2 disabled:opacity-40"
                >
                  <ChevronLeft className="size-4" />
                </button>
                <span className="text-sm">
                  Trang {meta.page} / {meta.totalPages}
                </span>
                <button
                  type="button"
                  aria-label="Trang sau"
                  disabled={loading || meta.page >= meta.totalPages}
                  onClick={() => void loadPage(meta.page + 1)}
                  className="rounded-lg border border-slate-300 p-2 disabled:opacity-40"
                >
                  <ChevronRight className="size-4" />
                </button>
              </nav>
            )}
            {entitlement.cvUnlockRemaining <= 0 && (
              <p className="mt-4 text-sm text-amber-800">
                Bạn đã hết lượt mở khóa. Vẫn có thể xem các hồ sơ đã mở khóa khi còn quyền truy cập
                kho ứng viên.{' '}
                <Link href="/recruiter/billing" className="underline">
                  Xem gói dịch vụ
                </Link>
              </p>
            )}
          </>
        )}
      </div>
    </div>
  );
}
