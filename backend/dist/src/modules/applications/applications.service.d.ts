import { Prisma } from '@prisma/client';
import { PrismaService } from '../../database/prisma.service';
import { NotificationsService } from '../notifications/notifications.service';
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
    private readonly notificationsService?;
    private readonly logger;
    constructor(prisma: PrismaService, evaluationService: ApplicationEvaluationService, accessService: ApplicationAccessService, notificationsService?: NotificationsService | undefined);
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
            id: string;
            fullName: string | undefined;
            email: string | undefined;
            phone: string | null | undefined;
            avatarUrl: string | null | undefined;
            desiredTitle: string | null;
            professionalSummary: string | null;
            expectedMinSalary: Prisma.Decimal | null;
            expectedMaxSalary: Prisma.Decimal | null;
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
                technologies: Prisma.JsonValue | null;
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
    private latestScore;
    private compareApplicationRows;
    private toRecruiterListItem;
    private serializeJob;
    private serializeAiResult;
    private buildProfileSnapshot;
    private toStringArray;
    private errorMessage;
}
