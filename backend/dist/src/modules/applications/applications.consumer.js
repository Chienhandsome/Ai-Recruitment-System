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
const prisma_service_1 = require("../../database/prisma.service");
const rabbitmq_service_1 = require("../../infrastructure/rabbitmq/rabbitmq.service");
const rabbitmq_constants_1 = require("../../infrastructure/rabbitmq/rabbitmq.constants");
const client_1 = require("@prisma/client");
const ai_result_dto_1 = require("./dto/ai-result.dto");
let ApplicationsConsumer = ApplicationsConsumer_1 = class ApplicationsConsumer {
    prisma;
    rabbitMQService;
    logger = new common_1.Logger(ApplicationsConsumer_1.name);
    constructor(prisma, rabbitMQService) {
        this.prisma = prisma;
        this.rabbitMQService = rabbitMQService;
    }
    onModuleInit() {
        this.rabbitMQService.subscribe(rabbitmq_constants_1.RABBITMQ_QUEUES.EVALUATION_QUEUE + '_result', [
            rabbitmq_constants_1.RABBITMQ_ROUTING_KEYS.EVALUATION_COMPLETED,
            rabbitmq_constants_1.RABBITMQ_ROUTING_KEYS.EVALUATION_FAILED,
        ], this.handleMessage.bind(this)).catch(err => {
            this.logger.error('Failed to subscribe to RabbitMQ', err);
        });
    }
    async handleMessage(message) {
        this.logger.log(`Received AI Evaluation result for application ${message.applicationId}`);
        if (!message.applicationId) {
            this.logger.error('Message is missing applicationId');
            return;
        }
        const { applicationId, status, result, error } = message;
        if (status === 'COMPLETED' && result) {
            try {
                const validatedResult = ai_result_dto_1.AiResultSchema.parse(result);
                const matchLevel = (['HIGH', 'MEDIUM', 'LOW'].includes(validatedResult.match_level) ? validatedResult.match_level : 'LOW');
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
                        },
                    });
                    await prisma.application.update({
                        where: { id: applicationId },
                        data: { processingStatus: client_1.ApplicationProcessingStatus.COMPLETED },
                    });
                });
                this.logger.log(`Successfully updated AI Evaluation for application ${applicationId}`);
            }
            catch (err) {
                this.logger.error(`Failed to update DB for application ${applicationId}: ${err?.message || err}`, err?.stack);
                await this.prisma.application.update({
                    where: { id: applicationId },
                    data: { processingStatus: client_1.ApplicationProcessingStatus.FAILED },
                });
            }
        }
        else {
            this.logger.warn(`AI Evaluation failed for application ${applicationId}: ${error}`);
            try {
                await this.prisma.application.update({
                    where: { id: applicationId },
                    data: { processingStatus: client_1.ApplicationProcessingStatus.FAILED },
                });
            }
            catch (err) {
                this.logger.error(`Failed to update FAILED status for application ${applicationId}`, err);
            }
        }
    }
};
exports.ApplicationsConsumer = ApplicationsConsumer;
exports.ApplicationsConsumer = ApplicationsConsumer = ApplicationsConsumer_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService,
        rabbitmq_service_1.RabbitMQService])
], ApplicationsConsumer);
//# sourceMappingURL=applications.consumer.js.map