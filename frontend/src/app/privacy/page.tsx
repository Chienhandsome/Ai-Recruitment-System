import React from 'react';
import Link from 'next/link';
import { ShieldCheck, Lock, ArrowLeft, Calendar, CheckCircle2 } from 'lucide-react';
import { getPublicPolicyByCode } from '@/lib/policy-api';

export const dynamic = 'force-dynamic';

export default async function PrivacyPage() {
  let policy = null;
  try {
    policy = await getPublicPolicyByCode('PRIVACY_POLICY');
  } catch {
    // Fallback
  }

  return (
    <div className="min-h-screen bg-[#F8FAFC] text-[#0F172A] font-sans">
      {/* Top Navbar */}
      <header className="border-b border-slate-200 bg-white sticky top-0 z-10">
        <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4 sm:px-6">
          <Link
            href="/"
            className="inline-flex items-center gap-2 text-xs font-bold text-slate-600 hover:text-blue-600 transition"
          >
            <ArrowLeft className="size-4" /> Quay lại trang chủ
          </Link>
          <div className="flex items-center gap-4 text-xs font-semibold">
            <Link href="/terms" className="text-slate-600 hover:text-blue-600">
              Điều khoản dịch vụ
            </Link>
            <Link href="/privacy" className="text-blue-600 font-bold border-b-2 border-blue-600 pb-0.5">
              Chính sách bảo mật
            </Link>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="mx-auto max-w-4xl px-4 py-10 sm:px-6">
        <div className="rounded-3xl border border-slate-200 bg-white p-6 sm:p-12 shadow-sm">
          {/* Header */}
          <div className="border-b border-slate-100 pb-8">
            <div className="flex items-center gap-3">
              <div className="flex size-12 items-center justify-center rounded-2xl bg-emerald-100 text-emerald-600 shadow-sm">
                <Lock className="size-6" />
              </div>
              <div>
                <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-50 border border-emerald-200 px-2.5 py-0.5 text-2xs font-extrabold text-emerald-700">
                  <ShieldCheck className="size-3.5" /> Tuân thủ Nghị định 13/2023/NĐ-CP • v{policy?.version || 1}.0
                </span>
                <h1 className="mt-1 text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
                  {policy?.title || 'Chính Sách Bảo Mật Dữ Liệu'}
                </h1>
              </div>
            </div>
            <p className="mt-3 text-xs text-slate-500 leading-relaxed">
              {policy?.description || 'Quy chuẩn bảo vệ thông tin định danh, hồ sơ ứng viên và dữ liệu phân tích phỏng vấn AI.'}
            </p>
            <div className="mt-4 flex items-center gap-4 text-2xs font-semibold text-slate-400">
              <span className="flex items-center gap-1">
                <Calendar className="size-3" /> Cập nhật lần cuối: {policy ? new Date(policy.updatedAt).toLocaleDateString('vi-VN') : '12/10/2026'}
              </span>
              <span>•</span>
              <span className="text-emerald-600">Bảo vệ quyền riêng tư 100%</span>
            </div>
          </div>

          {/* Policy Body */}
          <article className="prose prose-slate prose-sm mt-8 max-w-none text-xs leading-relaxed text-slate-700">
            <div className="whitespace-pre-line font-normal">
              {policy?.content || `Đang tải nội dung chính sách bảo mật...`}
            </div>
          </article>

          {/* Footer Notice */}
          <div className="mt-12 rounded-2xl border border-emerald-200 bg-emerald-50/50 p-5">
            <div className="flex items-start gap-3">
              <CheckCircle2 className="size-5 text-emerald-600 shrink-0 mt-0.5" />
              <div className="text-xs">
                <strong className="font-bold text-slate-900">Cam kết an toàn dữ liệu và quyền cá nhân</strong>
                <p className="mt-1 text-slate-600 leading-relaxed">
                  Chúng tôi không chia sẻ hoặc thương mại hóa dữ liệu cá nhân của người dùng cho bất kỳ bên thứ ba nào. Bạn có toàn quyền yêu cầu trích xuất hoặc xóa bỏ toàn bộ dữ liệu cá nhân khỏi máy chủ theo quy định của pháp luật.
                </p>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
