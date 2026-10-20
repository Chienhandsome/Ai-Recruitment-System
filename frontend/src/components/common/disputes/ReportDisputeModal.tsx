'use client';

import React, { useState } from 'react';
import {
  X,
  ShieldAlert,
  AlertTriangle,
  Loader2,
  Send,
  HelpCircle,
  Paperclip,
  Trash2,
  FileText,
  CheckCircle2,
} from 'lucide-react';
import { toast } from 'sonner';
import {
  type DisputeCategory,
  disputeCategoryLabels,
  createDispute,
  uploadDisputeEvidence,
} from '@/lib/dispute-api';

interface ReportDisputeModalProps {
  isOpen: boolean;
  onClose: () => void;
  token: string;
  applicationId: string;
  contractId?: string;
  jobTitle: string;
  companyName?: string;
  candidateName?: string;
  currentUserRole?: 'CANDIDATE' | 'RECRUITER';
  onSubmitted?: () => void;
}

const candidateCategoryLabels: Record<DisputeCategory, string> = {
  SALARY_MISMATCH: 'Lương thực tế khác thỏa thuận Offer',
  UNAUTHORIZED_FEE: 'Bị yêu cầu nộp tiền / đặt cọc trái phép',
  UNFAIR_REVOCATION: 'Bị hủy Offer / Hợp đồng không lý do',
  CONTRACT_VIOLATION: 'Điều khoản hợp đồng vi phạm thỏa thuận',
  HARASSMENT_OR_FRAUD: 'Có dấu hiệu lừa đảo / quấy rối',
  OTHER: 'Lý do khác từ phía Nhà tuyển dụng',
};

const recruiterCategoryLabels: Record<DisputeCategory, string> = {
  CONTRACT_VIOLATION: 'Ứng viên vi phạm cam kết hợp đồng / thỏa thuận làm việc',
  HARASSMENT_OR_FRAUD: 'Ứng viên gian lận hồ sơ / thông tin CV giả mạo / ứng xử phi chuẩn mực',
  UNFAIR_REVOCATION: 'Ứng viên tự ý hủy thỏa thuận nhận việc / bỏ việc đột ngột',
  SALARY_MISMATCH: 'Tranh chấp lương thưởng / đòi hỏi ngoài thỏa thuận',
  UNAUTHORIZED_FEE: 'Hành vi vòi vĩnh chi phí / trục lợi tuyển dụng',
  OTHER: 'Hành vi vi phạm khác từ phía ứng viên',
};

