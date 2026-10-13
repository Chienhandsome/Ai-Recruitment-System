import { IsNotEmpty, IsString, MinLength } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CandidateFeedbackDto {
  @ApiProperty({ description: 'Detailed note or request for contract revisions' })
  @IsString()
  @IsNotEmpty()
  @MinLength(3)
  note!: string;
}
