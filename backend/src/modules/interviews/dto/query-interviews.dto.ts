import { ApiPropertyOptional } from '@nestjs/swagger';
import { InterviewStatus, InterviewType } from '@prisma/client';
import { Type } from 'class-transformer';
import {
  IsEnum,
  IsInt,
  IsOptional,
  IsUUID,
  Max,
  Min,
} from 'class-validator';

export class QueryInterviewsDto {
  @ApiPropertyOptional({ description: 'Lọc theo ID đơn ứng tuyển' })
  @IsOptional()
  @IsUUID()
  applicationId?: string;

  @ApiPropertyOptional({ description: 'Lọc theo ID bài đăng công việc' })
  @IsOptional()
  @IsUUID()
  jobId?: string;

  @ApiPropertyOptional({
    enum: InterviewStatus,
    description: 'Lọc theo trạng thái buổi phỏng vấn',
  })
  @IsOptional()
  @IsEnum(InterviewStatus)
  status?: InterviewStatus;

  @ApiPropertyOptional({
    enum: InterviewType,
    description: 'Lọc theo hình thức phỏng vấn',
  })
  @IsOptional()
  @IsEnum(InterviewType)
  type?: InterviewType;

  @ApiPropertyOptional({ default: 1, minimum: 1 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page: number = 1;

  @ApiPropertyOptional({ default: 20, minimum: 1, maximum: 100 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(100)
  limit: number = 20;
}
