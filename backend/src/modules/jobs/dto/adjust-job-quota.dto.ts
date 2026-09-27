import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsNumber, Min, IsOptional, IsBoolean } from 'class-validator';

export class AdjustJobQuotaDto {
  @ApiProperty({
    description: 'New target hires quota (must be at least 1)',
    example: 2,
    minimum: 1,
  })
  @IsNumber()
  @Min(1)
  targetHires!: number;

  @ApiPropertyOptional({
    description: 'If true and the job was previously closed due to reaching quota, automatically reopen the job if targetHires > current hired count',
    default: true,
  })
  @IsOptional()
  @IsBoolean()
  reopenIfClosed?: boolean;
}
