import { NotificationStatus, NotificationType, Prisma } from '@prisma/client';
import { PrismaService } from '../../database/prisma.service';
export interface CreateNotificationInput {
    recipientUserId: string;
    applicationId?: string;
    type?: NotificationType;
    title: string;
    message: string;
    payload?: Prisma.InputJsonValue;
}
export declare class NotificationsService {
    private readonly prisma;
    private readonly logger;
    constructor(prisma: PrismaService);
    createNotification(input: CreateNotificationInput): Promise<{
        id: string;
        title: string;
        status: import(".prisma/client").$Enums.NotificationStatus;
        createdAt: Date;
        type: import(".prisma/client").$Enums.NotificationType;
        applicationId: string | null;
        message: string;
        payload: Prisma.JsonValue | null;
        readAt: Date | null;
        recipientUserId: string | null;
    } | null>;
    findMyNotifications(userId: string, params?: {
        status?: NotificationStatus;
        page?: number;
        limit?: number;
    }): Promise<{
        data: {
            id: string;
            title: string;
            status: import(".prisma/client").$Enums.NotificationStatus;
            createdAt: Date;
            type: import(".prisma/client").$Enums.NotificationType;
            applicationId: string | null;
            message: string;
            payload: Prisma.JsonValue | null;
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
    getUnreadCount(userId: string): Promise<{
        unreadCount: number;
    }>;
    markAsRead(userId: string, notificationId: string): Promise<{
        id: string;
        title: string;
        status: import(".prisma/client").$Enums.NotificationStatus;
        createdAt: Date;
        type: import(".prisma/client").$Enums.NotificationType;
        applicationId: string | null;
        message: string;
        payload: Prisma.JsonValue | null;
        readAt: Date | null;
        recipientUserId: string | null;
    }>;
    markAllAsRead(userId: string): Promise<{
        updatedCount: number;
    }>;
    markByApplicationId(userId: string, applicationId: string): Promise<{
        updatedCount: number;
    }>;
}
