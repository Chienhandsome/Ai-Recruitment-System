import {
  BadGatewayException,
  ConflictException,
  Injectable,
  Logger,
  NotFoundException,
  ServiceUnavailableException,
  UnauthorizedException,
} from '@nestjs/common';
import {
  AiInterviewStatus,
  ApplicationStage,
  NotificationType,
  InterviewConductedBy,
  InterviewRoundStatus,
  Prisma,
} from '@prisma/client';
import { createHmac, timingSafeEqual } from 'node:crypto';
import { PrismaService } from '../../database/prisma.service';
import { ApplicationAccessService } from '../applications/application-access.service';
import {
  canTransitionApplication,
  hrDecisionForStage,
} from '../applications/application-stage-machine';
import { NotificationsService } from '../notifications/notifications.service';
import {
  aiInterviewCallbackSchema,
  type AiInterviewCallback,
  interviewServiceCreateResponseSchema,
} from './ai-interview.schemas';
import { CreateAiInterviewDto } from './dto/create-ai-interview.dto';

type CallbackHeaders = {
  eventId?: string;
  timestamp?: string;
  signature?: string;
};

@Injectable()
export class AiInterviewsService {
  private readonly logger = new Logger(AiInterviewsService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly accessService: ApplicationAccessService,
    private readonly notificationsService: NotificationsService,
  ) {}

