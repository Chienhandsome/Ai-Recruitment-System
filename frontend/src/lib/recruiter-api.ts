export interface JobSkillData {
  id: string;
  skillId: string;
  requirementType: string;
  skill: {
    id: string;
    name: string;
  }
}

export interface JobPostingData {
  id: string;
  jobCode: string;
  title: string;
  departmentId?: string;
  department?: {
    id: string;
    name: string;
  };
  description: string;
  employmentType: string;
  status: string;
  requiredExperienceYears?: number;
  autoShortlistThreshold?: number;
  autoRejectThreshold?: number;
  rejectOnMissingMandatory?: boolean;
  skillWeight?: number;
  experienceWeight?: number;
  educationWeight?: number;
  otherWeight?: number;
  workingModel?: string;
  requiresProofOfWork?: boolean;
  proofOfWorkType?: string;
  requirements?: string;
  minSalary?: number;
  maxSalary?: number;
  currency?: string;
  jobCertificates?: { id?: string; certificateName: string; requirementType?: string }[];
  categoryId?: string;
  category?: {
    id: string;
    name: string;
    slug: string;
  };
  location?: string;
  expiryDate?: string;
  createdAt: string;
  jobSkills?: JobSkillData[];
  _count?: {
    applications: number;
  };
}

export interface JobCategoryData {
  id: string;
  name: string;
  slug: string;
}

export interface SkillItemData {
  id: string;
  name: string;
  categoryId: string;
  type: string;
  category?: JobCategoryData;
}

export interface JobsResponse {
  data: JobPostingData[];
  meta: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
}

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
    phone?: string | null;
    birthDay?: string | null;
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
    cache: "no-store",
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
  data: { title?: string; fullName?: string; phone?: string; birthDay?: string; avatarUrl?: string }
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

export async function getRecruiterJobs(
  token: string,
  params?: { page?: number; limit?: number; status?: string; search?: string }
): Promise<JobsResponse> {
  const query = new URLSearchParams();
  if (params?.page) query.append("page", params.page.toString());
  if (params?.limit) query.append("limit", params.limit.toString());
  if (params?.status) query.append("status", params.status);
  if (params?.search) query.append("search", params.search);

  const res = await fetch(`${API_URL}/jobs?${query.toString()}`, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
    next: { revalidate: 0 },
  });

  if (!res.ok) {
    throw new Error("Failed to fetch recruiter jobs");
  }

  return res.json();
}

export async function createRecruiterJob(
  token: string,
  data: Record<string, unknown>
): Promise<JobPostingData> {
  const res = await fetch(`${API_URL}/jobs`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(data),
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Failed to create job: ${text}`);
  }

  return res.json();
}

export async function updateRecruiterJob(
  token: string,
  jobId: string,
  data: Record<string, unknown>
): Promise<JobPostingData> {
  const res = await fetch(`${API_URL}/jobs/${jobId}`, {
    method: "PATCH",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(data),
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Failed to update job: ${text}`);
  }

  return res.json();
}

export async function getRecruiterJobDetail(
  token: string,
  jobId: string
): Promise<JobPostingData> {
  const res = await fetch(`${API_URL}/jobs/${jobId}`, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
    next: { revalidate: 0 },
  });

  if (!res.ok) {
    throw new Error("Failed to fetch job detail");
  }

  return res.json();
}

export async function deleteRecruiterJob(
  token: string,
  jobId: string
): Promise<void> {
  const res = await fetch(`${API_URL}/jobs/${jobId}`, {
    method: "DELETE",
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Failed to delete job: ${text}`);
  }
}

export async function getJobCategories(): Promise<JobCategoryData[]> {
  const res = await fetch(`${API_URL}/categories`, {
    cache: "no-store",
  });
  if (!res.ok) return [];
  return res.json();
}

export async function getSkillsByCategory(categoryId?: string, search?: string): Promise<SkillItemData[]> {
  const query = new URLSearchParams();
  if (categoryId) query.append("categoryId", categoryId);
  if (search) query.append("search", search);

  const res = await fetch(`${API_URL}/skills?${query.toString()}`, {
    cache: "no-store",
  });
  if (!res.ok) return [];
  return res.json();
}

export async function createCustomSkill(
  token: string,
  data: { name: string; categoryId: string }
): Promise<SkillItemData> {
  const res = await fetch(`${API_URL}/skills`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(data),
  });

  if (!res.ok) {
    throw new Error("Failed to create custom skill");
  }

  return res.json();
}
