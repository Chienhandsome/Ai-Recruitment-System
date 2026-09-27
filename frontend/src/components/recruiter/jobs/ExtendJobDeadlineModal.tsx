"use client";

import React, { useState } from "react";
import { X, Calendar, Clock, AlertTriangle, CheckCircle2, Loader2, Sparkles } from "lucide-react";
import { extendJobExpiry, type JobPostingData } from "@/lib/recruiter-api";
import { format, addDays, isPast, isToday } from "date-fns";
import { toast } from "sonner";

interface ExtendJobDeadlineModalProps {
  isOpen: boolean;
  onClose: () => void;
  job: JobPostingData;
  token: string;
  onSuccess: (updatedJob: JobPostingData) => void;
}

export function ExtendJobDeadlineModal({
  isOpen,
  onClose,
  job,
  token,
  onSuccess,
}: ExtendJobDeadlineModalProps) {
  const currentExpiry = job.expiryDate ? new Date(job.expiryDate) : null;
  const isExpired = currentExpiry ? isPast(currentExpiry) && !isToday(currentExpiry) : false;

  // Default new date: 14 days from today
  const defaultDate = addDays(new Date(), 14).toISOString().split("T")[0];
  const [expiryDate, setExpiryDate] = useState<string>(defaultDate);
  const [reopenIfClosed, setReopenIfClosed] = useState<boolean>(true);
  const [loading, setLoading] = useState(false);

  if (!isOpen) return null;

  const isClosed = job.status === "CLOSED";
  const wasClosedForExpiry = isClosed && job.closeReason === "EXPIRED";

  const handleQuickAddDays = (days: number) => {
    const baseDate = currentExpiry && !isExpired ? currentExpiry : new Date();
    const newDate = addDays(baseDate, days).toISOString().split("T")[0];
    setExpiryDate(newDate);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!expiryDate) {
      toast.error("Vui lòng chọn ngày hết hạn mới.");
      return;
    }

    const selectedDate = new Date(expiryDate);
    if (selectedDate <= new Date()) {
      toast.error("Ngày hết hạn mới phải lớn hơn thời điểm hiện tại.");
      return;
    }

    setLoading(true);
    try {
      const updated = await extendJobExpiry(token, job.id, {
        expiryDate,
        reopenIfClosed,
      });

      toast.success(
        `Đã gia hạn tin tuyển dụng đến ${format(selectedDate, "dd/MM/yyyy")}!${
          (updated as any).reopened ? " Tin tuyển dụng đã được tự động mở lại." : ""
        }`
      );
      onSuccess(updated);
      onClose();
    } catch (err: any) {
      toast.error(err.message || "Không thể gia hạn bài đăng.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200 font-sans">
      <div className="bg-white rounded-2xl max-w-lg w-full shadow-2xl border border-slate-200 overflow-hidden flex flex-col">
        {/* Modal Header */}
        <div className="p-6 border-b border-slate-200 flex items-center justify-between bg-gradient-to-r from-blue-50/80 to-white">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-[#EFF6FF] rounded-xl text-[#2563EB] border border-blue-200 shadow-sm">
              <Calendar className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-extrabold text-[#1F2937]">Gia hạn Thời hạn Tuyển dụng</h2>
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

        {/* Modal Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-5">
          {/* Current Expiry Status */}
          <div
            className={`p-4 rounded-xl border flex items-start justify-between ${
              isExpired
                ? "bg-rose-50 border-rose-200 text-rose-800"
                : "bg-[#EFF6FF] border-blue-200 text-[#1F2937]"
            }`}
          >
            <div className="space-y-1">
              <span className="text-[11px] font-bold uppercase tracking-wider block opacity-80">
                Thời hạn tuyển dụng hiện tại
              </span>
              <div className="flex items-center gap-2">
                <Clock className="w-4 h-4 text-[#2563EB]" />
                <span className="text-sm font-extrabold">
                  {currentExpiry ? format(currentExpiry, "dd/MM/yyyy") : "Chưa đặt thời hạn"}
                </span>
              </div>
            </div>
            <span
              className={`text-xs font-bold px-2.5 py-1 rounded-full border ${
                isExpired
                  ? "bg-rose-100 text-rose-700 border-rose-300"
                  : "bg-emerald-50 text-emerald-700 border-emerald-300"
              }`}
            >
              {isExpired ? "ĐÃ HẾT HẠN" : "CÒN HIỆU LỰC"}
            </span>
          </div>

          {/* New Expiry Date Input */}
          <div className="space-y-2">
            <label className="block text-xs font-bold text-[#1F2937]">
              Chọn ngày hết hạn mới (Deadline) <span className="text-red-500">*</span>
            </label>
            <input
              type="date"
              min={addDays(new Date(), 1).toISOString().split("T")[0]}
              value={expiryDate}
              onChange={(e) => setExpiryDate(e.target.value)}
              className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#2563EB] text-[#1F2937] font-semibold text-sm"
              required
            />

            {/* Quick Presets */}
            <div className="flex items-center gap-2 pt-1">
              <span className="text-[11px] text-slate-500 font-medium">Gia hạn nhanh:</span>
              <button
                type="button"
                onClick={() => handleQuickAddDays(7)}
                className="px-2.5 py-1 bg-[#EFF6FF] hover:bg-blue-100 text-[#2563EB] text-xs font-bold rounded-lg border border-blue-200 transition-colors"
              >
                +7 ngày
              </button>
              <button
                type="button"
                onClick={() => handleQuickAddDays(14)}
                className="px-2.5 py-1 bg-[#EFF6FF] hover:bg-blue-100 text-[#2563EB] text-xs font-bold rounded-lg border border-blue-200 transition-colors"
              >
                +14 ngày
              </button>
              <button
                type="button"
                onClick={() => handleQuickAddDays(30)}
                className="px-2.5 py-1 bg-[#EFF6FF] hover:bg-blue-100 text-[#2563EB] text-xs font-bold rounded-lg border border-blue-200 transition-colors"
              >
                +30 ngày
              </button>
            </div>
          </div>

          {/* Auto Reopen Option */}
          {isClosed && (
            <div className="p-3.5 bg-blue-50/70 border border-blue-200 rounded-xl">
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
                    {wasClosedForExpiry
                      ? "Bài tuyển dụng này đã tự động đóng khi hết hạn. Đánh dấu để đưa tin hiển thị trở lại trên bảng tin tìm việc của ứng viên ngay lập tức."
                      : "Mở lại bài đăng để ứng viên có thể nộp hồ sơ."}
                  </span>
                </div>
              </label>
            </div>
          )}

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
                  Đang xử lý...
                </>
              ) : (
                "Xác nhận gia hạn"
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
