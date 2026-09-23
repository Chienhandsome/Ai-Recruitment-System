import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsDateString,
  IsEnum,
  IsNumber,
  IsOptional,
  IsPositive,
  IsString,
  IsUUID,
  Min,
} from 'class-validator';
import { Type } from 'class-transformer';

export class CreateOfferDto {
  @ApiProperty({ description: 'ID of the application to offer' })
  @IsUUID()
  applicationId!: string;

  @ApiProperty({ description: 'Offered base salary amount', example: 25000000 })
  @IsNumber()
  @Min(0)
  @Type(() => Number)
  salary!: number;

  @ApiPropertyOptional({ description: 'Salary period', default: 'MONTHLY' })
  @IsOptional()
  @IsString()
  salaryPeriod?: string;

  @ApiPropertyOptional({ description: 'Currency', default: 'VND' })
  @IsOptional()
  @IsString()
  currency?: string;

  @ApiProperty({
    description: 'Expected onboarding start date',
    example: '2026-10-01T09:00:00.000Z',
  })
  @IsDateString()
  startDate!: string;

  @ApiProperty({
    description: 'Deadline for candidate to respond to the offer',
    example: '2026-09-30T17:00:00.000Z',
  })
  @IsDateString()
  expiresAt!: string;

  @ApiPropertyOptional({
    description: 'Working model (ONSITE, HYBRID, REMOTE)',
    example: 'HYBRID',
  })
  @IsOptional()
  @IsString()
  workType?: string;

  @ApiPropertyOptional({
    description: 'Office / work location address',
    example: 'Tầng 12, Toà nhà Bitexco, Q.1, TP.HCM',
  })
  @IsOptional()
  @IsString()
  workLocation?: string;

  @ApiPropertyOptional({
    description: 'Benefits and bonus structure',
    example: 'Bảo hiểm PVI, Thưởng tháng 13, 15 ngày phép/năm',
  })
  @IsOptional()
  @IsString()
  benefits?: string;

  @ApiPropertyOptional({
    description: 'Special notes or welcome message from HR',
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
