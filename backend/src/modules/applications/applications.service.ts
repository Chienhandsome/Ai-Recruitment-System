import {
  BadRequestException,
  ConflictException,
  Injectable,
  Logger,
  NotFoundException,
  UnprocessableEntityException,
} from '@nestjs/common';
import {
  ApplicationProcessingStatus,
  ApplicationStage,
  JobStatus,
  NotificationStatus,
  NotificationType,
  Prisma,
  ResumeParsingStatus,
} from '@prisma/client';
import { PrismaService } from '../../database/prisma.service';
import { NotificationsService } from '../notifications/notifications.service';
import { CreateApplicationDto } from './dto/create-application.dto';
import { ApplicationEvaluationService } from './application-evaluation.service';
import { ApplicationAccessService } from './application-access.service';
import {
  allowedApplicationTransitions,
  applicationTransitionRequiresNote,
  canTransitionApplication,
  hrDecisionForStage,
} from './application-stage-machine';
import {
  ApplicationSortBy,
  QueryRecruiterApplicationsDto,
  SortOrder,
} from './dto/query-recruiter-applications.dto';
import { QueryMyApplicationsDto } from './dto/query-my-applications.dto';
import { UpdateApplicationStageDto } from './dto/update-application-stage.dto';
import {
  APPLICATION_SNAPSHOT_VERSION,
  type ApplicationProfileSnapshot,
  toPrismaJson,
} from './application-evaluation.snapshot';

const candidateProfileInclude = {
  workExperiences: true,
  educations: true,
  projects: true,
  certificates: true,
  candidateSkills: { include: { skill: true } },
} satisfies Prisma.CandidateProfileInclude;

const jobEvaluationInclude = {
  jobSkills: { include: { skill: true } },
  jobCertificates: true,
} satisfies Prisma.JobPostingInclude;

const resumeSnapshotSelect = {
  id: true,
  candidateId: true,
  source: true,
  originalFileName: true,
  mimeType: true,
  fileSizeBytes: true,
  parsingStatus: true,
  createdAt: true,
} satisfies Prisma.ResumeSelect;

const latestAiResultSelect = {
  id: true,
  version: true,
  overallScore: true,
  matchLevel: true,
  skillScore: true,
  experienceScore: true,
  educationScore: true,
  projectScore: true,
  matchedSkills: true,
  missingSkills: true,
  missingRequiredSkills: true,
  strengths: true,
  gaps: true,
  weaknesses: true,
  evidence: true,
  confidenceScore: true,
  reasoningSummary: true,
  inputSnapshot: true,
  modelVersion: true,
  candidateExperienceLevel: true,
  requiredExperienceLevel: true,
  totalExperienceYears: true,
  levelFitScore: true,
  levelGap: true,
  levelEligible: true,
  levelConfidence: true,
  levelEvidence: true,
  createdAt: true,
  updatedAt: true,
} satisfies Prisma.AiMatchingResultSelect;

const recruiterApplicationListSelect = {
  id: true,
  currentStage: true,
  hrDecision: true,
  processingStatus: true,
  appliedAt: true,
  updatedAt: true,
  job: {
    select: { id: true, jobCode: true, title: true },
  },
  candidate: {
    select: {
      id: true,
      desiredTitle: true,
      user: {
        select: {
          fullName: true,
          email: true,
          avatarUrl: true,
        },
      },
    },
  },
  aiMatchingResults: {
    orderBy: { version: 'desc' as const },
    take: 1,
    select: {
      overallScore: true,
      matchLevel: true,
      confidenceScore: true,
      version: true,
    },
  },
} satisfies Prisma.ApplicationSelect;

type RecruiterApplicationListRecord = Prisma.ApplicationGetPayload<{
  select: typeof recruiterApplicationListSelect;
}>;

type CandidateForApplication = Prisma.CandidateProfileGetPayload<{
  include: typeof candidateProfileInclude;
}>;
type JobForApplication = Prisma.JobPostingGetPayload<{
  include: typeof jobEvaluationInclude;
}>;
type ResumeForApplication = Prisma.ResumeGetPayload<{
  select: typeof resumeSnapshotSelect;
}>;

