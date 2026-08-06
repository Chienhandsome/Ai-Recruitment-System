import { OnModuleInit } from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';
import { RabbitMQService } from '../../infrastructure/rabbitmq/rabbitmq.service';
export declare class ApplicationsConsumer implements OnModuleInit {
    private readonly prisma;
    private readonly rabbitMQService;
    private readonly logger;
    constructor(prisma: PrismaService, rabbitMQService: RabbitMQService);
    onModuleInit(): void;
    handleMessage(message: any): Promise<void>;
}
