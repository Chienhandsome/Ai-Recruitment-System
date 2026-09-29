import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import {
  EntitlementStatus,
  JobStatus,
  PackageAudience,
  Prisma,
} from '@prisma/client';
import { PrismaService } from '../../database/prisma.service';
import {
  ActiveJobQuotaExceededError,
  EntitlementFeatures,
  PACKAGE_CODES,
  PackageFeatureDeniedError,
  PackageFeaturesSnapshot,
  QuotaExceededError,
  USAGE_FEATURES,
  UsageFeatureCode,
  freeCodeForAudience,
  snapshotFromPackage,
  tierRank,
} from './billing.types';

const packageSelect = {
  id: true,
  code: true,
  name: true,
  audience: true,
  maxActiveJobs: true,
  cvUnlockQuota: true,
  aiRanking: true,
  advancedFilters: true,
  recruitmentStats: true,
  talentPoolAccess: true,
  jdFitAnalysis: true,
  cvImproveSuggestions: true,
  jdFitQuota: true,
  aiMockInterview: true,
  mockInterviewQuota: true,
  durationDays: true,
  priceVnd: true,
} satisfies Prisma.ServicePackageSelect;

type QuotaField = 'jdFitRemaining' | 'mockInterviewRemaining' | 'cvUnlockRemaining';

@Injectable()
export class EntitlementsService {
  constructor(private readonly prisma: PrismaService) {}

  async expireStaleEntitlements(userId: string) {
    await this.prisma.packageEntitlement.updateMany({
      where: {
        userId,
        status: EntitlementStatus.ACTIVE,
        endsAt: { lte: new Date() },
      },
      data: { status: EntitlementStatus.EXPIRED },
    });
  }

  /**
   * Highest paid active entitlement for audience, else virtual Free (no DB row).
   */
  async getEffectiveEntitlement(
    userId: string,
    audience: PackageAudience,
  ): Promise<EntitlementFeatures> {
    await this.expireStaleEntitlements(userId);

    const active = await this.prisma.packageEntitlement.findMany({
      where: {
        userId,
        status: EntitlementStatus.ACTIVE,
        package: { audience },
        OR: [{ endsAt: null }, { endsAt: { gt: new Date() } }],
      },
      include: { package: { select: packageSelect } },
      orderBy: { startsAt: 'desc' },
    });

    const paid = active.filter(
      (row) =>
        row.package.code !== PACKAGE_CODES.HR_FREE &&
        row.package.code !== PACKAGE_CODES.CANDIDATE_FREE,
    );

    if (paid.length > 0) {
      const best = [...paid].sort(
        (a, b) => tierRank(b.package.code) - tierRank(a.package.code),
      )[0];
      return this.toFeatures(best, audience, false);
    }

    return this.virtualFreeEntitlement(audience);
  }

  async getEntitlementStatus(userId: string, audience: PackageAudience) {
    const features = await this.getEffectiveEntitlement(userId, audience);
    const activeJobs =
      audience === PackageAudience.EMPLOYER
        ? await this.countActiveJobs(userId)
        : 0;

    return {
      ...features,
      activeJobCount: activeJobs,
      canPublishMoreJobs:
        features.maxActiveJobs === null || activeJobs < features.maxActiveJobs,
      disclaimer:
        'AI chỉ hỗ trợ đánh giá và gợi ý. Quyết định cuối cùng thuộc về người dùng. Hệ thống không cam kết tuyển được người hay đậu phỏng vấn.',
    };
  }

  async countActiveJobs(userId: string) {
    const recruiter = await this.prisma.recruiterProfile.findUnique({
      where: { userId },
      select: { id: true, companyId: true },
    });
    if (!recruiter) return 0;

    if (recruiter.companyId) {
      return this.prisma.jobPosting.count({
        where: {
          status: JobStatus.PUBLISHED,
          recruiter: { companyId: recruiter.companyId },
        },
      });
    }

    return this.prisma.jobPosting.count({
      where: { status: JobStatus.PUBLISHED, recruiterId: recruiter.id },
    });
  }

