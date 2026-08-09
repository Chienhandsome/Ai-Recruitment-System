/* eslint-disable @typescript-eslint/no-unsafe-assignment */
import { RetryApplicationEvaluationsUseCase } from './retry-application-evaluations.use-case';

describe('RetryApplicationEvaluationsUseCase', () => {
  it('atomically claims and republishes eligible failed applications', async () => {
    const now = new Date('2026-08-09T10:00:00.000Z');
    const application = {
      id: 'application-1',
      processingStatus: 'FAILED',
      evaluationAttempts: 1,
      updatedAt: new Date('2026-08-09T09:58:00.000Z'),
      profileSnapshot: { schemaVersion: 1 },
    };
    const prisma = {
      application: {
        updateMany: jest
          .fn()
          .mockResolvedValueOnce({ count: 0 })
          .mockResolvedValueOnce({ count: 1 }),
        findMany: jest.fn().mockResolvedValue([application]),
      },
    };
    const evaluationService = {
      publishClaimedApplication: jest.fn().mockResolvedValue(true),
    };
    const useCase = new RetryApplicationEvaluationsUseCase(
      prisma as never,
      evaluationService as never,
    );

    await expect(useCase.execute(now)).resolves.toBe(1);

    expect(prisma.application.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({ evaluationAttempts: { lt: 5 } }),
      }),
    );
    expect(prisma.application.updateMany).toHaveBeenNthCalledWith(
      2,
      expect.objectContaining({
        where: expect.objectContaining({
          id: application.id,
          processingStatus: application.processingStatus,
          evaluationAttempts: application.evaluationAttempts,
          updatedAt: application.updatedAt,
        }),
        data: expect.objectContaining({ evaluationAttempts: { increment: 1 } }),
      }),
    );
    expect(evaluationService.publishClaimedApplication).toHaveBeenCalledWith(
      application.id,
      application.profileSnapshot,
      2,
      now,
    );
  });
});
