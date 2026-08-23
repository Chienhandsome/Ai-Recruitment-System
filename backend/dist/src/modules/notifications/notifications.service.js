"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var NotificationsService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.NotificationsService = void 0;
const common_1 = require("@nestjs/common");
const client_1 = require("@prisma/client");
const prisma_service_1 = require("../../database/prisma.service");
let NotificationsService = NotificationsService_1 = class NotificationsService {
    prisma;
    logger = new common_1.Logger(NotificationsService_1.name);
    constructor(prisma) {
        this.prisma = prisma;
    }
    async createNotification(input) {
        try {
            const notification = await this.prisma.notification.create({
                data: {
                    recipientUserId: input.recipientUserId,
                    applicationId: input.applicationId,
                    type: input.type ?? client_1.NotificationType.APPLICATION_STATUS_CHANGED,
                    status: client_1.NotificationStatus.UNREAD,
                    title: input.title,
                    message: input.message,
                    payload: input.payload,
                },
            });
            this.logger.log(`Created notification ${notification.id} for user ${input.recipientUserId}: ${input.title}`);
            return notification;
        }
        catch (error) {
            this.logger.error(`Failed to create notification for user ${input.recipientUserId}: ${error}`);
            return null;
        }
    }
    async findMyNotifications(userId, params) {
        const page = params?.page ?? 1;
        const limit = params?.limit ?? 20;
        const skip = (page - 1) * limit;
        const where = {
            recipientUserId: userId,
            ...(params?.status ? { status: params.status } : {}),
        };
        const [total, unreadCount, items] = await Promise.all([
            this.prisma.notification.count({ where }),
            this.prisma.notification.count({
                where: { recipientUserId: userId, status: client_1.NotificationStatus.UNREAD },
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
    async getUnreadCount(userId) {
        const unreadCount = await this.prisma.notification.count({
            where: {
                recipientUserId: userId,
                status: client_1.NotificationStatus.UNREAD,
            },
        });
        return { unreadCount };
    }
    async markAsRead(userId, notificationId) {
        const existing = await this.prisma.notification.findFirst({
            where: { id: notificationId, recipientUserId: userId },
        });
        if (!existing) {
            throw new common_1.NotFoundException('Không tìm thấy thông báo.');
        }
        const updated = await this.prisma.notification.update({
            where: { id: notificationId },
            data: {
                status: client_1.NotificationStatus.READ,
                readAt: new Date(),
            },
        });
        return updated;
    }
    async markAllAsRead(userId) {
        const result = await this.prisma.notification.updateMany({
            where: {
                recipientUserId: userId,
                status: client_1.NotificationStatus.UNREAD,
            },
            data: {
                status: client_1.NotificationStatus.READ,
                readAt: new Date(),
            },
        });
        return { updatedCount: result.count };
    }
    async markByApplicationId(userId, applicationId) {
        const result = await this.prisma.notification.updateMany({
            where: {
                recipientUserId: userId,
                applicationId,
                status: client_1.NotificationStatus.UNREAD,
            },
            data: {
                status: client_1.NotificationStatus.READ,
                readAt: new Date(),
            },
        });
        return { updatedCount: result.count };
    }
};
exports.NotificationsService = NotificationsService;
exports.NotificationsService = NotificationsService = NotificationsService_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], NotificationsService);
//# sourceMappingURL=notifications.service.js.map