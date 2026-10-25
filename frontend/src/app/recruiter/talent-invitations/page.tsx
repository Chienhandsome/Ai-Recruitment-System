import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { requireProfile } from '@/lib/server-profile';
import { getRecruiterProfile } from '@/lib/recruiter-api';
import { RecruiterInvitationWorkspace } from '@/components/recruiter/talent-pool/RecruiterInvitationWorkspace';

export const dynamic = 'force-dynamic';
export const metadata = { title: 'Lời mời đã gửi - SmartRecruit AI' };

export default async function RecruiterInvitationsPage({
  searchParams,
}: {
  searchParams: Promise<{ invitationId?: string }>;
}) {
  await requireProfile('RECRUITER');
  const supabase = await createClient();
  const {
    data: { session },
  } = await supabase.auth.getSession();
  if (!session?.access_token) redirect('/login');
  const profile = await getRecruiterProfile(session.access_token).catch(() => null);
  const { invitationId } = await searchParams;
  return (
    <RecruiterInvitationWorkspace
      token={session.access_token}
      initialProfile={profile}
      invitationId={invitationId}
    />
  );
}
