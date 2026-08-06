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
        objectPath: { not: '' },
        OR: [
          { parsingStatus: 'PENDING', createdAt: { lte: cutoff } },
          { parsingStatus: 'PROCESSING', updatedAt: { lte: cutoff } },
        ],
      },
      orderBy: { createdAt: 'asc' },
      take: MAX_BATCH_SIZE,
      select: {
        id: true,
        candidateId: true,
        objectPath: true,
        mimeType: true,
        originalFileName: true,
        parsingStatus: true,
      },
    });

    let publishedCount = 0;
    for (const resume of resumes) {
      const profile = await this.prisma.candidateProfile.findUnique({
        where: { id: resume.candidateId },
        select: { primaryResumeId: true },
      });
      if (profile?.primaryResumeId !== resume.id) {
        await this.prisma.resume.updateMany({
          where: {
            id: resume.id,
            parsingStatus: { in: ['PENDING', 'PROCESSING'] },
          },
          data: { parsingStatus: 'SUPERSEDED' },
        });
        continue;
      }

      // Claim before doing external work. This prevents multiple backend
      // instances running the cron at the same minute from republishing the
      // same resume and paying for duplicate LLM extraction.
      const claimed = await this.prisma.resume.updateMany({
        where: {
          id: resume.id,
          parsingStatus: resume.parsingStatus,
          ...(resume.parsingStatus === 'PENDING'
            ? { createdAt: { lte: cutoff } }
            : { updatedAt: { lte: cutoff } }),
        },
        data: {
          parsingStatus: 'PROCESSING',
          parsingErrorMessage: null,
          updatedAt: now,
        },
      });
      if (claimed.count === 0) continue;

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
        await this.prisma.resume.updateMany({
          where: { id: resume.id, parsingStatus: 'PROCESSING' },
          data: {
            parsingStatus: 'FAILED',
            parsingErrorMessage: 'File not found in storage. Cannot create signed URL.',
          },
        });
        continue;
      }

      let published = false;
      try {
        published = await this.rabbitMQService.publish(
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
      } catch (error) {
        this.logger.error(
          `Cannot republish resume ${resume.id}: ${
            error instanceof Error ? error.message : 'Unknown error'
          }`,
        );
      }
      if (!published) {
        await this.releaseClaim(resume.id);
        continue;
      }

      try {
        await this.prisma.candidateProfile.updateMany({
          where: { id: resume.candidateId, primaryResumeId: resume.id },
          data: { status: 'PROCESSING' },
        });
      } catch (error) {
        // The request is already durably published. Hydration can still finish
        // and set the final profile status, so do not release the claim here.
        this.logger.error(
          `Resume ${resume.id} was republished but profile status update failed: ${
            error instanceof Error ? error.message : 'Unknown error'
          }`,
        );
      }
      publishedCount += 1;
    }

    if (publishedCount > 0) {
      this.logger.log(`Republished ${publishedCount} stuck resume(s)`);
    }
    return publishedCount;
  }

  private async releaseClaim(resumeId: string): Promise<void> {
    await this.prisma.resume.updateMany({
      where: { id: resumeId, parsingStatus: 'PROCESSING' },
      data: { parsingStatus: 'PENDING' },
    });
  }
}
