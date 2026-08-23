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
exports.ApplicationsController = void 0;
const common_1 = require("@nestjs/common");
const swagger_1 = require("@nestjs/swagger");
const applications_service_1 = require("./applications.service");
const create_application_dto_1 = require("./dto/create-application.dto");
const current_user_decorator_1 = require("../auth/decorators/current-user.decorator");
const supabase_auth_guard_1 = require("../auth/guards/supabase-auth.guard");
const roles_guard_1 = require("../auth/guards/roles.guard");
const roles_decorator_1 = require("../auth/decorators/roles.decorator");
const query_recruiter_applications_dto_1 = require("./dto/query-recruiter-applications.dto");
const query_my_applications_dto_1 = require("./dto/query-my-applications.dto");
const update_application_stage_dto_1 = require("./dto/update-application-stage.dto");
let ApplicationsController = class ApplicationsController {
    applicationsService;
    constructor(applicationsService) {
        this.applicationsService = applicationsService;
    }
    async apply(user, dto) {
        return this.applicationsService.applyForJob(user.id, dto);
    }
    findMine(user, query) {
        return this.applicationsService.findMine(user.id, query);
    }
    findAllForRecruiter(user, query) {
        return this.applicationsService.findAllForRecruiter(user.id, query);
    }
    findOneForRecruiter(user, id) {
        return this.applicationsService.findOneForRecruiter(user.id, id);
    }
    updateStage(user, id, dto) {
        return this.applicationsService.updateStage(user.id, id, dto);
    }
};
exports.ApplicationsController = ApplicationsController;
__decorate([
    (0, common_1.Post)(),
    (0, roles_decorator_1.Roles)('CANDIDATE'),
    (0, common_1.HttpCode)(common_1.HttpStatus.CREATED),
    (0, swagger_1.ApiOperation)({ summary: 'Apply for a job as a candidate' }),
    (0, swagger_1.ApiResponse)({
        status: 201,
        description: 'Application submitted successfully.',
    }),
    (0, swagger_1.ApiResponse)({
        status: 400,
        description: 'Missing, unprocessed, or unauthorized resume.',
    }),
    (0, swagger_1.ApiResponse)({
        status: 404,
        description: 'Candidate profile or active job not found.',
    }),
    (0, swagger_1.ApiResponse)({
        status: 409,
        description: 'Candidate already applied for this job.',
    }),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, create_application_dto_1.CreateApplicationDto]),
    __metadata("design:returntype", Promise)
], ApplicationsController.prototype, "apply", null);
__decorate([
    (0, common_1.Get)('me'),
    (0, roles_decorator_1.Roles)('CANDIDATE'),
    (0, swagger_1.ApiOperation)({
        summary: 'List applications submitted by the current candidate',
    }),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __param(1, (0, common_1.Query)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, query_my_applications_dto_1.QueryMyApplicationsDto]),
    __metadata("design:returntype", void 0)
], ApplicationsController.prototype, "findMine", null);
__decorate([
    (0, common_1.Get)(),
    (0, roles_decorator_1.Roles)('RECRUITER'),
    (0, swagger_1.ApiOperation)({
        summary: 'List applications available to the current recruiter',
    }),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __param(1, (0, common_1.Query)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, query_recruiter_applications_dto_1.QueryRecruiterApplicationsDto]),
    __metadata("design:returntype", void 0)
], ApplicationsController.prototype, "findAllForRecruiter", null);
__decorate([
    (0, common_1.Get)(':id'),
    (0, roles_decorator_1.Roles)('RECRUITER'),
    (0, swagger_1.ApiOperation)({
        summary: 'Get a scoped application with AI evaluation details',
    }),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __param(1, (0, common_1.Param)('id', common_1.ParseUUIDPipe)),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String]),
    __metadata("design:returntype", void 0)
], ApplicationsController.prototype, "findOneForRecruiter", null);
__decorate([
    (0, common_1.Patch)(':id/stage'),
    (0, roles_decorator_1.Roles)('RECRUITER'),
    (0, swagger_1.ApiOperation)({ summary: 'Move an application to another recruitment stage' }),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __param(1, (0, common_1.Param)('id', common_1.ParseUUIDPipe)),
    __param(2, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String, update_application_stage_dto_1.UpdateApplicationStageDto]),
    __metadata("design:returntype", void 0)
], ApplicationsController.prototype, "updateStage", null);
exports.ApplicationsController = ApplicationsController = __decorate([
    (0, swagger_1.ApiTags)('Applications'),
    (0, swagger_1.ApiBearerAuth)(),
    (0, common_1.UseGuards)(supabase_auth_guard_1.SupabaseAuthGuard, roles_guard_1.RolesGuard),
    (0, common_1.Controller)('applications'),
    __metadata("design:paramtypes", [applications_service_1.ApplicationsService])
], ApplicationsController);
//# sourceMappingURL=applications.controller.js.map