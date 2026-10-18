import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import {
  ApplicationStage,
  ApplicationProcessingStatus,
  HrDecision,
  MatchLevel,
  NotificationType,
  type Prisma,
} from '@prisma/client';
import { z } from 'zod';
import { PrismaService } from '../../database/prisma.service';
import { RabbitMQService } from '../../infrastructure/rabbitmq/rabbitmq.service';
import {
  RABBITMQ_QUEUES,
  RABBITMQ_ROUTING_KEYS,
} from '../../infrastructure/rabbitmq/rabbitmq.constants';
import { ApplicationEvaluationService } from './application-evaluation.service';
import { NotificationsService } from '../notifications/notifications.service';
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
    private readonly notificationsService?: NotificationsService,
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
      const parsedResult = AiResultSchema.safeParse(result);
      if (!parsedResult.success) {
        await this.evaluationService.markForRetry(
          applicationId,
          parsedResult.error.message,
        );
        return;
      }
      try {
        const validatedResult = parsedResult.data;
        const matchLevel = (
          ['HIGH', 'MEDIUM', 'LOW'].includes(validatedResult.match_level)
            ? validatedResult.match_level
            : 'LOW'
        ) as MatchLevel;
        const experienceAssessment = validatedResult.experience_assessment;

        await this.prisma.$transaction(async (prisma) => {
          // Lock the application before replacing its result so duplicate
          // deliveries serialize, including when there was no previous result.
          const evaluated = await prisma.application.update({
            where: { id: applicationId },
            data: {
              processingStatus: ApplicationProcessingStatus.COMPLETED,
              nextEvaluationRetryAt: null,
              evaluationError: null,
            },
            select: { evaluationAttempts: true },
          });
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
              inputSnapshot: {
                score_breakdown: validatedResult.score_breakdown ?? null,
                pillar_explanations:
                  validatedResult.pillar_explanations ?? null,
                domain_compatibility: validatedResult.domain_compatibility ?? 1,
                mandatory_ratio: validatedResult.mandatory_ratio ?? 1,
                mandatory_status: validatedResult.mandatory_status ?? 'PASS',
                mandatory_failures: validatedResult.mandatory_failures ?? [],
                base_score: validatedResult.base_score ?? 0,
                mandatory_score_cap:
                  validatedResult.mandatory_score_cap ?? null,
                score_adjustment: validatedResult.score_adjustment ?? 0,
                evidence_confidence: validatedResult.evidence_confidence ?? 1,
              },
              candidateExperienceLevel:
                experienceAssessment?.candidate_level ?? null,
              requiredExperienceLevel:
                experienceAssessment?.required_level ?? null,
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

          const promoted = await prisma.application.updateMany({
            where: {
              id: applicationId,
              currentStage: ApplicationStage.RECEIVED,
            },
            data: {
              currentStage: ApplicationStage.SCREENING,
              hrDecision: HrDecision.CONSIDER,
            },
          });

          if (promoted.count === 1) {
            await prisma.applicationStatusHistory.create({
              data: {
                applicationId,
                previousStage: ApplicationStage.RECEIVED,
                newStage: ApplicationStage.SCREENING,
                changedByUserId: null,
                note: 'AI evaluation completed; application entered screening.',
              },
            });
          }

          await this.notifyEvaluationCompleted(
            prisma,
            applicationId,
            validatedResult.overall_score,
            evaluated.evaluationAttempts,
            promoted.count === 1,
          );
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
        // Persistence errors must reach RabbitMQ so it retries this result.
        // The transaction rolled back the stage and every notification.
        throw caughtError;
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
      throw caughtError;
    }
  }

  /**
   * Notify the recruiter that AI scoring finished and — when the application
   * was auto-promoted RECEIVED → SCREENING — notify the candidate too.
   * Persist with the result and stage; failures roll back the entire change.
   */
  private async notifyEvaluationCompleted(
    client: Prisma.TransactionClient,
    applicationId: string,
    overallScore: number,
    attempts: number,
    promoted: boolean,
  ): Promise<void> {
    if (!this.notificationsService) {
      return;
    }
    const app = await client.application.findUnique({
      where: { id: applicationId },
      select: {
        candidate: { select: { userId: true, fullName: true } },
        job: {
          select: {
            title: true,
            recruiter: { select: { userId: true } },
          },
        },
      },
    });
    const candidateName = app?.candidate?.fullName ?? 'Ứng viên';
    const jobTitle = app?.job?.title ?? '';
    const score = Math.round(Number(overallScore));

    if (app?.job?.recruiter?.userId) {
      await this.notificationsService.createNotificationOnce(
        client,
        `evaluation:${applicationId}:${attempts}:completed:recruiter`,
        {
          recipientUserId: app.job.recruiter.userId,
          applicationId,
          type: NotificationType.MATCHING_COMPLETED,
          title: `AI đã chấm xong: ${candidateName}`,
          message: `Hồ sơ của ${candidateName} cho vị trí "${jobTitle}" đạt ${score} điểm.`,
          payload: {
            applicationId,
            candidateName,
            jobTitle,
            overallScore: score,
          },
        },
      );
    }

    if (promoted && app?.candidate?.userId) {
      await this.notificationsService.createNotificationOnce(
        client,
        `evaluation:${applicationId}:${attempts}:screening:candidate`,
        {
          recipientUserId: app.candidate.userId,
          applicationId,
          type: NotificationType.APPLICATION_STATUS_CHANGED,
          title: `Cập nhật trạng thái hồ sơ: ${jobTitle}`,
          message: `Hồ sơ ứng tuyển của bạn đã được chuyển sang giai đoạn "Sơ loại hồ sơ".`,
          payload: {
            applicationId,
            previousStage: ApplicationStage.RECEIVED,
            newStage: ApplicationStage.SCREENING,
            jobTitle,
          },
        },
      );
    }
  }

  private errorMessage(error: unknown): string {
    return error instanceof Error ? error.message : 'Unknown error';
  }
}
