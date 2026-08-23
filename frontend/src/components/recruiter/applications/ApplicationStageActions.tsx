"use client";

import { useState } from "react";
import { Loader2, X } from "lucide-react";
import { toast } from "sonner";
import {
  type ApplicationStage,
  RecruiterApiError,
  updateApplicationStage,
} from "@/lib/recruiter-api";
import { applicationStageLabels } from "@/lib/application-stage";

interface ApplicationStageActionsProps {
  token: string;
  applicationId: string;
  currentStage: ApplicationStage;
  allowedTransitions: ApplicationStage[];
  currentHrNotes?: string | null;
  onUpdated: () => void | Promise<void>;
  onScheduleInterview?: () => void;
}

function noteRequired(current: ApplicationStage, target: ApplicationStage) {
  return (
    target === "REJECTED" ||
    current === "REJECTED" ||
    (current === "OFFERED" && target === "SHORTLISTED") ||
    (target === "SCREENING" &&
      (current === "SHORTLISTED" || current === "OFFERED"))
  );
}

export function ApplicationStageActions({
  token,
  applicationId,
  currentStage,
  allowedTransitions,
  currentHrNotes,
  onUpdated,
  onScheduleInterview,
}: ApplicationStageActionsProps) {
  const [target, setTarget] = useState<ApplicationStage | null>(null);
  const [note, setNote] = useState("");
  const [hrNotes, setHrNotes] = useState(currentHrNotes ?? "");
  const [submitting, setSubmitting] = useState(false);

  if (allowedTransitions.length === 0) {
    return <p className="text-xs font-semibold text-slate-500">Không còn thao tác khả dụng.</p>;
  }

  const close = () => {
    if (submitting) return;
    setTarget(null);
    setNote("");
  };

  const submit = async () => {
    if (!target) return;
    if (noteRequired(currentStage, target) && !note.trim()) {
      toast.error("Vui lòng nhập lý do cho thay đổi trạng thái này.");
      return;
    }

    setSubmitting(true);
    try {
      await updateApplicationStage(token, applicationId, {
        targetStage: target,
        expectedStage: currentStage,
        note: note.trim() || undefined,
        hrNotes:
          currentHrNotes === undefined ? hrNotes.trim() || undefined : hrNotes.trim(),
      });
      toast.success(`Đã chuyển hồ sơ sang “${applicationStageLabels[target]}”.`);
      setTarget(null);
      setNote("");
      try {
        await onUpdated();
      } catch {
        toast.warning("Đã lưu quyết định nhưng chưa thể tải lại danh sách.");
      }
    } catch (error) {
      if (error instanceof RecruiterApiError && error.status === 409) {
        toast.error("Hồ sơ vừa được người khác cập nhật. Dữ liệu sẽ được tải lại.");
        try {
          await onUpdated();
        } catch {
          toast.warning("Vui lòng tải lại trang để xem trạng thái mới nhất.");
        }
      } else {
        toast.error(error instanceof Error ? error.message : "Không thể cập nhật hồ sơ");
      }
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <>
      <div className="flex flex-wrap gap-2">
        {allowedTransitions.map((stage) => (
          <button
            key={stage}
            type="button"
            onClick={() => {
              if (stage === "INTERVIEW_SCHEDULED" && onScheduleInterview) {
                onScheduleInterview();
              } else {
                setTarget(stage);
              }
            }}
            className={`rounded-lg border px-3 py-2 text-xs font-bold transition-colors ${
              stage === "REJECTED"
                ? "border-rose-200 text-rose-700 hover:bg-rose-50"
                : stage === "HIRED"
                  ? "border-emerald-600 bg-emerald-600 text-white hover:bg-emerald-700"
                  : stage === "INTERVIEW_SCHEDULED"
                    ? "border-blue-300 bg-[#2563EB] text-white hover:bg-[#1D4ED8] shadow-sm"
                    : "border-blue-200 bg-blue-50 text-blue-700 hover:bg-blue-100"
            }`}
          >
            {stage === "INTERVIEW_SCHEDULED" ? "📅 Lên lịch phỏng vấn" : applicationStageLabels[stage]}
          </button>
        ))}
      </div>

      {target && (
        <div className="fixed inset-0 z-[80] flex items-center justify-center bg-slate-950/50 p-4 backdrop-blur-sm">
          <div className="w-full max-w-lg rounded-2xl border border-slate-200 bg-white p-5 shadow-2xl">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-xs font-bold uppercase tracking-wider text-blue-600">
                  Cập nhật quy trình
                </p>
                <h3 className="mt-1 text-lg font-extrabold text-slate-900">
                  {applicationStageLabels[currentStage]} → {applicationStageLabels[target]}
                </h3>
              </div>
              <button type="button" onClick={close} className="rounded-lg p-2 hover:bg-slate-100">
                <X className="h-4 w-4" />
              </button>
            </div>

            <label className="mt-5 block text-sm font-bold text-slate-700">
              Lý do {noteRequired(currentStage, target) ? "*" : "(không bắt buộc)"}
              <textarea
                value={note}
                onChange={(event) => setNote(event.target.value)}
                maxLength={1000}
                rows={3}
                className="mt-2 w-full resize-none rounded-xl border border-slate-300 px-3 py-2 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                placeholder="Ghi lại lý do để phục vụ audit..."
              />
            </label>

            <label className="mt-4 block text-sm font-bold text-slate-700">
              Ghi chú nội bộ HR
              <textarea
                value={hrNotes}
                onChange={(event) => setHrNotes(event.target.value)}
                maxLength={5000}
                rows={3}
                className="mt-2 w-full resize-none rounded-xl border border-slate-300 px-3 py-2 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                placeholder="Chỉ recruiter nhìn thấy ghi chú này."
              />
            </label>

            <div className="mt-5 flex justify-end gap-2">
              <button
                type="button"
                onClick={close}
                disabled={submitting}
                className="rounded-lg border border-slate-200 px-4 py-2 text-sm font-bold text-slate-600 hover:bg-slate-50 disabled:opacity-50"
              >
                Hủy
              </button>
              <button
                type="button"
                onClick={submit}
                disabled={submitting}
                className="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-sm font-bold text-white hover:bg-blue-700 disabled:opacity-50"
              >
                {submitting && <Loader2 className="h-4 w-4 animate-spin" />}
                Xác nhận
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
