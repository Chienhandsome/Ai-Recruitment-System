import { type Prisma } from '@prisma/client';
import { PrismaService } from '../../database/prisma.service';
import { RabbitMQService } from '../../infrastructure/rabbitmq/rabbitmq.service';
export declare const MAX_EVALUATION_ATTEMPTS = 5;
export declare const EVALUATION_RETRY_BASE_DELAY_MS = 60000;
export declare class ApplicationEvaluationService {
    private readonly prisma;
    private readonly rabbitMQService;
    private readonly logger;
    constructor(prisma: PrismaService, rabbitMQService: RabbitMQService);
    dispatchNewApplication(applicationId: string, now?: Date): Promise<boolean>;
    publishClaimedApplication(applicationId: string, profileSnapshot: Prisma.JsonValue | null, evaluationAttempts: number, now?: Date): Promise<boolean>;
    markForRetry(applicationId: string, error: string, knownAttempts?: number, now?: Date): Promise<void>;
    private retryDelayMs;
    private errorMessage;
}
