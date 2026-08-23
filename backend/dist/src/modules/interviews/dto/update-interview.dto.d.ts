import { InterviewStatus, InterviewType } from '@prisma/client';
export declare class UpdateInterviewDto {
    title?: string;
    type?: InterviewType;
    status?: InterviewStatus;
    scheduledAt?: string;
    durationMinutes?: number;
    locationOrLink?: string;
    interviewerNotes?: string;
}
