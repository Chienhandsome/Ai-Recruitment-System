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
var InterviewsService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.InterviewsService = void 0;
const common_1 = require("@nestjs/common");
const client_1 = require("@prisma/client");
const prisma_service_1 = require("../../database/prisma.service");
const application_access_service_1 = require("../applications/application-access.service");
const notifications_service_1 = require("../notifications/notifications.service");
const application_stage_machine_1 = require("../applications/application-stage-machine");
let InterviewsService = InterviewsService_1 = class InterviewsService {
    prisma;
    accessService;
    notificationsService;
    logger = new common_1.Logger(InterviewsService_1.name);
    constructor(prisma, accessService, notificationsService) {
        this.prisma = prisma;
        this.accessService = accessService;
        this.notificationsService = notificationsService;
    }
    async create(userId, dto) {
        const scope = await this.accessService.recruiterApplicationWhere(userId);
        const application = await this.prisma.application.findFirst({
            where: { AND: [scope, { id: dto.applicationId }] },
            select: {
                id: true,
                currentStage: true,
                job: { select: { id: true, title: true, jobCode: true } },
                candidate: {
                    select: {
                        id: true,
                        userId: true,
                        user: { select: { id: true, fullName: true, email: true, phone: true } },
                    },
                },
            },
        });
        if (!application) {
            throw new common_1.NotFoundException('Đơn ứng tuyển không tồn tại hoặc bạn không có quyền truy cập.');
        }
        const scheduledDate = new Date(dto.scheduledAt);
        if (isNaN(scheduledDate.getTime())) {
            throw new common_1.BadRequestException('Thời gian phỏng vấn không hợp lệ.');
        }
        const result = await this.prisma.$transaction(async (prisma) => {
            const interview = await prisma.interview.create({
                data: {
                    applicationId: dto.applicationId,
                    title: dto.title,
                    type: dto.type,
                    scheduledAt: scheduledDate,
                    durationMinutes: dto.durationMinutes ?? 60,
                    locationOrLink: dto.locationOrLink,
                    interviewerNotes: dto.interviewerNotes,
                    status: client_1.InterviewStatus.SCHEDULED,
                },
            });
            if (application.currentStage !== client_1.ApplicationStage.INTERVIEW_SCHEDULED &&
                (0, application_stage_machine_1.canTransitionApplication)(application.currentStage, client_1.ApplicationStage.INTERVIEW_SCHEDULED)) {
                await prisma.application.update({
                    where: { id: application.id },
                    data: {
                        currentStage: client_1.ApplicationStage.INTERVIEW_SCHEDULED,
                        hrDecision: (0, application_stage_machine_1.hrDecisionForStage)(client_1.ApplicationStage.INTERVIEW_SCHEDULED),
                    },
                });
                await prisma.applicationStatusHistory.create({
                    data: {
                        applicationId: application.id,
                        previousStage: application.currentStage,
                        newStage: client_1.ApplicationStage.INTERVIEW_SCHEDULED,
                        changedByUserId: userId,
                        note: `Lên lịch phỏng vấn: ${dto.title} (${scheduledDate.toLocaleString('vi-VN')})`,
                    },
                });
            }
            this.logger.log(`Interview ${interview.id} scheduled for application ${application.id} by user ${userId}`);
            return {
                ...interview,
                score: interview.score !== null ? Number(interview.score) : null,
                application: {
                    id: application.id,
                    job: application.job,
                    candidate: {
                        id: application.candidate.id,
                        ...application.candidate.user,
                    },
                },
            };
        });
        const recipientUserId = application.candidate?.userId || application.candidate?.user?.id;
        if (this.notificationsService && recipientUserId) {
            await this.notificationsService.createNotification({
                recipientUserId,
                applicationId: application.id,
                type: client_1.NotificationType.INTERVIEW_SCHEDULED,
                title: `Thư mời phỏng vấn: ${application.job?.title || 'Công việc'}`,
                message: `Bạn có buổi phỏng vấn "${dto.title}" vào lúc ${new Date(dto.scheduledAt).toLocaleString('vi-VN')}.`,
                payload: {
                    applicationId: application.id,
                    interviewId: result.id,
                    scheduledAt: dto.scheduledAt,
                    locationOrLink: dto.locationOrLink,
                    jobTitle: application.job?.title,
                },
            });
        }
        return result;
    }
    async findAllForRecruiter(userId, query) {
        const scope = await this.accessService.recruiterApplicationWhere(userId);
        const where = {
            application: {
                AND: [
                    scope,
                    query.jobId ? { jobId: query.jobId } : {},
                    query.applicationId ? { id: query.applicationId } : {},
                ],
            },
            ...(query.status ? { status: query.status } : {}),
            ...(query.type ? { type: query.type } : {}),
        };
        const skip = (query.page - 1) * query.limit;
        const [total, items] = await Promise.all([
            this.prisma.interview.count({ where }),
            this.prisma.interview.findMany({
                where,
                skip,
                take: query.limit,
                orderBy: { scheduledAt: 'desc' },
                include: {
                    application: {
                        select: {
                            id: true,
                            currentStage: true,
                            job: { select: { id: true, title: true, jobCode: true } },
                            candidate: {
                                select: {
                                    id: true,
                                    desiredTitle: true,
                                    user: {
                                        select: {
                                            fullName: true,
                                            email: true,
                                            phone: true,
                                            avatarUrl: true,
                                        },
                                    },
                                },
                            },
                        },
                    },
                },
            }),
        ]);
        return {
            data: items.map((item) => ({
                ...item,
                score: item.score !== null ? Number(item.score) : null,
            })),
            meta: {
                total,
                page: query.page,
                limit: query.limit,
                totalPages: Math.ceil(total / query.limit),
            },
        };
    }
    async findMineForCandidate(userId) {
        const candidateId = await this.accessService.candidateProfileId(userId);
        const interviews = await this.prisma.interview.findMany({
            where: {
                application: {
                    candidateId,
                },
            },
            orderBy: { scheduledAt: 'desc' },
            include: {
                application: {
                    select: {
                        id: true,
                        currentStage: true,
                        job: {
                            select: {
                                id: true,
                                title: true,
                                location: true,
                                recruiter: {
                                    select: {
                                        title: true,
                                        user: {
                                            select: {
                                                fullName: true,
                                                email: true,
                                                phone: true,
                                            },
                                        },
                                        company: { select: { id: true, name: true, logoUrl: true } },
                                    },
                                },
                            },
                        },
                    },
                },
            },
        });
        return interviews.map((item) => ({
            id: item.id,
            title: item.title,
            type: item.type,
            status: item.status,
            candidateResponse: item.candidateResponse,
            candidateNotes: item.candidateNotes,
            proposedSlots: item.proposedSlots,
            scheduledAt: item.scheduledAt,
            durationMinutes: item.durationMinutes,
            locationOrLink: item.locationOrLink,
            interviewerNotes: item.interviewerNotes,
            application: {
                id: item.application.id,
                currentStage: item.application.currentStage,
                job: {
                    id: item.application.job.id,
                    title: item.application.job.title,
                    location: item.application.job.location,
                    company: item.application.job.recruiter?.company,
                    recruiter: item.application.job.recruiter
                        ? {
                            title: item.application.job.recruiter.title,
                            fullName: item.application.job.recruiter.user?.fullName,
                            email: item.application.job.recruiter.user?.email,
                            phone: item.application.job.recruiter.user?.phone,
                        }
                        : null,
                },
            },
        }));
    }
    async findOne(userId, id) {
        const interview = await this.prisma.interview.findUnique({
            where: { id },
            include: {
                application: {
                    select: {
                        id: true,
                        currentStage: true,
                        candidateId: true,
                        job: {
                            select: {
                                id: true,
                                title: true,
                                recruiter: { select: { id: true, userId: true, companyId: true } },
                            },
                        },
                        candidate: {
                            select: {
                                id: true,
                                userId: true,
                                user: { select: { fullName: true, email: true, phone: true } },
                            },
                        },
                    },
                },
            },
        });
        if (!interview) {
            throw new common_1.NotFoundException('Không tìm thấy lịch phỏng vấn.');
        }
        const isCandidateOwner = interview.application.candidate.userId === userId;
        if (!isCandidateOwner) {
            const scope = await this.accessService
                .recruiterApplicationWhere(userId)
                .catch(() => null);
            if (!scope) {
                throw new common_1.NotFoundException('Không tìm thấy lịch phỏng vấn.');
            }
            const app = await this.prisma.application.findFirst({
                where: { AND: [scope, { id: interview.applicationId }] },
                select: { id: true },
            });
            if (!app) {
                throw new common_1.NotFoundException('Không tìm thấy lịch phỏng vấn.');
            }
        }
        return {
            ...interview,
            score: interview.score !== null ? Number(interview.score) : null,
        };
    }
    async update(userId, id, dto) {
        const scope = await this.accessService.recruiterApplicationWhere(userId);
        const existing = await this.prisma.interview.findFirst({
            where: {
                id,
                application: scope,
            },
            include: {
                application: {
                    select: {
                        id: true,
                        currentStage: true,
                        job: { select: { title: true } },
                        candidate: {
                            select: {
                                userId: true,
                                user: { select: { fullName: true } },
                            },
                        },
                    },
                },
            },
        });
        if (!existing) {
            throw new common_1.NotFoundException('Không tìm thấy lịch phỏng vấn để cập nhật.');
        }
        const scheduledDate = dto.scheduledAt ? new Date(dto.scheduledAt) : undefined;
        if (scheduledDate && isNaN(scheduledDate.getTime())) {
            throw new common_1.BadRequestException('Thời gian phỏng vấn không hợp lệ.');
        }
        let targetCandidateResponse = dto.candidateResponse;
        if (targetCandidateResponse === undefined && scheduledDate) {
            if (existing.candidateResponse === client_1.CandidateResponseStatus.RESCHEDULE_REQUESTED) {
                targetCandidateResponse = client_1.CandidateResponseStatus.PENDING;
            }
        }
        let targetStatus = dto.status;
        if (!targetStatus && scheduledDate && existing.status === client_1.InterviewStatus.RESCHEDULED) {
            targetStatus = client_1.InterviewStatus.SCHEDULED;
        }
        const updated = await this.prisma.$transaction(async (prisma) => {
            const result = await prisma.interview.update({
                where: { id },
                data: {
                    title: dto.title,
                    type: dto.type,
                    status: targetStatus,
                    candidateResponse: targetCandidateResponse,
                    scheduledAt: scheduledDate,
                    durationMinutes: dto.durationMinutes,
                    locationOrLink: dto.locationOrLink,
                    interviewerNotes: dto.interviewerNotes,
                },
            });
            const dateStr = scheduledDate
                ? scheduledDate.toLocaleString('vi-VN')
                : existing.scheduledAt.toLocaleString('vi-VN');
            let historyNote = `Nhà tuyển dụng đã cập nhật lịch phỏng vấn: "${result.title}" (${dateStr}).`;
            if (targetCandidateResponse === client_1.CandidateResponseStatus.ACCEPTED) {
                historyNote = `Nhà tuyển dụng đã chấp nhận khung giờ mới và chốt lịch phỏng vấn: "${result.title}" (${dateStr}).`;
            }
            await prisma.applicationStatusHistory.create({
                data: {
                    applicationId: existing.application.id,
                    previousStage: existing.application.currentStage,
                    newStage: existing.application.currentStage,
                    changedByUserId: userId,
                    note: historyNote,
                },
            });
            return result;
        });
        if (this.notificationsService && existing.application.candidate?.userId) {
            const jobTitle = existing.application.job?.title || 'Công việc';
            const dateStr = (scheduledDate || existing.scheduledAt).toLocaleString('vi-VN');
            let notifTitle = `Cập nhật lịch phỏng vấn: ${jobTitle}`;
            let notifMsg = `Lịch phỏng vấn "${updated.title}" cho vị trí ${jobTitle} đã được cập nhật lại vào lúc ${dateStr}. Vui lòng kiểm tra và xác nhận trên hệ thống.`;
            if (targetCandidateResponse === client_1.CandidateResponseStatus.ACCEPTED) {
                notifTitle = `Xác nhận đổi lịch phỏng vấn: ${jobTitle}`;
                notifMsg = `Nhà tuyển dụng đã đồng ý dời lịch phỏng vấn "${updated.title}" sang lúc ${dateStr}. Buổi phỏng vấn đã được chốt thành công.`;
            }
            await this.notificationsService.createNotification({
                recipientUserId: existing.application.candidate.userId,
                applicationId: existing.application.id,
                type: client_1.NotificationType.APPLICATION_STATUS_CHANGED,
                title: notifTitle,
                message: notifMsg,
                payload: {
                    applicationId: existing.application.id,
                    interviewId: updated.id,
                    scheduledAt: updated.scheduledAt,
                    candidateResponse: updated.candidateResponse,
                },
            });
        }
        return {
            ...updated,
            score: updated.score !== null ? Number(updated.score) : null,
        };
    }
    async submitFeedback(userId, id, dto) {
        const scope = await this.accessService.recruiterApplicationWhere(userId);
        const existing = await this.prisma.interview.findFirst({
            where: {
                id,
                application: scope,
            },
            include: {
                application: {
                    select: {
                        id: true,
                        currentStage: true,
                        job: { select: { title: true } },
                        candidate: { select: { userId: true } },
                    },
                },
            },
        });
        if (!existing) {
            throw new common_1.NotFoundException('Không tìm thấy lịch phỏng vấn.');
        }
        const targetStage = dto.nextStage ?? client_1.ApplicationStage.INTERVIEWED;
        const result = await this.prisma.$transaction(async (prisma) => {
            const updatedInterview = await prisma.interview.update({
                where: { id },
                data: {
                    score: dto.score,
                    interviewerNotes: dto.interviewerNotes,
                    status: client_1.InterviewStatus.COMPLETED,
                },
            });
            const currentStage = existing.application.currentStage;
            if (currentStage !== targetStage &&
                (0, application_stage_machine_1.canTransitionApplication)(currentStage, targetStage)) {
                await prisma.application.update({
                    where: { id: existing.application.id },
                    data: {
                        currentStage: targetStage,
                        hrDecision: (0, application_stage_machine_1.hrDecisionForStage)(targetStage),
                    },
                });
                await prisma.applicationStatusHistory.create({
                    data: {
                        applicationId: existing.application.id,
                        previousStage: currentStage,
                        newStage: targetStage,
                        changedByUserId: userId,
                        note: `Đánh giá phỏng vấn: ${dto.score}/100 điểm. Nhận xét: ${dto.interviewerNotes.slice(0, 300)}`,
                    },
                });
            }
            else if (currentStage !== targetStage &&
                !(0, application_stage_machine_1.canTransitionApplication)(currentStage, targetStage)) {
                throw new common_1.UnprocessableEntityException(`Không thể chuyển trạng thái từ ${currentStage} sang ${targetStage}.`);
            }
            this.logger.log(`Feedback submitted for interview ${id}. Score: ${dto.score}, target stage: ${targetStage}`);
            return {
                ...updatedInterview,
                score: Number(updatedInterview.score),
                applicationStage: targetStage,
            };
        });
        if (this.notificationsService && existing.application.candidate?.userId) {
            await this.notificationsService.createNotification({
                recipientUserId: existing.application.candidate.userId,
                applicationId: existing.application.id,
                type: client_1.NotificationType.APPLICATION_STATUS_CHANGED,
                title: `Kết quả phỏng vấn: ${existing.application.job?.title || 'Công việc'}`,
                message: `Buổi phỏng vấn "${existing.title}" đã được ghi nhận kết quả đánh giá (${dto.score}/100 điểm).`,
                payload: {
                    applicationId: existing.application.id,
                    interviewId: existing.id,
                    score: dto.score,
                    nextStage: targetStage,
                },
            });
        }
        return result;
    }
    async respondToInterview(userId, id, dto) {
        const interview = await this.prisma.interview.findUnique({
            where: { id },
            include: {
                application: {
                    select: {
                        id: true,
                        currentStage: true,
                        candidate: {
                            select: {
                                id: true,
                                userId: true,
                                user: { select: { fullName: true, email: true, phone: true } },
                            },
                        },
                        job: {
                            select: {
                                id: true,
                                title: true,
                                recruiter: {
                                    select: {
                                        id: true,
                                        userId: true,
                                    },
                                },
                            },
                        },
                    },
                },
            },
        });
        if (!interview) {
            throw new common_1.NotFoundException('Không tìm thấy lịch phỏng vấn.');
        }
        if (interview.application.candidate.userId !== userId) {
            throw new common_1.NotFoundException('Bạn không có quyền phản hồi lịch phỏng vấn này.');
        }
        if (interview.status === client_1.InterviewStatus.COMPLETED ||
            interview.status === client_1.InterviewStatus.CANCELLED) {
            throw new common_1.BadRequestException('Buổi phỏng vấn này đã hoàn thành hoặc đã bị hủy.');
        }
        let newStatus = interview.status;
        if (dto.response === client_1.CandidateResponseStatus.DECLINED) {
            newStatus = client_1.InterviewStatus.CANCELLED;
        }
        else if (dto.response === client_1.CandidateResponseStatus.RESCHEDULE_REQUESTED) {
            newStatus = client_1.InterviewStatus.RESCHEDULED;
        }
        const updated = await this.prisma.$transaction(async (prisma) => {
            const result = await prisma.interview.update({
                where: { id },
                data: {
                    candidateResponse: dto.response,
                    candidateNotes: dto.candidateNotes,
                    proposedSlots: dto.proposedSlots ? dto.proposedSlots : client_1.Prisma.JsonNull,
                    status: newStatus,
                },
            });
            const candidateName = interview.application.candidate.user?.fullName || 'Ứng viên';
            let statusText = 'đã xác nhận tham gia';
            if (dto.response === client_1.CandidateResponseStatus.RESCHEDULE_REQUESTED) {
                statusText = 'đã đề xuất dời lịch';
            }
            else if (dto.response === client_1.CandidateResponseStatus.DECLINED) {
                statusText = 'đã từ chối tham gia';
            }
            await prisma.applicationStatusHistory.create({
                data: {
                    applicationId: interview.application.id,
                    previousStage: interview.application.currentStage,
                    newStage: interview.application.currentStage,
                    changedByUserId: userId,
                    note: `Ứng viên ${candidateName} ${statusText} phỏng vấn: "${interview.title}".${dto.candidateNotes ? ` Ghi chú: ${dto.candidateNotes}` : ''}`,
                },
            });
            return result;
        });
        if (this.notificationsService && interview.application.job.recruiter?.userId) {
            const candidateName = interview.application.candidate.user?.fullName || 'Ứng viên';
            let statusText = 'đã xác nhận tham gia';
            if (dto.response === client_1.CandidateResponseStatus.RESCHEDULE_REQUESTED) {
                statusText = 'đã đề xuất dời lịch';
            }
            else if (dto.response === client_1.CandidateResponseStatus.DECLINED) {
                statusText = 'đã từ chối tham gia';
            }
            await this.notificationsService.createNotification({
                recipientUserId: interview.application.job.recruiter.userId,
                applicationId: interview.application.id,
                type: client_1.NotificationType.APPLICATION_STATUS_CHANGED,
                title: `Phản hồi phỏng vấn: ${candidateName}`,
                message: `${candidateName} ${statusText} buổi phỏng vấn "${interview.title}" cho vị trí ${interview.application.job.title}.${dto.candidateNotes ? ` Ghi chú: ${dto.candidateNotes}` : ''}`,
                payload: {
                    applicationId: interview.application.id,
                    interviewId: interview.id,
                    candidateResponse: dto.response,
                    candidateNotes: dto.candidateNotes,
                    proposedSlots: dto.proposedSlots,
                },
            });
        }
        return {
            ...updated,
            score: updated.score !== null ? Number(updated.score) : null,
        };
    }
};
exports.InterviewsService = InterviewsService;
exports.InterviewsService = InterviewsService = InterviewsService_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService,
        application_access_service_1.ApplicationAccessService,
        notifications_service_1.NotificationsService])
], InterviewsService);
//# sourceMappingURL=interviews.service.js.map