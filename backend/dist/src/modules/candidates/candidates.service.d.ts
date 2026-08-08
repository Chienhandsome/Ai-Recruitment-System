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
    getCandidateSkills(candidateProfileId: string): Promise<({
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
    updateCandidateSkills(candidateProfileId: string, dto: UpdateCandidateSkillsDto): Promise<({
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
    removeCandidateSkill(candidateProfileId: string, skillId: string): Promise<void>;
    private resolveProfile;
}
