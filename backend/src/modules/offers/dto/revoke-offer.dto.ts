import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString } from 'class-validator';

export class RevokeOfferDto {
  @ApiPropertyOptional({
    description: 'Reason for revoking the offer (e.g., headcount budget cut, discrepancy in background check, etc.)',
    example: 'Thay đổi kế hoạch tuyển dụng quý này',
  })
  @IsOptional()
  @IsString()
  reason?: string;
}
