const API_URL =
  process.env.NEXT_PUBLIC_API_URL ?? 'https://ai-recruitment-system-test-deploy.onrender.com/api';

export class CandidateApiError extends Error {
  constructor(
    message: string,
    readonly status: number,
  ) {
    super(message);
    this.name = 'CandidateApiError';
  }
}

async function readApiError(response: Response, fallback: string) {
  try {
    const body = (await response.json()) as { message?: string | string[] };
    if (Array.isArray(body.message)) return body.message.join(', ');
    return body.message || fallback;
  } catch {
    return fallback;
  }
}

async function fetchWithTimeout(
  input: RequestInfo | URL,
  init: RequestInit,
  timeoutMs: number,
  timeoutMessage: string,
): Promise<Response> {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

  try {
    return await fetch(input, { ...init, signal: controller.signal });
  } catch (error) {
    if (controller.signal.aborted) throw new Error(timeoutMessage);
    throw error;
  } finally {
    clearTimeout(timeoutId);
  }
}

export type CandidateEmploymentType =
  'FULL_TIME' | 'PART_TIME' | 'CONTRACT' | 'INTERNSHIP' | 'REMOTE' | 'HYBRID';

export type CandidateWorkingModel = 'ON_SITE' | 'HYBRID' | 'REMOTE' | 'SHIFT';

export interface CandidateJobCategory {
  id: string;
  name: string;
  slug: string;
}

export interface CandidateJobSummary {
  id: string;
  jobCode: string;
  title: string;
  company: { id: string; name: string; logoUrl: string | null } | null;
  department: { id: string; name: string } | null;
  category: CandidateJobCategory | null;
  employmentType: CandidateEmploymentType;
  experienceLevel: string;
  workingModel: CandidateWorkingModel;
  location: string | null;
  minSalary: number | null;
  maxSalary: number | null;
  currency: string;
  publishedAt: string;
  expiryDate: string | null;
  skills: Array<{
    id: string;
    name: string;
    requirementType: 'MANDATORY' | 'PREFERRED' | 'NICE_TO_HAVE';
  }>;
}

export interface CandidateJobDetail extends CandidateJobSummary {
  description: string;
  requirements: string | null;
  benefits: string | null;
  requiredExperienceYears: number | null;
  requiresProofOfWork: boolean;
  proofOfWorkType: string | null;
  certificates: Array<{
    id: string;
    name: string;
    requirementType: 'MANDATORY' | 'PREFERRED' | 'NICE_TO_HAVE';
  }>;
  hasApplied?: boolean;
  application?: {
    id: string;
    processingStatus: CandidateApplicationProcessingStatus;
    currentStage: CandidateApplicationStage;
    appliedAt: string;
  } | null;
}

export type CandidateApplicationStage =
  | 'RECEIVED'
  | 'SCREENING'
  | 'SHORTLISTED'
  | 'INTERVIEW_SCHEDULED'
  | 'INTERVIEWED'
  | 'OFFERED'
  | 'HIRED'
  | 'REJECTED'
  | 'WITHDRAWN';

export type CandidateApplicationProcessingStatus =
  | 'UPLOADED'
  | 'QUEUED'
  | 'PARSING'
  | 'NORMALIZING'
  | 'MATCHING'
  | 'SCORING'
  | 'COMPLETED'
  | 'FAILED';

export interface CandidateApplicationItem {
  id: string;
  job: {
    id: string;
    title: string;
    location: string | null;
    company: { id: string; name: string } | null;
    recruiter?: {
      title?: string | null;
      fullName?: string | null;
      email?: string | null;
      phone?: string | null;
    } | null;
  };
  currentStage: CandidateApplicationStage;
  processingStatus: CandidateApplicationProcessingStatus;
  hasUnreadUpdate?: boolean;
  interviews?: import('./interview-api').InterviewData[];
  appliedAt: string;
  updatedAt: string;
}

export interface CandidateApplicationsResponse {
  data: CandidateApplicationItem[];
  meta: { total: number; page: number; limit: number; totalPages: number };
}

