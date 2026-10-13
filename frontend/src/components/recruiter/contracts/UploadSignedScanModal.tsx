'use client';

import React, { useState, useRef } from 'react';
import {
  X,
  UploadCloud,
  FileText,
  ImagePlus,
  Trash2,
  ChevronUp,
  ChevronDown,
  Loader2,
  Check,
  AlertCircle,
  Eye,
  ShieldCheck,
  FileCheck2,
} from 'lucide-react';
import { toast } from 'sonner';
import { uploadSignedContractFiles } from '@/lib/contract-api';

interface UploadSignedScanModalProps {
  isOpen: boolean;
  onClose: () => void;
  token: string;
  contractId: string;
  contractNumber: string;
  candidateName: string;
  onSuccess: () => void | Promise<void>;
}

interface SelectedScanFile {
  id: string;
  file: File;
  previewUrl: string;
  isImage: boolean;
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
  const [selectedFiles, setSelectedFiles] = useState<SelectedScanFile[]>([]);
  const [note, setNote] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [previewingFile, setPreviewingFile] = useState<SelectedScanFile | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  if (!isOpen) return null;

  const handleFilesAdded = (incomingFiles: FileList | File[]) => {
    const validFiles: SelectedScanFile[] = [];
    const maxFileSize = 15 * 1024 * 1024; // 15MB

    for (let i = 0; i < incomingFiles.length; i++) {
      const file = incomingFiles[i];
      if (file.size > maxFileSize) {
        toast.error(`File "${file.name}" vượt quá kích thước 15MB cho phép.`);
        continue;
      }

      const isImage = file.type.startsWith('image/');
      const isPdf = file.type === 'application/pdf' || file.name.toLowerCase().endsWith('.pdf');

      if (!isImage && !isPdf) {
        toast.error(`File "${file.name}" không hợp lệ. Chỉ chấp nhận ảnh (JPG, PNG, WEBP) hoặc PDF.`);
        continue;
      }

      const previewUrl = isImage ? URL.createObjectURL(file) : '';
      validFiles.push({
        id: `${file.name}-${file.lastModified}-${Math.random()}`,
        file,
        previewUrl,
        isImage,
      });
    }

    if (validFiles.length > 0) {
      setSelectedFiles((prev) => [...prev, ...validFiles]);
      toast.success(`Đã thêm ${validFiles.length} file vào danh sách bản scan.`);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      handleFilesAdded(e.dataTransfer.files);
    }
  };

  const handleRemove = (index: number) => {
    setSelectedFiles((prev) => {
      const target = prev[index];
      if (target?.previewUrl) {
        URL.revokeObjectURL(target.previewUrl);
      }
      return prev.filter((_, i) => i !== index);
    });
  };

  const handleMoveUp = (index: number) => {
    if (index === 0) return;
    setSelectedFiles((prev) => {
      const updated = [...prev];
      const temp = updated[index - 1];
      updated[index - 1] = updated[index];
      updated[index] = temp;
      return updated;
    });
  };

