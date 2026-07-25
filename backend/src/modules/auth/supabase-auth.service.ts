import {
  ConflictException,
  Injectable,
  Logger,
  ServiceUnavailableException,
  UnauthorizedException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { createClient, type SupabaseClient } from '@supabase/supabase-js';
import { createSupabaseAdminClient } from '../../infrastructure/supabase/supabase-admin-client';
import type { AuthenticatedUser } from './auth.types';

@Injectable()
export class SupabaseAuthService {
  private readonly logger = new Logger(SupabaseAuthService.name);
  private readonly client: SupabaseClient | null;
  private adminClient: SupabaseClient | null = null;

  constructor(private readonly configService: ConfigService) {
    const supabaseUrl = this.configService.get<string>('SUPABASE_URL');
    const publishableKey = this.configService.get<string>(
      'SUPABASE_PUBLISHABLE_KEY',
    );

    if (
      !supabaseUrl ||
      !publishableKey ||
      supabaseUrl.includes('your-project') ||
      publishableKey.includes('your-publishable-key')
    ) {
      this.client = null;
      this.logger.warn(
        'Supabase Auth is disabled because its public credentials are not configured.',
      );
      return;
    }

    this.client = createClient(supabaseUrl, publishableKey, {
      auth: {
        autoRefreshToken: false,
        detectSessionInUrl: false,
        persistSession: false,
      },
    });

    const secretKey =
      this.configService.get<string>('SUPABASE_SECRET_KEY') ??
      this.configService.get<string>('SUPABASE_SERVICE_ROLE_KEY');

    if (secretKey) {
      this.adminClient = createSupabaseAdminClient(supabaseUrl, secretKey);
    }
  }

  async verifyAccessToken(accessToken: string): Promise<AuthenticatedUser> {
    if (!this.client) {
      throw new ServiceUnavailableException(
        'Supabase Auth is not configured on the backend.',
      );
    }

    const { data, error } = await this.client.auth.getClaims(accessToken);

    if (error || !data?.claims) {
      throw new UnauthorizedException('Invalid or expired access token.');
    }

    const claims = data.claims as Record<string, unknown>;
    const id = this.getStringClaim(claims, 'sub');
    const email = this.getStringClaim(claims, 'email');

    if (!id || !email) {
      throw new UnauthorizedException(
        'The access token does not contain a valid user identity.',
      );
    }

    const metadata = this.getObjectClaim(claims, 'user_metadata');
    const fullName =
      this.getMetadataString(metadata, 'full_name') ??
      this.getMetadataString(metadata, 'name') ??
      email.split('@')[0];
    const avatarUrl =
      this.getMetadataString(metadata, 'avatar_url') ??
      this.getMetadataString(metadata, 'picture');

    return {
      id,
      email: email.toLowerCase(),
      fullName,
      ...(avatarUrl ? { avatarUrl } : {}),
    };
  }

  async inviteAdmin(
    email: string,
    fullName: string,
  ): Promise<AuthenticatedUser> {
    if (!this.adminClient) {
      throw new ServiceUnavailableException(
        'Supabase Admin API is not configured on the backend.',
      );
    }

    const siteUrl = this.configService.get<string>(
      'FRONTEND_SITE_URL',
      'https://ai-recruitment-system-test-deploy-1.vercel.app',
    );
    const { data, error } = await this.adminClient.auth.admin.inviteUserByEmail(
      email.trim().toLowerCase(),
      {
        data: {
          full_name: fullName.trim(),
        },
        redirectTo: `${siteUrl.replace(/\/$/, '')}/auth/callback`,
      },
    );

    if (error || !data.user?.email) {
      throw new ConflictException({
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

  async deleteAuthUser(userId: string): Promise<void> {
    if (!this.adminClient) return;

    const { error } = await this.adminClient.auth.admin.deleteUser(userId);
    if (error) {
      this.logger.error(
        `Failed to roll back Supabase Auth user ${userId}: ${error.message}`,
      );
    }
  }

  private getStringClaim(
    claims: Record<string, unknown>,
    key: string,
  ): string | undefined {
    const value = claims[key];
    return typeof value === 'string' && value.trim() ? value.trim() : undefined;
  }

  private getObjectClaim(
    claims: Record<string, unknown>,
    key: string,
  ): Record<string, unknown> {
    const value = claims[key];

    if (!value || typeof value !== 'object' || Array.isArray(value)) {
      return {};
    }

    return value as Record<string, unknown>;
  }

  private getMetadataString(
    metadata: Record<string, unknown>,
    key: string,
  ): string | undefined {
    const value = metadata[key];
    return typeof value === 'string' && value.trim() ? value.trim() : undefined;
  }
}
