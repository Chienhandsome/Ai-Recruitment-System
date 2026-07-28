import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';
import { JobStatus, AccountStatus } from '@prisma/client';

@Injectable()
export class AdminService {
  private readonly logger = new Logger(AdminService.name);

  constructor(private readonly prisma: PrismaService) {}

  async getDashboardStats() {
    this.logger.log('Fetching real-time Admin Dashboard statistics from database...');

    try {
      const [
        totalUsers,
        totalCandidates,
        totalRecruiters,
        totalJobs,
        activeJobs,
        totalSkills,
        totalSkillCategories,
        pendingUnrecognizedSkills,
        totalApplications,
        recentJobs,
        topUnrecognizedSkills,
      ] = await Promise.all([
        this.prisma.user.count(),
        this.prisma.candidateProfile.count(),
        this.prisma.recruiterProfile.count(),
        this.prisma.jobPosting.count(),
        this.prisma.jobPosting.count({
          where: {
            status: JobStatus.PUBLISHED,
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
    } catch (err: unknown) {
      this.logger.error('Error fetching admin dashboard stats:', err);
      throw err;
    }
  }

  // --- JOB MODERATION FOR ADMIN ---

  async getAdminJobs(status?: string, search?: string) {
    const whereClause: any = {};

    if (status && status !== 'ALL') {
      whereClause.status = status as JobStatus;
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

  async updateJobStatus(id: string, status: JobStatus) {
    const existing = await this.prisma.jobPosting.findUnique({ where: { id } });
    if (!existing) {
      throw new NotFoundException('Không tìm thấy bài đăng tuyển dụng');
    }

    const updated = await this.prisma.jobPosting.update({
      where: { id },
      data: {
        status,
        ...(status === JobStatus.PUBLISHED ? { publishedAt: new Date() } : {}),
        ...(status === JobStatus.CLOSED ? { closedAt: new Date() } : {}),
      },
    });

    return updated;
  }

  async deleteJob(id: string) {
    const existing = await this.prisma.jobPosting.findUnique({ where: { id } });
    if (!existing) {
      throw new NotFoundException('Không tìm thấy bài đăng tuyển dụng');
    }

    return this.prisma.jobPosting.delete({
      where: { id },
    });
  }

  // --- USER MANAGEMENT FOR ADMIN ---

  async getAdminUsers(role?: string, status?: string, search?: string) {
    const whereClause: any = {};

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
      whereClause.status = status as AccountStatus;
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

  async updateUserStatus(id: string, status: AccountStatus) {
    const user = await this.prisma.user.findUnique({ where: { id } });
    if (!user) {
      throw new NotFoundException('Không tìm thấy người dùng');
    }

    return this.prisma.user.update({
      where: { id },
      data: { status },
    });
  }

  async deleteUser(id: string) {
    const user = await this.prisma.user.findUnique({ where: { id } });
    if (!user) {
      throw new NotFoundException('Không tìm thấy người dùng');
    }

    return this.prisma.user.delete({
      where: { id },
    });
  }
}
