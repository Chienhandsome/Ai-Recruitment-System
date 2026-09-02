'use client';

import React, { useState, useEffect, useRef } from 'react';
import {
  X,
  Send,
  UploadCloud,
  FileText,
  CheckCircle2,
  AlertCircle,
  Loader2,
  Briefcase,
  Link as LinkIcon,
  User,
  Mail,
  Phone,
} from 'lucide-react';
import { toast } from 'sonner';
import { createClient } from '@/lib/supabase/client';
import { getCurrentProfile } from '@/lib/auth-api';
import { applyForJob, uploadResume } from '@/lib/candidate-api';
import type { AuthProfile } from '@/types/auth';

interface ApplyJobModalProps {
  isOpen: boolean;
  onClose: () => void;
  jobId: string;
  jobTitle: string;
  companyName: string;
  requiresProofOfWork?: boolean;
  proofOfWorkType?: string | null;
  onSuccess: () => void;
}

export function ApplyJobModal({
  isOpen,
  onClose,
  jobId,
  jobTitle,
  companyName,
  requiresProofOfWork = false,
  proofOfWorkType = 'PORTFOLIO',
  onSuccess,
}: ApplyJobModalProps) {
  const [loadingProfile, setLoadingProfile] = useState(false);
  const [profile, setProfile] = useState<AuthProfile | null>(null);
  const [token, setToken] = useState<string | null>(null);

  // Form states
  const [uploadedResumeId, setUploadedResumeId] = useState<string | null>(null);
  const [uploadedFileName, setUploadedFileName] = useState<string | null>(null);
  const [isUploadingCv, setIsUploadingCv] = useState(false);
  const [proofUrl, setProofUrl] = useState('');
  const [coverNote, setCoverNote] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!isOpen) return;

    const fetchSessionAndProfile = async () => {
      setLoadingProfile(true);
      try {
        const supabase = createClient();
        const {
          data: { session },
        } = await supabase.auth.getSession();

        if (!session?.access_token) {
          toast.error('Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại.');
          onClose();
          return;
        }

        setToken(session.access_token);
        const p = await getCurrentProfile(session.access_token);
        setProfile(p);
      } catch (err) {
        toast.error('Không thể tải thông tin ứng viên');
      } finally {
        setLoadingProfile(false);
      }
    };

    fetchSessionAndProfile();
  }, [isOpen]);

  if (!isOpen) return null;

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !token) return;

    // Check size <= 10MB
    if (file.size > 10 * 1024 * 1024) {
      toast.error('Kích thước tệp không được vượt quá 10MB');
      return;
    }

    setIsUploadingCv(true);
    try {
      const res = await uploadResume(token, file);
      setUploadedResumeId(res.id);
      setUploadedFileName(res.originalFileName || file.name);
      toast.success('Tải CV lên thành công! AI đang tiến hành xử lý.');
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Tải CV lên thất bại');
    } finally {
      setIsUploadingCv(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!token) return;

    if (requiresProofOfWork && !proofUrl.trim()) {
      toast.error(`Vị trí này yêu cầu liên kết Bằng chứng năng lực / ${proofOfWorkType || 'Portfolio'}`);
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await applyForJob(token, jobId, uploadedResumeId ?? undefined);
      toast.success(res.message || 'Ứng tuyển thành công! Hồ sơ đã được ghi nhận.');
      onSuccess();
      onClose();
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Không thể hoàn tất ứng tuyển';
      toast.error(msg);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-950/60 p-4 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="relative w-full max-w-xl rounded-2xl border border-slate-200 bg-white p-6 shadow-2xl animate-in zoom-in-95 duration-200 max-h-[90vh] overflow-y-auto">
        {/* Close button */}
        <button
          type="button"
          onClick={onClose}
          disabled={isSubmitting}
          className="absolute right-4 top-4 rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-700 transition"
          aria-label="Đóng"
        >
          <X className="size-5" />
        </button>

        {/* Modal Header */}
        <div className="flex items-start gap-3 pb-4 border-b border-slate-100">
          <div className="rounded-xl bg-[#EFF6FF] p-2.5 text-[#2563EB] shrink-0">
            <Briefcase className="size-6" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-slate-900">Xác nhận nộp đơn ứng tuyển</h2>
            <p className="text-sm font-semibold text-[#2563EB]">{jobTitle}</p>
            <p className="text-xs text-slate-500">{companyName}</p>
          </div>
        </div>

        {loadingProfile ? (
          <div className="flex flex-col items-center justify-center py-12 gap-3">
            <Loader2 className="size-8 animate-spin text-[#2563EB]" />
            <p className="text-sm text-slate-500 font-medium">Đang chuẩn bị hồ sơ ứng tuyển...</p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="mt-5 space-y-5">
            {/* Candidate Identity summary */}
            <div className="rounded-xl border border-slate-200 bg-slate-50/80 p-4 space-y-2">
              <p className="text-xs font-bold uppercase tracking-wider text-slate-500">
                Thông tin người ứng tuyển
              </p>
              <div className="grid gap-2 sm:grid-cols-2 text-xs">
                <div className="flex items-center gap-2 text-slate-700 font-semibold">
                  <User className="size-4 text-[#2563EB] shrink-0" />
                  <span className="truncate">{profile?.fullName || 'Chưa cập nhật tên'}</span>
                </div>
                <div className="flex items-center gap-2 text-slate-700">
                  <Mail className="size-4 text-[#2563EB] shrink-0" />
                  <span className="truncate">{profile?.email}</span>
                </div>
                {profile?.phone && (
                  <div className="flex items-center gap-2 text-slate-700">
                    <Phone className="size-4 text-[#2563EB] shrink-0" />
                    <span>{profile.phone}</span>
                  </div>
                )}
              </div>
            </div>

            {/* Resume selection or upload */}
            <div className="space-y-2">
              <label className="block text-xs font-bold text-slate-900">
                Hồ sơ ứng tuyển (CV) <span className="text-rose-500">*</span>
              </label>

              {uploadedFileName ? (
                <div className="flex items-center justify-between p-3.5 rounded-xl border border-emerald-200 bg-emerald-50 text-emerald-800 text-xs font-semibold">
                  <div className="flex items-center gap-2.5 truncate">
                    <CheckCircle2 className="size-5 text-emerald-600 shrink-0" />
                    <span className="truncate">{uploadedFileName}</span>
                    <span className="rounded-md bg-emerald-200/70 px-2 py-0.5 text-[10px] text-emerald-900">
                      Mới tải lên
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="text-xs font-bold text-emerald-700 hover:underline shrink-0 ml-2"
                  >
                    Đổi file khác
                  </button>
                </div>
              ) : (
                <div className="rounded-xl border border-dashed border-slate-300 p-4 text-center bg-slate-50/50 hover:bg-slate-50 transition">
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept=".pdf,.docx,.doc"
                    onChange={handleFileUpload}
                    className="hidden"
                  />
                  <div className="flex flex-col items-center gap-2">
                    <div className="rounded-full bg-[#EFF6FF] p-2 text-[#2563EB]">
                      {isUploadingCv ? (
                        <Loader2 className="size-5 animate-spin" />
                      ) : (
                        <UploadCloud className="size-5" />
                      )}
                    </div>
                    <div>
                      <p className="text-xs font-bold text-slate-800">
                        {isUploadingCv ? 'Đang tải lên CV...' : 'Sử dụng CV trong hồ sơ hoặc tải lên CV mới'}
                      </p>
                      <p className="text-[11px] text-slate-500 mt-0.5">
                        Định dạng hỗ trợ: PDF, DOCX (tối đa 10MB)
                      </p>
                    </div>
                    <button
                      type="button"
                      disabled={isUploadingCv}
                      onClick={() => fileInputRef.current?.click()}
                      className="mt-1 inline-flex items-center gap-1.5 rounded-lg bg-white px-3 py-1.5 text-xs font-bold text-[#2563EB] border border-blue-200 shadow-xs hover:bg-blue-50 transition"
                    >
                      <UploadCloud className="size-3.5" />
                      Tải file CV lên
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* Proof of Work requirement */}
            {requiresProofOfWork && (
              <div className="space-y-1.5 rounded-xl border border-amber-200 bg-amber-50/50 p-3.5">
                <label className="block text-xs font-bold text-amber-900 flex items-center gap-1.5">
                  <LinkIcon className="size-3.5 text-amber-700" />
                  Bằng chứng năng lực ({proofOfWorkType || 'Portfolio / Github'}){' '}
                  <span className="text-rose-500">*</span>
                </label>
                <p className="text-[11px] text-amber-800">
                  Nhà tuyển dụng yêu cầu ứng viên cung cấp liên kết dẫn tới sản phẩm thực tế, portfolio hoặc kho mã nguồn.
                </p>
                <input
                  type="url"
                  value={proofUrl}
                  onChange={(e) => setProofUrl(e.target.value)}
                  placeholder="https://github.com/my-work hoặc https://myportfolio.dev"
                  required
                  className="w-full rounded-lg border border-amber-300 bg-white px-3 py-2 text-xs text-slate-900 placeholder:text-slate-400 focus:border-[#2563EB] focus:outline-none focus:ring-2 focus:ring-[#2563EB]/20"
                />
              </div>
            )}

            {/* Optional Cover Note */}
            <div className="space-y-1.5">
              <label className="block text-xs font-bold text-slate-900">
                Lời nhắn gửi nhà tuyển dụng (Tùy chọn)
              </label>
              <textarea
                value={coverNote}
                onChange={(e) => setCoverNote(e.target.value)}
                placeholder="Giới thiệu ngắn gọn lý do bạn phù hợp với vị trí này..."
                rows={3}
                className="w-full rounded-xl border border-slate-200 bg-slate-50/50 p-3 text-xs text-slate-900 placeholder:text-slate-400 focus:border-[#2563EB] focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#2563EB]/20 transition"
              />
            </div>

            {/* Action buttons */}
            <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-slate-100">
              <button
                type="button"
                onClick={onClose}
                disabled={isSubmitting}
                className="rounded-xl border border-slate-200 px-4 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50 transition"
              >
                Hủy bỏ
              </button>

              <button
                type="submit"
                disabled={isSubmitting || isUploadingCv}
                className="inline-flex items-center gap-2 rounded-xl bg-[#2563EB] px-5 py-2 text-xs font-bold text-white shadow-sm hover:bg-[#1D4ED8] focus:outline-none focus:ring-2 focus:ring-[#2563EB]/40 disabled:opacity-50 transition active:translate-y-px"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="size-3.5 animate-spin" />
                    Đang nộp hồ sơ...
                  </>
                ) : (
                  <>
                    <Send className="size-3.5" />
                    Xác nhận ứng tuyển
                  </>
                )}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
