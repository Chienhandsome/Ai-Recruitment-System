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

  return (
    <div className="mt-4 space-y-3">
      {interviews.map((interview, index) => (
        <CandidateInterviewCard
          key={interview.id}
          interview={interview}
          token={token}
          recruiterInfo={recruiterInfo}
          roundIndex={interviews.length > 1 ? index + 1 : 1}
          onRefresh={() => router.refresh()}
        />
      ))}
    </div>
  );
}
