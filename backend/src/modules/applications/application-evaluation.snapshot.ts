import type { Prisma } from '@prisma/client';

export const LEGACY_APPLICATION_SNAPSHOT_VERSION = 1 as const;
export const APPLICATION_SNAPSHOT_VERSION = 2 as const;
export type ApplicationSnapshotVersion =
  | typeof LEGACY_APPLICATION_SNAPSHOT_VERSION
  | typeof APPLICATION_SNAPSHOT_VERSION;

export interface ApplicationEvaluationInput {
  candidate_profile: Record<string, unknown>;
  job: Record<string, unknown>;
  weights: Record<string, number>;
}

export interface ApplicationProfileSnapshot {
  schemaVersion: ApplicationSnapshotVersion;
  capturedAt: string;
  candidateIdentity: {
    id: string;
    userId: string | null;
    fullName: string;
    email: string;
    phone: string | null;
  };
  resume: {
    id: string;
    source: string;
    originalFileName: string;
    mimeType: string;
    fileSizeBytes: number;
    parsingStatus: string;
    createdAt: string;
  };
  evaluationInput: ApplicationEvaluationInput;
}

export function toPrismaJson(
  snapshot: ApplicationProfileSnapshot,
): Prisma.InputJsonValue {
  return snapshot as unknown as Prisma.InputJsonValue;
}

export function createEvaluationMessage(
  applicationId: string,
  snapshotValue: Prisma.JsonValue | null,
): Record<string, unknown> | null {
  const snapshot = asRecord(snapshotValue);
  if (
    (snapshot?.schemaVersion !== LEGACY_APPLICATION_SNAPSHOT_VERSION &&
      snapshot?.schemaVersion !== APPLICATION_SNAPSHOT_VERSION) ||
    !isRecord(snapshot.evaluationInput)
  ) {
    return null;
  }

  const candidateProfile = snapshot.evaluationInput.candidate_profile;
  const job = snapshot.evaluationInput.job;
  const weights = snapshot.evaluationInput.weights;
  if (!isRecord(candidateProfile) || !isRecord(job) || !isRecord(weights)) {
    return null;
  }

  return {
    applicationId,
    application_id: applicationId,
    schema_version: snapshot.schemaVersion,
    evaluation_date:
      typeof snapshot.capturedAt === 'string' ? snapshot.capturedAt : undefined,
    candidate_profile: candidateProfile,
    job,
    weights,
  };
}

function asRecord(
  value: Prisma.JsonValue | null,
): Record<string, unknown> | null {
  return isRecord(value) ? value : null;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return !!value && typeof value === 'object' && !Array.isArray(value);
}
