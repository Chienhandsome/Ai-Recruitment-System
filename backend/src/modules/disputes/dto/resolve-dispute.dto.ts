import { IsEnum, IsNotEmpty, IsOptional, IsString } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { DisputeStatus } from '@prisma/client';

export class ResolveDisputeDto {
  @ApiProperty({ enum: DisputeStatus })
  @IsEnum(DisputeStatus)
  @IsNotEmpty()
  status!: DisputeStatus;

  @ApiProperty({ description: 'Admin official resolution / verdict statement' })
  @IsString()
  @IsNotEmpty()
  adminResolution!: string;

  @ApiPropertyOptional({
    description: 'Enforcement action: NONE, WARN, LOCK_RECRUITER',
    default: 'NONE',
  })
  @IsString()
  @IsOptional()
  enforcementAction?: 'NONE' | 'WARN' | 'LOCK_RECRUITER';
}
