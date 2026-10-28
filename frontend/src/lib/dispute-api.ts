export type DisputeStatus = 'PENDING' | 'INVESTIGATING' | 'RESOLVED' | 'DISMISSED' | 'CLOSED';

export type DisputeCategory =
  | 'SALARY_MISMATCH'
  | 'UNAUTHORIZED_FEE'
  | 'UNFAIR_REVOCATION'
  | 'CONTRACT_VIOLATION'
  | 'HARASSMENT_OR_FRAUD'
  | 'OTHER';

export const disputeCategoryLabels: Record<DisputeCategory, string> = {
  SALARY_MISMATCH: 'Lương thực tế khác thỏa thuận Offer',
  UNAUTHORIZED_FEE: 'Bị yêu cầu nộp tiền / đặt cọc trái phép',
  UNFAIR_REVOCATION: 'Bị hủy Offer / Hợp đồng không lý do',
  CONTRACT_VIOLATION: 'Điều khoản hợp đồng vi phạm thỏa thuận',
  HARASSMENT_OR_FRAUD: 'Có dấu hiệu lừa đảo / quấy rối',
  OTHER: 'Lý do khác',
};

export const disputeStatusLabels: Record<DisputeStatus, string> = {
  PENDING: 'Chờ tiếp nhận',
  INVESTIGATING: 'Đang xác minh',
  RESOLVED: 'Đã xử lý & Có phán quyết',
  DISMISSED: 'Bác bỏ / Không đủ căn cứ',
  CLOSED: 'Đã đóng & Lưu trữ hồ sơ',
};

export interface DisputeTimelineEntry {
  id: string;
  senderId: string;
  senderName: string;
  senderRole: 'CANDIDATE' | 'RECRUITER' | 'ADMIN';
  type:
    | 'INITIAL_CLAIM'
    | 'MESSAGE'
    | 'EXPLANATION'
    | 'ADMIN_NOTE'
    | 'ADMIN_RESOLUTION'
    | 'APPEAL'
    | 'ACKNOWLEDGEMENT'
    | 'SYSTEM_CLOSURE'
    | 'ADMIN_CLOSURE';
  message: string;
  evidenceUrls?: string[];
  createdAt: string;
  isAppeal?: boolean;
  meta?: {
    status?: DisputeStatus;
    enforcementAction?: 'NONE' | 'WARN' | 'LOCK_RECRUITER';
    penaltyNotes?: string;
    penaltyAmount?: number;
    compensationAmount?: number;
  };
}

export interface DisputeData {
  id: string;
  disputeNumber: string;
  applicationId: string;
  contractId?: string | null;
  reportedByUserId: string;
  category: DisputeCategory;
  title: string;
  description: string;
  evidenceUrls?: string[] | null;
  status: DisputeStatus;
  adminResolution?: string | null;
  resolvedByUserId?: string | null;
  resolvedAt?: string | null;
  penaltyAction?: string | null;
  penaltyNotes?: string | null;
  penaltyAmount?: number | null;
  compensationAmount?: number | null;
  candidatePenaltyAction?: string | null;
  candidatePenaltyNotes?: string | null;
  candidateReliabilityDeduction?: number | null;
  candidateSuspensionDays?: number | null;
  timeline?: DisputeTimelineEntry[] | null;
  candidateAcknowledgedAt?: string | null;
  candidateAcknowledgeNote?: string | null;
  recruiterAcknowledgedAt?: string | null;
  recruiterAcknowledgeNote?: string | null;
  closedAt?: string | null;
  closedByUserId?: string | null;
  createdAt: string;
  updatedAt: string;
  reportedByUser?: {
    id: string;
    fullName: string;
    email: string;
  };
  resolvedByUser?: {
    id: string;
    fullName: string;
    email: string;
  };
  application?: {
    id: string;
    job?: {
      id: string;
      title: string;
      recruiter?: {
        userId?: string;
        user?: { fullName?: string; email?: string; status?: string };
        company?: { id?: string; name?: string; logoUrl?: string };
      };
    };
    candidate?: {
      id: string;
      userId: string;
      fullName: string;
      email: string;
      phone?: string;
      reliabilityScore?: number;
      strikeCount?: number;
      suspendedUntil?: string | null;
    };
    offer?: any;
    contract?: any;
  };
}

export interface CreateDisputeInput {
  applicationId: string;
  contractId?: string;
  category: DisputeCategory;
  title: string;
  description: string;
  evidenceUrls?: string[];
}

