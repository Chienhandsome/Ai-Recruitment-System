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
        const updated = await this.prisma.candidateProfile.update({
            where: { id: profile.id },
            data: profileData,
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
        await this.prisma.$transaction(async (tx) => {
            await tx.candidateSkill.deleteMany({
                where: {
                    candidateId: candidateProfileId,
                    source: client_1.SkillSource.SELF_DECLARED,
                    skillId: { notIn: dto.skills.map((s) => s.skillId) },
                },
            });
            for (const skillItem of dto.skills) {
                await tx.candidateSkill.upsert({
                    where: {
                        candidateId_skillId: {
                            candidateId: candidateProfileId,
                            skillId: skillItem.skillId,
                        },
                    },
                    update: {
                        proficiencyLevel: skillItem.proficiencyLevel,
                        yearsExperience: skillItem.yearsExperience ?? null,
                        isPrimary: skillItem.isPrimary ?? false,
                        source: client_1.SkillSource.SELF_DECLARED,
                    },
                    create: {
                        candidateId: candidateProfileId,
                        skillId: skillItem.skillId,
                        proficiencyLevel: skillItem.proficiencyLevel,
                        yearsExperience: skillItem.yearsExperience ?? null,
                        isPrimary: skillItem.isPrimary ?? false,
                        source: client_1.SkillSource.SELF_DECLARED,
                    },
                });
            }
        });
        this.logger.log(`CandidateProfile ${candidateProfileId}: updated ${dto.skills.length} SELF_DECLARED skills`);
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
        if (existing.source !== client_1.SkillSource.SELF_DECLARED) {
            throw new common_1.NotFoundException(`Only self-declared skills can be removed. This skill was ${existing.source}.`);
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