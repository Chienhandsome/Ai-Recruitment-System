import { ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  IsBoolean,
  IsInt,
  IsOptional,
  IsString,
  Max,
  MaxLength,
  Min,
} from 'class-validator';

export class UpdatePackageDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(120)
  name?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(2000)
  description?: string | null;

  @ApiPropertyOptional()
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  priceVnd?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(3650)
  durationDays?: number | null;

  @ApiPropertyOptional({
    description: 'null = unlimited active jobs',
  })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  maxActiveJobs?: number | null;

  @ApiPropertyOptional()
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  cvUnlockQuota?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsBoolean()
  aiRanking?: boolean;

  @ApiPropertyOptional()
  @IsOptional()
  @IsBoolean()
  advancedFilters?: boolean;

  @ApiPropertyOptional()
  @IsOptional()
  @IsBoolean()
  recruitmentStats?: boolean;

  @ApiPropertyOptional()
  @IsOptional()
  @IsBoolean()
  talentPoolAccess?: boolean;

  @ApiPropertyOptional()
  @IsOptional()
  @IsBoolean()
  jdFitAnalysis?: boolean;

  @ApiPropertyOptional()
  @IsOptional()
  @IsBoolean()
  cvImproveSuggestions?: boolean;

  @ApiPropertyOptional()
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  jdFitQuota?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsBoolean()
  aiMockInterview?: boolean;

  @ApiPropertyOptional()
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  mockInterviewQuota?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;

  @ApiPropertyOptional()
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  sortOrder?: number;
}
