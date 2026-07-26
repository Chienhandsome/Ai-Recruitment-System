"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var SupabaseStorageService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.SupabaseStorageService = void 0;
const common_1 = require("@nestjs/common");
const config_1 = require("@nestjs/config");
const supabase_js_1 = require("@supabase/supabase-js");
const node_crypto_1 = require("node:crypto");
const storage_path_util_1 = require("./storage-path.util");
let SupabaseStorageService = SupabaseStorageService_1 = class SupabaseStorageService {
    configService;
    logger = new common_1.Logger(SupabaseStorageService_1.name);
    supabaseClient = null;
    bucketName;
    defaultExpiresIn;
    maxFileSizeMb;
    allowedMimeTypes = [
        'application/pdf',
        'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    ];
    constructor(configService) {
        this.configService = configService;
        this.bucketName = this.configService.get('SUPABASE_STORAGE_BUCKET', 'resumes');
        this.defaultExpiresIn = Number(this.configService.get('SUPABASE_SIGNED_URL_EXPIRES_IN', 300));
        this.maxFileSizeMb = Number(this.configService.get('MAX_RESUME_FILE_SIZE_MB', 5));
        this.initClient();
    }
    async onModuleInit() {
        if (this.supabaseClient) {
            await this.ensureResumeBucket();
        }
    }
    initClient() {
        const supabaseUrl = this.configService.get('SUPABASE_URL');
        const secretKey = this.configService.get('SUPABASE_SECRET_KEY') ??
            this.configService.get('SUPABASE_SERVICE_ROLE_KEY');
        if (!supabaseUrl ||
            !secretKey ||
            supabaseUrl.includes('your-project-ref') ||
            secretKey.includes('sb_secret_xxxxxxxxx') ||
            secretKey.includes('your-service-role-key')) {
            this.logger.warn('Supabase Storage: SUPABASE_URL or SUPABASE_SECRET_KEY unconfigured or placeholder.');
            this.supabaseClient = null;
            return;
        }
        try {
            this.supabaseClient = (0, supabase_js_1.createClient)(supabaseUrl, secretKey, {
                auth: {
                    persistSession: false,
                    autoRefreshToken: false,
                },
            });
            this.logger.log('Supabase Storage client initialized successfully.');
        }
        catch (error) {
            this.logger.error(`Failed to initialize Supabase client: ${this.getErrorMessage(error)}`);
            this.supabaseClient = null;
        }
    }
    async ensureResumeBucket() {
        if (!this.supabaseClient) {
            this.logger.warn('Cannot check/create bucket: Supabase client is not initialized.');
            return false;
        }
        try {
            const { data: buckets, error: getError } = await this.supabaseClient.storage.listBuckets();
            if (getError) {
                this.logger.error(`Failed to list storage buckets: ${getError.message}`);
                return false;
            }
            const bucketExists = buckets?.some((b) => b.name === this.bucketName);
            if (!bucketExists) {
                this.logger.log(`Bucket '${this.bucketName}' does not exist. Creating private bucket...`);
                const { error: createError } = await this.supabaseClient.storage.createBucket(this.bucketName, {
                    public: false,
                    fileSizeLimit: `${this.maxFileSizeMb}MB`,
                    allowedMimeTypes: this.allowedMimeTypes,
                });
                if (createError) {
                    this.logger.error(`Failed to create bucket '${this.bucketName}': ${createError.message}`);
                    return false;
                }
                this.logger.log(`Private bucket '${this.bucketName}' created successfully.`);
            }
            else {
                this.logger.log(`Private bucket '${this.bucketName}' already exists.`);
            }
            return true;
        }
        catch (error) {
            this.logger.error(`Error ensuring resume bucket exists: ${this.getErrorMessage(error)}`);
            return false;
        }
    }
    async uploadResume(buffer, originalFileName, mimeType, customObjectPath) {
        if (!this.supabaseClient) {
            throw new common_1.BadRequestException('Supabase storage client is not configured.');
        }
        if (!buffer || buffer.length === 0) {
            throw new common_1.BadRequestException('File buffer cannot be empty.');
        }
        const maxSizeBytes = this.maxFileSizeMb * 1024 * 1024;
        if (buffer.length > maxSizeBytes) {
            throw new common_1.BadRequestException(`File size exceeds maximum allowed limit of ${this.maxFileSizeMb} MB.`);
        }
        if (!this.allowedMimeTypes.includes(mimeType)) {
            throw new common_1.BadRequestException(`Invalid MIME type '${mimeType}'. Only PDF and DOCX files are permitted.`);
        }
        const safeFileName = this.sanitizeFileName(originalFileName);
        const fileExt = safeFileName.split('.').pop()?.toLowerCase();
        if (fileExt !== 'pdf' && fileExt !== 'docx') {
            throw new common_1.BadRequestException(`Invalid file extension '.${fileExt}'. Only .pdf and .docx are allowed.`);
        }
        let targetPath;
        if (customObjectPath) {
            targetPath = this.sanitizeObjectPath(customObjectPath);
        }
        else {
            targetPath = `test/infrastructure/${(0, node_crypto_1.randomUUID)()}-${safeFileName}`;
        }
        const { data, error } = await this.supabaseClient.storage
            .from(this.bucketName)
            .upload(targetPath, buffer, {
            contentType: mimeType,
            upsert: false,
        });
        if (error) {
            this.logger.error(`Failed to upload file to '${targetPath}': ${error.message}`);
            throw new common_1.BadRequestException(`Upload failed: ${error.message}`);
        }
        return {
            bucket: this.bucketName,
            objectPath: data.path,
            mimeType,
            size: buffer.length,
        };
    }
    async uploadCandidateResume(buffer, originalFileName, mimeType, pathParams) {
        const objectPath = (0, storage_path_util_1.buildResumeObjectPath)(pathParams);
        return this.uploadResume(buffer, originalFileName, mimeType, objectPath);
    }
    async createSignedDownloadUrl(objectPath, expiresIn) {
        if (!this.supabaseClient) {
            throw new common_1.BadRequestException('Supabase storage client is not configured.');
        }
        const sanitizedPath = this.sanitizeObjectPath(objectPath);
        const ttl = expiresIn ?? this.defaultExpiresIn;
        const { data, error } = await this.supabaseClient.storage
            .from(this.bucketName)
            .createSignedUrl(sanitizedPath, ttl);
        if (error || !data?.signedUrl) {
            this.logger.error(`Failed to create signed URL for path '${sanitizedPath}': ${error?.message}`);
            throw new common_1.BadRequestException(`Signed URL creation failed: ${error?.message || 'File not found'}`);
        }
        return {
            signedUrl: data.signedUrl,
            expiresIn: ttl,
        };
    }
    async removeResume(objectPath) {
        if (!this.supabaseClient) {
            throw new common_1.BadRequestException('Supabase storage client is not configured.');
        }
        const sanitizedPath = this.sanitizeObjectPath(objectPath);
        const { error } = await this.supabaseClient.storage
            .from(this.bucketName)
            .remove([sanitizedPath]);
        if (error) {
            this.logger.error(`Failed to remove file '${sanitizedPath}': ${error.message}`);
            throw new common_1.BadRequestException(`Removal failed: ${error.message}`);
        }
        return {
            bucket: this.bucketName,
            objectPath: sanitizedPath,
            deleted: true,
        };
    }
    async fileExists(objectPath) {
        if (!this.supabaseClient)
            return false;
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
            if (error || !data)
                return false;
            return data.some((item) => item.name === fileName);
        }
        catch {
            return false;
        }
    }
    async checkHealth() {
        if (!this.supabaseClient) {
            return {
                service: 'supabase-storage',
                status: 'DOWN',
                message: 'Supabase storage credentials unconfigured or invalid',
            };
        }
        try {
            const { error } = await this.supabaseClient.storage.getBucket(this.bucketName);
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
        }
        catch (error) {
            return {
                service: 'supabase-storage',
                status: 'DOWN',
                message: `Storage check failed: ${this.getErrorMessage(error)}`,
            };
        }
    }
    sanitizeFileName(fileName) {
        return fileName.replace(/[^a-zA-Z0-9._-]/g, '_').replace(/\.\.+/g, '.');
    }
    getErrorMessage(error) {
        return error instanceof Error ? error.message : 'Unknown Supabase error';
    }
    sanitizeObjectPath(objectPath) {
        if (objectPath.includes('..')) {
            throw new common_1.BadRequestException('Invalid object path containing parent directory traversal.');
        }
        return objectPath.replace(/^\/+/, '');
    }
};
exports.SupabaseStorageService = SupabaseStorageService;
exports.SupabaseStorageService = SupabaseStorageService = SupabaseStorageService_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [config_1.ConfigService])
], SupabaseStorageService);
//# sourceMappingURL=supabase-storage.service.js.map