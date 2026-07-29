import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';

/**
 * Payload shape from AI Service (resume.analysis.completed).
 */
export interface ParsedResumeData {
  summary?: string | null;
  desired_title?: string | null;
  total_years_experience?: number | null;
  skills: Array<{
    name: string;
    proficiency_level: 'BEGINNER' | 'INTERMEDIATE' | 'ADVANCED' | 'EXPERT';
    years_experience?: number | null;
  }>;
  work_experiences: Array<{
    company_name: string;
    position_title: string;
    start_date: string;
    end_date?: string | null;
    is_current: boolean;
    description?: string | null;
    achievements?: string | null;
  }>;
  educations: Array<{
    school_name: string;
    major?: string | null;
    degree?: string | null;
    start_date?: string | null;
    end_date?: string | null;
    description?: string | null;
  }>;
  projects: Array<{
    project_name: string;
    project_role?: string | null;
    description?: string | null;
    technologies?: string[] | null;
    project_url?: string | null;
    start_date?: string | null;
    end_date?: string | null;
  }>;
  certificates: Array<{
    certificate_name: string;
    issuing_organization: string;
    issue_date?: string | null;
    expiry_date?: string | null;
    credential_url?: string | null;
  }>;
}

@Injectable()
export class ResumeHydrationService {
  private readonly logger = new Logger(ResumeHydrationService.name);

  constructor(private readonly prisma: PrismaService) {}

  /**
   * Hydrate a candidate profile with parsed resume data.
   * This replaces EXTRACTED skills and all experience/education/project/certificate data.
   */
  async hydrateProfile(
    resumeId: string,
    candidateProfileId: string,
    parsedData: ParsedResumeData,
  ): Promise<void> {
    this.logger.log(
      `Hydrating profile ${candidateProfileId} from resume ${resumeId}`,
    );

    await this.prisma.$transaction(async (tx) => {
      // 1. Update Resume status → PARSED
      await tx.resume.update({
        where: { id: resumeId },
        data: { parsingStatus: 'PARSED' },
      });

      // 2. Save ResumeParsedData
      await tx.resumeParsedData.upsert({
        where: { resumeId },
        create: {
          resumeId,
          summary: parsedData.summary ?? null,
          totalYearsExperience: parsedData.total_years_experience ?? null,
          educationData: parsedData.educations as any,
          experienceData: parsedData.work_experiences as any,
          certificateData: parsedData.certificates as any,
          projectData: parsedData.projects as any,
          rawParsedJson: parsedData as any,
        },
        update: {
          summary: parsedData.summary ?? null,
          totalYearsExperience: parsedData.total_years_experience ?? null,
          educationData: parsedData.educations as any,
          experienceData: parsedData.work_experiences as any,
          certificateData: parsedData.certificates as any,
          projectData: parsedData.projects as any,
          rawParsedJson: parsedData as any,
          parsedAt: new Date(),
        },
      });

      // 3. Upsert CandidateSkills (source = EXTRACTED)
      // First remove old EXTRACTED skills from this resume
      await tx.candidateSkill.deleteMany({
        where: {
          candidateId: candidateProfileId,
          source: 'EXTRACTED',
          resumeId,
        },
      });

      for (const skill of parsedData.skills) {
        const dbSkill = await this.findOrCreateSkill(tx, skill.name);
        if (!dbSkill) continue;

        await tx.candidateSkill.upsert({
          where: {
            candidateId_skillId: {
              candidateId: candidateProfileId,
              skillId: dbSkill.id,
            },
          },
          create: {
            candidateId: candidateProfileId,
            skillId: dbSkill.id,
            resumeId,
            proficiencyLevel: skill.proficiency_level,
            yearsExperience: skill.years_experience ?? null,
            isPrimary: false,
            source: 'EXTRACTED',
          },
          update: {
            proficiencyLevel: skill.proficiency_level,
            yearsExperience: skill.years_experience ?? null,
            resumeId,
            source: 'EXTRACTED',
          },
        });
      }

      // 4. Replace WorkExperiences
      await tx.workExperience.deleteMany({
        where: { candidateProfileId },
      });
      if (parsedData.work_experiences.length > 0) {
        await tx.workExperience.createMany({
          data: parsedData.work_experiences.map((exp) => ({
            candidateProfileId,
            companyName: exp.company_name,
            positionTitle: exp.position_title,
            startDate: new Date(exp.start_date),
            endDate: exp.end_date ? new Date(exp.end_date) : null,
            isCurrent: exp.is_current,
            description: exp.description ?? null,
            achievements: exp.achievements ?? null,
          })),
        });
      }

      // 5. Replace Educations
      await tx.education.deleteMany({
        where: { candidateProfileId },
      });
      if (parsedData.educations.length > 0) {
        await tx.education.createMany({
          data: parsedData.educations.map((edu) => ({
            candidateProfileId,
            schoolName: edu.school_name,
            major: edu.major ?? null,
            degree: edu.degree ?? null,
            startDate: edu.start_date ? new Date(edu.start_date) : null,
            endDate: edu.end_date ? new Date(edu.end_date) : null,
            description: edu.description ?? null,
          })),
        });
      }

      // 6. Replace Projects
      await tx.project.deleteMany({
        where: { candidateProfileId },
      });
      if (parsedData.projects.length > 0) {
        await tx.project.createMany({
          data: parsedData.projects.map((proj) => ({
            candidateProfileId,
            projectName: proj.project_name,
            projectRole: proj.project_role ?? null,
            description: proj.description ?? null,
            technologies: (proj.technologies ?? undefined) as any,
            projectUrl: proj.project_url ?? null,
            startDate: proj.start_date ? new Date(proj.start_date) : null,
            endDate: proj.end_date ? new Date(proj.end_date) : null,
          })),
        });
      }

      // 7. Replace Certificates
      await tx.certificate.deleteMany({
        where: { candidateProfileId },
      });
      if (parsedData.certificates.length > 0) {
        await tx.certificate.createMany({
          data: parsedData.certificates.map((cert) => ({
            candidateProfileId,
            certificateName: cert.certificate_name,
            issuingOrganization: cert.issuing_organization || 'Unknown',
            issueDate: cert.issue_date ? new Date(cert.issue_date) : null,
            expiryDate: cert.expiry_date ? new Date(cert.expiry_date) : null,
            credentialUrl: cert.credential_url ?? null,
          })),
        });
      }

      // 8. Update CandidateProfile → READY
      await tx.candidateProfile.update({
        where: { id: candidateProfileId },
        data: {
          status: 'READY',
          professionalSummary: parsedData.summary ?? undefined,
          desiredTitle: parsedData.desired_title ?? undefined,
        },
      });
    });

    this.logger.log(
      `Profile ${candidateProfileId} hydrated: ` +
        `${parsedData.skills.length} skills, ` +
        `${parsedData.work_experiences.length} experiences, ` +
        `${parsedData.educations.length} educations, ` +
        `${parsedData.projects.length} projects, ` +
        `${parsedData.certificates.length} certificates`,
    );
  }

