import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../../database/prisma.service';
import { SkillNormalizerService } from '../domain/skill-normalizer.service';
import type { ParsedResumeData, ResolvedResumeSkill } from '../resume.types';

@Injectable()
export class SkillResolverService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly normalizer: SkillNormalizerService,
  ) {}

  async resolveAll(
    skills: ParsedResumeData['skills'],
  ): Promise<ResolvedResumeSkill[]> {
    const resolved: ResolvedResumeSkill[] = [];

    for (const skill of skills) {
      const dbSkill = await this.resolveOrQueue(
        skill.name,
        skill.category_hint,
      );
      if (!dbSkill) continue;

      resolved.push({
        skillId: dbSkill.id,
        proficiencyLevel: skill.proficiency_level,
        isInferred: skill.is_inferred ?? false,
        sourceText: skill.source_text ?? null,
      });
    }

    return resolved;
  }

  private async resolveOrQueue(skillName: string, categoryHint?: string) {
    const trimmed = skillName.trim();
    const normalized = this.normalizer.normalize(trimmed);
    if (!trimmed || !normalized) return null;

    const existing = await this.prisma.skill.findFirst({
      where: {
        status: 'ACTIVE',
        OR: [
          { normalizedName: normalized },
          { name: { equals: trimmed, mode: 'insensitive' } },
        ],
      },
    });
    if (existing) return existing;

    const queued =
      (await this.prisma.unrecognizedSkill.findUnique({
        where: { normalizedName: normalized },
      })) ??
      (await this.prisma.unrecognizedSkill.findFirst({
        where: {
          rawSkillName: { equals: trimmed, mode: 'insensitive' },
        },
      }));

    if (queued) {
      await this.prisma.unrecognizedSkill.update({
        where: { id: queued.id },
        data: {
          normalizedName: queued.normalizedName ?? normalized,
          categoryHint: categoryHint ?? queued.categoryHint,
          frequency: { increment: 1 },
        },
      });
      return null;
    }

    try {
      await this.prisma.unrecognizedSkill.create({
        data: {
          rawSkillName: trimmed,
          normalizedName: normalized,
          categoryHint: categoryHint ?? null,
          status: 'PENDING',
        },
      });
    } catch (error) {
      if ((error as { code?: string }).code !== 'P2002') throw error;
      // Another worker may have queued the same normalized skill concurrently.
      await this.prisma.unrecognizedSkill.update({
        where: { normalizedName: normalized },
        data: { frequency: { increment: 1 } },
      });
    }
    return null;
  }
}
