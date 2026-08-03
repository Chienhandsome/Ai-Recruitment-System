import { Injectable, Logger } from '@nestjs/common';
import type { Prisma } from '@prisma/client';
import { PrismaService } from '../../../database/prisma.service';
import { ResumeGuardService } from '../domain/resume-guard.service';
import type { ParsedResumeData } from '../resume.types';
import { SkillResolverService } from './skill-resolver.service';
import { CertificateWriter } from './writers/certificate-writer';
import { EducationWriter } from './writers/education-writer';
import { ExperienceWriter } from './writers/experience-writer';
import { ProfileWriter } from './writers/profile-writer';
import { ProjectWriter } from './writers/project-writer';
import { SkillWriter } from './writers/skill-writer';

class StaleResumeHydrationError extends Error {}

@Injectable()
export class ResumeHydrationService {
  private readonly logger = new Logger(ResumeHydrationService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly guard: ResumeGuardService,
    private readonly skillResolver: SkillResolverService,
    private readonly experienceWriter: ExperienceWriter,
    private readonly educationWriter: EducationWriter,
    private readonly projectWriter: ProjectWriter,
    private readonly certificateWriter: CertificateWriter,
    private readonly skillWriter: SkillWriter,
    private readonly profileWriter: ProfileWriter,
  ) {}

  async hydrateProfile(
    resumeId: string,
    candidateProfileId: string,
    parsedData: ParsedResumeData,
  ): Promise<void> {
    this.logger.log(
      `Hydrating profile ${candidateProfileId} from resume ${resumeId}`,
    );

    if (!(await this.guard.canHydrate(resumeId, candidateProfileId))) {
      return;
    }

    // External lookups happen before the transaction so the transaction remains
    // a short, deterministic write boundary.
    const resolvedSkills = await this.skillResolver.resolveAll(
      parsedData.skills,
    );

    let hydrated: boolean;
    try {
      hydrated = await this.prisma.$transaction(
        async (tx) => {
          // Re-check inside the write transaction. A new resume can become primary
          // while skills are being resolved outside the transaction.
          const currentProfile = await tx.candidateProfile.findUnique({
            where: { id: candidateProfileId },
            select: { primaryResumeId: true },
          });
          if (currentProfile?.primaryResumeId !== resumeId) {
            await tx.resume.update({
              where: { id: resumeId },
              data: { parsingStatus: 'SUPERSEDED' },
            });
            return false;
          }

          await tx.resume.update({
            where: { id: resumeId },
            data: { parsingStatus: 'PARSED', parsingErrorMessage: null },
          });

          await this.writeParsedData(tx, resumeId, parsedData);
          await this.skillWriter.write(
            tx,
            candidateProfileId,
            resumeId,
            resolvedSkills,
          );
          await this.experienceWriter.write(
            tx,
            candidateProfileId,
            resumeId,
            parsedData.work_experiences,
          );
          await this.educationWriter.write(
            tx,
            candidateProfileId,
            resumeId,
            parsedData.educations,
          );
          await this.projectWriter.write(
            tx,
            candidateProfileId,
            resumeId,
            parsedData.projects,
          );
          await this.certificateWriter.write(
            tx,
            candidateProfileId,
            resumeId,
            parsedData.certificates,
          );
          const profileUpdated = await this.profileWriter.write(
            tx,
            candidateProfileId,
            resumeId,
            parsedData,
          );
          if (!profileUpdated) {
            throw new StaleResumeHydrationError();
          }
          return true;
        },
        { maxWait: 10_000, timeout: 30_000 },
      );
    } catch (error) {
      if (!(error instanceof StaleResumeHydrationError)) throw error;

      await this.prisma.resume.update({
        where: { id: resumeId },
        data: { parsingStatus: 'SUPERSEDED' },
      });
      hydrated = false;
    }

    if (!hydrated) {
      this.logger.warn(
        `Resume ${resumeId} became stale during hydration preparation; writes were skipped.`,
      );
      return;
    }

    this.logger.log(
      `Profile ${candidateProfileId} hydrated from resume ${resumeId}`,
    );
  }

  async handleFailure(
    resumeId: string,
    candidateProfileId: string,
    errorMessage: string,
  ): Promise<void> {
    this.logger.warn(`Resume ${resumeId} analysis failed: ${errorMessage}`);

    const profileUpdate = await this.prisma.$transaction(async (tx) => {
      await tx.resume.update({
        where: { id: resumeId },
        data: {
          parsingStatus: 'FAILED',
          parsingErrorMessage: errorMessage,
        },
      });

      return tx.candidateProfile.updateMany({
        where: { id: candidateProfileId, primaryResumeId: resumeId },
        data: { status: 'FAILED' },
      });
    });

    if (profileUpdate.count === 0) {
      this.logger.warn(
        `Resume ${resumeId} is stale; candidate ${candidateProfileId} remains unchanged.`,
      );
    }
  }

  private async writeParsedData(
    tx: Prisma.TransactionClient,
    resumeId: string,
    parsedData: ParsedResumeData,
  ): Promise<void> {
    const payload = {
      summary: parsedData.summary ?? null,
      totalYearsExperience: parsedData.total_years_experience ?? null,
      educationData: parsedData.educations as Prisma.InputJsonValue,
      experienceData: parsedData.work_experiences as Prisma.InputJsonValue,
      certificateData: parsedData.certificates as Prisma.InputJsonValue,
      projectData: parsedData.projects as Prisma.InputJsonValue,
      rawParsedJson: parsedData as unknown as Prisma.InputJsonValue,
    };

    await tx.resumeParsedData.upsert({
      where: { resumeId },
      create: { resumeId, ...payload },
      update: { ...payload, parsedAt: new Date() },
    });
  }
}
