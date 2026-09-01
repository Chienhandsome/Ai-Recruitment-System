import { InterviewsService } from './interviews.service';
import { CreateInterviewDto } from './dto/create-interview.dto';
import { UpdateInterviewDto } from './dto/update-interview.dto';
import { SubmitInterviewFeedbackDto } from './dto/submit-interview-feedback.dto';
import { QueryInterviewsDto } from './dto/query-interviews.dto';
import { CandidateResponseInterviewDto } from './dto/candidate-response-interview.dto';
import type { AuthenticatedUser } from '../auth/auth.types';
export declare class InterviewsController {
    private readonly interviewsService;
    constructor(interviewsService: InterviewsService);
    create(user: AuthenticatedUser, dto: CreateInterviewDto): Promise<{
        score: number | null;
        application: {
            id: string;
            job: {
                id: string;
                jobCode: string;
                title: string;
            };
            candidate: {
                id: string;
                phone?: string | null | undefined;
                email?: string | undefined;
                fullName?: string | undefined;
            };
        };
        id: string;
        title: string;
        status: import(".prisma/client").$Enums.InterviewStatus;
        createdAt: Date;
        updatedAt: Date;
        type: import(".prisma/client").$Enums.InterviewType;
        applicationId: string;
        scheduledAt: Date;
        durationMinutes: number;
        locationOrLink: string | null;
        interviewerNotes: string | null;
        candidateResponse: import(".prisma/client").$Enums.CandidateResponseStatus;
        candidateNotes: string | null;
        proposedSlots: import("@prisma/client/runtime/library").JsonValue | null;
    }>;
    findAllForRecruiter(user: AuthenticatedUser, query: QueryInterviewsDto): Promise<{
        data: {
            score: number | null;
            application: {
                id: string;
                job: {
                    id: string;
                    jobCode: string;
                    title: string;
                };
                candidate: {
                    id: string;
                    user: {
                        phone: string | null;
                        email: string;
                        fullName: string;
                        avatarUrl: string | null;
                    } | null;
                    desiredTitle: string | null;
                };
                currentStage: import(".prisma/client").$Enums.ApplicationStage;
            };
            id: string;
            title: string;
            status: import(".prisma/client").$Enums.InterviewStatus;
            createdAt: Date;
            updatedAt: Date;
            type: import(".prisma/client").$Enums.InterviewType;
            applicationId: string;
            scheduledAt: Date;
            durationMinutes: number;
            locationOrLink: string | null;
            interviewerNotes: string | null;
            candidateResponse: import(".prisma/client").$Enums.CandidateResponseStatus;
            candidateNotes: string | null;
            proposedSlots: import("@prisma/client/runtime/library").JsonValue | null;
        }[];
        meta: {
            total: number;
            page: number;
            limit: number;
            totalPages: number;
        };
    }>;
    findMineForCandidate(user: AuthenticatedUser): Promise<{
        id: string;
        title: string;
        type: import(".prisma/client").$Enums.InterviewType;
        status: import(".prisma/client").$Enums.InterviewStatus;
        candidateResponse: import(".prisma/client").$Enums.CandidateResponseStatus;
        candidateNotes: string | null;
        proposedSlots: import("@prisma/client/runtime/library").JsonValue;
        scheduledAt: Date;
        durationMinutes: number;
        locationOrLink: string | null;
        interviewerNotes: string | null;
        application: {
            id: string;
            currentStage: import(".prisma/client").$Enums.ApplicationStage;
            job: {
                id: string;
                title: string;
                location: string | null;
                company: {
                    id: string;
                    name: string;
                    logoUrl: string | null;
                } | null;
                recruiter: {
                    title: string | null;
                    fullName: string;
                    email: string;
                    phone: string | null;
                } | null;
            };
        };
    }[]>;
    findOne(user: AuthenticatedUser, id: string): Promise<{
        score: number | null;
        application: {
            id: string;
            job: {
                id: string;
                title: string;
                recruiter: {
                    id: string;
                    userId: string;
                    companyId: string | null;
                };
            };
            candidateId: string;
            candidate: {
                id: string;
                user: {
                    phone: string | null;
                    email: string;
                    fullName: string;
                } | null;
                userId: string | null;
            };
            currentStage: import(".prisma/client").$Enums.ApplicationStage;
        };
        id: string;
        title: string;
        status: import(".prisma/client").$Enums.InterviewStatus;
        createdAt: Date;
        updatedAt: Date;
        type: import(".prisma/client").$Enums.InterviewType;
        applicationId: string;
        scheduledAt: Date;
        durationMinutes: number;
        locationOrLink: string | null;
        interviewerNotes: string | null;
        candidateResponse: import(".prisma/client").$Enums.CandidateResponseStatus;
        candidateNotes: string | null;
        proposedSlots: import("@prisma/client/runtime/library").JsonValue | null;
    }>;
    update(user: AuthenticatedUser, id: string, dto: UpdateInterviewDto): Promise<{
        score: number | null;
        id: string;
        title: string;
        status: import(".prisma/client").$Enums.InterviewStatus;
        createdAt: Date;
        updatedAt: Date;
        type: import(".prisma/client").$Enums.InterviewType;
        applicationId: string;
        scheduledAt: Date;
        durationMinutes: number;
        locationOrLink: string | null;
        interviewerNotes: string | null;
        candidateResponse: import(".prisma/client").$Enums.CandidateResponseStatus;
        candidateNotes: string | null;
        proposedSlots: import("@prisma/client/runtime/library").JsonValue | null;
    }>;
    submitFeedback(user: AuthenticatedUser, id: string, dto: SubmitInterviewFeedbackDto): Promise<{
        score: number;
        applicationStage: import(".prisma/client").$Enums.ApplicationStage;
        id: string;
        title: string;
        status: import(".prisma/client").$Enums.InterviewStatus;
        createdAt: Date;
        updatedAt: Date;
        type: import(".prisma/client").$Enums.InterviewType;
        applicationId: string;
        scheduledAt: Date;
        durationMinutes: number;
        locationOrLink: string | null;
        interviewerNotes: string | null;
        candidateResponse: import(".prisma/client").$Enums.CandidateResponseStatus;
        candidateNotes: string | null;
        proposedSlots: import("@prisma/client/runtime/library").JsonValue | null;
    }>;
    respondToInterview(user: AuthenticatedUser, id: string, dto: CandidateResponseInterviewDto): Promise<{
        score: number | null;
        id: string;
        title: string;
        status: import(".prisma/client").$Enums.InterviewStatus;
        createdAt: Date;
        updatedAt: Date;
        type: import(".prisma/client").$Enums.InterviewType;
        applicationId: string;
        scheduledAt: Date;
        durationMinutes: number;
        locationOrLink: string | null;
        interviewerNotes: string | null;
        candidateResponse: import(".prisma/client").$Enums.CandidateResponseStatus;
        candidateNotes: string | null;
        proposedSlots: import("@prisma/client/runtime/library").JsonValue | null;
    }>;
}
