import { ApiProperty } from '@nestjs/swagger';
import { IsIn, IsString } from 'class-validator';
import { PACKAGE_CODES } from '../billing.types';

export class CreateOrderDto {
  @ApiProperty({
    enum: [
      PACKAGE_CODES.HR_PRO,
      PACKAGE_CODES.CANDIDATE_PRO,
      PACKAGE_CODES.CANDIDATE_PREMIUM,
    ],
  })
  @IsString()
  @IsIn([
    PACKAGE_CODES.HR_PRO,
    PACKAGE_CODES.CANDIDATE_PRO,
    PACKAGE_CODES.CANDIDATE_PREMIUM,
  ])
  packageCode!: string;
}
