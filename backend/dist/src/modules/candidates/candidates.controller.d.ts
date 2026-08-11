import { CandidatesService } from './candidates.service';
import { UpdateCandidateSkillsDto } from './dto/update-candidate-skills.dto';
import { UpdateCandidateProfileDto } from './dto/update-candidate-profile.dto';
import type { AuthenticatedUser } from '../auth/auth.types';
export declare class CandidatesController {
    private readonly candidatesService;
    constructor(candidatesService: CandidatesService);
    updateMyProfile(user: AuthenticatedUser, dto: UpdateCandidateProfileDto): Promise<{
        id: string;
        status: import(".prisma/client").$Enums.CandidateProfileStatus;
        createdAt: Date;
        updatedAt: Date;
        phone: string | null;
        email: string;
        fullName: string;
        userId: string | null;
        primaryResumeId: string | null;
        address: string | null;
        desiredTitle: string | null;
        professionalSummary: string | null;
        linkedinUrl: string | null;
        githubUrl: string | null;
        portfolioUrl: string | null;
        expectedMinSalary: import("@prisma/client/runtime/library").Decimal | null;
        expectedMaxSalary: import("@prisma/client/runtime/library").Decimal | null;
        preferredModel: import(".prisma/client").$Enums.WorkingModel | null;
    }>;
    getMySkills(user: AuthenticatedUser): Promise<({
        skill: {
            category: {
                id: string;
                createdAt: Date;
                updatedAt: Date;
                name: string;
            };
        } & {
            id: string;
            status: import(".prisma/client").$Enums.SkillStatus;
            createdAt: Date;
            updatedAt: Date;
            categoryId: string;
            name: string;
            normalizedName: string;
            type: import(".prisma/client").$Enums.SkillType;
        };
    } & {
        id: string;
        createdAt: Date;
        skillId: string;
        candidateId: string;
        source: import(".prisma/client").$Enums.SkillSource;
        proficiencyLevel: import(".prisma/client").$Enums.ProficiencyLevel;
        isPrimary: boolean;
        isInferred: boolean;
        sourceText: string | null;
        resumeId: string | null;
    })[]>;
    updateMySkills(user: AuthenticatedUser, dto: UpdateCandidateSkillsDto): Promise<({
        skill: {
            category: {
                id: string;
                createdAt: Date;
                updatedAt: Date;
                name: string;
            };
        } & {
            id: string;
            status: import(".prisma/client").$Enums.SkillStatus;
            createdAt: Date;
            updatedAt: Date;
            categoryId: string;
            name: string;
            normalizedName: string;
            type: import(".prisma/client").$Enums.SkillType;
        };
    } & {
        id: string;
        createdAt: Date;
        skillId: string;
        candidateId: string;
        source: import(".prisma/client").$Enums.SkillSource;
        proficiencyLevel: import(".prisma/client").$Enums.ProficiencyLevel;
        isPrimary: boolean;
        isInferred: boolean;
        sourceText: string | null;
        resumeId: string | null;
    })[]>;
    removeMySkill(user: AuthenticatedUser, skillId: string): Promise<{
        message: string;
    }>;
}
