import { JobsService } from './jobs.service';
import { CreateJobDto } from './dto/create-job.dto';
import { UpdateJobDto } from './dto/update-job.dto';
import { QueryJobDto } from './dto/query-job.dto';
import type { AuthenticatedUser } from '../auth/auth.types';
export declare class JobsController {
    private readonly jobsService;
    constructor(jobsService: JobsService);
    create(user: AuthenticatedUser, createJobDto: CreateJobDto): Promise<{
        department: {
            id: string;
            code: string;
            name: string;
            createdAt: Date;
            updatedAt: Date;
            companyId: string;
            status: import(".prisma/client").$Enums.DepartmentStatus;
        } | null;
        jobSkills: ({
            skill: {
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
            requirementType: import(".prisma/client").$Enums.SkillRequirementType;
            minimumProficiency: import(".prisma/client").$Enums.ProficiencyLevel | null;
            weight: import("@prisma/client/runtime/library").Decimal;
            minYearsExperience: number | null;
            jobId: string;
        })[];
        jobCertificates: {
            id: string;
            requirementType: import(".prisma/client").$Enums.SkillRequirementType;
            certificateName: string;
            jobId: string;
        }[];
    } & {
        id: string;
        description: string;
        createdAt: Date;
        updatedAt: Date;
        status: import(".prisma/client").$Enums.JobStatus;
        categoryId: string | null;
        departmentId: string | null;
        title: string;
        jobCode: string;
        recruiterId: string;
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
        workingModel: import(".prisma/client").$Enums.WorkingModel;
        requiresProofOfWork: boolean;
        proofOfWorkType: import(".prisma/client").$Enums.ProofType | null;
    }>;
    findAll(user: AuthenticatedUser, query: QueryJobDto): Promise<{
        data: ({
            department: {
                id: string;
                code: string;
                name: string;
                createdAt: Date;
                updatedAt: Date;
                companyId: string;
                status: import(".prisma/client").$Enums.DepartmentStatus;
            } | null;
            _count: {
                applications: number;
            };
        } & {
            id: string;
            description: string;
            createdAt: Date;
            updatedAt: Date;
            status: import(".prisma/client").$Enums.JobStatus;
            categoryId: string | null;
            departmentId: string | null;
            title: string;
            jobCode: string;
            recruiterId: string;
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
        department: {
            id: string;
            code: string;
            name: string;
            createdAt: Date;
            updatedAt: Date;
            companyId: string;
            status: import(".prisma/client").$Enums.DepartmentStatus;
        } | null;
        jobSkills: ({
            skill: {
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
            requirementType: import(".prisma/client").$Enums.SkillRequirementType;
            minimumProficiency: import(".prisma/client").$Enums.ProficiencyLevel | null;
            weight: import("@prisma/client/runtime/library").Decimal;
            minYearsExperience: number | null;
            jobId: string;
        })[];
        jobCertificates: {
            id: string;
            requirementType: import(".prisma/client").$Enums.SkillRequirementType;
            certificateName: string;
            jobId: string;
        }[];
    } & {
        id: string;
        description: string;
        createdAt: Date;
        updatedAt: Date;
        status: import(".prisma/client").$Enums.JobStatus;
        categoryId: string | null;
        departmentId: string | null;
        title: string;
        jobCode: string;
        recruiterId: string;
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
        workingModel: import(".prisma/client").$Enums.WorkingModel;
        requiresProofOfWork: boolean;
        proofOfWorkType: import(".prisma/client").$Enums.ProofType | null;
    }>;
    update(user: AuthenticatedUser, id: string, updateJobDto: UpdateJobDto): Promise<{
        department: {
            id: string;
            code: string;
            name: string;
            createdAt: Date;
            updatedAt: Date;
            companyId: string;
            status: import(".prisma/client").$Enums.DepartmentStatus;
        } | null;
        jobSkills: ({
            skill: {
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
            requirementType: import(".prisma/client").$Enums.SkillRequirementType;
            minimumProficiency: import(".prisma/client").$Enums.ProficiencyLevel | null;
            weight: import("@prisma/client/runtime/library").Decimal;
            minYearsExperience: number | null;
            jobId: string;
        })[];
        jobCertificates: {
            id: string;
            requirementType: import(".prisma/client").$Enums.SkillRequirementType;
            certificateName: string;
            jobId: string;
        }[];
    } & {
        id: string;
        description: string;
        createdAt: Date;
        updatedAt: Date;
        status: import(".prisma/client").$Enums.JobStatus;
        categoryId: string | null;
        departmentId: string | null;
        title: string;
        jobCode: string;
        recruiterId: string;
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
        workingModel: import(".prisma/client").$Enums.WorkingModel;
        requiresProofOfWork: boolean;
        proofOfWorkType: import(".prisma/client").$Enums.ProofType | null;
    }>;
    remove(user: AuthenticatedUser, id: string): Promise<{
        message: string;
    }>;
}
