import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsNotEmpty, IsOptional, IsUUID } from 'class-validator';

export class CreateApplicationDto {
  @ApiProperty({
    description: 'The ID of the job being applied for',
    example: 'uuid-job-1234',
  })
  @IsUUID()
  @IsNotEmpty()
  jobId!: string;

  @ApiPropertyOptional({
    description:
      'Specific resume ID to use. If omitted, the primary resume is used.',
    example: 'uuid-resume-1234',
  })
  @IsUUID()
  @IsOptional()
  resumeId?: string;
}
