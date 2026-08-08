import type { Prisma } from '@prisma/client';
import type { ParsedResumeData } from '../../resume.types';
export declare class CertificateWriter {
    write(tx: Prisma.TransactionClient, candidateProfileId: string, resumeId: string, certificates: ParsedResumeData['certificates']): Promise<void>;
}
