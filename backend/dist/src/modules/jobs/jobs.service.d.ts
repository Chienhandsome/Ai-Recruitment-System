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
    create(userId: string, dto: CreateJobDto): Promise<{
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
            weight: Prisma.Decimal;
            minYearsExperience: number | null;
            jobId: string;
        })[];
        screeningQuestions: {
            id: string;
            createdAt: Date;
            questionText: string;
            isRequired: boolean;
            jobId: string;
        }[];
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
        title: string;
        departmentId: string | null;
        requirements: string | null;
        benefits: string | null;
        employmentType: import(".prisma/client").$Enums.EmploymentType;
        experienceLevel: import(".prisma/client").$Enums.ExperienceLevel;
        minSalary: Prisma.Decimal | null;
        maxSalary: Prisma.Decimal | null;
        currency: string;
        location: string | null;
        workingModel: import(".prisma/client").$Enums.WorkingModel;
        requiresProofOfWork: boolean;
        proofOfWorkType: import(".prisma/client").$Enums.ProofType | null;
        requiredExperienceYears: number | null;
        autoShortlistThreshold: Prisma.Decimal | null;
        autoRejectThreshold: Prisma.Decimal | null;
        rejectOnMissingMandatory: boolean;
        skillWeight: Prisma.Decimal;
        experienceWeight: Prisma.Decimal;
        educationWeight: Prisma.Decimal;
        otherWeight: Prisma.Decimal;
        jobCode: string;
        recruiterId: string;
        expiryDate: Date | null;
        publishedAt: Date | null;
        closedAt: Date | null;
    }>;
    findAll(userId: string, query: QueryJobDto): Promise<{
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
            title: string;
            departmentId: string | null;
            requirements: string | null;
            benefits: string | null;
            employmentType: import(".prisma/client").$Enums.EmploymentType;
            experienceLevel: import(".prisma/client").$Enums.ExperienceLevel;
            minSalary: Prisma.Decimal | null;
            maxSalary: Prisma.Decimal | null;
            currency: string;
            location: string | null;
            workingModel: import(".prisma/client").$Enums.WorkingModel;
            requiresProofOfWork: boolean;
            proofOfWorkType: import(".prisma/client").$Enums.ProofType | null;
            requiredExperienceYears: number | null;
            autoShortlistThreshold: Prisma.Decimal | null;
            autoRejectThreshold: Prisma.Decimal | null;
            rejectOnMissingMandatory: boolean;
            skillWeight: Prisma.Decimal;
            experienceWeight: Prisma.Decimal;
            educationWeight: Prisma.Decimal;
            otherWeight: Prisma.Decimal;
            jobCode: string;
            recruiterId: string;
            expiryDate: Date | null;
            publishedAt: Date | null;
            closedAt: Date | null;
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
            weight: Prisma.Decimal;
            minYearsExperience: number | null;
            jobId: string;
        })[];
        screeningQuestions: {
            id: string;
            createdAt: Date;
            questionText: string;
            isRequired: boolean;
            jobId: string;
        }[];
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
        title: string;
        departmentId: string | null;
        requirements: string | null;
        benefits: string | null;
        employmentType: import(".prisma/client").$Enums.EmploymentType;
        experienceLevel: import(".prisma/client").$Enums.ExperienceLevel;
        minSalary: Prisma.Decimal | null;
        maxSalary: Prisma.Decimal | null;
        currency: string;
        location: string | null;
        workingModel: import(".prisma/client").$Enums.WorkingModel;
        requiresProofOfWork: boolean;
        proofOfWorkType: import(".prisma/client").$Enums.ProofType | null;
        requiredExperienceYears: number | null;
        autoShortlistThreshold: Prisma.Decimal | null;
        autoRejectThreshold: Prisma.Decimal | null;
        rejectOnMissingMandatory: boolean;
        skillWeight: Prisma.Decimal;
        experienceWeight: Prisma.Decimal;
        educationWeight: Prisma.Decimal;
        otherWeight: Prisma.Decimal;
        jobCode: string;
        recruiterId: string;
        expiryDate: Date | null;
        publishedAt: Date | null;
        closedAt: Date | null;
    }>;
    update(userId: string, id: string, dto: UpdateJobDto): Promise<{
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
            weight: Prisma.Decimal;
            minYearsExperience: number | null;
            jobId: string;
        })[];
        screeningQuestions: {
            id: string;
            createdAt: Date;
            questionText: string;
            isRequired: boolean;
            jobId: string;
        }[];
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
        title: string;
        departmentId: string | null;
        requirements: string | null;
        benefits: string | null;
        employmentType: import(".prisma/client").$Enums.EmploymentType;
        experienceLevel: import(".prisma/client").$Enums.ExperienceLevel;
        minSalary: Prisma.Decimal | null;
        maxSalary: Prisma.Decimal | null;
        currency: string;
        location: string | null;
        workingModel: import(".prisma/client").$Enums.WorkingModel;
        requiresProofOfWork: boolean;
        proofOfWorkType: import(".prisma/client").$Enums.ProofType | null;
        requiredExperienceYears: number | null;
        autoShortlistThreshold: Prisma.Decimal | null;
        autoRejectThreshold: Prisma.Decimal | null;
        rejectOnMissingMandatory: boolean;
        skillWeight: Prisma.Decimal;
        experienceWeight: Prisma.Decimal;
        educationWeight: Prisma.Decimal;
        otherWeight: Prisma.Decimal;
        jobCode: string;
        recruiterId: string;
        expiryDate: Date | null;
        publishedAt: Date | null;
        closedAt: Date | null;
    }>;
    remove(userId: string, id: string): Promise<{
        message: string;
    }>;
}