@Injectable()
export class ApplicationsService {
  private readonly logger = new Logger(ApplicationsService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly evaluationService: ApplicationEvaluationService,
    private readonly accessService: ApplicationAccessService,
    private readonly notificationsService?: NotificationsService,
  ) {}

  async applyForJob(
    userId: string,
    createApplicationDto: CreateApplicationDto,
    now = new Date(),
  ) {
    const candidateProfile = await this.prisma.candidateProfile.findUnique({
      where: { userId },
      include: candidateProfileInclude,
    });
    if (!candidateProfile) {
      throw new NotFoundException('Candidate profile not found.');
    }

    const resumeId =
      createApplicationDto.resumeId ?? candidateProfile.primaryResumeId;
    if (!resumeId) {
      throw new BadRequestException(
        'A parsed resume is required to apply for this job.',
      );
    }

    // Scope the lookup by candidateId so another candidate's resume UUID can
    // never be attached to this application.
    const resume = await this.prisma.resume.findFirst({
      where: { id: resumeId, candidateId: candidateProfile.id },
      select: resumeSnapshotSelect,
    });
    if (!resume) {
      throw new BadRequestException(
        'The selected resume is unavailable for this candidate.',
      );
    }
    if (resume.parsingStatus !== ResumeParsingStatus.PARSED) {
      throw new BadRequestException(
        'The selected resume must finish processing before you can apply.',
      );
    }

    const existingApplication = await this.prisma.application.findUnique({
      where: {
        jobId_candidateId: {
          jobId: createApplicationDto.jobId,
          candidateId: candidateProfile.id,
        },
      },
      select: { id: true },
    });
    if (existingApplication) {
      throw new ConflictException('You have already applied for this job.');
    }

    const job = await this.prisma.jobPosting.findFirst({
      where: {
        id: createApplicationDto.jobId,
        status: JobStatus.PUBLISHED,
        OR: [{ expiryDate: null }, { expiryDate: { gt: now } }],
      },
      include: jobEvaluationInclude,
    });
    if (!job) {
      throw new NotFoundException(
        'Job posting is not published or is no longer accepting applications.',
      );
    }

    const profileSnapshot = this.buildProfileSnapshot(
      candidateProfile,
      resume,
      job,
      now,
    );

    let application: { id: string };
    try {
      application = await this.prisma.application.create({
        data: {
          jobId: job.id,
          candidateId: candidateProfile.id,
          resumeId: resume.id,
          source: 'DIRECT_APPLY',
          currentStage: ApplicationStage.RECEIVED,
          processingStatus: ApplicationProcessingStatus.QUEUED,
          profileSnapshot: toPrismaJson(profileSnapshot),
        },
        select: { id: true },
      });
    } catch (error) {
      // The unique constraint is the final authority under concurrent POSTs;
      // the earlier lookup only provides a fast, friendly path.
      if (
        error instanceof Prisma.PrismaClientKnownRequestError &&
        error.code === 'P2002'
      ) {
        throw new ConflictException('You have already applied for this job.');
      }
      throw error;
    }

    let published = false;
    try {
      published = await this.evaluationService.dispatchNewApplication(
        application.id,
        now,
      );
    } catch (error) {
      this.logger.error(
        `Could not dispatch evaluation for application ${application.id}: ${this.errorMessage(error)}`,
      );
      await this.evaluationService.markForRetry(
        application.id,
        'Evaluation dispatch failed and will be retried.',
        0,
        now,
      );
    }

    return {
      message: published
        ? 'Ứng tuyển thành công. Đang phân tích hồ sơ...'
        : 'Ứng tuyển thành công. Đánh giá AI đã được lên lịch thử lại.',
      applicationId: application.id,
      evaluationStatus: published ? 'QUEUED' : 'RETRY_SCHEDULED',
    };
  }

