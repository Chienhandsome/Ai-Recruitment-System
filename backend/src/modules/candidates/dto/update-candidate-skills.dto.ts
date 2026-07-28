import {
  IsArray,
  IsBoolean,
  IsEnum,
  IsNumber,
  IsOptional,
  IsUUID,
  Min,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';
import { ProficiencyLevel } from '@prisma/client';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CandidateSkillItemDto {
  @ApiProperty({ description: 'ID of the skill from the skills dictionary' })
  @IsUUID()
  skillId!: string;

  @ApiProperty({
    enum: ProficiencyLevel,
    default: ProficiencyLevel.BEGINNER,
    description: 'Proficiency level for this skill',
  })
  @IsEnum(ProficiencyLevel)
  proficiencyLevel!: ProficiencyLevel;

  @ApiPropertyOptional({ description: 'Years of experience with this skill' })
  @IsOptional()
  @IsNumber()
  @Min(0)
  @Type(() => Number)
  yearsExperience?: number;

  @ApiPropertyOptional({
    description: 'Whether this is a primary/highlight skill',
    default: false,
  })
  @IsOptional()
  @IsBoolean()
  @Type(() => Boolean)
  isPrimary?: boolean;
}

export class UpdateCandidateSkillsDto {
  @ApiProperty({
    type: [CandidateSkillItemDto],
    description: 'Array of skills to set for the candidate (replaces SELF_DECLARED skills)',
  })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CandidateSkillItemDto)
  skills!: CandidateSkillItemDto[];
}
