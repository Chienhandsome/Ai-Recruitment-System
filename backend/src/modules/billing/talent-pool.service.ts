import {
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import {
  CandidateProfileStatus,
  EntitlementStatus,
  Prisma,
} from '@prisma/client';
import { PrismaService } from '../../database/prisma.service';
import { EntitlementsService } from './entitlements.service';
import { QueryTalentPoolDto } from './dto/query-talent-pool.dto';

@Injectable()
export class TalentPoolService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly entitlements: EntitlementsService,
  ) {}

  async search(userId: string, query: QueryTalentPoolDto) {
    await this.entitlements.assertTalentPool(userId);

    const where: Prisma.CandidateProfileWhereInput = {
      isProfilePublic: true,
      status: {
        in: [CandidateProfileStatus.READY, CandidateProfileStatus.NEEDS_REVIEW],
      },
      ...(query.search?.trim()
        ? {
            OR: [
              {
                fullName: {
                  contains: query.search.trim(),
                  mode: 'insensitive',
                },
              },
              {
                desiredTitle: {
                  contains: query.search.trim(),
                  mode: 'insensitive',
                },
              },
              {
                professionalSummary: {
                  contains: query.search.trim(),
                  mode: 'insensitive',
                },
              },
            ],
          }
        : {}),
      ...(query.skill
        ? {
            candidateSkills: {
              some: {
                skill: {
                  name: { contains: query.skill, mode: 'insensitive' },
                },
              },
            },
          }
        : {}),
      ...(query.desiredTitle
        ? {
            desiredTitle: {
              contains: query.desiredTitle,
              mode: 'insensitive',
            },
          }
        : {}),
    };

    const [total, rows] = await Promise.all([
      this.prisma.candidateProfile.count({ where }),
      this.prisma.candidateProfile.findMany({
        where,
        select: {
          id: true,
          fullName: true,
          desiredTitle: true,
          professionalSummary: true,
          preferredModel: true,
          expectedMinSalary: true,
          expectedMaxSalary: true,
          address: true,
          email: true,
          phone: true,
          linkedinUrl: true,
          githubUrl: true,
          portfolioUrl: true,
          candidateSkills: {
            take: 12,
            select: {
              skill: { select: { id: true, name: true } },
              proficiencyLevel: true,
              isPrimary: true,
            },
          },
          workExperiences: {
            take: 3,
            orderBy: { startDate: 'desc' },
            select: {
              companyName: true,
              positionTitle: true,
              startDate: true,
              endDate: true,
              isCurrent: true,
            },
          },
        },
        orderBy: { updatedAt: 'desc' },
        skip: (query.page - 1) * query.limit,
        take: query.limit,
      }),
    ]);

    const unlocks = await this.prisma.cvUnlock.findMany({
      where: {
        unlockedByUserId: userId,
        candidateProfileId: { in: rows.map((r) => r.id) },
      },
      select: { candidateProfileId: true },
    });
    const unlockedIds = new Set(unlocks.map((u) => u.candidateProfileId));

    return {
      data: rows.map((row) => this.toPublicCard(row, unlockedIds.has(row.id))),
      meta: {
        total,
        page: query.page,
        limit: query.limit,
        totalPages: Math.ceil(total / query.limit),
      },
    };
  }

  async getCandidate(userId: string, candidateProfileId: string) {
    await this.entitlements.assertTalentPool(userId);

    const profile = await this.prisma.candidateProfile.findFirst({
      where: {
        id: candidateProfileId,
        isProfilePublic: true,
      },
      select: {
        id: true,
        fullName: true,
        desiredTitle: true,
        professionalSummary: true,
        preferredModel: true,
        expectedMinSalary: true,
        expectedMaxSalary: true,
        address: true,
        email: true,
        phone: true,
        linkedinUrl: true,
        githubUrl: true,
        portfolioUrl: true,
        candidateSkills: {
          select: {
            skill: { select: { id: true, name: true } },
            proficiencyLevel: true,
            isPrimary: true,
          },
        },
        workExperiences: {
          orderBy: { startDate: 'desc' },
          select: {
            companyName: true,
            positionTitle: true,
            startDate: true,
            endDate: true,
            isCurrent: true,
            description: true,
          },
        },
        educations: {
          select: {
            schoolName: true,
            major: true,
            degree: true,
            startDate: true,
            endDate: true,
          },
        },
      },
    });
    if (!profile) {
      throw new NotFoundException(
        'Không tìm thấy hồ sơ công khai trong kho ứng viên.',
      );
    }

    const unlocked = await this.prisma.cvUnlock.findUnique({
      where: {
        unlockedByUserId_candidateProfileId: {
          unlockedByUserId: userId,
          candidateProfileId,
        },
      },
    });

    return this.toPublicCard(profile, Boolean(unlocked));
  }

  async unlock(userId: string, candidateProfileId: string) {
    const entitlement = await this.entitlements.assertTalentPool(userId);

    const profile = await this.prisma.candidateProfile.findFirst({
      where: {
        id: candidateProfileId,
        isProfilePublic: true,
      },
      select: { id: true },
    });
    if (!profile) {
      throw new NotFoundException(
        'Chỉ mở khóa được hồ sơ đã công khai trong kho ứng viên.',
      );
    }

    const existing = await this.prisma.cvUnlock.findUnique({
      where: {
        unlockedByUserId_candidateProfileId: {
          unlockedByUserId: userId,
          candidateProfileId,
        },
      },
    });
    if (existing) {
      return this.getCandidate(userId, candidateProfileId);
    }

    if (entitlement.cvUnlockRemaining <= 0) {
      throw new ForbiddenException(
        'Đã hết lượt mở khóa CV trong gói hiện tại. Gia hạn Premium hoặc chờ chu kỳ mới.',
      );
    }

    try {
      await this.prisma.$transaction(async (tx) => {
        const updated = await tx.packageEntitlement.updateMany({
          where: {
            id: entitlement.entitlementId,
            status: EntitlementStatus.ACTIVE,
            cvUnlockRemaining: { gt: 0 },
          },
          data: { cvUnlockRemaining: { decrement: 1 } },
        });
        if (updated.count === 0) {
          throw new ForbiddenException('Không còn lượt mở khóa CV.');
        }

        await tx.cvUnlock.create({
          data: {
            entitlementId: entitlement.entitlementId,
            unlockedByUserId: userId,
            candidateProfileId,
          },
        });
      });
    } catch (error) {
      if (
        error instanceof Prisma.PrismaClientKnownRequestError &&
        error.code === 'P2002'
      ) {
        return this.getCandidate(userId, candidateProfileId);
      }
      throw error;
    }

    return this.getCandidate(userId, candidateProfileId);
  }

  private toPublicCard(
    profile: {
      id: string;
      fullName: string;
      desiredTitle: string | null;
      professionalSummary: string | null;
      preferredModel: unknown;
      expectedMinSalary: unknown;
      expectedMaxSalary: unknown;
      address: string | null;
      email: string;
      phone: string | null;
      linkedinUrl: string | null;
      githubUrl: string | null;
      portfolioUrl: string | null;
      candidateSkills?: unknown;
      workExperiences?: unknown;
      educations?: unknown;
    },
    unlocked: boolean,
  ) {
    const maskedName = this.maskName(profile.fullName);

    return {
      id: profile.id,
      displayName: unlocked ? profile.fullName : maskedName,
      desiredTitle: profile.desiredTitle,
      professionalSummary: profile.professionalSummary,
      preferredModel: profile.preferredModel,
      expectedMinSalary: profile.expectedMinSalary,
      expectedMaxSalary: profile.expectedMaxSalary,
      locationHint: this.maskAddress(profile.address),
      skills: profile.candidateSkills ?? [],
      workExperiences: profile.workExperiences ?? [],
      educations: profile.educations ?? [],
      contactUnlocked: unlocked,
      contact: unlocked
        ? {
            email: profile.email,
            phone: profile.phone,
            linkedinUrl: profile.linkedinUrl,
            githubUrl: profile.githubUrl,
            portfolioUrl: profile.portfolioUrl,
            address: profile.address,
          }
        : null,
      privacyNote: unlocked
        ? null
        : 'Thông tin liên hệ bị ẩn cho đến khi bạn mở khóa hồ sơ (Premium).',
    };
  }

  private maskName(fullName: string) {
    const parts = fullName.trim().split(/\s+/);
    if (parts.length === 1) {
      return `${parts[0].slice(0, 1)}***`;
    }
    return `${parts[0]} ${parts[parts.length - 1].slice(0, 1)}.`;
  }

  private maskAddress(address: string | null) {
    if (!address) return null;
    const parts = address.split(',').map((p) => p.trim()).filter(Boolean);
    if (parts.length <= 1) return '***';
    return parts.slice(-2).join(', ');
  }
}
