import { UploadResumeUseCase } from './upload-resume.use-case';

describe('UploadResumeUseCase', () => {
  it('keeps statuses out of PROCESSING when RabbitMQ publish fails', async () => {
    const resume = {
      id: 'resume',
      originalFileName: 'resume.pdf',
      createdAt: new Date('2026-08-03T00:00:00Z'),
    };
    const prisma = {
      candidateProfile: {
        findUnique: jest.fn().mockResolvedValue({ id: 'candidate' }),
        update: jest.fn().mockResolvedValue(undefined),
      },
      resume: {
        create: jest.fn().mockResolvedValue(resume),
        update: jest.fn().mockResolvedValue(undefined),
      },
      $transaction: jest.fn(),
    } as any;
    const storage = {
      uploadCandidateResume: jest
        .fn()
        .mockResolvedValue({ objectPath: 'candidate/resume.pdf' }),
      createSignedDownloadUrl: jest.fn().mockResolvedValue({
        signedUrl: 'https://storage.example/signed',
      }),
    } as any;
    const rabbitMQ = { publish: jest.fn().mockResolvedValue(false) } as any;
    const useCase = new UploadResumeUseCase(prisma, storage, rabbitMQ);

    const result = await useCase.execute('user', {
      buffer: Buffer.from('%PDF'),
      originalname: 'resume.pdf',
      mimetype: 'application/pdf',
      size: 4,
    });

    expect(result.parsingStatus).toBe('PENDING');
    expect(result.warning).toBeDefined();
    expect(prisma.$transaction).not.toHaveBeenCalled();
    expect(prisma.candidateProfile.update).toHaveBeenCalledWith({
      where: { id: 'candidate' },
      data: { primaryResumeId: 'resume' },
    });
    expect(rabbitMQ.publish).toHaveBeenCalledWith(
      expect.any(String),
      expect.objectContaining({
        signedDownloadUrl: 'https://storage.example/signed',
      }),
    );
  });

  it('keeps an uploaded resume PENDING when signed URL creation fails', async () => {
    const resume = {
      id: 'resume',
      originalFileName: 'resume.pdf',
      createdAt: new Date('2026-08-03T00:00:00Z'),
    };
    const prisma = {
      candidateProfile: {
        findUnique: jest.fn().mockResolvedValue({ id: 'candidate' }),
        update: jest.fn().mockResolvedValue(undefined),
      },
      resume: {
        create: jest.fn().mockResolvedValue(resume),
        update: jest.fn().mockResolvedValue(undefined),
      },
      $transaction: jest.fn(),
    } as any;
    const storage = {
      uploadCandidateResume: jest
        .fn()
        .mockResolvedValue({ objectPath: 'candidate/resume.pdf' }),
      createSignedDownloadUrl: jest
        .fn()
        .mockRejectedValue(new Error('storage timeout')),
    } as any;
    const rabbitMQ = { publish: jest.fn() } as any;
    const useCase = new UploadResumeUseCase(prisma, storage, rabbitMQ);

    await expect(
      useCase.execute('user', {
        buffer: Buffer.from('%PDF'),
        originalname: 'resume.pdf',
        mimetype: 'application/pdf',
        size: 4,
      }),
    ).resolves.toEqual(expect.objectContaining({ parsingStatus: 'PENDING' }));

    expect(rabbitMQ.publish).not.toHaveBeenCalled();
    expect(prisma.$transaction).not.toHaveBeenCalled();
    expect(prisma.resume.update).not.toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({ parsingStatus: 'FAILED' }),
      }),
    );
  });
});
