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

  @ApiPropertyOptional({ description: 'Probation period in months (Max 6 months per Art. 25 Labor Code 2019)' })
  @IsInt()
  @Min(0)
  @Max(6)
  @IsOptional()
  probationPeriodMonths?: number;

  @ApiPropertyOptional({ description: 'Probation salary rate (percentage min 85% per Art. 26 Labor Code 2019)' })
  @IsInt()
  @Min(85)
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
