import type { Prisma } from '@prisma/client';
import type { ResolvedResumeSkill } from '../../resume.types';
export declare class SkillWriter {
    private readonly logger;
    write(tx: Prisma.TransactionClient, candidateProfileId: string, resumeId: string, skills: ResolvedResumeSkill[]): Promise<void>;
}
