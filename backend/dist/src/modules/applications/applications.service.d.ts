import { PrismaService } from '../../database/prisma.service';
import { RabbitMQService } from '../../infrastructure/rabbitmq/rabbitmq.service';
import { CreateApplicationDto } from './dto/create-application.dto';
export declare class ApplicationsService {
    private readonly prisma;
    private readonly rabbitMQService;
    private readonly logger;
    constructor(prisma: PrismaService, rabbitMQService: RabbitMQService);
    applyForJob(userId: string, createApplicationDto: CreateApplicationDto): Promise<{
        message: string;
        applicationId: string;
    }>;
    private buildEvaluationRequest;
}
