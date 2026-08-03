import { RetryStuckResumesUseCase } from './retry-stuck-resumes.use-case';

describe('RetryStuckResumesUseCase', () => {
  it('moves a stuck resume to PROCESSING only after a successful publish', async () => {
    const resume = {
      id: 'resume',
      candidateId: 'candidate',
      objectPath: 'candidate/resume.pdf',
      mimeType: 'application/pdf',
      originalFileName: 'resume.pdf',
    };
    const prisma = {
      resume: {
        findMany: jest.fn().mockResolvedValue([resume]),
        updateMany: jest.fn().mockResolvedValue({ count: 1 }),
      },
      candidateProfile: {
        updateMany: jest.fn().mockResolvedValue({ count: 1 }),
      },
      $transaction: jest.fn().mockResolvedValue(undefined),
    } as any;
    const rabbitMQ = { publish: jest.fn().mockResolvedValue(true) } as any;
    const useCase = new RetryStuckResumesUseCase(prisma, rabbitMQ);

    await expect(
      useCase.execute(new Date('2026-08-03T00:20:00Z')),
    ).resolves.toBe(1);

    expect(rabbitMQ.publish).toHaveBeenCalled();
    expect(prisma.resume.updateMany).toHaveBeenCalledWith({
      where: { id: 'resume', parsingStatus: 'PENDING' },
      data: { parsingStatus: 'PROCESSING' },
    });
    expect(prisma.candidateProfile.updateMany).toHaveBeenCalledWith({
      where: { id: 'candidate', primaryResumeId: 'resume' },
      data: { status: 'PROCESSING' },
    });
  });

  it('leaves the resume PENDING when publish fails', async () => {
    const prisma = {
      resume: {
        findMany: jest.fn().mockResolvedValue([
          {
            id: 'resume',
            candidateId: 'candidate',
            objectPath: 'candidate/resume.pdf',
            mimeType: 'application/pdf',
            originalFileName: 'resume.pdf',
          },
        ]),
        updateMany: jest.fn(),
      },
      candidateProfile: { updateMany: jest.fn() },
      $transaction: jest.fn(),
    } as any;
    const rabbitMQ = { publish: jest.fn().mockResolvedValue(false) } as any;
    const useCase = new RetryStuckResumesUseCase(prisma, rabbitMQ);

    await expect(useCase.execute()).resolves.toBe(0);
    expect(prisma.$transaction).not.toHaveBeenCalled();
  });
});
