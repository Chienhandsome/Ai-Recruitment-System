import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString, MaxLength } from 'class-validator';

export class AcknowledgeDisputeDto {
  @ApiPropertyOptional({
    description: 'Ý kiến hoặc lời cam kết chấp hành phán quyết khi xác nhận',
    example: 'Tôi đã hiểu và cam kết tuân thủ toàn bộ kết luận phán quyết của Ban Quản Trị.',
  })
  @IsOptional()
  @IsString()
  @MaxLength(1000)
  note?: string;
}
