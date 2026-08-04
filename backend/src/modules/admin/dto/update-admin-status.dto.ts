import { AccountStatus, JobStatus } from '@prisma/client';
import { ApiProperty } from '@nestjs/swagger';
import { IsEnum } from 'class-validator';

export class UpdateAdminJobStatusDto {
  @ApiProperty({ enum: JobStatus })
  @IsEnum(JobStatus)
  status!: JobStatus;
}

export class UpdateAdminAccountStatusDto {
  @ApiProperty({ enum: AccountStatus })
  @IsEnum(AccountStatus)
  status!: AccountStatus;
}
