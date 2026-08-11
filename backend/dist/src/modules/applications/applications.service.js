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
const application_evaluation_service_1 = require("./application-evaluation.service");
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
let ApplicationsService = ApplicationsService_1 = class ApplicationsService {
    prisma;
    evaluationService;
    logger = new common_1.Logger(ApplicationsService_1.name);
    constructor(prisma, evaluationService) {
        this.prisma = prisma;
        this.evaluationService = evaluationService;
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
        application_evaluation_service_1.ApplicationEvaluationService])
], ApplicationsService);
//# sourceMappingURL=applications.service.js.map