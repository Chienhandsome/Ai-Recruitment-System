/* eslint-disable @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-return, @typescript-eslint/require-await */
import { BadRequestException, ConflictException } from '@nestjs/common';
import {
  ApplicationStage,
  InterviewConductedBy,
  InterviewMode,
  InterviewProcessStatus,
  InterviewPurpose,
  InterviewRoundStatus,
} from '@prisma/client';
import { ApplicationAccessService } from '../applications/application-access.service';
import { PrismaService } from '../../database/prisma.service';
import { InterviewProcessService } from './interview-process.service';

describe('InterviewProcessService', () => {
  let service: InterviewProcessService;
  let prisma: any;

  beforeEach(() => {
    prisma = {
      application: {
        findFirst: jest.fn(),
        update: jest.fn(),
      },
      interviewProcess: {
        create: jest.fn(),
        findFirst: jest.fn(),
        update: jest.fn(),
        updateMany: jest.fn().mockResolvedValue({ count: 1 }),
      },
      interviewRound: {
        create: jest.fn(),
        findFirst: jest.fn(),
        findMany: jest.fn(),
        update: jest.fn(),
        updateMany: jest.fn().mockResolvedValue({ count: 1 }),
        delete: jest.fn(),
      },
      applicationStatusHistory: { create: jest.fn() },
      $transaction: jest.fn(async (callback) => callback(prisma)),
    };
    const access = {
      recruiterApplicationWhere: jest
        .fn()
        .mockResolvedValue({ job: { recruiterId: 'rec-1' } }),
    };
    service = new InterviewProcessService(
      prisma as PrismaService,
      access as unknown as ApplicationAccessService,
    );
  });

  it('creates a draft process only once for a shortlisted application', async () => {
    prisma.application.findFirst.mockResolvedValue({
      id: 'app-1',
      currentStage: ApplicationStage.SHORTLISTED,
      interviewProcess: null,
    });
    prisma.interviewProcess.create.mockResolvedValue({
      id: 'process-1',
      applicationId: 'app-1',
      status: InterviewProcessStatus.DRAFT,
      rounds: [],
    });

    const result = await service.create('user-1', { applicationId: 'app-1' });

    expect(result.status).toBe(InterviewProcessStatus.DRAFT);
    expect(prisma.interviewProcess.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          applicationId: 'app-1',
          createdByUserId: 'user-1',
        }),
      }),
    );

    prisma.application.findFirst.mockResolvedValue({
      id: 'app-1',
      currentStage: ApplicationStage.SHORTLISTED,
      interviewProcess: { id: 'process-1' },
    });
    await expect(
      service.create('user-1', { applicationId: 'app-1' }),
    ).rejects.toThrow(ConflictException);
  });

  it('adds a round with the next sequential order', async () => {
    prisma.interviewProcess.findFirst.mockResolvedValue({
      id: 'process-1',
      applicationId: 'app-1',
      status: InterviewProcessStatus.DRAFT,
      application: { id: 'app-1', currentStage: ApplicationStage.SHORTLISTED },
    });
    prisma.interviewRound.findFirst.mockResolvedValue({ order: 2 });
    prisma.interviewRound.create.mockResolvedValue({
      id: 'round-3',
      processId: 'process-1',
      order: 3,
      resultScore: null,
      interviews: [],
      aiInterviewSessions: [],
    });

    const result = await service.addRound('user-1', 'process-1', {
      title: 'Phỏng vấn kỹ thuật',
      conductedBy: InterviewConductedBy.HUMAN,
      mode: InterviewMode.VIDEO_CALL,
      purpose: InterviewPurpose.TECHNICAL,
    });

    expect(result.order).toBe(3);
    expect(prisma.interviewRound.create).toHaveBeenCalledWith(
      expect.objectContaining({ data: expect.objectContaining({ order: 3 }) }),
    );
  });

  it('activates the first round and moves the application into interviewing', async () => {
    prisma.interviewProcess.findFirst.mockResolvedValue({
      id: 'process-1',
      applicationId: 'app-1',
      status: InterviewProcessStatus.DRAFT,
      application: { id: 'app-1', currentStage: ApplicationStage.SHORTLISTED },
    });
    prisma.interviewRound.findMany.mockResolvedValue([
      { id: 'round-1', order: 1 },
      { id: 'round-2', order: 2 },
    ]);
    prisma.interviewProcess.findFirst
      .mockResolvedValueOnce({
        id: 'process-1',
        applicationId: 'app-1',
        status: InterviewProcessStatus.DRAFT,
        application: {
          id: 'app-1',
          currentStage: ApplicationStage.SHORTLISTED,
        },
      })
      .mockResolvedValueOnce({
        id: 'process-1',
        applicationId: 'app-1',
        status: InterviewProcessStatus.ACTIVE,
        rounds: [],
      });

    await service.activate('user-1', 'process-1');

    expect(prisma.interviewRound.update).toHaveBeenCalledWith({
      where: { id: 'round-1' },
      data: { status: InterviewRoundStatus.READY },
    });
    expect(prisma.application.update).toHaveBeenCalledWith({
      where: { id: 'app-1' },
      data: {
        currentStage: ApplicationStage.INTERVIEW_SCHEDULED,
        hrDecision: 'CONSIDER',
      },
    });
  });

  it('opens the next round without completing the application', async () => {
    prisma.interviewRound.findFirst
      .mockResolvedValueOnce({
        id: 'round-1',
        processId: 'process-1',
        order: 1,
        title: 'Vòng AI',
        status: InterviewRoundStatus.AWAITING_REVIEW,
        process: {
          id: 'process-1',
          applicationId: 'app-1',
          application: {
            id: 'app-1',
            currentStage: ApplicationStage.INTERVIEW_SCHEDULED,
          },
        },
      })
      .mockResolvedValueOnce({ id: 'round-2', order: 2 });
    prisma.interviewProcess.findFirst.mockResolvedValue({
      id: 'process-1',
      applicationId: 'app-1',
      status: InterviewProcessStatus.ACTIVE,
      rounds: [],
    });

    await service.decide('user-1', 'round-1', {
      decision: 'PASSED' as any,
      score: 82,
    });

    expect(prisma.interviewRound.update).toHaveBeenCalledWith({
      where: { id: 'round-2' },
      data: { status: InterviewRoundStatus.READY },
    });
    expect(prisma.application.update).not.toHaveBeenCalled();
  });

  it('completes the process and application after the final round passes', async () => {
    prisma.interviewRound.findFirst
      .mockResolvedValueOnce({
        id: 'round-2',
        processId: 'process-1',
        order: 2,
        title: 'Vòng cuối',
        status: InterviewRoundStatus.AWAITING_REVIEW,
        process: {
          id: 'process-1',
          applicationId: 'app-1',
          application: {
            id: 'app-1',
            currentStage: ApplicationStage.INTERVIEW_SCHEDULED,
          },
        },
      })
      .mockResolvedValueOnce(null);
    prisma.interviewProcess.findFirst.mockResolvedValue({
      id: 'process-1',
      applicationId: 'app-1',
      status: InterviewProcessStatus.COMPLETED,
      rounds: [],
    });

    await service.decide('user-1', 'round-2', {
      decision: 'PASSED' as any,
      score: 88,
    });

    expect(prisma.interviewProcess.update).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { id: 'process-1' },
        data: expect.objectContaining({
          status: InterviewProcessStatus.COMPLETED,
        }),
      }),
    );
    expect(prisma.application.update).toHaveBeenCalledWith({
      where: { id: 'app-1' },
      data: {
        currentStage: ApplicationStage.INTERVIEWED,
        hrDecision: 'CONSIDER',
      },
    });
  });

  it('rejects the application and cancels the remaining process after a failed round', async () => {
    prisma.interviewRound.findFirst.mockResolvedValue({
      id: 'round-1',
      processId: 'process-1',
      order: 1,
      title: 'Vòng AI',
      status: InterviewRoundStatus.AWAITING_REVIEW,
      process: {
        id: 'process-1',
        status: InterviewProcessStatus.ACTIVE,
        applicationId: 'app-1',
        application: {
          id: 'app-1',
          currentStage: ApplicationStage.INTERVIEW_SCHEDULED,
        },
      },
    });
    prisma.interviewProcess.findFirst.mockResolvedValue({
      id: 'process-1',
      applicationId: 'app-1',
      status: InterviewProcessStatus.CANCELLED,
      currentRoundOrder: null,
      rounds: [],
    });

    await service.decide('user-1', 'round-1', {
      decision: 'FAILED' as any,
      score: 42,
      note: 'Chưa đáp ứng yêu cầu chuyên môn.',
    });

    expect(prisma.interviewProcess.update).toHaveBeenCalledWith({
      where: { id: 'process-1' },
      data: expect.objectContaining({
        status: InterviewProcessStatus.CANCELLED,
        currentRoundOrder: null,
      }),
    });
    expect(prisma.interviewRound.updateMany).toHaveBeenCalledWith(
      expect.objectContaining({
        data: { status: InterviewRoundStatus.CANCELLED },
      }),
    );
    expect(prisma.application.update).toHaveBeenCalledWith({
      where: { id: 'app-1' },
      data: {
        currentStage: ApplicationStage.REJECTED,
        hrDecision: 'REJECTED',
        hrNotes: 'Chưa đáp ứng yêu cầu chuyên môn.',
      },
    });
  });

  it('requires a reason before rejecting an application', async () => {
    prisma.interviewRound.findFirst.mockResolvedValue({
      id: 'round-1',
      processId: 'process-1',
      order: 1,
      title: 'Vòng AI',
      status: InterviewRoundStatus.AWAITING_REVIEW,
      process: {
        id: 'process-1',
        status: InterviewProcessStatus.ACTIVE,
        applicationId: 'app-1',
        application: {
          id: 'app-1',
          currentStage: ApplicationStage.INTERVIEW_SCHEDULED,
        },
      },
    });

    await expect(
      service.decide('user-1', 'round-1', {
        decision: 'FAILED' as any,
      }),
    ).rejects.toThrow(BadRequestException);
    expect(prisma.interviewRound.updateMany).not.toHaveBeenCalled();
  });

  it('rejects a stale decision when another recruiter already handled the round', async () => {
    prisma.interviewRound.findFirst
      .mockResolvedValueOnce({
        id: 'round-1',
        processId: 'process-1',
        order: 1,
        title: 'Vòng AI',
        status: InterviewRoundStatus.AWAITING_REVIEW,
        process: {
          id: 'process-1',
          status: InterviewProcessStatus.ACTIVE,
          applicationId: 'app-1',
          application: {
            id: 'app-1',
            currentStage: ApplicationStage.INTERVIEW_SCHEDULED,
          },
        },
      })
      .mockResolvedValueOnce(null);
    prisma.interviewRound.updateMany.mockResolvedValueOnce({ count: 0 });

    await expect(
      service.decide('user-2', 'round-1', {
        decision: 'PASSED' as any,
        score: 80,
      }),
    ).rejects.toThrow(ConflictException);
    expect(prisma.interviewProcess.update).not.toHaveBeenCalled();
    expect(prisma.application.update).not.toHaveBeenCalled();
  });

  it('reopens an awaiting-review round without rejecting the application', async () => {
    prisma.interviewRound.findFirst.mockResolvedValue({
      id: 'round-1',
      processId: 'process-1',
      order: 1,
      title: 'Vòng AI',
      status: InterviewRoundStatus.AWAITING_REVIEW,
      process: {
        id: 'process-1',
        status: InterviewProcessStatus.ACTIVE,
        applicationId: 'app-1',
        application: {
          id: 'app-1',
          currentStage: ApplicationStage.INTERVIEW_SCHEDULED,
        },
      },
    });
    prisma.interviewProcess.findFirst.mockResolvedValue({
      id: 'process-1',
      applicationId: 'app-1',
      status: InterviewProcessStatus.ACTIVE,
      rounds: [],
    });

    await service.retry('user-1', 'round-1');

    expect(prisma.interviewRound.update).toHaveBeenCalledWith({
      where: { id: 'round-1' },
      data: {
        status: InterviewRoundStatus.READY,
        resultScore: null,
        decisionNote: null,
        decidedByUserId: null,
        decidedAt: null,
      },
    });
    expect(prisma.application.update).not.toHaveBeenCalled();
    expect(prisma.applicationStatusHistory.create).toHaveBeenCalledWith({
      data: expect.objectContaining({
        applicationId: 'app-1',
        note: 'HR yêu cầu thực hiện lại Vòng AI.',
      }),
    });
  });
});
