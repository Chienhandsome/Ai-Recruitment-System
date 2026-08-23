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
            phone: true,
            birthDay: true,
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
              phone: true,
              birthDay: true,
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

      await this.prisma.candidateProfile.updateMany({
        where: { userId },
        data: {
          ...(dto.fullName !== undefined && { fullName: dto.fullName }),
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
            phone: true,
            birthDay: true,
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

  async getDashboardAnalytics(userId: string, jobId?: string) {
    const profile = await this.prisma.recruiterProfile.findUnique({
      where: { userId },
      select: { companyId: true },
    });

    if (!profile) {
      throw new NotFoundException('Recruiter profile not found');
    }

    const emptyResult = {
      kpis: {
        totalActiveJobs: 0,
        totalApplications: 0,
        newApplicationsToday: 0,
        newApplicationsThisWeek: 0,
        totalInterviews: 0,
        totalHired: 0,
        avgAiScore: 0,
        hireConversionRate: 0,
      },
      funnel: [
        { stage: 'RECEIVED', label: 'Ứng tuyển', count: 0, percentage: 0 },
        { stage: 'SCREENING', label: 'Sơ loại', count: 0, percentage: 0 },
        { stage: 'SHORTLISTED', label: 'Đạt chuẩn AI', count: 0, percentage: 0 },
        { stage: 'INTERVIEW_SCHEDULED', label: 'Phỏng vấn', count: 0, percentage: 0 },
        { stage: 'OFFERED', label: 'Gửi Offer', count: 0, percentage: 0 },
        { stage: 'HIRED', label: 'Đã tuyển', count: 0, percentage: 0 },
        { stage: 'REJECTED', label: 'Từ chối', count: 0, percentage: 0 },
      ],
      scoreDistribution: [
        { range: '< 40', label: 'Kém', count: 0, percentage: 0, color: '#EF4444' },
        { range: '40 - 59', label: 'Trung bình', count: 0, percentage: 0, color: '#F59E0B' },
        { range: '60 - 79', label: 'Khá', count: 0, percentage: 0, color: '#3B82F6' },
        { range: '80 - 89', label: 'Tốt', count: 0, percentage: 0, color: '#10B981' },
        { range: '90 - 100', label: 'Xuất sắc', count: 0, percentage: 0, color: '#8B5CF6' },
      ],
      upcomingInterviews: [],
      topSkills: [],
    };

    if (!profile.companyId) {
      return emptyResult;
    }

    const companyId = profile.companyId;

    const jobWhere: Prisma.JobPostingWhereInput = {
      department: { companyId },
      ...(jobId ? { id: jobId } : {}),
    };

    const appWhere: Prisma.ApplicationWhereInput = {
      job: jobWhere,
    };

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const startOfWeek = new Date();
    const day = startOfWeek.getDay();
    const diff = startOfWeek.getDate() - day + (day === 0 ? -6 : 1);
    startOfWeek.setDate(diff);
    startOfWeek.setHours(0, 0, 0, 0);

    const [
      totalActiveJobs,
      totalApplications,
      newApplicationsToday,
      newApplicationsThisWeek,
      totalInterviews,
      totalHired,
      stageGroups,
      aiResults,
      upcomingInterviewsRaw,
      jobSkillsRaw,
    ] = await Promise.all([
      this.prisma.jobPosting.count({
        where: { department: { companyId }, status: 'PUBLISHED' },
      }),
      this.prisma.application.count({ where: appWhere }),
      this.prisma.application.count({
        where: { ...appWhere, appliedAt: { gte: today } },
      }),
      this.prisma.application.count({
        where: { ...appWhere, appliedAt: { gte: startOfWeek } },
      }),
      this.prisma.interview.count({
        where: { application: appWhere },
      }),
      this.prisma.application.count({
        where: { ...appWhere, currentStage: 'HIRED' },
      }),
      this.prisma.application.groupBy({
        by: ['currentStage'],
        where: appWhere,
        _count: { id: true },
      }),
      this.prisma.aiMatchingResult.findMany({
        where: { application: appWhere },
        select: { overallScore: true, matchedSkills: true },
      }),
      this.prisma.interview.findMany({
        where: {
          application: appWhere,
          status: 'SCHEDULED',
          scheduledAt: { gte: new Date(Date.now() - 3600000) },
        },
        take: 5,
        orderBy: { scheduledAt: 'asc' },
        include: {
          application: {
            select: {
              id: true,
              job: { select: { id: true, title: true } },
              candidate: {
                select: {
                  id: true,
                  user: {
                    select: {
                      fullName: true,
                      avatarUrl: true,
                      email: true,
                      phone: true,
                    },
                  },
                },
              },
            },
          },
        },
      }),
      this.prisma.jobSkill.findMany({
        where: { job: jobWhere },
        select: {
          skill: { select: { id: true, name: true } },
          requirementType: true,
        },
      }),
    ]);

    // Calculate Average AI Score
    let avgAiScore = 0;
    if (aiResults.length > 0) {
      const sum = aiResults.reduce(
        (acc, curr) => acc + Number(curr.overallScore || 0),
        0,
      );
      avgAiScore = Math.round((sum / aiResults.length) * 10) / 10;
    }

    const hireConversionRate =
      totalApplications > 0
        ? Math.round((totalHired / totalApplications) * 100 * 10) / 10
        : 0;

    // Stage counts map
    const stageCounts: Record<string, number> = {};
    stageGroups.forEach((g) => {
      stageCounts[g.currentStage] = g._count.id;
    });

    const interviewStageCount =
      (stageCounts['INTERVIEW_SCHEDULED'] || 0) +
      (stageCounts['INTERVIEWED'] || 0);

    const funnelStages = [
      {
        stage: 'RECEIVED',
        label: 'Ứng tuyển',
        count: totalApplications,
        percentage: 100,
      },
      {
        stage: 'SCREENING',
        label: 'Sơ loại',
        count: stageCounts['SCREENING'] || 0,
        percentage:
          totalApplications > 0
            ? Math.round(((stageCounts['SCREENING'] || 0) / totalApplications) * 100)
            : 0,
      },
      {
        stage: 'SHORTLISTED',
        label: 'Đạt chuẩn AI',
        count: stageCounts['SHORTLISTED'] || 0,
        percentage:
          totalApplications > 0
            ? Math.round(((stageCounts['SHORTLISTED'] || 0) / totalApplications) * 100)
            : 0,
      },
      {
        stage: 'INTERVIEW_SCHEDULED',
        label: 'Phỏng vấn',
        count: interviewStageCount,
        percentage:
          totalApplications > 0
            ? Math.round((interviewStageCount / totalApplications) * 100)
            : 0,
      },
      {
        stage: 'OFFERED',
        label: 'Gửi Offer',
        count: stageCounts['OFFERED'] || 0,
        percentage:
          totalApplications > 0
            ? Math.round(((stageCounts['OFFERED'] || 0) / totalApplications) * 100)
            : 0,
      },
      {
        stage: 'HIRED',
        label: 'Đã tuyển',
        count: totalHired,
        percentage:
          totalApplications > 0
            ? Math.round((totalHired / totalApplications) * 100)
            : 0,
      },
      {
        stage: 'REJECTED',
        label: 'Từ chối',
        count: stageCounts['REJECTED'] || 0,
        percentage:
          totalApplications > 0
            ? Math.round(((stageCounts['REJECTED'] || 0) / totalApplications) * 100)
            : 0,
      },
    ];

    // Score distribution buckets
    let cLess40 = 0;
    let c40to59 = 0;
    let c60to79 = 0;
    let c80to89 = 0;
    let c90to100 = 0;

    aiResults.forEach((r) => {
      const s = Number(r.overallScore || 0);
      if (s < 40) cLess40++;
      else if (s < 60) c40to59++;
      else if (s < 80) c60to79++;
      else if (s < 90) c80to89++;
      else c90to100++;
    });

    const totalScores = aiResults.length || 1;
    const scoreDistribution = [
      {
        range: '< 40',
        label: 'Kém',
        count: cLess40,
        percentage: Math.round((cLess40 / totalScores) * 100),
        color: '#EF4444',
      },
      {
        range: '40 - 59',
        label: 'Trung bình',
        count: c40to59,
        percentage: Math.round((c40to59 / totalScores) * 100),
        color: '#F59E0B',
      },
      {
        range: '60 - 79',
        label: 'Khá',
        count: c60to79,
        percentage: Math.round((c60to79 / totalScores) * 100),
        color: '#3B82F6',
      },
      {
        range: '80 - 89',
        label: 'Tốt',
        count: c80to89,
        percentage: Math.round((c80to89 / totalScores) * 100),
        color: '#10B981',
      },
      {
        range: '90 - 100',
        label: 'Xuất sắc',
        count: c90to100,
        percentage: Math.round((c90to100 / totalScores) * 100),
        color: '#8B5CF6',
      },
    ];

    // Format upcoming interviews
    const upcomingInterviews = upcomingInterviewsRaw.map((it) => ({
      id: it.id,
      title: it.title,
      type: it.type,
      scheduledAt: it.scheduledAt,
      durationMinutes: it.durationMinutes,
      locationOrLink: it.locationOrLink,
      candidate: {
        id: it.application.candidate.id,
        fullName: it.application.candidate.user?.fullName || 'Ứng viên',
        avatarUrl: it.application.candidate.user?.avatarUrl || null,
        email: it.application.candidate.user?.email || '',
        phone: it.application.candidate.user?.phone || null,
      },
      job: {
        id: it.application.job.id,
        title: it.application.job.title,
      },
    }));

    // Calculate Top Skills demand vs match rate
    const skillCounts: Record<string, { name: string; requiredCount: number; matchedCount: number }> = {};
    jobSkillsRaw.forEach((js) => {
      const name = js.skill.name;
      if (!skillCounts[name]) {
        skillCounts[name] = { name, requiredCount: 0, matchedCount: 0 };
      }
      skillCounts[name].requiredCount++;
    });

    aiResults.forEach((ar) => {
      const matched = Array.isArray(ar.matchedSkills) ? ar.matchedSkills : [];
      matched.forEach((ms: any) => {
        const name = typeof ms === 'string' ? ms : ms?.name;
        if (name && skillCounts[name]) {
          skillCounts[name].matchedCount++;
        }
      });
    });

    const topSkills = Object.values(skillCounts)
      .sort((a, b) => b.requiredCount - a.requiredCount)
      .slice(0, 6)
      .map((sk) => ({
        skill: sk.name,
        demandCount: sk.requiredCount,
        matchRate:
          totalApplications > 0
            ? Math.min(100, Math.round((sk.matchedCount / totalApplications) * 100))
            : 0,
      }));

    return {
      kpis: {
        totalActiveJobs,
        totalApplications,
        newApplicationsToday,
        newApplicationsThisWeek,
        totalInterviews,
        totalHired,
        avgAiScore,
        hireConversionRate,
      },
      funnel: funnelStages,
      scoreDistribution,
      upcomingInterviews,
      topSkills,
    };
  }
}