export function ReportDisputeModal({
  isOpen,
  onClose,
  token,
  applicationId,
  contractId,
  jobTitle,
  companyName,
  candidateName,
  currentUserRole = 'CANDIDATE',
  onSubmitted,
}: ReportDisputeModalProps) {
  const isRecruiter = currentUserRole === 'RECRUITER';
  const [category, setCategory] = useState<DisputeCategory>(
    isRecruiter ? 'CONTRACT_VIOLATION' : 'SALARY_MISMATCH',
  );
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [filePreviews, setFilePreviews] = useState<
    Array<{ name: string; size: number; previewUrl?: string; isImage: boolean }>
  >([]);

  // Sync default category when role changes
  React.useEffect(() => {
    if (isRecruiter) {
      setCategory('CONTRACT_VIOLATION');
    } else {
      setCategory('SALARY_MISMATCH');
    }
  }, [isRecruiter]);

  if (!isOpen) return null;

  const activeCategoryLabels = isRecruiter ? recruiterCategoryLabels : candidateCategoryLabels;

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

    const newSelected = [...selectedFiles, ...validFiles].slice(0, 8);
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || title.trim().length < 5) {
      toast.error('Vui lòng nhập tiêu đề khiếu nại (ít nhất 5 ký tự).');
      return;
    }
    if (!description.trim() || description.trim().length < 10) {
      toast.error('Vui lòng mô tả chi tiết sự việc (ít nhất 10 ký tự).');
      return;
    }

    setSubmitting(true);
    try {
      let evidenceUrls: string[] = [];
      if (selectedFiles.length > 0) {
        const uploadResults = await uploadDisputeEvidence(token, selectedFiles);
        evidenceUrls = uploadResults.map((r) => r.url);
      }

      await createDispute(token, {
        applicationId,
        contractId,
        category,
        title: title.trim(),
        description: description.trim(),
        evidenceUrls: evidenceUrls.length > 0 ? evidenceUrls : undefined,
      });

      toast.success(
        isRecruiter
          ? 'Đã gửi báo cáo vi phạm ứng viên kèm tệp bằng chứng lưu vết thành công!'
          : 'Đã gửi khiếu nại kèm chứng cứ hình ảnh/tệp tới Ban Quản Trị thành công! Hồ sơ được lưu trữ vĩnh viễn.',
      );
      setTitle('');
      setDescription('');
      setSelectedFiles([]);
      setFilePreviews([]);
      if (onSubmitted) onSubmitted();
      onClose();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Lỗi khi gửi khiếu nại');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 p-4 backdrop-blur-sm font-sans">
      <div className="w-full max-w-lg rounded-2xl border border-slate-200 bg-white p-6 shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-100 pb-4">
          <div className="flex items-center gap-3">
            <div className="flex size-10 items-center justify-center rounded-xl bg-rose-100 text-rose-600">
              <ShieldAlert className="size-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900">
                {isRecruiter ? 'Báo Cáo Vi Phạm / Khiếu Nại Ứng Viên' : 'Gửi Khiếu Nại / Tố Cáo Vi Phạm'}
              </h3>
              <p className="text-xs text-slate-500">
                {isRecruiter ? (
                  <>
                    Ứng viên: <strong className="text-slate-800">{candidateName || 'Ứng viên'}</strong> • Vị trí: {jobTitle}
                  </>
                ) : (
                  <>
                    Vị trí: <strong>{jobTitle}</strong> • {companyName || 'Doanh nghiệp'}
                  </>
                )}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg p-2 text-slate-400 hover:bg-slate-100 hover:text-slate-600 cursor-pointer"
          >
            <X className="size-5" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="mt-5 space-y-4">
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              {isRecruiter ? 'Phân loại hành vi vi phạm của ứng viên *' : 'Phân loại hành vi vi phạm *'}
            </label>
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value as DisputeCategory)}
              className="w-full rounded-xl border border-slate-200 bg-white p-2.5 text-xs font-semibold text-slate-800 outline-none focus:border-blue-500 cursor-pointer"
            >
              {Object.entries(activeCategoryLabels).map(([key, label]) => (
                <option key={key} value={key}>
                  {label}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              Tiêu đề tóm tắt sự việc *
            </label>
            <input
              type="text"
              required
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder={
                isRecruiter
                  ? 'VD: Ứng viên gian lận kinh nghiệm làm việc trong CV / Vi phạm cam kết nhận việc'
                  : 'VD: Hợp đồng gửi thực tế bị giảm lương so với Offer đã chốt'
              }
              className="w-full rounded-xl border border-slate-200 p-2.5 text-xs text-slate-900 outline-none focus:border-blue-500 font-medium"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              Mô tả chi tiết sự việc & bằng chứng *
            </label>
            <textarea
              rows={4}
              required
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder={
                isRecruiter
                  ? 'Ghi rõ diễn biến sự việc, hành vi vi phạm cụ thể của ứng viên và các tài liệu, tin nhắn, cam kết chứng minh...'
                  : 'Ghi rõ diễn biến sự việc, những trao đổi ngoài lề hoặc các điều khoản bất thường mà NTD yêu cầu...'
              }
              className="w-full rounded-xl border border-slate-200 p-3 text-xs text-slate-900 outline-none focus:border-blue-500 resize-none font-medium leading-relaxed"
            />
            <p className="mt-1 text-2xs text-slate-400 italic">
              {isRecruiter
                ? '* Ban Quản Trị sẽ bảo mật thông tin và trích xuất lịch sử tuyển dụng để làm việc, đối chất công tâm với ứng viên.'
                : '* Ban Quản Trị sẽ tự động trích xuất lịch sử hệ thống (Offer gốc, Hợp đồng, thời gian gửi) để làm căn cứ đối soát độc lập.'}
            </p>
          </div>

          {/* Evidence File Upload (Anti-Tampering) */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="block text-xs font-bold text-slate-700">
                Tệp hình ảnh / Tài liệu bằng chứng thực tế
              </label>
              <span className="text-2xs text-slate-400 font-medium">
                Tối đa 8 tệp (Ảnh chụp, PDF, Tin nhắn, Email)
              </span>
            </div>

            <div className="rounded-xl border border-dashed border-slate-300 p-3.5 bg-slate-50/70 hover:bg-slate-50 transition-colors text-center relative cursor-pointer group">
              <input
                type="file"
                multiple
                accept="image/png,image/jpeg,image/webp,application/pdf,.doc,.docx"
                onChange={handleFileChange}
                disabled={submitting}
                className="absolute inset-0 opacity-0 w-full h-full cursor-pointer z-10"
                title="Chọn ảnh hoặc file bằng chứng"
              />
              <div className="flex flex-col items-center gap-1.5 pointer-events-none">
                <div className="flex size-8 items-center justify-center rounded-lg bg-blue-50 text-[#2563EB] group-hover:scale-105 transition-transform">
                  <Paperclip className="size-4" />
                </div>
                <span className="text-xs font-bold text-slate-700">
                  Bấm vào đây để tải lên hình ảnh hoặc tệp bằng chứng thực tế
                </span>
                <span className="text-2xs text-slate-400">
                  Hệ thống tự động lưu vết vĩnh viễn trên máy chủ với mã băm SHA-256 (Chống chỉnh sửa hay xóa bỏ).
                </span>
              </div>
            </div>

            {/* Selected files preview */}
            {filePreviews.length > 0 && (
              <div className="mt-2.5 space-y-1.5">
                {filePreviews.map((f, idx) => (
                  <div
                    key={idx}
                    className="flex items-center justify-between p-2 rounded-lg bg-white border border-slate-200 text-xs shadow-2xs"
                  >
                    <div className="flex items-center gap-2 min-w-0">
                      {f.isImage && f.previewUrl ? (
                        <img
                          src={f.previewUrl}
                          alt="preview"
                          className="size-8 rounded object-cover border border-slate-200 shrink-0"
                        />
                      ) : (
                        <div className="flex size-8 items-center justify-center rounded bg-slate-100 text-slate-600 shrink-0 font-bold text-3xs uppercase">
                          FILE
                        </div>
                      )}
                      <div className="truncate">
                        <span className="font-semibold text-slate-800 block truncate max-w-[260px]">
                          {f.name}
                        </span>
                        <span className="text-3xs text-slate-400">
                          {(f.size / 1024).toFixed(1)} KB • Lưu vết SHA-256
                        </span>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => removeFile(idx)}
                      disabled={submitting}
                      className="p-1 rounded-md text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors cursor-pointer"
                    >
                      <Trash2 className="size-3.5" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100">
            <button
              type="button"
              onClick={onClose}
              disabled={submitting}
              className="rounded-xl border border-slate-200 px-4 py-2 text-xs font-bold text-slate-600 hover:bg-slate-50 disabled:opacity-50 cursor-pointer"
            >
              Hủy bỏ
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="inline-flex items-center gap-2 rounded-xl bg-rose-600 px-5 py-2 text-xs font-bold text-white shadow-sm hover:bg-rose-700 disabled:opacity-50 transition cursor-pointer"
            >
              {submitting ? <Loader2 className="size-4 animate-spin" /> : <Send className="size-4" />}
              {isRecruiter ? 'Gửi Báo Cáo Vi Phạm' : 'Gửi Khiếu Nại'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
