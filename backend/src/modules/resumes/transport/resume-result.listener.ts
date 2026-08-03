import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { RabbitMQService } from '../../../infrastructure/rabbitmq/rabbitmq.service';
import {
  RABBITMQ_QUEUES,
  RABBITMQ_ROUTING_KEYS,
} from '../../../infrastructure/rabbitmq/rabbitmq.constants';
import { ResumeHydrationService } from '../hydration/resume-hydration.service';
import type { ParsedResumeData } from '../resume.types';

interface ResumeAnalysisCompletedMessage {
  resumeId: string;
  candidateProfileId: string;
  parsedData: ParsedResumeData;
  completedAt: string;
}

interface ResumeAnalysisFailedMessage {
  resumeId: string;
  candidateProfileId: string;
  errorMessage: string;
  failedAt: string;
}

@Injectable()
export class ResumeResultListener implements OnModuleInit {
  private readonly logger = new Logger(ResumeResultListener.name);

  constructor(
    private readonly rabbitMQService: RabbitMQService,
    private readonly hydrationService: ResumeHydrationService,
  ) {}

  async onModuleInit(): Promise<void> {
    const queueName = `${RABBITMQ_QUEUES.RESUME_ANALYSIS_QUEUE}_results`;

    await this.rabbitMQService.subscribe(
      queueName,
      [
        RABBITMQ_ROUTING_KEYS.RESUME_ANALYSIS_COMPLETED,
        RABBITMQ_ROUTING_KEYS.RESUME_ANALYSIS_FAILED,
      ],
      (message) => this.handleMessage(message),
    );
  }

  private async handleMessage(message: unknown): Promise<void> {
    if (!message || typeof message !== 'object') {
      throw new Error('Invalid resume analysis result: expected an object');
    }

    const payload = message as Record<string, unknown>;
    if (payload.parsedData) {
      await this.handleCompleted(
        payload as unknown as ResumeAnalysisCompletedMessage,
      );
      return;
    }

    if (typeof payload.errorMessage === 'string') {
      await this.handleFailed(
        payload as unknown as ResumeAnalysisFailedMessage,
      );
      return;
    }

    throw new Error('Unknown resume analysis result message shape');
  }

  private async handleCompleted(
    message: ResumeAnalysisCompletedMessage,
  ): Promise<void> {
    this.logger.log(`Hydrating completed resume ${message.resumeId}`);
    // Deliberately do not catch: RabbitMQService owns ACK/NACK policy.
    await this.hydrationService.hydrateProfile(
      message.resumeId,
      message.candidateProfileId,
      message.parsedData,
    );
  }

  private async handleFailed(
    message: ResumeAnalysisFailedMessage,
  ): Promise<void> {
    this.logger.warn(
      `Handling failed resume ${message.resumeId}: ${message.errorMessage}`,
    );
    // Deliberately do not catch: RabbitMQService owns ACK/NACK policy.
    await this.hydrationService.handleFailure(
      message.resumeId,
      message.candidateProfileId,
      message.errorMessage,
    );
  }
}
