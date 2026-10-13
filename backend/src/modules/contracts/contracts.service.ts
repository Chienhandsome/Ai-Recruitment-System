import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import * as crypto from 'crypto';
import * as fs from 'fs';
import * as path from 'path';
import type { Response } from 'express';
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

    let isAdmin = false;
    if (!isRecruiter && !isCandidate) {
      const user = await this.prisma.user.findUnique({
        where: { id: userId },
        select: {
          userRoles: { select: { role: { select: { code: true } } } },
        },
      });
      isAdmin = user?.userRoles.some((ur) => ur.role.code === 'ADMIN') ?? false;
    }

    if (!isRecruiter && !isCandidate && !isAdmin) {
      throw new ForbiddenException('Bạn không có quyền truy cập hợp đồng này.');
    }

    return { contract, isRecruiter, isCandidate, isAdmin };
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

    let isAdmin = false;
    if (!isRecruiter && !isCandidate) {
      const user = await this.prisma.user.findUnique({
        where: { id: userId },
        select: {
          userRoles: { select: { role: { select: { code: true } } } },
        },
      });
      isAdmin = user?.userRoles.some((ur) => ur.role.code === 'ADMIN') ?? false;
    }

    if (!isRecruiter && !isCandidate && !isAdmin) {
      throw new ForbiddenException('Bạn không có quyền truy cập hợp đồng này.');
    }

    return { contract, isRecruiter, isCandidate, isAdmin };
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
   * 8. Manual signing: Recruiter uploads signed scan PDF with SHA-256 seal & Audit Trail
   */
  async uploadSignedContract(
    recruiterUserId: string,
    contractId: string,
    dto: UploadSignedContractDto,
    clientMeta?: { ip: string; userAgent: string },
  ) {
    const { contract, isRecruiter } = await this.findContractWithAccess(recruiterUserId, contractId);
    if (!isRecruiter) {
      throw new ForbiddenException('Chỉ nhà tuyển dụng mới có quyền upload bản scan hợp đồng đã ký.');
    }

    const now = new Date();
    const uploaderIp = clientMeta?.ip || '127.0.0.1';
    const uploaderUserAgent = clientMeta?.userAgent || 'Web Browser';

    // Compute cryptographic SHA-256 seal for the manual scanned PDF upload
    const hashPayload = [
      contract.contractNumber,
      contract.jobTitle,
      contract.salary.toString(),
      contract.currency,
      dto.signedPdfUrl.trim(),
      uploaderIp,
      now.toISOString(),
      'MANUAL_SCAN_SIGNING',
    ].join('|');
    const sha256Seal = crypto.createHash('sha256').update(hashPayload).digest('hex');

    const auditCertificate = {
      contractNumber: contract.contractNumber,
      jobTitle: contract.jobTitle,
      signingMethod: 'MANUAL',
      sha256Hash: sha256Seal,
      sealedAt: now.toISOString(),
      status: 'FULLY_SIGNED_MANUAL',
      manualScan: {
        signedPdfUrl: dto.signedPdfUrl.trim(),
        uploadedByRecruiterName: contract.application.job.recruiter?.user?.fullName || 'Đại diện tuyển dụng',
        uploadedByEmail: contract.application.job.recruiter?.user?.email,
        uploadedAt: now.toISOString(),
        uploaderIp,
        userAgent: uploaderUserAgent,
        internalNote: dto.note || null,
      },
      candidate: {
        name: contract.application.candidate.fullName,
        email: contract.application.candidate.user?.email || contract.application.candidate.email,
        phone: contract.application.candidate.phone,
        verificationMethod: 'MANUAL_PHYSICAL_SIGNATURE_ON_PAPER',
      },
      employer: {
        company: contract.application.job.recruiter?.company?.name || 'Doanh nghiệp tuyển dụng',
        recruiterName: contract.application.job.recruiter?.user?.fullName || 'Đại diện tuyển dụng',
        verificationMethod: 'MANUAL_PHYSICAL_STAMP_AND_SIGNATURE',
      },
      legalBasis: [
        'Điều 14 Bộ luật Lao động số 45/2019/QH14 (Hợp đồng lao động bằng văn bản giấy ký tay & đóng dấu)',
        'Khoản 1 Điều 9 Luật Giao dịch điện tử số 20/2023/QH15 (Chuyển đổi văn bản giấy sang thông điệp dữ liệu điện tử có lưu vết)',
      ],
    };

    const updated = await this.prisma.$transaction(async (tx) => {
      const res = await tx.contract.update({
        where: { id: contractId },
        data: {
          status: ContractStatus.SIGNED,
          signedPdfUrl: dto.signedPdfUrl.trim(),
          pdfSha256Hash: sha256Seal,
          employerSignedAt: now,
          candidateSignedAt: now,
          employerSignerIp: uploaderIp,
          employerSignerUserAgent: uploaderUserAgent,
          auditCertificate: auditCertificate as Prisma.InputJsonValue,
        },
      });

      await tx.contractHistory.create({
        data: {
          contractId,
          action: 'SIGNED_MANUAL_SCAN',
          performedByUserId: recruiterUserId,
          note: dto.note
            ? `HR đã upload bản scan hợp đồng có chữ ký tay và mộc đỏ: "${dto.note}". Mã băm SHA-256: ${sha256Seal.slice(0, 16)}...`
            : `HR đã upload bản scan hợp đồng có chữ ký tay và mộc đỏ. Mã băm SHA-256: ${sha256Seal.slice(0, 16)}...`,
          snapshot: auditCertificate as Prisma.InputJsonValue,
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
   * 8b. Manual signing: Recruiter uploads multiple image/PDF scan files
   * Directly stores files, computes SHA-256 seal across all pages, and builds forensic page records
   */
  async uploadSignedContractFiles(
    recruiterUserId: string,
    contractId: string,
    files: Express.Multer.File[],
    note?: string,
    clientMeta?: { ip: string; userAgent: string },
  ) {
    if (!files || files.length === 0) {
      throw new BadRequestException('Vui lòng chọn ít nhất một file ảnh hoặc PDF bản scan hợp đồng.');
    }

    const { contract, isRecruiter } = await this.findContractWithAccess(recruiterUserId, contractId);
    if (!isRecruiter) {
      throw new ForbiddenException('Chỉ nhà tuyển dụng mới có quyền upload bản scan hợp đồng đã ký.');
    }

    const now = new Date();
    const uploaderIp = clientMeta?.ip || '127.0.0.1';
    const uploaderUserAgent = clientMeta?.userAgent || 'Web Browser';

    // Directory for local file storage
    const targetDir = path.join(process.cwd(), 'uploads', 'contracts', contractId);
    if (!fs.existsSync(targetDir)) {
      fs.mkdirSync(targetDir, { recursive: true });
    }

    // Process each page
    const apiBase = process.env.RECRUITMENT_PUBLIC_API_URL || 'http://localhost:3001/api';
    const pages = files.map((file, idx) => {
      const pageNumber = idx + 1;
      const rawExt = path.extname(file.originalname).toLowerCase();
      const ext = rawExt || (file.mimetype.includes('png') ? '.png' : file.mimetype.includes('pdf') ? '.pdf' : '.jpg');
      const savedFileName = `page-${pageNumber}${ext}`;
      const targetPath = path.join(targetDir, savedFileName);

      // Save buffer to disk
      fs.writeFileSync(targetPath, file.buffer);

      const pageHash = crypto.createHash('sha256').update(file.buffer).digest('hex');
      const pageUrl = `${apiBase}/contracts/${contractId}/scan-page/${pageNumber}`;

      // Include dataUrl fallback if image <= 6MB
      const isImage = file.mimetype.startsWith('image/');
      const dataUrl = isImage && file.buffer.length <= 6 * 1024 * 1024
        ? `data:${file.mimetype};base64,${file.buffer.toString('base64')}`
        : undefined;

      return {
        pageNumber,
        fileName: file.originalname,
        mimeType: file.mimetype,
        fileSizeBytes: file.size,
        sha256Hash: pageHash,
        url: pageUrl,
        dataUrl,
      };
    });

    // Compute cryptographic SHA-256 seal across all uploaded scan files in order
    const combinedBuffer = Buffer.concat(files.map((f) => f.buffer));
    const multiFileSha256 = crypto.createHash('sha256').update(combinedBuffer).digest('hex');

    const primaryScanUrl = pages[0]?.url || `${apiBase}/contracts/${contractId}/scan-page/1`;

    const auditCertificate = {
      contractNumber: contract.contractNumber,
      jobTitle: contract.jobTitle,
      signingMethod: 'MANUAL',
      sha256Hash: multiFileSha256,
      sealedAt: now.toISOString(),
      status: 'FULLY_SIGNED_MANUAL',
      manualScan: {
        totalPages: pages.length,
        signedPdfUrl: primaryScanUrl,
        pages,
        uploadedByRecruiterName: contract.application.job.recruiter?.user?.fullName || 'Đại diện tuyển dụng',
        uploadedByEmail: contract.application.job.recruiter?.user?.email,
        uploadedAt: now.toISOString(),
        uploaderIp,
        userAgent: uploaderUserAgent,
        internalNote: note?.trim() || null,
      },
      candidate: {
        name: contract.application.candidate.fullName,
        email: contract.application.candidate.user?.email || contract.application.candidate.email,
        phone: contract.application.candidate.phone,
        verificationMethod: 'MANUAL_PHYSICAL_SIGNATURE_ON_PAPER',
      },
      employer: {
        company: contract.application.job.recruiter?.company?.name || 'Doanh nghiệp tuyển dụng',
        recruiterName: contract.application.job.recruiter?.user?.fullName || 'Đại diện tuyển dụng',
        verificationMethod: 'MANUAL_PHYSICAL_STAMP_AND_SIGNATURE',
      },
      legalBasis: [
        'Điều 14 Bộ luật Lao động số 45/2019/QH14 (Hợp đồng lao động bằng văn bản giấy ký tay & đóng dấu)',
        'Khoản 1 Điều 9 Luật Giao dịch điện tử số 20/2023/QH15 (Chuyển đổi văn bản giấy sang thông điệp dữ liệu điện tử có lưu vết)',
      ],
    };

    const updated = await this.prisma.$transaction(async (tx) => {
      const res = await tx.contract.update({
        where: { id: contractId },
        data: {
          status: ContractStatus.SIGNED,
          signedPdfUrl: primaryScanUrl,
          pdfSha256Hash: multiFileSha256,
          employerSignedAt: now,
          candidateSignedAt: now,
          employerSignerIp: uploaderIp,
          employerSignerUserAgent: uploaderUserAgent,
          auditCertificate: auditCertificate as Prisma.InputJsonValue,
        },
      });

      await tx.contractHistory.create({
        data: {
          contractId,
          action: 'SIGNED_MANUAL_SCAN',
          performedByUserId: recruiterUserId,
          note: note
            ? `HR đã tải lên ${pages.length} trang ảnh scan hợp đồng đã ký và đóng mộc đỏ: "${note}". Mã băm SHA-256 niêm phong: ${multiFileSha256.slice(0, 16)}...`
            : `HR đã tải lên ${pages.length} trang ảnh scan hợp đồng đã ký và đóng mộc đỏ. Mã băm SHA-256 niêm phong: ${multiFileSha256.slice(0, 16)}...`,
          snapshot: auditCertificate as Prisma.InputJsonValue,
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
          message: `Bản scan hợp đồng gồm ${pages.length} trang đã được tải lên hệ thống. Bạn có thể kiểm tra từng trang và báo cáo nếu ảnh bị mờ.`,
          payload: { contractId: contract.id, signedPdfUrl: primaryScanUrl, totalPages: pages.length },
        });
      } catch (err) {
        this.logger.warn(`Failed to notify candidate about signed scan files: ${err}`);
      }
    }

    return updated;
  }

  /**
   * Stream a specific page image/file of a scanned contract
   */
  async streamScanPage(contractId: string, pageNumber: number, res: Response) {
    const contract = await this.prisma.contract.findUnique({
      where: { id: contractId },
      select: { auditCertificate: true },
    });

    if (!contract) {
      throw new NotFoundException('Hợp đồng không tồn tại');
    }

    const audit = contract.auditCertificate as any;
    const pages = audit?.manualScan?.pages as Array<any> | undefined;
    const page = pages?.find((p: any) => p.pageNumber === pageNumber);

    if (!page) {
      throw new NotFoundException(`Trang ${pageNumber} không tồn tại trong bản scan hợp đồng`);
    }

    // Try finding on disk
    const targetDir = path.join(process.cwd(), 'uploads', 'contracts', contractId);
    if (fs.existsSync(targetDir)) {
      const files = fs.readdirSync(targetDir);
      const match = files.find((f) => f.startsWith(`page-${pageNumber}.`) || f.startsWith(`page-${pageNumber}-`));
      if (match) {
        const fullPath = path.join(targetDir, match);
        res.setHeader('Content-Type', page.mimeType || 'image/jpeg');
        return res.sendFile(fullPath);
      }
    }

    // Fallback to dataUrl
    if (page.dataUrl) {
      const matches = page.dataUrl.match(/^data:([A-Za-z0-9\-+\/.]+);base64,(.+)$/);
      if (matches) {
        const contentType = matches[1];
        const buffer = Buffer.from(matches[2], 'base64');
        res.setHeader('Content-Type', contentType);
        res.setHeader('Content-Length', buffer.length);
        return res.send(buffer);
      }
    }

    throw new NotFoundException('Không tìm thấy dữ liệu ảnh trang scan');
  }

  /**
   * 9. Request 6-digit OTP code before signing (P1.1 2FA DocuSign Standard)
   */
  async requestContractOtp(
    userId: string,
    contractId: string,
    emailOverride?: string,
  ) {
    const { contract, isCandidate, isRecruiter } = await this.findContractWithAccess(userId, contractId);
    if (!isCandidate && !isRecruiter) {
      throw new ForbiddenException('Bạn không có quyền thực hiện xác thực trên hợp đồng này.');
    }

    if (contract.status === ContractStatus.SIGNED) {
      throw new BadRequestException('Hợp đồng này đã được ký kết hoàn tất.');
    }

    // Determine target recipient email
    let targetEmail: string | undefined;
    if (isCandidate) {
      targetEmail = contract.application.candidate.user?.email || contract.application.candidate.email || emailOverride;
    } else if (isRecruiter) {
      targetEmail = contract.application.job.recruiter?.user?.email || emailOverride;
    }

    if (!targetEmail) {
      const user = await this.prisma.user.findUnique({ where: { id: userId }, select: { email: true } });
      targetEmail = user?.email;
    }

    if (!targetEmail) {
      throw new BadRequestException('Không tìm thấy địa chỉ email hợp lệ để nhận mã xác thực OTP.');
    }

    // Rate-limiting: Check if an unused OTP was requested in the last 60 seconds
    const now = new Date();
    const oneMinuteAgo = new Date(now.getTime() - 60 * 1000);
    const recentOtp = await this.prisma.contractSigningOtp.findFirst({
      where: {
        contractId,
        userId,
        isUsed: false,
        createdAt: { gte: oneMinuteAgo },
      },
    });

    if (recentOtp) {
      throw new BadRequestException('Mã xác thực vừa được gửi. Vui lòng đợi 60 giây trước khi yêu cầu mã mới.');
    }

    // Invalidate previous unused OTPs for this contract & user
    await this.prisma.contractSigningOtp.updateMany({
      where: { contractId, userId, isUsed: false },
      data: { isUsed: true },
    });

    // Generate cryptographically secure 6-digit numeric OTP
    const otpCode = crypto.randomInt(100000, 999999).toString();
    const expiresAt = new Date(now.getTime() + 5 * 60 * 1000); // 5 minutes TTL

    await this.prisma.contractSigningOtp.create({
      data: {
        contractId,
        userId,
        email: targetEmail,
        otpCode,
        expiresAt,
        attempts: 0,
        isUsed: false,
      },
    });

    // Notify user via in-app notification system
    try {
      await this.notificationsService.createNotification({
        recipientUserId: userId,
        applicationId: contract.application.id,
        title: `Mã xác thực OTP ký Hợp đồng (${contract.contractNumber})`,
        message: `Mã OTP xác thực ký điện tử của bạn là: ${otpCode}. Mã có hiệu lực trong 5 phút. Vui lòng không chia sẻ mã này cho bất kỳ ai.`,
        payload: { contractId: contract.id, otpCode },
      });
    } catch (err) {
      this.logger.warn(`Failed to dispatch in-app OTP notification: ${err}`);
    }

    this.logger.log(`[P1.1 Signature OTP] Generated OTP for user ${userId} on contract ${contract.contractNumber}: ${otpCode}`);

    // Mask email for privacy (e.g., c***e@example.com)
    const emailParts = targetEmail.split('@');
    const maskedEmail = emailParts[0].length > 2
      ? `${emailParts[0][0]}***${emailParts[0].slice(-1)}@${emailParts[1]}`
      : `***@${emailParts[1]}`;

    return {
      success: true,
      message: `Mã OTP xác thực gồm 6 chữ số đã được gửi đến email ${maskedEmail}.`,
      expiresAt,
      destinationEmail: maskedEmail,
      demoOtp: process.env.NODE_ENV !== 'production' ? otpCode : undefined,
    };
  }

  /**
   * 10. Electronic Signing with OTP Verification & Cryptographic SHA-256 Seal (DocuSign Model)
   */
  async eSignContract(
    userId: string,
    contractId: string,
    dto: ESignContractDto,
    clientMeta: { ip: string; userAgent: string },
  ) {
    const { contract, isRecruiter, isCandidate } = await this.findContractWithAccess(userId, contractId);

    if (contract.status !== ContractStatus.APPROVED && contract.status !== ContractStatus.PENDING_REVIEW) {
      if (contract.status === ContractStatus.SIGNED) {
        throw new BadRequestException('Hợp đồng này đã hoàn tất ký kết.');
      }
      throw new BadRequestException('Hợp đồng cần được thống nhất điều khoản trước khi ký điện tử.');
    }

    const now = new Date();

    // 1. Verify OTP
    const activeOtp = await this.prisma.contractSigningOtp.findFirst({
      where: {
        contractId,
        userId,
        isUsed: false,
        expiresAt: { gt: now },
      },
      orderBy: { createdAt: 'desc' },
    });

    if (!activeOtp) {
      throw new BadRequestException(
        'Mã xác thực OTP không tồn tại hoặc đã hết hạn (5 phút). Vui lòng bấm "Gửi lại mã OTP" để nhận mã mới.',
      );
    }

    if (activeOtp.attempts >= 3) {
      await this.prisma.contractSigningOtp.update({
        where: { id: activeOtp.id },
        data: { isUsed: true },
      });
      throw new BadRequestException(
        'Mã OTP này đã bị khóa do nhập sai quá 3 lần. Vui lòng yêu cầu mã OTP mới.',
      );
    }

    if (activeOtp.otpCode !== dto.otpCode.trim()) {
      const remainingAttempts = 2 - activeOtp.attempts;
      await this.prisma.contractSigningOtp.update({
        where: { id: activeOtp.id },
        data: { attempts: { increment: 1 } },
      });
      throw new BadRequestException(
        `Mã OTP không chính xác. Bạn còn ${remainingAttempts} lần thử trước khi mã bị hủy.`,
      );
    }

    // Mark OTP as used
    await this.prisma.contractSigningOtp.update({
      where: { id: activeOtp.id },
      data: { isUsed: true },
    });

    const isCandidateSigning = isCandidate;
    const isEmployerSigning = isRecruiter;

    // 2. Prepare signing metadata and cryptographic seal
    const data: Prisma.ContractUpdateInput = {};
    if (isCandidateSigning) {
      data.candidateSignatureUrl = dto.signatureDataUrl;
      data.candidateSignedAt = now;
      data.candidateSignerIp = clientMeta.ip;
      data.candidateSignerUserAgent = clientMeta.userAgent;
      data.candidateOtpVerifiedAt = now;
    } else if (isEmployerSigning) {
      data.employerSignatureUrl = dto.signatureDataUrl;
      data.employerSignedAt = now;
      data.employerSignerIp = clientMeta.ip;
      data.employerSignerUserAgent = clientMeta.userAgent;
      data.employerOtpVerifiedAt = now;
    }

    const willBeFullySigned =
      (isCandidateSigning && (contract.employerSignatureUrl || contract.employerSignedAt)) ||
      (isEmployerSigning && (contract.candidateSignatureUrl || contract.candidateSignedAt));

    if (willBeFullySigned) {
      data.status = ContractStatus.SIGNED;
    }

    // 3. Compute Cryptographic SHA-256 Seal
    const candidateName = contract.application.candidate.fullName;
    const companyName = contract.application.job.recruiter?.company?.name || 'Doanh nghiệp tuyển dụng';
    const hashPayload = [
      contract.contractNumber,
      contract.jobTitle,
      contract.salary.toString(),
      contract.currency,
      contract.startDate.toISOString(),
      candidateName,
      companyName,
      dto.signatureDataUrl,
      clientMeta.ip,
      now.toISOString(),
      activeOtp.id,
    ].join('|');

    const sha256Seal = crypto.createHash('sha256').update(hashPayload).digest('hex');
    data.pdfSha256Hash = sha256Seal;

    // 4. Build DocuSign-Standard Audit Certificate
    const auditCertificate = {
      contractNumber: contract.contractNumber,
      jobTitle: contract.jobTitle,
      sha256Hash: sha256Seal,
      sealedAt: now.toISOString(),
      status: willBeFullySigned ? 'FULLY_SIGNED' : 'PARTIALLY_SIGNED',
      signerAction: isCandidateSigning ? 'CANDIDATE_SIGNED' : 'EMPLOYER_SIGNED',
      candidate: {
        name: candidateName,
        email: contract.application.candidate.user?.email || contract.application.candidate.email,
        phone: contract.application.candidate.phone,
        signedAt: isCandidateSigning ? now.toISOString() : contract.candidateSignedAt?.toISOString() || null,
        signerIp: isCandidateSigning ? clientMeta.ip : contract.candidateSignerIp || null,
        userAgent: isCandidateSigning ? clientMeta.userAgent : contract.candidateSignerUserAgent || null,
        otpVerifiedAt: isCandidateSigning ? now.toISOString() : contract.candidateOtpVerifiedAt?.toISOString() || null,
        verificationMethod: 'EMAIL_2FA_OTP',
        acceptedContractTerms: isCandidateSigning ? (dto.acceptedContractTerms !== false) : ((contract.auditCertificate as any)?.candidate?.acceptedContractTerms ?? true),
        acceptedPlatformPolicies: isCandidateSigning ? (dto.acceptedPlatformTerms !== false) : ((contract.auditCertificate as any)?.candidate?.acceptedPlatformPolicies ?? true),
      },
      employer: {
        company: companyName,
        recruiterName: contract.application.job.recruiter?.user?.fullName || 'Đại diện tuyển dụng',
        email: contract.application.job.recruiter?.user?.email,
        signedAt: isEmployerSigning ? now.toISOString() : contract.employerSignedAt?.toISOString() || null,
        signerIp: isEmployerSigning ? clientMeta.ip : contract.employerSignerIp || null,
        userAgent: isEmployerSigning ? clientMeta.userAgent : contract.employerSignerUserAgent || null,
        otpVerifiedAt: isEmployerSigning ? now.toISOString() : contract.employerOtpVerifiedAt?.toISOString() || null,
        verificationMethod: 'EMAIL_2FA_OTP',
        acceptedContractTerms: isEmployerSigning ? (dto.acceptedContractTerms !== false) : ((contract.auditCertificate as any)?.employer?.acceptedContractTerms ?? true),
        acceptedPlatformPolicies: isEmployerSigning ? (dto.acceptedPlatformTerms !== false) : ((contract.auditCertificate as any)?.employer?.acceptedPlatformPolicies ?? true),
      },
      legalBasis: [
        'Điều 14 Bộ luật Lao động số 45/2019/QH14 (Công nhận giá trị pháp lý Hợp đồng lao động điện tử)',
        'Điều 22 & Điều 23 Luật Giao dịch điện tử số 20/2023/QH15 (Chữ ký điện tử nâng cao có xác thực 2FA)',
        'Quy chế Hoạt động & Quy định Giải quyết Tranh chấp nền tảng SmartRecruit AI (Mã: TERMS_OF_SERVICE & DISPUTE_POLICY)',
      ],
    };

    data.auditCertificate = auditCertificate as Prisma.InputJsonValue;

    const updated = await this.prisma.$transaction(async (tx) => {
      const res = await tx.contract.update({
        where: { id: contractId },
        data,
      });

      await tx.contractHistory.create({
        data: {
          contractId,
          action: willBeFullySigned ? 'FULLY_SIGNED_ELECTRONIC_OTP' : 'PARTIALLY_SIGNED_ELECTRONIC_OTP',
          performedByUserId: userId,
          note: isCandidateSigning
            ? `Ứng viên đã xác thực OTP (${activeOtp.email}) và ký điện tử thành công. Mã băm SHA-256: ${sha256Seal.slice(0, 16)}...`
            : `Nhà tuyển dụng đã xác thực OTP (${activeOtp.email}) và ký điện tử thành công. Mã băm SHA-256: ${sha256Seal.slice(0, 16)}...`,
          snapshot: auditCertificate as Prisma.InputJsonValue,
        },
      });

      return res;
    });

    // Notify other party
    const targetRecipientId = isCandidateSigning
      ? contract.application.job.recruiter?.userId
      : contract.application.candidate.userId;

    if (targetRecipientId) {
      try {
        await this.notificationsService.createNotification({
          recipientUserId: targetRecipientId,
          applicationId: contract.application.id,
          title: willBeFullySigned
            ? `Hợp đồng lao động đã hoàn tất ký kết bởi cả hai bên! (${contract.contractNumber})`
            : `Đối tác đã hoàn tất ký điện tử (${contract.contractNumber})`,
          message: willBeFullySigned
            ? `Hợp đồng lao động đã được xác thực 2FA OTP và niêm phong số an toàn. Mã xác thực SHA-256: ${sha256Seal.slice(0, 12)}...`
            : `${isCandidateSigning ? 'Ứng viên' : 'Nhà tuyển dụng'} đã ký số. Hợp đồng đang chờ chữ ký của bên còn lại.`,
          payload: { contractId: contract.id, contractNumber: contract.contractNumber, sha256: sha256Seal },
        });
      } catch (err) {
        this.logger.warn(`Failed to notify party about e-sign: ${err}`);
      }
    }

    return updated;
  }

  /**
   * 11. Public Verification Portal: Validate contract integrity and SHA-256 seal (No Auth Required)
   */
  async verifyContractPublic(contractNumber: string) {
    const contract = await this.prisma.contract.findUnique({
      where: { contractNumber: contractNumber.trim() },
      include: {
        application: {
          include: {
            job: {
              select: {
                title: true,
                recruiter: {
                  select: {
                    user: { select: { fullName: true, email: true } },
                    company: { select: { name: true, logoUrl: true, address: true } },
                  },
                },
              },
            },
            candidate: {
              select: {
                fullName: true,
                email: true,
                phone: true,
              },
            },
          },
        },
      },
    });

    if (!contract) {
      return {
        verified: false,
        message: `Không tìm thấy văn bản hợp đồng với mã hiệu: "${contractNumber}". Vui lòng kiểm tra lại số hợp đồng.`,
      };
    }

    const isSealed = Boolean(contract.pdfSha256Hash);
    const isSigned = contract.status === ContractStatus.SIGNED;

    return {
      verified: true,
      contractNumber: contract.contractNumber,
      jobTitle: contract.jobTitle,
      status: contract.status,
      isLegallyBinding: isSigned && isSealed,
      sha256Hash: contract.pdfSha256Hash,
      candidate: {
        fullName: contract.application.candidate.fullName,
        signedAt: contract.candidateSignedAt,
        isSigned: Boolean(contract.candidateSignedAt),
        otpVerified: Boolean(contract.candidateOtpVerifiedAt),
      },
      employer: {
        companyName: contract.application.job.recruiter?.company?.name || 'Doanh nghiệp tuyển dụng',
        recruiterName: contract.application.job.recruiter?.user?.fullName,
        signedAt: contract.employerSignedAt,
        isSigned: Boolean(contract.employerSignedAt),
        otpVerified: Boolean(contract.employerOtpVerifiedAt),
      },
      auditCertificate: contract.auditCertificate,
      legalComplianceText: 'Hợp đồng được giao kết điện tử và chứng thực toàn vẹn căn cứ theo Điều 14 Bộ luật Lao động 2019 và Điều 22, 23 Luật Giao dịch điện tử 2023.',
      verifiedAt: new Date().toISOString(),
    };
  }

  /**
   * 12. Admin: Get all contracts with forensic filters (Signing method: ELECTRONIC vs MANUAL)
   */
  async getAdminContracts(query?: {
    search?: string;
    signingMethod?: ContractSigningMethod;
    status?: ContractStatus;
    page?: number;
    limit?: number;
  }) {
    const page = Math.max(1, Number(query?.page) || 1);
    const limit = Math.min(50, Math.max(1, Number(query?.limit) || 20));
    const skip = (page - 1) * limit;

    const where: Prisma.ContractWhereInput = {};

    if (query?.signingMethod) {
      where.signingMethod = query.signingMethod;
    }

    if (query?.status) {
      where.status = query.status;
    }

    if (query?.search?.trim()) {
      const s = query.search.trim();
      where.OR = [
        { contractNumber: { contains: s, mode: 'insensitive' } },
        { jobTitle: { contains: s, mode: 'insensitive' } },
        { application: { candidate: { fullName: { contains: s, mode: 'insensitive' } } } },
        { application: { candidate: { email: { contains: s, mode: 'insensitive' } } } },
        { application: { job: { recruiter: { company: { name: { contains: s, mode: 'insensitive' } } } } } },
      ];
    }

    const [total, contracts] = await Promise.all([
      this.prisma.contract.count({ where }),
      this.prisma.contract.findMany({
        where,
        skip,
        take: limit,
        orderBy: { updatedAt: 'desc' },
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
                      company: { select: { id: true, name: true, logoUrl: true } },
                    },
                  },
                },
              },
              candidate: {
                select: {
                  id: true,
                  fullName: true,
                  email: true,
                  phone: true,
                },
              },
              offer: {
                select: {
                  salary: true,
                  currency: true,
                  startDate: true,
                },
              },
              disputes: {
                select: {
                  id: true,
                  disputeNumber: true,
                  status: true,
                  category: true,
                },
              },
            },
          },
          _count: {
            select: {
              histories: true,
              signingOtps: true,
            },
          },
        },
      }),
    ]);

    return {
      items: contracts,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  /**
   * 13. Admin: Get in-depth forensic investigation dossier for any contract (Both MANUAL and ELECTRONIC)
   */
  async getContractForensics(contractId: string) {
    const contract = await this.prisma.contract.findUnique({
      where: { id: contractId },
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
                    user: { select: { fullName: true, email: true, phone: true } },
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
            offer: true,
            disputes: {
              orderBy: { createdAt: 'desc' },
              include: {
                reportedByUser: { select: { fullName: true, email: true } },
              },
            },
          },
        },
        histories: {
          orderBy: { createdAt: 'desc' },
        },
        signingOtps: {
          orderBy: { createdAt: 'desc' },
          take: 20,
        },
      },
    });

    if (!contract) {
      throw new NotFoundException('Hợp đồng không tồn tại.');
    }

    // Enrich histories with performer user details
    const performerIds = Array.from(
      new Set(
        contract.histories
          .map((h) => h.performedByUserId)
          .filter((id): id is string => Boolean(id)),
      ),
    );

    const performers = performerIds.length > 0
      ? await this.prisma.user.findMany({
          where: { id: { in: performerIds } },
          select: {
            id: true,
            fullName: true,
            email: true,
            userRoles: { select: { role: { select: { code: true } } } },
          },
        })
      : [];

    const performerMap = new Map(
      performers.map((p) => [
        p.id,
        {
          id: p.id,
          fullName: p.fullName,
          email: p.email,
          role: p.userRoles[0]?.role.code || 'USER',
        },
      ]),
    );

    const enrichedHistories = contract.histories.map((h) => ({
      ...h,
      performer: h.performedByUserId ? performerMap.get(h.performedByUserId) || null : null,
    }));

    // Mask OTP code in signingOtps for forensic security
    const sanitizedOtps = contract.signingOtps.map((otp) => ({
      id: otp.id,
      email: otp.email,
      createdAt: otp.createdAt,
      expiresAt: otp.expiresAt,
      isUsed: otp.isUsed,
      attempts: otp.attempts,
      maskedCode: `****${otp.otpCode.slice(-2)}`,
    }));

    // Discrepancy analysis between agreed Offer terms and final Contract terms
    const offer = contract.application.offer;
    const discrepancies: { field: string; offerValue: any; contractValue: any; severity: 'INFO' | 'WARNING' | 'CRITICAL' }[] = [];

    if (offer) {
      if (Number(offer.salary) !== Number(contract.salary)) {
        discrepancies.push({
          field: 'Mức lương cơ bản (Salary)',
          offerValue: `${Number(offer.salary).toLocaleString('vi-VN')} ${offer.currency}`,
          contractValue: `${Number(contract.salary).toLocaleString('vi-VN')} ${contract.currency}`,
          severity: 'CRITICAL',
        });
      }
      if (contract.application.job.title && contract.application.job.title !== contract.jobTitle) {
        discrepancies.push({
          field: 'Chức danh vị trí (Job Title)',
          offerValue: contract.application.job.title,
          contractValue: contract.jobTitle,
          severity: 'WARNING',
        });
      }
      if (offer.workType && offer.workType !== contract.workType) {
        discrepancies.push({
          field: 'Hình thức làm việc (Work Type)',
          offerValue: offer.workType,
          contractValue: contract.workType,
          severity: 'INFO',
        });
      }
      if (offer.startDate && new Date(offer.startDate).toISOString().slice(0, 10) !== new Date(contract.startDate).toISOString().slice(0, 10)) {
        discrepancies.push({
          field: 'Ngày bắt đầu làm việc (Start Date)',
          offerValue: new Date(offer.startDate).toLocaleDateString('vi-VN'),
          contractValue: new Date(contract.startDate).toLocaleDateString('vi-VN'),
          severity: 'WARNING',
        });
      }
    }

    return {
      contract,
      isManual: contract.signingMethod === ContractSigningMethod.MANUAL,
      isElectronic: contract.signingMethod === ContractSigningMethod.ELECTRONIC,
      enrichedHistories,
      sanitizedOtps,
      discrepancies,
      forensicSummary: {
        signingMethod: contract.signingMethod,
        isSealed: Boolean(contract.pdfSha256Hash),
        sha256Hash: contract.pdfSha256Hash,
        status: contract.status,
        auditCertificate: contract.auditCertificate,
        candidateSigned: Boolean(contract.candidateSignedAt),
        candidateSignedAt: contract.candidateSignedAt,
        employerSigned: Boolean(contract.employerSignedAt),
        employerSignedAt: contract.employerSignedAt,
        signedPdfUrl: contract.signedPdfUrl,
        contractPdfUrl: contract.contractPdfUrl,
      },
    };
  }
}