export interface CandidateJobsResponse {
  data: CandidateJobSummary[];
  meta: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
}

export interface CandidateJobQuery {
  search?: string;
  categoryId?: string;
  employmentType?: CandidateEmploymentType;
  workingModel?: CandidateWorkingModel;
  location?: string;
  page?: number;
  limit?: number;
}

export async function getCandidateJobs(
  token: string,
  query: CandidateJobQuery = {},
): Promise<CandidateJobsResponse> {
  const params = new URLSearchParams();
  Object.entries(query).forEach(([key, value]) => {
    if (value !== undefined && value !== '') params.set(key, String(value));
  });

  const response = await fetch(`${API_URL}/candidate/jobs?${params.toString()}`, {
    headers: { Authorization: `Bearer ${token}` },
    cache: 'no-store',
  });

  if (!response.ok) {
    throw new CandidateApiError(
      await readApiError(response, 'Không thể tải danh sách việc làm'),
      response.status,
    );
  }

  return response.json();
}

export async function getCandidateJobDetail(
  token: string,
  jobId: string,
): Promise<CandidateJobDetail> {
  const response = await fetch(`${API_URL}/candidate/jobs/${jobId}`, {
    headers: { Authorization: `Bearer ${token}` },
    cache: 'no-store',
  });

  if (!response.ok) {
    throw new CandidateApiError(
      await readApiError(response, 'Không thể tải thông tin việc làm'),
      response.status,
    );
  }

  return response.json();
}

export async function getCandidateJobCategories(): Promise<CandidateJobCategory[]> {
  const response = await fetch(`${API_URL}/job-categories`, {
    cache: 'no-store',
  });
  if (!response.ok) return [];
  return response.json();
}

export async function applyForJob(
  token: string,
  jobId: string,
  resumeId?: string,
): Promise<{
  message: string;
  applicationId: string;
  evaluationStatus: 'QUEUED' | 'RETRY_SCHEDULED';
}> {
  const res = await fetch(`${API_URL}/applications`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ jobId, resumeId }),
  });

  if (!res.ok) {
    throw new CandidateApiError(
      await readApiError(res, 'Không thể ứng tuyển công việc này'),
      res.status,
    );
  }

  return res.json();
}

export async function getMyApplications(
  token: string,
  query: { stage?: CandidateApplicationStage; page?: number; limit?: number } = {},
): Promise<CandidateApplicationsResponse> {
  const params = new URLSearchParams();
  Object.entries(query).forEach(([key, value]) => {
    if (value !== undefined) params.set(key, String(value));
  });
  const response = await fetch(`${API_URL}/applications/me?${params.toString()}`, {
    headers: { Authorization: `Bearer ${token}` },
    cache: 'no-store',
  });
  if (!response.ok) {
    throw new CandidateApiError(
      await readApiError(response, 'Không thể tải danh sách đơn ứng tuyển'),
      response.status,
    );
  }
  return response.json();
}

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
  proficiencyLevel: 'BEGINNER' | 'INTERMEDIATE' | 'ADVANCED' | 'EXPERT';
  isPrimary: boolean;
  source: 'EXTRACTED' | 'SELF_DECLARED' | 'VERIFIED';
  skill: SkillItemData;
}

export interface CandidateSkillInput {
  skillId: string;
  proficiencyLevel: 'BEGINNER' | 'INTERMEDIATE' | 'ADVANCED' | 'EXPERT';
  isPrimary?: boolean;
}

// ─── API Functions ────────────────────────────────────────────────────

export async function getCandidateSkills(token: string): Promise<CandidateSkillData[]> {
  const res = await fetch(`${API_URL}/candidates/me/skills`, {
    headers: { Authorization: `Bearer ${token}` },
    cache: 'no-store',
  });

  if (!res.ok) {
    throw new Error('Failed to fetch candidate skills');
  }

  return res.json();
}

