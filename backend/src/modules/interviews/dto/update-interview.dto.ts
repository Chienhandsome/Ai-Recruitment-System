import { ApiPropertyOptional } from '@nestjs/swagger';
import { CandidateResponseStatus, InterviewStatus, InterviewType } from '@prisma/client';
import {
  IsEnum,
  IsInt,
  IsISO8601,
  IsOptional,
  IsString,
  Max,
  MaxLength,
  Min,
} from 'class-validator';

export class UpdateInterviewDto {
  @ApiPropertyOptional({
    description: 'Tiêu đề buổi phỏng vấn',
    example: 'Phỏng vấn Vòng 1 - Kỹ thuật (Đã đổi lịch)',
  })
  @IsOptional()
  @IsString()
  @MaxLength(200)
  title?: string;

  @ApiPropertyOptional({
    enum: InterviewType,
    description: 'Hình thức phỏng vấn',
  })
  @IsOptional()
  @IsEnum(InterviewType)
  type?: InterviewType;

  @ApiPropertyOptional({
    enum: InterviewStatus,
    description: 'Trạng thái buổi phỏng vấn (SCHEDULED, RESCHEDULED, CANCELLED, COMPLETED)',
  })
  @IsOptional()
  @IsEnum(InterviewStatus)
  status?: InterviewStatus;

  @ApiPropertyOptional({
    enum: CandidateResponseStatus,
    description: 'Trạng thái phản hồi của ứng viên (PENDING, ACCEPTED, RESCHEDULE_REQUESTED, DECLINED)',
  })
  @IsOptional()
  @IsEnum(CandidateResponseStatus)
  candidateResponse?: CandidateResponseStatus;

  @ApiPropertyOptional({
    description: 'Thời gian mới của buổi phỏng vấn (ISO 8601 string)',
    example: '2026-09-02T14:00:00Z',
  })
  @IsOptional()
  @IsISO8601()
  scheduledAt?: string;

  @ApiPropertyOptional({
    description: 'Thời lượng phỏng vấn (phút)',
    minimum: 15,
    maximum: 480,
  })
  @IsOptional()
  @IsInt()
  @Min(15)
  @Max(480)
  durationMinutes?: number;

  @ApiPropertyOptional({
    description: 'Link phòng họp trực tuyến hoặc địa chỉ mới',
  })
  @IsOptional()
  @IsString()
  @MaxLength(1000)
  locationOrLink?: string;

  @ApiPropertyOptional({
    description: 'Ghi chú phỏng vấn cập nhật',
  })
  @IsOptional()
  @IsString()
  @MaxLength(5000)
  interviewerNotes?: string;
}
