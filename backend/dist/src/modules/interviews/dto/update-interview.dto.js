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
exports.UpdateInterviewDto = void 0;
const swagger_1 = require("@nestjs/swagger");
const client_1 = require("@prisma/client");
const class_validator_1 = require("class-validator");
class UpdateInterviewDto {
    title;
    type;
    status;
    scheduledAt;
    durationMinutes;
    locationOrLink;
    interviewerNotes;
}
exports.UpdateInterviewDto = UpdateInterviewDto;
__decorate([
    (0, swagger_1.ApiPropertyOptional)({
        description: 'Tiêu đề buổi phỏng vấn',
        example: 'Phỏng vấn Vòng 1 - Kỹ thuật (Đã đổi lịch)',
    }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.MaxLength)(200),
    __metadata("design:type", String)
], UpdateInterviewDto.prototype, "title", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({
        enum: client_1.InterviewType,
        description: 'Hình thức phỏng vấn',
    }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsEnum)(client_1.InterviewType),
    __metadata("design:type", String)
], UpdateInterviewDto.prototype, "type", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({
        enum: client_1.InterviewStatus,
        description: 'Trạng thái buổi phỏng vấn (SCHEDULED, RESCHEDULED, CANCELLED, COMPLETED)',
    }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsEnum)(client_1.InterviewStatus),
    __metadata("design:type", String)
], UpdateInterviewDto.prototype, "status", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({
        description: 'Thời gian mới của buổi phỏng vấn (ISO 8601 string)',
        example: '2026-09-02T14:00:00Z',
    }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsISO8601)(),
    __metadata("design:type", String)
], UpdateInterviewDto.prototype, "scheduledAt", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({
        description: 'Thời lượng phỏng vấn (phút)',
        minimum: 15,
        maximum: 480,
    }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsInt)(),
    (0, class_validator_1.Min)(15),
    (0, class_validator_1.Max)(480),
    __metadata("design:type", Number)
], UpdateInterviewDto.prototype, "durationMinutes", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({
        description: 'Link phòng họp trực tuyến hoặc địa chỉ mới',
    }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.MaxLength)(1000),
    __metadata("design:type", String)
], UpdateInterviewDto.prototype, "locationOrLink", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({
        description: 'Ghi chú phỏng vấn cập nhật',
    }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.MaxLength)(5000),
    __metadata("design:type", String)
], UpdateInterviewDto.prototype, "interviewerNotes", void 0);
//# sourceMappingURL=update-interview.dto.js.map