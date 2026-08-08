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
exports.UpdateCandidateProfileDto = exports.CertificateInputDto = exports.ProjectInputDto = exports.EducationInputDto = exports.WorkExperienceInputDto = void 0;
const class_transformer_1 = require("class-transformer");
const class_validator_1 = require("class-validator");
const swagger_1 = require("@nestjs/swagger");
class SourcedProfileRecordInputDto {
    id;
    source;
}
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ format: 'uuid' }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsUUID)(),
    __metadata("design:type", String)
], SourcedProfileRecordInputDto.prototype, "id", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ enum: ['MANUAL', 'EXTRACTED'] }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsIn)(['MANUAL', 'EXTRACTED']),
    __metadata("design:type", String)
], SourcedProfileRecordInputDto.prototype, "source", void 0);
class WorkExperienceInputDto extends SourcedProfileRecordInputDto {
    companyName;
    positionTitle;
    startDate;
    endDate;
    isCurrent;
    description;
    achievements;
}
exports.WorkExperienceInputDto = WorkExperienceInputDto;
__decorate([
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], WorkExperienceInputDto.prototype, "companyName", void 0);
__decorate([
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], WorkExperienceInputDto.prototype, "positionTitle", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], WorkExperienceInputDto.prototype, "startDate", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", Object)
], WorkExperienceInputDto.prototype, "endDate", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsBoolean)(),
    __metadata("design:type", Boolean)
], WorkExperienceInputDto.prototype, "isCurrent", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", Object)
], WorkExperienceInputDto.prototype, "description", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", Object)
], WorkExperienceInputDto.prototype, "achievements", void 0);
class EducationInputDto extends SourcedProfileRecordInputDto {
    schoolName;
    major;
    degree;
    startDate;
    endDate;
}
exports.EducationInputDto = EducationInputDto;
__decorate([
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], EducationInputDto.prototype, "schoolName", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", Object)
], EducationInputDto.prototype, "major", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", Object)
], EducationInputDto.prototype, "degree", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", Object)
], EducationInputDto.prototype, "startDate", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", Object)
], EducationInputDto.prototype, "endDate", void 0);
class ProjectInputDto extends SourcedProfileRecordInputDto {
    projectName;
    projectRole;
    description;
    technologies;
    projectUrl;
    startDate;
    endDate;
}
exports.ProjectInputDto = ProjectInputDto;
__decorate([
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], ProjectInputDto.prototype, "projectName", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", Object)
], ProjectInputDto.prototype, "projectRole", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", Object)
], ProjectInputDto.prototype, "description", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", Object)
], ProjectInputDto.prototype, "technologies", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", Object)
], ProjectInputDto.prototype, "projectUrl", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", Object)
], ProjectInputDto.prototype, "startDate", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", Object)
], ProjectInputDto.prototype, "endDate", void 0);
class CertificateInputDto extends SourcedProfileRecordInputDto {
    certificateName;
    issuingOrganization;
    issueDate;
}
exports.CertificateInputDto = CertificateInputDto;
__decorate([
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], CertificateInputDto.prototype, "certificateName", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", Object)
], CertificateInputDto.prototype, "issuingOrganization", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", Object)
], CertificateInputDto.prototype, "issueDate", void 0);
class UpdateCandidateProfileDto {
    fullName;
    phone;
    address;
    desiredTitle;
    professionalSummary;
    linkedinUrl;
    githubUrl;
    portfolioUrl;
    workExperiences;
    educations;
    projects;
    certificates;
}
exports.UpdateCandidateProfileDto = UpdateCandidateProfileDto;
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ description: 'Full name' }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.MaxLength)(200),
    __metadata("design:type", String)
], UpdateCandidateProfileDto.prototype, "fullName", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ description: 'Phone number' }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.MaxLength)(20),
    __metadata("design:type", Object)
], UpdateCandidateProfileDto.prototype, "phone", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ description: 'Address' }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.MaxLength)(500),
    __metadata("design:type", Object)
], UpdateCandidateProfileDto.prototype, "address", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ description: 'Desired job title' }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.MaxLength)(200),
    __metadata("design:type", Object)
], UpdateCandidateProfileDto.prototype, "desiredTitle", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ description: 'Professional summary / bio' }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.MaxLength)(2000),
    __metadata("design:type", Object)
], UpdateCandidateProfileDto.prototype, "professionalSummary", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ description: 'LinkedIn URL' }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.MaxLength)(500),
    __metadata("design:type", Object)
], UpdateCandidateProfileDto.prototype, "linkedinUrl", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ description: 'GitHub URL' }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.MaxLength)(500),
    __metadata("design:type", Object)
], UpdateCandidateProfileDto.prototype, "githubUrl", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ description: 'Portfolio / Website URL' }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.MaxLength)(500),
    __metadata("design:type", Object)
], UpdateCandidateProfileDto.prototype, "portfolioUrl", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsArray)(),
    (0, class_validator_1.ValidateNested)({ each: true }),
    (0, class_transformer_1.Type)(() => WorkExperienceInputDto),
    __metadata("design:type", Array)
], UpdateCandidateProfileDto.prototype, "workExperiences", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsArray)(),
    (0, class_validator_1.ValidateNested)({ each: true }),
    (0, class_transformer_1.Type)(() => EducationInputDto),
    __metadata("design:type", Array)
], UpdateCandidateProfileDto.prototype, "educations", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsArray)(),
    (0, class_validator_1.ValidateNested)({ each: true }),
    (0, class_transformer_1.Type)(() => ProjectInputDto),
    __metadata("design:type", Array)
], UpdateCandidateProfileDto.prototype, "projects", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsArray)(),
    (0, class_validator_1.ValidateNested)({ each: true }),
    (0, class_transformer_1.Type)(() => CertificateInputDto),
    __metadata("design:type", Array)
], UpdateCandidateProfileDto.prototype, "certificates", void 0);
//# sourceMappingURL=update-candidate-profile.dto.js.map