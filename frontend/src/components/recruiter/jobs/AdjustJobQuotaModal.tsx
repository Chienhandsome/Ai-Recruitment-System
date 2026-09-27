"use client";

import React, { useState } from "react";
import { X, Users, TrendingUp, CheckCircle2, AlertCircle, Loader2 } from "lucide-react";
import { adjustJobQuota, type JobPostingData } from "@/lib/recruiter-api";
import { toast } from "sonner";

interface AdjustJobQuotaModalProps {
  isOpen: boolean;
  onClose: () => void;
  job: JobPostingData;
  token: string;
  onSuccess: (updatedJob: JobPostingData) => void;
}

export function AdjustJobQuotaModal({
  isOpen,
  onClose,
  job,
  token,
  onSuccess,
}: AdjustJobQuotaModalProps) {
  const currentHired = job.hiredCount ?? (job.applications?.filter((a: any) => a.currentStage === "HIRED").length || 0);
  const currentQuota = job.targetHires ?? 1;

  const [targetHires, setTargetHires] = useState<number>(Math.max(currentQuota, currentHired + 1));
  const [reopenIfClosed, setReopenIfClosed] = useState<boolean>(true);
  const [loading, setLoading] = useState(false);

  if (!isOpen) return null;

  const isClosed = job.status === "CLOSED";
  const wasClosedForQuota = isClosed && job.closeReason === "QUOTA_REACHED";

  const handleIncrement = (amount: number) => {
    setTargetHires((prev) => Math.max(1, prev + amount));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (targetHires < 1) {
      toast.error("Chỉ tiêu tuyển dụng phải từ 1 người trở lên.");
      return;
    }

    setLoading(true);
    try {
      const updated = await adjustJobQuota(token, job.id, {
        targetHires,
        reopenIfClosed,
      });

      toast.success(
        `Đã điều chỉnh chỉ tiêu lên ${targetHires} người!${
          (updated as any).reopened ? " Tin tuyển dụng đã được tự động mở lại." : ""
        }`
      );
      onSuccess(updated);
      onClose();
    } catch (err: any) {
      toast.error(err.message || "Không thể điều chỉnh chỉ tiêu.");
    } finally {
      setLoading(false);
    }
  };

  const progressPercent = targetHires > 0 ? Math.min(100, Math.round((currentHired / targetHires) * 100)) : 0;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200 font-sans">
      <div className="bg-white rounded-2xl max-w-lg w-full shadow-2xl border border-slate-200 overflow-hidden flex flex-col">
        {/* Modal Header */}
        <div className="p-6 border-b border-slate-200 flex items-center justify-between bg-gradient-to-r from-blue-50/80 to-white">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-[#EFF6FF] rounded-xl text-[#2563EB] border border-blue-200 shadow-sm">
              <TrendingUp className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-extrabold text-[#1F2937]">Điều chỉnh Chỉ tiêu Tuyển dụng</h2>
              <p className="text-xs text-slate-500 font-medium">
                Vị trí: <span className="font-semibold text-slate-700">{job.title}</span> ({job.jobCode})
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-100 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Content Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-5">
          {/* Current Status Overview */}
          <div className="p-4 bg-[#EFF6FF] rounded-xl border border-blue-200 space-y-3">
            <div className="flex justify-between items-center text-xs">
              <span className="font-bold text-[#1F2937] flex items-center gap-1.5">
                <Users className="w-4 h-4 text-[#2563EB]" /> Tiến độ tuyển dụng hiện tại
              </span>
              <span className="font-extrabold text-[#2563EB]">
                {currentHired} / {targetHires} người ({progressPercent}%)
              </span>
            </div>

            {/* Progress Bar */}
            <div className="w-full bg-blue-100 h-2.5 rounded-full overflow-hidden">
              <div
                className="bg-[#2563EB] h-full transition-all duration-300 rounded-full"
                style={{ width: `${progressPercent}%` }}
              />
            </div>

            <div className="flex justify-between text-[11px] text-slate-500 font-medium">
              <span>Đã tuyển (HIRED): <strong className="text-slate-700">{currentHired}</strong></span>
              <span>Chỉ tiêu cũ: <strong className="text-slate-700">{currentQuota}</strong></span>
              <span>Mới: <strong className="text-[#2563EB]">{targetHires}</strong></span>
            </div>
          </div>

          {/* Target Hires Input */}
          <div className="space-y-2">
            <label className="block text-xs font-bold text-[#1F2937]">
              Chỉ tiêu tuyển dụng mong muốn (Headcount) <span className="text-red-500">*</span>
            </label>
            <div className="flex items-center gap-3">
              <input
                type="number"
                min="1"
                value={targetHires}
                onChange={(e) => setTargetHires(Math.max(1, parseInt(e.target.value) || 1))}
                className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#2563EB] text-[#1F2937] font-bold text-base"
                required
              />
              <div className="flex gap-1.5 shrink-0">
                <button
                  type="button"
                  onClick={() => handleIncrement(1)}
                  className="px-3 py-2 bg-[#EFF6FF] hover:bg-blue-100 text-[#2563EB] text-xs font-bold rounded-lg border border-blue-200 transition-colors"
                >
                  +1
                </button>
                <button
                  type="button"
                  onClick={() => handleIncrement(2)}
                  className="px-3 py-2 bg-[#EFF6FF] hover:bg-blue-100 text-[#2563EB] text-xs font-bold rounded-lg border border-blue-200 transition-colors"
                >
                  +2
                </button>
                <button
                  type="button"
                  onClick={() => handleIncrement(5)}
                  className="px-3 py-2 bg-[#EFF6FF] hover:bg-blue-100 text-[#2563EB] text-xs font-bold rounded-lg border border-blue-200 transition-colors"
                >
                  +5
                </button>
              </div>
            </div>
            <p className="text-[11px] text-slate-500">
              Tăng chỉ tiêu cho phép nhà tuyển dụng tiếp tục tiếp nhận thêm ứng viên hoặc tuyển dụng từ các ứng viên đang chờ trong Talent Pool.
            </p>
          </div>

          {/* Reopen Checkbox (if closed) */}
          {isClosed && (
            <div className="p-3.5 bg-amber-50/70 border border-amber-200 rounded-xl">
              <label className="flex items-start gap-2.5 cursor-pointer">
                <input
                  type="checkbox"
                  checked={reopenIfClosed}
                  onChange={(e) => setReopenIfClosed(e.target.checked)}
                  className="mt-0.5 w-4 h-4 text-[#2563EB] rounded border-slate-300 focus:ring-[#2563EB]"
                />
                <div>
                  <span className="text-xs font-bold text-[#1F2937] block">
                    Tự động mở lại bài đăng tuyển dụng (Reopen JD)
                  </span>
                  <span className="text-[11px] text-slate-600 block mt-0.5">
                    {wasClosedForQuota
                      ? "Bài đăng này đã tự động đóng khi đạt chỉ tiêu cũ. Đánh dấu để mở lại tin ngay khi tăng chỉ tiêu (nếu hạn nộp hồ sơ còn hiệu lực)."
                      : "Mở lại bài đăng để ứng viên có thể tiếp tục xem và ứng tuyển."}
                  </span>
                </div>
              </label>
            </div>
          )}

          {/* Talent Pool Safety Callout */}
          <div className="flex items-start gap-2.5 p-3 bg-emerald-50 text-emerald-800 rounded-xl border border-emerald-200 text-xs">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
            <div className="text-[11px] leading-relaxed">
              <strong>Bảo lưu Talent Pool an toàn:</strong> Toàn bộ ứng viên đã ứng tuyển trước đó vẫn được lưu giữ an toàn trong quy trình. Bạn có thể duyệt tiếp để phỏng vấn hoặc gửi Offer ngay sau khi tăng chỉ tiêu.
            </div>
          </div>

          {/* Modal Actions */}
          <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100">
            <button
              type="button"
              onClick={onClose}
              disabled={loading}
              className="px-4 py-2.5 text-xs font-bold text-slate-600 hover:bg-slate-100 rounded-xl transition-colors"
            >
              Hủy bỏ
            </button>
            <button
              type="submit"
              disabled={loading}
              className="inline-flex items-center justify-center gap-2 px-5 py-2.5 bg-[#2563EB] hover:bg-[#1D4ED8] text-white text-xs font-bold rounded-xl shadow-md shadow-blue-600/20 active:scale-95 transition-all disabled:opacity-50"
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Đang lưu...
                </>
              ) : (
                "Xác nhận thay đổi chỉ tiêu"
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
