import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getCurrentProfile } from "@/lib/auth-api";
import { AdminLoginForm } from "@/components/admin/AdminLoginForm";

export const dynamic = "force-dynamic";

export default async function AdminLoginPage() {
  const supabase = await createClient();
  const {
    data: { session },
  } = await supabase.auth.getSession();

  if (session) {
    try {
      const profile = await getCurrentProfile(session.access_token);
      if (profile.roles.includes("ADMIN")) {
        redirect("/admin/dashboard");
      }
    } catch {
      // Session invalid or profile failed, render login form below
    }
  }

  return (
    <div className="min-h-screen bg-[#F8FAFC] flex items-center justify-center p-4">
      <AdminLoginForm />
    </div>
  );
}
