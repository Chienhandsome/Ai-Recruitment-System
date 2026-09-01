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
exports.InterviewsController = void 0;
const common_1 = require("@nestjs/common");
const swagger_1 = require("@nestjs/swagger");
const interviews_service_1 = require("./interviews.service");
const create_interview_dto_1 = require("./dto/create-interview.dto");
const update_interview_dto_1 = require("./dto/update-interview.dto");
const submit_interview_feedback_dto_1 = require("./dto/submit-interview-feedback.dto");
const query_interviews_dto_1 = require("./dto/query-interviews.dto");
const candidate_response_interview_dto_1 = require("./dto/candidate-response-interview.dto");
const current_user_decorator_1 = require("../auth/decorators/current-user.decorator");
const roles_decorator_1 = require("../auth/decorators/roles.decorator");
const roles_guard_1 = require("../auth/guards/roles.guard");
const supabase_auth_guard_1 = require("../auth/guards/supabase-auth.guard");
let InterviewsController = class InterviewsController {
    interviewsService;
    constructor(interviewsService) {
        this.interviewsService = interviewsService;
    }
    async create(user, dto) {
        return this.interviewsService.create(user.id, dto);
    }
    async findAllForRecruiter(user, query) {
        return this.interviewsService.findAllForRecruiter(user.id, query);
    }
    async findMineForCandidate(user) {
        return this.interviewsService.findMineForCandidate(user.id);
    }
    async findOne(user, id) {
        return this.interviewsService.findOne(user.id, id);
    }
    async update(user, id, dto) {
        return this.interviewsService.update(user.id, id, dto);
    }
    async submitFeedback(user, id, dto) {
        return this.interviewsService.submitFeedback(user.id, id, dto);
    }
    async respondToInterview(user, id, dto) {
        return this.interviewsService.respondToInterview(user.id, id, dto);
    }
};
exports.InterviewsController = InterviewsController;
__decorate([
    (0, common_1.Post)(),
    (0, roles_decorator_1.Roles)('RECRUITER'),
    (0, common_1.HttpCode)(common_1.HttpStatus.CREATED),
    (0, swagger_1.ApiOperation)({ summary: 'Lên lịch phỏng vấn mới cho ứng viên' }),
    (0, swagger_1.ApiResponse)({
        status: 201,
        description: 'Lịch phỏng vấn đã được tạo thành công.',
    }),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, create_interview_dto_1.CreateInterviewDto]),
    __metadata("design:returntype", Promise)
], InterviewsController.prototype, "create", null);
__decorate([
    (0, common_1.Get)(),
    (0, roles_decorator_1.Roles)('RECRUITER'),
    (0, swagger_1.ApiOperation)({ summary: 'Lấy danh sách các buổi phỏng vấn thuộc công ty của Recruiter' }),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __param(1, (0, common_1.Query)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, query_interviews_dto_1.QueryInterviewsDto]),
    __metadata("design:returntype", Promise)
], InterviewsController.prototype, "findAllForRecruiter", null);
__decorate([
    (0, common_1.Get)('my'),
    (0, roles_decorator_1.Roles)('CANDIDATE'),
    (0, swagger_1.ApiOperation)({ summary: 'Lấy danh sách các buổi phỏng vấn của ứng viên đang đăng nhập' }),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], InterviewsController.prototype, "findMineForCandidate", null);
__decorate([
    (0, common_1.Get)(':id'),
    (0, roles_decorator_1.Roles)('RECRUITER', 'CANDIDATE'),
    (0, swagger_1.ApiOperation)({ summary: 'Lấy thông tin chi tiết một buổi phỏng vấn' }),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __param(1, (0, common_1.Param)('id', common_1.ParseUUIDPipe)),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String]),
    __metadata("design:returntype", Promise)
], InterviewsController.prototype, "findOne", null);
__decorate([
    (0, common_1.Patch)(':id'),
    (0, roles_decorator_1.Roles)('RECRUITER'),
    (0, swagger_1.ApiOperation)({ summary: 'Cập nhật thông tin hoặc đổi lịch phỏng vấn' }),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __param(1, (0, common_1.Param)('id', common_1.ParseUUIDPipe)),
    __param(2, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String, update_interview_dto_1.UpdateInterviewDto]),
    __metadata("design:returntype", Promise)
], InterviewsController.prototype, "update", null);
__decorate([
    (0, common_1.Post)(':id/feedback'),
    (0, roles_decorator_1.Roles)('RECRUITER'),
    (0, common_1.HttpCode)(common_1.HttpStatus.OK),
    (0, swagger_1.ApiOperation)({ summary: 'Chấm điểm và gửi nhận xét đánh giá sau phỏng vấn' }),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __param(1, (0, common_1.Param)('id', common_1.ParseUUIDPipe)),
    __param(2, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String, submit_interview_feedback_dto_1.SubmitInterviewFeedbackDto]),
    __metadata("design:returntype", Promise)
], InterviewsController.prototype, "submitFeedback", null);
__decorate([
    (0, common_1.Patch)(':id/candidate-response'),
    (0, roles_decorator_1.Roles)('CANDIDATE'),
    (0, swagger_1.ApiOperation)({ summary: 'Ứng viên xác nhận, xin dời lịch hoặc từ chối phỏng vấn' }),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __param(1, (0, common_1.Param)('id', common_1.ParseUUIDPipe)),
    __param(2, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String, candidate_response_interview_dto_1.CandidateResponseInterviewDto]),
    __metadata("design:returntype", Promise)
], InterviewsController.prototype, "respondToInterview", null);
exports.InterviewsController = InterviewsController = __decorate([
    (0, swagger_1.ApiTags)('Interviews'),
    (0, swagger_1.ApiBearerAuth)(),
    (0, common_1.UseGuards)(supabase_auth_guard_1.SupabaseAuthGuard, roles_guard_1.RolesGuard),
    (0, common_1.Controller)('interviews'),
    __metadata("design:paramtypes", [interviews_service_1.InterviewsService])
], InterviewsController);
//# sourceMappingURL=interviews.controller.js.map