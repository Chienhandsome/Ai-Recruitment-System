import { ApiProperty } from '@nestjs/swagger';
import { IsUUID } from 'class-validator';

export class CreateInterviewProcessDto {
  @ApiProperty({ description: 'Application UUID đã vượt qua vòng CV' })
  @IsUUID()
  applicationId!: string;
}
