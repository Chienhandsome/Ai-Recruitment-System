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
  Paperclip,
  UploadCloud,
} from 'lucide-react';
import { toast } from 'sonner';
import {
  getContractWarrantyStatus,
  claimContractWarranty,
  type ContractWarrantyStatus,
  type WarrantyReason,
} from '@/lib/contract-api';
import { uploadDisputeEvidence } from '@/lib/dispute-api';

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
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [filePreviews, setFilePreviews] = useState<
    Array<{ name: string; size: number; previewUrl?: string; isImage: boolean }>
  >([]);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [zoomedImageUrl, setZoomedImageUrl] = useState<string | null>(null);

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

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files) return;
    const filesArray = Array.from(e.target.files);
    const validFiles: File[] = [];
    filesArray.forEach((file) => {
      if (file.size > 15 * 1024 * 1024) {
        toast.error(`Tệp "${file.name}" vượt quá 15MB cho phép.`);
        return;
      }
      validFiles.push(file);
    });

    const newSelected = [...selectedFiles, ...validFiles].slice(0, 5);
    setSelectedFiles(newSelected);

    const previews = newSelected.map((f) => ({
      name: f.name,
      size: f.size,
      isImage: f.type.startsWith('image/'),
      previewUrl: f.type.startsWith('image/') ? URL.createObjectURL(f) : undefined,
    }));
    setFilePreviews(previews);
  };

  const removeFile = (index: number) => {
    const updated = selectedFiles.filter((_, i) => i !== index);
    setSelectedFiles(updated);
    const previews = updated.map((f) => ({
      name: f.name,
      size: f.size,
      isImage: f.type.startsWith('image/'),
      previewUrl: f.type.startsWith('image/') ? URL.createObjectURL(f) : undefined,
    }));
    setFilePreviews(previews);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!note.trim()) {
      toast.error('Vui lòng nhập lý do và diễn giải chi tiết tình huống.');
      return;
    }

    try {
      setIsSubmitting(true);

      let finalEvidenceUrl: string | undefined = undefined;
      if (selectedFiles.length > 0) {
        toast.info('Đang tải tệp bằng chứng lên hệ thống lưu trữ bất biến...');
        const uploaded = await uploadDisputeEvidence(token, selectedFiles);
        if (uploaded.length > 0) {
          finalEvidenceUrl = uploaded.map((u) => u.url).join(',');
        }
      }

      const res = await claimContractWarranty(token, contractId, {
        reason,
        compensationType: 'CREDIT_REFUND',
        note: note.trim(),
        evidenceUrl: finalEvidenceUrl,
      });

      toast.success(
        `Đã gửi yêu cầu bảo hành (${res.claimNumber}). Hồ sơ và bằng chứng đã được lưu trữ an toàn.`
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
                  <div className="pt-2 border-t border-slate-200/60">
                    <span className="text-3xs font-extrabold text-slate-500 uppercase tracking-wider block mb-1.5 flex items-center gap-1">
                      <ShieldCheck className="size-3 text-emerald-600" />
                      Tệp minh chứng đã lưu vết hệ thống (SHA-256):
                    </span>
                    <div className="flex flex-wrap gap-2">
                      {existingClaim.evidenceUrl.split(',').map((url, i) => {
                        const trimmed = url.trim();
                        const isImg =
                          trimmed.startsWith('data:image/') ||
                          /\.(png|jpe?g|webp|gif)($|\?)/i.test(trimmed) ||
                          trimmed.includes('.png') ||
                          trimmed.includes('.jpg');

                        if (isImg) {
                          return (
                            <button
                              key={i}
                              type="button"
                              onClick={() => setZoomedImageUrl(trimmed)}
                              className="group relative rounded-xl border border-slate-200 overflow-hidden shadow-2xs hover:border-[#2563EB] transition-all bg-white cursor-pointer"
                              title="Bấm để xem ảnh phóng to"
                            >
                              {/* eslint-disable-next-line @next/next/no-img-element */}
                              <img
                                src={trimmed}
                                alt={`Minh chứng #${i + 1}`}
                                className="h-16 w-20 object-cover group-hover:scale-105 transition-transform"
                              />
                              <span className="absolute bottom-0 inset-x-0 bg-slate-900/70 text-white text-3xs py-0.5 text-center font-bold">
                                Ảnh #{i + 1}
                              </span>
                            </button>
                          );
                        }

                        const fileName = trimmed.split('/').pop()?.split('_').pop() || `Tài liệu #${i + 1}`;
                        return (
                          <a
                            key={i}
                            href={trimmed}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-2xs font-bold bg-white border border-slate-200 text-[#2563EB] hover:bg-blue-50 transition-colors shadow-2xs"
                          >
                            <FileText className="size-3.5 text-slate-500" />
                            <span className="max-w-[150px] truncate">{fileName}</span>
                            <ExternalLink className="size-2.5 text-slate-400" />
                          </a>
                        );
                      })}
                    </div>
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

              {/* Evidence File Upload (Tamper-proof storage) */}
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="block text-xs font-bold text-slate-900 flex items-center gap-1.5">
                    <Paperclip className="size-3.5 text-[#2563EB]" />
                    Đính kèm tệp bằng chứng thực tế (Ảnh chụp email, tin nhắn, biên bản scan)
                  </label>
                  <span className="text-3xs text-slate-400 font-medium">Tối đa 5 tệp (≤15MB/tệp)</span>
                </div>

                <div className="relative rounded-2xl border-2 border-dashed border-slate-300 p-4 bg-slate-50/70 hover:bg-blue-50/40 hover:border-[#2563EB]/60 transition-all text-center cursor-pointer group">
                  <input
                    type="file"
                    multiple
                    accept="image/png,image/jpeg,image/webp,application/pdf,.doc,.docx"
                    onChange={handleFileChange}
                    disabled={isSubmitting}
                    className="absolute inset-0 opacity-0 w-full h-full cursor-pointer z-10"
                    title="Chọn ảnh hoặc tài liệu bằng chứng"
                  />
                  <div className="flex flex-col items-center justify-center gap-1.5 pointer-events-none">
                    <div className="size-9 rounded-xl bg-blue-100 text-[#2563EB] flex items-center justify-center group-hover:scale-110 transition-transform">
                      <UploadCloud className="size-5" />
                    </div>
                    <span className="text-xs font-bold text-slate-700">
                      Bấm vào đây hoặc kéo thả ảnh / tệp bằng chứng
                    </span>
                    <span className="text-3xs text-slate-500">
                      Chấp nhận hình ảnh (PNG, JPG, WEBP) hoặc tệp PDF, Word biên bản
                    </span>
                  </div>
                </div>

                {/* Anti-tamper warning */}
                <div className="mt-2 flex items-start gap-1.5 text-3xs text-slate-500 bg-slate-100 p-2 rounded-xl border border-slate-200">
                  <ShieldCheck className="size-3.5 text-emerald-600 shrink-0 mt-0.5" />
                  <span>
                    <strong>Bảo chứng pháp lý:</strong> Tệp được hệ thống mã hóa SHA-256 và lưu trữ trực tiếp trên máy chủ tuyển dụng, đảm bảo tính toàn vẹn và không thể bị sửa đổi/xóa bỏ sau khi nộp.
                  </span>
                </div>

                {/* Selected File Previews */}
                {filePreviews.length > 0 && (
                  <div className="mt-2.5 flex flex-wrap gap-2">
                    {filePreviews.map((f, idx) => (
                      <div
                        key={idx}
                        className="flex items-center gap-2 p-1.5 pr-2 rounded-xl bg-white border border-slate-200 text-2xs shadow-2xs"
                      >
                        {f.isImage && f.previewUrl ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img
                            src={f.previewUrl}
                            alt="preview"
                            className="size-7 rounded-lg object-cover border border-slate-200 shrink-0"
                          />
                        ) : (
                          <FileText className="size-4.5 text-[#2563EB] shrink-0" />
                        )}
                        <div className="flex flex-col min-w-0">
                          <span className="truncate max-w-[130px] font-bold text-slate-800">
                            {f.name}
                          </span>
                          <span className="text-3xs text-slate-400">
                            {(f.size / 1024).toFixed(0)} KB
                          </span>
                        </div>
                        <button
                          type="button"
                          onClick={() => removeFile(idx)}
                          disabled={isSubmitting}
                          className="text-slate-400 hover:text-rose-600 p-1 rounded-lg hover:bg-slate-100 transition-colors cursor-pointer"
                          title="Gỡ bỏ tệp"
                        >
                          <X className="size-3.5" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
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
                      Đang xử lý & lưu bằng chứng...
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

      {/* Lightbox for zooming evidence images */}
      {zoomedImageUrl && (
        <div
          className="fixed inset-0 z-[150] flex items-center justify-center bg-black/80 p-4 animate-in fade-in duration-200"
          onClick={() => setZoomedImageUrl(null)}
        >
          <div
            className="relative max-w-4xl max-h-[90vh] bg-slate-900 rounded-2xl overflow-hidden shadow-2xl border border-slate-700 p-2 flex flex-col items-center"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="w-full flex items-center justify-between pb-2 px-2 text-white text-xs border-b border-slate-800">
              <span className="font-semibold flex items-center gap-1.5">
                <ShieldCheck className="size-4 text-emerald-400" />
                Minh Chứng Gốc Lưu Trữ Hệ Thống (Bất biến SHA-256)
              </span>
              <div className="flex items-center gap-3">
                <a
                  href={zoomedImageUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center gap-1 text-2xs text-blue-400 hover:text-blue-300 underline"
                >
                  <ExternalLink className="size-3" /> Mở trong tab mới
                </a>
                <button
                  type="button"
                  onClick={() => setZoomedImageUrl(null)}
                  className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
                >
                  <X className="size-4" />
                </button>
              </div>
            </div>
            <div className="p-2 overflow-auto max-h-[80vh] flex items-center justify-center">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={zoomedImageUrl}
                alt="Minh chứng phóng to"
                className="max-h-[75vh] w-auto max-w-full rounded-lg object-contain shadow-md"
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
