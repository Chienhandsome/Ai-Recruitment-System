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
var RetryStuckResumesUseCase_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.RetryStuckResumesUseCase = void 0;
const common_1 = require("@nestjs/common");
const schedule_1 = require("@nestjs/schedule");
const prisma_service_1 = require("../../../database/prisma.service");
const rabbitmq_service_1 = require("../../../infrastructure/rabbitmq/rabbitmq.service");
const rabbitmq_constants_1 = require("../../../infrastructure/rabbitmq/rabbitmq.constants");
const supabase_storage_service_1 = require("../../../infrastructure/supabase/supabase-storage.service");
const STUCK_AFTER_MS = 10 * 60 * 1000;
const MAX_BATCH_SIZE = 50;
let RetryStuckResumesUseCase = RetryStuckResumesUseCase_1 = class RetryStuckResumesUseCase {
    prisma;
    rabbitMQService;
    storageService;
    logger = new common_1.Logger(RetryStuckResumesUseCase_1.name);
    constructor(prisma, rabbitMQService, storageService) {
        this.prisma = prisma;
        this.rabbitMQService = rabbitMQService;
        this.storageService = storageService;
    }
    async runScheduled() {
        await this.execute();
    }
    async execute(now = new Date()) {
        const cutoff = new Date(now.getTime() - STUCK_AFTER_MS);
        const resumes = await this.prisma.resume.findMany({
            where: {
                objectPath: { not: '' },
                OR: [
                    { parsingStatus: 'PENDING', createdAt: { lte: cutoff } },
                    { parsingStatus: 'PROCESSING', updatedAt: { lte: cutoff } },
                ],
            },
            orderBy: { createdAt: 'asc' },
            take: MAX_BATCH_SIZE,
            select: {
                id: true,
                candidateId: true,
                objectPath: true,
                mimeType: true,
                originalFileName: true,
                parsingStatus: true,
            },
        });
        let publishedCount = 0;
        for (const resume of resumes) {
            const profile = await this.prisma.candidateProfile.findUnique({
                where: { id: resume.candidateId },
                select: { primaryResumeId: true },
            });
            if (profile?.primaryResumeId !== resume.id) {
                await this.prisma.resume.updateMany({
                    where: {
                        id: resume.id,
                        parsingStatus: { in: ['PENDING', 'PROCESSING'] },
                    },
                    data: { parsingStatus: 'SUPERSEDED' },
                });
                continue;
            }
            const claimed = await this.prisma.resume.updateMany({
                where: {
                    id: resume.id,
                    parsingStatus: resume.parsingStatus,
                    ...(resume.parsingStatus === 'PENDING'
                        ? { createdAt: { lte: cutoff } }
                        : { updatedAt: { lte: cutoff } }),
                },
                data: {
                    parsingStatus: 'PROCESSING',
                    parsingErrorMessage: null,
                    updatedAt: now,
                },
            });
            if (claimed.count === 0)
                continue;
            let signedDownloadUrl;
            try {
                const signed = await this.storageService.createSignedDownloadUrl(resume.objectPath, 5 * 60);
                signedDownloadUrl = signed.signedUrl;
            }
            catch (error) {
                this.logger.error(`Cannot refresh signed URL for resume ${resume.id}: ${error instanceof Error ? error.message : 'Unknown error'}`);
                await this.prisma.resume.updateMany({
                    where: { id: resume.id, parsingStatus: 'PROCESSING' },
                    data: {
                        parsingStatus: 'FAILED',
                        parsingErrorMessage: 'File not found in storage. Cannot create signed URL.',
                    },
                });
                continue;
            }
            let published = false;
            try {
                published = await this.rabbitMQService.publish(rabbitmq_constants_1.RABBITMQ_ROUTING_KEYS.RESUME_ANALYSIS_REQUESTED, {
                    resumeId: resume.id,
                    candidateProfileId: resume.candidateId,
                    objectPath: resume.objectPath,
                    mimeType: resume.mimeType,
                    originalFileName: resume.originalFileName,
                    signedDownloadUrl,
                    requestedAt: now.toISOString(),
                });
            }
            catch (error) {
                this.logger.error(`Cannot republish resume ${resume.id}: ${error instanceof Error ? error.message : 'Unknown error'}`);
            }
            if (!published) {
                await this.releaseClaim(resume.id);
                continue;
            }
            try {
                await this.prisma.candidateProfile.updateMany({
                    where: { id: resume.candidateId, primaryResumeId: resume.id },
                    data: { status: 'PROCESSING' },
                });
            }
            catch (error) {
                this.logger.error(`Resume ${resume.id} was republished but profile status update failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
            }
            publishedCount += 1;
        }
        if (publishedCount > 0) {
            this.logger.log(`Republished ${publishedCount} stuck resume(s)`);
        }
        return publishedCount;
    }
    async releaseClaim(resumeId) {
        await this.prisma.resume.updateMany({
            where: { id: resumeId, parsingStatus: 'PROCESSING' },
            data: { parsingStatus: 'PENDING' },
        });
    }
};
exports.RetryStuckResumesUseCase = RetryStuckResumesUseCase;
__decorate([
    (0, schedule_1.Cron)(schedule_1.CronExpression.EVERY_MINUTE),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], RetryStuckResumesUseCase.prototype, "runScheduled", null);
exports.RetryStuckResumesUseCase = RetryStuckResumesUseCase = RetryStuckResumesUseCase_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService,
        rabbitmq_service_1.RabbitMQService,
        supabase_storage_service_1.SupabaseStorageService])
], RetryStuckResumesUseCase);
//# sourceMappingURL=retry-stuck-resumes.use-case.js.map