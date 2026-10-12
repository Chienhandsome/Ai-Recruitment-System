'use client';

import React, { useState, useEffect } from 'react';
import {
  X,
  FileText,
  Eye,
  Send,
  Save,
  CheckCircle2,
  AlertTriangle,
  Loader2,
  Calendar,
  Building2,
  DollarSign,
  HelpCircle,
  FileSignature,
} from 'lucide-react';
import { toast } from 'sonner';
import {
  type ContractData,
  type ContractType,
  type ContractSigningMethod,
  createContract,
  updateContract,
  sendContract,
} from '@/lib/contract-api';
import { ContractDocumentView } from '@/components/common/contracts/ContractDocumentView';

interface CreateOrEditContractModalProps {
  isOpen: boolean;
  onClose: () => void;
  token: string;
  applicationId: string;
  candidateName: string;
  jobTitle: string;
  offerData?: any;
  existingContract?: ContractData | null;
  onSuccess: () => void | Promise<void>;
}

export function CreateOrEditContractModal({
  isOpen,
  onClose,
  token,
  applicationId,
  candidateName,
  jobTitle,
  offerData,
  existingContract,
  onSuccess,
}: CreateOrEditContractModalProps) {
  const [activeTab, setActiveTab] = useState<'form' | 'preview'>('form');
  const [submitting, setSubmitting] = useState(false);
  const [sending, setSending] = useState(false);

  // Form states
  const [contractType, setContractType] = useState<ContractType>('FIXED_TERM');
  const [signingMethod, setSigningMethod] = useState<ContractSigningMethod>('MANUAL');
  const [salary, setSalary] = useState<string>('');
  const [startDate, setStartDate] = useState<string>('');
  const [endDate, setEndDate] = useState<string>('');
  const [workLocation, setWorkLocation] = useState<string>('');
  const [workingHours, setWorkingHours] = useState<string>('Thứ 2 - Thứ 6 (8h30 - 17h30)');
  const [probationMonths, setProbationMonths] = useState<number>(2);
  const [probationSalaryRate, setProbationSalaryRate] = useState<number>(85);
  const [benefits, setBenefits] = useState<string>('');
  const [customTerms, setCustomTerms] = useState<string>('');

  useEffect(() => {
    if (isOpen) {
      if (existingContract) {
        setContractType(existingContract.contractType);
        setSigningMethod(existingContract.signingMethod);
        setSalary(String(existingContract.salary || ''));
        setStartDate(existingContract.startDate ? existingContract.startDate.split('T')[0] : '');
        setEndDate(existingContract.endDate ? existingContract.endDate.split('T')[0] : '');
        setWorkLocation(existingContract.workLocation || '');
        setWorkingHours(existingContract.workingHours || 'Thứ 2 - Thứ 6 (8h30 - 17h30)');
        setProbationMonths(existingContract.probationPeriodMonths ?? 2);
        setProbationSalaryRate(existingContract.probationSalaryRate ?? 85);
        setBenefits(existingContract.benefits || '');
        setCustomTerms(existingContract.customTerms || '');
      } else {
        // Pre-fill from Offer
        setContractType('FIXED_TERM');
        setSigningMethod('MANUAL');
        setSalary(offerData ? String(offerData.salary || '') : '');
        const defaultStart = offerData?.startDate
          ? offerData.startDate.split('T')[0]
          : new Date().toISOString().split('T')[0];
        setStartDate(defaultStart);

        // Default 1 year end date
        const d = new Date(defaultStart);
        d.setFullYear(d.getFullYear() + 1);
        setEndDate(d.toISOString().split('T')[0]);

        setWorkLocation(offerData?.workLocation || '');
        setWorkingHours('Thứ 2 - Thứ 6 (8h30 - 17h30)');
        setProbationMonths(2);
        setProbationSalaryRate(85);
        setBenefits(offerData?.benefits || '');
        setCustomTerms('');
      }
      setActiveTab('form');
    }
  }, [isOpen, existingContract, offerData]);

  if (!isOpen) return null;

  // Mock object for live preview
  const previewContract: ContractData = {
    id: existingContract?.id || 'preview-id',
    contractNumber: existingContract?.contractNumber || 'HDLD-DRAFT-XXXX',
    applicationId,
    status: existingContract?.status || 'DRAFT',
    contractType,
    signingMethod,
    jobTitle: existingContract?.jobTitle || jobTitle,
    salary: Number(salary) || 0,
    salaryPeriod: 'MONTHLY',
    currency: 'VND',
    startDate: startDate || new Date().toISOString(),
    endDate: contractType === 'INDEFINITE' ? null : endDate || null,
    workLocation,
    workingHours,
    probationPeriodMonths: probationMonths,
    probationSalaryRate,
    benefits,
    customTerms,
    version: existingContract?.version || 1,
    createdAt: existingContract?.createdAt || new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    application: existingContract?.application || {
      id: applicationId,
      job: {
        id: 'preview-job-id',
        title: jobTitle,
        recruiter: {
          user: { fullName: 'Đại diện tuyển dụng' },
          company: { name: 'Công ty tuyển dụng', address: workLocation },
        },
      },
      candidate: {
        id: 'candidate-id',
        fullName: candidateName,
        email: 'candidate@email.com',
      },
    },
  };

  const handleSaveDraft = async () => {
    if (!salary || isNaN(Number(salary)) || Number(salary) <= 0) {
      toast.error('Vui lòng nhập mức lương hợp lệ.');
      return;
    }
    if (!startDate) {
      toast.error('Vui lòng chọn ngày bắt đầu làm việc.');
      return;
    }

    setSubmitting(true);
    try {
      if (existingContract) {
        await updateContract(token, existingContract.id, {
          contractType,
          signingMethod,
          salary: Number(salary),
          startDate,
          endDate: contractType === 'INDEFINITE' ? undefined : endDate || undefined,
          workLocation,
          workingHours,
          probationPeriodMonths: probationMonths,
          probationSalaryRate,
          benefits,
          customTerms,
        });
        toast.success('Đã cập nhật bản nháp hợp đồng thành công!');
      } else {
        await createContract(token, {
          applicationId,
          contractType,
          signingMethod,
          salary: Number(salary),
          startDate,
          endDate: contractType === 'INDEFINITE' ? undefined : endDate || undefined,
          workLocation,
          workingHours,
          probationPeriodMonths: probationMonths,
          probationSalaryRate,
          benefits,
          customTerms,
        });
        toast.success('Đã tạo bản nháp hợp đồng thành công!');
      }
      await onSuccess();
      onClose();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Lỗi khi lưu hợp đồng');
    } finally {
      setSubmitting(false);
    }
  };

  const handleSendToCandidate = async () => {
    if (!salary || isNaN(Number(salary)) || Number(salary) <= 0) {
      toast.error('Vui lòng nhập mức lương hợp lệ.');
      return;
    }
    if (!startDate) {
      toast.error('Vui lòng chọn ngày bắt đầu làm việc.');
      return;
    }

    setSending(true);
    try {
      let contractId = existingContract?.id;
      if (!contractId) {
        const created = await createContract(token, {
          applicationId,
          contractType,
          signingMethod,
          salary: Number(salary),
          startDate,
          endDate: contractType === 'INDEFINITE' ? undefined : endDate || undefined,
          workLocation,
          workingHours,
          probationPeriodMonths: probationMonths,
          probationSalaryRate,
          benefits,
          customTerms,
        });
        contractId = created.id;
      } else {
        await updateContract(token, contractId, {
          contractType,
          signingMethod,
          salary: Number(salary),
          startDate,
          endDate: contractType === 'INDEFINITE' ? undefined : endDate || undefined,
          workLocation,
          workingHours,
          probationPeriodMonths: probationMonths,
          probationSalaryRate,
          benefits,
          customTerms,
        });
      }

      await sendContract(token, contractId);
      toast.success('Đã gửi hợp đồng cho ứng viên xem xét thành công!');
      await onSuccess();
      onClose();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Không thể gửi hợp đồng');
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 p-4 backdrop-blur-sm">
      <div className="flex h-[92vh] w-full max-w-5xl flex-col rounded-2xl border border-slate-200 bg-white shadow-2xl font-sans overflow-hidden">
        {/* Modal Header */}
        <div className="flex items-center justify-between border-b border-slate-100 px-6 py-4">
          <div className="flex items-center gap-3">
            <div className="flex size-10 items-center justify-center rounded-xl bg-blue-100 text-blue-700">
              <FileSignature className="size-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-900">
                {existingContract ? 'Điều chỉnh hợp đồng lao động' : 'Tạo hợp đồng lao động mới'}
              </h2>
              <p className="text-xs text-slate-500">
                Ứng viên: <strong className="text-slate-800">{candidateName}</strong> • Vị trí:{' '}
                <strong className="text-blue-700">{jobTitle}</strong>
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {/* Tab switch */}
            <div className="flex rounded-xl bg-slate-100 p-1 text-xs font-semibold">
              <button
                type="button"
                onClick={() => setActiveTab('form')}
                className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 transition ${
                  activeTab === 'form'
                    ? 'bg-white text-slate-900 shadow-sm'
                    : 'text-slate-500 hover:text-slate-800'
                }`}
              >
                <FileText className="size-3.5" /> Thiết lập điều khoản
              </button>
              <button
                type="button"
                onClick={() => setActiveTab('preview')}
                className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 transition ${
                  activeTab === 'preview'
                    ? 'bg-white text-slate-900 shadow-sm'
                    : 'text-slate-500 hover:text-slate-800'
                }`}
              >
                <Eye className="size-3.5" /> Xem trước văn bản
              </button>
            </div>

            <button
              type="button"
              onClick={onClose}
              className="rounded-lg p-2 text-slate-400 hover:bg-slate-100 hover:text-slate-600"
            >
              <X className="size-5" />
            </button>
          </div>
        </div>

        {/* Banner if candidate requested revision */}
        {existingContract?.status === 'REVISION_REQUESTED' && existingContract.latestRevisionNote && (
          <div className="border-b border-amber-200 bg-amber-50 px-6 py-3">
            <div className="flex items-start gap-2 text-xs text-amber-900">
              <AlertTriangle className="size-4 shrink-0 text-amber-600 mt-0.5" />
              <div>
                <strong>Ứng viên gửi ý kiến yêu cầu điều chỉnh:</strong>
                <p className="mt-0.5 text-amber-800 italic">"{existingContract.latestRevisionNote}"</p>
              </div>
            </div>
          </div>
        )}

        {/* Modal Body */}
        <div className="flex-1 overflow-y-auto p-6 bg-slate-50/40">
          {activeTab === 'form' ? (
            <div className="mx-auto max-w-3xl space-y-6">
              {/* Card 1: Loại hợp đồng & Phương thức ký */}
              <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm space-y-4">
                <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                  <FileText className="size-4 text-blue-600" />
                  Loại hợp đồng & Hình thức ký
                </h3>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Loại hợp đồng lao động
                    </label>
                    <select
                      value={contractType}
                      onChange={(e) => setContractType(e.target.value as ContractType)}
                      className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-medium text-slate-800 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                    >
                      <option value="FIXED_TERM">Hợp đồng xác định thời hạn (1 - 3 năm)</option>
                      <option value="PROBATION">Hợp đồng thử việc riêng</option>
                      <option value="INDEFINITE">Hợp đồng không xác định thời hạn</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Hình thức ký hợp đồng
                    </label>
                    <select
                      value={signingMethod}
                      onChange={(e) => setSigningMethod(e.target.value as ContractSigningMethod)}
                      className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-medium text-slate-800 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                    >
                      <option value="MANUAL">Ký tay trên bản in (HR upload bản scan PDF)</option>
                      <option value="ELECTRONIC">Ký điện tử trực tiếp trên hệ thống (Gói Pro)</option>
                    </select>
                  </div>
                </div>
              </div>

              {/* Card 2: Lương & Thời gian làm việc */}
              <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm space-y-4">
                <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                  <DollarSign className="size-4 text-emerald-600" />
                  Mức lương & Thời gian hiệu lực
                </h3>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Mức lương chính thức (VND/tháng) *
                    </label>
                    <input
                      type="number"
                      value={salary}
                      onChange={(e) => setSalary(e.target.value)}
                      placeholder="VD: 25000000"
                      className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-blue-700 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Ngày bắt đầu làm việc *
                    </label>
                    <input
                      type="date"
                      value={startDate}
                      onChange={(e) => setStartDate(e.target.value)}
                      className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-medium text-slate-800 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                    />
                  </div>

                  {contractType !== 'INDEFINITE' && (
                    <div>
                      <label className="block text-xs font-semibold text-slate-700 mb-1">
                        Ngày kết thúc hợp đồng
                      </label>
                      <input
                        type="date"
                        value={endDate}
                        onChange={(e) => setEndDate(e.target.value)}
                        className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-medium text-slate-800 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                      />
                    </div>
                  )}
                </div>

                {/* Chế độ thử việc */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2 border-t border-slate-100">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Thời gian thử việc (tháng)
                    </label>
                    <input
                      type="number"
                      min={0}
                      max={12}
                      value={probationMonths}
                      onChange={(e) => setProbationMonths(Number(e.target.value))}
                      className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-medium text-slate-800 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Hưởng lương thử việc (%)
                    </label>
                    <input
                      type="number"
                      min={50}
                      max={100}
                      value={probationSalaryRate}
                      onChange={(e) => setProbationSalaryRate(Number(e.target.value))}
                      className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-medium text-slate-800 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                    />
                  </div>
                </div>
              </div>

              {/* Card 3: Địa điểm & Thời giờ & Phúc lợi */}
              <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm space-y-4">
                <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                  <Building2 className="size-4 text-purple-600" />
                  Địa điểm & Chế độ làm việc
                </h3>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Địa điểm làm việc
                    </label>
                    <input
                      type="text"
                      value={workLocation}
                      onChange={(e) => setWorkLocation(e.target.value)}
                      placeholder="VD: Tòa nhà FPT, Cầu Giấy, Hà Nội"
                      className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-medium text-slate-800 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Thời giờ làm việc tiêu chuẩn
                    </label>
                    <input
                      type="text"
                      value={workingHours}
                      onChange={(e) => setWorkingHours(e.target.value)}
                      placeholder="VD: Thứ 2 - Thứ 6 (8h30 - 17h30)"
                      className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-medium text-slate-800 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Phúc lợi, thưởng & phụ cấp
                  </label>
                  <textarea
                    rows={2}
                    value={benefits}
                    onChange={(e) => setBenefits(e.target.value)}
                    placeholder="VD: Thưởng lương tháng 13, Bảo hiểm PVI, Hỗ trợ cơm trưa..."
                    className="w-full rounded-xl border border-slate-200 bg-white p-3 text-xs font-medium text-slate-800 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100 resize-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Điều khoản bổ sung đặc biệt (Tùy chọn)
                  </label>
                  <textarea
                    rows={2}
                    value={customTerms}
                    onChange={(e) => setCustomTerms(e.target.value)}
                    placeholder="VD: Điều khoản bảo mật NDA, cam kết không cạnh tranh sau thôi việc..."
                    className="w-full rounded-xl border border-slate-200 bg-white p-3 text-xs font-medium text-slate-800 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100 resize-none"
                  />
                </div>
              </div>
            </div>
          ) : (
            <div className="py-2">
              <ContractDocumentView contract={previewContract} showPrintButton={false} />
            </div>
          )}
        </div>

        {/* Modal Footer Actions */}
        <div className="flex items-center justify-between border-t border-slate-100 bg-white px-6 py-4">
          <button
            type="button"
            onClick={onClose}
            className="rounded-xl border border-slate-200 px-4 py-2 text-xs font-bold text-slate-600 hover:bg-slate-50"
          >
            Đóng
          </button>

          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={handleSaveDraft}
              disabled={submitting || sending}
              className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2 text-xs font-bold text-slate-700 shadow-sm transition hover:bg-slate-50 disabled:opacity-50"
            >
              {submitting ? <Loader2 className="size-4 animate-spin" /> : <Save className="size-4" />}
              Lưu bản nháp
            </button>

            <button
              type="button"
              onClick={handleSendToCandidate}
              disabled={submitting || sending}
              className="inline-flex items-center gap-2 rounded-xl bg-[#2563EB] px-5 py-2 text-xs font-bold text-white shadow-sm transition hover:bg-blue-700 disabled:opacity-50"
            >
              {sending ? <Loader2 className="size-4 animate-spin" /> : <Send className="size-4" />}
              Gửi ứng viên duyệt
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
