'use client';

import React from 'react';
import {
  X,
  Printer,
  ShieldCheck,
  Building2,
  User,
  Scale,
  Calendar,
  FileText,
  CheckCircle2,
  Clock,
  Award,
} from 'lucide-react';
import {
  type DisputeData,
  disputeCategoryLabels,
  disputeStatusLabels,
} from '@/lib/dispute-api';

interface DisputeResolutionMinutesModalProps {
  isOpen: boolean;
  onClose: () => void;
  dispute: DisputeData | null;
}

export function DisputeResolutionMinutesModal({
  isOpen,
  onClose,
  dispute,
}: DisputeResolutionMinutesModalProps) {
  if (!isOpen || !dispute) return null;

  const handlePrint = () => {
    window.print();
  };

  const appJob = dispute.application?.job;
  const appCandidate = dispute.application?.candidate;
  const recruiter = appJob?.recruiter;
  const isCandidateReporter = dispute.reportedByUserId === appCandidate?.userId;

  const complainantName = isCandidateReporter
    ? appCandidate?.fullName || 'Ứng viên'
    : recruiter?.user?.fullName || 'Nhà tuyển dụng';

  const respondentName = isCandidateReporter
    ? recruiter?.user?.fullName || 'Nhà tuyển dụng'
    : appCandidate?.fullName || 'Ứng viên';

  const resolutionDate = dispute.resolvedAt
    ? new Date(dispute.resolvedAt).toLocaleString('vi-VN')
    : 'Chưa ban hành';

  const candidateAckDate = dispute.candidateAcknowledgedAt
    ? new Date(dispute.candidateAcknowledgedAt).toLocaleString('vi-VN')
    : null;

  const recruiterAckDate = dispute.recruiterAcknowledgedAt
    ? new Date(dispute.recruiterAcknowledgedAt).toLocaleString('vi-VN')
    : null;

  const closedDate = dispute.closedAt
    ? new Date(dispute.closedAt).toLocaleString('vi-VN')
    : null;

  return (
    <div
      className="fixed inset-0 z-[120] flex items-center justify-center bg-slate-900/70 backdrop-blur-xs p-4 overflow-y-auto animate-in fade-in duration-200"
      onClick={onClose}
    >
      <div
        className="relative w-full max-w-4xl bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col my-8 print:m-0 print:border-none print:shadow-none print:w-full"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Top Control Bar (Hidden on print) */}
        <div className="flex items-center justify-between px-6 py-3.5 bg-slate-900 text-white print:hidden">
          <div className="flex items-center gap-2">
            <Scale className="size-4 text-[#3B82F6]" />
            <span className="text-xs font-bold uppercase tracking-wider">
              Biên Bản Hòa Giải & Phán Quyết Trọng Tài Số
            </span>
            <span className="font-mono text-2xs bg-blue-500/20 text-blue-300 px-2 py-0.5 rounded border border-blue-400/30">
              {dispute.disputeNumber}
            </span>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handlePrint}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#2563EB] hover:bg-blue-600 text-white text-xs font-bold transition shadow-xs cursor-pointer"
            >
              <Printer className="size-3.5" /> In Biên Bản
            </button>
            <button
              type="button"
              onClick={onClose}
              className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition cursor-pointer"
            >
              <X className="size-4.5" />
            </button>
          </div>
        </div>

        {/* Printable Document Body */}
        <div className="p-8 sm:p-12 text-[#1F2937] font-sans space-y-6 print:p-6 print:text-xs">
          {/* Header */}
          <div className="text-center border-b-2 border-slate-900 pb-5 space-y-1.5">
            <p className="text-2xs font-extrabold tracking-widest text-slate-500 uppercase">
              CỘNG HÒA XÃ HỘI CHỦ NGHĨA VIỆT NAM
            </p>
            <p className="text-3xs font-bold text-slate-400 uppercase tracking-wider">
              Độc lập - Tự do - Hạnh phúc
            </p>
            <div className="pt-2">
              <h1 className="text-xl sm:text-2xl font-black text-[#1F2937] uppercase tracking-tight">
                BIÊN BẢN HÒA GIẢI & PHÁN QUYẾT TRỌNG TÀI SỐ
              </h1>
              <p className="text-xs text-slate-600 font-medium">
                Về việc: Giải quyết khiếu nại, tranh chấp điều khoản Offer & Hợp đồng tuyển dụng
              </p>
              <p className="text-2xs font-mono font-bold text-[#2563EB]">
                Số văn bản: BB-TT/{dispute.disputeNumber} • Ngày lập: {resolutionDate}
              </p>
            </div>
          </div>

          {/* Status Seal Banner */}
          <div className="flex flex-wrap items-center justify-between gap-3 p-3.5 rounded-xl bg-[#EFF6FF] border border-blue-200 text-xs">
            <div className="flex items-center gap-2">
              <ShieldCheck className="size-5 text-[#2563EB]" />
              <div>
                <span className="font-extrabold text-slate-900 block">
                  Trạng thái giải quyết:{' '}
                  <span className="text-[#2563EB] uppercase">
                    {disputeStatusLabels[dispute.status]}
                  </span>
                </span>
                <span className="text-3xs text-slate-500">
                  {dispute.status === 'CLOSED'
                    ? `Hồ sơ đã được đóng và lưu trữ chính thức vào lúc: ${closedDate || 'N/A'}`
                    : 'Phán quyết đã được ban hành và đang trong quá trình ghi nhận xác nhận thi hành.'}
                </span>
              </div>
            </div>
            <div className="flex items-center gap-1.5 text-2xs font-bold text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-lg border border-emerald-200">
              <Award className="size-3.5 text-emerald-600" /> Xác thực số SHA-256
            </div>
          </div>

          {/* Section 1: The Three Parties */}
          <div className="space-y-3">
            <h2 className="text-xs font-black uppercase tracking-wider text-slate-900 border-b border-slate-200 pb-1 flex items-center gap-1.5">
              <Scale className="size-3.5 text-[#2563EB]" /> I. THÔNG TIN CÁC BÊN THAM GIA PHÂN XỬ
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
              <div className="p-3 rounded-xl border border-slate-200 bg-slate-50/50 space-y-1">
                <span className="text-3xs font-extrabold uppercase tracking-wider text-[#2563EB] block">
                  1. Ban Quản Trị Trọng Tài (Hệ Thống)
                </span>
                <p className="font-bold text-slate-900">Ban Trọng Tài Ai-Recruitment</p>
                <p className="text-2xs text-slate-600">Thẩm quyền: Phân xử trung gian số</p>
                <p className="text-2xs text-slate-500 font-mono">Quyết định ban hành: {resolutionDate}</p>
              </div>

              <div className="p-3 rounded-xl border border-slate-200 bg-slate-50/50 space-y-1">
                <span className="text-3xs font-extrabold uppercase tracking-wider text-slate-600 block">
                  2. Bên Khiếu Nại (Complainant)
                </span>
                <p className="font-bold text-slate-900">{complainantName}</p>
                <p className="text-2xs text-slate-600">
                  Vai trò: {isCandidateReporter ? 'Ứng viên nộp đơn' : 'Nhà tuyển dụng báo cáo'}
                </p>
                <p className="text-2xs text-slate-500">
                  Ngày gửi: {new Date(dispute.createdAt).toLocaleString('vi-VN')}
                </p>
              </div>

              <div className="p-3 rounded-xl border border-slate-200 bg-slate-50/50 space-y-1">
                <span className="text-3xs font-extrabold uppercase tracking-wider text-slate-600 block">
                  3. Bên Bị Khiếu Nại (Respondent)
                </span>
                <p className="font-bold text-slate-900">{respondentName}</p>
                <p className="text-2xs text-slate-600">
                  Vai trò: {!isCandidateReporter ? 'Ứng viên có liên quan' : 'Doanh nghiệp tuyển dụng'}
                </p>
                <p className="text-2xs text-slate-500">
                  Vị trí tuyển dụng: {appJob?.title || 'N/A'}
                </p>
              </div>
            </div>
          </div>

          {/* Section 2: Dispute Summary */}
          <div className="space-y-2">
            <h2 className="text-xs font-black uppercase tracking-wider text-slate-900 border-b border-slate-200 pb-1 flex items-center gap-1.5">
              <FileText className="size-3.5 text-[#2563EB]" /> II. TÓM TẮT SỰ VIỆC & PHÂN LOẠI TRANH CHẤP
            </h2>
            <div className="p-3.5 rounded-xl border border-slate-200 bg-white space-y-2 text-xs">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <span className="font-bold text-slate-900">{dispute.title}</span>
                <span className="text-3xs font-extrabold px-2.5 py-0.5 rounded-full bg-rose-50 text-rose-700 border border-rose-200">
                  Phân loại: {disputeCategoryLabels[dispute.category]}
                </span>
              </div>
              <p className="text-slate-700 leading-relaxed text-2xs italic whitespace-pre-wrap">
                "{dispute.description}"
              </p>
            </div>
          </div>

          {/* Section 3: Official Resolution & Sanctions */}
          <div className="space-y-2">
            <h2 className="text-xs font-black uppercase tracking-wider text-slate-900 border-b border-slate-200 pb-1 flex items-center gap-1.5">
              <Scale className="size-3.5 text-[#2563EB]" /> III. KẾT LUẬN CỦA BAN TRỌNG TÀI & CÁC CHẾ TÀI ÁP ĐẶT
            </h2>
            <div className="p-4 rounded-xl border border-blue-200 bg-blue-50/40 space-y-3 text-xs">
              <div>
                <span className="text-3xs font-extrabold uppercase text-[#2563EB] tracking-wider block mb-1">
                  1. Toàn văn kết luận giải quyết của Ban Quản Trị:
                </span>
                <p className="text-slate-900 font-medium leading-relaxed bg-white p-3 rounded-lg border border-blue-100 whitespace-pre-wrap">
                  {dispute.adminResolution || 'Chưa có kết luận chính thức.'}
                </p>
              </div>

              {/* Sanctions details */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2 border-t border-blue-100 text-2xs">
                {/* Employer Sanctions */}
                <div className="p-2.5 rounded-lg bg-white border border-slate-200 space-y-1">
                  <span className="font-bold text-slate-900 block text-3xs uppercase tracking-wider text-rose-700">
                    Chế tài đối với Doanh nghiệp:
                  </span>
                  <div>
                    Biện pháp:{' '}
                    <strong>
                      {dispute.penaltyAction === 'LOCK_RECRUITER'
                        ? 'Khóa tài khoản tuyển dụng & Tạm dừng đăng tin'
                        : dispute.penaltyAction === 'WARN'
                        ? 'Cảnh cáo & Ghi nhận vi phạm hệ thống'
                        : 'Không áp dụng'}
                    </strong>
                  </div>
                  {dispute.penaltyAmount && (
                    <div>
                      Phạt vi phạm:{' '}
                      <strong className="text-rose-700 font-mono">
                        {Number(dispute.penaltyAmount).toLocaleString('vi-VN')} VND
                      </strong>
                    </div>
                  )}
                  {dispute.compensationAmount && (
                    <div>
                      Bồi thường cho Ứng viên:{' '}
                      <strong className="text-emerald-700 font-mono">
                        {Number(dispute.compensationAmount).toLocaleString('vi-VN')} VND
                      </strong>
                    </div>
                  )}
                  {dispute.penaltyNotes && (
                    <div className="text-slate-500 italic">"{dispute.penaltyNotes}"</div>
                  )}
                </div>

                {/* Candidate Sanctions */}
                <div className="p-2.5 rounded-lg bg-white border border-slate-200 space-y-1">
                  <span className="font-bold text-slate-900 block text-3xs uppercase tracking-wider text-amber-700">
                    Chế tài đối với Ứng viên:
                  </span>
                  <div>
                    Biện pháp:{' '}
                    <strong>
                      {dispute.candidatePenaltyAction === 'LOCK_CANDIDATE'
                        ? 'Khóa vĩnh viễn hồ sơ ứng viên'
                        : dispute.candidatePenaltyAction === 'SUSPEND_APPLY'
                        ? `Tạm dừng nộp đơn (${dispute.candidateSuspensionDays || 14} ngày) & Trừ điểm`
                        : dispute.candidatePenaltyAction === 'DEDUCT_RELIABILITY'
                        ? `Trừ ${dispute.candidateReliabilityDeduction || 15} điểm Tin cậy (Reliability Score)`
                        : dispute.candidatePenaltyAction === 'WARN'
                        ? 'Gửi cảnh cáo chính thức'
                        : 'Không áp dụng'}
                    </strong>
                  </div>
                  {dispute.candidatePenaltyNotes && (
                    <div className="text-slate-500 italic">"{dispute.candidatePenaltyNotes}"</div>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Section 4: 3-Party Digital Signature & Acknowledgment Block */}
          <div className="space-y-3 pt-2">
            <h2 className="text-xs font-black uppercase tracking-wider text-slate-900 border-b border-slate-200 pb-1 flex items-center gap-1.5">
              <CheckCircle2 className="size-3.5 text-emerald-600" /> IV. XÁC NHẬN CAM KẾT & CHỮ KÝ ĐIỆN TỬ CỦA CẢ 3 BÊN
            </h2>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
              {/* Admin Signature */}
              <div className="p-3.5 rounded-xl border border-slate-300 bg-slate-50/70 flex flex-col justify-between min-h-[160px] text-center">
                <div>
                  <span className="text-3xs font-extrabold uppercase text-slate-600 block">
                    ĐẠI DIỆN BAN QUẢN TRỊ
                  </span>
                  <span className="text-3xs text-slate-400 block mb-2">(Ký duyệt phán quyết)</span>
                  <div className="my-2 inline-flex flex-col items-center justify-center p-2 rounded-lg bg-blue-50 border border-blue-200 text-[#2563EB]">
                    <ShieldCheck className="size-6 mb-0.5" />
                    <span className="text-3xs font-black uppercase">ĐÃ DUYỆT PHÁN QUYẾT</span>
                    <span className="text-4xs font-mono text-slate-500">{resolutionDate}</span>
                  </div>
                </div>
                <div className="border-t border-slate-200 pt-1.5 text-2xs font-bold text-slate-800">
                  Hội Đồng Trọng Tài Tuyển Dụng
                </div>
              </div>

              {/* Candidate Acknowledgment */}
              <div
                className={`p-3.5 rounded-xl border flex flex-col justify-between min-h-[160px] text-center ${
                  candidateAckDate
                    ? 'border-emerald-300 bg-emerald-50/40'
                    : 'border-slate-200 bg-slate-50/40 border-dashed'
                }`}
              >
                <div>
                  <span className="text-3xs font-extrabold uppercase text-slate-600 block">
                    ĐẠI DIỆN ỨNG VIÊN
                  </span>
                  <span className="text-3xs text-slate-400 block mb-2">(Xác nhận đồng thuận)</span>
                  {candidateAckDate ? (
                    <div className="my-2 inline-flex flex-col items-center justify-center p-2 rounded-lg bg-emerald-100/70 border border-emerald-300 text-emerald-800">
                      <CheckCircle2 className="size-6 text-emerald-600 mb-0.5" />
                      <span className="text-3xs font-black uppercase">ĐÃ XÁC NHẬN ĐỒNG THUẬN</span>
                      <span className="text-4xs font-mono text-slate-600">{candidateAckDate}</span>
                    </div>
                  ) : (
                    <div className="my-3 text-2xs text-amber-600 font-semibold flex items-center justify-center gap-1">
                      <Clock className="size-3.5" /> Đang chờ xác nhận
                    </div>
                  )}
                </div>
                <div className="border-t border-slate-200 pt-1.5 text-2xs font-bold text-slate-800 truncate">
                  {appCandidate?.fullName || 'Ứng viên'}
                </div>
              </div>

              {/* Recruiter Acknowledgment */}
              <div
                className={`p-3.5 rounded-xl border flex flex-col justify-between min-h-[160px] text-center ${
                  recruiterAckDate
                    ? 'border-emerald-300 bg-emerald-50/40'
                    : 'border-slate-200 bg-slate-50/40 border-dashed'
                }`}
              >
                <div>
                  <span className="text-3xs font-extrabold uppercase text-slate-600 block">
                    ĐẠI DIỆN DOANH NGHIỆP
                  </span>
                  <span className="text-3xs text-slate-400 block mb-2">(Xác nhận chấp hành)</span>
                  {recruiterAckDate ? (
                    <div className="my-2 inline-flex flex-col items-center justify-center p-2 rounded-lg bg-emerald-100/70 border border-emerald-300 text-emerald-800">
                      <CheckCircle2 className="size-6 text-emerald-600 mb-0.5" />
                      <span className="text-3xs font-black uppercase">ĐÃ XÁC NHẬN CHẤP HÀNH</span>
                      <span className="text-4xs font-mono text-slate-600">{recruiterAckDate}</span>
                    </div>
                  ) : (
                    <div className="my-3 text-2xs text-amber-600 font-semibold flex items-center justify-center gap-1">
                      <Clock className="size-3.5" /> Đang chờ xác nhận
                    </div>
                  )}
                </div>
                <div className="border-t border-slate-200 pt-1.5 text-2xs font-bold text-slate-800 truncate">
                  {recruiter?.user?.fullName || recruiter?.company?.name || 'Doanh nghiệp'}
                </div>
              </div>
            </div>
          </div>

          {/* Footer note */}
          <div className="text-center pt-4 border-t border-slate-200 text-3xs text-slate-400">
            Biên bản này được ký và xác thực điện tử qua hệ thống phân xử trung gian Ai-Recruitment.
            Mọi hành vi vi phạm phán quyết đã đồng thuận sẽ bị xử lý nghiêm theo Điều khoản dịch vụ và pháp luật hiện hành.
          </div>
        </div>
      </div>
    </div>
  );
}
