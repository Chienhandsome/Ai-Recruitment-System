import { createClient } from "@/lib/supabase/server";
import { getCurrentProfile } from "@/lib/auth-api";
import { AdminLayout } from "@/components/admin/AdminLayout";

export default async function AdminRootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = await createClient();
  const {
    data: { session },
  } = await supabase.auth.getSession();

  if (session) {
    try {
      const profile = await getCurrentProfile(session.access_token);
      if (profile.roles.includes("ADMIN")) {
        return <AdminLayout profile={profile}>{children}</AdminLayout>;
      }
    } catch {
      // If error loading profile, fall back to plain container
    }
  }

  return <>{children}</>;
}
