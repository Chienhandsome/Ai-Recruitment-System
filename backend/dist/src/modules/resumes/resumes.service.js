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
Object.defineProperty(exports, "__esModule", { value: true });
exports.ResumesService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../../database/prisma.service");
const upload_resume_use_case_1 = require("./application/upload-resume.use-case");
let ResumesService = class ResumesService {
    prisma;
    uploadResumeUseCase;
    constructor(prisma, uploadResumeUseCase) {
        this.prisma = prisma;
        this.uploadResumeUseCase = uploadResumeUseCase;
    }
    async uploadResume(userId, file) {
        return this.uploadResumeUseCase.execute(userId, file);
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
exports.ResumesService = ResumesService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService,
        upload_resume_use_case_1.UploadResumeUseCase])
], ResumesService);
//# sourceMappingURL=resumes.service.js.map