'use client';

import React, { useState, useEffect } from 'react';
import {
  X,
  ShieldCheck,
  ShieldAlert,
  Loader2,
  Calendar,
  CheckCircle2,
  Coins,
  FileText,
  AlertCircle,
  ExternalLink,
  Clock,
  MessageSquare,
  AlertTriangle,
} from 'lucide-react';
import { toast } from 'sonner';
import {
  getContractWarrantyStatus,
  claimContractWarranty,
  type ContractWarrantyStatus,
  type WarrantyReason,
} from '@/lib/contract-api';

interface ClaimWarrantyModalProps {
  isOpen: boolean;
  onClose: () => void;
  token: string;
  contractId: string;
  contractNumber: string;
  candidateName: string;
  jobTitle: string;
  startDate: string;
  onSuccess: () => void | Promise<void>;
}

export function ClaimWarrantyModal({
  isOpen,
  onClose,
  token,
  contractId,
  contractNumber,
  candidateName,
  jobTitle,
  startDate,
  onSuccess,
}: ClaimWarrantyModalProps) {
  const [loadingStatus, setLoadingStatus] = useState<boolean>(true);
  const [warrantyStatus, setWarrantyStatus] = useState<ContractWarrantyStatus | null>(null);
  const [reason, setReason] = useState<WarrantyReason>('NO_SHOW');
  const [note, setNote] = useState<string>('');
  const [evidenceUrl, setEvidenceUrl] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

  useEffect(() => {
    if (!isOpen || !contractId) return;

    let isMounted = true;
    setLoadingStatus(true);
    getContractWarrantyStatus(token, contractId)
      .then((data) => {
        if (isMounted) {
          setWarrantyStatus(data);
        }
      })
      .catch((err) => {
        console.error('Error fetching warranty status:', err);
      })
      .finally(() => {
        if (isMounted) {
          setLoadingStatus(false);
        }
      });

    return () => {
      isMounted = false;
    };
  }, [isOpen, contractId, token]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!note.trim()) {
      toast.error('Vui lòng nhập lý do và diễn giải chi tiết tình huống.');
      return;
    }

    try {
      setIsSubmitting(true);
      const res = await claimContractWarranty(token, contractId, {
        reason,
        compensationType: 'CREDIT_REFUND',
        note: note.trim(),
        evidenceUrl: evidenceUrl.trim() || undefined,
      });

      toast.success(
        `Đã gửi yêu cầu bảo hành (${res.claimNumber}). Hồ sơ đang được Ban Quản trị tiếp nhận thẩm định đối soát.`
      );
      await onSuccess();
      onClose();
    } catch (err: any) {
      toast.error(err.message || 'Không thể gửi yêu cầu bảo hành. Vui lòng thử lại.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const existingClaim = warrantyStatus?.existingClaim;
  const isEligible = warrantyStatus ? warrantyStatus.isEligible : true;
  const daysRemaining = warrantyStatus?.daysRemaining ?? 30;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-200">
      <div
        className="relative w-full max-w-2xl bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[90vh]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-start justify-between px-6 py-5 border-b border-slate-100 bg-slate-50/50">
          <div className="flex items-center gap-3">
            <div className="flex size-10 items-center justify-center rounded-xl bg-blue-50 text-[#2563EB] border border-blue-100">
              <ShieldCheck className="size-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900 tracking-tight">
                Bảo Hành Tuyển Dụng B2B (30 Ngày)
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Chính sách thẩm định và bồi hoàn credit khi ứng viên không nhận việc hoặc nghỉ việc sớm
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-100 transition-colors"
          >
            <X className="size-5" />
          </button>
        </div>

        {/* Body */}
        <div className="px-6 py-5 overflow-y-auto space-y-5 flex-1">
          {/* Contract Overview Box */}
          <div className="rounded-xl border border-slate-200 bg-slate-50/60 p-4 space-y-3">
            <div className="flex items-center justify-between flex-wrap gap-2">
              <div className="flex items-center gap-2">
                <span className="text-xs font-semibold text-slate-500">Mã hợp đồng:</span>
                <span className="font-mono text-xs font-bold text-[#2563EB] bg-blue-50 px-2 py-0.5 rounded border border-blue-100">
                  {contractNumber}
                </span>
              </div>
              <div>
                {existingClaim?.status === 'APPROVED' ? (
                  <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-50 border border-emerald-200 px-2.5 py-0.5 text-2xs font-bold text-emerald-700">
                    <CheckCircle2 className="size-3" />
                    Admin đã phê duyệt bảo hành
                  </span>
                ) : existingClaim?.status === 'PENDING' ? (
                  <span className="inline-flex items-center gap-1.5 rounded-full bg-amber-50 border border-amber-200 px-2.5 py-0.5 text-2xs font-bold text-amber-700 animate-pulse">
                    <Clock className="size-3" />
                    Đang chờ Admin thẩm định
                  </span>
                ) : existingClaim?.status === 'REJECTED' ? (
                  <span className="inline-flex items-center gap-1.5 rounded-full bg-rose-50 border border-rose-200 px-2.5 py-0.5 text-2xs font-bold text-rose-700">
                    <AlertTriangle className="size-3" />
                    Yêu cầu đã bị từ chối
                  </span>
                ) : isEligible ? (
                  <span className="inline-flex items-center gap-1.5 rounded-full bg-blue-50 border border-blue-200 px-2.5 py-0.5 text-2xs font-bold text-[#2563EB]">
                    <Clock className="size-3" />
                    Thời hạn bảo hành còn {daysRemaining} ngày
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1.5 rounded-full bg-slate-100 border border-slate-200 px-2.5 py-0.5 text-2xs font-semibold text-slate-600">
                    Hết thời hạn bảo hành 30 ngày
                  </span>
                )}
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs pt-1 border-t border-slate-200/60">
              <div>
                <span className="text-slate-400 block text-2xs">Ứng viên:</span>
                <span className="font-semibold text-slate-800">{candidateName}</span>
              </div>
              <div>
                <span className="text-slate-400 block text-2xs">Vị trí:</span>
                <span className="font-medium text-slate-700 truncate block">{jobTitle}</span>
              </div>
              <div>
                <span className="text-slate-400 block text-2xs">Ngày nhận việc:</span>
                <span className="font-medium text-slate-700">
                  {startDate ? new Date(startDate).toLocaleDateString('vi-VN') : '---'}
                </span>
              </div>
            </div>
          </div>

          {loadingStatus ? (
            <div className="flex items-center justify-center py-10 text-slate-400 gap-2">
              <Loader2 className="size-5 animate-spin text-[#2563EB]" />
              <span className="text-xs">Đang kiểm tra hồ sơ bảo hành...</span>
            </div>
          ) : existingClaim ? (
            /* VIEW EXISTING CLAIM IN VARIOUS STATUSES */
            <div className="space-y-4">
              <div
                className={`rounded-xl border p-4 space-y-3 ${
                  existingClaim.status === 'APPROVED'
                    ? 'border-emerald-200 bg-emerald-50/50'
                    : existingClaim.status === 'PENDING'
                    ? 'border-amber-200 bg-amber-50/50'
                    : 'border-rose-200 bg-rose-50/50'
                }`}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 font-semibold text-sm">
                    {existingClaim.status === 'APPROVED' ? (
                      <>
                        <CheckCircle2 className="size-4 text-emerald-600" />
                        <span className="text-emerald-900">Bảo hành đã được Admin phê duyệt bồi hoàn</span>
                      </>
                    ) : existingClaim.status === 'PENDING' ? (
                      <>
                        <Clock className="size-4 text-amber-600" />
                        <span className="text-amber-900">Hồ sơ đang chờ Ban Quản trị thẩm định</span>
                      </>
                    ) : (
                      <>
                        <AlertTriangle className="size-4 text-rose-600" />
                        <span className="text-rose-900">Yêu cầu bảo hành đã bị từ chối</span>
                      </>
                    )}
                  </div>
                  <span className="font-mono text-xs font-bold px-2 py-0.5 rounded bg-white/80 border border-slate-200">
                    {existingClaim.claimNumber}
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-3 text-xs pt-1">
                  <div>
                    <span className="text-slate-500 block text-2xs">Lý do bảo hành:</span>
                    <strong className="text-slate-900">
                      {existingClaim.reason === 'NO_SHOW'
                        ? 'Không đến nhận việc (No-Show)'
                        : 'Tự ý nghỉ việc trong 30 ngày (Early Resignation)'}
                    </strong>
                  </div>
                  <div>
                    <span className="text-slate-500 block text-2xs">Thời điểm gửi yêu cầu:</span>
                    <span className="text-slate-700">
                      {new Date(existingClaim.createdAt).toLocaleString('vi-VN')}
                    </span>
                  </div>
                  {existingClaim.status === 'APPROVED' && (
                    <>
                      <div>
                        <span className="text-slate-500 block text-2xs">Lượt mở CV đã hoàn:</span>
                        <strong className="text-emerald-800">+{existingClaim.creditRefunded} CV Unlock Credit</strong>
                      </div>
                      <div>
                        <span className="text-slate-500 block text-2xs">Gia hạn tin tuyển dụng:</span>
                        <strong className="text-emerald-800">+{existingClaim.daysExtended} ngày</strong>
                      </div>
                    </>
                  )}
                </div>

                {existingClaim.note && (
                  <div className="text-xs pt-2 border-t border-slate-200/60">
                    <span className="text-2xs font-semibold text-slate-500 block">Diễn giải của Doanh nghiệp:</span>
                    <p className="mt-0.5 text-slate-800 italic bg-white/70 p-2.5 rounded-lg border border-slate-100">
                      {existingClaim.note}
                    </p>
                  </div>
                )}

                {/* Candidate feedback if any */}
                {existingClaim.candidateResponse && (
                  <div className="text-xs pt-2 border-t border-slate-200/60">
                    <span className="text-2xs font-semibold text-blue-700 flex items-center gap-1">
                      <MessageSquare className="size-3" />
                      Phản hồi / Đối chất từ Ứng viên ({existingClaim.candidateRespondedAt ? new Date(existingClaim.candidateRespondedAt).toLocaleDateString('vi-VN') : ''}):
                    </span>
                    <p className="mt-0.5 text-slate-800 bg-blue-50/70 p-2.5 rounded-lg border border-blue-100 italic">
                      "{existingClaim.candidateResponse}"
                    </p>
                  </div>
                )}

                {/* Admin Note if resolved */}
                {existingClaim.adminNote && (
                  <div className="text-xs pt-2 border-t border-slate-200/60">
                    <span className="text-2xs font-semibold text-slate-600 block">
                      Ý kiến thẩm định từ Ban Quản trị:
                    </span>
                    <p className="mt-0.5 text-slate-900 font-medium bg-white/80 p-2.5 rounded-lg border border-slate-200">
                      {existingClaim.adminNote}
                    </p>
                  </div>
                )}

                {existingClaim.evidenceUrl && (
                  <div className="pt-1">
                    <a
                      href={existingClaim.evidenceUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1 text-xs text-[#2563EB] hover:underline"
                    >
                      <ExternalLink className="size-3" />
                      Xem biên bản / tài liệu minh chứng đính kèm
                    </a>
                  </div>
                )}
              </div>

              <div className="flex justify-end pt-2">
                <button
                  type="button"
                  onClick={onClose}
                  className="px-4 py-2 text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-xl transition-colors cursor-pointer"
                >
                  Đóng
                </button>
              </div>
            </div>
          ) : !isEligible ? (
            /* NOT ELIGIBLE CASE */
            <div className="space-y-4">
              <div className="rounded-xl border border-amber-200 bg-amber-50/60 p-4 flex items-start gap-3">
                <AlertCircle className="size-5 text-amber-600 shrink-0 mt-0.5" />
                <div className="text-xs text-amber-900 space-y-1">
                  <p className="font-semibold">Hợp đồng không đủ điều kiện gửi yêu cầu bảo hành</p>
                  <p className="text-amber-800/90 leading-relaxed">
                    Chính sách bảo hành B2B chỉ áp dụng cho hợp đồng đã ký kết chính thức và còn trong khung thời gian
                    30 ngày kể từ ngày bắt đầu nhận việc ghi trong hợp đồng.
                  </p>
                </div>
              </div>
              <div className="flex justify-end">
                <button
                  type="button"
                  onClick={onClose}
                  className="px-4 py-2 text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-xl transition-colors cursor-pointer"
                >
                  Đóng
                </button>
              </div>
            </div>
          ) : (
            /* SUBMIT CLAIM FORM */
            <form onSubmit={handleSubmit} className="space-y-5">
              {/* Process notice */}
              <div className="rounded-xl border border-blue-200 bg-blue-50/50 p-3.5 flex items-start gap-2.5">
                <AlertCircle className="size-4 text-[#2563EB] shrink-0 mt-0.5" />
                <div className="text-xs text-blue-900 leading-relaxed">
                  <strong className="block font-semibold">Quy trình thẩm định công bằng:</strong>
                  Yêu cầu của bạn sẽ được gửi tới Ban Quản trị sàn (Admin). Ứng viên sẽ có quyền phản hồi trong 48h trước khi Admin phê duyệt bồi hoàn Credit.
                </div>
              </div>

              {/* Select Reason: STRICTLY 2 OBJECTIVE REASONS */}
              <div>
                <label className="block text-xs font-bold text-slate-900 mb-2">
                  Lý do kích hoạt bảo hành <span className="text-rose-500">*</span>
                </label>
                <div className="grid grid-cols-1 gap-2.5">
                  {/* Option 1: NO SHOW */}
                  <label
                    className={`flex items-start gap-3 p-3 rounded-xl border cursor-pointer transition-all ${
                      reason === 'NO_SHOW'
                        ? 'border-[#2563EB] bg-[#EFF6FF] shadow-xs'
                        : 'border-slate-200 hover:border-slate-300 bg-white'
                    }`}
                  >
                    <input
                      type="radio"
                      name="warrantyReason"
                      value="NO_SHOW"
                      checked={reason === 'NO_SHOW'}
                      onChange={() => setReason('NO_SHOW')}
                      className="mt-1 text-[#2563EB] focus:ring-[#2563EB]"
                    />
                    <div className="flex-1 text-xs">
                      <div className="font-bold text-slate-900">
                        Không đến nhận việc ngày đầu (First-day No-Show)
                      </div>
                      <div className="text-slate-500 text-2xs mt-0.5 leading-relaxed">
                        Ứng viên đã xác nhận và ký hợp đồng lao động nhưng không đến trình diện nhận việc vào ngày tiếp nhận chính thức theo thỏa thuận.
                      </div>
                    </div>
                  </label>

                  {/* Option 2: EARLY RESIGNATION */}
                  <label
                    className={`flex items-start gap-3 p-3 rounded-xl border cursor-pointer transition-all ${
                      reason === 'EARLY_RESIGNATION'
                        ? 'border-[#2563EB] bg-[#EFF6FF] shadow-xs'
                        : 'border-slate-200 hover:border-slate-300 bg-white'
                    }`}
                  >
                    <input
                      type="radio"
                      name="warrantyReason"
                      value="EARLY_RESIGNATION"
                      checked={reason === 'EARLY_RESIGNATION'}
                      onChange={() => setReason('EARLY_RESIGNATION')}
                      className="mt-1 text-[#2563EB] focus:ring-[#2563EB]"
                    />
                    <div className="flex-1 text-xs">
                      <div className="font-bold text-slate-900">
                        Tự ý nghỉ việc trong vòng 30 ngày (Early Resignation)
                      </div>
                      <div className="text-slate-500 text-2xs mt-0.5 leading-relaxed">
                        Ứng viên đơn phương chấm dứt hợp đồng, xin nghỉ việc hoặc tự ý rời bỏ công việc trong thời hạn 30 ngày đầu nhận việc.
                      </div>
                    </div>
                  </label>
                </div>
              </div>

              {/* Compensation details */}
              <div className="rounded-xl border border-slate-200 bg-slate-50 p-4 space-y-2">
                <div className="flex items-center gap-2 text-xs font-bold text-slate-800">
                  <Coins className="size-4 text-[#2563EB]" />
                  Quyền lợi được bồi hoàn khi Admin phê duyệt
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs text-slate-700">
                  <div className="flex items-center gap-2 bg-white rounded-lg p-2.5 border border-slate-200">
                    <span className="flex size-5 items-center justify-center rounded-full bg-blue-100 text-[#2563EB] text-2xs font-bold">
                      +1
                    </span>
                    <div>
                      <span className="font-bold text-slate-900 block text-2xs">Hoàn 1 CV Unlock Credit</span>
                      <span className="text-2xs text-slate-500">Cộng vào số dư gói tuyển dụng</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 bg-white rounded-lg p-2.5 border border-slate-200">
                    <span className="flex size-5 items-center justify-center rounded-full bg-blue-100 text-[#2563EB] text-2xs font-bold">
                      +30
                    </span>
                    <div>
                      <span className="font-bold text-slate-900 block text-2xs">Gia hạn tin tuyển dụng</span>
                      <span className="text-2xs text-slate-500">Thêm 30 ngày để tìm ứng viên mới</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Note / Description Textarea */}
              <div>
                <label className="block text-xs font-bold text-slate-900 mb-1.5">
                  Diễn giải sự việc chi tiết <span className="text-rose-500">*</span>
                </label>
                <textarea
                  rows={3}
                  value={note}
                  onChange={(e) => setNote(e.target.value)}
                  placeholder="Ví dụ: Ứng viên gửi email thông báo hủy việc vào ngày 15/10 do nhận được offer khác / Ứng viên không đến công ty và không liên lạc được..."
                  className="w-full text-xs rounded-xl border border-slate-300 p-3 text-slate-900 focus:border-[#2563EB] focus:ring-1 focus:ring-[#2563EB] outline-hidden placeholder:text-slate-400"
                  required
                />
              </div>

              {/* Optional Evidence URL */}
              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1.5">
                  Đường dẫn biên bản / xác nhận (nếu có)
                </label>
                <input
                  type="url"
                  value={evidenceUrl}
                  onChange={(e) => setEvidenceUrl(e.target.value)}
                  placeholder="https://drive.google.com/... hoặc liên kết lưu trữ tài liệu"
                  className="w-full text-xs rounded-xl border border-slate-300 px-3 py-2 text-slate-900 focus:border-[#2563EB] focus:ring-1 focus:ring-[#2563EB] outline-hidden placeholder:text-slate-400"
                />
                <span className="text-2xs text-slate-400 mt-1 block">
                  Đính kèm link email từ chối, biên bản bàn giao hoặc đơn xin thôi việc để phục vụ Admin đối soát nhanh chóng.
                </span>
              </div>

              {/* Actions */}
              <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={onClose}
                  disabled={isSubmitting}
                  className="px-4 py-2 text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-xl transition-colors disabled:opacity-50 cursor-pointer"
                >
                  Hủy bỏ
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting || !note.trim()}
                  className="inline-flex items-center gap-2 px-5 py-2 text-xs font-bold text-white bg-[#2563EB] hover:bg-blue-700 rounded-xl shadow-xs transition-colors disabled:opacity-50 cursor-pointer"
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="size-3.5 animate-spin" />
                      Đang gửi yêu cầu...
                    </>
                  ) : (
                    <>
                      <ShieldCheck className="size-3.5" />
                      Gửi Yêu Cầu Bảo Hành (Chờ Admin Duyệt)
                    </>
                  )}
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
