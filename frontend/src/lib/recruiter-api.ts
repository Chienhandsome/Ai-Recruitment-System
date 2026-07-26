const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:3001/api";

export interface RecruiterProfileData {
  id: string;
  userId: string;
  companyId: string | null;
  departmentId: string | null;
  title: string | null;
  company?: {
    id: string;
    name: string;
    logoUrl?: string;
  };
  department?: {
    id: string;
    name: string;
  };
  user?: {
    fullName: string | null;
    avatarUrl: string | null;
    email: string;
  };
}

export interface RecruiterDashboardStats {
  totalActiveJobs: number;
  totalCandidates: number;
  newApplicationsToday: number;
}

export async function getRecruiterProfile(token: string): Promise<RecruiterProfileData> {
  const res = await fetch(`${API_URL}/recruiters/profile`, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
    next: { revalidate: 60 },
  });

  if (!res.ok) {
    const text = await res.text();
    console.error(`Failed to fetch recruiter profile. Status: ${res.status}. Body: ${text}`);
    throw new Error("Failed to fetch recruiter profile");
  }

  return res.json();
}

export async function getRecruiterDashboardStats(token: string): Promise<RecruiterDashboardStats> {
  const res = await fetch(`${API_URL}/recruiters/dashboard/stats`, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
    next: { revalidate: 0 }, // Dynamic for dashboard
  });

  if (!res.ok) {
    throw new Error("Failed to fetch recruiter dashboard stats");
  }

  return res.json();
}

export async function updateRecruiterProfile(
  token: string,
  data: { title?: string; fullName?: string }
): Promise<RecruiterProfileData> {
  const res = await fetch(`${API_URL}/recruiters/profile`, {
    method: "PATCH",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(data),
  });

  if (!res.ok) {
    throw new Error("Failed to update recruiter profile");
  }

  return res.json();
}
