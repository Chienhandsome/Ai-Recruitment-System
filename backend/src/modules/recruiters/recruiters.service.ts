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
          },
        },
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
            },
          },
        },
      });
    }

    return profile;
  }

  async updateProfile(userId: string, dto: UpdateRecruiterProfileDto) {
    let profile = await this.prisma.recruiterProfile.findUnique({
      where: { userId },
    });

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

    const hasUserUpdate =
      dto.fullName !== undefined ||
      dto.phone !== undefined ||
      dto.avatarUrl !== undefined ||
      dto.birthDay !== undefined;

    if (hasUserUpdate) {
      await this.prisma.user.update({
        where: { id: userId },
        data: {
          ...(dto.fullName !== undefined && { fullName: dto.fullName }),
          ...(dto.phone !== undefined && { phone: dto.phone }),
          ...(dto.avatarUrl !== undefined && { avatarUrl: dto.avatarUrl }),
          ...(dto.birthDay !== undefined && {
            birthDay: dto.birthDay ? new Date(dto.birthDay) : null,
          }),
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
          },
        },
      },
    });
  }

  async getDashboardStats(userId: string) {
    const profile = await this.prisma.recruiterProfile.findUnique({
      where: { userId },
      select: { id: true, companyId: true },
    });

    if (!profile) {
      throw new NotFoundException('Recruiter profile not found');
    }

    const recruiterJobFilter: Prisma.JobPostingWhereInput = profile.companyId
      ? {
          OR: [
            { recruiter: { companyId: profile.companyId } },
            { department: { companyId: profile.companyId } },
            { recruiterId: profile.id },
          ],
        }
      : { recruiterId: profile.id };

    const totalActiveJobs = await this.prisma.jobPosting.count({
      where: {
        ...recruiterJobFilter,
        status: 'PUBLISHED',
      },
    });

    const totalCandidates = await this.prisma.application.count({
      where: {
        job: recruiterJobFilter,
      },
    });

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const newApplicationsToday = await this.prisma.application.count({
      where: {
        job: recruiterJobFilter,
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
      select: { id: true, companyId: true },
    });

    if (!profile) {
      throw new NotFoundException('Recruiter profile not found');
    }

    const recruiterJobFilter: Prisma.JobPostingWhereInput = profile.companyId
      ? {
          OR: [
            { recruiter: { companyId: profile.companyId } },
            { department: { companyId: profile.companyId } },
            { recruiterId: profile.id },
          ],
        }
      : { recruiterId: profile.id };

    const jobWhere: Prisma.JobPostingWhereInput = {
      ...recruiterJobFilter,
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
        where: { ...recruiterJobFilter, status: 'PUBLISHED' },
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

  async getDashboardActionHub(userId: string, jobId?: string) {
    const profile = await this.prisma.recruiterProfile.findUnique({
      where: { userId },
      select: { id: true, companyId: true },
    });

    if (!profile) {
      throw new NotFoundException('Recruiter profile not found');
    }

    const recruiterJobFilter: Prisma.JobPostingWhereInput = profile.companyId
      ? {
          OR: [
            { recruiter: { companyId: profile.companyId } },
            { department: { companyId: profile.companyId } },
            { recruiterId: profile.id },
          ],
        }
      : { recruiterId: profile.id };

    const jobWhere: Prisma.JobPostingWhereInput = {
      ...recruiterJobFilter,
      ...(jobId ? { id: jobId } : {}),
    };

    const now = new Date();
    const startOfToday = new Date(now);
    startOfToday.setHours(0, 0, 0, 0);

    const endOfToday = new Date(now);
    endOfToday.setHours(23, 59, 59, 999);

    // Fetch active jobs with their applications and interview status in optimized parallel query
    const [
      openJobsCount,
      totalApplicationsCount,
      pendingApplicationsCount,
      rescheduleInterviewsCount,
      upcomingInterviewsCount,
      todayInterviewsRaw,
      upcomingInterviewsRaw,
      actionJobsRaw,
    ] = await Promise.all([
      // 1. Open Jobs Count
      this.prisma.jobPosting.count({
        where: { ...recruiterJobFilter, status: 'PUBLISHED' },
      }),

      // 2. Total Applications Count
      this.prisma.application.count({
        where: { job: jobWhere },
      }),

      // 3. Pending applications needing HR review
      this.prisma.application.count({
        where: {
          job: jobWhere,
          currentStage: { in: ['RECEIVED', 'SCREENING', 'SHORTLISTED', 'INTERVIEWED'] },
          hrDecision: 'PENDING',
        },
      }),

      // 3b. Reschedule requests from candidates needing HR response
      this.prisma.interview.count({
        where: {
          application: { job: jobWhere },
          candidateResponse: 'RESCHEDULE_REQUESTED',
          status: 'SCHEDULED',
        },
      }),

      // 4. Upcoming scheduled interviews count
      this.prisma.interview.count({
        where: {
          application: { job: jobWhere },
          status: { in: ['SCHEDULED', 'RESCHEDULED'] },
          scheduledAt: { gte: startOfToday },
        },
      }),

      // Today's interviews
      this.prisma.interview.findMany({
        where: {
          application: { job: jobWhere },
          status: { in: ['SCHEDULED', 'RESCHEDULED'] },
          scheduledAt: { gte: startOfToday, lte: endOfToday },
        },
        orderBy: { scheduledAt: 'asc' },
        include: {
          application: {
            select: {
              id: true,
              job: { select: { id: true, title: true, jobCode: true } },
              candidate: {
                select: {
                  id: true,
                  fullName: true,
                  email: true,
                  user: {
                    select: {
                      fullName: true,
                      avatarUrl: true,
                      email: true,
                    },
                  },
                },
              },
            },
          },
        },
      }),

      // Upcoming interviews (future days)
      this.prisma.interview.findMany({
        where: {
          application: { job: jobWhere },
          status: { in: ['SCHEDULED', 'RESCHEDULED'] },
          scheduledAt: { gt: endOfToday },
        },
        take: 10,
        orderBy: { scheduledAt: 'asc' },
        include: {
          application: {
            select: {
              id: true,
              job: { select: { id: true, title: true, jobCode: true } },
              candidate: {
                select: {
                  id: true,
                  fullName: true,
                  email: true,
                  user: {
                    select: {
                      fullName: true,
                      avatarUrl: true,
                      email: true,
                    },
                  },
                },
              },
            },
          },
        },
      }),

      // Action Queue: Published Jobs with workload breakdown
      this.prisma.jobPosting.findMany({
        where: {
          ...recruiterJobFilter,
          status: 'PUBLISHED',
          ...(jobId ? { id: jobId } : {}),
        },
        select: {
          id: true,
          jobCode: true,
          title: true,
          autoShortlistThreshold: true,
          department: {
            select: { name: true },
          },
          applications: {
            select: {
              id: true,
              currentStage: true,
              hrDecision: true,
              appliedAt: true,
              aiMatchingResults: {
                select: {
                  overallScore: true,
                  matchLevel: true,
                },
                orderBy: { version: 'desc' },
                take: 1,
              },
              interviews: {
                select: {
                  id: true,
                  candidateResponse: true,
                  status: true,
                },
              },
            },
          },
        },
        orderBy: { createdAt: 'desc' },
      }),
    ]);

    // Format action queue
    const actionQueue = actionJobsRaw
      .map((job) => {
        const threshold = Number(job.autoShortlistThreshold) || 80;
        let newCount = 0;
        let highMatchCount = 0;
        let pendingReviewCount = 0;
        let rescheduleCount = 0;

        job.applications.forEach((app) => {
          // New applications
          if (app.currentStage === 'RECEIVED') {
            newCount++;
          }

          // High match applications (AI score >= threshold or HIGH match)
          const latestAi = app.aiMatchingResults?.[0];
          const score = latestAi ? Number(latestAi.overallScore || 0) : 0;
          const matchLevel = latestAi?.matchLevel;
          if (
            (score >= threshold || matchLevel === 'HIGH') &&
            app.currentStage !== 'REJECTED' &&
            app.currentStage !== 'HIRED' &&
            app.currentStage !== 'WITHDRAWN'
          ) {
            highMatchCount++;
          }

          // Pending review count
          if (
            ['RECEIVED', 'SCREENING', 'SHORTLISTED', 'INTERVIEWED'].includes(
              app.currentStage,
            ) &&
            app.hrDecision === 'PENDING'
          ) {
            pendingReviewCount++;
          }

          // Reschedule count
          app.interviews.forEach((it) => {
            if (
              it.candidateResponse === 'RESCHEDULE_REQUESTED' &&
              it.status === 'SCHEDULED'
            ) {
              rescheduleCount++;
            }
          });
        });

        return {
          jobId: job.id,
          jobCode: job.jobCode,
          title: job.title,
          departmentName: job.department?.name || 'Tuyển dụng',
          totalApplications: job.applications.length,
          newCount,
          highMatchCount,
          pendingReviewCount,
          rescheduleCount,
          autoShortlistThreshold: threshold,
        };
      })
      .sort((a, b) => {
        // Sort jobs needing attention first
        const urgencyA =
          a.newCount * 3 +
          a.highMatchCount * 2 +
          a.rescheduleCount * 4 +
          a.pendingReviewCount;
        const urgencyB =
          b.newCount * 3 +
          b.highMatchCount * 2 +
          b.rescheduleCount * 4 +
          b.pendingReviewCount;
        return urgencyB - urgencyA;
      });

    const formatInterviewItem = (it: any) => {
      const candUser = it.application?.candidate?.user;
      const candProfile = it.application?.candidate;
      return {
        id: it.id,
        title: it.title,
        type: it.type,
        scheduledAt: it.scheduledAt,
        durationMinutes: it.durationMinutes,
        locationOrLink: it.locationOrLink,
        candidateResponse: it.candidateResponse,
        candidate: {
          id: candProfile?.id || '',
          fullName: candUser?.fullName || candProfile?.fullName || 'Ứng viên',
          avatarUrl: candUser?.avatarUrl || null,
          email: candUser?.email || candProfile?.email || '',
        },
        job: {
          id: it.application?.job?.id,
          title: it.application?.job?.title,
          jobCode: it.application?.job?.jobCode,
        },
      };
    };

    return {
      kpis: {
        openJobs: openJobsCount,
        totalApplications: totalApplicationsCount,
        pendingActions: pendingApplicationsCount + rescheduleInterviewsCount,
        upcomingInterviews: upcomingInterviewsCount,
      },
      todayInterviews: todayInterviewsRaw.map(formatInterviewItem),
      upcomingInterviews: upcomingInterviewsRaw.map(formatInterviewItem),
      actionQueue,
    };
  }
}
