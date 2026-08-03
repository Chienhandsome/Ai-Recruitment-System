import { Injectable } from '@nestjs/common';
import type { Prisma } from '@prisma/client';
import type { ParsedResumeData } from '../../resume.types';

@Injectable()
export class ExperienceWriter {
  async write(
    tx: Prisma.TransactionClient,
    candidateProfileId: string,
    resumeId: string,
    experiences: ParsedResumeData['work_experiences'],
  ): Promise<void> {
    await tx.workExperience.deleteMany({
      where: { candidateProfileId, source: 'EXTRACTED', resumeId },
    });

    const validExperiences = experiences.filter(
      (experience) => experience.start_date,
    );
    if (validExperiences.length === 0) return;

    await tx.workExperience.createMany({
      data: validExperiences.map((experience) => ({
        candidateProfileId,
        resumeId,
        source: 'EXTRACTED',
        companyName: experience.company_name,
        positionTitle: experience.position_title,
        startDate: new Date(experience.start_date!),
        endDate: experience.end_date ? new Date(experience.end_date) : null,
        isCurrent: experience.is_current,
        description: experience.description ?? null,
        achievements: experience.achievements ?? null,
        isInferred: experience.is_inferred ?? false,
        sourceText: experience.source_text ?? null,
      })),
    });
  }
}
