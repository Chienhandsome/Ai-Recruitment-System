import {
  Injectable,
  Logger,
  BadRequestException,
  OnModuleInit,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { randomUUID } from 'node:crypto';
import {
  buildResumeObjectPath,
  ResumeStoragePathParams,
} from './storage-path.util';

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

@Injectable()
export class SupabaseStorageService implements OnModuleInit {
  private readonly logger = new Logger(SupabaseStorageService.name);
  private supabaseClient: SupabaseClient | null = null;
  private readonly bucketName: string;
  private readonly defaultExpiresIn: number;
  private readonly maxFileSizeMb: number;

  private readonly allowedMimeTypes = [
    'application/pdf',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  ];

  constructor(private readonly configService: ConfigService) {
    this.bucketName = this.configService.get<string>(
      'SUPABASE_STORAGE_BUCKET',
      'resumes',
    );
    this.defaultExpiresIn = Number(
      this.configService.get<number>('SUPABASE_SIGNED_URL_EXPIRES_IN', 300),
    );
    this.maxFileSizeMb = Number(
      this.configService.get<number>('MAX_RESUME_FILE_SIZE_MB', 5),
    );

    this.initClient();
  }

  async onModuleInit() {
    if (this.supabaseClient) {
      await this.ensureResumeBucket();
    }
  }

  private initClient() {
    const supabaseUrl = this.configService.get<string>('SUPABASE_URL');
    const secretKey =
      this.configService.get<string>('SUPABASE_SECRET_KEY') ??
      this.configService.get<string>('SUPABASE_SERVICE_ROLE_KEY');

    if (
      !supabaseUrl ||
      !secretKey ||
      supabaseUrl.includes('your-project-ref') ||
      secretKey.includes('sb_secret_xxxxxxxxx') ||
      secretKey.includes('your-service-role-key')
    ) {
      this.logger.warn(
        'Supabase Storage: SUPABASE_URL or SUPABASE_SECRET_KEY unconfigured or placeholder.',
      );
      this.supabaseClient = null;
      return;
    }

    try {
      this.supabaseClient = createClient(supabaseUrl, secretKey, {
        auth: {
          persistSession: false,
          autoRefreshToken: false,
        },
      });
      this.logger.log('Supabase Storage client initialized successfully.');
    } catch (error: unknown) {
      this.logger.error(
        `Failed to initialize Supabase client: ${this.getErrorMessage(error)}`,
      );
      this.supabaseClient = null;
    }
  }

  async ensureResumeBucket(): Promise<boolean> {
    if (!this.supabaseClient) {
      this.logger.warn(
        'Cannot check/create bucket: Supabase client is not initialized.',
      );
      return false;
    }

    try {
      const { data: buckets, error: getError } =
        await this.supabaseClient.storage.listBuckets();
      if (getError) {
        this.logger.error(
          `Failed to list storage buckets: ${getError.message}`,
        );
        return false;
      }

      const bucketExists = buckets?.some((b) => b.name === this.bucketName);

      if (!bucketExists) {
        this.logger.log(
          `Bucket '${this.bucketName}' does not exist. Creating private bucket...`,
        );
        const { error: createError } =
          await this.supabaseClient.storage.createBucket(this.bucketName, {
            public: false,
            fileSizeLimit: `${this.maxFileSizeMb}MB`,
            allowedMimeTypes: this.allowedMimeTypes,
          });

        if (createError) {
          this.logger.error(
            `Failed to create bucket '${this.bucketName}': ${createError.message}`,
          );
          return false;
        }

        this.logger.log(
          `Private bucket '${this.bucketName}' created successfully.`,
        );
      } else {
        this.logger.log(`Private bucket '${this.bucketName}' already exists.`);
      }

      return true;
    } catch (error: unknown) {
      this.logger.error(
        `Error ensuring resume bucket exists: ${this.getErrorMessage(error)}`,
      );
      return false;
    }
  }

  async uploadResume(
    buffer: Buffer,
    originalFileName: string,
    mimeType: string,
    customObjectPath?: string,
  ): Promise<UploadResult> {
    if (!this.supabaseClient) {
      throw new BadRequestException(
        'Supabase storage client is not configured.',
      );
    }

    if (!buffer || buffer.length === 0) {
      throw new BadRequestException('File buffer cannot be empty.');
    }

    const maxSizeBytes = this.maxFileSizeMb * 1024 * 1024;
    if (buffer.length > maxSizeBytes) {
      throw new BadRequestException(
        `File size exceeds maximum allowed limit of ${this.maxFileSizeMb} MB.`,
      );
    }

    if (!this.allowedMimeTypes.includes(mimeType)) {
      throw new BadRequestException(
        `Invalid MIME type '${mimeType}'. Only PDF and DOCX files are permitted.`,
      );
    }

    const safeFileName = this.sanitizeFileName(originalFileName);
    const fileExt = safeFileName.split('.').pop()?.toLowerCase();
    if (fileExt !== 'pdf' && fileExt !== 'docx') {
      throw new BadRequestException(
        `Invalid file extension '.${fileExt}'. Only .pdf and .docx are allowed.`,
      );
    }

    let targetPath: string;
    if (customObjectPath) {
      targetPath = this.sanitizeObjectPath(customObjectPath);
    } else {
      targetPath = `test/infrastructure/${randomUUID()}-${safeFileName}`;
    }

    const { data, error } = await this.supabaseClient.storage
      .from(this.bucketName)
      .upload(targetPath, buffer, {
        contentType: mimeType,
        upsert: false,
      });

    if (error) {
      this.logger.error(
        `Failed to upload file to '${targetPath}': ${error.message}`,
      );
      throw new BadRequestException(`Upload failed: ${error.message}`);
    }

    return {
      bucket: this.bucketName,
      objectPath: data.path,
      mimeType,
      size: buffer.length,
    };
  }

  /**
   * Upload a candidate resume using the standardized storage path convention:
   * candidates/{candidateProfileId}/resumes/{resumeId}/{filename}
   *
   * Use this method for all production resume uploads (candidate self-upload, HR upload, batch import).
   * The older `uploadResume` with customObjectPath is kept for backward compatibility and testing.
   */
  async uploadCandidateResume(
    buffer: Buffer,
    originalFileName: string,
    mimeType: string,
    pathParams: ResumeStoragePathParams,
  ): Promise<UploadResult> {
    const objectPath = buildResumeObjectPath(pathParams);
    return this.uploadResume(buffer, originalFileName, mimeType, objectPath);
  }

  async createSignedDownloadUrl(
    objectPath: string,
    expiresIn?: number,
  ): Promise<SignedUrlResult> {
    if (!this.supabaseClient) {
      throw new BadRequestException(
        'Supabase storage client is not configured.',
      );
    }

    const sanitizedPath = this.sanitizeObjectPath(objectPath);
    const ttl = expiresIn ?? this.defaultExpiresIn;

    const { data, error } = await this.supabaseClient.storage
      .from(this.bucketName)
      .createSignedUrl(sanitizedPath, ttl);

    if (error || !data?.signedUrl) {
      this.logger.error(
        `Failed to create signed URL for path '${sanitizedPath}': ${error?.message}`,
      );
      throw new BadRequestException(
        `Signed URL creation failed: ${error?.message || 'File not found'}`,
      );
    }

    return {
      signedUrl: data.signedUrl,
      expiresIn: ttl,
    };
  }

  async removeResume(objectPath: string): Promise<RemoveResult> {
    if (!this.supabaseClient) {
      throw new BadRequestException(
        'Supabase storage client is not configured.',
      );
    }

    const sanitizedPath = this.sanitizeObjectPath(objectPath);

    const { error } = await this.supabaseClient.storage
      .from(this.bucketName)
      .remove([sanitizedPath]);

    if (error) {
      this.logger.error(
        `Failed to remove file '${sanitizedPath}': ${error.message}`,
      );
      throw new BadRequestException(`Removal failed: ${error.message}`);
    }

    return {
      bucket: this.bucketName,
      objectPath: sanitizedPath,
      deleted: true,
    };
  }

  async fileExists(objectPath: string): Promise<boolean> {
    if (!this.supabaseClient) return false;

    const sanitizedPath = this.sanitizeObjectPath(objectPath);
    const pathParts = sanitizedPath.split('/');
    const fileName = pathParts.pop();
    const folderPath = pathParts.join('/');

    try {
      const { data, error } = await this.supabaseClient.storage
        .from(this.bucketName)
        .list(folderPath, {
          search: fileName,
        });

      if (error || !data) return false;
      return data.some((item) => item.name === fileName);
    } catch {
      return false;
    }
  }

  async checkHealth(): Promise<{
    service: string;
    status: string;
    message?: string;
  }> {
    if (!this.supabaseClient) {
      return {
        service: 'supabase-storage',
        status: 'DOWN',
        message: 'Supabase storage credentials unconfigured or invalid',
      };
    }

    try {
      const { error } = await this.supabaseClient.storage.getBucket(
        this.bucketName,
      );
      if (error) {
        return {
          service: 'supabase-storage',
          status: 'DOWN',
          message: `Bucket '${this.bucketName}' unreachable: ${error.message}`,
        };
      }

      return {
        service: 'supabase-storage',
        status: 'UP',
      };
    } catch (error: unknown) {
      return {
        service: 'supabase-storage',
        status: 'DOWN',
        message: `Storage check failed: ${this.getErrorMessage(error)}`,
      };
    }
  }

  private sanitizeFileName(fileName: string): string {
    return fileName.replace(/[^a-zA-Z0-9._-]/g, '_').replace(/\.\.+/g, '.');
  }

  private getErrorMessage(error: unknown): string {
    return error instanceof Error ? error.message : 'Unknown Supabase error';
  }

  private sanitizeObjectPath(objectPath: string): string {
    if (objectPath.includes('..')) {
      throw new BadRequestException(
        'Invalid object path containing parent directory traversal.',
      );
    }
    return objectPath.replace(/^\/+/, '');
  }
}
