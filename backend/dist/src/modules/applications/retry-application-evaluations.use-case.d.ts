import { PrismaService } from '../../database/prisma.service';
import { ApplicationEvaluationService } from './application-evaluation.service';
export declare class RetryApplicationEvaluationsUseCase {
    private readonly prisma;
    private readonly evaluationService;
    private readonly logger;
    constructor(prisma: PrismaService, evaluationService: ApplicationEvaluationService);
    runScheduled(): Promise<void>;
    execute(now?: Date): Promise<number>;
}
