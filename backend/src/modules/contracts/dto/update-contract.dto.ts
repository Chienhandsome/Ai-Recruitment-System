import {
  IsEnum,
  IsInt,
  IsNumber,
  IsOptional,
  IsString,
  Max,
  Min,
} from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { ContractSigningMethod, ContractType } from '@prisma/client';

export class UpdateContractDto {
  @ApiPropertyOptional({ enum: ContractType })
  @IsEnum(ContractType)
  @IsOptional()
  contractType?: ContractType;

  @ApiPropertyOptional({ enum: ContractSigningMethod })
  @IsEnum(ContractSigningMethod)
  @IsOptional()
  signingMethod?: ContractSigningMethod;

  @ApiPropertyOptional({ description: 'Job position / title' })
  @IsString()
  @IsOptional()
  jobTitle?: string;

  @ApiPropertyOptional({ description: 'Official monthly salary' })
  @IsNumber()
  @IsOptional()
  salary?: number;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  salaryPeriod?: string;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  currency?: string;

  @ApiPropertyOptional({ description: 'Start date (ISO format)' })
  @IsString()
  @IsOptional()
  startDate?: string;

  @ApiPropertyOptional({ description: 'End date for fixed term contracts' })
  @IsString()
  @IsOptional()
  endDate?: string;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  workType?: string;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  workLocation?: string;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  workingHours?: string;

  @ApiPropertyOptional()
  @IsInt()
  @Min(0)
  @Max(12)
  @IsOptional()
  probationPeriodMonths?: number;

  @ApiPropertyOptional()
  @IsInt()
  @Min(50)
  @Max(100)
  @IsOptional()
  probationSalaryRate?: number;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  benefits?: string;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  customTerms?: string;
}
