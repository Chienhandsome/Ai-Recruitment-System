'use client';

import { AlertCircle, RotateCcw } from 'lucide-react';
import { Button } from '@/components/ui/button';

export default function CandidateHomeError({ reset }: { reset: () => void }) {
  return (
    <div className="mx-auto flex min-h-[60dvh] w-full max-w-3xl items-center px-4 py-12 sm:px-6">
      <div className="w-full rounded-2xl border bg-white px-6 py-14 text-center shadow-[0_18px_48px_-40px_rgba(15,23,42,0.75)]">
        <span className="mx-auto flex size-12 items-center justify-center rounded-2xl bg-red-50 text-red-600">
          <AlertCircle className="size-6" strokeWidth={1.6} />
        </span>
        <h1 className="mt-4 text-2xl font-bold text-foreground">Đã có sự cố khi tải dữ liệu</h1>
        <p className="mx-auto mt-2 max-w-md text-sm leading-relaxed text-muted-foreground">
          Kết nối có thể đang gián đoạn. Vui lòng thử lại sau ít phút.
        </p>
        <Button onClick={reset} className="mt-6 rounded-xl active:translate-y-px">
          <RotateCcw className="size-4" strokeWidth={1.8} />
          Thử lại
        </Button>
      </div>
    </div>
  );
}
