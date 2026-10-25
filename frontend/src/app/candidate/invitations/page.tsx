import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { requireProfile } from '@/lib/server-profile';
import { TalentInvitationInbox } from '@/components/common/talent-invitations/TalentInvitationInbox';

export const dynamic = 'force-dynamic';
export const metadata = { title: 'Lời mời ứng tuyển - SmartRecruit AI' };

export default async function CandidateInvitationsPage({
  searchParams,
}: {
  searchParams: Promise<{ invitationId?: string }>;
}) {
  await requireProfile('CANDIDATE');
  const supabase = await createClient();
  const {
    data: { session },
  } = await supabase.auth.getSession();
  if (!session?.access_token) redirect('/login');
  const { invitationId } = await searchParams;
  return (
    <div className="mx-auto max-w-5xl px-4 py-6 sm:px-6">
      <TalentInvitationInbox
        token={session.access_token}
        role="candidate"
        invitationId={invitationId}
      />
    </div>
  );
}
