import type { Prisma } from '@prisma/client';
import type { ParsedResumeData } from '../../resume.types';
export declare class ExperienceWriter {
    write(tx: Prisma.TransactionClient, candidateProfileId: string, resumeId: string, experiences: ParsedResumeData['work_experiences']): Promise<void>;
}
