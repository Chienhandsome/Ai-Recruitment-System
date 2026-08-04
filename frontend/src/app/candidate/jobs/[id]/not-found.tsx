import Link from 'next/link';
import { BriefcaseBusiness } from 'lucide-react';
import { Button } from '@/components/ui/button';

export default function CandidateJobNotFound() {
  return (
    <div className="mx-auto flex min-h-[60dvh] w-full max-w-3xl items-center px-4 py-12 sm:px-6">
      <div className="w-full rounded-2xl border bg-surface px-6 py-12 text-center">
        <BriefcaseBusiness className="mx-auto size-10 text-primary" strokeWidth={1.5} />
        <h1 className="mt-4 text-2xl font-bold text-foreground">Công việc không còn khả dụng</h1>
        <p className="mx-auto mt-2 max-w-md text-sm leading-relaxed text-muted-foreground">
          Vị trí có thể đã hết hạn hoặc được nhà tuyển dụng đóng lại.
        </p>
        <Button asChild className="mt-6">
          <Link href="/candidate/jobs">Xem việc làm khác</Link>
        </Button>
      </div>
    </div>
  );
}
