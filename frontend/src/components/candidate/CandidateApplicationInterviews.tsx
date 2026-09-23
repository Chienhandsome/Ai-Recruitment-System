'use client';

import React from 'react';
import { useRouter } from 'next/navigation';
import { CandidateInterviewCard } from './CandidateInterviewCard';
import { type InterviewData } from '@/lib/interview-api';

interface CandidateApplicationInterviewsProps {
  interviews: InterviewData[];
  token: string;
  recruiterInfo?: {
    title?: string | null;
    fullName?: string | null;
    email?: string | null;
    phone?: string | null;
  } | null;
}

export function CandidateApplicationInterviews({
  interviews,
  token,
  recruiterInfo,
}: CandidateApplicationInterviewsProps) {
  const router = useRouter();

  if (!interviews || interviews.length === 0) return null;

  // Sort ascending by creation or scheduled time so Round 1 is first, Round 2 next
  const sortedInterviews = [...interviews].sort((a, b) => {
    const timeA = new Date(a.createdAt || a.scheduledAt).getTime();
    const timeB = new Date(b.createdAt || b.scheduledAt).getTime();
    return timeA - timeB;
  });

  const allPassed =
    sortedInterviews.length > 0 &&
    sortedInterviews.every((i) => i.round?.status === 'PASSED');

  return (
    <div className="mt-4 space-y-3">
      {allPassed && (
        <div className="flex items-center gap-2.5 p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-xs font-bold text-emerald-800 shadow-2xs">
          <span className="text-base">🎉</span>
          <span>Chúc mừng! Bạn đã hoàn thành xuất sắc các vòng phỏng vấn và đang chờ phản hồi từ nhà tuyển dụng.</span>
        </div>
      )}
      {sortedInterviews.map((interview, index) => (
        <CandidateInterviewCard
          key={interview.id}
          interview={interview}
          token={token}
          recruiterInfo={recruiterInfo}
          roundIndex={sortedInterviews.length > 1 ? index + 1 : 1}
          onRefresh={() => router.refresh()}
        />
      ))}
    </div>
  );
}
