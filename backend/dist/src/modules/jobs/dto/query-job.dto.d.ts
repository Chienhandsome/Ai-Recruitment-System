import { JobStatus, EmploymentType } from '@prisma/client';
export declare class QueryJobDto {
    search?: string;
    departmentId?: string;
    status?: JobStatus;
    employmentType?: EmploymentType;
    page?: number;
    limit?: number;
}
