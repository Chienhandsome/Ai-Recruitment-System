import { Injectable } from '@nestjs/common';
import type { Prisma } from '@prisma/client';
import type { ParsedResumeData } from '../../resume.types';

@Injectable()
export class ProfileWriter {
  async write(
    tx: Prisma.TransactionClient,
    candidateProfileId: string,
    resumeId: string,
    parsedData: ParsedResumeData,
  ): Promise<boolean> {
    const result = await tx.candidateProfile.updateMany({
      where: { id: candidateProfileId, primaryResumeId: resumeId },
      data: {
        status: 'READY',
        professionalSummary:
          parsedData.summary !== undefined ? parsedData.summary : undefined,
        desiredTitle:
          parsedData.desired_title !== undefined
            ? parsedData.desired_title
            : undefined,
      },
    });
    return result.count === 1;
  }
}
