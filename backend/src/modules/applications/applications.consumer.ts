import { Injectable, OnModuleInit, Logger } from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';
import { RabbitMQService } from '../../infrastructure/rabbitmq/rabbitmq.service';
import { RABBITMQ_QUEUES, RABBITMQ_ROUTING_KEYS } from '../../infrastructure/rabbitmq/rabbitmq.constants';
import { ApplicationProcessingStatus, MatchLevel } from '@prisma/client';
import { AiResultSchema } from './dto/ai-result.dto';

@Injectable()
export class ApplicationsConsumer implements OnModuleInit {
  private readonly logger = new Logger(ApplicationsConsumer.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly rabbitMQService: RabbitMQService,
  ) {}

  onModuleInit() {
    this.rabbitMQService.subscribe(
      RABBITMQ_QUEUES.EVALUATION_QUEUE + '_result',
      [
        RABBITMQ_ROUTING_KEYS.EVALUATION_COMPLETED,
        RABBITMQ_ROUTING_KEYS.EVALUATION_FAILED,
      ],
      this.handleMessage.bind(this),
    ).catch(err => {
        this.logger.error('Failed to subscribe to RabbitMQ', err);
    });
  }

  async handleMessage(message: any) {
    this.logger.log(`Received AI Evaluation result for application ${message.applicationId}`);

    if (!message.applicationId) {
      this.logger.error('Message is missing applicationId');
      return;
    }

    const { applicationId, status, result, error } = message;

    if (status === 'COMPLETED' && result) {
      try {
        // Zod validation with default fallbacks
        const validatedResult = AiResultSchema.parse(result);

        const matchLevel = (['HIGH', 'MEDIUM', 'LOW'].includes(validatedResult.match_level) ? validatedResult.match_level : 'LOW') as MatchLevel;

        await this.prisma.$transaction(async (prisma) => {
          await prisma.aiMatchingResult.deleteMany({
            where: { applicationId },
          });

          await prisma.aiMatchingResult.create({
            data: {
              applicationId,
              overallScore: validatedResult.overall_score,
              matchLevel,
              skillScore: validatedResult.skills_score,
              experienceScore: validatedResult.experience_score,
              educationScore: validatedResult.education_score,
              projectScore: validatedResult.other_score,
              strengths: validatedResult.strengths,
              gaps: validatedResult.gaps,
              matchedSkills: validatedResult.matched_skills,
              missingSkills: validatedResult.missing_skills,
              missingRequiredSkills: validatedResult.missing_required_skills,
              reasoningSummary: validatedResult.summary,
              // @ts-ignore: Fields added in recent migration but Prisma Client may not be generated due to EPERM
              evidence: validatedResult.evidence,
              // @ts-ignore
              confidenceScore: validatedResult.confidence_score,
            },
          });

          await prisma.application.update({
            where: { id: applicationId },
            data: { processingStatus: ApplicationProcessingStatus.COMPLETED },
          });
        });
        this.logger.log(`Successfully updated AI Evaluation for application ${applicationId}`);
      } catch (err: any) {
        this.logger.error(`Failed to update DB for application ${applicationId}: ${err?.message || err}`, err?.stack);
        await this.prisma.application.update({
          where: { id: applicationId },
          data: { processingStatus: ApplicationProcessingStatus.FAILED },
        });
      }
    } else {
      this.logger.warn(`AI Evaluation failed for application ${applicationId}: ${error}`);
      try {
        await this.prisma.application.update({
          where: { id: applicationId },
          data: { processingStatus: ApplicationProcessingStatus.FAILED },
        });
      } catch (err) {
        this.logger.error(`Failed to update FAILED status for application ${applicationId}`, err);
      }
    }
  }
}
