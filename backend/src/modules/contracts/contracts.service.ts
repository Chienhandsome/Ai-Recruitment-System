import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import {
  ContractSigningMethod,
  ContractStatus,
  ContractType,
  Prisma,
} from '@prisma/client';
import { PrismaService } from '../../database/prisma.service';
import { ApplicationAccessService } from '../applications/application-access.service';
import { NotificationsService } from '../notifications/notifications.service';
import { CreateContractDto } from './dto/create-contract.dto';
import { UpdateContractDto } from './dto/update-contract.dto';
import { CandidateFeedbackDto } from './dto/candidate-feedback.dto';
import { ESignContractDto, UploadSignedContractDto } from './dto/sign-contract.dto';

@Injectable()
export class ContractsService {
  private readonly logger = new Logger(ContractsService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly accessService: ApplicationAccessService,
    private readonly notificationsService: NotificationsService,
  ) {}

  /**
   * Helper: Generate unique human-readable contract number
   */
  private generateContractNumber(): string {
    const dateStr = new Date().toISOString().slice(0, 10).replace(/-/g, '');
    const randomSuffix = Math.floor(1000 + Math.random() * 9000);
    return `HDLD-${dateStr}-${randomSuffix}`;
  }

  /**
   * Helper: verify user has access to contract
   */
  private async findContractWithAccess(userId: string, contractId: string) {
    const contract = await this.prisma.contract.findUnique({
      where: { id: contractId },
      include: {
        application: {
          include: {
            job: {
              select: {
                id: true,
                title: true,
                recruiterId: true,
                recruiter: {
                  select: {
                    userId: true,
                    user: { select: { fullName: true, email: true } },
                    company: { select: { id: true, name: true, logoUrl: true, address: true } },
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
                address: true,
                user: { select: { fullName: true, email: true } },
              },
            },
          },
        },
        offer: true,
        histories: {
          orderBy: { createdAt: 'desc' },
          take: 20,
        },
      },
    });

    if (!contract) {
      throw new NotFoundException('Hợp đồng không tồn tại.');
    }

    const isRecruiter = contract.application.job.recruiter?.userId === userId;
    const isCandidate = contract.application.candidate.userId === userId;

    if (!isRecruiter && !isCandidate) {
      throw new ForbiddenException('Bạn không có quyền truy cập hợp đồng này.');
    }

    return { contract, isRecruiter, isCandidate };
  }

  /**
   * 1. Create contract draft from application & offer
   */
  async createContract(recruiterUserId: string, dto: CreateContractDto) {
    const scope = await this.accessService.recruiterApplicationWhere(recruiterUserId);
    const application = await this.prisma.application.findFirst({
      where: { AND: [scope, { id: dto.applicationId }] },
      include: {
        job: { select: { id: true, title: true, recruiterId: true } },
        offer: true,
        candidate: {
          select: {
            id: true,
            userId: true,
            fullName: true,
            email: true,
            phone: true,
            address: true,
          },
        },
      },
    });

    if (!application) {
      throw new NotFoundException('Hồ sơ ứng tuyển không tồn tại hoặc bạn không có quyền truy cập.');
    }

    // Existing contract check
    const existing = await this.prisma.contract.findUnique({
      where: { applicationId: application.id },
    });
    if (existing) {
      return this.getContractById(recruiterUserId, existing.id);
    }

    const offer = application.offer;
    const jobTitle = dto.jobTitle || application.job.title;
    const salary = dto.salary !== undefined
      ? new Prisma.Decimal(dto.salary)
      : (offer ? offer.salary : new Prisma.Decimal(0));
    const salaryPeriod = dto.salaryPeriod || offer?.salaryPeriod || 'MONTHLY';
    const currency = dto.currency || offer?.currency || 'VND';
    const startDate = dto.startDate ? new Date(dto.startDate) : (offer ? offer.startDate : new Date());
    const endDate = dto.endDate ? new Date(dto.endDate) : null;
    const workType = dto.workType || offer?.workType || 'HYBRID';
    const workLocation = dto.workLocation || offer?.workLocation || null;
    const benefits = dto.benefits || offer?.benefits || null;
    const contractNumber = this.generateContractNumber();

    const created = await this.prisma.$transaction(async (tx) => {
      const contract = await tx.contract.create({
        data: {
          contractNumber,
          applicationId: application.id,
          offerId: offer?.id || dto.offerId || null,
          status: ContractStatus.DRAFT,
          contractType: dto.contractType || ContractType.FIXED_TERM,
          signingMethod: dto.signingMethod || ContractSigningMethod.MANUAL,
          jobTitle,
          salary,
          salaryPeriod,
          currency,
          startDate,
          endDate,
          workType,
          workLocation,
          workingHours: dto.workingHours || 'Thứ 2 - Thứ 6 (8h30 - 17h30)',
          probationPeriodMonths: dto.probationPeriodMonths ?? (dto.contractType === ContractType.PROBATION ? 2 : 2),
          probationSalaryRate: dto.probationSalaryRate ?? 85,
          benefits,
          customTerms: dto.customTerms || null,
        },
        include: {
          application: {
            include: {
              job: {
                select: {
                  title: true,
                  recruiter: { select: { company: true } },
                },
              },
              candidate: true,
            },
          },
          offer: true,
          histories: true,
        },
      });

      await tx.contractHistory.create({
        data: {
          contractId: contract.id,
          action: 'CREATED',
          performedByUserId: recruiterUserId,
          note: 'Nhà tuyển dụng đã tạo bản nháp hợp đồng.',
          snapshot: {
            contractNumber,
            jobTitle,
            salary: String(salary),
            startDate,
          },
        },
      });

      return contract;
    });

    return created;
  }

  /**
   * 2. Get contract by application ID
   */
  async getContractByApplication(userId: string, applicationId: string) {
    const contract = await this.prisma.contract.findUnique({
      where: { applicationId },
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
                    user: { select: { fullName: true, email: true } },
                    company: { select: { id: true, name: true, logoUrl: true, address: true } },
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
                address: true,
                user: { select: { fullName: true, email: true } },
              },
            },
          },
        },
        offer: true,
        histories: {
          orderBy: { createdAt: 'desc' },
          take: 20,
        },
      },
    });

    if (!contract) {
      return { contract: null };
    }

    const isRecruiter = contract.application.job.recruiter?.userId === userId;
    const isCandidate = contract.application.candidate.userId === userId;

    if (!isRecruiter && !isCandidate) {
      throw new ForbiddenException('Bạn không có quyền truy cập hợp đồng này.');
    }

    return { contract, isRecruiter, isCandidate };
  }

  /**
   * 3. Get contract by contract ID
   */
  async getContractById(userId: string, contractId: string) {
    return this.findContractWithAccess(userId, contractId);
  }

  /**
   * 4. Update contract terms (Recruiter only, in DRAFT or REVISION_REQUESTED)
   */
  async updateContract(recruiterUserId: string, contractId: string, dto: UpdateContractDto) {
    const { contract, isRecruiter } = await this.findContractWithAccess(recruiterUserId, contractId);
    if (!isRecruiter) {
      throw new ForbiddenException('Chỉ nhà tuyển dụng mới có quyền cập nhật hợp đồng.');
    }

    if (
      contract.status !== ContractStatus.DRAFT &&
      contract.status !== ContractStatus.REVISION_REQUESTED
    ) {
      throw new BadRequestException(
        `Không thể chỉnh sửa hợp đồng khi đang ở trạng thái ${contract.status}.`,
      );
    }

    const data: Prisma.ContractUpdateInput = {};
    if (dto.contractType !== undefined) data.contractType = dto.contractType;
    if (dto.signingMethod !== undefined) data.signingMethod = dto.signingMethod;
    if (dto.jobTitle !== undefined) data.jobTitle = dto.jobTitle;
    if (dto.salary !== undefined) data.salary = new Prisma.Decimal(dto.salary);
    if (dto.salaryPeriod !== undefined) data.salaryPeriod = dto.salaryPeriod;
    if (dto.currency !== undefined) data.currency = dto.currency;
    if (dto.startDate !== undefined) data.startDate = new Date(dto.startDate);
    if (dto.endDate !== undefined) data.endDate = dto.endDate ? new Date(dto.endDate) : null;
    if (dto.workType !== undefined) data.workType = dto.workType;
    if (dto.workLocation !== undefined) data.workLocation = dto.workLocation;
    if (dto.workingHours !== undefined) data.workingHours = dto.workingHours;
    if (dto.probationPeriodMonths !== undefined) data.probationPeriodMonths = dto.probationPeriodMonths;
    if (dto.probationSalaryRate !== undefined) data.probationSalaryRate = dto.probationSalaryRate;
    if (dto.benefits !== undefined) data.benefits = dto.benefits;
    if (dto.customTerms !== undefined) data.customTerms = dto.customTerms;

    // If was in REVISION_REQUESTED, bump version and reset to DRAFT
    if (contract.status === ContractStatus.REVISION_REQUESTED) {
      data.version = contract.version + 1;
      data.status = ContractStatus.DRAFT;
    }

    const updated = await this.prisma.$transaction(async (tx) => {
      const res = await tx.contract.update({
        where: { id: contractId },
        data,
      });

      await tx.contractHistory.create({
        data: {
          contractId,
          action: 'UPDATED',
          performedByUserId: recruiterUserId,
          note: `Đã cập nhật các điều khoản (Phiên bản v${res.version}).`,
        },
      });

      return res;
    });

    return updated;
  }

  /**
   * 5. Send contract to candidate for review
   */
  async sendContract(recruiterUserId: string, contractId: string) {
    const { contract, isRecruiter } = await this.findContractWithAccess(recruiterUserId, contractId);
    if (!isRecruiter) {
      throw new ForbiddenException('Chỉ nhà tuyển dụng mới có quyền gửi hợp đồng.');
    }

    if (
      contract.status !== ContractStatus.DRAFT &&
      contract.status !== ContractStatus.REVISION_REQUESTED
    ) {
      throw new BadRequestException(
        `Chỉ có thể gửi hợp đồng đang ở trạng thái Nháp hoặc Đang xin sửa (hiện tại: ${contract.status}).`,
      );
    }

    const updated = await this.prisma.$transaction(async (tx) => {
      const res = await tx.contract.update({
        where: { id: contractId },
        data: {
          status: ContractStatus.PENDING_REVIEW,
        },
      });

      await tx.contractHistory.create({
        data: {
          contractId,
          action: 'SENT_FOR_REVIEW',
          performedByUserId: recruiterUserId,
          note: 'Nhà tuyển dụng đã gửi hợp đồng để ứng viên xem xét.',
        },
      });

      return res;
    });

    // Notify candidate
    if (contract.application.candidate.userId) {
      try {
        await this.notificationsService.createNotification({
          recipientUserId: contract.application.candidate.userId,
          applicationId: contract.application.id,
          title: `Hợp đồng lao động: ${contract.application.job.title}`,
          message: `Nhà tuyển dụng đã gửi bản dự thảo Hợp đồng lao động (${contract.contractNumber}). Vui lòng xem xét các điều khoản.`,
          payload: { contractId: contract.id },
        });
      } catch (err) {
        this.logger.warn(`Failed to notify candidate about contract: ${err}`);
      }
    }

    return updated;
  }

  /**
   * 6. Candidate requests revision
   */
  async requestRevision(candidateUserId: string, contractId: string, dto: CandidateFeedbackDto) {
    const { contract, isCandidate } = await this.findContractWithAccess(candidateUserId, contractId);
    if (!isCandidate) {
      throw new ForbiddenException('Chỉ ứng viên nhận hợp đồng mới có quyền yêu cầu chỉnh sửa.');
    }

    if (contract.status !== ContractStatus.PENDING_REVIEW) {
      throw new BadRequestException(
        `Không thể yêu cầu sửa đổi khi hợp đồng ở trạng thái ${contract.status}.`,
      );
    }

    const updated = await this.prisma.$transaction(async (tx) => {
      const res = await tx.contract.update({
        where: { id: contractId },
        data: {
          status: ContractStatus.REVISION_REQUESTED,
          latestRevisionNote: dto.note,
        },
      });

      await tx.contractHistory.create({
        data: {
          contractId,
          action: 'REVISION_REQUESTED',
          performedByUserId: candidateUserId,
          note: dto.note,
        },
      });

      return res;
    });

    // Notify recruiter
    const recruiterUserId = contract.application.job.recruiter?.userId;
    if (recruiterUserId) {
      try {
        await this.notificationsService.createNotification({
          recipientUserId: recruiterUserId,
          applicationId: contract.application.id,
          title: `Ứng viên yêu cầu điều chỉnh hợp đồng (${contract.contractNumber})`,
          message: `Ứng viên ${contract.application.candidate.fullName} đã gửi ý kiến góp ý điều khoản: "${dto.note.slice(0, 80)}..."`,
          payload: { contractId: contract.id },
        });
      } catch (err) {
        this.logger.warn(`Failed to notify recruiter about revision: ${err}`);
      }
    }

    return updated;
  }

  /**
   * 7. Candidate approves contract terms
   */
  async approveContract(candidateUserId: string, contractId: string) {
    const { contract, isCandidate } = await this.findContractWithAccess(candidateUserId, contractId);
    if (!isCandidate) {
      throw new ForbiddenException('Chỉ ứng viên nhận hợp đồng mới có quyền phê duyệt.');
    }

    if (contract.status !== ContractStatus.PENDING_REVIEW) {
      throw new BadRequestException(
        `Không thể phê duyệt khi hợp đồng ở trạng thái ${contract.status}.`,
      );
    }

    const updated = await this.prisma.$transaction(async (tx) => {
      const res = await tx.contract.update({
        where: { id: contractId },
        data: {
          status: ContractStatus.APPROVED,
        },
      });

      await tx.contractHistory.create({
        data: {
          contractId,
          action: 'APPROVED',
          performedByUserId: candidateUserId,
          note: 'Ứng viên đã thống nhất và phê duyệt toàn bộ điều khoản hợp đồng.',
        },
      });

      return res;
    });

    // Notify recruiter
    const recruiterUserId = contract.application.job.recruiter?.userId;
    if (recruiterUserId) {
      try {
        await this.notificationsService.createNotification({
          recipientUserId: recruiterUserId,
          applicationId: contract.application.id,
          title: `Hợp đồng đã được ứng viên duyệt (${contract.contractNumber})`,
          message: `Ứng viên ${contract.application.candidate.fullName} đã đồng ý toàn bộ điều khoản. Hai bên có thể tiến hành ký.`,
          payload: { contractId: contract.id },
        });
      } catch (err) {
        this.logger.warn(`Failed to notify recruiter about contract approval: ${err}`);
      }
    }

    return updated;
  }

  /**
   * 8. Manual signing: Recruiter uploads signed scan PDF
   */
  async uploadSignedContract(recruiterUserId: string, contractId: string, dto: UploadSignedContractDto) {
    const { contract, isRecruiter } = await this.findContractWithAccess(recruiterUserId, contractId);
    if (!isRecruiter) {
      throw new ForbiddenException('Chỉ nhà tuyển dụng mới có quyền upload bản scan hợp đồng đã ký.');
    }

    const updated = await this.prisma.$transaction(async (tx) => {
      const now = new Date();
      const res = await tx.contract.update({
        where: { id: contractId },
        data: {
          status: ContractStatus.SIGNED,
          signedPdfUrl: dto.signedPdfUrl,
          employerSignedAt: now,
          candidateSignedAt: now,
        },
      });

      await tx.contractHistory.create({
        data: {
          contractId,
          action: 'SIGNED_MANUAL',
          performedByUserId: recruiterUserId,
          note: dto.note || 'HR đã upload bản scan hợp đồng có chữ ký tay hoàn tất.',
          snapshot: { signedPdfUrl: dto.signedPdfUrl },
        },
      });

      return res;
    });

    // Notify candidate
    if (contract.application.candidate.userId) {
      try {
        await this.notificationsService.createNotification({
          recipientUserId: contract.application.candidate.userId,
          applicationId: contract.application.id,
          title: `Hợp đồng lao động chính thức đã hoàn tất ký kết!`,
          message: `Bản hợp đồng đã ký (${contract.contractNumber}) đã được cập nhật lên hệ thống. Bạn có thể tải về lưu trữ bất cứ lúc nào.`,
          payload: { contractId: contract.id, signedPdfUrl: dto.signedPdfUrl },
        });
      } catch (err) {
        this.logger.warn(`Failed to notify candidate about signed scan: ${err}`);
      }
    }

    return updated;
  }

  /**
   * 9. Electronic Signing: Candidate or Recruiter signs via digital signature
   */
  async eSignContract(
    userId: string,
    contractId: string,
    dto: ESignContractDto,
  ) {
    const { contract, isRecruiter, isCandidate } = await this.findContractWithAccess(userId, contractId);

    if (contract.status !== ContractStatus.APPROVED && contract.status !== ContractStatus.PENDING_REVIEW) {
      if (contract.status === ContractStatus.SIGNED) {
        throw new BadRequestException('Hợp đồng này đã hoàn tất ký kết.');
      }
      throw new BadRequestException('Hợp đồng cần được thống nhất điều khoản trước khi ký điện tử.');
    }

    const now = new Date();
    const isCandidateSigning = isCandidate;
    const isEmployerSigning = isRecruiter;

    const data: Prisma.ContractUpdateInput = {};
    if (isCandidateSigning) {
      data.candidateSignatureUrl = dto.signatureDataUrl;
      data.candidateSignedAt = now;
    } else if (isEmployerSigning) {
      data.employerSignatureUrl = dto.signatureDataUrl;
      data.employerSignedAt = now;
    }

    // Check if both sides will have signed
    const willBeFullySigned =
      (isCandidateSigning && (contract.employerSignatureUrl || contract.employerSignedAt)) ||
      (isEmployerSigning && (contract.candidateSignatureUrl || contract.candidateSignedAt));

    if (willBeFullySigned) {
      data.status = ContractStatus.SIGNED;
    }

    const updated = await this.prisma.$transaction(async (tx) => {
      const res = await tx.contract.update({
        where: { id: contractId },
        data,
      });

      await tx.contractHistory.create({
        data: {
          contractId,
          action: 'SIGNED_ELECTRONIC',
          performedByUserId: userId,
          note: isCandidateSigning
            ? 'Ứng viên đã thực hiện ký điện tử.'
            : 'Đại diện nhà tuyển dụng đã thực hiện ký điện tử.',
        },
      });

      return res;
    });

    return updated;
  }
}
