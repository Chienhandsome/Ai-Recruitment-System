'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { applyForJob } from '@/lib/candidate-api';
import { toast } from 'sonner';
import { createClient } from '@/lib/supabase/client';
import { Send, Loader2, Sparkles, CheckCircle } from 'lucide-react';

interface ApplyButtonProps {
  jobId: string;
  hasApplied?: boolean;
}

export function ApplyButton({ jobId, hasApplied }: ApplyButtonProps) {
  const [isApplying, setIsApplying] = useState(false);
  const router = useRouter();
  const supabase = createClient();

  const handleApply = async () => {
    setIsApplying(true);
    try {
      const {
        data: { session },
      } = await supabase.auth.getSession();
      if (!session) {
        toast.error('Vui lòng đăng nhập để ứng tuyển');
        router.push('/login');
        return;
      }

      const res = await applyForJob(session.access_token, jobId);
      toast.success(res.message);
      
      // Refresh the page to show application status
      router.refresh();
    } catch (error: any) {
      toast.error(error.message || 'Có lỗi xảy ra khi ứng tuyển');
    } finally {
      setIsApplying(false);
    }
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
    <Button
      className="mt-4 w-full active:translate-y-px"
      onClick={handleApply}
      disabled={isApplying}
      size="lg"
    >
      {isApplying ? (
        <>
          <Loader2 className="mr-2 size-4 animate-spin" />
          AI đang phân tích hồ sơ...
        </>
      ) : (
        <>
          <Send className="mr-2 size-4" />
          Ứng tuyển ngay
        </>
      )}
    </Button>
  );
}
