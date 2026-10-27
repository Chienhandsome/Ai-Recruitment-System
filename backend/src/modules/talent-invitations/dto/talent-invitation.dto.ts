import { Type, Transform } from 'class-transformer';
import {
  IsInt,
  IsOptional,
  IsString,
  IsUUID,
  Max,
  MaxLength,
  Min,
} from 'class-validator';

export class CreateTalentInvitationDto {
  @IsUUID()
  candidateId!: string;

  @IsUUID()
  jobId!: string;

  @IsOptional()
  @IsString()
  @MaxLength(2000)
  @Transform(({ value }: { value: unknown }) =>
    typeof value === 'string' ? value.trim() : value,
  )
  message?: string;
}

export class AcceptTalentInvitationDto {
  @IsUUID()
  resumeId!: string;
}

export class QueryInvitationJobsDto {
  @IsOptional()
  @IsUUID()
  candidateId?: string;
}

export class QueryTalentInvitationsDto {
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page = 1;

  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(50)
  limit = 12;

  @IsOptional()
  @IsUUID()
  candidateId?: string;

  @IsOptional()
  @IsUUID()
  invitationId?: string;
}
