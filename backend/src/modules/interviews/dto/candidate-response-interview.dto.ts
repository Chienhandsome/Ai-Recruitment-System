import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { CandidateResponseStatus } from '@prisma/client';
import {
  IsArray,
  IsEnum,
  IsISO8601,
  IsNotEmpty,
  IsOptional,
  IsString,
  MaxLength,
} from 'class-validator';

export class CandidateResponseInterviewDto {
  @ApiProperty({
    enum: CandidateResponseStatus,
    description: 'Phản hồi của ứng viên (ACCEPTED: Đồng ý, RESCHEDULE_REQUESTED: Xin dời lịch, DECLINED: Từ chối)',
    example: CandidateResponseStatus.ACCEPTED,
  })
  @IsEnum(CandidateResponseStatus)
  @IsNotEmpty()
  response!: CandidateResponseStatus;

  @ApiPropertyOptional({
    description: 'Lời nhắn hoặc lý do đề xuất đổi lịch / từ chối phỏng vấn',
    example: 'Em bị trùng lịch bảo vệ khóa luận, kính mong anh/chị dời lịch sang ca chiều cùng ngày.',
  })
  @IsOptional()
  @IsString()
  @MaxLength(1000)
  candidateNotes?: string;

  @ApiPropertyOptional({
    description: 'Danh sách các khung giờ ứng viên đề xuất (ISO 8601 strings)',
    example: ['2026-09-02T14:00:00.000Z', '2026-09-03T09:00:00.000Z'],
    type: [String],
  })
  @IsOptional()
  @IsArray()
  @IsISO8601({ strict: false }, { each: true })
  proposedSlots?: string[];
}
