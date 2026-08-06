import type { Prisma } from '@prisma/client';
import type { ParsedResumeData } from '../../resume.types';
export declare class EducationWriter {
    write(tx: Prisma.TransactionClient, candidateProfileId: string, resumeId: string, educations: ParsedResumeData['educations']): Promise<void>;
}
