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
      case 'INDEFINITE':
        return 'HỢP ĐỒNG LAO ĐỘNG KHÔNG XÁC ĐỊNH THỜI HẠN';
      case 'FIXED_TERM':
      default:
        return 'HỢP ĐỒNG LAO ĐỘNG XÁC ĐỊNH THỜI HẠN';
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
        Căn cứ Bộ luật Lao động nước Cộng hòa Xã hội Chủ nghĩa Việt Nam số 45/2019/QH14 và các văn bản hướng dẫn thi hành hiện hành.
        Hôm nay, ngày {new Date().toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric' })}, chúng tôi gồm các bên dưới đây thống nhất ký kết hợp đồng:
      </p>

      {/* Bên A & Bên B */}
      <div className="mt-6 space-y-6 text-xs leading-relaxed">
        {/* Bên A */}
        <div className="rounded-xl border border-slate-100 bg-[#EFF6FF]/40 p-4">
          <h2 className="mb-2 font-bold uppercase tracking-wide text-slate-900">
            BÊN A: NGƯỜI SỬ DỤNG LAO ĐỘNG
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
            BÊN B: NGƯỜI LAO ĐỘNG
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

        {/* Các điều khoản */}
        <div className="space-y-4 pt-2">
          {/* Điều 1 */}
          <div>
            <h3 className="font-bold text-slate-900 uppercase">
              Điều 1: Vị trí công tác và thời hạn hợp đồng
            </h3>
            <ul className="mt-1 list-disc list-inside space-y-1 text-slate-700 pl-2">
              <li>
                <strong>Vị trí đảm nhiệm:</strong> {contract.jobTitle}
              </li>
              <li>
                <strong>Hình thức làm việc:</strong> {contract.workType || 'Toàn thời gian'}
              </li>
              <li>
                <strong>Ngày bắt đầu làm việc:</strong> {startDateFormatted}
              </li>
              <li>
                <strong>Thời hạn hợp đồng:</strong> Từ {startDateFormatted} đến {endDateFormatted}
              </li>
              <li>
                <strong>Địa điểm làm việc:</strong> {contract.workLocation || 'Tại văn phòng công ty'}
              </li>
              <li>
                <strong>Thời giờ làm việc:</strong> {contract.workingHours || 'Thứ 2 - Thứ 6 (8h30 - 17h30)'}
              </li>
            </ul>
          </div>

          {/* Điều 2 */}
          <div>
            <h3 className="font-bold text-slate-900 uppercase">
              Điều 2: Chế độ thử việc (Nếu áp dụng)
            </h3>
            <p className="mt-1 text-slate-700 pl-2">
              Thời gian thử việc là <strong>{contract.probationPeriodMonths ?? 2} tháng</strong> kể từ ngày bắt đầu nhận việc.
              Trong thời gian thử việc, Người lao động được hưởng <strong>{contract.probationSalaryRate ?? 85}%</strong> mức lương chính thức và các quyền lợi theo quy định hiện hành.
            </p>
          </div>

          {/* Điều 3 */}
          <div>
            <h3 className="font-bold text-slate-900 uppercase">
              Điều 3: Tiền lương và chế độ đãi ngộ
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
                <strong>Hình thức chi trả:</strong> Chuyển khoản ngân hàng định kỳ hàng tháng.
              </li>
              {contract.benefits && (
                <li>
                  <strong>Chế độ đãi ngộ & phụ cấp:</strong> {contract.benefits}
                </li>
              )}
            </ul>
          </div>

          {/* Điều 4 */}
          <div>
            <h3 className="font-bold text-slate-900 uppercase">
              Điều 4: Quyền và nghĩa vụ của các bên
            </h3>
            <div className="mt-1 space-y-1 text-slate-700 pl-2">
              <p>
                <strong>1. Quyền và nghĩa vụ Người lao động:</strong> Hoàn thành tốt nhiệm vụ được giao, tuân thủ nội quy lao động, quy chế an toàn và bảo mật thông tin nội bộ của Bên A. Được hưởng đầy đủ quyền lợi BHXH, BHYT, BHTN theo pháp luật lao động.
              </p>
              <p>
                <strong>2. Quyền và nghĩa vụ Người sử dụng lao động:</strong> Bảo đảm việc làm, trang bị thiết bị làm việc, thanh toán đầy đủ và đúng hạn tiền lương cũng như các chế độ theo thỏa thuận.
              </p>
            </div>
          </div>

          {/* Điều 5 (Custom Terms) */}
          {contract.customTerms && (
            <div>
              <h3 className="font-bold text-slate-900 uppercase">
                Điều 5: Các điều khoản bổ sung đặc biệt
              </h3>
              <p className="mt-1 whitespace-pre-line text-slate-700 pl-2">
                {contract.customTerms}
              </p>
            </div>
          )}

          {/* Điều cuối */}
          <div>
            <h3 className="font-bold text-slate-900 uppercase">
              Điều {contract.customTerms ? 6 : 5}: Hiệu lực thi hành & Giải quyết tranh chấp
            </h3>
            <p className="mt-1 text-slate-700 pl-2 leading-relaxed">
              Hợp đồng này được phát hành và giao kết dưới dạng văn bản điện tử có giá trị pháp lý tương đương văn bản giấy theo <strong>Điều 14 Bộ luật Lao động 2019</strong> và <strong>Luật Giao dịch điện tử 2023</strong>. Các bên xác nhận đã đọc kỹ, hiểu rõ toàn bộ quyền lợi và nghĩa vụ. Trường hợp phát sinh bất đồng hoặc khiếu nại, hai bên cam kết ưu tiên thương lượng và giải quyết theo Quy chế Tiếp nhận & Giải quyết Khiếu nại của nền tảng SmartRecruit AI trước khi yêu cầu cơ quan có thẩm quyền giải quyết.
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
            <p className="text-2xs text-slate-500 italic mt-0.5">(Ký, đóng dấu, ghi rõ họ tên)</p>
            
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
            <p className="text-2xs text-slate-500 italic mt-0.5">(Ký, ghi rõ họ tên)</p>

            <div className="mt-4 flex min-h-[90px] items-center justify-center">
              {contract.candidateSignatureUrl ? (
                <div className="text-center">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={contract.candidateSignatureUrl}
                    alt="Chữ ký Người lao động"
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
              {candidate?.fullName || 'Người lao động'}
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
