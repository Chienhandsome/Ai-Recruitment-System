'use client';

import React, { useState, useEffect } from 'react';
import {
  FileText,
  Save,
  ShieldCheck,
  Eye,
  FileEdit,
  RotateCcw,
  CheckCircle2,
  AlertCircle,
  Loader2,
  Calendar,
} from 'lucide-react';
import { toast } from 'sonner';
import { createClient } from '@/lib/supabase/client';
import {
  type SystemPolicyData,
  getAdminPolicies,
  updateAdminPolicy,
} from '@/lib/policy-api';

export default function AdminPoliciesPage() {
  const [token, setToken] = useState<string>('');
  const [policies, setPolicies] = useState<SystemPolicyData[]>([]);
  const [selectedCode, setSelectedCode] = useState<string>('TERMS_OF_SERVICE');
  const [loading, setLoading] = useState<boolean>(true);
  const [saving, setSaving] = useState<boolean>(false);
  const [activeTab, setActiveTab] = useState<'edit' | 'preview'>('edit');

  // Form states
  const [title, setTitle] = useState<string>('');
  const [description, setDescription] = useState<string>('');
  const [content, setContent] = useState<string>('');
  const [isPublished, setIsPublished] = useState<boolean>(true);

  useEffect(() => {
    const supabase = createClient();
    supabase.auth.getSession().then((res: any) => {
      const session = res?.data?.session;
      if (session) {
        setToken(session.access_token);
        loadPolicies(session.access_token);
      }
    });
  }, []);

  const loadPolicies = async (t: string) => {
    setLoading(true);
    try {
      const data = await getAdminPolicies(t);
      setPolicies(data);
      if (data.length > 0) {
        const current = data.find((p) => p.code === selectedCode) || data[0];
        setSelectedCode(current.code);
        setTitle(current.title);
        setDescription(current.description || '');
        setContent(current.content);
        setIsPublished(current.isPublished);
      }
    } catch (err) {
      toast.error('Không thể tải danh sách chính sách');
    } finally {
      setLoading(false);
    }
  };

  const handleSelectPolicy = (code: string) => {
    setSelectedCode(code);
    const item = policies.find((p) => p.code === code);
    if (item) {
      setTitle(item.title);
      setDescription(item.description || '');
      setContent(item.content);
      setIsPublished(item.isPublished);
    }
  };

  const handleSave = async () => {
    if (!title.trim() || !content.trim()) {
      toast.error('Tiêu đề và nội dung không được để trống.');
      return;
    }

    setSaving(true);
    try {
      const updated = await updateAdminPolicy(token, selectedCode, {
        title: title.trim(),
        description: description.trim() || undefined,
        content: content.trim(),
        isPublished,
      });

      toast.success(`Đã cập nhật chính sách thành công (Phiên bản v${updated.version}.0)`);
      await loadPolicies(token);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Lỗi khi lưu chính sách');
    } finally {
      setSaving(false);
    }
  };

  const currentPolicy = policies.find((p) => p.code === selectedCode);

  return (
    <div className="space-y-6 font-sans">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 pb-5">
        <div>
          <span className="inline-flex items-center gap-1.5 rounded-full bg-blue-50 border border-blue-200 px-2.5 py-0.5 text-2xs font-extrabold text-[#2563EB]">
            <ShieldCheck className="size-3.5" /> Quản trị minh bạch & Tuân thủ pháp lý
          </span>
          <h1 className="mt-1 text-2xl font-black text-[#0F172A] tracking-tight">
            Quản Lý Điều Khoản & Khung Hợp Đồng
          </h1>
          <p className="mt-0.5 text-xs text-slate-500">
            Cấu hình nội dung Điều khoản dịch vụ, Chính sách dữ liệu cá nhân và Khung hợp đồng lao động chuẩn cho toàn hệ thống.
          </p>
        </div>

        <button
          type="button"
          onClick={handleSave}
          disabled={saving || loading}
          className="inline-flex items-center gap-2 rounded-xl bg-[#2563EB] px-5 py-2.5 text-xs font-bold text-white shadow-sm hover:bg-blue-700 disabled:opacity-50 transition cursor-pointer self-start sm:self-auto"
        >
          {saving ? <Loader2 className="size-4 animate-spin" /> : <Save className="size-4" />}
          Lưu & Tăng Phiên Bản
        </button>
      </div>

      {/* Grid: Policy Selector + Editor */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Left column: List of policies */}
        <div className="lg:col-span-1 space-y-2">
          <h2 className="text-xs font-black uppercase tracking-wider text-slate-500 px-1 mb-2">
            Danh mục chính sách ({policies.length})
          </h2>

          {loading ? (
            <div className="flex items-center justify-center p-8 text-slate-400">
              <Loader2 className="size-6 animate-spin" />
            </div>
          ) : (
            policies.map((p) => {
              const isSelected = p.code === selectedCode;
              return (
                <button
                  key={p.code}
                  type="button"
                  onClick={() => handleSelectPolicy(p.code)}
                  className={`w-full text-left rounded-2xl p-3.5 border transition-all ${
                    isSelected
                      ? 'border-[#2563EB] bg-blue-50/70 shadow-xs ring-1 ring-[#2563EB]'
                      : 'border-slate-200 bg-white hover:bg-slate-50 text-slate-700'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="font-mono text-2xs font-extrabold text-[#2563EB]">
                      v{p.version}.0
                    </span>
                    <span
                      className={`text-3xs font-black px-1.5 py-0.5 rounded ${
                        p.isPublished ? 'bg-emerald-100 text-emerald-800' : 'bg-slate-200 text-slate-600'
                      }`}
                    >
                      {p.isPublished ? 'PUBLISHED' : 'DRAFT'}
                    </span>
                  </div>
                  <h3 className="mt-1 text-xs font-bold text-slate-900 line-clamp-1">{p.title}</h3>
                  <p className="mt-0.5 text-2xs text-slate-500 line-clamp-1 font-mono">{p.code}</p>
                </button>
              );
            })
          )}
        </div>

        {/* Right column: Editor & Preview */}
        <div className="lg:col-span-3 space-y-4">
          {/* Metadata bar */}
          {currentPolicy && (
            <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-2xs flex flex-wrap items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <div className="flex size-10 items-center justify-center rounded-xl bg-blue-100 text-[#2563EB]">
                  <FileText className="size-5" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-slate-900">{currentPolicy.title}</h3>
                  <div className="flex items-center gap-3 text-2xs text-slate-500 mt-0.5">
                    <span>Mã: <strong className="font-mono text-slate-800">{currentPolicy.code}</strong></span>
                    <span>•</span>
                    <span>Phiên bản hiện tại: <strong className="text-[#2563EB]">v{currentPolicy.version}.0</strong></span>
                    <span>•</span>
                    <span>Cập nhật: {new Date(currentPolicy.updatedAt).toLocaleString('vi-VN')}</span>
                  </div>
                </div>
              </div>

              {/* Tabs Edit / Preview */}
              <div className="flex rounded-xl bg-slate-100 p-1 text-xs font-semibold">
                <button
                  type="button"
                  onClick={() => setActiveTab('edit')}
                  className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 transition ${
                    activeTab === 'edit'
                      ? 'bg-white text-slate-900 shadow-sm'
                      : 'text-slate-500 hover:text-slate-800'
                  }`}
                >
                  <FileEdit className="size-3.5" /> Chỉnh sửa
                </button>
                <button
                  type="button"
                  onClick={() => setActiveTab('preview')}
                  className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 transition ${
                    activeTab === 'preview'
                      ? 'bg-white text-slate-900 shadow-sm'
                      : 'text-slate-500 hover:text-slate-800'
                  }`}
                >
                  <Eye className="size-3.5" /> Xem trước
                </button>
              </div>
            </div>
          )}

          {/* Edit / Preview Panel */}
          {activeTab === 'edit' ? (
            <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Tiêu đề chính sách
                </label>
                <input
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="w-full rounded-xl border border-slate-200 px-3.5 py-2.5 text-xs font-semibold text-slate-900 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Mô tả ngắn gọn
                </label>
                <input
                  type="text"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="w-full rounded-xl border border-slate-200 px-3.5 py-2.5 text-xs text-slate-700 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                />
              </div>

              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="block text-xs font-bold text-slate-700">
                    Nội dung văn bản điều khoản (Định dạng Markdown / Text)
                  </label>
                  <span className="text-2xs text-slate-400">
                    {content.length} ký tự
                  </span>
                </div>
                <textarea
                  rows={18}
                  value={content}
                  onChange={(e) => setContent(e.target.value)}
                  className="w-full rounded-xl border border-slate-200 p-4 font-mono text-xs text-slate-800 leading-relaxed outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                />
              </div>

              <div className="flex items-center gap-2 pt-2 border-t border-slate-100">
                <input
                  type="checkbox"
                  id="isPublished"
                  checked={isPublished}
                  onChange={(e) => setIsPublished(e.target.checked)}
                  className="size-4 rounded text-blue-600 focus:ring-blue-500"
                />
                <label htmlFor="isPublished" className="text-xs font-semibold text-slate-700 select-none cursor-pointer">
                  Công bố chính sách này (Hiển thị công khai cho Người dùng)
                </label>
              </div>
            </div>
          ) : (
            <div className="rounded-2xl border border-slate-200 bg-white p-8 shadow-sm">
              <h2 className="text-xl font-black text-slate-900 mb-1">{title}</h2>
              <p className="text-xs text-slate-500 mb-6">{description}</p>
              <div className="prose prose-slate prose-sm max-w-none text-xs leading-relaxed text-slate-700 whitespace-pre-line border-t border-slate-100 pt-6">
                {content}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
