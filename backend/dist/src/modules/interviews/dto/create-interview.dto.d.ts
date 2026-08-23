import { InterviewType } from '@prisma/client';
export declare class CreateInterviewDto {
    applicationId: string;
    title: string;
    type?: InterviewType;
    scheduledAt: string;
    durationMinutes?: number;
    locationOrLink?: string;
    interviewerNotes?: string;
}
