'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Send, CheckCircle } from 'lucide-react';
import { ApplyJobModal } from '@/components/candidate/ApplyJobModal';

interface ApplyButtonProps {
  jobId: string;
  hasApplied?: boolean;
  jobTitle?: string;
  companyName?: string;
  requiresProofOfWork?: boolean;
  proofOfWorkType?: string | null;
  isAuthenticated?: boolean;
}

export function ApplyButton({
  jobId,
  hasApplied,
  jobTitle = 'Vị trí tuyển dụng',
  companyName = 'Công ty tuyển dụng',
  requiresProofOfWork = false,
  proofOfWorkType = 'PORTFOLIO',
  isAuthenticated = true,
}: ApplyButtonProps) {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const router = useRouter();

  const handleOpenApply = () => {
    if (!isAuthenticated) {
      router.push(`/login?next=/candidate/jobs/${jobId}`);
      return;
    }
    setIsModalOpen(true);
  };

  if (hasApplied) {
    return (
      <div className="mt-4 rounded-xl border border-primary/20 bg-primary/5 p-4 text-center">
        <div className="flex flex-col items-center gap-2">
          <div className="flex size-10 items-center justify-center rounded-full bg-primary/10 text-primary">
            <CheckCircle className="size-5" />
          </div>
          <p className="font-semibold text-primary">Bạn đã ứng tuyển vị trí này</p>
        </div>
      </div>
    );
  }

  return (
    <>
      <Button
        className="mt-4 w-full active:translate-y-px font-bold"
        onClick={handleOpenApply}
        size="lg"
      >
        <Send className="mr-2 size-4" />
        Ứng tuyển ngay
      </Button>

      {isModalOpen && (
        <ApplyJobModal
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
          jobId={jobId}
          jobTitle={jobTitle}
          companyName={companyName}
          requiresProofOfWork={requiresProofOfWork}
          proofOfWorkType={proofOfWorkType}
          onSuccess={() => {
            router.refresh();
          }}
        />
      )}
    </>
  );
}
