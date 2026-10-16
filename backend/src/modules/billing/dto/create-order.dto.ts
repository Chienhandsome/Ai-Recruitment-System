import { ApiProperty } from '@nestjs/swagger';
import { IsIn, IsString } from 'class-validator';
import { PACKAGE_CODES } from '../billing.types';

export const ORDERABLE_PACKAGE_CODES = [
  PACKAGE_CODES.HR_TEST,
  PACKAGE_CODES.HR_STARTER,
  PACKAGE_CODES.HR_PRO,
  PACKAGE_CODES.CANDIDATE_TEST,
  PACKAGE_CODES.CANDIDATE_PRO,
  PACKAGE_CODES.CANDIDATE_PREMIUM,
] as const;

export class CreateOrderDto {
  @ApiProperty({
    enum: ORDERABLE_PACKAGE_CODES,
  })
  @IsString()
  @IsIn(ORDERABLE_PACKAGE_CODES)
  packageCode!: string;
}
