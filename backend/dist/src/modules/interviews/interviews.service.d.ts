import { Prisma } from '@prisma/client';
import { PrismaService } from '../../database/prisma.service';
import { ApplicationAccessService } from '../applications/application-access.service';
import { NotificationsService } from '../notifications/notifications.service';
import { CreateInterviewDto } from './dto/create-interview.dto';
import { UpdateInterviewDto } from './dto/update-interview.dto';
import { SubmitInterviewFeedbackDto } from './dto/submit-interview-feedback.dto';
import { QueryInterviewsDto } from './dto/query-interviews.dto';
import { CandidateResponseInterviewDto } from './dto/candidate-response-interview.dto';
export declare class InterviewsService {
    private readonly prisma;
    private readonly accessService;
    private readonly notificationsService?;
    private readonly logger;
    constructor(prisma: PrismaService, accessService: ApplicationAccessService, notificationsService?: NotificationsService | undefined);
    create(userId: string, dto: CreateInterviewDto): Promise<{
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
        proposedSlots: Prisma.JsonValue | null;
    }>;
    findAllForRecruiter(userId: string, query: QueryInterviewsDto): Promise<{
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
            proposedSlots: Prisma.JsonValue | null;
        }[];
        meta: {
            total: number;
            page: number;
            limit: number;
            totalPages: number;
        };
    }>;
    findMineForCandidate(userId: string): Promise<{
        id: string;
        title: string;
        type: import(".prisma/client").$Enums.InterviewType;
        status: import(".prisma/client").$Enums.InterviewStatus;
        candidateResponse: import(".prisma/client").$Enums.CandidateResponseStatus;
        candidateNotes: string | null;
        proposedSlots: Prisma.JsonValue;
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
    findOne(userId: string, id: string): Promise<{
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
        proposedSlots: Prisma.JsonValue | null;
    }>;
    update(userId: string, id: string, dto: UpdateInterviewDto): Promise<{
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
        proposedSlots: Prisma.JsonValue | null;
    }>;
    submitFeedback(userId: string, id: string, dto: SubmitInterviewFeedbackDto): Promise<{
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
        proposedSlots: Prisma.JsonValue | null;
    }>;
    respondToInterview(userId: string, id: string, dto: CandidateResponseInterviewDto): Promise<{
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
        proposedSlots: Prisma.JsonValue | null;
    }>;
}
