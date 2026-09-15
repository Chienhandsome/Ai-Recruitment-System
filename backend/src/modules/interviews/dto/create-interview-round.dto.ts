import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  InterviewConductedBy,
  InterviewMode,
  InterviewPurpose,
} from '@prisma/client';
import {
  IsBoolean,
  IsEnum,
  IsInt,
  IsISO8601,
  IsNotEmpty,
  IsObject,
  IsOptional,
  IsString,
  Max,
  MaxLength,
  Min,
} from 'class-validator';

export class CreateInterviewRoundDto {
  @ApiProperty({ example: 'Vòng 1 - Sơ tuyển với AI' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(200)
  title!: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(2000)
  description?: string;

  @ApiProperty({ enum: InterviewConductedBy })
  @IsEnum(InterviewConductedBy)
  conductedBy!: InterviewConductedBy;

  @ApiProperty({ enum: InterviewMode })
  @IsEnum(InterviewMode)
  mode!: InterviewMode;

  @ApiPropertyOptional({
    enum: InterviewPurpose,
    default: InterviewPurpose.CUSTOM,
  })
  @IsOptional()
  @IsEnum(InterviewPurpose)
  purpose?: InterviewPurpose = InterviewPurpose.CUSTOM;

  @ApiPropertyOptional({ default: true })
  @IsOptional()
  @IsBoolean()
  required?: boolean = true;

  @ApiPropertyOptional()
  @IsOptional()
  @IsISO8601()
  scheduledAt?: string;

  @ApiPropertyOptional({ default: 60, minimum: 15, maximum: 480 })
  @IsOptional()
  @IsInt()
  @Min(15)
  @Max(480)
  durationMinutes?: number = 60;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(1000)
  locationOrLink?: string;

  @ApiPropertyOptional({ type: Object })
  @IsOptional()
  @IsObject()
  evaluationCriteria?: Record<string, unknown>;
}
