import { IsNotEmpty, IsOptional, IsString } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class UploadSignedContractDto {
  @ApiProperty({ description: 'URL of the uploaded signed PDF file' })
  @IsString()
  @IsNotEmpty()
  signedPdfUrl!: string;

  @ApiPropertyOptional({ description: 'Optional note from recruiter' })
  @IsString()
  @IsOptional()
  note?: string;
}

export class ESignContractDto {
  @ApiProperty({ description: 'Data URL or image URL of the signature' })
  @IsString()
  @IsNotEmpty()
  signatureDataUrl!: string;

  @ApiPropertyOptional({ description: 'Optional note or confirmation' })
  @IsString()
  @IsOptional()
  note?: string;
}
