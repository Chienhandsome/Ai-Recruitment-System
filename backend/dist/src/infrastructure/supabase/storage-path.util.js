"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.buildResumeObjectPath = buildResumeObjectPath;
function buildResumeObjectPath(params) {
    const { candidateProfileId, resumeId, fileName } = params;
    if (!candidateProfileId || !resumeId || !fileName) {
        throw new Error('candidateProfileId, resumeId, and fileName are all required to build a resume storage path.');
    }
    const safeFileName = fileName
        .replace(/[^a-zA-Z0-9._-]/g, '_')
        .replace(/\.\.+/g, '.');
    return `candidates/${candidateProfileId}/resumes/${resumeId}/${safeFileName}`;
}
//# sourceMappingURL=storage-path.util.js.map