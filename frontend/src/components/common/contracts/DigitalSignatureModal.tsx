'use client';

import React, { useRef, useState, useEffect } from 'react';
import {
  X,
  RotateCcw,
  Check,
  PenTool,
  ShieldCheck,
  Loader2,
  KeyRound,
  Send,
  AlertCircle,
  FileCheck2,
} from 'lucide-react';
import { toast } from 'sonner';
import { requestContractOtp } from '@/lib/contract-api';
import { PolicyQuickViewModal } from '@/components/common/policies/PolicyQuickViewModal';

interface DigitalSignatureModalProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  signerName: string;
  contractId: string;
  token: string;
  onSignConfirmed: (
    signatureDataUrl: string,
    otpCode: string,
    options?: { acceptedContractTerms: boolean; acceptedPlatformTerms: boolean },
  ) => Promise<void>;
}

export function DigitalSignatureModal({
  isOpen,
  onClose,
  title = 'Ký tên điện tử',
  signerName,
  contractId,
  token,
  onSignConfirmed,
}: DigitalSignatureModalProps) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [hasSignature, setHasSignature] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Mandatory Legal Terms Checkbox states
  const [acceptedContractTerms, setAcceptedContractTerms] = useState(false);
  const [acceptedPlatformTerms, setAcceptedPlatformTerms] = useState(false);
  const [viewingPolicyCode, setViewingPolicyCode] = useState<string | null>(null);

  // OTP state
  const [otpCode, setOtpCode] = useState('');
  const [isSendingOtp, setIsSendingOtp] = useState(false);
  const [otpSent, setOtpSent] = useState(false);
  const [destinationEmail, setDestinationEmail] = useState('');
  const [countdown, setCountdown] = useState(0);
  const [demoOtp, setDemoOtp] = useState<string | null>(null);

  useEffect(() => {
    let timer: NodeJS.Timeout;
    if (countdown > 0) {
      timer = setTimeout(() => setCountdown(countdown - 1), 1000);
    }
    return () => clearTimeout(timer);
  }, [countdown]);

  useEffect(() => {
    if (isOpen) {
      setOtpCode('');
      setOtpSent(false);
      setDemoOtp(null);
      setCountdown(0);
      setAcceptedContractTerms(false);
      setAcceptedPlatformTerms(false);
      setViewingPolicyCode(null);
      setTimeout(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;
        const ctx = canvas.getContext('2d');
        if (!ctx) return;
        ctx.strokeStyle = '#1E3A8A'; // Deep blue ink
        ctx.lineWidth = 2.5;
        ctx.lineCap = 'round';
        ctx.lineJoin = 'round';
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        setHasSignature(false);
      }, 100);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleRequestOtp = async () => {
    if (countdown > 0) return;
    setIsSendingOtp(true);
    try {
      const res = await requestContractOtp(token, contractId);
      setOtpSent(true);
      setDestinationEmail(res.destinationEmail);
      setCountdown(60);
      if (res.demoOtp) {
        setDemoOtp(res.demoOtp);
        setOtpCode(res.demoOtp); // Auto-fill for seamless user testing
      }
      toast.success(res.message || 'Đã gửi mã xác thực OTP.');
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Không thể gửi mã OTP.');
    } finally {
      setIsSendingOtp(false);
    }
  };

  const startDrawing = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    setIsDrawing(true);
    draw(e);
  };

  const stopDrawing = () => {
    setIsDrawing(false);
    const canvas = canvasRef.current;
    if (canvas) {
      const ctx = canvas.getContext('2d');
      ctx?.beginPath();
    }
  };

  const getCoordinates = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return { x: 0, y: 0 };
    const rect = canvas.getBoundingClientRect();
    if ('touches' in e) {
      const touch = e.touches[0];
      return {
        x: touch.clientX - rect.left,
        y: touch.clientY - rect.top,
      };
    }
    return {
      x: e.clientX - rect.left,
      y: e.clientY - rect.top,
    };
  };

  const draw = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    if (!isDrawing) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const { x, y } = getCoordinates(e);
    ctx.lineTo(x, y);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(x, y);
    setHasSignature(true);
  };

  const handleClear = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.beginPath();
    setHasSignature(false);
  };

  const handleConfirm = async () => {
    if (!hasSignature) {
      toast.error('Vui lòng vẽ chữ ký của bạn vào khung bên dưới.');
      return;
    }
    if (!otpSent) {
      toast.error('Vui lòng bấm "Gửi mã OTP" để xác thực danh tính trước khi ký.');
      return;
    }
    if (!acceptedContractTerms) {
      toast.error('Vui lòng tích chọn xác nhận đã đọc và đồng ý toàn bộ nội dung hợp đồng lao động.');
      return;
    }
    if (!acceptedPlatformTerms) {
      toast.error('Vui lòng tích chọn đồng ý với Điều khoản dịch vụ và Quy chế giải quyết tranh chấp nền tảng.');
      return;
    }

    const canvas = canvasRef.current;
    if (!canvas) return;

    const dataUrl = canvas.toDataURL('image/png');
    setIsSubmitting(true);
    try {
      await onSignConfirmed(dataUrl, otpCode.trim(), { acceptedContractTerms, acceptedPlatformTerms });
      toast.success('Hợp đồng đã được ký điện tử và niêm phong số thành công!');
      onClose();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Ký số thất bại.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 p-4 backdrop-blur-sm">
      <div className="w-full max-w-xl rounded-2xl border border-slate-200 bg-white p-6 shadow-2xl font-sans">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-100 pb-4">
          <div className="flex items-center gap-3">
            <div className="flex size-10 items-center justify-center rounded-xl bg-blue-100 text-blue-700">
              <FileCheck2 className="size-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900">{title}</h3>
              <p className="text-xs text-slate-500">
                Xác thực chủ thể: <strong className="text-slate-800">{signerName}</strong>
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            disabled={isSubmitting}
            className="rounded-lg p-2 text-slate-400 hover:bg-slate-100 hover:text-slate-600 disabled:opacity-50"
          >
            <X className="size-5" />
          </button>
        </div>

        {/* Step 1: 2FA OTP Authentication */}
        <div className="mt-4 rounded-xl border border-blue-200 bg-blue-50/50 p-3.5">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <KeyRound className="size-4 text-[#2563EB] shrink-0" />
              <div>
                <span className="text-xs font-bold text-slate-900 block">
                  Bước 1: Xác thực OTP qua Email (Chuẩn DocuSign)
                </span>
                <span className="text-2xs text-slate-500">
                  {otpSent
                    ? `Mã 6 số đã được gửi đến: ${destinationEmail}`
                    : 'Bấm nút để nhận mã OTP xác thực danh tính vào email'}
                </span>
              </div>
            </div>

            <button
              type="button"
              onClick={handleRequestOtp}
              disabled={isSendingOtp || countdown > 0 || isSubmitting}
              className="inline-flex items-center justify-center gap-1.5 rounded-lg bg-white border border-blue-300 px-3 py-1.5 text-xs font-semibold text-[#2563EB] hover:bg-blue-50 disabled:opacity-50 transition shrink-0"
            >
              {isSendingOtp ? (
                <Loader2 className="size-3.5 animate-spin" />
              ) : (
                <Send className="size-3.5" />
              )}
              {countdown > 0 ? `Gửi lại (${countdown}s)` : otpSent ? 'Gửi lại OTP' : 'Gửi mã OTP'}
            </button>
          </div>

          {/* OTP input & demo helper */}
          {otpSent && (
            <div className="mt-3 pt-3 border-t border-blue-200/60 flex flex-wrap items-center gap-3">
              <label className="text-xs font-bold text-slate-700">
                Nhập mã OTP 6 số:
              </label>
              <input
                type="text"
                maxLength={6}
                value={otpCode}
                onChange={(e) => setOtpCode(e.target.value.replace(/\D/g, ''))}
                placeholder="Ví dụ: 123456"
                className="w-36 rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-center text-sm font-bold tracking-widest text-slate-900 outline-none focus:border-[#2563EB] focus:ring-2 focus:ring-blue-100"
              />
              {demoOtp && (
                <span className="inline-flex items-center gap-1 rounded-md bg-amber-100 px-2 py-0.5 text-2xs font-bold text-amber-800">
                  <AlertCircle className="size-3" />
                  Mã thử nghiệm (Dev): {demoOtp}
                </span>
              )}
            </div>
          )}
        </div>

        {/* Step 2: Signature canvas drawing area */}
        <div className="mt-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-semibold text-slate-700 flex items-center gap-1.5">
              <PenTool className="size-3.5 text-[#2563EB]" />
              Bước 2: Vẽ chữ ký của bạn vào khung bên dưới:
            </span>
            <button
              type="button"
              onClick={handleClear}
              disabled={!hasSignature || isSubmitting}
              className="inline-flex items-center gap-1 text-xs font-medium text-slate-500 hover:text-rose-600 disabled:opacity-40"
            >
              <RotateCcw className="size-3.5" /> Vẽ lại
            </button>
          </div>

          <div className="relative overflow-hidden rounded-xl border-2 border-dashed border-slate-300 bg-slate-50/70 hover:border-blue-400 transition">
            <canvas
              ref={canvasRef}
              width={520}
              height={160}
              onMouseDown={startDrawing}
              onMouseUp={stopDrawing}
              onMouseMove={draw}
              onMouseLeave={stopDrawing}
              onTouchStart={startDrawing}
              onTouchEnd={stopDrawing}
              onTouchMove={draw}
              className="w-full h-[160px] cursor-crosshair touch-none"
            />
            {!hasSignature && (
              <div className="pointer-events-none absolute inset-0 flex items-center justify-center text-xs text-slate-400 select-none">
                Dùng chuột hoặc ngón tay để vẽ chữ ký tại đây
              </div>
            )}
          </div>
        </div>

        {/* Step 3: Mandatory Legal Term Acknowledgements */}
        <div className="mt-4 rounded-xl border border-blue-200 bg-blue-50/40 p-3.5 space-y-2.5">
          <span className="text-xs font-bold text-slate-900 block">
            Bước 3: Xác nhận cam kết & chấp thuận điều khoản (Bắt buộc)
          </span>

          <label className="flex items-start gap-2.5 cursor-pointer group">
            <input
              type="checkbox"
              checked={acceptedContractTerms}
              onChange={(e) => setAcceptedContractTerms(e.target.checked)}
              className="mt-0.5 size-4 rounded border-slate-300 text-[#2563EB] focus:ring-blue-500 cursor-pointer"
            />
            <span className="text-xs text-slate-700 leading-snug group-hover:text-slate-900 select-none">
              Tôi xác nhận <strong>đã đọc kỹ, hiểu rõ và đồng ý toàn bộ quyền lợi, nghĩa vụ</strong> trong bản Hợp đồng lao động này.
            </span>
          </label>

          <label className="flex items-start gap-2.5 cursor-pointer group">
            <input
              type="checkbox"
              checked={acceptedPlatformTerms}
              onChange={(e) => setAcceptedPlatformTerms(e.target.checked)}
              className="mt-0.5 size-4 rounded border-slate-300 text-[#2563EB] focus:ring-blue-500 cursor-pointer"
            />
            <span className="text-xs text-slate-700 leading-snug group-hover:text-slate-900 select-none">
              Tôi đồng ý tuân thủ{' '}
              <button
                type="button"
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  setViewingPolicyCode('TERMS_OF_SERVICE');
                }}
                className="font-bold text-[#2563EB] underline hover:text-blue-800 cursor-pointer"
              >
                Điều khoản Dịch vụ Nền tảng
              </button>{' '}
              và{' '}
              <button
                type="button"
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  setViewingPolicyCode('DISPUTE_POLICY');
                }}
                className="font-bold text-[#2563EB] underline hover:text-blue-800 cursor-pointer"
              >
                Quy chế Giải quyết Tranh chấp
              </button>{' '}
              của SmartRecruit AI.
            </span>
          </label>
        </div>

        {/* Legal commitment statement */}
        <div className="mt-3 flex items-start gap-2 rounded-lg bg-emerald-50/60 p-2.5 text-2xs text-emerald-800 border border-emerald-200">
          <ShieldCheck className="size-4 shrink-0 text-emerald-600 mt-0.5" />
          <span>
            <strong>Giá trị pháp lý:</strong> Việc ký xác nhận kết hợp mã OTP thể hiện ý chí tự nguyện giao kết Hợp đồng lao động theo <strong>Điều 14 Bộ luật Lao động 2019</strong> và <strong>Điều 22, 23 Luật Giao dịch điện tử 2023</strong>. Hệ thống sẽ lưu vết IP, thời gian, trạng thái đồng thuận điều khoản và niêm phong số văn bản bằng mã băm SHA-256.
          </span>
        </div>

        {/* Footer actions */}
        <div className="mt-5 flex justify-end gap-3 border-t border-slate-100 pt-4">
          <button
            type="button"
            onClick={onClose}
            disabled={isSubmitting}
            className="rounded-xl border border-slate-200 px-4 py-2 text-xs font-bold text-slate-600 hover:bg-slate-50 disabled:opacity-50"
          >
            Hủy bỏ
          </button>
          <button
            type="button"
            onClick={handleConfirm}
            disabled={
              !hasSignature ||
              !otpSent ||
              otpCode.length !== 6 ||
              !acceptedContractTerms ||
              !acceptedPlatformTerms ||
              isSubmitting
            }
            className="inline-flex items-center gap-2 rounded-xl bg-[#2563EB] px-5 py-2 text-xs font-bold text-white shadow-sm transition hover:bg-blue-700 disabled:opacity-50"
          >
            {isSubmitting ? (
              <>
                <Loader2 className="size-4 animate-spin" />
                Đang xác thực & niêm phong...
              </>
            ) : (
              <>
                <Check className="size-4" />
                Xác nhận Ký & Niêm phong Hợp đồng
              </>
            )}
          </button>
        </div>
      </div>

      {/* In-context policy view modal */}
      <PolicyQuickViewModal
        isOpen={Boolean(viewingPolicyCode)}
        onClose={() => setViewingPolicyCode(null)}
        policyCode={viewingPolicyCode}
      />
    </div>
  );
}
