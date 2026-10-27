import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import {
  JobStatus,
  NotificationType,
  Prisma,
  ResumeParsingStatus,
  TalentInvitationStatus,
} from '@prisma/client';
import { PrismaService } from '../../database/prisma.service';
import { ApplicationsService } from '../applications/applications.service';
import { EntitlementsService } from '../billing/entitlements.service';
import { talentPoolVisibilityWhere } from '../billing/talent-pool-visibility';
import { NotificationsService } from '../notifications/notifications.service';
import {
  CreateTalentInvitationDto,
  QueryTalentInvitationsDto,
} from './dto/talent-invitation.dto';

const invitationInclude = {
  candidate: { select: { id: true, fullName: true, desiredTitle: true } },
  recruiterUser: { select: { id: true, fullName: true } },
  job: {
    select: {
      id: true,
      jobCode: true,
      title: true,
      description: true,
      requirements: true,
      minSalary: true,
      maxSalary: true,
      currency: true,
      location: true,
      employmentType: true,
      status: true,
      expiryDate: true,
    },
  },
} satisfies Prisma.TalentInvitationInclude;

@Injectable()
export class TalentInvitationsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly applications: ApplicationsService,
    private readonly entitlements: EntitlementsService,
    private readonly notifications: NotificationsService,
  ) {}

  private expirePending(
    where: Prisma.TalentInvitationWhereInput,
    now = new Date(),
  ) {
    return this.prisma.talentInvitation.updateMany({
      where: {
        AND: [
          where,
          { status: TalentInvitationStatus.PENDING, expiresAt: { lte: now } },
        ],
      },
      data: { status: TalentInvitationStatus.EXPIRED },
    });
  }

  async availableJobs(userId: string, candidateId?: string) {
    const cap = await this.entitlements.getApplicantCapForJobOwner(userId);
    const jobs = await this.prisma.jobPosting.findMany({
      where: {
        recruiter: { userId },
        OR: [
          {
            status: JobStatus.PUBLISHED,
            OR: [{ expiryDate: null }, { expiryDate: { gt: new Date() } }],
          },
          ...(candidateId ? [{ applications: { some: { candidateId } } }] : []),
        ],
      },
      select: {
        id: true,
        jobCode: true,
        title: true,
        location: true,
        _count: { select: { applications: true } },
        applications: {
          where: { candidateId: candidateId ?? '' },
          select: { id: true },
          take: 1,
        },
      },
      orderBy: { createdAt: 'desc' },
      take: 100,
    });
    return {
      data: jobs
        .filter(
          (job) =>
            job.applications.length > 0 ||
            cap == null ||
            job._count.applications < cap,
        )
        .map((job) => ({
          id: job.id,
          jobCode: job.jobCode,
          title: job.title,
          location: job.location,
          existingApplicationId: job.applications[0]?.id ?? null,
        })),
    };
  }

  async availableResumes(userId: string) {
    return {
      data: await this.prisma.resume.findMany({
        where: {
          candidate: { userId },
          parsingStatus: ResumeParsingStatus.PARSED,
        },
        select: { id: true, originalFileName: true, createdAt: true },
        orderBy: { createdAt: 'desc' },
      }),
    };
  }

  async create(
    userId: string,
    dto: CreateTalentInvitationDto,
    now = new Date(),
  ) {
    await this.entitlements.assertTalentPool(userId);
    try {
      return await this.prisma.$transaction(async (tx) => {
        // Serialize sending with visibility changes and job closure; a withdrawn
        // candidate cannot receive a fresh invitation after these checks.
        await tx.$queryRaw`SELECT id FROM candidate_profiles WHERE id = ${dto.candidateId} FOR UPDATE`;
        const candidate = await tx.candidateProfile.findFirst({
          where: { id: dto.candidateId, ...talentPoolVisibilityWhere(now) },
          select: { id: true, userId: true, fullName: true },
        });
        if (!candidate?.userId)
          throw new NotFoundException(
            'Ứng viên không còn chia sẻ hồ sơ trong Talent Pool.',
          );
        const unlock = await tx.cvUnlock.findUnique({
          where: {
            unlockedByUserId_candidateProfileId: {
              unlockedByUserId: userId,
              candidateProfileId: dto.candidateId,
            },
          },
        });
        if (!unlock)
          throw new ForbiddenException(
            'Vui lòng mở khóa hồ sơ trước khi gửi lời mời.',
          );

        await tx.$queryRaw`SELECT id FROM job_postings WHERE id = ${dto.jobId} FOR UPDATE`;
        const job = await tx.jobPosting.findFirst({
          where: {
            id: dto.jobId,
            recruiter: { userId },
          },
          select: {
            id: true,
            title: true,
            autoCloseOnQuota: true,
            targetHires: true,
            status: true,
            expiryDate: true,
          },
        });
        if (!job)
          throw new BadRequestException(
            'Tin tuyển dụng không thuộc tài khoản của bạn hoặc không còn nhận hồ sơ.',
          );
        const existing = await tx.application.findUnique({
          where: {
            jobId_candidateId: { jobId: job.id, candidateId: candidate.id },
          },
          select: { id: true },
        });
        if (existing)
          return { applicationId: existing.id, alreadyApplied: true as const };
        if (
          job.status !== JobStatus.PUBLISHED ||
          (job.expiryDate && job.expiryDate <= now)
        ) {
          throw new BadRequestException(
            'Tin tuyển dụng không còn nhận hồ sơ mới.',
          );
        }
        const cap = await this.entitlements.getApplicantCapForJobOwner(userId);
        if (
          cap != null &&
          (await tx.application.count({ where: { jobId: job.id } })) >= cap
        ) {
          throw new BadRequestException(
            'Tin tuyển dụng đã đạt giới hạn hồ sơ.',
          );
        }
        if (
          job.autoCloseOnQuota &&
          (await tx.application.count({
            where: { jobId: job.id, currentStage: 'HIRED' },
          })) >= job.targetHires
        ) {
          throw new BadRequestException('Tin tuyển dụng đã tuyển đủ chỉ tiêu.');
        }
        await tx.talentInvitation.updateMany({
          where: {
            recruiterUserId: userId,
            candidateId: candidate.id,
            jobId: job.id,
            status: TalentInvitationStatus.PENDING,
            expiresAt: { lte: now },
          },
          data: { status: TalentInvitationStatus.EXPIRED },
        });
        const pending = await tx.talentInvitation.findFirst({
          where: {
            recruiterUserId: userId,
            candidateId: candidate.id,
            jobId: job.id,
            status: TalentInvitationStatus.PENDING,
          },
        });
        if (pending)
          throw new ConflictException(
            'Đã có lời mời đang chờ phản hồi cho ứng viên và tin này.',
          );
        const invitation = await tx.talentInvitation.create({
          data: {
            recruiterUserId: userId,
            candidateId: candidate.id,
            jobId: job.id,
            message: dto.message?.trim() || null,
            expiresAt: new Date(now.getTime() + 7 * 86400000),
          },
          include: invitationInclude,
        });
        await this.notifications.createNotificationOnce(
          tx,
          `talent-invitation:${invitation.id}:created`,
          {
            recipientUserId: candidate.userId,
            type: NotificationType.SYSTEM_ALERT,
            title: `Lời mời ứng tuyển: ${job.title}`,
            message:
              'Bạn nhận được lời mời ứng tuyển mới. Xem chi tiết và chọn CV để ứng tuyển trong vòng 7 ngày.',
            payload: {
              talentInvitationId: invitation.id,
              href: `/candidate/invitations?invitationId=${invitation.id}`,
              jobId: job.id,
            },
          },
        );
        return { invitation, alreadyApplied: false as const };
      });
    } catch (error) {
      if (
        error instanceof Prisma.PrismaClientKnownRequestError &&
        error.code === 'P2002'
      ) {
        throw new ConflictException(
          'Đã có lời mời đang chờ phản hồi cho ứng viên và tin này.',
        );
      }
      throw error;
    }
  }

  private async list(
    where: Prisma.TalentInvitationWhereInput,
    query: QueryTalentInvitationsDto,
  ) {
    const now = new Date();
    await this.expirePending(where, now);
    const [data, total] = await Promise.all([
      this.prisma.talentInvitation.findMany({
        where,
        include: invitationInclude,
        orderBy: { createdAt: 'desc' },
        skip: (query.page - 1) * query.limit,
        take: query.limit,
      }),
      this.prisma.talentInvitation.count({ where }),
    ]);
    // Also compute effective status to cover an invitation expiring between queries.
    // Keep existing applications discoverable even when an old invitation was
    // declined/withdrawn/expired; reading never re-accepts those invitations.
    const applications = data.length
      ? await this.prisma.application.findMany({
          where: {
            OR: data.map((item) => ({
              candidateId: item.candidateId,
              jobId: item.jobId,
            })),
          },
          select: { id: true, candidateId: true, jobId: true },
        })
      : [];
    const existing = new Map(
      applications.map((application) => [
        `${application.candidateId}:${application.jobId}`,
        application.id,
      ]),
    );
    const responseTime = new Date();
    return {
      data: data.map((item) => ({
        ...item,
        existingApplicationId:
          existing.get(`${item.candidateId}:${item.jobId}`) ?? null,
        status:
          item.status === 'PENDING' && item.expiresAt <= responseTime
            ? 'EXPIRED'
            : item.status,
      })),
      meta: {
        total,
        page: query.page,
        limit: query.limit,
        totalPages: Math.ceil(total / query.limit),
      },
    };
  }

  listForRecruiter(userId: string, query: QueryTalentInvitationsDto) {
    return this.list(
      {
        recruiterUserId: userId,
        ...(query.candidateId ? { candidateId: query.candidateId } : {}),
        ...(query.invitationId ? { id: query.invitationId } : {}),
      },
      query,
    );
  }

  listForCandidate(userId: string, query: QueryTalentInvitationsDto) {
    // Receiving and responding does not depend on current Talent Pool visibility.
    return this.list(
      {
        candidate: { userId },
        ...(query.invitationId ? { id: query.invitationId } : {}),
      },
      query,
    );
  }

  async accept(userId: string, id: string, resumeId: string) {
    const invitation = await this.prisma.talentInvitation.findFirst({
      where: { id, candidate: { userId } },
    });
    if (!invitation) throw new NotFoundException('Không tìm thấy lời mời.');
    if (
      invitation.status === TalentInvitationStatus.ACCEPTED &&
      invitation.applicationId
    ) {
      return { applicationId: invitation.applicationId, reused: true };
    }
    if (
      invitation.status !== TalentInvitationStatus.PENDING ||
      invitation.expiresAt <= new Date()
    ) {
      throw new BadRequestException(
        'Lời mời đã hết hạn, bị thu hồi hoặc đã được phản hồi.',
      );
    }
    try {
      return await this.applications.applyForJob(
        userId,
        { jobId: invitation.jobId, resumeId },
        new Date(),
        invitation.id,
      );
    } catch (error) {
      // A simultaneous accept may have succeeded and filled the last slot, or
      // post-commit evaluation dispatch may have failed. Preserve the outcome.
      const accepted = await this.prisma.talentInvitation.findFirst({
        where: {
          id,
          candidate: { userId },
          status: TalentInvitationStatus.ACCEPTED,
        },
      });
      if (accepted?.applicationId)
        return { applicationId: accepted.applicationId, reused: true };
      throw error;
    }
  }

  private async finish(
    userId: string,
    id: string,
    status: 'DECLINED' | 'WITHDRAWN',
  ) {
    const scope: Prisma.TalentInvitationWhereInput =
      status === 'DECLINED'
        ? { candidate: { userId } }
        : { recruiterUserId: userId };
    await this.expirePending({ AND: [scope, { id }] });
    return this.prisma.$transaction(async (tx) => {
      const invitation = await tx.talentInvitation.findFirst({
        where: { AND: [scope, { id }] },
        include: {
          candidate: { select: { userId: true } },
          job: { select: { title: true } },
        },
      });
      if (!invitation) throw new NotFoundException('Không tìm thấy lời mời.');
      if (invitation.status === status) return { id, status };
      const updated = await tx.talentInvitation.updateMany({
        where: {
          id,
          status: TalentInvitationStatus.PENDING,
          expiresAt: { gt: new Date() },
        },
        data: { status, respondedAt: new Date() },
      });
      if (updated.count !== 1)
        throw new ConflictException(
          'Lời mời đã hết hạn hoặc đã được xử lý. Vui lòng làm mới danh sách.',
        );
      const recipient =
        status === 'DECLINED'
          ? invitation.recruiterUserId
          : invitation.candidate.userId;
      if (recipient)
        await this.notifications.createNotificationOnce(
          tx,
          `talent-invitation:${id}:${status}`,
          {
            recipientUserId: recipient,
            type: NotificationType.SYSTEM_ALERT,
            title:
              status === 'DECLINED'
                ? 'Ứng viên đã từ chối lời mời'
                : 'Lời mời ứng tuyển đã được thu hồi',
            message: `Lời mời cho vị trí "${invitation.job.title}" đã ${status === 'DECLINED' ? 'được từ chối' : 'được HR thu hồi'}.`,
            payload: {
              talentInvitationId: id,
              href:
                status === 'DECLINED'
                  ? '/recruiter/talent-invitations'
                  : `/candidate/invitations?invitationId=${id}`,
            },
          },
        );
      return { id, status };
    });
  }

  decline(userId: string, id: string) {
    return this.finish(userId, id, 'DECLINED');
  }
  withdraw(userId: string, id: string) {
    return this.finish(userId, id, 'WITHDRAWN');
  }
}
