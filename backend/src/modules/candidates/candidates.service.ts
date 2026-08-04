import {
  ForbiddenException,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';
import { CandidateProfileStatus, SkillSource } from '@prisma/client';
import { UpdateCandidateSkillsDto } from './dto/update-candidate-skills.dto';
import { UpdateCandidateProfileDto } from './dto/update-candidate-profile.dto';

/**
 * Resolved candidate profile DTO that merges data from User and CandidateProfile.
 *
 * When a profile is linked to a user account (userId != null), personal info
 * (fullName, email, phone) is sourced from the User table as the single source of truth.
 * Profile-level fields act as overrides only for anonymous/HR-uploaded profiles.
 */
export interface ResolvedCandidateProfile {
  id: string;
  userId: string | null;
  status: CandidateProfileStatus;

  // Personal info — resolved from User when linked, otherwise from profile
  fullName: string;
  email: string;
  phone: string | null;

  // Profile-specific fields
  address: string | null;
  desiredTitle: string | null;
  professionalSummary: string | null;
  linkedinUrl: string | null;
  githubUrl: string | null;
  portfolioUrl: string | null;
  primaryResumeId: string | null;

  createdAt: Date;
  updatedAt: Date;
}

@Injectable()
export class CandidatesService {
  private readonly logger = new Logger(CandidatesService.name);

  constructor(private readonly prisma: PrismaService) {}

  /**
   * Get a candidate profile by ID with deduplicated personal info.
   * When the profile is linked to a User, fullName/email/phone come from the User table.
   */
  async getResolvedProfile(
    candidateProfileId: string,
  ): Promise<ResolvedCandidateProfile> {
    const profile = await this.prisma.candidateProfile.findUnique({
      where: { id: candidateProfileId },
      include: { user: true },
    });

    if (!profile) {
      throw new NotFoundException(
        `Candidate profile ${candidateProfileId} not found.`,
      );
    }

    return this.resolveProfile(profile);
  }

  /**
   * Get a candidate profile by userId with deduplicated personal info.
   */
  async getResolvedProfileByUserId(
    userId: string,
  ): Promise<ResolvedCandidateProfile> {
    const profile = await this.prisma.candidateProfile.findUnique({
      where: { userId },
      include: { user: true },
    });

    if (!profile) {
      throw new NotFoundException(
        `Candidate profile for user ${userId} not found.`,
      );
    }

    return this.resolveProfile(profile);
  }

  /**
   * Update the profile status (EMPTY → PROCESSING → READY / FAILED).
   */
  async updateProfileStatus(
    candidateProfileId: string,
    status: CandidateProfileStatus,
  ): Promise<void> {
    await this.prisma.candidateProfile.update({
      where: { id: candidateProfileId },
      data: { status },
    });

    this.logger.log(
      `CandidateProfile ${candidateProfileId} status updated to ${status}`,
    );
  }

  /**
   * Set the primary resume for a candidate profile.
   * Validates that the resume belongs to the candidate.
   */
  async setPrimaryResume(
    candidateProfileId: string,
    resumeId: string,
  ): Promise<void> {
    // Verify resume belongs to this candidate
    const resume = await this.prisma.resume.findFirst({
      where: { id: resumeId, candidateId: candidateProfileId },
    });

    if (!resume) {
      throw new NotFoundException(
        `Resume ${resumeId} not found or does not belong to candidate ${candidateProfileId}.`,
      );
    }

    await this.prisma.candidateProfile.update({
      where: { id: candidateProfileId },
      data: { primaryResumeId: resumeId },
    });

    this.logger.log(
      `CandidateProfile ${candidateProfileId} primary resume set to ${resumeId}`,
    );
  }

  // ─── Profile Update ─────────────────────────────────────────────────

  /**
   * Update candidate profile info and optionally the linked User's name/phone.
   */
  async updateProfile(userId: string, dto: UpdateCandidateProfileDto) {
    const profile = await this.prisma.candidateProfile.findUnique({
      where: { userId },
    });

    if (!profile) {
      throw new NotFoundException(
        `Candidate profile for user ${userId} not found.`,
      );
    }

    // Update user-level fields (fullName, phone) on the User table
    if (dto.fullName || dto.phone !== undefined) {
      const userData: Record<string, unknown> = {};
      if (dto.fullName) userData.fullName = dto.fullName;
      if (dto.phone !== undefined) userData.phone = dto.phone || null;

      await this.prisma.user.update({
        where: { id: userId },
        data: userData,
      });
    }

    // Update candidate profile fields
    const profileData: Record<string, unknown> = {};
    if (dto.fullName) profileData.fullName = dto.fullName;
    if (dto.phone !== undefined) profileData.phone = dto.phone || null;
    if (dto.address !== undefined) profileData.address = dto.address || null;
    if (dto.desiredTitle !== undefined)
      profileData.desiredTitle = dto.desiredTitle || null;
    if (dto.professionalSummary !== undefined)
      profileData.professionalSummary = dto.professionalSummary || null;
    if (dto.linkedinUrl !== undefined)
      profileData.linkedinUrl = dto.linkedinUrl || null;
    if (dto.githubUrl !== undefined)
      profileData.githubUrl = dto.githubUrl || null;
    if (dto.portfolioUrl !== undefined)
      profileData.portfolioUrl = dto.portfolioUrl || null;

    const updated = await this.prisma.$transaction(async (tx) => {
      // 1. Update Profile scalars
      const p = await tx.candidateProfile.update({
        where: { id: profile.id },
        data: profileData,
      });

      // 2. Update Work Experiences if provided
      if (Array.isArray(dto.workExperiences)) {
        const requestedExtractedIds = dto.workExperiences
          .filter((item) => item.source === 'EXTRACTED' && item.id)
          .map((item) => item.id!);
        const preservedExtractedIds = new Set(
          (
            await tx.workExperience.findMany({
              where: {
                candidateProfileId: profile.id,
                source: 'EXTRACTED',
                id: { in: requestedExtractedIds },
              },
              select: { id: true },
            })
          ).map((item) => item.id),
        );
        await tx.workExperience.deleteMany({
          where: {
            candidateProfileId: profile.id,
            OR: [
              { source: 'MANUAL' },
              {
                source: 'EXTRACTED',
                ...(preservedExtractedIds.size > 0
                  ? { id: { notIn: [...preservedExtractedIds] } }
                  : {}),
              },
            ],
          },
        });
        const manualExperiences = dto.workExperiences.filter(
          (item) => !item.id || !preservedExtractedIds.has(item.id),
        );
        if (manualExperiences.length > 0) {
          await tx.workExperience.createMany({
            data: manualExperiences.map((exp) => ({
              candidateProfileId: profile.id,
              source: 'MANUAL',
              resumeId: null,
              companyName: exp.companyName,
              positionTitle: exp.positionTitle,
              startDate: exp.startDate ? new Date(exp.startDate) : new Date(),
              endDate: exp.endDate ? new Date(exp.endDate) : null,
              isCurrent: exp.isCurrent ?? false,
              description: exp.description || null,
              achievements: exp.achievements || null,
            })),
          });
        }
      }

      // 3. Update Educations if provided
      if (Array.isArray(dto.educations)) {
        const requestedExtractedIds = dto.educations
          .filter((item) => item.source === 'EXTRACTED' && item.id)
          .map((item) => item.id!);
        const preservedExtractedIds = new Set(
          (
            await tx.education.findMany({
              where: {
                candidateProfileId: profile.id,
                source: 'EXTRACTED',
                id: { in: requestedExtractedIds },
              },
              select: { id: true },
            })
          ).map((item) => item.id),
        );
        await tx.education.deleteMany({
          where: {
            candidateProfileId: profile.id,
            OR: [
              { source: 'MANUAL' },
              {
                source: 'EXTRACTED',
                ...(preservedExtractedIds.size > 0
                  ? { id: { notIn: [...preservedExtractedIds] } }
                  : {}),
              },
            ],
          },
        });
        const manualEducations = dto.educations.filter(
          (item) => !item.id || !preservedExtractedIds.has(item.id),
        );
        if (manualEducations.length > 0) {
          await tx.education.createMany({
            data: manualEducations.map((edu) => ({
              candidateProfileId: profile.id,
              source: 'MANUAL',
              resumeId: null,
              schoolName: edu.schoolName,
              major: edu.major || null,
              degree: edu.degree || null,
              startDate: edu.startDate ? new Date(edu.startDate) : null,
              endDate: edu.endDate ? new Date(edu.endDate) : null,
            })),
          });
        }
      }

      // 4. Update Projects if provided
      if (Array.isArray(dto.projects)) {
        const requestedExtractedIds = dto.projects
          .filter((item) => item.source === 'EXTRACTED' && item.id)
          .map((item) => item.id!);
        const preservedExtractedIds = new Set(
          (
            await tx.project.findMany({
              where: {
                candidateProfileId: profile.id,
                source: 'EXTRACTED',
                id: { in: requestedExtractedIds },
              },
              select: { id: true },
            })
          ).map((item) => item.id),
        );
        await tx.project.deleteMany({
          where: {
            candidateProfileId: profile.id,
            OR: [
              { source: 'MANUAL' },
              {
                source: 'EXTRACTED',
                ...(preservedExtractedIds.size > 0
                  ? { id: { notIn: [...preservedExtractedIds] } }
                  : {}),
              },
            ],
          },
        });
        const manualProjects = dto.projects.filter(
          (item) => !item.id || !preservedExtractedIds.has(item.id),
        );
        if (manualProjects.length > 0) {
          await tx.project.createMany({
            data: manualProjects.map((proj) => {
              let techs: string[] | null = null;
              if (Array.isArray(proj.technologies)) {
                techs = proj.technologies;
              } else if (typeof proj.technologies === 'string') {
                techs = proj.technologies
                  .split(',')
                  .map((t) => t.trim())
                  .filter(Boolean);
              }

              return {
                candidateProfileId: profile.id,
                source: 'MANUAL' as const,
                resumeId: null,
                projectName: proj.projectName,
                projectRole: proj.projectRole || null,
                description: proj.description || null,
                technologies: techs ?? undefined,
                projectUrl: proj.projectUrl || null,
                startDate: proj.startDate ? new Date(proj.startDate) : null,
                endDate: proj.endDate ? new Date(proj.endDate) : null,
              };
            }),
          });
        }
      }

      // 5. Update Certificates if provided
      if (Array.isArray(dto.certificates)) {
        const requestedExtractedIds = dto.certificates
          .filter((item) => item.source === 'EXTRACTED' && item.id)
          .map((item) => item.id!);
        const preservedExtractedIds = new Set(
          (
            await tx.certificate.findMany({
              where: {
                candidateProfileId: profile.id,
                source: 'EXTRACTED',
                id: { in: requestedExtractedIds },
              },
              select: { id: true },
            })
          ).map((item) => item.id),
        );
        await tx.certificate.deleteMany({
          where: {
            candidateProfileId: profile.id,
            OR: [
              { source: 'MANUAL' },
              {
                source: 'EXTRACTED',
                ...(preservedExtractedIds.size > 0
                  ? { id: { notIn: [...preservedExtractedIds] } }
                  : {}),
              },
            ],
          },
        });
        const manualCertificates = dto.certificates.filter(
          (item) => !item.id || !preservedExtractedIds.has(item.id),
        );
        if (manualCertificates.length > 0) {
          await tx.certificate.createMany({
            data: manualCertificates.map((cert) => ({
              candidateProfileId: profile.id,
              source: 'MANUAL',
              resumeId: null,
              certificateName: cert.certificateName,
              issuingOrganization: cert.issuingOrganization || 'Unknown',
              issueDate: cert.issueDate ? new Date(cert.issueDate) : null,
            })),
          });
        }
      }

      return p;
    });

    this.logger.log(`CandidateProfile ${profile.id} updated by user ${userId}`);
    return updated;
  }

  // ─── Candidate Skills ────────────────────────────────────────────────

  /**
   * Get all skills for a candidate, including skill details and category.
   */
  async getCandidateSkills(candidateProfileId: string) {
    return this.prisma.candidateSkill.findMany({
      where: { candidateId: candidateProfileId },
      include: {
        skill: {
          include: { category: true },
        },
      },
      orderBy: [{ isPrimary: 'desc' }, { createdAt: 'desc' }],
    });
  }

  /**
   * Save the candidate's effective skill list.
   *
   * Unchanged EXTRACTED rows keep their CV evidence. Once the candidate edits
   * an extracted skill, that row becomes SELF_DECLARED so future CV hydration
   * cannot overwrite the user's correction. VERIFIED rows are always protected.
   */
  async updateCandidateSkills(
    candidateProfileId: string,
    dto: UpdateCandidateSkillsDto,
  ) {
    // Verify candidate exists
    const profile = await this.prisma.candidateProfile.findUnique({
      where: { id: candidateProfileId },
    });

    if (!profile) {
      throw new NotFoundException(
        `Candidate profile ${candidateProfileId} not found.`,
      );
    }

    const submittedSkills = [
      ...new Map(dto.skills.map((skill) => [skill.skillId, skill])).values(),
    ];
    const submittedSkillIds = submittedSkills.map((skill) => skill.skillId);

    await this.prisma.$transaction(async (tx) => {
      const existingSkills = await tx.candidateSkill.findMany({
        where: { candidateId: candidateProfileId },
        select: {
          skillId: true,
          proficiencyLevel: true,
          isPrimary: true,
          source: true,
        },
      });
      const existingBySkillId = new Map(
        existingSkills.map((skill) => [skill.skillId, skill]),
      );

      // Missing editable rows were removed from the unified editor. VERIFIED
      // rows remain even if a stale or malicious client omits them.
      await tx.candidateSkill.deleteMany({
        where: {
          candidateId: candidateProfileId,
          source: {
            in: [SkillSource.EXTRACTED, SkillSource.SELF_DECLARED],
          },
          skillId: { notIn: submittedSkillIds },
        },
      });

      for (const skillItem of submittedSkills) {
        const existing = existingBySkillId.get(skillItem.skillId);
        const isPrimary = skillItem.isPrimary ?? false;

        if (existing?.source === SkillSource.VERIFIED) continue;

        const unchangedExtractedSkill =
          existing?.source === SkillSource.EXTRACTED &&
          existing.proficiencyLevel === skillItem.proficiencyLevel &&
          existing.isPrimary === isPrimary;
        if (unchangedExtractedSkill) continue;

        await tx.candidateSkill.upsert({
          where: {
            candidateId_skillId: {
              candidateId: candidateProfileId,
              skillId: skillItem.skillId,
            },
          },
          update: {
            proficiencyLevel: skillItem.proficiencyLevel,
            isPrimary,
            source: SkillSource.SELF_DECLARED,
            resumeId: null,
            isInferred: false,
            sourceText: null,
          },
          create: {
            candidateId: candidateProfileId,
            skillId: skillItem.skillId,
            proficiencyLevel: skillItem.proficiencyLevel,
            isPrimary,
            source: SkillSource.SELF_DECLARED,
          },
        });
      }
    });

    this.logger.log(
      `CandidateProfile ${candidateProfileId}: saved ${submittedSkills.length} skills`,
    );

    return this.getCandidateSkills(candidateProfileId);
  }

  /**
   * Remove a single skill from a candidate's profile.
   * Candidate-owned and AI-extracted skills can be removed. VERIFIED skills
   * are protected because their provenance is managed outside this editor.
   */
  async removeCandidateSkill(
    candidateProfileId: string,
    skillId: string,
  ): Promise<void> {
    const existing = await this.prisma.candidateSkill.findUnique({
      where: {
        candidateId_skillId: {
          candidateId: candidateProfileId,
          skillId,
        },
      },
    });

    if (!existing) {
      throw new NotFoundException(
        `Skill ${skillId} not found on candidate profile ${candidateProfileId}.`,
      );
    }

    if (existing.source === SkillSource.VERIFIED) {
      throw new ForbiddenException(
        'Verified skills cannot be removed by the candidate.',
      );
    }

    await this.prisma.candidateSkill.delete({
      where: {
        candidateId_skillId: {
          candidateId: candidateProfileId,
          skillId,
        },
      },
    });

    this.logger.log(
      `CandidateProfile ${candidateProfileId}: removed skill ${skillId}`,
    );
  }

  // ─── Private Helpers ────────────────────────────────────────────────

  /**
   * Resolve personal info from User table when available, falling back to profile fields.
   * This implements the service-layer deduplication: User is the source of truth for
   * registered candidates, while profile fields serve anonymous/HR-uploaded candidates.
   */
  private resolveProfile(profile: {
    id: string;
    userId: string | null;
    status: CandidateProfileStatus;
    fullName: string;
    email: string;
    phone: string | null;
    address: string | null;
    desiredTitle: string | null;
    professionalSummary: string | null;
    linkedinUrl: string | null;
    githubUrl: string | null;
    portfolioUrl: string | null;
    primaryResumeId: string | null;
    createdAt: Date;
    updatedAt: Date;
    user: {
      fullName: string;
      email: string;
      phone: string | null;
    } | null;
  }): ResolvedCandidateProfile {
    const hasLinkedUser = profile.user !== null;

    return {
      id: profile.id,
      userId: profile.userId,
      status: profile.status,

      // Deduplication: prefer User data when linked
      fullName: hasLinkedUser ? profile.user!.fullName : profile.fullName,
      email: hasLinkedUser ? profile.user!.email : profile.email,
      phone: hasLinkedUser ? profile.user!.phone : profile.phone,

      // Profile-specific fields (no dedup needed)
      address: profile.address,
      desiredTitle: profile.desiredTitle,
      professionalSummary: profile.professionalSummary,
      linkedinUrl: profile.linkedinUrl,
      githubUrl: profile.githubUrl,
      portfolioUrl: profile.portfolioUrl,
      primaryResumeId: profile.primaryResumeId,

      createdAt: profile.createdAt,
      updatedAt: profile.updatedAt,
    };
  }
}
