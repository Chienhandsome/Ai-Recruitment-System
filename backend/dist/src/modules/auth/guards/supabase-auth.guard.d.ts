import { CanActivate, ExecutionContext } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { SupabaseAuthService } from '../supabase-auth.service';
export declare class SupabaseAuthGuard implements CanActivate {
    private readonly reflector;
    private readonly supabaseAuthService;
    private readonly logger;
    constructor(reflector: Reflector, supabaseAuthService: SupabaseAuthService);
    canActivate(context: ExecutionContext): Promise<boolean>;
}