export interface ResolveDisputeInput {
  status: DisputeStatus;
  adminResolution: string;
  enforcementAction?: 'NONE' | 'WARN' | 'LOCK_RECRUITER';
  penaltyNotes?: string;
  penaltyAmount?: number;
  compensationAmount?: number;
  candidateEnforcementAction?: 'NONE' | 'WARN' | 'DEDUCT_RELIABILITY' | 'SUSPEND_APPLY' | 'LOCK_CANDIDATE';
  candidatePenaltyNotes?: string;
  candidateReliabilityDeduction?: number;
  candidateSuspensionDays?: number;
}

export interface RespondDisputeInput {
  message: string;
  evidenceUrls?: string[];
  isAppeal?: boolean;
}

const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api';

async function handleResponse<T>(res: Response): Promise<T> {
  const json = await res.json().catch(() => ({}));
  if (!res.ok) {
    const message = Array.isArray(json.message)
      ? json.message.join(', ')
      : json.message || `Lỗi yêu cầu: ${res.status}`;
    throw new Error(message);
  }
  return json as T;
}

export async function createDispute(
  token: string,
  input: CreateDisputeInput,
): Promise<DisputeData> {
  const res = await fetch(`${API_BASE}/disputes`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(input),
  });
  return handleResponse<DisputeData>(res);
}

export async function getDisputesByApplication(
  token: string,
  applicationId: string,
): Promise<DisputeData[]> {
  const res = await fetch(`${API_BASE}/disputes/application/${applicationId}`, {
    headers: { Authorization: `Bearer ${token}` },
    cache: 'no-store',
  });
  return handleResponse<DisputeData[]>(res);
}

export async function getDisputeById(
  token: string,
  disputeId: string,
): Promise<DisputeData> {
  const res = await fetch(`${API_BASE}/disputes/${disputeId}`, {
    headers: { Authorization: `Bearer ${token}` },
    cache: 'no-store',
  });
  return handleResponse<DisputeData>(res);
}

export async function respondDispute(
  token: string,
  disputeId: string,
  input: RespondDisputeInput,
): Promise<DisputeData> {
  const res = await fetch(`${API_BASE}/disputes/${disputeId}/messages`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(input),
  });
  return handleResponse<DisputeData>(res);
}

export async function getAdminDisputes(
  token: string,
  status?: DisputeStatus,
): Promise<DisputeData[]> {
  const url = status
    ? `${API_BASE}/disputes/admin/all?status=${status}`
    : `${API_BASE}/disputes/admin/all`;
  const res = await fetch(url, {
    headers: { Authorization: `Bearer ${token}` },
    cache: 'no-store',
  });
  return handleResponse<DisputeData[]>(res);
}

export async function resolveAdminDispute(
  token: string,
  disputeId: string,
  input: ResolveDisputeInput,
): Promise<DisputeData> {
  const res = await fetch(`${API_BASE}/disputes/admin/${disputeId}/resolve`, {
    method: 'PATCH',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(input),
  });
  return handleResponse<DisputeData>(res);
}

export async function acknowledgeDispute(
  token: string,
  disputeId: string,
  note?: string,
): Promise<DisputeData> {
  const res = await fetch(`${API_BASE}/disputes/${disputeId}/acknowledge`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({ note }),
  });
  return handleResponse<DisputeData>(res);
}

export async function closeDispute(
  token: string,
  disputeId: string,
  closeReason?: string,
): Promise<DisputeData> {
  const res = await fetch(`${API_BASE}/disputes/admin/${disputeId}/close`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({ closeReason }),
  });
  return handleResponse<DisputeData>(res);
}

export interface UploadedEvidenceFile {
  fileName: string;
  savedFileName: string;
  mimeType: string;
  size: number;
  sha256Hash: string;
  url: string;
  dataUrl?: string;
}

export async function uploadDisputeEvidence(
  token: string,
  files: File[],
): Promise<UploadedEvidenceFile[]> {
  const formData = new FormData();
  files.forEach((f) => formData.append('files', f));

  const res = await fetch(`${API_BASE}/disputes/upload-evidence`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
    },
    body: formData,
  });
  return handleResponse<UploadedEvidenceFile[]>(res);
}

/**
 * Resolves an evidence URL (relative, API path, or filename) to a full, loadable URL
 * across Admin, Recruiter, and Candidate frontends.
 */
export function resolveEvidenceUrl(url?: string | null): string {
  if (!url) return '';
  const trimmed = url.trim();
  if (
    trimmed.startsWith('data:') ||
    trimmed.startsWith('blob:') ||
    trimmed.startsWith('http://') ||
    trimmed.startsWith('https://')
  ) {
    return trimmed;
  }
  const backendBase = (
    process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api'
  ).replace(/\/api\/?$/, '');

  if (trimmed.startsWith('/api')) {
    return `${backendBase}${trimmed}`;
  }
  if (trimmed.startsWith('/')) {
    return `${backendBase}/api${trimmed}`;
  }
  return `${backendBase}/api/disputes/evidence-file/${trimmed}`;
}



