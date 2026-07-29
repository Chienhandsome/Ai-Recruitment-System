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
exports.UpdateCandidateSkillsDto = exports.CandidateSkillItemDto = void 0;
const class_validator_1 = require("class-validator");
const class_transformer_1 = require("class-transformer");
const client_1 = require("@prisma/client");
const swagger_1 = require("@nestjs/swagger");
class CandidateSkillItemDto {
    skillId;
    proficiencyLevel;
    yearsExperience;
    isPrimary;
}
exports.CandidateSkillItemDto = CandidateSkillItemDto;
__decorate([
    (0, swagger_1.ApiProperty)({ description: 'ID of the skill from the skills dictionary' }),
    (0, class_validator_1.IsUUID)(),
    __metadata("design:type", String)
], CandidateSkillItemDto.prototype, "skillId", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        enum: client_1.ProficiencyLevel,
        default: client_1.ProficiencyLevel.BEGINNER,
        description: 'Proficiency level for this skill',
    }),
    (0, class_validator_1.IsEnum)(client_1.ProficiencyLevel),
    __metadata("design:type", String)
], CandidateSkillItemDto.prototype, "proficiencyLevel", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ description: 'Years of experience with this skill' }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsNumber)(),
    (0, class_validator_1.Min)(0),
    (0, class_transformer_1.Type)(() => Number),
    __metadata("design:type", Number)
], CandidateSkillItemDto.prototype, "yearsExperience", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({
        description: 'Whether this is a primary/highlight skill',
        default: false,
    }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsBoolean)(),
    (0, class_transformer_1.Type)(() => Boolean),
    __metadata("design:type", Boolean)
], CandidateSkillItemDto.prototype, "isPrimary", void 0);
class UpdateCandidateSkillsDto {
    skills;
}
exports.UpdateCandidateSkillsDto = UpdateCandidateSkillsDto;
__decorate([
    (0, swagger_1.ApiProperty)({
        type: [CandidateSkillItemDto],
        description: 'Array of skills to set for the candidate (replaces SELF_DECLARED skills)',
    }),
    (0, class_validator_1.IsArray)(),
    (0, class_validator_1.ValidateNested)({ each: true }),
    (0, class_transformer_1.Type)(() => CandidateSkillItemDto),
    __metadata("design:type", Array)
], UpdateCandidateSkillsDto.prototype, "skills", void 0);
//# sourceMappingURL=update-candidate-skills.dto.js.map