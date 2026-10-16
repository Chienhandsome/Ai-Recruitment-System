import type { Prisma } from '@prisma/client';
import {
  APPLICATION_SNAPSHOT_VERSION,
  type ApplicationEvaluationInput,
  type ApplicationProfileSnapshot,
} from '../applications/application-evaluation.snapshot';

export const evaluationCandidateInclude = {
  workExperiences: true,
  educations: true,
  projects: true,
  certificates: true,
  candidateSkills: { include: { skill: true } },
} satisfies Prisma.CandidateProfileInclude;

export const evaluationJobInclude = {
  jobSkills: { include: { skill: true } },
  jobCertificates: true,
} satisfies Prisma.JobPostingInclude;

export const evaluationResumeSelect = {
  id: true,
  candidateId: true,
  source: true,
  originalFileName: true,
  mimeType: true,
  fileSizeBytes: true,
  parsingStatus: true,
  createdAt: true,
  parsedData: {
    select: {
      languageData: true,
    },
  },
} satisfies Prisma.ResumeSelect;

export type EvaluationCandidateProfile = Prisma.CandidateProfileGetPayload<{
  include: typeof evaluationCandidateInclude;
}>;
export type EvaluationJobPosting = Prisma.JobPostingGetPayload<{
  include: typeof evaluationJobInclude;
}>;
export type EvaluationResume = Prisma.ResumeGetPayload<{
  select: typeof evaluationResumeSelect;
}>;

export type EvaluationRequestPayload = {
  application_id: string;
  schema_version: number;
  evaluation_date: string;
  candidate_profile: Record<string, unknown>;
  job: Record<string, unknown>;
  weights: {
    skills: number;
    experience: number;
    education: number;
    other: number;
  };
};

/**
 * Shared builder for HR apply snapshots and Candidate CV–JD Fit HTTP payloads.
 * HR path keeps candidate-level relations unfiltered (historical behavior).
 * Candidate path should call {@link scopeCandidateProfileToResume} first.
 *
 * Limitation: experiences/skills/etc. may be stored at candidate level with
 * `resumeId = null` (manual edits). Those are included for both paths when present.
 */
export class EvaluationPayloadBuilder {
  buildProfileSnapshot(
    profile: EvaluationCandidateProfile,
    resume: EvaluationResume,
    job: EvaluationJobPosting,
    capturedAt: Date,
  ): ApplicationProfileSnapshot {
    const evaluationInput = this.buildEvaluationInput(
      profile,
      resume,
      job,
      capturedAt,
    );

    return {
      schemaVersion: APPLICATION_SNAPSHOT_VERSION,
      capturedAt: capturedAt.toISOString(),
      candidateIdentity: {
        id: profile.id,
        userId: profile.userId,
        fullName: profile.fullName,
        email: profile.email,
        phone: profile.phone,
      },
      resume: {
        id: resume.id,
        source: resume.source,
        originalFileName: resume.originalFileName,
        mimeType: resume.mimeType,
        fileSizeBytes: resume.fileSizeBytes,
        parsingStatus: resume.parsingStatus,
        createdAt: resume.createdAt.toISOString(),
      },
      evaluationInput,
    };
  }

  buildEvaluationRequest(params: {
    applicationId: string;
    profile: EvaluationCandidateProfile;
    resume: EvaluationResume;
    job: EvaluationJobPosting;
    capturedAt?: Date;
    schemaVersion?: number;
  }): EvaluationRequestPayload {
    const capturedAt = params.capturedAt ?? new Date();
    const evaluationInput = this.buildEvaluationInput(
      params.profile,
      params.resume,
      params.job,
      capturedAt,
    );

    return {
      application_id: params.applicationId,
      schema_version: params.schemaVersion ?? APPLICATION_SNAPSHOT_VERSION,
      evaluation_date: capturedAt.toISOString(),
      candidate_profile: evaluationInput.candidate_profile,
      job: evaluationInput.job,
      weights: evaluationInput.weights as EvaluationRequestPayload['weights'],
    };
  }

  /**
   * Keep rows for the selected resume and candidate-level rows without resumeId.
   * Drops rows stamped with a different resumeId to avoid mixing CVs.
   */
  scopeCandidateProfileToResume(
    profile: EvaluationCandidateProfile,
    resumeId: string,
  ): EvaluationCandidateProfile {
    const keep = <T extends { resumeId?: string | null }>(rows: T[]): T[] =>
      rows.filter((row) => !row.resumeId || row.resumeId === resumeId);

    return {
      ...profile,
      workExperiences: keep(profile.workExperiences),
      educations: keep(profile.educations),
      projects: keep(profile.projects),
      certificates: keep(profile.certificates),
      candidateSkills: keep(profile.candidateSkills),
    };
  }

