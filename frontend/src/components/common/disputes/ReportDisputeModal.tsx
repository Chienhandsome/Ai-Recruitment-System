'use client';

import React, { useState } from 'react';
import {
  X,
  ShieldAlert,
  AlertTriangle,
  Loader2,
  Send,
  HelpCircle,
} from 'lucide-react';
import { toast } from 'sonner';
import {
  type DisputeCategory,
  disputeCategoryLabels,
  createDispute,
} from '@/lib/dispute-api';

interface ReportDisputeModalProps {
  isOpen: boolean;
  onClose: () => void;
  token: string;
  applicationId: string;
  contractId?: string;
  jobTitle: string;
  companyName?: string;
  onSubmitted?: () => void;
}

export function ReportDisputeModal({
  isOpen,
  onClose,
  token,
  applicationId,
  contractId,
  jobTitle,
  companyName,
  onSubmitted,
}: ReportDisputeModalProps) {
  const [category, setCategory] = useState<DisputeCategory>('SALARY_MISMATCH');
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [submitting, setSubmitting] = useState(false);

  if (!isOpen) return null;

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
      await createDispute(token, {
        applicationId,
        contractId,
        category,
        title: title.trim(),
        description: description.trim(),
      });

      toast.success('Đã gửi khiếu nại tới Ban Quản Trị thành công! Chúng tôi sẽ tiếp nhận và xử lý trong 24h.');
      setTitle('');
      setDescription('');
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
                Gửi Khiếu Nại / Tố Cáo Vi Phạm
              </h3>
              <p className="text-xs text-slate-500">
                Vị trí: <strong>{jobTitle}</strong> • {companyName || 'Doanh nghiệp'}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg p-2 text-slate-400 hover:bg-slate-100 hover:text-slate-600"
          >
            <X className="size-5" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="mt-5 space-y-4">
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              Phân loại hành vi vi phạm *
            </label>
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value as DisputeCategory)}
              className="w-full rounded-xl border border-slate-200 bg-white p-2.5 text-xs font-semibold text-slate-800 outline-none focus:border-blue-500"
            >
              {Object.entries(disputeCategoryLabels).map(([key, label]) => (
                <option key={key} value={key}>
                  {label}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              Tiêu đề tóm tắt khiếu nại *
            </label>
            <input
              type="text"
              required
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="VD: Hợp đồng gửi thực tế bị giảm lương so với Offer đã chốt"
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
              placeholder="Ghi rõ diễn biến sự việc, những trao đổi ngoài lề hoặc các điều khoản bất thường mà NTD yêu cầu..."
              className="w-full rounded-xl border border-slate-200 p-3 text-xs text-slate-900 outline-none focus:border-blue-500 resize-none font-medium leading-relaxed"
            />
            <p className="mt-1 text-2xs text-slate-400 italic">
              * Ban Quản Trị sẽ tự động trích xuất lịch sử hệ thống (Offer gốc, Hợp đồng, thời gian gửi) để làm căn cứ đối soát độc lập.
            </p>
          </div>

          <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100">
            <button
              type="button"
              onClick={onClose}
              disabled={submitting}
              className="rounded-xl border border-slate-200 px-4 py-2 text-xs font-bold text-slate-600 hover:bg-slate-50 disabled:opacity-50"
            >
              Hủy bỏ
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="inline-flex items-center gap-2 rounded-xl bg-rose-600 px-5 py-2 text-xs font-bold text-white shadow-sm hover:bg-rose-700 disabled:opacity-50 transition cursor-pointer"
            >
              {submitting ? <Loader2 className="size-4 animate-spin" /> : <Send className="size-4" />}
              Gửi Khiếu Nại
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
