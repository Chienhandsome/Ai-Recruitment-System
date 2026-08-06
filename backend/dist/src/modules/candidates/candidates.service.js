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
var CandidatesService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.CandidatesService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../../database/prisma.service");
const client_1 = require("@prisma/client");
let CandidatesService = CandidatesService_1 = class CandidatesService {
    prisma;
    logger = new common_1.Logger(CandidatesService_1.name);
    constructor(prisma) {
        this.prisma = prisma;
    }
    async getResolvedProfile(candidateProfileId) {
        const profile = await this.prisma.candidateProfile.findUnique({
            where: { id: candidateProfileId },
            include: { user: true },
        });
        if (!profile) {
            throw new common_1.NotFoundException(`Candidate profile ${candidateProfileId} not found.`);
        }
        return this.resolveProfile(profile);
    }
    async getResolvedProfileByUserId(userId) {
        const profile = await this.prisma.candidateProfile.findUnique({
            where: { userId },
            include: { user: true },
        });
        if (!profile) {
            throw new common_1.NotFoundException(`Candidate profile for user ${userId} not found.`);
        }
        return this.resolveProfile(profile);
    }
    async updateProfileStatus(candidateProfileId, status) {
        await this.prisma.candidateProfile.update({
            where: { id: candidateProfileId },
            data: { status },
        });
        this.logger.log(`CandidateProfile ${candidateProfileId} status updated to ${status}`);
    }
    async setPrimaryResume(candidateProfileId, resumeId) {
        const resume = await this.prisma.resume.findFirst({
            where: { id: resumeId, candidateId: candidateProfileId },
        });
        if (!resume) {
            throw new common_1.NotFoundException(`Resume ${resumeId} not found or does not belong to candidate ${candidateProfileId}.`);
        }
        await this.prisma.candidateProfile.update({
            where: { id: candidateProfileId },
            data: { primaryResumeId: resumeId },
        });
        this.logger.log(`CandidateProfile ${candidateProfileId} primary resume set to ${resumeId}`);
    }
    async updateProfile(userId, dto) {
        const profile = await this.prisma.candidateProfile.findUnique({
            where: { userId },
        });
        if (!profile) {
            throw new common_1.NotFoundException(`Candidate profile for user ${userId} not found.`);
        }
        if (dto.fullName || dto.phone !== undefined) {
            const userData = {};
            if (dto.fullName)
                userData.fullName = dto.fullName;
            if (dto.phone !== undefined)
                userData.phone = dto.phone || null;
            await this.prisma.user.update({
                where: { id: userId },
                data: userData,
            });
        }
        const profileData = {};
        if (dto.fullName)
            profileData.fullName = dto.fullName;
        if (dto.phone !== undefined)
            profileData.phone = dto.phone || null;
        if (dto.address !== undefined)
            profileData.address = dto.address || null;
        if (dto.desiredTitle !== undefined)
            profileData.desiredTitle = dto.desiredTitle || null;
        if (dto.professionalSummary !== undefined)
            profileData.professionalSummary = dto.professionalSummary || null;
        if (dto.linkedinUrl !== undefined)
            profileData.linkedinUrl = dto.linkedinUrl || null;
        if (dto.githubUrl !== undefined)
            profileData.githubUrl = dto.githubUrl || null;
        if (dto.portfolioUrl !== undefined)
            profileData.portfolioUrl = dto.portfolioUrl || null;
        const updated = await this.prisma.$transaction(async (tx) => {
            const p = await tx.candidateProfile.update({
                where: { id: profile.id },
                data: profileData,
            });
            if (Array.isArray(dto.workExperiences)) {
                const requestedExtractedIds = dto.workExperiences
                    .filter((item) => item.source === 'EXTRACTED' && item.id)
                    .map((item) => item.id);
                const preservedExtractedIds = new Set((await tx.workExperience.findMany({
                    where: {
                        candidateProfileId: profile.id,
                        source: 'EXTRACTED',
                        id: { in: requestedExtractedIds },
                    },
                    select: { id: true },
                })).map((item) => item.id));
                await tx.workExperience.deleteMany({
                    where: {
                        candidateProfileId: profile.id,
                        OR: [
                            { source: 'MANUAL' },
                            {
                                source: 'EXTRACTED',
                                ...(preservedExtractedIds.size > 0
                                    ? { id: { notIn: [...preservedExtractedIds] } }
                                    : {}),
                            },
                        ],
                    },
                });
                const manualExperiences = dto.workExperiences.filter((item) => !item.id || !preservedExtractedIds.has(item.id));
                if (manualExperiences.length > 0) {
                    await tx.workExperience.createMany({
                        data: manualExperiences.map((exp) => ({
                            candidateProfileId: profile.id,
                            source: 'MANUAL',
                            resumeId: null,
                            companyName: exp.companyName,
                            positionTitle: exp.positionTitle,
                            startDate: exp.startDate ? new Date(exp.startDate) : new Date(),
                            endDate: exp.endDate ? new Date(exp.endDate) : null,
                            isCurrent: exp.isCurrent ?? false,
                            description: exp.description || null,
                            achievements: exp.achievements || null,
                        })),
                    });
                }
            }
            if (Array.isArray(dto.educations)) {
                const requestedExtractedIds = dto.educations
                    .filter((item) => item.source === 'EXTRACTED' && item.id)
                    .map((item) => item.id);
                const preservedExtractedIds = new Set((await tx.education.findMany({
                    where: {
                        candidateProfileId: profile.id,
                        source: 'EXTRACTED',
                        id: { in: requestedExtractedIds },
                    },
                    select: { id: true },
                })).map((item) => item.id));
                await tx.education.deleteMany({
                    where: {
                        candidateProfileId: profile.id,
                        OR: [
                            { source: 'MANUAL' },
                            {
                                source: 'EXTRACTED',
                                ...(preservedExtractedIds.size > 0
                                    ? { id: { notIn: [...preservedExtractedIds] } }
                                    : {}),
                            },
                        ],
                    },
                });
                const manualEducations = dto.educations.filter((item) => !item.id || !preservedExtractedIds.has(item.id));
                if (manualEducations.length > 0) {
                    await tx.education.createMany({
                        data: manualEducations.map((edu) => ({
                            candidateProfileId: profile.id,
                            source: 'MANUAL',
                            resumeId: null,
                            schoolName: edu.schoolName,
                            major: edu.major || null,
                            degree: edu.degree || null,
                            startDate: edu.startDate ? new Date(edu.startDate) : null,
                            endDate: edu.endDate ? new Date(edu.endDate) : null,
                        })),
                    });
                }
            }
            if (Array.isArray(dto.projects)) {
                const requestedExtractedIds = dto.projects
                    .filter((item) => item.source === 'EXTRACTED' && item.id)
                    .map((item) => item.id);
                const preservedExtractedIds = new Set((await tx.project.findMany({
                    where: {
                        candidateProfileId: profile.id,
                        source: 'EXTRACTED',
                        id: { in: requestedExtractedIds },
                    },
                    select: { id: true },
                })).map((item) => item.id));
                await tx.project.deleteMany({
                    where: {
                        candidateProfileId: profile.id,
                        OR: [
                            { source: 'MANUAL' },
                            {
                                source: 'EXTRACTED',
                                ...(preservedExtractedIds.size > 0
                                    ? { id: { notIn: [...preservedExtractedIds] } }
                                    : {}),
                            },
                        ],
                    },
                });
                const manualProjects = dto.projects.filter((item) => !item.id || !preservedExtractedIds.has(item.id));
                if (manualProjects.length > 0) {
                    await tx.project.createMany({
                        data: manualProjects.map((proj) => {
                            let techs = null;
                            if (Array.isArray(proj.technologies)) {
                                techs = proj.technologies;
                            }
                            else if (typeof proj.technologies === 'string') {
                                techs = proj.technologies
                                    .split(',')
                                    .map((t) => t.trim())
                                    .filter(Boolean);
                            }
                            return {
                                candidateProfileId: profile.id,
                                source: 'MANUAL',
                                resumeId: null,
                                projectName: proj.projectName,
                                projectRole: proj.projectRole || null,
                                description: proj.description || null,
                                technologies: techs ?? undefined,
                                projectUrl: proj.projectUrl || null,
                                startDate: proj.startDate ? new Date(proj.startDate) : null,
                                endDate: proj.endDate ? new Date(proj.endDate) : null,
                            };
                        }),
                    });
                }
            }
            if (Array.isArray(dto.certificates)) {
                const requestedExtractedIds = dto.certificates
                    .filter((item) => item.source === 'EXTRACTED' && item.id)
                    .map((item) => item.id);
                const preservedExtractedIds = new Set((await tx.certificate.findMany({
                    where: {
                        candidateProfileId: profile.id,
                        source: 'EXTRACTED',
                        id: { in: requestedExtractedIds },
                    },
                    select: { id: true },
                })).map((item) => item.id));
                await tx.certificate.deleteMany({
                    where: {
                        candidateProfileId: profile.id,
                        OR: [
                            { source: 'MANUAL' },
                            {
                                source: 'EXTRACTED',
                                ...(preservedExtractedIds.size > 0
                                    ? { id: { notIn: [...preservedExtractedIds] } }
                                    : {}),
                            },
                        ],
                    },
                });
                const manualCertificates = dto.certificates.filter((item) => !item.id || !preservedExtractedIds.has(item.id));
                if (manualCertificates.length > 0) {
                    await tx.certificate.createMany({
                        data: manualCertificates.map((cert) => ({
                            candidateProfileId: profile.id,
                            source: 'MANUAL',
                            resumeId: null,
                            certificateName: cert.certificateName,
                            issuingOrganization: cert.issuingOrganization || 'Unknown',
                            issueDate: cert.issueDate ? new Date(cert.issueDate) : null,
                        })),
                    });
                }
            }
            return p;
        });
        this.logger.log(`CandidateProfile ${profile.id} updated by user ${userId}`);
        return updated;
    }
    async getCandidateSkills(candidateProfileId) {
        return this.prisma.candidateSkill.findMany({
            where: { candidateId: candidateProfileId },
            include: {
                skill: {
                    include: { category: true },
                },
            },
            orderBy: [{ isPrimary: 'desc' }, { createdAt: 'desc' }],
        });
    }
    async updateCandidateSkills(candidateProfileId, dto) {
        const profile = await this.prisma.candidateProfile.findUnique({
            where: { id: candidateProfileId },
        });
        if (!profile) {
            throw new common_1.NotFoundException(`Candidate profile ${candidateProfileId} not found.`);
        }
        const submittedSkills = [
            ...new Map(dto.skills.map((skill) => [skill.skillId, skill])).values(),
        ];
        const submittedSkillIds = submittedSkills.map((skill) => skill.skillId);
        await this.prisma.$transaction(async (tx) => {
            const existingSkills = await tx.candidateSkill.findMany({
                where: { candidateId: candidateProfileId },
                select: {
                    skillId: true,
                    proficiencyLevel: true,
                    isPrimary: true,
                    source: true,
                },
            });
            const existingBySkillId = new Map(existingSkills.map((skill) => [skill.skillId, skill]));
            await tx.candidateSkill.deleteMany({
                where: {
                    candidateId: candidateProfileId,
                    source: {
                        in: [client_1.SkillSource.EXTRACTED, client_1.SkillSource.SELF_DECLARED],
                    },
                    skillId: { notIn: submittedSkillIds },
                },
            });
            for (const skillItem of submittedSkills) {
                const existing = existingBySkillId.get(skillItem.skillId);
                const isPrimary = skillItem.isPrimary ?? false;
                if (existing?.source === client_1.SkillSource.VERIFIED)
                    continue;
                const unchangedExtractedSkill = existing?.source === client_1.SkillSource.EXTRACTED &&
                    existing.proficiencyLevel === skillItem.proficiencyLevel &&
                    existing.isPrimary === isPrimary;
                if (unchangedExtractedSkill)
                    continue;
                await tx.candidateSkill.upsert({
                    where: {
                        candidateId_skillId: {
                            candidateId: candidateProfileId,
                            skillId: skillItem.skillId,
                        },
                    },
                    update: {
                        proficiencyLevel: skillItem.proficiencyLevel,
                        isPrimary,
                        source: client_1.SkillSource.SELF_DECLARED,
                        resumeId: null,
                        isInferred: false,
                        sourceText: null,
                    },
                    create: {
                        candidateId: candidateProfileId,
                        skillId: skillItem.skillId,
                        proficiencyLevel: skillItem.proficiencyLevel,
                        isPrimary,
                        source: client_1.SkillSource.SELF_DECLARED,
                    },
                });
            }
        });
        this.logger.log(`CandidateProfile ${candidateProfileId}: saved ${submittedSkills.length} skills`);
        return this.getCandidateSkills(candidateProfileId);
    }
    async removeCandidateSkill(candidateProfileId, skillId) {
        const existing = await this.prisma.candidateSkill.findUnique({
            where: {
                candidateId_skillId: {
                    candidateId: candidateProfileId,
                    skillId,
                },
            },
        });
        if (!existing) {
            throw new common_1.NotFoundException(`Skill ${skillId} not found on candidate profile ${candidateProfileId}.`);
        }
        if (existing.source === client_1.SkillSource.VERIFIED) {
            throw new common_1.ForbiddenException('Verified skills cannot be removed by the candidate.');
        }
        await this.prisma.candidateSkill.delete({
            where: {
                candidateId_skillId: {
                    candidateId: candidateProfileId,
                    skillId,
                },
            },
        });
        this.logger.log(`CandidateProfile ${candidateProfileId}: removed skill ${skillId}`);
    }
    resolveProfile(profile) {
        const hasLinkedUser = profile.user !== null;
        return {
            id: profile.id,
            userId: profile.userId,
            status: profile.status,
            fullName: hasLinkedUser ? profile.user.fullName : profile.fullName,
            email: hasLinkedUser ? profile.user.email : profile.email,
            phone: hasLinkedUser ? profile.user.phone : profile.phone,
            address: profile.address,
            desiredTitle: profile.desiredTitle,
            professionalSummary: profile.professionalSummary,
            linkedinUrl: profile.linkedinUrl,
            githubUrl: profile.githubUrl,
            portfolioUrl: profile.portfolioUrl,
            primaryResumeId: profile.primaryResumeId,
            createdAt: profile.createdAt,
            updatedAt: profile.updatedAt,
        };
    }
};
exports.CandidatesService = CandidatesService;
exports.CandidatesService = CandidatesService = CandidatesService_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], CandidatesService);
//# sourceMappingURL=candidates.service.js.map