import { ApplicationStage } from '@prisma/client';
export declare class QueryMyApplicationsDto {
    stage?: ApplicationStage;
    page: number;
    limit: number;
}