  async findAllForRecruiter(
    userId: string,
    query: QueryRecruiterApplicationsDto,
  ) {
    if (
      query.minScore !== undefined &&
      query.maxScore !== undefined &&
      query.minScore > query.maxScore
    ) {
      throw new BadRequestException(
        'minScore must be less than or equal to maxScore.',
      );
    }

    const scope = await this.accessService.recruiterApplicationWhere(userId);
    const where: Prisma.ApplicationWhereInput = {
      AND: [
        scope,
        query.jobId ? { jobId: query.jobId } : {},
        query.stage ? { currentStage: query.stage } : {},
        query.hrDecision ? { hrDecision: query.hrDecision } : {},
        query.processingStatus
          ? { processingStatus: query.processingStatus }
          : {},
        query.search?.trim()
          ? {
              candidate: {
                user: {
                  OR: [
                    {
                      fullName: {
                        contains: query.search.trim(),
                        mode: 'insensitive',
                      },
                    },
                    {
                      email: {
                        contains: query.search.trim(),
                        mode: 'insensitive',
                      },
                    },
                  ],
                },
              },
            }
          : {},
      ],
    };

    const rows = await this.prisma.application.findMany({
      where,
      select: recruiterApplicationListSelect,
    });

    const filtered = rows.filter((row) => {
      const score = this.latestScore(row);
      if (query.minScore !== undefined && (score ?? -1) < query.minScore) {
        return false;
      }
      if (query.maxScore !== undefined && (score ?? 101) > query.maxScore) {
        return false;
      }
      return true;
    });

    filtered.sort((left, right) =>
      this.compareApplicationRows(left, right, query.sortBy, query.sortOrder),
    );

    const total = filtered.length;
    const start = (query.page - 1) * query.limit;
    const pageRows = filtered.slice(start, start + query.limit);

    return {
      data: pageRows.map((row) => this.toRecruiterListItem(row)),
      meta: {
        total,
        page: query.page,
        limit: query.limit,
        totalPages: Math.ceil(total / query.limit),
      },
    };
  }

  async findOneForRecruiter(userId: string, applicationId: string) {
    const scope = await this.accessService.recruiterApplicationWhere(userId);
    const application = await this.prisma.application.findFirst({
      where: { AND: [scope, { id: applicationId }] },
      select: {
        id: true,
        currentStage: true,
        hrDecision: true,
        hrNotes: true,
        processingStatus: true,
        evaluationError: true,
        profileSnapshot: true,
        appliedAt: true,
        updatedAt: true,
        job: {
          select: {
            id: true,
            jobCode: true,
            title: true,
            location: true,
            levelRequirementMode: true,
            skillWeight: true,
            experienceWeight: true,
            educationWeight: true,
            otherWeight: true,
          },
        },
        candidate: {
          select: {
            id: true,
            fullName: true,
            email: true,
            phone: true,
            desiredTitle: true,
            professionalSummary: true,
            expectedMinSalary: true,
            expectedMaxSalary: true,
            preferredModel: true,
            user: {
              select: {
                fullName: true,
                email: true,
                phone: true,
                avatarUrl: true,
              },
            },
            workExperiences: {
              orderBy: { startDate: 'desc' },
            },
            educations: {
              orderBy: { startDate: 'desc' },
            },
            projects: true,
            certificates: true,
            candidateSkills: {
              include: {
                skill: true,
              },
            },
          },
        },
        aiMatchingResults: {
          orderBy: { version: 'desc' },
          take: 1,
          select: latestAiResultSelect,
        },
        interviews: {
          orderBy: { scheduledAt: 'desc' },
          select: {
            id: true,
            title: true,
            type: true,
            status: true,
            scheduledAt: true,
            durationMinutes: true,
            locationOrLink: true,
            interviewerNotes: true,
            score: true,
            createdAt: true,
            updatedAt: true,
          },
        },
        statusHistories: {
          orderBy: { createdAt: 'desc' },
          take: 20,
          select: {
            id: true,
            previousStage: true,
            newStage: true,
            changedByUserId: true,
            note: true,
            createdAt: true,
          },
        },
      },
    });

    if (!application) {
      throw new NotFoundException('Application not found.');
    }

    const latestAiResult = application.aiMatchingResults[0] ?? null;
    return {
      id: application.id,
      job: this.serializeJob(application.job),
      candidate: {
        id: application.candidate.id,
        fullName: application.candidate.fullName || application.candidate.user?.fullName,
        email: application.candidate.email || application.candidate.user?.email,
        phone: application.candidate.phone || application.candidate.user?.phone,
        avatarUrl: application.candidate.user?.avatarUrl,
        desiredTitle: application.candidate.desiredTitle,
        professionalSummary: application.candidate.professionalSummary,
        expectedMinSalary: application.candidate.expectedMinSalary,
        expectedMaxSalary: application.candidate.expectedMaxSalary,
        preferredModel: application.candidate.preferredModel,
        workExperiences: application.candidate.workExperiences || [],
        educations: application.candidate.educations || [],
        projects: application.candidate.projects || [],
        certificates: application.candidate.certificates || [],
        candidateSkills: application.candidate.candidateSkills || [],
      },
      currentStage: application.currentStage,
      hrDecision: application.hrDecision,
      hrNotes: application.hrNotes,
      processingStatus: application.processingStatus,
      evaluationError: application.evaluationError,
      profileSnapshot: application.profileSnapshot,
      latestAiResult: latestAiResult
        ? this.serializeAiResult(latestAiResult)
        : null,
      interviews: application.interviews.map((i) => ({
        ...i,
        score: i.score !== null ? Number(i.score) : null,
      })),
      statusHistories: application.statusHistories,
      appliedAt: application.appliedAt,
      updatedAt: application.updatedAt,
      allowedTransitions: allowedApplicationTransitions(
        application.currentStage,
      ),
    };
  }

