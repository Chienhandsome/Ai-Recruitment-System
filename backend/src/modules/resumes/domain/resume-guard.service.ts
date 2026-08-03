import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../../../database/prisma.service';

@Injectable()
export class ResumeGuardService {
  private readonly logger = new Logger(ResumeGuardService.name);

  constructor(private readonly prisma: PrismaService) {}

  async isPrimaryResume(
    resumeId: string,
    candidateProfileId: string,
  ): Promise<boolean> {
    const profile = await this.prisma.candidateProfile.findUnique({
      where: { id: candidateProfileId },
      select: { primaryResumeId: true },
    });

    return profile?.primaryResumeId === resumeId;
  }

  async canHydrate(
    resumeId: string,
    candidateProfileId: string,
  ): Promise<boolean> {
    if (await this.isPrimaryResume(resumeId, candidateProfileId)) {
      return true;
    }

    this.logger.warn(
      `Resume ${resumeId} is no longer primary for candidate ${candidateProfileId}; skipping hydration.`,
    );
    await this.prisma.resume.update({
      where: { id: resumeId },
      data: { parsingStatus: 'SUPERSEDED' },
    });
    return false;
  }
}
