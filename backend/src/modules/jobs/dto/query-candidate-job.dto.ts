import { Type } from 'class-transformer';
import {
  IsEnum,
  IsInt,
  IsOptional,
  IsString,
  IsUUID,
  Max,
  MaxLength,
  Min,
} from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { EmploymentType, WorkingModel } from '@prisma/client';

export class QueryCandidateJobDto {
  @ApiPropertyOptional({ description: 'Search jobs, companies, or skills' })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  search?: string;

  @ApiPropertyOptional({ description: 'Filter by job category ID' })
  @IsOptional()
  @IsUUID()
  categoryId?: string;

  @ApiPropertyOptional({ enum: EmploymentType })
  @IsOptional()
  @IsEnum(EmploymentType)
  employmentType?: EmploymentType;

  @ApiPropertyOptional({ enum: WorkingModel })
  @IsOptional()
  @IsEnum(WorkingModel)
  workingModel?: WorkingModel;

  @ApiPropertyOptional({ description: 'Filter by location' })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  location?: string;

  @ApiPropertyOptional({ default: 1, minimum: 1 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page = 1;

  @ApiPropertyOptional({ default: 12, minimum: 1, maximum: 50 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(50)
  limit = 12;
}
