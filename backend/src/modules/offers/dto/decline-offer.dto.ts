import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString } from 'class-validator';

export class DeclineOfferDto {
  @ApiPropertyOptional({
    description: 'Category/Reason for declining (e.g., SALARY_NOT_MATCH, ACCEPTED_ANOTHER_OFFER, PERSONAL_REASON)',
    example: 'SALARY_NOT_MATCH',
  })
  @IsOptional()
  @IsString()
  reason?: string;

  @ApiPropertyOptional({
    description: 'Additional personal message or explanation from candidate',
    example: 'Em cảm ơn quý công ty đã quan tâm và đưa ra đề nghị, nhưng hiện tại mức đãi ngộ chưa đạt kỳ vọng của em.',
  })
  @IsOptional()
  @IsString()
  note?: string;
}
