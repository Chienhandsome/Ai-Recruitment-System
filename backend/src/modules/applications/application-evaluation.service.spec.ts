/* eslint-disable @typescript-eslint/no-unsafe-assignment */
import { ApplicationEvaluationService } from './application-evaluation.service';

const now = new Date('2026-08-09T10:00:00.000Z');
const profileSnapshot = {
  schemaVersion: 1,
  capturedAt: now.toISOString(),
  candidateIdentity: {
    id: 'candidate-1',
    userId: 'user-1',
    fullName: 'Candidate',
    email: 'candidate@example.com',
    phone: null,
  },
  resume: {
    id: 'resume-1',
    source: 'CANDIDATE_UPLOAD',
    originalFileName: 'resume.pdf',
    mimeType: 'application/pdf',
    fileSizeBytes: 100,
    parsingStatus: 'PARSED',
    createdAt: now.toISOString(),
  },
  evaluationInput: {
    candidate_profile: { profile: { id: 'candidate-1' } },
    job: { id: 'job-1', title: 'Engineer' },
    weights: { skills: 40, experience: 30, education: 15, other: 15 },
  },
};

describe('ApplicationEvaluationService', () => {
  it('persists the first attempt and publishes the stored snapshot', async () => {
    const prisma = {
      application: {
        update: jest.fn().mockResolvedValue({
          evaluationAttempts: 1,
          profileSnapshot,
        }),
        updateMany: jest.fn(),
      },
    };
    const rabbitMQ = { publish: jest.fn().mockResolvedValue(true) };
    const service = new ApplicationEvaluationService(
      prisma as never,
      rabbitMQ as never,
    );

    await expect(
      service.dispatchNewApplication('application-1', now),
    ).resolves.toBe(true);

    expect(rabbitMQ.publish).toHaveBeenCalledWith(
      'evaluation.requested',
      expect.objectContaining({
        applicationId: 'application-1',
        application_id: 'application-1',
        candidate_profile: profileSnapshot.evaluationInput.candidate_profile,
        job: profileSnapshot.evaluationInput.job,
      }),
    );
  });

  it('stores exponential retry state when RabbitMQ is unavailable', async () => {
    const prisma = {
      application: {
        update: jest.fn().mockResolvedValue({
          evaluationAttempts: 1,
          profileSnapshot,
        }),
        updateMany: jest.fn().mockResolvedValue({ count: 1 }),
      },
    };
    const rabbitMQ = { publish: jest.fn().mockResolvedValue(false) };
    const service = new ApplicationEvaluationService(
      prisma as never,
      rabbitMQ as never,
    );

    await expect(
      service.dispatchNewApplication('application-1', now),
    ).resolves.toBe(false);

    expect(prisma.application.updateMany).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          processingStatus: 'FAILED',
          nextEvaluationRetryAt: new Date('2026-08-09T10:01:00.000Z'),
        }),
      }),
    );
  });

  it('stops scheduling after the maximum number of attempts', async () => {
    const prisma = {
      application: {
        updateMany: jest.fn().mockResolvedValue({ count: 1 }),
      },
    };
    const service = new ApplicationEvaluationService(
      prisma as never,
      { publish: jest.fn() } as never,
    );

    await service.markForRetry('application-1', 'AI failed', 5, now);

    expect(prisma.application.updateMany).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          nextEvaluationRetryAt: null,
          evaluationError: expect.stringContaining('retry limit reached'),
        }),
      }),
    );
  });
});
