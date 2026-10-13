'use client';

import React, { useState, useEffect } from 'react';
import { X, ShieldCheck, FileText, Loader2, ExternalLink } from 'lucide-react';
import { getPublicPolicyByCode, type SystemPolicyData } from '@/lib/policy-api';
import Link from 'next/link';

interface PolicyQuickViewModalProps {
  isOpen: boolean;
  onClose: () => void;
  policyCode: string | null;
}

export function PolicyQuickViewModal({
  isOpen,
  onClose,
  policyCode,
}: PolicyQuickViewModalProps) {
  const [policy, setPolicy] = useState<SystemPolicyData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen && policyCode) {
      setLoading(true);
      setError(null);
      getPublicPolicyByCode(policyCode)
        .then((data) => setPolicy(data))
        .catch((err) => {
          setError(err instanceof Error ? err.message : 'Không thể tải chính sách');
        })
        .finally(() => setLoading(false));
    } else {
      setPolicy(null);
    }
  }, [isOpen, policyCode]);

  if (!isOpen || !policyCode) return null;

  return (
    <div className="fixed inset-0 z-[130] flex items-center justify-center bg-slate-950/70 p-4 backdrop-blur-sm animate-in fade-in duration-150 font-sans">
      <div className="flex h-[88vh] w-full max-w-3xl flex-col rounded-2xl border border-slate-200 bg-white shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-100 bg-slate-50/70 px-6 py-4">
          <div className="flex items-center gap-3">
            <div className="flex size-10 items-center justify-center rounded-xl bg-blue-100 text-[#2563EB]">
              <ShieldCheck className="size-5" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-slate-900 line-clamp-1">
                {policy?.title || 'Chính Sách & Quy Chế Nền Tảng'}
              </h3>
              <p className="text-2xs text-slate-500 font-mono mt-0.5">
                Mã: {policyCode} {policy?.version ? `• Phiên bản v${policy.version}` : ''}
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="rounded-lg p-2 text-slate-400 hover:bg-slate-100 hover:text-slate-600 transition"
          >
            <X className="size-5" />
          </button>
        </div>

        {/* Content Body */}
        <div className="flex-1 overflow-y-auto p-6 text-xs text-slate-700 leading-relaxed bg-white">
          {loading ? (
            <div className="flex flex-col items-center justify-center py-20 text-slate-400">
              <Loader2 className="size-8 animate-spin text-[#2563EB]" />
              <p className="mt-3 text-xs font-medium">Đang tải nội dung chính sách...</p>
            </div>
          ) : error ? (
            <div className="rounded-xl border border-rose-200 bg-rose-50 p-4 text-center text-rose-700">
              <p className="font-semibold">{error}</p>
              <p className="text-2xs mt-1 text-rose-600">
                Bạn có thể xem trực tiếp tại trang điều khoản công khai.
              </p>
            </div>
          ) : policy ? (
            <div className="prose prose-sm max-w-none space-y-4">
              {policy.description && (
                <div className="rounded-xl border border-blue-100 bg-[#EFF6FF] p-3.5 text-xs text-blue-900 font-medium">
                  {policy.description}
                </div>
              )}

              <div className="whitespace-pre-line text-slate-800 leading-relaxed font-sans text-xs">
                {policy.content}
              </div>
            </div>
          ) : null}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between border-t border-slate-100 bg-slate-50 px-6 py-3.5">
          <Link
            href="/terms"
            target="_blank"
            className="inline-flex items-center gap-1.5 text-2xs font-bold text-[#2563EB] hover:underline"
          >
            <ExternalLink className="size-3.5" />
            Xem cổng chính sách toàn diện
          </Link>

          <button
            type="button"
            onClick={onClose}
            className="rounded-xl bg-[#2563EB] px-5 py-2 text-xs font-bold text-white shadow-sm hover:bg-blue-700 transition"
          >
            Đã hiểu & Đóng
          </button>
        </div>
      </div>
    </div>
  );
}
