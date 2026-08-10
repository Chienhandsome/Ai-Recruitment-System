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
var RetryApplicationEvaluationsUseCase_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.RetryApplicationEvaluationsUseCase = void 0;
const common_1 = require("@nestjs/common");
const schedule_1 = require("@nestjs/schedule");
const client_1 = require("@prisma/client");
const prisma_service_1 = require("../../database/prisma.service");
const application_evaluation_service_1 = require("./application-evaluation.service");
const STUCK_EVALUATION_AFTER_MS = 10 * 60_000;
const MAX_RETRY_BATCH_SIZE = 50;
let RetryApplicationEvaluationsUseCase = RetryApplicationEvaluationsUseCase_1 = class RetryApplicationEvaluationsUseCase {
    prisma;
    evaluationService;
    logger = new common_1.Logger(RetryApplicationEvaluationsUseCase_1.name);
    constructor(prisma, evaluationService) {
        this.prisma = prisma;
        this.evaluationService = evaluationService;
    }
    async runScheduled() {
        await this.execute();
    }
    async execute(now = new Date()) {
        const stuckCutoff = new Date(now.getTime() - STUCK_EVALUATION_AFTER_MS);
        await this.prisma.application.updateMany({
            where: {
                processingStatus: client_1.ApplicationProcessingStatus.MATCHING,
                evaluationAttempts: { gte: application_evaluation_service_1.MAX_EVALUATION_ATTEMPTS },
                updatedAt: { lte: stuckCutoff },
            },
            data: {
                processingStatus: client_1.ApplicationProcessingStatus.FAILED,
                nextEvaluationRetryAt: null,
                evaluationError: `Evaluation retry limit reached after ${application_evaluation_service_1.MAX_EVALUATION_ATTEMPTS} attempts without a result.`,
                updatedAt: now,
            },
        });
        const applications = await this.prisma.application.findMany({
            where: {
                evaluationAttempts: { lt: application_evaluation_service_1.MAX_EVALUATION_ATTEMPTS },
                OR: [
                    {
                        processingStatus: client_1.ApplicationProcessingStatus.FAILED,
                        nextEvaluationRetryAt: { lte: now },
                    },
                    {
                        processingStatus: client_1.ApplicationProcessingStatus.MATCHING,
                        updatedAt: { lte: stuckCutoff },
                    },
                    {
                        processingStatus: client_1.ApplicationProcessingStatus.QUEUED,
                        updatedAt: { lte: stuckCutoff },
                    },
                ],
            },
            orderBy: { updatedAt: 'asc' },
            take: MAX_RETRY_BATCH_SIZE,
            select: {
                id: true,
                processingStatus: true,
                evaluationAttempts: true,
                updatedAt: true,
                profileSnapshot: true,
            },
        });
        let publishedCount = 0;
        for (const application of applications) {
            const claimed = await this.prisma.application.updateMany({
                where: {
                    id: application.id,
                    processingStatus: application.processingStatus,
                    evaluationAttempts: application.evaluationAttempts,
                    updatedAt: application.updatedAt,
                },
                data: {
                    processingStatus: client_1.ApplicationProcessingStatus.MATCHING,
                    evaluationAttempts: { increment: 1 },
                    nextEvaluationRetryAt: null,
                    evaluationError: null,
                    updatedAt: now,
                },
            });
            if (claimed.count === 0)
                continue;
            const published = await this.evaluationService.publishClaimedApplication(application.id, application.profileSnapshot, application.evaluationAttempts + 1, now);
            if (published)
                publishedCount += 1;
        }
        if (publishedCount > 0) {
            this.logger.log(`Republished ${publishedCount} application evaluation(s)`);
        }
        return publishedCount;
    }
};
exports.RetryApplicationEvaluationsUseCase = RetryApplicationEvaluationsUseCase;
__decorate([
    (0, schedule_1.Cron)(schedule_1.CronExpression.EVERY_MINUTE),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], RetryApplicationEvaluationsUseCase.prototype, "runScheduled", null);
exports.RetryApplicationEvaluationsUseCase = RetryApplicationEvaluationsUseCase = RetryApplicationEvaluationsUseCase_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService,
        application_evaluation_service_1.ApplicationEvaluationService])
], RetryApplicationEvaluationsUseCase);
//# sourceMappingURL=retry-application-evaluations.use-case.js.map