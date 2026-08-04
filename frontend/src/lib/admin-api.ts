const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:3001/api";

export interface SkillCategoryData {
  id: string;
  name: string;
  slug?: string;
}

export interface SkillAliasData {
  id: string;
  aliasName: string;
}

export interface SkillData {
  id: string;
  name: string;
  normalizedName: string;
  categoryId: string;
  category?: SkillCategoryData;
  aliases?: SkillAliasData[];
  skillAliases?: SkillAliasData[];
  type: string;
  status: string;
}

export interface UnrecognizedSkillData {
  id: string;
  rawSkillName: string;
  normalizedName?: string | null;
  categoryHint?: string | null;
  frequency: number;
  status: string;
  createdAt: string;
}

export interface AdminDashboardStatsData {
  overview: {
    totalUsers: number;
    totalCandidates: number;
    totalRecruiters: number;
    totalJobs: number;
    activeJobs: number;
    totalSkills: number;
    totalSkillCategories: number;
    pendingUnrecognizedSkills: number;
    totalApplications: number;
  };
  recentJobs: Array<{
    id: string;
    title: string;
    jobCode: string;
    department: string;
    company: string;
    status: string;
    createdAt: string;
  }>;
  topUnrecognizedSkills: Array<{
    id: string;
    rawSkillName: string;
    frequency: number;
    createdAt: string;
  }>;
}

export interface AdminJobData {
  id: string;
  jobCode: string;
  title: string;
  company: string;
  department: string;
  employmentType: string;
  experienceLevel: string;
  status: string;
  minSalary?: number | null;
  maxSalary?: number | null;
  currency: string;
  location: string;
  postedDate: string;
  skills: string[];
}

export interface AdminUserData {
  id: string;
  email: string;
  fullName: string;
  phone: string;
  status: string;
  roles: string[];
  companyName?: string;
  createdAt: string;
  lastLoginAt?: string;
}

export async function fetchAdminDashboardStats(): Promise<AdminDashboardStatsData> {
  const url = `${API_URL}/admin/stats`;
  console.log("[admin-api] Fetching Admin Dashboard stats from:", url);
  const res = await fetch(url);
  if (!res.ok) {
    const text = await res.text();
    console.error("[admin-api] fetchAdminDashboardStats failed:", res.status, text);
    throw new Error(`Không thể nạp thống kê Dashboard (${res.status})`);
  }
  return res.json();
}

export async function fetchAdminJobs(status?: string, search?: string): Promise<AdminJobData[]> {
  const params = new URLSearchParams();
  if (status && status !== "ALL") params.append("status", status);
  if (search) params.append("search", search);

  const url = `${API_URL}/admin/jobs?${params.toString()}`;
  console.log("[admin-api] Fetching Admin jobs from:", url);
  const res = await fetch(url);
  if (!res.ok) {
    const text = await res.text();
    console.error("[admin-api] fetchAdminJobs failed:", res.status, text);
    throw new Error(`Không thể nạp danh sách tin tuyển dụng (${res.status})`);
  }
  return res.json();
}

export async function updateAdminJobStatus(
  token: string,
  jobId: string,
  status: string
): Promise<AdminJobData> {
  const res = await fetch(`${API_URL}/admin/jobs/${jobId}/status`, {
    method: "PATCH",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`
    },
    body: JSON.stringify({ status })
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Không thể cập nhật trạng thái tin tuyển dụng (${res.status}): ${text}`);
  }
  return res.json();
}

export async function deleteAdminJob(token: string, jobId: string): Promise<void> {
  const res = await fetch(`${API_URL}/admin/jobs/${jobId}`, {
    method: "DELETE",
    headers: {
      Authorization: `Bearer ${token}`
    }
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Không thể xóa bài đăng tuyển dụng (${res.status}): ${text}`);
  }
}

// --- USER MANAGEMENT FETCHERS ---

export async function fetchAdminUsers(
  role?: string,
  status?: string,
  search?: string
): Promise<AdminUserData[]> {
  const params = new URLSearchParams();
  if (role && role !== "ALL") params.append("role", role);
  if (status && status !== "ALL") params.append("status", status);
  if (search) params.append("search", search);

  const url = `${API_URL}/admin/users?${params.toString()}`;
  console.log("[admin-api] Fetching Admin users from:", url);
  const res = await fetch(url);
  if (!res.ok) {
    const text = await res.text();
    console.error("[admin-api] fetchAdminUsers failed:", res.status, text);
    throw new Error(`Không thể nạp danh sách người dùng (${res.status})`);
  }
  return res.json();
}

export async function updateAdminUserStatus(
  token: string,
  userId: string,
  status: string
): Promise<AdminUserData> {
  const res = await fetch(`${API_URL}/admin/users/${userId}/status`, {
    method: "PATCH",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`
    },
    body: JSON.stringify({ status })
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Không thể cập nhật trạng thái tài khoản (${res.status}): ${text}`);
  }
  return res.json();
}

export async function deleteAdminUser(token: string, userId: string): Promise<void> {
  const res = await fetch(`${API_URL}/admin/users/${userId}`, {
    method: "DELETE",
    headers: {
      Authorization: `Bearer ${token}`
    }
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Không thể xóa tài khoản (${res.status}): ${text}`);
  }
}