export async function updateCandidateSkills(
  token: string,
  skills: CandidateSkillInput[],
): Promise<CandidateSkillData[]> {
  const res = await fetch(`${API_URL}/candidates/me/skills`, {
    method: 'PUT',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ skills }),
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Failed to update candidate skills: ${text}`);
  }

  return res.json();
}

export async function removeCandidateSkill(token: string, skillId: string): Promise<void> {
  const res = await fetch(`${API_URL}/candidates/me/skills/${skillId}`, {
    method: 'DELETE',
    headers: { Authorization: `Bearer ${token}` },
  });

  if (!res.ok) {
    throw new Error('Failed to remove candidate skill');
  }
}

export async function searchSkills(search?: string): Promise<SkillItemData[]> {
  const query = new URLSearchParams();
  if (search) query.append('search', search);

  const res = await fetch(`${API_URL}/skills?${query.toString()}`, {
    cache: 'no-store',
  });

  if (!res.ok) return [];
  return res.json();
}

export interface UpdateCandidateProfileInput {
  fullName?: string;
  phone?: string | null;
  address?: string | null;
  desiredTitle?: string | null;
  professionalSummary?: string | null;
  linkedinUrl?: string | null;
  githubUrl?: string | null;
  portfolioUrl?: string | null;
  workExperiences?: Array<{
    id?: string;
    source?: 'MANUAL' | 'EXTRACTED';
    companyName: string;
    positionTitle: string;
    startDate?: string;
    endDate?: string | null;
    isCurrent?: boolean;
    description?: string | null;
    achievements?: string | null;
  }>;
  educations?: Array<{
    id?: string;
    source?: 'MANUAL' | 'EXTRACTED';
    schoolName: string;
    major?: string | null;
    degree?: string | null;
    startDate?: string | null;
    endDate?: string | null;
  }>;
  projects?: Array<{
    id?: string;
    source?: 'MANUAL' | 'EXTRACTED';
    projectName: string;
    projectRole?: string | null;
    description?: string | null;
    technologies?: string[] | string | null;
    projectUrl?: string | null;
    startDate?: string | null;
    endDate?: string | null;
  }>;
  certificates?: Array<{
    id?: string;
    source?: 'MANUAL' | 'EXTRACTED';
    certificateName: string;
    issuingOrganization?: string | null;
    issueDate?: string | null;
  }>;
}

export async function updateCandidateProfile(
  token: string,
  data: UpdateCandidateProfileInput,
): Promise<void> {
  const res = await fetch(`${API_URL}/candidates/me/profile`, {
    method: 'PATCH',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
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
  parsingStatus: 'PENDING' | 'PROCESSING' | 'PARSED' | 'SUPERSEDED' | 'FAILED';
  createdAt: string;
}

export interface ResumeStatusResponse {
  id: string;
  originalFileName: string;
  parsingStatus: 'PENDING' | 'PROCESSING' | 'PARSED' | 'SUPERSEDED' | 'FAILED';
  parsingErrorMessage: string | null;
  createdAt: string;
  updatedAt: string;
}

export async function uploadResume(token: string, file: File): Promise<ResumeUploadResponse> {
  const formData = new FormData();
  formData.append('file', file);

  const res = await fetchWithTimeout(
    `${API_URL}/resumes/upload`,
    {
      method: 'POST',
      headers: { Authorization: `Bearer ${token}` },
      body: formData,
    },
    60_000,
    'Upload CV quá thời gian chờ. Vui lòng thử lại.',
  );

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Upload thất bại: ${text}`);
  }

  return res.json();
}

export async function getResumeStatus(
  token: string,
  resumeId: string,
): Promise<ResumeStatusResponse> {
  const res = await fetchWithTimeout(
    `${API_URL}/resumes/${resumeId}/status`,
    {
      headers: { Authorization: `Bearer ${token}` },
      cache: 'no-store',
    },
    10_000,
    'Không thể nhận trạng thái phân tích CV. Vui lòng thử lại.',
  );

  if (!res.ok) {
    throw new Error('Không thể lấy trạng thái CV');
  }

  return res.json();
}
