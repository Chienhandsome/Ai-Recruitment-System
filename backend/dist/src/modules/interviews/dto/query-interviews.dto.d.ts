import { InterviewStatus, InterviewType } from '@prisma/client';
export declare class QueryInterviewsDto {
    applicationId?: string;
    jobId?: string;
    status?: InterviewStatus;
    type?: InterviewType;
    page: number;
    limit: number;
}
