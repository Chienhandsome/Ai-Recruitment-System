import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsString, IsNotEmpty, IsOptional, IsBoolean } from 'class-validator';

export class ExtendJobExpiryDto {
  @ApiProperty({
    description: 'New expiration date (ISO string or YYYY-MM-DD, must be in the future)',
    example: '2026-10-31',
  })
  @IsString()
  @IsNotEmpty()
  expiryDate!: string;

  @ApiPropertyOptional({
    description: 'If true and the job was previously closed due to expiration, automatically reopen the job if target hires quota is not yet reached',
    default: true,
  })
  @IsOptional()
  @IsBoolean()
  reopenIfClosed?: boolean;
}
