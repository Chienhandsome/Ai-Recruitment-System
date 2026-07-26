import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';
import { UpdateRecruiterProfileDto } from './dto/update-recruiter-profile.dto';
import { Prisma } from '@prisma/client';

@Injectable()
export class RecruitersService {
  constructor(private readonly prisma: PrismaService) {}

  async getProfile(userId: string) {
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
      // Auto-create an empty recruiter profile if one doesn't exist
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

  async updateProfile(userId: string, dto: UpdateRecruiterProfileDto) {
    let profile = await this.prisma.recruiterProfile.findUnique({
      where: { userId },
    });

    // We don't throw 404 anymore, we will just upsert it below

    // Verify company if provided
    if (dto.companyId) {
      const company = await this.prisma.company.findUnique({
        where: { id: dto.companyId },
      });
      if (!company) {
        throw new NotFoundException('Company not found');
      }
    }

    // Verify department if provided
    if (dto.departmentId) {
      const department = await this.prisma.department.findUnique({
        where: { id: dto.departmentId },
      });
      if (!department) {
        throw new NotFoundException('Department not found');
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

  async getDashboardStats(userId: string) {
    const profile = await this.prisma.recruiterProfile.findUnique({
      where: { userId },
      select: { companyId: true },
    });

    if (!profile) {
      throw new NotFoundException('Recruiter profile not found');
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
}
