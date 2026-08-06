import { JobsService } from './jobs.service';
import { CreateJobDto } from './dto/create-job.dto';
import { UpdateJobDto } from './dto/update-job.dto';
import { QueryJobDto } from './dto/query-job.dto';
import type { AuthenticatedUser } from '../auth/auth.types';
export declare class JobsController {
    private readonly jobsService;
    constructor(jobsService: JobsService);
    create(user: AuthenticatedUser, createJobDto: CreateJobDto): Promise<{
        applications: ({
            candidate: {
                user: {
                    id: string;
                    fullName: string;
                    email: string;
                    phone: string | null;
                    avatarUrl: string | null;
                } | null;
            } & {
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
            };
            aiMatchingResults: {
                id: string;
                updatedAt: Date;
                createdAt: Date;
                applicationId: string;
                version: number;
                overallScore: import("@prisma/client/runtime/library").Decimal;
                matchLevel: import(".prisma/client").$Enums.MatchLevel;
                skillScore: import("@prisma/client/runtime/library").Decimal | null;
                experienceScore: import("@prisma/client/runtime/library").Decimal | null;
                educationScore: import("@prisma/client/runtime/library").Decimal | null;
                projectScore: import("@prisma/client/runtime/library").Decimal | null;
                matchedSkills: import("@prisma/client/runtime/library").JsonValue | null;
                missingSkills: import("@prisma/client/runtime/library").JsonValue | null;
                missingRequiredSkills: import("@prisma/client/runtime/library").JsonValue | null;
                strengths: import("@prisma/client/runtime/library").JsonValue | null;
                gaps: import("@prisma/client/runtime/library").JsonValue | null;
                weaknesses: import("@prisma/client/runtime/library").JsonValue | null;
                evidence: import("@prisma/client/runtime/library").JsonValue | null;
                confidenceScore: import("@prisma/client/runtime/library").Decimal | null;
                reasoningSummary: string | null;
                inputSnapshot: import("@prisma/client/runtime/library").JsonValue | null;
                modelVersion: string | null;
            }[];
        } & {
            id: string;
            jobId: string;
            candidateId: string;
            resumeId: string;
            source: import(".prisma/client").$Enums.ApplicationSource;
            profileSnapshot: import("@prisma/client/runtime/library").JsonValue | null;
            processingStatus: import(".prisma/client").$Enums.ApplicationProcessingStatus;
            currentStage: import(".prisma/client").$Enums.ApplicationStage;
            hrDecision: import(".prisma/client").$Enums.HrDecision;
            hrNotes: string | null;
            appliedAt: Date;
            updatedAt: Date;
        })[];
        department: {
            id: string;
            updatedAt: Date;
            name: string;
            createdAt: Date;
            status: import(".prisma/client").$Enums.DepartmentStatus;
            code: string;
            companyId: string;
        } | null;
        category: {
            id: string;
            updatedAt: Date;
            name: string;
            slug: string;
            createdAt: Date;
        } | null;
        jobSkills: ({
            skill: {
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
            jobId: string;
            createdAt: Date;
            skillId: string;
            requirementType: import(".prisma/client").$Enums.SkillRequirementType;
            minimumProficiency: import(".prisma/client").$Enums.ProficiencyLevel | null;
            weight: import("@prisma/client/runtime/library").Decimal;
            minYearsExperience: number | null;
        })[];
        jobCertificates: {
            id: string;
            jobId: string;
            requirementType: import(".prisma/client").$Enums.SkillRequirementType;
            certificateName: string;
        }[];
    } & {
        id: string;
        updatedAt: Date;
        createdAt: Date;
        status: import(".prisma/client").$Enums.JobStatus;
        jobCode: string;
        title: string;
        recruiterId: string;
        departmentId: string | null;
        description: string;
        requirements: string | null;
        benefits: string | null;
        employmentType: import(".prisma/client").$Enums.EmploymentType;
        experienceLevel: import(".prisma/client").$Enums.ExperienceLevel;
        minSalary: import("@prisma/client/runtime/library").Decimal | null;
        maxSalary: import("@prisma/client/runtime/library").Decimal | null;
        currency: string;
        location: string | null;
        requiredExperienceYears: number | null;
        autoShortlistThreshold: import("@prisma/client/runtime/library").Decimal | null;
        autoRejectThreshold: import("@prisma/client/runtime/library").Decimal | null;
        rejectOnMissingMandatory: boolean;
        skillWeight: import("@prisma/client/runtime/library").Decimal;
        experienceWeight: import("@prisma/client/runtime/library").Decimal;
        educationWeight: import("@prisma/client/runtime/library").Decimal;
        otherWeight: import("@prisma/client/runtime/library").Decimal;
        expiryDate: Date | null;
        publishedAt: Date | null;
        closedAt: Date | null;
        categoryId: string | null;
        workingModel: import(".prisma/client").$Enums.WorkingModel;
        requiresProofOfWork: boolean;
        proofOfWorkType: import(".prisma/client").$Enums.ProofType | null;
    }>;
    findAll(user: AuthenticatedUser, query: QueryJobDto): Promise<{
        data: ({
            _count: {
                applications: number;
            };
            department: {
                id: string;
                updatedAt: Date;
                name: string;
                createdAt: Date;
                status: import(".prisma/client").$Enums.DepartmentStatus;
                code: string;
                companyId: string;
            } | null;
            category: {
                id: string;
                updatedAt: Date;
                name: string;
                slug: string;
                createdAt: Date;
            } | null;
        } & {
            id: string;
            updatedAt: Date;
            createdAt: Date;
            status: import(".prisma/client").$Enums.JobStatus;
            jobCode: string;
            title: string;
            recruiterId: string;
            departmentId: string | null;
            description: string;
            requirements: string | null;
            benefits: string | null;
            employmentType: import(".prisma/client").$Enums.EmploymentType;
            experienceLevel: import(".prisma/client").$Enums.ExperienceLevel;
            minSalary: import("@prisma/client/runtime/library").Decimal | null;
            maxSalary: import("@prisma/client/runtime/library").Decimal | null;
            currency: string;
            location: string | null;
            requiredExperienceYears: number | null;
            autoShortlistThreshold: import("@prisma/client/runtime/library").Decimal | null;
            autoRejectThreshold: import("@prisma/client/runtime/library").Decimal | null;
            rejectOnMissingMandatory: boolean;
            skillWeight: import("@prisma/client/runtime/library").Decimal;
            experienceWeight: import("@prisma/client/runtime/library").Decimal;
            educationWeight: import("@prisma/client/runtime/library").Decimal;
            otherWeight: import("@prisma/client/runtime/library").Decimal;
            expiryDate: Date | null;
            publishedAt: Date | null;
            closedAt: Date | null;
            categoryId: string | null;
            workingModel: import(".prisma/client").$Enums.WorkingModel;
            requiresProofOfWork: boolean;
            proofOfWorkType: import(".prisma/client").$Enums.ProofType | null;
        })[];
        meta: {
            total: number;
            page: number;
            limit: number;
            totalPages: number;
        };
    }>;
    findOne(user: AuthenticatedUser, id: string): Promise<{
        applications: ({
            candidate: {
                user: {
                    id: string;
                    fullName: string;
                    email: string;
                    phone: string | null;
                    avatarUrl: string | null;
                } | null;
                candidateSkills: ({
                    skill: {
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
                })[];
                workExperiences: {
                    id: string;
                    resumeId: string | null;
                    source: import(".prisma/client").$Enums.DataSource;
                    updatedAt: Date;
                    createdAt: Date;
                    description: string | null;
                    isInferred: boolean;
                    sourceText: string | null;
                    candidateProfileId: string;
                    companyName: string;
                    positionTitle: string;
                    startDate: Date;
                    endDate: Date | null;
                    isCurrent: boolean;
                    achievements: string | null;
                }[];
                educations: {
                    id: string;
                    resumeId: string | null;
                    source: import(".prisma/client").$Enums.DataSource;
                    updatedAt: Date;
                    createdAt: Date;
                    description: string | null;
                    isInferred: boolean;
                    sourceText: string | null;
                    candidateProfileId: string;
                    startDate: Date | null;
                    endDate: Date | null;
                    schoolName: string;
                    major: string | null;
                    degree: string | null;
                }[];
                projects: {
                    id: string;
                    resumeId: string | null;
                    source: import(".prisma/client").$Enums.DataSource;
                    updatedAt: Date;
                    createdAt: Date;
                    description: string | null;
                    isInferred: boolean;
                    sourceText: string | null;
                    candidateProfileId: string;
                    startDate: Date | null;
                    endDate: Date | null;
                    projectName: string;
                    projectRole: string | null;
                    technologies: import("@prisma/client/runtime/library").JsonValue | null;
                    projectUrl: string | null;
                }[];
            } & {
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
            };
            aiMatchingResults: {
                id: string;
                updatedAt: Date;
                createdAt: Date;
                applicationId: string;
                version: number;
                overallScore: import("@prisma/client/runtime/library").Decimal;
                matchLevel: import(".prisma/client").$Enums.MatchLevel;
                skillScore: import("@prisma/client/runtime/library").Decimal | null;
                experienceScore: import("@prisma/client/runtime/library").Decimal | null;
                educationScore: import("@prisma/client/runtime/library").Decimal | null;
                projectScore: import("@prisma/client/runtime/library").Decimal | null;
                matchedSkills: import("@prisma/client/runtime/library").JsonValue | null;
                missingSkills: import("@prisma/client/runtime/library").JsonValue | null;
                missingRequiredSkills: import("@prisma/client/runtime/library").JsonValue | null;
                strengths: import("@prisma/client/runtime/library").JsonValue | null;
                gaps: import("@prisma/client/runtime/library").JsonValue | null;
                weaknesses: import("@prisma/client/runtime/library").JsonValue | null;
                evidence: import("@prisma/client/runtime/library").JsonValue | null;
                confidenceScore: import("@prisma/client/runtime/library").Decimal | null;
                reasoningSummary: string | null;
                inputSnapshot: import("@prisma/client/runtime/library").JsonValue | null;
                modelVersion: string | null;
            }[];
        } & {
            id: string;
            jobId: string;
            candidateId: string;
            resumeId: string;
            source: import(".prisma/client").$Enums.ApplicationSource;
            profileSnapshot: import("@prisma/client/runtime/library").JsonValue | null;
            processingStatus: import(".prisma/client").$Enums.ApplicationProcessingStatus;
            currentStage: import(".prisma/client").$Enums.ApplicationStage;
            hrDecision: import(".prisma/client").$Enums.HrDecision;
            hrNotes: string | null;
            appliedAt: Date;
            updatedAt: Date;
        })[];
        department: {
            id: string;
            updatedAt: Date;
            name: string;
            createdAt: Date;
            status: import(".prisma/client").$Enums.DepartmentStatus;
            code: string;
            companyId: string;
        } | null;
        category: {
            id: string;
            updatedAt: Date;
            name: string;
            slug: string;
            createdAt: Date;
        } | null;
        jobSkills: ({
            skill: {
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
            jobId: string;
            createdAt: Date;
            skillId: string;
            requirementType: import(".prisma/client").$Enums.SkillRequirementType;
            minimumProficiency: import(".prisma/client").$Enums.ProficiencyLevel | null;
            weight: import("@prisma/client/runtime/library").Decimal;
            minYearsExperience: number | null;
        })[];
        jobCertificates: {
            id: string;
            jobId: string;
            requirementType: import(".prisma/client").$Enums.SkillRequirementType;
            certificateName: string;
        }[];
    } & {
        id: string;
        updatedAt: Date;
        createdAt: Date;
        status: import(".prisma/client").$Enums.JobStatus;
        jobCode: string;
        title: string;
        recruiterId: string;
        departmentId: string | null;
        description: string;
        requirements: string | null;
        benefits: string | null;
        employmentType: import(".prisma/client").$Enums.EmploymentType;
        experienceLevel: import(".prisma/client").$Enums.ExperienceLevel;
        minSalary: import("@prisma/client/runtime/library").Decimal | null;
        maxSalary: import("@prisma/client/runtime/library").Decimal | null;
        currency: string;
        location: string | null;
        requiredExperienceYears: number | null;
        autoShortlistThreshold: import("@prisma/client/runtime/library").Decimal | null;
        autoRejectThreshold: import("@prisma/client/runtime/library").Decimal | null;
        rejectOnMissingMandatory: boolean;
        skillWeight: import("@prisma/client/runtime/library").Decimal;
        experienceWeight: import("@prisma/client/runtime/library").Decimal;
        educationWeight: import("@prisma/client/runtime/library").Decimal;
        otherWeight: import("@prisma/client/runtime/library").Decimal;
        expiryDate: Date | null;
        publishedAt: Date | null;
        closedAt: Date | null;
        categoryId: string | null;
        workingModel: import(".prisma/client").$Enums.WorkingModel;
        requiresProofOfWork: boolean;
        proofOfWorkType: import(".prisma/client").$Enums.ProofType | null;
    }>;
    update(user: AuthenticatedUser, id: string, updateJobDto: UpdateJobDto): Promise<{
        department: {
            id: string;
            updatedAt: Date;
            name: string;
            createdAt: Date;
            status: import(".prisma/client").$Enums.DepartmentStatus;
            code: string;
            companyId: string;
        } | null;
        category: {
            id: string;
            updatedAt: Date;
            name: string;
            slug: string;
            createdAt: Date;
        } | null;
        jobSkills: ({
            skill: {
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
            jobId: string;
            createdAt: Date;
            skillId: string;
            requirementType: import(".prisma/client").$Enums.SkillRequirementType;
            minimumProficiency: import(".prisma/client").$Enums.ProficiencyLevel | null;
            weight: import("@prisma/client/runtime/library").Decimal;
            minYearsExperience: number | null;
        })[];
        jobCertificates: {
            id: string;
            jobId: string;
            requirementType: import(".prisma/client").$Enums.SkillRequirementType;
            certificateName: string;
        }[];
    } & {
        id: string;
        updatedAt: Date;
        createdAt: Date;
        status: import(".prisma/client").$Enums.JobStatus;
        jobCode: string;
        title: string;
        recruiterId: string;
        departmentId: string | null;
        description: string;
        requirements: string | null;
        benefits: string | null;
        employmentType: import(".prisma/client").$Enums.EmploymentType;
        experienceLevel: import(".prisma/client").$Enums.ExperienceLevel;
        minSalary: import("@prisma/client/runtime/library").Decimal | null;
        maxSalary: import("@prisma/client/runtime/library").Decimal | null;
        currency: string;
        location: string | null;
        requiredExperienceYears: number | null;
        autoShortlistThreshold: import("@prisma/client/runtime/library").Decimal | null;
        autoRejectThreshold: import("@prisma/client/runtime/library").Decimal | null;
        rejectOnMissingMandatory: boolean;
        skillWeight: import("@prisma/client/runtime/library").Decimal;
        experienceWeight: import("@prisma/client/runtime/library").Decimal;
        educationWeight: import("@prisma/client/runtime/library").Decimal;
        otherWeight: import("@prisma/client/runtime/library").Decimal;
        expiryDate: Date | null;
        publishedAt: Date | null;
        closedAt: Date | null;
        categoryId: string | null;
        workingModel: import(".prisma/client").$Enums.WorkingModel;
        requiresProofOfWork: boolean;
        proofOfWorkType: import(".prisma/client").$Enums.ProofType | null;
    }>;
    remove(user: AuthenticatedUser, id: string): Promise<{
        message: string;
    }>;
}
