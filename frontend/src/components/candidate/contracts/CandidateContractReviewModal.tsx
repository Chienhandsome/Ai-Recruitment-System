'use client';

import React, { useState } from 'react';
import {
  X,
  FileCheck2,
  FileEdit,
  ShieldCheck,
  Download,
  Printer,
  CheckCircle2,
  AlertCircle,
  Loader2,
  PenTool,
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

  const handleSignConfirm = async (signatureDataUrl: string) => {
    await eSignContract(token, contract.id, signatureDataUrl);
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
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-emerald-700 text-xs font-bold">
                  <CheckCircle2 className="size-5" />
                  Hợp đồng lao động đã hoàn tất ký kết chính thức!
                </div>
                {contract.signedPdfUrl && (
                  <a
                    href={contract.signedPdfUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-2 rounded-xl bg-emerald-600 px-4 py-2 text-xs font-bold text-white shadow-sm hover:bg-emerald-700"
                  >
                    <Download className="size-4" /> Tải bản PDF đã ký
                  </a>
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
                    className="rounded-xl border border-slate-200 px-4 py-2 text-xs font-bold text-slate-700 hover:bg-slate-50"
                  >
                    Yêu cầu chỉnh sửa điều khoản
                  </button>

                  {contract.status === 'APPROVED' && contract.signingMethod === 'ELECTRONIC' ? (
                    <button
                      type="button"
                      onClick={() => setShowESignModal(true)}
                      className="inline-flex items-center gap-2 rounded-xl bg-[#2563EB] px-5 py-2 text-xs font-bold text-white shadow-sm hover:bg-blue-700"
                    >
                      <PenTool className="size-4" /> Ký điện tử ngay
                    </button>
                  ) : (
                    <button
                      type="button"
                      onClick={handleApprove}
                      disabled={approving}
                      className="inline-flex items-center gap-2 rounded-xl bg-[#2563EB] px-5 py-2 text-xs font-bold text-white shadow-sm hover:bg-blue-700 disabled:opacity-50"
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
        onSignConfirmed={handleSignConfirm}
      />
    </>
  );
}
