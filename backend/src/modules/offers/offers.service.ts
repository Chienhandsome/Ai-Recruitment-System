import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import {
  ApplicationStage,
  HrDecision,
  InterviewProcessStatus,
  InterviewRoundStatus,
  OfferStatus,
  Prisma,
} from '@prisma/client';
import { canTransitionApplication } from '../applications/application-stage-machine';
import { PrismaService } from '../../database/prisma.service';
import { ApplicationAccessService } from '../applications/application-access.service';
import { NotificationsService } from '../notifications/notifications.service';
import { CreateOfferDto } from './dto/create-offer.dto';
import { UpdateOfferDto } from './dto/update-offer.dto';
import { DeclineOfferDto } from './dto/decline-offer.dto';

@Injectable()
export class OffersService {
  private readonly logger = new Logger(OffersService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly accessService: ApplicationAccessService,
    private readonly notificationsService: NotificationsService,
  ) {}

  async createOffer(recruiterUserId: string, dto: CreateOfferDto) {
    const scope = await this.accessService.recruiterApplicationWhere(recruiterUserId);
    const application = await this.prisma.application.findFirst({
      where: { AND: [scope, { id: dto.applicationId }] },
      include: {
        job: { select: { id: true, title: true, recruiterId: true } },
        candidate: {
          select: {
            id: true,
            userId: true,
            user: { select: { fullName: true, email: true } },
          },
        },
      },
    });

    if (!application) {
      throw new NotFoundException('Hồ sơ ứng tuyển không tồn tại hoặc bạn không có quyền truy cập.');
    }

    if (
      application.currentStage !== ApplicationStage.OFFERED &&
      !canTransitionApplication(application.currentStage, ApplicationStage.OFFERED)
    ) {
      throw new BadRequestException(
        `Không thể phát hành Offer khi hồ sơ đang ở trạng thái ${application.currentStage}. Hồ sơ cần hoàn tất phỏng vấn (INTERVIEWED) hoặc đạt sơ loại (SHORTLISTED).`,
      );
    }

    const startDate = new Date(dto.startDate);
    const expiresAt = new Date(dto.expiresAt);

    if (isNaN(startDate.getTime()) || isNaN(expiresAt.getTime())) {
      throw new BadRequestException('Ngày bắt đầu làm việc hoặc hạn phản hồi không hợp lệ.');
    }

    if (expiresAt <= new Date()) {
      throw new BadRequestException('Hạn phản hồi Offer phải là một thời điểm trong tương lai.');
    }

    if (expiresAt >= startDate) {
      throw new BadRequestException(
        'Hạn phản hồi Offer phải diễn ra trước ngày bắt đầu làm việc (Start Date).',
      );
    }

    const offer = await this.prisma.$transaction(async (tx) => {
      // 1. Upsert offer record
      const savedOffer = await tx.offer.upsert({
        where: { applicationId: application.id },
        create: {
          applicationId: application.id,
          status: OfferStatus.PENDING,
          salary: new Prisma.Decimal(dto.salary),
          salaryPeriod: dto.salaryPeriod || 'MONTHLY',
          currency: dto.currency || 'VND',
          startDate,
          expiresAt,
          workType: dto.workType || 'HYBRID',
          workLocation: dto.workLocation || null,
          benefits: dto.benefits || null,
          notes: dto.notes || null,
          contactName: dto.contactName || null,
          contactEmail: dto.contactEmail || null,
          contactPhone: dto.contactPhone || null,
        },
        update: {
          status: OfferStatus.PENDING,
          salary: new Prisma.Decimal(dto.salary),
          salaryPeriod: dto.salaryPeriod || 'MONTHLY',
          currency: dto.currency || 'VND',
          startDate,
          expiresAt,
          workType: dto.workType || 'HYBRID',
          workLocation: dto.workLocation || null,
          benefits: dto.benefits || null,
          notes: dto.notes || null,
          contactName: dto.contactName || null,
          contactEmail: dto.contactEmail || null,
          contactPhone: dto.contactPhone || null,
          candidateResponseAt: null,
          declineReason: null,
          declineNote: null,
        },
      });

      // 2. Advance application stage to OFFERED if not already
      if (application.currentStage !== ApplicationStage.OFFERED) {
        await tx.application.update({
          where: { id: application.id },
          data: {
            currentStage: ApplicationStage.OFFERED,
            hrDecision: HrDecision.ACCEPTED,
          },
        });

        await tx.applicationStatusHistory.create({
          data: {
            applicationId: application.id,
            previousStage: application.currentStage,
            newStage: ApplicationStage.OFFERED,
            changedByUserId: recruiterUserId,
            note: 'Nhà tuyển dụng đã phát hành Thư mời nhận việc (Offer).',
          },
        });
      }

      return savedOffer;
    });

    // 3. Notify candidate
    if (application.candidate.userId) {
      try {
        await this.notificationsService.createNotification({
          recipientUserId: application.candidate.userId,
          applicationId: application.id,
          title: `Thư mời nhận việc: ${application.job.title}`,
          message: `Chúc mừng bạn! Nhà tuyển dụng đã gửi thư mời nhận việc (Offer). Hạn chót phản hồi: ${expiresAt.toLocaleDateString('vi-VN')}.`,
          payload: {
            offerId: offer.id,
            jobTitle: application.job.title,
            expiresAt: expiresAt.toISOString(),
          },
        });
      } catch (err) {
        this.logger.warn(`Failed to send notification to candidate: ${err}`);
      }
    }

    return offer;
  }

