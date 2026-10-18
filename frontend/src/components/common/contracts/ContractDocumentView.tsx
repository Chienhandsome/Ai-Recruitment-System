'use client';

import React from 'react';
import {
  FileText,
  Download,
  Calendar,
  Building2,
  User,
  DollarSign,
  MapPin,
  Clock,
  ShieldCheck,
  CheckCircle2,
  Lock,
  KeyRound,
  ExternalLink,
  Copy,
  Check,
} from 'lucide-react';
import type { ContractData } from '@/lib/contract-api';
import Link from 'next/link';

interface ContractDocumentViewProps {
  contract: ContractData;
  onPrint?: () => void;
  onDownload?: () => void;
  showPrintButton?: boolean;
  showDownloadButton?: boolean;
}

export function ContractDocumentView({
  contract,
  onPrint,
  onDownload,
  showPrintButton = true,
  showDownloadButton,
}: ContractDocumentViewProps) {
  const showDownload = showDownloadButton !== undefined ? showDownloadButton : showPrintButton;
  const [copied, setCopied] = React.useState(false);

  const copyHash = () => {
    if (contract.pdfSha256Hash) {
      navigator.clipboard.writeText(contract.pdfSha256Hash);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };
  const application = contract.application;
  const company = application?.job?.recruiter?.company;
  const recruiter = application?.job?.recruiter;
  const candidate = application?.candidate;

  const isInternship = contract.contractType === 'INTERNSHIP';
  const isProbation = contract.contractType === 'PROBATION';
  const isStandardLabor = !isInternship && !isProbation;

  const startDateFormatted = new Date(contract.startDate).toLocaleDateString('vi-VN', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  });

  const endDateFormatted = contract.endDate
    ? new Date(contract.endDate).toLocaleDateString('vi-VN', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    })
    : 'Không xác định thời hạn';

  const formatSalary = (val: number | string) => {
    return Number(val).toLocaleString('vi-VN');
  };

  const getContractTypeName = (type: string) => {
    switch (type) {
      case 'PROBATION':
        return 'HỢP ĐỒNG THỬ VIỆC';
      case 'INTERNSHIP':
        return 'THỎA THUẬN THỰC TẬP VÀ ĐÀO TẠO NGHỀ';
      case 'INDEFINITE':
        return 'HỢP ĐỒNG LAO ĐỘNG KHÔNG XÁC ĐỊNH THỜI HẠN';
      case 'FIXED_TERM':
      default:
        return 'HỢP ĐỒNG LAO ĐỘNG XÁC ĐỊNH THỜI HẠN';
    }
  };

  const getLegalPreamble = (type: string) => {
    switch (type) {
      case 'PROBATION':
        return 'Căn cứ Điều 24, Điều 25, Điều 26 Bộ luật Lao động số 45/2019/QH14 được Quốc hội nước CHXHCN Việt Nam thông qua ngày 20/11/2019 và nhu cầu thử việc của các bên.';
      case 'INTERNSHIP':
        return 'Căn cứ Bộ luật Dân sự số 91/2015/QH13, Luật Giáo dục đại học, Luật Giáo dục nghề nghiệp và nhu cầu tiếp nhận, hướng dẫn kỹ năng thực tế cho thực tập sinh tại doanh nghiệp.';
      case 'INDEFINITE':
      case 'FIXED_TERM':
      default:
        return 'Căn cứ Bộ luật Lao động nước Cộng hòa Xã hội Chủ nghĩa Việt Nam số 45/2019/QH14 và các văn bản quy định chi tiết thi hành hiện hành.';
    }
  };

  const handleDownload = () => {
    if (onDownload) {
      onDownload();
    } else if (contract.contractPdfUrl) {
      window.open(contract.contractPdfUrl, '_blank');
    } else if (onPrint) {
      onPrint();
    } else {
      window.print();
    }
  };

  return (
    <div className="relative mx-auto max-w-4xl rounded-2xl border border-slate-200 bg-white p-8 md:p-12 shadow-sm font-sans text-slate-800 print:border-none print:p-0 print:shadow-none">
      {showDownload && (
        <div className="mb-6 flex justify-end gap-2 print:hidden">
          <button
            type="button"
            onClick={handleDownload}
            className="inline-flex items-center gap-2 rounded-xl border border-blue-200 bg-blue-50/70 px-4 py-2 text-xs font-bold text-[#2563EB] shadow-xs transition hover:bg-blue-100 hover:text-blue-800 cursor-pointer"
          >
            <Download className="size-4" />
            Tải hợp đồng (.PDF)
          </button>
        </div>
      )}

      {/* Header Quốc hiệu Tiêu ngữ */}
      <div className="text-center">
        <h3 className="text-xs font-bold tracking-widest uppercase text-slate-900">
          CỘNG HÒA XÃ HỘI CHỦ NGHĨA VIỆT NAM
        </h3>
        <p className="text-xs font-semibold text-slate-600">Độc lập - Tự do - Hạnh phúc</p>
        <div className="mx-auto my-2 w-28 border-b-2 border-slate-400" />
      </div>

      {/* Tên hợp đồng */}
      <div className="mt-8 text-center">
        <h1 className="text-xl md:text-2xl font-black uppercase tracking-wide text-slate-900">
          {getContractTypeName(contract.contractType)}
        </h1>
        <p className="mt-1 text-xs font-semibold text-slate-500">
          Số: <span className="font-mono text-blue-700">{contract.contractNumber}</span> • Phiên bản: v{contract.version}
        </p>
      </div>

      <p className="mt-6 text-xs italic leading-relaxed text-slate-600 text-justify">
        {getLegalPreamble(contract.contractType)}
        {' '}Hôm nay, ngày {new Date().toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric' })}, chúng tôi gồm các bên dưới đây thống nhất ký kết {isInternship ? 'thỏa thuận thực tập' : 'hợp đồng'}:
      </p>

      {/* Bên A & Bên B */}
      <div className="mt-6 space-y-6 text-xs leading-relaxed">
        {/* Bên A */}
        <div className="rounded-xl border border-slate-100 bg-[#EFF6FF]/40 p-4">
          <h2 className="mb-2 font-bold uppercase tracking-wide text-slate-900">
            {isInternship ? 'BÊN A: ĐƠN VỊ TIẾP NHẬN THỰC TẬP (DOANH NGHIỆP)' : 'BÊN A: NGƯỜI SỬ DỤNG LAO ĐỘNG'}
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-slate-700">
            <div>
              <span className="font-semibold text-slate-900">Tên doanh nghiệp:</span>{' '}
              {company?.name || 'Công ty Cổ phần / Trách nhiệm hữu hạn'}
            </div>
            <div>
              <span className="font-semibold text-slate-900">Người đại diện:</span>{' '}
              {recruiter?.user?.fullName || 'Đại diện được ủy quyền'}
            </div>
            <div>
              <span className="font-semibold text-slate-900">Địa chỉ trụ sở:</span>{' '}
              {company?.address || contract.workLocation || 'Địa chỉ doanh nghiệp'}
            </div>
            <div>
              <span className="font-semibold text-slate-900">Email liên hệ:</span>{' '}
              {recruiter?.user?.email || 'hr@company.com'}
            </div>
          </div>
        </div>

        {/* Bên B */}
        <div className="rounded-xl border border-slate-100 bg-slate-50 p-4">
          <h2 className="mb-2 font-bold uppercase tracking-wide text-slate-900">
            {isInternship
              ? 'BÊN B: THỰC TẬP SINH / HỌC VIÊN NGHỀ'
              : isProbation
                ? 'BÊN B: NGƯỜI LAO ĐỘNG (NGƯỜI THỬ VIỆC)'
                : 'BÊN B: NGƯỜI LAO ĐỘNG'}
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-slate-700">
            <div>
              <span className="font-semibold text-slate-900">Họ và tên:</span>{' '}
              <strong className="text-slate-900">{candidate?.fullName || 'Họ và tên người lao động'}</strong>
            </div>
            <div>
              <span className="font-semibold text-slate-900">Email:</span> {candidate?.email || 'N/A'}
            </div>
            <div>
              <span className="font-semibold text-slate-900">Số điện thoại:</span> {candidate?.phone || 'N/A'}
            </div>
            <div>
              <span className="font-semibold text-slate-900">Địa chỉ cư trú:</span>{' '}
              {candidate?.address || 'Theo hồ sơ ứng viên'}
            </div>
          </div>
        </div>

        {/* ==================== CÁC ĐIỀU KHOẢN HỢP ĐỒNG ==================== */}
        <div className="space-y-4 pt-2">
          {/* 1. MẪU HỢP ĐỒNG LAO ĐỘNG CHÍNH THỨC (ĐẦY ĐỦ 10 NỘI DUNG ĐIỀU 21 BLLĐ 2019) */}
          {isStandardLabor && (
            <>
              <div>
                <h3 className="font-bold text-slate-900 uppercase">
                  Điều 1: Vị trí công tác, công việc phải làm và địa điểm làm việc (Khoản 1a Điều 21 BLLĐ 2019)
                </h3>
                <ul className="mt-1 list-disc list-inside space-y-1 text-slate-700 pl-2">
                  <li>
                    <strong>Vị trí / Chức danh chuyên môn:</strong> {contract.jobTitle}
                  </li>
                  <li>
                    <strong>Hình thức làm việc:</strong> {contract.workType || 'Toàn thời gian (Tại văn phòng)'}
                  </li>
                  <li>
                    <strong>Địa điểm làm việc:</strong> {contract.workLocation || 'Tại trụ sở / cơ sở hoạt động của Bên A'}
                  </li>
                  <li>
                    <strong>Nhiệm vụ công việc:</strong> Thực hiện các công việc chuyên môn theo bản mô tả công việc (JD) của vị trí và các nhiệm vụ hợp pháp do người quản lý trực tiếp phân công.
                  </li>
                </ul>
              </div>

              <div>
                <h3 className="font-bold text-slate-900 uppercase">
                  Điều 2: Thời hạn hợp đồng lao động (Khoản 1b Điều 21 BLLĐ 2019)
                </h3>
                <ul className="mt-1 list-disc list-inside space-y-1 text-slate-700 pl-2">
                  <li>
                    <strong>Loại hợp đồng:</strong>{' '}
                    {contract.contractType === 'INDEFINITE'
                      ? 'Hợp đồng lao động không xác định thời hạn (Căn cứ Điểm a Khoản 1 Điều 20 BLLĐ 2019)'
                      : 'Hợp đồng lao động xác định thời hạn (Căn cứ Điểm b Khoản 1 Điều 20 BLLĐ 2019)'}
                  </li>
                  <li>
                    <strong>Thời điểm bắt đầu làm việc:</strong> Ngày {startDateFormatted}
                  </li>
                  <li>
                    <strong>Thời điểm kết thúc hợp đồng:</strong> {endDateFormatted}
                  </li>
                </ul>
              </div>

              <div>
                <h3 className="font-bold text-slate-900 uppercase">
                  Điều 3: Chế độ thử việc (Nếu áp dụng) (Khoản 2 Điều 21 & Điều 24 BLLĐ 2019)
                </h3>
                <div className="mt-1 text-slate-700 pl-2 leading-relaxed">
                  {contract.probationPeriodMonths && contract.probationPeriodMonths > 0 ? (
                    <p>
                      Thời gian thử việc được thỏa thuận tích hợp là <strong>{contract.probationPeriodMonths} tháng</strong> kể từ ngày bắt đầu nhận việc.
                      Trong thời gian thử việc, Người lao động được hưởng <strong>{contract.probationSalaryRate ?? 85}%</strong> mức lương chính thức (bảo đảm tuân thủ Điều 26 BLLĐ 2019 không thấp hơn 85%). Hết thời gian thử việc đạt yêu cầu, hợp đồng tiếp tục thực hiện với mức lương chính thức.
                    </p>
                  ) : (
                    <p>Hai bên thống nhất tiếp nhận Người lao động vào làm việc chính thức không áp dụng thời gian thử việc.</p>
                  )}
                </div>
              </div>

              <div>
                <h3 className="font-bold text-slate-900 uppercase">
                  Điều 4: Thời giờ làm việc và thời giờ nghỉ ngơi (Khoản 1d Điều 21 BLLĐ 2019)
                </h3>
                <ul className="mt-1 list-disc list-inside space-y-1 text-slate-700 pl-2">
                  <li>
                    <strong>Thời giờ làm việc tiêu chuẩn:</strong> {contract.workingHours || 'Thứ 2 - Thứ 6 (8h30 - 17h30)'}, không quá 08 giờ/ngày và 48 giờ/tuần theo Điều 105 BLLĐ 2019.
                  </li>
                  <li>
                    <strong>Nghỉ hàng tuần:</strong> Thứ Bảy và Chủ nhật (hoặc theo lịch phân công làm việc của bộ phận).
                  </li>
                  <li>
                    <strong>Nghỉ lễ, tết và phép năm:</strong> Người lao động được nghỉ làm việc hưởng nguyên lương các ngày Lễ, Tết theo Điều 112 BLLĐ 2019 và được hưởng 12 ngày phép năm khi làm việc đủ 12 tháng theo Điều 113 BLLĐ 2019.
                  </li>
                </ul>
              </div>

              <div>
                <h3 className="font-bold text-slate-900 uppercase">
                  Điều 5: Tiền lương, phụ cấp lương và các khoản bổ sung khác (Khoản 1c Điều 21 BLLĐ 2019)
                </h3>
                <ul className="mt-1 list-disc list-inside space-y-1 text-slate-700 pl-2">
                  <li>
                    <strong>Mức lương chính thức:</strong>{' '}
                    <span className="font-bold text-blue-700">
                      {formatSalary(contract.salary)} {contract.currency}
                    </span>{' '}
                    / {contract.salaryPeriod === 'MONTHLY' ? 'tháng' : contract.salaryPeriod}
                  </li>
                  <li>
                    <strong>Hình thức và kỳ hạn trả lương:</strong> Chuyển khoản ngân hàng định kỳ 01 lần/tháng vào tài khoản của Bên B theo lịch thanh toán của doanh nghiệp.
                  </li>
                  {contract.benefits && (
                    <li>
                      <strong>Chế độ đãi ngộ & phụ cấp:</strong> {contract.benefits}
                    </li>
                  )}
                </ul>
              </div>

              <div>
                <h3 className="font-bold text-slate-900 uppercase">
                  Điều 6: Chế độ nâng bậc, nâng lương (Khoản 1đ Điều 21 BLLĐ 2019)
                </h3>
                <p className="mt-1 text-slate-700 pl-2 leading-relaxed">
                  Bên A xem xét định kỳ nâng lương tối thiểu 01 năm/lần hoặc xét nâng lương trước thời hạn dựa trên năng lực hoàn thành xuất sắc công việc và kết quả đánh giá KPI hàng kỳ của Bên B theo Quy chế quản trị nhân sự nội bộ.
                </p>
              </div>

              <div>
                <h3 className="font-bold text-slate-900 uppercase">
                  Điều 7: Trang bị bảo hộ lao động, an toàn và vệ sinh lao động (Khoản 1e Điều 21 BLLĐ 2019)
                </h3>
                <ul className="mt-1 list-disc list-inside space-y-1 text-slate-700 pl-2">
                  <li>Bên A trang bị đầy đủ máy móc, thiết bị kỹ thuật, phương tiện làm việc và đồ bảo hộ cần thiết đáp ứng điều kiện an toàn tại nơi làm việc.</li>
                  <li>Bên B có nghĩa vụ sử dụng đúng mục đích, bảo quản tài sản được giao và chấp hành nghiêm túc quy định về an toàn lao động, phòng cháy chữa cháy.</li>
                </ul>
              </div>

              <div>
                <h3 className="font-bold text-slate-900 uppercase">
                  Điều 8: Bảo hiểm xã hội, bảo hiểm y tế và bảo hiểm thất nghiệp (Khoản 1g Điều 21 BLLĐ 2019)
                </h3>
                <p className="mt-1 text-slate-700 pl-2 leading-relaxed">
                  Hai bên cùng tham gia và đóng BHXH, BHYT, BHTN bắt buộc theo đúng quy định của Luật Bảo hiểm xã hội và Luật Việc làm hiện hành. Người sử dụng lao động có trách nhiệm trích nộp phần đóng của Người lao động vào tiền lương tháng và nộp cùng phần đóng của doanh nghiệp cho cơ quan Bảo hiểm xã hội theo luật định.
                </p>
              </div>

              <div>
                <h3 className="font-bold text-slate-900 uppercase">
                  Điều 9: Đào tạo, bồi dưỡng, nâng cao trình độ kỹ năng nghề (Khoản 1h Điều 21 BLLĐ 2019)
                </h3>
                <p className="mt-1 text-slate-700 pl-2 leading-relaxed">
                  Bên B được quyền tham gia các chương trình đào tạo, bồi dưỡng chuyên môn kỹ thuật do Bên A tổ chức hoặc cử đi học. Trường hợp có phát sinh chi phí đào tạo lớn do Bên A tài trợ, hai bên sẽ giao kết Hợp đồng đào tạo nghề riêng biệt theo quy định tại Điều 62 BLLĐ 2019.
                </p>
              </div>

              <div>
                <h3 className="font-bold text-slate-900 uppercase">
                  Điều 10: Quyền và nghĩa vụ của các bên
                </h3>
                <div className="mt-1 space-y-1.5 text-slate-700 pl-2">
                  <p>
                    <strong>1. Quyền và nghĩa vụ Người lao động:</strong> Hoàn thành tốt nhiệm vụ được giao, tuân thủ nội quy lao động, quy chế làm việc và cam kết bảo mật thông tin, bí mật công nghệ của Bên A. Được quyền đơn phương chấm dứt hợp đồng lao động theo Điều 35 BLLĐ 2019 khi báo trước theo luật định.
                  </p>
                  <p>
                    <strong>2. Quyền và nghĩa vụ Người sử dụng lao động:</strong> Bảo đảm việc làm, trang bị đầy đủ điều kiện làm việc, thanh toán tiền lương và các chế độ đúng hạn. Được quyền quản lý, đánh giá năng suất và xử lý kỷ luật hoặc đơn phương chấm dứt hợp đồng theo đúng Điều 36 BLLĐ 2019.
                  </p>
                </div>
              </div>
            </>
          )}

          {/* 2. MẪU HỢP ĐỒNG THỬ VIỆC RIÊNG BIỆT (CĂN CỨ ĐIỀU 24, 25, 26, 27 BLLĐ 2019) */}
          {isProbation && (
            <>
              <div>
                <h3 className="font-bold text-slate-900 uppercase">
                  Điều 1: Vị trí thử việc, công việc và địa điểm làm việc (Khoản 2 Điều 24 BLLĐ 2019)
                </h3>
                <ul className="mt-1 list-disc list-inside space-y-1 text-slate-700 pl-2">
                  <li>
                    <strong>Vị trí thử việc:</strong> {contract.jobTitle}
                  </li>
                  <li>
                    <strong>Hình thức làm việc:</strong> {contract.workType || 'Toàn thời gian (Tại văn phòng)'}
                  </li>
                  <li>
                    <strong>Địa điểm làm việc:</strong> {contract.workLocation || 'Tại văn phòng / cơ sở của Bên A'}
                  </li>
                  <li>
                    <strong>Mục đích thử việc:</strong> Đánh giá mức độ phù hợp về năng lực chuyên môn, tác phong, tinh thần kỷ luật và hiệu suất thực tế của Bên B đối với tiêu chuẩn công việc của Bên A.
                  </li>
                </ul>
              </div>

              <div>
                <h3 className="font-bold text-slate-900 uppercase">
                  Điều 2: Thời hạn thử việc (Điều 25 BLLĐ 2019)
                </h3>
                <ul className="mt-1 list-disc list-inside space-y-1 text-slate-700 pl-2">
                  <li>
                    <strong>Thời gian thử việc:</strong> <strong>{contract.probationPeriodMonths || 2} tháng</strong>, từ ngày {startDateFormatted} đến ngày {endDateFormatted}.
                  </li>
                  <li>
                    <strong>Tuân thủ giới hạn luật định:</strong> Thời gian thử việc bảo đảm không vượt quá 60 ngày đối với công việc có chức danh nghề nghiệp cần trình độ chuyên môn kỹ thuật từ cao đẳng trở lên (hoặc không quá 180 ngày đối với người quản lý doanh nghiệp) theo Điều 25 BLLĐ 2019.
                  </li>
                  <li>
                    Chỉ được thực hiện thử việc 01 lần duy nhất đối với một vị trí công việc theo Khoản 1 Điều 25 BLLĐ 2019.
                  </li>
                </ul>
              </div>

              <div>
                <h3 className="font-bold text-slate-900 uppercase">
                  Điều 3: Thời giờ làm việc và thời giờ nghỉ ngơi
                </h3>
                <p className="mt-1 text-slate-700 pl-2 leading-relaxed">
                  Thời giờ làm việc tiêu chuẩn: {contract.workingHours || 'Thứ 2 - Thứ 6 (8h30 - 17h30)'}, 08 giờ/ngày, không quá 48 giờ/tuần. Bên B được nghỉ các ngày nghỉ hàng tuần và các ngày Lễ, Tết theo quy định chung của Bên A và Bộ luật Lao động.
                </p>
              </div>

              <div>
                <h3 className="font-bold text-slate-900 uppercase">
                  Điều 4: Tiền lương thử việc (Điều 26 BLLĐ 2019)
                </h3>
                <ul className="mt-1 list-disc list-inside space-y-1 text-slate-700 pl-2">
                  <li>
                    <strong>Tỷ lệ lương thử việc:</strong> <strong>{contract.probationSalaryRate ?? 85}%</strong> mức lương chính thức (Cam kết không thấp hơn 85% theo đúng Điều 26 BLLĐ 2019).
                  </li>
                  <li>
                    <strong>Mức lương thử việc thực hưởng:</strong>{' '}
                    <span className="font-bold text-blue-700">
                      {((Number(contract.salary) * (contract.probationSalaryRate ?? 85)) / 100).toLocaleString('vi-VN')} {contract.currency}
                    </span>{' '}
                    / {contract.salaryPeriod === 'MONTHLY' ? 'tháng' : contract.salaryPeriod}
                  </li>
                  <li>
                    <strong>Mức lương chính thức cơ sở:</strong> {formatSalary(contract.salary)} {contract.currency} / tháng (làm căn cứ giao kết hợp đồng chính thức khi hoàn thành thử việc).
                  </li>
                  <li>
                    <strong>Hình thức chi trả:</strong> Chuyển khoản ngân hàng định kỳ hàng tháng.
                  </li>
                  {contract.benefits && (
                    <li>
                      <strong>Phụ cấp và hỗ trợ trong thời gian thử việc:</strong> {contract.benefits}
                    </li>
                  )}
                </ul>
              </div>

              <div>
                <h3 className="font-bold text-slate-900 uppercase">
                  Điều 5: Quy định về Bảo hiểm xã hội đối với hợp đồng thử việc riêng biệt
                </h3>
                <p className="mt-1 text-slate-700 pl-2 leading-relaxed">
                  Căn cứ Khoản 1 Điều 2 Luật Bảo hiểm xã hội 2014 và Điều 24 Bộ luật Lao động 2019, Hợp đồng thử việc ký kết độc lập <strong>không thuộc đối tượng tham gia BHXH, BHYT, BHTN bắt buộc</strong>. Tiền lương thử việc chi trả cho Bên B là thu nhập trực tiếp; Bên A thực hiện khấu trừ và kê khai Thuế thu nhập cá nhân (TNCN) theo quy định của pháp luật thuế hiện hành.
                </p>
              </div>

              <div>
                <h3 className="font-bold text-slate-900 uppercase">
                  Điều 6: Đánh giá kết quả và Giao kết hợp đồng lao động chính thức (Điều 27 BLLĐ 2019)
                </h3>
                <p className="mt-1 text-slate-700 pl-2 leading-relaxed">
                  Khi kết thúc thời gian thử việc, Bên A thông báo kết quả thử việc cho Bên B. Trường hợp thử việc đạt yêu cầu, Bên A tiến hành giao kết Hợp đồng lao động chính thức với Bên B theo mức lương và điều kiện đã thỏa thuận. Trường hợp không đạt yêu cầu, hợp đồng thử việc đương nhiên chấm dứt hiệu lực.
                </p>
              </div>

              <div>
                <h3 className="font-bold text-slate-900 uppercase">
                  Điều 7: Quyền hủy bỏ thỏa thuận thử việc (Khoản 2 Điều 27 BLLĐ 2019)
                </h3>
                <p className="mt-1 text-slate-700 pl-2 leading-relaxed">
                  Trong thời gian thử việc, mỗi bên có quyền hủy bỏ hợp đồng thử việc mà <strong>không cần báo trước và không phải bồi thường</strong> nếu việc làm thử không đạt yêu cầu mà hai bên đã thỏa thuận.
                </p>
              </div>
            </>
          )}

          {/* 3. MẪU THỎA THUẬN THỰC TẬP VÀ ĐÀO TẠO NGHỀ (CĂN CỨ BỘ LUẬT DÂN SỰ 2015, LUẬT GDĐH & GDNN) */}
          {isInternship && (
            <>
              <div>
                <h3 className="font-bold text-slate-900 uppercase">
                  Điều 1: Mục tiêu thực tập, vị trí tiếp nhận và địa điểm
                </h3>
                <ul className="mt-1 list-disc list-inside space-y-1 text-slate-700 pl-2">
                  <li>
                    <strong>Vị trí / Lĩnh vực thực tập:</strong> {contract.jobTitle}
                  </li>
                  <li>
                    <strong>Hình thức thực tập:</strong> {contract.workType || 'Toàn thời gian / Linh hoạt kết hợp'}
                  </li>
                  <li>
                    <strong>Địa điểm thực tập:</strong> {contract.workLocation || 'Tại văn phòng Bên A hoặc kết hợp từ xa'}
                  </li>
                  <li>
                    <strong>Mục tiêu:</strong> Tạo điều kiện cho Bên B cọ xát thực tế, rèn luyện kỹ năng chuyên môn, tiếp cận quy trình phát triển sản phẩm công nghệ thực tế và hoàn thành báo cáo thực tập / đồ án tốt nghiệp đại học.
                  </li>
                </ul>
              </div>

              <div>
                <h3 className="font-bold text-slate-900 uppercase">
                  Điều 2: Thời hạn thực tập và lịch trình tham gia
                </h3>
                <ul className="mt-1 list-disc list-inside space-y-1 text-slate-700 pl-2">
                  <li>
                    <strong>Thời hạn thực tập:</strong> Từ ngày {startDateFormatted} đến hết ngày {endDateFormatted}.
                  </li>
                  <li>
                    <strong>Lịch trình làm việc:</strong> {contract.workingHours || 'Thứ 2 - Thứ 6 (Linh hoạt theo lịch học của trường)'}. Bên A tạo điều kiện thuận lợi về thời gian để Bên B tham gia các buổi học, thi tại Trường Đại học / Cơ sở đào tạo.
                  </li>
                </ul>
              </div>

              <div>
                <h3 className="font-bold text-slate-900 uppercase">
                  Điều 3: Phân công Người hướng dẫn chuyên môn (Mentor)
                </h3>
                <p className="mt-1 text-slate-700 pl-2 leading-relaxed">
                  Bên A phân công cán bộ kỹ thuật / chuyên gia có kinh nghiệm đóng vai trò Người hướng dẫn (Mentor) trực tiếp giao nhiệm vụ đào tạo, hỗ trợ kỹ năng, theo dõi tiến độ và đánh giá kết quả thực hành của Bên B trong suốt thời gian thực tập.
                </p>
              </div>

              <div>
                <h3 className="font-bold text-slate-900 uppercase">
                  Điều 4: Phụ cấp thực tập (Allowance) và Quyền lợi hỗ trợ
                </h3>
                <ul className="mt-1 list-disc list-inside space-y-1 text-slate-700 pl-2">
                  <li>
                    <strong>Mức phụ cấp thực tập:</strong>{' '}
                    <span className="font-bold text-blue-700">
                      {formatSalary(contract.salary)} {contract.currency}
                    </span>{' '}
                    / {contract.salaryPeriod === 'MONTHLY' ? 'tháng' : contract.salaryPeriod}
                  </li>
                  <li>
                    <strong>Tính chất khoản phụ cấp:</strong> Khoản tiền nêu trên là phụ cấp hỗ trợ chi phí đi lại, ăn trưa và sinh hoạt thực tế trong quá trình học tập thực tế tại doanh nghiệp, không phải tiền lương theo quan hệ lao động hợp đồng và không thuộc diện đóng BHXH bắt buộc.
                  </li>
                  <li>
                    <strong>Quyền lợi đãi ngộ khác:</strong> {contract.benefits || 'Được cấp máy tính/trang thiết bị thực hành, tham gia các buổi đào tạo công nghệ nội bộ miễn phí, phụ cấp gửi xe và tham gia hoạt động văn hóa tại doanh nghiệp.'}
                  </li>
                </ul>
              </div>

              <div>
                <h3 className="font-bold text-slate-900 uppercase">
                  Điều 5: Đánh giá, Xác nhận kết quả thực tập và Cơ hội tuyển dụng
                </h3>
                <ul className="mt-1 list-disc list-inside space-y-1 text-slate-700 pl-2">
                  <li>
                    Khi hoàn thành kỳ thực tập, Bên A có trách nhiệm nhận xét khách quan về thái độ, năng lực chuyên môn và ký, đóng dấu xác nhận Báo cáo thực tập tốt nghiệp / Luận văn cho Bên B gửi nộp cơ sở đào tạo.
                  </li>
                  <li>
                    Bên B được ưu tiên đặc cách xem xét tuyển dụng chính thức (Junior/Fresher) sau khi tốt nghiệp nếu đạt kết quả thực tập xuất sắc và đáp ứng nhu cầu nhân sự của Bên A.
                  </li>
                </ul>
              </div>

              <div>
                <h3 className="font-bold text-slate-900 uppercase">
                  Điều 6: Bảo mật thông tin (NDA) và Quyền sở hữu trí tuệ
                </h3>
                <ul className="mt-1 list-disc list-inside space-y-1 text-slate-700 pl-2">
                  <li>
                    Bên B cam kết tuyệt đối giữ bí mật mã nguồn (source code), tài liệu dự án, dữ liệu khách hàng và bí quyết công nghệ của Bên A được tiếp cận trong quá trình thực tập.
                  </li>
                  <li>
                    Mọi sản phẩm phần mềm, tài liệu nghiên cứu hoặc giải pháp kỹ thuật do Bên B tạo ra trong thời gian thực tập theo phân công của Bên A thuộc toàn quyền sở hữu của Bên A.
                  </li>
                </ul>
              </div>
            </>
          )}

          {/* ĐIỀU KHOẢN BỔ SUNG NẾU CÓ */}
          {contract.customTerms && (
            <div>
              <h3 className="font-bold text-slate-900 uppercase">
                Điều {isStandardLabor ? 11 : isProbation ? 8 : 7}: Các điều khoản thỏa thuận bổ sung đặc biệt
              </h3>
              <p className="mt-1 whitespace-pre-line text-slate-700 pl-2">
                {contract.customTerms}
              </p>
            </div>
          )}

          {/* ĐIỀU CUỐI: HIỆU LỰC & GIẢI QUYẾT TRANH CHẤP */}
          <div>
            <h3 className="font-bold text-slate-900 uppercase">
              Điều {contract.customTerms ? (isStandardLabor ? 12 : isProbation ? 9 : 8) : (isStandardLabor ? 11 : isProbation ? 8 : 7)}: Hiệu lực giao kết & Giải quyết tranh chấp
            </h3>
            <p className="mt-1 text-slate-700 pl-2 leading-relaxed">
              Văn bản này được phát hành, lưu trữ và giao kết dưới dạng văn bản điện tử có giá trị pháp lý tương đương văn bản giấy theo quy định tại <strong>{isInternship ? 'Bộ luật Dân sự 2015' : 'Điều 14 Bộ luật Lao động 2019'}</strong> và <strong>Luật Giao dịch điện tử 2023</strong>.
              Các bên xác nhận đã đọc kỹ, hiểu rõ toàn bộ quyền lợi và nghĩa vụ. Mọi tranh chấp hoặc bất đồng phát sinh sẽ được hai bên ưu tiên thương lượng, giải quyết thông qua Quy chế Tiếp nhận & Giải quyết Khiếu nại của nền tảng SmartRecruit AI trước khi yêu cầu cơ quan có thẩm quyền phân xử theo pháp luật Việt Nam.
            </p>
          </div>
        </div>
      </div>

      {/* Khu vực chữ ký */}
      <div className="mt-12 pt-6 border-t border-slate-200">
        <div className="grid grid-cols-2 gap-8 text-center text-xs">
          {/* Đại diện Bên A */}
          <div>
            <h4 className="font-extrabold uppercase text-slate-900">ĐẠI DIỆN BÊN A</h4>
            <p className="text-2xs text-slate-500 italic mt-0.5">
              {isInternship ? '(Đơn vị tiếp nhận thực tập)' : '(Người sử dụng lao động)'}
            </p>

            <div className="mt-4 flex min-h-[90px] items-center justify-center">
              {contract.employerSignatureUrl ? (
                <div className="text-center">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={contract.employerSignatureUrl}
                    alt="Chữ ký đại diện Bên A"
                    className="mx-auto max-h-16 object-contain"
                  />
                  <span className="inline-flex items-center gap-1 rounded bg-emerald-50 px-2 py-0.5 text-2xs font-bold text-emerald-700 mt-1">
                    <ShieldCheck className="size-3" /> Đã ký điện tử
                  </span>
                </div>
              ) : contract.signedPdfUrl ? (
                <span className="rounded bg-blue-50 px-2.5 py-1 text-xs font-semibold text-blue-700">
                  ✓ Đã ký trên bản gốc scan
                </span>
              ) : (
                <span className="text-slate-400 italic">Chờ ký...</span>
              )}
            </div>

            <p className="font-bold text-slate-900 mt-2">
              {recruiter?.user?.fullName || 'Đại diện Bên A'}
            </p>
            {contract.employerSignedAt && (
              <p className="text-2xs text-slate-500">
                Ngày ký: {new Date(contract.employerSignedAt).toLocaleString('vi-VN')}
              </p>
            )}
          </div>

          {/* Đại diện Bên B */}
          <div>
            <h4 className="font-extrabold uppercase text-slate-900">ĐẠI DIỆN BÊN B</h4>
            <p className="text-2xs text-slate-500 italic mt-0.5">
              {isInternship ? '(Thực tập sinh / Học viên)' : '(Người lao động)'}
            </p>

            <div className="mt-4 flex min-h-[90px] items-center justify-center">
              {contract.candidateSignatureUrl ? (
                <div className="text-center">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={contract.candidateSignatureUrl}
                    alt={isInternship ? 'Chữ ký Thực tập sinh' : 'Chữ ký Người lao động'}
                    className="mx-auto max-h-16 object-contain"
                  />
                  <span className="inline-flex items-center gap-1 rounded bg-emerald-50 px-2 py-0.5 text-2xs font-bold text-emerald-700 mt-1">
                    <ShieldCheck className="size-3" /> Đã ký điện tử
                  </span>
                </div>
              ) : contract.signedPdfUrl ? (
                <span className="rounded bg-blue-50 px-2.5 py-1 text-xs font-semibold text-blue-700">
                  ✓ Đã ký trên bản gốc scan
                </span>
              ) : (
                <span className="text-slate-400 italic">Chờ ký...</span>
              )}
            </div>

            <p className="font-bold text-slate-900 mt-2">
              {candidate?.fullName || (isInternship ? 'Thực tập sinh' : 'Người lao động')}
            </p>
            {contract.candidateSignedAt && (
              <p className="text-2xs text-slate-500">
                Ngày ký: {new Date(contract.candidateSignedAt).toLocaleString('vi-VN')}
              </p>
            )}
          </div>
        </div>

        {/* Cryptographic SHA-256 Seal Banner & Verification */}
        {contract.pdfSha256Hash && (
          <div className="mt-8 rounded-xl border border-blue-200 bg-gradient-to-r from-blue-50 to-indigo-50/50 p-4 print:border print:border-slate-300">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="flex items-center gap-2.5">
                <div className="flex size-9 items-center justify-center rounded-lg bg-blue-600 text-white shrink-0">
                  <Lock className="size-4" />
                </div>
                <div>
                  <h5 className="text-xs font-bold text-slate-900 flex items-center gap-1.5">
                    Niêm Phong Số & Toàn Vẹn Tài Liệu (SHA-256 Digital Seal)
                    <span className="rounded-full bg-emerald-100 text-emerald-800 text-2xs px-2 py-0.5 font-bold">
                      ✓ ĐÃ NIÊM PHONG
                    </span>
                  </h5>
                  <div className="mt-1 flex items-center gap-2">
                    <code className="text-2xs bg-white/80 border border-blue-200 px-2 py-0.5 rounded font-mono text-slate-700 break-all select-all">
                      {contract.pdfSha256Hash}
                    </code>
                    <button
                      type="button"
                      onClick={copyHash}
                      className="inline-flex items-center gap-1 text-2xs font-semibold text-blue-700 hover:underline shrink-0"
                    >
                      {copied ? <Check className="size-3 text-emerald-600" /> : <Copy className="size-3" />}
                      {copied ? 'Đã copy' : 'Sao chép'}
                    </button>
                  </div>
                </div>
              </div>

              <Link
                href={`/verify-contract?number=${encodeURIComponent(contract.contractNumber)}`}
                target="_blank"
                className="inline-flex items-center justify-center gap-1.5 rounded-lg bg-white border border-blue-300 px-3 py-1.5 text-xs font-bold text-blue-700 hover:bg-blue-50 shadow-sm transition shrink-0"
              >
                <ExternalLink className="size-3.5" />
                Đối Soát Tính Toàn Vẹn
              </Link>
            </div>
          </div>
        )}

        {/* Phụ Lục: Biên Bản Hoàn Thành Giao Dịch Điện Tử (DocuSign Standard Audit Trail) */}
        {(contract.candidateSignedAt || contract.employerSignedAt) && (
          <div className="mt-8 pt-6 border-t-2 border-dashed border-slate-200">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <ShieldCheck className="size-5 text-emerald-600" />
                <h4 className="text-sm font-bold text-slate-900 uppercase tracking-wide">
                  Phụ Lục: Chứng Chỉ Giao Dịch Điện Tử & Nhật Ký Kiểm Toán (Audit Trail)
                </h4>
              </div>
              <span className="text-2xs text-slate-400 font-mono">
                Chuẩn DocuSign / Điều 23 Luật GDĐT 2023
              </span>
            </div>

            <div className="overflow-hidden rounded-xl border border-slate-200 bg-white">
              <table className="w-full text-left text-xs text-slate-700">
                <thead className="bg-slate-50 text-2xs uppercase font-bold text-slate-500 border-b border-slate-200">
                  <tr>
                    <th className="px-4 py-2.5">Chủ thể giao kết</th>
                    <th className="px-4 py-2.5">Thời gian ký (UTC+7)</th>
                    <th className="px-4 py-2.5">Địa chỉ IP & Thiết bị</th>
                    <th className="px-4 py-2.5">Phương thức xác thực</th>
                    <th className="px-4 py-2.5 text-right">Trạng thái</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {/* Employer Row */}
                  <tr>
                    <td className="px-4 py-3">
                      <div className="font-bold text-slate-900">Bên A: {company?.name || 'Doanh nghiệp'}</div>
                      <div className="text-2xs text-slate-500">{recruiter?.user?.email || 'hr@company.com'}</div>
                    </td>
                    <td className="px-4 py-3 text-2xs text-slate-600">
                      {contract.employerSignedAt
                        ? new Date(contract.employerSignedAt).toLocaleString('vi-VN')
                        : 'Chưa ký'}
                    </td>
                    <td className="px-4 py-3 text-2xs text-slate-600">
                      <div>IP: {contract.employerSignerIp || '127.0.0.1'}</div>
                    </td>
                    <td className="px-4 py-3 text-2xs">
                      <div className="flex flex-col gap-0.5">
                        <span className="inline-flex items-center gap-1 font-semibold text-blue-700">
                          <KeyRound className="size-3" /> Xác thực Email 2FA OTP
                        </span>
                        {contract.employerSignedAt && (
                          <span className="text-[10px] text-emerald-700 font-medium">
                            ✓ Đã tích xác nhận đọc điều khoản HĐ & Nền tảng
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="px-4 py-3 text-right">
                      {contract.employerSignedAt ? (
                        <span className="inline-flex items-center gap-1 rounded-full bg-emerald-100 px-2 py-0.5 text-2xs font-bold text-emerald-800">
                          ✓ ĐÃ XÁC THỰC
                        </span>
                      ) : (
                        <span className="rounded-full bg-slate-100 px-2 py-0.5 text-2xs font-semibold text-slate-500">
                          ĐANG CHỜ
                        </span>
                      )}
                    </td>
                  </tr>

                  {/* Candidate Row */}
                  <tr>
                    <td className="px-4 py-3">
                      <div className="font-bold text-slate-900">Bên B: {candidate?.fullName || 'Người lao động'}</div>
                      <div className="text-2xs text-slate-500">{candidate?.email || 'candidate@example.com'}</div>
                    </td>
                    <td className="px-4 py-3 text-2xs text-slate-600">
                      {contract.candidateSignedAt
                        ? new Date(contract.candidateSignedAt).toLocaleString('vi-VN')
                        : 'Chưa ký'}
                    </td>
                    <td className="px-4 py-3 text-2xs text-slate-600">
                      <div>IP: {contract.candidateSignerIp || '127.0.0.1'}</div>
                    </td>
                    <td className="px-4 py-3 text-2xs">
                      <div className="flex flex-col gap-0.5">
                        <span className="inline-flex items-center gap-1 font-semibold text-blue-700">
                          <KeyRound className="size-3" /> Xác thực Email 2FA OTP
                        </span>
                        {contract.candidateSignedAt && (
                          <span className="text-[10px] text-emerald-700 font-medium">
                            ✓ Đã tích xác nhận đọc điều khoản HĐ & Nền tảng
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="px-4 py-3 text-right">
                      {contract.candidateSignedAt ? (
                        <span className="inline-flex items-center gap-1 rounded-full bg-emerald-100 px-2 py-0.5 text-2xs font-bold text-emerald-800">
                          ✓ ĐÃ XÁC THỰC
                        </span>
                      ) : (
                        <span className="rounded-full bg-slate-100 px-2 py-0.5 text-2xs font-semibold text-slate-500">
                          ĐANG CHỜ
                        </span>
                      )}
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>

            <p className="mt-2.5 text-2xs text-slate-500 italic text-center">
              * Bản ghi nhật ký kiểm toán này được lưu vết tự động và không thể tẩy xóa hoặc sửa đổi. Bằng chứng số có giá trị pháp lý tương đương văn bản công chứng căn cứ theo Điều 14 Bộ luật Lao động 2019.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
