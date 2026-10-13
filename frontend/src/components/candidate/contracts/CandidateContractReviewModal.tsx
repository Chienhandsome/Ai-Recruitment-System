'use client';

import React, { useState } from 'react';
import {
  X,
  FileCheck2,
  FileEdit,
  ShieldCheck,
  Download,
  CheckCircle2,
  AlertCircle,
  Loader2,
  PenTool,
  ExternalLink,
  ShieldAlert,
  Eye,
  FileText,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react';
import { toast } from 'sonner';
import {
  type ContractData,
  requestContractRevision,
  approveContract,
  eSignContract,
} from '@/lib/contract-api';
import { ContractDocumentView } from '@/components/common/contracts/ContractDocumentView';
import { DigitalSignatureModal } from '@/components/common/contracts/DigitalSignatureModal';
import { PolicyQuickViewModal } from '@/components/common/policies/PolicyQuickViewModal';
import { ReportDisputeModal } from '@/components/common/disputes/ReportDisputeModal';

interface CandidateContractReviewModalProps {
  isOpen: boolean;
  onClose: () => void;
  token: string;
  contract: ContractData;
  candidateName: string;
  onSuccess: () => void | Promise<void>;
}

export function CandidateContractReviewModal({
  isOpen,
  onClose,
  token,
  contract,
  candidateName,
  onSuccess,
}: CandidateContractReviewModalProps) {
  const [showRevisionForm, setShowRevisionForm] = useState(false);
  const [revisionNote, setRevisionNote] = useState('');
  const [submittingRevision, setSubmittingRevision] = useState(false);
  const [approving, setApproving] = useState(false);
  const [showESignModal, setShowESignModal] = useState(false);
  const [candidateAgreedTerms, setCandidateAgreedTerms] = useState(false);
  const [viewingPolicyCode, setViewingPolicyCode] = useState<string | null>(null);
  const [showDisputeModal, setShowDisputeModal] = useState(false);
  const [showScanViewer, setShowScanViewer] = useState(false);
  const [activeScanPageIndex, setActiveScanPageIndex] = useState(0);

  const manualScanPages = (contract.auditCertificate as any)?.manualScan?.pages as Array<any> | undefined;

  if (!isOpen) return null;

  const handleRequestRevision = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!revisionNote.trim() || revisionNote.trim().length < 5) {
      toast.error('Vui lòng nhập nội dung đề xuất điều chỉnh cụ thể (ít nhất 5 ký tự).');
      return;
    }

    setSubmittingRevision(true);
    try {
      await requestContractRevision(token, contract.id, revisionNote.trim());
      toast.info('Bạn đã gửi yêu cầu chỉnh sửa điều khoản tới Nhà tuyển dụng.');
      setShowRevisionForm(false);
      setRevisionNote('');
      await onSuccess();
      onClose();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Không thể gửi yêu cầu');
    } finally {
      setSubmittingRevision(false);
    }
  };

  const handleApprove = async () => {
    if (!candidateAgreedTerms) {
      toast.error('Vui lòng tích chọn xác nhận bạn đã đọc và đồng ý với các điều khoản trong hợp đồng trước khi phê duyệt.');
      return;
    }
    setApproving(true);
    try {
      await approveContract(token, contract.id);
      toast.success('Bạn đã đồng ý toàn bộ điều khoản trong hợp đồng lao động!');
      await onSuccess();
      if (contract.signingMethod === 'ELECTRONIC') {
        setShowESignModal(true);
      }
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Không thể phê duyệt');
    } finally {
      setApproving(false);
    }
  };

  const handleSignConfirm = async (
    signatureDataUrl: string,
    otpCode: string,
    options?: { acceptedContractTerms: boolean; acceptedPlatformTerms: boolean },
  ) => {
    await eSignContract(token, contract.id, signatureDataUrl, otpCode, options);
    await onSuccess();
  };

  return (
    <>
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 p-4 backdrop-blur-sm">
        <div className="flex h-[92vh] w-full max-w-5xl flex-col rounded-2xl border border-slate-200 bg-white shadow-2xl font-sans overflow-hidden">
          {/* Header */}
          <div className="flex items-center justify-between border-b border-slate-100 px-6 py-4 bg-slate-50/50">
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base font-bold text-slate-900">
                  Xem xét Hợp đồng lao động
                </h2>
                <span className="rounded-full bg-blue-100 px-2.5 py-0.5 text-xs font-semibold text-blue-700">
                  {contract.contractNumber}
                </span>
              </div>
              <p className="text-xs text-slate-500 mt-0.5">
                Vui lòng đọc kỹ các điều khoản về quyền lợi, nghĩa vụ và chế độ đãi ngộ trước khi phản hồi.
              </p>
            </div>

            <button
              type="button"
              onClick={onClose}
              className="rounded-lg p-2 text-slate-400 hover:bg-slate-100 hover:text-slate-600"
            >
              <X className="size-5" />
            </button>
          </div>

          {/* Body Viewer */}
          <div className="flex-1 overflow-y-auto p-6 bg-slate-100/60">
            <ContractDocumentView contract={contract} />
          </div>

          {/* Sticky Bottom Action Bar */}
          <div className="border-t border-slate-200 bg-white px-6 py-4 shadow-lg">
            {contract.status === 'SIGNED' ? (
              <div className="space-y-3">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div className="flex items-center gap-2 text-emerald-700 text-xs font-bold">
                    <CheckCircle2 className="size-5 shrink-0" />
                    <span>Hợp đồng lao động đã hoàn tất ký kết chính thức và có hiệu lực thi hành!</span>
                  </div>

                  <div className="flex flex-wrap items-center gap-2">
                    {manualScanPages && manualScanPages.length > 0 && (
                      <button
                        type="button"
                        onClick={() => {
                          setActiveScanPageIndex(0);
                          setShowScanViewer(true);
                        }}
                        className="inline-flex items-center gap-1.5 rounded-xl border border-blue-200 bg-[#EFF6FF] px-3.5 py-2 text-xs font-bold text-[#2563EB] shadow-2xs hover:bg-blue-100 transition cursor-pointer"
                      >
                        <Eye className="size-3.5" />
                        Xem {manualScanPages.length} trang scan đã ký
                      </button>
                    )}

                    {contract.signedPdfUrl && (
                      <>
                        <a
                          href={contract.signedPdfUrl}
                          target="_blank"
                          rel="noreferrer"
                          className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-bold text-slate-700 shadow-2xs hover:bg-slate-50 transition"
                        >
                          <ExternalLink className="size-3.5 text-[#2563EB]" />
                          Mở bản scan gốc
                        </a>
                        <a
                          href={contract.signedPdfUrl}
                          target="_blank"
                          rel="noreferrer"
                          download
                          className="inline-flex items-center gap-1.5 rounded-xl bg-emerald-600 px-3.5 py-2 text-xs font-bold text-white shadow-xs hover:bg-emerald-700 transition"
                        >
                          <Download className="size-3.5" />
                          Tải về máy
                        </a>
                      </>
                    )}

                    <button
                      type="button"
                      onClick={() => setShowDisputeModal(true)}
                      className="inline-flex items-center gap-1.5 rounded-xl border border-rose-200 bg-rose-50 px-3 py-2 text-xs font-bold text-rose-700 shadow-2xs hover:bg-rose-100 transition"
                    >
                      <ShieldAlert className="size-3.5 text-rose-600" />
                      {contract.signingMethod === 'MANUAL' ? 'Báo cáo bản scan mờ / Khiếu nại' : 'Báo cáo vi phạm điều khoản'}
                    </button>
                  </div>
                </div>

                {contract.signingMethod === 'MANUAL' && (
                  <div className="rounded-xl border border-amber-200 bg-amber-50/70 p-3 text-2xs text-amber-950 flex items-start gap-2">
                    <AlertCircle className="size-4 text-amber-600 shrink-0 mt-0.5" />
                    <p className="leading-relaxed">
                      <strong>Lưu ý đối soát cho Ứng viên:</strong> Bạn vui lòng mở xem file PDF scan do công ty tải lên. Nếu bản scan bị <strong>mờ, mất nét, lóa sáng, không thấy rõ con dấu mộc đỏ hoặc chữ ký</strong>, bạn hãy bấm nút <strong>"Báo cáo bản scan mờ / Khiếu nại"</strong> ở trên. Ban Quản Trị hệ thống sẽ yêu cầu công ty scan lại bản mới đạt chuẩn để bảo đảm giá trị pháp lý cho bạn. Văn bản hợp đồng ở khung trên là căn cứ chuẩn đối chiếu.
                    </p>
                  </div>
                )}
              </div>
            ) : contract.status === 'REVISION_REQUESTED' ? (
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-amber-700 text-xs font-semibold">
                  <AlertCircle className="size-4" />
                  Bạn đã gửi yêu cầu điều chỉnh. Đang chờ Nhà tuyển dụng cập nhật lại bản hợp đồng mới.
                </div>
                <button
                  type="button"
                  onClick={onClose}
                  className="rounded-xl border border-slate-200 px-4 py-2 text-xs font-bold text-slate-600 hover:bg-slate-50"
                >
                  Đóng
                </button>
              </div>
            ) : showRevisionForm ? (
              <form onSubmit={handleRequestRevision} className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                    <FileEdit className="size-4 text-amber-600" />
                    Nhập nội dung bạn muốn Nhà tuyển dụng điều chỉnh:
                  </span>
                  <button
                    type="button"
                    onClick={() => setShowRevisionForm(false)}
                    className="text-xs text-slate-500 hover:text-slate-800"
                  >
                    Hủy
                  </button>
                </div>
                <textarea
                  rows={2}
                  value={revisionNote}
                  onChange={(e) => setRevisionNote(e.target.value)}
                  placeholder="Ví dụ: Em mong muốn điều chỉnh lại ngày bắt đầu làm việc sang thứ Hai tuần sau..."
                  className="w-full rounded-xl border border-slate-200 p-3 text-xs font-medium text-slate-800 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                  required
                />
                <div className="flex justify-end gap-2">
                  <button
                    type="button"
                    onClick={() => setShowRevisionForm(false)}
                    className="rounded-xl border border-slate-200 px-4 py-1.5 text-xs font-bold text-slate-600 hover:bg-slate-50"
                  >
                    Quay lại
                  </button>
                  <button
                    type="submit"
                    disabled={submittingRevision}
                    className="inline-flex items-center gap-2 rounded-xl bg-amber-600 px-4 py-1.5 text-xs font-bold text-white shadow-sm hover:bg-amber-700 disabled:opacity-50"
                  >
                    {submittingRevision && <Loader2 className="size-3.5 animate-spin" />}
                    Gửi yêu cầu chỉnh sửa
                  </button>
                </div>
              </form>
            ) : (
              <div className="flex flex-col gap-3">
                {contract.status !== 'APPROVED' && (
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 rounded-xl border border-blue-200 bg-blue-50/40 p-3">
                    <label className="flex items-start gap-2.5 cursor-pointer group">
                      <input
                        type="checkbox"
                        checked={candidateAgreedTerms}
                        onChange={(e) => setCandidateAgreedTerms(e.target.checked)}
                        className="mt-0.5 size-4 rounded border-slate-300 text-[#2563EB] focus:ring-blue-500 cursor-pointer"
                      />
                      <span className="text-xs text-slate-700 leading-snug group-hover:text-slate-900 select-none">
                        Tôi xác nhận <strong>đã đọc kỹ, hiểu rõ và đồng ý toàn bộ quyền lợi, nghĩa vụ, thời giờ làm việc và mức lương</strong> trong bản Hợp đồng lao động này.
                      </span>
                    </label>

                    <button
                      type="button"
                      onClick={() => setViewingPolicyCode('DISPUTE_POLICY')}
                      className="text-2xs font-bold text-[#2563EB] hover:underline whitespace-nowrap shrink-0 cursor-pointer"
                    >
                      Xem Quy chế giải quyết tranh chấp ↗
                    </button>
                  </div>
                )}

                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div className="text-xs text-slate-600">
                    {contract.signingMethod === 'ELECTRONIC' ? (
                      <span className="flex items-center gap-1.5 font-semibold text-blue-700">
                        <ShieldCheck className="size-4" /> Hợp đồng hỗ trợ ký điện tử trực tiếp
                      </span>
                    ) : (
                      <span className="text-slate-500">
                        Hình thức ký: In ký tay khi nhận việc hoặc theo hướng dẫn của HR.
                      </span>
                    )}
                  </div>

                  <div className="flex items-center gap-3">
                    <button
                      type="button"
                      onClick={() => setShowRevisionForm(true)}
                      className="rounded-xl border border-slate-200 px-4 py-2 text-xs font-bold text-slate-700 hover:bg-slate-50 cursor-pointer"
                    >
                      Yêu cầu chỉnh sửa điều khoản
                    </button>

                    {contract.status === 'APPROVED' && contract.signingMethod === 'ELECTRONIC' ? (
                      <button
                        type="button"
                        onClick={() => setShowESignModal(true)}
                        className="inline-flex items-center gap-2 rounded-xl bg-[#2563EB] px-5 py-2 text-xs font-bold text-white shadow-sm hover:bg-blue-700 cursor-pointer"
                      >
                        <PenTool className="size-4" /> Ký điện tử ngay
                      </button>
                    ) : (
                      <button
                        type="button"
                        onClick={handleApprove}
                        disabled={approving || (!candidateAgreedTerms && contract.status !== 'APPROVED')}
                        className="inline-flex items-center gap-2 rounded-xl bg-[#2563EB] px-5 py-2 text-xs font-bold text-white shadow-sm hover:bg-blue-700 disabled:opacity-50 cursor-pointer"
                      >
                        {approving ? (
                          <Loader2 className="size-4 animate-spin" />
                        ) : (
                          <CheckCircle2 className="size-4" />
                        )}
                        Đồng ý nội dung hợp đồng
                      </button>
                    )}
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Electronic Signature Modal */}
      <DigitalSignatureModal
        isOpen={showESignModal}
        onClose={() => setShowESignModal(false)}
        signerName={candidateName}
        title="Ký tên điện tử vào Hợp đồng lao động"
        contractId={contract.id}
        token={token}
        onSignConfirmed={handleSignConfirm}
      />

      {/* Policy Quick View Modal */}
      <PolicyQuickViewModal
        isOpen={Boolean(viewingPolicyCode)}
        onClose={() => setViewingPolicyCode(null)}
        policyCode={viewingPolicyCode}
      />

      {/* Report Dispute Modal */}
      {showDisputeModal && (
        <ReportDisputeModal
          isOpen={showDisputeModal}
          onClose={() => setShowDisputeModal(false)}
          token={token}
          applicationId={contract.applicationId}
          contractId={contract.id}
          jobTitle={contract.jobTitle}
          companyName={contract.application?.job?.recruiter?.company?.name || 'Doanh nghiệp tuyển dụng'}
          onSubmitted={() => {
            toast.success('Khiếu nại của bạn đã được gửi tới Ban Quản Trị');
            onClose();
          }}
        />
      )}

      {/* Multi-Page Scan Viewer Modal */}
      {showScanViewer && manualScanPages && manualScanPages.length > 0 && (
        <div
          className="fixed inset-0 z-60 flex items-center justify-center bg-slate-950/80 p-4 backdrop-blur-sm"
          onClick={() => setShowScanViewer(false)}
        >
          <div
            className="flex max-h-[92vh] w-full max-w-4xl flex-col rounded-3xl border border-slate-200 bg-white shadow-2xl overflow-hidden font-sans"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="flex items-center justify-between border-b border-slate-100 px-6 py-3.5 bg-slate-50/70">
              <div className="flex items-center gap-2.5">
                <span className="flex size-8 items-center justify-center rounded-xl bg-blue-100 text-[#2563EB]">
                  <FileText className="size-4" />
                </span>
                <div>
                  <h3 className="text-sm font-bold text-slate-900">
                    Bản Scan Hợp Đồng Ký Tay (Trang {activeScanPageIndex + 1}/{manualScanPages.length})
                  </h3>
                  <p className="text-2xs text-slate-500">
                    Mã HĐ: <span className="font-mono text-[#2563EB]">{contract.contractNumber}</span> • Niêm phong SHA-256
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => {
                    setShowScanViewer(false);
                    setShowDisputeModal(true);
                  }}
                  className="inline-flex items-center gap-1 rounded-xl border border-rose-200 bg-rose-50 px-3 py-1.5 text-2xs font-bold text-rose-700 hover:bg-rose-100 cursor-pointer"
                >
                  <ShieldAlert className="size-3 text-rose-600" />
                  Báo ảnh mờ / Khiếu nại
                </button>
                <button
                  type="button"
                  onClick={() => setShowScanViewer(false)}
                  className="rounded-xl p-1.5 text-slate-400 hover:bg-slate-200 hover:text-slate-700 cursor-pointer"
                >
                  <X className="size-5" />
                </button>
              </div>
            </div>

            {/* Page Navigation Tabs */}
            {manualScanPages.length > 1 && (
              <div className="flex items-center gap-1.5 overflow-x-auto border-b border-slate-100 bg-slate-50/40 px-6 py-2">
                {manualScanPages.map((page, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => setActiveScanPageIndex(idx)}
                    className={`rounded-lg px-3 py-1 text-2xs font-bold transition cursor-pointer ${
                      activeScanPageIndex === idx
                        ? 'bg-[#2563EB] text-white shadow-2xs'
                        : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-100'
                    }`}
                  >
                    Trang {idx + 1}
                  </button>
                ))}
              </div>
            )}

            {/* Image Viewer Area */}
            <div className="relative flex-1 overflow-auto bg-slate-900/95 p-4 flex items-center justify-center min-h-[400px]">
              {manualScanPages.length > 1 && (
                <>
                  <button
                    type="button"
                    disabled={activeScanPageIndex === 0}
                    onClick={() => setActiveScanPageIndex((prev) => Math.max(0, prev - 1))}
                    className="absolute left-4 top-1/2 -translate-y-1/2 rounded-full bg-slate-800/80 p-2.5 text-white hover:bg-slate-700 disabled:opacity-30 disabled:pointer-events-none transition cursor-pointer shadow-lg"
                  >
                    <ChevronLeft className="size-5" />
                  </button>
                  <button
                    type="button"
                    disabled={activeScanPageIndex === manualScanPages.length - 1}
                    onClick={() => setActiveScanPageIndex((prev) => Math.min(manualScanPages.length - 1, prev + 1))}
                    className="absolute right-4 top-1/2 -translate-y-1/2 rounded-full bg-slate-800/80 p-2.5 text-white hover:bg-slate-700 disabled:opacity-30 disabled:pointer-events-none transition cursor-pointer shadow-lg"
                  >
                    <ChevronRight className="size-5" />
                  </button>
                </>
              )}

              {manualScanPages[activeScanPageIndex]?.mimeType === 'application/pdf' ? (
                <iframe
                  src={manualScanPages[activeScanPageIndex]?.dataUrl || manualScanPages[activeScanPageIndex]?.url}
                  className="w-full h-[65vh] rounded-xl bg-white"
                  title={`Trang scan ${activeScanPageIndex + 1}`}
                />
              ) : (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={manualScanPages[activeScanPageIndex]?.dataUrl || manualScanPages[activeScanPageIndex]?.url}
                  alt={`Trang scan ${activeScanPageIndex + 1}`}
                  className="max-h-[68vh] max-w-full rounded-xl object-contain shadow-2xl"
                />
              )}
            </div>

            {/* Footer with page hash info */}
            <div className="flex items-center justify-between border-t border-slate-100 bg-white px-6 py-2.5 text-2xs text-slate-500">
              <span className="truncate max-w-xs">
                Tên file: <strong>{manualScanPages[activeScanPageIndex]?.fileName}</strong>
              </span>
              <span className="font-mono text-slate-400">
                Mã SHA-256 trang: {manualScanPages[activeScanPageIndex]?.sha256Hash?.slice(0, 16)}...
              </span>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