  async getOfferByApplication(userId: string, applicationId: string) {
    const candidateProfile = await this.prisma.candidateProfile.findUnique({
      where: { userId },
      select: { id: true },
    });

    let whereCondition: Prisma.ApplicationWhereInput;
    if (candidateProfile) {
      whereCondition = { id: applicationId, candidateId: candidateProfile.id };
    } else {
      const scope = await this.accessService.recruiterApplicationWhere(userId);
      whereCondition = { AND: [scope, { id: applicationId }] };
    }

    const application = await this.prisma.application.findFirst({
      where: whereCondition,
      include: {
        job: {
          select: {
            id: true,
            title: true,
            location: true,
            recruiter: {
              select: {
                company: { select: { name: true, logoUrl: true } },
              },
            },
          },
        },
        candidate: {
          select: {
            id: true,
            userId: true,
            user: { select: { fullName: true, email: true, phone: true } },
          },
        },
        offer: true,
      },
    });

    if (!application) {
      throw new NotFoundException('Hồ sơ ứng tuyển không tồn tại hoặc bạn không có quyền xem.');
    }

    if (
      application.offer &&
      application.offer.status === OfferStatus.PENDING &&
      new Date() > new Date(application.offer.expiresAt)
    ) {
      application.offer = await this.prisma.offer.update({
        where: { id: application.offer.id },
        data: { status: OfferStatus.EXPIRED },
      });
    }

    return {
      application: {
        id: application.id,
        currentStage: application.currentStage,
        job: {
          id: application.job.id,
          title: application.job.title,
          location: application.job.location,
          company: application.job.recruiter?.company ?? null,
        },
        candidate: application.candidate,
      },
      offer: application.offer,
    };
  }

  async updateOffer(recruiterUserId: string, offerId: string, dto: UpdateOfferDto) {
    const scope = await this.accessService.recruiterApplicationWhere(recruiterUserId);
    const offer = await this.prisma.offer.findUnique({
      where: { id: offerId },
      include: {
        application: {
          include: {
            job: { select: { title: true } },
            candidate: { select: { userId: true, user: { select: { fullName: true } } } },
          },
        },
      },
    });

    if (!offer || !offer.application) {
      throw new NotFoundException('Offer không tồn tại.');
    }

    const application = await this.prisma.application.findFirst({
      where: { AND: [scope, { id: offer.applicationId }] },
    });
    if (!application) {
      throw new ForbiddenException('Bạn không có quyền chỉnh sửa Offer của hồ sơ này.');
    }

    if (offer.status !== OfferStatus.PENDING) {
      throw new BadRequestException(
        `Không thể chỉnh sửa Offer đã ở trạng thái ${offer.status}.`,
      );
    }

    const data: Prisma.OfferUpdateInput = {};
    if (dto.salary !== undefined) data.salary = new Prisma.Decimal(dto.salary);
    if (dto.salaryPeriod !== undefined) data.salaryPeriod = dto.salaryPeriod;
    if (dto.currency !== undefined) data.currency = dto.currency;
    if (dto.startDate !== undefined) data.startDate = new Date(dto.startDate);
    if (dto.expiresAt !== undefined) data.expiresAt = new Date(dto.expiresAt);
    if (dto.workType !== undefined) data.workType = dto.workType;
    if (dto.workLocation !== undefined) data.workLocation = dto.workLocation;
    if (dto.benefits !== undefined) data.benefits = dto.benefits;
    if (dto.notes !== undefined) data.notes = dto.notes;
    if (dto.contactName !== undefined) data.contactName = dto.contactName;
    if (dto.contactEmail !== undefined) data.contactEmail = dto.contactEmail;
    if (dto.contactPhone !== undefined) data.contactPhone = dto.contactPhone;

    const updated = await this.prisma.offer.update({
      where: { id: offerId },
      data,
    });

    // Notify candidate of revised terms
    if (offer.application.candidate.userId) {
      try {
        await this.notificationsService.createNotification({
          recipientUserId: offer.application.candidate.userId,
          applicationId: offer.application.id,
          title: `Cập nhật thư mời nhận việc: ${offer.application.job.title}`,
          message: 'Nhà tuyển dụng đã cập nhật lại các điều khoản trong thư mời nhận việc (Offer). Vui lòng xem lại chi tiết.',
          payload: { offerId: updated.id },
        });
      } catch (err) {
        this.logger.warn(`Failed to notify candidate about offer update: ${err}`);
      }
    }

    return updated;
  }

