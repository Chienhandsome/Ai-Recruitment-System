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
      const dbSkill = await this.findOrCreate(skill.name);
      if (dbSkill) {
        resolved.push({
          skillId: dbSkill.id,
          proficiencyLevel: skill.proficiency_level,
        });
      }
    }

    return resolved;
  }

  private async findOrCreate(skillName: string) {
    const trimmed = skillName.trim();
    const normalized = this.normalizer.normalize(trimmed);
    if (!trimmed || !normalized) return null;

    const existing = await this.prisma.skill.findFirst({
      where: {
        OR: [
          { normalizedName: normalized },
          { name: { equals: trimmed, mode: 'insensitive' } },
        ],
      },
    });
    if (existing) return existing;

    const category = await this.getOrCreateDefaultCategory();
    try {
      return await this.prisma.skill.create({
        data: {
          name: trimmed,
          normalizedName: normalized,
          categoryId: category.id,
          type: 'HARD',
          status: 'ACTIVE',
        },
      });
    } catch {
      return this.prisma.skill.findFirst({
        where: { normalizedName: normalized },
      });
    }
  }

  private async getOrCreateDefaultCategory() {
    const preferred = await this.prisma.skillCategory.findFirst({
      where: { name: 'Công nghệ thông tin (IT)' },
    });
    if (preferred) return preferred;

    const fallback = await this.prisma.skillCategory.findFirst();
    if (fallback) return fallback;

    return this.prisma.skillCategory.create({
      data: { name: 'Công nghệ thông tin (IT)' },
    });
  }
}
