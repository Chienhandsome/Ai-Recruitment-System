import { Type } from 'class-transformer';
import {
  IsArray,
  IsBoolean,
  IsIn,
  IsOptional,
  IsString,
  IsUUID,
  MaxLength,
  ValidateNested,
} from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';

class SourcedProfileRecordInputDto {
  @ApiPropertyOptional({ format: 'uuid' })
  @IsOptional()
  @IsUUID()
  id?: string;

  @ApiPropertyOptional({ enum: ['MANUAL', 'EXTRACTED'] })
  @IsOptional()
  @IsIn(['MANUAL', 'EXTRACTED'])
  source?: 'MANUAL' | 'EXTRACTED';
}

export class WorkExperienceInputDto extends SourcedProfileRecordInputDto {
  @IsString()
  companyName!: string;

  @IsString()
  positionTitle!: string;

  @IsOptional()
  @IsString()
  startDate?: string;

  @IsOptional()
  @IsString()
  endDate?: string | null;

  @IsOptional()
  @IsBoolean()
  isCurrent?: boolean;

  @IsOptional()
  @IsString()
  description?: string | null;

  @IsOptional()
  @IsString()
  achievements?: string | null;
}

export class EducationInputDto extends SourcedProfileRecordInputDto {
  @IsString()
  schoolName!: string;

  @IsOptional()
  @IsString()
  major?: string | null;

  @IsOptional()
  @IsString()
  degree?: string | null;

  @IsOptional()
  @IsString()
  startDate?: string | null;

  @IsOptional()
  @IsString()
  endDate?: string | null;
}

export class ProjectInputDto extends SourcedProfileRecordInputDto {
  @IsString()
  projectName!: string;

  @IsOptional()
  @IsString()
  projectRole?: string | null;

  @IsOptional()
  @IsString()
  description?: string | null;

  @IsOptional()
  technologies?: string[] | string | null;

  @IsOptional()
  @IsString()
  projectUrl?: string | null;

  @IsOptional()
  @IsString()
  startDate?: string | null;

  @IsOptional()
  @IsString()
  endDate?: string | null;
}

export class CertificateInputDto extends SourcedProfileRecordInputDto {
  @IsString()
  certificateName!: string;

  @IsOptional()
  @IsString()
  issuingOrganization?: string | null;

  @IsOptional()
  @IsString()
  issueDate?: string | null;
}

export class UpdateCandidateProfileDto {
  @ApiPropertyOptional({ description: 'Full name' })
  @IsOptional()
  @IsString()
  @MaxLength(200)
  fullName?: string;

  @ApiPropertyOptional({ description: 'Phone number' })
  @IsOptional()
  @IsString()
  @MaxLength(20)
  phone?: string | null;

  @ApiPropertyOptional({ description: 'Address' })
  @IsOptional()
  @IsString()
  @MaxLength(500)
  address?: string | null;

  @ApiPropertyOptional({ description: 'Desired job title' })
  @IsOptional()
  @IsString()
  @MaxLength(200)
  desiredTitle?: string | null;

  @ApiPropertyOptional({ description: 'Professional summary / bio' })
  @IsOptional()
  @IsString()
  @MaxLength(2000)
  professionalSummary?: string | null;

  @ApiPropertyOptional({ description: 'LinkedIn URL' })
  @IsOptional()
  @IsString()
  @MaxLength(500)
  linkedinUrl?: string | null;

  @ApiPropertyOptional({ description: 'GitHub URL' })
  @IsOptional()
  @IsString()
  @MaxLength(500)
  githubUrl?: string | null;

  @ApiPropertyOptional({ description: 'Portfolio / Website URL' })
  @IsOptional()
  @IsString()
  @MaxLength(500)
  portfolioUrl?: string | null;

  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => WorkExperienceInputDto)
  workExperiences?: WorkExperienceInputDto[];

  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => EducationInputDto)
  educations?: EducationInputDto[];

  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => ProjectInputDto)
  projects?: ProjectInputDto[];

  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CertificateInputDto)
  certificates?: CertificateInputDto[];
}
