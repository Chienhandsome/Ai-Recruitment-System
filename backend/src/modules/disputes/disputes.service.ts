import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { AccountStatus, DisputeStatus, JobStatus, Prisma } from '@prisma/client';
import { randomUUID } from 'crypto';
import * as crypto from 'crypto';
import * as fs from 'fs';
import * as path from 'path';
import type { Response } from 'express';
import { PrismaService } from '../../database/prisma.service';
import { NotificationsService } from '../notifications/notifications.service';
import { CreateDisputeDto } from './dto/create-dispute.dto';
import { ResolveDisputeDto } from './dto/resolve-dispute.dto';
import { RespondDisputeDto } from './dto/respond-dispute.dto';
import { AcknowledgeDisputeDto } from './dto/acknowledge-dispute.dto';
import { CloseDisputeDto } from './dto/close-dispute.dto';
import { invalidateUserRoleCache } from '../auth/guards/roles.guard';

@Injectable()
export class DisputesService {
  private readonly logger = new Logger(DisputesService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly notificationsService: NotificationsService,
  ) { }

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
    const reporterName = isCandidate
      ? application.candidate.fullName
      : (application.job.recruiter?.user?.fullName || 'Nhà tuyển dụng');

    const initialTimeline = [
      {
        id: randomUUID(),
        senderId: userId,
        senderName: reporterName,
        senderRole: isCandidate ? 'CANDIDATE' : 'RECRUITER',
        type: 'INITIAL_CLAIM',
        message: dto.description,
        evidenceUrls: dto.evidenceUrls || [],
        createdAt: new Date().toISOString(),
      },
    ];

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
        timeline: initialTimeline as unknown as Prisma.InputJsonValue,
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

    // Notify the other party
    if (isCandidate && application.job.recruiter?.userId) {
      try {
        await this.notificationsService.createNotification({
          recipientUserId: application.job.recruiter.userId,
          applicationId: application.id,
          title: `Hồ sơ có khiếu nại mới (${disputeNumber})`,
          message: `Ứng viên ${application.candidate.fullName} đã gửi yêu cầu khiếu nại/tố cáo về vị trí ${application.job.title}. Ban quản trị đang tiếp nhận xử lý. Bạn có thể mở chi tiết để gửi văn bản giải trình.`,
          payload: { disputeId: dispute.id, disputeNumber },
        });
      } catch (err) {
        this.logger.warn(`Failed to notify recruiter about dispute: ${err}`);
      }
    } else if (isRecruiter && application.candidate?.userId) {
      try {
        await this.notificationsService.createNotification({
          recipientUserId: application.candidate.userId,
          applicationId: application.id,
          title: `Nhà tuyển dụng gửi báo cáo tranh chấp (${disputeNumber})`,
          message: `Nhà tuyển dụng vị trí ${application.job.title} đã gửi báo cáo khiếu nại. Ban quản trị đang tiếp nhận xử lý.`,
          payload: { disputeId: dispute.id, disputeNumber },
        });
      } catch (err) {
        this.logger.warn(`Failed to notify candidate about dispute: ${err}`);
      }
    }

