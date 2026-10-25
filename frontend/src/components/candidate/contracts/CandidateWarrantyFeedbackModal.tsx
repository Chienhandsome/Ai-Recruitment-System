import React, { useState } from 'react';
import {
  X,
  ShieldAlert,
  ShieldCheck,
  Loader2,
  CheckCircle2,
  Send,
  MessageSquare,
  AlertTriangle,
  ExternalLink,
  Paperclip,
  UploadCloud,
  FileText,
} from 'lucide-react';
import { toast } from 'sonner';
import {
  candidateRespondWarranty,
  type WarrantyClaimInfo,
} from '@/lib/contract-api';
import { uploadDisputeEvidence } from '@/lib/dispute-api';

interface CandidateWarrantyFeedbackModalProps {
  isOpen: boolean;
  onClose: () => void;
  token: string;
  contractId: string;
  contractNumber: string;
  jobTitle: string;
  existingClaim?: WarrantyClaimInfo | null;
  onSuccess: () => void | Promise<void>;
}

export function CandidateWarrantyFeedbackModal({
  isOpen,
  onClose,
  token,
  contractId,
  contractNumber,
  jobTitle,
  existingClaim,
  onSuccess,
}: CandidateWarrantyFeedbackModalProps) {
  const [feedback, setFeedback] = useState<string>('');
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [filePreviews, setFilePreviews] = useState<
    Array<{ name: string; size: number; previewUrl?: string; isImage: boolean }>
  >([]);
  const [submitting, setSubmitting] = useState<boolean>(false);
  const [zoomedImageUrl, setZoomedImageUrl] = useState<string | null>(null);

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
    if (!feedback.trim()) {
      toast.error('Vui lòng nhập nội dung giải trình / đối chất của bạn trước khi gửi.');
      const el = document.getElementById('candidate-warranty-feedback-input');
      if (el) el.focus();
      return;
    }
    if (feedback.trim().length < 5) {
      toast.error('Vui lòng nhập nội dung giải trình chi tiết hơn (tối thiểu 5 ký tự).');
      const el = document.getElementById('candidate-warranty-feedback-input');
      if (el) el.focus();
      return;
    }

    try {
      setSubmitting(true);

      let evidenceUrl: string | undefined = undefined;
      if (selectedFiles.length > 0) {
        toast.info('Đang tải tệp bằng chứng đối chất lên hệ thống...');
        const uploaded = await uploadDisputeEvidence(token, selectedFiles);
        if (uploaded.length > 0) {
          evidenceUrl = uploaded.map((u) => u.url).join(',');
        }
      }

      await candidateRespondWarranty(token, contractId, feedback.trim(), evidenceUrl);
      toast.success('Đã gửi ý kiến phản hồi và bằng chứng thành công. Ban Quản trị sẽ đối soát công tâm.');
      await onSuccess();
      onClose();
    } catch (err: any) {
      toast.error(err.message || 'Không thể gửi phản hồi. Vui lòng thử lại.');
    } finally {
      setSubmitting(false);
    }
  };

  const hasResponded = Boolean(existingClaim?.candidateResponse);

  return (
    <div
      onClick={onClose}
      className="fixed inset-0 z-[120] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-200"
    >
      <div
        className="relative w-full max-w-lg bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100 bg-slate-50/50">
          <div className="flex items-center gap-2.5">
            <div className="flex size-9 items-center justify-center rounded-xl bg-amber-50 text-amber-600 border border-amber-200">
              <ShieldAlert className="size-4.5" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-slate-900">
                Phản Hồi Sự Cố Nhận Việc / Đối Chất Bảo Hành
              </h3>
              <p className="text-2xs text-slate-500">
                Mã HĐ: <span className="font-mono font-bold text-[#2563EB]">{contractNumber}</span> • Vị trí: {jobTitle}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-100 transition-colors cursor-pointer"
          >
            <X className="size-4" />
          </button>
        </div>

        {/* Content */}
        <div className="p-5 space-y-4 text-xs">
          {/* Claim info from HR */}
          <div className="rounded-xl border border-amber-200 bg-amber-50/60 p-3.5 space-y-2">
            <div className="flex items-center justify-between">
              <span className="font-bold text-amber-900 flex items-center gap-1.5">
                <AlertTriangle className="size-3.5 text-amber-600" />
                Thông tin ghi nhận từ Nhà tuyển dụng:
              </span>
              <span className="font-mono text-2xs px-2 py-0.5 rounded bg-white/80 font-bold border border-amber-200 text-amber-900">
                {existingClaim?.claimNumber || 'N/A'}
              </span>
            </div>
            <div className="text-2xs text-amber-950 space-y-1">
              <div>
                <strong>Lý do khai báo:</strong>{' '}
                {existingClaim?.reason === 'NO_SHOW'
                  ? 'Ứng viên không đến nhận việc ngày đầu (No-Show)'
                  : 'Ứng viên tự ý nghỉ việc trong 30 ngày thử việc (Early Resignation)'}
              </div>
              {existingClaim?.note && (
                <div className="pt-1 text-slate-700 italic border-t border-amber-200/70">
                  "{existingClaim.note}"
                </div>
              )}
            </div>
          </div>

          {hasResponded ? (
            /* Already responded */
            (() => {
              const fullResponse = existingClaim?.candidateResponse || '';
              const match = fullResponse.match(/\[BẰNG CHỨNG ĐỐI CHẤT:\s*([\s\S]*?)\]/);
              const cleanText = fullResponse.replace(/\[BẰNG CHỨNG ĐỐI CHẤT:\s*[\s\S]*?\]/g, '').trim();
              const evidenceUrls = match ? match[1].split(',') : [];

              return (
                <div className="rounded-xl border border-emerald-200 bg-emerald-50/50 p-4 space-y-3">
                  <div className="flex items-center gap-2 text-emerald-800 font-semibold">
                    <CheckCircle2 className="size-4 text-emerald-600" />
                    Bạn đã gửi phản hồi giải trình
                  </div>
                  <p className="text-slate-800 italic bg-white/80 p-2.5 rounded-lg border border-emerald-100 whitespace-pre-wrap">
                    "{cleanText || 'Đã gửi phản hồi'}"
                  </p>

                  {/* Render candidate counter-evidence files if attached */}
                  {evidenceUrls.length > 0 && (
                    <div className="pt-2 border-t border-emerald-200/60">
                      <span className="text-3xs font-extrabold text-slate-500 uppercase tracking-wider block mb-1.5 flex items-center gap-1">
                        <ShieldCheck className="size-3 text-emerald-600" />
                        Tệp bằng chứng đối chất bạn đã nộp (SHA-256):
                      </span>
                      <div className="flex flex-wrap gap-2">
                        {evidenceUrls.map((url, i) => {
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
                                  alt={`Bằng chứng đối chất #${i + 1}`}
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

                  <div className="text-2xs text-slate-500 pt-1">
                    Gửi lúc:{' '}
                    {existingClaim?.candidateRespondedAt
                      ? new Date(existingClaim.candidateRespondedAt).toLocaleString('vi-VN')
                      : 'N/A'}
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
              );
            })()
          ) : (
            /* Form to submit response */
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label htmlFor="candidate-warranty-feedback-input" className="block font-bold text-slate-900 mb-1.5">
                  Ý kiến phản hồi / Giải trình đối chất của bạn <span className="text-rose-500">*</span>
                </label>
                <p className="text-2xs text-slate-500 mb-2 leading-relaxed">
                  Để bảo vệ quyền lợi cá nhân và đảm bảo tính công tâm, bạn vui lòng nêu rõ lý do hoặc tình hình thực tế (ví dụ: đã báo cáo trước với HR, hoặc do sự cố bất khả kháng...). Ban Quản trị sàn sẽ xem xét đối soát cả hai bên.
                </p>
                <textarea
                  id="candidate-warranty-feedback-input"
                  rows={3}
                  autoFocus
                  value={feedback}
                  onChange={(e) => setFeedback(e.target.value)}
                  placeholder="Nhập chi tiết ý kiến đối chất hoặc giải trình của bạn tại đây (tối thiểu 5 ký tự)..."
                  className="w-full text-xs rounded-xl border border-slate-300 p-3 text-slate-900 focus:border-[#2563EB] focus:ring-1 focus:ring-[#2563EB] outline-hidden placeholder:text-slate-400 bg-white"
                />
              </div>

              {/* Counter Evidence File Upload */}
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="block text-xs font-bold text-slate-900 flex items-center gap-1.5">
                    <Paperclip className="size-3.5 text-[#2563EB]" />
                    Đính kèm bằng chứng đối chất (Ảnh chat Zalo/email với HR, tin nhắn, giấy xin phép):
                  </label>
                  <span className="text-3xs text-slate-400 font-medium">Tối đa 5 tệp</span>
                </div>

                <div className="relative rounded-xl border-2 border-dashed border-slate-300 p-3 bg-slate-50/70 hover:bg-blue-50/40 hover:border-[#2563EB]/60 transition-all text-center cursor-pointer group">
                  <input
                    type="file"
                    multiple
                    accept="image/png,image/jpeg,image/webp,application/pdf,.doc,.docx"
                    onChange={handleFileChange}
                    disabled={submitting}
                    className="absolute inset-0 opacity-0 w-full h-full cursor-pointer z-10"
                    title="Chọn ảnh hoặc tài liệu bằng chứng đối chất"
                  />
                  <div className="flex items-center justify-center gap-2 pointer-events-none text-2xs font-bold text-slate-700">
                    <UploadCloud className="size-4 text-[#2563EB]" />
                    <span>Bấm vào đây để tải ảnh chụp màn hình hoặc tài liệu chứng minh</span>
                  </div>
                </div>

                {/* Previews */}
                {filePreviews.length > 0 && (
                  <div className="mt-2 flex flex-wrap gap-2">
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
                          <FileText className="size-4 text-[#2563EB] shrink-0" />
                        )}
                        <span className="truncate max-w-[130px] font-bold text-slate-800">
                          {f.name}
                        </span>
                        <button
                          type="button"
                          onClick={() => removeFile(idx)}
                          disabled={submitting}
                          className="text-slate-400 hover:text-rose-600 p-1 rounded-lg hover:bg-slate-100 transition-colors cursor-pointer"
                        >
                          <X className="size-3" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div className="flex items-center justify-end gap-2.5 pt-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={onClose}
                  disabled={submitting}
                  className="px-4 py-2 text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-xl transition-colors disabled:opacity-50 cursor-pointer"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-bold text-white bg-[#2563EB] hover:bg-blue-700 active:bg-blue-800 rounded-xl shadow-xs transition-colors disabled:opacity-50 cursor-pointer"
                >
                  {submitting ? (
                    <>
                      <Loader2 className="size-3.5 animate-spin" />
                      Đang gửi...
                    </>
                  ) : (
                    <>
                      <Send className="size-3.5" />
                      Gửi Ý Kiến Đối Chất Cho Ban Quản Trị
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
                Bằng Chứng Đối Chất Gốc (Lưu trữ bất biến SHA-256)
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
                alt="Minh chứng đối chất phóng to"
                className="max-h-[75vh] w-auto max-w-full rounded-lg object-contain shadow-md"
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
