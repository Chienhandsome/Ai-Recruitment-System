import { IsArray, IsNotEmpty, IsOptional, IsString, MinLength } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class RespondDisputeDto {
  @ApiProperty({ description: 'Message / response / appeal content' })
  @IsString()
  @IsNotEmpty()
  @MinLength(2)
  message!: string;

  @ApiPropertyOptional({ description: 'Optional screenshot or document evidence URLs', type: [String] })
  @IsArray()
  @IsOptional()
  evidenceUrls?: string[];

  @ApiPropertyOptional({ description: 'Whether this response is an appeal against an admin decision' })
  @IsOptional()
  isAppeal?: boolean;
}
