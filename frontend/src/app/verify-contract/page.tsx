'use client';

import React, { useState, useEffect, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import {
  ShieldCheck,
  ShieldAlert,
  Search,
  CheckCircle2,
  Clock,
  Building2,
  User,
  Lock,
  KeyRound,
  FileText,
  Copy,
  Check,
  ExternalLink,
  ArrowLeft,
  Loader2,
  HelpCircle,
} from 'lucide-react';
import {
  verifyContractPublic,
  type PublicContractVerification,
} from '@/lib/contract-api';

function VerifyContractContent() {
  const searchParams = useSearchParams();
  const initialNumber = searchParams.get('number') || '';

  const [contractNumber, setContractNumber] = useState(initialNumber);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<PublicContractVerification | null>(null);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (initialNumber) {
      handleVerify(initialNumber);
    }
  }, [initialNumber]);

  const handleVerify = async (numberToVerify?: string) => {
    const num = (numberToVerify ?? contractNumber).trim();
    if (!num) return;

    setLoading(true);
    try {
      const data = await verifyContractPublic(num);
      setResult(data);
    } catch {
      setResult({
        verified: false,
        message: 'Không thể kết nối đến máy chủ đối soát hợp đồng.',
      });
    } finally {
      setLoading(false);
    }
  };

  const copyHash = (hash: string) => {
    navigator.clipboard.writeText(hash);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="min-h-screen bg-slate-50 font-sans text-slate-900">
      {/* Header */}
      <header className="border-b border-slate-200 bg-white/80 backdrop-blur-md sticky top-0 z-20">
        <div className="mx-auto flex max-w-5xl items-center justify-between px-4 py-3.5">
          <Link
            href="/"
            className="flex items-center gap-2 text-xs font-bold text-slate-600 hover:text-[#2563EB] transition"
          >
            <ArrowLeft className="size-4" />
            Về Trang Chủ
          </Link>
          <div className="flex items-center gap-2">
            <ShieldCheck className="size-5 text-[#2563EB]" />
            <span className="text-sm font-extrabold text-slate-900 tracking-tight">
              Cổng Tra Cứu & Đối Soát Hợp Đồng Điện Tử
            </span>
          </div>
          <span className="text-2xs font-bold uppercase tracking-wider text-slate-400">
            Hệ Thống Tuyển Dụng AI
          </span>
        </div>
      </header>

      {/* Main Body */}
      <main className="mx-auto max-w-3xl px-4 py-10">
        <div className="text-center">
          <div className="inline-flex size-14 items-center justify-center rounded-2xl bg-blue-100 text-[#2563EB] shadow-sm mb-4">
            <Lock className="size-7" />
          </div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight sm:text-3xl">
            Xác Thực Tính Toàn Vẹn Hợp Đồng Lao Động
          </h1>
          <p className="mx-auto mt-2 max-w-xl text-xs sm:text-sm text-slate-600 leading-relaxed">
            Kiểm tra chứng thực chữ ký điện tử, đối soát mã băm mật mã học (SHA-256) và nhật ký kiểm toán giao kết theo quy định của <strong>Điều 14 Bộ luật Lao động 2019</strong> và <strong>Luật Giao dịch điện tử 2023</strong>.
          </p>
        </div>

        {/* Search bar */}
        <form
          onSubmit={(e) => {
            e.preventDefault();
            handleVerify();
          }}
          className="mt-8 flex items-center gap-2 rounded-2xl border border-slate-300 bg-white p-2 shadow-sm focus-within:border-[#2563EB] focus-within:ring-4 focus-within:ring-blue-100 transition"
        >
          <div className="pl-3 text-slate-400">
            <Search className="size-5" />
          </div>
          <input
            type="text"
            value={contractNumber}
            onChange={(e) => setContractNumber(e.target.value)}
            placeholder="Nhập mã hợp đồng (Ví dụ: HDLD-20261011-1234)..."
            className="flex-1 bg-transparent px-2 text-sm font-semibold text-slate-900 outline-none placeholder:text-slate-400"
          />
          <button
            type="submit"
            disabled={loading || !contractNumber.trim()}
            className="inline-flex items-center gap-2 rounded-xl bg-[#2563EB] px-5 py-2.5 text-xs font-bold text-white shadow-sm hover:bg-blue-700 disabled:opacity-50 transition"
          >
            {loading ? <Loader2 className="size-4 animate-spin" /> : <Search className="size-4" />}
            Tra Cứu
          </button>
        </form>

        {/* Verification Result Card */}
        {result && (
          <div className="mt-8 animate-in fade-in slide-in-from-bottom-3 duration-300">
            {result.verified ? (
              <div className="rounded-2xl border border-slate-200 bg-white shadow-md overflow-hidden">
                {/* Result Status Banner */}
                <div
                  className={`px-6 py-4 flex items-center gap-3 border-b ${
                    result.isLegallyBinding
                      ? 'bg-emerald-50 text-emerald-900 border-emerald-200'
                      : 'bg-amber-50 text-amber-900 border-amber-200'
                  }`}
                >
                  <div
                    className={`flex size-10 shrink-0 items-center justify-center rounded-xl text-white ${
                      result.isLegallyBinding ? 'bg-emerald-600' : 'bg-amber-600'
                    }`}
                  >
                    {result.isLegallyBinding ? (
                      <CheckCircle2 className="size-6" />
                    ) : (
                      <Clock className="size-6" />
                    )}
                  </div>
                  <div className="flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <h3 className="text-base font-extrabold">
                        {result.isLegallyBinding
                          ? 'HỢP ĐỒNG NGUYÊN BẢN HỢP LỆ & ĐÃ ĐƯỢC NIÊM PHONG SỐ'
                          : 'HỢP ĐỒNG ĐANG TRONG TIẾN TRÌNH XÁC THỰC KÝ KẾT'}
                      </h3>
                      <span className="rounded-full bg-white/80 border px-2.5 py-0.5 text-2xs font-extrabold uppercase">
                        {result.status}
                      </span>
                    </div>
                    <p className="text-xs mt-0.5 opacity-90">
                      Mã hợp đồng: <strong>{result.contractNumber}</strong> • Vị trí: <strong>{result.jobTitle}</strong>
                    </p>
                  </div>
                </div>

                <div className="p-6 space-y-6">
                  {/* Parties Info */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {/* Employer */}
                    <div className="rounded-xl border border-slate-200 bg-slate-50/70 p-4">
                      <div className="flex items-center gap-2 text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">
                        <Building2 className="size-4 text-blue-600" />
                        Người sử dụng lao động (Bên A)
                      </div>
                      <div className="text-sm font-bold text-slate-900">
                        {result.employer?.companyName}
                      </div>
                      <div className="text-xs text-slate-600 mt-1">
                        Đại diện: {result.employer?.recruiterName || 'Người đại diện pháp luật'}
                      </div>
                      <div className="mt-3 flex items-center gap-2 text-2xs">
                        <span
                          className={`rounded-full px-2 py-0.5 font-bold ${
                            result.employer?.isSigned
                              ? 'bg-emerald-100 text-emerald-800'
                              : 'bg-slate-200 text-slate-600'
                          }`}
                        >
                          {result.employer?.isSigned ? '✓ Đã ký số' : 'Chờ ký'}
                        </span>
                        {result.employer?.otpVerified && (
                          <span className="rounded-full bg-blue-100 text-blue-800 px-2 py-0.5 font-semibold">
                            ✓ Xác thực 2FA OTP
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Candidate */}
                    <div className="rounded-xl border border-slate-200 bg-slate-50/70 p-4">
                      <div className="flex items-center gap-2 text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">
                        <User className="size-4 text-emerald-600" />
                        Người lao động (Bên B)
                      </div>
                      <div className="text-sm font-bold text-slate-900">
                        {result.candidate?.fullName}
                      </div>
                      <div className="text-xs text-slate-600 mt-1">
                        Chức danh: {result.jobTitle}
                      </div>
                      <div className="mt-3 flex items-center gap-2 text-2xs">
                        <span
                          className={`rounded-full px-2 py-0.5 font-bold ${
                            result.candidate?.isSigned
                              ? 'bg-emerald-100 text-emerald-800'
                              : 'bg-slate-200 text-slate-600'
                          }`}
                        >
                          {result.candidate?.isSigned ? '✓ Đã ký số' : 'Chờ ký'}
                        </span>
                        {result.candidate?.otpVerified && (
                          <span className="rounded-full bg-blue-100 text-blue-800 px-2 py-0.5 font-semibold">
                            ✓ Xác thực 2FA OTP
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* SHA-256 Seal Proof */}
                  {result.sha256Hash && (
                    <div className="rounded-xl border border-blue-200 bg-blue-50/40 p-4">
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-2">
                          <Lock className="size-4 text-[#2563EB]" />
                          <span className="text-xs font-bold text-slate-900">
                            Mã băm toàn vẹn mật mã học (SHA-256 Checksum)
                          </span>
                        </div>
                        <span className="rounded-full bg-emerald-100 text-emerald-800 px-2 py-0.5 text-2xs font-extrabold">
                          KHÔNG THỂ THAY ĐỔI
                        </span>
                      </div>
                      <div className="flex items-center gap-2 bg-white rounded-lg border border-blue-200 p-2.5">
                        <code className="text-2xs font-mono text-slate-800 break-all select-all flex-1">
                          {result.sha256Hash}
                        </code>
                        <button
                          type="button"
                          onClick={() => copyHash(result.sha256Hash!)}
                          className="inline-flex items-center gap-1 rounded px-2 py-1 text-2xs font-bold text-[#2563EB] hover:bg-blue-50 transition shrink-0"
                        >
                          {copied ? <Check className="size-3 text-emerald-600" /> : <Copy className="size-3" />}
                          {copied ? 'Đã chép' : 'Sao chép'}
                        </button>
                      </div>
                      <p className="mt-2 text-2xs text-slate-500">
                        Bất kỳ sự thay đổi dù chỉ 1 ký tự trong văn bản sẽ tạo ra mã băm khác biệt hoàn toàn. Hệ thống xác nhận mã băm trên khớp 100% với bản ghi lưu trữ gốc lúc ký.
                      </p>
                    </div>
                  )}

                  {/* Legal Statement */}
                  <div className="rounded-xl border border-slate-200 bg-slate-50/50 p-4 text-xs text-slate-600 leading-relaxed">
                    <h4 className="font-bold text-slate-800 mb-1 flex items-center gap-1.5">
                      <ShieldCheck className="size-4 text-blue-600" />
                      Căn cứ giá trị pháp lý chính thức:
                    </h4>
                    <p className="text-2xs text-slate-600">
                      {result.legalComplianceText}
                    </p>
                    <p className="text-2xs text-slate-400 mt-2 font-mono">
                      Thời điểm tra cứu đối soát: {new Date(result.verifiedAt || '').toLocaleString('vi-VN')} (UTC+7)
                    </p>
                  </div>
                </div>
              </div>
            ) : (
              <div className="rounded-2xl border border-rose-200 bg-rose-50 p-6 text-center">
                <div className="mx-auto flex size-12 items-center justify-center rounded-2xl bg-rose-100 text-rose-600 mb-3">
                  <ShieldAlert className="size-6" />
                </div>
                <h3 className="text-base font-extrabold text-rose-950">
                  Không Tìm Thấy Hợp Đồng Hoặc Mã Không Hợp Lệ
                </h3>
                <p className="mt-1 text-xs text-rose-700 max-w-md mx-auto">
                  {result.message || 'Mã hợp đồng không tồn tại trên hệ thống lưu trữ.'}
                </p>
              </div>
            )}
          </div>
        )}
      </main>
    </div>
  );
}

export default function VerifyContractPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center bg-slate-50 font-sans">
          <Loader2 className="size-8 animate-spin text-[#2563EB]" />
        </div>
      }
    >
      <VerifyContractContent />
    </Suspense>
  );
}
