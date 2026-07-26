import { IsOptional, IsString, IsUUID, IsDateString, IsUrl } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';

export class UpdateRecruiterProfileDto {
  @ApiPropertyOptional({ description: 'Job title of the recruiter' })
  @IsOptional()
  @IsString()
  title?: string;

  @ApiPropertyOptional({ description: 'Full name of the user' })
  @IsOptional()
  @IsString()
  fullName?: string;

  @ApiPropertyOptional({ description: 'Phone number' })
  @IsOptional()
  @IsString()
  phone?: string;

  @ApiPropertyOptional({ description: 'Avatar URL' })
  @IsOptional()
  @IsUrl()
  avatarUrl?: string;

  @ApiPropertyOptional({ description: 'Date of birth' })
  @IsOptional()
  @IsDateString()
  birthDay?: string;

  @ApiPropertyOptional({ description: 'UUID of the company the recruiter belongs to' })
  @IsOptional()
  @IsUUID()
  companyId?: string;

  @ApiPropertyOptional({ description: 'UUID of the department the recruiter belongs to' })
  @IsOptional()
  @IsUUID()
  departmentId?: string;
}
