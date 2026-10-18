export type ContractStatus =
  | 'DRAFT'
  | 'PENDING_REVIEW'
  | 'REVISION_REQUESTED'
  | 'APPROVED'
  | 'SIGNED'
  | 'REJECTED'
  | 'CANCELLED';

export type ContractType = 'PROBATION' | 'FIXED_TERM' | 'INDEFINITE' | 'INTERNSHIP';
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
  pdfSha256Hash?: string | null;
  candidateSignerIp?: string | null;
  candidateOtpVerifiedAt?: string | null;
  employerSignerIp?: string | null;
  employerOtpVerifiedAt?: string | null;
  auditCertificate?: any;
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

export interface ContractScanPage {
  pageNumber: number;
  fileName: string;
  mimeType: string;
  fileSizeBytes: number;
  sha256Hash: string;
  url: string;
  dataUrl?: string;
}

export async function uploadSignedContractFiles(
  token: string,
  contractId: string,
  files: File[],
  note?: string,
): Promise<ContractData> {
  const formData = new FormData();
  for (const file of files) {
    formData.append('files', file);
  }
  if (note && note.trim()) {
    formData.append('note', note.trim());
  }

  const res = await fetch(`${API_BASE}/contracts/${contractId}/upload-signed-scan`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
    },
    body: formData,
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

export interface ContractOtpResponse {
  success: boolean;
  message: string;
  destinationEmail: string;
  expiresAt: string;
  demoOtp?: string;
}

export interface PublicContractVerification {
  verified: boolean;
  message?: string;
  contractNumber?: string;
  jobTitle?: string;
  status?: ContractStatus;
  isLegallyBinding?: boolean;
  sha256Hash?: string | null;
  candidate?: {
    fullName: string;
    signedAt?: string | null;
    isSigned: boolean;
    otpVerified: boolean;
  };
  employer?: {
    companyName: string;
    recruiterName?: string;
    signedAt?: string | null;
    isSigned: boolean;
    otpVerified: boolean;
  };
  auditCertificate?: any;
  legalComplianceText?: string;
  verifiedAt?: string;
}

export async function requestContractOtp(
  token: string,
  contractId: string,
  email?: string,
): Promise<ContractOtpResponse> {
  const res = await fetch(`${API_BASE}/contracts/${contractId}/request-otp`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({ email }),
  });
  return handleResponse<ContractOtpResponse>(res);
}

export async function eSignContract(
  token: string,
  contractId: string,
  signatureDataUrl: string,
  otpCode: string,
  options?: {
    acceptedContractTerms?: boolean;
    acceptedPlatformTerms?: boolean;
    note?: string;
  },
): Promise<ContractData> {
  const res = await fetch(`${API_BASE}/contracts/${contractId}/e-sign`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({
      signatureDataUrl,
      otpCode,
      acceptedContractTerms: options?.acceptedContractTerms ?? true,
      acceptedPlatformTerms: options?.acceptedPlatformTerms ?? true,
      note: options?.note,
    }),
  });
  return handleResponse<ContractData>(res);
}

export async function verifyContractPublic(
  contractNumber: string,
): Promise<PublicContractVerification> {
  const res = await fetch(`${API_BASE}/contracts/verify/${encodeURIComponent(contractNumber)}`, {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
    },
  });
  return handleResponse<PublicContractVerification>(res);
}

export interface AdminContractsFilters {
  search?: string;
  signingMethod?: ContractSigningMethod | 'ALL';
  status?: ContractStatus | 'ALL';
  page?: number;
  limit?: number;
}

export interface AdminContractsResponse {
  items: ContractData[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface ContractForensicDossier {
  contract: ContractData;
  isManual: boolean;
  isElectronic: boolean;
  enrichedHistories: Array<ContractHistoryItem & {
    performer?: { id: string; fullName: string; email: string; role: string } | null;
  }>;
  sanitizedOtps: Array<{
    id: string;
    email: string;
    createdAt: string;
    expiresAt: string;
    isUsed: boolean;
    attempts: number;
    maskedCode: string;
  }>;
  discrepancies: Array<{
    field: string;
    offerValue: any;
    contractValue: any;
    severity: 'INFO' | 'WARNING' | 'CRITICAL';
  }>;
  forensicSummary: {
    signingMethod: ContractSigningMethod;
    isSealed: boolean;
    sha256Hash?: string | null;
    status: ContractStatus;
    auditCertificate?: any;
    candidateSigned: boolean;
    candidateSignedAt?: string | null;
    employerSigned: boolean;
    employerSignedAt?: string | null;
    signedPdfUrl?: string | null;
    contractPdfUrl?: string | null;
  };
}

export async function getAdminContracts(
  token: string,
  filters?: AdminContractsFilters,
): Promise<AdminContractsResponse> {
  const params = new URLSearchParams();
  if (filters?.search) params.append('search', filters.search);
  if (filters?.signingMethod && filters.signingMethod !== 'ALL') params.append('signingMethod', filters.signingMethod);
  if (filters?.status && filters.status !== 'ALL') params.append('status', filters.status);
  if (filters?.page) params.append('page', String(filters.page));
  if (filters?.limit) params.append('limit', String(filters.limit));

  const queryStr = params.toString() ? `?${params.toString()}` : '';
  const res = await fetch(`${API_BASE}/contracts/admin/all${queryStr}`, {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
  });
  return handleResponse<AdminContractsResponse>(res);
}

export async function getContractForensics(
  token: string,
  contractId: string,
): Promise<ContractForensicDossier> {
  const res = await fetch(`${API_BASE}/contracts/admin/${contractId}/forensics`, {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
  });
  return handleResponse<ContractForensicDossier>(res);
}
