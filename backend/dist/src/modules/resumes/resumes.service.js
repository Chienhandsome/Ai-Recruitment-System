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
var ResumesService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.ResumesService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../../database/prisma.service");
const supabase_storage_service_1 = require("../../infrastructure/supabase/supabase-storage.service");
const rabbitmq_service_1 = require("../../infrastructure/rabbitmq/rabbitmq.service");
const rabbitmq_constants_1 = require("../../infrastructure/rabbitmq/rabbitmq.constants");
let ResumesService = ResumesService_1 = class ResumesService {
    prisma;
    storageService;
    rabbitMQService;
    logger = new common_1.Logger(ResumesService_1.name);
    constructor(prisma, storageService, rabbitMQService) {
        this.prisma = prisma;
        this.storageService = storageService;
        this.rabbitMQService = rabbitMQService;
    }
    async uploadResume(userId, file) {
        const profile = await this.prisma.candidateProfile.findUnique({
            where: { userId },
        });
        if (!profile) {
            throw new common_1.NotFoundException(`Candidate profile for user ${userId} not found.`);
        }
        const allowedMimes = [
            'application/pdf',
            'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        ];
        if (!allowedMimes.includes(file.mimetype)) {
            throw new common_1.BadRequestException('Chỉ chấp nhận file PDF hoặc DOCX.');
        }
        const maxSizeBytes = 5 * 1024 * 1024;
        if (file.size > maxSizeBytes) {
            throw new common_1.BadRequestException('File vượt quá kích thước tối đa 5MB.');
        }
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
        this.logger.log(`Resume ${resume.id} created for candidate ${profile.id} (PENDING)`);
        try {
            const uploadResult = await this.storageService.uploadCandidateResume(file.buffer, file.originalname, file.mimetype, {
                candidateProfileId: profile.id,
                resumeId: resume.id,
                fileName: file.originalname,
            });
            await this.prisma.resume.update({
                where: { id: resume.id },
                data: { objectPath: uploadResult.objectPath },
            });
            await this.prisma.candidateProfile.update({
                where: { id: profile.id },
                data: {
                    primaryResumeId: resume.id,
                    status: 'PROCESSING',
                },
            });
            const published = await this.rabbitMQService.publish(rabbitmq_constants_1.RABBITMQ_ROUTING_KEYS.RESUME_ANALYSIS_REQUESTED, {
                resumeId: resume.id,
                candidateProfileId: profile.id,
                objectPath: uploadResult.objectPath,
                mimeType: file.mimetype,
                originalFileName: file.originalname,
                requestedAt: new Date().toISOString(),
            });
            if (published) {
                await this.prisma.resume.update({
                    where: { id: resume.id },
                    data: { parsingStatus: 'PROCESSING' },
                });
                this.logger.log(`Resume ${resume.id} uploaded and analysis requested via RabbitMQ`);
            }
            else {
                this.logger.warn(`Resume ${resume.id} uploaded but RabbitMQ publish failed. Status remains PENDING.`);
            }
            return {
                id: resume.id,
                originalFileName: resume.originalFileName,
                parsingStatus: published ? 'PROCESSING' : 'PENDING',
                createdAt: resume.createdAt,
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
    async getResumeStatus(userId, resumeId) {
        const profile = await this.prisma.candidateProfile.findUnique({
            where: { userId },
        });
        if (!profile) {
            throw new common_1.NotFoundException('Candidate profile not found.');
        }
        const resume = await this.prisma.resume.findFirst({
            where: {
                id: resumeId,
                candidateId: profile.id,
            },
            select: {
                id: true,
                originalFileName: true,
                parsingStatus: true,
                parsingErrorMessage: true,
                createdAt: true,
                updatedAt: true,
            },
        });
        if (!resume) {
            throw new common_1.NotFoundException(`Resume ${resumeId} not found.`);
        }
        return resume;
    }
    async getMyResumes(userId) {
        const profile = await this.prisma.candidateProfile.findUnique({
            where: { userId },
        });
        if (!profile) {
            throw new common_1.NotFoundException('Candidate profile not found.');
        }
        return this.prisma.resume.findMany({
            where: { candidateId: profile.id },
            select: {
                id: true,
                originalFileName: true,
                mimeType: true,
                fileSizeBytes: true,
                parsingStatus: true,
                parsingErrorMessage: true,
                createdAt: true,
                updatedAt: true,
            },
            orderBy: { createdAt: 'desc' },
        });
    }
};
exports.ResumesService = ResumesService;
exports.ResumesService = ResumesService = ResumesService_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService,
        supabase_storage_service_1.SupabaseStorageService,
        rabbitmq_service_1.RabbitMQService])
], ResumesService);
//# sourceMappingURL=resumes.service.js.map