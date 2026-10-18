import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsBoolean, IsOptional } from 'class-validator';

export class UpdateJobSeekingDto {
  @ApiProperty()
  @IsBoolean()
  enabled!: boolean;

  @ApiPropertyOptional({
    description: 'Explicit consent to show the profile to recruiters.',
  })
  @IsOptional()
  @IsBoolean()
  consent?: boolean;
}
