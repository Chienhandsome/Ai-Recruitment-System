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

  return (
    <div className="mt-4 space-y-3">
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
