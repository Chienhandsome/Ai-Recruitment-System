import { OnModuleInit } from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';
import { RabbitMQService } from '../../infrastructure/rabbitmq/rabbitmq.service';
import { ApplicationEvaluationService } from './application-evaluation.service';
export declare class ApplicationsConsumer implements OnModuleInit {
    private readonly prisma;
    private readonly rabbitMQService;
    private readonly evaluationService;
    private readonly logger;
    constructor(prisma: PrismaService, rabbitMQService: RabbitMQService, evaluationService: ApplicationEvaluationService);
    onModuleInit(): void;
    handleMessage(rawMessage: unknown): Promise<void>;
    private errorMessage;
}
