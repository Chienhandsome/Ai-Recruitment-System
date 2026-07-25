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
var AuthService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.AuthService = void 0;
const common_1 = require("@nestjs/common");
const client_1 = require("@prisma/client");
const prisma_service_1 = require("../../database/prisma.service");
const userProfileInclude = {
    candidateProfile: true,
    recruiterProfile: true,
};
const getUserWithProfile = (prisma) => prisma.user.findUnique({
    where: { id: '' },
    include: userProfileInclude,
});
let AuthService = AuthService_1 = class AuthService {
    prisma;
    logger = new common_1.Logger(AuthService_1.name);
    constructor(prisma) {
        this.prisma = prisma;
    }
    async bootstrap(authUser, dto) {
        this.logger.log(`bootstrap: Starting for user ${authUser.email} (${authUser.id}), role=${dto.role ?? 'none'}`);
        const existing = await this.prisma.user.findUnique({
            where: { id: authUser.id },
            include: userProfileInclude,
        });
        if (existing) {
            this.logger.debug(`bootstrap: Existing user found — updating lastLoginAt`);
            const updated = await this.prisma.user.update({
                where: { id: authUser.id },
                data: {
                    email: authUser.email,
                    fullName: authUser.fullName,
                },
                include: userProfileInclude,
            });
            return this.toAuthResponse(updated);
        }
        this.logger.debug(`bootstrap: No existing user — creating new profile`);
        if (!dto.role) {
            this.logger.warn(`bootstrap: No role provided for new user ${authUser.email}`);
            throw new common_1.BadRequestException({
                code: 'ROLE_REQUIRED',
                message: 'Choose Candidate or Recruiter to finish creating your account.',
            });
        }
        const signupRole = dto.role;
        try {
            const created = await this.prisma.$transaction(async (transaction) => {
                const user = await transaction.user.create({
                    data: {
                        id: authUser.id,
                        email: authUser.email,
                        fullName: authUser.fullName,
                        userStatus: 'ACTIVE',
                        role: signupRole,
                    },
                });
                if (signupRole === 'CANDIDATE') {
                    await transaction.candidateProfile.create({
                        data: {
                            userId: user.id,
                        },
                    });
                }
                else {
                    await transaction.recruiterProfile.create({
                        data: {
                            userId: user.id,
                            companyName: 'Unknown Company',
                        },
                    });
                }
                return transaction.user.findUniqueOrThrow({
                    where: { id: user.id },
                    include: userProfileInclude,
                });
            });
            return this.toAuthResponse(created);
        }
        catch (error) {
            if (error instanceof client_1.Prisma.PrismaClientKnownRequestError &&
                error.code === 'P2002') {
                this.logger.warn(`bootstrap: P2002 duplicate detected for user ${authUser.id} — checking concurrent creation`);
                const concurrentlyCreated = await this.prisma.user.findUnique({
                    where: { id: authUser.id },
                    include: userProfileInclude,
                });
                if (concurrentlyCreated) {
                    return this.toAuthResponse(concurrentlyCreated);
                }
            }
            this.logger.error(`bootstrap: Failed for user ${authUser.email} — ${error instanceof Error ? error.message : 'Unknown error'}`);
            throw error;
        }
    }
    async getMe(userId) {
        this.logger.debug(`getMe: Fetching profile for userId=${userId}`);
        const user = await this.prisma.user.findUnique({
            where: { id: userId },
            include: userProfileInclude,
        });
        if (!user) {
            this.logger.warn(`getMe: No profile found for userId=${userId}`);
            throw new common_1.NotFoundException({
                code: 'PROFILE_NOT_INITIALIZED',
                message: 'The application profile has not been initialized.',
            });
        }
        this.logger.debug(`getMe: Profile found for ${user.email}`);
        return this.toAuthResponse(user);
    }
    async provisionAdmin(createdByUserId, invitedUser) {
        const created = await this.prisma.$transaction(async (transaction) => {
            const user = await transaction.user.create({
                data: {
                    id: invitedUser.id,
                    email: invitedUser.email,
                    fullName: invitedUser.fullName,
                    userStatus: 'ACTIVE',
                    role: 'ADMIN',
                },
            });
            return transaction.user.findUniqueOrThrow({
                where: { id: user.id },
                include: userProfileInclude,
            });
        });
        return this.toAuthResponse(created);
    }
    toAuthResponse(user) {
        this.assertAccountIsActive(user.userStatus);
        const roles = user.role ? [user.role] : [];
        return {
            id: user.id,
            email: user.email,
            fullName: user.fullName,
            phone: user.phone,
            status: user.userStatus,
            roles,
            candidateProfile: user.candidateProfile
                ? {
                    id: user.candidateProfile.id,
                    address: user.candidateProfile.address,
                    githubUrl: user.candidateProfile.githubUrl,
                    linkedinUrl: user.candidateProfile.linkedinUrl,
                    portfolioUrl: user.candidateProfile.portfolioUrl,
                }
                : null,
            recruiterProfile: user.recruiterProfile
                ? {
                    id: user.recruiterProfile.id,
                    companyName: user.recruiterProfile.companyName,
                    title: user.recruiterProfile.title,
                }
                : null,
        };
    }
    assertAccountIsActive(status) {
        if (status !== 'ACTIVE') {
            throw new common_1.ForbiddenException({
                code: 'ACCOUNT_UNAVAILABLE',
                message: `This account is ${status?.toLowerCase() ?? 'unavailable'}.`,
            });
        }
    }
};
exports.AuthService = AuthService;
exports.AuthService = AuthService = AuthService_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], AuthService);
//# sourceMappingURL=auth.service.js.map