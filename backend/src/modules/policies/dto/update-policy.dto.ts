import { IsBoolean, IsNotEmpty, IsOptional, IsString } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class UpdatePolicyDto {
  @ApiProperty({ description: 'Title of the policy' })
  @IsString()
  @IsNotEmpty()
  title!: string;

  @ApiPropertyOptional({ description: 'Short summary or description' })
  @IsString()
  @IsOptional()
  description?: string;

  @ApiProperty({ description: 'Full Markdown / HTML content' })
  @IsString()
  @IsNotEmpty()
  content!: string;

  @ApiPropertyOptional({ description: 'Whether the policy is active and published' })
  @IsBoolean()
  @IsOptional()
  isPublished?: boolean;
}
