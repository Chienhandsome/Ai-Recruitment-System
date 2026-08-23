import { Prisma } from '@prisma/client';
import { PrismaService } from '../../database/prisma.service';
import { CreateApplicationDto } from './dto/create-application.dto';
import { ApplicationEvaluationService } from './application-evaluation.service';
import { ApplicationAccessService } from './application-access.service';
import { QueryRecruiterApplicationsDto } from './dto/query-recruiter-applications.dto';
import { QueryMyApplicationsDto } from './dto/query-my-applications.dto';
import { UpdateApplicationStageDto } from './dto/update-application-stage.dto';
export declare class ApplicationsService {
    private readonly prisma;
    private readonly evaluationService;
    private readonly accessService;
    private readonly logger;
    constructor(prisma: PrismaService, evaluationService: ApplicationEvaluationService, accessService: ApplicationAccessService);
    applyForJob(userId: string, createApplicationDto: CreateApplicationDto, now?: Date): Promise<{
        message: string;
        applicationId: string;
        evaluationStatus: string;
    }>;
    findAllForRecruiter(userId: string, query: QueryRecruiterApplicationsDto): Promise<{
        data: {
            id: string;
            job: {
                id: string;
                jobCode: string;
                title: string;
            };
            candidate: {
                email?: string | undefined;
                fullName?: string | undefined;
                avatarUrl?: string | null | undefined;
                id: string;
                desiredTitle: string | null;
            };
            currentStage: import(".prisma/client").$Enums.ApplicationStage;
            hrDecision: import(".prisma/client").$Enums.HrDecision;
            processingStatus: import(".prisma/client").$Enums.ApplicationProcessingStatus;
            latestAiResult: {
                overallScore: number;
                matchLevel: import(".prisma/client").$Enums.MatchLevel;
                confidenceScore: number | null;
                version: number;
            } | null;
            appliedAt: Date;
            updatedAt: Date;
            allowedTransitions: import(".prisma/client").$Enums.ApplicationStage[];
        }[];
        meta: {
            total: number;
            page: number;
            limit: number;
            totalPages: number;
        };
    }>;
    findOneForRecruiter(userId: string, applicationId: string): Promise<{
        id: string;
        job: {
            id: string;
            jobCode: string;
            title: string;
            location: string | null;
            levelRequirementMode: import(".prisma/client").$Enums.LevelRequirementMode;
            skillWeight: Prisma.Decimal;
            experienceWeight: Prisma.Decimal;
            educationWeight: Prisma.Decimal;
            otherWeight: Prisma.Decimal;
        };
        candidate: {
            phone?: string | null | undefined;
            email?: string | undefined;
            fullName?: string | undefined;
            avatarUrl?: string | null | undefined;
            id: string;
            desiredTitle: string | null;
        };
        currentStage: import(".prisma/client").$Enums.ApplicationStage;
        hrDecision: import(".prisma/client").$Enums.HrDecision;
        hrNotes: string | null;
        processingStatus: import(".prisma/client").$Enums.ApplicationProcessingStatus;
        evaluationError: string | null;
        profileSnapshot: Prisma.JsonValue;
        latestAiResult: {
            id: string;
            createdAt: Date;
            updatedAt: Date;
            version: number;
            overallScore: Prisma.Decimal;
            matchLevel: import(".prisma/client").$Enums.MatchLevel;
            skillScore: Prisma.Decimal | null;
            experienceScore: Prisma.Decimal | null;
            educationScore: Prisma.Decimal | null;
            projectScore: Prisma.Decimal | null;
            matchedSkills: Prisma.JsonValue;
            missingSkills: Prisma.JsonValue;
            missingRequiredSkills: Prisma.JsonValue;
            strengths: Prisma.JsonValue;
            gaps: Prisma.JsonValue;
            weaknesses: Prisma.JsonValue;
            evidence: Prisma.JsonValue;
            confidenceScore: Prisma.Decimal | null;
            reasoningSummary: string | null;
            inputSnapshot: Prisma.JsonValue;
            modelVersion: string | null;
            candidateExperienceLevel: import(".prisma/client").$Enums.ExperienceLevel | null;
            requiredExperienceLevel: import(".prisma/client").$Enums.ExperienceLevel | null;
            totalExperienceYears: Prisma.Decimal | null;
            levelFitScore: Prisma.Decimal | null;
            levelGap: number | null;
            levelEligible: boolean | null;
            levelConfidence: Prisma.Decimal | null;
            levelEvidence: Prisma.JsonValue;
        } | null;
        interviews: {
            score: number | null;
            id: string;
            title: string;
            status: import(".prisma/client").$Enums.InterviewStatus;
            createdAt: Date;
            updatedAt: Date;
            type: import(".prisma/client").$Enums.InterviewType;
            scheduledAt: Date;
            durationMinutes: number;
            locationOrLink: string | null;
            interviewerNotes: string | null;
        }[];
        statusHistories: {
            id: string;
            createdAt: Date;
            note: string | null;
            previousStage: import(".prisma/client").$Enums.ApplicationStage | null;
            newStage: import(".prisma/client").$Enums.ApplicationStage;
            changedByUserId: string | null;
        }[];
        appliedAt: Date;
        updatedAt: Date;
        allowedTransitions: import(".prisma/client").$Enums.ApplicationStage[];
    }>;
    updateStage(userId: string, applicationId: string, dto: UpdateApplicationStageDto): Promise<{
        previousStage: import(".prisma/client").$Enums.ApplicationStage;
        allowedTransitions: import(".prisma/client").$Enums.ApplicationStage[];
        historyEntry: {
            id: string;
            createdAt: Date;
            note: string | null;
            changedByUserId: string | null;
        };
        id: string;
        updatedAt: Date;
        currentStage: import(".prisma/client").$Enums.ApplicationStage;
        hrDecision: import(".prisma/client").$Enums.HrDecision;
        hrNotes: string | null;
    }>;
    findMine(userId: string, query: QueryMyApplicationsDto): Promise<{
        data: {
            id: string;
            job: {
                id: string;
                title: string;
                location: string | null;
                company: {
                    id: string;
                    name: string;
                } | null;
            };
            currentStage: import(".prisma/client").$Enums.ApplicationStage;
            processingStatus: import(".prisma/client").$Enums.ApplicationProcessingStatus;
            interviews: {
                id: string;
                title: string;
                status: import(".prisma/client").$Enums.InterviewStatus;
                createdAt: Date;
                type: import(".prisma/client").$Enums.InterviewType;
                scheduledAt: Date;
                durationMinutes: number;
                locationOrLink: string | null;
                interviewerNotes: string | null;
            }[];
            appliedAt: Date;
            updatedAt: Date;
        }[];
        meta: {
            total: number;
            page: number;
            limit: number;
            totalPages: number;
        };
    }>;
    private latestScore;
    private compareApplicationRows;
    private toRecruiterListItem;
    private serializeJob;
    private serializeAiResult;
    private buildProfileSnapshot;
    private toStringArray;
    private errorMessage;
}
