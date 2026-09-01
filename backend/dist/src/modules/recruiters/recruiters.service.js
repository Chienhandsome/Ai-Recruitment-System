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
Object.defineProperty(exports, "__esModule", { value: true });
exports.RecruitersService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../../database/prisma.service");
let RecruitersService = class RecruitersService {
    prisma;
    constructor(prisma) {
        this.prisma = prisma;
    }
    async getProfile(userId) {
        let profile = await this.prisma.recruiterProfile.findUnique({
            where: { userId },
            include: {
                company: true,
                department: true,
                user: {
                    select: {
                        fullName: true,
                        avatarUrl: true,
                        email: true,
                        phone: true,
                        birthDay: true,
                    },
                },
            },
        });
        if (!profile) {
            profile = await this.prisma.recruiterProfile.create({
                data: {
                    userId,
                },
                include: {
                    company: true,
                    department: true,
                    user: {
                        select: {
                            fullName: true,
                            avatarUrl: true,
                            email: true,
                            phone: true,
                            birthDay: true,
                        },
                    },
                },
            });
        }
        return profile;
    }
    async updateProfile(userId, dto) {
        let profile = await this.prisma.recruiterProfile.findUnique({
            where: { userId },
        });
        if (dto.companyId) {
            const company = await this.prisma.company.findUnique({
                where: { id: dto.companyId },
            });
            if (!company) {
                throw new common_1.NotFoundException('Company not found');
            }
        }
        if (dto.departmentId) {
            const department = await this.prisma.department.findUnique({
                where: { id: dto.departmentId },
            });
            if (!department) {
                throw new common_1.NotFoundException('Department not found');
            }
        }
        const hasUserUpdate = dto.fullName !== undefined ||
            dto.phone !== undefined ||
            dto.avatarUrl !== undefined ||
            dto.birthDay !== undefined;
        if (hasUserUpdate) {
            await this.prisma.user.update({
                where: { id: userId },
                data: {
                    ...(dto.fullName !== undefined && { fullName: dto.fullName }),
                    ...(dto.phone !== undefined && { phone: dto.phone }),
                    ...(dto.avatarUrl !== undefined && { avatarUrl: dto.avatarUrl }),
                    ...(dto.birthDay !== undefined && {
                        birthDay: dto.birthDay ? new Date(dto.birthDay) : null,
                    }),
                },
            });
            await this.prisma.candidateProfile.updateMany({
                where: { userId },
                data: {
                    ...(dto.fullName !== undefined && { fullName: dto.fullName }),
                },
            });
        }
        return this.prisma.recruiterProfile.upsert({
            where: { userId },
            create: {
                userId,
                title: dto.title,
                companyId: dto.companyId,
                departmentId: dto.departmentId,
            },
            update: {
                title: dto.title,
                companyId: dto.companyId,
                departmentId: dto.departmentId,
            },
            include: {
                company: true,
                department: true,
                user: {
                    select: {
                        fullName: true,
                        avatarUrl: true,
                        email: true,
                        phone: true,
                        birthDay: true,
                    },
                },
            },
        });
    }
    async getDashboardStats(userId) {
        const profile = await this.prisma.recruiterProfile.findUnique({
            where: { userId },
            select: { id: true, companyId: true },
        });
        if (!profile) {
            throw new common_1.NotFoundException('Recruiter profile not found');
        }
        const recruiterJobFilter = profile.companyId
            ? {
                OR: [
                    { recruiter: { companyId: profile.companyId } },
                    { department: { companyId: profile.companyId } },
                    { recruiterId: profile.id },
                ],
            }
            : { recruiterId: profile.id };
        const totalActiveJobs = await this.prisma.jobPosting.count({
            where: {
                ...recruiterJobFilter,
                status: 'PUBLISHED',
            },
        });
        const totalCandidates = await this.prisma.application.count({
            where: {
                job: recruiterJobFilter,
            },
        });
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const newApplicationsToday = await this.prisma.application.count({
            where: {
                job: recruiterJobFilter,
                appliedAt: {
                    gte: today,
                },
            },
        });
        return {
            totalActiveJobs,
            totalCandidates,
            newApplicationsToday,
        };
    }
    async getDashboardAnalytics(userId, jobId) {
        const profile = await this.prisma.recruiterProfile.findUnique({
            where: { userId },
            select: { id: true, companyId: true },
        });
        if (!profile) {
            throw new common_1.NotFoundException('Recruiter profile not found');
        }
        const recruiterJobFilter = profile.companyId
            ? {
                OR: [
                    { recruiter: { companyId: profile.companyId } },
                    { department: { companyId: profile.companyId } },
                    { recruiterId: profile.id },
                ],
            }
            : { recruiterId: profile.id };
        const jobWhere = {
            ...recruiterJobFilter,
            ...(jobId ? { id: jobId } : {}),
        };
        const appWhere = {
            job: jobWhere,
        };
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const startOfWeek = new Date();
        const day = startOfWeek.getDay();
        const diff = startOfWeek.getDate() - day + (day === 0 ? -6 : 1);
        startOfWeek.setDate(diff);
        startOfWeek.setHours(0, 0, 0, 0);
        const [totalActiveJobs, totalApplications, newApplicationsToday, newApplicationsThisWeek, totalInterviews, totalHired, stageGroups, aiResults, upcomingInterviewsRaw, jobSkillsRaw,] = await Promise.all([
            this.prisma.jobPosting.count({
                where: { ...recruiterJobFilter, status: 'PUBLISHED' },
            }),
            this.prisma.application.count({ where: appWhere }),
            this.prisma.application.count({
                where: { ...appWhere, appliedAt: { gte: today } },
            }),
            this.prisma.application.count({
                where: { ...appWhere, appliedAt: { gte: startOfWeek } },
            }),
            this.prisma.interview.count({
                where: { application: appWhere },
            }),
            this.prisma.application.count({
                where: { ...appWhere, currentStage: 'HIRED' },
            }),
            this.prisma.application.groupBy({
                by: ['currentStage'],
                where: appWhere,
                _count: { id: true },
            }),
            this.prisma.aiMatchingResult.findMany({
                where: { application: appWhere },
                select: { overallScore: true, matchedSkills: true },
            }),
            this.prisma.interview.findMany({
                where: {
                    application: appWhere,
                    status: 'SCHEDULED',
                    scheduledAt: { gte: new Date(Date.now() - 3600000) },
                },
                take: 5,
                orderBy: { scheduledAt: 'asc' },
                include: {
                    application: {
                        select: {
                            id: true,
                            job: { select: { id: true, title: true } },
                            candidate: {
                                select: {
                                    id: true,
                                    user: {
                                        select: {
                                            fullName: true,
                                            avatarUrl: true,
                                            email: true,
                                            phone: true,
                                        },
                                    },
                                },
                            },
                        },
                    },
                },
            }),
            this.prisma.jobSkill.findMany({
                where: { job: jobWhere },
                select: {
                    skill: { select: { id: true, name: true } },
                    requirementType: true,
                },
            }),
        ]);
        let avgAiScore = 0;
        if (aiResults.length > 0) {
            const sum = aiResults.reduce((acc, curr) => acc + Number(curr.overallScore || 0), 0);
            avgAiScore = Math.round((sum / aiResults.length) * 10) / 10;
        }
        const hireConversionRate = totalApplications > 0
            ? Math.round((totalHired / totalApplications) * 100 * 10) / 10
            : 0;
        const stageCounts = {};
        stageGroups.forEach((g) => {
            stageCounts[g.currentStage] = g._count.id;
        });
        const interviewStageCount = (stageCounts['INTERVIEW_SCHEDULED'] || 0) +
            (stageCounts['INTERVIEWED'] || 0);
        const funnelStages = [
            {
                stage: 'RECEIVED',
                label: 'Ứng tuyển',
                count: totalApplications,
                percentage: 100,
            },
            {
                stage: 'SCREENING',
                label: 'Sơ loại',
                count: stageCounts['SCREENING'] || 0,
                percentage: totalApplications > 0
                    ? Math.round(((stageCounts['SCREENING'] || 0) / totalApplications) * 100)
                    : 0,
            },
            {
                stage: 'SHORTLISTED',
                label: 'Đạt chuẩn AI',
                count: stageCounts['SHORTLISTED'] || 0,
                percentage: totalApplications > 0
                    ? Math.round(((stageCounts['SHORTLISTED'] || 0) / totalApplications) * 100)
                    : 0,
            },
            {
                stage: 'INTERVIEW_SCHEDULED',
                label: 'Phỏng vấn',
                count: interviewStageCount,
                percentage: totalApplications > 0
                    ? Math.round((interviewStageCount / totalApplications) * 100)
                    : 0,
            },
            {
                stage: 'OFFERED',
                label: 'Gửi Offer',
                count: stageCounts['OFFERED'] || 0,
                percentage: totalApplications > 0
                    ? Math.round(((stageCounts['OFFERED'] || 0) / totalApplications) * 100)
                    : 0,
            },
            {
                stage: 'HIRED',
                label: 'Đã tuyển',
                count: totalHired,
                percentage: totalApplications > 0
                    ? Math.round((totalHired / totalApplications) * 100)
                    : 0,
            },
            {
                stage: 'REJECTED',
                label: 'Từ chối',
                count: stageCounts['REJECTED'] || 0,
                percentage: totalApplications > 0
                    ? Math.round(((stageCounts['REJECTED'] || 0) / totalApplications) * 100)
                    : 0,
            },
        ];
        let cLess40 = 0;
        let c40to59 = 0;
        let c60to79 = 0;
        let c80to89 = 0;
        let c90to100 = 0;
        aiResults.forEach((r) => {
            const s = Number(r.overallScore || 0);
            if (s < 40)
                cLess40++;
            else if (s < 60)
                c40to59++;
            else if (s < 80)
                c60to79++;
            else if (s < 90)
                c80to89++;
            else
                c90to100++;
        });
        const totalScores = aiResults.length || 1;
        const scoreDistribution = [
            {
                range: '< 40',
                label: 'Kém',
                count: cLess40,
                percentage: Math.round((cLess40 / totalScores) * 100),
                color: '#EF4444',
            },
            {
                range: '40 - 59',
                label: 'Trung bình',
                count: c40to59,
                percentage: Math.round((c40to59 / totalScores) * 100),
                color: '#F59E0B',
            },
            {
                range: '60 - 79',
                label: 'Khá',
                count: c60to79,
                percentage: Math.round((c60to79 / totalScores) * 100),
                color: '#3B82F6',
            },
            {
                range: '80 - 89',
                label: 'Tốt',
                count: c80to89,
                percentage: Math.round((c80to89 / totalScores) * 100),
                color: '#10B981',
            },
            {
                range: '90 - 100',
                label: 'Xuất sắc',
                count: c90to100,
                percentage: Math.round((c90to100 / totalScores) * 100),
                color: '#8B5CF6',
            },
        ];
        const upcomingInterviews = upcomingInterviewsRaw.map((it) => ({
            id: it.id,
            title: it.title,
            type: it.type,
            scheduledAt: it.scheduledAt,
            durationMinutes: it.durationMinutes,
            locationOrLink: it.locationOrLink,
            candidate: {
                id: it.application.candidate.id,
                fullName: it.application.candidate.user?.fullName || 'Ứng viên',
                avatarUrl: it.application.candidate.user?.avatarUrl || null,
                email: it.application.candidate.user?.email || '',
                phone: it.application.candidate.user?.phone || null,
            },
            job: {
                id: it.application.job.id,
                title: it.application.job.title,
            },
        }));
        const skillCounts = {};
        jobSkillsRaw.forEach((js) => {
            const name = js.skill.name;
            if (!skillCounts[name]) {
                skillCounts[name] = { name, requiredCount: 0, matchedCount: 0 };
            }
            skillCounts[name].requiredCount++;
        });
        aiResults.forEach((ar) => {
            const matched = Array.isArray(ar.matchedSkills) ? ar.matchedSkills : [];
            matched.forEach((ms) => {
                const name = typeof ms === 'string' ? ms : ms?.name;
                if (name && skillCounts[name]) {
                    skillCounts[name].matchedCount++;
                }
            });
        });
        const topSkills = Object.values(skillCounts)
            .sort((a, b) => b.requiredCount - a.requiredCount)
            .slice(0, 6)
            .map((sk) => ({
            skill: sk.name,
            demandCount: sk.requiredCount,
            matchRate: totalApplications > 0
                ? Math.min(100, Math.round((sk.matchedCount / totalApplications) * 100))
                : 0,
        }));
        return {
            kpis: {
                totalActiveJobs,
                totalApplications,
                newApplicationsToday,
                newApplicationsThisWeek,
                totalInterviews,
                totalHired,
                avgAiScore,
                hireConversionRate,
            },
            funnel: funnelStages,
            scoreDistribution,
            upcomingInterviews,
            topSkills,
        };
    }
    async getDashboardActionHub(userId, jobId) {
        const profile = await this.prisma.recruiterProfile.findUnique({
            where: { userId },
            select: { id: true, companyId: true },
        });
        if (!profile) {
            throw new common_1.NotFoundException('Recruiter profile not found');
        }
        const recruiterJobFilter = profile.companyId
            ? {
                OR: [
                    { recruiter: { companyId: profile.companyId } },
                    { department: { companyId: profile.companyId } },
                    { recruiterId: profile.id },
                ],
            }
            : { recruiterId: profile.id };
        const jobWhere = {
            ...recruiterJobFilter,
            ...(jobId ? { id: jobId } : {}),
        };
        const now = new Date();
        const startOfToday = new Date(now);
        startOfToday.setHours(0, 0, 0, 0);
        const endOfToday = new Date(now);
        endOfToday.setHours(23, 59, 59, 999);
        const [openJobsCount, totalApplicationsCount, pendingApplicationsCount, rescheduleInterviewsCount, upcomingInterviewsCount, todayInterviewsRaw, upcomingInterviewsRaw, actionJobsRaw,] = await Promise.all([
            this.prisma.jobPosting.count({
                where: { ...recruiterJobFilter, status: 'PUBLISHED' },
            }),
            this.prisma.application.count({
                where: { job: jobWhere },
            }),
            this.prisma.application.count({
                where: {
                    job: jobWhere,
                    currentStage: { in: ['RECEIVED', 'SCREENING', 'SHORTLISTED', 'INTERVIEWED'] },
                    hrDecision: 'PENDING',
                },
            }),
            this.prisma.interview.count({
                where: {
                    application: { job: jobWhere },
                    candidateResponse: 'RESCHEDULE_REQUESTED',
                    status: 'SCHEDULED',
                },
            }),
            this.prisma.interview.count({
                where: {
                    application: { job: jobWhere },
                    status: { in: ['SCHEDULED', 'RESCHEDULED'] },
                    scheduledAt: { gte: startOfToday },
                },
            }),
            this.prisma.interview.findMany({
                where: {
                    application: { job: jobWhere },
                    status: { in: ['SCHEDULED', 'RESCHEDULED'] },
                    scheduledAt: { gte: startOfToday, lte: endOfToday },
                },
                orderBy: { scheduledAt: 'asc' },
                include: {
                    application: {
                        select: {
                            id: true,
                            job: { select: { id: true, title: true, jobCode: true } },
                            candidate: {
                                select: {
                                    id: true,
                                    fullName: true,
                                    email: true,
                                    user: {
                                        select: {
                                            fullName: true,
                                            avatarUrl: true,
                                            email: true,
                                        },
                                    },
                                },
                            },
                        },
                    },
                },
            }),
            this.prisma.interview.findMany({
                where: {
                    application: { job: jobWhere },
                    status: { in: ['SCHEDULED', 'RESCHEDULED'] },
                    scheduledAt: { gt: endOfToday },
                },
                take: 10,
                orderBy: { scheduledAt: 'asc' },
                include: {
                    application: {
                        select: {
                            id: true,
                            job: { select: { id: true, title: true, jobCode: true } },
                            candidate: {
                                select: {
                                    id: true,
                                    fullName: true,
                                    email: true,
                                    user: {
                                        select: {
                                            fullName: true,
                                            avatarUrl: true,
                                            email: true,
                                        },
                                    },
                                },
                            },
                        },
                    },
                },
            }),
            this.prisma.jobPosting.findMany({
                where: {
                    ...recruiterJobFilter,
                    status: 'PUBLISHED',
                    ...(jobId ? { id: jobId } : {}),
                },
                select: {
                    id: true,
                    jobCode: true,
                    title: true,
                    autoShortlistThreshold: true,
                    department: {
                        select: { name: true },
                    },
                    applications: {
                        select: {
                            id: true,
                            currentStage: true,
                            hrDecision: true,
                            appliedAt: true,
                            aiMatchingResults: {
                                select: {
                                    overallScore: true,
                                    matchLevel: true,
                                },
                                orderBy: { version: 'desc' },
                                take: 1,
                            },
                            interviews: {
                                select: {
                                    id: true,
                                    candidateResponse: true,
                                    status: true,
                                },
                            },
                        },
                    },
                },
                orderBy: { createdAt: 'desc' },
            }),
        ]);
        const actionQueue = actionJobsRaw
            .map((job) => {
            const threshold = Number(job.autoShortlistThreshold) || 80;
            let newCount = 0;
            let highMatchCount = 0;
            let pendingReviewCount = 0;
            let rescheduleCount = 0;
            job.applications.forEach((app) => {
                if (app.currentStage === 'RECEIVED') {
                    newCount++;
                }
                const latestAi = app.aiMatchingResults?.[0];
                const score = latestAi ? Number(latestAi.overallScore || 0) : 0;
                const matchLevel = latestAi?.matchLevel;
                if ((score >= threshold || matchLevel === 'HIGH') &&
                    app.currentStage !== 'REJECTED' &&
                    app.currentStage !== 'HIRED' &&
                    app.currentStage !== 'WITHDRAWN') {
                    highMatchCount++;
                }
                if (['RECEIVED', 'SCREENING', 'SHORTLISTED', 'INTERVIEWED'].includes(app.currentStage) &&
                    app.hrDecision === 'PENDING') {
                    pendingReviewCount++;
                }
                app.interviews.forEach((it) => {
                    if (it.candidateResponse === 'RESCHEDULE_REQUESTED' &&
                        it.status === 'SCHEDULED') {
                        rescheduleCount++;
                    }
                });
            });
            return {
                jobId: job.id,
                jobCode: job.jobCode,
                title: job.title,
                departmentName: job.department?.name || 'Tuyển dụng',
                totalApplications: job.applications.length,
                newCount,
                highMatchCount,
                pendingReviewCount,
                rescheduleCount,
                autoShortlistThreshold: threshold,
            };
        })
            .sort((a, b) => {
            const urgencyA = a.newCount * 3 +
                a.highMatchCount * 2 +
                a.rescheduleCount * 4 +
                a.pendingReviewCount;
            const urgencyB = b.newCount * 3 +
                b.highMatchCount * 2 +
                b.rescheduleCount * 4 +
                b.pendingReviewCount;
            return urgencyB - urgencyA;
        });
        const formatInterviewItem = (it) => {
            const candUser = it.application?.candidate?.user;
            const candProfile = it.application?.candidate;
            return {
                id: it.id,
                title: it.title,
                type: it.type,
                scheduledAt: it.scheduledAt,
                durationMinutes: it.durationMinutes,
                locationOrLink: it.locationOrLink,
                candidateResponse: it.candidateResponse,
                candidate: {
                    id: candProfile?.id || '',
                    fullName: candUser?.fullName || candProfile?.fullName || 'Ứng viên',
                    avatarUrl: candUser?.avatarUrl || null,
                    email: candUser?.email || candProfile?.email || '',
                },
                job: {
                    id: it.application?.job?.id,
                    title: it.application?.job?.title,
                    jobCode: it.application?.job?.jobCode,
                },
            };
        };
        return {
            kpis: {
                openJobs: openJobsCount,
                totalApplications: totalApplicationsCount,
                pendingActions: pendingApplicationsCount + rescheduleInterviewsCount,
                upcomingInterviews: upcomingInterviewsCount,
            },
            todayInterviews: todayInterviewsRaw.map(formatInterviewItem),
            upcomingInterviews: upcomingInterviewsRaw.map(formatInterviewItem),
            actionQueue,
        };
    }
};
exports.RecruitersService = RecruitersService;
exports.RecruitersService = RecruitersService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], RecruitersService);
//# sourceMappingURL=recruiters.service.js.map