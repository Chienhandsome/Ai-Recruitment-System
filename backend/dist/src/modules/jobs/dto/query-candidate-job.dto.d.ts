import { EmploymentType, WorkingModel } from '@prisma/client';
export declare class QueryCandidateJobDto {
    search?: string;
    categoryId?: string;
    employmentType?: EmploymentType;
    workingModel?: WorkingModel;
    location?: string;
    page: number;
    limit: number;
}
