import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  ArrayMaxSize,
  ArrayMinSize,
  IsArray,
  IsInt,
  IsString,
  IsUUID,
  Max,
  MaxLength,
  Min,
} from 'class-validator';

export class CreateAiInterviewDto {
  @ApiProperty({ description: 'Application UUID' })
  @IsUUID()
  applicationId!: string;

  @ApiProperty({
    type: [String],
    minItems: 1,
    maxItems: 2,
    example: ['Bạn hãy giới thiệu ngắn gọn về bản thân.'],
  })
  @IsArray()
  @ArrayMinSize(1)
  @ArrayMaxSize(2)
  @IsString({ each: true })
  @MaxLength(700, { each: true })
  openingQuestions!: string[];

  @ApiProperty({
    type: [String],
    minItems: 1,
    maxItems: 10,
    example: ['technical_experience', 'problem_solving'],
  })
  @IsArray()
  @ArrayMinSize(1)
  @ArrayMaxSize(10)
  @IsString({ each: true })
  @MaxLength(100, { each: true })
  competencies!: string[];

  @ApiPropertyOptional({ default: 6, minimum: 1, maximum: 12 })
  @IsInt()
  @Min(1)
  @Max(12)
  maxQuestions: number = 6;

  @ApiPropertyOptional({ default: 72, minimum: 1, maximum: 240 })
  @IsInt()
  @Min(1)
  @Max(240)
  expiresInHours: number = 72;
}
