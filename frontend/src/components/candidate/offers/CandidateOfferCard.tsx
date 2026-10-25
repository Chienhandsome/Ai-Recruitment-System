'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  Gift,
  CheckCircle2,
  XCircle,
  Calendar,
  Clock,
  DollarSign,
  MapPin,
  Building2,
  Phone,
  Mail,
  User,
  Sparkles,
  AlertTriangle,
  Loader2,
  FileText,
  FileCheck,
  ArrowRight,
  ShieldAlert,
  ShieldCheck,
  MessageSquare,
} from 'lucide-react';
import { toast } from 'sonner';
import {
  type OfferData,
  acceptOffer,
  declineOffer,
} from '@/lib/offer-api';
import {
  type ContractData,
  getContractByApplication,
  getContractWarrantyStatus,
  type ContractWarrantyStatus,
} from '@/lib/contract-api';
import { CandidateContractReviewModal } from '@/components/candidate/contracts/CandidateContractReviewModal';
import { CandidateWarrantyFeedbackModal } from '@/components/candidate/contracts/CandidateWarrantyFeedbackModal';
import { ReportDisputeModal } from '@/components/common/disputes/ReportDisputeModal';
import { DisputeDetailModal } from '@/components/common/disputes/DisputeDetailModal';
import {
  type DisputeData,
  getDisputesByApplication,
} from '@/lib/dispute-api';

interface CandidateOfferCardProps {
  offer: OfferData;
  token: string;
  jobTitle: string;
  companyName?: string;
  onOfferResponded?: () => void | Promise<void>;
}

