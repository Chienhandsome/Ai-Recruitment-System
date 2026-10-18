import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { CandidateProfileStatus, PackageAudience } from '@prisma/client';
import { PrismaService } from '../../database/prisma.service';
import { EntitlementsService } from '../billing/entitlements.service';
import { talentPoolVisibilityWhere } from '../billing/talent-pool-visibility';
import { UpdateJobSeekingDto } from './dto/update-job-seeking.dto';

@Injectable()
export class CandidateJobSeekingService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly entitlements: EntitlementsService,
  ) {}

  async getStatus(userId: string) {
    const now = new Date();
    const [profile, features] = await Promise.all([
      this.prisma.candidateProfile.findUnique({ where: { userId } }),
      this.entitlements.getEffectiveEntitlement(
        userId,
        PackageAudience.CANDIDATE,
      ),
    ]);
    if (!profile) throw new NotFoundException('Không tìm thấy hồ sơ ứng viên.');
    const visible = await this.prisma.candidateProfile.findFirst({
      where: { id: profile.id, ...talentPoolVisibilityWhere(now) },
      select: { id: true },
    });
    const profileReady = this.isProfileReady(profile);
    const canEnable = Boolean(
      features.jobSeekingAccess &&
      features.entitlementId &&
      features.endsAt &&
      features.endsAt > now,
    );
    return {
      enabled: profile.jobSeekingEnabled,
      visible: Boolean(visible),
      confirmedAt: profile.jobSeekingConfirmedAt,
      visibleUntil: profile.jobSeekingUntil,
      canEnable,
      profileReady,
      packageName: features.packageName,
      packageEndsAt: features.endsAt,
    };
  }

  async update(userId: string, dto: UpdateJobSeekingDto) {
    const profile = await this.prisma.candidateProfile.findUnique({
      where: { userId },
    });
    if (!profile) throw new NotFoundException('Không tìm thấy hồ sơ ứng viên.');

    if (!dto.enabled) {
      await this.prisma.candidateProfile.update({
        where: { id: profile.id },
        data: {
          jobSeekingEnabled: false,
          isProfilePublic: false,
          jobSeekingUntil: null,
          jobSeekingEntitlementId: null,
        },
      });
      return this.getStatus(userId);
    }
    if (dto.consent !== true) {
      throw new BadRequestException(
        'Vui lòng đồng ý hiển thị hồ sơ cho nhà tuyển dụng trước khi bật tìm việc.',
      );
    }
    const features = await this.entitlements.getEffectiveEntitlement(
      userId,
      PackageAudience.CANDIDATE,
    );
    const now = new Date();
    if (
      !features.jobSeekingAccess ||
      !features.entitlementId ||
      !features.endsAt ||
      features.endsAt <= now
    ) {
      throw new ForbiddenException(
        'Tìm việc chủ động yêu cầu gói Candidate Pro hoặc Premium còn hiệu lực.',
      );
    }
    if (!this.isProfileReady(profile)) {
      throw new BadRequestException(
        'Vui lòng hoàn thiện vị trí mong muốn, giới thiệu nghề nghiệp và hồ sơ trước khi bật tìm việc.',
      );
    }
    await this.prisma.candidateProfile.update({
      where: { id: profile.id },
      data: {
        isProfilePublic: true,
        jobSeekingEnabled: true,
        jobSeekingConfirmedAt: now,
        jobSeekingUntil: features.endsAt,
        jobSeekingEntitlementId: features.entitlementId,
      },
    });
    return this.getStatus(userId);
  }

  private isProfileReady(profile: {
    status: CandidateProfileStatus;
    desiredTitle: string | null;
    professionalSummary: string | null;
  }) {
    return (
      (profile.status === CandidateProfileStatus.READY ||
        profile.status === CandidateProfileStatus.NEEDS_REVIEW) &&
      Boolean(
        profile.desiredTitle?.trim() && profile.professionalSummary?.trim(),
      )
    );
  }
}