  async acceptOffer(candidateUserId: string, offerId: string) {
    const offer = await this.prisma.offer.findUnique({
      where: { id: offerId },
      include: {
        application: {
          include: {
            candidate: { select: { userId: true, user: { select: { fullName: true } } } },
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

    if (!offer || offer.application.candidate.userId !== candidateUserId) {
      throw new NotFoundException('Offer không tồn tại hoặc bạn không có quyền thao tác.');
    }

    if (offer.status !== OfferStatus.PENDING) {
      throw new BadRequestException(`Offer đã ở trạng thái ${offer.status}, không thể chấp nhận lại.`);
    }

    if (new Date() > new Date(offer.expiresAt)) {
      throw new BadRequestException('Thư mời nhận việc đã hết hạn phản hồi. Vui lòng liên hệ trực tiếp nhà tuyển dụng.');
    }

    const updatedOffer = await this.prisma.$transaction(async (tx) => {
      const accepted = await tx.offer.update({
        where: { id: offerId },
        data: {
          status: OfferStatus.ACCEPTED,
          candidateResponseAt: new Date(),
        },
      });

      await tx.application.update({
        where: { id: offer.applicationId },
        data: {
          currentStage: ApplicationStage.HIRED,
          hrDecision: HrDecision.ACCEPTED,
        },
      });

      await tx.applicationStatusHistory.create({
        data: {
          applicationId: offer.applicationId,
          previousStage: ApplicationStage.OFFERED,
          newStage: ApplicationStage.HIRED,
          changedByUserId: candidateUserId,
          note: 'Ứng viên đã chính thức chấp thuận Thư mời nhận việc (Accept Offer).',
        },
      });

      await tx.interviewProcess.updateMany({
        where: {
          applicationId: offer.applicationId,
          status: { in: [InterviewProcessStatus.DRAFT, InterviewProcessStatus.ACTIVE] },
        },
        data: {
          status: InterviewProcessStatus.COMPLETED,
          currentRoundOrder: null,
          completedAt: new Date(),
        },
      });

      return accepted;
    });

    // Notify Recruiter
    try {
      const recruiterUserId = offer.application.job.recruiter?.userId;
      if (recruiterUserId) {
        await this.notificationsService.createNotification({
          recipientUserId: recruiterUserId,
          applicationId: offer.applicationId,
          title: `Ứng viên đã chấp nhận Offer: ${offer.application.job.title}`,
          message: `Tuyệt vời! Ứng viên ${offer.application.candidate.user?.fullName || 'Ứng viên'} đã đồng ý nhận việc. Hồ sơ đã chuyển sang giai đoạn ĐÃ TUYỂN DỤNG (HIRED).`,
          payload: { offerId: updatedOffer.id },
        });
      }
    } catch (err) {
      this.logger.warn(`Failed to notify recruiter about accepted offer: ${err}`);
    }

    return updatedOffer;
  }

  async declineOffer(candidateUserId: string, offerId: string, dto: DeclineOfferDto) {
    const offer = await this.prisma.offer.findUnique({
      where: { id: offerId },
      include: {
        application: {
          include: {
            candidate: { select: { userId: true, user: { select: { fullName: true } } } },
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

    if (!offer || offer.application.candidate.userId !== candidateUserId) {
      throw new NotFoundException('Offer không tồn tại hoặc bạn không có quyền thao tác.');
    }

    if (offer.status !== OfferStatus.PENDING) {
      throw new BadRequestException(`Offer đã ở trạng thái ${offer.status}, không thể từ chối lại.`);
    }

    const updatedOffer = await this.prisma.$transaction(async (tx) => {
      const declined = await tx.offer.update({
        where: { id: offerId },
        data: {
          status: OfferStatus.DECLINED,
          candidateResponseAt: new Date(),
          declineReason: dto.reason || 'NOT_SPECIFIED',
          declineNote: dto.note || null,
        },
      });

      await tx.application.update({
        where: { id: offer.applicationId },
        data: {
          currentStage: ApplicationStage.REJECTED,
          hrDecision: HrDecision.REJECTED,
          hrNotes: dto.reason ? `Ứng viên từ chối Offer: ${dto.reason}` : 'Ứng viên từ chối Offer',
        },
      });

      await tx.interviewProcess.updateMany({
        where: {
          applicationId: offer.applicationId,
          status: { in: [InterviewProcessStatus.DRAFT, InterviewProcessStatus.ACTIVE] },
        },
        data: {
          status: InterviewProcessStatus.CANCELLED,
          currentRoundOrder: null,
          completedAt: new Date(),
        },
      });

      await tx.interviewRound.updateMany({
        where: {
          process: { applicationId: offer.applicationId },
          status: {
            in: [
              InterviewRoundStatus.DRAFT,
              InterviewRoundStatus.READY,
              InterviewRoundStatus.SCHEDULED,
              InterviewRoundStatus.IN_PROGRESS,
              InterviewRoundStatus.AWAITING_REVIEW,
            ],
          },
        },
        data: { status: InterviewRoundStatus.CANCELLED },
      });

      await tx.applicationStatusHistory.create({
        data: {
          applicationId: offer.applicationId,
          previousStage: ApplicationStage.OFFERED,
          newStage: ApplicationStage.REJECTED,
          changedByUserId: candidateUserId,
          note: `Ứng viên từ chối Offer. Lý do: ${dto.reason || 'Không nêu'}. Ghi chú: ${dto.note || 'Không có'}`,
        },
      });

      return declined;
    });

    // Notify Recruiter
    try {
      const recruiterUserId = offer.application.job.recruiter?.userId;
      if (recruiterUserId) {
        await this.notificationsService.createNotification({
          recipientUserId: recruiterUserId,
          applicationId: offer.applicationId,
          title: `Ứng viên từ chối Offer: ${offer.application.job.title}`,
          message: `Ứng viên ${offer.application.candidate.user?.fullName || 'Ứng viên'} đã từ chối Thư mời nhận việc. Lý do: ${dto.reason || 'Không nêu'}.`,
          payload: { offerId: updatedOffer.id, reason: dto.reason },
        });
      }
    } catch (err) {
      this.logger.warn(`Failed to notify recruiter about declined offer: ${err}`);
    }

    return updatedOffer;
  }

  async revokeOffer(recruiterUserId: string, offerId: string, reason?: string) {
    const scope = await this.accessService.recruiterApplicationWhere(recruiterUserId);
    const offer = await this.prisma.offer.findUnique({
      where: { id: offerId },
      include: {
        application: {
          include: {
            job: { select: { title: true } },
            candidate: { select: { userId: true, user: { select: { fullName: true } } } },
          },
        },
      },
    });

    if (!offer || !offer.application) {
      throw new NotFoundException('Offer không tồn tại.');
    }

    const application = await this.prisma.application.findFirst({
      where: { AND: [scope, { id: offer.applicationId }] },
    });
    if (!application) {
      throw new ForbiddenException('Bạn không có quyền thu hồi Offer của hồ sơ này.');
    }

    if (offer.status !== OfferStatus.PENDING) {
      throw new BadRequestException(`Không thể thu hồi Offer đã ở trạng thái ${offer.status}.`);
    }

    const revokedOffer = await this.prisma.$transaction(async (tx) => {
      const updated = await tx.offer.update({
        where: { id: offerId },
        data: {
          status: OfferStatus.CANCELLED,
          declineReason: reason || 'RECRUITER_REVOKED',
        },
      });

      await tx.application.update({
        where: { id: offer.applicationId },
        data: {
          currentStage: ApplicationStage.INTERVIEWED,
          hrDecision: HrDecision.CONSIDER,
        },
      });

      await tx.applicationStatusHistory.create({
        data: {
          applicationId: offer.applicationId,
          previousStage: ApplicationStage.OFFERED,
          newStage: ApplicationStage.INTERVIEWED,
          changedByUserId: recruiterUserId,
          note: `Nhà tuyển dụng đã thu hồi Thư mời nhận việc (Offer). Lý do: ${reason || 'Không nêu'}`,
        },
      });

      return updated;
    });

    if (offer.application.candidate.userId) {
      try {
        await this.notificationsService.createNotification({
          recipientUserId: offer.application.candidate.userId,
          applicationId: offer.application.id,
          title: `Thu hồi thư mời nhận việc: ${offer.application.job.title}`,
          message: 'Nhà tuyển dụng đã thu hồi thư mời nhận việc cho vị trí này. Vui lòng liên hệ nhà tuyển dụng để biết thêm chi tiết.',
          payload: { offerId: revokedOffer.id },
        });
      } catch (err) {
        this.logger.warn(`Failed to notify candidate about offer revoke: ${err}`);
      }
    }

    return revokedOffer;
  }
}