    return dispute;
  }

  async getDisputeById(userId: string, disputeId: string) {
    const dispute = await this.prisma.dispute.findUnique({
      where: { id: disputeId },
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
                    user: { select: { id: true, fullName: true, email: true, status: true } },
                    company: { select: { id: true, name: true, logoUrl: true } },
                  },
                },
              },
            },
            candidate: {
              select: {
                id: true,
                userId: true,
                fullName: true,
                email: true,
                phone: true,
                reliabilityScore: true,
                strikeCount: true,
                suspendedUntil: true,
              },
            },
            offer: true,
            contract: {
              include: {
                histories: {
                  orderBy: { createdAt: 'desc' },
                  take: 30,
                },
                signingOtps: {
                  orderBy: { createdAt: 'desc' },
                  take: 10,
                },
              },
            },
          },
        },
      },
    });

    if (!dispute) {
      throw new NotFoundException('Khiếu nại không tồn tại.');
    }

    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { userRoles: { select: { role: { select: { code: true } } } } },
    });
    const isAdmin = user?.userRoles?.some((ur) => ur.role.code === 'ADMIN') ?? false;
    const isCandidate = dispute.application?.candidate?.userId === userId;
    const isRecruiter = dispute.application?.job?.recruiter?.userId === userId;
    const isReporter = dispute.reportedByUserId === userId;

    if (!isAdmin && !isCandidate && !isRecruiter && !isReporter) {
      throw new ForbiddenException('Bạn không có quyền xem thông tin khiếu nại này.');
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

    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { userRoles: { select: { role: { select: { code: true } } } } },
    });
    const isAdmin = user?.userRoles?.some((ur) => ur.role.code === 'ADMIN') ?? false;
    const isCandidate = application.candidate.userId === userId;
    const isRecruiter = application.job.recruiter?.userId === userId;

    if (!isAdmin && !isCandidate && !isRecruiter) {
      throw new ForbiddenException('Bạn không có quyền xem khiếu nại của hồ sơ này.');
    }

    return this.prisma.dispute.findMany({
      where: { applicationId },
      include: {
        reportedByUser: { select: { id: true, fullName: true, email: true } },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async respondDispute(userId: string, disputeId: string, dto: RespondDisputeDto) {
    const dispute = await this.prisma.dispute.findUnique({
      where: { id: disputeId },
      include: {
        application: {
          include: {
            job: {
              select: {
                id: true,
                title: true,
                recruiter: {
                  select: {
                    userId: true,
                    user: { select: { fullName: true } },
                  },
                },
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

    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        fullName: true,
        userRoles: { select: { role: { select: { code: true } } } },
      },
    });
    if (!user) {
      throw new NotFoundException('Người dùng không tồn tại.');
    }

    const isAdmin = user.userRoles?.some((ur) => ur.role.code === 'ADMIN') ?? false;
    const isCandidate = dispute.application?.candidate?.userId === userId;
    const isRecruiter = dispute.application?.job?.recruiter?.userId === userId;

    if (!isAdmin && !isCandidate && !isRecruiter) {
      throw new ForbiddenException('Bạn không có quyền phản hồi khiếu nại này.');
    }

    const senderRole = isAdmin ? 'ADMIN' : (isCandidate ? 'CANDIDATE' : 'RECRUITER');
    const senderName = user.fullName || (isAdmin ? 'Ban Quản Trị Hệ Thống' : (isCandidate ? 'Ứng viên' : 'Nhà tuyển dụng'));
    const entryType = dto.isAppeal ? 'APPEAL' : (isAdmin ? 'ADMIN_NOTE' : (isRecruiter ? 'EXPLANATION' : 'MESSAGE'));


    const existingTimeline = Array.isArray(dispute.timeline) ? (dispute.timeline as any[]) : [];
    const newEntry = {
      id: randomUUID(),
      senderId: userId,
      senderName,
      senderRole,
      type: entryType,
      message: dto.message,
      evidenceUrls: dto.evidenceUrls || [],
      createdAt: new Date().toISOString(),
      isAppeal: !!dto.isAppeal,
    };
    const updatedTimeline = [...existingTimeline, newEntry];

    // If appealing, reset status back to INVESTIGATING so Admin can re-review
    const statusUpdate = dto.isAppeal ? DisputeStatus.INVESTIGATING : undefined;

    const updated = await this.prisma.dispute.update({
      where: { id: disputeId },
      data: {
        timeline: updatedTimeline as unknown as Prisma.InputJsonValue,
        ...(statusUpdate ? { status: statusUpdate } : {}),
      },
    });

    // Send notifications to involved parties
    const candidateUserId = dispute.application?.candidate?.userId;
    const recruiterUserId = dispute.application?.job?.recruiter?.userId;

    if (isCandidate) {
      if (recruiterUserId) {
        try {
          await this.notificationsService.createNotification({
            recipientUserId: recruiterUserId,
            applicationId: dispute.applicationId,
            title: dto.isAppeal ? `Kháng nghị từ ứng viên (${dispute.disputeNumber})` : `Phản hồi mới từ ứng viên (${dispute.disputeNumber})`,
            message: `Ứng viên ${senderName} đã gửi ${dto.isAppeal ? 'đơn kháng nghị' : 'nội dung phản hồi'}: "${dto.message.slice(0, 80)}..."`,
            payload: { disputeId: dispute.id, disputeNumber: dispute.disputeNumber },
          });
        } catch (err) {
          this.logger.warn(`Failed to notify recruiter: ${err}`);
        }
      }
    } else if (isRecruiter) {
      if (candidateUserId) {
        try {
          await this.notificationsService.createNotification({
            recipientUserId: candidateUserId,
            applicationId: dispute.applicationId,
            title: `Giải trình từ Nhà tuyển dụng (${dispute.disputeNumber})`,
            message: `Nhà tuyển dụng đã gửi văn bản giải trình / ý kiến: "${dto.message.slice(0, 80)}..."`,
            payload: { disputeId: dispute.id, disputeNumber: dispute.disputeNumber },
          });
        } catch (err) {
          this.logger.warn(`Failed to notify candidate: ${err}`);
        }
      }
    } else if (isAdmin) {
      // Admin notifies both
      if (candidateUserId) {
        try {
          await this.notificationsService.createNotification({
            recipientUserId: candidateUserId,
            applicationId: dispute.applicationId,
            title: `Thông báo từ Ban Quản Trị (${dispute.disputeNumber})`,
            message: `Ban quản trị đã phản hồi yêu cầu khiếu nại: "${dto.message.slice(0, 80)}..."`,
            payload: { disputeId: dispute.id, disputeNumber: dispute.disputeNumber },
          });
        } catch (err) {
          this.logger.warn(`Failed to notify candidate: ${err}`);
        }
      }
      if (recruiterUserId) {
        try {
          await this.notificationsService.createNotification({
            recipientUserId: recruiterUserId,
            applicationId: dispute.applicationId,
            title: `Thông báo từ Ban Quản Trị (${dispute.disputeNumber})`,
            message: `Ban quản trị đã phản hồi vụ việc khiếu nại: "${dto.message.slice(0, 80)}..."`,
            payload: { disputeId: dispute.id, disputeNumber: dispute.disputeNumber },
          });
        } catch (err) {
          this.logger.warn(`Failed to notify recruiter: ${err}`);
        }
      }
    }

    return updated;
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
            candidate: {
              select: {
                id: true,
                userId: true,
                fullName: true,
                email: true,
                reliabilityScore: true,
                strikeCount: true,
                suspendedUntil: true,
              },
            },
            offer: true,
            contract: {
              include: {
                histories: {
                  orderBy: { createdAt: 'desc' },
                  take: 30,
                },
                signingOtps: {
                  orderBy: { createdAt: 'desc' },
                  take: 10,
                },
              },
            },
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
            candidate: {
              select: {
                id: true,
                userId: true,
                fullName: true,
                reliabilityScore: true,
                strikeCount: true,
              },
            },
          },
        },
      },
    });

    if (!dispute) {
      throw new NotFoundException('Khiếu nại không tồn tại.');
    }

    const admin = await this.prisma.user.findUnique({
      where: { id: adminUserId },
      select: { fullName: true },
    });

    const resolutionEntry = {
      id: randomUUID(),
      senderId: adminUserId,
      senderName: admin?.fullName || 'Ban Quản Trị Hệ Thống',
      senderRole: 'ADMIN',
      type: 'ADMIN_RESOLUTION',
      message: dto.adminResolution,
      evidenceUrls: [],
      createdAt: new Date().toISOString(),
      meta: {
        status: dto.status,
        enforcementAction: dto.enforcementAction || 'NONE',
        penaltyNotes: dto.penaltyNotes,
        penaltyAmount: dto.penaltyAmount,
        compensationAmount: dto.compensationAmount,
        candidateEnforcementAction: dto.candidateEnforcementAction || 'NONE',
        candidatePenaltyNotes: dto.candidatePenaltyNotes,
        candidateReliabilityDeduction: dto.candidateReliabilityDeduction,
        candidateSuspensionDays: dto.candidateSuspensionDays,
      },
    };

    const existingTimeline = Array.isArray(dispute.timeline) ? (dispute.timeline as any[]) : [];
    const updatedTimeline = [...existingTimeline, resolutionEntry];

    const updated = await this.prisma.$transaction(async (tx) => {
      const res = await tx.dispute.update({
        where: { id: disputeId },
        data: {
          status: dto.status,
          adminResolution: dto.adminResolution,
          resolvedByUserId: adminUserId,
          resolvedAt: new Date(),
          penaltyAction: dto.enforcementAction || 'NONE',
          penaltyNotes: dto.penaltyNotes || null,
          penaltyAmount: dto.penaltyAmount !== undefined && dto.penaltyAmount !== null ? new Prisma.Decimal(dto.penaltyAmount) : undefined,
          compensationAmount: dto.compensationAmount !== undefined && dto.compensationAmount !== null ? new Prisma.Decimal(dto.compensationAmount) : undefined,
          candidatePenaltyAction: dto.candidateEnforcementAction || 'NONE',
          candidatePenaltyNotes: dto.candidatePenaltyNotes || null,
          candidateReliabilityDeduction: dto.candidateReliabilityDeduction ?? null,
          candidateSuspensionDays: dto.candidateSuspensionDays ?? null,
          timeline: updatedTimeline as unknown as Prisma.InputJsonValue,
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

          // Immediately invalidate role cache so locked recruiter cannot perform any further actions
          invalidateUserRoleCache(recruiterUserId);

          await tx.jobPosting.updateMany({
            where: { recruiter: { userId: recruiterUserId }, status: JobStatus.PUBLISHED },
            data: { status: JobStatus.PAUSED },
          });
        }
      }

      // Enforcement on Candidate
      const candidateProfile = dispute.application?.candidate;
      const candidateUserId = candidateProfile?.userId;

      if (candidateProfile && dto.candidateEnforcementAction && dto.candidateEnforcementAction !== 'NONE') {
        const action = dto.candidateEnforcementAction;

        if (action === 'WARN') {
          await tx.candidateProfile.update({
            where: { id: candidateProfile.id },
            data: { strikeCount: { increment: 1 } },
          });
        } else if (action === 'DEDUCT_RELIABILITY') {
          const deductPoints = Math.max(1, dto.candidateReliabilityDeduction || 15);
          const currentScore = candidateProfile.reliabilityScore ?? 100;
          const newScore = Math.max(0, currentScore - deductPoints);

          await tx.candidateProfile.update({
            where: { id: candidateProfile.id },
            data: {
              reliabilityScore: newScore,
              strikeCount: { increment: 1 },
            },
          });
        } else if (action === 'SUSPEND_APPLY') {
          const days = Math.max(1, dto.candidateSuspensionDays || 14);
          const suspendUntil = new Date(Date.now() + days * 24 * 60 * 60 * 1000);
          const deductPoints = Math.max(1, dto.candidateReliabilityDeduction || 25);
          const currentScore = candidateProfile.reliabilityScore ?? 100;
          const newScore = Math.max(0, currentScore - deductPoints);

          await tx.candidateProfile.update({
            where: { id: candidateProfile.id },
            data: {
              suspendedUntil: suspendUntil,
              reliabilityScore: newScore,
              strikeCount: { increment: 1 },
              isTalentPoolBanned: true,
            },
          });
        } else if (action === 'LOCK_CANDIDATE') {
          if (candidateUserId) {
            await tx.user.update({
              where: { id: candidateUserId },
              data: { status: AccountStatus.LOCKED },
            });
            invalidateUserRoleCache(candidateUserId);
          }
          await tx.candidateProfile.update({
            where: { id: candidateProfile.id },
            data: {
              reliabilityScore: 0,
              strikeCount: { increment: 2 },
              isTalentPoolBanned: true,
            },
          });
        }
      }

      return res;
    });

    // Notify Reporter
    try {
      await this.notificationsService.createNotification({
        recipientUserId: dispute.reportedByUserId,
        applicationId: dispute.applicationId,
        title: `Phán quyết khiếu nại (${dispute.disputeNumber})`,
        message: `Ban quản trị đã ban hành phán quyết chính thức: "${dto.adminResolution.slice(0, 100)}...". Vui lòng mở chi tiết để xem toàn văn kết luận.`,
        payload: { disputeId: dispute.id, status: dto.status, disputeNumber: dispute.disputeNumber },
      });
    } catch (err) {
      this.logger.warn(`Failed to notify reporter: ${err}`);
    }

    // Notify Candidate if candidate wasn't the sole reporter (or if candidate was sanctioned)
    const candidateUserId = dispute.application?.candidate?.userId;
    if (candidateUserId && candidateUserId !== dispute.reportedByUserId) {
      const candidateAction = dto.candidateEnforcementAction;
      let candidatePenaltyMsg = '';
      if (candidateAction === 'LOCK_CANDIDATE') {
        candidatePenaltyMsg = ' [CHẾ TÀI: Tài khoản ứng viên của bạn đã bị khóa do vi phạm quy chế].';
      } else if (candidateAction === 'SUSPEND_APPLY') {
        candidatePenaltyMsg = ` [CHẾ TÀI: Tạm dừng quyền nộp đơn ${dto.candidateSuspensionDays || 14} ngày & trừ điểm tin cậy].`;
      } else if (candidateAction === 'DEDUCT_RELIABILITY') {
        candidatePenaltyMsg = ` [CHẾ TÀI: Trừ ${dto.candidateReliabilityDeduction || 15} điểm Tin cậy].`;
      } else if (candidateAction === 'WARN') {
        candidatePenaltyMsg = ' [CHẾ TÀI: Ban quản trị gửi cảnh cáo và ghi nhận vi phạm].';
      }

      try {
        await this.notificationsService.createNotification({
          recipientUserId: candidateUserId,
          applicationId: dispute.applicationId,
          title: `Kết luận xử lý khiếu nại (${dispute.disputeNumber})`,
          message: `Ban quản trị đã ban hành phán quyết: "${dto.adminResolution.slice(0, 100)}..."${candidatePenaltyMsg} Mở chi tiết để xem toàn bộ nội dung.`,
          payload: { disputeId: dispute.id, status: dto.status, disputeNumber: dispute.disputeNumber },
        });
      } catch (err) {
        this.logger.warn(`Failed to notify candidate: ${err}`);
      }
    }

    // Also Notify Recruiter if reported by Candidate
    const recruiterUserId = dispute.application.job.recruiter?.userId;
    if (recruiterUserId && recruiterUserId !== dispute.reportedByUserId) {
      try {
        await this.notificationsService.createNotification({
          recipientUserId: recruiterUserId,
          applicationId: dispute.applicationId,
          title: `Kết luận xử lý khiếu nại (${dispute.disputeNumber})`,
          message: `Ban quản trị đã ban hành kết luận xử lý khiếu nại liên quan đến hồ sơ ứng tuyển: "${dto.adminResolution.slice(0, 100)}...". Mở chi tiết để xem toàn bộ nội dung và biện pháp chế tài.`,
          payload: { disputeId: dispute.id, status: dto.status, disputeNumber: dispute.disputeNumber },
        });
      } catch (err) {
        this.logger.warn(`Failed to notify recruiter: ${err}`);
      }
    }

    return updated;
  }

  /**
   * Upload immutable evidence files for disputes and warranty claims
   */
  async uploadEvidenceFiles(userId: string, files: Express.Multer.File[]) {
    if (!files || files.length === 0) {
      throw new BadRequestException('Vui lòng chọn ít nhất một file ảnh hoặc tài liệu bằng chứng.');
    }

    const uploadDir = fs.existsSync(path.resolve(process.cwd(), 'backend', 'uploads'))
      ? path.resolve(process.cwd(), 'backend', 'uploads', 'evidence')
      : path.resolve(process.cwd(), 'uploads', 'evidence');

    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }

    const results = files.map((file) => {
      const safeOriginalName = (file.originalname || 'file').replace(/[^a-zA-Z0-9._-]/g, '_');
      const sha256Hash = crypto.createHash('sha256').update(file.buffer).digest('hex');
      const savedFileName = `${Date.now()}_${sha256Hash.slice(0, 10)}_${safeOriginalName}`;
      const targetPath = path.join(uploadDir, savedFileName);

      fs.writeFileSync(targetPath, file.buffer);

      const url = `/api/disputes/evidence-file/${savedFileName}`;
      const isImage = file.mimetype.startsWith('image/');
      const dataUrl = isImage && file.buffer.length <= 4 * 1024 * 1024
        ? `data:${file.mimetype};base64,${file.buffer.toString('base64')}`
        : undefined;

      return {
        fileName: file.originalname,
        savedFileName,
        mimeType: file.mimetype,
        size: file.size,
        sha256Hash,
        url,
        dataUrl,
      };
    });

    this.logger.log(`[Evidence Upload] Stored ${results.length} tamper-proof evidence file(s) for user ${userId}`);
    return results;
  }

  /**
   * Serve raw immutable evidence file with appropriate Content-Type and cache headers
   */
  streamEvidenceFile(fileName: string, res: Response) {
    const safeName = path.basename(fileName);
    const candidateDirs = [
      path.resolve(process.cwd(), 'uploads', 'evidence'),
      path.resolve(process.cwd(), 'backend', 'uploads', 'evidence'),
      path.resolve(__dirname, '..', '..', '..', 'uploads', 'evidence'),
      path.resolve(__dirname, '..', '..', '..', 'backend', 'uploads', 'evidence'),
    ];

    let filePath: string | null = null;
    for (const dir of candidateDirs) {
      const candidatePath = path.join(dir, safeName);
      if (fs.existsSync(candidatePath)) {
        filePath = candidatePath;
        break;
      }
    }

    if (!filePath) {
      throw new NotFoundException('Tệp bằng chứng không tồn tại hoặc đã bị gỡ bỏ.');
    }

    const ext = path.extname(safeName).toLowerCase();
    const mimeTypes: Record<string, string> = {
      '.png': 'image/png',
      '.jpg': 'image/jpeg',
      '.jpeg': 'image/jpeg',
      '.webp': 'image/webp',
      '.pdf': 'application/pdf',
      '.doc': 'application/msword',
      '.docx': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      '.txt': 'text/plain',
    };

    const contentType = mimeTypes[ext] || 'application/octet-stream';
    res.setHeader('Content-Type', contentType);
    res.setHeader('Cache-Control', 'public, max-age=31536000, immutable');
    const stream = fs.createReadStream(filePath);
    return stream.pipe(res);
  }

  /**
   * Candidate or Recruiter formally acknowledges and accepts the Admin verdict
   */
  async acknowledgeDispute(userId: string, disputeId: string, dto: AcknowledgeDisputeDto) {
    const dispute = await this.prisma.dispute.findUnique({
      where: { id: disputeId },
      include: {
        application: {
          include: {
            job: {
              select: {
                id: true,
                title: true,
                recruiter: {
                  select: {
                    userId: true,
                    user: { select: { fullName: true } },
                  },
                },
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

    if (dispute.status !== DisputeStatus.RESOLVED && dispute.status !== DisputeStatus.DISMISSED) {
      throw new BadRequestException('Chỉ có thể xác nhận khi Ban Quản Trị đã ban hành kết luận giải quyết hoặc bác bỏ khiếu nại.');
    }

    const isCandidate = dispute.application?.candidate?.userId === userId;
    const isRecruiter = dispute.application?.job?.recruiter?.userId === userId;

    if (!isCandidate && !isRecruiter) {
      throw new ForbiddenException('Bạn không phải là bên liên quan để xác nhận phán quyết này.');
    }

    const now = new Date();
    const existingTimeline = Array.isArray(dispute.timeline) ? (dispute.timeline as any[]) : [];
    const updatedData: Record<string, any> = {};
    let ackMessage = '';
    let actorRole = '';
    let actorName = '';

    if (isCandidate) {
      if (dispute.candidateAcknowledgedAt) {
        throw new BadRequestException('Bạn đã xác nhận đồng thuận với phán quyết này trước đó.');
      }
      actorRole = 'CANDIDATE';
      actorName = dispute.application.candidate.fullName || 'Ứng viên';
      ackMessage = dto.note
        ? `Ứng viên ${actorName} đã xác nhận đồng thuận với phán quyết. Ghi chú cam kết: "${dto.note}"`
        : `Ứng viên ${actorName} đã chính thức xác nhận đồng thuận và cam kết tuân thủ phán quyết của Ban Quản Trị.`;

      updatedData.candidateAcknowledgedAt = now;
      updatedData.candidateAcknowledgeNote = dto.note || 'Đã xác nhận đồng thuận với phán quyết của BQT.';
    } else if (isRecruiter) {
      if (dispute.recruiterAcknowledgedAt) {
        throw new BadRequestException('Doanh nghiệp đã xác nhận chấp hành phán quyết này trước đó.');
      }
      actorRole = 'RECRUITER';
      actorName = dispute.application.job.recruiter?.user?.fullName || 'Nhà tuyển dụng';
      ackMessage = dto.note
        ? `Nhà tuyển dụng (${actorName}) đã xác nhận chấp hành phán quyết. Ghi chú cam kết: "${dto.note}"`
        : `Nhà tuyển dụng (${actorName}) đã chính thức xác nhận chấp hành toàn bộ kết luận và chế tài của Ban Quản Trị.`;

      updatedData.recruiterAcknowledgedAt = now;
      updatedData.recruiterAcknowledgeNote = dto.note || 'Đã xác nhận chấp hành phán quyết và chế tài của BQT.';
    }

    const ackTimelineEntry = {
      id: randomUUID(),
      senderId: userId,
      senderName: actorName,
      senderRole: actorRole,
      type: 'ACKNOWLEDGEMENT',
      message: ackMessage,
      evidenceUrls: [],
      createdAt: now.toISOString(),
    };

    const newTimeline = [...existingTimeline, ackTimelineEntry];

    // Check if BOTH parties have now acknowledged!
    const willBothAcknowledge =
      (isCandidate && !!dispute.recruiterAcknowledgedAt) ||
      (isRecruiter && !!dispute.candidateAcknowledgedAt);

    if (willBothAcknowledge) {
      updatedData.status = DisputeStatus.CLOSED;
      updatedData.closedAt = now;

      const autoClosureEntry = {
        id: randomUUID(),
        senderId: 'SYSTEM',
        senderName: 'Hệ Thống Trọng Tài Tự Động',
        senderRole: 'ADMIN',
        type: 'SYSTEM_CLOSURE',
        message: 'Cả hai bên (Ứng viên & Nhà tuyển dụng) đã hoàn tất xác nhận đồng thuận với phán quyết. Vụ việc chính thức được đóng hồ sơ và lưu trữ vĩnh viễn.',
        evidenceUrls: [],
        createdAt: new Date(now.getTime() + 1000).toISOString(),
      };
      newTimeline.push(autoClosureEntry);
    }

    updatedData.timeline = newTimeline as unknown as Prisma.InputJsonValue;

    const result = await this.prisma.dispute.update({
      where: { id: disputeId },
      data: updatedData,
      include: {
        application: {
          include: {
            job: { select: { title: true } },
            candidate: { select: { fullName: true } },
          },
        },
      },
    });

    // Notify the other party
    const candidateUserId = dispute.application.candidate?.userId;
    const recruiterUserId = dispute.application.job.recruiter?.userId;

    if (isCandidate && recruiterUserId) {
      try {
        await this.notificationsService.createNotification({
          recipientUserId: recruiterUserId,
          applicationId: dispute.applicationId,
          title: willBothAcknowledge
            ? `Vụ việc ${dispute.disputeNumber} đã hoàn tất và đóng hồ sơ`
            : `Ứng viên đã xác nhận phán quyết (${dispute.disputeNumber})`,
          message: willBothAcknowledge
            ? `Cả hai bên đã hoàn tất xác nhận phán quyết khiếu nại. Vụ việc chính thức đóng hồ sơ.`
            : `Ứng viên ${actorName} đã xác nhận đồng thuận với phán quyết khiếu nại của Ban Quản Trị.`,
          payload: { disputeId: dispute.id, disputeNumber: dispute.disputeNumber },
        });
      } catch (err) {
        this.logger.warn(`Failed to notify recruiter on dispute ack: ${err}`);
      }
    } else if (isRecruiter && candidateUserId) {
      try {
        await this.notificationsService.createNotification({
          recipientUserId: candidateUserId,
          applicationId: dispute.applicationId,
          title: willBothAcknowledge
            ? `Vụ việc ${dispute.disputeNumber} đã hoàn tất và đóng hồ sơ`
            : `Nhà tuyển dụng đã xác nhận phán quyết (${dispute.disputeNumber})`,
          message: willBothAcknowledge
            ? `Cả hai bên đã hoàn tất xác nhận phán quyết khiếu nại. Vụ việc chính thức đóng hồ sơ.`
            : `Nhà tuyển dụng đã xác nhận chấp hành phán quyết khiếu nại của Ban Quản Trị.`,
          payload: { disputeId: dispute.id, disputeNumber: dispute.disputeNumber },
        });
      } catch (err) {
        this.logger.warn(`Failed to notify candidate on dispute ack: ${err}`);
      }
    }

    return result;
  }

  /**
   * Admin formally closes and archives the dispute case
   */
  async closeDispute(adminUserId: string, disputeId: string, dto: CloseDisputeDto) {
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

    if (dispute.status === DisputeStatus.CLOSED) {
      throw new BadRequestException('Hồ sơ khiếu nại này đã được đóng trước đó.');
    }

    const admin = await this.prisma.user.findUnique({
      where: { id: adminUserId },
      select: { fullName: true },
    });

    const now = new Date();
    const existingTimeline = Array.isArray(dispute.timeline) ? (dispute.timeline as any[]) : [];
    const closeEntry = {
      id: randomUUID(),
      senderId: adminUserId,
      senderName: admin?.fullName || 'Ban Quản Trị Hệ Thống',
      senderRole: 'ADMIN',
      type: 'ADMIN_CLOSURE',
      message: dto.closeReason
        ? `Ban Quản Trị đã chính thức đóng và lưu trữ hồ sơ tranh chấp. Ghi chú đóng: "${dto.closeReason}"`
        : 'Ban Quản Trị đã chính thức đóng và lưu trữ hồ sơ tranh chấp.',
      evidenceUrls: [],
      createdAt: now.toISOString(),
    };

    const updatedTimeline = [...existingTimeline, closeEntry];

    const result = await this.prisma.dispute.update({
      where: { id: disputeId },
      data: {
        status: DisputeStatus.CLOSED,
        closedAt: now,
        closedByUserId: adminUserId,
        timeline: updatedTimeline as unknown as Prisma.InputJsonValue,
      },
      include: {
        application: {
          include: {
            job: { select: { title: true } },
            candidate: { select: { fullName: true } },
          },
        },
      },
    });

    // Notify both candidate and recruiter
    const candidateUserId = dispute.application?.candidate?.userId;
    const recruiterUserId = dispute.application?.job?.recruiter?.userId;

    if (candidateUserId) {
      try {
        await this.notificationsService.createNotification({
          recipientUserId: candidateUserId,
          applicationId: dispute.applicationId,
          title: `Hồ sơ khiếu nại đã chính thức đóng (${dispute.disputeNumber})`,
          message: `Ban Quản Trị đã chính thức đóng và lưu trữ hồ sơ tranh chấp vị trí ${dispute.application.job.title}.`,
          payload: { disputeId: dispute.id, disputeNumber: dispute.disputeNumber },
        });
      } catch (err) {
        this.logger.warn(`Failed to notify candidate on close: ${err}`);
      }
    }

    if (recruiterUserId) {
      try {
        await this.notificationsService.createNotification({
          recipientUserId: recruiterUserId,
          applicationId: dispute.applicationId,
          title: `Hồ sơ khiếu nại đã chính thức đóng (${dispute.disputeNumber})`,
          message: `Ban Quản Trị đã chính thức đóng và lưu trữ hồ sơ tranh chấp vị trí ${dispute.application.job.title}.`,
          payload: { disputeId: dispute.id, disputeNumber: dispute.disputeNumber },
        });
      } catch (err) {
        this.logger.warn(`Failed to notify recruiter on close: ${err}`);
      }
    }

    return result;
  }
}

