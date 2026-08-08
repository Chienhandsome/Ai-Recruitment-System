import { PrismaService } from '../../database/prisma.service';
import { ResumeUploadFile, UploadResumeUseCase } from './application/upload-resume.use-case';
export declare class ResumesService {
    private readonly prisma;
    private readonly uploadResumeUseCase;
    constructor(prisma: PrismaService, uploadResumeUseCase: UploadResumeUseCase);
    uploadResume(userId: string, file: ResumeUploadFile): Promise<{
        warning?: string | undefined;
        id: string;
        originalFileName: string;
        parsingStatus: string;
        createdAt: Date;
    }>;
    getResumeStatus(userId: string, resumeId: string): Promise<{
        id: string;
        updatedAt: Date;
        createdAt: Date;
        originalFileName: string;
        parsingStatus: import(".prisma/client").$Enums.ResumeParsingStatus;
        parsingErrorMessage: string | null;
    }>;
    getMyResumes(userId: string): Promise<{
        id: string;
        updatedAt: Date;
        createdAt: Date;
        originalFileName: string;
        mimeType: string;
        fileSizeBytes: number;
        parsingStatus: import(".prisma/client").$Enums.ResumeParsingStatus;
        parsingErrorMessage: string | null;
    }[]>;
}
