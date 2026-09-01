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
                title: string;
                id: string;
                jobCode: string;
            };
            candidate: {
                id: string;
                fullName?: string | undefined;
                email?: string | undefined;
                phone?: string | null | undefined;
            };
        };
        type: import(".prisma/client").$Enums.InterviewType;
        title: string;
        status: import(".prisma/client").$Enums.InterviewStatus;
        candidateResponse: import(".prisma/client").$Enums.CandidateResponseStatus;
        scheduledAt: Date;
        durationMinutes: number;
        locationOrLink: string | null;
        interviewerNotes: string | null;
        id: string;
        candidateNotes: string | null;
        proposedSlots: import("@prisma/client/runtime/library").JsonValue | null;
        createdAt: Date;
        updatedAt: Date;
        applicationId: string;
    }>;
    findAllForRecruiter(user: AuthenticatedUser, query: QueryInterviewsDto): Promise<{
        data: {
            score: number | null;
            application: {
                id: string;
                currentStage: import(".prisma/client").$Enums.ApplicationStage;
                job: {
                    title: string;
                    id: string;
                    jobCode: string;
                };
                candidate: {
                    user: {
                        fullName: string;
                        email: string;
                        phone: string | null;
                        avatarUrl: string | null;
                    } | null;
                    id: string;
                    desiredTitle: string | null;
                };
            };
            type: import(".prisma/client").$Enums.InterviewType;
            title: string;
            status: import(".prisma/client").$Enums.InterviewStatus;
            candidateResponse: import(".prisma/client").$Enums.CandidateResponseStatus;
            scheduledAt: Date;
            durationMinutes: number;
            locationOrLink: string | null;
            interviewerNotes: string | null;
            id: string;
            candidateNotes: string | null;
            proposedSlots: import("@prisma/client/runtime/library").JsonValue | null;
            createdAt: Date;
            updatedAt: Date;
            applicationId: string;
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
            candidateId: string;
            currentStage: import(".prisma/client").$Enums.ApplicationStage;
            job: {
                title: string;
                id: string;
                recruiter: {
                    id: string;
                    userId: string;
                    companyId: string | null;
                };
            };
            candidate: {
                user: {
                    fullName: string;
                    email: string;
                    phone: string | null;
                } | null;
                id: string;
                userId: string | null;
            };
        };
        type: import(".prisma/client").$Enums.InterviewType;
        title: string;
        status: import(".prisma/client").$Enums.InterviewStatus;
        candidateResponse: import(".prisma/client").$Enums.CandidateResponseStatus;
        scheduledAt: Date;
        durationMinutes: number;
        locationOrLink: string | null;
        interviewerNotes: string | null;
        id: string;
        candidateNotes: string | null;
        proposedSlots: import("@prisma/client/runtime/library").JsonValue | null;
        createdAt: Date;
        updatedAt: Date;
        applicationId: string;
    }>;
    update(user: AuthenticatedUser, id: string, dto: UpdateInterviewDto): Promise<{
        score: number | null;
        type: import(".prisma/client").$Enums.InterviewType;
        title: string;
        status: import(".prisma/client").$Enums.InterviewStatus;
        candidateResponse: import(".prisma/client").$Enums.CandidateResponseStatus;
        scheduledAt: Date;
        durationMinutes: number;
        locationOrLink: string | null;
        interviewerNotes: string | null;
        id: string;
        candidateNotes: string | null;
        proposedSlots: import("@prisma/client/runtime/library").JsonValue | null;
        createdAt: Date;
        updatedAt: Date;
        applicationId: string;
    }>;
    submitFeedback(user: AuthenticatedUser, id: string, dto: SubmitInterviewFeedbackDto): Promise<{
        score: number;
        applicationStage: import(".prisma/client").$Enums.ApplicationStage;
        type: import(".prisma/client").$Enums.InterviewType;
        title: string;
        status: import(".prisma/client").$Enums.InterviewStatus;
        candidateResponse: import(".prisma/client").$Enums.CandidateResponseStatus;
        scheduledAt: Date;
        durationMinutes: number;
        locationOrLink: string | null;
        interviewerNotes: string | null;
        id: string;
        candidateNotes: string | null;
        proposedSlots: import("@prisma/client/runtime/library").JsonValue | null;
        createdAt: Date;
        updatedAt: Date;
        applicationId: string;
    }>;
    respondToInterview(user: AuthenticatedUser, id: string, dto: CandidateResponseInterviewDto): Promise<{
        score: number | null;
        type: import(".prisma/client").$Enums.InterviewType;
        title: string;
        status: import(".prisma/client").$Enums.InterviewStatus;
        candidateResponse: import(".prisma/client").$Enums.CandidateResponseStatus;
        scheduledAt: Date;
        durationMinutes: number;
        locationOrLink: string | null;
        interviewerNotes: string | null;
        id: string;
        candidateNotes: string | null;
        proposedSlots: import("@prisma/client/runtime/library").JsonValue | null;
        createdAt: Date;
        updatedAt: Date;
        applicationId: string;
    }>;
}