  async updateStage(
    userId: string,
    applicationId: string,
    dto: UpdateApplicationStageDto,
  ) {
    const scope = await this.accessService.recruiterApplicationWhere(userId);
    const application = await this.prisma.application.findFirst({
      where: { AND: [scope, { id: applicationId }] },
      select: {
        id: true,
        currentStage: true,
        hrNotes: true,
        candidate: { select: { userId: true } },
        job: { select: { title: true } },
      },
    });

    if (!application) {
      throw new NotFoundException('Application not found.');
    }
    if (application.currentStage !== dto.expectedStage) {
      throw new ConflictException(
        `Application stage changed from ${dto.expectedStage} to ${application.currentStage}.`,
      );
    }
    if (dto.targetStage === dto.expectedStage) {
      throw new ConflictException(
        'Application is already in the target stage.',
      );
    }
    if (!canTransitionApplication(dto.expectedStage, dto.targetStage)) {
      throw new UnprocessableEntityException(
        `Transition from ${dto.expectedStage} to ${dto.targetStage} is not allowed.`,
      );
    }

    const note = dto.note?.trim() || null;
    if (
      applicationTransitionRequiresNote(dto.expectedStage, dto.targetStage) &&
      !note
    ) {
      throw new BadRequestException('A note is required for this transition.');
    }

    const hrNotes =
      dto.hrNotes === undefined
        ? application.hrNotes
        : dto.hrNotes.trim() || null;
    const hrDecision = hrDecisionForStage(dto.targetStage);

    const result = await this.prisma.$transaction(async (prisma) => {
      const updated = await prisma.application.updateMany({
        where: {
          id: applicationId,
          currentStage: dto.expectedStage,
        },
        data: {
          currentStage: dto.targetStage,
          hrDecision,
          hrNotes,
        },
      });

      if (updated.count !== 1) {
        throw new ConflictException(
          'Application was updated by another recruiter. Refresh and try again.',
        );
      }

      const historyEntry = await prisma.applicationStatusHistory.create({
        data: {
          applicationId,
          previousStage: dto.expectedStage,
          newStage: dto.targetStage,
          changedByUserId: userId,
          note,
        },
        select: {
          id: true,
          note: true,
          changedByUserId: true,
          createdAt: true,
        },
      });

      const current = await prisma.application.findUniqueOrThrow({
        where: { id: applicationId },
        select: {
          id: true,
          currentStage: true,
          hrDecision: true,
          hrNotes: true,
          updatedAt: true,
        },
      });

      return {
        ...current,
        previousStage: dto.expectedStage,
        allowedTransitions: allowedApplicationTransitions(current.currentStage),
        historyEntry,
      };
    });

    if (this.notificationsService && application.candidate?.userId) {
      const stageLabels: Record<ApplicationStage, string> = {
        RECEIVED: 'Đã nhận hồ sơ',
        SCREENING: 'Sơ loại hồ sơ',
        SHORTLISTED: 'Đạt yêu cầu hồ sơ',
        INTERVIEW_SCHEDULED: 'Lên lịch phỏng vấn',
        INTERVIEWED: 'Đã phỏng vấn',
        OFFERED: 'Đề nghị nhận việc (Offer)',
        HIRED: 'Đã tuyển dụng',
        REJECTED: 'Chưa phù hợp',
        WITHDRAWN: 'Đã rút hồ sơ',
      };
      const targetLabel = stageLabels[dto.targetStage] || dto.targetStage;
      await this.notificationsService.createNotification({
        recipientUserId: application.candidate.userId,
        applicationId: application.id,
        type: NotificationType.APPLICATION_STATUS_CHANGED,
        title: `Cập nhật trạng thái hồ sơ: ${application.job?.title || 'Công việc'}`,
        message: `Hồ sơ ứng tuyển của bạn đã được chuyển sang giai đoạn "${targetLabel}".`,
        payload: {
          applicationId: application.id,
          previousStage: dto.expectedStage,
          newStage: dto.targetStage,
          jobTitle: application.job?.title,
          note: dto.note || undefined,
        },
      });
    }

    return result;
  }

