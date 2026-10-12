'use client';

import React, { useState } from 'react';
import { X, UploadCloud, FileCheck2, Loader2, Check } from 'lucide-react';
import { toast } from 'sonner';
import { uploadSignedContract } from '@/lib/contract-api';

interface UploadSignedScanModalProps {
  isOpen: boolean;
  onClose: () => void;
  token: string;
  contractId: string;
  contractNumber: string;
  candidateName: string;
  onSuccess: () => void | Promise<void>;
}

export function UploadSignedScanModal({
  isOpen,
  onClose,
  token,
  contractId,
  contractNumber,
  candidateName,
  onSuccess,
}: UploadSignedScanModalProps) {
  const [signedPdfUrl, setSignedPdfUrl] = useState('');
  const [note, setNote] = useState('');
  const [submitting, setSubmitting] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!signedPdfUrl.trim()) {
      toast.error('Vui lòng nhập đường dẫn file PDF bản scan hợp đồng đã ký.');
      return;
    }

    setSubmitting(true);
    try {
      await uploadSignedContract(token, contractId, signedPdfUrl.trim(), note.trim() || undefined);
      toast.success('Đã cập nhật bản hợp đồng ký kết thành công!');
      await onSuccess();
      onClose();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Không thể lưu bản scan hợp đồng');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 p-4 backdrop-blur-sm">
      <div className="w-full max-w-md rounded-2xl border border-slate-200 bg-white p-6 shadow-2xl font-sans">
        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
          <div className="flex items-center gap-2.5">
            <div className="flex size-9 items-center justify-center rounded-xl bg-emerald-100 text-emerald-700">
              <UploadCloud className="size-5" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-slate-900">Upload bản scan hợp đồng</h3>
              <p className="text-2xs text-slate-500">Mã: {contractNumber} • {candidateName}</p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-600"
          >
            <X className="size-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="mt-4 space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Đường dẫn file PDF bản scan / ký tay *
            </label>
            <input
              type="url"
              required
              value={signedPdfUrl}
              onChange={(e) => setSignedPdfUrl(e.target.value)}
              placeholder="https://storage.../hop-dong-da-ky.pdf"
              className="w-full rounded-xl border border-slate-200 p-2.5 text-xs font-medium text-slate-800 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
            />
            <p className="mt-1 text-2xs text-slate-400">
              Bạn có thể dán đường dẫn lưu trữ đám mây hoặc link file PDF sau khi hai bên đã ký tay.
            </p>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Ghi chú nội bộ (Tùy chọn)
            </label>
            <textarea
              rows={2}
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder="VD: Đã đối chiếu mộc đỏ và lưu hồ sơ giấy tại phòng Nhân sự..."
              className="w-full rounded-xl border border-slate-200 p-2.5 text-xs font-medium text-slate-800 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100 resize-none"
            />
          </div>

          <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
            <button
              type="button"
              onClick={onClose}
              disabled={submitting}
              className="rounded-xl border border-slate-200 px-4 py-2 text-xs font-bold text-slate-600 hover:bg-slate-50 disabled:opacity-50"
            >
              Hủy
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="inline-flex items-center gap-2 rounded-xl bg-emerald-600 px-5 py-2 text-xs font-bold text-white shadow-sm hover:bg-emerald-700 disabled:opacity-50"
            >
              {submitting ? <Loader2 className="size-4 animate-spin" /> : <Check className="size-4" />}
              Xác nhận hoàn tất
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
