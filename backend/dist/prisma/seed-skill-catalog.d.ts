import { PrismaClient } from '@prisma/client';
import { type SkillCatalogEntry } from './skill-catalog';
export interface SkillCatalogSeedResult {
    categories: number;
    skills: number;
    aliases: number;
    removedAmbiguousAliases: number;
    deprecatedLegacySkills: number;
    migratedCandidateSkillLinks: number;
    migratedJobSkillLinks: number;
}
export declare function seedSkillCatalog(prisma: PrismaClient, catalog?: readonly SkillCatalogEntry[]): Promise<SkillCatalogSeedResult>;
