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
} from 'lucide-react';
import { toast } from 'sonner';
import {
  type OfferData,
  acceptOffer,
  declineOffer,
} from '@/lib/offer-api';

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
      toast.success('Chúc mừng bạn đã đồng ý nhận việc thành công! Chào mừng gia nhập đội ngũ.');
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
    return (
      <div className="mt-4 rounded-2xl border border-emerald-300 bg-gradient-to-r from-emerald-50 to-teal-50/40 p-5 shadow-sm">
        <div className="flex items-start gap-4">
          <div className="flex size-11 shrink-0 items-center justify-center rounded-xl bg-emerald-600 text-white shadow-sm">
            <CheckCircle2 className="size-6" />
          </div>
          <div className="flex-1">
            <div className="flex flex-wrap items-center gap-2">
              <h3 className="text-base font-extrabold text-emerald-950">
                Bạn đã chính thức đồng ý nhận việc!
              </h3>
              <span className="rounded-full bg-emerald-600 px-2.5 py-0.5 text-xs font-black text-white">
                ĐÃ TUYỂN DỤNG (HIRED)
              </span>
            </div>
            <p className="mt-1 text-xs leading-relaxed text-emerald-800">
              Chào mừng bạn gia nhập <strong>{companyName || 'Công ty'}</strong> ở vị trí <strong>{jobTitle}</strong>. 
              Nhà tuyển dụng đã nhận được phản hồi của bạn và sẽ liên hệ để chuẩn bị cho ngày làm việc đầu tiên ({startDateStr}).
            </p>
            <div className="mt-3 flex flex-wrap gap-4 text-xs font-semibold text-emerald-900">
              <span>Lương thỏa thuận: <strong>{Number(offer.salary).toLocaleString('vi-VN')} {offer.currency} / tháng</strong></span>
              <span>•</span>
              <span>Ngày onboard: <strong>{startDateStr}</strong></span>
            </div>
          </div>
        </div>
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
          Đồng Ý Nhận Việc (Accept Offer)
        </button>
      </div>

      {/* Modal: Confirm Accept */}
      {showAcceptModal && (
        <div className="fixed inset-0 z-[110] flex items-center justify-center bg-slate-950/60 p-4 backdrop-blur-sm animate-in fade-in duration-200 font-sans">
          <div className="w-full max-w-md rounded-2xl border border-slate-200 bg-white p-6 shadow-2xl space-y-4">
            <div className="flex items-center gap-3">
              <div className="flex size-12 items-center justify-center rounded-2xl bg-emerald-100 text-emerald-600">
                <Sparkles className="size-6" />
              </div>
              <div>
                <h3 className="text-base font-extrabold text-slate-900">
                  Xác Nhận Nhận Việc
                </h3>
                <p className="text-xs text-slate-500">
                  Vị trí: <strong>{jobTitle}</strong>
                </p>
              </div>
            </div>

            <p className="text-xs leading-relaxed text-slate-600">
              Bạn xác nhận đồng ý với mức đãi ngộ <strong>{Number(offer.salary).toLocaleString('vi-VN')} {offer.currency} / tháng</strong> và cam kết bắt đầu làm việc từ ngày <strong>{startDateStr}</strong>.
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
                className="inline-flex items-center gap-2 rounded-xl bg-emerald-600 px-5 py-2 text-xs font-bold text-white shadow-sm hover:bg-emerald-700 disabled:opacity-50"
              >
                {submitting ? <Loader2 className="size-4 animate-spin" /> : <CheckCircle2 className="size-4" />}
                Chính Thức Đồng Ý
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
    </div>
  );
}
