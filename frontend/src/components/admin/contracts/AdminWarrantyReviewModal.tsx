'use client';

import React, { useState, useEffect } from 'react';
import {
  X,
  ShieldCheck,
  ShieldAlert,
  Loader2,
  Calendar,
  CheckCircle2,
  AlertTriangle,
  ExternalLink,
  Coins,
  Clock,
  User,
  Building2,
  FileText,
  MessageSquare,
  Lock,
} from 'lucide-react';
import { toast } from 'sonner';
import {
  getAdminWarrantyClaimDetail,
  adminApproveWarranty,
  adminRejectWarranty,
  type WarrantyClaimInfo,
} from '@/lib/contract-api';

interface AdminWarrantyReviewModalProps {
  isOpen: boolean;
  onClose: () => void;
  token: string;
  claimId: string;
  onResolved: () => void | Promise<void>;
}

export function AdminWarrantyReviewModal({
  isOpen,
  onClose,
  token,
  claimId,
  onResolved,
}: AdminWarrantyReviewModalProps) {
  const [loading, setLoading] = useState<boolean>(true);
  const [claim, setClaim] = useState<WarrantyClaimInfo | null>(null);
  const [adminNote, setAdminNote] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

  useEffect(() => {
    if (!isOpen || !claimId) return;

    let isMounted = true;
    setLoading(true);
    getAdminWarrantyClaimDetail(token, claimId)
      .then((data) => {
        if (isMounted) {
          setClaim(data);
          if (data.adminNote) {
            setAdminNote(data.adminNote);
          }
        }
      })
      .catch((err) => {
        console.error('Error fetching admin claim detail:', err);
        toast.error('Không thể tải chi tiết hồ sơ bảo hành.');
      })
      .finally(() => {
        if (isMounted) {
          setLoading(false);
        }
      });

    return () => {
      isMounted = false;
    };
  }, [isOpen, claimId, token]);

  if (!isOpen) return null;

  const handleApprove = async () => {
    try {
      setIsSubmitting(true);
      await adminApproveWarranty(token, claimId, adminNote.trim() || undefined);
      toast.success('Đã PHÊ DUYỆT bảo hành. Đã tự động bồi hoàn 1 Credit và gia hạn tin đăng việc 30 ngày.');
      await onResolved();
      onClose();
    } catch (err: any) {
      toast.error(err.message || 'Không thể phê duyệt bảo hành.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleReject = async () => {
    if (!adminNote.trim()) {
      toast.error('Vui lòng nhập lý do từ chối để thông báo cho Nhà tuyển dụng.');
      return;
    }

    try {
      setIsSubmitting(true);
      await adminRejectWarranty(token, claimId, adminNote.trim());
      toast.info('Đã TỪ CHỐI yêu cầu bảo hành.');
      await onResolved();
      onClose();
    } catch (err: any) {
      toast.error(err.message || 'Không thể từ chối bảo hành.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const contract = claim?.contract;
  const isPending = claim?.status === 'PENDING';

  // Calculate days difference between start date and claim date
  let daysFromStart = 0;
  if (contract?.startDate && claim?.createdAt) {
    const s = new Date(contract.startDate).getTime();
    const c = new Date(claim.createdAt).getTime();
    daysFromStart = Math.max(0, Math.round((c - s) / (1000 * 60 * 60 * 24)));
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-200">
      <div
        className="relative w-full max-w-3xl bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[92vh]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-start justify-between px-6 py-4 border-b border-slate-100 bg-slate-50/70">
          <div className="flex items-center gap-3">
            <div className="flex size-10 items-center justify-center rounded-xl bg-blue-50 text-[#2563EB] border border-blue-100">
              <ShieldCheck className="size-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base font-bold text-slate-900 tracking-tight">
                  Thẩm Định Hồ Sơ Bảo Hành Tuyển Dụng
                </h3>
                {claim && (
                  <span
                    className={`rounded-full px-2.5 py-0.5 text-2xs font-extrabold border ${
                      claim.status === 'APPROVED'
                        ? 'bg-emerald-50 text-emerald-800 border-emerald-300'
                        : claim.status === 'PENDING'
                        ? 'bg-amber-50 text-amber-800 border-amber-300 animate-pulse'
                        : 'bg-rose-50 text-rose-800 border-rose-300'
                    }`}
                  >
                    {claim.status === 'APPROVED'
                      ? '✓ Đã Phê Duyệt'
                      : claim.status === 'PENDING'
                      ? '⏳ Chờ Admin Quyết Định'
                      : '✕ Đã Từ Chối'}
                  </span>
                )}
              </div>
              <p className="text-xs text-slate-500 mt-0.5">
                Mã Claim: <strong className="font-mono text-slate-800">{claim?.claimNumber || '...'}</strong> • Hợp đồng:{' '}
                <span className="font-mono text-[#2563EB] font-bold">{contract?.contractNumber}</span>
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
        <div className="px-6 py-5 overflow-y-auto space-y-5 flex-1 text-xs">
          {loading ? (
            <div className="flex items-center justify-center py-16 text-slate-400 gap-2">
              <Loader2 className="size-6 animate-spin text-[#2563EB]" />
              <span>Đang tải hồ sơ thẩm định...</span>
            </div>
          ) : claim ? (
            <>
              {/* Contract & Forensic Overview */}
              <div className="rounded-xl border border-slate-200 bg-slate-50 p-4 space-y-3">
                <div className="font-bold text-slate-900 flex items-center justify-between">
                  <span>1. Thông tin hợp đồng & Dấu niêm phong pháp lý</span>
                  <span className="font-mono text-2xs text-slate-500 flex items-center gap-1">
                    <Lock className="size-3 text-emerald-600" />
                    SHA-256: {contract?.pdfSha256Hash?.slice(0, 16)}...
                  </span>
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-2xs pt-1 border-t border-slate-200">
                  <div>
                    <span className="text-slate-500 block">Vị trí:</span>
                    <strong className="text-slate-900 text-xs">{contract?.jobTitle}</strong>
                  </div>
                  <div>
                    <span className="text-slate-500 block">Mức lương HĐ:</span>
                    <strong className="text-indigo-700 text-xs">
                      {Number(contract?.salary).toLocaleString('vi-VN')} {contract?.currency}
                    </strong>
                  </div>
                  <div>
                    <span className="text-slate-500 block">Ngày bắt đầu làm:</span>
                    <strong className="text-slate-900">
                      {contract?.startDate ? new Date(contract.startDate).toLocaleDateString('vi-VN') : '---'}
                    </strong>
                  </div>
                  <div>
                    <span className="text-slate-500 block">Thời điểm nộp đơn BH:</span>
                    <strong className="text-slate-900">
                      {new Date(claim.createdAt).toLocaleDateString('vi-VN')} ({daysFromStart} ngày sau nhận việc)
                    </strong>
                  </div>
                </div>
              </div>

              {/* Side-by-Side: Recruiter Claim vs Candidate Explanation */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* HR Side */}
                <div className="rounded-xl border border-blue-200 bg-blue-50/40 p-4 space-y-2.5">
                  <div className="flex items-center justify-between border-b border-blue-100 pb-2">
                    <span className="font-bold text-blue-900 flex items-center gap-1.5 text-xs">
                      <Building2 className="size-4 text-[#2563EB]" />
                      Doanh nghiệp khai báo
                    </span>
                    <span className="font-semibold text-slate-700 text-2xs">
                      {claim.company?.name || 'Doanh nghiệp'}
                    </span>
                  </div>

                  <div>
                    <span className="text-2xs text-slate-500 block">Lý do bảo hành:</span>
                    <span className="inline-block mt-0.5 px-2 py-0.5 rounded bg-blue-100 text-[#2563EB] font-bold text-2xs">
                      {claim.reason === 'NO_SHOW'
                        ? 'Ứng viên không đến nhận việc (No-Show)'
                        : 'Ứng viên tự ý nghỉ trong 30 ngày (Early Resign)'}
                    </span>
                  </div>

                  <div>
                    <span className="text-2xs text-slate-500 block">Diễn giải sự việc từ HR:</span>
                    <p className="mt-0.5 text-slate-800 bg-white p-2.5 rounded-lg border border-blue-100 text-2xs italic leading-relaxed">
                      "{claim.note || 'Không có ghi chú thêm'}"
                    </p>
                  </div>

                  {claim.evidenceUrl && (
                    <div className="pt-1">
                      <a
                        href={claim.evidenceUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="inline-flex items-center gap-1 text-2xs font-bold text-[#2563EB] hover:underline"
                      >
                        <ExternalLink className="size-3" />
                        Xem link bằng chứng đính kèm
                      </a>
                    </div>
                  )}

                  <div className="text-2xs text-slate-400 pt-1 border-t border-blue-100">
                    HR liên hệ: {claim.recruiterUser?.fullName} • {claim.recruiterUser?.email}
                  </div>
                </div>

                {/* Candidate Side */}
                <div className="rounded-xl border border-amber-200 bg-amber-50/40 p-4 space-y-2.5">
                  <div className="flex items-center justify-between border-b border-amber-100 pb-2">
                    <span className="font-bold text-amber-900 flex items-center gap-1.5 text-xs">
                      <User className="size-4 text-amber-600" />
                      Phản hồi từ Ứng viên
                    </span>
                    <span className="font-semibold text-slate-700 text-2xs">
                      {contract?.application?.candidate?.fullName}
                    </span>
                  </div>

                  <div>
                    <span className="text-2xs text-slate-500 block">Trạng thái giải trình:</span>
                    {claim.candidateResponse ? (
                      <span className="inline-flex items-center gap-1 mt-0.5 px-2 py-0.5 rounded bg-emerald-100 text-emerald-800 font-bold text-2xs">
                        <CheckCircle2 className="size-3" />
                        Đã gửi văn bản giải trình ({claim.candidateRespondedAt ? new Date(claim.candidateRespondedAt).toLocaleDateString('vi-VN') : ''})
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 mt-0.5 px-2 py-0.5 rounded bg-slate-100 text-slate-600 font-medium text-2xs">
                        <Clock className="size-3" />
                        Ứng viên chưa gửi phản hồi
                      </span>
                    )}
                  </div>

                  <div>
                    <span className="text-2xs text-slate-500 block">Nội dung giải trình / Đối chất:</span>
                    <p className="mt-0.5 text-slate-800 bg-white p-2.5 rounded-lg border border-amber-100 text-2xs italic leading-relaxed min-h-[60px]">
                      {claim.candidateResponse ? `"${claim.candidateResponse}"` : 'Chưa có văn bản đối chất từ ứng viên.'}
                    </p>
                  </div>

                  <div className="text-2xs text-slate-400 pt-1 border-t border-amber-100">
                    Ứng viên: {contract?.application?.candidate?.email} • {contract?.application?.candidate?.phone || 'N/A'}
                  </div>
                </div>
              </div>

              {/* Automatic Compensation Package Preview */}
              <div className="rounded-xl border border-slate-200 bg-slate-50 p-3.5 space-y-2">
                <span className="font-bold text-slate-900 block text-xs">
                  2. Quyền lợi thực thi nếu Admin Phê Duyệt:
                </span>
                <div className="grid grid-cols-2 gap-2 text-2xs">
                  <div className="bg-white p-2.5 rounded-lg border border-slate-200 flex items-center gap-2">
                    <span className="font-bold text-[#2563EB] bg-blue-50 px-2 py-0.5 rounded">+1 Credit</span>
                    <span className="text-slate-600">Hoàn lại 1 lượt mở khóa CV vào tài khoản HR</span>
                  </div>
                  <div className="bg-white p-2.5 rounded-lg border border-slate-200 flex items-center gap-2">
                    <span className="font-bold text-[#2563EB] bg-blue-50 px-2 py-0.5 rounded">+30 Ngày</span>
                    <span className="text-slate-600">Tự động gia hạn hạn nộp hồ sơ tin tuyển dụng</span>
                  </div>
                </div>
              </div>

              {/* Admin Decision Section */}
              <div className="space-y-2 pt-1 border-t border-slate-200">
                <label className="block font-bold text-slate-900 text-xs">
                  3. Ý kiến thẩm định & Ghi chú của Admin {isPending && <span className="text-rose-500">* (Bắt buộc nếu Từ chối)</span>}
                </label>
                <textarea
                  rows={3}
                  value={adminNote}
                  disabled={!isPending || isSubmitting}
                  onChange={(e) => setAdminNote(e.target.value)}
                  placeholder="Nhập căn cứ phê duyệt hoặc lý do từ chối (ví dụ: Đã xác minh qua email, ứng viên xác nhận tự ý nghỉ việc do lý do cá nhân...)"
                  className="w-full text-xs rounded-xl border border-slate-300 p-3 text-slate-900 focus:border-[#2563EB] focus:ring-1 focus:ring-[#2563EB] outline-hidden placeholder:text-slate-400 disabled:bg-slate-100"
                />
              </div>

              {/* Actions */}
              <div className="flex items-center justify-between pt-3 border-t border-slate-200">
                <button
                  type="button"
                  onClick={onClose}
                  className="px-4 py-2 text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-xl transition cursor-pointer"
                >
                  Đóng
                </button>

                {isPending && (
                  <div className="flex items-center gap-2.5">
                    <button
                      type="button"
                      disabled={isSubmitting}
                      onClick={handleReject}
                      className="px-4 py-2 text-xs font-bold text-rose-700 border border-rose-300 bg-rose-50 hover:bg-rose-100 rounded-xl transition cursor-pointer disabled:opacity-50"
                    >
                      {isSubmitting ? <Loader2 className="size-3.5 animate-spin" /> : 'Từ Chối Yêu Cầu'}
                    </button>

                    <button
                      type="button"
                      disabled={isSubmitting}
                      onClick={handleApprove}
                      className="inline-flex items-center gap-1.5 px-5 py-2 text-xs font-bold text-white bg-[#2563EB] hover:bg-blue-700 rounded-xl shadow-xs transition cursor-pointer disabled:opacity-50"
                    >
                      {isSubmitting ? (
                        <Loader2 className="size-3.5 animate-spin" />
                      ) : (
                        <CheckCircle2 className="size-4" />
                      )}
                      Phê Duyệt & Bồi Hoàn Credit
                    </button>
                  </div>
                )}
              </div>
            </>
          ) : null}
        </div>
      </div>
    </div>
  );
}
