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
};
exports.SkillsController = SkillsController;
__decorate([
    (0, common_1.Get)('categories'),
    (0, swagger_1.ApiOperation)({ summary: 'Get all job categories' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'Return list of job categories' }),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], SkillsController.prototype, "getCategories", null);
__decorate([
    (0, common_1.Get)('skills'),
    (0, swagger_1.ApiOperation)({ summary: 'Get active skills by category or search term' }),
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
    (0, swagger_1.ApiOperation)({ summary: 'Create a new custom skill for a category' }),
    (0, swagger_1.ApiResponse)({ status: 201, description: 'Skill created successfully' }),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], SkillsController.prototype, "createSkill", null);
exports.SkillsController = SkillsController = __decorate([
    (0, swagger_1.ApiTags)('Skills & Categories'),
    (0, common_1.Controller)(),
    __metadata("design:paramtypes", [skills_service_1.SkillsService])
], SkillsController);
//# sourceMappingURL=skills.controller.js.map