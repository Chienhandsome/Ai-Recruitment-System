import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString, IsUUID, MaxLength, MinLength } from 'class-validator';

export class CreateJdFitAnalysisDto {
  @ApiProperty()
  @IsUUID()
  jobId!: string;

  @ApiPropertyOptional({ description: 'Defaults to primary resume' })
  @IsOptional()
  @IsUUID()
  resumeId?: string;

  @ApiProperty({
    description: 'Client idempotency key — retries with same key do not re-consume quota',
  })
  @IsString()
  @MinLength(8)
  @MaxLength(100)
  requestId!: string;
}
