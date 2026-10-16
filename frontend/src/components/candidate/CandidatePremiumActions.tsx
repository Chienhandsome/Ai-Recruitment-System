"use client";

import { useEffect, useId, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  BrainCircuit,
  CheckCircle2,
  ExternalLink,
  Loader2,
  Sparkles,
  Video,
  X,
  XCircle,
} from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { createClient } from "@/lib/supabase/client";
import {
  analyzeJdFit,
  createCandidateMockInterview,
  getLatestJdFit,
  getMyEntitlement,
  newRequestId,
  type EntitlementStatus,
} from "@/lib/billing-api";

type SkillChip = { name: string; isMandatory?: boolean } | string;

type JdFitResult = {
  overallScore?: number;
  matchLevel?: string | null;
  suggestions?: Array<{ type?: string; skill?: string; message?: string }>;
  analysis?: {
    scoreBreakdown?: {
      skills?: number;
      experience?: number;
      education?: number;
      other?: number;
    };
    matchedSkills?: SkillChip[];
    missingSkills?: SkillChip[];
    missingRequiredSkills?: string[];
    matchedRequired?: string[];
    missingRequired?: string[];
    strengths?: string[];
    gaps?: string[];
    summary?: string;
    explanation?: string;
    mandatoryStatus?: string | null;
    mandatoryRatio?: number | null;
    dataScopeNote?: string;
  };
  reused?: boolean;
  disclaimer?: string;
  createdAt?: string;
};

type Props = {
  jobId: string;
  applicationId?: string | null;
  hasApplied?: boolean;
  compact?: boolean;
};

function matchLevelLabel(level?: string | null) {
  if (!level) return null;
  if (level === "HIGH") return "Cao";
  if (level === "MEDIUM") return "Trung bình";
  if (level === "LOW") return "Thấp";
  return level;
}

function skillName(skill: SkillChip) {
  return typeof skill === "string" ? skill : skill.name;
}

function useDialogEscape(open: boolean, onClose: () => void) {
  useEffect(() => {
    if (!open) return;
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
    };
    document.addEventListener("keydown", onKey);
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = prev;
    };
  }, [open, onClose]);
}

