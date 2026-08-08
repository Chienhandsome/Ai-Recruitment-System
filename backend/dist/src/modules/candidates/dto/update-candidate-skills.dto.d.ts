import { ProficiencyLevel } from '@prisma/client';
export declare class CandidateSkillItemDto {
    skillId: string;
    proficiencyLevel: ProficiencyLevel;
    isPrimary?: boolean;
}
export declare class UpdateCandidateSkillsDto {
    skills: CandidateSkillItemDto[];
}
