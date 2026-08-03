import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { PrismaService } from '../../../database/prisma.service';
import { RabbitMQService } from '../../../infrastructure/rabbitmq/rabbitmq.service';
import { RABBITMQ_ROUTING_KEYS } from '../../../infrastructure/rabbitmq/rabbitmq.constants';
import { SupabaseStorageService } from '../../../infrastructure/supabase/supabase-storage.service';

const STUCK_AFTER_MS = 10 * 60 * 1000;
const MAX_BATCH_SIZE = 50;

@Injectable()
export class RetryStuckResumesUseCase {
  private readonly logger = new Logger(RetryStuckResumesUseCase.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly rabbitMQService: RabbitMQService,
    private readonly storageService: SupabaseStorageService,
  ) {}

  @Cron(CronExpression.EVERY_MINUTE)
  async runScheduled(): Promise<void> {
    await this.execute();
  }

  async execute(now = new Date()): Promise<number> {
    const cutoff = new Date(now.getTime() - STUCK_AFTER_MS);
    const resumes = await this.prisma.resume.findMany({
      where: {
        parsingStatus: 'PENDING',
        objectPath: { not: '' },
        createdAt: { lte: cutoff },
      },
      orderBy: { createdAt: 'asc' },
      take: MAX_BATCH_SIZE,
      select: {
        id: true,
        candidateId: true,
        objectPath: true,
        mimeType: true,
        originalFileName: true,
      },
    });

    let publishedCount = 0;
    for (const resume of resumes) {
      let signedDownloadUrl: string;
      try {
        const signed = await this.storageService.createSignedDownloadUrl(
          resume.objectPath,
          5 * 60,
        );
        signedDownloadUrl = signed.signedUrl;
      } catch (error) {
        this.logger.error(
          `Cannot refresh signed URL for resume ${resume.id}: ${
            error instanceof Error ? error.message : 'Unknown error'
          }`,
        );
        continue;
      }

      const published = await this.rabbitMQService.publish(
        RABBITMQ_ROUTING_KEYS.RESUME_ANALYSIS_REQUESTED,
        {
          resumeId: resume.id,
          candidateProfileId: resume.candidateId,
          objectPath: resume.objectPath,
          mimeType: resume.mimeType,
          originalFileName: resume.originalFileName,
          signedDownloadUrl,
          requestedAt: now.toISOString(),
        },
      );
      if (!published) continue;

      await this.prisma.$transaction([
        this.prisma.resume.updateMany({
          where: { id: resume.id, parsingStatus: 'PENDING' },
          data: { parsingStatus: 'PROCESSING' },
        }),
        this.prisma.candidateProfile.updateMany({
          where: { id: resume.candidateId, primaryResumeId: resume.id },
          data: { status: 'PROCESSING' },
        }),
      ]);
      publishedCount += 1;
    }

    if (publishedCount > 0) {
      this.logger.log(`Republished ${publishedCount} stuck resume(s)`);
    }
    return publishedCount;
  }
}