  async findMine(userId: string, query: QueryMyApplicationsDto) {
    const candidateId = await this.accessService.candidateProfileId(userId);
    const where: Prisma.ApplicationWhereInput = {
      candidateId,
      ...(query.stage ? { currentStage: query.stage } : {}),
    };
    const skip = (query.page - 1) * query.limit;

    const [total, applications] = await Promise.all([
      this.prisma.application.count({ where }),
      this.prisma.application.findMany({
        where,
        skip,
        take: query.limit,
        orderBy: { appliedAt: 'desc' },
        select: {
          id: true,
          currentStage: true,
          processingStatus: true,
          appliedAt: true,
          updatedAt: true,
          notifications: {
            where: { status: NotificationStatus.UNREAD },
            select: { id: true },
          },
          job: {
            select: {
              id: true,
              title: true,
              location: true,
              recruiter: {
                select: {
                  title: true,
                  user: {
                    select: {
                      fullName: true,
                      email: true,
                      phone: true,
                    },
                  },
                  company: { select: { id: true, name: true } },
                },
              },
            },
          },
          interviews: {
            orderBy: { scheduledAt: 'desc' },
            select: {
              id: true,
              title: true,
              type: true,
              status: true,
              candidateResponse: true,
              candidateNotes: true,
              proposedSlots: true,
              scheduledAt: true,
              durationMinutes: true,
              locationOrLink: true,
              interviewerNotes: true,
              createdAt: true,
            },
          },
        },
      }),
    ]);

    return {
      data: applications.map((application) => ({
        id: application.id,
        job: {
          id: application.job.id,
          title: application.job.title,
          location: application.job.location,
          company: application.job.recruiter.company,
          recruiter: application.job.recruiter
            ? {
                title: application.job.recruiter.title,
                fullName: application.job.recruiter.user?.fullName,
                email: application.job.recruiter.user?.email,
                phone: application.job.recruiter.user?.phone,
              }
            : null,
        },
        currentStage: application.currentStage,
        processingStatus: application.processingStatus,
        hasUnreadUpdate: (application.notifications?.length ?? 0) > 0,
        interviews: application.interviews,
        appliedAt: application.appliedAt,
        updatedAt: application.updatedAt,
      })),
      meta: {
        total,
        page: query.page,
        limit: query.limit,
        totalPages: Math.ceil(total / query.limit),
      },
    };
  }

