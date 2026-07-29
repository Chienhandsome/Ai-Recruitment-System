import React from "react";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getRecruiterJobs } from "@/lib/recruiter-api";
import { JobsWorkspace } from "@/components/recruiter/JobsWorkspace";

export const metadata = {
  title: "Job Management - SmartRecruit AI",
  description: "Manage your job postings and AI configurations",
};

export default async function JobsPage() {
  const supabase = await createClient();
  const { data: authData, error: authError } = await supabase.auth.getUser();

  if (authError || !authData?.user) {
    redirect("/login");
  }

  // Get auth session token
  const { data: sessionData } = await supabase.auth.getSession();
  const token = sessionData.session?.access_token;

  if (!token) {
    redirect("/login");
  }

  // Fetch jobs for initial SSR render (page 1, limit 10)
  let initialJobs = null;
  try {
    initialJobs = await getRecruiterJobs(token, { page: 1, limit: 10 });
  } catch (err) {
    console.error("Failed to load initial jobs:", err);
  }

  return (
    <main className="flex-1 h-screen overflow-hidden bg-[#F8FAFC] p-4 lg:p-6 transition-colors duration-300">
      <JobsWorkspace initialData={initialJobs} token={token} />
    </main>
  );
}
