'use client';

import React, { useState, useEffect, useMemo } from 'react';
import {
  FileText,
  Search,
  Filter,
  ShieldCheck,
  ShieldAlert,
  Lock,
  FileSignature,
  FileSpreadsheet,
  CheckCircle2,
  Clock,
  AlertTriangle,
  ExternalLink,
  ChevronRight,
  User,
  Building2,
  Calendar,
  DollarSign,
  Download,
  Eye,
  RefreshCw,
  Hash,
  Globe,
  Smartphone,
  Copy,
  Check,
  X,
  FileCheck,
  Scale,
  Paperclip,
} from 'lucide-react';
import { toast } from 'sonner';
import { createClient } from '@/lib/supabase/client';
import { ContractDocumentView } from '@/components/common/contracts/ContractDocumentView';
import {
  type ContractData,
  type ContractSigningMethod,
  type ContractStatus,
  type ContractForensicDossier,
  type WarrantyClaimInfo,
  type WarrantyClaimStatus,
  getAdminContracts,
  getContractForensics,
  getAdminWarrantyClaims,
} from '@/lib/contract-api';
import { AdminWarrantyReviewModal } from '@/components/admin/contracts/AdminWarrantyReviewModal';

export default function AdminContractsPage() {
  const [token, setToken] = useState<string>('');
  const [contracts, setContracts] = useState<ContractData[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [methodFilter, setMethodFilter] = useState<ContractSigningMethod | 'ALL'>('ALL');
  const [statusFilter, setStatusFilter] = useState<ContractStatus | 'ALL'>('ALL');
  const [totalCount, setTotalCount] = useState<number>(0);

  // Tab State: Contracts vs Warranty Claims
  const [activeAdminTab, setActiveAdminTab] = useState<'CONTRACTS' | 'WARRANTY_CLAIMS'>('CONTRACTS');
  const [warrantyClaims, setWarrantyClaims] = useState<WarrantyClaimInfo[]>([]);
  const [warrantyLoading, setWarrantyLoading] = useState<boolean>(false);
  const [warrantyMetrics, setWarrantyMetrics] = useState<{ pending: number; approved: number; rejected: number }>({
    pending: 0,
    approved: 0,
    rejected: 0,
  });
  const [warrantyStatusFilter, setWarrantyStatusFilter] = useState<WarrantyClaimStatus | 'ALL'>('ALL');
  const [warrantySearch, setWarrantySearch] = useState<string>('');
  const [selectedWarrantyClaimId, setSelectedWarrantyClaimId] = useState<string | null>(null);

  // Forensic modal state
  const [selectedContractId, setSelectedContractId] = useState<string | null>(null);
  const [dossierLoading, setDossierLoading] = useState<boolean>(false);
  const [dossier, setDossier] = useState<ContractForensicDossier | null>(null);
  const [copiedHash, setCopiedHash] = useState<boolean>(false);
  const [modalTab, setModalTab] = useState<'FORENSIC' | 'FULL_TEXT'>('FORENSIC');

  const loadWarrantyClaims = async (
    t: string,
    status: WarrantyClaimStatus | 'ALL' = warrantyStatusFilter,
    search: string = warrantySearch,
  ) => {
    setWarrantyLoading(true);
    try {
      const res = await getAdminWarrantyClaims(t, {
        status,
        search: search.trim() || undefined,
        limit: 50,
      });
      setWarrantyClaims(res.items);
      setWarrantyMetrics(res.metrics);
    } catch {
      toast.error('Không thể tải danh sách yêu cầu bảo hành');
    } finally {
      setWarrantyLoading(false);
    }
  };

  useEffect(() => {
    const supabase = createClient();
    supabase.auth.getSession().then((res: any) => {
      const session = res?.data?.session;
      if (session) {
        setToken(session.access_token);
        loadContracts(session.access_token, methodFilter, statusFilter, searchTerm);
        loadWarrantyClaims(session.access_token, warrantyStatusFilter, warrantySearch);
      }
    });
  }, []);

  const loadContracts = async (
    t: string,
    method: ContractSigningMethod | 'ALL' = methodFilter,
    status: ContractStatus | 'ALL' = statusFilter,
    search: string = searchTerm,
  ) => {
    setLoading(true);
    try {
      const res = await getAdminContracts(t, {
        signingMethod: method,
        status,
        search: search.trim() || undefined,
        limit: 50,
      });
      setContracts(res.items);
      setTotalCount(res.total);
    } catch {
      toast.error('Không thể tải danh sách hợp đồng');
    } finally {
      setLoading(false);
    }
  };

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!token) return;
    loadContracts(token, methodFilter, statusFilter, searchTerm);
  };

  const handleMethodChange = (m: ContractSigningMethod | 'ALL') => {
    setMethodFilter(m);
    if (token) loadContracts(token, m, statusFilter, searchTerm);
  };

  const handleStatusChange = (s: ContractStatus | 'ALL') => {
    setStatusFilter(s);
    if (token) loadContracts(token, methodFilter, s, searchTerm);
  };

  const handleWarrantyStatusChange = (s: WarrantyClaimStatus | 'ALL') => {
    setWarrantyStatusFilter(s);
    if (token) loadWarrantyClaims(token, s, warrantySearch);
  };

  const handleWarrantySearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!token) return;
    loadWarrantyClaims(token, warrantyStatusFilter, warrantySearch);
  };

  const openForensicDossier = async (contractId: string) => {
    setSelectedContractId(contractId);
    setModalTab('FORENSIC');
    setDossierLoading(true);
    try {
      const data = await getContractForensics(token, contractId);
      setDossier(data);
    } catch {
      toast.error('Không thể trích xuất hồ sơ điều tra hợp đồng');
      setSelectedContractId(null);
    } finally {
      setDossierLoading(false);
    }
  };

  const closeForensicDossier = () => {
    setSelectedContractId(null);
    setDossier(null);
  };

  const handleCopyHash = (hash: string) => {
    navigator.clipboard.writeText(hash);
    setCopiedHash(true);
    toast.success('Đã sao chép mã băm SHA-256');
    setTimeout(() => setCopiedHash(false), 2000);
  };

  // Stats calculation
  const stats = useMemo(() => {
    const total = totalCount || contracts.length;
    const electronicCount = contracts.filter((c) => c.signingMethod === 'ELECTRONIC').length;
    const manualCount = contracts.filter((c) => c.signingMethod === 'MANUAL').length;
    const signedCount = contracts.filter((c) => c.status === 'SIGNED').length;
    return { total, electronicCount, manualCount, signedCount };
  }, [contracts, totalCount]);

  return (
    <div className="space-y-6 font-sans">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 pb-5">
        <div>
          <span className="inline-flex items-center gap-1.5 rounded-full bg-blue-50 border border-blue-200 px-2.5 py-0.5 text-2xs font-extrabold text-[#2563EB]">
            <Scale className="size-3.5" /> Quản trị tư pháp & Bằng chứng pháp lý
          </span>
          <h1 className="mt-1 text-2xl font-black text-[#1F2937] tracking-tight">
            Giám Sát & Truy Vết Hợp Đồng Lao Động
          </h1>
          <p className="mt-0.5 text-xs text-slate-500">
            Hỗ trợ toàn diện 2 phương thức giao kết: <strong>Ký điện tử (DocuSign/OTP 2FA)</strong> và <strong>Ký tay truyền thống (Bản scan giấy)</strong> với dấu niêm phong SHA-256 chống làm giả.
          </p>
        </div>

        <button
          type="button"
          onClick={() => {
            if (token) {
              if (activeAdminTab === 'CONTRACTS') loadContracts(token);
              else loadWarrantyClaims(token);
            }
          }}
          className="inline-flex items-center gap-2 rounded-xl bg-white border border-slate-200 px-3.5 py-2 text-xs font-bold text-slate-700 shadow-xs hover:bg-slate-50 transition"
        >
          <RefreshCw
            className={`size-3.5 ${
              (activeAdminTab === 'CONTRACTS' ? loading : warrantyLoading)
                ? 'animate-spin text-[#2563EB]'
                : ''
            }`}
          />
          Làm mới
        </button>
      </div>

      {/* Primary Tab Navigation */}
      <div className="flex items-center gap-2 border-b border-slate-200">
        <button
          type="button"
          onClick={() => setActiveAdminTab('CONTRACTS')}
          className={`pb-3.5 px-4 text-xs font-bold transition flex items-center gap-2 border-b-2 ${
            activeAdminTab === 'CONTRACTS'
              ? 'border-[#2563EB] text-[#2563EB]'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <Scale className="size-4" />
          Hồ sơ giám sát hợp đồng ({stats.total})
        </button>
        <button
          type="button"
          onClick={() => setActiveAdminTab('WARRANTY_CLAIMS')}
          className={`pb-3.5 px-4 text-xs font-bold transition flex items-center gap-2 border-b-2 ${
            activeAdminTab === 'WARRANTY_CLAIMS'
              ? 'border-[#2563EB] text-[#2563EB]'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <ShieldAlert className="size-4" />
          Yêu cầu bảo hành tuyển dụng
          {warrantyMetrics.pending > 0 && (
            <span className="rounded-full bg-amber-500 text-white px-2 py-0.5 text-3xs font-extrabold animate-pulse">
              {warrantyMetrics.pending} chờ duyệt
            </span>
          )}
        </button>
      </div>

      {activeAdminTab === 'CONTRACTS' ? (
        <>
          {/* KPI Stats Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-2xs">
          <span className="text-2xs font-bold text-slate-400 uppercase block">Tổng hợp đồng</span>
          <div className="mt-1 flex items-baseline justify-between">
            <span className="text-2xl font-black text-[#1F2937]">{stats.total}</span>
            <FileText className="size-5 text-slate-400" />
          </div>
          <span className="text-3xs text-slate-500 mt-1 block">Tất cả hồ sơ trên hệ thống</span>
        </div>

        <div className="rounded-2xl border border-blue-100 bg-[#EFF6FF] p-4 shadow-2xs">
          <span className="text-2xs font-bold text-[#2563EB] uppercase block">Ký điện tử (ELECTRONIC)</span>
          <div className="mt-1 flex items-baseline justify-between">
            <span className="text-2xl font-black text-[#2563EB]">{stats.electronicCount}</span>
            <Lock className="size-5 text-[#3B82F6]" />
          </div>
          <span className="text-3xs text-blue-700 mt-1 block">Chuẩn OTP 2FA & Chữ ký số</span>
        </div>

        <div className="rounded-2xl border border-amber-200 bg-amber-50/60 p-4 shadow-2xs">
          <span className="text-2xs font-bold text-amber-800 uppercase block">Ký tay / Scan (MANUAL)</span>
          <div className="mt-1 flex items-baseline justify-between">
            <span className="text-2xl font-black text-amber-900">{stats.manualCount}</span>
            <Paperclip className="size-5 text-amber-600" />
          </div>
          <span className="text-3xs text-amber-700 mt-1 block">Văn bản giấy có dấu mộc scan</span>
        </div>

        <div className="rounded-2xl border border-emerald-100 bg-emerald-50/60 p-4 shadow-2xs">
          <span className="text-2xs font-bold text-emerald-800 uppercase block">Đã có hiệu lực (SIGNED)</span>
          <div className="mt-1 flex items-baseline justify-between">
            <span className="text-2xl font-black text-emerald-900">{stats.signedCount}</span>
            <CheckCircle2 className="size-5 text-emerald-600" />
          </div>
          <span className="text-3xs text-emerald-700 mt-1 block">Đã hoàn tất ký 2 bên</span>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3 bg-white p-4 rounded-2xl border border-slate-200 shadow-2xs">
        {/* Method filter tabs */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 md:pb-0">
          {(['ALL', 'ELECTRONIC', 'MANUAL'] as const).map((m) => (
            <button
              key={m}
              type="button"
              onClick={() => handleMethodChange(m)}
              className={`rounded-xl px-3 py-1.5 text-xs font-bold transition whitespace-nowrap ${
                methodFilter === m
                  ? 'bg-[#2563EB] text-white shadow-xs'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              {m === 'ALL'
                ? 'Tất cả loại ký'
                : m === 'ELECTRONIC'
                ? '⚡ Ký điện tử'
                : '✍️ Ký tay / Scan giấy'}
            </button>
          ))}
        </div>

        {/* Search input & Status dropdown */}
        <div className="flex items-center gap-2">
          <select
            value={statusFilter}
            onChange={(e) => handleStatusChange(e.target.value as any)}
            className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-700 outline-none focus:border-[#2563EB]"
          >
            <option value="ALL">Tất cả trạng thái</option>
            <option value="SIGNED">Đã ký kết (SIGNED)</option>
            <option value="PENDING_REVIEW">Chờ xem xét</option>
            <option value="APPROVED">Ứng viên đã duyệt</option>
            <option value="DRAFT">Bản nháp (DRAFT)</option>
            <option value="REVISION_REQUESTED">Yêu cầu sửa</option>
            <option value="REJECTED">Từ chối</option>
          </select>

          <form onSubmit={handleSearchSubmit} className="relative flex-1 md:w-64">
            <Search className="absolute left-3 top-2.5 size-3.5 text-slate-400" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Mã HĐ, tên ứng viên, vị trí..."
              className="w-full rounded-xl border border-slate-200 bg-white pl-9 pr-3 py-2 text-xs text-slate-900 placeholder-slate-400 outline-none focus:border-[#2563EB]"
            />
          </form>
        </div>
      </div>

      {/* Contracts Table */}
      <div className="rounded-2xl border border-slate-200 bg-white shadow-2xs overflow-hidden">
        {loading ? (
          <div className="flex flex-col items-center justify-center p-12 text-slate-400 space-y-2">
            <RefreshCw className="size-6 animate-spin text-[#2563EB]" />
            <span className="text-xs">Đang tải danh sách hợp đồng...</span>
          </div>
        ) : contracts.length === 0 ? (
          <div className="p-12 text-center text-xs text-slate-400">
            Không tìm thấy hợp đồng nào phù hợp với bộ lọc tìm kiếm.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="border-b border-slate-100 bg-slate-50/75 text-2xs font-extrabold uppercase tracking-wider text-slate-500">
                  <th className="py-3.5 px-4">Mã Hợp Đồng</th>
                  <th className="py-3.5 px-4">Ứng Viên (Bên B)</th>
                  <th className="py-3.5 px-4">Vị Trí & Doanh Nghiệp (Bên A)</th>
                  <th className="py-3.5 px-4">Phương Thức Ký</th>
                  <th className="py-3.5 px-4">Trạng Thái</th>
                  <th className="py-3.5 px-4">Dấu Băm SHA-256</th>
                  <th className="py-3.5 px-4 text-right">Điều Tra Pháp Lý</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-medium text-slate-700">
                {contracts.map((c) => {
                  const isElectronic = c.signingMethod === 'ELECTRONIC';
                  const isManual = c.signingMethod === 'MANUAL';
                  const isSealed = Boolean(c.pdfSha256Hash);

                  return (
                    <tr key={c.id} className="hover:bg-slate-50/60 transition">
                      {/* Contract Number */}
                      <td className="py-3.5 px-4">
                        <div className="flex items-center gap-1.5 font-mono text-2xs font-black text-[#2563EB]">
                          <span>{c.contractNumber}</span>
                        </div>
                        <span className="text-3xs text-slate-400 block mt-0.5">
                          {new Date(c.createdAt).toLocaleDateString('vi-VN')}
                        </span>
                      </td>

                      {/* Candidate */}
                      <td className="py-3.5 px-4">
                        <div className="font-bold text-[#1F2937]">
                          {c.application?.candidate?.fullName || '—'}
                        </div>
                        <div className="text-3xs text-slate-500">
                          {c.application?.candidate?.email || '—'}
                        </div>
                      </td>

                      {/* Job & Company */}
                      <td className="py-3.5 px-4">
                        <div className="font-bold text-slate-800 line-clamp-1">{c.jobTitle}</div>
                        <div className="text-3xs text-slate-500 line-clamp-1">
                          {c.application?.job?.recruiter?.company?.name || 'Doanh nghiệp'}
                        </div>
                      </td>

                      {/* Signing Method Badge */}
                      <td className="py-3.5 px-4">
                        {isElectronic ? (
                          <span className="inline-flex items-center gap-1 rounded-lg bg-[#EFF6FF] border border-blue-200 px-2.5 py-1 text-2xs font-extrabold text-[#2563EB]">
                            <Lock className="size-3" /> Ký điện tử 2FA
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 rounded-lg bg-amber-50 border border-amber-200 px-2.5 py-1 text-2xs font-extrabold text-amber-800">
                            <Paperclip className="size-3" /> Ký tay / Scan giấy
                          </span>
                        )}
                      </td>

                      {/* Status Badge */}
                      <td className="py-3.5 px-4">
                        <span
                          className={`inline-block px-2.5 py-0.5 rounded-full text-3xs font-extrabold ${
                            c.status === 'SIGNED'
                              ? 'bg-emerald-100 text-emerald-800'
                              : c.status === 'APPROVED'
                              ? 'bg-blue-100 text-blue-800'
                              : c.status === 'PENDING_REVIEW'
                              ? 'bg-amber-100 text-amber-800 animate-pulse'
                              : c.status === 'REVISION_REQUESTED'
                              ? 'bg-rose-100 text-rose-800'
                              : 'bg-slate-100 text-slate-600'
                          }`}
                        >
                          {c.status === 'SIGNED'
                            ? 'Đã ký hoàn tất'
                            : c.status === 'APPROVED'
                            ? 'Ứng viên đã duyệt'
                            : c.status === 'PENDING_REVIEW'
                            ? 'Chờ duyệt'
                            : c.status === 'REVISION_REQUESTED'
                            ? 'Yêu cầu sửa'
                            : c.status}
                        </span>
                      </td>

                      {/* SHA-256 seal status */}
                      <td className="py-3.5 px-4">
                        {isSealed ? (
                          <span className="inline-flex items-center gap-1 font-mono text-3xs font-bold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-md">
                            <ShieldCheck className="size-3 text-emerald-600" />
                            {c.pdfSha256Hash?.slice(0, 10)}...
                          </span>
                        ) : (
                          <span className="text-3xs text-slate-400 italic">Chưa niêm phong</span>
                        )}
                      </td>

                      {/* Actions */}
                      <td className="py-3.5 px-4 text-right">
                        <button
                          type="button"
                          onClick={() => openForensicDossier(c.id)}
                          className="inline-flex items-center gap-1.5 rounded-xl bg-blue-50 border border-blue-200 px-3 py-1.5 text-2xs font-extrabold text-[#2563EB] hover:bg-[#2563EB] hover:text-white transition shadow-2xs"
                        >
                          <Eye className="size-3" />
                          Hồ sơ pháp lý
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
        </>
      ) : (
        <div className="space-y-6">
          {/* Warranty KPI Stats Cards */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="rounded-2xl border border-amber-200 bg-amber-50/70 p-4 shadow-2xs">
              <span className="text-2xs font-bold text-amber-800 uppercase block">Chờ thẩm định</span>
              <div className="mt-1 flex items-baseline justify-between">
                <span className="text-2xl font-black text-amber-900">{warrantyMetrics.pending}</span>
                <Clock className="size-5 text-amber-600" />
              </div>
              <span className="text-3xs text-amber-700 mt-1 block">Yêu cầu bảo hành cần Admin giải quyết</span>
            </div>

            <div className="rounded-2xl border border-emerald-100 bg-emerald-50/60 p-4 shadow-2xs">
              <span className="text-2xs font-bold text-emerald-800 uppercase block">Đã chấp thuận (+1 Credit)</span>
              <div className="mt-1 flex items-baseline justify-between">
                <span className="text-2xl font-black text-emerald-900">{warrantyMetrics.approved}</span>
                <CheckCircle2 className="size-5 text-emerald-600" />
              </div>
              <span className="text-3xs text-emerald-700 mt-1 block">Đã bồi hoàn & gia hạn tin đăng</span>
            </div>

            <div className="rounded-2xl border border-rose-100 bg-rose-50/60 p-4 shadow-2xs">
              <span className="text-2xs font-bold text-rose-800 uppercase block">Bác bỏ / Từ chối</span>
              <div className="mt-1 flex items-baseline justify-between">
                <span className="text-2xl font-black text-rose-900">{warrantyMetrics.rejected}</span>
                <AlertTriangle className="size-5 text-rose-600" />
              </div>
              <span className="text-3xs text-rose-700 mt-1 block">Hồ sơ không đủ căn cứ bồi thường</span>
            </div>

            <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-2xs">
              <span className="text-2xs font-bold text-slate-400 uppercase block">Tổng hồ sơ bảo hành</span>
              <div className="mt-1 flex items-baseline justify-between">
                <span className="text-2xl font-black text-[#1F2937]">{warrantyClaims.length}</span>
                <ShieldAlert className="size-5 text-slate-400" />
              </div>
              <span className="text-3xs text-slate-500 mt-1 block">Toàn bộ khiếu nại phát sinh</span>
            </div>
          </div>

          {/* Filter and Search Bar for Warranty */}
          <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3 bg-white p-4 rounded-2xl border border-slate-200 shadow-2xs">
            <div className="flex items-center gap-1.5 overflow-x-auto pb-1 md:pb-0">
              {(['ALL', 'PENDING', 'APPROVED', 'REJECTED'] as const).map((s) => (
                <button
                  key={s}
                  type="button"
                  onClick={() => handleWarrantyStatusChange(s)}
                  className={`rounded-xl px-3 py-1.5 text-xs font-bold transition whitespace-nowrap ${
                    warrantyStatusFilter === s
                      ? 'bg-[#2563EB] text-white shadow-xs'
                      : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                  }`}
                >
                  {s === 'ALL'
                    ? 'Tất cả'
                    : s === 'PENDING'
                    ? `⏳ Chờ xử lý (${warrantyMetrics.pending})`
                    : s === 'APPROVED'
                    ? '✓ Đã bồi hoàn'
                    : '✕ Đã từ chối'}
                </button>
              ))}
            </div>

            <form onSubmit={handleWarrantySearchSubmit} className="relative flex-1 md:w-80">
              <Search className="absolute left-3 top-2.5 size-3.5 text-slate-400" />
              <input
                type="text"
                value={warrantySearch}
                onChange={(e) => setWarrantySearch(e.target.value)}
                placeholder="Mã hồ sơ, HĐ, tên ứng viên, HR..."
                className="w-full rounded-xl border border-slate-200 bg-white pl-9 pr-3 py-2 text-xs text-slate-900 placeholder-slate-400 outline-none focus:border-[#2563EB]"
              />
            </form>
          </div>

          {/* Warranty Claims Table */}
          <div className="rounded-2xl border border-slate-200 bg-white shadow-2xs overflow-hidden">
            {warrantyLoading ? (
              <div className="flex flex-col items-center justify-center p-12 text-slate-400 space-y-2">
                <RefreshCw className="size-6 animate-spin text-[#2563EB]" />
                <span className="text-xs">Đang tải danh sách khiếu nại bảo hành...</span>
              </div>
            ) : warrantyClaims.length === 0 ? (
              <div className="p-12 text-center text-xs text-slate-400">
                Không có yêu cầu bảo hành nào phù hợp bộ lọc.
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="border-b border-slate-200 bg-slate-50/75 text-2xs font-extrabold uppercase text-slate-500">
                      <th className="py-3 px-4">Mã hồ sơ & HĐ</th>
                      <th className="py-3 px-4">Doanh nghiệp (HR)</th>
                      <th className="py-3 px-4">Ứng viên & Vị trí</th>
                      <th className="py-3 px-4">Lý do bảo hành</th>
                      <th className="py-3 px-4">Giải trình ứng viên</th>
                      <th className="py-3 px-4">Trạng thái</th>
                      <th className="py-3 px-4 text-right">Thao tác</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {warrantyClaims.map((claim) => (
                      <tr key={claim.id} className="hover:bg-slate-50/60 transition">
                        <td className="py-3.5 px-4">
                          <div className="font-mono text-xs font-bold text-[#2563EB]">
                            BH-{claim.id.slice(0, 8).toUpperCase()}
                          </div>
                          <div className="text-3xs text-slate-500 mt-0.5">
                            HĐ: {claim.contract?.contractNumber || 'HĐLĐ'}
                          </div>
                          <div className="text-3xs text-slate-400">
                            {new Date(claim.createdAt).toLocaleDateString('vi-VN')}
                          </div>
                        </td>
                        <td className="py-3.5 px-4">
                          <div className="font-semibold text-slate-900">
                            {claim.recruiterUser?.fullName || claim.contract?.employerName || 'Doanh nghiệp'}
                          </div>
                          <div className="text-3xs text-slate-500">
                            {claim.recruiterUser?.email}
                          </div>
                        </td>
                        <td className="py-3.5 px-4">
                          <div className="font-semibold text-slate-900">
                            {claim.contract?.candidateUser?.fullName || claim.contract?.candidateName || 'Ứng viên'}
                          </div>
                          <div className="text-3xs text-slate-500">
                            {claim.contract?.jobTitle || 'Nhân sự đã ký hợp đồng'}
                          </div>
                        </td>
                        <td className="py-3.5 px-4">
                          <span className="inline-flex items-center gap-1 rounded-md bg-slate-100 px-2 py-0.5 text-2xs font-bold text-slate-800">
                            {claim.reason === 'NO_SHOW' ? '🚫 Không nhận việc' : '🏃 Nghỉ việc ≤30 ngày'}
                          </span>
                          {claim.note && (
                            <p className="mt-1 text-3xs text-slate-500 line-clamp-1 max-w-xs italic">
                              &quot;{claim.note}&quot;
                            </p>
                          )}
                        </td>
                        <td className="py-3.5 px-4">
                          {claim.candidateResponse ? (
                            <div>
                              <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 border border-emerald-200 px-2 py-0.5 text-3xs font-extrabold text-emerald-700">
                                <CheckCircle2 className="size-3" /> Đã nộp giải trình
                              </span>
                              <p className="mt-1 text-3xs text-slate-500 line-clamp-1 max-w-xs italic">
                                &quot;{claim.candidateResponse}&quot;
                              </p>
                            </div>
                          ) : (
                            <span className="inline-flex items-center gap-1 rounded-full bg-slate-100 px-2 py-0.5 text-3xs font-bold text-slate-500">
                              <Clock className="size-3" /> Chưa phản hồi (48h)
                            </span>
                          )}
                        </td>
                        <td className="py-3.5 px-4">
                          {claim.status === 'PENDING' ? (
                            <span className="inline-flex items-center gap-1 rounded-full bg-amber-50 border border-amber-200 px-2.5 py-1 text-2xs font-extrabold text-amber-700">
                              <Clock className="size-3" /> Chờ Admin duyệt
                            </span>
                          ) : claim.status === 'APPROVED' ? (
                            <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 border border-emerald-200 px-2.5 py-1 text-2xs font-extrabold text-emerald-700">
                              <CheckCircle2 className="size-3" /> Đã bồi hoàn (+1)
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 rounded-full bg-rose-50 border border-rose-200 px-2.5 py-1 text-2xs font-extrabold text-rose-700">
                              <AlertTriangle className="size-3" /> Đã từ chối
                            </span>
                          )}
                        </td>
                        <td className="py-3.5 px-4 text-right">
                          <button
                            type="button"
                            onClick={() => setSelectedWarrantyClaimId(claim.id)}
                            className="inline-flex items-center gap-1.5 rounded-xl bg-blue-50 border border-blue-200 px-3 py-1.5 text-2xs font-extrabold text-[#2563EB] hover:bg-[#2563EB] hover:text-white transition shadow-2xs"
                          >
                            <Eye className="size-3" />
                            Thẩm định hồ sơ
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Forensic Dossier Modal */}
      {selectedContractId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4 overflow-y-auto animate-in fade-in">
          <div className="relative w-full max-w-4xl max-h-[90vh] flex flex-col rounded-3xl bg-white shadow-2xl border border-slate-200 overflow-hidden">
            {/* Modal Header */}
            <div className="flex items-center justify-between border-b border-slate-200 bg-[#EFF6FF]/50 px-6 py-4">
              <div className="flex items-center gap-2.5">
                <div className="flex size-9 items-center justify-center rounded-xl bg-[#2563EB] text-white shadow-xs">
                  <Scale className="size-4.5" />
                </div>
                <div>
                  <h3 className="text-base font-black text-[#1F2937] tracking-tight">
                    Hồ Sơ Điều Tra & Chứng Thư Pháp Lý Hợp Đồng
                  </h3>
                  <p className="text-2xs text-slate-500">
                    Đối soát tính toàn vẹn căn cứ theo Điều 14 Bộ luật Lao động 2019 & Luật Giao dịch điện tử 2023
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={closeForensicDossier}
                className="rounded-xl p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-700 transition"
              >
                <X className="size-5" />
              </button>
            </div>

            {/* Sub-tab Navigation */}
            {dossier && !dossierLoading && (
              <div className="flex items-center gap-2 border-b border-slate-200 px-6 pt-3 bg-slate-50/50">
                <button
                  type="button"
                  onClick={() => setModalTab('FORENSIC')}
                  className={`pb-3 px-3 text-xs font-bold transition flex items-center gap-1.5 border-b-2 ${
                    modalTab === 'FORENSIC'
                      ? 'border-[#2563EB] text-[#2563EB]'
                      : 'border-transparent text-slate-500 hover:text-slate-800'
                  }`}
                >
                  <Scale className="size-3.5" />
                  Bằng chứng điều tra & Dấu băm
                </button>
                <button
                  type="button"
                  onClick={() => setModalTab('FULL_TEXT')}
                  className={`pb-3 px-3 text-xs font-bold transition flex items-center gap-1.5 border-b-2 ${
                    modalTab === 'FULL_TEXT'
                      ? 'border-[#2563EB] text-[#2563EB]'
                      : 'border-transparent text-slate-500 hover:text-slate-800'
                  }`}
                >
                  <FileText className="size-3.5" />
                  Toàn văn hợp đồng soạn thảo trên hệ thống (Gốc)
                </button>
              </div>
            )}

            {/* Modal Body */}
            <div className="flex-1 overflow-y-auto p-6 space-y-6">
              {dossierLoading || !dossier ? (
                <div className="flex flex-col items-center justify-center p-16 text-slate-400 space-y-3">
                  <RefreshCw className="size-8 animate-spin text-[#2563EB]" />
                  <span className="text-xs font-semibold">Đang trích xuất bằng chứng số...</span>
                </div>
              ) : modalTab === 'FORENSIC' ? (
                <>
                  {/* Summary Bar */}
                  <div className="grid grid-cols-1 sm:grid-cols-4 gap-3 p-4 rounded-2xl bg-slate-50 border border-slate-200 text-xs">
                    <div>
                      <span className="text-3xs font-bold text-slate-400 uppercase block">Số hợp đồng</span>
                      <strong className="font-mono text-[#2563EB] text-xs">
                        {dossier.contract.contractNumber}
                      </strong>
                    </div>
                    <div>
                      <span className="text-3xs font-bold text-slate-400 uppercase block">Hình thức giao kết</span>
                      <strong className="text-slate-800">
                        {dossier.isElectronic ? '⚡ Ký điện tử (2FA OTP)' : '✍️ Ký tay / Scan giấy'}
                      </strong>
                    </div>
                    <div>
                      <span className="text-3xs font-bold text-slate-400 uppercase block">Trạng thái</span>
                      <span className="font-bold text-emerald-700">
                        {dossier.contract.status === 'SIGNED' ? 'Đã ký hoàn tất' : dossier.contract.status}
                      </span>
                    </div>
                    <div>
                      <span className="text-3xs font-bold text-slate-400 uppercase block">Niêm phong SHA-256</span>
                      <span className="font-mono text-3xs font-bold text-slate-700">
                        {dossier.forensicSummary.isSealed ? '✅ Đã niêm phong' : '❌ Chưa niêm phong'}
                      </span>
                    </div>
                  </div>

                  {/* SHA-256 Hash Box */}
                  {dossier.forensicSummary.sha256Hash && (
                    <div className="rounded-2xl border border-emerald-200 bg-emerald-50/50 p-4 space-y-1.5">
                      <div className="flex items-center justify-between">
                        <span className="text-2xs font-extrabold uppercase tracking-wider text-emerald-900 flex items-center gap-1.5">
                          <ShieldCheck className="size-4 text-emerald-600" />
                          Mã băm mật mã SHA-256 (Dấu thời gian chống sửa đổi)
                        </span>
                        <button
                          type="button"
                          onClick={() => handleCopyHash(dossier.forensicSummary.sha256Hash!)}
                          className="inline-flex items-center gap-1 rounded-lg bg-white border border-emerald-200 px-2 py-0.5 text-3xs font-bold text-emerald-800 hover:bg-emerald-100"
                        >
                          {copiedHash ? <Check className="size-3" /> : <Copy className="size-3" />}
                          {copiedHash ? 'Đã chép' : 'Sao chép'}
                        </button>
                      </div>
                      <div className="font-mono text-xs break-all bg-white p-2.5 rounded-xl border border-emerald-200/80 text-emerald-950 font-semibold select-all">
                        {dossier.forensicSummary.sha256Hash}
                      </div>
                    </div>
                  )}

                  {/* Discrepancy Alert (Offer vs Contract) */}
                  {dossier.discrepancies.length > 0 && (
                    <div className="rounded-2xl border border-rose-200 bg-rose-50/50 p-4 space-y-2">
                      <div className="flex items-center gap-2 text-rose-800 font-extrabold text-xs">
                        <AlertTriangle className="size-4 text-rose-600" />
                        CẢNH BÁO: Phát hiện sai lệch giữa Thư mời (Offer) và Hợp đồng (Contract)
                      </div>
                      <div className="space-y-1.5 text-xs">
                        {dossier.discrepancies.map((disc, idx) => (
                          <div
                            key={idx}
                            className="flex flex-col sm:flex-row sm:items-center justify-between bg-white p-2.5 rounded-xl border border-rose-200 text-xs"
                          >
                            <span className="font-bold text-rose-900">{disc.field}:</span>
                            <div className="flex items-center gap-3 text-2xs mt-1 sm:mt-0">
                              <span className="text-slate-500">Offer: <strong className="text-slate-700">{disc.offerValue}</strong></span>
                              <span>➔</span>
                              <span className="text-rose-700">Contract: <strong className="text-rose-900">{disc.contractValue}</strong></span>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* SECTION 1: METHOD SPECIFIC FORENSIC EVIDENCE */}
                  {dossier.isManual ? (
                    /* MANUAL SCAN FORENSICS */
                    <div className="rounded-2xl border border-amber-200 bg-amber-50/30 p-5 space-y-4">
                      <div className="flex items-center justify-between border-b border-amber-200/60 pb-3">
                        <h4 className="text-xs font-black uppercase tracking-wider text-amber-900 flex items-center gap-2">
                          <Paperclip className="size-4 text-amber-600" />
                          Hồ Sơ Hợp Đồng Ký Tay / Bản Scan Giấy Có Mộc Đỏ
                        </h4>
                        <span className="text-3xs font-extrabold text-amber-800 bg-amber-100 px-2 py-0.5 rounded-full">
                          Căn cứ: Điều 14 BLLĐ 2019
                        </span>
                      </div>

                      {/* Scanned PDF Action & Preview */}
                      <div className="bg-white rounded-2xl border border-amber-200 p-4 space-y-3">
                        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                          <div>
                            <span className="text-2xs font-extrabold text-slate-500 uppercase block">Văn bản scan có chữ ký thực tế</span>
                            <p className="text-xs font-bold text-slate-800 mt-0.5">
                              {dossier.forensicSummary.signedPdfUrl
                                ? `Bản scan đã được HR đính kèm đầy đủ ${(dossier.contract?.auditCertificate as any)?.manualScan?.pages?.length ? `(${(dossier.contract?.auditCertificate as any)?.manualScan?.pages?.length} trang)` : ''}`
                                : 'Chưa có file scan đính kèm'}
                            </p>
                          </div>
                          <div className="flex items-center gap-2">
                            <button
                              type="button"
                              onClick={() => setModalTab('FULL_TEXT')}
                              className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-bold text-slate-700 shadow-2xs hover:bg-slate-50 transition"
                            >
                              <FileText className="size-3.5 text-[#2563EB]" />
                              Xem bản soạn thảo gốc
                            </button>
                            {dossier.forensicSummary.signedPdfUrl && (
                              <a
                                href={dossier.forensicSummary.signedPdfUrl}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="inline-flex items-center gap-1.5 rounded-xl bg-[#2563EB] px-4 py-2 text-xs font-bold text-white shadow-xs hover:bg-blue-700 transition"
                              >
                                <ExternalLink className="size-3.5" />
                                Mở bản scan gốc
                              </a>
                            )}
                          </div>
                        </div>

                        {/* If multiple pages are uploaded */}
                        {(dossier.contract?.auditCertificate as any)?.manualScan?.pages && (dossier.contract?.auditCertificate as any)?.manualScan?.pages?.length > 0 && (
                          <div className="pt-2.5 border-t border-slate-100 flex flex-wrap items-center gap-2">
                            <span className="text-2xs font-bold text-slate-500">Các trang ảnh đã niêm phong:</span>
                            {(dossier.contract?.auditCertificate as any)?.manualScan?.pages.map((p: any, idx: number) => (
                              <a
                                key={idx}
                                href={p.url || p.dataUrl}
                                target="_blank"
                                rel="noreferrer"
                                className="inline-flex items-center gap-1 rounded-lg border border-blue-200 bg-blue-50/70 px-2.5 py-1 text-2xs font-bold text-[#2563EB] hover:bg-blue-100 transition"
                              >
                                Trang {p.pageNumber || idx + 1}
                              </a>
                            ))}
                          </div>
                        )}
                      </div>

                      {/* Advisory Notice when Scan is Blurry or Illegible */}
                      <div className="rounded-xl border border-blue-200 bg-blue-50/70 p-3 text-xs text-blue-950 flex items-start gap-2.5">
                        <FileText className="size-4 text-[#2563EB] shrink-0 mt-0.5" />
                        <div className="space-y-0.5 text-2xs leading-relaxed">
                          <strong className="text-[#2563EB] font-extrabold uppercase block">
                            Cơ chế đối soát khi bản scan bị mờ / không đọc được:
                          </strong>
                          <span>
                            Nếu bản scan của HR bị mờ, mất nét hoặc cố tình chụp không rõ chữ ký/mộc đỏ, Admin vẫn có thể xem được <strong>100% dữ liệu gốc đã soạn thảo</strong> (chức danh, mức lương, phụ cấp, các điều khoản riêng) tại tab <strong>"Toàn văn hợp đồng soạn thảo trên hệ thống"</strong>. Dữ liệu số này là nguồn căn cứ chuẩn (Single Source of Truth) đã được ứng viên chấp thuận trước đó và không thể bị sửa đổi lén.
                          </span>
                        </div>
                      </div>

                      {/* Uploader Footprint from Certificate */}
                      {dossier.forensicSummary.auditCertificate?.metadata && (
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                          <div className="rounded-xl bg-white border border-amber-200 p-3 space-y-1">
                            <span className="text-3xs font-extrabold text-amber-800 uppercase block">Người tải lên (Uploader HR)</span>
                            <div className="font-bold text-slate-900">
                              {dossier.forensicSummary.auditCertificate.metadata.uploaderUserId}
                            </div>
                            <div className="text-2xs text-slate-500">
                              Thời gian: {new Date(dossier.forensicSummary.auditCertificate.metadata.uploadedAt).toLocaleString('vi-VN')}
                            </div>
                          </div>

                          <div className="rounded-xl bg-white border border-amber-200 p-3 space-y-1">
                            <span className="text-3xs font-extrabold text-amber-800 uppercase block">Địa chỉ mạng & Thiết bị (Network IP)</span>
                            <div className="font-mono text-2xs font-bold text-slate-800">
                              IP: {dossier.forensicSummary.auditCertificate.metadata.ipAddress || '127.0.0.1'}
                            </div>
                            <div className="text-3xs text-slate-500 truncate">
                              Browser: {dossier.forensicSummary.auditCertificate.metadata.userAgent || 'Web Browser'}
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  ) : (
                    /* ELECTRONIC 2FA FORENSICS */
                    <div className="rounded-2xl border border-blue-200 bg-[#EFF6FF]/40 p-5 space-y-4">
                      <div className="flex items-center justify-between border-b border-blue-200/60 pb-3">
                        <h4 className="text-xs font-black uppercase tracking-wider text-[#2563EB] flex items-center gap-2">
                          <Lock className="size-4 text-[#3B82F6]" />
                          Chứng Thư Ký Số Điện Tử 2FA (DocuSign Model)
                        </h4>
                        <span className="text-3xs font-extrabold text-blue-800 bg-blue-100 px-2 py-0.5 rounded-full">
                          Căn cứ: Luật Giao dịch điện tử 2023
                        </span>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {/* Candidate Signer */}
                        <div className="rounded-2xl border border-slate-200 bg-white p-4 space-y-2.5">
                          <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                            <span className="text-2xs font-extrabold text-blue-700 uppercase">1. Bên B - Ứng Viên</span>
                            <span className="text-3xs font-extrabold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-md">
                              {dossier.forensicSummary.candidateSigned ? 'Đã ký xác nhận' : 'Chưa ký'}
                            </span>
                          </div>

                          <div className="text-xs space-y-1">
                            <div><strong>Họ tên:</strong> {dossier.contract.application?.candidate?.fullName}</div>
                            <div><strong>Email:</strong> {dossier.contract.application?.candidate?.email}</div>
                            <div>
                              <strong>Thời gian ký:</strong>{' '}
                              {dossier.contract.candidateSignedAt
                                ? new Date(dossier.contract.candidateSignedAt).toLocaleString('vi-VN')
                                : '—'}
                            </div>
                            <div>
                              <strong>Xác thực OTP 2FA:</strong>{' '}
                              {dossier.contract.candidateOtpVerifiedAt
                                ? `✅ Thành công (${new Date(dossier.contract.candidateOtpVerifiedAt).toLocaleTimeString('vi-VN')})`
                                : '—'}
                            </div>
                            <div className="font-mono text-3xs text-slate-500">
                              IP: {dossier.contract.candidateSignerIp || '127.0.0.1'}
                            </div>
                          </div>

                          {/* Canvas Signature Graphic */}
                          {dossier.contract.candidateSignatureUrl && (
                            <div className="mt-2 rounded-xl border border-dashed border-slate-200 bg-slate-50/50 p-2 text-center">
                              <span className="text-3xs text-slate-400 block mb-1">Hình ảnh chữ ký điện tử:</span>
                              <img
                                src={dossier.contract.candidateSignatureUrl}
                                alt="Chữ ký ứng viên"
                                className="max-h-16 mx-auto object-contain"
                              />
                            </div>
                          )}
                        </div>

                        {/* Employer Signer */}
                        <div className="rounded-2xl border border-slate-200 bg-white p-4 space-y-2.5">
                          <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                            <span className="text-2xs font-extrabold text-indigo-700 uppercase">2. Bên A - Doanh Nghiệp</span>
                            <span className="text-3xs font-extrabold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-md">
                              {dossier.forensicSummary.employerSigned ? 'Đã ký xác nhận' : 'Chưa ký'}
                            </span>
                          </div>

                          <div className="text-xs space-y-1">
                            <div><strong>Công ty:</strong> {dossier.contract.application?.job?.recruiter?.company?.name}</div>
                            <div><strong>Đại diện:</strong> {dossier.contract.application?.job?.recruiter?.user?.fullName}</div>
                            <div>
                              <strong>Thời gian ký:</strong>{' '}
                              {dossier.contract.employerSignedAt
                                ? new Date(dossier.contract.employerSignedAt).toLocaleString('vi-VN')
                                : '—'}
                            </div>
                            <div>
                              <strong>Xác thực OTP 2FA:</strong>{' '}
                              {dossier.contract.employerOtpVerifiedAt
                                ? `✅ Thành công (${new Date(dossier.contract.employerOtpVerifiedAt).toLocaleTimeString('vi-VN')})`
                                : '—'}
                            </div>
                            <div className="font-mono text-3xs text-slate-500">
                              IP: {dossier.contract.employerSignerIp || '127.0.0.1'}
                            </div>
                          </div>

                          {/* Canvas Signature Graphic */}
                          {dossier.contract.employerSignatureUrl && (
                            <div className="mt-2 rounded-xl border border-dashed border-slate-200 bg-slate-50/50 p-2 text-center">
                              <span className="text-3xs text-slate-400 block mb-1">Hình ảnh chữ ký điện tử:</span>
                              <img
                                src={dossier.contract.employerSignatureUrl}
                                alt="Chữ ký người sử dụng lao động"
                                className="max-h-16 mx-auto object-contain"
                              />
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  )}

                  {/* SECTION 2: AUDIT ACTION HISTORY TIMELINE */}
                  <div className="rounded-2xl border border-slate-200 bg-white p-5 space-y-3">
                    <h4 className="text-xs font-black uppercase tracking-wider text-slate-800 flex items-center gap-2">
                      <Clock className="size-4 text-[#2563EB]" />
                      Nhật Ký Dòng Thời Gian Thao Tác (Audit History Trail)
                    </h4>

                    <div className="space-y-2.5">
                      {dossier.enrichedHistories.map((h) => (
                        <div
                          key={h.id}
                          className="flex items-start gap-3 rounded-xl border border-slate-100 bg-slate-50/50 p-3 text-xs"
                        >
                          <div className="mt-0.5 flex size-5 items-center justify-center rounded-full bg-blue-100 text-[#2563EB] font-bold text-3xs">
                            ✓
                          </div>
                          <div className="flex-1 space-y-0.5">
                            <div className="flex items-center justify-between">
                              <span className="font-mono text-2xs font-extrabold text-[#2563EB]">
                                {h.action}
                              </span>
                              <span className="text-3xs text-slate-400">
                                {new Date(h.createdAt).toLocaleString('vi-VN')}
                              </span>
                            </div>
                            <p className="text-slate-700 text-xs">{h.note || 'Thao tác cập nhật hợp đồng'}</p>
                            {h.performer && (
                              <span className="text-3xs text-slate-400 block">
                                Thực hiện bởi: <strong>{h.performer.fullName}</strong> ({h.performer.email} - {h.performer.role})
                              </span>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </>
              ) : (
                /* Tab 2: Full System Contract Document */
                <div className="rounded-2xl border border-slate-200 bg-slate-50/50 p-4">
                  <div className="mb-4 p-3 rounded-xl bg-blue-50 border border-blue-200 text-2xs text-blue-900 flex items-center justify-between">
                    <span className="flex items-center gap-1.5 font-bold">
                      <FileCheck className="size-4 text-[#2563EB]" />
                      Văn bản hợp đồng chuẩn được soạn thảo trực tiếp trên hệ thống (Độ sắc nét 100%, bảo lưu toàn vẹn)
                    </span>
                    <button
                      type="button"
                      onClick={() => setModalTab('FORENSIC')}
                      className="font-extrabold text-[#2563EB] hover:underline"
                    >
                      ← Quay lại bằng chứng điều tra
                    </button>
                  </div>
                  <ContractDocumentView contract={dossier.contract} showPrintButton={true} />
                </div>
              )}
            </div>

            {/* Modal Footer */}
            <div className="border-t border-slate-200 bg-slate-50 px-6 py-3 flex items-center justify-end">
              <button
                type="button"
                onClick={closeForensicDossier}
                className="rounded-xl bg-white border border-slate-200 px-4 py-2 text-xs font-bold text-slate-700 hover:bg-slate-100 transition shadow-2xs"
              >
                Đóng hồ sơ
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Admin Warranty Review Modal */}
      {selectedWarrantyClaimId && (
        <AdminWarrantyReviewModal
          isOpen={true}
          claimId={selectedWarrantyClaimId}
          token={token}
          onClose={() => setSelectedWarrantyClaimId(null)}
          onResolved={() => {
            setSelectedWarrantyClaimId(null);
            if (token) {
              loadWarrantyClaims(token, warrantyStatusFilter, warrantySearch);
              loadContracts(token, methodFilter, statusFilter, searchTerm);
            }
          }}
        />
      )}
    </div>
  );
}
