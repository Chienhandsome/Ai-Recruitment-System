"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import {
  adminListPackages,
  adminUpdatePackage,
  formatVnd,
  type ServicePackage,
} from "@/lib/billing-api";

export default function AdminPackagesPage() {
  const [token, setToken] = useState("");
  const [packages, setPackages] = useState<ServicePackage[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [savingId, setSavingId] = useState<string | null>(null);
  const [drafts, setDrafts] = useState<
    Record<string, { priceVnd: number; isActive: boolean; name: string }>
  >({});

  useEffect(() => {
    const load = async () => {
      const supabase = createClient();
      const {
        data: { session },
      } = await supabase.auth.getSession();
      if (!session?.access_token) {
        setError("Vui lòng đăng nhập admin.");
        return;
      }
      setToken(session.access_token);
      try {
        const data = await adminListPackages(session.access_token);
        setPackages(data);
        setDrafts(
          Object.fromEntries(
            data.map((pkg) => [
              pkg.id,
              {
                priceVnd: pkg.priceVnd,
                isActive: pkg.isActive,
                name: pkg.name,
              },
            ]),
          ),
        );
      } catch (err) {
        setError(err instanceof Error ? err.message : "Không tải được gói.");
      }
    };
    void load();
  }, []);

  const save = async (pkg: ServicePackage) => {
    const draft = drafts[pkg.id];
    if (!draft || !token) return;
    setSavingId(pkg.id);
    setError(null);
    try {
      const updated = await adminUpdatePackage(token, pkg.id, {
        priceVnd: draft.priceVnd,
        isActive: draft.isActive,
        name: draft.name,
      });
      setPackages((prev) =>
        prev.map((item) => (item.id === pkg.id ? updated : item)),
      );
    } catch (err) {
      setError(err instanceof Error ? err.message : "Lưu thất bại.");
    } finally {
      setSavingId(null);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-[#0F172A]">
          Cấu hình gói HR
        </h1>
        <p className="mt-1 text-sm text-slate-500">
          Chỉnh giá và bật/tắt gói dịch vụ nhà tuyển dụng. Không thay đổi mã gói
          hệ thống (HR_FREE / HR_PRO / HR_PREMIUM).
        </p>
      </div>

      {error && (
        <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      )}

      <div className="space-y-4">
        {packages.map((pkg) => {
          const draft = drafts[pkg.id] ?? {
            priceVnd: pkg.priceVnd,
            isActive: pkg.isActive,
            name: pkg.name,
          };
          return (
            <div
              key={pkg.id}
              className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm"
            >
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <p className="text-xs font-semibold uppercase text-slate-500">
                    {pkg.code}
                  </p>
                  <input
                    value={draft.name}
                    onChange={(e) =>
                      setDrafts((prev) => ({
                        ...prev,
                        [pkg.id]: { ...draft, name: e.target.value },
                      }))
                    }
                    className="mt-1 w-full max-w-md rounded-lg border border-slate-200 px-3 py-2 text-sm font-semibold"
                  />
                </div>
                <label className="inline-flex items-center gap-2 text-sm">
                  <input
                    type="checkbox"
                    checked={draft.isActive}
                    onChange={(e) =>
                      setDrafts((prev) => ({
                        ...prev,
                        [pkg.id]: { ...draft, isActive: e.target.checked },
                      }))
                    }
                  />
                  Đang bán
                </label>
              </div>

              <div className="mt-4 grid gap-4 sm:grid-cols-2">
                <label className="text-sm">
                  <span className="mb-1 block text-slate-500">Giá (VND)</span>
                  <input
                    type="number"
                    min={0}
                    value={draft.priceVnd}
                    disabled={pkg.code === "HR_FREE"}
                    onChange={(e) =>
                      setDrafts((prev) => ({
                        ...prev,
                        [pkg.id]: {
                          ...draft,
                          priceVnd: Number(e.target.value || 0),
                        },
                      }))
                    }
                    className="w-full rounded-lg border border-slate-200 px-3 py-2"
                  />
                  <span className="mt-1 block text-xs text-slate-400">
                    Hiện tại: {formatVnd(pkg.priceVnd)}
                  </span>
                </label>
                <div className="rounded-xl bg-slate-50 p-3 text-xs text-slate-600">
                  <p>AI ranking: {pkg.aiRanking ? "Có" : "Không"}</p>
                  <p>Lọc nâng cao: {pkg.advancedFilters ? "Có" : "Không"}</p>
                  <p>Dashboard: {pkg.recruitmentStats ? "Có" : "Không"}</p>
                  <p>Talent pool: {pkg.talentPoolAccess ? "Có" : "Không"}</p>
                  <p>
                    Max tin active:{" "}
                    {pkg.maxActiveJobs === null ? "Không giới hạn" : pkg.maxActiveJobs}
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => void save(pkg)}
                disabled={savingId === pkg.id}
                className="mt-4 rounded-xl bg-[#2563EB] px-4 py-2 text-sm font-semibold text-white hover:bg-blue-600 disabled:opacity-50"
              >
                {savingId === pkg.id ? "Đang lưu..." : "Lưu thay đổi"}
              </button>
            </div>
          );
        })}
      </div>
    </div>
  );
}
