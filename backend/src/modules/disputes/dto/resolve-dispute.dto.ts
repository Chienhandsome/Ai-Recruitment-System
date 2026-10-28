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
    description: 'Recruiter enforcement action: NONE, WARN, LOCK_RECRUITER',
    default: 'NONE',
  })
  @IsString()
  @IsOptional()
  enforcementAction?: 'NONE' | 'WARN' | 'LOCK_RECRUITER';

  @ApiPropertyOptional({ description: 'Notes on recruiter penalty or remedial requirements' })
  @IsString()
  @IsOptional()
  penaltyNotes?: string;

  @ApiPropertyOptional({ description: 'Penalty amount in VND' })
  @IsOptional()
  penaltyAmount?: number;

  @ApiPropertyOptional({ description: 'Compensation amount to candidate in VND' })
  @IsOptional()
  compensationAmount?: number;

  @ApiPropertyOptional({
    description: 'Candidate enforcement action: NONE, WARN, DEDUCT_RELIABILITY, SUSPEND_APPLY, LOCK_CANDIDATE',
    default: 'NONE',
  })
  @IsString()
  @IsOptional()
  candidateEnforcementAction?: 'NONE' | 'WARN' | 'DEDUCT_RELIABILITY' | 'SUSPEND_APPLY' | 'LOCK_CANDIDATE';

  @ApiPropertyOptional({ description: 'Candidate penalty notes / instructions' })
  @IsString()
  @IsOptional()
  candidatePenaltyNotes?: string;

  @ApiPropertyOptional({ description: 'Candidate reliability score deduction (e.g. 10, 15, 20)' })
  @IsOptional()
  candidateReliabilityDeduction?: number;

  @ApiPropertyOptional({ description: 'Candidate suspension days from applying (e.g. 14, 30)' })
  @IsOptional()
  candidateSuspensionDays?: number;
}
