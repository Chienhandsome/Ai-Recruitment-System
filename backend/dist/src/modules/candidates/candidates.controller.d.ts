import { CandidatesService } from './candidates.service';
import { UpdateCandidateSkillsDto } from './dto/update-candidate-skills.dto';
import { UpdateCandidateProfileDto } from './dto/update-candidate-profile.dto';
import type { AuthenticatedUser } from '../auth/auth.types';
export declare class CandidatesController {
    private readonly candidatesService;
    constructor(candidatesService: CandidatesService);
    updateMyProfile(user: AuthenticatedUser, dto: UpdateCandidateProfileDto): Promise<{
        id: string;
        updatedAt: Date;
        createdAt: Date;
        userId: string | null;
        status: import(".prisma/client").$Enums.CandidateProfileStatus;
        fullName: string;
        email: string;
        phone: string | null;
        address: string | null;
        desiredTitle: string | null;
        professionalSummary: string | null;
        linkedinUrl: string | null;
        githubUrl: string | null;
        portfolioUrl: string | null;
        primaryResumeId: string | null;
        expectedMinSalary: import("@prisma/client/runtime/library").Decimal | null;
        expectedMaxSalary: import("@prisma/client/runtime/library").Decimal | null;
        preferredModel: import(".prisma/client").$Enums.WorkingModel | null;
    }>;
    getMySkills(user: AuthenticatedUser): Promise<({
        skill: {
            category: {
                id: string;
                updatedAt: Date;
                name: string;
                createdAt: Date;
            };
        } & {
            id: string;
            updatedAt: Date;
            name: string;
            createdAt: Date;
            status: import(".prisma/client").$Enums.SkillStatus;
            categoryId: string;
            normalizedName: string;
            type: import(".prisma/client").$Enums.SkillType;
        };
    } & {
        id: string;
        candidateId: string;
        resumeId: string | null;
        source: import(".prisma/client").$Enums.SkillSource;
        createdAt: Date;
        skillId: string;
        proficiencyLevel: import(".prisma/client").$Enums.ProficiencyLevel;
        isPrimary: boolean;
        isInferred: boolean;
        sourceText: string | null;
    })[]>;
    updateMySkills(user: AuthenticatedUser, dto: UpdateCandidateSkillsDto): Promise<({
        skill: {
            category: {
                id: string;
                updatedAt: Date;
                name: string;
                createdAt: Date;
            };
        } & {
            id: string;
            updatedAt: Date;
            name: string;
            createdAt: Date;
            status: import(".prisma/client").$Enums.SkillStatus;
            categoryId: string;
            normalizedName: string;
            type: import(".prisma/client").$Enums.SkillType;
        };
    } & {
        id: string;
        candidateId: string;
        resumeId: string | null;
        source: import(".prisma/client").$Enums.SkillSource;
        createdAt: Date;
        skillId: string;
        proficiencyLevel: import(".prisma/client").$Enums.ProficiencyLevel;
        isPrimary: boolean;
        isInferred: boolean;
        sourceText: string | null;
    })[]>;
    removeMySkill(user: AuthenticatedUser, skillId: string): Promise<{
        message: string;
    }>;
}
