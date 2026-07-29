import {
  BadRequestException,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';
import { SupabaseStorageService } from '../../infrastructure/supabase/supabase-storage.service';
import { RabbitMQService } from '../../infrastructure/rabbitmq/rabbitmq.service';
import { RABBITMQ_ROUTING_KEYS } from '../../infrastructure/rabbitmq/rabbitmq.constants';

@Injectable()
export class ResumesService {
  private readonly logger = new Logger(ResumesService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly storageService: SupabaseStorageService,
    private readonly rabbitMQService: RabbitMQService,
  ) {}

  /**
   * Upload a resume for the current candidate:
   * 1. Create Resume record (PENDING)
   * 2. Upload file to Supabase Storage
   * 3. Set as primary resume
   * 4. Publish analysis request to RabbitMQ
   * 5. Update status to PROCESSING
   */
  async uploadResume(
    userId: string,
    file: { buffer: Buffer; originalname: string; mimetype: string; size: number },
  ) {
    // 1. Get candidate profile
    const profile = await this.prisma.candidateProfile.findUnique({
      where: { userId },
    });

    if (!profile) {
      throw new NotFoundException(
        `Candidate profile for user ${userId} not found.`,
      );
    }

    // Validate file type
    const allowedMimes = [
      'application/pdf',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    ];
    if (!allowedMimes.includes(file.mimetype)) {
      throw new BadRequestException(
        'Chỉ chấp nhận file PDF hoặc DOCX.',
      );
    }

    // Validate file size (5MB)
    const maxSizeBytes = 5 * 1024 * 1024;
    if (file.size > maxSizeBytes) {
      throw new BadRequestException(
        'File vượt quá kích thước tối đa 5MB.',
      );
    }

    // 2. Create Resume record with PENDING status
    const resume = await this.prisma.resume.create({
      data: {
        candidateId: profile.id,
        source: 'CANDIDATE_UPLOAD',
        originalFileName: file.originalname,
        storageBucket: 'resumes',
        objectPath: '', // will update after upload
        mimeType: file.mimetype,
        fileSizeBytes: file.size,
        parsingStatus: 'PENDING',
      },
    });

    this.logger.log(
      `Resume ${resume.id} created for candidate ${profile.id} (PENDING)`,
    );

    try {
      // 3. Upload to Supabase Storage
      const uploadResult = await this.storageService.uploadCandidateResume(
        file.buffer,
        file.originalname,
        file.mimetype,
        {
          candidateProfileId: profile.id,
          resumeId: resume.id,
          fileName: file.originalname,
        },
      );

      // 4. Update objectPath on the resume record
      await this.prisma.resume.update({
        where: { id: resume.id },
        data: { objectPath: uploadResult.objectPath },
      });

      // 5. Set as primary resume + set profile status to PROCESSING
      await this.prisma.candidateProfile.update({
        where: { id: profile.id },
        data: {
          primaryResumeId: resume.id,
          status: 'PROCESSING',
        },
      });

      // 6. Publish analysis request to RabbitMQ
      const published = await this.rabbitMQService.publish(
        RABBITMQ_ROUTING_KEYS.RESUME_ANALYSIS_REQUESTED,
        {
          resumeId: resume.id,
          candidateProfileId: profile.id,
          objectPath: uploadResult.objectPath,
          mimeType: file.mimetype,
          originalFileName: file.originalname,
          requestedAt: new Date().toISOString(),
        },
      );

      if (published) {
        // 7. Update resume status to PROCESSING
        await this.prisma.resume.update({
          where: { id: resume.id },
          data: { parsingStatus: 'PROCESSING' },
        });

        this.logger.log(
          `Resume ${resume.id} uploaded and analysis requested via RabbitMQ`,
        );
      } else {
        this.logger.warn(
          `Resume ${resume.id} uploaded but RabbitMQ publish failed. Status remains PENDING.`,
        );
      }

      return {
        id: resume.id,
        originalFileName: resume.originalFileName,
        parsingStatus: published ? 'PROCESSING' : 'PENDING',
        createdAt: resume.createdAt,
      };
    } catch (error) {
      // If upload fails, mark resume as FAILED
      await this.prisma.resume.update({
        where: { id: resume.id },
        data: {
          parsingStatus: 'FAILED',
          parsingErrorMessage:
            error instanceof Error ? error.message : 'Upload failed',
        },
      });

      this.logger.error(
        `Resume ${resume.id} upload failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
      );

      throw new BadRequestException(
        'Không thể tải lên CV. Vui lòng thử lại.',
      );
    }
  }

  /**
   * Get the parsing status of a resume.
   * Only allows the owner to check their own resume.
   */
  async getResumeStatus(userId: string, resumeId: string) {
    const profile = await this.prisma.candidateProfile.findUnique({
      where: { userId },
    });

    if (!profile) {
      throw new NotFoundException('Candidate profile not found.');
    }

    const resume = await this.prisma.resume.findFirst({
      where: {
        id: resumeId,
        candidateId: profile.id,
      },
      select: {
        id: true,
        originalFileName: true,
        parsingStatus: true,
        parsingErrorMessage: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    if (!resume) {
      throw new NotFoundException(
        `Resume ${resumeId} not found.`,
      );
    }

    return resume;
  }

  /**
   * Get all resumes for the current candidate.
   */
  async getMyResumes(userId: string) {
    const profile = await this.prisma.candidateProfile.findUnique({
      where: { userId },
    });

    if (!profile) {
      throw new NotFoundException('Candidate profile not found.');
    }

    return this.prisma.resume.findMany({
      where: { candidateId: profile.id },
      select: {
        id: true,
        originalFileName: true,
        mimeType: true,
        fileSizeBytes: true,
        parsingStatus: true,
        parsingErrorMessage: true,
        createdAt: true,
        updatedAt: true,
      },
      orderBy: { createdAt: 'desc' },
    });
  }
}
