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
var UploadResumeUseCase_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.UploadResumeUseCase = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../../../database/prisma.service");
const rabbitmq_service_1 = require("../../../infrastructure/rabbitmq/rabbitmq.service");
const rabbitmq_constants_1 = require("../../../infrastructure/rabbitmq/rabbitmq.constants");
const supabase_storage_service_1 = require("../../../infrastructure/supabase/supabase-storage.service");
const ai_service_wakeup_service_1 = require("../../../infrastructure/ai/ai-service-wakeup.service");
let UploadResumeUseCase = UploadResumeUseCase_1 = class UploadResumeUseCase {
    prisma;
    storageService;
    rabbitMQService;
    aiServiceWakeupService;
    logger = new common_1.Logger(UploadResumeUseCase_1.name);
    constructor(prisma, storageService, rabbitMQService, aiServiceWakeupService) {
        this.prisma = prisma;
        this.storageService = storageService;
        this.rabbitMQService = rabbitMQService;
        this.aiServiceWakeupService = aiServiceWakeupService;
    }
    async execute(userId, file) {
        const profile = await this.prisma.candidateProfile.findUnique({
            where: { userId },
        });
        if (!profile) {
            throw new common_1.NotFoundException(`Candidate profile for user ${userId} not found.`);
        }
        this.validateFile(file);
        const resume = await this.prisma.resume.create({
            data: {
                candidateId: profile.id,
                source: 'CANDIDATE_UPLOAD',
                originalFileName: file.originalname,
                storageBucket: 'resumes',
                objectPath: '',
                mimeType: file.mimetype,
                fileSizeBytes: file.size,
                parsingStatus: 'PENDING',
            },
        });
        try {
            const upload = await this.storageService.uploadCandidateResume(file.buffer, file.originalname, file.mimetype, {
                candidateProfileId: profile.id,
                resumeId: resume.id,
                fileName: file.originalname,
            });
            await this.prisma.resume.update({
                where: { id: resume.id },
                data: { objectPath: upload.objectPath },
            });
            await this.prisma.candidateProfile.update({
                where: { id: profile.id },
                data: { primaryResumeId: resume.id },
            });
            let published = false;
            try {
                const { signedUrl } = await this.storageService.createSignedDownloadUrl(upload.objectPath, 5 * 60);
                published = await this.rabbitMQService.publish(rabbitmq_constants_1.RABBITMQ_ROUTING_KEYS.RESUME_ANALYSIS_REQUESTED, {
                    resumeId: resume.id,
                    candidateProfileId: profile.id,
                    objectPath: upload.objectPath,
                    mimeType: file.mimetype,
                    originalFileName: file.originalname,
                    signedDownloadUrl: signedUrl,
                    requestedAt: new Date().toISOString(),
                });
            }
            catch (dispatchError) {
                this.logger.warn(`Resume ${resume.id} dispatch failed and will be retried: ${dispatchError instanceof Error
                    ? dispatchError.message
                    : 'Unknown error'}`);
            }
            if (published) {
                void this.aiServiceWakeupService.wake();
                try {
                    await this.prisma.$transaction([
                        this.prisma.resume.update({
                            where: { id: resume.id },
                            data: { parsingStatus: 'PROCESSING' },
                        }),
                        this.prisma.candidateProfile.update({
                            where: { id: profile.id },
                            data: { status: 'PROCESSING' },
                        }),
                    ]);
                }
                catch (statusError) {
                    this.logger.error(`Resume ${resume.id} was queued but status update failed: ${statusError instanceof Error
                        ? statusError.message
                        : 'Unknown error'}`);
                    return {
                        id: resume.id,
                        originalFileName: resume.originalFileName,
                        parsingStatus: 'PENDING',
                        createdAt: resume.createdAt,
                        warning: 'CV đã vào hàng đợi nhưng trạng thái đang được đồng bộ.',
                    };
                }
            }
            else {
                this.logger.warn(`Resume ${resume.id} is stored as PENDING because publish failed.`);
            }
            return {
                id: resume.id,
                originalFileName: resume.originalFileName,
                parsingStatus: published ? 'PROCESSING' : 'PENDING',
                createdAt: resume.createdAt,
                ...(!published && {
                    warning: 'CV đã được lưu nhưng chưa thể đưa vào hàng đợi xử lý.',
                }),
            };
        }
        catch (error) {
            await this.prisma.resume.update({
                where: { id: resume.id },
                data: {
                    parsingStatus: 'FAILED',
                    parsingErrorMessage: error instanceof Error ? error.message : 'Upload failed',
                },
            });
            this.logger.error(`Resume ${resume.id} upload failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
            throw new common_1.BadRequestException('Không thể tải lên CV. Vui lòng thử lại.');
        }
    }
    validateFile(file) {
        const allowedMimes = new Set([
            'application/pdf',
            'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        ]);
        if (!allowedMimes.has(file.mimetype)) {
            throw new common_1.BadRequestException('Chỉ chấp nhận file PDF hoặc DOCX.');
        }
        if (file.size > 5 * 1024 * 1024) {
            throw new common_1.BadRequestException('File vượt quá kích thước tối đa 5MB.');
        }
    }
};
exports.UploadResumeUseCase = UploadResumeUseCase;
exports.UploadResumeUseCase = UploadResumeUseCase = UploadResumeUseCase_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService,
        supabase_storage_service_1.SupabaseStorageService,
        rabbitmq_service_1.RabbitMQService,
        ai_service_wakeup_service_1.AiServiceWakeupService])
], UploadResumeUseCase);
//# sourceMappingURL=upload-resume.use-case.js.map