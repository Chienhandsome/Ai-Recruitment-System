import { OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { ResumeStoragePathParams } from './storage-path.util';
export interface UploadResult {
    bucket: string;
    objectPath: string;
    mimeType: string;
    size: number;
}
export interface SignedUrlResult {
    signedUrl: string;
    expiresIn: number;
}
export interface RemoveResult {
    bucket: string;
    objectPath: string;
    deleted: boolean;
}
export declare class SupabaseStorageService implements OnModuleInit {
    private readonly configService;
    private readonly logger;
    private supabaseClient;
    private readonly bucketName;
    private readonly defaultExpiresIn;
    private readonly maxFileSizeMb;
    private readonly allowedMimeTypes;
    constructor(configService: ConfigService);
    onModuleInit(): Promise<void>;
    private initClient;
    ensureResumeBucket(): Promise<boolean>;
    uploadResume(buffer: Buffer, originalFileName: string, mimeType: string, customObjectPath?: string): Promise<UploadResult>;
    uploadCandidateResume(buffer: Buffer, originalFileName: string, mimeType: string, pathParams: ResumeStoragePathParams): Promise<UploadResult>;
    createSignedDownloadUrl(objectPath: string, expiresIn?: number): Promise<SignedUrlResult>;
    removeResume(objectPath: string): Promise<RemoveResult>;
    fileExists(objectPath: string): Promise<boolean>;
    checkHealth(): Promise<{
        service: string;
        status: string;
        message?: string;
    }>;
    private sanitizeFileName;
    private getErrorMessage;
    private sanitizeObjectPath;
}
