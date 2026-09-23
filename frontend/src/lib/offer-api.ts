export type OfferStatus = 'PENDING' | 'ACCEPTED' | 'DECLINED' | 'EXPIRED' | 'CANCELLED';

export interface OfferData {
  id: string;
  applicationId: string;
  status: OfferStatus;
  salary: number;
  salaryPeriod: string;
  currency: string;
  benefits?: string | null;
  startDate: string;
  expiresAt: string;
  workType?: string | null;
  workLocation?: string | null;
  notes?: string | null;
  offerLetterUrl?: string | null;
  contactName?: string | null;
  contactEmail?: string | null;
  contactPhone?: string | null;
  candidateResponseAt?: string | null;
  declineReason?: string | null;
  declineNote?: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface CreateOfferInput {
  applicationId: string;
  salary: number;
  salaryPeriod?: string;
  currency?: string;
  startDate: string;
  expiresAt: string;
  workType?: string;
  workLocation?: string;
  benefits?: string;
  notes?: string;
  contactName?: string;
  contactEmail?: string;
  contactPhone?: string;
}

export interface UpdateOfferInput {
  salary?: number;
  salaryPeriod?: string;
  currency?: string;
  startDate?: string;
  expiresAt?: string;
  workType?: string;
  workLocation?: string;
  benefits?: string;
  notes?: string;
  contactName?: string;
  contactEmail?: string;
  contactPhone?: string;
}

export interface DeclineOfferInput {
  reason?: string;
  note?: string;
}

const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000/api';

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

export async function createOffer(
  token: string,
  input: CreateOfferInput,
): Promise<OfferData> {
  const res = await fetch(`${API_BASE}/offers`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(input),
  });
  return handleResponse<OfferData>(res);
}

export async function getOfferByApplication(
  token: string,
  applicationId: string,
): Promise<{ application: any; offer: OfferData | null }> {
  const res = await fetch(`${API_BASE}/offers/application/${applicationId}`, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });
  return handleResponse<{ application: any; offer: OfferData | null }>(res);
}

export async function updateOffer(
  token: string,
  offerId: string,
  input: UpdateOfferInput,
): Promise<OfferData> {
  const res = await fetch(`${API_BASE}/offers/${offerId}`, {
    method: 'PATCH',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(input),
  });
  return handleResponse<OfferData>(res);
}

export async function acceptOffer(
  token: string,
  offerId: string,
): Promise<OfferData> {
  const res = await fetch(`${API_BASE}/offers/${offerId}/accept`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });
  return handleResponse<OfferData>(res);
}

export async function declineOffer(
  token: string,
  offerId: string,
  input: DeclineOfferInput,
): Promise<OfferData> {
  const res = await fetch(`${API_BASE}/offers/${offerId}/decline`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(input),
  });
  return handleResponse<OfferData>(res);
}

export async function revokeOffer(
  token: string,
  offerId: string,
  reason?: string,
): Promise<OfferData> {
  const res = await fetch(`${API_BASE}/offers/${offerId}/revoke`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({ reason }),
  });
  return handleResponse<OfferData>(res);
}

