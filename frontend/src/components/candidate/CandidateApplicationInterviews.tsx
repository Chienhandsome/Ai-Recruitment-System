'use client';

import React from 'react';
import { useRouter } from 'next/navigation';
import { CandidateInterviewCard } from './CandidateInterviewCard';
import { CandidateAiInterviewCard } from './CandidateAiInterviewCard';
import { type InterviewData, type AiInterviewSession } from '@/lib/interview-api';

interface CandidateApplicationInterviewsProps {
  interviews?: InterviewData[];
  aiSessions?: AiInterviewSession[];
  token: string;
  recruiterInfo?: {
    title?: string | null;
    fullName?: string | null;
    email?: string | null;
    phone?: string | null;
  } | null;
}

export function CandidateApplicationInterviews({
  interviews = [],
  aiSessions = [],
  token,
  recruiterInfo,
}: CandidateApplicationInterviewsProps) {
  const router = useRouter();

  if (
    (!interviews || interviews.length === 0) &&
    (!aiSessions || aiSessions.length === 0)
  ) {
    return null;
  }

  // Sort ascending by creation or scheduled time so Round 1 is first, Round 2 next
  const sortedInterviews = [...interviews].sort((a, b) => {
    const timeA = new Date(a.createdAt || a.scheduledAt).getTime();
    const timeB = new Date(b.createdAt || b.scheduledAt).getTime();
    return timeA - timeB;
  });

  const allPassed =
    sortedInterviews.length > 0 &&
    sortedInterviews.every((i) => i.round?.status === 'PASSED') &&
    (aiSessions.length === 0 || aiSessions.every((s) => s.status === 'COMPLETED'));

  return (
    <div className="mt-4 space-y-3">
      {allPassed && (
        <div className="flex items-center gap-2.5 p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-xs font-bold text-emerald-800 shadow-2xs">
          <span className="text-base">🎉</span>
          <span>Chúc mừng! Bạn đã hoàn thành xuất sắc các vòng phỏng vấn và đang chờ phản hồi từ nhà tuyển dụng.</span>
        </div>
      )}

      {/* Render AI Sessions */}
      {aiSessions.map((session, index) => (
        <CandidateAiInterviewCard
          key={session.id}
          session={session}
          roundIndex={session.round?.order || index + 1}
        />
      ))}

      {/* Render Human Interviews */}
      {sortedInterviews.map((interview, index) => (
        <CandidateInterviewCard
          key={interview.id}
          interview={interview}
          token={token}
          recruiterInfo={recruiterInfo}
          roundIndex={
            interview.round?.order ||
            (aiSessions.length > 0
              ? aiSessions.length + index + 1
              : sortedInterviews.length > 1
                ? index + 1
                : 1)
          }
          onRefresh={() => router.refresh()}
        />
      ))}
    </div>
  );
}
