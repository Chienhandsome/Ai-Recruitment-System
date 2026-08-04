import { RetryStuckResumesUseCase } from './retry-stuck-resumes.use-case';

describe('RetryStuckResumesUseCase', () => {
  it('claims a stuck resume before republishing it', async () => {
    const resume = {
      id: 'resume',
      candidateId: 'candidate',
      objectPath: 'candidate/resume.pdf',
      mimeType: 'application/pdf',
      originalFileName: 'resume.pdf',
      parsingStatus: 'PENDING',
    };
    const prisma = {
      resume: {
        findMany: jest.fn().mockResolvedValue([resume]),
        updateMany: jest.fn().mockResolvedValue({ count: 1 }),
      },
      candidateProfile: {
        findUnique: jest.fn().mockResolvedValue({ primaryResumeId: 'resume' }),
        updateMany: jest.fn().mockResolvedValue({ count: 1 }),
      },
    } as any;
    const rabbitMQ = { publish: jest.fn().mockResolvedValue(true) } as any;
    const storage = {
      createSignedDownloadUrl: jest.fn().mockResolvedValue({
        signedUrl: 'https://storage.example/retry',
      }),
    } as any;
    const useCase = new RetryStuckResumesUseCase(prisma, rabbitMQ, storage);

    await expect(
      useCase.execute(new Date('2026-08-03T00:20:00Z')),
    ).resolves.toBe(1);

    expect(rabbitMQ.publish).toHaveBeenCalledWith(
      expect.any(String),
      expect.objectContaining({
        signedDownloadUrl: 'https://storage.example/retry',
      }),
    );
    expect(prisma.resume.updateMany).toHaveBeenCalledWith({
      where: {
        id: 'resume',
        parsingStatus: 'PENDING',
        createdAt: { lte: new Date('2026-08-03T00:10:00.000Z') },
      },
      data: {
        parsingStatus: 'PROCESSING',
        parsingErrorMessage: null,
        updatedAt: new Date('2026-08-03T00:20:00.000Z'),
      },
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
            parsingStatus: 'PENDING',
          },
        ]),
        updateMany: jest.fn().mockResolvedValue({ count: 1 }),
      },
      candidateProfile: {
        findUnique: jest.fn().mockResolvedValue({ primaryResumeId: 'resume' }),
        updateMany: jest.fn(),
      },
    } as any;
    const rabbitMQ = { publish: jest.fn().mockResolvedValue(false) } as any;
    const storage = {
      createSignedDownloadUrl: jest.fn().mockResolvedValue({
        signedUrl: 'https://storage.example/retry',
      }),
    } as any;
    const useCase = new RetryStuckResumesUseCase(prisma, rabbitMQ, storage);

    await expect(useCase.execute()).resolves.toBe(0);
    expect(prisma.resume.updateMany).toHaveBeenLastCalledWith({
      where: { id: 'resume', parsingStatus: 'PROCESSING' },
      data: { parsingStatus: 'PENDING' },
    });
    expect(prisma.candidateProfile.updateMany).not.toHaveBeenCalled();
  });

  it('does not republish a resume claimed by another scheduler instance', async () => {
    const prisma = {
      resume: {
        findMany: jest.fn().mockResolvedValue([
          {
            id: 'resume',
            candidateId: 'candidate',
            objectPath: 'candidate/resume.pdf',
            mimeType: 'application/pdf',
            originalFileName: 'resume.pdf',
            parsingStatus: 'PROCESSING',
          },
        ]),
        updateMany: jest.fn().mockResolvedValue({ count: 0 }),
      },
      candidateProfile: {
        findUnique: jest.fn().mockResolvedValue({ primaryResumeId: 'resume' }),
        updateMany: jest.fn(),
      },
    } as any;
    const rabbitMQ = { publish: jest.fn() } as any;
    const storage = { createSignedDownloadUrl: jest.fn() } as any;
    const useCase = new RetryStuckResumesUseCase(prisma, rabbitMQ, storage);

    await expect(useCase.execute()).resolves.toBe(0);

    expect(storage.createSignedDownloadUrl).not.toHaveBeenCalled();
    expect(rabbitMQ.publish).not.toHaveBeenCalled();
  });

  it('marks a stale pending resume as SUPERSEDED without republishing', async () => {
    const prisma = {
      resume: {
        findMany: jest.fn().mockResolvedValue([
          {
            id: 'old-resume',
            candidateId: 'candidate',
            objectPath: 'candidate/old.pdf',
            mimeType: 'application/pdf',
            originalFileName: 'old.pdf',
            parsingStatus: 'PENDING',
          },
        ]),
        updateMany: jest.fn().mockResolvedValue({ count: 1 }),
      },
      candidateProfile: {
        findUnique: jest
          .fn()
          .mockResolvedValue({ primaryResumeId: 'new-resume' }),
        updateMany: jest.fn(),
      },
      $transaction: jest.fn(),
    } as any;
    const rabbitMQ = { publish: jest.fn() } as any;
    const storage = { createSignedDownloadUrl: jest.fn() } as any;
    const useCase = new RetryStuckResumesUseCase(prisma, rabbitMQ, storage);

    await expect(useCase.execute()).resolves.toBe(0);

    expect(prisma.resume.updateMany).toHaveBeenCalledWith({
      where: {
        id: 'old-resume',
        parsingStatus: { in: ['PENDING', 'PROCESSING'] },
      },
      data: { parsingStatus: 'SUPERSEDED' },
    });
    expect(rabbitMQ.publish).not.toHaveBeenCalled();
  });
});
