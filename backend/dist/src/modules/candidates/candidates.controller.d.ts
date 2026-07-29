import { CandidatesService } from './candidates.service';
import { UpdateCandidateSkillsDto } from './dto/update-candidate-skills.dto';
import { UpdateCandidateProfileDto } from './dto/update-candidate-profile.dto';
import type { AuthenticatedUser } from '../auth/auth.types';
export declare class CandidatesController {
    private readonly candidatesService;
    constructor(candidatesService: CandidatesService);
    updateMyProfile(user: AuthenticatedUser, dto: UpdateCandidateProfileDto): Promise<{
        id: string;
        createdAt: Date;
        updatedAt: Date;
        address: string | null;
        status: import(".prisma/client").$Enums.CandidateProfileStatus;
        email: string;
        fullName: string;
        phone: string | null;
        userId: string | null;
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
                name: string;
                createdAt: Date;
                updatedAt: Date;
            };
        } & {
            id: string;
            name: string;
            createdAt: Date;
            updatedAt: Date;
            status: import(".prisma/client").$Enums.SkillStatus;
            normalizedName: string;
            categoryId: string;
            type: import(".prisma/client").$Enums.SkillType;
        };
    } & {
        id: string;
        createdAt: Date;
        skillId: string;
        source: import(".prisma/client").$Enums.SkillSource;
        resumeId: string | null;
        proficiencyLevel: import(".prisma/client").$Enums.ProficiencyLevel;
        yearsExperience: import("@prisma/client/runtime/library").Decimal | null;
        isPrimary: boolean;
        candidateId: string;
    })[]>;
    updateMySkills(user: AuthenticatedUser, dto: UpdateCandidateSkillsDto): Promise<({
        skill: {
            category: {
                id: string;
                name: string;
                createdAt: Date;
                updatedAt: Date;
            };
        } & {
            id: string;
            name: string;
            createdAt: Date;
            updatedAt: Date;
            status: import(".prisma/client").$Enums.SkillStatus;
            normalizedName: string;
            categoryId: string;
            type: import(".prisma/client").$Enums.SkillType;
        };
    } & {
        id: string;
        createdAt: Date;
        skillId: string;
        source: import(".prisma/client").$Enums.SkillSource;
        resumeId: string | null;
        proficiencyLevel: import(".prisma/client").$Enums.ProficiencyLevel;
        yearsExperience: import("@prisma/client/runtime/library").Decimal | null;
        isPrimary: boolean;
        candidateId: string;
    })[]>;
    removeMySkill(user: AuthenticatedUser, skillId: string): Promise<{
        message: string;
    }>;
}
