import {
  IsEnum,
  IsInt,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  IsUUID,
  Max,
  Min,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { ContractSigningMethod, ContractType } from '@prisma/client';

export class CreateContractDto {
  @ApiProperty({ description: 'ID of the application' })
  @IsUUID()
  @IsNotEmpty()
  applicationId!: string;

  @ApiPropertyOptional({ description: 'ID of the accepted offer (if any)' })
  @IsUUID()
  @IsOptional()
  offerId?: string;

  @ApiPropertyOptional({ enum: ContractType, default: ContractType.FIXED_TERM })
  @IsEnum(ContractType)
  @IsOptional()
  contractType?: ContractType;

  @ApiPropertyOptional({
    enum: ContractSigningMethod,
    default: ContractSigningMethod.MANUAL,
  })
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

  @ApiPropertyOptional({ default: 'MONTHLY' })
  @IsString()
  @IsOptional()
  salaryPeriod?: string;

  @ApiPropertyOptional({ default: 'VND' })
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

  @ApiPropertyOptional({ description: 'Work type: HYBRID, ON_SITE, REMOTE' })
  @IsString()
  @IsOptional()
  workType?: string;

  @ApiPropertyOptional({ description: 'Working address / location' })
  @IsString()
  @IsOptional()
  workLocation?: string;

  @ApiPropertyOptional({ description: 'Standard working hours' })
  @IsString()
  @IsOptional()
  workingHours?: string;

  @ApiPropertyOptional({ description: 'Probation period in months' })
  @IsInt()
  @Min(0)
  @Max(12)
  @IsOptional()
  probationPeriodMonths?: number;

  @ApiPropertyOptional({ description: 'Probation salary rate (percentage e.g. 85)' })
  @IsInt()
  @Min(50)
  @Max(100)
  @IsOptional()
  probationSalaryRate?: number;

  @ApiPropertyOptional({ description: 'Benefits and allowances' })
  @IsString()
  @IsOptional()
  benefits?: string;

  @ApiPropertyOptional({ description: 'Custom terms or legal clauses' })
  @IsString()
  @IsOptional()
  customTerms?: string;
}
