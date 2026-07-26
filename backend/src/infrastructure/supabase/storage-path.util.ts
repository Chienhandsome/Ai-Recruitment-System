/**
 * Utility for generating standardized storage paths for resumes.
 *
 * Convention: candidates/{candidateProfileId}/resumes/{resumeId}/{filename}
 *
 * This path structure ensures:
 * - CVs belong to candidates, not jobs (a CV can be used for multiple applications)
 * - resumeId guarantees uniqueness even if filenames collide
 * - Supports upload before applying to any job
 */

export interface ResumeStoragePathParams {
  candidateProfileId: string;
  resumeId: string;
  fileName: string;
}

/**
 * Generate a standardized object path for storing a resume file.
 *
 * @example
 * buildResumeObjectPath({
 *   candidateProfileId: 'abc-123',
 *   resumeId: 'def-456',
 *   fileName: 'my_resume.pdf',
 * })
 * // => "candidates/abc-123/resumes/def-456/my_resume.pdf"
 */
export function buildResumeObjectPath(
  params: ResumeStoragePathParams,
): string {
  const { candidateProfileId, resumeId, fileName } = params;

  if (!candidateProfileId || !resumeId || !fileName) {
    throw new Error(
      'candidateProfileId, resumeId, and fileName are all required to build a resume storage path.',
    );
  }

  // Sanitize filename: replace unsafe chars, collapse dots
  const safeFileName = fileName
    .replace(/[^a-zA-Z0-9._-]/g, '_')
    .replace(/\.\.+/g, '.');

  return `candidates/${candidateProfileId}/resumes/${resumeId}/${safeFileName}`;
}