export async function fetchSkills(categoryId?: string, search?: string): Promise<SkillData[]> {
  const params = new URLSearchParams();
  if (categoryId) params.append("categoryId", categoryId);
  if (search) params.append("search", search);

  const url = `${API_URL}/skills?${params.toString()}`;
  console.log("[admin-api] Fetching skills from:", url);
  const res = await fetch(url);
  if (!res.ok) {
    const text = await res.text();
    console.error("[admin-api] fetchSkills failed:", res.status, text);
    throw new Error(`Không thể tải danh sách kỹ năng (${res.status})`);
  }
  const data = await res.json();
  return data.map((item: SkillData) => ({
    ...item,
    aliases: item.skillAliases ?? item.aliases ?? []
  }));
}

export async function fetchCategories(): Promise<SkillCategoryData[]> {
  const url = `${API_URL}/categories`;
  console.log("[admin-api] Fetching categories from:", url);
  const res = await fetch(url);
  if (!res.ok) {
    const text = await res.text();
    console.error("[admin-api] fetchCategories failed:", res.status, text);
    throw new Error(`Không thể tải danh mục kỹ năng (${res.status})`);
  }
  return res.json();
}

export async function createNewSkill(
  token: string,
  name: string,
  categoryId: string
): Promise<SkillData> {
  const res = await fetch(`${API_URL}/skills`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`
    },
    body: JSON.stringify({ name, categoryId })
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Không thể tạo kỹ năng mới (${res.status}): ${text}`);
  }
  return res.json();
}

export async function updateSkill(
  token: string,
  id: string,
  data: { name?: string; categoryId?: string; type?: "HARD" | "SOFT" }
): Promise<SkillData> {
  const res = await fetch(`${API_URL}/skills/${id}`, {
    method: "PATCH",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`
    },
    body: JSON.stringify(data)
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Không thể cập nhật kỹ năng (${res.status}): ${text}`);
  }
  return res.json();
}

export async function addSkillAlias(
  token: string,
  skillId: string,
  aliasName: string
): Promise<SkillAliasData> {
  const res = await fetch(`${API_URL}/skills/${skillId}/aliases`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`
    },
    body: JSON.stringify({ aliasName })
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Không thể thêm Alias (${res.status}): ${text}`);
  }
  return res.json();
}

export async function deleteSkillAlias(token: string, aliasId: string): Promise<void> {
  const res = await fetch(`${API_URL}/skills/aliases/${aliasId}`, {
    method: "DELETE",
    headers: {
      Authorization: `Bearer ${token}`
    }
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Không thể xóa Alias (${res.status}): ${text}`);
  }
}

export async function fetchUnrecognizedSkills(): Promise<UnrecognizedSkillData[]> {
  const url = `${API_URL}/skills/unrecognized`;
  console.log("[admin-api] Fetching unrecognized skills from:", url);
  const res = await fetch(url);
  if (!res.ok) {
    const text = await res.text();
    console.error("[admin-api] fetchUnrecognizedSkills failed:", res.status, text);
    throw new Error(`Không thể tải danh sách từ khóa chưa nhận diện (${res.status})`);
  }
  return res.json();
}

export async function mapUnrecognizedSkill(
  token: string,
  id: string,
  targetSkillId: string
): Promise<void> {
  const res = await fetch(`${API_URL}/skills/unrecognized/${id}/map`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`
    },
    body: JSON.stringify({ targetSkillId })
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Không thể map từ khóa (${res.status}): ${text}`);
  }
}

export async function approveUnrecognizedSkill(
  token: string,
  id: string,
  categoryId: string
): Promise<SkillData> {
  const res = await fetch(`${API_URL}/skills/unrecognized/${id}/approve`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`
    },
    body: JSON.stringify({ categoryId })
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Không thể phê duyệt từ khóa (${res.status}): ${text}`);
  }
  return res.json();
}

export async function rejectUnrecognizedSkill(token: string, id: string): Promise<void> {
  const res = await fetch(`${API_URL}/skills/unrecognized/${id}`, {
    method: "DELETE",
    headers: {
      Authorization: `Bearer ${token}`
    }
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Không thể loại bỏ từ khóa (${res.status}): ${text}`);
  }
}