  async assertCanPublishJob(userId: string, jobIdBeingPublished?: string) {
    const features = await this.getEffectiveEntitlement(
      userId,
      PackageAudience.EMPLOYER,
    );
    if (features.maxActiveJobs === null) return features;

    const recruiter = await this.prisma.recruiterProfile.findUnique({
      where: { userId },
      select: { id: true, companyId: true },
    });
    if (!recruiter) {
      throw new ForbiddenException('User is not a valid recruiter');
    }

    const where: Prisma.JobPostingWhereInput = {
      status: JobStatus.PUBLISHED,
      ...(recruiter.companyId
        ? { recruiter: { companyId: recruiter.companyId } }
        : { recruiterId: recruiter.id }),
      ...(jobIdBeingPublished ? { NOT: { id: jobIdBeingPublished } } : {}),
    };

    const currentActiveJobs = await this.prisma.jobPosting.count({ where });
    if (currentActiveJobs >= features.maxActiveJobs) {
      throw new ForbiddenException(
        new ActiveJobQuotaExceededError(
          features.maxActiveJobs,
          currentActiveJobs,
        ).message,
      );
    }
    return features;
  }

  async assertEmployerFeature(
    userId: string,
    feature: keyof Pick<
      EntitlementFeatures,
      | 'aiRanking'
      | 'advancedFilters'
      | 'recruitmentStats'
      | 'talentPoolAccess'
    >,
    requiredPackageLabel: string,
  ) {
    const entitlement = await this.getEffectiveEntitlement(
      userId,
      PackageAudience.EMPLOYER,
    );
    if (!entitlement[feature]) {
      throw new ForbiddenException(
        new PackageFeatureDeniedError(feature, requiredPackageLabel).message,
      );
    }
    return entitlement;
  }

  async assertAiRanking(userId: string) {
    return this.assertEmployerFeature(userId, 'aiRanking', 'HR Pro hoặc Premium');
  }

  async assertAdvancedFilters(userId: string) {
    return this.assertEmployerFeature(
      userId,
      'advancedFilters',
      'HR Pro hoặc Premium',
    );
  }

  async assertRecruitmentStats(userId: string) {
    return this.assertEmployerFeature(userId, 'recruitmentStats', 'HR Premium');
  }

  async assertTalentPool(userId: string) {
    return this.assertEmployerFeature(userId, 'talentPoolAccess', 'HR Premium');
  }

  async assertCandidateJdFit(userId: string) {
    const entitlement = await this.getEffectiveEntitlement(
      userId,
      PackageAudience.CANDIDATE,
    );
    if (!entitlement.jdFitAnalysis) {
      throw new ForbiddenException(
        new PackageFeatureDeniedError(
          'jdFitAnalysis',
          'CANDIDATE Pro hoặc Premium',
        ).message,
      );
    }
    return entitlement;
  }

  async assertCandidateMockInterview(userId: string) {
    const entitlement = await this.getEffectiveEntitlement(
      userId,
      PackageAudience.CANDIDATE,
    );
    if (!entitlement.aiMockInterview) {
      throw new ForbiddenException(
        new PackageFeatureDeniedError(
          'aiMockInterview',
          'CANDIDATE Premium',
        ).message,
      );
    }
    return entitlement;
  }

