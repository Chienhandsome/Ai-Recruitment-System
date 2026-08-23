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
exports.SubmitInterviewFeedbackDto = void 0;
const swagger_1 = require("@nestjs/swagger");
const client_1 = require("@prisma/client");
const class_validator_1 = require("class-validator");
class SubmitInterviewFeedbackDto {
    score;
    interviewerNotes;
    nextStage = client_1.ApplicationStage.INTERVIEWED;
}
exports.SubmitInterviewFeedbackDto = SubmitInterviewFeedbackDto;
__decorate([
    (0, swagger_1.ApiProperty)({
        description: 'Điểm đánh giá buổi phỏng vấn (thang điểm 0 - 100)',
        example: 85,
        minimum: 0,
        maximum: 100,
    }),
    (0, class_validator_1.IsNumber)(),
    (0, class_validator_1.Min)(0),
    (0, class_validator_1.Max)(100),
    __metadata("design:type", Number)
], SubmitInterviewFeedbackDto.prototype, "score", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        description: 'Nhận xét chi tiết và đánh giá của người phỏng vấn',
        example: 'Ứng viên có kiến thức chuyên môn vững, giao tiếp tốt và tư duy giải quyết vấn đề mạch lạc.',
    }),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsNotEmpty)(),
    (0, class_validator_1.MaxLength)(5000),
    __metadata("design:type", String)
], SubmitInterviewFeedbackDto.prototype, "interviewerNotes", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({
        enum: client_1.ApplicationStage,
        description: 'Giai đoạn tuyển dụng tiếp theo (mặc định tự động chuyển sang INTERVIEWED)',
        example: client_1.ApplicationStage.INTERVIEWED,
    }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsEnum)(client_1.ApplicationStage),
    __metadata("design:type", String)
], SubmitInterviewFeedbackDto.prototype, "nextStage", void 0);
//# sourceMappingURL=submit-interview-feedback.dto.js.map