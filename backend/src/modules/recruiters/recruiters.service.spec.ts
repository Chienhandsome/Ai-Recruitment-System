import { Test, TestingModule } from '@nestjs/testing';
import { NotFoundException } from '@nestjs/common';
import { RecruitersService } from './recruiters.service';
import { PrismaService } from '../../database/prisma.service';

describe('RecruitersService', () => {
  let service: RecruitersService;
  let prisma: {
    recruiterProfile: {
      findUnique: jest.Mock;
      create: jest.Mock;
      upsert: jest.Mock;
    };
    jobPosting: {
      count: jest.Mock;
    };
    application: {
      count: jest.Mock;
      groupBy: jest.Mock;
    };
    aiMatchingResult: {
      findMany: jest.Mock;
    };
    interview: {
      count: jest.Mock;
      findMany: jest.Mock;
    };
    jobSkill: {
      findMany: jest.Mock;
    };
  };

  beforeEach(async () => {
    prisma = {
      recruiterProfile: {
        findUnique: jest.fn(),
        create: jest.fn(),
        upsert: jest.fn(),
      },
      jobPosting: {
        count: jest.fn(),
      },
      application: {
        count: jest.fn(),
        groupBy: jest.fn(),
      },
      aiMatchingResult: {
        findMany: jest.fn(),
      },
      interview: {
        count: jest.fn(),
        findMany: jest.fn(),
      },
      jobSkill: {
        findMany: jest.fn(),
      },
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        RecruitersService,
        { provide: PrismaService, useValue: prisma },
      ],
    }).compile();

    service = module.get<RecruitersService>(RecruitersService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('getDashboardAnalytics', () => {
    it('throws NotFoundException when recruiter profile does not exist', async () => {
      prisma.recruiterProfile.findUnique.mockResolvedValue(null);

      await expect(service.getDashboardAnalytics('user-1')).rejects.toThrow(
        NotFoundException,
      );
    });

    it('returns empty analytics when recruiter has no companyId', async () => {
      prisma.recruiterProfile.findUnique.mockResolvedValue({ companyId: null });

      const result = await service.getDashboardAnalytics('user-1');

      expect(result.kpis.totalActiveJobs).toBe(0);
      expect(result.funnel).toHaveLength(7);
      expect(result.scoreDistribution).toHaveLength(5);
    });

    it('calculates comprehensive analytics and funnel metrics correctly', async () => {
      prisma.recruiterProfile.findUnique.mockResolvedValue({
        companyId: 'company-1',
      });
      prisma.jobPosting.count.mockResolvedValue(5);
      prisma.application.count
        .mockResolvedValueOnce(20) // totalApplications
        .mockResolvedValueOnce(3) // newApplicationsToday
        .mockResolvedValueOnce(8) // newApplicationsThisWeek
        .mockResolvedValueOnce(2); // totalHired
      prisma.interview.count.mockResolvedValue(6);

      prisma.application.groupBy.mockResolvedValue([
        { currentStage: 'SCREENING', _count: { id: 5 } },
        { currentStage: 'SHORTLISTED', _count: { id: 8 } },
        { currentStage: 'INTERVIEW_SCHEDULED', _count: { id: 4 } },
        { currentStage: 'INTERVIEWED', _count: { id: 2 } },
        { currentStage: 'OFFERED', _count: { id: 3 } },
        { currentStage: 'HIRED', _count: { id: 2 } },
        { currentStage: 'REJECTED', _count: { id: 4 } },
      ]);

      prisma.aiMatchingResult.findMany.mockResolvedValue([
        { overallScore: 85, matchedSkills: ['React', 'TypeScript'] },
        { overallScore: 70, matchedSkills: ['React'] },
        { overallScore: 92, matchedSkills: ['React', 'Node.js'] },
      ]);

      prisma.interview.findMany.mockResolvedValue([
        {
          id: 'int-1',
          title: 'Vòng 1 - Kỹ thuật',
          type: 'ONLINE',
          scheduledAt: new Date('2026-08-25T09:00:00Z'),
          durationMinutes: 60,
          locationOrLink: 'https://meet.google.com/abc-xyz',
          application: {
            id: 'app-1',
            job: { id: 'job-1', title: 'Senior Frontend Engineer' },
            candidate: {
              id: 'cand-1',
              user: {
                fullName: 'Nguyễn Văn A',
                avatarUrl: null,
                email: 'a@example.com',
                phone: '0901234567',
              },
            },
          },
        },
      ]);

      prisma.jobSkill.findMany.mockResolvedValue([
        { skill: { id: 's1', name: 'React' }, requirementType: 'MANDATORY' },
        { skill: { id: 's2', name: 'TypeScript' }, requirementType: 'MANDATORY' },
      ]);

      const result = await service.getDashboardAnalytics('user-1');

      expect(result.kpis.totalActiveJobs).toBe(5);
      expect(result.kpis.totalApplications).toBe(20);
      expect(result.kpis.avgAiScore).toBe(82.3);
      expect(result.kpis.hireConversionRate).toBe(10); // (2/20)*100
      expect(result.funnel).toHaveLength(7);
      expect(result.upcomingInterviews).toHaveLength(1);
      expect(result.upcomingInterviews[0].candidate.fullName).toBe('Nguyễn Văn A');
      expect(result.topSkills.length).toBeGreaterThan(0);
    });
  });
});
