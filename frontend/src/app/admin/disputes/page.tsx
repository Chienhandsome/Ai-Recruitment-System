'use client';

import React, { useState, useEffect } from 'react';
import {
  AlertTriangle,
  ShieldAlert,
  Search,
  Filter,
  CheckCircle2,
  XCircle,
  Clock,
  User,
  Building2,
  Briefcase,
  FileText,
  DollarSign,
  Lock,
  ArrowRight,
  Loader2,
  Check,
  ShieldCheck,
  ExternalLink,
  Paperclip,
  ChevronDown,
  ChevronUp,
  Copy,
  Scale,
  X,
} from 'lucide-react';
import { toast } from 'sonner';
import { createClient } from '@/lib/supabase/client';
import { ContractDocumentView } from '@/components/common/contracts/ContractDocumentView';
import { DisputeDetailModal } from '@/components/common/disputes/DisputeDetailModal';
import {
  type DisputeData,
  type DisputeStatus,
  type DisputeCategory,
  disputeCategoryLabels,
  disputeStatusLabels,
  getAdminDisputes,
  resolveAdminDispute,
} from '@/lib/dispute-api';
import {
  getAdminWarrantyClaims,
  type WarrantyClaimInfo,
  type WarrantyClaimStatus,
} from '@/lib/contract-api';
import { AdminWarrantyReviewModal } from '@/components/admin/contracts/AdminWarrantyReviewModal';

