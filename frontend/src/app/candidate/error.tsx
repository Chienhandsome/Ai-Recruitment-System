'use client';

import { AlertCircle, RotateCcw } from 'lucide-react';
import { Button } from '@/components/ui/button';

export default function CandidateHomeError({ reset }: { reset: () => void }) {
  return (
    <div className="mx-auto flex min-h-[60dvh] w-full max-w-3xl items-center px-4 py-12 sm:px-6">
      <div className="w-full rounded-2xl border bg-surface px-6 py-12 text-center">
        <AlertCircle className="mx-auto size-10 text-error" strokeWidth={1.6} />
        <h1 className="mt-4 text-2xl font-bold text-foreground">Đã có sự cố khi tải dữ liệu</h1>
        <p className="mx-auto mt-2 max-w-md text-sm leading-relaxed text-muted-foreground">
          Kết nối có thể đang gián đoạn. Vui lòng thử lại sau ít phút.
        </p>
        <Button onClick={reset} className="mt-6 active:translate-y-px">
          <RotateCcw className="size-4" strokeWidth={1.8} />
          Thử lại
        </Button>
      </div>
    </div>
  );
}
