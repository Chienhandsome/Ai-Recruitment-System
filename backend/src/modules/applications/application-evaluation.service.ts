import { Injectable, Logger } from '@nestjs/common';
import { ApplicationProcessingStatus, type Prisma } from '@prisma/client';
import { PrismaService } from '../../database/prisma.service';
import { RabbitMQService } from '../../infrastructure/rabbitmq/rabbitmq.service';
import { RABBITMQ_ROUTING_KEYS } from '../../infrastructure/rabbitmq/rabbitmq.constants';
import { createEvaluationMessage } from './application-evaluation.snapshot';

export const MAX_EVALUATION_ATTEMPTS = 5;
export const EVALUATION_RETRY_BASE_DELAY_MS = 60_000;
const MAX_RETRY_DELAY_MS = 15 * 60_000;

@Injectable()
export class ApplicationEvaluationService {
  private readonly logger = new Logger(ApplicationEvaluationService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly rabbitMQService: RabbitMQService,
  ) {}

  async dispatchNewApplication(
    applicationId: string,
    now = new Date(),
  ): Promise<boolean> {
    const claimed = await this.prisma.application.update({
      where: { id: applicationId },
      data: {
        processingStatus: ApplicationProcessingStatus.MATCHING,
        evaluationAttempts: { increment: 1 },
        nextEvaluationRetryAt: null,
        evaluationError: null,
        updatedAt: now,
      },
      select: {
        evaluationAttempts: true,
        profileSnapshot: true,
      },
    });

    return this.publishClaimedApplication(
      applicationId,
      claimed.profileSnapshot,
      claimed.evaluationAttempts,
      now,
    );
  }

  async publishClaimedApplication(
    applicationId: string,
    profileSnapshot: Prisma.JsonValue | null,
    evaluationAttempts: number,
    now = new Date(),
  ): Promise<boolean> {
    const message = createEvaluationMessage(applicationId, profileSnapshot);
    if (!message) {
      await this.markForRetry(
        applicationId,
        'Application evaluation snapshot is missing or invalid.',
        evaluationAttempts,
        now,
      );
      return false;
    }

    let published = false;
    try {
      published = await this.rabbitMQService.publish(
        RABBITMQ_ROUTING_KEYS.EVALUATION_REQUESTED,
        message,
      );
    } catch (error) {
      this.logger.error(
        `Evaluation publish threw for application ${applicationId}: ${this.errorMessage(error)}`,
      );
    }

    if (!published) {
      await this.markForRetry(
        applicationId,
        'RabbitMQ is unavailable; evaluation will be retried.',
        evaluationAttempts,
        now,
      );
      return false;
    }

    this.logger.log(
      `Queued evaluation for application ${applicationId} (attempt ${evaluationAttempts})`,
    );
    return true;
  }

  async markForRetry(
    applicationId: string,
    error: string,
    knownAttempts?: number,
    now = new Date(),
  ): Promise<void> {
    let attempts = knownAttempts;
    if (attempts === undefined) {
      const application = await this.prisma.application.findUnique({
        where: { id: applicationId },
        select: {
          evaluationAttempts: true,
          processingStatus: true,
        },
      });
      if (
        !application ||
        application.processingStatus === ApplicationProcessingStatus.COMPLETED
      ) {
        return;
      }
      attempts = application.evaluationAttempts;
    }

    const exhausted = attempts >= MAX_EVALUATION_ATTEMPTS;
    const nextRetryAt = exhausted
      ? null
      : new Date(now.getTime() + this.retryDelayMs(attempts));
    const errorMessage = exhausted
      ? `Evaluation retry limit reached after ${attempts} attempts: ${error}`
      : error;

    await this.prisma.application.updateMany({
      where: {
        id: applicationId,
        processingStatus: { not: ApplicationProcessingStatus.COMPLETED },
      },
      data: {
        processingStatus: ApplicationProcessingStatus.FAILED,
        nextEvaluationRetryAt: nextRetryAt,
        evaluationError: errorMessage,
        updatedAt: now,
      },
    });
  }

  private retryDelayMs(attempts: number): number {
    const exponentialDelay =
      EVALUATION_RETRY_BASE_DELAY_MS * 2 ** Math.max(0, attempts - 1);
    return Math.min(exponentialDelay, MAX_RETRY_DELAY_MS);
  }

  private errorMessage(error: unknown): string {
    return error instanceof Error ? error.message : 'Unknown error';
  }
}