export default function AdminDisputesPage() {
  const [token, setToken] = useState<string>('');
  const [disputes, setDisputes] = useState<DisputeData[]>([]);
  const [selectedDisputeId, setSelectedDisputeId] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  const [loading, setLoading] = useState<boolean>(true);
  const [resolving, setResolving] = useState<boolean>(false);

  // Resolution form states
  const [resolutionStatus, setResolutionStatus] = useState<DisputeStatus>('RESOLVED');
  const [adminResolution, setAdminResolution] = useState<string>('');
  const [enforcementAction, setEnforcementAction] = useState<'NONE' | 'WARN' | 'LOCK_RECRUITER'>('NONE');
  const [penaltyNotes, setPenaltyNotes] = useState<string>('');
  const [penaltyAmount, setPenaltyAmount] = useState<string>('');
  const [compensationAmount, setCompensationAmount] = useState<string>('');
  const [showContractHistory, setShowContractHistory] = useState<boolean>(true);
  const [viewingContractDoc, setViewingContractDoc] = useState<boolean>(false);
  const [showDisputeDetailModal, setShowDisputeDetailModal] = useState<boolean>(false);

  // Warranty claims state
  const [activeMainTab, setActiveMainTab] = useState<'DISPUTES' | 'WARRANTY'>('DISPUTES');
  const [warrantyClaims, setWarrantyClaims] = useState<WarrantyClaimInfo[]>([]);
  const [warrantyMetrics, setWarrantyMetrics] = useState<{ pending: number; approved: number; rejected: number }>({
    pending: 0,
    approved: 0,
    rejected: 0,
  });
  const [warrantyStatusFilter, setWarrantyStatusFilter] = useState<WarrantyClaimStatus | 'ALL'>('ALL');
  const [warrantyLoading, setWarrantyLoading] = useState(false);
  const [selectedWarrantyClaimId, setSelectedWarrantyClaimId] = useState<string | null>(null);
  const [showWarrantyReviewModal, setShowWarrantyReviewModal] = useState(false);

  useEffect(() => {
    const supabase = createClient();
    supabase.auth.getSession().then((res: any) => {
      const session = res?.data?.session;
      if (session) {
        setToken(session.access_token);
        loadDisputes(session.access_token);
        loadWarrantyClaims(session.access_token);
      }
    });
  }, []);

  const loadWarrantyClaims = async (t: string, status: WarrantyClaimStatus | 'ALL' = warrantyStatusFilter) => {
    setWarrantyLoading(true);
    try {
      const res = await getAdminWarrantyClaims(t, {
        status: status === 'ALL' ? undefined : status,
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

  const loadDisputes = async (t: string, status?: DisputeStatus) => {
    setLoading(true);
    try {
      const data = await getAdminDisputes(t, status);
      setDisputes(data);
      if (data.length > 0 && !selectedDisputeId) {
        setSelectedDisputeId(data[0].id);
      }
    } catch {
      toast.error('Không thể tải danh sách khiếu nại');
    } finally {
      setLoading(false);
    }
  };

  const handleFilterChange = (status: string) => {
    setStatusFilter(status);
    loadDisputes(token, status === 'ALL' ? undefined : (status as DisputeStatus));
  };

  const handleResolve = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedDisputeId) return;
    if (!adminResolution.trim()) {
      toast.error('Vui lòng nhập nội dung phán quyết giải quyết.');
      return;
    }

    setResolving(true);
    try {
      await resolveAdminDispute(token, selectedDisputeId, {
        status: resolutionStatus,
        adminResolution: adminResolution.trim(),
        enforcementAction,
        penaltyNotes: penaltyNotes.trim() || undefined,
        penaltyAmount: penaltyAmount ? Number(penaltyAmount) : undefined,
        compensationAmount: compensationAmount ? Number(compensationAmount) : undefined,
      });

      toast.success('Đã cập nhật phán quyết giải quyết khiếu nại thành công!');
      setAdminResolution('');
      setPenaltyNotes('');
      setPenaltyAmount('');
      setCompensationAmount('');
      await loadDisputes(token, statusFilter === 'ALL' ? undefined : (statusFilter as DisputeStatus));
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Lỗi khi xử lý khiếu nại');
    } finally {
      setResolving(false);
    }
  };

  const activeDispute = disputes.find((d) => d.id === selectedDisputeId);

  return (
    <div className="space-y-6 font-sans">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 pb-5">
        <div>
          <span className="inline-flex items-center gap-1.5 rounded-full bg-rose-50 border border-rose-200 px-2.5 py-0.5 text-2xs font-extrabold text-rose-700">
            <ShieldAlert className="size-3.5" /> Trọng tài dữ liệu & Chế tài vi phạm
          </span>
          <h1 className="mt-1 text-2xl font-black text-[#0F172A] tracking-tight">
            Xử Lý Khiếu Nại & Tranh Chấp Tuyển Dụng
          </h1>
          <p className="mt-0.5 text-xs text-slate-500">
            Tiếp nhận tố cáo của Ứng viên, đối chiếu lịch sử Offer vs Hợp đồng và áp dụng chế tài bảo vệ môi trường tuyển dụng minh bạch.
          </p>
        </div>
      </div>

      {/* Category Tabs: Disputes vs Warranty Claims */}
      <div className="flex border-b border-slate-200 gap-6">
        <button
          type="button"
          onClick={() => setActiveMainTab('DISPUTES')}
          className={`pb-3 px-2 text-xs font-bold transition flex items-center gap-2 border-b-2 cursor-pointer ${
            activeMainTab === 'DISPUTES'
              ? 'border-[#2563EB] text-[#2563EB]'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <Scale className="size-4" />
          Khiếu nại hợp đồng & Tranh chấp ({disputes.length})
        </button>

        <button
          type="button"
          onClick={() => setActiveMainTab('WARRANTY')}
          className={`pb-3 px-2 text-xs font-bold transition flex items-center gap-2 border-b-2 cursor-pointer ${
            activeMainTab === 'WARRANTY'
              ? 'border-[#2563EB] text-[#2563EB]'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <ShieldAlert className="size-4" />
          Yêu cầu bảo hành tuyển dụng (30N)
          {warrantyMetrics.pending > 0 && (
            <span className="rounded-full bg-amber-500 text-white px-2 py-0.5 text-3xs font-extrabold animate-pulse">
              {warrantyMetrics.pending} chờ duyệt
            </span>
          )}
        </button>
      </div>

      {activeMainTab === 'DISPUTES' ? (
        <>
          {warrantyMetrics.pending > 0 && (
            <div className="rounded-xl border border-amber-300 bg-amber-50 p-3.5 flex items-center justify-between shadow-2xs">
              <div className="flex items-center gap-2.5 text-xs text-amber-900 font-semibold">
                <AlertTriangle className="size-4 text-amber-600 shrink-0" />
                <span>Hệ thống ghi nhận <strong>{warrantyMetrics.pending}</strong> yêu cầu bảo hành sự cố tuyển dụng từ Nhà tuyển dụng đang chờ duyệt bồi hoàn.</span>
              </div>
              <button
                type="button"
                onClick={() => setActiveMainTab('WARRANTY')}
                className="text-xs font-bold text-[#2563EB] hover:underline cursor-pointer shrink-0"
              >
                Xem danh sách bảo hành →
              </button>
            </div>
          )}

          {/* Filter */}
          <div className="flex items-center gap-2">
            {['ALL', 'PENDING', 'INVESTIGATING', 'RESOLVED', 'DISMISSED'].map((st) => (
              <button
                key={st}
                type="button"
                onClick={() => handleFilterChange(st)}
                className={`rounded-xl px-3 py-1.5 text-xs font-bold transition cursor-pointer ${
                  statusFilter === st
                    ? 'bg-[#2563EB] text-white shadow-xs'
                    : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-50'
                }`}
              >
                {st === 'ALL'
                  ? 'Tất cả'
                  : st === 'PENDING'
                  ? 'Chờ duyệt'
                  : st === 'INVESTIGATING'
                  ? 'Đang xác minh'
                  : st === 'RESOLVED'
                  ? 'Đã xử lý'
                  : 'Bác đơn'}
              </button>
            ))}
          </div>

          {/* Main Split Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left: Disputes List */}
        <div className="lg:col-span-1 space-y-2">
          <h2 className="text-xs font-black uppercase tracking-wider text-slate-500 px-1 mb-2">
            Danh sách khiếu nại ({disputes.length})
          </h2>

          {loading ? (
            <div className="flex items-center justify-center p-8 text-slate-400">
              <Loader2 className="size-6 animate-spin" />
            </div>
          ) : disputes.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-slate-200 bg-white p-8 text-center text-xs text-slate-400">
              Không có khiếu nại nào trong danh mục này.
            </div>
          ) : (
            disputes.map((d) => {
              const isSelected = d.id === selectedDisputeId;
              return (
                <button
                  key={d.id}
                  type="button"
                  onClick={() => setSelectedDisputeId(d.id)}
                  className={`w-full text-left rounded-2xl p-4 border transition-all ${
                    isSelected
                      ? 'border-[#2563EB] bg-blue-50/60 shadow-xs ring-1 ring-[#2563EB]'
                      : 'border-slate-200 bg-white hover:bg-slate-50 text-slate-700'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="font-mono text-2xs font-extrabold text-[#2563EB]">
                      {d.disputeNumber}
                    </span>
                    <span
                      className={`text-3xs font-extrabold px-2 py-0.5 rounded-full ${
                        d.status === 'RESOLVED'
                          ? 'bg-emerald-100 text-emerald-800'
                          : d.status === 'PENDING'
                          ? 'bg-amber-100 text-amber-800 animate-pulse'
                          : d.status === 'INVESTIGATING'
                          ? 'bg-blue-100 text-blue-800'
                          : 'bg-slate-100 text-slate-600'
                      }`}
                    >
                      {disputeStatusLabels[d.status]}
                    </span>
                  </div>

                  <h3 className="mt-1.5 text-xs font-bold text-slate-900 line-clamp-1">{d.title}</h3>
                  <p className="mt-0.5 text-2xs font-medium text-rose-700 line-clamp-1">
                    {disputeCategoryLabels[d.category] || d.category}
                  </p>

                  <div className="mt-3 flex items-center justify-between text-3xs text-slate-400 border-t border-slate-100 pt-2">
                    <span>Người gửi: {d.reportedByUser?.fullName}</span>
                    <span>{new Date(d.createdAt).toLocaleDateString('vi-VN')}</span>
                  </div>
                </button>
              );
            })
          )}
        </div>

        {/* Right: Detailed Comparison & Resolution Studio */}
        <div className="lg:col-span-2 space-y-4">
          {activeDispute ? (
            <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm space-y-6">
              {/* Dispute Header */}
              <div className="border-b border-slate-100 pb-4">
                <div className="flex items-center justify-between">
                  <span className="font-mono text-xs font-black text-[#2563EB] bg-blue-50 px-2.5 py-1 rounded-lg">
                    {activeDispute.disputeNumber}
                  </span>
                  <span className="text-xs text-slate-400">
                    Thời gian gửi: {new Date(activeDispute.createdAt).toLocaleString('vi-VN')}
                  </span>
                </div>
                <h2 className="mt-2 text-lg font-black text-slate-900">{activeDispute.title}</h2>
                <span className="inline-block mt-1 text-xs font-bold text-rose-700 bg-rose-50 border border-rose-200 px-2.5 py-0.5 rounded-full">
                  Phân loại: {disputeCategoryLabels[activeDispute.category]}
                </span>
              </div>

              {/* Data Audit Comparison (Offer vs Contract) */}
              <div className="rounded-2xl border border-slate-200 bg-slate-50/50 p-4 space-y-3">
                <h3 className="text-xs font-black uppercase tracking-wider text-slate-700 flex items-center gap-1.5">
                  <FileText className="size-4 text-[#2563EB]" /> Đối soát dữ liệu hệ thống (Single Source of Truth)
                </h3>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                  {/* Left: Offer Details */}
                  <div className="rounded-xl border border-slate-200 bg-white p-3 space-y-1.5">
                    <span className="text-2xs font-bold text-blue-700 block uppercase">1. Thư mời nhận việc (Offer)</span>
                    <div>
                      <span className="text-slate-500">Vị trí: </span>
                      <strong>{activeDispute.application?.job?.title}</strong>
                    </div>
                    <div>
                      <span className="text-slate-500">Lương thỏa thuận: </span>
                      <strong className="text-blue-700">
                        {activeDispute.application?.offer
                          ? `${Number(activeDispute.application.offer.salary).toLocaleString('vi-VN')} ${activeDispute.application.offer.currency}`
                          : 'Chưa có dữ liệu'}
                      </strong>
                    </div>
                    <div>
                      <span className="text-slate-500">Ngày bắt đầu: </span>
                      <span>
                        {activeDispute.application?.offer?.startDate
                          ? new Date(activeDispute.application.offer.startDate).toLocaleDateString('vi-VN')
                          : '—'}
                      </span>
                    </div>
                  </div>

                  {/* Right: Contract Details */}
                  <div className="rounded-xl border border-slate-200 bg-white p-3 space-y-1.5">
                    <div className="flex items-center justify-between">
                      <span className="text-2xs font-bold text-indigo-700 block uppercase">2. Hợp đồng lao động (Contract)</span>
                      {activeDispute.application?.contract?.signingMethod === 'ELECTRONIC' ? (
                        <span className="inline-flex items-center gap-1 rounded-full bg-blue-50 px-2 py-0.5 text-3xs font-extrabold text-[#2563EB]">
                          <Lock className="size-2.5" /> Ký điện tử 2FA
                        </span>
                      ) : activeDispute.application?.contract?.signingMethod === 'MANUAL' ? (
                        <span className="inline-flex items-center gap-1 rounded-full bg-amber-50 px-2 py-0.5 text-3xs font-extrabold text-amber-800">
                          <Paperclip className="size-2.5" /> Ký tay / Scan giấy
                        </span>
                      ) : null}
                    </div>

                    <div>
                      <span className="text-slate-500">Mã hợp đồng: </span>
                      <strong className="font-mono text-[#2563EB]">{activeDispute.application?.contract?.contractNumber || 'Chưa khởi tạo'}</strong>
                    </div>
                    <div>
                      <span className="text-slate-500">Lương trên hợp đồng: </span>
                      <strong className="text-indigo-700">
                        {activeDispute.application?.contract
                          ? `${Number(activeDispute.application.contract.salary).toLocaleString('vi-VN')} ${activeDispute.application.contract.currency}`
                          : 'Chưa có dữ liệu'}
                      </strong>
                    </div>
                    <div>
                      <span className="text-slate-500">Trạng thái HĐ: </span>
                      <span className="font-bold text-slate-800">
                        {activeDispute.application?.contract?.status || '—'}
                      </span>
                    </div>

                    {activeDispute.application?.contract && (
                      <button
                        type="button"
                        onClick={() => setViewingContractDoc(true)}
                        className="mt-2 w-full inline-flex items-center justify-center gap-1.5 rounded-xl border border-blue-200 bg-blue-50 px-3 py-1.5 text-2xs font-bold text-[#2563EB] hover:bg-blue-100 transition shadow-2xs"
                      >
                        <FileText className="size-3.5" />
                        Xem toàn văn HĐ chuẩn soạn thảo trên hệ thống (Gốc)
                      </button>
                    )}

                    {/* Discrepancy warning banner */}
                    {activeDispute.application?.offer && activeDispute.application?.contract && (
                      Number(activeDispute.application.offer.salary) !== Number(activeDispute.application.contract.salary) && (
                        <div className="mt-2 rounded-lg bg-rose-50 border border-rose-200 p-2 text-2xs text-rose-800 font-extrabold flex items-center gap-1.5">
                          <AlertTriangle className="size-3 text-rose-600 shrink-0" />
                          <span>SAI LỆCH LƯƠNG: Offer ghi nhận {Number(activeDispute.application.offer.salary).toLocaleString('vi-VN')} đ nhưng HĐ lại ghi {Number(activeDispute.application.contract.salary).toLocaleString('vi-VN')} đ!</span>
                        </div>
                      )
                    )}
                  </div>
                </div>

                {/* Specific Forensic Panel for BOTH MANUAL and ELECTRONIC */}
                {activeDispute.application?.contract && (
                  <div className="mt-3 pt-3 border-t border-slate-200/80 space-y-2.5">
                    <span className="text-2xs font-extrabold text-slate-700 uppercase tracking-wider block flex items-center gap-1">
                      <Scale className="size-3.5 text-[#2563EB]" />
                      Bằng chứng truy vết theo phương thức giao kết ({activeDispute.application.contract.signingMethod}):
                    </span>

                    {activeDispute.application.contract.signingMethod === 'MANUAL' ? (
                      /* MANUAL SCAN INVESTIGATION */
                      <div className="rounded-xl border border-amber-200 bg-amber-50/40 p-3 space-y-2 text-xs">
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                          <div>
                            <span className="font-bold text-amber-900 block">Bản scan hợp đồng giấy có chữ ký & mộc đỏ:</span>
                            <span className="text-3xs text-slate-500">
                              {activeDispute.application.contract.signedPdfUrl ? 'Đã tải lên hệ thống' : 'Chưa có file scan'}
                            </span>
                          </div>
                          {activeDispute.application.contract.signedPdfUrl && (
                            <a
                              href={activeDispute.application.contract.signedPdfUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="inline-flex items-center gap-1 rounded-lg bg-[#2563EB] px-3 py-1.5 text-2xs font-bold text-white hover:bg-blue-700 transition"
                            >
                              <ExternalLink className="size-3" />
                              Mở xem bản scan gốc (.PDF)
                            </a>
                          )}
                        </div>

                        {activeDispute.application.contract.pdfSha256Hash && (
                          <div className="text-3xs font-mono bg-white p-2 rounded-lg border border-amber-200 text-slate-700 break-all">
                            <span className="font-bold text-amber-800">Dấu băm SHA-256 bản scan: </span>
                            {activeDispute.application.contract.pdfSha256Hash}
                          </div>
                        )}
                      </div>
                    ) : (
                      /* ELECTRONIC SIGNING INVESTIGATION */
                      <div className="rounded-xl border border-blue-200 bg-blue-50/40 p-3 space-y-2 text-xs">
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-2xs">
                          <div className="bg-white p-2 rounded-lg border border-blue-100">
                            <strong>Bên B (Ứng viên):</strong>{' '}
                            {activeDispute.application.contract.candidateSignedAt ? (
                              <span className="text-emerald-700 font-bold">
                                Đã ký ({new Date(activeDispute.application.contract.candidateSignedAt).toLocaleDateString('vi-VN')})
                              </span>
                            ) : (
                              <span className="text-slate-400">Chưa ký</span>
                            )}
                            <div className="text-3xs text-slate-500">
                              OTP: {activeDispute.application.contract.candidateOtpVerifiedAt ? '✅ Đã xác thực' : 'Chưa'} | IP: {activeDispute.application.contract.candidateSignerIp || '127.0.0.1'}
                            </div>
                          </div>

                          <div className="bg-white p-2 rounded-lg border border-blue-100">
                            <strong>Bên A (Doanh nghiệp):</strong>{' '}
                            {activeDispute.application.contract.employerSignedAt ? (
                              <span className="text-emerald-700 font-bold">
                                Đã ký ({new Date(activeDispute.application.contract.employerSignedAt).toLocaleDateString('vi-VN')})
                              </span>
                            ) : (
                              <span className="text-slate-400">Chưa ký</span>
                            )}
                            <div className="text-3xs text-slate-500">
                              OTP: {activeDispute.application.contract.employerOtpVerifiedAt ? '✅ Đã xác thực' : 'Chưa'} | IP: {activeDispute.application.contract.employerSignerIp || '127.0.0.1'}
                            </div>
                          </div>
                        </div>

                        {activeDispute.application.contract.pdfSha256Hash && (
                          <div className="text-3xs font-mono bg-white p-2 rounded-lg border border-blue-200 text-slate-700 break-all">
                            <span className="font-bold text-blue-800">Mã niêm phong SHA-256: </span>
                            {activeDispute.application.contract.pdfSha256Hash}
                          </div>
                        )}
                      </div>
                    )}

                    {/* Historical Timeline Accordion */}
                    {activeDispute.application.contract.histories && activeDispute.application.contract.histories.length > 0 && (
                      <div className="rounded-xl border border-slate-200 bg-white overflow-hidden">
                        <button
                          type="button"
                          onClick={() => setShowContractHistory(!showContractHistory)}
                          className="w-full flex items-center justify-between p-2.5 bg-slate-50 text-2xs font-extrabold text-slate-700 hover:bg-slate-100 transition"
                        >
                          <span className="flex items-center gap-1.5">
                            <Clock className="size-3 text-[#2563EB]" />
                            Lịch sử biến động hợp đồng ({activeDispute.application.contract.histories.length} sự kiện)
                          </span>
                          {showContractHistory ? <ChevronUp className="size-3.5" /> : <ChevronDown className="size-3.5" />}
                        </button>

                        {showContractHistory && (
                          <div className="p-3 space-y-2 max-h-48 overflow-y-auto divide-y divide-slate-100">
                            {activeDispute.application.contract.histories.map((h: any) => (
                              <div key={h.id} className="pt-2 first:pt-0 text-3xs space-y-0.5">
                                <div className="flex items-center justify-between">
                                  <span className="font-mono font-bold text-[#2563EB]">{h.action}</span>
                                  <span className="text-slate-400">{new Date(h.createdAt).toLocaleString('vi-VN')}</span>
                                </div>
                                <p className="text-slate-600">{h.note}</p>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                )}

                {/* Parties info */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-2xs text-slate-600 pt-2 border-t border-slate-200">
                  <div>
                    <strong>Ứng viên (Bên B):</strong> {activeDispute.application?.candidate?.fullName} ({activeDispute.application?.candidate?.email})
                  </div>
                  <div>
                    <strong>Nhà tuyển dụng (Bên A):</strong> {activeDispute.application?.job?.recruiter?.company?.name || 'Doanh nghiệp'} ({activeDispute.application?.job?.recruiter?.user?.email})
                  </div>
                </div>
              </div>

              {/* Dispute Description */}
              <div className="space-y-1.5">
                <h3 className="text-xs font-bold text-slate-800">Nội dung trình báo của Ứng viên:</h3>
                <div className="rounded-xl border border-rose-100 bg-rose-50/40 p-4 text-xs text-slate-800 leading-relaxed whitespace-pre-line">
                  {activeDispute.description}
                </div>
              </div>

              {/* Discussion & Appeals Timeline Section */}
              <div className="rounded-2xl border border-blue-200 bg-blue-50/40 p-4 space-y-3">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <div>
                    <h3 className="text-xs font-black uppercase tracking-wider text-slate-900 flex items-center gap-1.5">
                      <Scale className="size-4 text-[#2563EB]" />
                      Lịch Sử Đối Thoại & Đơn Kháng Nghị 3 Bên ({activeDispute.timeline?.length || 1})
                    </h3>
                    <p className="text-2xs text-slate-500">
                      Theo dõi toàn bộ ý kiến của Ứng viên, văn bản giải trình của HR và phán quyết Admin
                    </p>
                  </div>

                  <button
                    type="button"
                    onClick={() => setShowDisputeDetailModal(true)}
                    className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-bold bg-[#2563EB] text-white hover:bg-blue-700 shadow-xs transition-colors shrink-0 cursor-pointer"
                  >
                    <Scale className="size-3.5" />
                    Mở Phòng Đối Thoại & Phản Hồi
                    <ArrowRight className="size-3.5" />
                  </button>
                </div>

                {/* Appeal Alert if any */}
                {activeDispute.timeline?.some((t) => t.isAppeal || t.type === 'APPEAL') && (
                  <div className="p-3 rounded-xl bg-rose-50 border border-rose-300 text-xs text-rose-900 font-bold flex items-center gap-2">
                    <AlertTriangle className="size-4 text-rose-600 shrink-0" />
                    <span>⚠️ ĐÃ CÓ ĐƠN KHÁNG NGHỊ MỚI: Một trong 2 bên không đồng ý với kết luận trước đó và yêu cầu xem xét lại.</span>
                  </div>
                )}

                {/* Timeline items brief */}
                {activeDispute.timeline && activeDispute.timeline.length > 0 && (
                  <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
                    {activeDispute.timeline.map((item) => (
                      <div
                        key={item.id}
                        className={`p-2.5 rounded-xl border text-xs ${
                          item.type === 'ADMIN_RESOLUTION'
                            ? 'bg-emerald-50 border-emerald-200 text-emerald-950'
                            : item.isAppeal || item.type === 'APPEAL'
                            ? 'bg-rose-50 border-rose-200 text-rose-950 font-medium'
                            : item.senderRole === 'RECRUITER'
                            ? 'bg-indigo-50 border-indigo-200 text-indigo-950'
                            : 'bg-white border-slate-200 text-slate-800'
                        }`}
                      >
                        <div className="flex items-center justify-between gap-2 text-3xs font-extrabold pb-1">
                          <span className="flex items-center gap-1.5">
                            <span className="uppercase text-slate-600">[{item.senderRole}]</span>
                            <strong>{item.senderName}</strong>
                            {item.isAppeal && (
                              <span className="bg-rose-600 text-white px-1.5 py-0.2 rounded text-3xs">
                                KHÁNG NGHỊ
                              </span>
                            )}
                          </span>
                          <span className="text-slate-400 font-normal">
                            {new Date(item.createdAt).toLocaleString('vi-VN')}
                          </span>
                        </div>
                        <p className="line-clamp-2 text-2xs text-slate-700">{item.message}</p>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Resolution Form */}
              <form onSubmit={handleResolve} className="rounded-2xl border border-slate-200 bg-white p-5 space-y-4">
                <h3 className="text-xs font-black uppercase tracking-wider text-slate-900 flex items-center gap-2">
                  <ShieldAlert className="size-4 text-blue-600" />
                  Ban hành Phán Quyết & Chế Tài
                </h3>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      Kết quả giải quyết
                    </label>
                    <select
                      value={resolutionStatus}
                      onChange={(e) => setResolutionStatus(e.target.value as DisputeStatus)}
                      className="w-full rounded-xl border border-slate-200 bg-white p-2.5 text-xs font-semibold text-slate-800 outline-none focus:border-blue-500"
                    >
                      <option value="RESOLVED">Xác nhận có vi phạm (RESOLVED)</option>
                      <option value="INVESTIGATING">Yêu cầu thêm bằng chứng (INVESTIGATING)</option>
                      <option value="DISMISSED">Bác đơn - Không đủ căn cứ (DISMISSED)</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      Biện pháp chế tài Doanh nghiệp
                    </label>
                    <select
                      value={enforcementAction}
                      onChange={(e) => setEnforcementAction(e.target.value as any)}
                      className="w-full rounded-xl border border-slate-200 bg-white p-2.5 text-xs font-semibold text-rose-700 outline-none focus:border-blue-500"
                    >
                      <option value="NONE">Không áp dụng chế tài tài khoản</option>
                      <option value="WARN">Gửi thông báo cảnh cáo Doanh nghiệp</option>
                      <option value="LOCK_RECRUITER">🚨 Khóa tài khoản Doanh nghiệp & Tạm dừng tin tuyển dụng</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Ghi chú thi hành / Yêu cầu khắc phục (nếu có)
                  </label>
                  <input
                    type="text"
                    value={penaltyNotes}
                    onChange={(e) => setPenaltyNotes(e.target.value)}
                    placeholder="Ví dụ: Yêu cầu Nhà tuyển dụng đối chiếu lại thỏa thuận hoặc hoàn trả tài liệu trước ngày..."
                    className="w-full rounded-xl border border-slate-200 bg-white p-2.5 text-xs text-slate-800 outline-none focus:border-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Nội dung thông báo phán quyết (Gửi cho cả 2 bên) *
                  </label>
                  <textarea
                    rows={3}
                    required
                    value={adminResolution}
                    onChange={(e) => setAdminResolution(e.target.value)}
                    placeholder="Ghi rõ lý do xử lý, căn cứ đối soát lịch sử hệ thống và kết luận của Ban Quản Trị..."
                    className="w-full rounded-xl border border-slate-200 p-3 text-xs text-slate-800 outline-none focus:border-blue-500 resize-none"
                  />
                </div>

                <div className="flex justify-end">
                  <button
                    type="submit"
                    disabled={resolving}
                    className="inline-flex items-center gap-2 rounded-xl bg-[#2563EB] px-5 py-2.5 text-xs font-bold text-white shadow-sm hover:bg-blue-700 disabled:opacity-50 transition cursor-pointer"
                  >
                    {resolving ? <Loader2 className="size-4 animate-spin" /> : <Check className="size-4" />}
                    Ban Hành Quyết Định
                  </button>
                </div>
              </form>
            </div>
          ) : (
            <div className="rounded-2xl border border-dashed border-slate-200 bg-white p-12 text-center text-xs text-slate-400">
              Chọn một khiếu nại từ danh sách bên trái để đối soát và xử lý.
            </div>
          )}
        </div>
      </div>
        </>
      ) : (
        /* WARRANTY CLAIMS TAB */
        <div className="space-y-4">
          {/* Warranty Filters */}
          <div className="flex items-center gap-2">
            {[
              { id: 'ALL', label: `Tất cả (${warrantyClaims.length})` },
              { id: 'PENDING', label: `Chờ duyệt (${warrantyMetrics.pending})` },
              { id: 'APPROVED', label: `Đã duyệt bồi hoàn (${warrantyMetrics.approved})` },
              { id: 'REJECTED', label: `Bị từ chối (${warrantyMetrics.rejected})` },
            ].map((f) => (
              <button
                key={f.id}
                type="button"
                onClick={() => {
                  setWarrantyStatusFilter(f.id as any);
                  loadWarrantyClaims(token, f.id as any);
                }}
                className={`rounded-xl px-3 py-1.5 text-xs font-bold transition cursor-pointer ${
                  warrantyStatusFilter === f.id
                    ? 'bg-[#2563EB] text-white shadow-xs'
                    : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-50'
                }`}
              >
                {f.label}
              </button>
            ))}
          </div>

          {/* Warranty Claims List Table */}
          {warrantyLoading ? (
            <div className="flex items-center justify-center p-12 text-slate-400">
              <Loader2 className="size-6 animate-spin text-[#2563EB]" />
              <span className="ml-2 text-xs">Đang tải danh sách bảo hành...</span>
            </div>
          ) : warrantyClaims.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-slate-200 bg-white p-12 text-center text-xs text-slate-400">
              Không có yêu cầu bảo hành nào phù hợp bộ lọc.
            </div>
          ) : (
            <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-xs">
              <table className="w-full text-left text-xs">
                <thead className="border-b border-slate-200 bg-slate-50 text-2xs font-extrabold uppercase text-slate-500">
                  <tr>
                    <th className="py-3 px-4">Mã bảo hành</th>
                    <th className="py-3 px-4">Vị trí & Hợp đồng</th>
                    <th className="py-3 px-4">Lý do bảo hành</th>
                    <th className="py-3 px-4">Diễn giải sự cố từ NTD</th>
                    <th className="py-3 px-4">Ngày gửi</th>
                    <th className="py-3 px-4 text-center">Trạng thái</th>
                    <th className="py-3 px-4 text-right">Thao tác</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {warrantyClaims.map((claim) => (
                    <tr key={claim.id} className="hover:bg-slate-50/70 transition">
                      <td className="py-3 px-4 font-mono font-bold text-[#2563EB]">
                        {claim.claimNumber}
                      </td>
                      <td className="py-3 px-4">
                        <div className="font-bold text-slate-900">{claim.contract?.jobTitle || 'Hợp đồng tuyển dụng'}</div>
                        <div className="text-2xs text-slate-500">HĐ: {claim.contract?.contractNumber || claim.contractId}</div>
                      </td>
                      <td className="py-3 px-4">
                        <span className="rounded-lg bg-rose-50 border border-rose-200 px-2.5 py-1 text-2xs font-bold text-rose-700">
                          {claim.reason === 'NO_SHOW' ? 'Ứng viên không đến nhận việc' : 'Nghỉ việc ngang (dưới 30N)'}
                        </span>
                      </td>
                      <td className="py-3 px-4 max-w-xs truncate text-slate-600 font-medium">
                        {claim.note || 'Không có ghi chú'}
                      </td>
                      <td className="py-3 px-4 text-slate-500">
                        {new Date(claim.createdAt).toLocaleDateString('vi-VN')}
                      </td>
                      <td className="py-3 px-4 text-center">
                        <span
                          className={`rounded-full px-2.5 py-0.5 text-2xs font-extrabold ${
                            claim.status === 'APPROVED'
                              ? 'bg-emerald-100 text-emerald-800'
                              : claim.status === 'PENDING'
                              ? 'bg-amber-100 text-amber-800 animate-pulse'
                              : 'bg-rose-100 text-rose-800'
                          }`}
                        >
                          {claim.status === 'APPROVED'
                            ? 'Đã bồi hoàn'
                            : claim.status === 'PENDING'
                            ? 'Chờ duyệt'
                            : 'Từ chối'}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-right">
                        <button
                          type="button"
                          onClick={() => {
                            setSelectedWarrantyClaimId(claim.id);
                            setShowWarrantyReviewModal(true);
                          }}
                          className="inline-flex items-center gap-1 rounded-xl bg-[#2563EB] px-3 py-1.5 text-xs font-bold text-white hover:bg-blue-700 transition shadow-2xs cursor-pointer"
                        >
                          <ShieldCheck className="size-3.5" />
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
      )}

      {/* Full Contract Document Modal */}
      {viewingContractDoc && activeDispute?.application?.contract && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4 overflow-y-auto animate-in fade-in">
          <div className="relative w-full max-w-4xl max-h-[90vh] flex flex-col rounded-3xl bg-white shadow-2xl border border-slate-200 overflow-hidden">
            <div className="flex items-center justify-between border-b border-slate-200 bg-[#EFF6FF]/60 px-6 py-4">
              <div>
                <h3 className="text-base font-black text-slate-900">
                  Toàn Văn Hợp Đồng Lao Động Chuẩn (Dữ liệu soạn thảo trên hệ thống)
                </h3>
                <p className="text-2xs text-slate-500">
                  Mã HĐ: {activeDispute.application.contract.contractNumber} — Bảo lưu 100% điều khoản số kể cả khi bản scan của HR bị mờ
                </p>
              </div>
              <button
                type="button"
                onClick={() => setViewingContractDoc(false)}
                className="rounded-xl p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-700 transition cursor-pointer"
              >
                <X className="size-5" />
              </button>
            </div>
            <div className="flex-1 overflow-y-auto p-6 bg-slate-50/40">
              <ContractDocumentView contract={activeDispute.application.contract} showPrintButton={true} />
            </div>
            <div className="border-t border-slate-200 bg-slate-50 px-6 py-3 flex justify-end">
              <button
                type="button"
                onClick={() => setViewingContractDoc(false)}
                className="rounded-xl bg-white border border-slate-200 px-4 py-2 text-xs font-bold text-slate-700 hover:bg-slate-100 transition shadow-2xs cursor-pointer"
              >
                Đóng văn bản
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Dispute Detail Modal for Admin */}
      <DisputeDetailModal
        isOpen={showDisputeDetailModal}
        onClose={() => setShowDisputeDetailModal(false)}
        disputeId={selectedDisputeId}
        token={token}
        currentUserRole="ADMIN"
        onDisputeUpdated={() => loadDisputes(token, statusFilter === 'ALL' ? undefined : (statusFilter as DisputeStatus))}
      />

      {/* Admin Warranty Review Modal */}
      {showWarrantyReviewModal && selectedWarrantyClaimId && (
        <AdminWarrantyReviewModal
          isOpen={showWarrantyReviewModal}
          onClose={() => {
            setShowWarrantyReviewModal(false);
            setSelectedWarrantyClaimId(null);
          }}
          token={token}
          claimId={selectedWarrantyClaimId}
          onResolved={async () => {
            setShowWarrantyReviewModal(false);
            setSelectedWarrantyClaimId(null);
            await loadWarrantyClaims(token, warrantyStatusFilter);
          }}
        />
      )}
    </div>
  );
}


