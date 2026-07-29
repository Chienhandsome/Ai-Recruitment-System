import { PrismaService } from '../../database/prisma.service';
import { CreateJobDto } from './dto/create-job.dto';
import { UpdateJobDto } from './dto/update-job.dto';
import { QueryJobDto } from './dto/query-job.dto';
import { Prisma } from '@prisma/client';
export declare class JobsService {
    private readonly prisma;
    constructor(prisma: PrismaService);
    private getRecruiterProfile;
    private generateJobCode;
    getJobCategories(): Promise<{
        id: string;
        name: string;
        slug: string;
        createdAt: Date;
        updatedAt: Date;
    }[]>;
    create(userId: string, dto: CreateJobDto): Promise<{
        department: {
            id: string;
            name: string;
            createdAt: Date;
            updatedAt: Date;
            code: string;
            companyId: string;
            status: import(".prisma/client").$Enums.DepartmentStatus;
        } | null;
        category: {
            id: string;
            name: string;
            slug: string;
            createdAt: Date;
            updatedAt: Date;
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
            weight: Prisma.Decimal;
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
        createdAt: Date;
        updatedAt: Date;
        description: string;
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
                name: string;
                createdAt: Date;
                updatedAt: Date;
                code: string;
                companyId: string;
                status: import(".prisma/client").$Enums.DepartmentStatus;
            } | null;
            category: {
                id: string;
                name: string;
                slug: string;
                createdAt: Date;
                updatedAt: Date;
            } | null;
        } & {
            id: string;
            createdAt: Date;
            updatedAt: Date;
            description: string;
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
    findOne(userId: string, id: string): Promise<{
        department: {
            id: string;
            name: string;
            createdAt: Date;
            updatedAt: Date;
            code: string;
            companyId: string;
            status: import(".prisma/client").$Enums.DepartmentStatus;
        } | null;
        category: {
            id: string;
            name: string;
            slug: string;
            createdAt: Date;
            updatedAt: Date;
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
            weight: Prisma.Decimal;
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
        createdAt: Date;
        updatedAt: Date;
        description: string;
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
        workingModel: import(".prisma/client").$Enums.WorkingModel;
        requiresProofOfWork: boolean;
        proofOfWorkType: import(".prisma/client").$Enums.ProofType | null;
    }>;
    update(userId: string, id: string, dto: UpdateJobDto): Promise<{
        department: {
            id: string;
            name: string;
            createdAt: Date;
            updatedAt: Date;
            code: string;
            companyId: string;
            status: import(".prisma/client").$Enums.DepartmentStatus;
        } | null;
        category: {
            id: string;
            name: string;
            slug: string;
            createdAt: Date;
            updatedAt: Date;
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
            weight: Prisma.Decimal;
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
        createdAt: Date;
        updatedAt: Date;
        description: string;
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
        workingModel: import(".prisma/client").$Enums.WorkingModel;
        requiresProofOfWork: boolean;
        proofOfWorkType: import(".prisma/client").$Enums.ProofType | null;
    }>;
    remove(userId: string, id: string): Promise<{
        message: string;
    }>;
}
