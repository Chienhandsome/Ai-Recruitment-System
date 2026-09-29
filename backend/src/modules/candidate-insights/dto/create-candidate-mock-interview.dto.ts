import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString, IsUUID, MaxLength, MinLength } from 'class-validator';

export class CreateCandidateMockInterviewDto {
  @ApiProperty({ description: 'Published job to practice against' })
  @IsUUID()
  jobId!: string;

  @ApiProperty({
    description: 'Client idempotency key',
  })
  @IsString()
  @MinLength(8)
  @MaxLength(100)
  requestId!: string;

  @ApiPropertyOptional({
    description: 'Optional application id; must belong to caller and match jobId',
  })
  @IsOptional()
  @IsUUID()
  applicationId?: string;
}
