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

  @ApiPropertyOptional({ description: 'Notes on penalty or remedial requirements' })
  @IsString()
  @IsOptional()
  penaltyNotes?: string;

  @ApiPropertyOptional({ description: 'Penalty amount in VND' })
  @IsOptional()
  penaltyAmount?: number;

  @ApiPropertyOptional({ description: 'Compensation amount to candidate in VND' })
  @IsOptional()
  compensationAmount?: number;
}

