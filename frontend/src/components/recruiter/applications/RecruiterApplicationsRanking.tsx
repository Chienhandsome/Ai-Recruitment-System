"use client";

import { useCallback, useEffect, useState } from "react";
import { Bot, Search, SlidersHorizontal } from "lucide-react";
import {
  type ApplicationStage,
  type RecruiterApplicationListItem,
  getRecruiterApplications,
} from "@/lib/recruiter-api";
import { applicationStageLabels, applicationStageStyles } from "@/lib/application-stage";
import { ApplicationStageActions } from "./ApplicationStageActions";

export function RecruiterApplicationsRanking({ token }: { token: string }) {
  const [items, setItems] = useState<RecruiterApplicationListItem[]>([]);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [stage, setStage] = useState<ApplicationStage | "">("");
  const [minScore, setMinScore] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await getRecruiterApplications(token, {
        search: search.trim() || undefined,
        stage: stage || undefined,
        minScore: minScore === "" ? undefined : Number(minScore),
        page,
        limit: 20,
      });
      setItems(response.data);
      setTotal(response.meta.total);
      setTotalPages(response.meta.totalPages);
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Không thể tải ứng viên");
    } finally {
      setLoading(false);
    }
  }, [minScore, page, search, stage, token]);

  useEffect(() => {
    const timeout = window.setTimeout(load, 350);
    return () => window.clearTimeout(timeout);
  }, [load]);

  return (
    <section className="space-y-5">
      <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <p className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-blue-600">
              <Bot className="h-4 w-4" /> AI candidate ranking
            </p>
            <h2 className="mt-1 text-2xl font-black text-slate-900">Ứng viên toàn công ty</h2>
            <p className="mt-1 text-sm text-slate-500">
              {total} hồ sơ, xếp theo điểm AI. Quyết định cuối cùng luôn thuộc recruiter.
            </p>
          </div>

          <div className="grid gap-2 sm:grid-cols-[minmax(220px,1fr)_180px_130px]">
            <label className="relative">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
              <input
                value={search}
                onChange={(event) => {
                  setSearch(event.target.value);
                  setPage(1);
                }}
                placeholder="Tên hoặc email ứng viên"
                className="h-10 w-full rounded-xl border border-slate-200 bg-slate-50 pl-9 pr-3 text-sm outline-none focus:border-blue-400"
              />
            </label>
            <label className="relative">
              <SlidersHorizontal className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
              <select
                value={stage}
                onChange={(event) => {
                  setStage(event.target.value as ApplicationStage | "");
                  setPage(1);
                }}
                className="h-10 w-full appearance-none rounded-xl border border-slate-200 bg-slate-50 pl-9 pr-3 text-sm outline-none focus:border-blue-400"
              >
                <option value="">Tất cả trạng thái</option>
                {Object.entries(applicationStageLabels).map(([value, label]) => (
                  <option key={value} value={value}>{label}</option>
                ))}
              </select>
            </label>
            <input
              type="number"
              min={0}
              max={100}
              value={minScore}
              onChange={(event) => {
                setMinScore(event.target.value);
                setPage(1);
              }}
              placeholder="Điểm từ"
              className="h-10 rounded-xl border border-slate-200 bg-slate-50 px-3 text-sm outline-none focus:border-blue-400"
            />
          </div>
        </div>
      </div>

      {error && (
        <div className="rounded-xl border border-rose-200 bg-rose-50 p-4 text-sm font-semibold text-rose-700">
          {error}
        </div>
      )}

      <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
        {loading ? (
          <div className="p-12 text-center text-sm font-semibold text-slate-500">Đang tải ứng viên...</div>
        ) : items.length === 0 ? (
          <div className="p-12 text-center text-sm font-semibold text-slate-500">Chưa có hồ sơ phù hợp bộ lọc.</div>
        ) : (
          <div className="divide-y divide-slate-100">
            {items.map((item, index) => {
              const score = item.latestAiResult?.overallScore;
              return (
                <article key={item.id} className="grid gap-4 p-4 lg:grid-cols-[48px_minmax(0,1.3fr)_minmax(180px,0.7fr)_120px_minmax(220px,auto)] lg:items-center">
                  <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-slate-100 font-mono text-xs font-black text-slate-500">
                    #{(page - 1) * 20 + index + 1}
                  </div>
                  <div className="min-w-0">
                    <p className="truncate text-sm font-extrabold text-slate-900">{item.candidate.fullName || "Ứng viên"}</p>
                    <p className="truncate text-xs text-slate-500">{item.candidate.email}</p>
                    <p className="mt-1 truncate text-xs font-semibold text-blue-600">{item.job.title}</p>
                  </div>
                  <span className={`w-fit rounded-lg border px-2.5 py-1 text-xs font-bold ${applicationStageStyles[item.currentStage]}`}>
                    {applicationStageLabels[item.currentStage]}
                  </span>
                  <div>
                    <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Điểm AI</p>
                    <p className="font-mono text-xl font-black text-slate-900">{score == null ? "—" : Math.round(score)}</p>
                  </div>
                  <ApplicationStageActions
                    token={token}
                    applicationId={item.id}
                    currentStage={item.currentStage}
                    allowedTransitions={item.allowedTransitions}
                    onUpdated={load}
                  />
                </article>
              );
            })}
          </div>
        )}
      </div>

      {totalPages > 1 && (
        <div className="flex items-center justify-end gap-3">
          <button type="button" disabled={page <= 1} onClick={() => setPage((value) => value - 1)} className="rounded-lg border border-slate-200 px-3 py-2 text-xs font-bold disabled:opacity-40">Trang trước</button>
          <span className="text-xs font-bold text-slate-500">{page} / {totalPages}</span>
          <button type="button" disabled={page >= totalPages} onClick={() => setPage((value) => value + 1)} className="rounded-lg border border-slate-200 px-3 py-2 text-xs font-bold disabled:opacity-40">Trang sau</button>
        </div>
      )}
    </section>
  );
}
