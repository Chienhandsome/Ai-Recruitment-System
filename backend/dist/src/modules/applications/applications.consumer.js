"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var ApplicationsConsumer_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.ApplicationsConsumer = void 0;
const common_1 = require("@nestjs/common");
const client_1 = require("@prisma/client");
const zod_1 = require("zod");
const prisma_service_1 = require("../../database/prisma.service");
const rabbitmq_service_1 = require("../../infrastructure/rabbitmq/rabbitmq.service");
const rabbitmq_constants_1 = require("../../infrastructure/rabbitmq/rabbitmq.constants");
const application_evaluation_service_1 = require("./application-evaluation.service");
const ai_result_dto_1 = require("./dto/ai-result.dto");
const EvaluationResultMessageSchema = zod_1.z.object({
    applicationId: zod_1.z.string().min(1),
    status: zod_1.z.enum(['COMPLETED', 'FAILED']),
    result: zod_1.z.unknown().optional(),
    error: zod_1.z.string().optional(),
});
let ApplicationsConsumer = ApplicationsConsumer_1 = class ApplicationsConsumer {
    prisma;
    rabbitMQService;
    evaluationService;
    logger = new common_1.Logger(ApplicationsConsumer_1.name);
    constructor(prisma, rabbitMQService, evaluationService) {
        this.prisma = prisma;
        this.rabbitMQService = rabbitMQService;
        this.evaluationService = evaluationService;
    }
    onModuleInit() {
        this.rabbitMQService
            .subscribe(`${rabbitmq_constants_1.RABBITMQ_QUEUES.EVALUATION_QUEUE}_result`, [
            rabbitmq_constants_1.RABBITMQ_ROUTING_KEYS.EVALUATION_COMPLETED,
            rabbitmq_constants_1.RABBITMQ_ROUTING_KEYS.EVALUATION_FAILED,
        ], this.handleMessage.bind(this))
            .catch((error) => {
            this.logger.error(`Failed to subscribe to RabbitMQ: ${this.errorMessage(error)}`);
        });
    }
    async handleMessage(rawMessage) {
        const parsedMessage = EvaluationResultMessageSchema.safeParse(rawMessage);
        if (!parsedMessage.success) {
            this.logger.error('Invalid AI evaluation result message');
            return;
        }
        const { applicationId, status, result, error } = parsedMessage.data;
        this.logger.log(`Received AI evaluation result for application ${applicationId}`);
        if (status === 'COMPLETED' && result) {
            try {
                const validatedResult = ai_result_dto_1.AiResultSchema.parse(result);
                const matchLevel = (['HIGH', 'MEDIUM', 'LOW'].includes(validatedResult.match_level)
                    ? validatedResult.match_level
                    : 'LOW');
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
                            candidateExperienceLevel: experienceAssessment?.candidate_level ?? null,
                            requiredExperienceLevel: experienceAssessment?.required_level ?? null,
                            totalExperienceYears: experienceAssessment?.total_experience_years ?? null,
                            levelFitScore: experienceAssessment?.level_fit_score ?? null,
                            levelGap: experienceAssessment?.level_gap ?? null,
                            levelEligible: experienceAssessment?.level_eligible ?? null,
                            levelConfidence: experienceAssessment?.level_confidence ?? null,
                            levelEvidence: experienceAssessment
                                ? {
                                    evidence: experienceAssessment.evidence,
                                    reasonCodes: experienceAssessment.reason_codes,
                                    recommendation: experienceAssessment.recommendation,
                                    requirementMode: experienceAssessment.level_requirement_mode,
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
                            processingStatus: client_1.ApplicationProcessingStatus.COMPLETED,
                            nextEvaluationRetryAt: null,
                            evaluationError: null,
                        },
                    });
                    const promoted = await prisma.application.updateMany({
                        where: {
                            id: applicationId,
                            currentStage: client_1.ApplicationStage.RECEIVED,
                        },
                        data: {
                            currentStage: client_1.ApplicationStage.SCREENING,
                            hrDecision: client_1.HrDecision.CONSIDER,
                        },
                    });
                    if (promoted.count === 1) {
                        await prisma.applicationStatusHistory.create({
                            data: {
                                applicationId,
                                previousStage: client_1.ApplicationStage.RECEIVED,
                                newStage: client_1.ApplicationStage.SCREENING,
                                changedByUserId: null,
                                note: 'AI evaluation completed; application entered screening.',
                            },
                        });
                    }
                });
                if (experienceAssessment) {
                    this.logger.log(JSON.stringify({
                        event: 'experience_level_evaluated',
                        application_id: applicationId,
                        candidate_level: experienceAssessment.candidate_level,
                        required_level: experienceAssessment.required_level,
                        level_gap: experienceAssessment.level_gap,
                        eligible: experienceAssessment.level_eligible,
                        confidence: experienceAssessment.level_confidence,
                        algorithm_version: 'experience-level-v1',
                    }));
                }
                this.logger.log(`Successfully updated AI evaluation for application ${applicationId}`);
            }
            catch (caughtError) {
                this.logger.error(`Failed to persist AI evaluation for application ${applicationId}: ${this.errorMessage(caughtError)}`, caughtError instanceof Error ? caughtError.stack : undefined);
                await this.evaluationService.markForRetry(applicationId, this.errorMessage(caughtError));
            }
            return;
        }
        const failureReason = error ?? 'AI evaluation failed without a reason.';
        this.logger.warn(`AI evaluation failed for application ${applicationId}: ${failureReason}`);
        try {
            await this.evaluationService.markForRetry(applicationId, failureReason);
        }
        catch (caughtError) {
            this.logger.error(`Failed to schedule retry for application ${applicationId}: ${this.errorMessage(caughtError)}`);
        }
    }
    errorMessage(error) {
        return error instanceof Error ? error.message : 'Unknown error';
    }
};
exports.ApplicationsConsumer = ApplicationsConsumer;
exports.ApplicationsConsumer = ApplicationsConsumer = ApplicationsConsumer_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService,
        rabbitmq_service_1.RabbitMQService,
        application_evaluation_service_1.ApplicationEvaluationService])
], ApplicationsConsumer);
//# sourceMappingURL=applications.consumer.js.map