import { ApplicationStage } from '@prisma/client';
export declare class SubmitInterviewFeedbackDto {
    score: number;
    interviewerNotes: string;
    nextStage?: ApplicationStage;
}
