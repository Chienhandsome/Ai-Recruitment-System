import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { InterviewType } from '@prisma/client';
import {
  IsEnum,
  IsInt,
  IsISO8601,
  IsNotEmpty,
  IsOptional,
  IsString,
  IsUUID,
  Max,
  MaxLength,
  Min,
} from 'class-validator';

export class CreateInterviewDto {
  @ApiProperty({ description: 'ID của đơn ứng tuyển (Application UUID)' })
  @IsUUID()
  @IsNotEmpty()
  applicationId!: string;

  @ApiProperty({
    description: 'Tiêu đề buổi phỏng vấn (vd: Phỏng vấn Vòng 1 - Kỹ thuật)',
    example: 'Phỏng vấn Vòng 1 - Kỹ thuật',
  })
  @IsString()
  @IsNotEmpty()
  @MaxLength(200)
  title!: string;

  @ApiPropertyOptional({
    enum: InterviewType,
    default: InterviewType.TECHNICAL,
    description: 'Hình thức phỏng vấn',
  })
  @IsOptional()
  @IsEnum(InterviewType)
  type?: InterviewType = InterviewType.TECHNICAL;

  @ApiProperty({
    description: 'Thời gian bắt đầu phỏng vấn (ISO 8601 string)',
    example: '2026-09-01T10:00:00Z',
  })
  @IsISO8601()
  @IsNotEmpty()
  scheduledAt!: string;

  @ApiPropertyOptional({
    description: 'Thời lượng phỏng vấn (phút)',
    default: 60,
    minimum: 15,
    maximum: 480,
  })
  @IsOptional()
  @IsInt()
  @Min(15)
  @Max(480)
  durationMinutes?: number = 60;

  @ApiPropertyOptional({
    description: 'Link phòng họp trực tuyến (Google Meet/Zoom) hoặc địa chỉ văn phòng',
    example: 'https://meet.google.com/abc-defg-hij',
  })
  @IsOptional()
  @IsString()
  @MaxLength(1000)
  locationOrLink?: string;

  @ApiPropertyOptional({
    description: 'Ghi chú chuẩn bị cho buổi phỏng vấn hoặc dặn dò ứng viên',
  })
  @IsOptional()
  @IsString()
  @MaxLength(5000)
  interviewerNotes?: string;
}
