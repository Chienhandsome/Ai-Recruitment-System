import { PrismaService } from '../../../database/prisma.service';
import { SkillNormalizerService } from '../domain/skill-normalizer.service';
import type { ParsedResumeData, ResolvedResumeSkill } from '../resume.types';
export declare class SkillResolverService {
    private readonly prisma;
    private readonly normalizer;
    constructor(prisma: PrismaService, normalizer: SkillNormalizerService);
    resolveAll(skills: ParsedResumeData['skills']): Promise<ResolvedResumeSkill[]>;
    private resolveOrQueue;
}
