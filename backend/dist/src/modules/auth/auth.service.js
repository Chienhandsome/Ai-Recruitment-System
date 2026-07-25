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
exports.AuthService = void 0;
const common_1 = require("@nestjs/common");
const client_1 = require("@prisma/client");
const prisma_service_1 = require("../../database/prisma.service");
const auth_constants_1 = require("./auth.constants");
const userProfileInclude = {
    userRoles: {
        include: {
            role: true,
        },
    },
    candidateProfile: true,
    recruiterProfile: true,
};
let AuthService = class AuthService {
    prisma;
    constructor(prisma) {
        this.prisma = prisma;
    }
    async bootstrap(authUser, dto) {
        const existing = await this.prisma.user.findUnique({
            where: { id: authUser.id },
            include: userProfileInclude,
        });
        if (existing) {
            const updated = await this.prisma.user.update({
                where: { id: authUser.id },
                data: {
                    email: authUser.email,
                    fullName: authUser.fullName,
                    avatarUrl: authUser.avatarUrl,
                    lastLoginAt: new Date(),
                },
                include: userProfileInclude,
            });
            return this.toAuthResponse(updated);
        }
        if (!dto.role) {
            throw new common_1.BadRequestException({
                code: 'ROLE_REQUIRED',
                message: 'Choose Candidate or Recruiter to finish creating your account.',
            });
        }
        const signupRole = dto.role;
        try {
            const created = await this.prisma.$transaction(async (transaction) => {
                const roleDetails = auth_constants_1.ROLE_DETAILS[signupRole];
                const role = await transaction.role.upsert({
                    where: { code: signupRole },
                    update: {
                        name: roleDetails.name,
                        description: roleDetails.description,
                    },
                    create: {
                        code: signupRole,
                        name: roleDetails.name,
                        description: roleDetails.description,
                    },
                });
                const user = await transaction.user.create({
                    data: {
                        id: authUser.id,
                        email: authUser.email,
                        fullName: authUser.fullName,
                        avatarUrl: authUser.avatarUrl,
                        status: 'ACTIVE',
                        lastLoginAt: new Date(),
                        userRoles: {
                            create: {
                                roleId: role.id,
                            },
                        },
                    },
                });
                if (signupRole === 'CANDIDATE') {
                    await transaction.candidateProfile.create({
                        data: {
                            userId: user.id,
                            fullName: user.fullName,
                            email: user.email,
                        },
                    });
                }
                else {
                    await transaction.recruiterProfile.create({
                        data: {
                            userId: user.id,
                        },
                    });
                }
                await transaction.auditLog.create({
                    data: {
                        userId: user.id,
                        action: 'AUTH_PROFILE_BOOTSTRAPPED',
                        entityName: 'User',
                        entityId: user.id,
                        newValues: {
                            role: signupRole,
                            source: 'PUBLIC_SIGNUP',
                        },
                    },
                });
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
                const concurrentlyCreated = await this.prisma.user.findUnique({
                    where: { id: authUser.id },
                    include: userProfileInclude,
                });
                if (concurrentlyCreated) {
                    return this.toAuthResponse(concurrentlyCreated);
                }
            }
            throw error;
        }
    }
    async getMe(userId) {
        const user = await this.prisma.user.findUnique({
            where: { id: userId },
            include: userProfileInclude,
        });
        if (!user) {
            throw new common_1.NotFoundException({
                code: 'PROFILE_NOT_INITIALIZED',
                message: 'The application profile has not been initialized.',
            });
        }
        return this.toAuthResponse(user);
    }
    async provisionAdmin(createdByUserId, invitedUser) {
        const created = await this.prisma.$transaction(async (transaction) => {
            const roleDetails = auth_constants_1.ROLE_DETAILS.ADMIN;
            const adminRole = await transaction.role.upsert({
                where: { code: 'ADMIN' },
                update: roleDetails,
                create: {
                    code: 'ADMIN',
                    ...roleDetails,
                },
            });
            const user = await transaction.user.create({
                data: {
                    id: invitedUser.id,
                    email: invitedUser.email,
                    fullName: invitedUser.fullName,
                    status: 'ACTIVE',
                    userRoles: {
                        create: {
                            roleId: adminRole.id,
                        },
                    },
                },
            });
            await transaction.auditLog.create({
                data: {
                    userId: createdByUserId,
                    action: 'ADMIN_INVITED',
                    entityName: 'User',
                    entityId: user.id,
                    newValues: {
                        email: user.email,
                        role: 'ADMIN',
                    },
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
        this.assertAccountIsActive(user.status);
        const roles = user.userRoles
            .map((userRole) => userRole.role.code)
            .sort();
        return {
            id: user.id,
            email: user.email,
            fullName: user.fullName,
            phone: user.phone,
            avatarUrl: user.avatarUrl,
            status: user.status,
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
                    departmentId: user.recruiterProfile.departmentId,
                    title: user.recruiterProfile.title,
                }
                : null,
        };
    }
    assertAccountIsActive(status) {
        if (status !== 'ACTIVE') {
            throw new common_1.ForbiddenException({
                code: 'ACCOUNT_UNAVAILABLE',
                message: `This account is ${status.toLowerCase()}.`,
            });
        }
    }
};
exports.AuthService = AuthService;
exports.AuthService = AuthService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], AuthService);
//# sourceMappingURL=auth.service.js.map