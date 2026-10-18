import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { ApplicationProcessingStatus } from '@prisma/client';
import { PrismaService } from '../../database/prisma.service';
import {
  ApplicationEvaluationService,
  MAX_EVALUATION_ATTEMPTS,
} from './application-evaluation.service';

const STUCK_EVALUATION_AFTER_MS = 10 * 60_000;
const MAX_RETRY_BATCH_SIZE = 50;

@Injectable()
export class RetryApplicationEvaluationsUseCase {
  private readonly logger = new Logger(RetryApplicationEvaluationsUseCase.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly evaluationService: ApplicationEvaluationService,
  ) {}

  @Cron(CronExpression.EVERY_MINUTE)
  async runScheduled(): Promise<void> {
    await this.execute();
  }

  async execute(now = new Date()): Promise<number> {
    const stuckCutoff = new Date(now.getTime() - STUCK_EVALUATION_AFTER_MS);

    // Each transition to FAILED and its alert commit together. A failed write
    // leaves MATCHING intact so the next scheduler run can try again.
    const stuckExhausted = await this.prisma.application.findMany({
      where: {
        processingStatus: ApplicationProcessingStatus.MATCHING,
        evaluationAttempts: { gte: MAX_EVALUATION_ATTEMPTS },
        updatedAt: { lte: stuckCutoff },
      },
      select: { id: true, evaluationAttempts: true },
      orderBy: { updatedAt: 'asc' },
      take: MAX_RETRY_BATCH_SIZE,
    });

    for (const stuck of stuckExhausted) {
      try {
        await this.evaluationService.failStuckEvaluation(
          stuck.id,
          stuck.evaluationAttempts,
          stuckCutoff,
          now,
        );
      } catch (error) {
        this.logger.error(
          `Failed to persist exhausted evaluation ${stuck.id}: ${error instanceof Error ? error.message : 'Unknown error'}`,
        );
      }
    }

    const applications = await this.prisma.application.findMany({
      where: {
        evaluationAttempts: { lt: MAX_EVALUATION_ATTEMPTS },
        OR: [
          {
            processingStatus: ApplicationProcessingStatus.FAILED,
            nextEvaluationRetryAt: { lte: now },
          },
          {
            processingStatus: ApplicationProcessingStatus.MATCHING,
            updatedAt: { lte: stuckCutoff },
          },
          {
            processingStatus: ApplicationProcessingStatus.QUEUED,
            updatedAt: { lte: stuckCutoff },
          },
        ],
      },
      orderBy: { updatedAt: 'asc' },
      take: MAX_RETRY_BATCH_SIZE,
      select: {
        id: true,
        processingStatus: true,
        evaluationAttempts: true,
        updatedAt: true,
        profileSnapshot: true,
      },
    });

    let publishedCount = 0;
    for (const application of applications) {
      const claimed = await this.prisma.application.updateMany({
        where: {
          id: application.id,
          processingStatus: application.processingStatus,
          evaluationAttempts: application.evaluationAttempts,
          updatedAt: application.updatedAt,
        },
        data: {
          processingStatus: ApplicationProcessingStatus.MATCHING,
          evaluationAttempts: { increment: 1 },
          nextEvaluationRetryAt: null,
          evaluationError: null,
          updatedAt: now,
        },
      });
      if (claimed.count === 0) continue;

      const published = await this.evaluationService.publishClaimedApplication(
        application.id,
        application.profileSnapshot,
        application.evaluationAttempts + 1,
        now,
      );
      if (published) publishedCount += 1;
    }

    if (publishedCount > 0) {
      this.logger.log(
        `Republished ${publishedCount} application evaluation(s)`,
      );
    }
    return publishedCount;
  }
}
