import { PrismaService } from '../../database/prisma.service';
import { CreateApplicationDto } from './dto/create-application.dto';
import { ApplicationEvaluationService } from './application-evaluation.service';
export declare class ApplicationsService {
    private readonly prisma;
    private readonly evaluationService;
    private readonly logger;
    constructor(prisma: PrismaService, evaluationService: ApplicationEvaluationService);
    applyForJob(userId: string, createApplicationDto: CreateApplicationDto, now?: Date): Promise<{
        message: string;
        applicationId: string;
        evaluationStatus: string;
    }>;
    private buildProfileSnapshot;
    private toStringArray;
    private errorMessage;
}
