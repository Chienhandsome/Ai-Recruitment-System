"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { ArrowLeft, Lock, Search, Unlock } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import {
  getMyEntitlement,
  searchTalentPool,
  unlockTalentProfile,
  type EntitlementStatus,
  type TalentPoolCard,
} from "@/lib/billing-api";

export default function TalentPoolPage() {
  const [token, setToken] = useState("");
  const [entitlement, setEntitlement] = useState<EntitlementStatus | null>(
    null,
  );
  const [search, setSearch] = useState("");
  const [rows, setRows] = useState<TalentPoolCard[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [unlockingId, setUnlockingId] = useState<string | null>(null);

  useEffect(() => {
    const boot = async () => {
      const supabase = createClient();
      const {
        data: { session },
      } = await supabase.auth.getSession();
      if (!session?.access_token) {
        setError("Vui lòng đăng nhập.");
        setLoading(false);
        return;
      }
      setToken(session.access_token);
      try {
        const status = await getMyEntitlement(session.access_token, "EMPLOYER");
        setEntitlement(status);
        if (status.talentPoolAccess) {
          const result = await searchTalentPool(session.access_token, {});
          setRows(result.data);
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : "Không tải được kho CV.");
      } finally {
        setLoading(false);
      }
    };
    void boot();
  }, []);

  const runSearch = async () => {
    if (!token) return;
    setLoading(true);
    setError(null);
    try {
      const result = await searchTalentPool(token, { search });
      setRows(result.data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Tìm kiếm thất bại.");
    } finally {
      setLoading(false);
    }
  };

  const unlock = async (id: string) => {
    if (!token) return;
    setUnlockingId(id);
    setError(null);
    try {
      const updated = await unlockTalentProfile(token, id);
      setRows((prev) => prev.map((row) => (row.id === id ? updated : row)));
      const status = await getMyEntitlement(token, "EMPLOYER");
      setEntitlement(status);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Mở khóa thất bại.");
    } finally {
      setUnlockingId(null);
    }
  };

  return (
    <div className="min-h-screen bg-[#F8FAFC] text-[#0F172A]">
      <div className="mx-auto max-w-5xl px-4 py-8 sm:px-6">
        <Link
          href="/recruiter/billing"
          className="mb-4 inline-flex items-center gap-2 text-sm font-medium text-slate-500 hover:text-slate-800"
        >
          <ArrowLeft className="h-4 w-4" /> Gói dịch vụ
        </Link>
        <h1 className="text-3xl font-semibold tracking-tight">
          Kho ứng viên công khai
        </h1>
        <p className="mt-2 max-w-2xl text-sm text-slate-600">
          Chỉ hiển thị hồ sơ ứng viên đã bật công khai. Thông tin liên hệ bị ẩn
          cho đến khi bạn mở khóa bằng gói Premium.
        </p>

        {entitlement && (
          <p className="mt-3 text-sm text-slate-600">
            Gói: <strong>{entitlement.packageName}</strong>
            {entitlement.talentPoolAccess
              ? ` · Còn ${entitlement.cvUnlockRemaining} lượt mở khóa`
              : " · Cần HR Premium để tìm/mở khóa CV"}
          </p>
        )}

        {!entitlement?.talentPoolAccess ? (
          <div className="mt-8 rounded-2xl border border-amber-200 bg-amber-50 p-6">
            <p className="font-medium text-amber-900">
              Tính năng này thuộc gói HR Premium.
            </p>
            <Link
              href="/recruiter/billing"
              className="mt-4 inline-flex rounded-xl bg-slate-900 px-4 py-2 text-sm font-semibold text-white"
            >
              Nâng cấp gói
            </Link>
          </div>
        ) : (
          <>
            <div className="mt-6 flex gap-2">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                <input
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Tìm theo tên, chức danh, tóm tắt..."
                  className="w-full rounded-xl border border-slate-200 bg-white py-2.5 pl-10 pr-3 text-sm outline-none focus:border-slate-400"
                />
              </div>
              <button
                type="button"
                onClick={() => void runSearch()}
                className="rounded-xl bg-slate-900 px-4 py-2.5 text-sm font-semibold text-white"
              >
                Tìm
              </button>
            </div>

            {error && (
              <p className="mt-4 rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
                {error}
              </p>
            )}

            <div className="mt-6 space-y-4">
              {loading && (
                <p className="text-sm text-slate-500">Đang tải...</p>
              )}
              {!loading && rows.length === 0 && (
                <p className="text-sm text-slate-500">
                  Chưa có hồ sơ công khai phù hợp.
                </p>
              )}
              {rows.map((row) => (
                <article
                  key={row.id}
                  className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm"
                >
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div>
                      <h2 className="text-lg font-semibold">{row.displayName}</h2>
                      <p className="text-sm text-slate-600">
                        {row.desiredTitle || "Chưa nêu vị trí mong muốn"}
                        {row.locationHint ? ` · ${row.locationHint}` : ""}
                      </p>
                    </div>
                    {row.contactUnlocked ? (
                      <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-700">
                        <Unlock className="h-3.5 w-3.5" /> Đã mở khóa
                      </span>
                    ) : (
                      <button
                        type="button"
                        disabled={unlockingId === row.id}
                        onClick={() => void unlock(row.id)}
                        className="inline-flex items-center gap-1 rounded-xl border border-slate-200 px-3 py-1.5 text-xs font-semibold hover:bg-slate-50 disabled:opacity-50"
                      >
                        <Lock className="h-3.5 w-3.5" />
                        {unlockingId === row.id ? "Đang mở..." : "Mở khóa liên hệ"}
                      </button>
                    )}
                  </div>
                  {row.professionalSummary && (
                    <p className="mt-3 text-sm text-slate-700">
                      {row.professionalSummary}
                    </p>
                  )}
                  <div className="mt-3 flex flex-wrap gap-2">
                    {row.skills.map((skill) => (
                      <span
                        key={skill.skill.id}
                        className="rounded-full bg-slate-100 px-2.5 py-1 text-xs font-medium text-slate-700"
                      >
                        {skill.skill.name}
                      </span>
                    ))}
                  </div>
                  {row.contactUnlocked && row.contact ? (
                    <div className="mt-4 rounded-xl bg-slate-50 p-3 text-sm text-slate-700">
                      <p>Email: {row.contact.email}</p>
                      {row.contact.phone && <p>Phone: {row.contact.phone}</p>}
                      {row.contact.linkedinUrl && (
                        <p>LinkedIn: {row.contact.linkedinUrl}</p>
                      )}
                    </div>
                  ) : (
                    <p className="mt-3 text-xs text-slate-500">
                      {row.privacyNote}
                    </p>
                  )}
                </article>
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
