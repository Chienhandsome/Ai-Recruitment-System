import { PrismaService } from '../../../database/prisma.service';
export declare class ResumeGuardService {
    private readonly prisma;
    private readonly logger;
    constructor(prisma: PrismaService);
    isPrimaryResume(resumeId: string, candidateProfileId: string): Promise<boolean>;
    canHydrate(resumeId: string, candidateProfileId: string): Promise<boolean>;
}
