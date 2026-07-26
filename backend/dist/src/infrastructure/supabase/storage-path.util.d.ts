export interface ResumeStoragePathParams {
    candidateProfileId: string;
    resumeId: string;
    fileName: string;
}
export declare function buildResumeObjectPath(params: ResumeStoragePathParams): string;
