import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsEnum,
  IsNumber,
  IsOptional,
  IsString,
  Max,
  MaxLength,
  Min,
} from 'class-validator';

export enum InterviewRoundDecision {
  PASSED = 'PASSED',
  FAILED = 'FAILED',
}

export class DecideInterviewRoundDto {
  @ApiProperty({ enum: InterviewRoundDecision })
  @IsEnum(InterviewRoundDecision)
  decision!: InterviewRoundDecision;

  @ApiPropertyOptional({ minimum: 0, maximum: 100 })
  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(100)
  score?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(5000)
  note?: string;
}
