import type { Prisma } from '@prisma/client';
export declare const APPLICATION_SNAPSHOT_VERSION: 1;
export interface ApplicationEvaluationInput {
    candidate_profile: Record<string, unknown>;
    job: Record<string, unknown>;
    weights: Record<string, number>;
}
export interface ApplicationProfileSnapshot {
    schemaVersion: typeof APPLICATION_SNAPSHOT_VERSION;
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
export declare function toPrismaJson(snapshot: ApplicationProfileSnapshot): Prisma.InputJsonValue;
export declare function createEvaluationMessage(applicationId: string, snapshotValue: Prisma.JsonValue | null): Record<string, unknown> | null;
