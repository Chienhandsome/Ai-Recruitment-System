export interface SystemPolicyData {
  id: string;
  code: string;
  title: string;
  description?: string | null;
  content: string;
  version: number;
  isPublished: boolean;
  updatedByUserId?: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface UpdatePolicyInput {
  title: string;
  description?: string;
  content: string;
  isPublished?: boolean;
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

export async function getPublicPolicies(): Promise<SystemPolicyData[]> {
  const res = await fetch(`${API_BASE}/policies`, { cache: 'no-store' });
  return handleResponse<SystemPolicyData[]>(res);
}

export async function getPublicPolicyByCode(code: string): Promise<SystemPolicyData> {
  const res = await fetch(`${API_BASE}/policies/${code}`, { cache: 'no-store' });
  return handleResponse<SystemPolicyData>(res);
}

export async function getAdminPolicies(token: string): Promise<SystemPolicyData[]> {
  const res = await fetch(`${API_BASE}/policies/admin/all`, {
    headers: { Authorization: `Bearer ${token}` },
    cache: 'no-store',
  });
  return handleResponse<SystemPolicyData[]>(res);
}

export async function updateAdminPolicy(
  token: string,
  code: string,
  input: UpdatePolicyInput,
): Promise<SystemPolicyData> {
  const res = await fetch(`${API_BASE}/policies/admin/${code}`, {
    method: 'PATCH',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(input),
  });
  return handleResponse<SystemPolicyData>(res);
}
