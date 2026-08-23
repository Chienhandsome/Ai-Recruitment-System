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
const application_stage_machine_1 = require("../applications/application-stage-machine");
let InterviewsService = InterviewsService_1 = class InterviewsService {
    prisma;
    accessService;
    logger = new common_1.Logger(InterviewsService_1.name);
    constructor(prisma, accessService) {
        this.prisma = prisma;
        this.accessService = accessService;
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
        return this.prisma.$transaction(async (prisma) => {
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
                application: { select: { id: true, currentStage: true } },
            },
        });
        if (!existing) {
            throw new common_1.NotFoundException('Không tìm thấy lịch phỏng vấn để cập nhật.');
        }
        const scheduledDate = dto.scheduledAt ? new Date(dto.scheduledAt) : undefined;
        if (scheduledDate && isNaN(scheduledDate.getTime())) {
            throw new common_1.BadRequestException('Thời gian phỏng vấn không hợp lệ.');
        }
        const updated = await this.prisma.interview.update({
            where: { id },
            data: {
                title: dto.title,
                type: dto.type,
                status: dto.status,
                scheduledAt: scheduledDate,
                durationMinutes: dto.durationMinutes,
                locationOrLink: dto.locationOrLink,
                interviewerNotes: dto.interviewerNotes,
            },
        });
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
                    },
                },
            },
        });
        if (!existing) {
            throw new common_1.NotFoundException('Không tìm thấy lịch phỏng vấn.');
        }
        const targetStage = dto.nextStage ?? client_1.ApplicationStage.INTERVIEWED;
        return this.prisma.$transaction(async (prisma) => {
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
    }
};
exports.InterviewsService = InterviewsService;
exports.InterviewsService = InterviewsService = InterviewsService_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService,
        application_access_service_1.ApplicationAccessService])
], InterviewsService);
//# sourceMappingURL=interviews.service.js.map