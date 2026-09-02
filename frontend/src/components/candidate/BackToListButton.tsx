'use client';

import React from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft } from 'lucide-react';

export function BackToListButton() {
  const router = useRouter();

  const handleBack = () => {
    if (typeof window !== 'undefined' && window.history.length > 1) {
      router.back();
    } else {
      router.push('/candidate');
    }
  };

  return (
    <button
      type="button"
      onClick={handleBack}
      className="inline-flex items-center gap-2 rounded-xl text-sm font-semibold text-muted-foreground transition hover:text-foreground active:translate-y-px"
    >
      <ArrowLeft className="size-4" strokeWidth={1.8} />
      Quay lại danh sách
    </button>
  );
}
