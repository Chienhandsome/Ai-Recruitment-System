'use client';

import React, { useState, useEffect } from 'react';
import {
  X,
  Gift,
  Calendar,
  Clock,
  DollarSign,
  MapPin,
  Building2,
  Phone,
  Mail,
  User,
  Sparkles,
  Loader2,
  FileCheck2,
} from 'lucide-react';
import { toast } from 'sonner';
import {
  type OfferData,
  createOffer,
  updateOffer,
} from '@/lib/offer-api';

interface CreateOrEditOfferModalProps {
  isOpen: boolean;
  onClose: () => void;
  token: string;
  applicationId: string;
  candidateName: string;
  jobTitle: string;
  existingOffer?: OfferData | null;
  onSuccess: () => void | Promise<void>;
  defaultRecruiterInfo?: {
    fullName?: string;
    email?: string;
    phone?: string;
  };
}

export function CreateOrEditOfferModal({
  isOpen,
  onClose,
  token,
  applicationId,
  candidateName,
  jobTitle,
  existingOffer,
  onSuccess,
  defaultRecruiterInfo,
}: CreateOrEditOfferModalProps) {
  const getDefaultStartDate = () => {
    const d = new Date();
    d.setDate(d.getDate() + 14); // 2 weeks ahead
    return d.toISOString().split('T')[0];
  };

  const getDefaultExpiryDate = () => {
    const d = new Date();
    d.setDate(d.getDate() + 7); // 7 days ahead
    return d.toISOString().split('T')[0];
  };

  const [salary, setSalary] = useState<string>('');
  const [currency, setCurrency] = useState<string>('VND');
  const [salaryPeriod, setSalaryPeriod] = useState<string>('MONTHLY');
  const [startDate, setStartDate] = useState<string>(getDefaultStartDate());
  const [expiresAt, setExpiresAt] = useState<string>(getDefaultExpiryDate());
  const [workType, setWorkType] = useState<string>('HYBRID');
  const [workLocation, setWorkLocation] = useState<string>('');
  const [benefits, setBenefits] = useState<string>('');
  const [notes, setNotes] = useState<string>('');
  const [contactName, setContactName] = useState<string>('');
  const [contactEmail, setContactEmail] = useState<string>('');
  const [contactPhone, setContactPhone] = useState<string>('');
  const [submitting, setSubmitting] = useState<boolean>(false);

  useEffect(() => {
    if (isOpen) {
      if (existingOffer) {
        setSalary(String(existingOffer.salary || ''));
        setCurrency(existingOffer.currency || 'VND');
        setSalaryPeriod(existingOffer.salaryPeriod || 'MONTHLY');
        setStartDate(existingOffer.startDate ? existingOffer.startDate.split('T')[0] : getDefaultStartDate());
        setExpiresAt(existingOffer.expiresAt ? existingOffer.expiresAt.split('T')[0] : getDefaultExpiryDate());
        setWorkType(existingOffer.workType || 'HYBRID');
        setWorkLocation(existingOffer.workLocation || '');
        setBenefits(existingOffer.benefits || '');
        setNotes(existingOffer.notes || '');
        setContactName(existingOffer.contactName || defaultRecruiterInfo?.fullName || '');
        setContactEmail(existingOffer.contactEmail || defaultRecruiterInfo?.email || '');
        setContactPhone(existingOffer.contactPhone || defaultRecruiterInfo?.phone || '');
      } else {
        setSalary('');
        setCurrency('VND');
        setSalaryPeriod('MONTHLY');
        setStartDate(getDefaultStartDate());
        setExpiresAt(getDefaultExpiryDate());
        setWorkType('HYBRID');
        setWorkLocation('');
        setBenefits('Bảo hiểm PVI theo chính sách công ty, thưởng tháng 13, 14 ngày phép năm, review lương định kỳ.');
        setNotes(`Chào mừng bạn gia nhập đội ngũ phát triển vị trí ${jobTitle}! Rất mong được hợp tác cùng bạn.`);
        setContactName(defaultRecruiterInfo?.fullName || '');
        setContactEmail(defaultRecruiterInfo?.email || '');
        setContactPhone(defaultRecruiterInfo?.phone || '');
      }
    }
  }, [isOpen, existingOffer, defaultRecruiterInfo, jobTitle]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const numSalary = Number(salary);
    if (!salary || isNaN(numSalary) || numSalary <= 0) {
      toast.error('Vui lòng nhập mức lương hợp lệ');
      return;
    }
    if (!startDate) {
      toast.error('Vui lòng chọn ngày bắt đầu đi làm');
      return;
    }
    if (!expiresAt) {
      toast.error('Vui lòng chọn hạn phản hồi Offer');
      return;
    }

    const startDateTime = new Date(`${startDate}T09:00:00.000Z`).toISOString();
    const expiresDateTime = new Date(`${expiresAt}T23:59:59.000Z`).toISOString();

    setSubmitting(true);
    try {
      if (existingOffer) {
        await updateOffer(token, existingOffer.id, {
          salary: numSalary,
          currency,
          salaryPeriod,
          startDate: startDateTime,
          expiresAt: expiresDateTime,
          workType,
          workLocation: workLocation.trim() || undefined,
          benefits: benefits.trim() || undefined,
          notes: notes.trim() || undefined,
          contactName: contactName.trim() || undefined,
          contactEmail: contactEmail.trim() || undefined,
          contactPhone: contactPhone.trim() || undefined,
        });
        toast.success('Đã cập nhật lại thư mời nhận việc (Offer) và gửi thông báo tới ứng viên!');
      } else {
        await createOffer(token, {
          applicationId,
          salary: numSalary,
          currency,
          salaryPeriod,
          startDate: startDateTime,
          expiresAt: expiresDateTime,
          workType,
          workLocation: workLocation.trim() || undefined,
          benefits: benefits.trim() || undefined,
          notes: notes.trim() || undefined,
          contactName: contactName.trim() || undefined,
          contactEmail: contactEmail.trim() || undefined,
          contactPhone: contactPhone.trim() || undefined,
        });
        toast.success('Đã phát hành Thư mời nhận việc (Offer) chính thức thành công!');
      }

      await onSuccess();
      onClose();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Không thể lưu Offer');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-950/60 p-4 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="w-full max-w-2xl max-h-[90vh] flex flex-col rounded-2xl border border-slate-200 bg-white shadow-2xl overflow-hidden font-sans">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-100 bg-[#EFF6FF] px-6 py-4">
          <div className="flex items-center gap-3">
            <div className="flex size-10 items-center justify-center rounded-xl bg-[#2563EB] text-white shadow-sm">
              <Gift className="size-5" />
            </div>
            <div>
              <h2 className="text-base font-extrabold text-[#1F2937]">
                {existingOffer ? 'Cập Nhật / Điều Chỉnh Thư Mời Nhận Việc' : 'Phát Hành Thư Mời Nhận Việc (Offer)'}
              </h2>
              <p className="text-xs font-medium text-slate-500">
                Ứng viên: <strong className="text-slate-800">{candidateName}</strong> • Vị trí: <strong className="text-slate-800">{jobTitle}</strong>
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="flex size-8 items-center justify-center rounded-lg text-slate-400 hover:bg-white hover:text-slate-600 transition-colors"
          >
            <X className="size-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6 space-y-5">
          {/* Compensation section */}
          <div className="rounded-xl border border-slate-200 bg-slate-50/50 p-4 space-y-4">
            <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-slate-500">
              <DollarSign className="size-4 text-[#2563EB]" />
              Mức Đãi Ngộ & Lương Thưởng
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div className="sm:col-span-2">
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Mức Lương Cơ Bản <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <input
                    type="number"
                    min="0"
                    step="500000"
                    placeholder="VD: 25000000"
                    value={salary}
                    onChange={(e) => setSalary(e.target.value)}
                    required
                    className="w-full rounded-xl border border-slate-200 bg-white py-2.5 pl-3 pr-16 text-sm font-bold text-slate-800 outline-none focus:border-[#2563EB] focus:ring-2 focus:ring-[#2563EB]/20"
                  />
                  <div className="absolute right-3 top-2.5 text-xs font-extrabold text-slate-400">
                    VNĐ / Tháng
                  </div>
                </div>
                {Number(salary) > 0 && (
                  <p className="mt-1 text-xs font-medium text-emerald-600">
                    ≈ {Number(salary).toLocaleString('vi-VN')} VNĐ / tháng
                  </p>
                )}
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Hình thức làm việc
                </label>
                <select
                  value={workType}
                  onChange={(e) => setWorkType(e.target.value)}
                  className="w-full rounded-xl border border-slate-200 bg-white py-2.5 px-3 text-sm font-semibold text-slate-800 outline-none focus:border-[#2563EB] focus:ring-2 focus:ring-[#2563EB]/20"
                >
                  <option value="HYBRID">Hybrid (Linh hoạt)</option>
                  <option value="ONSITE">On-site (Tại văn phòng)</option>
                  <option value="REMOTE">Remote (Từ xa)</option>
                </select>
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Địa điểm làm việc / Văn phòng
              </label>
              <input
                type="text"
                placeholder="VD: Tòa nhà Bitexco, Số 2 Hải Triều, Q.1, TP.HCM"
                value={workLocation}
                onChange={(e) => setWorkLocation(e.target.value)}
                className="w-full rounded-xl border border-slate-200 bg-white py-2 px-3 text-sm text-slate-800 outline-none focus:border-[#2563EB] focus:ring-2 focus:ring-[#2563EB]/20"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Chế độ đãi ngộ & Phúc lợi
              </label>
              <textarea
                rows={2}
                placeholder="Bảo hiểm sức khỏe, thưởng KPI, thiết bị làm việc Macbook..."
                value={benefits}
                onChange={(e) => setBenefits(e.target.value)}
                className="w-full rounded-xl border border-slate-200 bg-white p-3 text-xs text-slate-800 outline-none focus:border-[#2563EB] focus:ring-2 focus:ring-[#2563EB]/20"
              />
            </div>
          </div>

          {/* Dates & Timeline */}
          <div className="rounded-xl border border-slate-200 bg-slate-50/50 p-4 space-y-4">
            <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-slate-500">
              <Calendar className="size-4 text-[#2563EB]" />
              Thời Gian Nhận Việc & Hạn Phản Hồi
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Ngày bắt đầu đi làm (Onboarding) <span className="text-red-500">*</span>
                </label>
                <input
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  required
                  className="w-full rounded-xl border border-slate-200 bg-white py-2.5 px-3 text-sm font-semibold text-slate-800 outline-none focus:border-[#2563EB] focus:ring-2 focus:ring-[#2563EB]/20"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Hạn chót phản hồi Offer <span className="text-red-500">*</span>
                </label>
                <input
                  type="date"
                  value={expiresAt}
                  onChange={(e) => setExpiresAt(e.target.value)}
                  required
                  className="w-full rounded-xl border border-slate-200 bg-white py-2.5 px-3 text-sm font-semibold text-slate-800 outline-none focus:border-[#2563EB] focus:ring-2 focus:ring-[#2563EB]/20"
                />
              </div>
            </div>
          </div>

          {/* Direct HR Contact section (for candidate to call/negotiate without app loop) */}
          <div className="rounded-xl border border-blue-200 bg-blue-50/40 p-4 space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-[#2563EB]">
                <Phone className="size-4" />
                Thông Tin Liên Hệ Trực Tiếp Của HR
              </div>
              <span className="text-2xs font-semibold text-slate-500">
                (Hiển thị trên Offer để ứng viên gọi trao đổi khi cần)
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label className="block text-2xs font-bold text-slate-600 mb-1">
                  Họ tên người phụ trách
                </label>
                <input
                  type="text"
                  placeholder="VD: Nguyễn Văn HR"
                  value={contactName}
                  onChange={(e) => setContactName(e.target.value)}
                  className="w-full rounded-lg border border-slate-200 bg-white py-2 px-2.5 text-xs text-slate-800 outline-none focus:border-[#2563EB]"
                />
              </div>

              <div>
                <label className="block text-2xs font-bold text-slate-600 mb-1">
                  Email liên hệ
                </label>
                <input
                  type="email"
                  placeholder="hr@company.com"
                  value={contactEmail}
                  onChange={(e) => setContactEmail(e.target.value)}
                  className="w-full rounded-lg border border-slate-200 bg-white py-2 px-2.5 text-xs text-slate-800 outline-none focus:border-[#2563EB]"
                />
              </div>

              <div>
                <label className="block text-2xs font-bold text-slate-600 mb-1">
                  Số điện thoại / Zalo
                </label>
                <input
                  type="text"
                  placeholder="0901234567"
                  value={contactPhone}
                  onChange={(e) => setContactPhone(e.target.value)}
                  className="w-full rounded-lg border border-slate-200 bg-white py-2 px-2.5 text-xs text-slate-800 outline-none focus:border-[#2563EB]"
                />
              </div>
            </div>
          </div>

          {/* Welcome Note */}
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              Lời nhắn chào mừng & Điều khoản đặc biệt
            </label>
            <textarea
              rows={3}
              placeholder="Gửi gắm lời chào mừng, kỳ vọng hoặc hướng dẫn chuẩn bị hồ sơ..."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="w-full rounded-xl border border-slate-200 bg-white p-3 text-xs text-slate-800 outline-none focus:border-[#2563EB] focus:ring-2 focus:ring-[#2563EB]/20"
            />
          </div>

          {/* Footer Actions */}
          <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100">
            <button
              type="button"
              onClick={onClose}
              className="rounded-xl border border-slate-200 bg-white px-5 py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-50 transition-colors"
            >
              Hủy
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="inline-flex items-center gap-2 rounded-xl bg-[#2563EB] px-6 py-2.5 text-sm font-bold text-white shadow-sm hover:bg-blue-700 active:bg-blue-800 disabled:opacity-50 transition-colors"
            >
              {submitting ? (
                <>
                  <Loader2 className="size-4 animate-spin" />
                  Đang xử lý...
                </>
              ) : existingOffer ? (
                <>
                  <FileCheck2 className="size-4" />
                  Cập Nhật & Gửi Lại Offer
                </>
              ) : (
                <>
                  <Sparkles className="size-4" />
                  Phát Hành Thư Mời Nhận Việc
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
