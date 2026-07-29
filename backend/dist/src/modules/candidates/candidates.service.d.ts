import { PrismaService } from '../../database/prisma.service';
import { CandidateProfileStatus } from '@prisma/client';
import { UpdateCandidateSkillsDto } from './dto/update-candidate-skills.dto';
import { UpdateCandidateProfileDto } from './dto/update-candidate-profile.dto';
export interface ResolvedCandidateProfile {
    id: string;
    userId: string | null;
    status: CandidateProfileStatus;
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
    createdAt: Date;
    updatedAt: Date;
}
export declare class CandidatesService {
    private readonly prisma;
    private readonly logger;
    constructor(prisma: PrismaService);
    getResolvedProfile(candidateProfileId: string): Promise<ResolvedCandidateProfile>;
    getResolvedProfileByUserId(userId: string): Promise<ResolvedCandidateProfile>;
    updateProfileStatus(candidateProfileId: string, status: CandidateProfileStatus): Promise<void>;
    setPrimaryResume(candidateProfileId: string, resumeId: string): Promise<void>;
    updateProfile(userId: string, dto: UpdateCandidateProfileDto): Promise<{
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
    getCandidateSkills(candidateProfileId: string): Promise<({
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
    updateCandidateSkills(candidateProfileId: string, dto: UpdateCandidateSkillsDto): Promise<({
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
    removeCandidateSkill(candidateProfileId: string, skillId: string): Promise<void>;
    private resolveProfile;
}
