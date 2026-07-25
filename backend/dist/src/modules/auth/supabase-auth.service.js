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
var SupabaseAuthService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.SupabaseAuthService = void 0;
const common_1 = require("@nestjs/common");
const config_1 = require("@nestjs/config");
const supabase_js_1 = require("@supabase/supabase-js");
const supabase_admin_client_1 = require("../../infrastructure/supabase/supabase-admin-client");
let SupabaseAuthService = SupabaseAuthService_1 = class SupabaseAuthService {
    configService;
    logger = new common_1.Logger(SupabaseAuthService_1.name);
    client;
    adminClient = null;
    constructor(configService) {
        this.configService = configService;
        const supabaseUrl = this.configService.get('SUPABASE_URL');
        const publishableKey = this.configService.get('SUPABASE_PUBLISHABLE_KEY');
        if (!supabaseUrl ||
            !publishableKey ||
            supabaseUrl.includes('your-project') ||
            publishableKey.includes('your-publishable-key')) {
            this.client = null;
            this.logger.warn('Supabase Auth is disabled because its public credentials are not configured.');
            return;
        }
        this.client = (0, supabase_js_1.createClient)(supabaseUrl, publishableKey, {
            auth: {
                autoRefreshToken: false,
                detectSessionInUrl: false,
                persistSession: false,
            },
        });
        const secretKey = this.configService.get('SUPABASE_SECRET_KEY') ??
            this.configService.get('SUPABASE_SERVICE_ROLE_KEY');
        if (secretKey) {
            this.adminClient = (0, supabase_admin_client_1.createSupabaseAdminClient)(supabaseUrl, secretKey);
        }
    }
    async verifyAccessToken(accessToken) {
        if (!this.client) {
            throw new common_1.ServiceUnavailableException('Supabase Auth is not configured on the backend.');
        }
        const { data, error } = await this.client.auth.getClaims(accessToken);
        if (error || !data?.claims) {
            throw new common_1.UnauthorizedException('Invalid or expired access token.');
        }
        const claims = data.claims;
        const id = this.getStringClaim(claims, 'sub');
        const email = this.getStringClaim(claims, 'email');
        if (!id || !email) {
            throw new common_1.UnauthorizedException('The access token does not contain a valid user identity.');
        }
        const metadata = this.getObjectClaim(claims, 'user_metadata');
        const fullName = this.getMetadataString(metadata, 'full_name') ??
            this.getMetadataString(metadata, 'name') ??
            email.split('@')[0];
        const avatarUrl = this.getMetadataString(metadata, 'avatar_url') ??
            this.getMetadataString(metadata, 'picture');
        return {
            id,
            email: email.toLowerCase(),
            fullName,
            ...(avatarUrl ? { avatarUrl } : {}),
        };
    }
    async inviteAdmin(email, fullName) {
        if (!this.adminClient) {
            throw new common_1.ServiceUnavailableException('Supabase Admin API is not configured on the backend.');
        }
        const siteUrl = this.configService.get('FRONTEND_SITE_URL', 'https://ai-recruitment-system-test-deploy-1.vercel.app');
        const { data, error } = await this.adminClient.auth.admin.inviteUserByEmail(email.trim().toLowerCase(), {
            data: {
                full_name: fullName.trim(),
            },
            redirectTo: `${siteUrl.replace(/\/$/, '')}/auth/callback`,
        });
        if (error || !data.user?.email) {
            throw new common_1.ConflictException({
                code: 'ADMIN_INVITE_FAILED',
                message: error?.message ?? 'Supabase did not create the invited user.',
            });
        }
        return {
            id: data.user.id,
            email: data.user.email.toLowerCase(),
            fullName: fullName.trim(),
        };
    }
    async deleteAuthUser(userId) {
        if (!this.adminClient)
            return;
        const { error } = await this.adminClient.auth.admin.deleteUser(userId);
        if (error) {
            this.logger.error(`Failed to roll back Supabase Auth user ${userId}: ${error.message}`);
        }
    }
    getStringClaim(claims, key) {
        const value = claims[key];
        return typeof value === 'string' && value.trim() ? value.trim() : undefined;
    }
    getObjectClaim(claims, key) {
        const value = claims[key];
        if (!value || typeof value !== 'object' || Array.isArray(value)) {
            return {};
        }
        return value;
    }
    getMetadataString(metadata, key) {
        const value = metadata[key];
        return typeof value === 'string' && value.trim() ? value.trim() : undefined;
    }
};
exports.SupabaseAuthService = SupabaseAuthService;
exports.SupabaseAuthService = SupabaseAuthService = SupabaseAuthService_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [config_1.ConfigService])
], SupabaseAuthService);
//# sourceMappingURL=supabase-auth.service.js.map