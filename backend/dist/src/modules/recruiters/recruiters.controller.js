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
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.RecruitersController = void 0;
const common_1 = require("@nestjs/common");
const swagger_1 = require("@nestjs/swagger");
const recruiters_service_1 = require("./recruiters.service");
const update_recruiter_profile_dto_1 = require("./dto/update-recruiter-profile.dto");
const current_user_decorator_1 = require("../auth/decorators/current-user.decorator");
const roles_decorator_1 = require("../auth/decorators/roles.decorator");
const roles_guard_1 = require("../auth/guards/roles.guard");
const supabase_auth_guard_1 = require("../auth/guards/supabase-auth.guard");
let RecruitersController = class RecruitersController {
    recruitersService;
    constructor(recruitersService) {
        this.recruitersService = recruitersService;
    }
    async getProfile(user) {
        return this.recruitersService.getProfile(user.id);
    }
    async updateProfile(user, dto) {
        return this.recruitersService.updateProfile(user.id, dto);
    }
    async getDashboardStats(user) {
        return this.recruitersService.getDashboardStats(user.id);
    }
};
exports.RecruitersController = RecruitersController;
__decorate([
    (0, common_1.Get)('profile'),
    (0, swagger_1.ApiOperation)({ summary: 'Get the recruiter profile for the current user' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'Return the recruiter profile' }),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], RecruitersController.prototype, "getProfile", null);
__decorate([
    (0, common_1.Patch)('profile'),
    (0, swagger_1.ApiOperation)({ summary: 'Update the recruiter profile (title, company, department)' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'Profile updated successfully' }),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, update_recruiter_profile_dto_1.UpdateRecruiterProfileDto]),
    __metadata("design:returntype", Promise)
], RecruitersController.prototype, "updateProfile", null);
__decorate([
    (0, common_1.Get)('dashboard/stats'),
    (0, swagger_1.ApiOperation)({ summary: 'Get dashboard statistics for the recruiter company' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'Return total active jobs, candidates, and new applications today' }),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], RecruitersController.prototype, "getDashboardStats", null);
exports.RecruitersController = RecruitersController = __decorate([
    (0, swagger_1.ApiTags)('Recruiters'),
    (0, swagger_1.ApiBearerAuth)(),
    (0, common_1.UseGuards)(supabase_auth_guard_1.SupabaseAuthGuard, roles_guard_1.RolesGuard),
    (0, roles_decorator_1.Roles)('RECRUITER'),
    (0, common_1.Controller)('recruiters'),
    __metadata("design:paramtypes", [recruiters_service_1.RecruitersService])
], RecruitersController);
//# sourceMappingURL=recruiters.controller.js.map