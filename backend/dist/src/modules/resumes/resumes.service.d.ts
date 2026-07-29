import { PrismaService } from '../../database/prisma.service';
import { SupabaseStorageService } from '../../infrastructure/supabase/supabase-storage.service';
import { RabbitMQService } from '../../infrastructure/rabbitmq/rabbitmq.service';
export declare class ResumesService {
    private readonly prisma;
    private readonly storageService;
    private readonly rabbitMQService;
    private readonly logger;
    constructor(prisma: PrismaService, storageService: SupabaseStorageService, rabbitMQService: RabbitMQService);
    uploadResume(userId: string, file: {
        buffer: Buffer;
        originalname: string;
        mimetype: string;
        size: number;
    }): Promise<{
        id: string;
        originalFileName: string;
        parsingStatus: string;
        createdAt: Date;
    }>;
    getResumeStatus(userId: string, resumeId: string): Promise<{
        id: string;
        createdAt: Date;
        updatedAt: Date;
        originalFileName: string;
        parsingStatus: import(".prisma/client").$Enums.ResumeParsingStatus;
        parsingErrorMessage: string | null;
    }>;
    getMyResumes(userId: string): Promise<{
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
