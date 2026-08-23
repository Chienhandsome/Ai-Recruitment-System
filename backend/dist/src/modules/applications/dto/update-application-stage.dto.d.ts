import { ApplicationStage } from '@prisma/client';
export declare class UpdateApplicationStageDto {
    targetStage: ApplicationStage;
    expectedStage: ApplicationStage;
    note?: string;
    hrNotes?: string;
}
