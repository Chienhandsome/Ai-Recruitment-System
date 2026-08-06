import type { Prisma } from '@prisma/client';
import type { ParsedResumeData } from '../../resume.types';
export declare class ProfileWriter {
    write(tx: Prisma.TransactionClient, candidateProfileId: string, resumeId: string, parsedData: ParsedResumeData): Promise<boolean>;
}
