import { Injectable } from '@nestjs/common';
import type { Prisma } from '@prisma/client';
import type { ParsedResumeData } from '../../resume.types';

@Injectable()
export class EducationWriter {
  async write(
    tx: Prisma.TransactionClient,
    candidateProfileId: string,
    resumeId: string,
    educations: ParsedResumeData['educations'],
  ): Promise<void> {
    await tx.education.deleteMany({
      where: { candidateProfileId, source: 'EXTRACTED', resumeId },
    });

    if (educations.length === 0) return;

    await tx.education.createMany({
      data: educations.map((education) => ({
        candidateProfileId,
        resumeId,
        source: 'EXTRACTED',
        schoolName: education.school_name,
        major: education.major ?? null,
        degree: education.degree ?? null,
        startDate: education.start_date ? new Date(education.start_date) : null,
        endDate: education.end_date ? new Date(education.end_date) : null,
        description: education.description ?? null,
      })),
    });
  }
}
