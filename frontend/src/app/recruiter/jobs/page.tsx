import React from "react";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getRecruiterProfile, getRecruiterDashboardStats } from "@/lib/recruiter-api";
import { RecruiterWorkspace } from "@/components/recruiter/RecruiterWorkspace";
import { requireProfile } from "@/lib/server-profile";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Job Management - SmartRecruit AI",
  description: "Manage your job postings and AI configurations",
};

export default async function JobsPage() {
  await requireProfile("RECRUITER");

  const supabase = await createClient();
  const {
    data: { session },
  } = await supabase.auth.getSession();
  const token = session?.access_token;

  if (!token) {
    redirect("/login");
  }

  let profile = null;
  let stats = null;
  try {
    [profile, stats] = await Promise.all([
      getRecruiterProfile(token),
      getRecruiterDashboardStats(token),
    ]);
  } catch (err) {
    console.error("Failed to load initial recruiter data for jobs page:", err);
  }

  return (
    <RecruiterWorkspace
      profile={profile}
      stats={stats}
      token={token}
      defaultTab="jobs"
    />
  );
}
