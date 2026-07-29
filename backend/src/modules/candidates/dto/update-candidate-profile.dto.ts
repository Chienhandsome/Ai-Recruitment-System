import { IsOptional, IsString, MaxLength } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';

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
}
