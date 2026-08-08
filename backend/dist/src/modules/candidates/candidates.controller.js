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
exports.CandidatesController = void 0;
const common_1 = require("@nestjs/common");
const swagger_1 = require("@nestjs/swagger");
const candidates_service_1 = require("./candidates.service");
const update_candidate_skills_dto_1 = require("./dto/update-candidate-skills.dto");
const update_candidate_profile_dto_1 = require("./dto/update-candidate-profile.dto");
const supabase_auth_guard_1 = require("../auth/guards/supabase-auth.guard");
const current_user_decorator_1 = require("../auth/decorators/current-user.decorator");
let CandidatesController = class CandidatesController {
    candidatesService;
    constructor(candidatesService) {
        this.candidatesService = candidatesService;
    }
    async updateMyProfile(user, dto) {
        return this.candidatesService.updateProfile(user.id, dto);
    }
    async getMySkills(user) {
        const profile = await this.candidatesService.getResolvedProfileByUserId(user.id);
        return this.candidatesService.getCandidateSkills(profile.id);
    }
    async updateMySkills(user, dto) {
        const profile = await this.candidatesService.getResolvedProfileByUserId(user.id);
        return this.candidatesService.updateCandidateSkills(profile.id, dto);
    }
    async removeMySkill(user, skillId) {
        const profile = await this.candidatesService.getResolvedProfileByUserId(user.id);
        await this.candidatesService.removeCandidateSkill(profile.id, skillId);
        return { message: 'Skill removed successfully' };
    }
};
exports.CandidatesController = CandidatesController;
__decorate([
    (0, common_1.Patch)('me/profile'),
    (0, swagger_1.ApiOperation)({ summary: 'Update current candidate profile information' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'Profile updated successfully' }),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, update_candidate_profile_dto_1.UpdateCandidateProfileDto]),
    __metadata("design:returntype", Promise)
], CandidatesController.prototype, "updateMyProfile", null);
__decorate([
    (0, common_1.Get)('me/skills'),
    (0, swagger_1.ApiOperation)({ summary: 'Get current candidate skills' }),
    (0, swagger_1.ApiResponse)({
        status: 200,
        description: 'List of candidate skills with skill details',
    }),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], CandidatesController.prototype, "getMySkills", null);
__decorate([
    (0, common_1.Put)('me/skills'),
    (0, swagger_1.ApiOperation)({ summary: 'Update the candidate unified skill list' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'Updated list of candidate skills' }),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, update_candidate_skills_dto_1.UpdateCandidateSkillsDto]),
    __metadata("design:returntype", Promise)
], CandidatesController.prototype, "updateMySkills", null);
__decorate([
    (0, common_1.Delete)('me/skills/:skillId'),
    (0, swagger_1.ApiOperation)({ summary: 'Remove a candidate-owned or AI-extracted skill' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'Skill removed successfully' }),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __param(1, (0, common_1.Param)('skillId', common_1.ParseUUIDPipe)),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String]),
    __metadata("design:returntype", Promise)
], CandidatesController.prototype, "removeMySkill", null);
exports.CandidatesController = CandidatesController = __decorate([
    (0, swagger_1.ApiTags)('Candidates'),
    (0, swagger_1.ApiBearerAuth)(),
    (0, common_1.UseGuards)(supabase_auth_guard_1.SupabaseAuthGuard),
    (0, common_1.Controller)('candidates'),
    __metadata("design:paramtypes", [candidates_service_1.CandidatesService])
], CandidatesController);
//# sourceMappingURL=candidates.controller.js.map