import { NotificationStatus } from '@prisma/client';
import { NotificationsService } from './notifications.service';
import type { AuthenticatedUser } from '../auth/auth.types';
export declare class NotificationsController {
    private readonly notificationsService;
    constructor(notificationsService: NotificationsService);
    findMyNotifications(user: AuthenticatedUser, status?: NotificationStatus, page?: number, limit?: number): Promise<{
        data: {
            id: string;
            title: string;
            status: import(".prisma/client").$Enums.NotificationStatus;
            createdAt: Date;
            type: import(".prisma/client").$Enums.NotificationType;
            applicationId: string | null;
            message: string;
            payload: import("@prisma/client/runtime/library").JsonValue | null;
            readAt: Date | null;
            recipientUserId: string | null;
        }[];
        meta: {
            total: number;
            unreadCount: number;
            page: number;
            limit: number;
            totalPages: number;
        };
    }>;
    getUnreadCount(user: AuthenticatedUser): Promise<{
        unreadCount: number;
    }>;
    markAsRead(user: AuthenticatedUser, id: string): Promise<{
        id: string;
        title: string;
        status: import(".prisma/client").$Enums.NotificationStatus;
        createdAt: Date;
        type: import(".prisma/client").$Enums.NotificationType;
        applicationId: string | null;
        message: string;
        payload: import("@prisma/client/runtime/library").JsonValue | null;
        readAt: Date | null;
        recipientUserId: string | null;
    }>;
    markAllAsRead(user: AuthenticatedUser): Promise<{
        updatedCount: number;
    }>;
    markByApplicationId(user: AuthenticatedUser, applicationId: string): Promise<{
        updatedCount: number;
    }>;
}
