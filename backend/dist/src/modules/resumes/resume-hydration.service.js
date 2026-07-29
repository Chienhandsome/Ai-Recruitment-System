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
var ResumeHydrationService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.ResumeHydrationService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../../database/prisma.service");
let ResumeHydrationService = ResumeHydrationService_1 = class ResumeHydrationService {
    prisma;
    logger = new common_1.Logger(ResumeHydrationService_1.name);
    constructor(prisma) {
        this.prisma = prisma;
    }
    async hydrateProfile(resumeId, candidateProfileId, parsedData) {
        this.logger.log(`Hydrating profile ${candidateProfileId} from resume ${resumeId}`);
        const resolvedSkills = [];
        for (const skill of parsedData.skills) {
            const dbSkill = await this.findOrCreateSkill(this.prisma, skill.name);
            if (!dbSkill)
                continue;
            resolvedSkills.push({
                skillId: dbSkill.id,
                proficiencyLevel: skill.proficiency_level,
                yearsExperience: skill.years_experience ?? null,
            });
        }
        await this.prisma.$transaction(async (tx) => {
            await tx.resume.update({
                where: { id: resumeId },
                data: { parsingStatus: 'PARSED' },
            });
            await tx.resumeParsedData.upsert({
                where: { resumeId },
                create: {
                    resumeId,
                    summary: parsedData.summary ?? null,
                    totalYearsExperience: parsedData.total_years_experience ?? null,
                    educationData: parsedData.educations,
                    experienceData: parsedData.work_experiences,
                    certificateData: parsedData.certificates,
                    projectData: parsedData.projects,
                    rawParsedJson: parsedData,
                },
                update: {
                    summary: parsedData.summary ?? null,
                    totalYearsExperience: parsedData.total_years_experience ?? null,
                    educationData: parsedData.educations,
                    experienceData: parsedData.work_experiences,
                    certificateData: parsedData.certificates,
                    projectData: parsedData.projects,
                    rawParsedJson: parsedData,
                    parsedAt: new Date(),
                },
            });
            await tx.candidateSkill.deleteMany({
                where: {
                    candidateId: candidateProfileId,
                    source: 'EXTRACTED',
                    resumeId,
                },
            });
            for (const skill of resolvedSkills) {
                await tx.candidateSkill.upsert({
                    where: {
                        candidateId_skillId: {
                            candidateId: candidateProfileId,
                            skillId: skill.skillId,
                        },
                    },
                    create: {
                        candidateId: candidateProfileId,
                        skillId: skill.skillId,
                        resumeId,
                        proficiencyLevel: skill.proficiencyLevel,
                        yearsExperience: skill.yearsExperience,
                        isPrimary: false,
                        source: 'EXTRACTED',
                    },
                    update: {
                        proficiencyLevel: skill.proficiencyLevel,
                        yearsExperience: skill.yearsExperience,
                        resumeId,
                        source: 'EXTRACTED',
                    },
                });
            }
            await tx.workExperience.deleteMany({
                where: { candidateProfileId },
            });
            if (parsedData.work_experiences.length > 0) {
                await tx.workExperience.createMany({
                    data: parsedData.work_experiences.map((exp) => ({
                        candidateProfileId,
                        companyName: exp.company_name,
                        positionTitle: exp.position_title,
                        startDate: new Date(exp.start_date),
                        endDate: exp.end_date ? new Date(exp.end_date) : null,
                        isCurrent: exp.is_current,
                        description: exp.description ?? null,
                        achievements: exp.achievements ?? null,
                    })),
                });
            }
            await tx.education.deleteMany({
                where: { candidateProfileId },
            });
            if (parsedData.educations.length > 0) {
                await tx.education.createMany({
                    data: parsedData.educations.map((edu) => ({
                        candidateProfileId,
                        schoolName: edu.school_name,
                        major: edu.major ?? null,
                        degree: edu.degree ?? null,
                        startDate: edu.start_date ? new Date(edu.start_date) : null,
                        endDate: edu.end_date ? new Date(edu.end_date) : null,
                        description: edu.description ?? null,
                    })),
                });
            }
            await tx.project.deleteMany({
                where: { candidateProfileId },
            });
            if (parsedData.projects.length > 0) {
                await tx.project.createMany({
                    data: parsedData.projects.map((proj) => ({
                        candidateProfileId,
                        projectName: proj.project_name,
                        projectRole: proj.project_role ?? null,
                        description: proj.description ?? null,
                        technologies: (proj.technologies ?? undefined),
                        projectUrl: proj.project_url ?? null,
                        startDate: proj.start_date ? new Date(proj.start_date) : null,
                        endDate: proj.end_date ? new Date(proj.end_date) : null,
                    })),
                });
            }
            await tx.certificate.deleteMany({
                where: { candidateProfileId },
            });
            if (parsedData.certificates.length > 0) {
                await tx.certificate.createMany({
                    data: parsedData.certificates.map((cert) => ({
                        candidateProfileId,
                        certificateName: cert.certificate_name,
                        issuingOrganization: cert.issuing_organization || 'Unknown',
                        issueDate: cert.issue_date ? new Date(cert.issue_date) : null,
                        expiryDate: cert.expiry_date ? new Date(cert.expiry_date) : null,
                        credentialUrl: cert.credential_url ?? null,
                    })),
                });
            }
            await tx.candidateProfile.update({
                where: { id: candidateProfileId },
                data: {
                    status: 'READY',
                    professionalSummary: parsedData.summary ?? undefined,
                    desiredTitle: parsedData.desired_title ?? undefined,
                },
            });
        }, {
            maxWait: 10000,
            timeout: 30000,
        });
        this.logger.log(`Profile ${candidateProfileId} hydrated: ` +
            `${parsedData.skills.length} skills, ` +
            `${parsedData.work_experiences.length} experiences, ` +
            `${parsedData.educations.length} educations, ` +
            `${parsedData.projects.length} projects, ` +
            `${parsedData.certificates.length} certificates`);
    }
    async handleFailure(resumeId, candidateProfileId, errorMessage) {
        this.logger.warn(`Resume ${resumeId} analysis failed: ${errorMessage}`);
        await this.prisma.resume.update({
            where: { id: resumeId },
            data: {
                parsingStatus: 'FAILED',
                parsingErrorMessage: errorMessage,
            },
        });
        await this.prisma.candidateProfile.update({
            where: { id: candidateProfileId },
            data: { status: 'FAILED' },
        });
    }
    async findOrCreateSkill(db, skillName) {
        const trimmed = skillName.trim();
        if (!trimmed)
            return null;
        const normalized = trimmed.toLowerCase().replace(/[^a-z0-9]+/g, '-');
        const existing = await db.skill.findFirst({
            where: {
                OR: [
                    { normalizedName: normalized },
                    { name: { equals: trimmed, mode: 'insensitive' } },
                ],
            },
        });
        if (existing)
            return existing;
        const defaultCategory = await this.getOrCreateDefaultCategory(db);
        try {
            return await db.skill.create({
                data: {
                    name: trimmed,
                    normalizedName: normalized,
                    categoryId: defaultCategory.id,
                    type: 'HARD',
                    status: 'ACTIVE',
                },
            });
        }
        catch {
            return db.skill.findFirst({
                where: { normalizedName: normalized },
            });
        }
    }
    async getOrCreateDefaultCategory(db) {
        const existing = await db.skillCategory.findFirst({
            where: { name: 'Công nghệ thông tin (IT)' },
        });
        if (existing)
            return existing;
        const any = await db.skillCategory.findFirst();
        if (any)
            return any;
        return db.skillCategory.create({
            data: { name: 'Công nghệ thông tin (IT)' },
        });
    }
};
exports.ResumeHydrationService = ResumeHydrationService;
exports.ResumeHydrationService = ResumeHydrationService = ResumeHydrationService_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], ResumeHydrationService);
//# sourceMappingURL=resume-hydration.service.js.map