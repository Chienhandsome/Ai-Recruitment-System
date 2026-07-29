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
var AdminService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.AdminService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../../database/prisma.service");
const client_1 = require("@prisma/client");
let AdminService = AdminService_1 = class AdminService {
    prisma;
    logger = new common_1.Logger(AdminService_1.name);
    constructor(prisma) {
        this.prisma = prisma;
    }
    async getDashboardStats() {
        this.logger.log('Fetching real-time Admin Dashboard statistics from database...');
        try {
            const [totalUsers, totalCandidates, totalRecruiters, totalJobs, activeJobs, totalSkills, totalSkillCategories, pendingUnrecognizedSkills, totalApplications, recentJobs, topUnrecognizedSkills,] = await Promise.all([
                this.prisma.user.count(),
                this.prisma.candidateProfile.count(),
                this.prisma.recruiterProfile.count(),
                this.prisma.jobPosting.count(),
                this.prisma.jobPosting.count({
                    where: {
                        status: client_1.JobStatus.PUBLISHED,
                    },
                }),
                this.prisma.skill.count(),
                this.prisma.skillCategory.count(),
                this.prisma.unrecognizedSkill.count({
                    where: { status: 'PENDING' },
                }),
                this.prisma.application.count(),
                this.prisma.jobPosting.findMany({
                    take: 5,
                    orderBy: { createdAt: 'desc' },
                    include: {
                        department: true,
                        recruiter: {
                            include: {
                                company: true,
                                user: true,
                            },
                        },
                    },
                }),
                this.prisma.unrecognizedSkill.findMany({
                    take: 5,
                    where: { status: 'PENDING' },
                    orderBy: { frequency: 'desc' },
                }),
            ]);
            return {
                overview: {
                    totalUsers,
                    totalCandidates,
                    totalRecruiters,
                    totalJobs,
                    activeJobs,
                    totalSkills,
                    totalSkillCategories,
                    pendingUnrecognizedSkills,
                    totalApplications,
                },
                recentJobs: recentJobs.map((j) => ({
                    id: j.id,
                    title: j.title,
                    jobCode: j.jobCode,
                    department: j.department?.name ?? 'General',
                    company: j.recruiter?.company?.name ?? 'SmartRecruit Company',
                    status: j.status,
                    createdAt: j.createdAt,
                })),
                topUnrecognizedSkills: topUnrecognizedSkills.map((u) => ({
                    id: u.id,
                    rawSkillName: u.rawSkillName,
                    frequency: u.frequency,
                    createdAt: u.createdAt,
                })),
            };
        }
        catch (err) {
            this.logger.error('Error fetching admin dashboard stats:', err);
            throw err;
        }
    }
    async getAdminJobs(status, search) {
        const whereClause = {};
        if (status && status !== 'ALL') {
            whereClause.status = status;
        }
        if (search && search.trim()) {
            const q = search.trim();
            whereClause.OR = [
                { title: { contains: q, mode: 'insensitive' } },
                { jobCode: { contains: q, mode: 'insensitive' } },
                { description: { contains: q, mode: 'insensitive' } },
                { recruiter: { company: { name: { contains: q, mode: 'insensitive' } } } },
            ];
        }
        const jobs = await this.prisma.jobPosting.findMany({
            where: whereClause,
            include: {
                department: true,
                category: true,
                recruiter: {
                    include: {
                        company: true,
                        user: true,
                    },
                },
                jobSkills: {
                    include: {
                        skill: true,
                    },
                },
            },
            orderBy: { createdAt: 'desc' },
            take: 100,
        });
        return jobs.map((j) => ({
            id: j.id,
            jobCode: j.jobCode,
            title: j.title,
            company: j.recruiter?.company?.name ?? 'Công ty Tuyển dụng',
            department: j.department?.name ?? 'Chưa phân phòng',
            employmentType: j.employmentType,
            experienceLevel: j.experienceLevel,
            status: j.status,
            minSalary: j.minSalary ? Number(j.minSalary) : null,
            maxSalary: j.maxSalary ? Number(j.maxSalary) : null,
            currency: j.currency,
            location: j.location,
            postedDate: j.createdAt,
            skills: j.jobSkills.map((js) => js.skill.name),
        }));
    }
    async updateJobStatus(id, status) {
        const existing = await this.prisma.jobPosting.findUnique({ where: { id } });
        if (!existing) {
            throw new common_1.NotFoundException('Không tìm thấy bài đăng tuyển dụng');
        }
        const updated = await this.prisma.jobPosting.update({
            where: { id },
            data: {
                status,
                ...(status === client_1.JobStatus.PUBLISHED ? { publishedAt: new Date() } : {}),
                ...(status === client_1.JobStatus.CLOSED ? { closedAt: new Date() } : {}),
            },
        });
        return updated;
    }
    async deleteJob(id) {
        const existing = await this.prisma.jobPosting.findUnique({ where: { id } });
        if (!existing) {
            throw new common_1.NotFoundException('Không tìm thấy bài đăng tuyển dụng');
        }
        return this.prisma.jobPosting.delete({
            where: { id },
        });
    }
    async getAdminUsers(role, status, search) {
        const whereClause = {};
        if (role && role !== 'ALL') {
            whereClause.userRoles = {
                some: {
                    role: {
                        code: role,
                    },
                },
            };
        }
        if (status && status !== 'ALL') {
            whereClause.status = status;
        }
        if (search && search.trim()) {
            const q = search.trim();
            whereClause.OR = [
                { email: { contains: q, mode: 'insensitive' } },
                { fullName: { contains: q, mode: 'insensitive' } },
                { phone: { contains: q, mode: 'insensitive' } },
            ];
        }
        const users = await this.prisma.user.findMany({
            where: whereClause,
            include: {
                userRoles: {
                    include: {
                        role: true,
                    },
                },
                candidateProfile: true,
                recruiterProfile: {
                    include: {
                        company: true,
                    },
                },
            },
            orderBy: { createdAt: 'desc' },
            take: 100,
        });
        return users.map((u) => {
            const roles = u.userRoles.map((ur) => ur.role.code);
            const companyName = u.recruiterProfile?.company?.name;
            return {
                id: u.id,
                email: u.email,
                fullName: u.fullName,
                phone: u.phone ?? 'N/A',
                status: u.status,
                roles,
                companyName,
                createdAt: u.createdAt,
                lastLoginAt: u.lastLoginAt,
            };
        });
    }
    async updateUserStatus(id, status) {
        const user = await this.prisma.user.findUnique({ where: { id } });
        if (!user) {
            throw new common_1.NotFoundException('Không tìm thấy người dùng');
        }
        return this.prisma.user.update({
            where: { id },
            data: { status },
        });
    }
    async deleteUser(id) {
        const user = await this.prisma.user.findUnique({ where: { id } });
        if (!user) {
            throw new common_1.NotFoundException('Không tìm thấy người dùng');
        }
        return this.prisma.user.delete({
            where: { id },
        });
    }
};
exports.AdminService = AdminService;
exports.AdminService = AdminService = AdminService_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], AdminService);
//# sourceMappingURL=admin.service.js.map