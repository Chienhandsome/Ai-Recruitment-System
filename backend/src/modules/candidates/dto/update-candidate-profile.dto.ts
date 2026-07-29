import { IsArray, IsBoolean, IsOptional, IsString, MaxLength } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';

export class WorkExperienceInputDto {
  @IsString()
  companyName: string;

  @IsString()
  positionTitle: string;

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

export class EducationInputDto {
  @IsString()
  schoolName: string;

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

export class ProjectInputDto {
  @IsString()
  projectName: string;

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

export class CertificateInputDto {
  @IsString()
  certificateName: string;

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
  workExperiences?: WorkExperienceInputDto[];

  @IsOptional()
  @IsArray()
  educations?: EducationInputDto[];

  @IsOptional()
  @IsArray()
  projects?: ProjectInputDto[];

  @IsOptional()
  @IsArray()
  certificates?: CertificateInputDto[];
}
