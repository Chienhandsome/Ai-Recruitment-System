import { PrismaService } from '../../../database/prisma.service';
import { AiServiceWakeupService } from '../../../infrastructure/ai/ai-service-wakeup.service';
import { RabbitMQService } from '../../../infrastructure/rabbitmq/rabbitmq.service';
import { SupabaseStorageService } from '../../../infrastructure/supabase/supabase-storage.service';
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
    };
    const storage = {
      uploadCandidateResume: jest
        .fn()
        .mockResolvedValue({ objectPath: 'candidate/resume.pdf' }),
      createSignedDownloadUrl: jest.fn().mockResolvedValue({
        signedUrl: 'https://storage.example/signed',
      }),
    };
    const rabbitMQ = { publish: jest.fn().mockResolvedValue(false) };
    const wakeup = { wake: jest.fn() };
    const useCase = new UploadResumeUseCase(
      prisma as unknown as PrismaService,
      storage as unknown as SupabaseStorageService,
      rabbitMQ as unknown as RabbitMQService,
      wakeup as unknown as AiServiceWakeupService,
    );

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
    expect(wakeup.wake).not.toHaveBeenCalled();
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
    };
    const storage = {
      uploadCandidateResume: jest
        .fn()
        .mockResolvedValue({ objectPath: 'candidate/resume.pdf' }),
      createSignedDownloadUrl: jest
        .fn()
        .mockRejectedValue(new Error('storage timeout')),
    };
    const rabbitMQ = { publish: jest.fn() };
    const wakeup = { wake: jest.fn() };
    const useCase = new UploadResumeUseCase(
      prisma as unknown as PrismaService,
      storage as unknown as SupabaseStorageService,
      rabbitMQ as unknown as RabbitMQService,
      wakeup as unknown as AiServiceWakeupService,
    );

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
    expect(wakeup.wake).not.toHaveBeenCalled();
  });

  it('wakes the AI service after publishing a resume', async () => {
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
      $transaction: jest.fn().mockResolvedValue(undefined),
    };
    const storage = {
      uploadCandidateResume: jest
        .fn()
        .mockResolvedValue({ objectPath: 'candidate/resume.pdf' }),
      createSignedDownloadUrl: jest.fn().mockResolvedValue({
        signedUrl: 'https://storage.example/signed',
      }),
    };
    const rabbitMQ = { publish: jest.fn().mockResolvedValue(true) };
    const wakeup = { wake: jest.fn().mockResolvedValue(undefined) };
    const useCase = new UploadResumeUseCase(
      prisma as unknown as PrismaService,
      storage as unknown as SupabaseStorageService,
      rabbitMQ as unknown as RabbitMQService,
      wakeup as unknown as AiServiceWakeupService,
    );

    const result = await useCase.execute('user', {
      buffer: Buffer.from('%PDF'),
      originalname: 'resume.pdf',
      mimetype: 'application/pdf',
      size: 4,
    });

    expect(result.parsingStatus).toBe('PROCESSING');
    expect(wakeup.wake).toHaveBeenCalledTimes(1);
  });
});
