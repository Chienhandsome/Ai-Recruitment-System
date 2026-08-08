import type { Prisma } from '@prisma/client';
import type { ParsedResumeData } from '../../resume.types';
export declare class ProjectWriter {
    write(tx: Prisma.TransactionClient, candidateProfileId: string, resumeId: string, projects: ParsedResumeData['projects']): Promise<void>;
}
