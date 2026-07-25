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
var SupabaseAuthGuard_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.SupabaseAuthGuard = void 0;
const common_1 = require("@nestjs/common");
const core_1 = require("@nestjs/core");
const auth_constants_1 = require("../auth.constants");
const supabase_auth_service_1 = require("../supabase-auth.service");
let SupabaseAuthGuard = SupabaseAuthGuard_1 = class SupabaseAuthGuard {
    reflector;
    supabaseAuthService;
    logger = new common_1.Logger(SupabaseAuthGuard_1.name);
    constructor(reflector, supabaseAuthService) {
        this.reflector = reflector;
        this.supabaseAuthService = supabaseAuthService;
    }
    async canActivate(context) {
        const request = context.switchToHttp().getRequest();
        const route = `${request.method} ${request.url}`;
        const isPublic = this.reflector.getAllAndOverride(auth_constants_1.PUBLIC_ROUTE_KEY, [context.getHandler(), context.getClass()]);
        if (isPublic) {
            this.logger.debug(`[${route}] Public route — skipping auth`);
            return true;
        }
        const authorization = request.headers.authorization;
        if (!authorization?.startsWith('Bearer ')) {
            this.logger.warn(`[${route}] Missing or malformed Authorization header`);
            throw new common_1.UnauthorizedException('A bearer access token is required.');
        }
        const accessToken = authorization.slice('Bearer '.length).trim();
        if (!accessToken) {
            this.logger.warn(`[${route}] Empty bearer token`);
            throw new common_1.UnauthorizedException('A bearer access token is required.');
        }
        try {
            request.authUser =
                await this.supabaseAuthService.verifyAccessToken(accessToken);
            this.logger.debug(`[${route}] Authenticated user: ${request.authUser.email} (${request.authUser.id})`);
            return true;
        }
        catch (error) {
            this.logger.warn(`[${route}] Token verification failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
            throw error;
        }
    }
};
exports.SupabaseAuthGuard = SupabaseAuthGuard;
exports.SupabaseAuthGuard = SupabaseAuthGuard = SupabaseAuthGuard_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [core_1.Reflector,
        supabase_auth_service_1.SupabaseAuthService])
], SupabaseAuthGuard);
//# sourceMappingURL=supabase-auth.guard.js.map