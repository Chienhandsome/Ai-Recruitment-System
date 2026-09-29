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
import { CreateJdFitAnalysisDto } from './dto/create-jd-fit-analysis.dto';
import { CreateCandidateMockInterviewDto } from './dto/create-candidate-mock-interview.dto';

@Injectable()
export class CandidateInsightsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly entitlements: EntitlementsService,
    private readonly aiInterviews: AiInterviewsService,
  ) {}

  async analyzeJdFit(userId: string, dto: CreateJdFitAnalysisDto) {
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

    await this.entitlements.assertCandidateJdFit(userId);

    const candidate = await this.prisma.candidateProfile.findUnique({
      where: { userId },
      select: {
        id: true,
        primaryResumeId: true,
        fullName: true,
        desiredTitle: true,
        professionalSummary: true,
        candidateSkills: {
          select: { skill: { select: { name: true } }, isPrimary: true },
        },
      },
    });
    if (!candidate) {
      throw new NotFoundException('Không tìm thấy hồ sơ ứng viên.');
    }

    const resumeId = dto.resumeId ?? candidate.primaryResumeId;
    if (!resumeId) {
      throw new BadRequestException(
        'Cần có CV đã parse (primary resume) để phân tích.',
      );
    }

    const resume = await this.prisma.resume.findFirst({
      where: {
        id: resumeId,
        candidateId: candidate.id,
        parsingStatus: ResumeParsingStatus.PARSED,
      },
      select: { id: true },
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
      select: {
        id: true,
        title: true,
        description: true,
        requirements: true,
        jobSkills: {
          select: {
            requirementType: true,
            skill: { select: { name: true } },
          },
        },
      },
    });
    if (!job) {
      throw new NotFoundException('Tin tuyển dụng không tồn tại hoặc không còn mở.');
    }

    let analysisPayload: {
      overallScore: number;
      matchLevel: MatchLevel;
      analysis: Record<string, unknown>;
      suggestions: unknown[];
    };

    try {
      analysisPayload = await this.buildJdFitResult(candidate, job);
    } catch (error) {
      throw new BadGatewayException(
        error instanceof Error
          ? `Phân tích AI thất bại, quota không bị trừ: ${error.message}`
          : 'Phân tích AI thất bại, quota không bị trừ.',
      );
    }

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
          overallScore: analysisPayload.overallScore,
          matchLevel: analysisPayload.matchLevel,
          analysis: analysisPayload.analysis as Prisma.InputJsonValue,
          suggestions: analysisPayload.suggestions as Prisma.InputJsonValue,
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
      throw new NotFoundException('Tin tuyển dụng không tồn tại hoặc không còn mở.');
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
      throw new ForbiddenException('applicationId không thuộc về bạn hoặc không khớp job.');
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
        competencies: ['technical_experience', 'problem_solving', 'communication'],
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
      throw new ForbiddenException('Bạn không có quyền truy cập phiên phỏng vấn này.');
    }
  }

  private async buildJdFitResult(
    candidate: {
      desiredTitle: string | null;
      professionalSummary: string | null;
      candidateSkills: Array<{
        isPrimary: boolean;
        skill: { name: string };
      }>;
    },
    job: {
      title: string;
      description: string;
      requirements: string | null;
      jobSkills: Array<{
        requirementType: string;
        skill: { name: string };
      }>;
    },
  ) {
    const candidateSkillNames = candidate.candidateSkills.map((s) =>
      s.skill.name.toLowerCase(),
    );
    const required = job.jobSkills.filter(
      (s) => s.requirementType === 'MANDATORY',
    );
    const preferred = job.jobSkills.filter(
      (s) => s.requirementType !== 'MANDATORY',
    );

    const matchedRequired = required.filter((s) =>
      candidateSkillNames.some(
        (n) =>
          n.includes(s.skill.name.toLowerCase()) ||
          s.skill.name.toLowerCase().includes(n),
      ),
    );
    const matchedPreferred = preferred.filter((s) =>
      candidateSkillNames.some(
        (n) =>
          n.includes(s.skill.name.toLowerCase()) ||
          s.skill.name.toLowerCase().includes(n),
      ),
    );
    const missingRequired = required.filter(
      (s) => !matchedRequired.some((m) => m.skill.name === s.skill.name),
    );

    const requiredScore =
      required.length === 0
        ? 70
        : (matchedRequired.length / required.length) * 100;
    const preferredScore =
      preferred.length === 0
        ? 20
        : (matchedPreferred.length / preferred.length) * 20;
    const titleBonus =
      candidate.desiredTitle &&
      job.title
        .toLowerCase()
        .split(/\s+/)
        .some((w) => w.length > 3 && candidate.desiredTitle!.toLowerCase().includes(w))
        ? 10
        : 0;

    const overallScore = Math.min(
      100,
      Math.round(requiredScore * 0.7 + preferredScore + titleBonus),
    );
    const matchLevel =
      overallScore >= 75
        ? MatchLevel.HIGH
        : overallScore >= 50
          ? MatchLevel.MEDIUM
          : MatchLevel.LOW;

    const suggestions = [
      ...missingRequired.map((s) => ({
        type: 'ADD_SKILL',
        skill: s.skill.name,
        message: `Bổ sung kỹ năng bắt buộc "${s.skill.name}" vào CV hoặc dự án liên quan.`,
      })),
      ...(candidate.professionalSummary
        ? []
        : [
            {
              type: 'SUMMARY',
              message:
                'Thêm professional summary nêu rõ kinh nghiệm phù hợp với JD.',
            },
          ]),
      {
        type: 'TAILOR',
        message: `Điều chỉnh tiêu đề/mong muốn gần với "${job.title}" và nhấn mạnh kỹ năng đã khớp.`,
      },
    ];

    // Optional remote AI call — failure throws so caller does not consume quota.
    const aiUrl = process.env.AI_SERVICE_URL;
    if (aiUrl && process.env.CANDIDATE_JD_FIT_USE_AI === 'true') {
      const response = await fetch(
        `${aiUrl.replace(/\/$/, '')}/api/v1/matching/evaluate`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            job: {
              title: job.title,
              description: job.description,
              requirements: job.requirements,
              skills: job.jobSkills.map((s) => ({
                name: s.skill.name,
                requirement_type: s.requirementType,
              })),
            },
            candidate: {
              desired_title: candidate.desiredTitle,
              summary: candidate.professionalSummary,
              skills: candidate.candidateSkills.map((s) => s.skill.name),
            },
          }),
        },
      );
      if (!response.ok) {
        throw new Error(`AI service HTTP ${response.status}`);
      }
    }

    return {
      overallScore,
      matchLevel,
      analysis: {
        matchedRequired: matchedRequired.map((s) => s.skill.name),
        matchedPreferred: matchedPreferred.map((s) => s.skill.name),
        missingRequired: missingRequired.map((s) => s.skill.name),
        explanation:
          'Điểm dựa trên kỹ năng bắt buộc/ưu tiên so với CV. AI hỗ trợ xếp hạng; bạn tự quyết định cải thiện hồ sơ.',
      },
      suggestions,
    };
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
        'AI chỉ hỗ trợ phân tích mức phù hợp và gợi ý. Không cam kết được tuyển dụng.',
    };
  }
}
