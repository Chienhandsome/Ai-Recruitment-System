import { PrismaService } from '../../../database/prisma.service';
import { RabbitMQService } from '../../../infrastructure/rabbitmq/rabbitmq.service';
import { SupabaseStorageService } from '../../../infrastructure/supabase/supabase-storage.service';
export declare class RetryStuckResumesUseCase {
    private readonly prisma;
    private readonly rabbitMQService;
    private readonly storageService;
    private readonly logger;
    constructor(prisma: PrismaService, rabbitMQService: RabbitMQService, storageService: SupabaseStorageService);
    runScheduled(): Promise<void>;
    execute(now?: Date): Promise<number>;
    private releaseClaim;
}
