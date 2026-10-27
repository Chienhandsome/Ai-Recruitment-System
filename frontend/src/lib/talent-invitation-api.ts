const API = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api';

export type TalentInvitationStatus = 'PENDING' | 'ACCEPTED' | 'DECLINED' | 'EXPIRED' | 'WITHDRAWN';
export interface TalentInvitation {
  id: string;
  status: TalentInvitationStatus;
  message: string | null;
  createdAt: string;
  expiresAt: string;
  respondedAt: string | null;
  applicationId: string | null;
  existingApplicationId?: string | null;
  candidate: { id: string; fullName: string; desiredTitle: string | null };
  recruiterUser: { id: string; fullName: string };
  job: {
    id: string;
    jobCode: string;
    title: string;
    description: string;
    requirements: string | null;
    minSalary: string | number | null;
    maxSalary: string | number | null;
    currency: string;
    location: string | null;
    employmentType: string;
    status: string;
    expiryDate: string | null;
  };
}
export interface InvitationPage {
  data: TalentInvitation[];
  meta: { total: number; page: number; limit: number; totalPages: number };
}
export interface InvitationJob {
  existingApplicationId?: string | null;
  id: string;
  jobCode: string;
  title: string;
  location: string | null;
}
export interface InvitationResume {
  id: string;
  originalFileName: string;
  createdAt: string;
}

async function request<T>(token: string, path: string, body?: unknown): Promise<T> {
  const response = await fetch(`${API}/talent-invitations/${path}`, {
    method: body === undefined ? 'GET' : 'POST',
    headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
    ...(body === undefined ? {} : { body: JSON.stringify(body) }),
    cache: 'no-store',
  });
  const json = await response.json().catch(() => ({}));
  if (!response.ok)
    throw new Error(
      Array.isArray(json.message)
        ? json.message.join(', ')
        : json.message || 'Không xử lý được lời mời.',
    );
  return json as T;
}

export function listTalentInvitations(
  token: string,
  role: 'recruiter' | 'candidate',
  page = 1,
  invitationId?: string,
) {
  return request<InvitationPage>(
    token,
    `${role}?page=${page}&limit=12${invitationId ? `&invitationId=${encodeURIComponent(invitationId)}` : ''}`,
  );
}
export function getInvitationJobs(token: string, candidateId?: string) {
  return request<{ data: InvitationJob[] }>(
    token,
    `recruiter/jobs${candidateId ? `?candidateId=${encodeURIComponent(candidateId)}` : ''}`,
  );
}
export function getInvitationResumes(token: string) {
  return request<{ data: InvitationResume[] }>(token, 'candidate/resumes');
}
export function sendTalentInvitation(
  token: string,
  body: { candidateId: string; jobId: string; message?: string },
) {
  return request<{
    invitation?: TalentInvitation;
    applicationId?: string;
    alreadyApplied: boolean;
  }>(token, 'recruiter', body);
}
export function acceptTalentInvitation(token: string, id: string, resumeId: string) {
  return request<{ applicationId: string; reused?: boolean; message?: string }>(
    token,
    `candidate/${id}/accept`,
    { resumeId },
  );
}
export function respondTalentInvitation(
  token: string,
  role: 'recruiter' | 'candidate',
  id: string,
) {
  return request<{ id: string; status: TalentInvitationStatus }>(
    token,
    `${role}/${id}/${role === 'recruiter' ? 'withdraw' : 'decline'}`,
    {},
  );
}

export const invitationStatusLabels: Record<TalentInvitationStatus, string> = {
  PENDING: 'Đang chờ',
  ACCEPTED: 'Đã ứng tuyển',
  DECLINED: 'Đã từ chối',
  EXPIRED: 'Hết hạn',
  WITHDRAWN: 'Đã thu hồi',
};
