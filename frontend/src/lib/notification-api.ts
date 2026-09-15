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
  const fallback = {
    data: [],
    meta: { total: 0, unreadCount: 0, page: 1, limit: params?.limit || 20, totalPages: 0 },
  };

  if (!token || !token.trim()) {
    return fallback;
  }

  const query = new URLSearchParams();
  if (params?.status) query.set('status', params.status);
  if (params?.page) query.set('page', String(params.page));
  if (params?.limit) query.set('limit', String(params.limit));

  try {
    const response = await fetch(`${API_URL}/notifications?${query.toString()}`, {
      headers: { Authorization: `Bearer ${token}` },
      cache: 'no-store',
    });

    if (response.status === 401 || response.status === 403) {
      return fallback;
    }

    if (!response.ok) {
      throw new NotificationApiError(
        await readNotificationApiError(response, 'Không thể tải thông báo'),
        response.status,
      );
    }

    return await response.json();
  } catch (error) {
    if (error instanceof NotificationApiError) {
      throw error;
    }
    console.warn('Network error while fetching notifications:', error);
    return fallback;
  }
}

export async function getUnreadNotificationCount(
  token: string,
): Promise<UnreadCountResponse> {
  if (!token || !token.trim()) {
    return { unreadCount: 0 };
  }

  try {
    const response = await fetch(`${API_URL}/notifications/unread-count`, {
      headers: { Authorization: `Bearer ${token}` },
      cache: 'no-store',
    });

    if (response.status === 401 || response.status === 403) {
      return { unreadCount: 0 };
    }

    if (!response.ok) {
      throw new NotificationApiError(
        await readNotificationApiError(response, 'Không thể tải số lượng thông báo'),
        response.status,
      );
    }

    return await response.json();
  } catch (error) {
    if (error instanceof NotificationApiError) {
      throw error;
    }
    console.warn('Network error while fetching unread notification count:', error);
    return { unreadCount: 0 };
  }
}

export async function markNotificationAsRead(
  token: string,
  id: string,
): Promise<NotificationItem> {
  if (!token || !token.trim()) {
    throw new NotificationApiError('Token không hợp lệ', 401);
  }

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
  if (!token || !token.trim()) {
    return { updatedCount: 0 };
  }

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
  if (!token || !token.trim()) {
    return { updatedCount: 0 };
  }

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