  private buildEvaluationInput(
    profile: EvaluationCandidateProfile,
    resume: EvaluationResume,
    job: EvaluationJobPosting,
    capturedAt: Date,
  ): ApplicationEvaluationInput {
    const parseWeight = (val: unknown, fallback: number): number => {
      if (val !== null && val !== undefined && !Number.isNaN(Number(val))) {
        const num = Number(val);
        if (num >= 0 && num <= 100) return num;
      }
      return fallback;
    };
    const weights = {
      skills: parseWeight(job.skillWeight, 40),
      experience: parseWeight(job.experienceWeight, 30),
      education: parseWeight(job.educationWeight, 15),
      other: parseWeight(job.otherWeight, 15),
    };

    return {
      candidate_profile: {
        profile: {
          id: profile.id,
          candidate_user_id: profile.userId,
          desired_title: profile.desiredTitle,
          professional_summary: profile.professionalSummary,
          github_url: profile.githubUrl,
          linkedin_url: profile.linkedinUrl,
          portfolio_url: profile.portfolioUrl,
          address: profile.address,
          created_at: profile.createdAt.toISOString(),
          updated_at: profile.updatedAt.toISOString(),
        },
        work_experiences: profile.workExperiences.map((experience) => ({
          id: experience.id,
          candidate_profile_id: profile.id,
          company_name: experience.companyName,
          position_title: experience.positionTitle,
          start_date: experience.startDate.toISOString(),
          end_date: experience.endDate?.toISOString() ?? null,
          is_current: experience.isCurrent,
          description: experience.description,
          achievements: experience.achievements,
        })),
        educations: profile.educations.map((education) => ({
          id: education.id,
          candidate_profile_id: profile.id,
          school_name: education.schoolName,
          major: education.major,
          degree: education.degree,
          start_date: education.startDate?.toISOString() ?? null,
          end_date: education.endDate?.toISOString() ?? null,
          description: education.description,
        })),
        projects: profile.projects.map((project) => ({
          id: project.id,
          candidate_profile_id: profile.id,
          project_name: project.projectName,
          project_role: project.projectRole,
          description: project.description,
          technologies: this.toStringArray(project.technologies),
          project_url: project.projectUrl,
          start_date: project.startDate?.toISOString() ?? null,
          end_date: project.endDate?.toISOString() ?? null,
        })),
        certificates: profile.certificates.map((certificate) => ({
          certificate_name: certificate.certificateName,
          issuing_organization: certificate.issuingOrganization,
          issue_date: certificate.issueDate?.toISOString() ?? null,
          expiry_date: certificate.expiryDate?.toISOString() ?? null,
          credential_url: certificate.credentialUrl,
        })),
        skills: profile.candidateSkills.map((candidateSkill) => ({
          candidate_profile_id: profile.id,
          skill_id: candidateSkill.skillId,
          skill_name: candidateSkill.skill.name,
          normalized_name: candidateSkill.skill.normalizedName,
          proficiency_level: candidateSkill.proficiencyLevel,
          is_primary: candidateSkill.isPrimary,
          source: candidateSkill.source,
        })),
        languages: Array.isArray(resume.parsedData?.languageData)
          ? (
              resume.parsedData.languageData as Array<{
                language?: string;
                proficiency?: string;
              }>
            ).map((l) => ({
              language: l.language ?? '',
              proficiency: l.proficiency ?? null,
            }))
          : [],
      },
      job: {
        id: job.id,
        title: job.title,
        employment_type: job.employmentType,
        work_mode: job.workingModel,
        salary_min: job.minSalary === null ? null : Number(job.minSalary),
        salary_max: job.maxSalary === null ? null : Number(job.maxSalary),
        location: job.location,
        required_experience_years: job.requiredExperienceYears ?? 0,
        experience_level: job.experienceLevel,
        level_requirement_mode: job.levelRequirementMode,
        evaluation_date: capturedAt.toISOString(),
        description: job.description,
        requirements: job.requirements,
        benefits: job.benefits,
        status: job.status,
        published_at: job.publishedAt?.toISOString() ?? null,
        created_at: job.createdAt.toISOString(),
        updated_at: job.updatedAt.toISOString(),
        closed_at: job.closedAt?.toISOString() ?? null,
        required_skills: job.jobSkills.map((jobSkill) => ({
          job_id: job.id,
          skill_id: jobSkill.skillId,
          skill_name: jobSkill.skill.name,
          normalized_name: jobSkill.skill.normalizedName,
          is_mandatory: jobSkill.requirementType === 'MANDATORY',
          minimum_level: jobSkill.minimumProficiency ?? 'BEGINNER',
        })),
        required_certificates: job.jobCertificates.map((certificate) => ({
          certificate_name: certificate.certificateName,
          is_mandatory: certificate.requirementType === 'MANDATORY',
        })),
        ai_weights_config: weights,
      },
      weights,
    };
  }

  private toStringArray(value: Prisma.JsonValue | null): string[] {
    if (Array.isArray(value)) {
      return value.filter((item): item is string => typeof item === 'string');
    }
    if (typeof value === 'string') {
      return value
        .split(',')
        .map((item) => item.trim())
        .filter(Boolean);
    }
    return [];
  }
}