  const handleMoveDown = (index: number) => {
    setSelectedFiles((prev) => {
      if (index >= prev.length - 1) return prev;
      const updated = [...prev];
      const temp = updated[index + 1];
      updated[index + 1] = updated[index];
      updated[index] = temp;
      return updated;
    });
  };

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024 * 1024) {
      return `${(bytes / 1024).toFixed(1)} KB`;
    }
    return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
  };

  const totalSize = selectedFiles.reduce((sum, item) => sum + item.file.size, 0);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (selectedFiles.length === 0) {
      toast.error('Vui lòng chọn ít nhất 1 file ảnh chụp hoặc scan của hợp đồng.');
      return;
    }

    setSubmitting(true);
    try {
      const filesToUpload = selectedFiles.map((item) => item.file);
      await uploadSignedContractFiles(
        token,
        contractId,
        filesToUpload,
        note.trim() || undefined,
      );

      toast.success(`Đã tải lên ${selectedFiles.length} trang ảnh hợp đồng và niêm phong SHA-256 thành công!`);
      await onSuccess();
      onClose();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Không thể lưu bản scan hợp đồng');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/70 p-4 backdrop-blur-sm">
      <div className="flex max-h-[90vh] w-full max-w-2xl flex-col rounded-3xl border border-slate-200 bg-white shadow-2xl font-sans overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-100 px-6 py-4 bg-slate-50/50">
          <div className="flex items-center gap-3">
            <div className="flex size-10 items-center justify-center rounded-2xl bg-[#EFF6FF] text-[#2563EB]">
              <UploadCloud className="size-5" />
            </div>
            <div>
              <h3 className="text-base font-extrabold text-slate-900">
                Tải lên bản scan / ảnh chụp hợp đồng
              </h3>
              <p className="text-xs text-slate-500 font-medium">
                Mã HĐ: <span className="font-mono font-bold text-[#2563EB]">{contractNumber}</span> • Ứng viên: <strong className="text-slate-800">{candidateName}</strong>
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-xl p-2 text-slate-400 hover:bg-slate-200/60 hover:text-slate-700 transition cursor-pointer"
          >
            <X className="size-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6 space-y-5">
          {/* Hidden File Input */}
          <input
            ref={fileInputRef}
            type="file"
            multiple
            accept="image/png,image/jpeg,image/jpg,image/webp,application/pdf"
            className="hidden"
            onChange={(e) => {
              if (e.target.files && e.target.files.length > 0) {
                handleFilesAdded(e.target.files);
              }
              e.target.value = '';
            }}
          />

          {/* Drag & Drop Upload Zone */}
          <div
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
            onClick={() => fileInputRef.current?.click()}
            className={`group flex flex-col items-center justify-center rounded-2xl border-2 border-dashed p-6 text-center cursor-pointer transition-all ${
              isDragging
                ? 'border-[#2563EB] bg-blue-50/70 scale-[0.99]'
                : 'border-slate-200 bg-slate-50/60 hover:border-blue-400 hover:bg-[#EFF6FF]/40'
            }`}
          >
            <div className="flex size-14 items-center justify-center rounded-2xl bg-white shadow-xs group-hover:scale-110 transition-transform">
              <ImagePlus className="size-7 text-[#2563EB]" />
            </div>
            <h4 className="mt-3 text-sm font-bold text-slate-800">
              Kéo thả các file ảnh hoặc click để chọn ảnh
            </h4>
            <p className="mt-1 text-xs text-slate-500 max-w-md">
              Hỗ trợ <strong>chọn nhiều ảnh cùng lúc</strong> (Trang 1, Trang 2, Trang 3...) hoặc file PDF. Tối đa 15MB/file.
            </p>
            <span className="mt-3 inline-flex items-center gap-1.5 rounded-xl bg-white border border-slate-200 px-3.5 py-1.5 text-xs font-bold text-[#2563EB] shadow-2xs group-hover:border-blue-300">
              <UploadCloud className="size-3.5" />
              Chọn ảnh từ máy tính
            </span>
          </div>

          {/* Selected Files List / Gallery */}
          {selectedFiles.length > 0 && (
            <div className="space-y-2.5">
              <div className="flex items-center justify-between text-xs">
                <span className="font-bold text-slate-800">
                  Danh sách trang hợp đồng ({selectedFiles.length} trang • {formatFileSize(totalSize)})
                </span>
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="inline-flex items-center gap-1 text-2xs font-bold text-[#2563EB] hover:underline cursor-pointer"
                >
                  + Thêm trang ảnh
                </button>
              </div>

              <div className="divide-y divide-slate-100 rounded-2xl border border-slate-200 bg-white overflow-hidden shadow-2xs">
                {selectedFiles.map((item, idx) => (
                  <div
                    key={item.id}
                    className="flex items-center justify-between gap-3 p-3 hover:bg-slate-50/80 transition"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      {/* Page Badge */}
                      <span className="flex size-7 shrink-0 items-center justify-center rounded-lg bg-blue-100 text-xs font-black text-[#2563EB]">
                        {idx + 1}
                      </span>

                      {/* Thumbnail or Icon */}
                      <div className="size-11 shrink-0 overflow-hidden rounded-xl border border-slate-200 bg-slate-100 flex items-center justify-center">
                        {item.isImage && item.previewUrl ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img
                            src={item.previewUrl}
                            alt={`Trang ${idx + 1}`}
                            className="size-full object-cover"
                          />
                        ) : (
                          <FileText className="size-5 text-rose-600" />
                        )}
                      </div>

                      {/* File Details */}
                      <div className="min-w-0">
                        <p className="truncate text-xs font-bold text-slate-900">
                          {item.file.name}
                        </p>
                        <p className="text-2xs text-slate-500 font-medium">
                          Trang {idx + 1} • {formatFileSize(item.file.size)}
                        </p>
                      </div>
                    </div>

                    {/* Actions: Reorder & Remove */}
                    <div className="flex items-center gap-1 shrink-0">
                      {item.isImage && (
                        <button
                          type="button"
                          onClick={() => setPreviewingFile(item)}
                          className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-700 transition cursor-pointer"
                          title="Xem trước ảnh này"
                        >
                          <Eye className="size-4" />
                        </button>
                      )}

                      <button
                        type="button"
                        onClick={() => handleMoveUp(idx)}
                        disabled={idx === 0}
                        className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-700 disabled:opacity-30 disabled:hover:bg-transparent cursor-pointer"
                        title="Di chuyển lên trước"
                      >
                        <ChevronUp className="size-4" />
                      </button>

                      <button
                        type="button"
                        onClick={() => handleMoveDown(idx)}
                        disabled={idx === selectedFiles.length - 1}
                        className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-700 disabled:opacity-30 disabled:hover:bg-transparent cursor-pointer"
                        title="Di chuyển xuống sau"
                      >
                        <ChevronDown className="size-4" />
                      </button>

                      <button
                        type="button"
                        onClick={() => handleRemove(idx)}
                        className="rounded-lg p-1.5 text-rose-500 hover:bg-rose-50 hover:text-rose-700 transition cursor-pointer"
                        title="Xóa trang này"
                      >
                        <Trash2 className="size-4" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Legal Compliance Guidance Box */}
          <div className="rounded-2xl border border-blue-200 bg-[#EFF6FF]/60 p-3.5 text-xs text-slate-700 space-y-1.5">
            <div className="flex items-center gap-2 font-bold text-blue-900">
              <ShieldCheck className="size-4 text-[#2563EB] shrink-0" />
              <span>Tiêu chuẩn pháp lý & Toàn vẹn tài liệu</span>
            </div>
            <p className="text-2xs leading-relaxed text-slate-600">
              Vui lòng chụp đầy đủ các trang hợp đồng, bảo đảm <strong>rõ chữ, không lóa mờ, thấy rõ chữ ký và mộc đỏ</strong>. Hệ thống sẽ tự động ghép nối và tính mã băm SHA-256 niêm phong trên toàn bộ các trang ảnh để làm bằng chứng pháp lý đối soát.
            </p>
          </div>

          {/* Internal Notes */}
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1.5">
              Ghi chú nội bộ (Tùy chọn)
            </label>
            <textarea
              rows={2}
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder="VD: Đã ký mộc đỏ tại văn phòng, lưu 01 bản gốc tại phòng Nhân sự..."
              className="w-full rounded-xl border border-slate-200 p-3 text-xs font-medium text-slate-800 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100 resize-none"
            />
          </div>

          {/* Footer Buttons */}
          <div className="flex items-center justify-between pt-3 border-t border-slate-100">
            <button
              type="button"
              onClick={onClose}
              disabled={submitting}
              className="rounded-xl border border-slate-200 px-4 py-2 text-xs font-bold text-slate-600 hover:bg-slate-50 disabled:opacity-50 cursor-pointer"
            >
              Hủy
            </button>
            <button
              type="submit"
              disabled={submitting || selectedFiles.length === 0}
              className="inline-flex items-center gap-2 rounded-xl bg-[#2563EB] px-5 py-2.5 text-xs font-bold text-white shadow-sm hover:bg-blue-700 disabled:opacity-50 cursor-pointer"
            >
              {submitting ? (
                <>
                  <Loader2 className="size-4 animate-spin" />
                  Đang tải lên & Niêm phong...
                </>
              ) : (
                <>
                  <Check className="size-4" />
                  Xác nhận tải lên ({selectedFiles.length} trang)
                </>
              )}
            </button>
          </div>
        </form>
      </div>

      {/* Full Preview Image Modal */}
      {previewingFile && (
        <div
          className="fixed inset-0 z-60 flex items-center justify-center bg-slate-950/80 p-4"
          onClick={() => setPreviewingFile(null)}
        >
          <div
            className="relative max-h-[90vh] max-w-3xl overflow-hidden rounded-2xl bg-white p-2 shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              type="button"
              onClick={() => setPreviewingFile(null)}
              className="absolute right-4 top-4 z-10 rounded-full bg-slate-900/70 p-1.5 text-white hover:bg-slate-900"
            >
              <X className="size-5" />
            </button>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={previewingFile.previewUrl}
              alt="Xem trước ảnh scan"
              className="max-h-[80vh] w-auto rounded-xl object-contain"
            />
            <p className="mt-2 text-center text-xs font-semibold text-slate-700">
              {previewingFile.file.name}
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
