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
  });
});