  private latestScore(row: RecruiterApplicationListRecord): number | null {
    const score = row.aiMatchingResults[0]?.overallScore;
    return score === undefined ? null : Number(score);
  }

  private compareApplicationRows(
    left: RecruiterApplicationListRecord,
    right: RecruiterApplicationListRecord,
    sortBy: ApplicationSortBy,
    sortOrder: SortOrder,
  ): number {
    let comparison: number;
    if (sortBy === ApplicationSortBy.APPLIED_AT) {
      comparison = left.appliedAt.getTime() - right.appliedAt.getTime();
    } else if (sortBy === ApplicationSortBy.UPDATED_AT) {
      comparison = left.updatedAt.getTime() - right.updatedAt.getTime();
    } else {
      const leftScore = this.latestScore(left);
      const rightScore = this.latestScore(right);
      if (leftScore === null && rightScore === null) comparison = 0;
      else if (leftScore === null) return 1;
      else if (rightScore === null) return -1;
      else comparison = leftScore - rightScore;
    }

    return sortOrder === SortOrder.ASC ? comparison : -comparison;
  }

  private toRecruiterListItem(row: RecruiterApplicationListRecord) {
    const latest = row.aiMatchingResults[0];
    return {
      id: row.id,
      job: row.job,
      candidate: {
        id: row.candidate.id,
        desiredTitle: row.candidate.desiredTitle,
        ...row.candidate.user,
      },
      currentStage: row.currentStage,
      hrDecision: row.hrDecision,
      processingStatus: row.processingStatus,
      latestAiResult: latest
        ? {
            overallScore: Number(latest.overallScore),
            matchLevel: latest.matchLevel,
            confidenceScore:
              latest.confidenceScore === null
                ? null
                : Number(latest.confidenceScore),
            version: latest.version,
          }
        : null,
      appliedAt: row.appliedAt,
      updatedAt: row.updatedAt,
      allowedTransitions: allowedApplicationTransitions(row.currentStage),
    };
  }

  private serializeJob<T extends Record<string, unknown>>(job: T): T {
    return Object.fromEntries(
      Object.entries(job).map(([key, value]) => [
        key,
        value instanceof Prisma.Decimal ? Number(value) : value,
      ]),
    ) as T;
  }

  private serializeAiResult<T extends Record<string, unknown>>(result: T): T {
    return Object.fromEntries(
      Object.entries(result).map(([key, value]) => [
        key,
        value instanceof Prisma.Decimal ? Number(value) : value,
      ]),
    ) as T;
  }

