import { ApplicationsService } from './applications.service';
import { CreateApplicationDto } from './dto/create-application.dto';
import type { AuthenticatedUser } from '../auth/auth.types';
import { QueryRecruiterApplicationsDto } from './dto/query-recruiter-applications.dto';
import { QueryMyApplicationsDto } from './dto/query-my-applications.dto';
import { UpdateApplicationStageDto } from './dto/update-application-stage.dto';
export declare class ApplicationsController {
    private readonly applicationsService;
    constructor(applicationsService: ApplicationsService);
    apply(user: AuthenticatedUser, dto: CreateApplicationDto): Promise<{
        message: string;
        applicationId: string;
        evaluationStatus: string;
    }>;
    findMine(user: AuthenticatedUser, query: QueryMyApplicationsDto): Promise<{
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
            hasUnreadUpdate: boolean;
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
    findAllForRecruiter(user: AuthenticatedUser, query: QueryRecruiterApplicationsDto): Promise<{
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
    findOneForRecruiter(user: AuthenticatedUser, id: string): Promise<{
        id: string;
        job: {
            id: string;
            jobCode: string;
            title: string;
            location: string | null;
            levelRequirementMode: import(".prisma/client").$Enums.LevelRequirementMode;
            skillWeight: import("@prisma/client/runtime/library").Decimal;
            experienceWeight: import("@prisma/client/runtime/library").Decimal;
            educationWeight: import("@prisma/client/runtime/library").Decimal;
            otherWeight: import("@prisma/client/runtime/library").Decimal;
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
        profileSnapshot: import("@prisma/client/runtime/library").JsonValue;
        latestAiResult: {
            id: string;
            createdAt: Date;
            updatedAt: Date;
            version: number;
            overallScore: import("@prisma/client/runtime/library").Decimal;
            matchLevel: import(".prisma/client").$Enums.MatchLevel;
            skillScore: import("@prisma/client/runtime/library").Decimal | null;
            experienceScore: import("@prisma/client/runtime/library").Decimal | null;
            educationScore: import("@prisma/client/runtime/library").Decimal | null;
            projectScore: import("@prisma/client/runtime/library").Decimal | null;
            matchedSkills: import("@prisma/client/runtime/library").JsonValue;
            missingSkills: import("@prisma/client/runtime/library").JsonValue;
            missingRequiredSkills: import("@prisma/client/runtime/library").JsonValue;
            strengths: import("@prisma/client/runtime/library").JsonValue;
            gaps: import("@prisma/client/runtime/library").JsonValue;
            weaknesses: import("@prisma/client/runtime/library").JsonValue;
            evidence: import("@prisma/client/runtime/library").JsonValue;
            confidenceScore: import("@prisma/client/runtime/library").Decimal | null;
            reasoningSummary: string | null;
            inputSnapshot: import("@prisma/client/runtime/library").JsonValue;
            modelVersion: string | null;
            candidateExperienceLevel: import(".prisma/client").$Enums.ExperienceLevel | null;
            requiredExperienceLevel: import(".prisma/client").$Enums.ExperienceLevel | null;
            totalExperienceYears: import("@prisma/client/runtime/library").Decimal | null;
            levelFitScore: import("@prisma/client/runtime/library").Decimal | null;
            levelGap: number | null;
            levelEligible: boolean | null;
            levelConfidence: import("@prisma/client/runtime/library").Decimal | null;
            levelEvidence: import("@prisma/client/runtime/library").JsonValue;
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
    updateStage(user: AuthenticatedUser, id: string, dto: UpdateApplicationStageDto): Promise<{
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
}
