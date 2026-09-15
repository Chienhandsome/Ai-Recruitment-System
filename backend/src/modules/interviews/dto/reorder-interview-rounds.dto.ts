import { ApiProperty } from '@nestjs/swagger';
import { ArrayMinSize, IsArray, IsUUID } from 'class-validator';

export class ReorderInterviewRoundsDto {
  @ApiProperty({
    type: [String],
    description: 'Toàn bộ round ID theo thứ tự mới',
  })
  @IsArray()
  @ArrayMinSize(1)
  @IsUUID(undefined, { each: true })
  roundIds!: string[];
}
