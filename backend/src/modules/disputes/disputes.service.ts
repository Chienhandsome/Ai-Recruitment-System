import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { AccountStatus, DisputeStatus, JobStatus, Prisma } from '@prisma/client';
import { PrismaService } from '../../database/prisma.service';
import { NotificationsService } from '../notifications/notifications.service';
import { CreateDisputeDto } from './dto/create-dispute.dto';
import { ResolveDisputeDto } from './dto/resolve-dispute.dto';
import { invalidateUserRoleCache } from '../auth/guards/roles.guard';

@Injectable()
export class DisputesService {
  private readonly logger = new Logger(DisputesService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly notificationsService: NotificationsService,
  ) {}

  private generateDisputeNumber(): string {
    const dateStr = new Date().toISOString().slice(0, 10).replace(/-/g, '');
    const randomSuffix = Math.floor(1000 + Math.random() * 9000);
    return `DSP-${dateStr}-${randomSuffix}`;
  }

  async createDispute(userId: string, dto: CreateDisputeDto) {
    const application = await this.prisma.application.findUnique({
      where: { id: dto.applicationId },
      include: {
        job: {
          select: {
            id: true,
            title: true,
            recruiter: { select: { userId: true, user: { select: { fullName: true } } } },
          },
        },
        candidate: { select: { userId: true, fullName: true } },
        offer: true,
      },
    });

    if (!application) {
      throw new NotFoundException('Hồ sơ ứng tuyển không tồn tại.');
    }

    const isCandidate = application.candidate.userId === userId;
    const isRecruiter = application.job.recruiter?.userId === userId;

    if (!isCandidate && !isRecruiter) {
      throw new ForbiddenException('Bạn không liên quan đến hồ sơ ứng tuyển này.');
    }

    const disputeNumber = this.generateDisputeNumber();

    const dispute = await this.prisma.dispute.create({
      data: {
        disputeNumber,
        applicationId: dto.applicationId,
        contractId: dto.contractId || null,
        reportedByUserId: userId,
        category: dto.category,
        title: dto.title,
        description: dto.description,
        evidenceUrls: dto.evidenceUrls ? (dto.evidenceUrls as Prisma.InputJsonValue) : Prisma.JsonNull,
        status: DisputeStatus.PENDING,
      },
      include: {
        reportedByUser: { select: { fullName: true, email: true } },
        application: {
          include: {
            job: { select: { title: true } },
            candidate: { select: { fullName: true } },
          },
        },
      },
    });

    // Notify Recruiter if reported by Candidate
    if (isCandidate && application.job.recruiter?.userId) {
      try {
        await this.notificationsService.createNotification({
          recipientUserId: application.job.recruiter.userId,
          applicationId: application.id,
          title: `Hồ sơ có khiếu nại mới (${disputeNumber})`,
          message: `Ứng viên ${application.candidate.fullName} đã gửi yêu cầu khiếu nại/tố cáo về vị trí ${application.job.title}. Ban quản trị đang tiếp nhận xử lý.`,
          payload: { disputeId: dispute.id },
        });
      } catch (err) {
        this.logger.warn(`Failed to notify recruiter about dispute: ${err}`);
      }
    }

    return dispute;
  }

  async getDisputesByApplication(userId: string, applicationId: string) {
    const application = await this.prisma.application.findUnique({
      where: { id: applicationId },
      include: {
        job: { select: { recruiter: { select: { userId: true } } } },
        candidate: { select: { userId: true } },
      },
    });

    if (!application) {
      throw new NotFoundException('Hồ sơ không tồn tại.');
    }

    const isCandidate = application.candidate.userId === userId;
    const isRecruiter = application.job.recruiter?.userId === userId;

    return this.prisma.dispute.findMany({
      where: { applicationId },
      include: {
        reportedByUser: { select: { fullName: true, email: true } },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async getAdminDisputes(status?: DisputeStatus) {
    const where: Prisma.DisputeWhereInput = {};
    if (status) {
      where.status = status;
    }

    return this.prisma.dispute.findMany({
      where,
      include: {
        reportedByUser: { select: { id: true, fullName: true, email: true } },
        application: {
          include: {
            job: {
              select: {
                id: true,
                title: true,
                recruiter: {
                  select: {
                    userId: true,
                    user: { select: { fullName: true, email: true, status: true } },
                    company: { select: { id: true, name: true } },
                  },
                },
              },
            },
            candidate: { select: { id: true, fullName: true, email: true } },
            offer: true,
            contract: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async resolveDispute(adminUserId: string, disputeId: string, dto: ResolveDisputeDto) {
    const dispute = await this.prisma.dispute.findUnique({
      where: { id: disputeId },
      include: {
        application: {
          include: {
            job: {
              select: {
                id: true,
                title: true,
                recruiter: { select: { userId: true } },
              },
            },
            candidate: { select: { userId: true, fullName: true } },
          },
        },
      },
    });

    if (!dispute) {
      throw new NotFoundException('Khiếu nại không tồn tại.');
    }

    const updated = await this.prisma.$transaction(async (tx) => {
      const res = await tx.dispute.update({
        where: { id: disputeId },
        data: {
          status: dto.status,
          adminResolution: dto.adminResolution,
          resolvedByUserId: adminUserId,
          resolvedAt: new Date(),
        },
      });

      // Enforcement on Recruiter
      if (dto.enforcementAction === 'LOCK_RECRUITER') {
        const recruiterUserId = dispute.application.job.recruiter?.userId;
        if (recruiterUserId) {
          await tx.user.update({
            where: { id: recruiterUserId },
            data: { status: AccountStatus.LOCKED },
          });

          // P0: Immediately invalidate role cache so locked recruiter cannot perform any further actions
          invalidateUserRoleCache(recruiterUserId);

          await tx.jobPosting.updateMany({
            where: { recruiter: { userId: recruiterUserId }, status: JobStatus.PUBLISHED },
            data: { status: JobStatus.PAUSED },
          });
        }
      }

      return res;
    });

    // Notify Reporter (Candidate)
    try {
      await this.notificationsService.createNotification({
        recipientUserId: dispute.reportedByUserId,
        applicationId: dispute.applicationId,
        title: `Phán quyết khiếu nại (${dispute.disputeNumber})`,
        message: `Ban quản trị đã xử lý khiếu nại của bạn: "${dto.adminResolution.slice(0, 100)}..."`,
        payload: { disputeId: dispute.id, status: dto.status },
      });
    } catch (err) {
      this.logger.warn(`Failed to notify reporter: ${err}`);
    }

    return updated;
  }
}
