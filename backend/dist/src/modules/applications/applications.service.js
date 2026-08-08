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
const prisma_service_1 = require("../../database/prisma.service");
const rabbitmq_service_1 = require("../../infrastructure/rabbitmq/rabbitmq.service");
const rabbitmq_constants_1 = require("../../infrastructure/rabbitmq/rabbitmq.constants");
const client_1 = require("@prisma/client");
let ApplicationsService = ApplicationsService_1 = class ApplicationsService {
    prisma;
    rabbitMQService;
    logger = new common_1.Logger(ApplicationsService_1.name);
    constructor(prisma, rabbitMQService) {
        this.prisma = prisma;
        this.rabbitMQService = rabbitMQService;
    }
    async applyForJob(userId, createApplicationDto) {
        const candidateProfile = await this.prisma.candidateProfile.findUnique({
            where: { userId },
            include: {
                primaryResume: true,
                workExperiences: true,
                educations: true,
                projects: true,
                certificates: true,
                candidateSkills: {
                    include: { skill: true },
                },
            },
        });
        if (!candidateProfile) {
            throw new common_1.NotFoundException('Candidate profile not found.');
        }
        const resumeId = createApplicationDto.resumeId || candidateProfile.primaryResumeId;
        if (!resumeId) {
            throw new common_1.BadRequestException('A resume is required to apply for this job.');
        }
        const existingApplication = await this.prisma.application.findUnique({
            where: {
                jobId_candidateId: {
                    jobId: createApplicationDto.jobId,
                    candidateId: candidateProfile.id,
                },
            },
        });
        if (existingApplication) {
            throw new common_1.BadRequestException('You have already applied for this job.');
        }
        const job = await this.prisma.jobPosting.findUnique({
            where: { id: createApplicationDto.jobId },
            include: {
                jobSkills: { include: { skill: true } },
                jobCertificates: true,
            },
        });
        if (!job) {
            throw new common_1.NotFoundException('Job posting not found.');
        }
        const application = await this.prisma.application.create({
            data: {
                jobId: job.id,
                candidateId: candidateProfile.id,
                resumeId,
                source: 'DIRECT_APPLY',
                currentStage: client_1.ApplicationStage.RECEIVED,
                processingStatus: client_1.ApplicationProcessingStatus.MATCHING,
                profileSnapshot: {
                    fullName: candidateProfile.fullName,
                    email: candidateProfile.email,
                },
            },
        });
        const evaluationRequest = this.buildEvaluationRequest(application.id, candidateProfile, job);
        try {
            this.logger.log(`Publishing AI Evaluation job for application ${application.id} to RabbitMQ...`);
            const payload = {
                applicationId: application.id,
                ...evaluationRequest,
            };
            const published = await this.rabbitMQService.publish(rabbitmq_constants_1.RABBITMQ_ROUTING_KEYS.EVALUATION_REQUESTED, payload);
            if (!published) {
                throw new Error('Failed to publish message to RabbitMQ');
            }
            this.logger.log(`Successfully queued AI Evaluation for application ${application.id}`);
            return {
                message: 'Ứng tuyển thành công. Đang phân tích hồ sơ...',
                applicationId: application.id,
            };
        }
        catch (error) {
            this.logger.error(`Failed to publish AI Matching for application ${application.id}`, error);
            await this.prisma.application.update({
                where: { id: application.id },
                data: { processingStatus: client_1.ApplicationProcessingStatus.FAILED },
            });
            return {
                message: 'Ứng tuyển thành công, nhưng hệ thống AI đang bận. Sẽ chấm điểm sau.',
                applicationId: application.id,
            };
        }
    }
    buildEvaluationRequest(applicationId, profile, job) {
        return {
            application_id: applicationId,
            candidate_profile: {
                profile: {
                    id: profile.id,
                    candidate_user_id: profile.userId,
                    desired_title: profile.desiredTitle,
                    professional_summary: profile.professionalSummary,
                },
                work_experiences: profile.workExperiences.map((ex) => ({
                    company_name: ex.companyName,
                    position_title: ex.positionTitle,
                    start_date: ex.startDate ? ex.startDate.toISOString() : undefined,
                    end_date: ex.endDate ? ex.endDate.toISOString() : undefined,
                    is_current: ex.isCurrent,
                    description: ex.description,
                })),
                educations: profile.educations.map((ed) => ({
                    school_name: ed.schoolName,
                    major: ed.major,
                    degree: ed.degree,
                })),
                projects: profile.projects.map((pr) => ({
                    project_name: pr.projectName,
                    project_role: pr.projectRole,
                    description: pr.description,
                })),
                certificates: profile.certificates?.map((cert) => ({
                    certificate_name: cert.certificateName,
                    issuing_organization: cert.issuingOrganization,
                })) || [],
                skills: profile.candidateSkills.map((cs) => ({
                    skill_id: cs.skillId,
                    skill_name: cs.skill?.name,
                    proficiency_level: cs.proficiencyLevel,
                })),
            },
            job: {
                id: job.id,
                title: job.title,
                description: job.description,
                requirements: job.requirements,
                required_experience_years: job.requiredExperienceYears || 0,
                required_skills: job.jobSkills.map((js) => ({
                    skill_id: js.skillId,
                    skill_name: js.skill?.name,
                    is_mandatory: js.requirementType === 'MANDATORY',
                    minimum_level: js.minimumProficiency || 'BEGINNER',
                })),
                required_certificates: job.jobCertificates?.map((jc) => ({
                    certificate_name: jc.certificateName,
                    is_mandatory: jc.requirementType === 'MANDATORY',
                })) || [],
            },
            weights: {
                skills: Number(job.skillWeight) || 40.0,
                experience: Number(job.experienceWeight) || 30.0,
                education: Number(job.educationWeight) || 15.0,
                other: Number(job.otherWeight) || 15.0,
            }
        };
    }
};
exports.ApplicationsService = ApplicationsService;
exports.ApplicationsService = ApplicationsService = ApplicationsService_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService,
        rabbitmq_service_1.RabbitMQService])
], ApplicationsService);
//# sourceMappingURL=applications.service.js.map