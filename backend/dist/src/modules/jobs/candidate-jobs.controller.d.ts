import type { AuthenticatedUser } from '../auth/auth.types';
import { QueryCandidateJobDto } from './dto/query-candidate-job.dto';
import { JobsService } from './jobs.service';
export declare class CandidateJobsController {
    private readonly jobsService;
    constructor(jobsService: JobsService);
    findAll(query: QueryCandidateJobDto): Promise<{
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
    findOne(id: string, user: AuthenticatedUser): Promise<{
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
}
