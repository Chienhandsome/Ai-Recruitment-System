import { Injectable, Logger, NotFoundException } from '@nestjs/common';
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

@Injectable()
export class NotificationsService {
  private readonly logger = new Logger(NotificationsService.name);

  constructor(private readonly prisma: PrismaService) {}

  async createNotification(input: CreateNotificationInput) {
    try {
      const notification = await this.prisma.notification.create({
        data: {
          recipientUserId: input.recipientUserId,
          applicationId: input.applicationId,
          type: input.type ?? NotificationType.APPLICATION_STATUS_CHANGED,
          status: NotificationStatus.UNREAD,
          title: input.title,
          message: input.message,
          payload: input.payload,
        },
      });

      this.logger.log(
        `Created notification ${notification.id} for user ${input.recipientUserId}: ${input.title}`,
      );
      return notification;
    } catch (error) {
      this.logger.error(
        `Failed to create notification for user ${input.recipientUserId}: ${error}`,
      );
      return null;
    }
  }

  async findMyNotifications(
    userId: string,
    params?: { status?: NotificationStatus; page?: number; limit?: number },
  ) {
    const page = params?.page ?? 1;
    const limit = params?.limit ?? 20;
    const skip = (page - 1) * limit;

    const where: Prisma.NotificationWhereInput = {
      recipientUserId: userId,
      ...(params?.status ? { status: params.status } : {}),
    };

    const [total, unreadCount, items] = await Promise.all([
      this.prisma.notification.count({ where }),
      this.prisma.notification.count({
        where: { recipientUserId: userId, status: NotificationStatus.UNREAD },
      }),
      this.prisma.notification.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
      }),
    ]);

    return {
      data: items,
      meta: {
        total,
        unreadCount,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async getUnreadCount(userId: string) {
    const unreadCount = await this.prisma.notification.count({
      where: {
        recipientUserId: userId,
        status: NotificationStatus.UNREAD,
      },
    });

    return { unreadCount };
  }

  async markAsRead(userId: string, notificationId: string) {
    const existing = await this.prisma.notification.findFirst({
      where: { id: notificationId, recipientUserId: userId },
    });

    if (!existing) {
      throw new NotFoundException('Không tìm thấy thông báo.');
    }

    const updated = await this.prisma.notification.update({
      where: { id: notificationId },
      data: {
        status: NotificationStatus.READ,
        readAt: new Date(),
      },
    });

    return updated;
  }

  async markAllAsRead(userId: string) {
    const result = await this.prisma.notification.updateMany({
      where: {
        recipientUserId: userId,
        status: NotificationStatus.UNREAD,
      },
      data: {
        status: NotificationStatus.READ,
        readAt: new Date(),
      },
    });

    return { updatedCount: result.count };
  }

  async markByApplicationId(userId: string, applicationId: string) {
    const result = await this.prisma.notification.updateMany({
      where: {
        recipientUserId: userId,
        applicationId,
        status: NotificationStatus.UNREAD,
      },
      data: {
        status: NotificationStatus.READ,
        readAt: new Date(),
      },
    });

    return { updatedCount: result.count };
  }
}
