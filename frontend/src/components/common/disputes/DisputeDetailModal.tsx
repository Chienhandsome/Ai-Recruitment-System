'use client';

import React, { useState, useEffect, useCallback } from 'react';
import {
  X,
  AlertTriangle,
  ShieldAlert,
  ShieldCheck,
  Clock,
  User,
  Building2,
  FileText,
  DollarSign,
  Send,
  Loader2,
  Paperclip,
  CheckCircle2,
  XCircle,
  HelpCircle,
  Lock,
  ArrowRight,
  ExternalLink,
  RefreshCw,
  Scale,
  MessageSquare,
} from 'lucide-react';
import { toast } from 'sonner';
import {
  type DisputeData,
  type DisputeTimelineEntry,
  type DisputeStatus,
  disputeCategoryLabels,
  disputeStatusLabels,
  getDisputeById,
  respondDispute,
  uploadDisputeEvidence,
  type UploadedEvidenceFile,
} from '@/lib/dispute-api';

interface DisputeDetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  disputeId: string | null;
  token: string;
  currentUserRole?: 'CANDIDATE' | 'RECRUITER' | 'ADMIN';
  onDisputeUpdated?: () => void;
}

export function DisputeDetailModal({
  isOpen,
  onClose,
  disputeId,
  token,
  currentUserRole = 'CANDIDATE',
  onDisputeUpdated,
}: DisputeDetailModalProps) {
  const [loading, setLoading] = useState<boolean>(true);
  const [submitting, setSubmitting] = useState<boolean>(false);
  const [dispute, setDispute] = useState<DisputeData | null>(null);

  // Form reply state
  const [message, setMessage] = useState<string>('');
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [filePreviews, setFilePreviews] = useState<
    Array<{ name: string; size: number; previewUrl?: string; isImage: boolean }>
  >([]);
  const [isAppeal, setIsAppeal] = useState<boolean>(false);
  const [zoomedImageUrl, setZoomedImageUrl] = useState<string | null>(null);

  const fetchDetail = useCallback(async () => {
    if (!disputeId || !token) return;
    setLoading(true);
    try {
      const data = await getDisputeById(token, disputeId);
      setDispute(data);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Không thể tải chi tiết khiếu nại');
    } finally {
      setLoading(false);
    }
  }, [disputeId, token]);

  useEffect(() => {
    if (isOpen && disputeId) {
      fetchDetail();
      setMessage('');
      setSelectedFiles([]);
      setFilePreviews([]);
      setIsAppeal(false);
    }
  }, [isOpen, disputeId, fetchDetail]);

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

    const newSelected = [...selectedFiles, ...validFiles].slice(0, 6);
    setSelectedFiles(newSelected);

    const previews = newSelected.map((f) => ({
      name: f.name,
      size: f.size,
      isImage: f.type.startsWith('image/'),
      previewUrl: f.type.startsWith('image/') ? URL.createObjectURL(f) : undefined,
    }));
    setFilePreviews(previews);
  };

  const removeFile = (idx: number) => {
    const updatedFiles = selectedFiles.filter((_, i) => i !== idx);
    setSelectedFiles(updatedFiles);
    setFilePreviews(filePreviews.filter((_, i) => i !== idx));
  };

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!disputeId || !token) return;
    if (!message.trim()) {
      toast.error('Vui lòng nhập nội dung phản hồi.');
      return;
    }

    setSubmitting(true);
    try {
      let evidenceUrls: string[] = [];
      if (selectedFiles.length > 0) {
        const uploadResults = await uploadDisputeEvidence(token, selectedFiles);
        evidenceUrls = uploadResults.map((r) => r.url);
      }

      const updated = await respondDispute(token, disputeId, {
        message: message.trim(),
        evidenceUrls: evidenceUrls.length > 0 ? evidenceUrls : undefined,
        isAppeal,
      });

      setDispute(updated);
      setMessage('');
      setSelectedFiles([]);
      setFilePreviews([]);
      setIsAppeal(false);
      toast.success(
        isAppeal
          ? 'Đã gửi Đơn Kháng Nghị kèm tệp bằng chứng lưu vết! Hồ sơ đã được chuyển lại cho Ban Quản Trị xem xét lại.'
          : 'Đã gửi phản hồi kèm bằng chứng lưu vết thành công!',
      );
      if (onDisputeUpdated) onDisputeUpdated();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Lỗi khi gửi phản hồi');
    } finally {
      setSubmitting(false);
    }
  };

  const getStatusBadge = (status: DisputeStatus) => {
    switch (status) {
      case 'PENDING':
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-amber-50 text-amber-700 border border-amber-200">
            <Clock className="size-3.5 text-amber-600 animate-pulse" />
            {disputeStatusLabels.PENDING}
          </span>
        );
      case 'INVESTIGATING':
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-blue-50 text-blue-700 border border-blue-200">
            <Scale className="size-3.5 text-[#2563EB]" />
            {disputeStatusLabels.INVESTIGATING}
          </span>
        );
      case 'RESOLVED':
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
            <CheckCircle2 className="size-3.5 text-emerald-600" />
            {disputeStatusLabels.RESOLVED}
          </span>
        );
      case 'DISMISSED':
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-slate-100 text-slate-700 border border-slate-300">
            <XCircle className="size-3.5 text-slate-500" />
            {disputeStatusLabels.DISMISSED}
          </span>
        );
    }
  };

  const getRoleBadge = (role: 'CANDIDATE' | 'RECRUITER' | 'ADMIN') => {
    switch (role) {
      case 'ADMIN':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-3xs font-black uppercase tracking-wider bg-rose-100 text-rose-800 border border-rose-200">
            <ShieldCheck className="size-3" /> Ban Quản Trị
          </span>
        );
      case 'RECRUITER':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-3xs font-black uppercase tracking-wider bg-indigo-100 text-indigo-800 border border-indigo-200">
            <Building2 className="size-3" /> Nhà Tuyển Dụng
          </span>
        );
      case 'CANDIDATE':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-3xs font-black uppercase tracking-wider bg-blue-100 text-blue-800 border border-blue-200">
            <User className="size-3" /> Ứng Viên
          </span>
        );
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs font-sans">
      <div className="relative w-full max-w-4xl max-h-[92vh] flex flex-col bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="flex items-start justify-between p-5 border-b border-slate-100 bg-slate-50/70 shrink-0">
          <div className="space-y-1">
            <div className="flex flex-wrap items-center gap-2">
              <span className="font-mono text-xs font-extrabold text-slate-500 bg-white px-2.5 py-0.5 rounded-md border border-slate-200">
                {dispute?.disputeNumber || 'DSP-LOADING'}
              </span>
              {dispute && getStatusBadge(dispute.status)}
              {dispute && (
                <span className="text-xs font-semibold text-slate-600 bg-slate-100 px-2.5 py-0.5 rounded-md">
                  {disputeCategoryLabels[dispute.category]}
                </span>
              )}
            </div>
            <h2 className="text-xl font-black text-[#1F2937] tracking-tight">
              {dispute?.title || 'Chi Tiết Xử Lý Khiếu Nại & Tranh Chấp'}
            </h2>
            <p className="text-xs text-slate-500">
              Được báo cáo bởi{' '}
              <strong className="text-slate-700">
                {dispute?.reportedByUser?.fullName || 'Người dùng'}
              </strong>{' '}
              ({dispute?.reportedByUser?.email}) vào lúc{' '}
              {dispute ? new Date(dispute.createdAt).toLocaleString('vi-VN') : ''}
            </p>
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={fetchDetail}
              title="Làm mới"
              className="p-2 rounded-xl text-slate-400 hover:text-slate-600 hover:bg-slate-200/60 transition-colors"
            >
              <RefreshCw className="size-4" />
            </button>
            <button
              type="button"
              onClick={onClose}
              className="p-2 rounded-xl text-slate-400 hover:text-slate-600 hover:bg-slate-200/60 transition-colors"
            >
              <X className="size-5" />
            </button>
          </div>
        </div>

        {/* Modal Body */}
        <div className="flex-1 overflow-y-auto p-5 sm:p-6 space-y-6">
          {loading ? (
            <div className="flex flex-col items-center justify-center py-20 text-slate-400">
              <Loader2 className="size-8 animate-spin text-[#2563EB] mb-2" />
              <p className="text-sm font-medium">Đang tải hồ sơ khiếu nại & phán quyết...</p>
            </div>
          ) : !dispute ? (
            <div className="text-center py-12 text-slate-500 text-sm">
              Không tìm thấy thông tin khiếu nại.
            </div>
          ) : (
            <>
              {/* Context bar (Job, Recruiter, Candidate) */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 p-3.5 rounded-xl bg-[#EFF6FF] border border-blue-100 text-xs text-slate-700">
                <div>
                  <span className="text-2xs font-bold text-blue-800 uppercase tracking-wider block">
                    Vị trí ứng tuyển:
                  </span>
                  <span className="font-semibold text-slate-900">
                    {dispute.application?.job?.title || 'Không có thông tin'}
                  </span>
                </div>
                <div>
                  <span className="text-2xs font-bold text-blue-800 uppercase tracking-wider block">
                    Doanh nghiệp / HR:
                  </span>
                  <span className="font-semibold text-slate-900">
                    {dispute.application?.job?.recruiter?.company?.name ||
                      dispute.application?.job?.recruiter?.user?.fullName ||
                      'Nhà tuyển dụng'}
                  </span>
                </div>
                <div>
                  <span className="text-2xs font-bold text-blue-800 uppercase tracking-wider block">
                    Ứng viên:
                  </span>
                  <span className="font-semibold text-slate-900">
                    {dispute.application?.candidate?.fullName || 'Ứng viên'}
                  </span>
                </div>
              </div>

              {/* SECTION: OFFICIAL VERDICT (PHÁN QUYẾT TRỌNG TÀI) */}
              {dispute.adminResolution && (
                <div
                  className={`rounded-2xl p-5 border shadow-sm ${
                    dispute.status === 'RESOLVED'
                      ? 'bg-emerald-50/80 border-emerald-300 text-emerald-950'
                      : 'bg-amber-50/80 border-amber-300 text-amber-950'
                  }`}
                >
                  <div className="flex items-start justify-between gap-3 border-b border-emerald-200/60 pb-3 mb-3">
                    <div className="flex items-center gap-2">
                      <div className="p-2 rounded-xl bg-white shadow-xs text-[#2563EB]">
                        <Scale className="size-5 text-emerald-600" />
                      </div>
                      <div>
                        <span className="text-2xs font-extrabold uppercase tracking-wider text-emerald-800 block">
                          Phán Quyết Trọng Tài Chính Thức (Admin Verdict)
                        </span>
                        <h3 className="text-base font-black text-slate-900">
                          {dispute.status === 'RESOLVED'
                            ? 'Khiếu Nại Hợp Lệ & Đã Có Phán Quyết Xử Lý'
                            : 'Khiếu Nại Bác Bỏ / Không Đủ Căn Cứ'}
                        </h3>
                      </div>
                    </div>
                    {dispute.resolvedAt && (
                      <span className="text-2xs font-semibold text-slate-500 bg-white/80 px-2.5 py-1 rounded-lg border border-slate-200">
                        {new Date(dispute.resolvedAt).toLocaleString('vi-VN')}
                      </span>
                    )}
                  </div>

                  {/* Verdict content */}
                  <div className="bg-white/90 rounded-xl p-4 border border-emerald-100 shadow-2xs space-y-3">
                    <p className="text-sm text-slate-800 whitespace-pre-wrap leading-relaxed font-normal">
                      {dispute.adminResolution}
                    </p>

                    {/* Enforcement details */}
                    {(dispute.penaltyAction || dispute.penaltyNotes) && (
                      <div className="mt-3 pt-3 border-t border-slate-100 grid grid-cols-1 gap-2 text-xs">
                        {dispute.penaltyAction && dispute.penaltyAction !== 'NONE' && (
                          <div className="flex items-center gap-2 text-rose-700 bg-rose-50 px-3 py-2 rounded-lg border border-rose-200">
                            <Lock className="size-4 shrink-0" />
                            <span>
                              <strong>Biện pháp chế tài hệ thống:</strong>{' '}
                              {dispute.penaltyAction === 'LOCK_RECRUITER'
                                ? 'Khóa vĩnh viễn tài khoản Nhà tuyển dụng vi phạm & Tạm dừng tin tuyển dụng'
                                : 'Ban hành cảnh cáo vi phạm tiêu chuẩn tuyển dụng'}
                            </span>
                          </div>
                        )}
                        {dispute.penaltyNotes && (
                          <div className="text-slate-600 bg-slate-50 p-2.5 rounded-lg border border-slate-200 text-2xs">
                            <strong>Yêu cầu thi hành / Khắc phục:</strong> {dispute.penaltyNotes}
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* SECTION: BACK-AND-FORTH DISCUSSION TIMELINE */}
              <div className="space-y-3">
                <div className="flex items-center justify-between border-b border-slate-200 pb-2">
                  <h4 className="text-sm font-black text-[#1F2937] flex items-center gap-2">
                    <MessageSquare className="size-4 text-[#2563EB]" />
                    Lịch Sử Thảo Luận, Giải Trình & Kháng Nghị (
                    {dispute.timeline?.length || 1})
                  </h4>
                  <span className="text-2xs text-slate-400">Minh bạch 3 bên</span>
                </div>

                {/* Timeline items list */}
                <div className="space-y-4">
                  {/* If timeline is empty, show initial claim */}
                  {(!dispute.timeline || dispute.timeline.length === 0) && (
                    <div className="p-4 rounded-xl border border-slate-200 bg-white space-y-2">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-xs text-slate-900">
                            {dispute.reportedByUser?.fullName || 'Người khiếu nại'}
                          </span>
                          {getRoleBadge(
                            dispute.reportedByUserId === dispute.application?.candidate?.userId
                              ? 'CANDIDATE'
                              : 'RECRUITER',
                          )}
                          <span className="text-3xs font-bold text-slate-500 bg-slate-100 px-2 py-0.5 rounded">
                            KHIẾU NẠI BAN ĐẦU
                          </span>
                        </div>
                        <span className="text-2xs text-slate-400">
                          {new Date(dispute.createdAt).toLocaleString('vi-VN')}
                        </span>
                      </div>
                      <p className="text-xs text-slate-700 whitespace-pre-wrap">
                        {dispute.description}
                      </p>
                      {dispute.evidenceUrls &&
                        Array.isArray(dispute.evidenceUrls) &&
                        dispute.evidenceUrls.length > 0 && (
                          <div className="mt-3 pt-2.5 border-t border-slate-100">
                            <span className="text-3xs font-extrabold text-slate-500 uppercase tracking-wider block mb-1.5 flex items-center gap-1">
                              <ShieldCheck className="size-3 text-emerald-600" />
                              Tệp chứng cứ lưu vết hệ thống (SHA-256):
                            </span>
                            <div className="flex flex-wrap gap-2.5">
                              {dispute.evidenceUrls.map((url: string, idx: number) => {
                                const isImg =
                                  url.startsWith('data:image/') ||
                                  /\.(png|jpe?g|webp|gif)($|\?)/i.test(url) ||
                                  url.includes('.png') ||
                                  url.includes('.jpg');

                                if (isImg) {
                                  return (
                                    <button
                                      key={idx}
                                      type="button"
                                      onClick={() => setZoomedImageUrl(url)}
                                      className="group relative rounded-xl border border-slate-200 overflow-hidden shadow-2xs hover:border-[#2563EB] transition-all bg-white cursor-pointer"
                                      title="Bấm để xem ảnh phóng to"
                                    >
                                      {/* eslint-disable-next-line @next/next/no-img-element */}
                                      <img
                                        src={url}
                                        alt={`Bằng chứng #${idx + 1}`}
                                        className="h-16 w-20 object-cover group-hover:scale-105 transition-transform"
                                      />
                                      <span className="absolute bottom-0 inset-x-0 bg-slate-900/70 text-white text-3xs py-0.5 text-center font-bold">
                                        Ảnh #{idx + 1}
                                      </span>
                                    </button>
                                  );
                                }

                                const fileName = url.split('/').pop()?.split('_').pop() || `Tài liệu #${idx + 1}`;
                                return (
                                  <a
                                    key={idx}
                                    href={url}
                                    target="_blank"
                                    rel="noreferrer"
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
                  )}

                  {/* Render timeline array */}
                  {dispute.timeline?.map((entry: DisputeTimelineEntry) => {
                    const isVerdict = entry.type === 'ADMIN_RESOLUTION';
                    const isAppealEntry = entry.type === 'APPEAL' || entry.isAppeal;

                    return (
                      <div
                        key={entry.id}
                        className={`p-4 rounded-xl border transition-all ${
                          isVerdict
                            ? 'bg-emerald-50/70 border-emerald-300'
                            : isAppealEntry
                            ? 'bg-amber-50/80 border-amber-300 shadow-2xs'
                            : entry.senderRole === 'ADMIN'
                            ? 'bg-blue-50/60 border-blue-200'
                            : 'bg-white border-slate-200 shadow-2xs'
                        }`}
                      >
                        <div className="flex flex-wrap items-center justify-between gap-2 pb-2 mb-2 border-b border-slate-100">
                          <div className="flex items-center gap-2">
                            <span className="font-bold text-xs text-slate-900">
                              {entry.senderName}
                            </span>
                            {getRoleBadge(entry.senderRole)}
                            {isAppealEntry && (
                              <span className="inline-flex items-center gap-1 text-3xs font-black uppercase tracking-wider bg-rose-600 text-white px-2 py-0.5 rounded-full">
                                <AlertTriangle className="size-2.5" /> ĐƠN KHÁNG NGHỊ
                              </span>
                            )}
                            {entry.type === 'EXPLANATION' && (
                              <span className="text-3xs font-bold text-indigo-700 bg-indigo-50 border border-indigo-200 px-2 py-0.5 rounded">
                                GIẢI TRÌNH CỦA HR
                              </span>
                            )}
                            {entry.type === 'INITIAL_CLAIM' && (
                              <span className="text-3xs font-bold text-slate-600 bg-slate-100 px-2 py-0.5 rounded">
                                KHIẾU NẠI BAN ĐẦU
                              </span>
                            )}
                          </div>
                          <span className="text-2xs text-slate-400">
                            {new Date(entry.createdAt).toLocaleString('vi-VN')}
                          </span>
                        </div>

                        <p className="text-xs text-slate-800 whitespace-pre-wrap leading-relaxed">
                          {entry.message}
                        </p>

                        {/* Evidence files/images if any */}
                        {entry.evidenceUrls && entry.evidenceUrls.length > 0 && (
                          <div className="mt-3 pt-2.5 border-t border-slate-100">
                            <span className="text-3xs font-extrabold text-slate-500 uppercase tracking-wider block mb-1.5 flex items-center gap-1">
                              <ShieldCheck className="size-3 text-emerald-600" />
                              Tệp chứng cứ lưu vết hệ thống (SHA-256):
                            </span>
                            <div className="flex flex-wrap gap-2.5">
                              {entry.evidenceUrls.map((url, i) => {
                                const isImg =
                                  url.startsWith('data:image/') ||
                                  /\.(png|jpe?g|webp|gif)($|\?)/i.test(url) ||
                                  url.includes('.png') ||
                                  url.includes('.jpg');

                                if (isImg) {
                                  return (
                                    <button
                                      key={i}
                                      type="button"
                                      onClick={() => setZoomedImageUrl(url)}
                                      className="group relative rounded-xl border border-slate-200 overflow-hidden shadow-2xs hover:border-[#2563EB] transition-all bg-white"
                                      title="Bấm để xem ảnh phóng to"
                                    >
                                      {/* eslint-disable-next-line @next/next/no-img-element */}
                                      <img
                                        src={url}
                                        alt={`Bằng chứng #${i + 1}`}
                                        className="h-16 w-20 object-cover group-hover:scale-105 transition-transform"
                                      />
                                      <span className="absolute bottom-0 inset-x-0 bg-slate-900/70 text-white text-3xs py-0.5 text-center font-bold">
                                        Ảnh #{i + 1}
                                      </span>
                                    </button>
                                  );
                                }

                                const fileName = url.split('/').pop()?.split('_').pop() || `Tài liệu #${i + 1}`;
                                return (
                                  <a
                                    key={i}
                                    href={url}
                                    target="_blank"
                                    rel="noreferrer"
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
                    );
                  })}
                </div>
              </div>

              {/* SECTION: INTERACTIVE REPLY / APPEAL BOX */}
              <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-3">
                <div className="flex items-center justify-between">
                  <h4 className="text-xs font-black uppercase tracking-wider text-slate-700 flex items-center gap-1.5">
                    <Send className="size-3.5 text-[#2563EB]" />
                    {currentUserRole === 'ADMIN'
                      ? 'Gửi Chỉ Đạo / Yêu Cầu Bổ Sung Chứng Từ'
                      : currentUserRole === 'RECRUITER'
                      ? 'Gửi Văn Bản Giải Trình / Chứng Cứ (Bên Tuyển Dụng)'
                      : 'Gửi Ý Kiến Phản Hồi / Đơn Kháng Nghị (Ứng Viên)'}
                  </h4>
                  <span className="text-2xs text-slate-400">
                    Cả 3 bên đều theo dõi được phản hồi này
                  </span>
                </div>

                <form onSubmit={handleSendMessage} className="space-y-3">
                  <div>
                    <textarea
                      rows={3}
                      value={message}
                      onChange={(e) => setMessage(e.target.value)}
                      placeholder={
                        currentUserRole === 'ADMIN'
                          ? 'Nhập yêu cầu bổ sung hồ sơ hoặc thông điệp chỉ đạo xử lý...'
                          : currentUserRole === 'RECRUITER'
                          ? 'Nhập nội dung giải trình chi tiết, đối chiếu hợp đồng, lịch sử làm việc...'
                          : 'Nhập ý kiến phản hồi hoặc lý do bạn không đồng ý với kết quả xử lý...'
                      }
                      className="w-full rounded-xl border border-slate-300 p-3 text-xs text-slate-900 placeholder:text-slate-400 focus:border-[#2563EB] focus:ring-1 focus:ring-[#2563EB] outline-none transition-all resize-y bg-white"
                    />
                  </div>

                  {/* Evidence File Upload for this message */}
                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-2xs font-bold text-slate-600 flex items-center gap-1">
                        <Paperclip className="size-3 text-[#2563EB]" />
                        Đính kèm tệp bằng chứng thực tế (Ảnh chụp màn hình, PDF, Hợp đồng scan):
                      </span>
                      <span className="text-3xs text-slate-400 font-medium">Tối đa 6 tệp</span>
                    </div>

                    <div className="relative rounded-xl border border-dashed border-slate-300 p-2.5 bg-white hover:bg-slate-50 text-center transition-colors cursor-pointer">
                      <input
                        type="file"
                        multiple
                        accept="image/png,image/jpeg,image/webp,application/pdf,.doc,.docx"
                        onChange={handleFileChange}
                        disabled={submitting}
                        className="absolute inset-0 opacity-0 w-full h-full cursor-pointer z-10"
                        title="Đính kèm ảnh hoặc tệp chứng cứ"
                      />
                      <div className="flex items-center justify-center gap-2 pointer-events-none text-2xs font-bold text-slate-600">
                        <Paperclip className="size-3.5 text-[#2563EB]" />
                        <span>Bấm vào đây để chọn ảnh hoặc tài liệu bằng chứng đối chất</span>
                      </div>
                    </div>

                    {filePreviews.length > 0 && (
                      <div className="mt-2 flex flex-wrap gap-2">
                        {filePreviews.map((f, idx) => (
                          <div
                            key={idx}
                            className="flex items-center gap-1.5 p-1.5 rounded-lg bg-white border border-slate-200 text-2xs shadow-2xs"
                          >
                            {f.isImage && f.previewUrl ? (
                              <img
                                src={f.previewUrl}
                                alt="preview"
                                className="size-6 rounded object-cover border border-slate-200 shrink-0"
                              />
                            ) : (
                              <FileText className="size-4 text-blue-600 shrink-0" />
                            )}
                            <span className="truncate max-w-[130px] font-semibold text-slate-800">
                              {f.name}
                            </span>
                            <button
                              type="button"
                              onClick={() => removeFile(idx)}
                              disabled={submitting}
                              className="text-slate-400 hover:text-rose-600 p-0.5 rounded cursor-pointer"
                            >
                              <X className="size-3" />
                            </button>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Appeal checkbox for Candidate/Recruiter if dispute was resolved or dismissed */}
                  {(dispute.status === 'RESOLVED' || dispute.status === 'DISMISSED') &&
                    currentUserRole !== 'ADMIN' && (
                      <div className="flex items-start gap-2 p-3 rounded-xl bg-amber-50 border border-amber-200 text-xs text-amber-900">
                        <input
                          type="checkbox"
                          id="isAppealCheckbox"
                          checked={isAppeal}
                          onChange={(e) => setIsAppeal(e.target.checked)}
                          className="mt-0.5 rounded text-[#2563EB] focus:ring-[#2563EB]"
                        />
                        <label htmlFor="isAppealCheckbox" className="font-semibold cursor-pointer">
                          🔴 Tôi muốn nộp đây là <strong>Đơn Kháng Nghị (Appeal)</strong> chính thức.
                          <span className="block text-2xs font-normal text-amber-700 mt-0.5">
                            Khi chọn mục này, trạng thái vụ việc sẽ tự động chuyển về{' '}
                            <strong>&quot;Đang xác minh&quot;</strong> để Hội đồng Admin xem xét lại
                            toàn bộ hồ sơ.
                          </span>
                        </label>
                      </div>
                    )}

                  <div className="flex items-center justify-end gap-2 pt-1">
                    <button
                      type="button"
                      onClick={onClose}
                      className="px-4 py-2 rounded-xl border border-slate-200 text-xs font-bold text-slate-600 hover:bg-slate-100 transition-colors"
                    >
                      Đóng
                    </button>
                    <button
                      type="submit"
                      disabled={submitting}
                      className={`inline-flex items-center gap-1.5 px-5 py-2 rounded-xl text-xs font-bold text-white shadow-xs transition-colors cursor-pointer ${
                        isAppeal
                          ? 'bg-rose-600 hover:bg-rose-700'
                          : 'bg-[#2563EB] hover:bg-blue-700'
                      } disabled:opacity-50`}
                    >
                      {submitting ? (
                        <>
                          <Loader2 className="size-3.5 animate-spin" />
                          Đang gửi...
                        </>
                      ) : (
                        <>
                          <Send className="size-3.5" />
                          {isAppeal ? 'Gửi Đơn Kháng Nghị' : 'Gửi Phản Hồi'}
                        </>
                      )}
                    </button>
                  </div>
                </form>
              </div>
            </>
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
                Chứng Cứ Gốc Lưu Trữ Hệ Thống (Bất biến SHA-256)
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
                alt="Chứng cứ phóng to"
                className="max-h-[75vh] w-auto max-w-full rounded-lg object-contain shadow-md"
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
