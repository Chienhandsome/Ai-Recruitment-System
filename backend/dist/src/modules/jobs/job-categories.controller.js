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
exports.JobCategoriesController = void 0;
const common_1 = require("@nestjs/common");
const cache_manager_1 = require("@nestjs/cache-manager");
const swagger_1 = require("@nestjs/swagger");
const jobs_service_1 = require("./jobs.service");
const public_decorator_1 = require("../auth/decorators/public.decorator");
let JobCategoriesController = class JobCategoriesController {
    jobsService;
    constructor(jobsService) {
        this.jobsService = jobsService;
    }
    async getJobCategories() {
        return this.jobsService.getJobCategories();
    }
};
exports.JobCategoriesController = JobCategoriesController;
__decorate([
    (0, public_decorator_1.Public)(),
    (0, common_1.UseInterceptors)(cache_manager_1.CacheInterceptor),
    (0, common_1.Get)(),
    (0, swagger_1.ApiOperation)({ summary: 'Get all job categories' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'Return list of job categories' }),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], JobCategoriesController.prototype, "getJobCategories", null);
exports.JobCategoriesController = JobCategoriesController = __decorate([
    (0, swagger_1.ApiTags)('Job Categories'),
    (0, common_1.Controller)('job-categories'),
    __metadata("design:paramtypes", [jobs_service_1.JobsService])
], JobCategoriesController);
//# sourceMappingURL=job-categories.controller.js.map