import { RecruiterWorkspace } from "@/components/recruiter/RecruiterWorkspace";
import { requireProfile } from "@/lib/server-profile";
import { getRecruiterProfile, getRecruiterDashboardStats } from "@/lib/recruiter-api";
import { createClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

export default async function RecruiterDashboardPage() {
  await requireProfile("RECRUITER");
  
  const supabase = await createClient();
  const { data: { session } } = await supabase.auth.getSession();
  
  let profile = null;
  let stats = null;
  
  if (session) {
    try {
      profile = await getRecruiterProfile(session.access_token);
      stats = await getRecruiterDashboardStats(session.access_token);
    } catch (e) {
      console.error("Failed to load recruiter data", e);
    }
  }

  return <RecruiterWorkspace profile={profile} stats={stats} />;
}
