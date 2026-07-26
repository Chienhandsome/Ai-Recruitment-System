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