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
exports.CreateInterviewDto = void 0;
const swagger_1 = require("@nestjs/swagger");
const client_1 = require("@prisma/client");
const class_validator_1 = require("class-validator");
class CreateInterviewDto {
    applicationId;
    title;
    type = client_1.InterviewType.TECHNICAL;
    scheduledAt;
    durationMinutes = 60;
    locationOrLink;
    interviewerNotes;
}
exports.CreateInterviewDto = CreateInterviewDto;
__decorate([
    (0, swagger_1.ApiProperty)({ description: 'ID của đơn ứng tuyển (Application UUID)' }),
    (0, class_validator_1.IsUUID)(),
    (0, class_validator_1.IsNotEmpty)(),
    __metadata("design:type", String)
], CreateInterviewDto.prototype, "applicationId", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        description: 'Tiêu đề buổi phỏng vấn (vd: Phỏng vấn Vòng 1 - Kỹ thuật)',
        example: 'Phỏng vấn Vòng 1 - Kỹ thuật',
    }),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsNotEmpty)(),
    (0, class_validator_1.MaxLength)(200),
    __metadata("design:type", String)
], CreateInterviewDto.prototype, "title", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({
        enum: client_1.InterviewType,
        default: client_1.InterviewType.TECHNICAL,
        description: 'Hình thức phỏng vấn',
    }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsEnum)(client_1.InterviewType),
    __metadata("design:type", String)
], CreateInterviewDto.prototype, "type", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        description: 'Thời gian bắt đầu phỏng vấn (ISO 8601 string)',
        example: '2026-09-01T10:00:00Z',
    }),
    (0, class_validator_1.IsISO8601)(),
    (0, class_validator_1.IsNotEmpty)(),
    __metadata("design:type", String)
], CreateInterviewDto.prototype, "scheduledAt", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({
        description: 'Thời lượng phỏng vấn (phút)',
        default: 60,
        minimum: 15,
        maximum: 480,
    }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsInt)(),
    (0, class_validator_1.Min)(15),
    (0, class_validator_1.Max)(480),
    __metadata("design:type", Number)
], CreateInterviewDto.prototype, "durationMinutes", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({
        description: 'Link phòng họp trực tuyến (Google Meet/Zoom) hoặc địa chỉ văn phòng',
        example: 'https://meet.google.com/abc-defg-hij',
    }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.MaxLength)(1000),
    __metadata("design:type", String)
], CreateInterviewDto.prototype, "locationOrLink", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({
        description: 'Ghi chú chuẩn bị cho buổi phỏng vấn hoặc dặn dò ứng viên',
    }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.MaxLength)(5000),
    __metadata("design:type", String)
], CreateInterviewDto.prototype, "interviewerNotes", void 0);
//# sourceMappingURL=create-interview.dto.js.map