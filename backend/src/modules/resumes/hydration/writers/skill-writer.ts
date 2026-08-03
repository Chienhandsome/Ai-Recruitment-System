import { Injectable, Logger } from '@nestjs/common';
import type { Prisma } from '@prisma/client';
import type { ResolvedResumeSkill } from '../../resume.types';

@Injectable()
export class SkillWriter {
  private readonly logger = new Logger(SkillWriter.name);

  async write(
    tx: Prisma.TransactionClient,
    candidateProfileId: string,
    resumeId: string,
    skills: ResolvedResumeSkill[],
  ): Promise<void> {
    // The profile should only expose extracted skills from its current CV.
    // SELF_DECLARED/VERIFIED rows are protected by the source predicate.
    await tx.candidateSkill.deleteMany({
      where: { candidateId: candidateProfileId, source: 'EXTRACTED' },
    });

    for (const skill of skills) {
      const existing = await tx.candidateSkill.findUnique({
        where: {
          candidateId_skillId: {
            candidateId: candidateProfileId,
            skillId: skill.skillId,
          },
        },
      });

      if (existing && existing.source !== 'EXTRACTED') {
        this.logger.debug(
          `Keeping ${existing.source} skill ${skill.skillId} for candidate ${candidateProfileId}`,
        );
        continue;
      }

      await tx.candidateSkill.upsert({
        where: {
          candidateId_skillId: {
            candidateId: candidateProfileId,
            skillId: skill.skillId,
          },
        },
        create: {
          candidateId: candidateProfileId,
          skillId: skill.skillId,
          resumeId,
          proficiencyLevel: skill.proficiencyLevel,
          isPrimary: false,
          source: 'EXTRACTED',
          isInferred: skill.isInferred,
          sourceText: skill.sourceText,
        },
        update: {
          proficiencyLevel: skill.proficiencyLevel,
          resumeId,
          source: 'EXTRACTED',
          isInferred: skill.isInferred,
          sourceText: skill.sourceText,
        },
      });
    }
  }
}
