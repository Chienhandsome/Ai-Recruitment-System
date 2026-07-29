const API_URL =
  process.env.NEXT_PUBLIC_API_URL ??
  "https://ai-recruitment-system-test-deploy.onrender.com/api";

// ─── Types ────────────────────────────────────────────────────────────

export interface SkillItemData {
  id: string;
  name: string;
  categoryId: string;
  type: string;
  category?: { id: string; name: string };
}

export interface CandidateSkillData {
  id: string;
  candidateId: string;
  skillId: string;
  proficiencyLevel: "BEGINNER" | "INTERMEDIATE" | "ADVANCED" | "EXPERT";
  yearsExperience: number | null;
  isPrimary: boolean;
  source: "EXTRACTED" | "SELF_DECLARED" | "VERIFIED";
  skill: SkillItemData;
}

export interface CandidateSkillInput {
  skillId: string;
  proficiencyLevel: "BEGINNER" | "INTERMEDIATE" | "ADVANCED" | "EXPERT";
  yearsExperience?: number;
  isPrimary?: boolean;
}

// ─── API Functions ────────────────────────────────────────────────────

export async function getCandidateSkills(
  token: string
): Promise<CandidateSkillData[]> {
  const res = await fetch(`${API_URL}/candidates/me/skills`, {
    headers: { Authorization: `Bearer ${token}` },
    cache: "no-store",
  });

  if (!res.ok) {
    throw new Error("Failed to fetch candidate skills");
  }

  return res.json();
}

export async function updateCandidateSkills(
  token: string,
  skills: CandidateSkillInput[]
): Promise<CandidateSkillData[]> {
  const res = await fetch(`${API_URL}/candidates/me/skills`, {
    method: "PUT",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ skills }),
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Failed to update candidate skills: ${text}`);
  }

  return res.json();
}

export async function removeCandidateSkill(
  token: string,
  skillId: string
): Promise<void> {
  const res = await fetch(`${API_URL}/candidates/me/skills/${skillId}`, {
    method: "DELETE",
    headers: { Authorization: `Bearer ${token}` },
  });

  if (!res.ok) {
    throw new Error("Failed to remove candidate skill");
  }
}

export async function searchSkills(search?: string): Promise<SkillItemData[]> {
  const query = new URLSearchParams();
  if (search) query.append("search", search);

  const res = await fetch(`${API_URL}/skills?${query.toString()}`, {
    cache: "no-store",
  });

  if (!res.ok) return [];
  return res.json();
}

// ─── Profile Update ───────────────────────────────────────────────────

export interface UpdateCandidateProfileInput {
  fullName?: string;
  phone?: string | null;
  address?: string | null;
  desiredTitle?: string | null;
  professionalSummary?: string | null;
  linkedinUrl?: string | null;
  githubUrl?: string | null;
  portfolioUrl?: string | null;
}

export async function updateCandidateProfile(
  token: string,
  data: UpdateCandidateProfileInput
): Promise<void> {
  const res = await fetch(`${API_URL}/candidates/me/profile`, {
    method: "PATCH",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(data),
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Không thể cập nhật hồ sơ: ${text}`);
  }
}

// ─── Resume Upload ────────────────────────────────────────────────────

export interface ResumeUploadResponse {
  id: string;
  originalFileName: string;
  parsingStatus: "PENDING" | "PROCESSING" | "PARSED" | "FAILED";
  createdAt: string;
}

export interface ResumeStatusResponse {
  id: string;
  originalFileName: string;
  parsingStatus: "PENDING" | "PROCESSING" | "PARSED" | "FAILED";
  parsingErrorMessage: string | null;
  createdAt: string;
  updatedAt: string;
}

export async function uploadResume(
  token: string,
  file: File
): Promise<ResumeUploadResponse> {
  const formData = new FormData();
  formData.append("file", file);

  const res = await fetch(`${API_URL}/resumes/upload`, {
    method: "POST",
    headers: { Authorization: `Bearer ${token}` },
    body: formData,
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Upload thất bại: ${text}`);
  }

  return res.json();
}

export async function getResumeStatus(
  token: string,
  resumeId: string
): Promise<ResumeStatusResponse> {
  const res = await fetch(`${API_URL}/resumes/${resumeId}/status`, {
    headers: { Authorization: `Bearer ${token}` },
    cache: "no-store",
  });

  if (!res.ok) {
    throw new Error("Không thể lấy trạng thái CV");
  }

  return res.json();
}
