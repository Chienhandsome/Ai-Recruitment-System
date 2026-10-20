import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { requireProfile } from '@/lib/server-profile';
import { getRecruiterProfile } from '@/lib/recruiter-api';
import { TalentPoolWorkspace } from '@/components/recruiter/talent-pool/TalentPoolWorkspace';

export const dynamic = 'force-dynamic';
export const metadata = { title: 'Kho ứng viên - SmartRecruit AI' };

export default async function TalentPoolPage() {
  await requireProfile('RECRUITER');
  const supabase = await createClient();
  const {
    data: { session },
  } = await supabase.auth.getSession();
  if (!session?.access_token) redirect('/login');
  const profile = await getRecruiterProfile(session.access_token).catch(() => null);
  return <TalentPoolWorkspace token={session.access_token} initialProfile={profile} />;
}
