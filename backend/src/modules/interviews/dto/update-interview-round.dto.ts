import { PartialType } from '@nestjs/swagger';
import { CreateInterviewRoundDto } from './create-interview-round.dto';

export class UpdateInterviewRoundDto extends PartialType(
  CreateInterviewRoundDto,
) {}
