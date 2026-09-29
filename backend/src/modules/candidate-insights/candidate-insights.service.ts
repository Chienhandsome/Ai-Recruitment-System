import {
  BadGatewayException,
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import {
  JobStatus,
  MatchLevel,
  PackageAudience,
  Prisma,
  ResumeParsingStatus,
} from '@prisma/client';
import { PrismaService } from '../../database/prisma.service';
import { EntitlementsService } from '../billing/entitlements.service';
import { USAGE_FEATURES } from '../billing/billing.types';
import { AiInterviewsService } from '../interviews/ai-interviews.service';
import { AiMatchingClient } from '../evaluation/ai-matching.client';
import { EvaluationPayloadBuilderService } from '../evaluation/evaluation-payload.builder.service';
import {
  evaluationCandidateInclude,
  evaluationJobInclude,
  evaluationResumeSelect,
} from '../evaluation/evaluation-payload.builder';
import { CreateJdFitAnalysisDto } from './dto/create-jd-fit-analysis.dto';
import { CreateCandidateMockInterviewDto } from './dto/create-candidate-mock-interview.dto';
import { mapAiResultToCandidateJdFit } from './jd-fit-ai.mapper';

@Injectable()
export class CandidateInsightsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly entitlements: EntitlementsService,
    private readonly aiInterviews: AiInterviewsService,
    private readonly payloadBuilder: EvaluationPayloadBuilderService,
    private readonly aiMatching: AiMatchingClient,
  ) {}

  async analyzeJdFit(userId: string, dto: CreateJdFitAnalysisDto) {
    // 1) Idempotency: same requestId never re-calls AI / re-consumes quota
    const existingUsage = await this.entitlements.findUsageByRequestId(
      userId,
      dto.requestId,
    );
    if (existingUsage) {
      const existing = await this.prisma.candidateJdFitAnalysis.findUnique({
        where: { requestId: dto.requestId },
      });
      if (existing) {
        return { ...this.serializeAnalysis(existing), reused: true };
      }
    }

    // 2) Entitlement / quota gate before AI
    await this.entitlements.assertCandidateJdFit(userId);

    const candidate = await this.prisma.candidateProfile.findUnique({
      where: { userId },
      include: evaluationCandidateInclude,
    });
    if (!candidate) {
      throw new NotFoundException('Không tìm thấy hồ sơ ứng viên.');
    }

    const resumeRef = await this.resolveParsedResumeForJdFit({
      candidateId: candidate.id,
      primaryResumeId: candidate.primaryResumeId,
      preferredResumeId: dto.resumeId,
      jobId: dto.jobId,
    });

    const resume = await this.prisma.resume.findFirst({
      where: {
        id: resumeRef.id,
        candidateId: candidate.id,
        parsingStatus: ResumeParsingStatus.PARSED,
      },
      select: evaluationResumeSelect,
    });
    if (!resume) {
      throw new ForbiddenException(
        'resumeId không thuộc tài khoản của bạn hoặc chưa parse xong.',
      );
    }

    const job = await this.prisma.jobPosting.findFirst({
      where: {
        id: dto.jobId,
        status: JobStatus.PUBLISHED,
        OR: [{ expiryDate: null }, { expiryDate: { gt: new Date() } }],
      },
      include: evaluationJobInclude,
    });
    if (!job) {
      throw new NotFoundException(
        'Tin tuyển dụng không tồn tại hoặc không còn mở.',
      );
    }

    const application = await this.prisma.application.findFirst({
      where: { jobId: job.id, candidateId: candidate.id },
      select: { id: true },
    });

    const evaluationApplicationId =
      application?.id ?? `candidate-jd-fit:${dto.requestId}`;

    const scopedProfile = this.payloadBuilder.scopeCandidateProfileToResume(
      candidate,
      resume.id,
    );

    const evaluationPayload = this.payloadBuilder.buildEvaluationRequest({
      applicationId: evaluationApplicationId,
      profile: scopedProfile,
      resume,
      job,
    });

    // 3) Call shared AI Matching Engine — failures must not consume quota
    let mapped: ReturnType<typeof mapAiResultToCandidateJdFit>;
    try {
      const aiResult = await this.aiMatching.evaluate(evaluationPayload);
      mapped = mapAiResultToCandidateJdFit(aiResult);
    } catch (error) {
      this.aiMatching.toHttpException(error);
    }

    // 4) Consume quota only after AI success, then persist (refund on DB failure)
    const consume = await this.entitlements.consumeQuotaAtomically({
      userId,
      audience: PackageAudience.CANDIDATE,
      featureCode: USAGE_FEATURES.JD_FIT_ANALYSIS,
      requestId: dto.requestId,
      quotaField: 'jdFitRemaining',
      refType: 'job',
      refId: job.id,
    });

    if (consume.reused) {
      const existing = await this.prisma.candidateJdFitAnalysis.findUnique({
        where: { requestId: dto.requestId },
      });
      if (existing) {
        return { ...this.serializeAnalysis(existing), reused: true };
      }
    }

    const entitlement = await this.entitlements.getEffectiveEntitlement(
      userId,
      PackageAudience.CANDIDATE,
    );

    try {
      const saved = await this.prisma.candidateJdFitAnalysis.create({
        data: {
          userId,
          entitlementId: entitlement.entitlementId,
          jobId: job.id,
          resumeId: resume.id,
          requestId: dto.requestId,
          overallScore: mapped.overallScore,
          matchLevel: mapped.matchLevel,
          analysis: mapped.analysis as Prisma.InputJsonValue,
          suggestions: mapped.suggestions as Prisma.InputJsonValue,
        },
      });
      return { ...this.serializeAnalysis(saved), reused: false };
    } catch (error) {
      await this.entitlements.refundQuotaForRequest({
        userId,
        requestId: dto.requestId,
        quotaField: 'jdFitRemaining',
      });
      throw error;
    }
  }

  async listMyJdFitAnalyses(userId: string) {
    const rows = await this.prisma.candidateJdFitAnalysis.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      take: 50,
      include: {
        job: { select: { id: true, title: true, jobCode: true } },
      },
    });
    return rows.map((row) => ({
      ...this.serializeAnalysis(row),
      job: row.job,
    }));
  }

  async createMockInterview(
    userId: string,
    dto: CreateCandidateMockInterviewDto,
  ) {
    const existingUsage = await this.entitlements.findUsageByRequestId(
      userId,
      dto.requestId,
    );
    if (existingUsage?.refId) {
      const session = await this.prisma.aiInterviewSession.findUnique({
        where: { id: existingUsage.refId },
      });
      if (session) {
        await this.assertSessionOwnedByCandidate(userId, session.applicationId);
        return {
          reused: true,
          session: {
            id: session.id,
            launchUrl: session.launchUrl,
            expiresAt: session.expiresAt,
            status: session.status,
          },
        };
      }
    }

    await this.entitlements.assertCandidateMockInterview(userId);

    const job = await this.prisma.jobPosting.findFirst({
      where: {
        id: dto.jobId,
        status: JobStatus.PUBLISHED,
        OR: [{ expiryDate: null }, { expiryDate: { gt: new Date() } }],
      },
      select: { id: true, title: true },
    });
    if (!job) {
      throw new NotFoundException(
        'Tin tuyển dụng không tồn tại hoặc không còn mở.',
      );
    }

    const candidate = await this.prisma.candidateProfile.findUnique({
      where: { userId },
      select: { id: true },
    });
    if (!candidate) {
      throw new NotFoundException('Không tìm thấy hồ sơ ứng viên.');
    }

    const application = await this.prisma.application.findFirst({
      where: {
        candidateId: candidate.id,
        jobId: job.id,
        ...(dto.applicationId ? { id: dto.applicationId } : {}),
      },
      select: { id: true },
    });
    if (!application) {
      throw new BadRequestException(
        'Cần ứng tuyển vào tin này trước khi luyện phỏng vấn AI theo JD.',
      );
    }
    if (dto.applicationId && dto.applicationId !== application.id) {
      throw new ForbiddenException(
        'applicationId không thuộc về bạn hoặc không khớp job.',
      );
    }

    let sessionResult: {
      id: string;
      launchUrl: string;
      expiresAt: Date;
      status: string;
    };

    try {
      const created = await this.aiInterviews.createForCandidate(userId, {
        applicationId: application.id,
        openingQuestions: [
          `Hãy giới thiệu ngắn gọn về kinh nghiệm phù hợp với vị trí ${job.title}.`,
          'Bạn giải quyết xung đột trong team như thế nào?',
        ],
        competencies: [
          'technical_experience',
          'problem_solving',
          'communication',
        ],
        maxQuestions: 6,
        expiresInHours: 72,
      });
      sessionResult = {
        id: created.id,
        launchUrl: created.launchUrl,
        expiresAt: created.expiresAt,
        status: created.status,
      };
    } catch (error) {
      throw new BadGatewayException(
        error instanceof Error
          ? `Tạo phiên phỏng vấn AI thất bại, quota không bị trừ: ${error.message}`
          : 'Tạo phiên phỏng vấn AI thất bại, quota không bị trừ.',
      );
    }

    const consume = await this.entitlements.consumeQuotaAtomically({
      userId,
      audience: PackageAudience.CANDIDATE,
      featureCode: USAGE_FEATURES.AI_MOCK_INTERVIEW,
      requestId: dto.requestId,
      quotaField: 'mockInterviewRemaining',
      refType: 'ai_interview_session',
      refId: sessionResult.id,
    });

    if (consume.reused) {
      return { reused: true, session: sessionResult };
    }

    return { reused: false, session: sessionResult };
  }

  private async assertSessionOwnedByCandidate(
    userId: string,
    applicationId: string,
  ) {
    const application = await this.prisma.application.findFirst({
      where: {
        id: applicationId,
        candidate: { userId },
      },
      select: { id: true },
    });
    if (!application) {
      throw new ForbiddenException(
        'Bạn không có quyền truy cập phiên phỏng vấn này.',
      );
    }
  }

  /**
   * Prefer explicit resumeId → primary if PARSED → application CV for this job →
   * latest PARSED resume. Surface clear Vietnamese errors when CV is missing/stuck.
   */
  private async resolveParsedResumeForJdFit(params: {
    candidateId: string;
    primaryResumeId: string | null;
    preferredResumeId?: string;
    jobId: string;
  }): Promise<{ id: string }> {
    const { candidateId, primaryResumeId, preferredResumeId, jobId } = params;

    const findParsed = (id: string) =>
      this.prisma.resume.findFirst({
        where: {
          id,
          candidateId,
          parsingStatus: ResumeParsingStatus.PARSED,
        },
        select: { id: true },
      });

    if (preferredResumeId) {
      const owned = await this.prisma.resume.findFirst({
        where: { id: preferredResumeId, candidateId },
        select: { id: true, parsingStatus: true },
      });
      if (!owned) {
        throw new ForbiddenException(
          'resumeId không thuộc tài khoản của bạn.',
        );
      }
      if (owned.parsingStatus !== ResumeParsingStatus.PARSED) {
        throw new BadRequestException(
          `CV đang ở trạng thái ${owned.parsingStatus}. Đợi parse xong hoặc tải lại CV tại hồ sơ trước khi phân tích.`,
        );
      }
      return { id: owned.id };
    }

    if (primaryResumeId) {
      const primary = await findParsed(primaryResumeId);
      if (primary) return primary;
    }

    const application = await this.prisma.application.findFirst({
      where: { jobId, candidateId },
      select: { resumeId: true },
    });
    if (application?.resumeId) {
      const fromApp = await findParsed(application.resumeId);
      if (fromApp) return fromApp;
    }

    const latestParsed = await this.prisma.resume.findFirst({
      where: {
        candidateId,
        parsingStatus: ResumeParsingStatus.PARSED,
      },
      orderBy: { createdAt: 'desc' },
      select: { id: true },
    });
    if (latestParsed) return latestParsed;

    const anyResume = await this.prisma.resume.findFirst({
      where: { candidateId },
      orderBy: { createdAt: 'desc' },
      select: { id: true, parsingStatus: true },
    });
    if (!anyResume) {
      throw new BadRequestException(
        'Bạn chưa có CV. Vào hồ sơ ứng viên để tải CV trước khi phân tích CV–JD.',
      );
    }

    throw new BadRequestException(
      `CV chưa parse xong (trạng thái: ${anyResume.parsingStatus}). Vào hồ sơ đợi xử lý hoặc tải lại CV.`,
    );
  }

  private serializeAnalysis(row: {
    id: string;
    jobId: string;
    resumeId: string;
    requestId: string;
    overallScore: unknown;
    matchLevel: MatchLevel | null;
    analysis: unknown;
    suggestions: unknown;
    createdAt: Date;
  }) {
    return {
      id: row.id,
      jobId: row.jobId,
      resumeId: row.resumeId,
      requestId: row.requestId,
      overallScore: Number(row.overallScore),
      matchLevel: row.matchLevel,
      analysis: row.analysis,
      suggestions: row.suggestions,
      createdAt: row.createdAt,
      disclaimer:
        'Điểm số do AI hỗ trợ đánh giá dựa trên CV và yêu cầu công việc, chỉ mang tính tham khảo.',
    };
  }
}
