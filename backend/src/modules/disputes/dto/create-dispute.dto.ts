import {
  IsArray,
  IsEnum,
  IsNotEmpty,
  IsOptional,
  IsString,
  IsUUID,
  MinLength,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { DisputeCategory } from '@prisma/client';

export class CreateDisputeDto {
  @ApiProperty({ description: 'ID of the application involved' })
  @IsUUID()
  @IsNotEmpty()
  applicationId!: string;

  @ApiPropertyOptional({ description: 'ID of the contract (if any)' })
  @IsUUID()
  @IsOptional()
  contractId?: string;

  @ApiProperty({ enum: DisputeCategory, default: DisputeCategory.OTHER })
  @IsEnum(DisputeCategory)
  @IsNotEmpty()
  category!: DisputeCategory;

  @ApiProperty({ description: 'Brief summary of the issue' })
  @IsString()
  @IsNotEmpty()
  @MinLength(5)
  title!: string;

  @ApiProperty({ description: 'Detailed description of the violation or dispute' })
  @IsString()
  @IsNotEmpty()
  @MinLength(10)
  description!: string;

  @ApiPropertyOptional({ description: 'Optional screenshot/evidence URLs', type: [String] })
  @IsArray()
  @IsOptional()
  evidenceUrls?: string[];
}
