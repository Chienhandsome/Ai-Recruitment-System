import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import {
  ApplicationProcessingStatus,
  ExperienceLevel,
  MatchLevel,
} from '@prisma/client';
import { z } from 'zod';
import { PrismaService } from '../../database/prisma.service';
import { RabbitMQService } from '../../infrastructure/rabbitmq/rabbitmq.service';
import {
  RABBITMQ_QUEUES,
  RABBITMQ_ROUTING_KEYS,
} from '../../infrastructure/rabbitmq/rabbitmq.constants';
import { ApplicationEvaluationService } from './application-evaluation.service';
import { AiResultSchema } from './dto/ai-result.dto';

const EvaluationResultMessageSchema = z.object({
  applicationId: z.string().min(1),
  status: z.enum(['COMPLETED', 'FAILED']),
  result: z.unknown().optional(),
  error: z.string().optional(),
});

@Injectable()
export class ApplicationsConsumer implements OnModuleInit {
  private readonly logger = new Logger(ApplicationsConsumer.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly rabbitMQService: RabbitMQService,
    private readonly evaluationService: ApplicationEvaluationService,
  ) {}

  onModuleInit(): void {
    this.rabbitMQService
      .subscribe(
        `${RABBITMQ_QUEUES.EVALUATION_QUEUE}_result`,
        [
          RABBITMQ_ROUTING_KEYS.EVALUATION_COMPLETED,
          RABBITMQ_ROUTING_KEYS.EVALUATION_FAILED,
        ],
        this.handleMessage.bind(this),
      )
      .catch((error: unknown) => {
        this.logger.error(
          `Failed to subscribe to RabbitMQ: ${this.errorMessage(error)}`,
        );
      });
  }

  async handleMessage(rawMessage: unknown): Promise<void> {
    const parsedMessage = EvaluationResultMessageSchema.safeParse(rawMessage);
    if (!parsedMessage.success) {
      this.logger.error('Invalid AI evaluation result message');
      return;
    }

    const { applicationId, status, result, error } = parsedMessage.data;
    this.logger.log(
      `Received AI evaluation result for application ${applicationId}`,
    );

    if (status === 'COMPLETED' && result) {
      try {
        const validatedResult = AiResultSchema.parse(result);
        const matchLevel = (
          ['HIGH', 'MEDIUM', 'LOW'].includes(validatedResult.match_level)
            ? validatedResult.match_level
            : 'LOW'
        ) as MatchLevel;
        const experienceAssessment = validatedResult.experience_assessment;

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
              evidence: validatedResult.evidence,
              confidenceScore: validatedResult.confidence_score,
              candidateExperienceLevel:
                (experienceAssessment?.candidate_level as
                  ExperienceLevel | null | undefined) ?? null,
              requiredExperienceLevel:
                (experienceAssessment?.required_level as
                  ExperienceLevel | undefined) ?? null,
              totalExperienceYears:
                experienceAssessment?.total_experience_years ?? null,
              levelFitScore: experienceAssessment?.level_fit_score ?? null,
              levelGap: experienceAssessment?.level_gap ?? null,
              levelEligible: experienceAssessment?.level_eligible ?? null,
              levelConfidence: experienceAssessment?.level_confidence ?? null,
              levelEvidence: experienceAssessment
                ? {
                    evidence: experienceAssessment.evidence,
                    reasonCodes: experienceAssessment.reason_codes,
                    recommendation: experienceAssessment.recommendation,
                    requirementMode:
                      experienceAssessment.level_requirement_mode,
                    durationScore: experienceAssessment.duration_score,
                    relevanceScore: experienceAssessment.relevance_score,
                  }
                : undefined,
              modelVersion: experienceAssessment
                ? 'experience-level-v1'
                : undefined,
            },
          });

          await prisma.application.update({
            where: { id: applicationId },
            data: {
              processingStatus: ApplicationProcessingStatus.COMPLETED,
              nextEvaluationRetryAt: null,
              evaluationError: null,
            },
          });
        });
        if (experienceAssessment) {
          this.logger.log(
            JSON.stringify({
              event: 'experience_level_evaluated',
              application_id: applicationId,
              candidate_level: experienceAssessment.candidate_level,
              required_level: experienceAssessment.required_level,
              level_gap: experienceAssessment.level_gap,
              eligible: experienceAssessment.level_eligible,
              confidence: experienceAssessment.level_confidence,
              algorithm_version: 'experience-level-v1',
            }),
          );
        }
        this.logger.log(
          `Successfully updated AI evaluation for application ${applicationId}`,
        );
      } catch (caughtError: unknown) {
        this.logger.error(
          `Failed to persist AI evaluation for application ${applicationId}: ${this.errorMessage(caughtError)}`,
          caughtError instanceof Error ? caughtError.stack : undefined,
        );
        await this.evaluationService.markForRetry(
          applicationId,
          this.errorMessage(caughtError),
        );
      }
      return;
    }

    const failureReason = error ?? 'AI evaluation failed without a reason.';
    this.logger.warn(
      `AI evaluation failed for application ${applicationId}: ${failureReason}`,
    );
    try {
      await this.evaluationService.markForRetry(applicationId, failureReason);
    } catch (caughtError: unknown) {
      this.logger.error(
        `Failed to schedule retry for application ${applicationId}: ${this.errorMessage(caughtError)}`,
      );
    }
  }

  private errorMessage(error: unknown): string {
    return error instanceof Error ? error.message : 'Unknown error';
  }
}
