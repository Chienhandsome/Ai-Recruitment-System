import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { RabbitMQService } from '../../infrastructure/rabbitmq/rabbitmq.service';
import {
  RABBITMQ_ROUTING_KEYS,
  RABBITMQ_QUEUES,
} from '../../infrastructure/rabbitmq/rabbitmq.constants';
import {
  ResumeHydrationService,
  ParsedResumeData,
} from './resume-hydration.service';

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

  async onModuleInit() {
    await this.startListening();
  }

  private async startListening() {
    const queueName = `${RABBITMQ_QUEUES.RESUME_ANALYSIS_QUEUE}_results`;

    this.logger.log('Subscribing to resume analysis result messages...');

    await this.rabbitMQService.subscribe(
      queueName,
      [
        RABBITMQ_ROUTING_KEYS.RESUME_ANALYSIS_COMPLETED,
        RABBITMQ_ROUTING_KEYS.RESUME_ANALYSIS_FAILED,
      ],
      async (message: unknown) => {
        await this.handleMessage(message);
      },
    );
  }

  private async handleMessage(message: unknown): Promise<void> {
    const msg = message as Record<string, unknown>;

    if (!msg || typeof msg !== 'object') {
      this.logger.warn('Received invalid message (not an object)');
      return;
    }

    // Determine message type based on presence of parsedData or errorMessage
    if ('parsedData' in msg && msg.parsedData) {
      await this.handleCompleted(msg as unknown as ResumeAnalysisCompletedMessage);
    } else if ('errorMessage' in msg) {
      await this.handleFailed(msg as unknown as ResumeAnalysisFailedMessage);
    } else {
      this.logger.warn(
        `Unknown message format: ${JSON.stringify(msg).substring(0, 200)}`,
      );
    }
  }

  private async handleCompleted(
    msg: ResumeAnalysisCompletedMessage,
  ): Promise<void> {
    this.logger.log(
      `Resume analysis completed: resumeId=${msg.resumeId}, candidate=${msg.candidateProfileId}`,
    );

    try {
      await this.hydrationService.hydrateProfile(
        msg.resumeId,
        msg.candidateProfileId,
        msg.parsedData,
      );
      this.logger.log(
        `Profile hydration successful for resume ${msg.resumeId}`,
      );
    } catch (error) {
      this.logger.error(
        `Profile hydration failed for resume ${msg.resumeId}: ${
          error instanceof Error ? error.message : 'Unknown error'
        }`,
      );
    }
  }

  private async handleFailed(
    msg: ResumeAnalysisFailedMessage,
  ): Promise<void> {
    this.logger.warn(
      `Resume analysis failed: resumeId=${msg.resumeId}, error=${msg.errorMessage}`,
    );

    try {
      await this.hydrationService.handleFailure(
        msg.resumeId,
        msg.candidateProfileId,
        msg.errorMessage,
      );
    } catch (error) {
      this.logger.error(
        `Failed to handle failure for resume ${msg.resumeId}: ${
          error instanceof Error ? error.message : 'Unknown error'
        }`,
      );
    }
  }
}
