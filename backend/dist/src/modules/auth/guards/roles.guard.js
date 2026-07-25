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
Object.defineProperty(exports, "__esModule", { value: true });
exports.RolesGuard = void 0;
const common_1 = require("@nestjs/common");
const core_1 = require("@nestjs/core");
const prisma_service_1 = require("../../../database/prisma.service");
const auth_constants_1 = require("../auth.constants");
let RolesGuard = class RolesGuard {
    reflector;
    prisma;
    constructor(reflector, prisma) {
        this.reflector = reflector;
        this.prisma = prisma;
    }
    async canActivate(context) {
        const requiredRoles = this.reflector.getAllAndOverride(auth_constants_1.REQUIRED_ROLES_KEY, [context.getHandler(), context.getClass()]);
        if (!requiredRoles?.length) {
            return true;
        }
        const request = context.switchToHttp().getRequest();
        if (!request.authUser) {
            throw new common_1.UnauthorizedException('Authenticated user is unavailable.');
        }
        const user = await this.prisma.user.findUnique({
            where: { id: request.authUser.id },
            select: {
                userStatus: true,
                role: true,
            },
        });
        if (!user) {
            throw new common_1.ForbiddenException('The application profile has not been initialized.');
        }
        if (user.userStatus !== 'ACTIVE') {
            throw new common_1.ForbiddenException(`This account is ${user.userStatus?.toLowerCase() || 'unavailable'}.`);
        }
        const assignedRoles = new Set(user.role ? [user.role] : []);
        if (!requiredRoles.some((role) => assignedRoles.has(role))) {
            throw new common_1.ForbiddenException('You do not have permission to access this resource.');
        }
        return true;
    }
};
exports.RolesGuard = RolesGuard;
exports.RolesGuard = RolesGuard = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [core_1.Reflector,
        prisma_service_1.PrismaService])
], RolesGuard);
//# sourceMappingURL=roles.guard.js.map