  /**
   * Idempotent quota consume. Returns existing usage when requestId already seen.
   * Must only be called AFTER successful AI work, or followed by refund on failure
   * if called as a reservation — prefer consumeAfterSuccess pattern below.
   */
  async consumeQuotaAtomically(params: {
    userId: string;
    audience: PackageAudience;
    featureCode: UsageFeatureCode;
    requestId: string;
    quotaField: QuotaField;
    refType?: string;
    refId?: string;
  }) {
    const existing = await this.prisma.packageUsageLog.findUnique({
      where: {
        userId_requestId: {
          userId: params.userId,
          requestId: params.requestId,
        },
      },
    });
    if (existing) {
      return { reused: true as const, usage: existing };
    }

    const entitlement = await this.getEffectiveEntitlement(
      params.userId,
      params.audience,
    );
    if (!entitlement.entitlementId || entitlement.isVirtualFree) {
      throw new ForbiddenException(
        new PackageFeatureDeniedError(
          params.featureCode,
          'gói trả phí còn hiệu lực',
        ).message,
      );
    }

    try {
      const usage = await this.prisma.$transaction(async (tx) => {
        const updated = await tx.packageEntitlement.updateMany({
          where: {
            id: entitlement.entitlementId!,
            status: EntitlementStatus.ACTIVE,
            [params.quotaField]: { gt: 0 },
          },
          data: { [params.quotaField]: { decrement: 1 } },
        });
        if (updated.count === 0) {
          throw new ForbiddenException(
            new QuotaExceededError(params.featureCode).message,
          );
        }

        return tx.packageUsageLog.create({
          data: {
            userId: params.userId,
            entitlementId: entitlement.entitlementId!,
            featureCode: params.featureCode,
            requestId: params.requestId,
            refType: params.refType,
            refId: params.refId,
            status: 'CONSUMED',
          },
        });
      });

      return { reused: false as const, usage };
    } catch (error) {
      if (
        error instanceof Prisma.PrismaClientKnownRequestError &&
        error.code === 'P2002'
      ) {
        const again = await this.prisma.packageUsageLog.findUnique({
          where: {
            userId_requestId: {
              userId: params.userId,
              requestId: params.requestId,
            },
          },
        });
        if (again) return { reused: true as const, usage: again };
      }
      throw error;
    }
  }

  async refundQuotaForRequest(params: {
    userId: string;
    requestId: string;
    quotaField: QuotaField;
  }) {
    await this.prisma.$transaction(async (tx) => {
      const usage = await tx.packageUsageLog.findUnique({
        where: {
          userId_requestId: {
            userId: params.userId,
            requestId: params.requestId,
          },
        },
      });
      if (!usage || usage.status === 'REFUNDED') return;

      await tx.packageEntitlement.update({
        where: { id: usage.entitlementId },
        data: { [params.quotaField]: { increment: 1 } },
      });
      await tx.packageUsageLog.update({
        where: { id: usage.id },
        data: { status: 'REFUNDED' },
      });
    });
  }

  findUsageByRequestId(userId: string, requestId: string) {
    return this.prisma.packageUsageLog.findUnique({
      where: { userId_requestId: { userId, requestId } },
    });
  }

  /**
   * Activate paid package. Expires other paid entitlements of the same audience
   * so Pro→Premium replaces Pro immediately (single paid active entitlement).
   */
  async activateFromPaidOrder(params: {
    userId: string;
    packageId: string;
    orderId: string;
    companyId?: string | null;
    audience: PackageAudience;
    featuresSnapshot?: PackageFeaturesSnapshot;
    durationDaysSnapshot?: number | null;
  }) {
    const pkg = await this.prisma.servicePackage.findFirst({
      where: {
        id: params.packageId,
        audience: params.audience,
        isActive: true,
      },
      select: packageSelect,
    });
    if (!pkg) {
      throw new BadRequestException('Gói dịch vụ không hợp lệ.');
    }
    if (
      pkg.code === PACKAGE_CODES.HR_FREE ||
      pkg.code === PACKAGE_CODES.CANDIDATE_FREE ||
      pkg.priceVnd <= 0
    ) {
      throw new BadRequestException('Không thể thanh toán gói Free.');
    }

    const durationDays =
      params.durationDaysSnapshot ?? pkg.durationDays ?? null;
    if (!durationDays || durationDays <= 0) {
      throw new BadRequestException('Gói trả phí phải có thời hạn.');
    }

    const snapshot = params.featuresSnapshot ?? snapshotFromPackage(pkg);
    const startsAt = new Date();
    const endsAt = new Date(startsAt);
    endsAt.setDate(endsAt.getDate() + durationDays);

    await this.prisma.packageEntitlement.updateMany({
      where: {
        userId: params.userId,
        status: EntitlementStatus.ACTIVE,
        package: {
          audience: params.audience,
          code: {
            notIn: [PACKAGE_CODES.HR_FREE, PACKAGE_CODES.CANDIDATE_FREE],
          },
        },
      },
      data: { status: EntitlementStatus.EXPIRED },
    });

    return this.prisma.packageEntitlement.create({
      data: {
        userId: params.userId,
        companyId: params.companyId ?? null,
        packageId: pkg.id,
        orderId: params.orderId,
        status: EntitlementStatus.ACTIVE,
        startsAt,
        endsAt,
        maxActiveJobs: snapshot.maxActiveJobs,
        cvUnlockRemaining: snapshot.cvUnlockQuota,
        aiRanking: snapshot.aiRanking,
        advancedFilters: snapshot.advancedFilters,
        recruitmentStats: snapshot.recruitmentStats,
        talentPoolAccess: snapshot.talentPoolAccess,
        jdFitAnalysis: snapshot.jdFitAnalysis,
        cvImproveSuggestions: snapshot.cvImproveSuggestions,
        jdFitRemaining: snapshot.jdFitQuota,
        aiMockInterview: snapshot.aiMockInterview,
        mockInterviewRemaining: snapshot.mockInterviewQuota,
      },
      include: { package: { select: packageSelect } },
    });
  }

