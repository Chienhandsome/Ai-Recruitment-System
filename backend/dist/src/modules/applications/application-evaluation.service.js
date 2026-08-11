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
var ApplicationEvaluationService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.ApplicationEvaluationService = exports.EVALUATION_RETRY_BASE_DELAY_MS = exports.MAX_EVALUATION_ATTEMPTS = void 0;
const common_1 = require("@nestjs/common");
const client_1 = require("@prisma/client");
const prisma_service_1 = require("../../database/prisma.service");
const rabbitmq_service_1 = require("../../infrastructure/rabbitmq/rabbitmq.service");
const rabbitmq_constants_1 = require("../../infrastructure/rabbitmq/rabbitmq.constants");
const application_evaluation_snapshot_1 = require("./application-evaluation.snapshot");
exports.MAX_EVALUATION_ATTEMPTS = 5;
exports.EVALUATION_RETRY_BASE_DELAY_MS = 60_000;
const MAX_RETRY_DELAY_MS = 15 * 60_000;
let ApplicationEvaluationService = ApplicationEvaluationService_1 = class ApplicationEvaluationService {
    prisma;
    rabbitMQService;
    logger = new common_1.Logger(ApplicationEvaluationService_1.name);
    constructor(prisma, rabbitMQService) {
        this.prisma = prisma;
        this.rabbitMQService = rabbitMQService;
    }
    async dispatchNewApplication(applicationId, now = new Date()) {
        const claimed = await this.prisma.application.update({
            where: { id: applicationId },
            data: {
                processingStatus: client_1.ApplicationProcessingStatus.MATCHING,
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
        return this.publishClaimedApplication(applicationId, claimed.profileSnapshot, claimed.evaluationAttempts, now);
    }
    async publishClaimedApplication(applicationId, profileSnapshot, evaluationAttempts, now = new Date()) {
        const message = (0, application_evaluation_snapshot_1.createEvaluationMessage)(applicationId, profileSnapshot);
        if (!message) {
            await this.markForRetry(applicationId, 'Application evaluation snapshot is missing or invalid.', evaluationAttempts, now);
            return false;
        }
        let published = false;
        try {
            published = await this.rabbitMQService.publish(rabbitmq_constants_1.RABBITMQ_ROUTING_KEYS.EVALUATION_REQUESTED, message);
        }
        catch (error) {
            this.logger.error(`Evaluation publish threw for application ${applicationId}: ${this.errorMessage(error)}`);
        }
        if (!published) {
            await this.markForRetry(applicationId, 'RabbitMQ is unavailable; evaluation will be retried.', evaluationAttempts, now);
            return false;
        }
        this.logger.log(`Queued evaluation for application ${applicationId} (attempt ${evaluationAttempts})`);
        return true;
    }
    async markForRetry(applicationId, error, knownAttempts, now = new Date()) {
        let attempts = knownAttempts;
        if (attempts === undefined) {
            const application = await this.prisma.application.findUnique({
                where: { id: applicationId },
                select: {
                    evaluationAttempts: true,
                    processingStatus: true,
                },
            });
            if (!application ||
                application.processingStatus === client_1.ApplicationProcessingStatus.COMPLETED) {
                return;
            }
            attempts = application.evaluationAttempts;
        }
        const exhausted = attempts >= exports.MAX_EVALUATION_ATTEMPTS;
        const nextRetryAt = exhausted
            ? null
            : new Date(now.getTime() + this.retryDelayMs(attempts));
        const errorMessage = exhausted
            ? `Evaluation retry limit reached after ${attempts} attempts: ${error}`
            : error;
        await this.prisma.application.updateMany({
            where: {
                id: applicationId,
                processingStatus: { not: client_1.ApplicationProcessingStatus.COMPLETED },
            },
            data: {
                processingStatus: client_1.ApplicationProcessingStatus.FAILED,
                nextEvaluationRetryAt: nextRetryAt,
                evaluationError: errorMessage,
                updatedAt: now,
            },
        });
    }
    retryDelayMs(attempts) {
        const exponentialDelay = exports.EVALUATION_RETRY_BASE_DELAY_MS * 2 ** Math.max(0, attempts - 1);
        return Math.min(exponentialDelay, MAX_RETRY_DELAY_MS);
    }
    errorMessage(error) {
        return error instanceof Error ? error.message : 'Unknown error';
    }
};
exports.ApplicationEvaluationService = ApplicationEvaluationService;
exports.ApplicationEvaluationService = ApplicationEvaluationService = ApplicationEvaluationService_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService,
        rabbitmq_service_1.RabbitMQService])
], ApplicationEvaluationService);
//# sourceMappingURL=application-evaluation.service.js.map