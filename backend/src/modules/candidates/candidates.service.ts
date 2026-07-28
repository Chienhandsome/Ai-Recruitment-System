import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';
import { CandidateProfileStatus, SkillSource } from '@prisma/client';
import { UpdateCandidateSkillsDto } from './dto/update-candidate-skills.dto';

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
   * Replace all SELF_DECLARED skills for a candidate.
   * Skills that were EXTRACTED from CV parsing are preserved.
   * Uses upsert to handle the unique [candidateId, skillId] constraint.
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

    await this.prisma.$transaction(async (tx) => {
      // 1. Remove all existing SELF_DECLARED skills that are NOT in the new list
      //    This allows upsert to handle skills that remain
      await tx.candidateSkill.deleteMany({
        where: {
          candidateId: candidateProfileId,
          source: SkillSource.SELF_DECLARED,
          skillId: { notIn: dto.skills.map((s) => s.skillId) },
        },
      });

      // 2. Upsert each skill in the new list
      for (const skillItem of dto.skills) {
        await tx.candidateSkill.upsert({
          where: {
            candidateId_skillId: {
              candidateId: candidateProfileId,
              skillId: skillItem.skillId,
            },
          },
          update: {
            proficiencyLevel: skillItem.proficiencyLevel,
            yearsExperience: skillItem.yearsExperience ?? null,
            isPrimary: skillItem.isPrimary ?? false,
            source: SkillSource.SELF_DECLARED,
          },
          create: {
            candidateId: candidateProfileId,
            skillId: skillItem.skillId,
            proficiencyLevel: skillItem.proficiencyLevel,
            yearsExperience: skillItem.yearsExperience ?? null,
            isPrimary: skillItem.isPrimary ?? false,
            source: SkillSource.SELF_DECLARED,
          },
        });
      }
    });

    this.logger.log(
      `CandidateProfile ${candidateProfileId}: updated ${dto.skills.length} SELF_DECLARED skills`,
    );

    return this.getCandidateSkills(candidateProfileId);
  }

  /**
   * Remove a single skill from a candidate's profile.
   * Only SELF_DECLARED skills can be removed by the candidate.
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

    if (existing.source !== SkillSource.SELF_DECLARED) {
      throw new NotFoundException(
        `Only self-declared skills can be removed. This skill was ${existing.source}.`,
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
  private resolveProfile(
    profile: {
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
    },
  ): ResolvedCandidateProfile {
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
