import {
  CandidateProfileStatus,
  EntitlementStatus,
  PackageAudience,
  Prisma,
} from '@prisma/client';

/** Shared by search, detail, unlock and the candidate's visibility indicator. */
export function talentPoolVisibilityWhere(
  now = new Date(),
): Prisma.CandidateProfileWhereInput {
  return {
    isProfilePublic: true,
    jobSeekingEnabled: true,
    jobSeekingConfirmedAt: { not: null },
    jobSeekingUntil: { gt: now },
    desiredTitle: { not: '' },
    professionalSummary: { not: '' },
    isTalentPoolBanned: false,
    AND: [
      {
        OR: [
          { suspendedUntil: null },
          { suspendedUntil: { lte: now } },
        ],
      },
    ],
    status: {
      in: [CandidateProfileStatus.READY, CandidateProfileStatus.NEEDS_REVIEW],
    },
    jobSeekingEntitlement: {
      is: {
        status: EntitlementStatus.ACTIVE,
        jobSeekingAccess: true,
        startsAt: { lte: now },
        endsAt: { gt: now },
        package: { audience: PackageAudience.CANDIDATE },
      },
    },
  };
}
