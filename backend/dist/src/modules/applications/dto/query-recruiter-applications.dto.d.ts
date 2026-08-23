import { ApplicationProcessingStatus, ApplicationStage, HrDecision } from '@prisma/client';
export declare enum ApplicationSortBy {
    AI_SCORE = "AI_SCORE",
    APPLIED_AT = "APPLIED_AT",
    UPDATED_AT = "UPDATED_AT"
}
export declare enum SortOrder {
    ASC = "ASC",
    DESC = "DESC"
}
export declare class QueryRecruiterApplicationsDto {
    jobId?: string;
    stage?: ApplicationStage;
    hrDecision?: HrDecision;
    processingStatus?: ApplicationProcessingStatus;
    minScore?: number;
    maxScore?: number;
    search?: string;
    sortBy: ApplicationSortBy;
    sortOrder: SortOrder;
    page: number;
    limit: number;
}
