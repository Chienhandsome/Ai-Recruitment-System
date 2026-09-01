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
var ApplicationsService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.ApplicationsService = void 0;
const common_1 = require("@nestjs/common");
const client_1 = require("@prisma/client");
const prisma_service_1 = require("../../database/prisma.service");
const notifications_service_1 = require("../notifications/notifications.service");
const application_evaluation_service_1 = require("./application-evaluation.service");
const application_access_service_1 = require("./application-access.service");
const application_stage_machine_1 = require("./application-stage-machine");
const query_recruiter_applications_dto_1 = require("./dto/query-recruiter-applications.dto");
const application_evaluation_snapshot_1 = require("./application-evaluation.snapshot");
const candidateProfileInclude = {
    workExperiences: true,
    educations: true,
    projects: true,
    certificates: true,
    candidateSkills: { include: { skill: true } },
};
const jobEvaluationInclude = {
    jobSkills: { include: { skill: true } },
    jobCertificates: true,
};
const resumeSnapshotSelect = {
    id: true,
    candidateId: true,
    source: true,
    originalFileName: true,
    mimeType: true,
    fileSizeBytes: true,
    parsingStatus: true,
    createdAt: true,
};
const latestAiResultSelect = {
    id: true,
    version: true,
    overallScore: true,
    matchLevel: true,
    skillScore: true,
    experienceScore: true,
    educationScore: true,
    projectScore: true,
    matchedSkills: true,
    missingSkills: true,
    missingRequiredSkills: true,
    strengths: true,
    gaps: true,
    weaknesses: true,
    evidence: true,
    confidenceScore: true,
    reasoningSummary: true,
    inputSnapshot: true,
    modelVersion: true,
    candidateExperienceLevel: true,
    requiredExperienceLevel: true,
    totalExperienceYears: true,
    levelFitScore: true,
    levelGap: true,
    levelEligible: true,
    levelConfidence: true,
    levelEvidence: true,
    createdAt: true,
    updatedAt: true,
};
const recruiterApplicationListSelect = {
    id: true,
    currentStage: true,
    hrDecision: true,
    processingStatus: true,
    appliedAt: true,
    updatedAt: true,
    job: {
        select: { id: true, jobCode: true, title: true },
    },
    candidate: {
        select: {
            id: true,
            desiredTitle: true,
            user: {
                select: {
                    fullName: true,
                    email: true,
                    avatarUrl: true,
                },
            },
        },
    },
    aiMatchingResults: {
        orderBy: { version: 'desc' },
        take: 1,
        select: {
            overallScore: true,
            matchLevel: true,
            confidenceScore: true,
            version: true,
        },
    },
};
let ApplicationsService = ApplicationsService_1 = class ApplicationsService {
    prisma;
    evaluationService;
    accessService;
    notificationsService;
    logger = new common_1.Logger(ApplicationsService_1.name);
    constructor(prisma, evaluationService, accessService, notificationsService) {
        this.prisma = prisma;
        this.evaluationService = evaluationService;
        this.accessService = accessService;
        this.notificationsService = notificationsService;
    }
    async applyForJob(userId, createApplicationDto, now = new Date()) {
        const candidateProfile = await this.prisma.candidateProfile.findUnique({
            where: { userId },
            include: candidateProfileInclude,
        });
        if (!candidateProfile) {
            throw new common_1.NotFoundException('Candidate profile not found.');
        }
        const resumeId = createApplicationDto.resumeId ?? candidateProfile.primaryResumeId;
        if (!resumeId) {
            throw new common_1.BadRequestException('A parsed resume is required to apply for this job.');
        }
        const resume = await this.prisma.resume.findFirst({
            where: { id: resumeId, candidateId: candidateProfile.id },
            select: resumeSnapshotSelect,
        });
        if (!resume) {
            throw new common_1.BadRequestException('The selected resume is unavailable for this candidate.');
        }
        if (resume.parsingStatus !== client_1.ResumeParsingStatus.PARSED) {
            throw new common_1.BadRequestException('The selected resume must finish processing before you can apply.');
        }
        const existingApplication = await this.prisma.application.findUnique({
            where: {
                jobId_candidateId: {
                    jobId: createApplicationDto.jobId,
                    candidateId: candidateProfile.id,
                },
            },
            select: { id: true },
        });
        if (existingApplication) {
            throw new common_1.ConflictException('You have already applied for this job.');
        }
        const job = await this.prisma.jobPosting.findFirst({
            where: {
                id: createApplicationDto.jobId,
                status: client_1.JobStatus.PUBLISHED,
                OR: [{ expiryDate: null }, { expiryDate: { gt: now } }],
            },
            include: jobEvaluationInclude,
        });
        if (!job) {
            throw new common_1.NotFoundException('Job posting is not published or is no longer accepting applications.');
        }
        const profileSnapshot = this.buildProfileSnapshot(candidateProfile, resume, job, now);
        let application;
        try {
            application = await this.prisma.application.create({
                data: {
                    jobId: job.id,
                    candidateId: candidateProfile.id,
                    resumeId: resume.id,
                    source: 'DIRECT_APPLY',
                    currentStage: client_1.ApplicationStage.RECEIVED,
                    processingStatus: client_1.ApplicationProcessingStatus.QUEUED,
                    profileSnapshot: (0, application_evaluation_snapshot_1.toPrismaJson)(profileSnapshot),
                },
                select: { id: true },
            });
        }
        catch (error) {
            if (error instanceof client_1.Prisma.PrismaClientKnownRequestError &&
                error.code === 'P2002') {
                throw new common_1.ConflictException('You have already applied for this job.');
            }
            throw error;
        }
        let published = false;
        try {
            published = await this.evaluationService.dispatchNewApplication(application.id, now);
        }
        catch (error) {
            this.logger.error(`Could not dispatch evaluation for application ${application.id}: ${this.errorMessage(error)}`);
            await this.evaluationService.markForRetry(application.id, 'Evaluation dispatch failed and will be retried.', 0, now);
        }
        return {
            message: published
                ? 'Ứng tuyển thành công. Đang phân tích hồ sơ...'
                : 'Ứng tuyển thành công. Đánh giá AI đã được lên lịch thử lại.',
            applicationId: application.id,
            evaluationStatus: published ? 'QUEUED' : 'RETRY_SCHEDULED',
        };
    }
    async findAllForRecruiter(userId, query) {
        if (query.minScore !== undefined &&
            query.maxScore !== undefined &&
            query.minScore > query.maxScore) {
            throw new common_1.BadRequestException('minScore must be less than or equal to maxScore.');
        }
        const scope = await this.accessService.recruiterApplicationWhere(userId);
        const where = {
            AND: [
                scope,
                query.jobId ? { jobId: query.jobId } : {},
                query.stage ? { currentStage: query.stage } : {},
                query.hrDecision ? { hrDecision: query.hrDecision } : {},
                query.processingStatus
                    ? { processingStatus: query.processingStatus }
                    : {},
                query.search?.trim()
                    ? {
                        candidate: {
                            user: {
                                OR: [
                                    {
                                        fullName: {
                                            contains: query.search.trim(),
                                            mode: 'insensitive',
                                        },
                                    },
                                    {
                                        email: {
                                            contains: query.search.trim(),
                                            mode: 'insensitive',
                                        },
                                    },
                                ],
                            },
                        },
                    }
                    : {},
            ],
        };
        const rows = await this.prisma.application.findMany({
            where,
            select: recruiterApplicationListSelect,
        });
        const filtered = rows.filter((row) => {
            const score = this.latestScore(row);
            if (query.minScore !== undefined && (score ?? -1) < query.minScore) {
                return false;
            }
            if (query.maxScore !== undefined && (score ?? 101) > query.maxScore) {
                return false;
            }
            return true;
        });
        filtered.sort((left, right) => this.compareApplicationRows(left, right, query.sortBy, query.sortOrder));
        const total = filtered.length;
        const start = (query.page - 1) * query.limit;
        const pageRows = filtered.slice(start, start + query.limit);
        return {
            data: pageRows.map((row) => this.toRecruiterListItem(row)),
            meta: {
                total,
                page: query.page,
                limit: query.limit,
                totalPages: Math.ceil(total / query.limit),
            },
        };
    }
    async findOneForRecruiter(userId, applicationId) {
        const scope = await this.accessService.recruiterApplicationWhere(userId);
        const application = await this.prisma.application.findFirst({
            where: { AND: [scope, { id: applicationId }] },
            select: {
                id: true,
                currentStage: true,
                hrDecision: true,
                hrNotes: true,
                processingStatus: true,
                evaluationError: true,
                profileSnapshot: true,
                appliedAt: true,
                updatedAt: true,
                job: {
                    select: {
                        id: true,
                        jobCode: true,
                        title: true,
                        location: true,
                        levelRequirementMode: true,
                        skillWeight: true,
                        experienceWeight: true,
                        educationWeight: true,
                        otherWeight: true,
                    },
                },
                candidate: {
                    select: {
                        id: true,
                        fullName: true,
                        email: true,
                        phone: true,
                        desiredTitle: true,
                        professionalSummary: true,
                        expectedMinSalary: true,
                        expectedMaxSalary: true,
                        preferredModel: true,
                        user: {
                            select: {
                                fullName: true,
                                email: true,
                                phone: true,
                                avatarUrl: true,
                            },
                        },
                        workExperiences: {
                            orderBy: { startDate: 'desc' },
                        },
                        educations: {
                            orderBy: { startDate: 'desc' },
                        },
                        projects: true,
                        certificates: true,
                        candidateSkills: {
                            include: {
                                skill: true,
                            },
                        },
                    },
                },
                aiMatchingResults: {
                    orderBy: { version: 'desc' },
                    take: 1,
                    select: latestAiResultSelect,
                },
                interviews: {
                    orderBy: { scheduledAt: 'desc' },
                    select: {
                        id: true,
                        title: true,
                        type: true,
                        status: true,
                        scheduledAt: true,
                        durationMinutes: true,
                        locationOrLink: true,
                        interviewerNotes: true,
                        score: true,
                        createdAt: true,
                        updatedAt: true,
                    },
                },
                statusHistories: {
                    orderBy: { createdAt: 'desc' },
                    take: 20,
                    select: {
                        id: true,
                        previousStage: true,
                        newStage: true,
                        changedByUserId: true,
                        note: true,
                        createdAt: true,
                    },
                },
            },
        });
        if (!application) {
            throw new common_1.NotFoundException('Application not found.');
        }
        const latestAiResult = application.aiMatchingResults[0] ?? null;
        return {
            id: application.id,
            job: this.serializeJob(application.job),
            candidate: {
                id: application.candidate.id,
                fullName: application.candidate.fullName || application.candidate.user?.fullName,
                email: application.candidate.email || application.candidate.user?.email,
                phone: application.candidate.phone || application.candidate.user?.phone,
                avatarUrl: application.candidate.user?.avatarUrl,
                desiredTitle: application.candidate.desiredTitle,
                professionalSummary: application.candidate.professionalSummary,
                expectedMinSalary: application.candidate.expectedMinSalary,
                expectedMaxSalary: application.candidate.expectedMaxSalary,
                preferredModel: application.candidate.preferredModel,
                workExperiences: application.candidate.workExperiences || [],
                educations: application.candidate.educations || [],
                projects: application.candidate.projects || [],
                certificates: application.candidate.certificates || [],
                candidateSkills: application.candidate.candidateSkills || [],
            },
            currentStage: application.currentStage,
            hrDecision: application.hrDecision,
            hrNotes: application.hrNotes,
            processingStatus: application.processingStatus,
            evaluationError: application.evaluationError,
            profileSnapshot: application.profileSnapshot,
            latestAiResult: latestAiResult
                ? this.serializeAiResult(latestAiResult)
                : null,
            interviews: application.interviews.map((i) => ({
                ...i,
                score: i.score !== null ? Number(i.score) : null,
            })),
            statusHistories: application.statusHistories,
            appliedAt: application.appliedAt,
            updatedAt: application.updatedAt,
            allowedTransitions: (0, application_stage_machine_1.allowedApplicationTransitions)(application.currentStage),
        };
    }
    async updateStage(userId, applicationId, dto) {
        const scope = await this.accessService.recruiterApplicationWhere(userId);
        const application = await this.prisma.application.findFirst({
            where: { AND: [scope, { id: applicationId }] },
            select: {
                id: true,
                currentStage: true,
                hrNotes: true,
                candidate: { select: { userId: true } },
                job: { select: { title: true } },
            },
        });
        if (!application) {
            throw new common_1.NotFoundException('Application not found.');
        }
        if (application.currentStage !== dto.expectedStage) {
            throw new common_1.ConflictException(`Application stage changed from ${dto.expectedStage} to ${application.currentStage}.`);
        }
        if (dto.targetStage === dto.expectedStage) {
            throw new common_1.ConflictException('Application is already in the target stage.');
        }
        if (!(0, application_stage_machine_1.canTransitionApplication)(dto.expectedStage, dto.targetStage)) {
            throw new common_1.UnprocessableEntityException(`Transition from ${dto.expectedStage} to ${dto.targetStage} is not allowed.`);
        }
        const note = dto.note?.trim() || null;
        if ((0, application_stage_machine_1.applicationTransitionRequiresNote)(dto.expectedStage, dto.targetStage) &&
            !note) {
            throw new common_1.BadRequestException('A note is required for this transition.');
        }
        const hrNotes = dto.hrNotes === undefined
            ? application.hrNotes
            : dto.hrNotes.trim() || null;
        const hrDecision = (0, application_stage_machine_1.hrDecisionForStage)(dto.targetStage);
        const result = await this.prisma.$transaction(async (prisma) => {
            const updated = await prisma.application.updateMany({
                where: {
                    id: applicationId,
                    currentStage: dto.expectedStage,
                },
                data: {
                    currentStage: dto.targetStage,
                    hrDecision,
                    hrNotes,
                },
            });
            if (updated.count !== 1) {
                throw new common_1.ConflictException('Application was updated by another recruiter. Refresh and try again.');
            }
            const historyEntry = await prisma.applicationStatusHistory.create({
                data: {
                    applicationId,
                    previousStage: dto.expectedStage,
                    newStage: dto.targetStage,
                    changedByUserId: userId,
                    note,
                },
                select: {
                    id: true,
                    note: true,
                    changedByUserId: true,
                    createdAt: true,
                },
            });
            const current = await prisma.application.findUniqueOrThrow({
                where: { id: applicationId },
                select: {
                    id: true,
                    currentStage: true,
                    hrDecision: true,
                    hrNotes: true,
                    updatedAt: true,
                },
            });
            return {
                ...current,
                previousStage: dto.expectedStage,
                allowedTransitions: (0, application_stage_machine_1.allowedApplicationTransitions)(current.currentStage),
                historyEntry,
            };
        });
        if (this.notificationsService && application.candidate?.userId) {
            const stageLabels = {
                RECEIVED: 'Đã nhận hồ sơ',
                SCREENING: 'Sơ loại hồ sơ',
                SHORTLISTED: 'Đạt yêu cầu hồ sơ',
                INTERVIEW_SCHEDULED: 'Lên lịch phỏng vấn',
                INTERVIEWED: 'Đã phỏng vấn',
                OFFERED: 'Đề nghị nhận việc (Offer)',
                HIRED: 'Đã tuyển dụng',
                REJECTED: 'Chưa phù hợp',
                WITHDRAWN: 'Đã rút hồ sơ',
            };
            const targetLabel = stageLabels[dto.targetStage] || dto.targetStage;
            await this.notificationsService.createNotification({
                recipientUserId: application.candidate.userId,
                applicationId: application.id,
                type: client_1.NotificationType.APPLICATION_STATUS_CHANGED,
                title: `Cập nhật trạng thái hồ sơ: ${application.job?.title || 'Công việc'}`,
                message: `Hồ sơ ứng tuyển của bạn đã được chuyển sang giai đoạn "${targetLabel}".`,
                payload: {
                    applicationId: application.id,
                    previousStage: dto.expectedStage,
                    newStage: dto.targetStage,
                    jobTitle: application.job?.title,
                    note: dto.note || undefined,
                },
            });
        }
        return result;
    }
    async findMine(userId, query) {
        const candidateId = await this.accessService.candidateProfileId(userId);
        const where = {
            candidateId,
            ...(query.stage ? { currentStage: query.stage } : {}),
        };
        const skip = (query.page - 1) * query.limit;
        const [total, applications] = await Promise.all([
            this.prisma.application.count({ where }),
            this.prisma.application.findMany({
                where,
                skip,
                take: query.limit,
                orderBy: { appliedAt: 'desc' },
                select: {
                    id: true,
                    currentStage: true,
                    processingStatus: true,
                    appliedAt: true,
                    updatedAt: true,
                    notifications: {
                        where: { status: client_1.NotificationStatus.UNREAD },
                        select: { id: true },
                    },
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
                                    company: { select: { id: true, name: true } },
                                },
                            },
                        },
                    },
                    interviews: {
                        orderBy: { scheduledAt: 'desc' },
                        select: {
                            id: true,
                            title: true,
                            type: true,
                            status: true,
                            candidateResponse: true,
                            candidateNotes: true,
                            proposedSlots: true,
                            scheduledAt: true,
                            durationMinutes: true,
                            locationOrLink: true,
                            interviewerNotes: true,
                            createdAt: true,
                        },
                    },
                },
            }),
        ]);
        return {
            data: applications.map((application) => ({
                id: application.id,
                job: {
                    id: application.job.id,
                    title: application.job.title,
                    location: application.job.location,
                    company: application.job.recruiter.company,
                    recruiter: application.job.recruiter
                        ? {
                            title: application.job.recruiter.title,
                            fullName: application.job.recruiter.user?.fullName,
                            email: application.job.recruiter.user?.email,
                            phone: application.job.recruiter.user?.phone,
                        }
                        : null,
                },
                currentStage: application.currentStage,
                processingStatus: application.processingStatus,
                hasUnreadUpdate: (application.notifications?.length ?? 0) > 0,
                interviews: application.interviews,
                appliedAt: application.appliedAt,
                updatedAt: application.updatedAt,
            })),
            meta: {
                total,
                page: query.page,
                limit: query.limit,
                totalPages: Math.ceil(total / query.limit),
            },
        };
    }
    latestScore(row) {
        const score = row.aiMatchingResults[0]?.overallScore;
        return score === undefined ? null : Number(score);
    }
    compareApplicationRows(left, right, sortBy, sortOrder) {
        let comparison;
        if (sortBy === query_recruiter_applications_dto_1.ApplicationSortBy.APPLIED_AT) {
            comparison = left.appliedAt.getTime() - right.appliedAt.getTime();
        }
        else if (sortBy === query_recruiter_applications_dto_1.ApplicationSortBy.UPDATED_AT) {
            comparison = left.updatedAt.getTime() - right.updatedAt.getTime();
        }
        else {
            const leftScore = this.latestScore(left);
            const rightScore = this.latestScore(right);
            if (leftScore === null && rightScore === null)
                comparison = 0;
            else if (leftScore === null)
                return 1;
            else if (rightScore === null)
                return -1;
            else
                comparison = leftScore - rightScore;
        }
        return sortOrder === query_recruiter_applications_dto_1.SortOrder.ASC ? comparison : -comparison;
    }
    toRecruiterListItem(row) {
        const latest = row.aiMatchingResults[0];
        return {
            id: row.id,
            job: row.job,
            candidate: {
                id: row.candidate.id,
                desiredTitle: row.candidate.desiredTitle,
                ...row.candidate.user,
            },
            currentStage: row.currentStage,
            hrDecision: row.hrDecision,
            processingStatus: row.processingStatus,
            latestAiResult: latest
                ? {
                    overallScore: Number(latest.overallScore),
                    matchLevel: latest.matchLevel,
                    confidenceScore: latest.confidenceScore === null
                        ? null
                        : Number(latest.confidenceScore),
                    version: latest.version,
                }
                : null,
            appliedAt: row.appliedAt,
            updatedAt: row.updatedAt,
            allowedTransitions: (0, application_stage_machine_1.allowedApplicationTransitions)(row.currentStage),
        };
    }
    serializeJob(job) {
        return Object.fromEntries(Object.entries(job).map(([key, value]) => [
            key,
            value instanceof client_1.Prisma.Decimal ? Number(value) : value,
        ]));
    }
    serializeAiResult(result) {
        return Object.fromEntries(Object.entries(result).map(([key, value]) => [
            key,
            value instanceof client_1.Prisma.Decimal ? Number(value) : value,
        ]));
    }
    buildProfileSnapshot(profile, resume, job, capturedAt) {
        const weights = {
            skills: Number(job.skillWeight) || 40,
            experience: Number(job.experienceWeight) || 30,
            education: Number(job.educationWeight) || 15,
            other: Number(job.otherWeight) || 15,
        };
        return {
            schemaVersion: application_evaluation_snapshot_1.APPLICATION_SNAPSHOT_VERSION,
            capturedAt: capturedAt.toISOString(),
            candidateIdentity: {
                id: profile.id,
                userId: profile.userId,
                fullName: profile.fullName,
                email: profile.email,
                phone: profile.phone,
            },
            resume: {
                id: resume.id,
                source: resume.source,
                originalFileName: resume.originalFileName,
                mimeType: resume.mimeType,
                fileSizeBytes: resume.fileSizeBytes,
                parsingStatus: resume.parsingStatus,
                createdAt: resume.createdAt.toISOString(),
            },
            evaluationInput: {
                candidate_profile: {
                    profile: {
                        id: profile.id,
                        candidate_user_id: profile.userId,
                        desired_title: profile.desiredTitle,
                        professional_summary: profile.professionalSummary,
                        github_url: profile.githubUrl,
                        linkedin_url: profile.linkedinUrl,
                        portfolio_url: profile.portfolioUrl,
                        address: profile.address,
                        created_at: profile.createdAt.toISOString(),
                        updated_at: profile.updatedAt.toISOString(),
                    },
                    work_experiences: profile.workExperiences.map((experience) => ({
                        id: experience.id,
                        candidate_profile_id: profile.id,
                        company_name: experience.companyName,
                        position_title: experience.positionTitle,
                        start_date: experience.startDate.toISOString(),
                        end_date: experience.endDate?.toISOString() ?? null,
                        is_current: experience.isCurrent,
                        description: experience.description,
                        achievements: experience.achievements,
                    })),
                    educations: profile.educations.map((education) => ({
                        id: education.id,
                        candidate_profile_id: profile.id,
                        school_name: education.schoolName,
                        major: education.major,
                        degree: education.degree,
                        start_date: education.startDate?.toISOString() ?? null,
                        end_date: education.endDate?.toISOString() ?? null,
                        description: education.description,
                    })),
                    projects: profile.projects.map((project) => ({
                        id: project.id,
                        candidate_profile_id: profile.id,
                        project_name: project.projectName,
                        project_role: project.projectRole,
                        description: project.description,
                        technologies: this.toStringArray(project.technologies),
                        project_url: project.projectUrl,
                        start_date: project.startDate?.toISOString() ?? null,
                        end_date: project.endDate?.toISOString() ?? null,
                    })),
                    certificates: profile.certificates.map((certificate) => ({
                        certificate_name: certificate.certificateName,
                        issuing_organization: certificate.issuingOrganization,
                        issue_date: certificate.issueDate?.toISOString() ?? null,
                        expiry_date: certificate.expiryDate?.toISOString() ?? null,
                        credential_url: certificate.credentialUrl,
                    })),
                    skills: profile.candidateSkills.map((candidateSkill) => ({
                        candidate_profile_id: profile.id,
                        skill_id: candidateSkill.skillId,
                        skill_name: candidateSkill.skill.name,
                        normalized_name: candidateSkill.skill.normalizedName,
                        proficiency_level: candidateSkill.proficiencyLevel,
                        is_primary: candidateSkill.isPrimary,
                        source: candidateSkill.source,
                    })),
                },
                job: {
                    id: job.id,
                    title: job.title,
                    employment_type: job.employmentType,
                    work_mode: job.workingModel,
                    salary_min: job.minSalary === null ? null : Number(job.minSalary),
                    salary_max: job.maxSalary === null ? null : Number(job.maxSalary),
                    location: job.location,
                    required_experience_years: job.requiredExperienceYears ?? 0,
                    experience_level: job.experienceLevel,
                    level_requirement_mode: job.levelRequirementMode,
                    evaluation_date: capturedAt.toISOString(),
                    description: job.description,
                    requirements: job.requirements,
                    benefits: job.benefits,
                    status: job.status,
                    published_at: job.publishedAt?.toISOString() ?? null,
                    created_at: job.createdAt.toISOString(),
                    updated_at: job.updatedAt.toISOString(),
                    closed_at: job.closedAt?.toISOString() ?? null,
                    required_skills: job.jobSkills.map((jobSkill) => ({
                        job_id: job.id,
                        skill_id: jobSkill.skillId,
                        skill_name: jobSkill.skill.name,
                        normalized_name: jobSkill.skill.normalizedName,
                        is_mandatory: jobSkill.requirementType === 'MANDATORY',
                        minimum_level: jobSkill.minimumProficiency ?? 'BEGINNER',
                    })),
                    required_certificates: job.jobCertificates.map((certificate) => ({
                        certificate_name: certificate.certificateName,
                        is_mandatory: certificate.requirementType === 'MANDATORY',
                    })),
                    ai_weights_config: weights,
                },
                weights,
            },
        };
    }
    toStringArray(value) {
        if (Array.isArray(value)) {
            return value.filter((item) => typeof item === 'string');
        }
        if (typeof value === 'string') {
            return value
                .split(',')
                .map((item) => item.trim())
                .filter(Boolean);
        }
        return [];
    }
    errorMessage(error) {
        return error instanceof Error ? error.message : 'Unknown error';
    }
};
exports.ApplicationsService = ApplicationsService;
exports.ApplicationsService = ApplicationsService = ApplicationsService_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService,
        application_evaluation_service_1.ApplicationEvaluationService,
        application_access_service_1.ApplicationAccessService,
        notifications_service_1.NotificationsService])
], ApplicationsService);
//# sourceMappingURL=applications.service.js.map