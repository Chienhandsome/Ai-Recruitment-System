export type NotificationType =
  | 'APPLICATION_STATUS_CHANGED'
  | 'INTERVIEW_SCHEDULED'
  | 'MATCHING_COMPLETED'
  | 'SYSTEM_ALERT';

export type NotificationStatus = 'UNREAD' | 'READ' | 'ARCHIVED';

export interface NotificationItem {
  id: string;
  applicationId?: string | null;
  recipientUserId: string;
  type: NotificationType;
  status: NotificationStatus;
  title: string;
  message: string;
  payload?: Record<string, unknown> | null;
  createdAt: string;
  readAt?: string | null;
}

export interface UnreadCountResponse {
  unreadCount: number;
}

export class NotificationApiError extends Error {
  constructor(
    message: string,
    readonly status: number,
  ) {
    super(message);
    this.name = 'NotificationApiError';
  }
}

const API_URL =
  process.env.NEXT_PUBLIC_API_URL ?? 'https://ai-recruitment-system-test-deploy.onrender.com/api';

async function readNotificationApiError(response: Response, fallback: string) {
  try {
    const payload = (await response.json()) as { message?: string | string[] };
    if (Array.isArray(payload.message)) return payload.message.join(', ');
    return payload.message || fallback;
  } catch {
    return fallback;
  }
}

export async function getMyNotifications(
  token: string,
  params?: { status?: NotificationStatus; page?: number; limit?: number },
): Promise<{
  data: NotificationItem[];
  meta: { total: number; unreadCount: number; page: number; limit: number; totalPages: number };
}> {
  const query = new URLSearchParams();
  if (params?.status) query.set('status', params.status);
  if (params?.page) query.set('page', String(params.page));
  if (params?.limit) query.set('limit', String(params.limit));

  const response = await fetch(`${API_URL}/notifications?${query.toString()}`, {
    headers: { Authorization: `Bearer ${token}` },
    cache: 'no-store',
  });

  if (!response.ok) {
    throw new NotificationApiError(
      await readNotificationApiError(response, 'Không thể tải thông báo'),
      response.status,
    );
  }

  return response.json();
}

export async function getUnreadNotificationCount(
  token: string,
): Promise<UnreadCountResponse> {
  const response = await fetch(`${API_URL}/notifications/unread-count`, {
    headers: { Authorization: `Bearer ${token}` },
    cache: 'no-store',
  });

  if (!response.ok) {
    throw new NotificationApiError(
      await readNotificationApiError(response, 'Không thể tải số lượng thông báo'),
      response.status,
    );
  }

  return response.json();
}

export async function markNotificationAsRead(
  token: string,
  id: string,
): Promise<NotificationItem> {
  const response = await fetch(`${API_URL}/notifications/${id}/read`, {
    method: 'PATCH',
    headers: { Authorization: `Bearer ${token}` },
  });

  if (!response.ok) {
    throw new NotificationApiError(
      await readNotificationApiError(response, 'Không thể cập nhật thông báo'),
      response.status,
    );
  }

  return response.json();
}

export async function markAllNotificationsAsRead(
  token: string,
): Promise<{ updatedCount: number }> {
  const response = await fetch(`${API_URL}/notifications/read-all`, {
    method: 'PATCH',
    headers: { Authorization: `Bearer ${token}` },
  });

  if (!response.ok) {
    throw new NotificationApiError(
      await readNotificationApiError(response, 'Không thể cập nhật thông báo'),
      response.status,
    );
  }

  return response.json();
}

export async function markApplicationNotificationsAsRead(
  token: string,
  applicationId: string,
): Promise<{ updatedCount: number }> {
  const response = await fetch(`${API_URL}/notifications/application/${applicationId}/read`, {
    method: 'PATCH',
    headers: { Authorization: `Bearer ${token}` },
  });

  if (!response.ok) {
    throw new NotificationApiError(
      await readNotificationApiError(response, 'Không thể cập nhật thông báo'),
      response.status,
    );
  }

  return response.json();
}
