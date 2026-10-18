/* eslint-disable @typescript-eslint/no-unsafe-assignment -- Jest asymmetric matchers return any. */
import { Test, TestingModule } from '@nestjs/testing';
import { NotificationsService } from './notifications.service';
import { PrismaService } from '../../database/prisma.service';
import {
  NotificationStatus,
  NotificationType,
  type Prisma,
} from '@prisma/client';

describe('NotificationsService', () => {
  let service: NotificationsService;
  let prisma: {
    notification: {
      create: jest.Mock;
      count: jest.Mock;
      findMany: jest.Mock;
      findFirst: jest.Mock;
      update: jest.Mock;
      updateMany: jest.Mock;
    };
  };

  beforeEach(async () => {
    prisma = {
      notification: {
        create: jest.fn(),
        count: jest.fn(),
        findMany: jest.fn(),
        findFirst: jest.fn(),
        update: jest.fn(),
        updateMany: jest.fn(),
      },
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        NotificationsService,
        { provide: PrismaService, useValue: prisma },
      ],
    }).compile();

    service = module.get<NotificationsService>(NotificationsService);
  });

  it('creates a notification with UNREAD status', async () => {
    const mockNotification = {
      id: 'notif-1',
      recipientUserId: 'user-1',
      applicationId: 'app-1',
      type: NotificationType.APPLICATION_STATUS_CHANGED,
      status: NotificationStatus.UNREAD,
      title: 'Cập nhật trạng thái',
      message: 'Hồ sơ đã được duyệt',
      payload: { stage: 'SHORTLISTED' },
      createdAt: new Date(),
      readAt: null,
    };

    prisma.notification.create.mockResolvedValue(mockNotification);

    const result = await service.createNotification({
      recipientUserId: 'user-1',
      applicationId: 'app-1',
      title: 'Cập nhật trạng thái',
      message: 'Hồ sơ đã được duyệt',
      payload: { stage: 'SHORTLISTED' },
    });

    expect(result).toEqual(mockNotification);
    expect(prisma.notification.create).toHaveBeenCalledWith({
      data: expect.objectContaining({
        recipientUserId: 'user-1',
        applicationId: 'app-1',
        status: NotificationStatus.UNREAD,
        title: 'Cập nhật trạng thái',
      }),
    });
  });

  it('uses the business transaction and ignores duplicate event keys without updating read status', async () => {
    const createMany = jest.fn().mockResolvedValue({ count: 0 });
    const client = {
      notification: { createMany },
    } as unknown as Prisma.TransactionClient;
    const result = await service.createNotificationOnce(client, 'event-1', {
      recipientUserId: 'user-1',
      applicationId: 'app-1',
      title: 'AI completed',
      message: 'Score ready',
    });

    expect(result).toEqual({ count: 0 });
    expect(createMany).toHaveBeenCalledWith({
      data: expect.objectContaining({
        eventKey: 'event-1',
        recipientUserId: 'user-1',
        status: 'UNREAD',
      }),
      skipDuplicates: true,
    });
    expect(prisma.notification.create).not.toHaveBeenCalled();
    expect(prisma.notification.update).not.toHaveBeenCalled();
  });

  it('propagates transactional notification failures so the business change can roll back', async () => {
    const client = {
      notification: {
        createMany: jest.fn().mockRejectedValue(new Error('DB unavailable')),
      },
    } as unknown as Prisma.TransactionClient;
    await expect(
      service.createNotificationOnce(client, 'event-1', {
        recipientUserId: 'user-1',
        title: 'AI completed',
        message: 'Score ready',
      }),
    ).rejects.toThrow('DB unavailable');
  });

  it('returns unread count for a user', async () => {
    prisma.notification.count.mockResolvedValue(3);

    const result = await service.getUnreadCount('user-1');

    expect(result).toEqual({ unreadCount: 3 });
    expect(prisma.notification.count).toHaveBeenCalledWith({
      where: {
        recipientUserId: 'user-1',
        status: NotificationStatus.UNREAD,
      },
    });
  });

  it('marks a single notification as read', async () => {
    prisma.notification.findFirst.mockResolvedValue({
      id: 'notif-1',
      recipientUserId: 'user-1',
      status: NotificationStatus.UNREAD,
    });
    prisma.notification.update.mockResolvedValue({
      id: 'notif-1',
      status: NotificationStatus.READ,
      readAt: new Date(),
    });

    const result = await service.markAsRead('user-1', 'notif-1');

    expect(result.status).toBe(NotificationStatus.READ);
    expect(prisma.notification.update).toHaveBeenCalledWith({
      where: { id: 'notif-1' },
      data: expect.objectContaining({
        status: NotificationStatus.READ,
      }),
    });
  });

  it('marks all notifications as read for a user', async () => {
    prisma.notification.updateMany.mockResolvedValue({ count: 5 });

    const result = await service.markAllAsRead('user-1');

    expect(result).toEqual({ updatedCount: 5 });
    expect(prisma.notification.updateMany).toHaveBeenCalledWith({
      where: {
        recipientUserId: 'user-1',
        status: NotificationStatus.UNREAD,
      },
      data: expect.objectContaining({
        status: NotificationStatus.READ,
      }),
    });
  });

  it('marks notifications by application id as read', async () => {
    prisma.notification.updateMany.mockResolvedValue({ count: 2 });

    const result = await service.markByApplicationId('user-1', 'app-1');

    expect(result).toEqual({ updatedCount: 2 });
    expect(prisma.notification.updateMany).toHaveBeenCalledWith({
      where: {
        recipientUserId: 'user-1',
        applicationId: 'app-1',
        status: NotificationStatus.UNREAD,
      },
      data: expect.objectContaining({
        status: NotificationStatus.READ,
      }),
    });
  });
});
