import {
  BadRequestException,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../../../database/prisma.service';
import { RabbitMQService } from '../../../infrastructure/rabbitmq/rabbitmq.service';
import { RABBITMQ_ROUTING_KEYS } from '../../../infrastructure/rabbitmq/rabbitmq.constants';
import { SupabaseStorageService } from '../../../infrastructure/supabase/supabase-storage.service';

export interface ResumeUploadFile {
  buffer: Buffer;
  originalname: string;
  mimetype: string;
  size: number;
}

@Injectable()
export class UploadResumeUseCase {
  private readonly logger = new Logger(UploadResumeUseCase.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly storageService: SupabaseStorageService,
    private readonly rabbitMQService: RabbitMQService,
  ) {}

  async execute(userId: string, file: ResumeUploadFile) {
    const profile = await this.prisma.candidateProfile.findUnique({
      where: { userId },
    });
    if (!profile) {
      throw new NotFoundException(
        `Candidate profile for user ${userId} not found.`,
      );
    }

    this.validateFile(file);

    const resume = await this.prisma.resume.create({
      data: {
        candidateId: profile.id,
        source: 'CANDIDATE_UPLOAD',
        originalFileName: file.originalname,
        storageBucket: 'resumes',
        objectPath: '',
        mimeType: file.mimetype,
        fileSizeBytes: file.size,
        parsingStatus: 'PENDING',
      },
    });

    try {
      const upload = await this.storageService.uploadCandidateResume(
        file.buffer,
        file.originalname,
        file.mimetype,
        {
          candidateProfileId: profile.id,
          resumeId: resume.id,
          fileName: file.originalname,
        },
      );

      await this.prisma.resume.update({
        where: { id: resume.id },
        data: { objectPath: upload.objectPath },
      });

      // The primary pointer must be visible before a fast worker result arrives,
      // but PROCESSING is only valid once the request was actually published.
      await this.prisma.candidateProfile.update({
        where: { id: profile.id },
        data: { primaryResumeId: resume.id },
      });

      const published = await this.rabbitMQService.publish(
        RABBITMQ_ROUTING_KEYS.RESUME_ANALYSIS_REQUESTED,
        {
          resumeId: resume.id,
          candidateProfileId: profile.id,
          objectPath: upload.objectPath,
          mimeType: file.mimetype,
          originalFileName: file.originalname,
          requestedAt: new Date().toISOString(),
        },
      );

      if (published) {
        try {
          await this.prisma.$transaction([
            this.prisma.resume.update({
              where: { id: resume.id },
              data: { parsingStatus: 'PROCESSING' },
            }),
            this.prisma.candidateProfile.update({
              where: { id: profile.id },
              data: { status: 'PROCESSING' },
            }),
          ]);
        } catch (statusError) {
          // The message is already durably published. Do not mark the resume as
          // FAILED: the worker can still complete it and hydration is idempotent.
          this.logger.error(
            `Resume ${resume.id} was queued but status update failed: ${
              statusError instanceof Error
                ? statusError.message
                : 'Unknown error'
            }`,
          );
          return {
            id: resume.id,
            originalFileName: resume.originalFileName,
            parsingStatus: 'PENDING',
            createdAt: resume.createdAt,
            warning: 'CV đã vào hàng đợi nhưng trạng thái đang được đồng bộ.',
          };
        }
      } else {
        this.logger.warn(
          `Resume ${resume.id} is stored as PENDING because publish failed.`,
        );
      }

      return {
        id: resume.id,
        originalFileName: resume.originalFileName,
        parsingStatus: published ? 'PROCESSING' : 'PENDING',
        createdAt: resume.createdAt,
        ...(!published && {
          warning: 'CV đã được lưu nhưng chưa thể đưa vào hàng đợi xử lý.',
        }),
      };
    } catch (error) {
      await this.prisma.resume.update({
        where: { id: resume.id },
        data: {
          parsingStatus: 'FAILED',
          parsingErrorMessage:
            error instanceof Error ? error.message : 'Upload failed',
        },
      });

      this.logger.error(
        `Resume ${resume.id} upload failed: ${
          error instanceof Error ? error.message : 'Unknown error'
        }`,
      );
      throw new BadRequestException('Không thể tải lên CV. Vui lòng thử lại.');
    }
  }

  private validateFile(file: ResumeUploadFile): void {
    const allowedMimes = new Set([
      'application/pdf',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    ]);
    if (!allowedMimes.has(file.mimetype)) {
      throw new BadRequestException('Chỉ chấp nhận file PDF hoặc DOCX.');
    }

    if (file.size > 5 * 1024 * 1024) {
      throw new BadRequestException('File vượt quá kích thước tối đa 5MB.');
    }
  }
}
