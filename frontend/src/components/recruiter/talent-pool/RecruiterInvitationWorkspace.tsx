'use client';

import Link from 'next/link';
import { useState } from 'react';
import { ArrowLeft } from 'lucide-react';
import type { RecruiterProfileData } from '@/lib/recruiter-api';
import { RecruiterHeader } from '../RecruiterHeader';
import { RecruiterProfileModal } from '../RecruiterProfileModal';
import { TalentInvitationInbox } from '@/components/common/talent-invitations/TalentInvitationInbox';

export function RecruiterInvitationWorkspace({
  token,
  initialProfile,
  invitationId,
}: {
  token: string;
  initialProfile: RecruiterProfileData | null;
  invitationId?: string;
}) {
  const [profile, setProfile] = useState(initialProfile);
  const [profileOpen, setProfileOpen] = useState(false);
  return (
    <div className="min-h-dvh bg-[#F8FAFC] text-slate-700">
      <RecruiterHeader
        token={token}
        profile={profile}
        activeSection="talent-pool"
        onOpenProfile={() => setProfileOpen(true)}
      />
      <main className="mx-auto max-w-[1440px] space-y-4 px-4 py-6 sm:px-6">
        <Link
          href="/recruiter/talent-pool"
          className="inline-flex items-center gap-2 text-xs font-semibold text-slate-500 hover:text-blue-700"
        >
          <ArrowLeft className="size-3.5" />
          Kho ứng viên
        </Link>
        <TalentInvitationInbox token={token} role="recruiter" invitationId={invitationId} />
      </main>
      <RecruiterProfileModal
        isOpen={profileOpen}
        onClose={() => setProfileOpen(false)}
        profile={profile}
        onProfileUpdated={setProfile}
      />
    </div>
  );
}
