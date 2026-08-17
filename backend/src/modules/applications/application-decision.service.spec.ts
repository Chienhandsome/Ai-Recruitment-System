/* eslint-disable @typescript-eslint/no-unsafe-assignment */
import {
  ApplicationProcessingStatus,
  ApplicationStage,
  HrDecision,
  MatchLevel,
} from '@prisma/client';
import { BadRequestException, ConflictException } from '@nestjs/common';
import { ApplicationsService } from './applications.service';
import {
  ApplicationSortBy,
  SortOrder,
} from './dto/query-recruiter-applications.dto';

function createStageDependencies(stage = ApplicationStage.SCREENING) {
  const application = {
    id: 'application-1',
    currentStage: stage,
    hrNotes: null,
  };
  const tx = {
    application: {
      updateMany: jest.fn().mockResolvedValue({ count: 1 }),
      findUniqueOrThrow: jest.fn().mockResolvedValue({
        id: 'application-1',
        currentStage: ApplicationStage.SHORTLISTED,
        hrDecision: HrDecision.ACCEPTED,
        hrNotes: 'Call this week',
        updatedAt: new Date('2026-08-17T10:05:00.000Z'),
      }),
    },
    applicationStatusHistory: {
      create: jest.fn().mockResolvedValue({
        id: 'history-1',
        note: 'Strong required skills',
        changedByUserId: '11111111-1111-4111-8111-111111111111',
        createdAt: new Date('2026-08-17T10:05:00.000Z'),
      }),
    },
  };
  const prisma = {
    application: { findFirst: jest.fn().mockResolvedValue(application) },
    $transaction: jest.fn(
      async (callback: (client: typeof tx) => Promise<unknown>) => callback(tx),
    ),
  };
  const access = {
    recruiterApplicationWhere: jest
      .fn()
      .mockResolvedValue({ job: { recruiterId: 'recruiter-1' } }),
  };
  return { prisma, access, tx };
}

describe('ApplicationsService decision workflow', () => {
  it('atomically updates stage, HR decision and history', async () => {
    const { prisma, access, tx } = createStageDependencies();
    const service = new ApplicationsService(
      prisma as never,
      {} as never,
      access as never,
    );

    const result = await service.updateStage(
      '11111111-1111-4111-8111-111111111111',
      'application-1',
      {
        expectedStage: ApplicationStage.SCREENING,
        targetStage: ApplicationStage.SHORTLISTED,
        note: 'Strong required skills',
        hrNotes: 'Call this week',
      },
    );

    expect(tx.application.updateMany).toHaveBeenCalledWith({
      where: {
        id: 'application-1',
        currentStage: ApplicationStage.SCREENING,
      },
      data: {
        currentStage: ApplicationStage.SHORTLISTED,
        hrDecision: HrDecision.ACCEPTED,
        hrNotes: 'Call this week',
      },
    });
    expect(tx.applicationStatusHistory.create).toHaveBeenCalledWith({
      data: expect.objectContaining({
        applicationId: 'application-1',
        previousStage: ApplicationStage.SCREENING,
        newStage: ApplicationStage.SHORTLISTED,
      }),
      select: expect.any(Object),
    });
    expect(result.allowedTransitions).toEqual([
      ApplicationStage.SCREENING,
      ApplicationStage.OFFERED,
      ApplicationStage.REJECTED,
    ]);
  });

  it('rejects a stale expected stage before entering a transaction', async () => {
    const { prisma, access } = createStageDependencies(
      ApplicationStage.SHORTLISTED,
    );
    const service = new ApplicationsService(
      prisma as never,
      {} as never,
      access as never,
    );

    await expect(
      service.updateStage('user-1', 'application-1', {
        expectedStage: ApplicationStage.SCREENING,
        targetStage: ApplicationStage.SHORTLISTED,
      }),
    ).rejects.toBeInstanceOf(ConflictException);
    expect(prisma.$transaction).not.toHaveBeenCalled();
  });

  it('requires a note before rejecting a candidate', async () => {
    const { prisma, access } = createStageDependencies();
    const service = new ApplicationsService(
      prisma as never,
      {} as never,
      access as never,
    );

    await expect(
      service.updateStage('user-1', 'application-1', {
        expectedStage: ApplicationStage.SCREENING,
        targetStage: ApplicationStage.REJECTED,
      }),
    ).rejects.toBeInstanceOf(BadRequestException);
    expect(prisma.$transaction).not.toHaveBeenCalled();
  });

  it('sorts the complete scoped result before applying pagination', async () => {
    const row = (id: string, score: number) => ({
      id,
      currentStage: ApplicationStage.SCREENING,
      hrDecision: HrDecision.CONSIDER,
      processingStatus: ApplicationProcessingStatus.COMPLETED,
      appliedAt: new Date('2026-08-17T10:00:00.000Z'),
      updatedAt: new Date('2026-08-17T10:00:00.000Z'),
      job: { id: 'job-1', jobCode: 'JOB-1', title: 'Engineer' },
      candidate: {
        id: `candidate-${id}`,
        desiredTitle: 'Engineer',
        user: {
          fullName: `Candidate ${id}`,
          email: `${id}@example.com`,
          avatarUrl: null,
        },
      },
      aiMatchingResults: [
        {
          overallScore: score,
          matchLevel: MatchLevel.HIGH,
          confidenceScore: 0.9,
          version: 1,
        },
      ],
    });
    const prisma = {
      application: {
        findMany: jest
          .fn()
          .mockResolvedValue([row('low', 40), row('high', 90), row('mid', 70)]),
      },
    };
    const access = {
      recruiterApplicationWhere: jest.fn().mockResolvedValue({}),
    };
    const service = new ApplicationsService(
      prisma as never,
      {} as never,
      access as never,
    );

    const result = await service.findAllForRecruiter('user-1', {
      sortBy: ApplicationSortBy.AI_SCORE,
      sortOrder: SortOrder.DESC,
      page: 2,
      limit: 2,
    });

    expect(result.data.map((item) => item.id)).toEqual(['low']);
    expect(result.meta).toEqual({
      total: 3,
      page: 2,
      limit: 2,
      totalPages: 2,
    });
  });

  it('returns a candidate-safe application summary', async () => {
    const prisma = {
      application: {
        count: jest.fn().mockResolvedValue(1),
        findMany: jest.fn().mockResolvedValue([
          {
            id: 'application-1',
            currentStage: ApplicationStage.REJECTED,
            processingStatus: ApplicationProcessingStatus.COMPLETED,
            appliedAt: new Date('2026-08-17T10:00:00.000Z'),
            updatedAt: new Date('2026-08-17T11:00:00.000Z'),
            job: {
              id: 'job-1',
              title: 'Engineer',
              location: 'Ho Chi Minh City',
              recruiter: {
                company: { id: 'company-1', name: 'Example Co' },
              },
            },
          },
        ]),
      },
    };
    const access = {
      candidateProfileId: jest.fn().mockResolvedValue('candidate-1'),
    };
    const service = new ApplicationsService(
      prisma as never,
      {} as never,
      access as never,
    );

    const result = await service.findMine('candidate-user-1', {
      page: 1,
      limit: 20,
    });

    expect(result.data[0]).toEqual(
      expect.not.objectContaining({
        hrDecision: expect.anything(),
        hrNotes: expect.anything(),
        latestAiResult: expect.anything(),
        statusHistories: expect.anything(),
      }),
    );
  });
});