export function CandidateOfferCard({
  offer,
  token,
  jobTitle,
  companyName,
  onOfferResponded,
}: CandidateOfferCardProps) {
  const router = useRouter();
  const [showAcceptModal, setShowAcceptModal] = useState(false);
  const [showDeclineModal, setShowDeclineModal] = useState(false);
  const [declineReason, setDeclineReason] = useState('SALARY_NOT_MATCH');
  const [declineNote, setDeclineNote] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const [contract, setContract] = useState<ContractData | null>(null);
  const [loadingContract, setLoadingContract] = useState(false);
  const [showContractModal, setShowContractModal] = useState(false);
  const [showDisputeModal, setShowDisputeModal] = useState(false);

  // Dispute states
  const [disputes, setDisputes] = useState<DisputeData[]>([]);
  const [showDisputeDetailModal, setShowDisputeDetailModal] = useState(false);
  const [selectedDisputeId, setSelectedDisputeId] = useState<string | null>(null);

  // Warranty Claim states
  const [warrantyStatus, setWarrantyStatus] = useState<ContractWarrantyStatus | null>(null);
  const [showWarrantyFeedbackModal, setShowWarrantyFeedbackModal] = useState(false);

  const loadContract = React.useCallback(async () => {
    if (offer.status === 'ACCEPTED' && offer.applicationId && token) {
      setLoadingContract(true);
      try {
        const res = await getContractByApplication(token, offer.applicationId);
        if (res?.contract) {
          setContract(res.contract);
          try {
            const wStatus = await getContractWarrantyStatus(token, res.contract.id);
            setWarrantyStatus(wStatus);
          } catch {
            setWarrantyStatus(null);
          }
        }
      } catch {
        // silent fail
      } finally {
        setLoadingContract(false);
      }
    }
  }, [offer.status, offer.applicationId, token]);

  const loadDisputes = React.useCallback(async () => {
    if (offer.applicationId && token) {
      try {
        const data = await getDisputesByApplication(token, offer.applicationId);
        setDisputes(data);
        if (data.length > 0) {
          setSelectedDisputeId(data[0].id);
        }
      } catch {
        // silent fail
      }
    }
  }, [offer.applicationId, token]);

  React.useEffect(() => {
    loadContract();
    loadDisputes();
  }, [loadContract, loadDisputes]);

  const renderWarrantyClaimBanner = () => {
    if (!warrantyStatus?.existingClaim) return null;
    const claim = warrantyStatus.existingClaim;
    const isApproved = claim.status === 'APPROVED';
    const isRejected = claim.status === 'REJECTED';
    const hasResponded = !!claim.candidateResponse;

    return (
      <div
        className={`p-4 rounded-2xl border transition-all mb-4 ${
          isApproved
            ? 'bg-emerald-50/80 border-emerald-300 text-emerald-950'
            : isRejected
            ? 'bg-slate-50 border-slate-300 text-slate-700'
            : 'bg-gradient-to-r from-amber-50 via-amber-50/90 to-rose-50/50 border-amber-300 text-amber-950 shadow-sm'
        }`}
      >
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="space-y-1">
            <div className="flex flex-wrap items-center gap-2">
              <span className="flex size-7 items-center justify-center rounded-lg bg-amber-500 text-white shadow-2xs shrink-0">
                <AlertTriangle className="size-4" />
              </span>
              <span className="font-mono text-2xs font-black bg-white px-2 py-0.5 rounded border border-amber-200 text-amber-800">
                {claim.claimNumber}
              </span>
              <span className="text-xs font-black text-amber-950 uppercase tracking-wide">
                {isApproved
                  ? 'KẾT QUẢ BẢO HÀNH: ĐÃ HOÀN TẤT THẨM ĐỊNH'
                  : isRejected
                  ? 'YÊU CẦU BẢO HÀNH CỦA NTD ĐÃ BỊ TỪ CHỐI'
                  : 'YÊU CẦU ĐỐI CHẤT: NHÀ TUYỂN DỤNG KHAI BÁO SỰ CỐ TIẾP NHẬN'}
              </span>
            </div>
            <p className="mt-1 text-xs text-amber-900 leading-relaxed">
              Lý do NTD báo cáo: <strong>{claim.reason === 'NO_SHOW' ? 'Ứng viên không đến nhận việc ngày đầu' : 'Nghỉ việc ngang (dưới 30 ngày)'}</strong>
              {claim.note && (
                <> — Diễn giải: <em>&quot;{claim.note}&quot;</em></>
              )}
            </p>
            <p className="mt-0.5 text-2xs">
              {hasResponded ? (
                <span className="text-emerald-700 font-bold">
                  ✓ Bạn đã gửi ý kiến đối chất ({claim.candidateRespondedAt ? new Date(claim.candidateRespondedAt).toLocaleDateString('vi-VN') : 'gần đây'}). Ban Quản trị đang đối soát công tâm.
                </span>
              ) : (
                <span className="font-extrabold text-rose-700">
                  ⏱️ Bạn có 48 giờ để gửi phản hồi đối chất bảo vệ uy tín và quyền lợi trước khi Admin ra phán quyết.
                </span>
              )}
            </p>
          </div>

          <button
            type="button"
            onClick={() => setShowWarrantyFeedbackModal(true)}
            className={`inline-flex items-center justify-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold text-white shadow-xs transition-colors shrink-0 cursor-pointer ${
              hasResponded
                ? 'bg-slate-700 hover:bg-slate-800'
                : 'bg-amber-600 hover:bg-amber-700 animate-pulse'
            }`}
          >
            <MessageSquare className="size-3.5" />
            {hasResponded ? 'Xem Lại Ý Kiến Đối Chất' : '⚡ Gửi Ý Kiến Đối Chất Ngay'}
          </button>
        </div>
      </div>
    );
  };

  const renderDisputeBanner = () => {
    if (!disputes || disputes.length === 0) return null;
    const activeDispute = disputes[0];
    const isResolved = activeDispute.status === 'RESOLVED';
    const isDismissed = activeDispute.status === 'DISMISSED';

    return (
      <div
        className={`p-4 rounded-2xl border transition-all mb-4 ${
          isResolved
            ? 'bg-emerald-50/90 border-emerald-300 text-emerald-950 shadow-xs'
            : isDismissed
            ? 'bg-slate-50 border-slate-300 text-slate-800'
            : 'bg-amber-50/90 border-amber-300 text-amber-950 shadow-xs'
        }`}
      >
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="space-y-1">
            <div className="flex flex-wrap items-center gap-2">
              <ShieldAlert className={`size-4.5 ${isResolved ? 'text-emerald-600' : 'text-amber-600'}`} />
              <span className="font-mono text-2xs font-extrabold bg-white px-2 py-0.5 rounded border border-slate-200">
                {activeDispute.disputeNumber}
              </span>
              <span className="text-xs font-bold">
                {isResolved
                  ? 'BAN QUẢN TRỊ ĐÃ BAN HÀNH PHÁN QUYẾT'
                  : isDismissed
                  ? 'KHIẾU NẠI ĐÃ ĐƯỢC XỬ LÝ (BÁC BỎ)'
                  : 'HỒ SƠ ĐANG CÓ KHIẾU NẠI ĐANG XÁC MINH'}
              </span>
            </div>
            {activeDispute.adminResolution ? (
              <p className="text-xs text-slate-700 line-clamp-2 italic">
                &quot;{activeDispute.adminResolution}&quot;
              </p>
            ) : (
              <p className="text-xs text-slate-600 line-clamp-1">
                Tiêu đề: {activeDispute.title} - Ban Quản Trị đang thu thập chứng cứ và làm việc với Nhà tuyển dụng.
              </p>
            )}
          </div>

          <button
            type="button"
            onClick={() => {
              setSelectedDisputeId(activeDispute.id);
              setShowDisputeDetailModal(true);
            }}
            className={`inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-bold text-white shadow-xs transition-colors shrink-0 cursor-pointer ${
              isResolved
                ? 'bg-emerald-700 hover:bg-emerald-800'
                : 'bg-[#2563EB] hover:bg-blue-700'
            }`}
          >
            Xem Chi Tiết & Phản Hồi
            <ArrowRight className="size-3.5" />
          </button>
        </div>
      </div>
    );
  };

  const isExpired = new Date() > new Date(offer.expiresAt);
  const startDateStr = new Date(offer.startDate).toLocaleDateString('vi-VN', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
  const expiryDateStr = new Date(offer.expiresAt).toLocaleDateString('vi-VN', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });

  const handleAccept = async () => {
    setSubmitting(true);
    try {
      await acceptOffer(token, offer.id);
      toast.success('Bạn đã đồng ý Thư mời nhận việc (Offer) thành công! Vui lòng chờ bản hợp đồng lao động để hoàn tất ký kết.');
      setShowAcceptModal(false);
      router.refresh();
      if (onOfferResponded) await onOfferResponded();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Không thể chấp nhận Offer');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDecline = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      await declineOffer(token, offer.id, {
        reason: declineReason,
        note: declineNote.trim() || undefined,
      });
      toast.info('Bạn đã gửi phản hồi từ chối Offer tới nhà tuyển dụng.');
      setShowDeclineModal(false);
      router.refresh();
      if (onOfferResponded) await onOfferResponded();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Không thể từ chối Offer');
    } finally {
      setSubmitting(false);
    }
  };

  // 1. Accepted state
  if (offer.status === 'ACCEPTED') {
    const isContractSigned = contract?.status === 'SIGNED';

    return (
      <div
        className={`mt-4 rounded-2xl border p-5 shadow-sm ${
          isContractSigned
            ? 'border-emerald-300 bg-gradient-to-r from-emerald-50 to-teal-50/40'
            : 'border-blue-300 bg-gradient-to-r from-blue-50/90 to-indigo-50/40'
        }`}
      >
        <div className="flex items-start gap-4">
          <div
            className={`flex size-11 shrink-0 items-center justify-center rounded-xl text-white shadow-sm ${
              isContractSigned ? 'bg-emerald-600' : 'bg-[#2563EB]'
            }`}
          >
            <CheckCircle2 className="size-6" />
          </div>
          <div className="flex-1">
            <div className="flex flex-wrap items-center gap-2">
              <h3
                className={`text-base font-extrabold ${
                  isContractSigned ? 'text-emerald-950' : 'text-blue-950'
                }`}
              >
                {isContractSigned
                  ? 'Bạn đã hoàn tất ký hợp đồng và chính thức nhận việc!'
                  : 'Bạn đã chấp thuận Thư mời nhận việc (Offer)!'}
              </h3>
              <span
                className={`rounded-full px-2.5 py-0.5 text-xs font-black text-white ${
                  isContractSigned ? 'bg-emerald-600' : 'bg-[#2563EB]'
                }`}
              >
                {isContractSigned
                  ? 'ĐÃ TUYỂN DỤNG (HIRED)'
                  : 'ĐÃ ĐỒNG Ý OFFER (CHỜ KÝ HỢP ĐỒNG)'}
              </span>
            </div>
            <p
              className={`mt-1 text-xs leading-relaxed ${
                isContractSigned ? 'text-emerald-800' : 'text-slate-700'
              }`}
            >
              {isContractSigned ? (
                <>
                  Chào mừng bạn chính thức gia nhập <strong>{companyName || 'Công ty'}</strong> ở vị trí <strong>{jobTitle}</strong>! Hợp đồng lao động đã có hiệu lực pháp lý và nhà tuyển dụng sẽ liên hệ chuẩn bị đón tiếp bạn vào ngày làm việc đầu tiên ({startDateStr}).
                </>
              ) : (
                <>
                  Bạn đã đồng ý với các điều khoản đãi ngộ trong Thư mời nhận việc cho vị trí <strong>{jobTitle}</strong> tại <strong>{companyName || 'Công ty'}</strong>. 
                  Bước tiếp theo: Nhà tuyển dụng sẽ gửi bản Hợp đồng lao động chính thức để hai bên tiến hành ký kết trước ngày nhận việc ({startDateStr}).
                </>
              )}
            </p>
            <div
              className={`mt-3 flex flex-wrap gap-4 text-xs font-semibold ${
                isContractSigned ? 'text-emerald-900' : 'text-blue-900'
              }`}
            >
              <span>Lương thỏa thuận: <strong>{Number(offer.salary).toLocaleString('vi-VN')} {offer.currency} / tháng</strong></span>
              <span>•</span>
              <span>Ngày onboard dự kiến: <strong>{startDateStr}</strong></span>
            </div>

            {/* Warranty Claim Alert Banner if exists */}
            {renderWarrantyClaimBanner()}

            {/* Dispute Banner if exists */}
            {renderDisputeBanner()}

            {/* Contract Section */}
            <div className="mt-4 pt-4 border-t border-emerald-200/60">
              {contract ? (
                <div className="rounded-xl border border-blue-200 bg-white p-4 shadow-sm">
                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                    <div className="flex items-start gap-3">
                      <div className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-blue-100 text-blue-700">
                        <FileText className="size-5" />
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <h4 className="text-xs font-bold text-slate-900">
                            Hợp đồng lao động: {contract.contractNumber}
                          </h4>
                          <span
                            className={`rounded-full px-2 py-0.5 text-2xs font-bold ${
                              contract.status === 'SIGNED'
                                ? 'bg-emerald-100 text-emerald-800'
                                : contract.status === 'PENDING_REVIEW'
                                ? 'bg-amber-100 text-amber-800 animate-pulse'
                                : contract.status === 'REVISION_REQUESTED'
                                ? 'bg-rose-100 text-rose-800'
                                : 'bg-blue-100 text-blue-800'
                            }`}
                          >
                            {contract.status === 'SIGNED'
                              ? 'ĐÃ KÝ KẾT'
                              : contract.status === 'PENDING_REVIEW'
                              ? 'CHỜ BẠN DUYỆT'
                              : contract.status === 'REVISION_REQUESTED'
                              ? 'ĐANG YÊU CẦU SỬA'
                              : contract.status === 'APPROVED'
                              ? 'ĐÃ THỐNG NHẤT'
                              : 'BẢN NHÁP'}
                          </span>
                        </div>
                        <p className="mt-0.5 text-2xs text-slate-500">
                          {contract.status === 'PENDING_REVIEW'
                            ? 'Nhà tuyển dụng đã gửi bản dự thảo hợp đồng. Vui lòng xem xét các điều khoản.'
                            : contract.status === 'SIGNED'
                            ? 'Hợp đồng lao động đã có hiệu lực chính thức.'
                            : contract.status === 'REVISION_REQUESTED'
                            ? `Bạn đã gửi phản hồi: "${contract.latestRevisionNote || 'Đang chờ HR cập nhật'}"`
                            : 'Điều khoản đã được ghi nhận trên hệ thống.'}
                        </p>
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={() => setShowContractModal(true)}
                      className="inline-flex items-center justify-center gap-1.5 rounded-xl bg-[#2563EB] px-4 py-2 text-xs font-bold text-white shadow-sm transition hover:bg-blue-700 shrink-0"
                    >
                      <FileCheck className="size-3.5" />
                      {contract.status === 'PENDING_REVIEW'
                        ? 'Xem xét & Ký hợp đồng'
                        : 'Xem chi tiết hợp đồng'}
                      <ArrowRight className="size-3.5" />
                    </button>
                  </div>
                </div>
              ) : (
                <div className="flex items-center justify-between rounded-xl border border-dashed border-emerald-300 bg-emerald-100/30 p-3 text-xs text-emerald-900">
                  <span className="flex items-center gap-2">
                    <FileText className="size-4 text-emerald-700" />
                    Nhà tuyển dụng đang soạn thảo bản Hợp đồng lao động chính thức cho bạn...
                  </span>
                </div>
              )}
            </div>

            {/* Transparency & Dispute Action */}
            <div className="mt-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 pt-3 border-t border-emerald-200/60 text-2xs text-slate-500">
              <span className="flex items-center gap-1.5 text-emerald-800">
                <ShieldCheck className="size-3.5 text-blue-600 shrink-0" />
                Hợp đồng & cam kết tuân thủ Bộ luật Lao động 2019 và Tiêu chuẩn tuyển dụng minh bạch.
              </span>
              <div className="flex items-center gap-3">
                {disputes.length > 0 && (
                  <button
                    type="button"
                    onClick={() => {
                      setSelectedDisputeId(disputes[0].id);
                      setShowDisputeDetailModal(true);
                    }}
                    className="inline-flex items-center gap-1 font-bold text-[#2563EB] hover:text-blue-700 hover:underline shrink-0"
                  >
                    <FileText className="size-3.5" />
                    Xem khiếu nại ({disputes[0].disputeNumber})
                  </button>
                )}
                <button
                  type="button"
                  onClick={() => setShowDisputeModal(true)}
                  className="inline-flex items-center gap-1 font-bold text-rose-600 hover:text-rose-700 hover:underline shrink-0"
                >
                  <ShieldAlert className="size-3.5" />
                  Khiếu nại / Báo cáo vi phạm
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Contract Review Modal */}
        {contract && (
          <CandidateContractReviewModal
            isOpen={showContractModal}
            onClose={() => setShowContractModal(false)}
            token={token}
            contract={contract}
            candidateName={offer.contactName || 'Ứng viên'}
            onSuccess={async () => {
              await loadContract();
              if (onOfferResponded) await onOfferResponded();
            }}
          />
        )}

        {/* Dispute Modal */}
        <ReportDisputeModal
          isOpen={showDisputeModal}
          onClose={() => {
            setShowDisputeModal(false);
            loadDisputes();
          }}
          token={token}
          applicationId={offer.applicationId}
          contractId={contract?.id}
          jobTitle={jobTitle}
          companyName={companyName}
        />

        {/* Dispute Detail / Response Modal */}
        <DisputeDetailModal
          isOpen={showDisputeDetailModal}
          onClose={() => setShowDisputeDetailModal(false)}
          disputeId={selectedDisputeId}
          token={token}
          currentUserRole="CANDIDATE"
          onDisputeUpdated={loadDisputes}
        />

        {/* Candidate Warranty Feedback Modal */}
        {showWarrantyFeedbackModal && (contract || warrantyStatus?.existingClaim?.contractId) && (
          <CandidateWarrantyFeedbackModal
            isOpen={showWarrantyFeedbackModal}
            onClose={() => setShowWarrantyFeedbackModal(false)}
            token={token}
            contractId={contract?.id || warrantyStatus!.existingClaim!.contractId}
            contractNumber={contract?.contractNumber || 'HĐLĐ'}
            jobTitle={jobTitle}
            existingClaim={warrantyStatus?.existingClaim}
            onSuccess={async () => {
              const cid = contract?.id || warrantyStatus?.existingClaim?.contractId;
              if (cid) {
                const updated = await getContractWarrantyStatus(token, cid);
                setWarrantyStatus(updated);
              }
              if (onOfferResponded) await onOfferResponded();
            }}
          />
        )}
      </div>
    );
  }


  // 2. Declined state
  if (offer.status === 'DECLINED') {
    return (
      <div className="mt-4 rounded-2xl border border-slate-200 bg-slate-50 p-4">
        <div className="flex items-center gap-3">
          <div className="flex size-9 shrink-0 items-center justify-center rounded-xl bg-slate-200 text-slate-600">
            <XCircle className="size-5" />
          </div>
          <div>
            <h4 className="text-xs font-bold text-slate-800">
              Bạn đã từ chối thư mời nhận việc cho vị trí này
            </h4>
            <p className="text-2xs text-slate-500">
              Lý do ghi nhận: {offer.declineReason || 'Không nêu'}. Cảm ơn bạn đã đồng hành trong quy trình ứng tuyển!
            </p>
          </div>
        </div>
      </div>
    );
  }

  // 3. Cancelled / Revoked state
  if (offer.status === 'CANCELLED') {
    return (
      <div className="mt-4 rounded-2xl border border-amber-200 bg-amber-50/50 p-4">
        <div className="flex items-center gap-3">
          <div className="flex size-9 shrink-0 items-center justify-center rounded-xl bg-amber-100 text-amber-700">
            <AlertTriangle className="size-5" />
          </div>
          <div>
            <h4 className="text-xs font-bold text-amber-900">
              Thư mời nhận việc đã được thu hồi
            </h4>
            <p className="text-2xs text-amber-700">
              Nhà tuyển dụng đã thu hồi thư mời nhận việc này. Vui lòng liên hệ nhà tuyển dụng để biết thêm chi tiết.
            </p>
          </div>
        </div>
      </div>
    );
  }

  // 4. Expired state
  if (offer.status === 'EXPIRED' || (offer.status === 'PENDING' && isExpired)) {
    return (
      <div className="mt-4 rounded-2xl border border-red-200 bg-red-50/50 p-4">
        <div className="flex items-center gap-3">
          <div className="flex size-9 shrink-0 items-center justify-center rounded-xl bg-red-100 text-red-600">
            <Clock className="size-5" />
          </div>
          <div className="flex-1">
            <h4 className="text-xs font-bold text-red-900">
              Thư mời nhận việc đã hết hạn phản hồi ({expiryDateStr})
            </h4>
            <p className="text-2xs text-red-700 mt-0.5">
              Thời hạn chót để phản hồi đề nghị này đã qua. Nếu bạn vẫn quan tâm tới vị trí, vui lòng chủ động liên hệ trực tiếp với người phụ trách tuyển dụng:
            </p>
            {(offer.contactName || offer.contactPhone || offer.contactEmail) && (
              <div className="mt-2 flex flex-wrap items-center gap-3 text-2xs font-semibold text-slate-700">
                {offer.contactName && <span>Phụ trách: {offer.contactName}</span>}
                {offer.contactPhone && (
                  <a href={`tel:${offer.contactPhone}`} className="text-[#2563EB] hover:underline">
                    {offer.contactPhone}
                  </a>
                )}
                {offer.contactEmail && (
                  <a href={`mailto:${offer.contactEmail}`} className="text-[#2563EB] hover:underline">
                    {offer.contactEmail}
                  </a>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    );
  }

  // 3. Pending Offer - Official ATS Decision View
  return (
    <div className="mt-5 rounded-2xl border-2 border-blue-400/80 bg-white p-6 shadow-md transition-all">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 border-b border-slate-100 pb-4">
        <div className="flex items-center gap-3">
          <div className="flex size-11 items-center justify-center rounded-xl bg-[#2563EB] text-white shadow-sm">
            <Gift className="size-6" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="rounded-full bg-[#EFF6FF] border border-blue-200 px-2.5 py-0.5 text-2xs font-extrabold uppercase tracking-wide text-[#2563EB]">
                Thư Mời Nhận Việc (Official Offer)
              </span>
              {isExpired ? (
                <span className="rounded-full bg-red-100 px-2 py-0.5 text-2xs font-bold text-red-700">
                  Đã hết hạn phản hồi
                </span>
              ) : (
                <span className="rounded-full bg-amber-50 border border-amber-200 px-2.5 py-0.5 text-2xs font-bold text-amber-700 flex items-center gap-1">
                  <Clock className="size-3" />
                  Hạn chót: {expiryDateStr}
                </span>
              )}
            </div>
            <h3 className="mt-1 text-base font-extrabold text-[#1F2937]">
              Chúc mừng bạn đã nhận được Đề nghị làm việc tại {companyName || 'Công ty'}!
            </h3>
          </div>
        </div>
      </div>

      {/* Dispute Banner if exists */}
      {renderDisputeBanner()}

      {/* Offer Terms Breakdown */}
      <div className="mt-5 grid grid-cols-1 sm:grid-cols-3 gap-4">
        {/* Salary */}
        <div className="rounded-xl border border-slate-200 bg-[#EFF6FF]/60 p-4">
          <div className="flex items-center gap-2 text-xs font-bold text-slate-500 mb-1">
            <DollarSign className="size-4 text-[#2563EB]" />
            Mức Lương Đề Nghị
          </div>
          <div className="text-xl font-black text-[#2563EB]">
            {Number(offer.salary).toLocaleString('vi-VN')} {offer.currency}
          </div>
          <div className="text-2xs font-semibold text-slate-500 mt-0.5">
            / {offer.salaryPeriod === 'MONTHLY' ? 'Tháng' : 'Năm'} (Lương cơ bản)
          </div>
        </div>

        {/* Start Date */}
        <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
          <div className="flex items-center gap-2 text-xs font-bold text-slate-500 mb-1">
            <Calendar className="size-4 text-[#2563EB]" />
            Ngày Đi Làm Dự Kiến
          </div>
          <div className="text-sm font-extrabold text-slate-800">
            {startDateStr}
          </div>
          <div className="text-2xs font-medium text-slate-500 mt-1">
            Bắt đầu làm việc (Onboarding)
          </div>
        </div>

        {/* Work Model & Location */}
        <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
          <div className="flex items-center gap-2 text-xs font-bold text-slate-500 mb-1">
            <MapPin className="size-4 text-[#2563EB]" />
            Hình Thức & Địa Điểm
          </div>
          <div className="text-sm font-extrabold text-slate-800">
            {offer.workType === 'HYBRID' ? 'Hybrid (Linh hoạt)' : offer.workType === 'REMOTE' ? 'Remote (Từ xa)' : 'On-site (Tại văn phòng)'}
          </div>
          <div className="text-2xs font-medium text-slate-500 mt-1 truncate">
            {offer.workLocation || 'Theo phân bổ của công ty'}
          </div>
        </div>
      </div>

      {/* Benefits & Notes */}
      {(offer.benefits || offer.notes) && (
        <div className="mt-4 rounded-xl border border-slate-100 bg-slate-50/70 p-4 space-y-3">
          {offer.benefits && (
            <div>
              <h4 className="text-xs font-bold text-slate-700">Chế độ đãi ngộ & Phúc lợi:</h4>
              <p className="mt-1 text-xs leading-relaxed text-slate-600 whitespace-pre-line">
                {offer.benefits}
              </p>
            </div>
          )}
          {offer.notes && (
            <div>
              <h4 className="text-xs font-bold text-slate-700">Lời nhắn từ Nhà tuyển dụng:</h4>
              <p className="mt-1 text-xs leading-relaxed text-slate-600 whitespace-pre-line">
                {offer.notes}
              </p>
            </div>
          )}
        </div>
      )}

      {/* Direct HR Contact Box (Crucial for ATS: If candidate wants to negotiate, call HR directly!) */}
      <div className="mt-5 rounded-xl border border-blue-200 bg-gradient-to-r from-blue-50/60 to-indigo-50/40 p-4">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div>
            <h4 className="text-xs font-extrabold text-[#1F2937] flex items-center gap-2">
              <Phone className="size-4 text-[#2563EB]" />
              Bạn cần trao đổi thêm về ngày nhận việc hoặc điều khoản Offer?
            </h4>
            <p className="mt-0.5 text-2xs text-slate-600">
              Vui lòng liên hệ trực tiếp với người phụ trách tuyển dụng trước khi bấm phản hồi chính thức:
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-3 text-xs font-bold">
            {offer.contactName && (
              <span className="flex items-center gap-1 text-slate-700">
                <User className="size-3.5 text-slate-400" />
                {offer.contactName}
              </span>
            )}
            {offer.contactPhone && (
              <a
                href={`tel:${offer.contactPhone}`}
                className="inline-flex items-center gap-1 rounded-lg bg-white border border-blue-200 px-2.5 py-1 text-xs font-bold text-[#2563EB] hover:bg-blue-50 transition-colors"
              >
                <Phone className="size-3 text-[#2563EB]" />
                {offer.contactPhone}
              </a>
            )}
            {offer.contactEmail && (
              <a
                href={`mailto:${offer.contactEmail}`}
                className="inline-flex items-center gap-1 rounded-lg bg-white border border-blue-200 px-2.5 py-1 text-xs font-bold text-[#2563EB] hover:bg-blue-50 transition-colors"
              >
                <Mail className="size-3 text-[#2563EB]" />
                {offer.contactEmail}
              </a>
            )}
          </div>
        </div>
      </div>

      {/* Decision Actions (Decisive ATS standard: Accept or Decline) */}
      <div className="mt-6 flex flex-col sm:flex-row items-center justify-end gap-3 pt-4 border-t border-slate-100">
        <button
          type="button"
          disabled={isExpired}
          onClick={() => setShowDeclineModal(true)}
          className="w-full sm:w-auto rounded-xl border border-slate-200 bg-white px-5 py-2.5 text-xs font-bold text-slate-600 hover:bg-slate-50 hover:text-red-600 disabled:opacity-50 transition-colors"
        >
          Từ Chối Offer
        </button>
        <button
          type="button"
          disabled={isExpired}
          onClick={() => setShowAcceptModal(true)}
          className="w-full sm:w-auto inline-flex items-center justify-center gap-2 rounded-xl bg-[#2563EB] px-6 py-2.5 text-xs font-extrabold text-white shadow-md hover:bg-blue-700 active:bg-blue-800 disabled:opacity-50 transition-all"
        >
          <CheckCircle2 className="size-4" />
          Chấp Nhận Thư Mời (Accept Offer)
        </button>
      </div>

      {/* Modal: Confirm Accept */}
      {showAcceptModal && (
        <div className="fixed inset-0 z-[110] flex items-center justify-center bg-slate-950/60 p-4 backdrop-blur-sm animate-in fade-in duration-200 font-sans">
          <div className="w-full max-w-md rounded-2xl border border-slate-200 bg-white p-6 shadow-2xl space-y-4">
            <div className="flex items-center gap-3">
              <div className="flex size-12 items-center justify-center rounded-2xl bg-blue-100 text-[#2563EB]">
                <Sparkles className="size-6" />
              </div>
              <div>
                <h3 className="text-base font-extrabold text-slate-900">
                  Xác Nhận Đồng Ý Offer
                </h3>
                <p className="text-xs text-slate-500">
                  Vị trí: <strong>{jobTitle}</strong>
                </p>
              </div>
            </div>

            <p className="text-xs leading-relaxed text-slate-600">
              Bạn xác nhận đồng ý với mức đãi ngộ <strong>{Number(offer.salary).toLocaleString('vi-VN')} {offer.currency} / tháng</strong> và dự kiến bắt đầu làm việc từ ngày <strong>{startDateStr}</strong>. Nhà tuyển dụng sẽ tiến hành soạn thảo bản Hợp đồng lao động chính thức để hai bên ký kết trước khi nhận việc.
            </p>

            <div className="flex items-center justify-end gap-3 pt-3">
              <button
                type="button"
                disabled={submitting}
                onClick={() => setShowAcceptModal(false)}
                className="rounded-xl border border-slate-200 px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-50"
              >
                Cân nhắc thêm
              </button>
              <button
                type="button"
                disabled={submitting}
                onClick={handleAccept}
                className="inline-flex items-center gap-2 rounded-xl bg-[#2563EB] px-5 py-2 text-xs font-bold text-white shadow-sm hover:bg-blue-700 disabled:opacity-50"
              >
                {submitting ? <Loader2 className="size-4 animate-spin" /> : <CheckCircle2 className="size-4" />}
                Xác Nhận Đồng Ý Offer
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal: Confirm Decline with reason */}
      {showDeclineModal && (
        <div className="fixed inset-0 z-[110] flex items-center justify-center bg-slate-950/60 p-4 backdrop-blur-sm animate-in fade-in duration-200 font-sans">
          <div className="w-full max-w-md rounded-2xl border border-slate-200 bg-white p-6 shadow-2xl space-y-4">
            <div className="flex items-center gap-3">
              <div className="flex size-11 items-center justify-center rounded-2xl bg-rose-100 text-rose-600">
                <AlertTriangle className="size-5" />
              </div>
              <div>
                <h3 className="text-base font-extrabold text-slate-900">
                  Từ Chối Thư Mời Nhận Việc
                </h3>
                <p className="text-xs text-slate-500">
                  Bạn có chắc chắn muốn từ chối đề nghị này?
                </p>
              </div>
            </div>

            <form onSubmit={handleDecline} className="space-y-3 pt-2">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Lý do chính khiến bạn từ chối:
                </label>
                <select
                  value={declineReason}
                  onChange={(e) => setDeclineReason(e.target.value)}
                  className="w-full rounded-xl border border-slate-200 bg-white p-2.5 text-xs font-semibold text-slate-800 outline-none focus:border-rose-500"
                >
                  <option value="SALARY_NOT_MATCH">Mức lương / đãi ngộ chưa đạt kỳ vọng</option>
                  <option value="ACCEPTED_ANOTHER_OFFER">Đã nhận lời mời từ công ty khác</option>
                  <option value="LOCATION_NOT_SUITABLE">Địa điểm hoặc hình thức làm việc không thuận tiện</option>
                  <option value="PERSONAL_REASON">Kế hoạch cá nhân thay đổi</option>
                  <option value="OTHER">Lý do khác</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Lời nhắn gửi nhà tuyển dụng (không bắt buộc):
                </label>
                <textarea
                  rows={2}
                  placeholder="Chia sẻ thêm nếu bạn muốn giữ liên lạc cho các cơ hội sau..."
                  value={declineNote}
                  onChange={(e) => setDeclineNote(e.target.value)}
                  className="w-full rounded-xl border border-slate-200 bg-white p-2.5 text-xs text-slate-800 outline-none focus:border-rose-500"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-3">
                <button
                  type="button"
                  disabled={submitting}
                  onClick={() => setShowDeclineModal(false)}
                  className="rounded-xl border border-slate-200 px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-50"
                >
                  Quay lại
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="inline-flex items-center gap-2 rounded-xl bg-rose-600 px-5 py-2 text-xs font-bold text-white shadow-sm hover:bg-rose-700 disabled:opacity-50"
                >
                  {submitting ? <Loader2 className="size-4 animate-spin" /> : <XCircle className="size-4" />}
                  Xác Nhận Từ Chối
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
      {/* Additional transparency footer in pending state */}
      <div className="mt-3 flex items-center justify-between text-2xs text-slate-400">
        <span className="flex items-center gap-1">
          <ShieldCheck className="size-3.5 text-blue-500" />
          Mọi quyết định và tiến trình offer đều được lưu vết bảo vệ hai bên.
        </span>
        <div className="flex items-center gap-3">
          {disputes.length > 0 && (
            <button
              type="button"
              onClick={() => {
                setSelectedDisputeId(disputes[0].id);
                setShowDisputeDetailModal(true);
              }}
              className="inline-flex items-center gap-1 font-bold text-[#2563EB] hover:text-blue-700 hover:underline transition-colors cursor-pointer"
            >
              <FileText className="size-3.5" />
              Xem khiếu nại ({disputes[0].disputeNumber})
            </button>
          )}
          <button
            type="button"
            onClick={() => setShowDisputeModal(true)}
            className="inline-flex items-center gap-1 font-semibold text-slate-500 hover:text-rose-600 transition-colors cursor-pointer"
          >
            <ShieldAlert className="size-3.5" />
            Khiếu nại offer này
          </button>
        </div>
      </div>

      {/* Dispute Modal for pending state */}
      <ReportDisputeModal
        isOpen={showDisputeModal}
        onClose={() => {
          setShowDisputeModal(false);
          loadDisputes();
        }}
        token={token}
        applicationId={offer.applicationId}
        contractId={contract?.id}
        jobTitle={jobTitle}
        companyName={companyName}
      />

      {/* Dispute Detail / Response Modal */}
      <DisputeDetailModal
        isOpen={showDisputeDetailModal}
        onClose={() => setShowDisputeDetailModal(false)}
        disputeId={selectedDisputeId}
        token={token}
        currentUserRole="CANDIDATE"
        onDisputeUpdated={loadDisputes}
      />

      {/* Candidate Warranty Feedback Modal */}
      {showWarrantyFeedbackModal && (contract || warrantyStatus?.existingClaim?.contractId) && (
        <CandidateWarrantyFeedbackModal
          isOpen={showWarrantyFeedbackModal}
          onClose={() => setShowWarrantyFeedbackModal(false)}
          token={token}
          contractId={contract?.id || warrantyStatus!.existingClaim!.contractId}
          contractNumber={contract?.contractNumber || 'HĐLĐ'}
          jobTitle={jobTitle}
          existingClaim={warrantyStatus?.existingClaim}
          onSuccess={async () => {
            const cid = contract?.id || warrantyStatus?.existingClaim?.contractId;
            if (cid) {
              const updated = await getContractWarrantyStatus(token, cid);
              setWarrantyStatus(updated);
            }
            if (onOfferResponded) await onOfferResponded();
          }}
        />
      )}
    </div>
  );
}

