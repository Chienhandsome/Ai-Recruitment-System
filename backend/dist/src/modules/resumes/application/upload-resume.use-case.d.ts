import { PrismaService } from '../../../database/prisma.service';
import { RabbitMQService } from '../../../infrastructure/rabbitmq/rabbitmq.service';
import { SupabaseStorageService } from '../../../infrastructure/supabase/supabase-storage.service';
import { AiServiceWakeupService } from '../../../infrastructure/ai/ai-service-wakeup.service';
export interface ResumeUploadFile {
    buffer: Buffer;
    originalname: string;
    mimetype: string;
    size: number;
}
export declare class UploadResumeUseCase {
    private readonly prisma;
    private readonly storageService;
    private readonly rabbitMQService;
    private readonly aiServiceWakeupService;
    private readonly logger;
    constructor(prisma: PrismaService, storageService: SupabaseStorageService, rabbitMQService: RabbitMQService, aiServiceWakeupService: AiServiceWakeupService);
    execute(userId: string, file: ResumeUploadFile): Promise<{
        warning?: string | undefined;
        id: string;
        originalFileName: string;
        parsingStatus: string;
        createdAt: Date;
    }>;
    private validateFile;
}