  async create(userId: string, dto: CreateAiInterviewDto) {
    const scope = await this.accessService.recruiterApplicationWhere(userId);
    const application = await this.prisma.application.findFirst({
      where: { AND: [scope, { id: dto.applicationId }] },
      select: {
        id: true,
        profileSnapshot: true,
        currentStage: true,
        candidate: {
          select: {
            id: true,
            userId: true,
            fullName: true,
            email: true,
            desiredTitle: true,
            professionalSummary: true,
            candidateSkills: {
              select: {
                proficiencyLevel: true,
                isPrimary: true,
                sourceText: true,
                skill: { select: { name: true } },
              },
            },
            workExperiences: true,
            educations: true,
            projects: true,
            certificates: true,
          },
        },
        resume: {
          select: {
            id: true,
            parsedData: {
              select: {
                summary: true,
                totalYearsExperience: true,
                educationData: true,
                experienceData: true,
                certificateData: true,
                projectData: true,
                languageData: true,
                rawParsedJson: true,
              },
            },
          },
        },
        job: {
          select: {
            id: true,
            jobCode: true,
            title: true,
            description: true,
            requirements: true,
            employmentType: true,
            experienceLevel: true,
            requiredExperienceYears: true,
            location: true,
            recruiter: { select: { userId: true } },
            jobSkills: {
              select: {
                requirementType: true,
                minimumProficiency: true,
                minYearsExperience: true,
                weight: true,
                skill: { select: { name: true } },
              },
            },
          },
        },
      },
    });

    if (!application) {
      throw new NotFoundException(
        'Đơn ứng tuyển không tồn tại hoặc bạn không có quyền truy cập.',
      );
    }

    if (dto.roundId) {
      const round = await this.prisma.interviewRound.findFirst({
        where: {
          id: dto.roundId,
          process: { applicationId: application.id },
        },
        select: { id: true, conductedBy: true, status: true },
      });
      if (!round) {
        throw new NotFoundException('Không tìm thấy vòng phỏng vấn tương ứng.');
      }
      if (round.conductedBy !== InterviewConductedBy.AI) {
        throw new ConflictException(
          'Vòng này phải do người phỏng vấn thực hiện.',
        );
      }
      if (round.status !== InterviewRoundStatus.READY) {
        throw new ConflictException(
          'Vòng phỏng vấn chưa sẵn sàng hoặc đã được tạo link.',
        );
      }
    }

    const interviewServiceUrl = (
      process.env.INTERVIEW_SERVICE_URL ?? 'http://127.0.0.1:8010'
    ).replace(/\/$/, '');
    const callbackBaseUrl = (
      process.env.RECRUITMENT_PUBLIC_API_URL ?? 'http://localhost:3001/api'
    ).replace(/\/$/, '');
    const systemKey =
      process.env.INTERVIEW_SYSTEM_API_KEY ?? 'dev-interview-system-key';
    const config = {
      opening_questions: dto.openingQuestions.map((item) => item.trim()),
      competencies: dto.competencies.map((item) => item.trim()),
      max_questions: dto.maxQuestions,
    };
    const cv = {
      profile_snapshot: application.profileSnapshot,
      candidate_profile: {
        desired_title: application.candidate.desiredTitle,
        professional_summary: application.candidate.professionalSummary,
        skills: application.candidate.candidateSkills.map((item) => ({
          name: item.skill.name,
          proficiency_level: item.proficiencyLevel,
          is_primary: item.isPrimary,
          evidence: item.sourceText,
        })),
        work_experiences: application.candidate.workExperiences,
        educations: application.candidate.educations,
        projects: application.candidate.projects,
        certificates: application.candidate.certificates,
      },
      parsed_resume: application.resume.parsedData,
    };
    const jd = {
      id: application.job.id,
      code: application.job.jobCode,
      title: application.job.title,
      description: application.job.description,
      requirements: application.job.requirements,
      employment_type: application.job.employmentType,
      experience_level: application.job.experienceLevel,
      required_experience_years: application.job.requiredExperienceYears,
      location: application.job.location,
      skills: application.job.jobSkills.map((item) => ({
        name: item.skill.name,
        requirement_type: item.requirementType,
        minimum_proficiency: item.minimumProficiency,
        minimum_years: item.minYearsExperience,
        weight: Number(item.weight),
      })),
    };

    let response: Response;
    try {
      response = await fetch(`${interviewServiceUrl}/v1/internal/interviews`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Interview-System-Key': systemKey,
        },
        body: JSON.stringify({
          recruitment_application_id: application.id,
          candidate: {
            id: application.candidate.id,
            email: application.candidate.email,
            display_name: application.candidate.fullName,
          },
          cv,
          jd,
          config,
          expires_in_hours: dto.expiresInHours,
          callback_url: `${callbackBaseUrl}/interviews/ai/callback`,
        }),
        signal: AbortSignal.timeout(15_000),
      });
    } catch (error) {
      this.logger.error(`Interview Service unavailable: ${String(error)}`);
      throw new ServiceUnavailableException(
        'Interview Service hiện không phản hồi.',
      );
    }

    if (!response.ok) {
      const detail = await response.text();
      this.logger.error(
        `Interview Service create failed (${response.status}): ${detail.slice(0, 500)}`,
      );
      throw new BadGatewayException('Không thể tạo cuộc phỏng vấn AI.');
    }

    const parsedResponse = interviewServiceCreateResponseSchema.safeParse(
      await response.json(),
    );
    if (!parsedResponse.success) {
      this.logger.error(
        `Invalid Interview Service response: ${parsedResponse.error.message}`,
      );
      throw new BadGatewayException(
        'Interview Service trả về dữ liệu không hợp lệ.',
      );
    }

    const remote = parsedResponse.data;
    const session = await this.prisma.$transaction(async (prisma) => {
      const created = await prisma.aiInterviewSession.create({
        data: {
          applicationId: application.id,
          roundId: dto.roundId,
          interviewServiceId: remote.interview_id,
          status: AiInterviewStatus.CREATED,
          launchUrl: remote.launch_url,
          expiresAt: new Date(remote.expires_at),
          config,
          createdByUserId: userId,
        },
      });

      if (dto.roundId) {
        await prisma.interviewRound.update({
          where: { id: dto.roundId },
          data: {
            status: InterviewRoundStatus.SCHEDULED,
            evaluationCriteria: config,
          },
        });
      }

      if (
        application.currentStage !== ApplicationStage.INTERVIEW_SCHEDULED &&
        canTransitionApplication(
          application.currentStage,
          ApplicationStage.INTERVIEW_SCHEDULED,
        )
      ) {
        await prisma.application.update({
          where: { id: application.id },
          data: {
            currentStage: ApplicationStage.INTERVIEW_SCHEDULED,
            hrDecision: hrDecisionForStage(
              ApplicationStage.INTERVIEW_SCHEDULED,
            ),
          },
        });
      }

      await prisma.applicationStatusHistory.create({
        data: {
          applicationId: application.id,
          previousStage: application.currentStage,
          newStage:
            application.currentStage === ApplicationStage.INTERVIEW_SCHEDULED ||
            !canTransitionApplication(
              application.currentStage,
              ApplicationStage.INTERVIEW_SCHEDULED,
            )
              ? application.currentStage
              : ApplicationStage.INTERVIEW_SCHEDULED,
          changedByUserId: userId,
          note: `Đã tạo phỏng vấn online với AI, hết hạn ${new Date(remote.expires_at).toLocaleString('vi-VN')}.`,
        },
      });
      return created;
    });

    if (application.candidate.userId) {
      await this.notificationsService.createNotification({
        recipientUserId: application.candidate.userId,
        applicationId: application.id,
        type: NotificationType.INTERVIEW_SCHEDULED,
        title: `Mời phỏng vấn online với AI: ${application.job.title}`,
        message: `Bạn có một cuộc phỏng vấn online với AI. Link chỉ được sử dụng một lần và hết hạn lúc ${new Date(remote.expires_at).toLocaleString('vi-VN')}.`,
        payload: {
          applicationId: application.id,
          aiInterviewSessionId: session.id,
          launchUrl: remote.launch_url,
          expiresAt: remote.expires_at,
          jobTitle: application.job.title,
          mode: 'AI_ONLINE',
        },
      });
    }

    return this.serializeSession(session);
  }

  async findForApplication(userId: string, applicationId: string) {
    const scope = await this.accessService.recruiterApplicationWhere(userId);
    const application = await this.prisma.application.findFirst({
      where: { AND: [scope, { id: applicationId }] },
      select: { id: true },
    });
    if (!application) {
      throw new NotFoundException('Không tìm thấy đơn ứng tuyển.');
    }
    const sessions = await this.prisma.aiInterviewSession.findMany({
      where: { applicationId },
      orderBy: { createdAt: 'desc' },
    });
    return sessions.map((item) => this.serializeSession(item));
  }

  async findOne(userId: string, id: string) {
    const session = await this.findAuthorizedSession(userId, id);
    return this.serializeSession(session);
  }

  async downloadVideo(userId: string, id: string, videoId: string) {
    const session = await this.findAuthorizedSession(userId, id);
    const videos = Array.isArray(session.videos) ? session.videos : [];
    const video = videos.find(
      (item) =>
        typeof item === 'object' &&
        item !== null &&
        !Array.isArray(item) &&
        item.id === videoId,
    );
    if (!video) {
      throw new NotFoundException(
        'Không tìm thấy video trong kết quả phỏng vấn.',
      );
    }

    const serviceUrl = (
      process.env.INTERVIEW_SERVICE_URL ?? 'http://127.0.0.1:8010'
    ).replace(/\/$/, '');
    const systemKey =
      process.env.INTERVIEW_SYSTEM_API_KEY ?? 'dev-interview-system-key';
    let response: Response;
    try {
      response = await fetch(
        `${serviceUrl}/v1/internal/interviews/${session.interviewServiceId}/videos/${videoId}`,
        {
          headers: { 'X-Interview-System-Key': systemKey },
          signal: AbortSignal.timeout(30_000),
        },
      );
    } catch (error) {
      this.logger.error(`Video proxy failed: ${String(error)}`);
      throw new ServiceUnavailableException(
        'Không thể kết nối Interview Service.',
      );
    }
    if (!response.ok) {
      throw new BadGatewayException('Không thể tải video phỏng vấn.');
    }
    return {
      body: Buffer.from(await response.arrayBuffer()),
      contentType: response.headers.get('content-type') ?? 'video/webm',
      contentDisposition:
        response.headers.get('content-disposition') ??
        `attachment; filename="interview-${id}-${videoId}.webm"`,
    };
  }

  async receiveCallback(
    rawBody: Buffer | undefined,
    headers: CallbackHeaders,
    input: unknown,
  ) {
    if (!rawBody?.length) {
      throw new UnauthorizedException('Callback raw body không khả dụng.');
    }
    this.verifySignature(rawBody, headers);
    const parsed = aiInterviewCallbackSchema.safeParse(input);
    if (!parsed.success) {
      throw new ConflictException('Callback payload không hợp lệ.');
    }
    const event = parsed.data;
    if (headers.eventId !== event.event_id) {
      throw new UnauthorizedException('Callback event ID không khớp.');
    }

    const existingEvent = await this.prisma.aiInterviewCallbackEvent.findUnique(
      {
        where: { id: event.event_id },
        select: { id: true },
      },
    );
    if (existingEvent) {
      return { accepted: true, duplicate: true };
    }

    const session = await this.prisma.aiInterviewSession.findUnique({
      where: { interviewServiceId: event.data.interview_id },
      include: {
        round: { select: { id: true } },
        application: {
          select: {
            id: true,
            currentStage: true,
            job: {
              select: {
                title: true,
                recruiter: { select: { userId: true } },
              },
            },
          },
        },
      },
    });
    if (
      !session ||
      session.applicationId !== event.data.recruitment_application_id
    ) {
      throw new NotFoundException('Không tìm thấy AI interview tương ứng.');
    }

    const status = this.mapStatus(event.data.status);
    try {
      await this.prisma.$transaction(async (prisma) => {
        await prisma.aiInterviewCallbackEvent.create({
          data: {
            id: event.event_id,
            aiInterviewSessionId: session.id,
            eventType: event.event_type,
            payload: event,
          },
        });
        await prisma.aiInterviewSession.update({
          where: { id: session.id },
          data: {
            status,
            startedAt: event.data.started_at
              ? new Date(event.data.started_at)
              : null,
            completedAt: event.data.completed_at
              ? new Date(event.data.completed_at)
              : new Date(event.occurred_at),
            terminationReason: event.data.termination_reason,
            transcript: event.data.transcript,
            videos: event.data.videos,
            securityEvents: event.data.security_events,
          },
        });

        if (session.roundId) {
          await prisma.interviewRound.update({
            where: { id: session.roundId },
            data: {
              status:
                status === AiInterviewStatus.COMPLETED
                  ? InterviewRoundStatus.AWAITING_REVIEW
                  : status === AiInterviewStatus.EXPIRED
                    ? InterviewRoundStatus.EXPIRED
                    : InterviewRoundStatus.CANCELLED,
            },
          });
        }

        if (
          !session.roundId &&
          status === AiInterviewStatus.COMPLETED &&
          canTransitionApplication(
            session.application.currentStage,
            ApplicationStage.INTERVIEWED,
          )
        ) {
          await prisma.application.update({
            where: { id: session.applicationId },
            data: {
              currentStage: ApplicationStage.INTERVIEWED,
              hrDecision: hrDecisionForStage(ApplicationStage.INTERVIEWED),
            },
          });
          await prisma.applicationStatusHistory.create({
            data: {
              applicationId: session.applicationId,
              previousStage: session.application.currentStage,
              newStage: ApplicationStage.INTERVIEWED,
              changedByUserId: null,
              note: 'Ứng viên đã hoàn thành phỏng vấn online với AI.',
            },
          });
        }
      });
    } catch (error) {
      if (
        error instanceof Prisma.PrismaClientKnownRequestError &&
        error.code === 'P2002'
      ) {
        return { accepted: true, duplicate: true };
      }
      throw error;
    }

    const recruiterUserId = session.application.job.recruiter?.userId;
    if (recruiterUserId) {
      const isCompleted = status === AiInterviewStatus.COMPLETED;
      await this.notificationsService.createNotification({
        recipientUserId: recruiterUserId,
        applicationId: session.applicationId,
        type: isCompleted
          ? NotificationType.APPLICATION_STATUS_CHANGED
          : NotificationType.SYSTEM_ALERT,
        title: isCompleted
          ? 'Ứng viên đã hoàn thành phỏng vấn AI'
          : 'Cuộc phỏng vấn AI đã kết thúc',
        message: isCompleted
          ? `Kết quả phỏng vấn AI cho vị trí ${session.application.job.title} đã sẵn sàng để xem.`
          : `Cuộc phỏng vấn AI cho vị trí ${session.application.job.title} kết thúc với trạng thái ${status}.`,
        payload: {
          applicationId: session.applicationId,
          aiInterviewSessionId: session.id,
          status,
        },
      });
    }

    return { accepted: true, duplicate: false };
  }

  private verifySignature(rawBody: Buffer, headers: CallbackHeaders) {
    const timestamp = headers.timestamp;
    const supplied = headers.signature;
    if (!timestamp || !supplied?.startsWith('v1=')) {
      throw new UnauthorizedException('Thiếu chữ ký callback.');
    }
    const timestampNumber = Number(timestamp);
    const toleranceSeconds = Number(
      process.env.INTERVIEW_CALLBACK_TOLERANCE_SECONDS ?? '300',
    );
    if (
      !Number.isFinite(timestampNumber) ||
      Math.abs(Date.now() / 1000 - timestampNumber) > toleranceSeconds
    ) {
      throw new UnauthorizedException('Callback timestamp không hợp lệ.');
    }
    const secret =
      process.env.INTERVIEW_CALLBACK_SECRET ?? 'dev-callback-secret';
    const expected = createHmac('sha256', secret)
      .update(timestamp)
      .update('.')
      .update(rawBody)
      .digest();
    const receivedHex = supplied.slice(3);
    if (!/^[a-f0-9]{64}$/i.test(receivedHex)) {
      throw new UnauthorizedException('Chữ ký callback không hợp lệ.');
    }
    const received = Buffer.from(receivedHex, 'hex');
    if (
      received.length !== expected.length ||
      !timingSafeEqual(received, expected)
    ) {
      throw new UnauthorizedException('Chữ ký callback không hợp lệ.');
    }
  }

  private async findAuthorizedSession(userId: string, id: string) {
    const scope = await this.accessService.recruiterApplicationWhere(userId);
    const session = await this.prisma.aiInterviewSession.findFirst({
      where: { id, application: scope },
    });
    if (!session) {
      throw new NotFoundException('Không tìm thấy cuộc phỏng vấn AI.');
    }
    return session;
  }

  private mapStatus(status: AiInterviewCallback['data']['status']) {
    return {
      COMPLETED: AiInterviewStatus.COMPLETED,
      TERMINATED: AiInterviewStatus.TERMINATED,
      EXPIRED: AiInterviewStatus.EXPIRED,
    }[status];
  }

  private serializeSession<T extends { launchUrl: string }>(session: T) {
    return session;
  }
}
