'use client';

import React, { useRef, useState, useEffect } from 'react';
import { X, RotateCcw, Check, PenTool, ShieldCheck, Loader2 } from 'lucide-react';
import { toast } from 'sonner';

interface DigitalSignatureModalProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  signerName: string;
  onSignConfirmed: (signatureDataUrl: string) => Promise<void>;
}

export function DigitalSignatureModal({
  isOpen,
  onClose,
  title = 'Ký tên điện tử',
  signerName,
  onSignConfirmed,
}: DigitalSignatureModalProps) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [hasSignature, setHasSignature] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (isOpen) {
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
      toast.error('Vui lòng vẽ chữ ký của bạn trước khi xác nhận.');
      return;
    }
    const canvas = canvasRef.current;
    if (!canvas) return;

    const dataUrl = canvas.toDataURL('image/png');
    setIsSubmitting(true);
    try {
      await onSignConfirmed(dataUrl);
      toast.success('Đã hoàn tất ký điện tử thành công!');
      onClose();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Ký số thất bại.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 p-4 backdrop-blur-sm">
      <div className="w-full max-w-lg rounded-2xl border border-slate-200 bg-white p-6 shadow-2xl font-sans">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-100 pb-4">
          <div className="flex items-center gap-3">
            <div className="flex size-10 items-center justify-center rounded-xl bg-blue-100 text-blue-700">
              <PenTool className="size-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900">{title}</h3>
              <p className="text-xs text-slate-500">
                Người ký: <strong className="text-slate-800">{signerName}</strong>
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

        {/* Canvas drawing area */}
        <div className="mt-5">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-semibold text-slate-600 flex items-center gap-1.5">
              <ShieldCheck className="size-4 text-emerald-600" />
              Vẽ chữ ký của bạn vào khung bên dưới:
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

          <div className="relative overflow-hidden rounded-xl border-2 border-dashed border-slate-300 bg-slate-50/50 hover:border-blue-400 transition">
            <canvas
              ref={canvasRef}
              width={460}
              height={180}
              onMouseDown={startDrawing}
              onMouseUp={stopDrawing}
              onMouseMove={draw}
              onMouseLeave={stopDrawing}
              onTouchStart={startDrawing}
              onTouchEnd={stopDrawing}
              onTouchMove={draw}
              className="w-full h-[180px] cursor-crosshair touch-none"
            />
            {!hasSignature && (
              <div className="pointer-events-none absolute inset-0 flex items-center justify-center text-xs text-slate-400 select-none">
                Dùng chuột hoặc ngón tay để vẽ chữ ký tại đây
              </div>
            )}
          </div>
          <p className="mt-2 text-2xs text-slate-400 italic">
            * Bằng việc bấm Xác nhận ký, bạn đồng ý với việc gắn dấu thời gian và lưu vết chữ ký điện tử trên hệ thống.
          </p>
        </div>

        {/* Footer actions */}
        <div className="mt-6 flex justify-end gap-3 border-t border-slate-100 pt-4">
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
            disabled={!hasSignature || isSubmitting}
            className="inline-flex items-center gap-2 rounded-xl bg-[#2563EB] px-5 py-2 text-xs font-bold text-white shadow-sm transition hover:bg-blue-700 disabled:opacity-50"
          >
            {isSubmitting ? (
              <>
                <Loader2 className="size-4 animate-spin" />
                Đang xử lý...
              </>
            ) : (
              <>
                <Check className="size-4" />
                Xác nhận ký tên
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