  private async virtualFreeEntitlement(
    audience: PackageAudience,
  ): Promise<EntitlementFeatures> {
    const code = freeCodeForAudience(audience);
    const freePackage = await this.prisma.servicePackage.findUnique({
      where: { code },
      select: packageSelect,
    });
    if (!freePackage) {
      // Safe defaults if seed missing
      return {
        audience,
        packageCode: code,
        packageName: audience === PackageAudience.CANDIDATE ? 'Candidate Free' : 'HR Free',
        entitlementId: null,
        isVirtualFree: true,
        maxActiveJobs: audience === PackageAudience.EMPLOYER ? 1 : null,
        cvUnlockRemaining: 0,
        aiRanking: false,
        advancedFilters: false,
        recruitmentStats: false,
        talentPoolAccess: false,
        jdFitAnalysis: false,
        cvImproveSuggestions: false,
        jdFitRemaining: 0,
        aiMockInterview: false,
        mockInterviewRemaining: 0,
        startsAt: null,
        endsAt: null,
      };
    }

    return {
      audience,
      packageCode: freePackage.code,
      packageName: freePackage.name,
      entitlementId: null,
      isVirtualFree: true,
      maxActiveJobs: freePackage.maxActiveJobs,
      cvUnlockRemaining: 0,
      aiRanking: freePackage.aiRanking,
      advancedFilters: freePackage.advancedFilters,
      recruitmentStats: freePackage.recruitmentStats,
      talentPoolAccess: freePackage.talentPoolAccess,
      jdFitAnalysis: freePackage.jdFitAnalysis,
      cvImproveSuggestions: freePackage.cvImproveSuggestions,
      jdFitRemaining: 0,
      aiMockInterview: freePackage.aiMockInterview,
      mockInterviewRemaining: 0,
      startsAt: null,
      endsAt: null,
    };
  }

  private toFeatures(
    row: {
      id: string;
      maxActiveJobs: number | null;
      cvUnlockRemaining: number;
      aiRanking: boolean;
      advancedFilters: boolean;
      recruitmentStats: boolean;
      talentPoolAccess: boolean;
      jdFitAnalysis: boolean;
      cvImproveSuggestions: boolean;
      jdFitRemaining: number;
      aiMockInterview: boolean;
      mockInterviewRemaining: number;
      startsAt: Date;
      endsAt: Date | null;
      package: { code: string; name: string };
    },
    audience: PackageAudience,
    isVirtualFree: boolean,
  ): EntitlementFeatures {
    return {
      audience,
      packageCode: row.package.code,
      packageName: row.package.name,
      entitlementId: row.id,
      isVirtualFree,
      maxActiveJobs: row.maxActiveJobs,
      cvUnlockRemaining: row.cvUnlockRemaining,
      aiRanking: row.aiRanking,
      advancedFilters: row.advancedFilters,
      recruitmentStats: row.recruitmentStats,
      talentPoolAccess: row.talentPoolAccess,
      jdFitAnalysis: row.jdFitAnalysis,
      cvImproveSuggestions: row.cvImproveSuggestions,
      jdFitRemaining: row.jdFitRemaining,
      aiMockInterview: row.aiMockInterview,
      mockInterviewRemaining: row.mockInterviewRemaining,
      startsAt: row.startsAt,
      endsAt: row.endsAt,
    };
  }
}
