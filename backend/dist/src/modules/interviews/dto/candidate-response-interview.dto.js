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
exports.CandidateResponseInterviewDto = void 0;
const swagger_1 = require("@nestjs/swagger");
const client_1 = require("@prisma/client");
const class_validator_1 = require("class-validator");
class CandidateResponseInterviewDto {
    response;
    candidateNotes;
    proposedSlots;
}
exports.CandidateResponseInterviewDto = CandidateResponseInterviewDto;
__decorate([
    (0, swagger_1.ApiProperty)({
        enum: client_1.CandidateResponseStatus,
        description: 'Phản hồi của ứng viên (ACCEPTED: Đồng ý, RESCHEDULE_REQUESTED: Xin dời lịch, DECLINED: Từ chối)',
        example: client_1.CandidateResponseStatus.ACCEPTED,
    }),
    (0, class_validator_1.IsEnum)(client_1.CandidateResponseStatus),
    (0, class_validator_1.IsNotEmpty)(),
    __metadata("design:type", String)
], CandidateResponseInterviewDto.prototype, "response", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({
        description: 'Lời nhắn hoặc lý do đề xuất đổi lịch / từ chối phỏng vấn',
        example: 'Em bị trùng lịch bảo vệ khóa luận, kính mong anh/chị dời lịch sang ca chiều cùng ngày.',
    }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.MaxLength)(1000),
    __metadata("design:type", String)
], CandidateResponseInterviewDto.prototype, "candidateNotes", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({
        description: 'Danh sách các khung giờ ứng viên đề xuất (ISO 8601 strings)',
        example: ['2026-09-02T14:00:00.000Z', '2026-09-03T09:00:00.000Z'],
        type: [String],
    }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsArray)(),
    (0, class_validator_1.IsISO8601)({ strict: false }, { each: true }),
    __metadata("design:type", Array)
], CandidateResponseInterviewDto.prototype, "proposedSlots", void 0);
//# sourceMappingURL=candidate-response-interview.dto.js.map