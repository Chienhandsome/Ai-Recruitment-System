'use client';

import { CheckCircle2, Loader2, RefreshCw, ShieldAlert, X } from 'lucide-react';

export type InterviewDecisionAction = 'PASS' | 'REJECT' | 'RETRY';

interface InterviewDecisionDialogProps {
  open: boolean;
  action: InterviewDecisionAction | null;
  roundTitle: string;
  nextRoundTitle?: string | null;
  isFinalRound: boolean;
  submitting: boolean;
  onClose: () => void;
  onConfirm: () => void;
}

export function InterviewDecisionDialog({
  open,
  action,
  roundTitle,
  nextRoundTitle,
  isFinalRound,
  submitting,
  onClose,
  onConfirm,
}: InterviewDecisionDialogProps) {
  if (!open || !action) return null;

  const content =
    action === 'REJECT'
      ? {
          title: 'Xác nhận từ chối ứng viên',
          description: `Vòng "${roundTitle}" sẽ được đánh dấu không đạt. Hồ sơ chuyển sang Chưa phù hợp và các vòng còn lại sẽ bị hủy.`,
          confirmLabel: 'Từ chối ứng viên',
          icon: ShieldAlert,
          iconClass: 'bg-rose-100 text-rose-700',
          buttonClass: 'bg-rose-700 text-white hover:bg-rose-800',
        }
      : action === 'RETRY'
        ? {
            title: 'Yêu cầu thực hiện lại vòng',
            description: `Kết quả hiện tại của vòng "${roundTitle}" sẽ được xóa. Ứng viên có thể thực hiện lại vòng này từ đầu.`,
            confirmLabel: 'Mở lại vòng',
            icon: RefreshCw,
            iconClass: 'bg-amber-100 text-amber-800',
            buttonClass: 'bg-amber-600 text-white hover:bg-amber-700',
          }
        : {
            title: isFinalRound ? 'Hoàn tất quy trình phỏng vấn' : 'Cho ứng viên qua vòng này',
            description: isFinalRound
              ? `Vòng "${roundTitle}" sẽ được đánh dấu đạt. Hồ sơ chuyển sang Đã phỏng vấn và chưa tự động gửi Offer.`
              : `Vòng "${roundTitle}" sẽ được đánh dấu đạt và vòng "${nextRoundTitle || 'tiếp theo'}" sẽ được mở.`,
            confirmLabel: isFinalRound ? 'Hoàn tất phỏng vấn' : 'Mở vòng tiếp theo',
            icon: CheckCircle2,
            iconClass: 'bg-blue-100 text-blue-700',
            buttonClass: 'bg-blue-700 text-white hover:bg-blue-800',
          };

  const Icon = content.icon;

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-950/60 p-4 backdrop-blur-sm"
      role="presentation"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget && !submitting) onClose();
      }}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="interview-decision-title"
        className="w-full max-w-md rounded-2xl border border-slate-200 bg-white shadow-2xl shadow-slate-950/20"
      >
        <div className="flex items-start gap-4 p-5">
          <div
            className={`flex size-11 shrink-0 items-center justify-center rounded-xl ${content.iconClass}`}
          >
            <Icon className="size-5" aria-hidden="true" />
          </div>
          <div className="min-w-0 flex-1">
            <h3 id="interview-decision-title" className="text-base font-black text-slate-950">
              {content.title}
            </h3>
            <p className="mt-1.5 text-sm leading-6 text-slate-600">{content.description}</p>
          </div>
          <button
            type="button"
            onClick={onClose}
            disabled={submitting}
            aria-label="Đóng hộp thoại xác nhận"
            className="rounded-lg p-1.5 text-slate-400 transition hover:bg-slate-100 hover:text-slate-700 disabled:opacity-50"
          >
            <X className="size-4" aria-hidden="true" />
          </button>
        </div>

        <div className="flex flex-col-reverse gap-2 border-t border-slate-100 px-5 py-4 sm:flex-row sm:justify-end">
          <button
            type="button"
            onClick={onClose}
            disabled={submitting}
            className="rounded-xl border border-slate-300 bg-white px-4 py-2.5 text-sm font-bold text-slate-700 transition hover:bg-slate-50 active:scale-[0.98] disabled:opacity-50"
          >
            Quay lại
          </button>
          <button
            type="button"
            onClick={onConfirm}
            disabled={submitting}
            className={`inline-flex items-center justify-center gap-2 rounded-xl px-4 py-2.5 text-sm font-black transition active:scale-[0.98] disabled:opacity-50 ${content.buttonClass}`}
          >
            {submitting && <Loader2 className="size-4 animate-spin" aria-hidden="true" />}
            {content.confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}
