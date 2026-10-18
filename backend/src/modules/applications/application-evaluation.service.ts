import { Injectable, Logger } from '@nestjs/common';
import {
  ApplicationProcessingStatus,
  NotificationType,
  type Prisma,
} from '@prisma/client';
import { PrismaService } from '../../database/prisma.service';
import { RabbitMQService } from '../../infrastructure/rabbitmq/rabbitmq.service';
import { RABBITMQ_ROUTING_KEYS } from '../../infrastructure/rabbitmq/rabbitmq.constants';
import { createEvaluationMessage } from './application-evaluation.snapshot';
import { NotificationsService } from '../notifications/notifications.service';

export const MAX_EVALUATION_ATTEMPTS = 5;
export const EVALUATION_RETRY_BASE_DELAY_MS = 60_000;
const MAX_RETRY_DELAY_MS = 15 * 60_000;

@Injectable()
export class ApplicationEvaluationService {
  private readonly logger = new Logger(ApplicationEvaluationService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly rabbitMQService: RabbitMQService,
    private readonly notificationsService?: NotificationsService,
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
    const attempts = await this.resolveAttemptCount(
      applicationId,
      knownAttempts,
    );
    if (attempts === undefined) {
      return;
    }

    await this.persistFailure(applicationId, error, attempts, now);
  }

  async failStuckEvaluation(
    applicationId: string,
    attempts: number,
    stuckCutoff: Date,
    now = new Date(),
  ): Promise<void> {
    if (attempts < MAX_EVALUATION_ATTEMPTS) return;
    await this.persistFailure(
      applicationId,
      'No evaluation result received before timeout.',
      attempts,
      now,
      {
        processingStatus: ApplicationProcessingStatus.MATCHING,
        updatedAt: { lte: stuckCutoff },
      },
    );
  }

  private async persistFailure(
    applicationId: string,
    error: string,
    attempts: number,
    now: Date,
    expected: Prisma.ApplicationWhereInput = {},
  ): Promise<void> {
    const exhausted = attempts >= MAX_EVALUATION_ATTEMPTS;
    const nextRetryAt = exhausted
      ? null
      : new Date(now.getTime() + this.retryDelayMs(attempts));
    const errorMessage = exhausted
      ? `Evaluation retry limit reached after ${attempts} attempts: ${error}`
      : error;

    await this.prisma.$transaction(async (client) => {
      const changed = await client.application.updateMany({
        where: {
          id: applicationId,
          evaluationAttempts: attempts,
          processingStatus: { not: ApplicationProcessingStatus.COMPLETED },
          ...expected,
        },
        data: {
          processingStatus: ApplicationProcessingStatus.FAILED,
          nextEvaluationRetryAt: nextRetryAt,
          evaluationError: errorMessage,
          updatedAt: now,
        },
      });

      if (exhausted && changed.count > 0) {
        await this.notifyEvaluationExhausted(client, applicationId, attempts);
      }
    });
  }

  /**
   * Tell the recruiter that AI scoring failed permanently so they can score
   * the application manually. Runs in the same transaction as FAILED.
   */
  private async notifyEvaluationExhausted(
    client: Prisma.TransactionClient,
    applicationId: string,
    attempts: number,
  ): Promise<void> {
    if (!this.notificationsService) {
      return;
    }
    const app = await client.application.findUnique({
      where: { id: applicationId },
      select: {
        processingStatus: true,
        candidate: { select: { fullName: true } },
        job: {
          select: {
            title: true,
            recruiter: { select: { userId: true } },
          },
        },
      },
    });
    if (
      !app ||
      app.processingStatus !== ApplicationProcessingStatus.FAILED ||
      !app.job?.recruiter?.userId
    ) {
      return;
    }
    const candidateName = app.candidate?.fullName ?? 'Ứng viên';
    await this.notificationsService.createNotificationOnce(
      client,
      `evaluation:${applicationId}:${attempts}:exhausted:recruiter`,
      {
        recipientUserId: app.job.recruiter.userId,
        applicationId,
        type: NotificationType.SYSTEM_ALERT,
        title: `AI chấm thất bại: ${candidateName}`,
        message: `Hệ thống không thể chấm điểm hồ sơ của ${candidateName} cho vị trí "${app.job.title}" sau ${attempts} lần thử. Vui lòng chấm thủ công.`,
        payload: {
          applicationId,
          attempts,
          candidateName,
          jobTitle: app.job.title,
        },
      },
    );
  }

  private async resolveAttemptCount(
    applicationId: string,
    knownAttempts?: number,
  ): Promise<number | undefined> {
    if (knownAttempts !== undefined) {
      return knownAttempts;
    }
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
      return undefined;
    }
    return application.evaluationAttempts;
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
