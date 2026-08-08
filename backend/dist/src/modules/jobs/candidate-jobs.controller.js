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
exports.CandidateJobsController = void 0;
const common_1 = require("@nestjs/common");
const swagger_1 = require("@nestjs/swagger");
const roles_decorator_1 = require("../auth/decorators/roles.decorator");
const roles_guard_1 = require("../auth/guards/roles.guard");
const supabase_auth_guard_1 = require("../auth/guards/supabase-auth.guard");
const current_user_decorator_1 = require("../auth/decorators/current-user.decorator");
const query_candidate_job_dto_1 = require("./dto/query-candidate-job.dto");
const jobs_service_1 = require("./jobs.service");
let CandidateJobsController = class CandidateJobsController {
    jobsService;
    constructor(jobsService) {
        this.jobsService = jobsService;
    }
    findAll(query) {
        return this.jobsService.findCandidateJobs(query);
    }
    findOne(id, user) {
        return this.jobsService.findCandidateJobById(id, user.id);
    }
};
exports.CandidateJobsController = CandidateJobsController;
__decorate([
    (0, common_1.Get)(),
    (0, swagger_1.ApiOperation)({ summary: 'Browse active published jobs as a candidate' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'Return paginated active jobs' }),
    __param(0, (0, common_1.Query)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [query_candidate_job_dto_1.QueryCandidateJobDto]),
    __metadata("design:returntype", void 0)
], CandidateJobsController.prototype, "findAll", null);
__decorate([
    (0, common_1.Get)(':id'),
    (0, swagger_1.ApiOperation)({ summary: 'Get an active published job for a candidate' }),
    (0, swagger_1.ApiResponse)({
        status: 200,
        description: 'Return candidate-safe job details',
    }),
    (0, swagger_1.ApiResponse)({ status: 404, description: 'Job is unavailable' }),
    __param(0, (0, common_1.Param)('id', common_1.ParseUUIDPipe)),
    __param(1, (0, current_user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", void 0)
], CandidateJobsController.prototype, "findOne", null);
exports.CandidateJobsController = CandidateJobsController = __decorate([
    (0, swagger_1.ApiTags)('Candidate Jobs'),
    (0, swagger_1.ApiBearerAuth)(),
    (0, common_1.UseGuards)(supabase_auth_guard_1.SupabaseAuthGuard, roles_guard_1.RolesGuard),
    (0, roles_decorator_1.Roles)('CANDIDATE'),
    (0, common_1.Controller)('candidate/jobs'),
    __metadata("design:paramtypes", [jobs_service_1.JobsService])
], CandidateJobsController);
//# sourceMappingURL=candidate-jobs.controller.js.map