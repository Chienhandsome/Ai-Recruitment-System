import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';
import {
  ResumeUploadFile,
  UploadResumeUseCase,
} from './application/upload-resume.use-case';

@Injectable()
export class ResumesService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly uploadResumeUseCase: UploadResumeUseCase,
  ) {}

  /**
   * Upload a resume for the current candidate:
   * 1. Create Resume record (PENDING)
   * 2. Upload file to Supabase Storage
   * 3. Set as primary resume
   * 4. Publish analysis request to RabbitMQ
   * 5. Update status to PROCESSING
   */
  async uploadResume(userId: string, file: ResumeUploadFile) {
    return this.uploadResumeUseCase.execute(userId, file);
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
      throw new NotFoundException(`Resume ${resumeId} not found.`);
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
