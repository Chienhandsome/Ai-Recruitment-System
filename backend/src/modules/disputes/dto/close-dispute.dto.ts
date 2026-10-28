import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString, MaxLength } from 'class-validator';

export class CloseDisputeDto {
  @ApiPropertyOptional({
    description: 'Lý do hoặc ghi chú kết thúc, lưu trữ hồ sơ tranh chấp của Ban Quản Trị',
    example: 'Các bên đã hoàn tất nghĩa vụ cam kết và bồi hoàn. Chính thức đóng hồ sơ vụ việc.',
  })
  @IsOptional()
  @IsString()
  @MaxLength(1000)
  closeReason?: string;
}
