import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { requireProfile } from '@/lib/server-profile';
import { getRecruiterProfile } from '@/lib/recruiter-api';
import { TalentProfilePage } from '@/components/recruiter/talent-pool/TalentProfilePage';

export const dynamic = 'force-dynamic';
export const metadata = {
  title: 'Hồ sơ ứng viên - SmartRecruit AI',
  robots: { index: false, follow: false },
};

export default async function Page({ params }: { params: Promise<{ candidateId: string }> }) {
  await requireProfile('RECRUITER');
  const supabase = await createClient();
  const {
    data: { session },
  } = await supabase.auth.getSession();
  if (!session?.access_token) redirect('/login');
  const { candidateId } = await params;
  const profile = await getRecruiterProfile(session.access_token).catch(() => null);
  return (
    <TalentProfilePage
      key={candidateId}
      token={session.access_token}
      candidateId={candidateId}
      initialProfile={profile}
    />
  );
}
