import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { ApplicationStage } from '@prisma/client';
import {
  IsEnum,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  Max,
  MaxLength,
  Min,
} from 'class-validator';

export class SubmitInterviewFeedbackDto {
  @ApiProperty({
    description: 'Điểm đánh giá buổi phỏng vấn (thang điểm 0 - 100)',
    example: 85,
    minimum: 0,
    maximum: 100,
  })
  @IsNumber()
  @Min(0)
  @Max(100)
  score!: number;

  @ApiProperty({
    description: 'Nhận xét chi tiết và đánh giá của người phỏng vấn',
    example: 'Ứng viên có kiến thức chuyên môn vững, giao tiếp tốt và tư duy giải quyết vấn đề mạch lạc.',
  })
  @IsString()
  @IsNotEmpty()
  @MaxLength(5000)
  interviewerNotes!: string;

  @ApiPropertyOptional({
    enum: ApplicationStage,
    description: 'Giai đoạn tuyển dụng tiếp theo (mặc định tự động chuyển sang INTERVIEWED)',
    example: ApplicationStage.INTERVIEWED,
  })
  @IsOptional()
  @IsEnum(ApplicationStage)
  nextStage?: ApplicationStage = ApplicationStage.INTERVIEWED;
}