  private buildProfileSnapshot(
    profile: CandidateForApplication,
    resume: ResumeForApplication,
    job: JobForApplication,
    capturedAt: Date,
  ): ApplicationProfileSnapshot {
    const weights = {
      skills: Number(job.skillWeight) || 40,
      experience: Number(job.experienceWeight) || 30,
      education: Number(job.educationWeight) || 15,
      other: Number(job.otherWeight) || 15,
    };

    return {
      schemaVersion: APPLICATION_SNAPSHOT_VERSION,
      capturedAt: capturedAt.toISOString(),
      candidateIdentity: {
        id: profile.id,
        userId: profile.userId,
        fullName: profile.fullName,
        email: profile.email,
        phone: profile.phone,
      },
      resume: {
        id: resume.id,
        source: resume.source,
        originalFileName: resume.originalFileName,
        mimeType: resume.mimeType,
        fileSizeBytes: resume.fileSizeBytes,
        parsingStatus: resume.parsingStatus,
        createdAt: resume.createdAt.toISOString(),
      },
      evaluationInput: {
        candidate_profile: {
          profile: {
            id: profile.id,
            candidate_user_id: profile.userId,
            desired_title: profile.desiredTitle,
            professional_summary: profile.professionalSummary,
            github_url: profile.githubUrl,
            linkedin_url: profile.linkedinUrl,
            portfolio_url: profile.portfolioUrl,
            address: profile.address,
            created_at: profile.createdAt.toISOString(),
            updated_at: profile.updatedAt.toISOString(),
          },
          work_experiences: profile.workExperiences.map((experience) => ({
            id: experience.id,
            candidate_profile_id: profile.id,
            company_name: experience.companyName,
            position_title: experience.positionTitle,
            start_date: experience.startDate.toISOString(),
            end_date: experience.endDate?.toISOString() ?? null,
            is_current: experience.isCurrent,
            description: experience.description,
            achievements: experience.achievements,
          })),
          educations: profile.educations.map((education) => ({
            id: education.id,
            candidate_profile_id: profile.id,
            school_name: education.schoolName,
            major: education.major,
            degree: education.degree,
            start_date: education.startDate?.toISOString() ?? null,
            end_date: education.endDate?.toISOString() ?? null,
            description: education.description,
          })),
          projects: profile.projects.map((project) => ({
            id: project.id,
            candidate_profile_id: profile.id,
            project_name: project.projectName,
            project_role: project.projectRole,
            description: project.description,
            technologies: this.toStringArray(project.technologies),
            project_url: project.projectUrl,
            start_date: project.startDate?.toISOString() ?? null,
            end_date: project.endDate?.toISOString() ?? null,
          })),
          certificates: profile.certificates.map((certificate) => ({
            certificate_name: certificate.certificateName,
            issuing_organization: certificate.issuingOrganization,
            issue_date: certificate.issueDate?.toISOString() ?? null,
            expiry_date: certificate.expiryDate?.toISOString() ?? null,
            credential_url: certificate.credentialUrl,
          })),
          skills: profile.candidateSkills.map((candidateSkill) => ({
            candidate_profile_id: profile.id,
            skill_id: candidateSkill.skillId,
            skill_name: candidateSkill.skill.name,
            normalized_name: candidateSkill.skill.normalizedName,
            proficiency_level: candidateSkill.proficiencyLevel,
            is_primary: candidateSkill.isPrimary,
            source: candidateSkill.source,
          })),
        },
        job: {
          id: job.id,
          title: job.title,
          employment_type: job.employmentType,
          work_mode: job.workingModel,
          salary_min: job.minSalary === null ? null : Number(job.minSalary),
          salary_max: job.maxSalary === null ? null : Number(job.maxSalary),
          location: job.location,
          required_experience_years: job.requiredExperienceYears ?? 0,
          experience_level: job.experienceLevel,
          level_requirement_mode: job.levelRequirementMode,
          evaluation_date: capturedAt.toISOString(),
          description: job.description,
          requirements: job.requirements,
          benefits: job.benefits,
          status: job.status,
          published_at: job.publishedAt?.toISOString() ?? null,
          created_at: job.createdAt.toISOString(),
          updated_at: job.updatedAt.toISOString(),
          closed_at: job.closedAt?.toISOString() ?? null,
          required_skills: job.jobSkills.map((jobSkill) => ({
            job_id: job.id,
            skill_id: jobSkill.skillId,
            skill_name: jobSkill.skill.name,
            normalized_name: jobSkill.skill.normalizedName,
            is_mandatory: jobSkill.requirementType === 'MANDATORY',
            minimum_level: jobSkill.minimumProficiency ?? 'BEGINNER',
          })),
          required_certificates: job.jobCertificates.map((certificate) => ({
            certificate_name: certificate.certificateName,
            is_mandatory: certificate.requirementType === 'MANDATORY',
          })),
          ai_weights_config: weights,
        },
        weights,
      },
    };
  }

  private toStringArray(value: Prisma.JsonValue | null): string[] {
    if (Array.isArray(value)) {
      return value.filter((item): item is string => typeof item === 'string');
    }
    if (typeof value === 'string') {
      return value
        .split(',')
        .map((item) => item.trim())
        .filter(Boolean);
    }
    return [];
  }

  private errorMessage(error: unknown): string {
    return error instanceof Error ? error.message : 'Unknown error';
  }
}
