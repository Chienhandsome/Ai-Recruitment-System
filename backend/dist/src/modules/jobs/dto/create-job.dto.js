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
exports.CreateJobDto = exports.JobCertificateDto = exports.JobSkillDto = void 0;
const class_validator_1 = require("class-validator");
const class_transformer_1 = require("class-transformer");
const client_1 = require("@prisma/client");
const swagger_1 = require("@nestjs/swagger");
class JobSkillDto {
    skillId;
    requirementType;
}
exports.JobSkillDto = JobSkillDto;
__decorate([
    (0, swagger_1.ApiProperty)({ description: 'ID of the skill' }),
    (0, class_validator_1.IsUUID)(),
    __metadata("design:type", String)
], JobSkillDto.prototype, "skillId", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        enum: client_1.SkillRequirementType,
        default: client_1.SkillRequirementType.MANDATORY,
    }),
    (0, class_validator_1.IsEnum)(client_1.SkillRequirementType),
    __metadata("design:type", String)
], JobSkillDto.prototype, "requirementType", void 0);
class JobCertificateDto {
    certificateName;
    requirementType;
}
exports.JobCertificateDto = JobCertificateDto;
__decorate([
    (0, swagger_1.ApiProperty)({ description: 'Name of the certificate' }),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsNotEmpty)(),
    __metadata("design:type", String)
], JobCertificateDto.prototype, "certificateName", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        enum: client_1.SkillRequirementType,
        default: client_1.SkillRequirementType.MANDATORY,
    }),
    (0, class_validator_1.IsEnum)(client_1.SkillRequirementType),
    __metadata("design:type", String)
], JobCertificateDto.prototype, "requirementType", void 0);
class CreateJobDto {
    title;
    departmentId;
    description;
    requirements;
    benefits;
    employmentType;
    experienceLevel;
    minSalary;
    maxSalary;
    currency;
    location;
    workingModel;
    requiresProofOfWork;
    proofOfWorkType;
    categoryId;
    expiryDate;
    requiredExperienceYears;
    levelRequirementMode;
    autoShortlistThreshold;
    autoRejectThreshold;
    rejectOnMissingMandatory;
    skillWeight;
    experienceWeight;
    educationWeight;
    otherWeight;
    skills;
    certificates;
}
exports.CreateJobDto = CreateJobDto;
__decorate([
    (0, swagger_1.ApiProperty)({ description: 'Title of the job' }),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsNotEmpty)(),
    __metadata("design:type", String)
], CreateJobDto.prototype, "title", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ description: 'Department ID' }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsUUID)(),
    __metadata("design:type", String)
], CreateJobDto.prototype, "departmentId", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ description: 'Job description (HTML/Markdown)' }),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsNotEmpty)(),
    __metadata("design:type", String)
], CreateJobDto.prototype, "description", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ description: 'Job requirements' }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], CreateJobDto.prototype, "requirements", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ description: 'Benefits offered' }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], CreateJobDto.prototype, "benefits", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({
        enum: client_1.EmploymentType,
        default: client_1.EmploymentType.FULL_TIME,
    }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsEnum)(client_1.EmploymentType),
    __metadata("design:type", String)
], CreateJobDto.prototype, "employmentType", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({
        enum: client_1.ExperienceLevel,
        default: client_1.ExperienceLevel.JUNIOR,
    }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsEnum)(client_1.ExperienceLevel),
    __metadata("design:type", String)
], CreateJobDto.prototype, "experienceLevel", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ description: 'Minimum salary' }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsNumber)(),
    __metadata("design:type", Number)
], CreateJobDto.prototype, "minSalary", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ description: 'Maximum salary' }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsNumber)(),
    __metadata("design:type", Number)
], CreateJobDto.prototype, "maxSalary", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ description: 'Currency', default: 'VND' }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], CreateJobDto.prototype, "currency", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ description: 'Location (Remote, Office, etc.)' }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], CreateJobDto.prototype, "location", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ enum: client_1.WorkingModel, default: client_1.WorkingModel.ON_SITE }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsEnum)(client_1.WorkingModel),
    __metadata("design:type", String)
], CreateJobDto.prototype, "workingModel", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ description: 'Requires proof of work / portfolio' }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsBoolean)(),
    __metadata("design:type", Boolean)
], CreateJobDto.prototype, "requiresProofOfWork", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ enum: client_1.ProofType }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsEnum)(client_1.ProofType),
    __metadata("design:type", String)
], CreateJobDto.prototype, "proofOfWorkType", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ description: 'Job Category ID' }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsUUID)(),
    __metadata("design:type", String)
], CreateJobDto.prototype, "categoryId", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ description: 'Expiry date' }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], CreateJobDto.prototype, "expiryDate", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ description: 'Required experience in years' }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsNumber)(),
    (0, class_validator_1.Min)(0),
    __metadata("design:type", Number)
], CreateJobDto.prototype, "requiredExperienceYears", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({
        enum: client_1.LevelRequirementMode,
        default: client_1.LevelRequirementMode.ADVISORY,
        description: 'Whether an experience-level gap is advisory or required',
    }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsEnum)(client_1.LevelRequirementMode),
    __metadata("design:type", String)
], CreateJobDto.prototype, "levelRequirementMode", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ description: 'AI Shortlist Threshold' }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsNumber)(),
    (0, class_validator_1.Min)(0),
    (0, class_validator_1.Max)(100),
    __metadata("design:type", Number)
], CreateJobDto.prototype, "autoShortlistThreshold", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ description: 'AI Reject Threshold' }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsNumber)(),
    (0, class_validator_1.Min)(0),
    (0, class_validator_1.Max)(100),
    __metadata("design:type", Number)
], CreateJobDto.prototype, "autoRejectThreshold", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({
        description: 'Reject on missing mandatory requirement',
    }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsBoolean)(),
    __metadata("design:type", Boolean)
], CreateJobDto.prototype, "rejectOnMissingMandatory", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ description: 'Skill weight (0-100)' }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsNumber)(),
    __metadata("design:type", Number)
], CreateJobDto.prototype, "skillWeight", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ description: 'Experience weight (0-100)' }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsNumber)(),
    __metadata("design:type", Number)
], CreateJobDto.prototype, "experienceWeight", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ description: 'Education weight (0-100)' }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsNumber)(),
    __metadata("design:type", Number)
], CreateJobDto.prototype, "educationWeight", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ description: 'Other weight (0-100)' }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsNumber)(),
    __metadata("design:type", Number)
], CreateJobDto.prototype, "otherWeight", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ description: 'Skills associated with this job' }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsArray)(),
    (0, class_validator_1.ValidateNested)({ each: true }),
    (0, class_transformer_1.Type)(() => JobSkillDto),
    __metadata("design:type", Array)
], CreateJobDto.prototype, "skills", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ description: 'Certifications required for this job' }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsArray)(),
    (0, class_validator_1.ValidateNested)({ each: true }),
    (0, class_transformer_1.Type)(() => JobCertificateDto),
    __metadata("design:type", Array)
], CreateJobDto.prototype, "certificates", void 0);
//# sourceMappingURL=create-job.dto.js.map