import "server-only";

import { redirect } from "next/navigation";
import {
  dashboardPathForRoles,
  getCurrentProfile,
} from "@/lib/auth-api";
import { createClient } from "@/lib/supabase/server";
import type { AuthProfile, AuthRole } from "@/types/auth";

export async function requireProfile(
  requiredRole: AuthRole,
): Promise<AuthProfile> {
  const supabase = await createClient();
  const {
    data: { session },
  } = await supabase.auth.getSession();

  const fallbackRedirect = requiredRole === "ADMIN" ? "/admin" : "/login";

  if (!session) {
    redirect(fallbackRedirect);
  }

  let profile: AuthProfile;
  try {
    profile = await getCurrentProfile(session.access_token);
  } catch {
    redirect(fallbackRedirect);
  }

  if (!profile.roles.includes(requiredRole)) {
    redirect(dashboardPathForRoles(profile.roles));
  }

  return profile;
}