  /**
   * Handle failed analysis — mark resume and profile as FAILED.
   */
  async handleFailure(
    resumeId: string,
    candidateProfileId: string,
    errorMessage: string,
  ): Promise<void> {
    this.logger.warn(
      `Resume ${resumeId} analysis failed: ${errorMessage}`,
    );

    await this.prisma.resume.update({
      where: { id: resumeId },
      data: {
        parsingStatus: 'FAILED',
        parsingErrorMessage: errorMessage,
      },
    });

    await this.prisma.candidateProfile.update({
      where: { id: candidateProfileId },
      data: { status: 'FAILED' },
    });
  }

  /**
   * Find an existing skill by normalized name, or create a new one.
   * Uses the default IT category for auto-created skills.
   */
  private async findOrCreateSkill(
    tx: Parameters<Parameters<PrismaService['$transaction']>[0]>[0],
    skillName: string,
  ) {
    const trimmed = skillName.trim();
    if (!trimmed) return null;

    const normalized = trimmed.toLowerCase().replace(/[^a-z0-9]+/g, '-');

    // Try to find existing skill
    const existing = await tx.skill.findFirst({
      where: {
        OR: [
          { normalizedName: normalized },
          { name: { equals: trimmed, mode: 'insensitive' } },
        ],
      },
    });

    if (existing) return existing;

    // Need a category — get or create default
    const defaultCategory = await this.getOrCreateDefaultCategory(tx);

    // Create new skill
    try {
      return await tx.skill.create({
        data: {
          name: trimmed,
          normalizedName: normalized,
          categoryId: defaultCategory.id,
          type: 'HARD',
          status: 'ACTIVE',
        },
      });
    } catch {
      // Race condition: another process created it — find again
      return tx.skill.findFirst({
        where: { normalizedName: normalized },
      });
    }
  }

  private async getOrCreateDefaultCategory(
    tx: Parameters<Parameters<PrismaService['$transaction']>[0]>[0],
  ) {
    const existing = await tx.skillCategory.findFirst({
      where: { name: 'Công nghệ thông tin (IT)' },
    });
    if (existing) return existing;

    // Fallback: get any category
    const any = await tx.skillCategory.findFirst();
    if (any) return any;

    // Last resort: create one
    return tx.skillCategory.create({
      data: { name: 'Công nghệ thông tin (IT)' },
    });
  }
}
