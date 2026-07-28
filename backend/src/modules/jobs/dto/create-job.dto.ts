import { 
  IsString, 
  IsNotEmpty, 
  IsOptional, 
  IsEnum, 
  IsNumber, 
  IsUUID, 
  IsArray, 
  ValidateNested, 
  IsObject,
  IsBoolean,
  Min,
  Max
} from 'class-validator';
import { Type } from 'class-transformer';
import { EmploymentType, ExperienceLevel, SkillRequirementType, WorkingModel, ProofType } from '@prisma/client';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class JobSkillDto {
  @ApiProperty({ description: 'ID of the skill' })
  @IsUUID()
  skillId!: string;

  @ApiProperty({ enum: SkillRequirementType, default: SkillRequirementType.MANDATORY })
  @IsEnum(SkillRequirementType)
  requirementType!: SkillRequirementType;
}

export class JobCertificateDto {
  @ApiProperty({ description: 'Name of the certificate' })
  @IsString()
  @IsNotEmpty()
  certificateName!: string;

  @ApiProperty({ enum: SkillRequirementType, default: SkillRequirementType.MANDATORY })
  @IsEnum(SkillRequirementType)
  requirementType!: SkillRequirementType;
}

export class CreateJobDto {
  @ApiProperty({ description: 'Title of the job' })
  @IsString()
  @IsNotEmpty()
  title!: string;

  @ApiPropertyOptional({ description: 'Department ID' })
  @IsOptional()
  @IsUUID()
  departmentId?: string;

  @ApiProperty({ description: 'Job description (HTML/Markdown)' })
  @IsString()
  @IsNotEmpty()
  description!: string;

  @ApiPropertyOptional({ description: 'Job requirements' })
  @IsOptional()
  @IsString()
  requirements?: string;

  @ApiPropertyOptional({ description: 'Benefits offered' })
  @IsOptional()
  @IsString()
  benefits?: string;

  @ApiPropertyOptional({ enum: EmploymentType, default: EmploymentType.FULL_TIME })
  @IsOptional()
  @IsEnum(EmploymentType)
  employmentType?: EmploymentType;

  @ApiPropertyOptional({ enum: ExperienceLevel, default: ExperienceLevel.JUNIOR })
  @IsOptional()
  @IsEnum(ExperienceLevel)
  experienceLevel?: ExperienceLevel;

  @ApiPropertyOptional({ description: 'Minimum salary' })
  @IsOptional()
  @IsNumber()
  minSalary?: number;

  @ApiPropertyOptional({ description: 'Maximum salary' })
  @IsOptional()
  @IsNumber()
  maxSalary?: number;

  @ApiPropertyOptional({ description: 'Currency', default: 'VND' })
  @IsOptional()
  @IsString()
  currency?: string;

  @ApiPropertyOptional({ description: 'Location (Remote, Office, etc.)' })
  @IsOptional()
  @IsString()
  location?: string;

  @ApiPropertyOptional({ enum: WorkingModel, default: WorkingModel.ON_SITE })
  @IsOptional()
  @IsEnum(WorkingModel)
  workingModel?: WorkingModel;

  @ApiPropertyOptional({ description: 'Requires proof of work / portfolio' })
  @IsOptional()
  @IsBoolean()
  requiresProofOfWork?: boolean;

  @ApiPropertyOptional({ enum: ProofType })
  @IsOptional()
  @IsEnum(ProofType)
  proofOfWorkType?: ProofType;

  @ApiPropertyOptional({ description: 'Job Category ID' })
  @IsOptional()
  @IsUUID()
  categoryId?: string;

  @ApiPropertyOptional({ description: 'Expiry date' })
  @IsOptional()
  @IsString()
  expiryDate?: string;

  @ApiPropertyOptional({ description: 'Required experience in years' })
  @IsOptional()
  @IsNumber()
  requiredExperienceYears?: number;

  @ApiPropertyOptional({ description: 'AI Shortlist Threshold' })
  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(100)
  autoShortlistThreshold?: number;

  @ApiPropertyOptional({ description: 'AI Reject Threshold' })
  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(100)
  autoRejectThreshold?: number;

  @ApiPropertyOptional({ description: 'Reject on missing mandatory requirement' })
  @IsOptional()
  @IsBoolean()
  rejectOnMissingMandatory?: boolean;

  @ApiPropertyOptional({ description: 'Skill weight (0-100)' })
  @IsOptional()
  @IsNumber()
  skillWeight?: number;

  @ApiPropertyOptional({ description: 'Experience weight (0-100)' })
  @IsOptional()
  @IsNumber()
  experienceWeight?: number;

  @ApiPropertyOptional({ description: 'Education weight (0-100)' })
  @IsOptional()
  @IsNumber()
  educationWeight?: number;

  @ApiPropertyOptional({ description: 'Other weight (0-100)' })
  @IsOptional()
  @IsNumber()
  otherWeight?: number;

  @ApiPropertyOptional({ description: 'Skills associated with this job' })
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => JobSkillDto)
  skills?: JobSkillDto[];

  @ApiPropertyOptional({ description: 'Certifications required for this job' })
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => JobCertificateDto)
  certificates?: JobCertificateDto[];
}
