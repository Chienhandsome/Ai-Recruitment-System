import { PrismaService } from '../../database/prisma.service';
import { CreateJobDto } from './dto/create-job.dto';
import { UpdateJobDto } from './dto/update-job.dto';
import { QueryJobDto } from './dto/query-job.dto';
import { Prisma } from '@prisma/client';
import { QueryCandidateJobDto } from './dto/query-candidate-job.dto';
export declare class JobsService {
    private readonly prisma;
    constructor(prisma: PrismaService);
    private getRecruiterProfile;
    private generateJobCode;
    getJobCategories(): Promise<{
        id: string;
        updatedAt: Date;
        name: string;
        slug: string;
        createdAt: Date;
    }[]>;
    create(userId: string, dto: CreateJobDto): Promise<{
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
                expectedMinSalary: Prisma.Decimal | null;
                expectedMaxSalary: Prisma.Decimal | null;
                preferredModel: import(".prisma/client").$Enums.WorkingModel | null;
            };
            aiMatchingResults: {
                id: string;
                updatedAt: Date;
                createdAt: Date;
                applicationId: string;
                version: number;
                overallScore: Prisma.Decimal;
                matchLevel: import(".prisma/client").$Enums.MatchLevel;
                skillScore: Prisma.Decimal | null;
                experienceScore: Prisma.Decimal | null;
                educationScore: Prisma.Decimal | null;
                projectScore: Prisma.Decimal | null;
                matchedSkills: Prisma.JsonValue | null;
                missingSkills: Prisma.JsonValue | null;
                missingRequiredSkills: Prisma.JsonValue | null;
                strengths: Prisma.JsonValue | null;
                gaps: Prisma.JsonValue | null;
                weaknesses: Prisma.JsonValue | null;
                evidence: Prisma.JsonValue | null;
                confidenceScore: Prisma.Decimal | null;
                reasoningSummary: string | null;
                inputSnapshot: Prisma.JsonValue | null;
                modelVersion: string | null;
            }[];
        } & {
            id: string;
            jobId: string;
            candidateId: string;
            resumeId: string;
            source: import(".prisma/client").$Enums.ApplicationSource;
            profileSnapshot: Prisma.JsonValue | null;
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
            weight: Prisma.Decimal;
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
        minSalary: Prisma.Decimal | null;
        maxSalary: Prisma.Decimal | null;
        currency: string;
        location: string | null;
        requiredExperienceYears: number | null;
        autoShortlistThreshold: Prisma.Decimal | null;
        autoRejectThreshold: Prisma.Decimal | null;
        rejectOnMissingMandatory: boolean;
        skillWeight: Prisma.Decimal;
        experienceWeight: Prisma.Decimal;
        educationWeight: Prisma.Decimal;
        otherWeight: Prisma.Decimal;
        expiryDate: Date | null;
        publishedAt: Date | null;
        closedAt: Date | null;
        categoryId: string | null;
        workingModel: import(".prisma/client").$Enums.WorkingModel;
        requiresProofOfWork: boolean;
        proofOfWorkType: import(".prisma/client").$Enums.ProofType | null;
    }>;
    findAll(userId: string, query: QueryJobDto): Promise<{
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
            minSalary: Prisma.Decimal | null;
            maxSalary: Prisma.Decimal | null;
            currency: string;
            location: string | null;
            requiredExperienceYears: number | null;
            autoShortlistThreshold: Prisma.Decimal | null;
            autoRejectThreshold: Prisma.Decimal | null;
            rejectOnMissingMandatory: boolean;
            skillWeight: Prisma.Decimal;
            experienceWeight: Prisma.Decimal;
            educationWeight: Prisma.Decimal;
            otherWeight: Prisma.Decimal;
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
    findCandidateJobs(query: QueryCandidateJobDto): Promise<{
        data: {
            id: string;
            jobCode: string;
            title: string;
            company: {
                id: string;
                name: string;
                logoUrl: string | null;
            } | null;
            department: {
                id: string;
                name: string;
            } | null;
            category: {
                id: string;
                name: string;
                slug: string;
            } | null;
            employmentType: import(".prisma/client").$Enums.EmploymentType;
            experienceLevel: import(".prisma/client").$Enums.ExperienceLevel;
            workingModel: import(".prisma/client").$Enums.WorkingModel;
            location: string | null;
            minSalary: number | null;
            maxSalary: number | null;
            currency: string;
            publishedAt: Date;
            expiryDate: Date | null;
            skills: {
                id: string;
                name: string;
                requirementType: import(".prisma/client").$Enums.SkillRequirementType;
            }[];
        }[];
        meta: {
            total: number;
            page: number;
            limit: number;
            totalPages: number;
        };
    }>;
    findCandidateJobById(id: string, userId: string): Promise<{
        description: string;
        requirements: string | null;
        benefits: string | null;
        requiredExperienceYears: number | null;
        requiresProofOfWork: boolean;
        proofOfWorkType: import(".prisma/client").$Enums.ProofType | null;
        certificates: {
            id: string;
            name: string;
            requirementType: import(".prisma/client").$Enums.SkillRequirementType;
        }[];
        hasApplied: boolean;
        application: {
            id: string;
            status: import(".prisma/client").$Enums.ApplicationProcessingStatus;
            createdAt: Date;
        } | null;
        id: string;
        jobCode: string;
        title: string;
        company: {
            id: string;
            name: string;
            logoUrl: string | null;
        } | null;
        department: {
            id: string;
            name: string;
        } | null;
        category: {
            id: string;
            name: string;
            slug: string;
        } | null;
        employmentType: import(".prisma/client").$Enums.EmploymentType;
        experienceLevel: import(".prisma/client").$Enums.ExperienceLevel;
        workingModel: import(".prisma/client").$Enums.WorkingModel;
        location: string | null;
        minSalary: number | null;
        maxSalary: number | null;
        currency: string;
        publishedAt: Date;
        expiryDate: Date | null;
        skills: {
            id: string;
            name: string;
            requirementType: import(".prisma/client").$Enums.SkillRequirementType;
        }[];
    }>;
    private toCandidateJobSummary;
    findOne(userId: string, id: string): Promise<{
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
                    technologies: Prisma.JsonValue | null;
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
                expectedMinSalary: Prisma.Decimal | null;
                expectedMaxSalary: Prisma.Decimal | null;
                preferredModel: import(".prisma/client").$Enums.WorkingModel | null;
            };
            aiMatchingResults: {
                id: string;
                updatedAt: Date;
                createdAt: Date;
                applicationId: string;
                version: number;
                overallScore: Prisma.Decimal;
                matchLevel: import(".prisma/client").$Enums.MatchLevel;
                skillScore: Prisma.Decimal | null;
                experienceScore: Prisma.Decimal | null;
                educationScore: Prisma.Decimal | null;
                projectScore: Prisma.Decimal | null;
                matchedSkills: Prisma.JsonValue | null;
                missingSkills: Prisma.JsonValue | null;
                missingRequiredSkills: Prisma.JsonValue | null;
                strengths: Prisma.JsonValue | null;
                gaps: Prisma.JsonValue | null;
                weaknesses: Prisma.JsonValue | null;
                evidence: Prisma.JsonValue | null;
                confidenceScore: Prisma.Decimal | null;
                reasoningSummary: string | null;
                inputSnapshot: Prisma.JsonValue | null;
                modelVersion: string | null;
            }[];
        } & {
            id: string;
            jobId: string;
            candidateId: string;
            resumeId: string;
            source: import(".prisma/client").$Enums.ApplicationSource;
            profileSnapshot: Prisma.JsonValue | null;
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
            weight: Prisma.Decimal;
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
        minSalary: Prisma.Decimal | null;
        maxSalary: Prisma.Decimal | null;
        currency: string;
        location: string | null;
        requiredExperienceYears: number | null;
        autoShortlistThreshold: Prisma.Decimal | null;
        autoRejectThreshold: Prisma.Decimal | null;
        rejectOnMissingMandatory: boolean;
        skillWeight: Prisma.Decimal;
        experienceWeight: Prisma.Decimal;
        educationWeight: Prisma.Decimal;
        otherWeight: Prisma.Decimal;
        expiryDate: Date | null;
        publishedAt: Date | null;
        closedAt: Date | null;
        categoryId: string | null;
        workingModel: import(".prisma/client").$Enums.WorkingModel;
        requiresProofOfWork: boolean;
        proofOfWorkType: import(".prisma/client").$Enums.ProofType | null;
    }>;
    update(userId: string, id: string, dto: UpdateJobDto): Promise<{
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
            weight: Prisma.Decimal;
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
        minSalary: Prisma.Decimal | null;
        maxSalary: Prisma.Decimal | null;
        currency: string;
        location: string | null;
        requiredExperienceYears: number | null;
        autoShortlistThreshold: Prisma.Decimal | null;
        autoRejectThreshold: Prisma.Decimal | null;
        rejectOnMissingMandatory: boolean;
        skillWeight: Prisma.Decimal;
        experienceWeight: Prisma.Decimal;
        educationWeight: Prisma.Decimal;
        otherWeight: Prisma.Decimal;
        expiryDate: Date | null;
        publishedAt: Date | null;
        closedAt: Date | null;
        categoryId: string | null;
        workingModel: import(".prisma/client").$Enums.WorkingModel;
        requiresProofOfWork: boolean;
        proofOfWorkType: import(".prisma/client").$Enums.ProofType | null;
    }>;
    remove(userId: string, id: string): Promise<{
        message: string;
    }>;
}
