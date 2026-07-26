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
exports.JobsService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../../database/prisma.service");
const client_1 = require("@prisma/client");
let JobsService = class JobsService {
    prisma;
    constructor(prisma) {
        this.prisma = prisma;
    }
    async getRecruiterProfile(userId) {
        const profile = await this.prisma.recruiterProfile.findUnique({
            where: { userId },
        });
        if (!profile) {
            throw new common_1.ForbiddenException('User is not a valid recruiter');
        }
        return profile;
    }
    generateJobCode() {
        const datePart = new Date().toISOString().slice(2, 7).replace('-', '');
        const randomPart = Math.floor(1000 + Math.random() * 9000);
        return `JOB-${datePart}-${randomPart}`;
    }
    async create(userId, dto) {
        const recruiter = await this.getRecruiterProfile(userId);
        const skillsData = dto.skills?.map(s => ({
            skillId: s.skillId,
            requirementType: s.requirementType,
        })) || [];
        const certsData = dto.certificates?.map(c => ({
            certificateName: c.certificateName,
            requirementType: c.requirementType,
        })) || [];
        const questionsData = dto.screeningQuestions?.map(q => ({
            questionText: q.questionText,
            isRequired: q.isRequired ?? true,
        })) || [];
        let jobCode = this.generateJobCode();
        let isUnique = false;
        while (!isUnique) {
            const existing = await this.prisma.jobPosting.findUnique({ where: { jobCode } });
            if (!existing) {
                isUnique = true;
            }
            else {
                jobCode = this.generateJobCode();
            }
        }
        return this.prisma.jobPosting.create({
            data: {
                jobCode,
                title: dto.title,
                recruiterId: recruiter.id,
                departmentId: dto.departmentId,
                description: dto.description,
                requirements: dto.requirements,
                benefits: dto.benefits,
                employmentType: dto.employmentType,
                experienceLevel: dto.experienceLevel,
                minSalary: dto.minSalary,
                maxSalary: dto.maxSalary,
                currency: dto.currency,
                location: dto.location,
                workingModel: dto.workingModel,
                requiresProofOfWork: dto.requiresProofOfWork,
                proofOfWorkType: dto.proofOfWorkType,
                requiredExperienceYears: dto.requiredExperienceYears,
                autoShortlistThreshold: dto.autoShortlistThreshold,
                autoRejectThreshold: dto.autoRejectThreshold,
                rejectOnMissingMandatory: dto.rejectOnMissingMandatory,
                skillWeight: dto.skillWeight,
                experienceWeight: dto.experienceWeight,
                educationWeight: dto.educationWeight,
                otherWeight: dto.otherWeight,
                status: client_1.JobStatus.DRAFT,
                jobSkills: {
                    create: skillsData,
                },
                jobCertificates: {
                    create: certsData,
                },
                screeningQuestions: {
                    create: questionsData,
                }
            },
            include: {
                department: true,
                jobSkills: {
                    include: { skill: true }
                },
                jobCertificates: true,
                screeningQuestions: true
            }
        });
    }
    async findAll(userId, query) {
        const recruiter = await this.getRecruiterProfile(userId);
        let recruiterIds = [recruiter.id];
        if (recruiter.companyId) {
            const peers = await this.prisma.recruiterProfile.findMany({
                where: { companyId: recruiter.companyId },
                select: { id: true },
            });
            recruiterIds = peers.map(p => p.id);
        }
        const { search, departmentId, status, employmentType, page = 1, limit = 10 } = query;
        const skip = (page - 1) * limit;
        const where = {
            recruiterId: { in: recruiterIds },
        };
        if (search) {
            where.OR = [
                { title: { contains: search, mode: 'insensitive' } },
                { jobCode: { contains: search, mode: 'insensitive' } },
            ];
        }
        if (departmentId)
            where.departmentId = departmentId;
        if (status)
            where.status = status;
        if (employmentType)
            where.employmentType = employmentType;
        const [total, items] = await Promise.all([
            this.prisma.jobPosting.count({ where }),
            this.prisma.jobPosting.findMany({
                where,
                skip,
                take: limit,
                orderBy: { createdAt: 'desc' },
                include: {
                    department: true,
                    _count: {
                        select: { applications: true }
                    }
                }
            })
        ]);
        return {
            data: items,
            meta: {
                total,
                page,
                limit,
                totalPages: Math.ceil(total / limit),
            }
        };
    }
    async findOne(userId, id) {
        const recruiter = await this.getRecruiterProfile(userId);
        const job = await this.prisma.jobPosting.findUnique({
            where: { id },
            include: {
                department: true,
                jobSkills: {
                    include: { skill: true }
                },
                jobCertificates: true,
                screeningQuestions: true
            }
        });
        if (!job) {
            throw new common_1.NotFoundException('Job posting not found');
        }
        if (recruiter.companyId) {
            const jobRecruiter = await this.prisma.recruiterProfile.findUnique({
                where: { id: job.recruiterId },
                select: { companyId: true },
            });
            if (jobRecruiter?.companyId !== recruiter.companyId) {
                throw new common_1.ForbiddenException('You do not have access to this job posting');
            }
        }
        else if (job.recruiterId !== recruiter.id) {
            throw new common_1.ForbiddenException('You do not have access to this job posting');
        }
        return job;
    }
    async update(userId, id, dto) {
        const job = await this.findOne(userId, id);
        const updateData = {
            title: dto.title,
            departmentId: dto.departmentId,
            description: dto.description,
            requirements: dto.requirements,
            benefits: dto.benefits,
            employmentType: dto.employmentType,
            experienceLevel: dto.experienceLevel,
            minSalary: dto.minSalary,
            maxSalary: dto.maxSalary,
            currency: dto.currency,
            location: dto.location,
            workingModel: dto.workingModel,
            requiresProofOfWork: dto.requiresProofOfWork,
            proofOfWorkType: dto.proofOfWorkType,
            requiredExperienceYears: dto.requiredExperienceYears,
            autoShortlistThreshold: dto.autoShortlistThreshold,
            autoRejectThreshold: dto.autoRejectThreshold,
            rejectOnMissingMandatory: dto.rejectOnMissingMandatory,
            skillWeight: dto.skillWeight,
            experienceWeight: dto.experienceWeight,
            educationWeight: dto.educationWeight,
            otherWeight: dto.otherWeight,
        };
        if (dto.status) {
            updateData.status = dto.status;
            if (dto.status === client_1.JobStatus.PUBLISHED && job.status === client_1.JobStatus.DRAFT) {
                updateData.publishedAt = new Date();
            }
            else if (dto.status === client_1.JobStatus.CLOSED) {
                updateData.closedAt = new Date();
            }
        }
        if (dto.skills) {
            updateData.jobSkills = {
                deleteMany: {},
                create: dto.skills.map(s => ({
                    skillId: s.skillId,
                    requirementType: s.requirementType,
                })),
            };
        }
        if (dto.certificates) {
            updateData.jobCertificates = {
                deleteMany: {},
                create: dto.certificates.map(c => ({
                    certificateName: c.certificateName,
                    requirementType: c.requirementType,
                })),
            };
        }
        if (dto.screeningQuestions) {
            updateData.screeningQuestions = {
                deleteMany: {},
                create: dto.screeningQuestions.map(q => ({
                    questionText: q.questionText,
                    isRequired: q.isRequired ?? true,
                })),
            };
        }
        return this.prisma.jobPosting.update({
            where: { id },
            data: updateData,
            include: {
                department: true,
                jobSkills: {
                    include: { skill: true }
                },
                jobCertificates: true,
                screeningQuestions: true
            }
        });
    }
    async remove(userId, id) {
        const job = await this.findOne(userId, id);
        if (job.status !== client_1.JobStatus.DRAFT) {
            throw new common_1.BadRequestException('Only DRAFT jobs can be deleted');
        }
        await this.prisma.jobPosting.delete({
            where: { id },
        });
        return { message: 'Job posting deleted successfully' };
    }
};
exports.JobsService = JobsService;
exports.JobsService = JobsService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], JobsService);
//# sourceMappingURL=jobs.service.js.map