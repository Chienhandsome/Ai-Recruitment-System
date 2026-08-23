export type InterviewType =
  | 'ONLINE'
  | 'OFFLINE'
  | 'AI_SCREENING'
  | 'TECHNICAL'
  | 'BEHAVIORAL';

export type InterviewStatus =
  | 'SCHEDULED'
  | 'IN_PROGRESS'
  | 'COMPLETED'
  | 'CANCELLED'
  | 'RESCHEDULED';

export interface InterviewData {
  id: string;
  applicationId: string;
  title: string;
  type: InterviewType;
  status: InterviewStatus;
  scheduledAt: string;
  durationMinutes: number;
  locationOrLink?: string | null;
  interviewerNotes?: string | null;
  score?: number | null;
  createdAt: string;
  updatedAt: string;
  application?: {
    id: string;
    currentStage: string;
    job?: {
      id: string;
      title: string;
      location?: string;
      company?: { id?: string; name: string; logoUrl?: string };
    };
    candidate?: {
      id: string;
      fullName?: string | null;
      email: string;
      phone?: string | null;
      avatarUrl?: string | null;
    };
  };
}

export interface CreateInterviewInput {
  applicationId: string;
  title: string;
  type?: InterviewType;
  scheduledAt: string;
  durationMinutes?: number;
  locationOrLink?: string;
  interviewerNotes?: string;
}

export interface UpdateInterviewInput {
  title?: string;
  type?: InterviewType;
  status?: InterviewStatus;
  scheduledAt?: string;
  durationMinutes?: number;
  locationOrLink?: string;
  interviewerNotes?: string;
}

export interface SubmitInterviewFeedbackInput {
  score: number;
  interviewerNotes: string;
  nextStage?: string;
}

export class InterviewApiError extends Error {
  constructor(
    message: string,
    readonly status: number,
  ) {
    super(message);
    this.name = 'InterviewApiError';
  }
}

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3001/api';

async function readInterviewApiError(response: Response, fallback: string) {
  try {
    const payload = (await response.json()) as { message?: string | string[] };
    if (Array.isArray(payload.message)) return payload.message.join(', ');
    return payload.message || fallback;
  } catch {
    return fallback;
  }
}

export async function createInterview(
  token: string,
  input: CreateInterviewInput,
): Promise<InterviewData> {
  const response = await fetch(`${API_URL}/interviews`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(input),
  });

  if (!response.ok) {
    throw new InterviewApiError(
      await readInterviewApiError(response, 'Không thể tạo lịch phỏng vấn'),
      response.status,
    );
  }

  return response.json();
}

export async function getInterviews(
  token: string,
  params?: {
    applicationId?: string;
    jobId?: string;
    status?: InterviewStatus;
    type?: InterviewType;
    page?: number;
    limit?: number;
  },
): Promise<{ data: InterviewData[]; meta: { total: number; page: number; limit: number; totalPages: number } }> {
  const query = new URLSearchParams();
  if (params?.applicationId) query.set('applicationId', params.applicationId);
  if (params?.jobId) query.set('jobId', params.jobId);
  if (params?.status) query.set('status', params.status);
  if (params?.type) query.set('type', params.type);
  if (params?.page) query.set('page', String(params.page));
  if (params?.limit) query.set('limit', String(params.limit));

  const response = await fetch(`${API_URL}/interviews?${query.toString()}`, {
    headers: { Authorization: `Bearer ${token}` },
    cache: 'no-store',
  });

  if (!response.ok) {
    throw new InterviewApiError(
      await readInterviewApiError(response, 'Không thể tải danh sách phỏng vấn'),
      response.status,
    );
  }

  return response.json();
}

export async function getMyInterviews(token: string): Promise<InterviewData[]> {
  const response = await fetch(`${API_URL}/interviews/my`, {
    headers: { Authorization: `Bearer ${token}` },
    cache: 'no-store',
  });

  if (!response.ok) {
    throw new InterviewApiError(
      await readInterviewApiError(response, 'Không thể tải lịch phỏng vấn của bạn'),
      response.status,
    );
  }

  return response.json();
}

export async function getInterviewDetail(
  token: string,
  id: string,
): Promise<InterviewData> {
  const response = await fetch(`${API_URL}/interviews/${id}`, {
    headers: { Authorization: `Bearer ${token}` },
    cache: 'no-store',
  });

  if (!response.ok) {
    throw new InterviewApiError(
      await readInterviewApiError(response, 'Không thể tải chi tiết lịch phỏng vấn'),
      response.status,
    );
  }

  return response.json();
}

export async function updateInterview(
  token: string,
  id: string,
  input: UpdateInterviewInput,
): Promise<InterviewData> {
  const response = await fetch(`${API_URL}/interviews/${id}`, {
    method: 'PATCH',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(input),
  });

  if (!response.ok) {
    throw new InterviewApiError(
      await readInterviewApiError(response, 'Không thể cập nhật lịch phỏng vấn'),
      response.status,
    );
  }

  return response.json();
}

export async function submitInterviewFeedback(
  token: string,
  id: string,
  input: SubmitInterviewFeedbackInput,
): Promise<InterviewData & { applicationStage: string }> {
  const response = await fetch(`${API_URL}/interviews/${id}/feedback`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(input),
  });

  if (!response.ok) {
    throw new InterviewApiError(
      await readInterviewApiError(response, 'Không thể lưu đánh giá phỏng vấn'),
      response.status,
    );
  }

  return response.json();
}

export const interviewTypeLabels: Record<InterviewType, string> = {
  ONLINE: 'Online (Google Meet / Zoom)',
  OFFLINE: 'Trực tiếp tại văn phòng',
  AI_SCREENING: 'Sơ tuyển qua AI',
  TECHNICAL: 'Phỏng vấn Kỹ thuật (Technical)',
  BEHAVIORAL: 'Phỏng vấn Hành vi & Văn hóa',
};

export const interviewStatusLabels: Record<InterviewStatus, string> = {
  SCHEDULED: 'Đã lên lịch',
  IN_PROGRESS: 'Đang diễn ra',
  COMPLETED: 'Đã hoàn tất',
  CANCELLED: 'Đã hủy',
  RESCHEDULED: 'Đã đổi lịch',
};
