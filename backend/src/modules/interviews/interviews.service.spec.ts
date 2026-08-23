import { Test, TestingModule } from '@nestjs/testing';
import { NotFoundException } from '@nestjs/common';
import { ApplicationStage, InterviewStatus, InterviewType } from '@prisma/client';
import { InterviewsService } from './interviews.service';
import { PrismaService } from '../../database/prisma.service';
import { ApplicationAccessService } from '../applications/application-access.service';

describe('InterviewsService', () => {
  let service: InterviewsService;
  let prisma: any;
  let accessService: any;

  beforeEach(async () => {
    prisma = {
      application: {
        findFirst: jest.fn(),
        update: jest.fn(),
      },
      interview: {
        create: jest.fn(),
        findMany: jest.fn(),
        findFirst: jest.fn(),
        findUnique: jest.fn(),
        update: jest.fn(),
        count: jest.fn(),
      },
      applicationStatusHistory: {
        create: jest.fn(),
      },
      $transaction: jest.fn(async (cb) => cb(prisma)),
    };

    accessService = {
      recruiterApplicationWhere: jest.fn().mockResolvedValue({}),
      candidateProfileId: jest.fn().mockResolvedValue('cand-123'),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        InterviewsService,
        { provide: PrismaService, useValue: prisma },
        { provide: ApplicationAccessService, useValue: accessService },
      ],
    }).compile();

    service = module.get<InterviewsService>(InterviewsService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('create', () => {
    it('schedules an interview and advances application stage to INTERVIEW_SCHEDULED', () => {
      const mockApp = {
        id: 'app-1',
        currentStage: ApplicationStage.SHORTLISTED,
        job: { id: 'job-1', title: 'Senior Frontend Engineer', jobCode: 'JOB-001' },
        candidate: {
          id: 'cand-1',
          user: { id: 'user-1', fullName: 'Nguyen Van A', email: 'a@example.com', phone: '0901234567' },
        },
      };

      prisma.application.findFirst.mockResolvedValue(mockApp);
      prisma.interview.create.mockResolvedValue({
        id: 'int-1',
        applicationId: 'app-1',
        title: 'Phỏng vấn Vòng 1',
        type: InterviewType.TECHNICAL,
        status: InterviewStatus.SCHEDULED,
        scheduledAt: new Date('2026-09-01T10:00:00Z'),
        durationMinutes: 60,
        locationOrLink: 'https://meet.google.com/abc-defg-hij',
        interviewerNotes: null,
        score: null,
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      return service
        .create('recruiter-user-1', {
          applicationId: 'app-1',
          title: 'Phỏng vấn Vòng 1',
          type: InterviewType.TECHNICAL,
          scheduledAt: '2026-09-01T10:00:00Z',
          durationMinutes: 60,
          locationOrLink: 'https://meet.google.com/abc-defg-hij',
        })
        .then((result) => {
          expect(result.id).toBe('int-1');
          expect(result.title).toBe('Phỏng vấn Vòng 1');
          expect(prisma.application.update).toHaveBeenCalledWith({
            where: { id: 'app-1' },
            data: {
              currentStage: ApplicationStage.INTERVIEW_SCHEDULED,
              hrDecision: 'ACCEPTED',
            },
          });
          expect(prisma.applicationStatusHistory.create).toHaveBeenCalled();
        });
    });

    it('throws NotFoundException when application does not exist or recruiter is unauthorized', () => {
      prisma.application.findFirst.mockResolvedValue(null);

      return expect(
        service.create('recruiter-user-1', {
          applicationId: 'non-existent',
          title: 'Phỏng vấn',
          scheduledAt: '2026-09-01T10:00:00Z',
        }),
      ).rejects.toThrow(NotFoundException);
    });
  });

  describe('submitFeedback', () => {
    it('saves score, notes and moves application to INTERVIEWED', () => {
      const mockInterview = {
        id: 'int-1',
        applicationId: 'app-1',
        application: {
          id: 'app-1',
          currentStage: ApplicationStage.INTERVIEW_SCHEDULED,
        },
      };

      prisma.interview.findFirst.mockResolvedValue(mockInterview);
      prisma.interview.update.mockResolvedValue({
        id: 'int-1',
        score: 85,
        interviewerNotes: 'Ứng viên đạt yêu cầu chuyên môn tốt.',
        status: InterviewStatus.COMPLETED,
      });

      return service
        .submitFeedback('recruiter-user-1', 'int-1', {
          score: 85,
          interviewerNotes: 'Ứng viên đạt yêu cầu chuyên môn tốt.',
          nextStage: ApplicationStage.INTERVIEWED,
        })
        .then((result) => {
          expect(result.score).toBe(85);
          expect(result.applicationStage).toBe(ApplicationStage.INTERVIEWED);
          expect(prisma.application.update).toHaveBeenCalledWith({
            where: { id: 'app-1' },
            data: {
              currentStage: ApplicationStage.INTERVIEWED,
              hrDecision: 'ACCEPTED',
            },
          });
        });
    });
  });
});
