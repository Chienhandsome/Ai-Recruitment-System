import { ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsDateString,
  IsNumber,
  IsOptional,
  IsString,
  Min,
} from 'class-validator';
import { Type } from 'class-transformer';

export class UpdateOfferDto {
  @ApiPropertyOptional({ description: 'Offered base salary amount', example: 26000000 })
  @IsOptional()
  @IsNumber()
  @Min(0)
  @Type(() => Number)
  salary?: number;

  @ApiPropertyOptional({ description: 'Salary period', default: 'MONTHLY' })
  @IsOptional()
  @IsString()
  salaryPeriod?: string;

  @ApiPropertyOptional({ description: 'Currency', default: 'VND' })
  @IsOptional()
  @IsString()
  currency?: string;

  @ApiPropertyOptional({
    description: 'Expected onboarding start date',
    example: '2026-10-15T09:00:00.000Z',
  })
  @IsOptional()
  @IsDateString()
  startDate?: string;

  @ApiPropertyOptional({
    description: 'Deadline for candidate to respond to the offer',
    example: '2026-10-07T17:00:00.000Z',
  })
  @IsOptional()
  @IsDateString()
  expiresAt?: string;

  @ApiPropertyOptional({
    description: 'Working model (ONSITE, HYBRID, REMOTE)',
    example: 'HYBRID',
  })
  @IsOptional()
  @IsString()
  workType?: string;

  @ApiPropertyOptional({
    description: 'Office / work location address',
  })
  @IsOptional()
  @IsString()
  workLocation?: string;

  @ApiPropertyOptional({
    description: 'Benefits and bonus structure',
  })
  @IsOptional()
  @IsString()
  benefits?: string;

  @ApiPropertyOptional({
    description: 'Special notes or revised terms from HR',
  })
  @IsOptional()
  @IsString()
  notes?: string;

  @ApiPropertyOptional({
    description: 'Direct contact person name for candidate inquiries',
  })
  @IsOptional()
  @IsString()
  contactName?: string;

  @ApiPropertyOptional({
    description: 'Direct contact email for candidate inquiries',
  })
  @IsOptional()
  @IsString()
  contactEmail?: string;

  @ApiPropertyOptional({
    description: 'Direct contact phone for candidate inquiries',
  })
  @IsOptional()
  @IsString()
  contactPhone?: string;
}
