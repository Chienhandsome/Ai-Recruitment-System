import { ResumesService } from './resumes.service';
import type { AuthenticatedUser } from '../auth/auth.types';
export declare class ResumesController {
    private readonly resumesService;
    constructor(resumesService: ResumesService);
    uploadResume(user: AuthenticatedUser, file: Express.Multer.File): Promise<{
        id: string;
        originalFileName: string;
        parsingStatus: string;
        createdAt: Date;
    }>;
    getResumeStatus(user: AuthenticatedUser, resumeId: string): Promise<{
        id: string;
        createdAt: Date;
        updatedAt: Date;
        originalFileName: string;
        parsingStatus: import(".prisma/client").$Enums.ResumeParsingStatus;
        parsingErrorMessage: string | null;
    }>;
    getMyResumes(user: AuthenticatedUser): Promise<{
        id: string;
        createdAt: Date;
        updatedAt: Date;
        mimeType: string;
        originalFileName: string;
        fileSizeBytes: number;
        parsingStatus: import(".prisma/client").$Enums.ResumeParsingStatus;
        parsingErrorMessage: string | null;
    }[]>;
}
