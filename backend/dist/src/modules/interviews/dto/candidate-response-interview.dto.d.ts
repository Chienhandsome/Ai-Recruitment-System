import { CandidateResponseStatus } from '@prisma/client';
export declare class CandidateResponseInterviewDto {
    response: CandidateResponseStatus;
    candidateNotes?: string;
    proposedSlots?: string[];
}
