import { Module } from '@nestjs/common';
import { CandidatesService } from './candidates.service';

@Module({
  imports: [],
  controllers: [],
  providers: [CandidatesService],
  exports: [CandidatesService],
})
export class CandidatesModule {}
