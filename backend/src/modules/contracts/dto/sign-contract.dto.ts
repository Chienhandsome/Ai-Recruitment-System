import { IsNotEmpty, IsOptional, IsString, Length } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class RequestContractOtpDto {
  @ApiPropertyOptional({ description: 'Optional email override for receiving OTP' })
  @IsString()
  @IsOptional()
  email?: string;
}

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

  @ApiProperty({ description: '6-digit OTP verification code sent to signer email' })
  @IsString()
  @IsNotEmpty()
  @Length(6, 6, { message: 'Mã xác thực OTP phải có đúng 6 chữ số.' })
  otpCode!: string;

  @ApiPropertyOptional({ description: 'Explicit acknowledgement of individual contract terms' })
  @IsOptional()
  acceptedContractTerms?: boolean;

  @ApiPropertyOptional({ description: 'Explicit acknowledgement of platform terms & dispute policies' })
  @IsOptional()
  acceptedPlatformTerms?: boolean;

  @ApiPropertyOptional({ description: 'Optional note or confirmation' })
  @IsString()
  @IsOptional()
  note?: string;
}

