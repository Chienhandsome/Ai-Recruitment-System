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
exports.RecruitersService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../../database/prisma.service");
let RecruitersService = class RecruitersService {
    prisma;
    constructor(prisma) {
        this.prisma = prisma;
    }
    async getProfile(userId) {
        let profile = await this.prisma.recruiterProfile.findUnique({
            where: { userId },
            include: {
                company: true,
                department: true,
                user: {
                    select: {
                        fullName: true,
                        avatarUrl: true,
                        email: true,
                    }
                }
            },
        });
        if (!profile) {
            profile = await this.prisma.recruiterProfile.create({
                data: {
                    userId,
                },
                include: {
                    company: true,
                    department: true,
                    user: {
                        select: {
                            fullName: true,
                            avatarUrl: true,
                            email: true,
                        }
                    }
                }
            });
        }
        return profile;
    }
    async updateProfile(userId, dto) {
        let profile = await this.prisma.recruiterProfile.findUnique({
            where: { userId },
        });
        if (dto.companyId) {
            const company = await this.prisma.company.findUnique({
                where: { id: dto.companyId },
            });
            if (!company) {
                throw new common_1.NotFoundException('Company not found');
            }
        }
        if (dto.departmentId) {
            const department = await this.prisma.department.findUnique({
                where: { id: dto.departmentId },
            });
            if (!department) {
                throw new common_1.NotFoundException('Department not found');
            }
        }
        const hasUserUpdate = dto.fullName !== undefined || dto.phone !== undefined || dto.avatarUrl !== undefined || dto.birthDay !== undefined;
        if (hasUserUpdate) {
            await this.prisma.user.update({
                where: { id: userId },
                data: {
                    ...(dto.fullName !== undefined && { fullName: dto.fullName }),
                    ...(dto.phone !== undefined && { phone: dto.phone }),
                    ...(dto.avatarUrl !== undefined && { avatarUrl: dto.avatarUrl }),
                    ...(dto.birthDay !== undefined && { birthDay: dto.birthDay ? new Date(dto.birthDay) : null }),
                },
            });
        }
        return this.prisma.recruiterProfile.upsert({
            where: { userId },
            create: {
                userId,
                title: dto.title,
                companyId: dto.companyId,
                departmentId: dto.departmentId,
            },
            update: {
                title: dto.title,
                companyId: dto.companyId,
                departmentId: dto.departmentId,
            },
            include: {
                company: true,
                department: true,
                user: {
                    select: {
                        fullName: true,
                        avatarUrl: true,
                        email: true,
                    }
                }
            },
        });
    }
    async getDashboardStats(userId) {
        const profile = await this.prisma.recruiterProfile.findUnique({
            where: { userId },
            select: { companyId: true },
        });
        if (!profile) {
            throw new common_1.NotFoundException('Recruiter profile not found');
        }
        if (!profile.companyId) {
            return {
                totalActiveJobs: 0,
                totalCandidates: 0,
                newApplicationsToday: 0,
            };
        }
        const companyId = profile.companyId;
        const totalActiveJobs = await this.prisma.jobPosting.count({
            where: {
                department: {
                    companyId: companyId,
                },
                status: 'PUBLISHED',
            },
        });
        const totalCandidates = await this.prisma.application.count({
            where: {
                job: {
                    department: {
                        companyId: companyId,
                    },
                },
            },
        });
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const newApplicationsToday = await this.prisma.application.count({
            where: {
                job: {
                    department: {
                        companyId: companyId,
                    },
                },
                appliedAt: {
                    gte: today,
                },
            },
        });
        return {
            totalActiveJobs,
            totalCandidates,
            newApplicationsToday,
        };
    }
};
exports.RecruitersService = RecruitersService;
exports.RecruitersService = RecruitersService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], RecruitersService);
//# sourceMappingURL=recruiters.service.js.map