function JdFitDetailDialog({
  result,
  open,
  onClose,
}: {
  result: JdFitResult;
  open: boolean;
  onClose: () => void;
}) {
  const titleId = useId();
  useDialogEscape(open, onClose);
  if (!open) return null;

  const breakdown = result.analysis?.scoreBreakdown;
  const matchedSkills = (
    result.analysis?.matchedSkills ??
    result.analysis?.matchedRequired ??
    []
  ).map(skillName);
  const missingRequired =
    result.analysis?.missingRequiredSkills ??
    result.analysis?.missingRequired ??
    [];
  const strengths = result.analysis?.strengths ?? [];
  const gaps = result.analysis?.gaps ?? [];
  const suggestions = Array.isArray(result.suggestions) ? result.suggestions : [];
  const summary =
    result.analysis?.summary ?? result.analysis?.explanation ?? null;

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-950/60 p-4 backdrop-blur-sm"
      role="presentation"
      onClick={onClose}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        className="flex max-h-[90vh] w-full max-w-lg flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-2xl"
        onClick={(event) => event.stopPropagation()}
      >
        <div className="flex items-start justify-between gap-3 border-b border-slate-100 bg-blue-50/80 px-5 py-4">
          <div>
            <p id={titleId} className="text-base font-extrabold text-foreground">
              Chi tiết phân tích CV–JD
            </p>
            <p className="mt-1 text-sm font-semibold text-primary">
              Điểm phù hợp: {result.overallScore ?? "—"}
              {result.matchLevel
                ? ` · ${matchLevelLabel(result.matchLevel)}`
                : ""}
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="flex size-8 shrink-0 items-center justify-center rounded-lg text-slate-400 transition-colors hover:bg-white hover:text-slate-700"
            aria-label="Đóng"
          >
            <X className="size-5" />
          </button>
        </div>

        <div className="flex-1 space-y-4 overflow-y-auto px-5 py-4 text-sm">
          {summary && (
            <p className="leading-relaxed text-muted-foreground">{summary}</p>
          )}

          {breakdown && (
            <section className="grid grid-cols-2 gap-2">
              {(
                [
                  ["Kỹ năng", breakdown.skills],
                  ["Kinh nghiệm", breakdown.experience],
                  ["Học vấn", breakdown.education],
                  ["Chứng chỉ / ngôn ngữ", breakdown.other],
                ] as const
              ).map(([label, value]) => (
                <div
                  key={label}
                  className="rounded-xl border border-slate-100 bg-slate-50 px-3 py-2"
                >
                  <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-500">
                    {label}
                  </p>
                  <p className="mt-0.5 text-base font-bold text-foreground">
                    {value ?? "—"}
                  </p>
                </div>
              ))}
            </section>
          )}

          <section className="space-y-2">
            <h3 className="text-xs font-bold uppercase tracking-wide text-slate-500">
              Kỹ năng đã khớp
            </h3>
            {matchedSkills.length > 0 ? (
              <ul className="flex flex-wrap gap-1.5">
                {matchedSkills.map((name) => (
                  <li
                    key={`m-${name}`}
                    className="inline-flex items-center gap-1 rounded-full border border-emerald-200 bg-emerald-50 px-2.5 py-1 text-xs font-semibold text-emerald-800"
                  >
                    <CheckCircle2 className="size-3.5" />
                    {name}
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-xs text-muted-foreground">Chưa có kỹ năng khớp.</p>
            )}
          </section>

          <section className="space-y-2">
            <h3 className="text-xs font-bold uppercase tracking-wide text-slate-500">
              Kỹ năng bắt buộc còn thiếu
            </h3>
            {missingRequired.length > 0 ? (
              <ul className="flex flex-wrap gap-1.5">
                {missingRequired.map((name) => (
                  <li
                    key={`miss-${name}`}
                    className="inline-flex items-center gap-1 rounded-full border border-amber-200 bg-amber-50 px-2.5 py-1 text-xs font-semibold text-amber-900"
                  >
                    <XCircle className="size-3.5" />
                    {name}
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-xs text-emerald-700">
                Không thiếu kỹ năng bắt buộc theo JD.
              </p>
            )}
          </section>

          <section className="space-y-2">
            <h3 className="text-xs font-bold uppercase tracking-wide text-slate-500">
              Điểm mạnh
            </h3>
            {strengths.length > 0 ? (
              <ul className="list-disc space-y-1 pl-4 text-xs text-slate-700">
                {strengths.map((item) => (
                  <li key={item}>{item}</li>
                ))}
              </ul>
            ) : (
              <p className="text-xs text-muted-foreground">
                AI chưa nêu điểm mạnh cụ thể.
              </p>
            )}
          </section>

          <section className="space-y-2">
            <h3 className="text-xs font-bold uppercase tracking-wide text-slate-500">
              Khoảng trống
            </h3>
            {gaps.length > 0 ? (
              <ul className="list-disc space-y-1 pl-4 text-xs text-slate-700">
                {gaps.map((item) => (
                  <li key={item}>{item}</li>
                ))}
              </ul>
            ) : (
              <p className="text-xs text-muted-foreground">
                AI chưa nêu khoảng trống cụ thể.
              </p>
            )}
          </section>

          <section className="space-y-2">
            <h3 className="text-xs font-bold uppercase tracking-wide text-slate-500">
              Gợi ý cải thiện CV
            </h3>
            {suggestions.length > 0 ? (
              <ul className="list-disc space-y-1.5 pl-4 text-xs leading-relaxed text-slate-700">
                {suggestions.map((item, index) => (
                  <li key={`${item.type ?? "s"}-${index}`}>
                    {item.message ?? JSON.stringify(item)}
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-xs text-muted-foreground">Không có gợi ý thêm.</p>
            )}
          </section>

          <p className="rounded-lg border border-slate-100 bg-slate-50 px-3 py-2 text-[11px] leading-relaxed text-slate-500">
            {result.disclaimer ??
              "Điểm số do AI hỗ trợ đánh giá dựa trên CV và yêu cầu công việc, chỉ mang tính tham khảo."}
          </p>
        </div>

        <div className="flex justify-end gap-2 border-t border-slate-100 px-5 py-3">
          <Button type="button" variant="outline" onClick={onClose}>
            Đóng
          </Button>
        </div>
      </div>
    </div>
  );
}

function MockInterviewConfirmDialog({
  open,
  onClose,
  onConfirm,
  loading,
  entitlement,
  entitlementLoading,
  canStart,
  blockedReason,
}: {
  open: boolean;
  onClose: () => void;
  onConfirm: () => void;
  loading: boolean;
  entitlement: EntitlementStatus | null;
  entitlementLoading: boolean;
  canStart: boolean;
  blockedReason: string | null;
}) {
  const titleId = useId();
  useDialogEscape(open, onClose);
  if (!open) return null;

  const remaining = entitlement?.mockInterviewRemaining;
  const hasFeature = entitlement?.aiMockInterview === true;

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-950/60 p-4 backdrop-blur-sm"
      role="presentation"
      onClick={onClose}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        className="w-full max-w-md overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-2xl"
        onClick={(event) => event.stopPropagation()}
      >
        <div className="flex items-start justify-between gap-3 border-b border-slate-100 bg-blue-50/80 px-5 py-4">
          <div className="flex items-start gap-3">
            <div className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-primary text-white">
              <Video className="size-5" />
            </div>
            <div>
              <p id={titleId} className="text-base font-extrabold text-foreground">
                Mock interview AI
              </p>
              <p className="mt-1 text-xs text-muted-foreground">
                Luyện phỏng vấn theo JD (Premium). Không trừ lượt khi bạn hủy.
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="flex size-8 shrink-0 items-center justify-center rounded-lg text-slate-400 transition-colors hover:bg-white hover:text-slate-700"
            aria-label="Đóng"
          >
            <X className="size-5" />
          </button>
        </div>

        <div className="space-y-3 px-5 py-4 text-sm">
          <p className="leading-relaxed text-slate-700">
            Hệ thống sẽ tạo phòng phỏng vấn AI dựa trên CV và tin tuyển dụng hiện
            tại. Bạn sẽ nhận link tham gia ngay sau khi xác nhận.
          </p>

          <div className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-3">
            {entitlementLoading ? (
              <p className="flex items-center gap-2 text-xs text-muted-foreground">
                <Loader2 className="size-3.5 animate-spin" />
                Đang tải thông tin gói...
              </p>
            ) : (
              <>
                <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                  Quota còn lại
                </p>
                <p className="mt-1 text-lg font-extrabold text-foreground">
                  {hasFeature ? (remaining ?? 0) : 0}{" "}
                  <span className="text-sm font-semibold text-muted-foreground">
                    lượt mock interview
                  </span>
                </p>
                <p className="mt-1 text-xs text-muted-foreground">
                  Gói: {entitlement?.packageName ?? "Free"}
                  {!hasFeature
                    ? " — cần Premium để dùng tính năng này."
                    : "."}
                </p>
              </>
            )}
          </div>

          {blockedReason && (
            <p className="rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-xs text-amber-900">
              {blockedReason}
            </p>
          )}
        </div>

        <div className="flex flex-col-reverse gap-2 border-t border-slate-100 px-5 py-3 sm:flex-row sm:justify-end">
          <Button
            type="button"
            variant="outline"
            className="font-semibold"
            disabled={loading}
            onClick={onClose}
          >
            Hủy
          </Button>
          <Button
            type="button"
            className="font-semibold"
            disabled={loading || entitlementLoading || !canStart}
            onClick={onConfirm}
          >
            {loading ? (
              <Loader2 className="mr-2 size-4 animate-spin" />
            ) : (
              <Video className="mr-2 size-4" />
            )}
            Tham gia phỏng vấn
          </Button>
        </div>
      </div>
    </div>
  );
}

export function CandidatePremiumActions({
  jobId,
  applicationId,
  hasApplied = false,
  compact = false,
}: Props) {
  const router = useRouter();
  const [analyzing, setAnalyzing] = useState(false);
  const [loadingSaved, setLoadingSaved] = useState(true);
  const [mocking, setMocking] = useState(false);
  const [mockDialogOpen, setMockDialogOpen] = useState(false);
  const [entitlement, setEntitlement] = useState<EntitlementStatus | null>(null);
  const [entitlementLoading, setEntitlementLoading] = useState(false);
  const [result, setResult] = useState<JdFitResult | null>(null);
  const [detailOpen, setDetailOpen] = useState(false);
  const [launchUrl, setLaunchUrl] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const getToken = async () => {
    const supabase = createClient();
    const {
      data: { session },
    } = await supabase.auth.getSession();
    if (!session?.access_token) {
      router.push(`/login?next=/candidate/jobs/${jobId}`);
      return null;
    }
    return session.access_token;
  };

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setLoadingSaved(true);
      try {
        const token = await getToken();
        if (!token || cancelled) return;
        const saved = (await getLatestJdFit(token, jobId)) as JdFitResult | null;
        if (!cancelled && saved && typeof saved.overallScore === "number") {
          setResult(saved);
        }
      } catch {
        // Ignore load errors — user can still analyze fresh.
      } finally {
        if (!cancelled) setLoadingSaved(false);
      }
    })();
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps -- load once per job
  }, [jobId]);

  const handleAnalyze = async () => {
    setAnalyzing(true);
    setError(null);
    try {
      const token = await getToken();
      if (!token) return;
      const requestId = newRequestId("jd-fit");
      const data = (await analyzeJdFit(token, {
        jobId,
        requestId,
      })) as JdFitResult;
      setResult(data);
      setDetailOpen(true);
      toast.success(
        data.reused
          ? "Đã tải lại kết quả phân tích (không trừ thêm lượt)."
          : `Phân tích xong — điểm ${data.overallScore ?? "—"}.`,
      );
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "Không phân tích được CV–JD.";
      setError(message);
      if (
        /hết lượt|nâng cấp|CANDIDATE Pro|CANDIDATE Premium|gói Pro|gói Premium/i.test(
          message,
        )
      ) {
        toast.error(message, {
          action: {
            label: "Nâng cấp",
            onClick: () => router.push("/candidate/billing"),
          },
        });
      } else if (/CV|resume|parse|hồ sơ/i.test(message)) {
        toast.error(message, {
          action: {
            label: "Mở hồ sơ",
            onClick: () => router.push("/candidate/profile"),
          },
        });
      } else {
        toast.error(message);
      }
    } finally {
      setAnalyzing(false);
    }
  };

  const openMockDialog = async () => {
    setError(null);
    setMockDialogOpen(true);
    setEntitlementLoading(true);
    try {
      const token = await getToken();
      if (!token) {
        setMockDialogOpen(false);
        return;
      }
      const status = await getMyEntitlement(token, "CANDIDATE");
      setEntitlement(status);
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "Không tải được thông tin gói.";
      toast.error(message);
      setEntitlement(null);
    } finally {
      setEntitlementLoading(false);
    }
  };

  const handleConfirmMock = async () => {
    if (!hasApplied && !applicationId) {
      const message =
        "Bạn cần ứng tuyển tin này trước khi luyện mock interview AI.";
      setError(message);
      toast.error(message);
      return;
    }
    setMocking(true);
    setError(null);
    try {
      const token = await getToken();
      if (!token) return;
      const requestId = newRequestId("mock");
      const data = await createCandidateMockInterview(token, {
        jobId,
        requestId,
        applicationId: applicationId ?? undefined,
      });
      setLaunchUrl(data.session.launchUrl);
      setMockDialogOpen(false);
      if (entitlement?.mockInterviewRemaining != null && !data.reused) {
        setEntitlement({
          ...entitlement,
          mockInterviewRemaining: Math.max(
            0,
            entitlement.mockInterviewRemaining - 1,
          ),
        });
      }
      toast.success(
        data.reused
          ? "Đã mở lại phiên mock (không trừ thêm lượt)."
          : "Đã tạo phiên mock interview AI.",
      );
      if (data.session.launchUrl) {
        window.open(data.session.launchUrl, "_blank", "noopener,noreferrer");
      }
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "Không tạo được mock interview.";
      setError(message);
      if (
        /hết lượt|nâng cấp|CANDIDATE Premium|gói Premium|gói Pro/i.test(message)
      ) {
        toast.error(message, {
          action: {
            label: "Nâng cấp",
            onClick: () => router.push("/candidate/billing"),
          },
        });
      } else if (/ứng tuyển/i.test(message)) {
        toast.error(message, {
          action: {
            label: "Xem JD",
            onClick: () => router.push(`/candidate/jobs/${jobId}`),
          },
        });
      } else {
        toast.error(message);
      }
    } finally {
      setMocking(false);
    }
  };

  const previewText =
    result?.analysis?.summary ??
    result?.analysis?.explanation ??
    (Array.isArray(result?.suggestions)
      ? result.suggestions.find((item) => item.message)?.message
      : null);
  const missingCount =
    result?.analysis?.missingRequiredSkills?.length ??
    result?.analysis?.missingRequired?.length ??
    0;
  const breakdown = result?.analysis?.scoreBreakdown;

  const mockBlockedReason = !hasApplied && !applicationId
    ? "Bạn cần ứng tuyển tin này trước khi luyện mock interview."
    : entitlement && entitlement.aiMockInterview !== true
      ? "Gói hiện tại chưa có mock interview AI. Nâng cấp Premium để dùng."
      : entitlement && (entitlement.mockInterviewRemaining ?? 0) <= 0
        ? "Bạn đã hết lượt mock interview trong chu kỳ gói hiện tại."
        : null;
  const canStartMock =
    Boolean(hasApplied || applicationId) &&
    entitlement?.aiMockInterview === true &&
    (entitlement.mockInterviewRemaining ?? 0) > 0;

  return (
    <div
      className={
        compact
          ? "mt-4 space-y-2.5 rounded-xl border border-[#BFDBFE]/80 bg-[#EFF6FF]/50 p-3"
          : "mt-4 space-y-3 rounded-xl border border-blue-100 bg-blue-50/40 p-4"
      }
    >
      <div className="flex items-start gap-2">
        <Sparkles className="mt-0.5 size-4 shrink-0 text-[#2563EB]" />
        <div className="min-w-0">
          <p className={`font-bold text-[#1F2937] ${compact ? "text-xs" : "text-sm"}`}>
            Công cụ AI (Pro / Premium)
          </p>
          {!compact && (
            <p className="mt-0.5 text-xs text-muted-foreground">
              AI hỗ trợ phân tích và luyện phỏng vấn — không cam kết được tuyển.
            </p>
          )}
        </div>
      </div>

      <div className={`flex flex-col ${compact ? "gap-1.5" : "gap-2"}`}>
        <Button
          type="button"
          variant="outline"
          size={compact ? "sm" : "default"}
          className="w-full justify-center border-slate-200 font-semibold text-[#1F2937] hover:border-[#93C5FD] hover:bg-white hover:text-[#2563EB]"
          disabled={analyzing || loadingSaved}
          onClick={() => void handleAnalyze()}
        >
          {analyzing || loadingSaved ? (
            <Loader2 className="mr-2 size-4 animate-spin" />
          ) : (
            <BrainCircuit className="mr-2 size-4" />
          )}
          {result ? "Phân tích lại CV–JD" : "Phân tích CV–JD"}
        </Button>
        <Button
          type="button"
          size={compact ? "sm" : "default"}
          className="w-full justify-center bg-[#2563EB] font-semibold hover:bg-[#1D4ED8]"
          disabled={mocking}
          onClick={() => void openMockDialog()}
        >
          <Video className="mr-2 size-4" />
          Mock interview AI
        </Button>
      </div>

      {!hasApplied && !applicationId && (
        <p className="text-xs text-amber-800">
          Mock interview cần đã ứng tuyển tin này.{" "}
          <Link
            href={`/candidate/jobs/${jobId}`}
            className="font-semibold underline"
          >
            Xem JD / ứng tuyển
          </Link>
        </p>
      )}

      {error && (
        <p className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-xs text-red-700">
          {error}{" "}
          {/hết lượt|nâng cấp|CANDIDATE Premium|gói Premium|gói Pro/i.test(
            error,
          ) ? (
            <Link href="/candidate/billing" className="font-semibold underline">
              Xem gói dịch vụ
            </Link>
          ) : /CV|resume|parse|hồ sơ/i.test(error) ? (
            <Link href="/candidate/profile" className="font-semibold underline">
              Mở hồ sơ / CV
            </Link>
          ) : null}
        </p>
      )}

      {loadingSaved && !result && (
        <p className="text-xs text-muted-foreground">
          Đang tải kết quả phân tích đã lưu...
        </p>
      )}

      {result && (
        <div
          className={`rounded-xl border border-white/80 bg-white text-sm shadow-sm ${
            compact ? "p-2.5" : "p-3"
          }`}
        >
          <div className="flex items-start justify-between gap-2">
            <p className={`font-bold text-[#1F2937] ${compact ? "text-sm" : ""}`}>
              Điểm phù hợp: {result.overallScore ?? "—"}
              {result.matchLevel ? ` · ${matchLevelLabel(result.matchLevel)}` : ""}
            </p>
            {compact && (
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="h-7 shrink-0 px-2 text-xs font-semibold text-[#2563EB] hover:bg-[#EFF6FF]"
                onClick={() => setDetailOpen(true)}
              >
                Chi tiết
              </Button>
            )}
          </div>
          {breakdown && (
            <p className="mt-1 text-[11px] text-slate-500">
              Kỹ năng {breakdown.skills ?? "—"} · KN{" "}
              {breakdown.experience ?? "—"} · HV {breakdown.education ?? "—"} ·
              Khác {breakdown.other ?? "—"}
            </p>
          )}
          {previewText && !compact && (
            <p className="mt-1.5 line-clamp-2 text-xs leading-relaxed text-muted-foreground">
              {previewText}
            </p>
          )}
          {previewText && compact && (
            <p className="mt-1 line-clamp-1 text-[11px] leading-relaxed text-slate-500">
              {previewText}
            </p>
          )}
          {missingCount > 0 && (
            <p className="mt-1 text-[11px] text-amber-800">
              Thiếu {missingCount} kỹ năng bắt buộc
            </p>
          )}
          {result.createdAt && (
            <p className="mt-1 text-[10px] text-slate-400">
              Đã lưu · {new Date(result.createdAt).toLocaleString("vi-VN")}
            </p>
          )}
          {!compact && (
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="mt-3 w-full font-semibold"
              onClick={() => setDetailOpen(true)}
            >
              Xem chi tiết
            </Button>
          )}
        </div>
      )}

      {launchUrl && (
        <a
          href={launchUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-primary hover:underline"
        >
          Mở lại phòng phỏng vấn AI
          <ExternalLink className="size-3.5" />
        </a>
      )}

      {result && (
        <JdFitDetailDialog
          result={result}
          open={detailOpen}
          onClose={() => setDetailOpen(false)}
        />
      )}

      <MockInterviewConfirmDialog
        open={mockDialogOpen}
        onClose={() => setMockDialogOpen(false)}
        onConfirm={() => void handleConfirmMock()}
        loading={mocking}
        entitlement={entitlement}
        entitlementLoading={entitlementLoading}
        canStart={canStartMock}
        blockedReason={mockBlockedReason}
      />
    </div>
  );
}
