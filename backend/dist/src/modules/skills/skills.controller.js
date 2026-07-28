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
exports.SkillsController = void 0;
const common_1 = require("@nestjs/common");
const swagger_1 = require("@nestjs/swagger");
const skills_service_1 = require("./skills.service");
const supabase_auth_guard_1 = require("../auth/guards/supabase-auth.guard");
const public_decorator_1 = require("../auth/decorators/public.decorator");
let SkillsController = class SkillsController {
    skillsService;
    constructor(skillsService) {
        this.skillsService = skillsService;
    }
    async getCategories() {
        return this.skillsService.getCategories();
    }
    async getSkills(categoryId, search) {
        return this.skillsService.getSkills(categoryId, search);
    }
    async createSkill(body) {
        return this.skillsService.createSkill(body.name, body.categoryId);
    }
    async updateSkill(id, body) {
        return this.skillsService.updateSkill(id, body.name, body.categoryId, body.type);
    }
    async addSkillAlias(id, body) {
        return this.skillsService.addSkillAlias(id, body.aliasName);
    }
    async deleteSkillAlias(aliasId) {
        return this.skillsService.deleteSkillAlias(aliasId);
    }
    async getUnrecognizedSkills() {
        return this.skillsService.getUnrecognizedSkills();
    }
    async mapUnrecognizedSkill(id, body) {
        return this.skillsService.mapUnrecognizedSkill(id, body.targetSkillId);
    }
    async approveUnrecognizedSkill(id, body) {
        return this.skillsService.approveUnrecognizedSkill(id, body.categoryId);
    }
    async rejectUnrecognizedSkill(id) {
        return this.skillsService.rejectUnrecognizedSkill(id);
    }
};
exports.SkillsController = SkillsController;
__decorate([
    (0, public_decorator_1.Public)(),
    (0, common_1.Get)('categories'),
    (0, swagger_1.ApiOperation)({ summary: 'Get all skill categories' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'Return list of skill categories' }),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], SkillsController.prototype, "getCategories", null);
__decorate([
    (0, public_decorator_1.Public)(),
    (0, common_1.Get)('skills'),
    (0, swagger_1.ApiOperation)({ summary: 'Get active skills by category or search term (searches name & aliases)' }),
    (0, swagger_1.ApiQuery)({ name: 'categoryId', required: false, type: String }),
    (0, swagger_1.ApiQuery)({ name: 'search', required: false, type: String }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'Return list of matching skills' }),
    __param(0, (0, common_1.Query)('categoryId')),
    __param(1, (0, common_1.Query)('search')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String]),
    __metadata("design:returntype", Promise)
], SkillsController.prototype, "getSkills", null);
__decorate([
    (0, common_1.Post)('skills'),
    (0, common_1.UseGuards)(supabase_auth_guard_1.SupabaseAuthGuard),
    (0, swagger_1.ApiOperation)({ summary: 'Create a new custom skill' }),
    (0, swagger_1.ApiResponse)({ status: 201, description: 'Skill created successfully' }),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], SkillsController.prototype, "createSkill", null);
__decorate([
    (0, common_1.Patch)('skills/:id'),
    (0, common_1.UseGuards)(supabase_auth_guard_1.SupabaseAuthGuard),
    (0, swagger_1.ApiOperation)({ summary: 'Update skill details (name, categoryId, type)' }),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", Promise)
], SkillsController.prototype, "updateSkill", null);
__decorate([
    (0, common_1.Post)('skills/:id/aliases'),
    (0, common_1.UseGuards)(supabase_auth_guard_1.SupabaseAuthGuard),
    (0, swagger_1.ApiOperation)({ summary: 'Add an alias to a skill' }),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", Promise)
], SkillsController.prototype, "addSkillAlias", null);
__decorate([
    (0, common_1.Delete)('skills/aliases/:aliasId'),
    (0, common_1.UseGuards)(supabase_auth_guard_1.SupabaseAuthGuard),
    (0, swagger_1.ApiOperation)({ summary: 'Delete a skill alias' }),
    __param(0, (0, common_1.Param)('aliasId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], SkillsController.prototype, "deleteSkillAlias", null);
__decorate([
    (0, public_decorator_1.Public)(),
    (0, common_1.Get)('skills/unrecognized'),
    (0, swagger_1.ApiOperation)({ summary: 'Get unrecognized skills pending review' }),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], SkillsController.prototype, "getUnrecognizedSkills", null);
__decorate([
    (0, common_1.Post)('skills/unrecognized/:id/map'),
    (0, common_1.UseGuards)(supabase_auth_guard_1.SupabaseAuthGuard),
    (0, swagger_1.ApiOperation)({ summary: 'Map unrecognized skill to an existing skill as an alias' }),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", Promise)
], SkillsController.prototype, "mapUnrecognizedSkill", null);
__decorate([
    (0, common_1.Post)('skills/unrecognized/:id/approve'),
    (0, common_1.UseGuards)(supabase_auth_guard_1.SupabaseAuthGuard),
    (0, swagger_1.ApiOperation)({ summary: 'Approve unrecognized skill as a new skill' }),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", Promise)
], SkillsController.prototype, "approveUnrecognizedSkill", null);
__decorate([
    (0, common_1.Delete)('skills/unrecognized/:id'),
    (0, common_1.UseGuards)(supabase_auth_guard_1.SupabaseAuthGuard),
    (0, swagger_1.ApiOperation)({ summary: 'Reject unrecognized skill' }),
    __param(0, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], SkillsController.prototype, "rejectUnrecognizedSkill", null);
exports.SkillsController = SkillsController = __decorate([
    (0, swagger_1.ApiTags)('Skills & Categories'),
    (0, common_1.Controller)(),
    __metadata("design:paramtypes", [skills_service_1.SkillsService])
], SkillsController);
//# sourceMappingURL=skills.controller.js.map