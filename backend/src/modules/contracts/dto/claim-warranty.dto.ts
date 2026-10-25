import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsEnum, IsNotEmpty, IsOptional, IsString, MaxLength } from 'class-validator';
import { WarrantyCompensationType, WarrantyReason } from '@prisma/client';

export class ClaimWarrantyDto {
  @ApiProperty({
    description: 'Lý do yêu cầu bảo hành tuyển dụng',
    enum: WarrantyReason,
    example: WarrantyReason.NO_SHOW,
  })
  @IsEnum(WarrantyReason)
  @IsNotEmpty()
  reason!: WarrantyReason;

  @ApiPropertyOptional({
    description: 'Hình thức bồi hoàn mong muốn (Mặc định: CREDIT_REFUND)',
    enum: WarrantyCompensationType,
    default: WarrantyCompensationType.CREDIT_REFUND,
    example: WarrantyCompensationType.CREDIT_REFUND,
  })
  @IsOptional()
  @IsEnum(WarrantyCompensationType)
  compensationType?: WarrantyCompensationType;

  @ApiPropertyOptional({
    description: 'Mô tả chi tiết sự việc hoặc lý do ứng viên bùng việc / nghỉ việc sớm',
    maxLength: 2000,
  })
  @IsOptional()
  @IsString()
  @MaxLength(2000)
  note?: string;

  @ApiPropertyOptional({
    description: 'Đường dẫn ảnh/file minh chứng (email, tin nhắn từ chối, v.v.)',
  })
  @IsOptional()
  @IsString()
  evidenceUrl?: string;
}

export class CandidateWarrantyFeedbackDto {
  @ApiProperty({
    description: 'Nội dung phản hồi hoặc giải trình của ứng viên về sự việc nhận việc / nghỉ việc sớm',
    example: 'Tôi xin xác nhận do lý do cá nhân đã xin thôi việc sớm',
  })
  @IsString()
  @IsNotEmpty()
  @MaxLength(2000)
  feedback!: string;

  @ApiPropertyOptional({
    description: 'Đường dẫn tệp/ảnh minh chứng giải trình của ứng viên',
  })
  @IsOptional()
  @IsString()
  evidenceUrl?: string;
}

export class AdminResolveWarrantyDto {
  @ApiPropertyOptional({
    description: 'Ghi chú thẩm định của Quản trị viên (lý do phê duyệt hoặc lý do từ chối)',
    example: 'Đã xác minh đối soát, phê duyệt hoàn 1 CV Credit và gia hạn tin.',
  })
  @IsOptional()
  @IsString()
  @MaxLength(2000)
  adminNote?: string;
}

