"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.APPLICATION_SNAPSHOT_VERSION = exports.LEGACY_APPLICATION_SNAPSHOT_VERSION = void 0;
exports.toPrismaJson = toPrismaJson;
exports.createEvaluationMessage = createEvaluationMessage;
exports.LEGACY_APPLICATION_SNAPSHOT_VERSION = 1;
exports.APPLICATION_SNAPSHOT_VERSION = 2;
function toPrismaJson(snapshot) {
    return snapshot;
}
function createEvaluationMessage(applicationId, snapshotValue) {
    const snapshot = asRecord(snapshotValue);
    if ((snapshot?.schemaVersion !== exports.LEGACY_APPLICATION_SNAPSHOT_VERSION &&
        snapshot?.schemaVersion !== exports.APPLICATION_SNAPSHOT_VERSION) ||
        !isRecord(snapshot.evaluationInput)) {
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
        evaluation_date: typeof snapshot.capturedAt === 'string' ? snapshot.capturedAt : undefined,
        candidate_profile: candidateProfile,
        job,
        weights,
    };
}
function asRecord(value) {
    return isRecord(value) ? value : null;
}
function isRecord(value) {
    return !!value && typeof value === 'object' && !Array.isArray(value);
}
//# sourceMappingURL=application-evaluation.snapshot.js.map