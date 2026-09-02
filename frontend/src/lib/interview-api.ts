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

export type CandidateResponseStatus =
  | 'PENDING'
  | 'ACCEPTED'
  | 'RESCHEDULE_REQUESTED'
  | 'DECLINED';

export interface InterviewData {
  id: string;
  applicationId: string;
  title: string;
  type: InterviewType;
  status: InterviewStatus;
  candidateResponse?: CandidateResponseStatus | null;
  candidateNotes?: string | null;
  proposedSlots?: string[] | null;
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
      recruiter?: {
        title?: string | null;
        fullName?: string | null;
        email?: string | null;
        phone?: string | null;
      } | null;
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
  candidateResponse?: CandidateResponseStatus;
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

const API_URL =
  process.env.NEXT_PUBLIC_API_URL ?? 'https://ai-recruitment-system-test-deploy.onrender.com/api';

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

export interface CandidateResponseInterviewInput {
  response: CandidateResponseStatus;
  candidateNotes?: string;
  proposedSlots?: string[];
}

export async function respondToInterview(
  token: string,
  id: string,
  input: CandidateResponseInterviewInput,
): Promise<InterviewData> {
  const response = await fetch(`${API_URL}/interviews/${id}/candidate-response`, {
    method: 'PATCH',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(input),
  });

  if (!response.ok) {
    throw new InterviewApiError(
      await readInterviewApiError(response, 'Không thể gửi phản hồi phỏng vấn'),
      response.status,
    );
  }

  return response.json();
}

export const candidateResponseLabels: Record<CandidateResponseStatus, string> = {
  PENDING: 'Chờ bạn xác nhận',
  ACCEPTED: 'Đã xác nhận tham gia',
  RESCHEDULE_REQUESTED: 'Đã yêu cầu dời lịch',
  DECLINED: 'Đã từ chối',
};

export const candidateResponseStyles: Record<
  CandidateResponseStatus,
  { bg: string; text: string; border: string; dot: string }
> = {
  PENDING: {
    bg: 'bg-amber-50',
    text: 'text-amber-700',
    border: 'border-amber-200',
    dot: 'bg-amber-500',
  },
  ACCEPTED: {
    bg: 'bg-emerald-50',
    text: 'text-emerald-700',
    border: 'border-emerald-200',
    dot: 'bg-emerald-500',
  },
  RESCHEDULE_REQUESTED: {
    bg: 'bg-orange-50',
    text: 'text-orange-700',
    border: 'border-orange-200',
    dot: 'bg-orange-500',
  },
  DECLINED: {
    bg: 'bg-slate-100',
    text: 'text-slate-600',
    border: 'border-slate-300',
    dot: 'bg-slate-400',
  },
};

export function generateGoogleCalendarUrl(interview: {
  title: string;
  scheduledAt: string;
  durationMinutes: number;
  locationOrLink?: string | null;
  interviewerNotes?: string | null;
}): string {
  const startDate = new Date(interview.scheduledAt);
  const duration = interview.durationMinutes || 60;
  const endDate = new Date(startDate.getTime() + duration * 60 * 1000);

  const formatGCalDate = (d: Date) =>
    d.toISOString().replace(/-|:|\.\d\d\d/g, '');

  const datesParam = `${formatGCalDate(startDate)}/${formatGCalDate(endDate)}`;

  const details = [
    `Buổi phỏng vấn: ${interview.title}`,
    interview.locationOrLink ? `Địa điểm / Link phòng họp: ${interview.locationOrLink}` : '',
    interview.interviewerNotes ? `Dặn dò từ nhà tuyển dụng: ${interview.interviewerNotes}` : '',
  ]
    .filter(Boolean)
    .join('\n\n');

  const params = new URLSearchParams({
    action: 'TEMPLATE',
    text: interview.title,
    dates: datesParam,
    details,
    location: interview.locationOrLink || '',
  });

  return `https://calendar.google.com/calendar/render?${params.toString()}`;
}

export function downloadIcsFile(interview: {
  title: string;
  scheduledAt: string;
  durationMinutes: number;
  locationOrLink?: string | null;
  interviewerNotes?: string | null;
}) {
  const startDate = new Date(interview.scheduledAt);
  const duration = interview.durationMinutes || 60;
  const endDate = new Date(startDate.getTime() + duration * 60 * 1000);

  const formatIcsDate = (d: Date) =>
    d.toISOString().replace(/-|:|\.\d\d\d/g, '');

  const now = formatIcsDate(new Date());
  const start = formatIcsDate(startDate);
  const end = formatIcsDate(endDate);

  const cleanDesc = (interview.interviewerNotes || '')
    .replace(/\n/g, '\\n')
    .replace(/,/g, '\\,');

  const icsContent = [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//SmartRecruit AI//Interview Calendar//VI',
    'CALSCALE:GREGORIAN',
    'METHOD:REQUEST',
    'BEGIN:VEVENT',
    `DTSTAMP:${now}`,
    `DTSTART:${start}`,
    `DTEND:${end}`,
    `SUMMARY:${interview.title}`,
    `DESCRIPTION:${cleanDesc}`,
    `LOCATION:${interview.locationOrLink || ''}`,
    'STATUS:CONFIRMED',
    'END:VEVENT',
    'END:VCALENDAR',
  ].join('\r\n');

  const blob = new Blob([icsContent], { type: 'text/calendar;charset=utf-8' });
  const link = document.createElement('a');
  link.href = window.URL.createObjectURL(blob);
  link.setAttribute('download', `interview_${interview.title.replace(/[^a-zA-Z0-9_-]/g, '_')}.ics`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}
