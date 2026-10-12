export type ContractStatus =
  | 'DRAFT'
  | 'PENDING_REVIEW'
  | 'REVISION_REQUESTED'
  | 'APPROVED'
  | 'SIGNED'
  | 'REJECTED'
  | 'CANCELLED';

export type ContractType = 'PROBATION' | 'FIXED_TERM' | 'INDEFINITE';
export type ContractSigningMethod = 'MANUAL' | 'ELECTRONIC';

export interface ContractHistoryItem {
  id: string;
  contractId: string;
  action: string;
  performedByUserId?: string | null;
  note?: string | null;
  snapshot?: any;
  createdAt: string;
}

export interface ContractData {
  id: string;
  contractNumber: string;
  applicationId: string;
  offerId?: string | null;
  status: ContractStatus;
  contractType: ContractType;
  signingMethod: ContractSigningMethod;
  jobTitle: string;
  salary: number | string;
  salaryPeriod: string;
  currency: string;
  startDate: string;
  endDate?: string | null;
  workType?: string | null;
  workLocation?: string | null;
  workingHours?: string | null;
  probationPeriodMonths?: number | null;
  probationSalaryRate?: number | null;
  benefits?: string | null;
  customTerms?: string | null;
  contractPdfUrl?: string | null;
  signedPdfUrl?: string | null;
  candidateSignatureUrl?: string | null;
  candidateSignedAt?: string | null;
  employerSignatureUrl?: string | null;
  employerSignedAt?: string | null;
  latestRevisionNote?: string | null;
  version: number;
  createdAt: string;
  updatedAt: string;
  application?: {
    id: string;
    job?: {
      id: string;
      title: string;
      recruiter?: {
        userId?: string;
        user?: { fullName?: string; email?: string };
        company?: { id?: string; name?: string; logoUrl?: string; address?: string };
      };
    };
    candidate?: {
      id: string;
      fullName: string;
      email: string;
      phone?: string | null;
      address?: string | null;
      userId?: string;
    };
  };
  offer?: any;
  histories?: ContractHistoryItem[];
}

export interface CreateContractInput {
  applicationId: string;
  offerId?: string;
  contractType?: ContractType;
  signingMethod?: ContractSigningMethod;
  jobTitle?: string;
  salary?: number;
  salaryPeriod?: string;
  currency?: string;
  startDate?: string;
  endDate?: string;
  workType?: string;
  workLocation?: string;
  workingHours?: string;
  probationPeriodMonths?: number;
  probationSalaryRate?: number;
  benefits?: string;
  customTerms?: string;
}

export interface UpdateContractInput {
  contractType?: ContractType;
  signingMethod?: ContractSigningMethod;
  jobTitle?: string;
  salary?: number;
  salaryPeriod?: string;
  currency?: string;
  startDate?: string;
  endDate?: string;
  workType?: string;
  workLocation?: string;
  workingHours?: string;
  probationPeriodMonths?: number;
  probationSalaryRate?: number;
  benefits?: string;
  customTerms?: string;
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

export async function createContract(
  token: string,
  input: CreateContractInput,
): Promise<ContractData> {
  const res = await fetch(`${API_BASE}/contracts`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(input),
  });
  return handleResponse<ContractData>(res);
}

export async function getContractByApplication(
  token: string,
  applicationId: string,
): Promise<{ contract: ContractData | null; isRecruiter?: boolean; isCandidate?: boolean }> {
  const res = await fetch(`${API_BASE}/contracts/application/${applicationId}`, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });
  return handleResponse<{ contract: ContractData | null; isRecruiter?: boolean; isCandidate?: boolean }>(res);
}

export async function getContractById(
  token: string,
  contractId: string,
): Promise<{ contract: ContractData; isRecruiter?: boolean; isCandidate?: boolean }> {
  const res = await fetch(`${API_BASE}/contracts/${contractId}`, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });
  return handleResponse<{ contract: ContractData; isRecruiter?: boolean; isCandidate?: boolean }>(res);
}

export async function updateContract(
  token: string,
  contractId: string,
  input: UpdateContractInput,
): Promise<ContractData> {
  const res = await fetch(`${API_BASE}/contracts/${contractId}`, {
    method: 'PATCH',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(input),
  });
  return handleResponse<ContractData>(res);
}

export async function sendContract(
  token: string,
  contractId: string,
): Promise<ContractData> {
  const res = await fetch(`${API_BASE}/contracts/${contractId}/send`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });
  return handleResponse<ContractData>(res);
}

export async function requestContractRevision(
  token: string,
  contractId: string,
  note: string,
): Promise<ContractData> {
  const res = await fetch(`${API_BASE}/contracts/${contractId}/request-revision`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({ note }),
  });
  return handleResponse<ContractData>(res);
}

export async function approveContract(
  token: string,
  contractId: string,
): Promise<ContractData> {
  const res = await fetch(`${API_BASE}/contracts/${contractId}/approve`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });
  return handleResponse<ContractData>(res);
}

export async function uploadSignedContract(
  token: string,
  contractId: string,
  signedPdfUrl: string,
  note?: string,
): Promise<ContractData> {
  const res = await fetch(`${API_BASE}/contracts/${contractId}/upload-signed`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({ signedPdfUrl, note }),
  });
  return handleResponse<ContractData>(res);
}

export async function eSignContract(
  token: string,
  contractId: string,
  signatureDataUrl: string,
  note?: string,
): Promise<ContractData> {
  const res = await fetch(`${API_BASE}/contracts/${contractId}/e-sign`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({ signatureDataUrl, note }),
  });
  return handleResponse<ContractData>(res);
}
