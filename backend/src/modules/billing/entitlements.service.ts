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
} from './billing.types';

const packageSelect = {
  id: true,
  code: true,
  name: true,
  maxActiveJobs: true,
  cvUnlockQuota: true,
  aiRanking: true,
  advancedFilters: true,
  recruitmentStats: true,
  talentPoolAccess: true,
  durationDays: true,
  priceVnd: true,
} satisfies Prisma.ServicePackageSelect;

@Injectable()
export class EntitlementsService {
  constructor(private readonly prisma: PrismaService) {}

  async ensureFreeEntitlement(userId: string) {
    const freePackage = await this.prisma.servicePackage.findUnique({
      where: { code: PACKAGE_CODES.HR_FREE },
      select: packageSelect,
    });
    if (!freePackage) {
      throw new NotFoundException(
        'Gói HR Free chưa được cấu hình. Chạy seed dữ liệu gói dịch vụ.',
      );
    }

    const recruiter = await this.prisma.recruiterProfile.findUnique({
      where: { userId },
      select: { companyId: true },
    });

    const existingFree = await this.prisma.packageEntitlement.findFirst({
      where: {
        userId,
        packageId: freePackage.id,
        status: EntitlementStatus.ACTIVE,
        OR: [{ endsAt: null }, { endsAt: { gt: new Date() } }],
      },
      include: { package: { select: packageSelect } },
    });
    if (existingFree) {
      return existingFree;
    }

    return this.prisma.packageEntitlement.create({
      data: {
        userId,
        companyId: recruiter?.companyId ?? null,
        packageId: freePackage.id,
        status: EntitlementStatus.ACTIVE,
        startsAt: new Date(),
        endsAt: null,
        maxActiveJobs: freePackage.maxActiveJobs,
        cvUnlockRemaining: freePackage.cvUnlockQuota,
        aiRanking: freePackage.aiRanking,
        advancedFilters: freePackage.advancedFilters,
        recruitmentStats: freePackage.recruitmentStats,
        talentPoolAccess: freePackage.talentPoolAccess,
      },
      include: { package: { select: packageSelect } },
    });
  }

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
   * Returns the highest-tier active entitlement (Premium > Pro > Free).
   */
  async getEffectiveEntitlement(userId: string): Promise<EntitlementFeatures> {
    await this.expireStaleEntitlements(userId);
    await this.ensureFreeEntitlement(userId);

    const active = await this.prisma.packageEntitlement.findMany({
      where: {
        userId,
        status: EntitlementStatus.ACTIVE,
        OR: [{ endsAt: null }, { endsAt: { gt: new Date() } }],
      },
      include: { package: { select: packageSelect } },
      orderBy: { startsAt: 'desc' },
    });

    if (active.length === 0) {
      throw new ForbiddenException('Không tìm thấy quyền sử dụng gói dịch vụ.');
    }

    const ranked = [...active].sort(
      (a, b) => this.tierRank(b.package.code) - this.tierRank(a.package.code),
    );
    const best = ranked[0];

    return {
      packageCode: best.package.code,
      packageName: best.package.name,
      maxActiveJobs: best.maxActiveJobs,
      cvUnlockRemaining: best.cvUnlockRemaining,
      aiRanking: best.aiRanking,
      advancedFilters: best.advancedFilters,
      recruitmentStats: best.recruitmentStats,
      talentPoolAccess: best.talentPoolAccess,
      startsAt: best.startsAt,
      endsAt: best.endsAt,
      entitlementId: best.id,
    };
  }

  async getEntitlementStatus(userId: string) {
    const features = await this.getEffectiveEntitlement(userId);
    const activeJobs = await this.countActiveJobs(userId);

    return {
      ...features,
      activeJobCount: activeJobs,
      canPublishMoreJobs:
        features.maxActiveJobs === null || activeJobs < features.maxActiveJobs,
      disclaimer:
        'AI chỉ hỗ trợ xếp hạng và giải thích mức phù hợp. Quyết định tuyển dụng thuộc về nhà tuyển dụng. Hệ thống không cam kết tuyển được người.',
    };
  }

  async countActiveJobs(userId: string) {
    const recruiter = await this.prisma.recruiterProfile.findUnique({
      where: { userId },
      select: { id: true, companyId: true },
    });
    if (!recruiter) {
      return 0;
    }

    if (recruiter.companyId) {
      return this.prisma.jobPosting.count({
        where: {
          status: JobStatus.PUBLISHED,
          recruiter: { companyId: recruiter.companyId },
        },
      });
    }

    return this.prisma.jobPosting.count({
      where: {
        status: JobStatus.PUBLISHED,
        recruiterId: recruiter.id,
      },
    });
  }

  async assertCanPublishJob(userId: string, jobIdBeingPublished?: string) {
    const features = await this.getEffectiveEntitlement(userId);
    if (features.maxActiveJobs === null) {
      return features;
    }

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

  async assertFeature(
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
    const entitlement = await this.getEffectiveEntitlement(userId);
    if (!entitlement[feature]) {
      throw new ForbiddenException(
        new PackageFeatureDeniedError(feature, requiredPackageLabel).message,
      );
    }
    return entitlement;
  }

  async assertAiRanking(userId: string) {
    return this.assertFeature(userId, 'aiRanking', 'HR Pro hoặc Premium');
  }

  async assertAdvancedFilters(userId: string) {
    return this.assertFeature(userId, 'advancedFilters', 'HR Pro hoặc Premium');
  }

  async assertRecruitmentStats(userId: string) {
    return this.assertFeature(userId, 'recruitmentStats', 'HR Premium');
  }

  async assertTalentPool(userId: string) {
    return this.assertFeature(userId, 'talentPoolAccess', 'HR Premium');
  }

  async activateFromPaidOrder(params: {
    userId: string;
    packageId: string;
    orderId: string;
    companyId?: string | null;
  }) {
    const pkg = await this.prisma.servicePackage.findFirst({
      where: {
        id: params.packageId,
        audience: PackageAudience.EMPLOYER,
        isActive: true,
      },
      select: packageSelect,
    });
    if (!pkg) {
      throw new BadRequestException('Gói dịch vụ không hợp lệ.');
    }
    if (pkg.code === PACKAGE_CODES.HR_FREE) {
      throw new BadRequestException('Không thể thanh toán gói Free.');
    }
    if (!pkg.durationDays || pkg.durationDays <= 0) {
      throw new BadRequestException('Gói trả phí phải có thời hạn.');
    }

    const startsAt = new Date();
    const endsAt = new Date(startsAt);
    endsAt.setDate(endsAt.getDate() + pkg.durationDays);

    // Expire other paid active entitlements so the latest paid plan wins.
    await this.prisma.packageEntitlement.updateMany({
      where: {
        userId: params.userId,
        status: EntitlementStatus.ACTIVE,
        package: { code: { not: PACKAGE_CODES.HR_FREE } },
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
        maxActiveJobs: pkg.maxActiveJobs,
        cvUnlockRemaining: pkg.cvUnlockQuota,
        aiRanking: pkg.aiRanking,
        advancedFilters: pkg.advancedFilters,
        recruitmentStats: pkg.recruitmentStats,
        talentPoolAccess: pkg.talentPoolAccess,
      },
      include: { package: { select: packageSelect } },
    });
  }

  private tierRank(code: string): number {
    switch (code) {
      case PACKAGE_CODES.HR_PREMIUM:
        return 3;
      case PACKAGE_CODES.HR_PRO:
        return 2;
      case PACKAGE_CODES.HR_FREE:
        return 1;
      default:
        return 0;
    }
  }
}
