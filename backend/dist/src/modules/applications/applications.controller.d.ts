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
                recruiter: {
                    title: string | null;
                    fullName: string;
                    email: string;
                    phone: string | null;
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
                candidateResponse: import(".prisma/client").$Enums.CandidateResponseStatus;
                candidateNotes: string | null;
                proposedSlots: import("@prisma/client/runtime/library").JsonValue;
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
            id: string;
            fullName: string | undefined;
            email: string | undefined;
            phone: string | null | undefined;
            avatarUrl: string | null | undefined;
            desiredTitle: string | null;
            professionalSummary: string | null;
            expectedMinSalary: import("@prisma/client/runtime/library").Decimal | null;
            expectedMaxSalary: import("@prisma/client/runtime/library").Decimal | null;
            preferredModel: import(".prisma/client").$Enums.WorkingModel | null;
            workExperiences: {
                id: string;
                description: string | null;
                createdAt: Date;
                updatedAt: Date;
                source: import(".prisma/client").$Enums.DataSource;
                isInferred: boolean;
                sourceText: string | null;
                resumeId: string | null;
                candidateProfileId: string;
                companyName: string;
                positionTitle: string;
                startDate: Date;
                endDate: Date | null;
                isCurrent: boolean;
                achievements: string | null;
            }[];
            educations: {
                id: string;
                description: string | null;
                createdAt: Date;
                updatedAt: Date;
                source: import(".prisma/client").$Enums.DataSource;
                isInferred: boolean;
                sourceText: string | null;
                resumeId: string | null;
                candidateProfileId: string;
                startDate: Date | null;
                endDate: Date | null;
                schoolName: string;
                major: string | null;
                degree: string | null;
            }[];
            projects: {
                id: string;
                description: string | null;
                createdAt: Date;
                updatedAt: Date;
                source: import(".prisma/client").$Enums.DataSource;
                isInferred: boolean;
                sourceText: string | null;
                resumeId: string | null;
                candidateProfileId: string;
                startDate: Date | null;
                endDate: Date | null;
                projectName: string;
                projectRole: string | null;
                technologies: import("@prisma/client/runtime/library").JsonValue | null;
                projectUrl: string | null;
            }[];
            certificates: {
                id: string;
                expiryDate: Date | null;
                createdAt: Date;
                updatedAt: Date;
                source: import(".prisma/client").$Enums.DataSource;
                isInferred: boolean;
                sourceText: string | null;
                resumeId: string | null;
                candidateProfileId: string;
                certificateName: string;
                issuingOrganization: string;
                issueDate: Date | null;
                credentialUrl: string | null;
            }[];
            candidateSkills: ({
                skill: {
                    id: string;
                    status: import(".prisma/client").$Enums.SkillStatus;
                    createdAt: Date;
                    updatedAt: Date;
                    categoryId: string;
                    name: string;
                    normalizedName: string;
                    type: import(".prisma/client").$Enums.SkillType;
                };
            } & {
                id: string;
                createdAt: Date;
                skillId: string;
                candidateId: string;
                source: import(".prisma/client").$Enums.SkillSource;
                proficiencyLevel: import(".prisma/client").$Enums.ProficiencyLevel;
                isPrimary: boolean;
                isInferred: boolean;
                sourceText: string | null;
                resumeId: string | null;
            })[];
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
